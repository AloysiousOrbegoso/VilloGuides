# VilloGuides

Branded, mobile-friendly digital guidebooks for rental properties. Each property's guide lives at its own subdomain and is shared with guests through a link or QR code. No app and no guest login.

This repository follows `VILLOGUIDES_ARCHITECTURE.md`. Section numbers in code comments refer to that document.

## Status

Phase 1 is complete: the whole frontend runs on mock data held in the browser. `backend/` is empty and is filled in from Phase 2 onward.

| Phase | What | State |
|---|---|---|
| 0 | Project setup, fonts, tokens | Done |
| 1 | Frontend on mock data | Done |
| 2 | Backend foundation: D1, models, Access | Not started |
| 3 | Intake and publishing APIs | Not started |
| 4 | Client dashboards | Not started |
| 5 | Hardening and launch | Not started |

## Rules for anyone working here

1. Never push to any GitHub repository. Commits and pushes are handled by the owner.
2. No emojis anywhere in UI, content, or code comments.
3. No em-dashes in any written UI copy or generated content.
4. When a decision in the architecture is unclear, stop and ask. Do not guess.

## Running it

```bash
cd frontend
npm install
npm run dev      # http://localhost:5173
npm run build
npm run preview
npm run lint
```

## Local development routing

Subdomains are awkward on localhost, so each area also has a path prefix. `src/lib/hostname.js` resolves both.

| Area | Production | Development |
|---|---|---|
| Brand page | `villoguides.com` | `/` |
| Privacy, terms, report | `villoguides.com/privacy` | `/privacy`, `/terms`, `/report` |
| Studio | `studio.villoguides.com` | `/studio` |
| Client dashboard | `sunbay.villoguides.com` | `/d/sunbay` |
| Intake form | `forms.villoguides.com/abc123` | `/forms/abc123` |
| Guide | `casaluna.villoguides.com` | `/g/casaluna` |
| Demo | `demo.villoguides.com` | `/demo` |

## Mock data

`VITE_API_MODE=mock` (the default) serves everything from `src/data/mock`. The database is seeded on first load and then saved to `localStorage` under `vg-mock-db-v1`, so edits survive a reload. Studio, Settings, Reset mock data puts it back.

Things worth trying:

- `/studio` review queue has three submissions waiting.
- `/studio/guides/g_casaluna` is a guide with a lockbox code in its check-in steps, so the door-code warning has something to catch. Mark it as paid, then publish, and it appears at `/g/casaluna`.
- `/d/sunbay` is a company dashboard with two published guides. `/d/anasoriano` is a single-property owner who bought the dashboard add-on. `/d/delacruz` has no dashboard yet.
- `/forms/p3m7r2d9` is an unstarted intake form. `/forms/k8f2x9q7` is one already submitted.

To see the dashboard as support staff rather than an admin, run `sessionStorage.setItem("vg-mock-role", "support")` in the console and reload.

Everything in the mock data is fictional. Places are real landmarks so the map links open somewhere sensible.

## Switching to the live API

Set `VITE_API_MODE=live` in `.env`. `src/lib/api.js` then calls the Worker endpoints from architecture section 9 instead of the mock. No component changes: both implementations expose the same function names and return shapes.

In development with path routing every request goes to localhost, so `api.js` sends the intended hostname in an `X-Villo-Dev-Host` header. The Worker must only honour it when `DEV_IDENTITY` is set.

## Structure

```
frontend/src/
├── components/
│   ├── pages/            public areas: landing, legal, report, guide, demo, intake, coming soon
│   ├── studio-pages/     studio.villoguides.com, one file per screen
│   ├── dashboard-pages/  {client}.villoguides.com
│   ├── sections/
│   │   ├── studio/       sidebar, header, tables, and the editor pieces
│   │   ├── dashboard/    top bar, directory, notes, share kit
│   │   ├── intake/       one component per form step
│   │   ├── landing/      brand page sections
│   │   └── guide-blocks/ the nine block renderers, shared by every guide
│   ├── shell/            guide shells: mobile, desktop, phone frame, search, themes
│   └── ui/               buttons, fields, dialogs, tables, pills, toasts, icons
├── data/
│   ├── casaDeVista.js    demo guide content
│   └── mock/             seed data and the mock API
├── lib/                  hostname routing, schema, intake mapper, api, theme, helpers
├── guide.css             guide renderer styles, all scoped under .guide
└── index.css             design tokens, Tailwind theme, base layer
```

## How a guide is rendered

`GuideRoot` is the single entry point, used by the public guide, the demo, the studio preview, the intake preview, and the client dashboard. It hides empty sections, applies the property's theme, and picks the mobile or desktop shell.

Guide styles live in `guide.css` and are all scoped under `.guide`, and guide theme variables are set on `.guide[data-guide-theme]` rather than on the root element. That is what lets a guide render inside the studio without recolouring the studio around it.

## Notes

- There is no sign-in screen. Cloudflare Access guards `studio` and each client hostname, and the Worker verifies the identity.
- Published guides carry the property's own palette. VilloGuides branding appears only as a small footer credit.
- See `DESIGN.md` for the tokens, type scale, and the rules behind the interface.
