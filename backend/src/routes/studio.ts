import { Hono } from "hono";
import { ApiError, one, run } from "../db";
import type { Bindings, Variables } from "../types";
import * as clients from "../models/clients";
import * as clientUsers from "../models/clientUsers";
import * as guides from "../models/guides";
import * as intakeLinks from "../models/intakeLinks";
import * as changeRequests from "../models/changeRequests";
import * as audit from "../models/audit";
import { checkAvailable, RESERVED_SUBDOMAINS } from "../services/subdomains";
import { createClientSchema, updateClientSchema, addClientUserSchema } from "../validators/client";
import { markPaidSchema } from "../validators/payment";
import { presignUpload, putUpload } from "../services/storage";

/**
 * studio.villoguides.com/api/studio/* (architecture 9.1). Mounted in index.ts
 * behind verifyAccess() and requireStudioOwner(), so every handler here already
 * knows the request is you.
 */
export const studio = new Hono<{ Bindings: Bindings; Variables: Variables }>();

studio.get("/me", (c) => c.json({ email: c.get("identity").email }));

studio.get("/queue", async (c) => c.json(await guides.getQueue(c.env.DB)));
studio.get("/stats", async (c) => c.json(await guides.getStats(c.env.DB)));

studio.get("/guides", async (c) => {
  const { client: clientId, status, q } = c.req.query();
  return c.json(await guides.listGuides(c.env.DB, { clientId, status, q }));
});

studio.post("/guides", async (c) => {
  const body = await c.req.json<{ clientId: string; propertyName: string; city?: string; ownerName?: string }>();
  return c.json(await guides.createGuide(c.env.DB, body));
});

studio.get("/guides/:id", async (c) => c.json(await guides.getGuide(c.env.DB, c.req.param("id"))));

studio.put("/guides/:id/draft", async (c) => {
  const { draft } = await c.req.json<{ draft: unknown }>();
  return c.json(await guides.saveDraft(c.env.DB, c.req.param("id"), draft));
});

studio.patch("/guides/:id", async (c) => {
  const body = await c.req.json<{ city?: string; owner_name?: string }>();
  return c.json(await guides.updateGuideMeta(c.env.DB, c.req.param("id"), body));
});

studio.post("/guides/:id/publish", async (c) => c.json(await guides.publishGuide(c.env.DB, c.req.param("id"))));
studio.post("/guides/:id/unpublish", async (c) => c.json(await guides.unpublishGuide(c.env.DB, c.req.param("id"))));
studio.post("/guides/:id/suspend", async (c) => c.json(await guides.suspendGuide(c.env.DB, c.req.param("id"))));

studio.post("/guides/:id/rename", async (c) => {
  const { slug } = await c.req.json<{ slug: string }>();
  return c.json(await guides.renameGuide(c.env.DB, c.req.param("id"), slug));
});

studio.get("/guides/:id/versions", async (c) => c.json(await guides.listVersions(c.env.DB, c.req.param("id"))));
studio.post("/guides/:id/restore/:version", async (c) =>
  c.json(await guides.restoreVersion(c.env.DB, c.req.param("id"), Number(c.req.param("version")))),
);

studio.post("/guides/:id/payment", async (c) => {
  const body = markPaidSchema.parse(await c.req.json());
  return c.json(await guides.markPaid(c.env.DB, c.req.param("id"), body));
});
studio.delete("/guides/:id/payment", async (c) => c.json(await guides.markUnpaid(c.env.DB, c.req.param("id"))));

studio.get("/subdomains/:name/available", async (c) => {
  const { guideId, clientId } = c.req.query() as { guideId?: string; clientId?: string };
  return c.json(await checkAvailable(c.env.DB, c.req.param("name"), { guideId, clientId }));
});

studio.get("/intake-links", async (c) => c.json(await intakeLinks.listIntakeLinks(c.env.DB)));

studio.post("/intake-links", async (c) => {
  const body = await c.req.json<{ guideId?: string; clientId?: string; propertyName?: string }>();
  const settings = await one<{ intake_link_days: number }>(c.env.DB, `SELECT intake_link_days FROM settings WHERE id = 1`);
  return c.json(await intakeLinks.createIntakeLink(c.env.DB, { ...body, expiryDays: settings?.intake_link_days ?? 30 }));
});

