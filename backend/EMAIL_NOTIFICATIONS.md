# Email notifications

Architecture 6.2 and 6.4 always described this as "optional at launch,"
sent through Resend, kept on its own `notifications@villoguides.com`
address so a deliverability problem there never touches `hello@`. This
fills that in.

## What sends a notification

Three moments, each to whatever address is set in Studio → Settings →
Notification email:

1. **An intake form is submitted** (new or updated). Subject line names
   the property; body names who submitted it and for whom.
2. **A client sends a change or removal request** from their dashboard.
3. **A property gets paid for**, from any of the three places that can
   mark one paid online: Xendit's webhook, PayPal's webhook, or PayPal's
   capture-on-return call. All three send the identical message, so it
   reads the same regardless of which path actually confirmed it.

Nothing else sends a notification. Manually marking a guide paid in the
studio, publishing, and every other studio action stay exactly as quiet as
they've always been, since those are things you're already doing yourself
and already know about.

## It only ever does something if you've configured two things

1. **A Resend API key**, set as a secret:
   ```
   npx wrangler secret put RESEND_API_KEY
   ```
2. **A notification email address**, set in the studio itself: Settings →
   Notification email.

Missing either one, `sendNotification` returns immediately and does
nothing, no error, nothing logged as a failure. This was tested directly:
ran a full intake submission and a full change request through the real
backend with no Resend key configured at all, and both completed exactly
as before, correct response body, correct database state, nothing waiting
on or blocked by the missing key.

## Domain setup, before real mail can send

`notifications@villoguides.com` needs its own SPF and DKIM records before
Resend can actually send as your domain, separate from whatever's already
set up for `hello@`. Resend's own dashboard shows you the exact DNS
records to add once you've added the domain there; add them the same way
you added the MX and TXT records for Email Routing.

## What was and wasn't tested

**Tested, live, against the real backend:** the no-op behavior above, and
that `submitIntake` now returns the property and client name a
notification needs, without changing anything else about what it already
did.

**Not tested against the real Resend API.** Same limitation as the
payments work: I don't have a Resend key, and this sandbox's own network
setup wouldn't let the Worker reach even a local stand-in server for it
when I tried something similar during the payments build. The actual HTTP
call in `services/email.ts` is a plain, small POST to a well-documented
endpoint, but "the code is simple and matches the docs" is a different
claim from "I watched a real email arrive," and the first real test of
that has to happen on your end once a key is in place.

## Files changed

- `src/services/email.ts` (was a stub, now the real implementation)
- `src/types.ts` (`RESEND_API_KEY` binding)
- `src/models/intakeLinks.ts` (`submitIntake` now returns property and
  client name)
- `src/routes/intake.ts`, `src/routes/dashboard.ts`, `src/routes/webhooks.ts`
  (each calls the notification, wrapped in `c.executionCtx.waitUntil` so a
  slow or failed send can never delay or break the actual request)
- `wrangler.toml`, `.dev.vars.example` (documents the new secret)
