import type { Bindings } from "./types";
import { many, now, run, toJson } from "./db";
import { logActivity } from "./models/audit";
import { extractPhotoFilenames } from "./services/photoRefs";

/**
 * Worker Cron Triggers (architecture 13.4). Four jobs, matched by the exact
 * schedule string that fired (declared in wrangler.toml's [triggers]),
 * since one Worker's scheduled() handler receives every cron it owns.
 */

const CRON = {
  versionCheck: "0 18 * * *", // daily
  expireIntake: "15 18 * * *", // daily
  cleanupPhotos: "30 18 * * 0", // weekly, Sunday
  backupD1: "45 18 * * 0", // weekly, Sunday
};

export async function scheduled(event: { cron: string }, env: Bindings) {
  switch (event.cron) {
    case CRON.versionCheck:
      return verifyPublishedVersions(env);
    case CRON.expireIntake:
      return expireIntakeLinks(env);
    case CRON.cleanupPhotos:
      return cleanupOrphanedPhotos(env);
    case CRON.backupD1:
      return backupDatabase(env);
    default:
      console.error(`Unrecognized cron schedule: ${event.cron}`);
  }
}

/** Daily: verify every published guide has a valid current version. Logs a problem rather than trying to auto-fix one. */
async function verifyPublishedVersions(env: Bindings) {
  const db = env.DB;
  const guides = await many<{ id: string; client_id: string; published_version: number }>(
    db,
    `SELECT id, client_id, published_version FROM guides WHERE status = 'published' AND published_version IS NOT NULL`,
  );
  let broken = 0;
  for (const g of guides) {
    const version = await db
      .prepare(`SELECT 1 FROM guide_versions WHERE guide_id = ? AND version = ?`)
      .bind(g.id, g.published_version)
      .first();
    if (!version) {
      broken += 1;
      await logActivity(db, {
        actor: "cron",
        action: "integrity.missing_version",
        guideId: g.id,
        clientId: g.client_id,
        detail: { published_version: g.published_version },
      });
    }
  }
  if (broken > 0) console.error(`versionCheck: ${broken} published guide(s) missing their version row`);
}

/** Daily: expire intake links past expires_at. */
async function expireIntakeLinks(env: Bindings) {
  const result = await run(
    env.DB,
    `UPDATE intake_links SET status = 'expired' WHERE status != 'expired' AND expires_at < ?`,
    now(),
  );
  const changed = (result as unknown as { meta?: { changes?: number } }).meta?.changes ?? 0;
  if (changed > 0) await logActivity(env.DB, { actor: "cron", action: "intake_links.expired_batch", detail: { count: changed } });
}

/**
 * Weekly: delete orphaned photos in R2. A photo is orphaned if no guide's
 * draft or published content references it. Only objects older than 24
 * hours are considered, so a photo mid-upload during an active edit is
 * never at risk of being swept up before it has been saved into a draft.
 */
async function cleanupOrphanedPhotos(env: Bindings) {
  const db = env.DB;
  const rows = await many<{ draft: string }>(db, `SELECT draft FROM guides`);
  const versions = await many<{ content: string }>(db, `SELECT content FROM guide_versions`);

  const inUse = new Set<string>();
  for (const r of [...rows, ...versions.map((v) => ({ draft: v.content }))]) {
    try {
      for (const filename of extractPhotoFilenames(JSON.parse(r.draft))) inUse.add(filename);
    } catch {
      // A row with unparseable content is a separate problem; skip it here rather than fail the whole job.
    }
  }

  const cutoff = Date.now() - 24 * 60 * 60 * 1000;
  let deleted = 0;
  for (const prefix of ["guides/", "intake/"]) {
    let cursor: string | undefined;
    do {
      const listing = await env.PHOTOS.list({ prefix, cursor, limit: 500 });
      for (const obj of listing.objects) {
        const filename = obj.key.slice(prefix.length);
        if (inUse.has(filename)) continue;
        if (obj.uploaded.getTime() > cutoff) continue;
        await env.PHOTOS.delete(obj.key);
        deleted += 1;
      }
      cursor = listing.truncated ? listing.cursor : undefined;
    } while (cursor);
  }
  if (deleted > 0) await logActivity(db, { actor: "cron", action: "photos.orphans_deleted", detail: { count: deleted } });
}

/**
 * Weekly: export D1 to a private backup location. D1's own Time Travel
 * already gives point-in-time restore for the retention window your plan
 * includes (architecture 13.4 notes this); this is a second, longer-lived
 * copy as extra insurance, stored as plain JSON in the same R2 bucket under
 * a backups/ prefix nothing else reads from.
 */
async function backupDatabase(env: Bindings) {
  const db = env.DB;
  const tables = [
    "clients", "client_users", "guides", "guide_versions", "slug_history",
    "intake_links", "guide_notes", "change_requests", "audit_log", "settings", "reports",
  ];
  const dump: Record<string, unknown[]> = {};
  for (const table of tables) {
    dump[table] = await many(db, `SELECT * FROM ${table}`);
  }
  const key = `backups/${new Date().toISOString().slice(0, 10)}.json`;
  await env.PHOTOS.put(key, toJson(dump), { httpMetadata: { contentType: "application/json" } });
  await logActivity(db, { actor: "cron", action: "backup.completed", detail: { key } });
}
