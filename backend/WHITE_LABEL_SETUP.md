# White-label custom domains

Architecture 11.3. A client can use their own domain for their dashboard,
their guides, or both, instead of `{client}.villoguides.com` /
`{property}.villoguides.com`. Built on Cloudflare for SaaS custom
hostnames, which the task brief said is already enabled on the account
with the 100-free-hostname allowance; this does not check or set that up.

## The scope decision this was built around

A client can have many guides, but `clients.custom_domain` is one value.
Guides scope is a **wildcard**: `*.{custom_domain}`, one Cloudflare custom
hostname covering every property the client ever publishes, the same way
a guide's slug is already just the label in front of `villoguides.com`.
Dashboard scope is the **bare domain**, an exact match. "Both" registers
both, separately, since Cloudflare matches a custom hostname exactly (no
combined apex-plus-wildcard registration) — hence two id columns
(`custom_domain_dashboard_hostname_id`, `custom_domain_guides_hostname_id`)
on the client row rather than one.

One consequence worth knowing: because guides resolve by slug alone
(globally unique across every client already, per the shared-namespace
rules in architecture 4.1), **no guide-serving code needed to change at
all**. `GET /api/guide` and `POST /api/guide/unlock` already extract the
slug as "whatever's in front of the first dot," which is exactly the
guide's slug whether the request arrived on `{slug}.villoguides.com` or
`{slug}.{a client's custom domain}`. The only place that genuinely needed
new logic is dashboard resolution: a client's dashboard on a *bare* custom
domain has no subdomain label to look up by, so `middleware/resolveClient.ts`
and `services/subdomains.ts`'s `resolveHostname` both fall back to an exact
match against `custom_domain` (scope-checked) only once the ordinary
subdomain lookup has already failed, so the existing `*.villoguides.com`
path runs exactly as it always did, with one extra query only when nothing
else matched.

## What the architecture doc's "one DNS record" leaves out

Cloudflare for SaaS needs the client to prove they actually control the
domain (ownership verification) before it activates a custom hostname at
all, separate from certificate issuance. Cloudflare offers a TXT, HTTP, or
CNAME-based method for that. Documented behavior is that HTTP-style
verification is not reliable for a *wildcard* hostname, exactly the shape
guides use (`*.{custom_domain}`), since there's no single fixed path to
serve a verification token from across every possible subdomain. This
uses `ssl.method: "txt"` uniformly for both the dashboard (apex) and
guides (wildcard) hostnames, so the same flow works for both rather than
branching by scope. In practice this likely means the client ends up
adding a TXT record (sometimes two: one for ownership, one for
certificate DCV) before, or in addition to, the CNAME the architecture doc
describes as the only step. The studio UI shows every record Cloudflare's
response actually contains (`ownership_verification` and
`ssl.validation_records`), not just a single assumed CNAME, and
`services/cloudflareSaas.ts` documents this reasoning inline, the same way
`services/accessApi.ts` documents its own deprecated-field risk rather
than presenting an assumption as settled fact.

The CNAME target itself (what the client ultimately points their DNS at)
is not invented here: it's fetched live from the zone's own fallback
origin setting (`getFallbackOriginTarget`), which is assumed already
configured once on the account.

## Setup, once you're ready to turn this on

1. Confirm Cloudflare for SaaS is enabled on the villoguides.com zone and
   its fallback origin is configured (both are prerequisites this feature
   assumes, not something it sets up).
2. Create an API token: Cloudflare dashboard → profile icon → API Tokens →
   Create Token → Custom token → permission **Zone, SSL and Certificates,
   Edit**, scoped to the villoguides.com zone. This can be the same token
   used for `CF_API_TOKEN` in `ACCESS_AUTOMATION.md` if that token is also
   given this permission, or a separate one.
3. Get the zone id from the Cloudflare dashboard's overview page for
   villoguides.com.
4. Set the secrets:
   ```
   npx wrangler secret put CF_API_TOKEN
   npx wrangler secret put CF_ZONE_ID
   ```

Until `CF_API_TOKEN` and `CF_ZONE_ID` are both set, every studio action on
a client's custom domain (register, check status, remove) fails with a
plain "not configured yet" error rather than silently doing nothing, since
there is no manual fallback for this feature the way there is for Access
AUDs (paste one in by hand). That is a deliberate difference from
`accessApi.ts`'s silent no-op: there was nothing meaningful to leave in
place here until this is configured.

## What was tested, and what wasn't

Same honesty standard as every other external-API integration in this
repo. Read this before assuming anything works out of the box.

**Fully proven, live, against the real backend (`wrangler dev`, local D1),
with no Cloudflare credentials configured:**

- `POST /api/studio/clients/:id/custom-domain`, the status endpoint, and
  the delete endpoint all correctly refuse with the "not configured yet"
  message above rather than silently succeeding or crashing.
