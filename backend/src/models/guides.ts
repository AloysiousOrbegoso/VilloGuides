import type { D1Database } from "@cloudflare/workers-types";
import { ApiError, many, newId, now, one, parseJson, run, toJson } from "../db";
import { checkFormat, checkAvailable } from "../services/subdomains";
import { validateGuide } from "../validators/guideContent";
import { logActivity } from "./audit";

export const MAX_RENAMES = 3;

export type GuideRow = {
  id: string;
  client_id: string;
  slug: string | null;
  status: "draft" | "in_review" | "published" | "unpublished" | "suspended";
  draft: string;
  published_version: number | null;
  published_at: string | null;
  paid: number;
  payment_method: string | null;
  payment_amount: number | null;
  payment_currency: string | null;
  payment_reference: string | null;
  paid_at: string | null;
  owner_name: string | null;
  city: string | null;
  updated_at: string;
  created_at: string;
};

/** Attaches the bits every studio screen wants alongside the raw row: client info and the latest intake link. */
async function decorate(db: D1Database, g: GuideRow) {
  const client = await one<{ id: string; name: string; subdomain: string; type: string }>(
    db,
    `SELECT id, name, subdomain, type FROM clients WHERE id = ?`,
    g.client_id,
  );
  const link = await one<{ token: string; status: string; submitted_at: string | null }>(
    db,
    `SELECT token, status, submitted_at FROM intake_links WHERE guide_id = ? ORDER BY created_at DESC LIMIT 1`,
    g.id,
  );
  const draft = parseJson(g.draft, { property: { name: "" } } as { property: { name: string } });
  return {
    ...g,
    draft,
    client: client ? { id: client.id, name: client.name, subdomain: client.subdomain, type: client.type } : null,
    intake: link ? { token: link.token, status: link.status, submitted_at: link.submitted_at } : null,
    property_name: draft?.property?.name || "Untitled property",
  };
}

export async function listGuides(db: D1Database, filter: { clientId?: string; status?: string; q?: string } = {}) {
  const clauses: string[] = [];
  const params: unknown[] = [];
  if (filter.clientId) {
    clauses.push("client_id = ?");
    params.push(filter.clientId);
  }
  if (filter.status) {
    clauses.push("status = ?");
    params.push(filter.status);
  }
  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  const rows = await many<GuideRow>(db, `SELECT * FROM guides ${where} ORDER BY updated_at DESC`, ...params);
  const decorated = await Promise.all(rows.map((r) => decorate(db, r)));
  if (!filter.q) return decorated;
  const q = filter.q.toLowerCase();
  return decorated.filter((g) =>
    [g.property_name, g.city, g.owner_name, g.slug, g.client?.name].some((v) => (v || "").toLowerCase().includes(q)),
  );
}

export async function getQueue(db: D1Database) {
  const rows = await listGuides(db, { status: "in_review" });
  return rows
    .map((g) => ({ ...g, kind: g.published_version ? "updated" : "new", submitted_at: g.intake?.submitted_at || g.updated_at }))
    .sort((a, b) => (b.submitted_at || "").localeCompare(a.submitted_at || ""));
}

export async function getStats(db: D1Database) {
  const pending = await one<{ n: number }>(db, `SELECT COUNT(*) AS n FROM guides WHERE status = 'in_review'`);
  const published = await one<{ n: number }>(db, `SELECT COUNT(*) AS n FROM guides WHERE status = 'published'`);
  const clients = await one<{ n: number }>(db, `SELECT COUNT(*) AS n FROM clients`);
  const openRequests = await one<{ n: number }>(db, `SELECT COUNT(*) AS n FROM change_requests WHERE status = 'open'`);
  return { pending: pending?.n ?? 0, published: published?.n ?? 0, clients: clients?.n ?? 0, openRequests: openRequests?.n ?? 0 };
}

export async function getGuide(db: D1Database, id: string) {
  const row = await one<GuideRow>(db, `SELECT * FROM guides WHERE id = ?`, id);
  if (!row) throw new ApiError("Guide not found.", 404);
  const decorated = await decorate(db, row);
  const slugHistory = await many(db, `SELECT slug, guide_id, retired_at FROM slug_history WHERE guide_id = ? ORDER BY retired_at IS NULL, retired_at DESC`, id);
  const renames = await one<{ n: number }>(db, `SELECT COUNT(*) AS n FROM slug_history WHERE guide_id = ? AND retired_at IS NOT NULL`, id);
  return { ...decorated, slug_history: slugHistory, renames: renames?.n ?? 0, max_renames: MAX_RENAMES };
}

