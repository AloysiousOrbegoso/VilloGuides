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
      // Hand-written service worker (src/sw.js), not the declarative
      // generateSW config: the /api/guide route needs custom fallback logic
      // generateSW's built-in strategies can't express (see src/sw.js).
      strategies: "injectManifest",
      srcDir: "src",
      filename: "sw.js",
      injectManifest: {
        globPatterns: ["**/*.{js,css,html,svg,woff,woff2}"],
      },
    }),
  ],
  server: { port: 5173 },
});
