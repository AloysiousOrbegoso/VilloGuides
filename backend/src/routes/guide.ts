import { Hono } from "hono";
import type { Context } from "hono";
import type { Bindings, Variables } from "../types";
import { one } from "../db";
import { findRetired } from "../models/slugs";
import { guideCacheHeaders } from "../services/cache";
import { redactPrivateBlocks, findPrivateBlock } from "../services/privateBlocks";
import { rateLimit, clientIp } from "../middleware/rateLimit";

/**
 * {property}.villoguides.com (architecture 9.4). Public, no login, never
 * indexed.
 */
export const guide = new Hono<{ Bindings: Bindings; Variables: Variables }>();

/**
 * A guide's slug is always the hostname's first label, whether the request
 * arrived on {slug}.villoguides.com or, for a client with a white-label
 * custom domain (architecture 11.3), {slug}.{their domain}: guide slugs
 * never contain a dot, so this needs no separate custom-domain handling.
 * Always split, even for the dev-only header, so it behaves the same way
 * whether that header carries a bare label (the normal case) or a full
 * hostname (custom-domain testing).
 */
function resolveSlug(c: Context<{ Bindings: Bindings; Variables: Variables }>) {
  const hostname = c.req.header("X-Villo-Dev-Host") || new URL(c.req.url).hostname;
  return hostname.split(".")[0];
}

guide.get("/api/guide", async (c) => {
  const slug = resolveSlug(c);

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
    // Redacted before the response is built, and therefore before it's
    // cached below, so a cached response is never the unredacted one either.
    { content: redactPrivateBlocks(JSON.parse(version?.content ?? "{}")), managedBy: client?.name ?? "" },
    200,
    guideCacheHeaders(),
  );
  c.executionCtx.waitUntil(cache.put(cacheKey, response.clone()));
  return response;
});

/**
 * Reveals one private block's body after a correct PIN. Keyed by the
 * resolved slug rather than a database id: it's synchronous, avoids a DB
 * read before the rate check even runs, and is exactly as guide-specific
 * as a real id would be, since the slug is what routing already scoped
 * this request to.
 */
guide.post(
  "/api/guide/unlock",
  rateLimit((env) => env.RL_UNLOCK, (c) => `unlock:${resolveSlug(c)}:${clientIp(c)}`),
  async (c) => {
    const slug = resolveSlug(c);
    const generic = () => c.json({ error: "Incorrect PIN." }, 400);

    let body: { blockId?: string; pin?: string };
    try {
      body = await c.req.json();
    } catch {
      return generic();
    }
    if (!body.blockId || !body.pin) return generic();

    const row = await one<{ id: string; status: string; published_version: number | null }>(
      c.env.DB,
      `SELECT id, status, published_version FROM guides WHERE slug = ?`,
      slug,
    );
    if (!row || row.status !== "published" || !row.published_version) return generic();

    const version = await one<{ content: string }>(
      c.env.DB,
      `SELECT content FROM guide_versions WHERE guide_id = ? AND version = ?`,
      row.id, row.published_version,
    );
    const block = findPrivateBlock(JSON.parse(version?.content ?? "{}"), body.blockId);
    // Same generic failure whether the block doesn't exist or the PIN is
    // wrong, so neither response tells an attacker which one it was.
    if (!block || block.pin !== body.pin) return generic();

    return c.json({ body: block.body });
  },
);
