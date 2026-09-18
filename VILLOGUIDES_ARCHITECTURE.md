# VilloGuides Architecture

**Status:** v1.1, consolidated
**Date:** September 15, 2026
**Domain:** `villoguides.com` (to be purchased)
**Supersedes:** `ARCHITECTURE.md`, `DOMAIN_LAYOUT.md` (v1 to v4), and the stack and structure decisions made in planning. `DEMO_ARCHITECTURE.md` remains the reference for the Casa de Vista demo build.

### Rules for anyone building from this document

1. Never push to any GitHub repository. Commits and pushes are handled by the owner.
2. No emojis anywhere in UI, content, or code comments.
3. No em-dashes in any written UI copy or generated content.
4. When a decision here is unclear, stop and ask. Do not guess.

---

## 1. Product Overview

VilloGuides builds branded, mobile-friendly digital guidebooks for rental properties. Each property's guide lives at its own subdomain and is shared with guests through a link or QR code. No app and no guest login.

**How it works:**

1. The property owner fills out a private intake form.
2. A draft guide is generated automatically from the answers.
3. The owner of VilloGuides reviews, polishes, and publishes it from a private studio.
4. The guide goes live at `{property}.villoguides.com`.
5. Clients manage and share their guides from their own dashboard at `{client}.villoguides.com`.

**Roles:**

| Role | Who | Where they work |
|---|---|---|
| Studio owner | You (the VilloGuides operator) | `studio.villoguides.com`, never accessible to anyone else |
| Client admin | A company manager or an individual owner | Their own `{client}.villoguides.com` dashboard |
| Client support | A client's support staff | Same dashboard, view and share only |
| Property owner | Whoever supplies property details | `forms.villoguides.com/{token}`, no account |
| Guest | Renters | `{property}.villoguides.com`, public, no login |

**Non-goals for v1:** online checkout, booking platform integrations, automatic translation, AI chat, native mobile apps.

---

## 2. Business Model and Pricing

| Item | Price | Notes |
|---|---|---|
| Guide per property | $15 USD (approx. ₱850), one-time | Covers build, review, publishing, unlimited updates, and hosting for as long as the service runs |
| Client dashboard, 2 or more properties | Included | Created automatically once a client has 2 paid guides |
| Client dashboard, single property | $5 USD one-time add-on | Optional. Without it, a single-property owner receives links and QR codes only |
| White-label custom domain | Paid add-on, $10 USD one-time | See §11.3 |

**Who pays:** a company or an individual owner. Both are "clients" in the system.

**Payment collection (v1): manual.** Clients pay by bank transfer, GCash, or similar. You mark the guide as paid in the studio before publishing. Any client-facing payment screen shows the "coming soon" page (§5.7) with a contact link. An online payment gateway (e.g. PayMongo or Lemon Squeezy) can be added later without changing anything else in this architecture.

**Wording rule:** say "hosting included for as long as the service runs," not "lifetime."

---

## 3. Brand and Design System

### 3.1 Brand assets

- **Logo:** a small sailboat mark (mast, sail, hull, maroon flag, pale moon/sun dot) plus a serif "Villo Guides" wordmark. Supplied as a square icon and a horizontal lockup.
- **Status:** final logo files will be swapped in later. Until then, components use a placeholder mark inside a fixed-size icon slot (26px nav tile, 44px login tile) so the swap is a file replacement only.
- **Production note:** request a square mark with inner padding for favicons (16px to 32px), or pad it programmatically.

### 3.2 Palette (extracted from the logo)

| Name | Hex | Role |
|---|---|---|
| Charcoal | `#1E1E1E` | Navigation chrome, dark surfaces, primary text in light mode |
| Navy | `#032747` | Selected states, structural accents, icon tiles |
| Maroon | `#830000` | The single accent. Primary actions only |
| Off-white | `#E5E5EA` | Text on dark surfaces, neutral |
| Light grey | `#D9D9D9` | Background wash, lockup card color |
| Black | `#000000` | Wordmark only |

### 3.3 Light and dark mode tokens

Dark mode is a user preference (toggle in the dashboard and studio header), defaulting to the system setting. Implemented as CSS custom properties swapped through a `data-theme` attribute on the root element.

| Token | Light | Dark |
|---|---|---|
| `--bg` (canvas) | `#F4F4F2` | `#141414` |
| `--sidebar` (nav chrome) | `#1E1E1E` | `#101112` |
| `--card` | `#FFFFFF` | `#1D1D1D` |
| `--border` | `#E2E2DF` | `#2C2C2C` |
| `--text` | `#1E1E1E` | `#E5E5EA` |
| `--muted` | `#6B6B68` | `#9A9A97` |
| `--navy` | `#032747` | `#1C5A86` |
| `--accent` (maroon) | `#830000` | `#B33A3A` |
| `--on-accent` | `#F4E9E9` | `#F4E9E9` |
| `--field` (inputs) | `#FAFAF9` | `#232323` |
| `--pill` / `--pill-text` | `#F7E9E9` / `#830000` | `#3A2323` / `#E5A5A5` |

Navy and maroon are lightened in dark mode because the originals disappear against a dark canvas.

### 3.4 Typography

| Typeface | Use |
|---|---|
| **EB Garamond** | Brand moments: wordmark, marketing headlines, page titles on public pages, proposal headings |
| **Open Sans** | Everything else: studio and dashboard UI, body text, buttons, tables, forms |

Studio and dashboard UI use Open Sans only. EB Garamond stays reserved for brand and marketing moments so the two never compete. Both load from Google Fonts in the web app; TTF files are packaged in `VilloGuides_Brand_Fonts.zip` for documents.

### 3.5 Design principles

