import type { Context, Next } from "hono";
import { one } from "../db";
import type { Bindings, Variables } from "../types";

/**
 * Resolves {client}.villoguides.com to a client row and checks the signed-in
 * email is on that client's staff list (architecture 7.2, 9.2). Every dashboard
 * query is then scoped by the clientId this sets, which is the second half of
 * tenant isolation described in architecture 11.2 (the first half is a separate
 * Access application per client hostname).
 */
export function resolveClient() {
  return async (c: Context<{ Bindings: Bindings; Variables: Variables }>, next: Next) => {
    const hostname = c.req.header("X-Villo-Dev-Host") || new URL(c.req.url).hostname;
    let client = await one<{ id: string; access_aud: string | null }>(
      c.env.DB,
      `SELECT id, access_aud FROM clients WHERE subdomain = ?`,
      hostname.split(".")[0],
    );
    if (!client) {
      // White-label custom domain (architecture 11.3): a client's dashboard
      // on their own domain never matches the subdomain lookup above (its
      // first label means nothing to us), only an exact match against their
      // stored custom_domain, and only when its scope actually covers the
      // dashboard.
      client = await one<{ id: string; access_aud: string | null }>(
        c.env.DB,
        `SELECT id, access_aud FROM clients WHERE custom_domain = ? AND custom_domain_scope IN ('dashboard', 'both')`,
        hostname,
      );
    }
    if (!client) return c.json({ error: "Not found." }, 404);

    const identity = c.get("identity");
    if (client.access_aud && identity.aud && identity.aud !== client.access_aud && !c.env.DEV_IDENTITY) {
      // The JWT was issued for a different Access application than this client's own.
      return c.json({ error: "Not authorized." }, 403);
    }

    const user = await one<{ role: string }>(
      c.env.DB,
      `SELECT role FROM client_users WHERE client_id = ? AND email = ?`,
      client.id,
      identity.email,
    );
    if (!user) return c.json({ error: "Your account is not set up for this dashboard." }, 403);

    c.set("clientId", client.id);
    c.set("clientRole", user.role as "admin" | "support");
    return next();
  };
}

/** Gate for the two admin-only actions in architecture 5.3: removal requests and export. */
export function requireClientRole(role: "admin") {
  return async (c: Context<{ Bindings: Bindings; Variables: Variables }>, next: Next) => {
    if (c.get("clientRole") !== role) {
      return c.json({ error: "Admins only." }, 403);
    }
    return next();
  };
}
