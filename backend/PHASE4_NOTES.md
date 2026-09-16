# Phase 4 notes

What Phase 4 covers: the client dashboard's export endpoint, the last piece
architecture section 9.2 called for. Everything else in that section (notes,
scoped change requests, dashboard eligibility) was already built and proven
during Phase 2's studio-first pass, since exercising the studio end to end
meant having a dashboard to check publish results against.

No new deploy steps: same database, same R2 bucket, same Worker. Unzip over
your existing `backend/`, `npm install` (this phase adds one dependency),
and redeploy the usual way.

## What's new

**`GET /api/dashboard/export`** now returns a real ZIP, not the placeholder
JSON the mock frontend used to stand in for one. One folder per property,
named by its subdomain, each holding the published content as readable
JSON plus every photo it references, read straight from R2. Built with
`fflate`, a small pure-JavaScript zip library with no native dependencies,
which matters on Workers since there's no filesystem and no shot at
anything that needs one. Admin-only, enforced by `requireClientRole`
before the handler ever runs, not just hidden in the frontend.

## One bug fixed along the way

`GET /api/dashboard/guides/:id` was returning a guide's **draft**, not what
was actually published. If the studio had made edits after the last
publish, without republishing yet, a client would have seen those
in-progress changes instead of what their guests actually see, directly
contradicting architecture 5.3's "Open guide as a guest sees it." This was
left over from Phase 2's studio-first pass, where publish/read-back testing
never happened to catch it since the draft and the published version were
usually identical in that testing. Fixed to read the actual published
version's content instead. Verified: edited a draft without republishing,
confirmed neither the dashboard nor the public guest view picked up the
change.

## What I tested end to end, live, against local D1 and R2

1. Created a client, two published guides, one photo-free (the R2 side of
   export was already proven correct in Phase 3's testing, so this phase
   focused on the ZIP structure and the dashboard-specific logic).
2. Added one admin and one support staff member.
3. Confirmed the client became dashboard-eligible automatically off two
   paid guides alone, no add-on needed, matching architecture 8.1's
   derived-eligibility rule.
4. Exported as the admin: got back a real, valid ZIP (confirmed with
   `unzip -l` and by reading both `content.json` files back out) with the
   correct headers for a browser download.
5. Tried the same export as the support staff member: correctly rejected
   with 403 before the ZIP was ever built.
6. Made an unpublished draft edit, confirmed it did not leak into either
   the dashboard's guide view or the public guest view.

## Still open after this phase

- Rate limiting (Phase 5).
- Automated per-client Cloudflare Access application creation. The
  architecture phrases this phase's Access item as "manual first, then
  automated," and manual is what's built and working (the studio's Clients
  screen has the AUD field, the Worker checks it in resolveClient).
  Automating the creation itself, via Cloudflare's own API, is a genuinely
  separate feature with its own permission scope, so it wasn't folded in
  silently here. Worth doing whenever you're ready for it.
- The frontend's missing offline service worker (`vite-plugin-pwa`,
  flagged in Phase 3's notes) is still open and still frontend work, not
  backend.