export async function createGuide(
  db: D1Database,
  input: { clientId: string; propertyName: string; city?: string; ownerName?: string; defaultTheme?: string },
) {
  const client = await one(db, `SELECT id FROM clients WHERE id = ?`, input.clientId);
  if (!client) throw new ApiError("Choose a client.");
  if (!input.propertyName?.trim()) throw new ApiError("Add the property name.");

  const id = newId("g");
  const draft = {
    schemaVersion: 1,
    property: { name: input.propertyName.trim(), tagline: "", address: "", mapsUrl: "", coverImage: "" },
    host: { name: "", photo: "", phone: "", messenger: "", email: "", bio: "" },
    theme: { preset: input.defaultTheme || "daytime", colors: {} },
    pages: [],
    places: [],
    emergency: { hospital: "", police: "", barangay: "", hostLine: "" },
  };
  const ts = now();
  await run(
    db,
    `INSERT INTO guides (id, client_id, status, draft, paid, owner_name, city, updated_at, created_at)
     VALUES (?, ?, 'draft', ?, 0, ?, ?, ?, ?)`,
    id, input.clientId, toJson(draft), input.ownerName || "", input.city || "", ts, ts,
  );
  await logActivity(db, { actor: "studio", action: "guide.created", guideId: id, clientId: input.clientId });
  return getGuide(db, id);
}

export async function saveDraft(db: D1Database, id: string, draft: unknown) {
  const ts = now();
  await run(db, `UPDATE guides SET draft = ?, updated_at = ? WHERE id = ?`, toJson(draft), ts, id);
  return { updated_at: ts };
}

export async function updateGuideMeta(db: D1Database, id: string, patch: { city?: string; owner_name?: string }) {
  const fields = Object.entries(patch).filter(([, v]) => v !== undefined);
  if (fields.length === 0) return getGuide(db, id);
  await run(db, `UPDATE guides SET ${fields.map(([k]) => `${k} = ?`).join(", ")}, updated_at = ? WHERE id = ?`, ...fields.map(([, v]) => v), now(), id);
  return getGuide(db, id);
}

export async function markPaid(
  db: D1Database,
  id: string,
  input: { method: string; amount: number; currency: string; reference?: string; paidAt?: string },
) {
  if (!input.method) throw new ApiError("Choose how they paid.");
  if (!(input.amount > 0)) throw new ApiError("Enter the amount received.");
  const guide = await one<GuideRow>(db, `SELECT * FROM guides WHERE id = ?`, id);
  if (!guide) throw new ApiError("Guide not found.", 404);
  await run(
    db,
    `UPDATE guides SET paid = 1, payment_method = ?, payment_amount = ?, payment_currency = ?, payment_reference = ?, paid_at = ? WHERE id = ?`,
    input.method, Math.round(input.amount), input.currency, input.reference || null, input.paidAt || now(), id,
  );
  await logActivity(db, { actor: "studio", action: "payment.recorded", guideId: id, clientId: guide.client_id, detail: { method: input.method, amount: input.amount } });
  return getGuide(db, id);
}

export async function markUnpaid(db: D1Database, id: string) {
  const guide = await one<GuideRow>(db, `SELECT * FROM guides WHERE id = ?`, id);
  if (!guide) throw new ApiError("Guide not found.", 404);
  await run(db, `UPDATE guides SET paid = 0, payment_method = NULL, payment_amount = NULL, payment_currency = NULL, payment_reference = NULL, paid_at = NULL WHERE id = ?`, id);
  await logActivity(db, { actor: "studio", action: "payment.removed", guideId: id, clientId: guide.client_id });
  return getGuide(db, id);
}

/** Publish, unpublish, suspend, rename, restore (architecture 10.2 and 10.4). */
export async function publishGuide(db: D1Database, id: string) {
  const guide = await one<GuideRow>(db, `SELECT * FROM guides WHERE id = ?`, id);
  if (!guide) throw new ApiError("Guide not found.", 404);
  if (guide.paid !== 1) throw new ApiError("Record the payment before publishing.");
  if (!guide.slug) throw new ApiError("Choose a subdomain before publishing.");

  const draft = parseJson(guide.draft, {});
  const v = validateGuide(draft as Parameters<typeof validateGuide>[0]);
  if (!v.ok) throw new ApiError(v.errors[0]);

  const format = checkFormat(guide.slug);
  if (format) throw new ApiError(format);

  const next = (guide.published_version ?? 0) + 1;
  const ts = now();
  await run(db, `INSERT INTO guide_versions (guide_id, version, content, created_at) VALUES (?, ?, ?, ?)`, id, next, toJson(draft), ts);
  await run(db, `UPDATE guides SET published_version = ?, status = 'published', published_at = ?, updated_at = ? WHERE id = ?`, next, ts, ts, id);

  const historyRow = await one(db, `SELECT slug FROM slug_history WHERE slug = ?`, guide.slug);
  if (!historyRow) await run(db, `INSERT INTO slug_history (slug, guide_id, retired_at) VALUES (?, ?, NULL)`, guide.slug, id);

  await logActivity(db, { actor: "studio", action: "guide.published", guideId: id, clientId: guide.client_id, detail: { version: next } });
  return getGuide(db, id);
}

