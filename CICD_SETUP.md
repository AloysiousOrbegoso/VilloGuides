# CI/CD setup

Two workflows, both under `.github/workflows/`:

- **ci.yml** runs on every pull request and every push to a branch other than
  main. It lints and builds the frontend, type-checks the backend, and runs
  `wrangler deploy --dry-run`, which bundles the Worker exactly like a real
  deploy would without publishing anything. This is what would have caught
  the missing `hono`/`zod` installs before it ever reached a real deploy.
- **deploy.yml** runs on every push to `main`, plus a manual "Run workflow"
  button in the Actions tab. It builds the frontend, applies any new D1
  migrations, then deploys the Worker.

There is one pipeline, not two, because deploying the backend also deploys
the already-built frontend: they are served from the same Worker
(architecture 6.3).

## 1. Create a Cloudflare API token

1. Cloudflare dashboard, click your profile icon top right, My Profile, API
   Tokens.
2. Create Token.
3. Under Permission policies, choose the **Edit Cloudflare Workers**
   template.
4. Add one more permission row: **Account, D1, Edit**. The template alone
   covers deploying the Worker, but not running migrations.
5. Under Account Resources, scope it to your one account rather than leaving
   it open to "All accounts."
6. Continue to summary, Create Token, and copy the value shown. It is only
   shown once.

## 2. Find your account ID

Cloudflare dashboard, Workers & Pages, Overview. The account ID is in the
right sidebar. (It's also on the Overview page of the `villoguides.com`
zone itself, same sidebar.)

## 3. Add both as GitHub secrets

In your repository: Settings, Secrets and variables, Actions, New repository
secret.

- `CLOUDFLARE_API_TOKEN`: the token from step 1.
- `CLOUDFLARE_ACCOUNT_ID`: the ID from step 2.

Both workflows read these two secrets. Nothing else needs configuring.

## 4. Push it

Add `.github/workflows/` and the updated `backend/package.json` (it now has
a `typecheck` script) to the repository, commit, and push, same as any other
change; this part is yours to do, not something run on your behalf.

Once pushed:

- Any pull request or branch push runs `ci.yml` and shows pass/fail checks.
- A push to `main` runs `deploy.yml` and, if it succeeds, your change is
  live on `villoguides.com` within a couple of minutes.

## Notes

- `deploy.yml`'s migration step is safe to run on every deploy: Wrangler
  tracks which migrations have already run and only applies new ones.
- If you ever need to redeploy without a new commit, for example after
  changing something by hand in the dashboard, use the manual "Run workflow"
  button on `deploy.yml` in the Actions tab.
- The token from step 1 can deploy Workers and edit D1 on your account. Keep
  it only in GitHub secrets, never in a committed file.
