# Offline service worker: what changed and why

Backfills a gap flagged earlier: the frontend build never actually added
the offline service worker the architecture calls for (section 6.1: "Offline
guides | Service worker (vite-plugin-pwa) scoped to guide hostnames",
section 5.5: "Offline | Service worker caches the guide after first load").
Not a "Later" item, this was already supposed to be part of the original
build and got missed.

## Files changed

- `frontend/vite.config.js`: adds the `VitePWA` plugin.
- `frontend/src/lib/registerServiceWorker.js`: new. Decides whether to
  register at all.
- `frontend/src/App.jsx`: calls the register function once the area is
  known, and was restructured slightly (see "a real bug" below).
- `frontend/package.json`: adds `vite-plugin-pwa` as a devDependency.

To apply: drop these four files into your local copy at the same paths,
then `npm install` (needed once, to pull in `vite-plugin-pwa`).

## How it's scoped

Registration only happens for `guide` and `demo` areas. Studio, dashboards,
the brand page, and the intake form call the same function (every area
shares one `App.jsx`), but it's a no-op for them. Nothing there benefits
from offline caching, and stale cached data in an authenticated area is a
real risk this app has no reason to take on.

Two caching rules beyond the app shell itself:

- `/api/guide`: stale-while-revalidate. A returning guest sees the
  last-known content instantly, then gets the latest the moment a network
  response comes back.
- `/photos/*`: cache-first. Safe because every photo filename is a random
  UUID that's never reused (see `backend/src/services/storage.ts`), so a
  cached filename never goes stale.

## Two real bugs found while testing this, not just typos

Both of these produced code that looked completely reasonable, passed
lint, and built without a single warning. Neither showed up until I
actually opened a browser and checked.

**The service worker never registered at all, on any page.** The
registration code waited for the window's `load` event before running.
Since it runs inside a React effect, which fires after the component
mounts, the `load` event had often already happened by the time the
listener was attached, so the callback simply never fired. Fixed by
checking `document.readyState` first and registering immediately if the
page has already finished loading.

**Even after that fix, reloading offline failed outright** with
`ERR_INTERNET_DISCONNECTED` instead of showing the cached page. The
`workbox` config told the service worker which URL to fall back to when
offline (`navigateFallback: "index.html"`), but `index.html` itself was
never actually being precached, since the `globPatterns` list controlling
what gets precached didn't include the `html` extension. A fallback to a
file that was never cached has nothing to serve. Added `html` to the glob
patterns.

**A third thing, not a bug but worth explaining:** the original
`App.jsx` called the new registration effect after two early `return`
statements (one for "still figuring out this hostname," one for "unknown
guide, show not-found"). That's a React Rules of Hooks violation: a hook
placed after a conditional early return gets skipped on some renders and
called on others, which corrupts React's internal hook bookkeeping across
re-renders. ESLint's `react-hooks/rules-of-hooks` would have caught this
immediately (it's part of the project's lint config), but I'm noting it
here since it's a reminder that this pattern comes up easily in this
component: computing values needed by a hook has to happen before any
early return, not woven in between the returns for narrative convenience.
`App.jsx` now computes the resolved area fully, calls all its hooks, and
only then does its early returns.

## What I actually tested, and one honest limit on that testing

Built the frontend and, using a real headless Chrome instance:

- Confirmed `dist/sw.js` is generated and contains both caching rules by
  name (`guide-content`, `guide-photos`) and strategy
  (`StaleWhileRevalidate`, `CacheFirst`).
- Confirmed a service worker registers and becomes active on `/demo` and
  on a guide path (`/g/mangogrove`), and registers nothing at all on the
  brand page, a client dashboard path, and the intake form.
- Inspected Cache Storage directly after a first visit and confirmed
  `index.html` and every built JS/CSS file were precached.
- Took the demo fully offline (simulated network disconnection) and
  reloaded: the page rendered the same title and the same content as it
  did online, proving the offline fallback actually works end to end, not
  just that the config looks right.

One thing I did not verify end to end: the `/api/guide` stale-while-revalidate
rule specifically, against a real backend response. The frontend's local
preview server has no backend behind it, so exercising that exact rule
would need the Worker running alongside it with hostname routing wired
between the two, which is a heavier setup than this check justified given
the rule itself is a standard, well-documented Workbox strategy correctly
targeting the right URL. Worth a real check the first time you use "Add to
Home Screen" on a phone against the live site, since that's the actual
target environment this was built for.
