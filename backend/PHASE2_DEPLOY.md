# Phase 2 deploy guide

What Phase 2 covers: D1 migrations and models, hostname resolution, Access
verification with a dev bypass, and the studio fully off mock data. This
guide gets that running against your real Cloudflare account and
`villoguides.com`.

Run everything from inside `backend/`, in order. Each step only needs doing
once.

## 0. Prerequisite: the domain is on Cloudflare

Buying the domain is not the same as it being active on Cloudflare. Check the
Cloudflare dashboard: `villoguides.com` should already appear there as a site
with a status of Active, meaning its nameservers point at Cloudflare. If it
is not there yet, add it as a site first (Cloudflare will give you two
nameservers to set at your registrar) and wait for it to go active before
continuing. `wrangler deploy` in step 6 will fail with a zone error otherwise.

## 1. Install and log in

```bash
npm install
npx wrangler login
```

This opens a browser window to authorize Wrangler against your Cloudflare
account. Nothing is created yet.

## 2. Create the D1 database

```bash
npx wrangler d1 create villoguides
```

This prints a `database_id`. Open `wrangler.toml` and paste it in place of
`REPLACE_AFTER_WRANGLER_D1_CREATE`.

## 3. Run the migrations against it

```bash
npx wrangler d1 migrations apply villoguides --remote
```

This applies all ten files in `migrations/` in order and creates a bookkeeping
table so re-running this command later only applies new migrations. Confirm
it worked:

```bash
npx wrangler d1 execute villoguides --remote --command "SELECT name FROM sqlite_master WHERE type='table'"
```

You should see all ten tables: `clients`, `client_users`, `guides`,
`guide_versions`, `slug_history`, `intake_links`, `guide_notes`,
`change_requests`, `audit_log`, `settings`.

## 4. Create the R2 bucket

```bash
npx wrangler r2 bucket create villoguides-photos
```

`wrangler.toml` already points at this bucket name, so nothing else to
change here.

## 5. Set your real studio email

Open `wrangler.toml` and change:

```toml
STUDIO_OWNER_EMAIL = "owner@villoguides.com"
```

to the email you will actually sign in with. This is the second lock on the
studio (architecture 7.2): even if Access is ever misconfigured, the Worker
itself only accepts this one email.

## 6. Build the frontend and deploy

```bash
cd ../frontend
npm install
npm run build
cd ../backend
npx wrangler deploy
```

`wrangler.toml`'s `[assets]` block points at `../frontend/dist`, so the
frontend must be built before deploying. Deploying serves both the API and
the built frontend from the one Worker (architecture 6.3).

If this succeeds, `villoguides.com` and every `*.villoguides.com` subdomain
now route to your Worker. Nothing is locked down yet, so skip to step 7
before telling anyone the URL.

## 7. Lock the studio down with Cloudflare Access

This is the one step Wrangler cannot do; it happens in the dashboard
(architecture 7.2, and automating it later is listed as a "Later" item in
the architecture, not part of Phase 2).

1. Cloudflare dashboard, Zero Trust, Access, Applications.
2. Add an application, Self-hosted.
3. Application domain: `studio.villoguides.com`.
4. Session duration: whatever you're comfortable with, e.g. 24 hours.
5. Add a policy, Action: Allow, Include: Emails, and list only your own
   email, the same one you set as `STUDIO_OWNER_EMAIL` above.
6. Login method: one-time email code is enough for now (architecture 7.2 lists
   Google sign-in as a later, additive option).
7. Save.

Visit `studio.villoguides.com`. You should hit Access's own sign-in screen
first, then land in the studio after entering the emailed code.

## 8. Try the loop for real

Once in the studio:

1. Clients, New client, create yourself a test client.
2. Create a guide for it, add a Welcome page with some text.
3. Mark it as paid.
4. Give it a subdomain.
5. Publish.
6. Visit that subdomain directly, it should show the guide with no login.

If all six work, Phase 2 is fully live.

## Local development after this

`.dev.vars.example` shows what `wrangler dev` needs locally:

```bash
cp .dev.vars.example .dev.vars
```

Fill in your real email for both values. `DEV_IDENTITY` makes every request
act as if you had already signed in through Access, so the studio works
locally with no real Access session. `X-Villo-Dev-Identity` as a request
header overrides which email that dev session is, so the client dashboard
can be tested locally as different staff members without a real session for
each. Never set `DEV_IDENTITY` in `wrangler.toml` or in production.

For a local D1 database that mirrors the remote one:

```bash
npx wrangler d1 migrations apply villoguides --local
npx wrangler dev
```

`.dev.vars` is already listed in `.gitignore`, so it never gets committed.

## What Phase 2 does not include yet

- Intake form submission mapping into a guide (Phase 3).
- Photo serving scoped so a guide can only read its own photos, and edge
  caching for the public guide endpoint (Phase 3, architecture 7.3).
- The client dashboard's export endpoint (Phase 4).
- Rate limiting, and the automatic creation of each client's Access
  application from the studio (Phase 5, and architecture's "Later" list).

The photo upload and public guide read routes already work end to end for
manual testing, they just do not yet have the hardening those later phases
add.
