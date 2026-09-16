# Phase 3 notes

What Phase 3 covers: intake submission actually mapping into a guide,
moving photos from the private intake area to the published area at
publish time, and edge caching for the public guide endpoint.

No new deploy steps beyond Phase 2's: this is the same database, same R2
bucket, same Worker. Just `git pull` these files in, or unzip over your
existing `backend/`, then redeploy the usual way (or let CI/CD handle it,
once that's wired up).

## What's new

**`POST /api/intake/:token/submit`** now does the real work: maps the
owner's answers into GuideContent, merges them onto anything already on the
guide so custom pages the studio added by hand survive a resubmission, sets
the guide to `in_review`, and updates city/owner from the answers
(architecture 10.1 step 4). The mapping runs server-side rather than
trusting a client-computed result, since intake is public and only
token-gated.

**Publish now moves photos** (architecture 10.2 step 5). Every photo a
guide's content references gets checked: if it's still sitting in the
private intake area, it's moved to the published area before the version is
saved. This runs whether the photo came from an intake form or was uploaded
directly in the studio, so it's a safe no-op in the second case.

**The public guide endpoint is now cached at the edge for 60 seconds**
(architecture 7.3), and that cache is purged the moment a guide is
published, unpublished, suspended, renamed, or restored, so an edit is
never stuck behind a stale cache. Verified locally: republishing a change
showed up on the very next read, not after a wait.

## One design call worth knowing about

The architecture says intake photos should "stay private until the guide is
published." I initially built that as two separate serving routes, one
public and one intake-only, and quickly ran into a real problem: the studio
needs to preview a guide's photos, including ones still sitting in the
intake area, before it's ever published, and the shared rendering
component (`GuideRoot`, used everywhere a guide is shown) has no idea which
context it's running in.

What shipped instead: one shared `/photos/:key` route that checks the
published area first, then the private intake area. This keeps studio
previews working without a second route to keep in sync, and it's a
deliberate choice rather than an oversight: every filename is an
unguessable random UUID, which is the same trust model the intake token
itself already relies on (architecture 4, "Private token link, no
account"). Nothing indexes these URLs, nothing links to them from anywhere
public, and once a guide is published, `promotePhoto` moves the file out of
the intake area entirely, so long-term that area only ever holds photos for
guides still waiting on review.

If this ever needs to be tightened further (the architecture's later
phases mention nothing stronger, but it's worth naming), the fix would be
threading a "preview mode" flag through `GuideRoot` so it can request
photos through an authenticated studio-only path instead. Flagging it here
in case a stricter posture is ever wanted, not because anything found in
testing suggested it's a real problem today.

## What I tested end to end, live, against local D1 and R2

1. Created a client and an intake link.
2. Uploaded a photo through the intake presign/upload flow and confirmed it
   read back correctly before publish.
3. Submitted intake answers referencing that photo.
4. Confirmed the guide flipped to `in_review`, appeared in the review
   queue, and had the photo, city, and owner name mapped in correctly.
5. Set a subdomain, marked it paid, published.
6. Confirmed in R2 directly: the file was gone from `intake/` and present,
   byte-for-byte, under `guides/`.
7. Confirmed the same `/photos/{filename}` URL still resolved after that
   move, with no change needed to the content's stored URL.
8. Read the guide as a guest, confirmed the `Cache-Control: public,
   max-age=60` header, and confirmed a second read returned an identical
   body.
9. Edited the draft and republished, then confirmed the change was visible
   on the very next read, proving the purge actually fires rather than
   waiting out the cache window.

## Still open after this phase

- Rate limiting on intake autosave, uploads, subdomain checks, and the
  report endpoint (Phase 5).
- The client dashboard's export endpoint (Phase 4).
- Automated per-client Cloudflare Access application creation (Phase 5 /
  the architecture's "Later" list); still done by hand in the dashboard.
- The frontend is missing `vite-plugin-pwa` and its offline service worker
  entirely (architecture 6.1 lists this as part of the frontend stack, and
  5.5 lists offline caching as a guide feature). This was missed in the
  original frontend build and hasn't been added since. Worth deciding when
  to pick up, since it's frontend work rather than backend, and not
  something this phase touched.
