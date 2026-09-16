import type { Context, Next } from "hono";
import type { Bindings, Variables } from "../types";

/**
 * The studio's own application-level check (architecture 5.2, 7.2): even though
 * Cloudflare Access already restricts studio.villoguides.com to one email, the
 * Worker checks it again so a misconfigured Access policy can never widen who
 * can act as the studio owner.
 */
export function requireStudioOwner() {
  return async (c: Context<{ Bindings: Bindings; Variables: Variables }>, next: Next) => {
    const identity = c.get("identity");
    if (!identity || identity.email !== c.env.STUDIO_OWNER_EMAIL.toLowerCase()) {
      return c.json({ error: "Not authorized." }, 403);
    }
    return next();
  };
}