1. Quiet, dense, functional internal tools. No card clutter, no decorative color coding.
2. Maroon appears only where an action matters, the way the logo uses it only for the flag.
3. Studio uses a sidebar (daily, many sections). Client dashboard uses a top bar (occasional lookups, few sections).
4. Large tap targets and plain sentence-case copy. Buttons say exactly what happens.
5. No all-caps labels, no arrow-suffixed buttons, no numbered markers unless content is a real sequence.

### 3.6 Guide themes are separate

Published guides carry the **property's** branding (for example the Casa de Vista palette and its Daytime, Golden Hour, and Reef themes), not the VilloGuides palette. VilloGuides branding appears on guides only as a small footer credit.

---

## 4. Domain Map

All hostnames are one level deep, so one free wildcard certificate (`villoguides.com` plus `*.villoguides.com`) covers everything.

| Hostname | Purpose | Who | Access |
|---|---|---|---|
| `villoguides.com` | Brand page, legal pages, report form | Anyone | Public |
| `www.villoguides.com` | Redirects to `villoguides.com` | | Public |
| `studio.villoguides.com` | Private guidebook creator across all clients | **You only** | Cloudflare Access, your email only |
| `{client}.villoguides.com` | A client's dashboard of their published guides | That client's staff | Cloudflare Access, that client's emails only |
| `forms.villoguides.com` | Intake forms | Property owners | Private token link, no account |
| `{property}.villoguides.com` | Published guidebooks | Guests | Public |
| `demo.villoguides.com` | Sample guidebook (Casa de Vista) | Anyone | Public |
| Client's own domain (optional) | White-labeled dashboard and/or guides | Client staff and guests | See §11.3 |

**Temporary:** the demo currently runs at `https://demo-digital-guestbook.vercel.app/` and moves to `demo.villoguides.com` once the domain is live.

### 4.1 One shared namespace

Client subdomains and property subdomains share a single pool. The router resolves a hostname in this order:

1. Exact system hostname (`studio`, `forms`, `demo`, `www`, root)
2. A client record whose `subdomain` matches: serve the client dashboard
3. A guide whose current slug matches: serve the guide
4. A retired guide slug: 301 redirect to the current slug
5. Nothing matched: the "guide not found" page

Uniqueness is enforced across clients and guides together.

### 4.2 Subdomain rules

- Lowercase letters, digits, single hyphens: `^[a-z0-9](?:[a-z0-9]|-(?!-)){1,38}[a-z0-9]$`
- 3 to 40 characters
- Unique across all clients, all guides, and all retired slugs
- Not on the reserved list

### 4.3 Reserved subdomains

```
www studio forms demo media api admin app portal dashboard
mail email support help status docs blog login signup auth
account billing pay checkout test staging dev preview internal
villo villoguides villo-guides
```

`media`, `portal`, and `app` are unused but reserved in case they are needed later.

---

## 5. Surfaces and Features

### 5.1 `villoguides.com`: brand page

| Feature | What it does |
|---|---|
| One-page intro | What the service is, link to the demo, contact email |
| Privacy policy | Required: owner names, contacts, addresses, and photos are collected |
| Terms of use | Covers intake forms and published guides |
| Report a guide | Flag a guide with wrong or inappropriate content |

This page becomes the marketing page later without structural change. Copy source: the business proposal.

### 5.2 `studio.villoguides.com`: private creator (you only)

| Feature | What it does |
|---|---|
| Review queue | New and updated intake submissions with a phone preview alongside |
| All guides | Every guide across every client, filterable by status and client |
| Editor | Edit sections and blocks, reorder pages, swap photos, set theme, live preview in desktop and phone frames |
| Publish controls | Publish, unpublish, rename slug (old slug redirects forever), version history, restore |
| Payments | Mark a guide paid (method, amount, date, reference); mark a single-property dashboard add-on paid |
| Intake links | Create, send, track, resend, expire |
| Change requests | Requests submitted from client dashboards |
| Clients | Create clients, set subdomain, branding, dashboard eligibility, staff emails and roles |
| Settings | Template defaults, reserved subdomains, notification email |
| Activity log | Who changed what and when |

**No client at any tier can reach the studio.** It is a separate application behind its own Cloudflare Access policy, plus an application-level check that the verified identity is your email.

### 5.3 `{client}.villoguides.com`: client dashboard

Available to clients with 2 or more paid guides, or a single-property client who paid the dashboard add-on. Published guides only. No drafts, no editing.

| Feature | Admin | Support |
|---|---|---|
| Directory: search guides by property, owner, city, subdomain | Yes | Yes |
| Open guide as a guest sees it | Yes | Yes |
| Copy link and ready-made share message | Yes | Yes |
| Download QR code and printable sign | Yes | Yes |
| Internal notes per property (never public) | Yes | Yes |
| Request a change (goes to the studio) | Yes | Yes |
| Request guide removal (goes to the studio) | Yes | No |
| Request a new property (shows the payment "coming soon" page in v1) | Yes | No |
| Export all guide content and photos | Yes | No |
| Light / dark mode toggle | Yes | Yes |

Destructive actions (removal, renames) are requests, never direct actions. You action them from the studio.

**Same structure regardless of size.** A 20-property company and a 1-property owner get the identical setup. Only eligibility differs, per §2.

### 5.4 `forms.villoguides.com/{token}`: intake form