export async function unpublishGuide(db: D1Database, id: string) {
  const guide = await one<GuideRow>(db, `SELECT * FROM guides WHERE id = ?`, id);
  if (!guide) throw new ApiError("Guide not found.", 404);
  await run(db, `UPDATE guides SET status = 'unpublished', updated_at = ? WHERE id = ?`, now(), id);
  await logActivity(db, { actor: "studio", action: "guide.unpublished", guideId: id, clientId: guide.client_id });
  return getGuide(db, id);
}

export async function suspendGuide(db: D1Database, id: string) {
  const guide = await one<GuideRow>(db, `SELECT * FROM guides WHERE id = ?`, id);
  if (!guide) throw new ApiError("Guide not found.", 404);
  await run(db, `UPDATE guides SET status = 'suspended' WHERE id = ?`, id);
  await logActivity(db, { actor: "studio", action: "guide.suspended", guideId: id, clientId: guide.client_id });
  return getGuide(db, id);
}

/** Sets the first slug, or renames a published guide and keeps the old slug redirecting forever. */
export async function renameGuide(db: D1Database, id: string, slug: string) {
  const guide = await one<GuideRow>(db, `SELECT * FROM guides WHERE id = ?`, id);
  if (!guide) throw new ApiError("Guide not found.", 404);

  const format = checkFormat(slug);
  if (format) throw new ApiError(format);
  if (slug === guide.slug) return getGuide(db, id);

  const avail = await checkAvailable(db, slug, { guideId: id });
  if (!avail.available) throw new ApiError(avail.reason ?? "That name is not available.");

  const everPublished = guide.published_version != null;
  if (everPublished) {
    const renameCount = await one<{ n: number }>(db, `SELECT COUNT(*) AS n FROM slug_history WHERE guide_id = ? AND retired_at IS NOT NULL`, id);
    if ((renameCount?.n ?? 0) >= MAX_RENAMES) throw new ApiError(`This guide has been renamed ${MAX_RENAMES} times, the limit.`);
    if (guide.slug) await run(db, `UPDATE slug_history SET retired_at = ? WHERE slug = ?`, now(), guide.slug);
    await run(db, `INSERT INTO slug_history (slug, guide_id, retired_at) VALUES (?, ?, NULL)`, slug, id);
    await logActivity(db, { actor: "studio", action: "guide.renamed", guideId: id, clientId: guide.client_id, detail: { from: guide.slug, to: slug } });
  }

  await run(db, `UPDATE guides SET slug = ?, updated_at = ? WHERE id = ?`, slug, now(), id);
  return getGuide(db, id);
}

export async function listVersions(db: D1Database, guideId: string) {
  const rows = await many<{ id: number; guide_id: string; version: number; content: string; created_at: string }>(
    db,
    `SELECT id, guide_id, version, content, created_at FROM guide_versions WHERE guide_id = ? ORDER BY version DESC`,
    guideId,
  );
  return rows.map(({ content, ...rest }) => ({ ...rest, pages: (parseJson(content, { pages: [] as unknown[] }).pages ?? []).length }));
}

export async function restoreVersion(db: D1Database, guideId: string, version: number) {
  const guide = await one<GuideRow>(db, `SELECT * FROM guides WHERE id = ?`, guideId);
  const row = await one<{ content: string }>(db, `SELECT content FROM guide_versions WHERE guide_id = ? AND version = ?`, guideId, version);
  if (!guide || !row) throw new ApiError("Version not found.", 404);

  const next = (guide.published_version ?? 0) + 1;
  const ts = now();
  await run(db, `INSERT INTO guide_versions (guide_id, version, content, created_at) VALUES (?, ?, ?, ?)`, guideId, next, row.content, ts);
  await run(
    db,
    `UPDATE guides SET draft = ?, published_version = ?, status = 'published', published_at = ?, updated_at = ? WHERE id = ?`,
    row.content, next, ts, ts, guideId,
  );
  await logActivity(db, { actor: "studio", action: "guide.restored", guideId, clientId: guide.client_id, detail: { from: version, version: next } });
  return getGuide(db, guideId);
}
