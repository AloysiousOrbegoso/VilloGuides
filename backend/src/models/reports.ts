import type { D1Database } from "@cloudflare/workers-types";
import { many, now, run } from "../db";

export async function createReport(db: D1Database, input: { guideSlug: string; reason: string; details?: string; email?: string }) {
  await run(
    db,
    `INSERT INTO reports (guide_slug, reason, details, email, created_at) VALUES (?, ?, ?, ?, ?)`,
    input.guideSlug, input.reason, input.details || null, input.email || null, now(),
  );
}

/** Used by the daily/weekly review the owner does by hand for now; no studio screen surfaces this yet. */
export async function listReports(db: D1Database) {
  return many(db, `SELECT * FROM reports ORDER BY created_at DESC`);
}
