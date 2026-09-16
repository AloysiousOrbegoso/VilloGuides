# Backend

Cloudflare Worker: Hono, TypeScript, D1, R2, Cloudflare Access. Implements
`VILLOGUIDES_ARCHITECTURE.md` section 9 (API), section 7 (system design), and
section 8.1 (data model).

## Status

Phase 5 complete: rate limits, Content Security Policy on guide pages, and
the four cron jobs from architecture 13.4. This was the last phase in the
architecture's own numbered build-out list. See `PHASE5_NOTES.md` for two
real bugs found and fixed while building it, and how everything was tested.
`PHASE2_DEPLOY.md` still covers initial account setup if you haven't done
that yet.

| Phase | What | State |
|---|---|---|
| 2 | Backend foundation: D1, models, hostname resolution, Access, studio API | Done |
| 3 | Intake submission, photo promotion, edge caching | Done |
| 4 | Client dashboard export, published-content correctness fix | Done |
| 5 | Rate limits, CSP, cron jobs | Done |

What's left is everything the architecture calls "Later" rather than a
numbered phase: Google sign-in for Access, online payments, a PIN-protected
private block for door codes, white-label domains, additional languages,
and automating per-client Access application creation (currently manual
and working). Also still open: the frontend's missing offline service
worker (flagged in `PHASE3_NOTES.md`), and an actual real-device pass,
which the architecture calls for by name and isn't something to check from
a backend session.

## Structure

Matches architecture section 14:

```
src/
├── index.ts              hostname router, mounts everything below
├── types.ts               Worker bindings and request context
├── db.ts                  D1 query helpers
├── routes/                one file per API area (architecture 9)
├── middleware/             Access verification, client resolution, CORS
├── models/                 one file per D1 table
├── validators/              Zod schemas for request bodies
├── services/                subdomains, storage, intake mapping, publish
migrations/                  ten .sql files, applied in order
```

## Local development

```bash
npm install
cp .dev.vars.example .dev.vars   # fill in your real email
npx wrangler d1 migrations apply villoguides --local
npx wrangler dev
```

Requests act as if signed in as `DEV_IDENTITY` from `.dev.vars`. Send an
`X-Villo-Dev-Identity` header to test the client dashboard as a different
staff email. Never set `DEV_IDENTITY` outside `.dev.vars`.

## Deploying

See `PHASE2_DEPLOY.md` for the full walkthrough: creating the D1 database and
R2 bucket, running migrations remotely, deploying, and locking the studio
down with Cloudflare Access.
