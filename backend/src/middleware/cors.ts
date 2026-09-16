import { cors } from "hono/cors";
import type { Bindings } from "../types";

/**
 * Same-origin in production almost always: the API and the built frontend
 * share a hostname on the one Worker (architecture 6.3), and studio,
 * dashboards, and guides only ever call their own hostname's API, never
 * another one's. The only genuinely cross-origin caller that should ever
 * exist is local development, where Vite (port 5173) talks to `wrangler
 * dev` (port 8787) on a different origin.
 *
 * Reflecting back whatever Origin header a request happened to send
 * (`origin ?? "*"`, the previous behaviour) combined with credentials:true
 * meant any website on the internet could make an authenticated request
 * here using a visitor's existing session. This checks the origin against
 * an actual allowlist instead.
 */
const LOCAL_DEV_ORIGIN = /^https?:\/\/(localhost|127\.0\.0\.1):\d+$/;

function isAllowedOrigin(origin: string, rootDomain: string): boolean {
  if (LOCAL_DEV_ORIGIN.test(origin)) return true;
  const escaped = rootDomain.replace(/\./g, "\\.");
  return new RegExp(`^https://([a-z0-9-]+\\.)?${escaped}$`).test(origin);
}

export const corsMiddleware = cors({
  origin: (origin, c) => {
    if (!origin) return undefined;
    return isAllowedOrigin(origin, (c.env as Bindings).ROOT_DOMAIN) ? origin : undefined;
  },
  credentials: true,
});
