import { ApiError, many, now, one, parseJson, run, toJson } from "../db";
import type { Bindings } from "../types";
import { logActivity } from "./audit";
import { createGuide, getGuide } from "./guides";
import { emptyAnswers, mapIntakeToGuide, type IntakeAnswers } from "../services/intakeAnswers";

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

export async function listIntakeLinks(env: Bindings) {
  const db = env.DB;
  const rows = await many<IntakeLinkRow>(db, `SELECT * FROM intake_links ORDER BY created_at DESC`);
  const out = [];
  for (const l of rows) {
    const guide = await getGuide(env, l.guide_id).catch(() => null);
    out.push({ token: l.token, guide_id: l.guide_id, status: l.status, submitted_at: l.submitted_at, expires_at: l.expires_at, created_at: l.created_at, guide });
  }
  return out;
}

export async function createIntakeLink(
  env: Bindings,
  input: { guideId?: string; clientId?: string; propertyName?: string; expiryDays: number },
) {
  const db = env.DB;
  let guideId = input.guideId;
  if (!guideId) {
    if (!input.clientId) throw new ApiError("Choose a client.");
    if (!input.propertyName?.trim()) throw new ApiError("Add the property name.");
    const g = await createGuide(env, { clientId: input.clientId, propertyName: input.propertyName });
    guideId = g.id;
  }

  const previous = await one<IntakeLinkRow>(db, `SELECT * FROM intake_links WHERE guide_id = ? ORDER BY created_at DESC LIMIT 1`, guideId);
  const guide = await one<{ client_id: string; draft: string }>(db, `SELECT client_id, draft FROM guides WHERE id = ?`, guideId);
  const carriedAnswers = previous?.answers ? parseJson<IntakeAnswers | null>(previous.answers, null) : null;
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
  return { token, guide_id: guideId, status: "sent", expires_at: expires, created_at: ts, guide: await getGuide(env, guideId) };
}

export async function expireIntakeLink(env: Bindings, token: string) {
  const db = env.DB;
  const link = await one<IntakeLinkRow>(db, `SELECT * FROM intake_links WHERE token = ?`, token);
  if (!link) throw new ApiError("Link not found.", 404);
  await run(db, `UPDATE intake_links SET status = 'expired', expires_at = ? WHERE token = ?`, now(), token);
  await logActivity(db, { actor: "studio", action: "intake_link.expired", guideId: link.guide_id });
  return { ok: true };
}

export async function getIntakeByToken(env: Bindings, token: string) {
  const db = env.DB;
  const link = await one<IntakeLinkRow>(db, `SELECT * FROM intake_links WHERE token = ?`, token);
  if (!link) throw new ApiError("This link doesn't exist.", 404);
  if (link.status === "expired" || (link.expires_at && link.expires_at < now())) {
    throw new ApiError("This link has expired.", 410);
  }
  const guide = await one<{ client_id: string; draft: string }>(db, `SELECT client_id, draft FROM guides WHERE id = ?`, link.guide_id);
  const client = guide ? await one<{ name: string }>(db, `SELECT name FROM clients WHERE id = ?`, guide.client_id) : null;
  return {
    status: link.status,
    answers: parseJson<IntakeAnswers>(link.answers, emptyAnswers(parseJson(guide?.draft, { property: { name: "" } }).property?.name ?? "")),
    client_name: client?.name ?? "",
  };
}

export async function saveIntakeAnswers(env: Bindings, token: string, answers: unknown) {
  const db = env.DB;
  const link = await one<IntakeLinkRow>(db, `SELECT * FROM intake_links WHERE token = ?`, token);
  if (!link || link.status === "expired") throw new ApiError("This link has expired.", 410);
  await run(db, `UPDATE intake_links SET answers = ?, status = CASE WHEN status = 'sent' THEN 'in_progress' ELSE status END WHERE token = ?`, toJson(answers), token);
  return { saved_at: now() };
}

/**
 * Submit (architecture 10.1 step 4): maps the owner's answers into
 * GuideContent, merges them onto whatever the guide already has (so a
 * resubmission does not clobber pages the studio added by hand), and moves
 * the guide into the review queue. The answers themselves are re-mapped
 * server-side rather than trusting a client-computed GuideContent, since the
 * intake form is public and only token-gated.
 */
export async function submitIntake(env: Bindings, token: string, answers: IntakeAnswers) {
  const db = env.DB;
  const link = await one<IntakeLinkRow>(db, `SELECT * FROM intake_links WHERE token = ?`, token);
  if (!link || link.status === "expired") throw new ApiError("This link has expired.", 410);

  const guide = await one<{ client_id: string; draft: string; published_version: number | null }>(
    db,
    `SELECT client_id, draft, published_version FROM guides WHERE id = ?`,
    link.guide_id,
  );
  if (!guide) throw new ApiError("Guide not found.", 404);

  const content = mapIntakeToGuide(answers, parseJson(guide.draft, undefined));
  const ts = now();

  await run(db, `UPDATE intake_links SET answers = ?, status = 'submitted', submitted_at = ? WHERE token = ?`, toJson(answers), ts, token);
  await run(
    db,
    `UPDATE guides SET draft = ?, status = 'in_review', city = ?, owner_name = ?, updated_at = ? WHERE id = ?`,
    toJson(content), answers.property.city || null, answers.host.name || null, ts, link.guide_id,
  );
  await logActivity(db, {
    actor: "owner",
    action: "intake.submitted",
    guideId: link.guide_id,
    clientId: guide.client_id,
    detail: { update: guide.published_version != null },
  });
  const client = await one<{ name: string }>(db, `SELECT name FROM clients WHERE id = ?`, guide.client_id);
  return { ok: true, guideId: link.guide_id, propertyName: content.property.name, clientName: client?.name ?? "" };
}
