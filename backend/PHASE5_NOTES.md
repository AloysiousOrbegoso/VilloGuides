# Phase 5 notes

What Phase 5 covers: rate limits, Content Security Policy on guide pages,
and the four cron jobs from architecture 13.4. This is the last phase in
the architecture's own build-out list (section 15).

## Before you deploy this: two config values need a decision

This phase adds two things that live in `wrangler.toml` and need your own
values, not placeholders:

1. **Rate limit `namespace_id`s.** Set to `1001` and `1002` below. These
   just need to be integers unique within your account; if you ever add
   more rate limits later, give each a new unused number. Nothing to look
   up, nothing to create by hand, they provision automatically on deploy.
2. **Cron schedule times.** Currently `18:00` and `18:15` UTC daily, `18:30`
   and `18:45` UTC on Sundays, chosen to land in the Philippines' small
   hours. Change the hour in each `crons` entry if you'd rather they run at
   a different time.

Also: **this copy of `wrangler.toml` was regenerated from an older base and
does not have your real D1 `database_id` or your `not_found_handling`
line.** Both are called out with a comment at the top of the file. Copy
those two values over from your currently-deployed `wrangler.toml` before
using this one; everything else in it is new and safe to take as-is.

## What's new

**Rate limiting** (architecture 12) on intake autosave, photo uploads,
studio subdomain checks, and the report endpoint. Two budgets: a generous
one (30 requests per 10 seconds) for frequent-but-legitimate traffic like
autosave while typing, and a tight one (5 requests per 60 seconds)
specifically for reports, since one visitor reporting the same guide
repeatedly in a minute is already unusual. Fails open: if the rate limiter
itself ever errors, the request goes through rather than getting blocked,
so an outage in rate limiting can never take down the feature it's
protecting.

**Content Security Policy on guide pages** (architecture 12): scripts from
the guide's own origin only, frames limited to YouTube and Vimeo, images
from the guide's own origin plus `data:` for the demo's inlined cover
image. Applied to both real guides and the reserved `demo` subdomain, and
nowhere else, matching the architecture's own wording.

**Four cron jobs** (architecture 13.4): a daily check that every published
guide still has a valid version row, daily expiry of intake links past
their date, a weekly sweep that deletes R2 photos nothing references
anymore, and a weekly JSON export of every table to R2 as a backup
independent of D1's own Time Travel.

**A dedicated `reports` table**, replacing the audit-log-only placeholder
from Phase 2.

## Two real bugs found while building this, not just typos

**The rate limit config silently didn't work at first.** Cloudflare's own
current docs show `[[ratelimits]]` as a top-level `wrangler.toml` block.
This Wrangler version doesn't recognize it: it logs a one-line warning
("Unexpected fields found") and moves on, so the deploy itself doesn't
fail, the binding is just quietly never created. I only caught this
because I tested it: sent 7 requests against a 5-per-60-second limit and
watched all 7 succeed. Switched to the older `[[unsafe.bindings]]` syntax
with `type = "ratelimit"`, confirmed in the startup log that it actually
connects, and retested: 5 through, then a clean 429 on the 6th. If you ever
see Cloudflare's docs suggest the newer syntax again and want to try it,
test it exactly this way, by exceeding the limit, before trusting it.

**The CSP header was being set on code that never ran.** Cloudflare's
static assets serve any matching file directly, without ever invoking the
Worker's own code, unless you explicitly tell it not to. Since almost every
request in this app resolves to a static file one way or another (either a
literal match or the SPA fallback), the catch-all route in `index.ts` that
was supposed to add the CSP header was effectively dead code: I could add
whatever logic I wanted there and it would simply never execute for `/`,
`/settings`, a guide's homepage, or anything else document-level. Fixed
with `run_worker_first`, scoped to exclude `/assets/*` (where every built
JS, CSS, and font file lives) so this doesn't add a database lookup to
every sub-resource on a page, only to the actual document navigation.
Verified directly: a real published guide's homepage now carries the CSP
header, studio and an unknown hostname correctly don't, and a request for
an asset file still shows `CF-Cache-Status: HIT`, meaning it still bypasses
the Worker entirely as it should.

Both of these are the kind of thing that looks completely fine in a
type-check and even in a successful deploy, and only show up when you
actually try to trigger the behavior and watch what happens. Worth keeping
in mind for anything added after this.

## What I tested end to end, live

- Sent 7 rapid requests to the report endpoint against a 5-per-60s limit:
  5 succeeded, 2 got 429.
- Sent 35 rapid intake autosave requests against a 30-per-10s limit: 30
  succeeded, 5 got 429.
- Confirmed the CSP header appears on a real published guide's homepage
  and on the demo subdomain, is absent on the studio hostname and an
  unrecognized hostname, and that actual asset files bypass the Worker
  entirely (no CSP, no database lookup).
- Manually triggered all four cron jobs via `wrangler dev`'s
  `__scheduled` test endpoint. Confirmed each one actually did something,
  not just ran without erroring: backdated an intake link's expiry and
  watched the cron flip it to `expired` with the change logged; downloaded
  the real backup JSON from R2 and confirmed all 11 tables were in it with
  real data; uploaded a photo referenced by nothing, confirmed the cleanup
  job correctly left it alone while fresh (the 24-hour safety margin
  working), then temporarily lowered that margin to prove the job actually
  deletes a confirmed orphan, and reverted the change afterward.

## What's still open

This was the last phase in the architecture's own numbered list (section
15). What's left is everything the architecture calls "Later," which was
never scoped to a phase:

- Google sign-in as an additional Access login method.
- Online payments (a payment gateway instead of the manual GCash/bank
  transfer flow).
- A PIN-protected private block for door codes, as a stronger alternative
  to the current warn-but-don't-block approach.
- White-label custom domains.
- Additional languages.
- Automated per-client Cloudflare Access application creation (currently
  manual, and working correctly).

Also still open from earlier phases, since they were flagged and never
picked up:

- The frontend's missing offline service worker (`vite-plugin-pwa`,
  flagged in Phase 3's notes).
- Whatever comes out of a real device pass: architecture's own Phase 5
  description includes "verify every interactive feature on real phones,"
  which is inherently something to do with an actual phone in hand, not
  something a backend session can check for you.
