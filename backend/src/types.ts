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
