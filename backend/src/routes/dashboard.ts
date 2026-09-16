import { Hono } from "hono";
import type { Bindings, Variables } from "../types";
import { getGuide, listGuides } from "../models/guides";
import * as notes from "../models/notes";
import * as changeRequests from "../models/changeRequests";
import { isDashboardEligible } from "../models/clients";
import { one } from "../db";

/**
 * {client}.villoguides.com/api/dashboard/* (architecture 9.2). Mounted behind
 * verifyAccess() and resolveClient() in index.ts, so c.get("clientId") and
 * c.get("clientRole") are already scoped to the signed-in client's staff member.
 * Phase 4 fills this in fully; the read paths below are enough for Phase 2's
 * studio-first pass to exercise end to end.
 */
export const dashboard = new Hono<{ Bindings: Bindings; Variables: Variables }>();

dashboard.get("/me", async (c) => {
  const clientId = c.get("clientId");
  const client = await one<{ id: string; name: string; subdomain: string; type: string }>(
    c.env.DB,
    `SELECT id, name, subdomain, type FROM clients WHERE id = ?`,
    clientId,
  );
  return c.json({
    user: { email: c.get("identity").email, role: c.get("clientRole") },
    client,
    eligible: await isDashboardEligible(c.env.DB, clientId),
  });
});

dashboard.get("/guides", async (c) => {
  const rows = await listGuides(c.env, { clientId: c.get("clientId"), status: "published" });
  return c.json(
    rows.map((g) => ({
      id: g.id,
      slug: g.slug,
      property_name: g.property_name,
      city: g.city,
      owner_name: g.owner_name,
      published_at: g.published_at,
    })),
  );
});

dashboard.get("/guides/:id", async (c) => {
  const g = await getGuide(c.env, c.req.param("id"));
  if (g.client_id !== c.get("clientId") || g.status !== "published") return c.json({ error: "Guide not found." }, 404);
  const client = await one<{ name: string }>(c.env.DB, `SELECT name FROM clients WHERE id = ?`, g.client_id);
  return c.json({ id: g.id, slug: g.slug, city: g.city, owner_name: g.owner_name, published_at: g.published_at, content: g.draft, client_name: client?.name ?? "" });
});

dashboard.get("/guides/:id/notes", async (c) => c.json(await notes.listNotes(c.env.DB, c.req.param("id"))));
dashboard.post("/guides/:id/notes", async (c) => {
  const { body } = await c.req.json<{ body: string }>();
  return c.json(await notes.addNote(c.env.DB, c.req.param("id"), body, c.get("identity").email));
});

dashboard.get("/change-requests", async (c) => c.json(await changeRequests.listClientChangeRequests(c.env.DB, c.get("clientId"))));

dashboard.post("/change-requests", async (c) => {
  const body = await c.req.json<{ guideId: string | null; type: "edit" | "removal"; body: string }>();
  if (body.type === "removal" && c.get("clientRole") !== "admin") return c.json({ error: "Admins only." }, 403);
  return c.json(
    await changeRequests.createChangeRequest(c.env.DB, {
      clientId: c.get("clientId"),
      guideId: body.guideId,
      type: body.type,
      body: body.body,
      requestedBy: c.get("identity").email,
    }),
  );
});

// TODO (Phase 4): GET /export, a ZIP of a client's published content and photos.
