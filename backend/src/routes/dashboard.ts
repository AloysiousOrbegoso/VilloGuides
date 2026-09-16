import { Hono } from "hono";
import type { Bindings, Variables } from "../types";
import { ApiError, one } from "../db";
import { getGuide, listGuides, createGuide, markPaid } from "../models/guides";
import * as notes from "../models/notes";
import * as changeRequests from "../models/changeRequests";
import { isDashboardEligible } from "../models/clients";
import { requireClientRole } from "../middleware/resolveClient";
import { buildClientExport } from "../services/clientExport";
import { createInvoice } from "../services/xendit";
import { createOrder, captureOrder } from "../services/paypal";

/**
 * {client}.villoguides.com/api/dashboard/* (architecture 9.2). Mounted behind
 * verifyAccess() and resolveClient() in index.ts, so c.get("clientId") and
 * c.get("clientRole") are already scoped to the signed-in client's staff member.
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

/**
 * Architecture 5.3: "Open guide as a guest sees it." Reads the actual
 * published version's content, not the current draft, so a client never
 * sees edits the studio has made but not yet republished.
 */
dashboard.get("/guides/:id", async (c) => {
  const g = await getGuide(c.env, c.req.param("id"));
  if (g.client_id !== c.get("clientId") || g.status !== "published" || !g.published_version) {
    return c.json({ error: "Guide not found." }, 404);
  }
  const version = await one<{ content: string }>(
    c.env.DB,
    `SELECT content FROM guide_versions WHERE guide_id = ? AND version = ?`,
    g.id, g.published_version,
  );
  const client = await one<{ name: string }>(c.env.DB, `SELECT name FROM clients WHERE id = ?`, g.client_id);
  return c.json({
    id: g.id,
    slug: g.slug,
    city: g.city,
    owner_name: g.owner_name,
    published_at: g.published_at,
    content: JSON.parse(version?.content ?? "{}"),
    client_name: client?.name ?? "",
  });
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

/** Architecture 5.3 and 9.2: admin only. requireClientRole rejects anyone else with 403 before this ever runs. */
dashboard.get("/export", requireClientRole("admin"), async (c) => {
  const clientId = c.get("clientId");
  const client = await one<{ subdomain: string }>(c.env.DB, `SELECT subdomain FROM clients WHERE id = ?`, clientId);
  const zip = await buildClientExport(c.env, clientId);
  return new Response(zip, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${client?.subdomain ?? "export"}-guides.zip"`,
    },
  });
});

/*
  Online payments ("Later" list). Architecture 5.3's "Request a new
  property (shows the payment 'coming soon' page in v1)" is the one spot
  this was always meant to slot into. A draft guide is created up front so
  both gateways have something to reference; it only ever gets marked paid
  once the gateway itself confirms the money actually moved, never from
  anything the browser alone claims.
*/

const GUIDE_PRICE_PHP = 850; // architecture 2: $15, approx. ₱850
const GUIDE_PRICE_USD = "15.00";

dashboard.post("/new-property/checkout", async (c) => {
  const { provider, propertyName, city } = await c.req.json<{ provider: "xendit" | "paypal"; propertyName: string; city?: string }>();
  if (!propertyName?.trim()) throw new ApiError("Add the property name.");

  const clientId = c.get("clientId");
  const guide = await createGuide(c.env, { clientId, propertyName, city, ownerName: c.get("identity").email });

  // Same-origin as this very request, so this works correctly on the real
  // subdomain in production without hardcoding it, and would also work
  // through a tunnel in local testing (Xendit and PayPal both need a
  // publicly reachable HTTPS URL to redirect back to; plain localhost is
  // not reachable from either gateway's own servers).
  const origin = new URL(c.req.url).origin;
  const complete = (extra = "") => `${origin}/requests/new-property/complete?provider=${provider}&guide=${guide.id}${extra}`;

  if (provider === "xendit") {
    const invoice = await createInvoice(c.env, {
      externalId: guide.id,
      amount: GUIDE_PRICE_PHP,
      description: `Villo Guides: ${propertyName}`,
      successRedirectUrl: complete(),
      failureRedirectUrl: complete("&failed=1"),
    });
    return c.json({ redirectUrl: invoice.invoice_url });
  }

  if (provider === "paypal") {
    const order = await createOrder(c.env, {
      referenceId: guide.id,
      amountUsd: GUIDE_PRICE_USD,
      description: `Villo Guides: ${propertyName}`,
      returnUrl: complete(),
      cancelUrl: complete("&failed=1"),
    });
    return c.json({ redirectUrl: order.approveUrl });
  }

  throw new ApiError("Unknown payment method.");
});

/** Polled by the "complete" page while waiting for Xendit's webhook, which can lag the redirect by a few seconds. */
dashboard.get("/new-property/status/:guideId", async (c) => {
  const g = await getGuide(c.env, c.req.param("guideId"));
  if (g.client_id !== c.get("clientId")) return c.json({ error: "Not found." }, 404);
  return c.json({ paid: g.paid === 1, status: g.status, property_name: g.property_name });
});

/**
 * PayPal's flow authorizes on approval and only actually moves money once
 * captured, so the "complete" page calls this itself rather than waiting on
 * a webhook. Safe to call more than once: already-paid short-circuits.
 */
dashboard.post("/new-property/paypal/capture", async (c) => {
  const { guideId, orderId } = await c.req.json<{ guideId: string; orderId: string }>();
  const g = await getGuide(c.env, guideId);
  if (g.client_id !== c.get("clientId")) return c.json({ error: "Not found." }, 404);
  if (g.paid === 1) return c.json({ paid: true });

  const captured = await captureOrder(c.env, orderId);
  if (captured.referenceId !== guideId) throw new ApiError("Payment reference did not match.", 400);

  await markPaid(c.env, guideId, {
    method: "PayPal",
    amount: Math.round(parseFloat(captured.amountUsd ?? GUIDE_PRICE_USD) * 100),
    currency: "USD",
    reference: captured.id,
  });
  return c.json({ paid: true });
});
