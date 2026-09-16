import type { D1Database } from "@cloudflare/workers-types";
import { ApiError, many, now, one, parseJson, run, toJson } from "../db";
import { logActivity } from "./audit";
import { createGuide, getGuide } from "./guides";
import { emptyAnswers } from "../services/intakeAnswers";

export type IntakeLinkRow = {
  token: string;
  guide_id: string;
  status: "sent" | "in_progress" | "submitted" | "expired";
  answers: string | null;
  submitted_at: string | null;
  expires_at: string;
  created_at: string;
};

function genToken() {
  const chars = "abcdefghjkmnpqrstuvwxyz23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(10));
  return Array.from(bytes, (b) => chars[b % chars.length]).join("");
}

export async function listIntakeLinks(db: D1Database) {
  const rows = await many<IntakeLinkRow>(db, `SELECT * FROM intake_links ORDER BY created_at DESC`);
  const out = [];
  for (const l of rows) {
    const guide = await getGuide(db, l.guide_id).catch(() => null);
    out.push({ token: l.token, guide_id: l.guide_id, status: l.status, submitted_at: l.submitted_at, expires_at: l.expires_at, created_at: l.created_at, guide });
  }
  return out;
}

export async function createIntakeLink(
  db: D1Database,
  input: { guideId?: string; clientId?: string; propertyName?: string; expiryDays: number },
) {
  let guideId = input.guideId;
  if (!guideId) {
    if (!input.clientId) throw new ApiError("Choose a client.");
    if (!input.propertyName?.trim()) throw new ApiError("Add the property name.");
    const g = await createGuide(db, { clientId: input.clientId, propertyName: input.propertyName });
    guideId = g.id;
  }

  const previous = await one<IntakeLinkRow>(db, `SELECT * FROM intake_links WHERE guide_id = ? ORDER BY created_at DESC LIMIT 1`, guideId);
  const guide = await one<{ client_id: string; draft: string }>(db, `SELECT client_id, draft FROM guides WHERE id = ?`, guideId);
  const carriedAnswers = previous?.answers ? parseJson(previous.answers, null) : null;
  const answers = carriedAnswers ?? emptyAnswers(parseJson(guide?.draft, { property: { name: "" } }).property?.name ?? "");

  if (previous && previous.status !== "expired") {
    await run(db, `UPDATE intake_links SET status = 'expired' WHERE token = ?`, previous.token);
  }

  const token = genToken();
  const ts = now();
  const expires = new Date(Date.now() + input.expiryDays * 86400000).toISOString();
  await run(
    db,
    `INSERT INTO intake_links (token, guide_id, status, answers, expires_at, created_at) VALUES (?, ?, 'sent', ?, ?, ?)`,
    token, guideId, toJson(answers), expires, ts,
  );
  await logActivity(db, { actor: "studio", action: "intake_link.created", guideId, clientId: guide?.client_id });
  return { token, guide_id: guideId, status: "sent", expires_at: expires, created_at: ts, guide: await getGuide(db, guideId) };
}

export async function expireIntakeLink(db: D1Database, token: string) {
  const link = await one<IntakeLinkRow>(db, `SELECT * FROM intake_links WHERE token = ?`, token);
  if (!link) throw new ApiError("Link not found.", 404);
  await run(db, `UPDATE intake_links SET status = 'expired', expires_at = ? WHERE token = ?`, now(), token);
  await logActivity(db, { actor: "studio", action: "intake_link.expired", guideId: link.guide_id });
  return { ok: true };
}

export async function getIntakeByToken(db: D1Database, token: string) {
  const link = await one<IntakeLinkRow>(db, `SELECT * FROM intake_links WHERE token = ?`, token);
  if (!link) throw new ApiError("This link doesn't exist.", 404);
  if (link.status === "expired" || (link.expires_at && link.expires_at < now())) {
    throw new ApiError("This link has expired.", 410);
  }
  const guide = await one<{ client_id: string; draft: string }>(db, `SELECT client_id, draft FROM guides WHERE id = ?`, link.guide_id);
  const client = guide ? await one<{ name: string }>(db, `SELECT name FROM clients WHERE id = ?`, guide.client_id) : null;
  return {
    status: link.status,
    answers: parseJson(link.answers, emptyAnswers(parseJson(guide?.draft, { property: { name: "" } }).property?.name ?? "")),
    client_name: client?.name ?? "",
  };
}

export async function saveIntakeAnswers(db: D1Database, token: string, answers: unknown) {
  const link = await one<IntakeLinkRow>(db, `SELECT * FROM intake_links WHERE token = ?`, token);
  if (!link || link.status === "expired") throw new ApiError("This link has expired.", 410);
  await run(db, `UPDATE intake_links SET answers = ?, status = CASE WHEN status = 'sent' THEN 'in_progress' ELSE status END WHERE token = ?`, toJson(answers), token);
  return { saved_at: now() };
}
