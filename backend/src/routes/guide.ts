import { Hono } from "hono";
import type { Bindings, Variables } from "../types";
import { one } from "../db";
import { findRetired } from "../models/slugs";

/**
 * {property}.villoguides.com (architecture 9.4). Public, no login, never
 * indexed. TODO (Phase 3): edge caching (architecture 7.3), photo serving
 * scoped to this guide only, and the report endpoint's rate limit.
 */
export const guide = new Hono<{ Bindings: Bindings; Variables: Variables }>();

guide.get("/api/guide", async (c) => {
  const slug = c.req.header("X-Villo-Dev-Host") || new URL(c.req.url).hostname.split(".")[0];
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
  return c.json({ content: JSON.parse(version?.content ?? "{}"), managedBy: client?.name ?? "" });
});
