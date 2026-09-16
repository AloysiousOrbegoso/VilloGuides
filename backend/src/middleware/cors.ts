import { cors } from "hono/cors";

/**
 * Same-origin in production, since the API and the built frontend share a
 * hostname on the one Worker (architecture 6.3). Kept permissive for local
 * development, where Vite runs on a different port than wrangler dev.
 */
export const corsMiddleware = cors({
  origin: (origin) => origin ?? "*",
  credentials: true,
});
