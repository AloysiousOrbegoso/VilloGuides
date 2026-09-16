import type { D1Database } from "@cloudflare/workers-types";
import { many } from "../db";

export type SlugHistoryRow = { slug: string; guide_id: string; retired_at: string | null };

/** Retired slugs, for the guide-not-found and redirect logic in the public guide route. */
export async function findRetired(db: D1Database, slug: string) {
  const rows = await many<SlugHistoryRow>(db, `SELECT * FROM slug_history WHERE slug = ? AND retired_at IS NOT NULL`, slug);
  return rows[0] ?? null;
}
