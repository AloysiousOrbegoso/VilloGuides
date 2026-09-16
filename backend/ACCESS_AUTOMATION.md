# Automated Access application creation

Architecture 7.2 always described this as "manual first, then automated."
Manual has been working the whole way through (create the app by hand,
paste its AUD into the studio's Clients screen). This adds the automated
half, without removing the manual one: if the two new secrets below are
never set, nothing changes from how it's always worked.

## What it actually does, beyond just "create it once"

Every time a client's staff list changes, added or removed, the Access
policy is updated to match, not just set once at creation:

- **First staff email ever added** for a client: creates the Access
  application and its one Allow policy, then stores three things back on
  the client: `access_aud` (already existed, used to verify a JWT),
  `access_app_id` and `access_policy_id` (new, Cloudflare's own IDs,
  needed to update that same policy later instead of creating a duplicate
  one every time).
- **Every add or remove after that**: updates the existing policy's
  Include list to match exactly who's currently in `client_users`.

This is more than the architecture originally described, and on purpose.
Before this, removing someone from `client_users` only blocked them at the
application layer; they could still see Access's own sign-in screen, since
Access's policy itself never changed. Now the policy itself is kept in
sync, so a removed staff member is blocked at the same point everyone else
already is.

## A real, documented risk specific to this one integration

Cloudflare deprecated part of this exact API (`self_hosted_domains`,
superseded by `destinations`) with a cutoff of November 21, 2025, already
in the past. This was built specifically to avoid both fields, using only
the top-level `domain` field, which every source checked still documents
as required and unaffected. This is the one integration in this codebase
built against an API with *documented* recent breaking changes, not just
my own untested assumptions the way the payment gateways were. If this
starts failing, Cloudflare's current Access Applications API reference is
the first thing to check, not the code here.

## Setup, once you're ready to turn this on

1. Create an API token: Cloudflare dashboard → profile icon → API Tokens
   → Create Token → Custom token → permission **Account, Access: Apps and
   Policies, Edit**, scoped to your one account.
2. Get your account ID from the Workers & Pages overview page.
3. Set both as secrets:
   ```
   npx wrangler secret put CF_API_TOKEN
   npx wrangler secret put CF_ACCOUNT_ID
   ```

Until both are set, `addClientUser` and `removeClientUser` behave exactly
as they always have. Nothing needs to change on your end to keep using the
manual flow.

## What was tested, live, against the real backend

Ran the actual create-client and add/remove-staff endpoints with no
Cloudflare credentials configured at all, the same way this will behave
until you set the two secrets above:

- Created a client: `access_aud`, `access_app_id`, and `access_policy_id`
  all correctly stayed `null`.
- Added a staff member: succeeded normally, all three fields still `null`
  afterward, confirming the sync attempt was a true no-op rather than a
  silent partial failure.
- Removed that staff member: also succeeded cleanly.
- Checked the logs for anything related to the Access API or
  `syncClientAccess`: nothing, meaning the early return fired correctly
  before any network call was attempted.

**Not tested:** an actual call to Cloudflare's Access API. Same honest
limitation as the payment gateways: I don't have a scoped token to test
with, and reasoning carefully from documentation is a different claim from
watching a real application get created. This one carries more risk than
usual given the deprecation noted above, so the first real client added
after you configure this is worth checking directly in the Cloudflare
dashboard (Access → Applications) to confirm an app actually appeared with
the right domain and the right policy, rather than assuming it worked.

## Files changed

- `migrations/0012_client_access_policy.sql` (new: two columns)
- `src/services/accessApi.ts` (was a stub, now the real implementation)
- `src/models/clients.ts` (adds `syncClientAccess`, the orchestration
  function; `ClientRow` type updated for the two new columns)
- `src/models/clientUsers.ts` (`addClientUser`/`removeClientUser` now take
  the full environment, not just the database, and call the sync)
- `src/routes/studio.ts` (two call sites updated to match)
- `src/types.ts` (documents `CF_ACCOUNT_ID`/`CF_API_TOKEN`, both already
  existed as optional bindings, anticipated back in Phase 2)
