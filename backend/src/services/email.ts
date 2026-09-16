import type { Bindings } from "../types";
import { one } from "../db";

/**
 * Sends notifications through Resend (architecture 6.2, 6.4). Optional at
 * launch by design: every call site here treats a missing API key or a
 * missing notification address as a silent no-op, not an error, since the
 * architecture explicitly marks this as something to configure whenever
 * ready, not something the app should depend on to function.
 *
 * Deliberately never awaited by the route that triggers it (see
 * routes/intake.ts, routes/dashboard.ts, routes/webhooks.ts): a slow or
 * failed email must never delay or break the actual feature it's
 * attached to. Each caller wraps this in `c.executionCtx.waitUntil(...)`
 * so it finishes in the background after the response has already gone
 * out to the guest or client.
 */
export async function sendNotification(env: Bindings, subject: string, body: string): Promise<void> {
  if (!env.RESEND_API_KEY) return;

  const settings = await one<{ notification_email: string }>(env.DB, `SELECT notification_email FROM settings WHERE id = 1`);
  const to = settings?.notification_email?.trim();
  if (!to) return;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        // Kept apart from hello@ (architecture 6.4): this address needs its
        // own SPF/DKIM setup with Resend before it can send as the domain,
        // separate from hello@'s Gmail-based forwarding and "send mail as."
        from: "Villo Guides <notifications@villoguides.com>",
        to,
        subject,
        text: body,
      }),
    });
    if (!res.ok) console.error("Notification email failed:", res.status, await res.text());
  } catch (err) {
    console.error("Notification email failed:", err);
  }
}

/** Shared by both payment webhooks and the PayPal capture-on-return route, so the message stays consistent regardless of which path actually confirmed the payment. */
export async function notifyPaid(env: Bindings, propertyName: string, method: string): Promise<void> {
  await sendNotification(
    env,
    `Payment received: ${propertyName}`,
    `${propertyName} was just paid for via ${method}. It's in "All guides" as a paid draft, ready for an intake link.`,
  );
}
