import type { D1Database } from "@cloudflare/workers-types";
import { ApiError, one, run } from "../db";
import type { Bindings } from "../types";
import * as cf from "../services/cloudflareSaas";
import { logActivity } from "./audit";

/**
 * White-label custom domains (architecture 11.3). Orchestrates the
 * Cloudflare for SaaS calls in services/cloudflareSaas.ts alongside the
 * client row, the same pattern models/clients.ts's syncClientAccess uses
 * for the Access automation: the Worker's own state (here, the client's
 * custom_domain columns) stays the source of truth, and Cloudflare is
 * called to keep it in sync.
 */

type ClientDomainRow = {
  id: string;
  name: string;
  custom_domain: string | null;
  custom_domain_scope: "dashboard" | "guides" | "both" | null;
  custom_domain_dashboard_hostname_id: string | null;
  custom_domain_guides_hostname_id: string | null;
};

const DOMAIN_COLUMNS = "id, name, custom_domain, custom_domain_scope, custom_domain_dashboard_hostname_id, custom_domain_guides_hostname_id";

// A plain domain or subdomain, no scheme, no path, no wildcard (the wildcard
// for guides is added here, never typed in by the client).
const DOMAIN_PATTERN = /^(?!-)[a-z0-9-]{1,63}(?<!-)(\.(?!-)[a-z0-9-]{1,63}(?<!-))+$/;

async function getClientRow(db: D1Database, clientId: string): Promise<ClientDomainRow> {
  const client = await one<ClientDomainRow>(db, `SELECT ${DOMAIN_COLUMNS} FROM clients WHERE id = ?`, clientId);
  if (!client) throw new ApiError("Client not found.", 404);
  return client;
}

function requireConfigured(env: Bindings) {
  if (!cf.configured(env)) {
    throw new ApiError(
      "Cloudflare custom domains are not configured on this Worker yet. Set CF_API_TOKEN and CF_ZONE_ID, then try again.",
    );
  }
}

/**
 * Registers a client's domain with Cloudflare and stores the result.
 * "both" scope registers two separate custom hostnames, an apex match for
 * the dashboard and a wildcard for guides, since Cloudflare custom
 * hostnames are matched exactly (no combined apex+wildcard registration).
 */
export async function setCustomDomain(
  env: Bindings,
  clientId: string,
  input: { domain: string; scope: "dashboard" | "guides" | "both" },
) {
  requireConfigured(env);
  const db = env.DB;
  await getClientRow(db, clientId);

  const domain = input.domain.trim().toLowerCase();
  if (!DOMAIN_PATTERN.test(domain)) throw new ApiError("Enter a valid domain, like acme-rentals.com.");

  const taken = await one(db, `SELECT id FROM clients WHERE custom_domain = ? AND id != ?`, domain, clientId);
  if (taken) throw new ApiError("Another client is already using this domain.");

  const wantsDashboard = input.scope === "dashboard" || input.scope === "both";
  const wantsGuides = input.scope === "guides" || input.scope === "both";

  const dashboardResult = wantsDashboard ? await cf.createCustomHostname(env, { hostname: domain }) : null;
  const guidesResult = wantsGuides ? await cf.createCustomHostname(env, { hostname: `*.${domain}` }) : null;

  await run(
    db,
    `UPDATE clients SET custom_domain = ?, custom_domain_scope = ?, custom_domain_dashboard_hostname_id = ?, custom_domain_guides_hostname_id = ? WHERE id = ?`,
    domain, input.scope, dashboardResult?.id ?? null, guidesResult?.id ?? null, clientId,
  );
  await logActivity(db, { actor: "studio", action: "client.custom_domain_set", clientId, detail: { domain, scope: input.scope } });

  const cnameTarget = await cf.getFallbackOriginTarget(env);
  return { domain, scope: input.scope, dashboard: dashboardResult, guides: guidesResult, cnameTarget };
}

/** Polls whichever Cloudflare hostname(s) this client has registered. */
export async function getCustomDomainStatus(env: Bindings, clientId: string) {
  requireConfigured(env);
  const client = await getClientRow(env.DB, clientId);
  if (!client.custom_domain) throw new ApiError("This client has no custom domain set.");

  const dashboard = client.custom_domain_dashboard_hostname_id
    ? await cf.getCustomHostnameStatus(env, client.custom_domain_dashboard_hostname_id)
    : null;
  const guides = client.custom_domain_guides_hostname_id
    ? await cf.getCustomHostnameStatus(env, client.custom_domain_guides_hostname_id)
    : null;
  const cnameTarget = await cf.getFallbackOriginTarget(env);

  return { domain: client.custom_domain, scope: client.custom_domain_scope, dashboard, guides, cnameTarget };
}

/** For when a client's white-label add-on lapses: guides and the dashboard fall back to {x}.villoguides.com. */
export async function removeCustomDomain(env: Bindings, clientId: string) {
  requireConfigured(env);
  const db = env.DB;
  const client = await getClientRow(db, clientId);
  if (!client.custom_domain) throw new ApiError("This client has no custom domain set.");

  if (client.custom_domain_dashboard_hostname_id) await cf.deleteCustomHostname(env, client.custom_domain_dashboard_hostname_id);
  if (client.custom_domain_guides_hostname_id) await cf.deleteCustomHostname(env, client.custom_domain_guides_hostname_id);

  await run(
    db,
    `UPDATE clients SET custom_domain = NULL, custom_domain_scope = NULL, custom_domain_dashboard_hostname_id = NULL, custom_domain_guides_hostname_id = NULL WHERE id = ?`,
    clientId,
  );
  await logActivity(db, { actor: "studio", action: "client.custom_domain_removed", clientId, detail: { domain: client.custom_domain } });
  return { ok: true };
}
