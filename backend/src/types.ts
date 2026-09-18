import type { D1Database, R2Bucket } from "@cloudflare/workers-types";

/**
 * Worker bindings, set in wrangler.toml (production) or .dev.vars (development).
 * See architecture sections 6.2 and 6.3.
 */
export type Bindings = {
  DB: D1Database;
  PHOTOS: R2Bucket;
  ASSETS: Fetcher;

  ROOT_DOMAIN: string;
  STUDIO_OWNER_EMAIL: string;

  /**
   * Two budgets, not one: intake autosave, photo uploads, and studio
   * subdomain checks are all frequent-but-legitimate traffic from one
   * visitor, so RL_STANDARD is generous. The report endpoint should be rare
   * from any one visitor, so RL_REPORT is deliberately tight (architecture
   * 12: "Rate limits on intake autosave, uploads, subdomain checks, and
   * reports"). Declared directly in wrangler.toml; no separate Cloudflare
   * resource to create.
   */
  RL_STANDARD: RateLimit;
  RL_REPORT: RateLimit;

  /**
   * The private-block unlock endpoint (architecture 12's planned PIN
   * protection for door codes). Its own budget, tighter than either of the
   * two above: a 4 to 6 digit PIN is brute-forceable, and RL_STANDARD's 30
   * requests per 10 seconds would let every 4-digit PIN (10,000
   * possibilities) be exhausted in under an hour.
   */
  RL_UNLOCK: RateLimit;

  /**
   * Email (architecture 6.2, 6.4). Kept on its own address,
   * notifications@villoguides.com, never hello@, so a deliverability
   * problem here never affects mail people actually wrote to reach a
   * human. Optional: every call site treats an unset key as a silent
   * no-op, matching the architecture's "optional at launch."
   */
  RESEND_API_KEY?: string;

  /**
   * Online payments ("Later" list). Xendit covers GCash, Maya, and bank
   * transfer (InstaPay, which is how a guest paying from any PH bank,
   * SeaBank included, reaches the same checkout); PayPal is a separate
   * gateway with its own credentials and its own webhook. All five are
   * secrets (`wrangler secret put NAME`), never plain [vars], since they
   * grant the ability to move money or spoof a paid confirmation.
   */
  XENDIT_SECRET_KEY: string;
  XENDIT_WEBHOOK_TOKEN: string;
  PAYPAL_CLIENT_ID: string;
  PAYPAL_CLIENT_SECRET: string;
  PAYPAL_WEBHOOK_ID: string;
  /** https://api-m.sandbox.paypal.com while testing, https://api-m.paypal.com once live. Defaults to sandbox if unset. */
  PAYPAL_API_BASE?: string;
  /** Override point for local testing against a stub server standing in for Xendit; unset in every real environment. */
  XENDIT_API_BASE?: string;

  /**
   * Set only in .dev.vars for local `wrangler dev`. When present, requests are
   * treated as if this email had passed Cloudflare Access, so the studio and
   * dashboards can be exercised without a real Access session. Architecture 7.2
   * and 14.1: "Never set it in production."
   */
  DEV_IDENTITY?: string;

  /**
   * Automated Access application creation (architecture 7.2's "client
   * onboarding automation"). Optional: unset means the manual flow (create
   * the app by hand, paste its AUD into the studio's Clients screen) keeps
   * working exactly as before. The token needs Account > Access: Apps and
   * Policies > Edit.
   */
  CF_ACCOUNT_ID?: string;
  CF_API_TOKEN?: string;

  /**
   * White-label custom domains (architecture 11.3, services/cloudflareSaas.ts).
   * Custom hostnames are a zone-scoped resource (/zones/{zone_id}/custom_hostnames),
   * not account-scoped like the Access automation above, so this is the
   * villoguides.com zone's id, not CF_ACCOUNT_ID. CF_API_TOKEN is shared with
   * the Access automation above if that same token also has Zone > SSL and
   * Certificates > Edit; otherwise use a separate token. Optional: unset
   * means every function in cloudflareSaas.ts is a no-op, same pattern as
   * CF_ACCOUNT_ID/CF_API_TOKEN above.
   */
  CF_ZONE_ID?: string;
};

/** What verifyAccess attaches to the request context after checking the JWT. */
export type AccessIdentity = {
  email: string;
  aud: string;
};

export type Variables = {
  identity: AccessIdentity;
  clientId: string;
  clientRole: "admin" | "support";
};
