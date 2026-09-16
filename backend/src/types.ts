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

  CF_ACCOUNT_ID?: string;
  CF_API_TOKEN?: string;
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
