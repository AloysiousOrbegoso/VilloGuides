import type { D1Database } from "@cloudflare/workers-types";
import { ApiError, many, newId, now, run } from "../db";

export async function listNotes(db: D1Database, guideId: string) {
  return many(db, `SELECT * FROM guide_notes WHERE guide_id = ? ORDER BY created_at DESC`, guideId);
}

export async function addNote(db: D1Database, guideId: string, body: string, author: string) {
  if (!body?.trim()) throw new ApiError("Write a note first.");
  const id = newId("n");
  const ts = now();
  await run(db, `INSERT INTO guide_notes (id, guide_id, author, body, created_at) VALUES (?, ?, ?, ?, ?)`, id, guideId, author, body.trim(), ts);
  return { id, guide_id: guideId, author, body: body.trim(), created_at: ts };
}