| Feature | What it does |
|---|---|
| Step-by-step form | Property basics, host, check-in/out, Wi-Fi, house rules, amenities, kitchen, nearby places, emergency, pet policy, sustainability, photos, branding preferences |
| Save and resume | Autosaves; the same link reopens progress |
| Mobile-first | Designed to be filled out on a phone |
| Photo compression | Resized to max 1600px WebP in the browser before upload |
| Live preview | Owner sees the guide take shape as they type |
| Validation | Required fields flagged before submit |
| Sensitive-info warning | Warns when something looks like a door or lockbox code |
| Consent checkbox | Agreement to the privacy policy |
| Updates | Same link reopens previous answers; resubmission returns to the review queue |
| Expiry | Links can be expired or regenerated from the studio |

Uploaded photos stay private until the guide is published.

### 5.5 `{property}.villoguides.com`: published guide

| Feature | What it does |
|---|---|
| Home | Cover photo, welcome, tile grid (mobile) or sidebar (desktop) |
| Sections | Up to 12 standard sections plus custom pages (see §8.3) |
| Search | Across every section |
| Tap actions | Copy Wi-Fi password, call or message host, open in Google Maps |
| Video | YouTube and Vimeo embeds by ID only |
| Themes | The property's own palette and theme variants |
| Add to home screen | Web app manifest |
| Offline | Service worker caches the guide after first load |
| Footer | "Managed by {client}", small VilloGuides credit, report link |
| Not indexed | `X-Robots-Tag: noindex` |

| State | Behavior |
|---|---|
| Published | Loads normally |
| Renamed | 301 to the new slug, so printed QR codes never break |
| Unknown | "This guide doesn't exist" page (§5.7, `notfound` variant) |
| Unpublished or suspended | "This guide is currently unavailable" |

Photos load from the guide's own hostname, e.g. `casaluna.villoguides.com/photos/cover.webp`. Each guide serves only its own published photos.

### 5.6 `demo.villoguides.com`: sample guide

The Casa de Vista demo, built per `DEMO_ARCHITECTURE.md`. Reserved slug. Later it is served by the same guide renderer as real guides, from seeded data.

### 5.7 Coming soon and not found page

One component, `ComingSoon.jsx`, with two variants:

| Variant | Where it appears | Message |
|---|---|---|
| `payment` | Any online payment step (v1 is manual) | "Online payments aren't live yet." with a Contact us button |
| `notfound` | Unknown subdomains | "This guide doesn't exist." with a Contact us button |

Left-aligned, light grey background, line-art icon (door or map) in navy with a maroon detail, EB Garamond heading, Open Sans body. No card, no shadow, no gradient.

---

## 6. Tech Stack

Everything runs on Cloudflare. The only recurring cost at launch is the domain.

### 6.1 Frontend

Conventions mirror the `toc-construction` repository (React, Vite, Tailwind, plain JSX).

| Piece | Choice |
|---|---|
| Framework | React 18 |
| Build | Vite 5 with `@vitejs/plugin-react` |
| Language | JavaScript (`.jsx`), no TypeScript |
| Routing | `react-router-dom` v6 |
| Styling | Tailwind CSS v4 via `@tailwindcss/vite`, plus CSS custom properties for theme tokens |
| State | React built-ins (`useState`, `useContext`, `useReducer`) |
| Data fetching | Native `fetch` wrapped in `src/lib/api.js` |
| Fonts | EB Garamond and Open Sans from Google Fonts |
| Icons | Tabler outline webfont for guides and UI; inline SVG for brand marks |
| QR codes | `qrcode.react` |
| Image compression | `browser-image-compression` |
| Offline guides | Service worker (`vite-plugin-pwa`) scoped to guide hostnames |
| Linting | ESLint (`eslint.config.js`) |

There is no login UI. Cloudflare Access shows its own sign-in screen for the studio and client dashboards.

### 6.2 Backend

| Piece | Choice |
|---|---|
| Runtime | Cloudflare Workers |
| Router | Hono |
| Language | TypeScript |
| Validation | Zod (shares the `GuideContent` schema shape) |
| Database | Cloudflare D1 (SQLite) |
| Migrations | Wrangler D1 migrations, plain `.sql` files |
| File storage | Cloudflare R2, bound directly to the Worker |
| Auth | Cloudflare Access; the Worker verifies the `Cf-Access-Jwt-Assertion` header |
| Email | Resend (or similar HTTP email API); optional at launch |
| Scheduled jobs | Worker Cron Triggers |
| Testing | Vitest with `@cloudflare/vitest-pool-workers` |
| Local dev | `wrangler dev` |
| Deploy | `wrangler deploy` |

### 6.3 Infrastructure

| Piece | Choice | Cost |
|---|---|---|
| Domain | `villoguides.com`, nameservers on Cloudflare | Approx. $10 to $15 per year |
| DNS and SSL | Cloudflare Universal SSL (root plus wildcard) | Free |
| App hosting | One Worker serving the API and the built React app as static assets | Free tier: 100,000 requests per day |
| Database | D1 | Free tier: 5 GB, 5M rows read and 100k rows written per day |
| Photos | R2 | Free tier: 10 GB storage, no download fees |
| Login | Cloudflare Access (Zero Trust) | Free up to 50 users total |
| Email forwarding | Cloudflare Email Routing, `hello@villoguides.com` to a personal Gmail | Free |

**Why one Worker instead of Cloudflare Pages:** Pages custom domains do not support wildcard hostnames. A single Worker with a `*.villoguides.com/*` route serves both the API and the static React build, and decides what to render from the hostname.

Verify current free-tier limits before launch; providers change them.

### 6.4 Email

Three separate jobs, set up at different times.

| Job | How | When |
|---|---|---|
| Receiving mail at `hello@villoguides.com` | Cloudflare Email Routing, forwarded to the owner's personal Gmail | As soon as the domain is on Cloudflare |
| Replying as `hello@villoguides.com` | Gmail "Send mail as", using Gmail SMTP with an app password | Same time as the above |
| The app sending notifications | Resend or a similar HTTP email API, called from the Worker | Phase 5, optional at launch |

