import type { Bindings } from "../types";
import { ApiError } from "../db";

/**
 * PayPal Orders v2 (architecture "Later": online payments). A genuinely
 * separate gateway from Xendit: no PH aggregator bundles PayPal in, so this
 * is its own OAuth flow, its own order lifecycle, its own webhook format.
 * Docs: https://developer.paypal.com/docs/api/orders/v2/
 *
 * The primary confirmation path is the redirect-and-capture flow below, not
 * the webhook: capture() only ever succeeds against a real, buyer-approved
 * order, so a successful capture is authoritative on its own. The webhook
 * handler (routes/payments.ts) exists as a safety net for the case where a
 * guest closes the browser after approving but before the redirect back
 * completes, and does verify the signature before trusting anything, since
 * unlike the redirect flow it is reachable by anyone who finds the URL.
 */

function base(env: Bindings) {
  return env.PAYPAL_API_BASE || "https://api-m.sandbox.paypal.com";
}

async function getAccessToken(env: Bindings): Promise<string> {
  const res = await fetch(`${base(env)}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${btoa(`${env.PAYPAL_CLIENT_ID}:${env.PAYPAL_CLIENT_SECRET}`)}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  if (!res.ok) {
    console.error("PayPal token request failed:", res.status, await res.text());
    throw new ApiError("Could not start the payment. Try again in a moment.", 502);
  }
  const data = await res.json<{ access_token: string }>();
  return data.access_token;
}

export type CreateOrderInput = {
  referenceId: string;
  amountUsd: string; // decimal string, e.g. "15.00", matching the $15 guide price
  description: string;
  returnUrl: string;
  cancelUrl: string;
};

export async function createOrder(env: Bindings, input: CreateOrderInput): Promise<{ id: string; approveUrl: string }> {
  const token = await getAccessToken(env);
  const res = await fetch(`${base(env)}/v2/checkout/orders`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          reference_id: input.referenceId,
          custom_id: input.referenceId,
          description: input.description,
          amount: { currency_code: "USD", value: input.amountUsd },
        },
      ],
      application_context: {
        brand_name: "Villo Guides",
        user_action: "PAY_NOW",
        return_url: input.returnUrl,
        cancel_url: input.cancelUrl,
      },
    }),
  });
  if (!res.ok) {
    console.error("PayPal createOrder failed:", res.status, await res.text());
    throw new ApiError("Could not start the payment. Try again in a moment.", 502);
  }
  const data = await res.json<{ id: string; links: { rel: string; href: string }[] }>();
  const approve = data.links.find((l) => l.rel === "approve");
  if (!approve) throw new ApiError("Could not start the payment. Try again in a moment.", 502);
  return { id: data.id, approveUrl: approve.href };
}

export type CapturedOrder = {
  id: string;
  status: string;
  referenceId: string | null;
  amountUsd: string | null;
};

/** Only ever succeeds if the buyer actually approved this exact order. Safe to treat as authoritative. */
export async function captureOrder(env: Bindings, orderId: string): Promise<CapturedOrder> {
  const token = await getAccessToken(env);
  const res = await fetch(`${base(env)}/v2/checkout/orders/${orderId}/capture`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
  });
  const data = await res.json<{
    id: string;
    status: string;
    purchase_units?: { reference_id?: string; payments?: { captures?: { amount?: { value?: string } }[] } }[];
  }>();
  if (!res.ok || data.status !== "COMPLETED") {
    console.error("PayPal captureOrder did not complete:", res.status, JSON.stringify(data));
    throw new ApiError("This payment could not be confirmed. If you were charged, contact us.", 402);
  }
  const unit = data.purchase_units?.[0];
  return {
    id: data.id,
    status: data.status,
    referenceId: unit?.reference_id ?? null,
    amountUsd: unit?.payments?.captures?.[0]?.amount?.value ?? null,
  };
}

/**
 * Verifies a webhook actually came from PayPal by asking PayPal's own API to
 * check it, rather than computing a signature locally. Requires the exact
 * headers PayPal sent and the raw body text (not a re-serialized object,
 * since re-serializing can change byte-for-byte formatting and break the
 * check).
 */
export async function verifyWebhookSignature(
  env: Bindings,
  headers: { transmissionId: string; transmissionTime: string; certUrl: string; authAlgo: string; transmissionSig: string },
  rawBody: string,
): Promise<boolean> {
  const token = await getAccessToken(env);
  const res = await fetch(`${base(env)}/v1/notifications/verify-webhook-signature`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      auth_algo: headers.authAlgo,
      cert_url: headers.certUrl,
      transmission_id: headers.transmissionId,
      transmission_sig: headers.transmissionSig,
      transmission_time: headers.transmissionTime,
      webhook_id: env.PAYPAL_WEBHOOK_ID,
      webhook_event: JSON.parse(rawBody),
    }),
  });
  if (!res.ok) return false;
  const data = await res.json<{ verification_status: string }>();
  return data.verification_status === "SUCCESS";
}