- **Hostname resolution logic**, which is the part most worth trusting
  before a real domain is ever involved. A test client's `custom_domain`
  and `custom_domain_scope` were set directly in D1 (standing in for what
  a real Cloudflare registration would produce), then:
  - `GET /api/host` on the bare custom domain correctly resolved to that
    client's dashboard; on `{slug}.{custom domain}` it correctly resolved
    to the matching guide.
  - `GET /api/guide` on `{slug}.{custom domain}` returned the exact same
    redacted content a normal `{slug}.villoguides.com` request would (this
    also re-confirmed the private-block redaction from the PIN-protected
    block feature still holds under a custom domain).
  - `GET /api/dashboard/me`, with Cloudflare Access impersonated via
    `DEV_IDENTITY`, correctly authenticated a real staff member on the
    bare custom domain and correctly rejected one not on that client's
    staff list.
  - Narrowing scope to `guides` only, dashboard resolution on the bare
    domain correctly stopped resolving (both `GET /api/host` and
    `GET /api/dashboard/me` started returning "not found"), while the
    guide subdomain kept working, confirming scope is actually enforced,
    not just stored.
  - Every ordinary `*.villoguides.com` case (an existing client subdomain,
    an existing guide slug, an unrelated random hostname) was re-checked
    after all of the above and behaved exactly as before, confirming the
    new custom-domain fallback never runs unless the ordinary path already
    found nothing.
- **Studio UI**, live in a browser (mock API mode, which simulates
  Cloudflare responding immediately and successfully, the same reasoning
  `startPropertyCheckout` already uses for the payment gateways): filled in
  a domain, picked each scope option, registered it, saw both hostnames
  read back as "Active" with the CNAME target displayed, used "Check
  status," then "Remove" (with its confirm prompt), and confirmed the form
  correctly returns to its empty "Register domain" state afterward. Also
  confirmed an invalid domain is rejected with a clear message, and that
  "Open this client's dashboard" switches to the custom domain once a
  dashboard-scoped one is active. **A real bug was caught and fixed during
  this**: the component originally reset its own locally-held status
  immediately after every `custom_domain` prop change, which included the
  refresh the registration action itself triggers, so a successful
  registration's result was overwritten with nothing a moment after it
  appeared. Fixed by keying that reset on the client's id changing (a
  different client's drawer opening) rather than on `custom_domain` itself
  changing.

**Not tested, and cannot be, without a real Cloudflare zone and a real
domain:** the actual `createCustomHostname` / `getCustomHostnameStatus` /
`deleteCustomHostname` / `getFallbackOriginTarget` calls against
Cloudflare's real API. `services/cloudflareSaas.ts` is built directly
against Cloudflare's current documented API shape, not guessed, and the
whole backend type-checks cleanly, but "compiles correctly against the
documented shape" and "actually works against the real API, with a real
domain's DNS actually validating" are not the same claim, the same
distinction `PAYMENTS_SETUP.md` and `ACCESS_AUTOMATION.md` both draw for
their own Cloudflare/gateway integrations. The first real test of this has
to happen with a real client domain, real DNS access, and the two secrets
above configured. If something doesn't work on the first try, the most
likely place is a mismatch between what was assumed the API returns
(particularly the exact shape of `ownership_verification` and
`ssl.validation_records`, both documented as sometimes arriving empty on
the very first response) and what it actually returns on a live account;
that's exactly the kind of thing that only shows up against the real
thing.

## Pricing

Architecture 16 still lists "White-label add-on price" as undecided. The
studio UI's custom-domain section says so directly ("price still to be
decided") rather than showing an invented number anywhere.

## Files changed

**Backend:**
- `migrations/0013_client_custom_domains.sql` (new: three columns)
- `src/services/cloudflareSaas.ts` (new)
- `src/models/customDomains.ts` (new: orchestrates the service above with
  the client row, the same pattern `models/clients.ts`'s
  `syncClientAccess` uses for Access)
- `src/models/clients.ts` (`ClientRow` type updated for the three new
  columns)
- `src/services/subdomains.ts` (`resolveHostname` now takes the full
  hostname, not a pre-split label, and falls back to a custom-domain match
  once the ordinary checks find nothing)
- `src/middleware/resolveClient.ts` (same fallback, for dashboard auth)
- `src/routes/guide.ts` (`resolveSlug` now splits its dev-only header
  value too, for consistency; no behavior change against real traffic,
  since that header is never sent outside local development)
- `src/routes/studio.ts` (three new endpoints under `/clients/:id/custom-domain`)
- `src/index.ts` (`/api/host` and the CSP catch-all pass the full hostname
  through instead of a pre-split label)
- `src/types.ts` (documents the new `CF_ZONE_ID` binding)
- `wrangler.toml` (no changes needed; `CF_API_TOKEN`/`CF_ZONE_ID` are
  secrets, not plain vars, set via `wrangler secret put`)

**Frontend:**
- `src/lib/hostname.js` (`resolveLocation` recognizes a real custom domain
  as a new "custom" area, resolved by the Worker, the same way an
  ambiguous `*.villoguides.com` subdomain already was)
- `src/App.jsx` (handles the "custom" area the same way as "tenant"; both
  now carry the resolved subdomain/slug back from the Worker instead of
  assuming it)
- `src/lib/api.js` / `src/data/mock/mockApi.js` (`resolveHost` now also
  returns the resolved subdomain/slug; three new client methods for
  set/check/remove)
- `src/components/studio-pages/Clients.jsx` (new "White-label custom
  domain" section in the client drawer)