**Receiving.** Email Routing works only once `villoguides.com` uses Cloudflare nameservers. Enabling it adds the MX and TXT records automatically. Add the personal Gmail address as a destination, confirm the verification link Cloudflare sends to it, then add a rule forwarding `hello@villoguides.com` to it. Forwarded mail keeps the sender's original `From` address and gains an `X-Original-To` header, so Gmail can filter on the alias.

**Replying.** Email Routing is receive-only. Replying to a forwarded message without further setup sends from the personal Gmail address instead. To reply as `hello@villoguides.com`, add it in Gmail under Settings, Accounts and Import, "Send mail as", with:

- SMTP server `smtp.gmail.com`, port 587, TLS on
- The personal Gmail address as the username
- An app password from the Google account's Security settings, which requires two-factor authentication to be on
- "Treat as an alias" checked

Gmail then sends a confirmation to `hello@villoguides.com`, which arrives through the forwarding rule set up above.

**Known limit of this setup.** Some recipients see a "sent on behalf of" note next to the address, because the mail leaves through Gmail's servers rather than the domain's own. It is free and fine for a small volume of client mail. Removing the note means either Google Workspace, about $7 per user per month, or sending through a transactional provider.

**Notifications from the app** are a separate path and do not touch Gmail. The Worker calls the provider's API, and the domain needs SPF and DKIM records for that provider before it can send as `villoguides.com`. Keep notification mail on its own address, such as `notifications@villoguides.com`, so a deliverability problem there never affects mail to `hello@`.

**Order of operations:** buy the domain, point its nameservers at Cloudflare, enable Email Routing, then set up Gmail sending. None of it can be done before the domain is purchased.

---

## 7. System Design

### 7.1 Request routing

```
 Guest / client staff / you
            |
            v
 +---------------------------------------------+
 | Cloudflare edge                             |
 | DNS: @, www, *  (proxied)                   |
 | SSL: villoguides.com + *.villoguides.com    |
 | Access: studio.* and each {client}.*        |
 +---------------------+-----------------------+
                       |
                       v
 +---------------------------------------------+
 | Router Worker (Hono)                        |
 |                                             |
 |  /api/*  -> API handlers                    |
 |  /photos/* on guide hosts -> R2 (published) |
 |  everything else -> React build (SPA)       |
 +------+---------------------+----------------+
        |                     |
        v                     v
 +-------------+       +-------------+
 | D1          |       | R2          |
 | clients,    |       | guide and   |
 | guides,     |       | intake      |
 | versions,   |       | photos      |
 | intake,     |       +-------------+
 | notes, log  |
 +-------------+
```

The React app reads `window.location.hostname` (via `src/lib/hostname.js`) to choose which area to render: brand page, studio, client dashboard, intake form, guide, or demo. The Worker performs the authoritative lookup (§4.1) in its API responses.

### 7.2 Authentication and authorization

| Hostname | Access application | Allowed identities | App-level check |
|---|---|---|---|
| `studio.villoguides.com` | One app | Your email only | JWT email must equal `STUDIO_OWNER_EMAIL` |
| `{client}.villoguides.com` | One app per client | That client's staff emails (or their email domain) | JWT `aud` must equal the client's stored `access_aud`, and the email must exist in `client_users` for that client |
| `forms.villoguides.com` | None | Anyone with a valid token | Token must exist, not expired, not revoked |
| Guide hostnames, root, demo | None | Public | None |

