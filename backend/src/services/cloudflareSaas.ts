import type { Bindings } from "../types";

/**
 * White-label custom domains (architecture 11.3), built on Cloudflare for
 * SaaS custom hostnames. Same calling convention as services/accessApi.ts:
 * a `configured(env)` check gating every function, so this is a no-op
 * until CF_API_TOKEN and CF_ZONE_ID are both set. Zone-scoped, not
 * account-scoped like accessApi.ts's Access automation: custom hostnames
 * live under /zones/{zone_id}/custom_hostnames, a different resource and a
 * different id than CF_ACCOUNT_ID, hence the new CF_ZONE_ID binding (the
 * villoguides.com zone's id, not the account's).
 *
 * Requires an API token scoped to Zone > SSL and Certificates > Edit on
 * the villoguides.com zone. Cloudflare for SaaS itself, and the zone's
 * fallback origin (the target every custom hostname's CNAME ultimately
 * points at), are assumed already enabled and configured on the account,
 * per the task brief; this service does not check or set either up.
 *
 * Researched against Cloudflare's current custom hostnames documentation
 * (developers.cloudflare.com/cloudflare-for-platforms/cloudflare-for-saas/).
 * Two things worth flagging plainly, the same way accessApi.ts flags its
 * own deprecated-field risk, rather than presenting either as settled fact:
 *
 * 1. The architecture doc describes this as "the client adds one DNS
 *    record." That undersells it a little. A custom hostname also needs
 *    ownership verification (proving the client actually controls the
 *    domain) before Cloudflare will activate it at all, separate from
 *    certificate issuance. Cloudflare offers TXT, HTTP, or CNAME/apex
 *    methods for that, but documented behavior is that HTTP-style
 *    ownership verification is not reliable for a *wildcard* hostname
 *    (guides use `*.{custom_domain}`, exactly that shape), since there is
 *    no single fixed path to serve a verification token from across every
 *    possible subdomain. This uses `ssl.method: "txt"` for both the guides
 *    (wildcard) and dashboard (apex) hostnames, uniformly, so the same
 *    flow works for both rather than branching on scope: the client may
 *    end up adding an ownership TXT record before, or instead of, a CNAME.
 *    createCustomHostname and getCustomHostnameStatus both return whatever
 *    verification records Cloudflare's response actually contains
 *    (ownership_verification and ssl.validation_records), and the studio UI
 *    shows all of them, rather than assuming a single CNAME is always the
 *    whole story.
 * 2. Cloudflare's response can omit ssl.validation_records on the very
 *    first GET or POST while it is still requesting them from the
 *    certificate authority; Cloudflare's own docs recommend a follow-up GET
 *    after a short delay when they come back empty. getCustomHostnameStatus
 *    exists for exactly this: a studio "check status" action the owner
 *    triggers manually, not an assumption that everything is available
 *    the instant a hostname is created.
 *
 * Hostname activation (the top-level `status` field) and certificate
 * issuance (`ssl.status`) are two separate state machines, each with more
 * than a dozen possible values (`pending_deployment`, `pending_validation`,
 * `active_redeploying`, and so on). Rather than surface all of those to the
 * studio, toResult below narrows both down to whatever Cloudflare returned
 * verbatim in `status`/`ssl.status`, and the studio UI treats anything
 * other than "active" as still pending; if Cloudflare ever adds a new
 * explicit failure state worth calling out specially, this is the function
 * to extend.
 */

const CF_BASE = "https://api.cloudflare.com/client/v4";

export function configured(env: Bindings): boolean {
  return !!env.CF_API_TOKEN && !!env.CF_ZONE_ID;
}

class CloudflareSaasError extends Error {}

/**
 * A specific, actionable message for the plausible real-world failure
 * modes named in the task brief (quota, a hostname already claimed
 * elsewhere, a verification timeout), falling back to Cloudflare's own
 * message when none of the known patterns match, rather than a single
 * generic "something went wrong" either way.
 */
