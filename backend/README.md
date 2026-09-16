# Backend

Cloudflare Worker: Hono, TypeScript, D1, R2, Cloudflare Access. Implements
`VILLOGUIDES_ARCHITECTURE.md` section 9 (API), section 7 (system design), and
section 8.1 (data model).

## Status

Phase 4 complete: the client dashboard's export endpoint (a real ZIP, built
with `fflate`), plus a bug fix so the dashboard shows a guide's actual
published content rather than an in-progress draft. See `PHASE4_NOTES.md`
for details and how it was tested, `PHASE3_NOTES.md` and `PHASE2_DEPLOY.md`
for everything before it.

| Phase | What | State |
|---|---|---|
| 2 | Backend foundation: D1, models, hostname resolution, Access, studio API | Done |
| 3 | Intake submission, photo promotion, edge caching | Done |
| 4 | Client dashboard export, published-content correctness fix | Done |
| 5 | Rate limiting, cron jobs, automated Access app creation | Not started |

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