studio.post("/intake-links/:token/expire", async (c) => c.json(await intakeLinks.expireIntakeLink(c.env.DB, c.req.param("token"))));

studio.get("/clients", async (c) => c.json(await clients.listClients(c.env.DB)));

studio.post("/clients", async (c) => {
  const body = createClientSchema.parse(await c.req.json());
  const avail = await checkAvailable(c.env.DB, body.subdomain);
  if (!avail.available) throw new ApiError(avail.reason ?? "That name is not available.");
  return c.json(await clients.createClient(c.env.DB, body));
});

studio.put("/clients/:id", async (c) => {
  const body = updateClientSchema.parse(await c.req.json());
  if (body.subdomain) {
    const avail = await checkAvailable(c.env.DB, body.subdomain, { clientId: c.req.param("id") });
    if (!avail.available) throw new ApiError(avail.reason ?? "That name is not available.");
  }
  return c.json(await clients.updateClient(c.env.DB, c.req.param("id"), body));
});

studio.post("/clients/:id/users", async (c) => {
  const body = addClientUserSchema.parse(await c.req.json());
  return c.json(await clientUsers.addClientUser(c.env.DB, c.req.param("id"), body.email, body.role));
});

studio.put("/client-users/:userId", async (c) => {
  const { role } = await c.req.json<{ role: "admin" | "support" }>();
  return c.json(await clientUsers.updateClientUser(c.env.DB, c.req.param("userId"), role));
});

studio.delete("/client-users/:userId", async (c) => {
  await clientUsers.removeClientUser(c.env.DB, c.req.param("userId"));
  return c.json({ ok: true });
});

studio.get("/change-requests", async (c) => c.json(await changeRequests.listAllChangeRequests(c.env.DB)));

studio.patch("/change-requests/:id", async (c) => {
  const { status } = await c.req.json<{ status: "done" | "declined" }>();
  return c.json(await changeRequests.updateChangeRequest(c.env.DB, c.req.param("id"), status));
});

studio.get("/activity", async (c) => c.json(await audit.listActivity(c.env.DB)));

studio.get("/settings", async (c) => {
  const row = await one(c.env.DB, `SELECT * FROM settings WHERE id = 1`);
  const settings = row as { extra_reserved: string } & Record<string, unknown>;
  return c.json({ ...settings, extra_reserved: JSON.parse(settings.extra_reserved || "[]"), reserved: RESERVED_SUBDOMAINS });
});

studio.put("/settings", async (c) => {
  const body = await c.req.json<Record<string, unknown>>();
  const fields = ["default_theme", "notification_email", "intake_link_days"].filter((k) => body[k] !== undefined);
  if (body.extra_reserved !== undefined) {
    await run(c.env.DB, `UPDATE settings SET extra_reserved = ? WHERE id = 1`, JSON.stringify(body.extra_reserved));
  }
  for (const f of fields) {
    await run(c.env.DB, `UPDATE settings SET ${f} = ? WHERE id = 1`, body[f] as string | number);
  }
  await audit.logActivity(c.env.DB, { actor: "studio", action: "settings.updated", detail: body });
  const row = await one(c.env.DB, `SELECT * FROM settings WHERE id = 1`);
  const settings = row as { extra_reserved: string } & Record<string, unknown>;
  return c.json({ ...settings, extra_reserved: JSON.parse(settings.extra_reserved || "[]") });
});

studio.post("/uploads/presign", async (c) => {
  const { contentType, size } = await c.req.json<{ contentType: string; size: number }>();
  const { uploadUrl, key } = await presignUpload(c.env, { contentType, size, area: "guides" });
  // The public serving route only needs the filename; the R2 prefix is an
  // implementation detail of where it lives before/after publish.
  return c.json({ uploadUrl, url: `/photos/${key.split("/").pop()}` });
});

/**
 * The other half of "presigned" upload (see services/storage.ts): the browser
 * PUTs the already-compressed photo straight here. This route sits under
 * /api/studio, so it inherits verifyAccess() and requireStudioOwner() from
 * where studio is mounted in index.ts.
 */
studio.put("/uploads/put/:key{.+}", async (c) => {
  const key = c.req.param("key");
  const contentType = c.req.header("Content-Type") || "application/octet-stream";
  await putUpload(c.env, key, await c.req.arrayBuffer(), contentType);
  return c.json({ ok: true });
});
