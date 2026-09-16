import type { Bindings } from "../types";

/**
 * Automates the one manual step the architecture always described as
 * "manual first, then automated": creating a client's Cloudflare Access
 * application and policy, currently done by hand in the dashboard (Phase 2
 * deploy guide, step 7, still applies to the studio's own app; this is only
 * for per-client dashboards).
 *
 * Kept in sync, not just created once: every time a client's staff list
 * changes (models/clientUsers.ts), the policy's Include list is updated to
 * match. Previously, removing someone from client_users blocked them only
 * at the application layer (resolveClient's own check); they would still
 * see Access's own sign-in screen first. Syncing the policy closes that
 * gap, since the app layer is no longer the only thing standing between an
 * ex-staff member and the login prompt.
 *
 * A real, documented risk worth knowing about: Cloudflare deprecated part
 * of this exact API (`self_hosted_domains`, replaced by `destinations`)
 * with a cutoff of November 21, 2025, already in the past as of writing.
 * This deliberately avoids both fields and uses only the top-level
 * `domain` field, which every source checked still documents as required
 * and unaffected by that change, precisely to sidestep API churn in an
 * area with recent breaking changes. If this ever starts failing, checking
 * Cloudflare's current Access Applications API reference is the first
 * thing to do, since this is the one integration in this codebase built
 * against an API with known recent instability, not just my own untested
 * assumptions.
 *
 * Requires an API token scoped to Account > Access: Apps and Policies >
 * Edit, plus the account ID. Both optional: every function here is a
 * no-op if CF_API_TOKEN or CF_ACCOUNT_ID is unset, so the manual fallback
 * (paste an AUD in by hand) keeps working exactly as it always has until
 * these are configured.
 */

const CF_BASE = "https://api.cloudflare.com/client/v4";

function configured(env: Bindings): boolean {
  return !!env.CF_API_TOKEN && !!env.CF_ACCOUNT_ID;
}

async function cfFetch(env: Bindings, path: string, init: RequestInit) {
  const res = await fetch(`${CF_BASE}/accounts/${env.CF_ACCOUNT_ID}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${env.CF_API_TOKEN}`, "Content-Type": "application/json", ...init.headers },
  });
  const data = await res.json<{ success: boolean; result: unknown; errors?: { message: string }[] }>();
  if (!res.ok || !data.success) {
    console.error("Cloudflare API call failed:", path, res.status, JSON.stringify(data.errors));
    throw new Error(data.errors?.[0]?.message ?? "Cloudflare API call failed.");
  }
  return data.result;
}

/**
 * Creates the Access application itself. Called once per client, the first
 * time it has any staff at all; syncPolicy (below) handles every change
 * after that without ever calling this again.
 */
export async function createClientAccessApp(
  env: Bindings,
  input: { clientName: string; subdomain: string },
): Promise<{ appId: string; aud: string } | null> {
  if (!configured(env)) return null;

  const domain = `${input.subdomain}.${env.ROOT_DOMAIN}`;
  const app = await cfFetch(env, "/access/apps", {
    method: "POST",
    body: JSON.stringify({
      name: `${input.clientName} dashboard`,
      domain,
      type: "self_hosted",
      session_duration: "24h",
    }),
  });
  const result = app as { id: string; aud: string };
  return { appId: result.id, aud: result.aud };
}

/**
 * Creates the app's one Allow policy the first time, or updates that same
 * policy's Include list every time after, so it always matches exactly who
 * is currently in client_users for this client. An empty email list is
 * sent as-is rather than skipped: Access already denies by default, so a
 * client with no staff left correctly locks everyone out instead of
 * leaving a stale policy that still lets a removed person in.
 */
export async function syncClientAccessPolicy(
  env: Bindings,
  input: { appId: string; existingPolicyId: string | null; emails: string[] },
): Promise<string | null> {
  if (!configured(env)) return null;

  const body = {
    name: "Client staff",
    decision: "allow",
    include: input.emails.map((email) => ({ email: { email } })),
  };

  if (input.existingPolicyId) {
    await cfFetch(env, `/access/apps/${input.appId}/policies/${input.existingPolicyId}`, {
      method: "PUT",
      body: JSON.stringify(body),
    });
    return input.existingPolicyId;
  }

  const policy = await cfFetch(env, `/access/apps/${input.appId}/policies`, {
    method: "POST",
    body: JSON.stringify(body),
  });
  return (policy as { id: string }).id;
}
