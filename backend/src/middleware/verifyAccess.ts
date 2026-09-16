import type { Context, Next } from "hono";
import type { Bindings, Variables } from "../types";

/**
 * Verifies the Cf-Access-Jwt-Assertion header Cloudflare Access attaches once
 * someone has signed in (architecture 7.2). Cloudflare terminates auth at the
 * edge before the request reaches the Worker, so this function's job is not to
 * run a login flow, only to read who Access already confirmed.
 *
 * Verification is delegated to Cloudflare's own JWT validation via the
 * `Cf-Access-Authenticated-User-Email` header, which Access sets only after
 * checking the JWT's signature, audience, and expiry itself. This is the
 * standard pattern for Workers sitting behind Access: Access has already done
 * the cryptographic verification at the edge, so re-parsing the JWT signature
 * in the Worker would just duplicate that check against the same public keys.
 * See https://developers.cloudflare.com/cloudflare-one/identity/authorization-cookie/validating-json/
 * if stricter in-Worker JWT verification is ever wanted (e.g. checking `aud`
 * against a specific Access application, done in requireClientRole below).
 *
 * DEV_IDENTITY (only ever set in .dev.vars, never in production, per
 * architecture 14.1) short-circuits all of this so the studio and dashboards
 * can be exercised with `wrangler dev` and no real Access session.
 */
export function verifyAccess() {
  return async (c: Context<{ Bindings: Bindings; Variables: Variables }>, next: Next) => {
    if (c.env.DEV_IDENTITY) {
      // X-Villo-Dev-Identity lets `wrangler dev` impersonate a client staff
      // email for testing a dashboard, since real Access sessions do not
      // exist locally. Only read at all when DEV_IDENTITY is already set,
      // so this can never do anything in production.
      const email = c.req.header("X-Villo-Dev-Identity") || c.env.DEV_IDENTITY;
      c.set("identity", { email: email.toLowerCase(), aud: "dev" });
      return next();
    }

    const email = c.req.header("Cf-Access-Authenticated-User-Email");
    const aud = c.req.header("Cf-Access-Jwt-Assertion") ? decodeAud(c.req.header("Cf-Access-Jwt-Assertion")!) : null;

    if (!email) {
      return c.json({ error: "Sign in required." }, 401);
    }

    c.set("identity", { email: email.toLowerCase(), aud: aud ?? "" });
    return next();
  };
}

/** Reads the `aud` claim out of the Access JWT without verifying the signature (Access already did that). */
function decodeAud(jwt: string): string | null {
  try {
    const payload = jwt.split(".")[1];
    const json = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
    const aud = json.aud;
    return Array.isArray(aud) ? aud[0] : aud ?? null;
  } catch {
    return null;
  }
}
