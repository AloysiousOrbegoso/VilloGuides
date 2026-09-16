# Backend

Empty until Phase 2. It will hold the Cloudflare Worker described in `VILLOGUIDES_ARCHITECTURE.md`:

- Hono router on Cloudflare Workers, TypeScript
- D1 for data, R2 for photos, Cloudflare Access for sign-in
- Endpoints as listed in architecture section 9
- Structure as listed in architecture section 14

Until then the frontend runs on the mock API in `frontend/src/data/mock`, which mirrors the same endpoints.
