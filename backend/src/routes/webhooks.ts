import { Hono } from "hono";
import type { Bindings, Variables } from "../types";
import { verifyXenditToken } from "../services/xendit";
import { verifyWebhookSignature } from "../services/paypal";
import { getGuide, markPaid } from "../models/guides";
import { logActivity } from "../models/audit";
import { notifyPaid } from "../services/email";

/**
 * /api/webhooks/*, mounted directly in index.ts with no Access gating: these
 * are called by Xendit's and PayPal's own servers, not a browser, so there
 * is no session to check. The token/signature verification inside each
 * handler is the entire trust boundary; a request that fails it is rejected
 * before anything else runs.
 */
export const webhooks = new Hono<{ Bindings: Bindings; Variables: Variables }>();

webhooks.post("/xendit", async (c) => {
  const token = c.req.header("x-callback-token");
  if (!verifyXenditToken(c.env, token)) return c.json({ error: "Invalid token." }, 401);

  const body = await c.req.json<{
    id: string;
    external_id: string;
    status: string;
    paid_amount?: number;
    payment_method?: string;
    payment_channel?: string;
  }>();

  // Only PAID matters here; EXPIRED and PENDING need no action. Acknowledge
  // with 200 either way so Xendit does not retry a webhook we understood
  // but chose not to act on.
  if (body.status !== "PAID") return c.json({ ok: true });

  const guide = await getGuide(c.env, body.external_id).catch(() => null);
  if (!guide) {
    console.error("Xendit webhook for unknown guide:", body.external_id);
    return c.json({ ok: true });
  }
  if (guide.paid === 1) return c.json({ ok: true }); // idempotent: a retried webhook should not double-log

  await markPaid(c.env, body.external_id, {
    method: `Xendit (${body.payment_channel || body.payment_method || "online"})`,
    amount: Math.round((body.paid_amount ?? 0) * 100),
    currency: "PHP",
    reference: body.id,
  });
  await logActivity(c.env.DB, { actor: "xendit", action: "payment.recorded", guideId: guide.id, clientId: guide.client_id, detail: { via: "webhook" } });
  c.executionCtx.waitUntil(notifyPaid(c.env, guide.property_name, "Xendit"));
  return c.json({ ok: true });
});

webhooks.post("/paypal", async (c) => {
  const rawBody = await c.req.text();
  const verified = await verifyWebhookSignature(
    c.env,
    {
      transmissionId: c.req.header("paypal-transmission-id") || "",
      transmissionTime: c.req.header("paypal-transmission-time") || "",
      certUrl: c.req.header("paypal-cert-url") || "",
      authAlgo: c.req.header("paypal-auth-algo") || "",
      transmissionSig: c.req.header("paypal-transmission-sig") || "",
    },
    rawBody,
  );
  if (!verified) return c.json({ error: "Invalid signature." }, 401);

  const event = JSON.parse(rawBody) as {
    event_type: string;
    resource: { id: string; custom_id?: string; amount?: { value?: string; currency_code?: string } };
  };

  // This is the safety net for a guest closing the browser mid-redirect;
  // the primary path is the capture-on-return call in routes/dashboard.ts,
  // which already marks most PayPal payments paid before this ever fires.
  if (event.event_type !== "PAYMENT.CAPTURE.COMPLETED") return c.json({ ok: true });

  const guideId = event.resource.custom_id;
  if (!guideId) return c.json({ ok: true });

  const guide = await getGuide(c.env, guideId).catch(() => null);
  if (!guide || guide.paid === 1) return c.json({ ok: true });

  await markPaid(c.env, guideId, {
    method: "PayPal",
    amount: Math.round(parseFloat(event.resource.amount?.value ?? "0") * 100),
    currency: event.resource.amount?.currency_code ?? "USD",
    reference: event.resource.id,
  });
  await logActivity(c.env.DB, { actor: "paypal", action: "payment.recorded", guideId: guide.id, clientId: guide.client_id, detail: { via: "webhook" } });
  c.executionCtx.waitUntil(notifyPaid(c.env, guide.property_name, "PayPal"));
  return c.json({ ok: true });
});
