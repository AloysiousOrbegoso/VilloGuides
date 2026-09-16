import type { D1Database } from "@cloudflare/workers-types";
import type { Bindings } from "../types";
import { ApiError, many, newId, now, one, run } from "../db";
import { logActivity } from "./audit";
import { getGuide } from "./guides";

export type ChangeRequestRow = {
  id: string;
  guide_id: string | null;
  client_id: string;
  type: "edit" | "removal" | "new_property";
  body: string;
  requested_by: string;
  status: "open" | "done" | "declined";
  created_at: string;
};

/** All requests, for the studio's Change requests screen (architecture 5.2, 9.1). */
export async function listAllChangeRequests(env: Bindings) {
  const db = env.DB;
  const rows = await many<ChangeRequestRow>(db, `SELECT * FROM change_requests ORDER BY created_at DESC`);
  const out = [];
  for (const r of rows) {
    const guide = r.guide_id ? await getGuide(env, r.guide_id).catch(() => null) : null;
    const client = await one<{ id: string; name: string }>(db, `SELECT id, name FROM clients WHERE id = ?`, r.client_id);
    out.push({ ...r, guide, client });
  }
  return out;
}

/** Just one client's requests, for their dashboard (architecture 5.3). */
export async function listClientChangeRequests(db: D1Database, clientId: string) {
  const rows = await many<ChangeRequestRow>(db, `SELECT * FROM change_requests WHERE client_id = ? ORDER BY created_at DESC`, clientId);
  const out = [];
  for (const r of rows) {
    const guide = r.guide_id ? await db.prepare(`SELECT draft FROM guides WHERE id = ?`).bind(r.guide_id).first<{ draft: string }>() : null;
    out.push({ ...r, guide: guide ? { property_name: JSON.parse(guide.draft || "{}")?.property?.name } : null });
  }
  return out;
}

export async function createChangeRequest(
  db: D1Database,
  input: { clientId: string; guideId: string | null; type: "edit" | "removal" | "new_property"; body: string; requestedBy: string },
) {
  if (!input.body?.trim()) throw new ApiError("Describe what should change.");
  const id = newId("r");
  const ts = now();
  await run(
    db,
    `INSERT INTO change_requests (id, guide_id, client_id, type, body, requested_by, status, created_at) VALUES (?, ?, ?, ?, ?, ?, 'open', ?)`,
    id, input.guideId, input.clientId, input.type, input.body.trim(), input.requestedBy, ts,
  );
  await logActivity(db, { actor: input.requestedBy, action: "change_request.created", guideId: input.guideId, clientId: input.clientId, detail: { type: input.type } });
  return { id, guide_id: input.guideId, client_id: input.clientId, type: input.type, body: input.body.trim(), requested_by: input.requestedBy, status: "open", created_at: ts };
}

export async function updateChangeRequest(db: D1Database, id: string, status: "done" | "declined") {
  const r = await one<ChangeRequestRow>(db, `SELECT * FROM change_requests WHERE id = ?`, id);
  if (!r) throw new ApiError("Request not found.", 404);
  await run(db, `UPDATE change_requests SET status = ? WHERE id = ?`, status, id);
  await logActivity(db, { actor: "studio", action: `change_request.${status}`, guideId: r.guide_id, clientId: r.client_id });
  return { ...r, status };
}
