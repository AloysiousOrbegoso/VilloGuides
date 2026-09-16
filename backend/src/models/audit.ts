import type { D1Database } from "@cloudflare/workers-types";
import { many, now, run, toJson } from "../db";

/** Every write in the studio and dashboard logs here (architecture 8.1 audit_log). */
export async function logActivity(
  db: D1Database,
  entry: { actor: string; action: string; guideId?: string | null; clientId?: string | null; detail?: unknown },
) {
  await run(
    db,
    `INSERT INTO audit_log (actor, action, guide_id, client_id, detail, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
    entry.actor, entry.action, entry.guideId ?? null, entry.clientId ?? null, toJson(entry.detail ?? {}), now(),
  );
}

export async function listActivity(db: D1Database) {
  const rows = await many<{
    id: number; actor: string; action: string; guide_id: string | null; client_id: string | null; detail: string; created_at: string;
  }>(db, `SELECT * FROM audit_log ORDER BY id DESC LIMIT 500`);

  // A couple of extra lookups for display names, done once rather than N+1 per row.
  const guideNames = new Map<string, string>();
  const clientNames = new Map<string, string>();
  for (const r of rows) {
    if (r.guide_id && !guideNames.has(r.guide_id)) {
      const g = await db.prepare(`SELECT draft FROM guides WHERE id = ?`).bind(r.guide_id).first<{ draft: string }>();
      if (g) guideNames.set(r.guide_id, JSON.parse(g.draft || "{}")?.property?.name ?? "");
    }
    if (r.client_id && !clientNames.has(r.client_id)) {
      const c = await db.prepare(`SELECT name FROM clients WHERE id = ?`).bind(r.client_id).first<{ name: string }>();
      if (c) clientNames.set(r.client_id, c.name);
    }
  }

  return rows.map((r) => ({
    ...r,
    detail: JSON.parse(r.detail || "{}"),
    guide_name: r.guide_id ? guideNames.get(r.guide_id) ?? null : null,
    client_name: r.client_id ? clientNames.get(r.client_id) ?? null : null,
  }));
}