function describeError(status: number, errors?: { message: string; code?: number }[]): string {
  const message = errors?.[0]?.message ?? "";
  if (/already exists|already.*(claimed|registered|in use)|duplicate/i.test(message)) {
    return "This domain is already registered as a Cloudflare custom hostname, on this account or a different one. It needs to be removed from wherever else it is set up before it can be added here.";
  }
  if (/quota|too many|limit/i.test(message)) {
    return "This account has reached its Cloudflare custom hostname limit (100 free, then billed per hostname per architecture 11.3). Raise the limit with Cloudflare before adding more white-label domains.";
  }
  if (status === 403 || /authoriz|permission|forbidden/i.test(message)) {
    return "Cloudflare rejected this request. The API token may be missing the Zone > SSL and Certificates > Edit permission this needs.";
  }
  if (/invalid.*hostname|hostname.*invalid|malformed/i.test(message)) {
    return "Cloudflare rejected this domain as invalid. Check it is spelled correctly and does not include a scheme (https://) or a path.";
  }
  return message || "Cloudflare could not complete this request. Try again in a moment.";
}

async function cfFetch(env: Bindings, path: string, init: RequestInit = {}) {
  const res = await fetch(`${CF_BASE}/zones/${env.CF_ZONE_ID}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${env.CF_API_TOKEN}`, "Content-Type": "application/json", ...init.headers },
  });
  const data = await res.json<{ success: boolean; result: unknown; errors?: { message: string; code?: number }[] }>();
  if (!res.ok || !data.success) {
    console.error("Cloudflare custom hostname API call failed:", path, res.status, JSON.stringify(data.errors));
    throw new CloudflareSaasError(describeError(res.status, data.errors));
  }
  return data.result;
}

export type ValidationRecord = { txt_name?: string; txt_value?: string; http_url?: string; http_body?: string };
export type OwnershipVerification = { type: string; name: string; value: string };

export type CustomHostnameResult = {
  id: string;
  hostname: string;
  /** Cloudflare's own status string, verbatim; see the file-level note on why this isn't narrowed further. */
  status: string;
  sslStatus: string | null;
  validationRecords: ValidationRecord[];
  ownershipVerification: OwnershipVerification | null;
};

function toResult(raw: unknown): CustomHostnameResult {
  const r = raw as {
    id: string;
    hostname: string;
    status: string;
    ssl?: { status?: string; validation_records?: ValidationRecord[] };
    ownership_verification?: OwnershipVerification;
  };
  return {
    id: r.id,
    hostname: r.hostname,
    status: r.status,
    sslStatus: r.ssl?.status ?? null,
    validationRecords: r.ssl?.validation_records ?? [],
    ownershipVerification: r.ownership_verification ?? null,
  };
}

/** Registers a client's domain (or *.domain, for guides) and requests a certificate for it. */
export async function createCustomHostname(env: Bindings, input: { hostname: string }): Promise<CustomHostnameResult | null> {
  if (!configured(env)) return null;
  const result = await cfFetch(env, `/custom_hostnames`, {
    method: "POST",
    body: JSON.stringify({ hostname: input.hostname, ssl: { method: "txt", type: "dv" } }),
  });
  return toResult(result);
}

/** Polls current status. Certificate issuance is not instant, so this is a "check status" action, not assumed. */
export async function getCustomHostnameStatus(env: Bindings, id: string): Promise<CustomHostnameResult | null> {
  if (!configured(env)) return null;
  const result = await cfFetch(env, `/custom_hostnames/${id}`);
  return toResult(result);
}

/** For when a client's white-label add-on lapses (architecture 11.3: falls back to {property}.villoguides.com). */
export async function deleteCustomHostname(env: Bindings, id: string): Promise<void> {
  if (!configured(env)) return;
  await cfFetch(env, `/custom_hostnames/${id}`, { method: "DELETE" });
}

/**
 * The zone-wide CNAME target every custom hostname's DNS record ultimately
 * points at (Cloudflare's "fallback origin"), fetched live rather than
 * hardcoded so the studio always shows the client the real value instead
 * of a guess. Assumed already configured once on the account, per the task
 * brief; this only reads it.
 */
export async function getFallbackOriginTarget(env: Bindings): Promise<string | null> {
  if (!configured(env)) return null;
  const result = (await cfFetch(env, `/custom_hostnames/fallback_origin`)) as { origin?: string };
  return result.origin ?? null;
}
