import { precacheAndRoute, cleanupOutdatedCaches, createHandlerBoundToURL } from "workbox-precaching";
import { registerRoute, NavigationRoute } from "workbox-routing";
import { CacheFirst } from "workbox-strategies";
import { ExpirationPlugin } from "workbox-expiration";

/*
  Hand-written (injectManifest, not generateSW) so /api/guide can fall back to
  its last cached copy on a bad HTTP status, not just on a thrown network
  error (architecture 5.5). Workbox's built-in strategies only treat a thrown
  fetch() error as "the network failed" - a resolved 4xx/5xx response looks
  like a normal success to them, so out of the box a guide that starts
  erroring server-side (even briefly, e.g. mid-deploy) would still overwrite
  or bypass the last-known-good copy instead of falling back to it, showing
  the guest a scary error over content that was working a moment ago.
*/

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") self.skipWaiting();
});

precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

registerRoute(
  new NavigationRoute(createHandlerBoundToURL("index.html"), {
    denylist: [/^\/api\//, /^\/photos\//],
  }),
);

const GUIDE_CACHE = "guide-content";
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

function freshEnough(cached) {
  const date = cached.headers.get("date");
  return !date || Date.now() - new Date(date).getTime() < MAX_AGE_MS;
}

registerRoute(
  ({ url, sameOrigin }) => sameOrigin && url.pathname === "/api/guide",
  async ({ event }) => {
    const cache = await caches.open(GUIDE_CACHE);
    try {
      const response = await fetch(event.request);
      if (response.ok) {
        cache.put(event.request, response.clone());
        return response;
      }
      const cached = await cache.match(event.request);
      return cached && freshEnough(cached) ? cached : response;
    } catch {
      const cached = await cache.match(event.request);
      if (cached && freshEnough(cached)) return cached;
      throw new Error("Offline, and no cached guide to fall back to.");
    }
  },
  "GET",
);

registerRoute(
  ({ url, sameOrigin }) => sameOrigin && url.pathname.startsWith("/photos/"),
  new CacheFirst({
    cacheName: "guide-photos",
    plugins: [new ExpirationPlugin({ maxEntries: 60, maxAgeSeconds: 60 * 60 * 24 * 30 })],
  }),
  "GET",
);