- **Login method (v1):** one-time email code.
- **Later:** add Google sign-in as an additional Access login method. Additive only, no rebuild.
- **Client onboarding automation:** when you create a client with dashboard eligibility, the Worker calls the Cloudflare API to create that client's Access application and stores its `aud`. Until automated, this step is done in the Cloudflare dashboard.
- **Seat limit:** the free Zero Trust plan allows 50 users across the whole account (you plus every client's staff). Plan the upgrade before crossing it.
- Access cookies are issued per hostname, so a session on one client's subdomain never applies to another.

### 7.3 Caching and freshness

- Public guide data (`GET /api/guide`) is cached at the edge for 60 seconds and purged on publish.
- Published photos are served with long cache headers and immutable filenames.
- After a republish, guests see changes within about a minute.

---

## 8. Data Model

### 8.1 Tables (D1 / SQLite)

```sql
CREATE TABLE clients (
  id              TEXT PRIMARY KEY,
  name            TEXT NOT NULL,
  subdomain       TEXT UNIQUE NOT NULL,
  type            TEXT NOT NULL CHECK (type IN ('company','individual')),
  logo_key        TEXT,
  brand_color     TEXT,
  custom_domain   TEXT,
  plan            TEXT NOT NULL DEFAULT 'standard' CHECK (plan IN ('standard','whitelabel')),
  dashboard_addon_paid INTEGER NOT NULL DEFAULT 0,
  access_aud      TEXT,
  created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE client_users (
  id          TEXT PRIMARY KEY,
  client_id   TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  email       TEXT NOT NULL,
  role        TEXT NOT NULL CHECK (role IN ('admin','support')),
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (client_id, email)
);

CREATE TABLE guides (
  id                 TEXT PRIMARY KEY,
  client_id          TEXT NOT NULL REFERENCES clients(id),
  slug               TEXT UNIQUE,
  status             TEXT NOT NULL DEFAULT 'draft'
                     CHECK (status IN ('draft','in_review','published','unpublished','suspended')),
  draft              TEXT NOT NULL,
  published_version  INTEGER,
  published_at       TEXT,
  paid               INTEGER NOT NULL DEFAULT 0,
  payment_method     TEXT,
  payment_amount     INTEGER,
  payment_currency   TEXT,
  payment_reference  TEXT,
  paid_at            TEXT,
  owner_name         TEXT,
  city               TEXT,
  updated_at         TEXT NOT NULL DEFAULT (datetime('now')),
  created_at         TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_guides_client ON guides(client_id);
CREATE INDEX idx_guides_status ON guides(status);

CREATE TABLE guide_versions (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  guide_id    TEXT NOT NULL REFERENCES guides(id) ON DELETE CASCADE,
  version     INTEGER NOT NULL,
  content     TEXT NOT NULL,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (guide_id, version)
);

CREATE TABLE slug_history (
  slug        TEXT PRIMARY KEY,
  guide_id    TEXT NOT NULL REFERENCES guides(id),
  retired_at  TEXT
);

CREATE TABLE intake_links (
  token         TEXT PRIMARY KEY,
  guide_id      TEXT NOT NULL REFERENCES guides(id) ON DELETE CASCADE,
  status        TEXT NOT NULL DEFAULT 'sent'
                CHECK (status IN ('sent','in_progress','submitted','expired')),
  answers       TEXT,
  submitted_at  TEXT,
  expires_at    TEXT,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE guide_notes (
  id          TEXT PRIMARY KEY,
  guide_id    TEXT NOT NULL REFERENCES guides(id) ON DELETE CASCADE,
  author      TEXT NOT NULL,
  body        TEXT NOT NULL,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE change_requests (
  id          TEXT PRIMARY KEY,
  guide_id    TEXT REFERENCES guides(id),
  client_id   TEXT NOT NULL REFERENCES clients(id),
  type        TEXT NOT NULL CHECK (type IN ('edit','removal','new_property')),
  body        TEXT NOT NULL,
  requested_by TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','done','declined')),
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE audit_log (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  actor       TEXT NOT NULL,
  action      TEXT NOT NULL,
  guide_id    TEXT,
  client_id   TEXT,
  detail      TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
```

JSON columns (`draft`, `content`, `answers`, `detail`) store serialized JSON text.

**Dashboard eligibility** is derived, not stored: a client can use its dashboard when it has 2 or more guides with `paid = 1`, or when `dashboard_addon_paid = 1`.

### 8.2 `GuideContent` shape

Shared by the intake mapper, the studio editor, the public guide, and the demo. Validated with Zod on the backend.

```js
{
  schemaVersion: 1,
  property: { name, tagline, address, mapsUrl, coverImage },
  host: { name, photo, phone, messenger, email, bio },
  theme: { preset: "daytime" | "golden-hour" | "reef" | "custom", colors: { ... } },
  pages: [
    {
      id, type, title, icon,
      blocks: [ { type, ...fields } ]
    }
  ],
  places: [ { name, category, note, mapsUrl } ],
  emergency: { hospital, police, barangay, hostLine }
}
```

**Block types:** `text`, `steps`, `list`, `image`, `video`, `link`, `wifi`, `contact`, `map-link`.

**Limits:** 20 pages, 30 places, 25 images per guide, 100 KB of JSON per version.

**Schema changes:** bump `schemaVersion` and add a migration function applied when content is read.

### 8.3 Standard sections

| Section | Page type | Icon |
|---|---|---|
| Welcome | `welcome` | `home` |
| Meet Hosts | `host` | `users` |
| Check-In/Out | `steps` | `key` |
| Amenities | `list` | `sparkles` |
| WiFi | `wifi` | `wifi` |
| House Rules | `rules` | `list-check` |
| Kitchen | `steps` | cookware icon (to choose) |
| Explore | `places` | `map-pin` |
| Emergency | `emergency` | `alert-triangle` |
| Pet Policy | `rules` | `paw` |
| Sustainability | `text` | `leaf` |
| Contact | `contact` | `phone` |

Sections without content are omitted from the published guide automatically.

---

## 9. API

All endpoints live under `/api` on the hostname that uses them. Inputs are validated with Zod.

### 9.1 Studio (`studio.villoguides.com/api/studio/*`, you only)

| Method | Path | Purpose |
|---|---|---|
| GET | `/queue` | Submissions awaiting review |
| GET | `/guides` | All guides, filter by client and status |
| POST | `/guides` | Create a draft guide for a client |
| GET | `/guides/:id` | Load a guide |
| PUT | `/guides/:id/draft` | Save draft (autosave) |
| POST | `/guides/:id/publish` | Validate, version, publish, purge cache |
| POST | `/guides/:id/unpublish` | Take offline |
| POST | `/guides/:id/rename` | Change slug, keep the old one as a redirect |
| GET | `/guides/:id/versions` | Version history |
| POST | `/guides/:id/restore/:version` | Republish an older version |
| POST | `/guides/:id/payment` | Mark paid (method, amount, currency, reference) |
| GET | `/subdomains/:name/available` | Check across clients, guides, retired slugs, reserved list |
| POST | `/intake-links` | Create an intake link for a guide |
| POST | `/intake-links/:token/expire` | Expire a link |
| GET, POST, PUT | `/clients` | Manage clients, staff emails, roles, dashboard add-on |
| GET, PATCH | `/change-requests` | View and resolve client requests |
| POST | `/uploads/presign` | Presigned R2 upload for editor photos |
| GET | `/activity` | Audit log |

### 9.2 Client dashboard (`{client}.villoguides.com/api/dashboard/*`)

| Method | Path | Role | Purpose |
|---|---|---|---|
| GET | `/me` | Any | Current user, role, client info |
| GET | `/guides` | Any | This client's published guides |
| GET | `/guides/:id/qr` | Any | QR code and printable sign data |
| GET, POST | `/guides/:id/notes` | Any | Internal notes |
| POST | `/change-requests` | Any (removal and new property: admin only) | Submit a request |
| GET | `/export` | Admin | ZIP of all guide content and photos |

### 9.3 Intake (`forms.villoguides.com/api/intake/:token`, public with token)

| Method | Path | Purpose |
|---|---|---|
| GET | `/` | Load saved answers |
| PUT | `/` | Autosave answers |
| POST | `/uploads/presign` | Presigned upload to the private intake area |
| POST | `/submit` | Submit; generates or updates the draft and queues it for review |

### 9.4 Public guide (`{property}.villoguides.com`)

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/guide` | Published content for this hostname (cached 60s) |
| GET | `/photos/:key` | Published photos for this guide only |
| POST | `/api/report` | Report a guide (rate limited) |

---

## 10. Key Flows

### 10.1 New property, start to finish

1. You create (or select) a client in the studio and create a draft guide.
2. You generate an intake link and send it to the owner.
3. The owner fills the form on their phone; answers autosave.
4. On submit, the Worker maps answers into `GuideContent`, skips empty sections, and sets the guide to `in_review`.
5. The guide appears in your review queue. You edit and polish in the editor.
6. You record payment (manual) with "Mark as paid."
7. You choose or confirm the subdomain (availability checked across the shared namespace) and publish.
8. The guide is live at `{property}.villoguides.com`. The QR code and printable sign are generated client-side.
9. If the client now qualifies for a dashboard (§8.1), it becomes available at `{client}.villoguides.com`.

### 10.2 Publish

1. Confirm `paid = 1`.
2. Validate the draft against the schema.
3. Validate the slug (format, reserved list, uniqueness, retired slugs).
4. Insert a `guide_versions` row, update the guide's status and `published_version`, write `slug_history`, write `audit_log`.
5. Move referenced photos from the private intake area to the published area in R2.
6. Purge the edge cache for that guide.

### 10.3 Change request from a client

1. Client staff click "Request a change" on a guide and describe it.
2. A `change_requests` row is created and you get an email notification (if email is configured).
3. You make the edit in the studio and republish. The request is marked done.

### 10.4 Slug rename

1. The new slug is validated.
2. The old slug gets `retired_at` set in `slug_history` and redirects (301) forever.
3. Retired slugs are never reassigned, so an old printed QR code can never point to a different property.
4. Renames are limited (e.g. 3 per guide).

### 10.5 Guest visit

1. The request hits the Worker for `casaluna.villoguides.com`.
2. The React app loads and calls `/api/guide`.
3. The Worker resolves the hostname (§4.1) and returns published content from cache or D1.
4. The service worker caches the guide for offline use.

### 10.6 Onboarding a new client

1. Create the client in the studio with a subdomain (checked against the shared namespace).
2. Add staff emails and roles.
3. When the client becomes dashboard-eligible, create its Cloudflare Access application (automated through the Cloudflare API, or manually at first) and store the `aud`.
4. Add the client subdomain to the reserved set so no property can claim it.

---

## 11. Multi-Tenancy and White-Label

### 11.1 Model: hybrid (Model 3)

Every client gets a free subdomain on `villoguides.com`. Clients who want their own brand on links can upgrade to a custom domain. Both run on the same Worker, database, and storage. Onboarding a client is a data operation, never a new deployment.

### 11.2 Tenant isolation

- Every guide, note, user, and request references exactly one `client_id`.
- Isolation is enforced twice: at the edge (a separate Access application per client hostname) and in the Worker (every dashboard query filters by the client resolved from the hostname and verified JWT).
- The current employer company is simply the first client, not a special case in code.

### 11.3 White-label custom domains (paid add-on)

- Implemented with Cloudflare for SaaS custom hostnames. The client adds one DNS record; you register the hostname; Cloudflare issues and renews the certificate.
- Covers guides, the dashboard, or both, decided per client.
- Cost to you: 100 custom hostnames free, then $0.10 per hostname per month (verify current pricing).
- Extra work per client: DNS setup, verification, and troubleshooting. Price the add-on to cover that time.
- Price: $10 USD, one-time.
- If the add-on lapses, guides fall back to `{property}.villoguides.com` with redirects.

---

## 12. Security and Privacy

- **Studio lockdown:** separate Access policy for your email only, plus an application check on every studio request.
- **Per-client isolation:** separate Access application per client hostname; queries always scoped by `client_id`.
- **User content is never trusted:** text is escaped, links must be `http` or `https`, videos stored as provider plus ID from an allowlist.
- **Content Security Policy** on guide pages: scripts from own origin only, frames only YouTube and Vimeo, images from own origin.
- **Door codes:** guides are public to anyone with the link. The intake form and editor warn against putting door or lockbox codes in public sections. A PIN-protected private block is planned for a later phase.
- **Abuse:** publishing requires review and payment; every guide has a report link; you can suspend a guide instantly.
- **Uploads:** type allowlist (`image/webp`, `image/jpeg`, `image/png`), 1 MB max after compression, per-guide image limit, presigned URLs that expire.
- **Rate limits** on intake autosave, uploads, subdomain checks, and reports.
- **Indexing:** guides send `noindex`; the sitemap lists only the root brand page.
- **Personal data:** publish a privacy policy and terms before launch, and review obligations under the Philippine Data Privacy Act of 2012 (legal review recommended).
- **Account security:** two-factor authentication on the registrar and Cloudflare accounts, registrar transfer lock on, domain auto-renew on, and account emails you will always control. The Gmail account behind `hello@villoguides.com` holds the forwarded client mail and the app password used to send as the domain, so it needs two-factor authentication and recovery details you keep current.

---

## 13. Limits, Costs, and Upgrade Triggers

### 13.1 Launch cost

Only the domain, approximately $10 to $15 per year. Everything else fits free tiers.

### 13.2 What the free tiers support (approximate)

| Resource | Free limit | Practical meaning |
|---|---|---|
| Worker requests | 100,000 per day | About 9,000 guide views per day if each view loads about 10 photos |
| D1 storage | 5 GB | Hundreds of thousands of guides' text |
| D1 reads | 5M rows per day | Far beyond expected traffic if queries use indexes |
| R2 storage | 10 GB | About 6,500 guides at about 1.5 MB of compressed photos each |
| Access users | 50 total | You plus all client staff combined; the first limit likely to be reached |

When a D1 daily limit is exceeded, queries fail until the daily reset rather than creating a surprise bill. Index every lookup column (`slug`, `subdomain`, `client_id`).

### 13.3 Upgrade triggers

| Signal | Action |
|---|---|
| Worker requests near 100k per day | Workers Paid plan (about $5 per month) |
| More than 50 people need logins | Zero Trust paid seats, or move client dashboards to app-managed login (e.g. Google sign-in handled by the Worker) |
| R2 near 10 GB | Pay per GB, or tighten image limits |
| More than 100 white-label domains | $0.10 per extra hostname per month |

### 13.4 Backups and jobs

| Schedule | Job |
|---|---|
| Daily | Verify every published guide has a valid current version |
| Weekly | Delete orphaned photos in R2 |
| Weekly | Export D1 to a private backup location (D1 Time Travel also allows point-in-time restore) |
| Daily | Expire intake links past `expires_at` |

---

## 14. Project File Structure

Mirrors the `toc-construction` layout: `frontend/` and `backend/` side by side at the repository root.

```
villoguides/
├── README.md
├── frontend/
│   ├── public/
│   │   ├── favicon.svg
│   │   └── manifest.webmanifest
│   ├── src/
│   │   ├── assets/
│   │   │   ├── brand/                    logo files (placeholders until final logos arrive)
│   │   │   └── demo/                     Casa de Vista photos
│   │   ├── components/
│   │   │   ├── pages/                    public areas
│   │   │   │   ├── Landing.jsx           villoguides.com
│   │   │   │   ├── Legal.jsx             privacy and terms
│   │   │   │   ├── ReportGuide.jsx
│   │   │   │   ├── GuideView.jsx         {property}.villoguides.com
│   │   │   │   ├── IntakeForm.jsx        forms.villoguides.com/:token
│   │   │   │   ├── Demo.jsx              demo.villoguides.com
│   │   │   │   └── ComingSoon.jsx        payment and notfound variants
│   │   │   ├── studio-pages/             studio.villoguides.com (you only)
│   │   │   │   ├── ReviewQueue.jsx
│   │   │   │   ├── AllGuides.jsx
│   │   │   │   ├── Editor.jsx
│   │   │   │   ├── PublishPanel.jsx
│   │   │   │   ├── Payments.jsx
│   │   │   │   ├── IntakeLinks.jsx
│   │   │   │   ├── ChangeRequests.jsx
│   │   │   │   ├── Clients.jsx
│   │   │   │   ├── Activity.jsx
│   │   │   │   └── StudioSettings.jsx
│   │   │   ├── dashboard-pages/          {client}.villoguides.com
│   │   │   │   ├── Directory.jsx
│   │   │   │   ├── GuideDetail.jsx
│   │   │   │   ├── RequestChange.jsx
│   │   │   │   └── Export.jsx
│   │   │   ├── sections/
│   │   │   │   ├── studio/               Sidebar, HeaderBar, MetricCards, QueueTable
│   │   │   │   ├── dashboard/            TopBar, DirectoryTable, NotesPanel
│   │   │   │   ├── intake/               one component per form step
│   │   │   │   ├── landing/              Hero, HowItWorks, Pricing, Footer
│   │   │   │   └── guide-blocks/         shared guide renderer
│   │   │   │       ├── TextBlock.jsx
│   │   │   │       ├── StepsBlock.jsx
│   │   │   │       ├── ListBlock.jsx
│   │   │   │       ├── WifiBlock.jsx
│   │   │   │       ├── ImageBlock.jsx
│   │   │   │       ├── VideoBlock.jsx
│   │   │   │       ├── LinkBlock.jsx
│   │   │   │       ├── MapLinkBlock.jsx
│   │   │   │       └── ContactBlock.jsx
│   │   │   ├── shell/                    guide shells, reused from the demo
│   │   │   │   ├── MobileShell.jsx
│   │   │   │   ├── DesktopShell.jsx
│   │   │   │   ├── PhoneFrame.jsx
│   │   │   │   ├── ViewToggle.jsx
│   │   │   │   ├── SearchOverlay.jsx
│   │   │   │   └── ThemeSwitcher.jsx
│   │   │   └── ui/
│   │   │       ├── Button.jsx
│   │   │       ├── Pill.jsx
│   │   │       ├── ThemeToggle.jsx       light / dark for studio and dashboard
│   │   │       └── icons.jsx
│   │   ├── data/
│   │   │   ├── casaDeVista.js            demo content
│   │   │   └── mock/                     mock clients, guides, queue for Phase 1
│   │   ├── lib/
│   │   │   ├── api.js                    fetch wrapper; switches mock and live
│   │   │   ├── hostname.js               resolves which area to render
│   │   │   ├── theme.js                  light/dark tokens and persistence
│   │   │   ├── guideSchema.js            GuideContent defaults and helpers
│   │   │   └── intakeMapper.js           intake answers to GuideContent
│   │   ├── App.jsx
│   │   ├── index.css                     Tailwind import, font import, CSS tokens
│   │   └── main.jsx
│   ├── .env.example
│   ├── eslint.config.js
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
└── backend/
    ├── src/
    │   ├── index.ts                      Hono app, hostname router, static assets
    │   ├── routes/
    │   │   ├── studio.ts
    │   │   ├── dashboard.ts
    │   │   ├── intake.ts
    │   │   ├── guide.ts                  public guide and photos
    │   │   └── report.ts
    │   ├── middleware/
    │   │   ├── cors.ts
    │   │   ├── verifyAccess.ts           validates Cf-Access-Jwt-Assertion
    │   │   ├── requireStudioOwner.ts
    │   │   ├── resolveClient.ts          hostname to client, scopes queries
    │   │   └── rateLimit.ts
    │   ├── models/                       D1 query functions
    │   │   ├── clients.ts
    │   │   ├── clientUsers.ts
    │   │   ├── guides.ts
    │   │   ├── versions.ts
    │   │   ├── slugs.ts
    │   │   ├── intakeLinks.ts
    │   │   ├── notes.ts
    │   │   ├── changeRequests.ts
    │   │   └── audit.ts
    │   ├── validators/                   Zod schemas
    │   │   ├── guideContent.ts
    │   │   ├── intake.ts
    │   │   ├── client.ts
    │   │   └── payment.ts
    │   ├── services/
    │   │   ├── publish.ts
    │   │   ├── subdomains.ts             shared namespace and reserved list
    │   │   ├── storage.ts                R2 presign, move, cleanup
    │   │   ├── accessApi.ts              creates per-client Access apps
    │   │   └── email.ts
    │   └── cron.ts
    ├── migrations/
    │   ├── 0001_clients.sql
    │   ├── 0002_client_users.sql
    │   ├── 0003_guides.sql
    │   ├── 0004_guide_versions.sql
    │   ├── 0005_slug_history.sql
    │   ├── 0006_intake_links.sql
    │   ├── 0007_guide_notes.sql
    │   ├── 0008_change_requests.sql
    │   └── 0009_audit_log.sql
    ├── test/
    ├── wrangler.toml                     routes, D1, R2, cron, static assets
    ├── .dev.vars.example
    ├── package.json
    └── tsconfig.json
```

### 14.1 Local development routing

Subdomains are awkward on `localhost`, so `hostname.js` also accepts path prefixes in development:

| Area | Production | Development |
|---|---|---|
| Brand page | `villoguides.com` | `/` |
| Studio | `studio.villoguides.com` | `/studio` |
| Client dashboard | `sunbay.villoguides.com` | `/d/sunbay` |
| Intake form | `forms.villoguides.com/abc123` | `/forms/abc123` |
| Guide | `casaluna.villoguides.com` | `/g/casaluna` |
| Demo | `demo.villoguides.com` | `/demo` |

In development, Access is bypassed with a `DEV_IDENTITY` value in `.dev.vars`. Never set it in production.

---

## 15. Build Phases

Frontend first, so there is something to see before any backend exists.

### Phase 0: Setup
- Create `frontend/` (Vite, React, Tailwind v4, ESLint) and `backend/` (Wrangler, Hono, TypeScript).
- Add fonts, CSS tokens for light and dark mode, placeholder logo slots.
- Do not push to any remote repository.

### Phase 1: Frontend with mock data
- `hostname.js` and development path routing.
- Guide renderer and shells, reusing the Casa de Vista demo components.
- Studio screens: review queue, all guides, editor with live phone preview, payments, intake links, clients, change requests.
- Client dashboard: directory, guide detail, notes, request change, export (mock).
- Intake form: every step, autosave to local mock, live preview.
- Brand page, legal pages, `ComingSoon` in both variants.
- Light and dark mode toggle in studio and dashboard.
- Everything clickable with mock data from `src/data/mock/`.

### Phase 2: Backend foundation
- D1 migrations and models.
- Hostname resolution, shared namespace, reserved list.
- Access verification middleware and dev identity bypass.
- Swap `api.js` from mock to live for the studio.

### Phase 3: Intake and publishing
- Intake API, R2 presigned uploads, intake-to-guide mapping.
- Publish, unpublish, versions, restore, rename with redirects.
- Public guide API, photo serving, edge caching, service worker.

### Phase 4: Client dashboards
- Dashboard API scoped by client.
- Dashboard eligibility rules.
- Access application creation (manual first, then automated).
- Notes, change requests, export.

### Phase 5: Hardening and launch
- Rate limits, CSP, report and suspend.
- Cron jobs and backups.
- Deploy to `villoguides.com`, move the demo to `demo.villoguides.com`.
- Verify every interactive feature on real phones.

### Later
- Google sign-in for Access.
- Online payments.
- PIN-protected private block for door codes.
- White-label custom domains.
- Additional languages.

---

## 16. Open Items

| Item | Status |
|---|---|
| Purchase `villoguides.com` | Pending |
| Final logo files | Pending; placeholders in use |
| Studio editor, intake form, and brand page visual designs | To design; review queue, dashboard directory, and sign-in already designed |
| Kitchen section icon | To choose |
| White-label add-on price | Decided: $10 USD, one-time (see §11.3) |
| Refund policy wording | To decide; needed for terms |
| Privacy policy and terms | To draft; legal review recommended |
| Email provider for notifications | Optional at launch; see 6.4 |
| Google Workspace for `hello@` | Decide later; only needed to remove the "sent on behalf of" note |
| Plan for the 50-user Access limit | Decide before onboarding many client staff |
