import { Hono } from "hono";
import type { Bindings, Variables } from "../types";
import { one } from "../db";
import { findRetired } from "../models/slugs";
import { guideCacheHeaders } from "../services/cache";

/**
 * {property}.villoguides.com (architecture 9.4). Public, no login, never
 * indexed. TODO (Phase 5): rate limiting on /api/report.
 */
export const guide = new Hono<{ Bindings: Bindings; Variables: Variables }>();

guide.get("/api/guide", async (c) => {
  const slug = c.req.header("X-Villo-Dev-Host") || new URL(c.req.url).hostname.split(".")[0];

  // Architecture 7.3: cached at the edge for 60 seconds, purged on publish
  // (see purgeGuideCache, called from publishGuide/unpublishGuide/
  // suspendGuide/renameGuide/restoreVersion in models/guides.ts). Keyed by
  // the resolved slug rather than the raw request URL, so it matches
  // purgeGuideCache's key exactly and stays correct under development's
  // path-based routing, where every request otherwise shares one literal
  // localhost URL regardless of which guide it is actually for.
  const cache = caches.default;
  const cacheKey = new Request(`https://${slug}.${c.env.ROOT_DOMAIN}/api/guide`);
  const cached = await cache.match(cacheKey);
  if (cached) return cached;

  const row = await one<{ id: string; status: string; published_version: number | null }>(
    c.env.DB,
    `SELECT id, status, published_version FROM guides WHERE slug = ?`,
    slug,
  );
  if (!row) {
    const retired = await findRetired(c.env.DB, slug);
    if (retired) {
      const target = await one<{ slug: string }>(c.env.DB, `SELECT slug FROM guides WHERE id = ?`, retired.guide_id);
      if (target?.slug) return c.json({ state: "redirect", slug: target.slug });
    }
    return c.json({ error: "Not found." }, 404);
  }
  if (row.status !== "published" || !row.published_version) return c.json({ error: "Unavailable." }, 410);

  const version = await one<{ content: string }>(
    c.env.DB,
    `SELECT content FROM guide_versions WHERE guide_id = ? AND version = ?`,
    row.id, row.published_version,
  );
  const clientRow = await one<{ client_id: string }>(c.env.DB, `SELECT client_id FROM guides WHERE id = ?`, row.id);
  const client = clientRow ? await one<{ name: string }>(c.env.DB, `SELECT name FROM clients WHERE id = ?`, clientRow.client_id) : null;

  const response = c.json(
    { content: JSON.parse(version?.content ?? "{}"), managedBy: client?.name ?? "" },
    200,
    guideCacheHeaders(),
  );
  c.executionCtx.waitUntil(cache.put(cacheKey, response.clone()));
  return response;
});
