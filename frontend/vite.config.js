import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// One SPA serves every area. src/lib/hostname.js decides what to render,
// from the hostname in production and a path prefix in development
// (architecture section 14.1).
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { port: 5173 },
});
