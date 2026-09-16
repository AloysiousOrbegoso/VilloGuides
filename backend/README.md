# Backend

Cloudflare Worker: Hono, TypeScript, D1, R2, Cloudflare Access. Implements
`VILLOGUIDES_ARCHITECTURE.md` section 9 (API), section 7 (system design), and
section 8.1 (data model).

## Status

Phase 2 complete: D1 migrations and models, hostname resolution, Access
verification with a dev bypass, and the full studio API. See
`PHASE2_DEPLOY.md` for exact commands to get this running on your Cloudflare
account.

| Phase | What | State |
|---|---|---|
| 2 | Backend foundation: D1, models, hostname resolution, Access, studio API | Done |
| 3 | Intake submission mapping, scoped photo serving, edge caching | Not started |
| 4 | Client dashboard: export endpoint | Not started |
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
