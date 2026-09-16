import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

// One SPA serves every area. src/lib/hostname.js decides what to render.
// In development, areas are reached by path prefix (see README, "Local development").
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      // Registration is manual, in src/lib/registerServiceWorker.js, and only
      // ever runs on guide and demo hostnames (architecture 6.1, 5.5). Studio,
      // dashboards, the brand page, and the intake form never register one:
      // there is nothing there offline caching should help with, and stale
      // cached data in an authenticated area is a real risk this app should
      // not take on for no benefit.
      injectRegister: false,
      manifest: false, // public/manifest.webmanifest is hand-written and already linked from index.html
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,woff,woff2}"],
        // Serves the cached app shell for any offline navigation, so a
        // returning guest's reload still renders the app instead of the
        // browser's own connection-error page. Denylist keeps that fallback
        // from ever swallowing the two dynamic routes below, which have
        // their own explicit caching rules instead.
        navigateFallback: "index.html",
        navigateFallbackDenylist: [/^\/api\//, /^\/photos\//],
        runtimeCaching: [
          {
            // Architecture 5.5: "Offline: Service worker caches the guide
            // after first load." Stale-while-revalidate so a returning
            // guest sees the last-known content instantly, then gets the
            // latest the moment a network response comes back.
            urlPattern: ({ url, sameOrigin }) => sameOrigin && url.pathname === "/api/guide",
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "guide-content",
              expiration: { maxEntries: 1, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
          {
            // Photos are immutable per filename: a replacement upload always
            // gets a new random UUID (see backend/src/services/storage.ts),
            // so a filename that is already cached never needs re-fetching.
            urlPattern: ({ url, sameOrigin }) => sameOrigin && url.pathname.startsWith("/photos/"),
            handler: "CacheFirst",
            options: {
              cacheName: "guide-photos",
              expiration: { maxEntries: 60, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
        ],
      },
    }),
  ],
  server: { port: 5173 },
});
