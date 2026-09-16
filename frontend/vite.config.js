import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// One SPA serves every area. src/lib/hostname.js decides what to render.
// In development, areas are reached by path prefix (see README, "Local development").
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { port: 5173 },
});
