# VilloGuides

Branded, mobile-friendly digital guidebooks for rental properties. Each property's guide lives at its own subdomain and is shared with guests through a link or QR code. No app and no guest login.

This is the project skeleton: folders and configuration matching `VILLOGUIDES_ARCHITECTURE.md` section 14, with stub files marking where each piece goes. Nothing is implemented yet. Section numbers in code comments refer to the architecture document.

## Rules for anyone working here

1. Never push to any GitHub repository. Commits and pushes are handled by the owner.
2. No emojis anywhere in UI, content, or code comments.
3. No em-dashes in any written UI copy or generated content.
4. When a decision in the architecture is unclear, stop and ask. Do not guess.

## Structure

```
villoguides/
├── VILLOGUIDES_ARCHITECTURE.md   the source of truth for every decision below
├── frontend/                     React 18, Vite 5, Tailwind v4, plain JSX
└── backend/                      Cloudflare Worker, Hono, TypeScript, D1, R2
```

See each folder's own file tree in architecture section 14. Every source file already exists as a one-line stub naming its job and the architecture section it implements, so the shape of the app is visible before any logic is written.

## Getting started

```bash
cd frontend && npm install && npm run dev     # http://localhost:5173
cd backend  && npm install && npm run dev     # wrangler dev, once Phase 2 starts
```

Neither app does anything yet. `frontend/.env.example` and `backend/.dev.vars.example` show the environment variables each side expects.

## Build phases

Matches architecture section 15.

| Phase | What |
|---|---|
| 0 | This commit: project setup, fonts, tokens, placeholder logo slots |
| 1 | Frontend with mock data, every screen clickable |
| 2 | Backend foundation: D1 migrations, models, Access verification |
| 3 | Intake and publishing APIs |
| 4 | Client dashboards |
| 5 | Hardening and launch |

## Local development routing

Subdomains are awkward on localhost, so each frontend area also has a path prefix (architecture 14.1):

| Area | Production | Development |
|---|---|---|
| Brand page | `villoguides.com` | `/` |
| Studio | `studio.villoguides.com` | `/studio` |
| Client dashboard | `sunbay.villoguides.com` | `/d/sunbay` |
| Intake form | `forms.villoguides.com/abc123` | `/forms/abc123` |
| Guide | `casaluna.villoguides.com` | `/g/casaluna` |
| Demo | `demo.villoguides.com` | `/demo` |
