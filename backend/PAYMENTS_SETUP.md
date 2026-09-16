# Online payments (Xendit + PayPal)

What this covers: the "Later" list item for online payments, slotted into
the exact spot the architecture always pointed at, "Request a new
property (shows the payment 'coming soon' page in v1)." That coming-soon
page is now a real checkout.

Two gateways, not one, because they don't overlap:

- **Xendit** covers GCash, Maya, and bank transfer (InstaPay), which is how
  a payment from any Philippine bank, including SeaBank, reaches this
  project without a separate integration per bank.
- **PayPal** is a genuinely separate gateway with its own credentials, its
  own order lifecycle, and its own webhook format. Nothing bundles it with
  Xendit.

## What was tested, and what wasn't

Read this section before assuming anything works out of the box.

**Fully proven, live, in a real browser:** the entire frontend checkout
flow, in mock mode. Filled in a property name, clicked through to a
simulated GCash/Maya/bank checkout, landed on a real "Payment received"
confirmation screen, and confirmed the resulting guide showed up in the
studio correctly marked paid, in draft status, ready for an intake link.
A real bug was caught and fixed during this: the mock's redirect briefly
broke local dev's path-based routing (it would have been fine in
production, where each dashboard is a real subdomain, but the mock now
uses the same dev-path helper everything else in the app already relies
on).

**Not yet proven against anything live:** the backend's actual calls to
Xendit and PayPal. I don't have real sandbox credentials for either
gateway, and I tried to work around that by pointing the backend at a
local stub server standing in for both APIs, but the Workers runtime in
this environment could not reach even a stub on localhost, a sandbox
networking restriction rather than anything about the payment code itself.
The two service files (`src/services/xendit.ts`, `src/services/paypal.ts`)
are built directly against each gateway's current, real API documentation,
not guessed, and the whole backend type-checks cleanly, but "compiles
correctly against the documented shape" and "actually works against the
real API" are not the same claim. The first real test of the backend half
of this has to happen on your machine, with your real sandbox keys, since
that's the only way to reach Xendit and PayPal from a Worker at all.

If something doesn't work on the first try, the most likely place is a
mismatch between what I assumed the API would return and what it actually
returns; that's exactly the kind of thing that only shows up against the
real thing.

## Account setup, before any of this can run for real

### Xendit

1. Create an account at xendit.co, or use one you already have.
2. Dashboard → Settings → API Keys. Copy the **test** secret key (not
   live) while you're still testing.
3. Dashboard → Settings → Webhooks → Invoices. Set the callback URL to
   `https://villoguides.com/api/webhooks/xendit` (or your dev tunnel URL
   while testing locally). Xendit will show you a verification token here.
4. Set both as Worker secrets:
   ```
   npx wrangler secret put XENDIT_SECRET_KEY
   npx wrangler secret put XENDIT_WEBHOOK_TOKEN
   ```

### PayPal

1. Create a developer account at developer.paypal.com if you don't have
   one.
2. Dashboard → Apps & Credentials → Create App. Use the **Sandbox** tab
   while testing. Copy the Client ID and Secret.
3. Still in the app's settings, add a webhook: URL
   `https://villoguides.com/api/webhooks/paypal`, subscribed at minimum to
   `PAYMENT.CAPTURE.COMPLETED`. Copy the Webhook ID it gives you.
4. Set all three as Worker secrets:
   ```
   npx wrangler secret put PAYPAL_CLIENT_ID
   npx wrangler secret put PAYPAL_CLIENT_SECRET
   npx wrangler secret put PAYPAL_WEBHOOK_ID
   ```
5. `wrangler.toml` already has `PAYPAL_API_BASE` pointed at PayPal's
   sandbox environment. Leave it there until you're ready to accept real
   money, then change it to `https://api-m.paypal.com` and redeploy.

### Local testing

`.dev.vars.example` now lists all five payment-related keys. Copy it to
`.dev.vars` and fill in your real **sandbox** values (never live keys) to
test locally with `wrangler dev`. For a real end-to-end local test, both
gateways need to redirect back to a publicly reachable URL when payment
finishes, so plain `localhost` won't work for that leg; a tool like ngrok
pointed at your local `wrangler dev` port lets you test the full redirect
loop before deploying.

## What actually happens when someone pays

1. An admin on a client's dashboard opens "Add a property," names it, and
   picks a payment method.
2. The Worker creates a draft guide (unpaid) and asks the chosen gateway
   to start a checkout, then redirects the browser to that gateway's own
   hosted page. No card or wallet details ever touch this codebase.
3. **Xendit**: the guest pays on Xendit's page, Xendit redirects back
   immediately, and Xendit's webhook (arriving a moment later,
   independently) is what actually marks the guide paid. The "complete"
   page polls briefly while waiting for that webhook.
4. **PayPal**: the guest approves on PayPal's page and is redirected back
   with an order token. The "complete" page itself then calls the capture
   endpoint, which is what actually charges the card, and that capture
   call is authoritative on its own. PayPal's webhook is a backup for the
   case where someone closes the browser between approving and the
   redirect completing.
5. Either way, the guide now shows up in the studio's "All guides" list as
   paid, in draft status, exactly as if you had created it and marked it
   paid by hand. Send an intake link the same way you always would.

## Files changed

**Backend** (whole `backend/` folder, drop in over your existing one):
- `src/services/xendit.ts`, `src/services/paypal.ts` (new)
- `src/routes/webhooks.ts` (new)
- `src/routes/dashboard.ts` (new checkout, status, and capture endpoints)
- `src/index.ts` (mounts the new webhook routes)
- `src/types.ts` (five new secret bindings)
- `wrangler.toml` (documents the required secrets; your real database ID
  and everything else already in there is untouched)
- `.dev.vars.example` (five new placeholder entries)

**Frontend** (four files, listed individually below since the rest of the
frontend hasn't changed since the last delivery):
- `src/lib/api.js`
- `src/data/mock/mockApi.js`
- `src/components/dashboard-pages/RequestChange.jsx`
- `src/components/dashboard-pages/DashboardApp.jsx`
