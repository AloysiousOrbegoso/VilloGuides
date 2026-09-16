import type { Bindings } from "../types";
import { ApiError } from "../db";

/**
 * Xendit Invoice API (architecture "Later": online payments). Chosen over
 * PayMongo specifically because it documents InstaPay/bank-transfer support
 * directly alongside GCash and Maya, so a guest paying from any PH bank
 * (SeaBank included) reaches the same hosted checkout page as GCash and
 * Maya, no separate integration per bank. PayPal is a genuinely separate
 * gateway (see paypal.ts); nothing bundles it with Xendit.
 *
 * The Invoice API returns a hosted checkout URL: the browser is redirected
 * there directly, so this service never touches card or wallet details
 * itself. Docs: https://developer.xendit.co/api-reference/#create-invoice
 */

const BASE = "https://api.xendit.co";

function base(env: Bindings) {
  // Override point for local testing against a stub server standing in for
  // Xendit; unset in every real environment, where the real API is used.
  return env.XENDIT_API_BASE || BASE;
}

export type CreateInvoiceInput = {
  externalId: string;
  amount: number; // whole PHP units, e.g. 850 for ₱850, not centavos
  description: string;
  payerEmail?: string;
  successRedirectUrl: string;
  failureRedirectUrl: string;
};

export type XenditInvoice = {
  id: string;
  external_id: string;
  status: string;
  invoice_url: string;
  amount: number;
};

function authHeader(env: Bindings) {
  // Xendit uses HTTP Basic Auth with the secret key as the username and an
  // empty password, not a Bearer token.
  return `Basic ${btoa(`${env.XENDIT_SECRET_KEY}:`)}`;
}

export async function createInvoice(env: Bindings, input: CreateInvoiceInput): Promise<XenditInvoice> {
  const res = await fetch(`${base(env)}/v2/invoices`, {
    method: "POST",
    headers: { Authorization: authHeader(env), "Content-Type": "application/json" },
    body: JSON.stringify({
      external_id: input.externalId,
      amount: input.amount,
      currency: "PHP",
      description: input.description,
      payer_email: input.payerEmail,
      // Limits the hosted page to the three local rails this project
      // actually wants shown; Xendit would otherwise also offer cards,
      // retail outlets, and pay-later options.
      payment_methods: ["GCASH", "PAYMAYA", "BANK_TRANSFER"],
      success_redirect_url: input.successRedirectUrl,
      failure_redirect_url: input.failureRedirectUrl,
      invoice_duration: 3600, // one hour; a stale checkout should not linger
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    console.error("Xendit createInvoice failed:", res.status, body);
    throw new ApiError("Could not start the payment. Try again in a moment.", 502);
  }
  return res.json();
}

/** Architecture-standard check for this gateway: a shared token in a header, not a signature. */
export function verifyXenditToken(env: Bindings, headerToken: string | undefined | null): boolean {
  return !!headerToken && !!env.XENDIT_WEBHOOK_TOKEN && headerToken === env.XENDIT_WEBHOOK_TOKEN;
}
