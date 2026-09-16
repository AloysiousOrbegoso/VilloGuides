import type { D1Database } from "@cloudflare/workers-types";
import { one } from "../db";

/**
 * Client subdomains and property (guide) slugs share one pool, checked here.
 * Mirrors src/lib/hostname.js on the frontend exactly, so a name that looks
 * available in the studio really is available once it hits the Worker.
 */

export const RESERVED_SUBDOMAINS = [
  "www", "studio", "forms", "demo", "media", "api", "admin", "app", "portal", "dashboard",
  "mail", "email", "support", "help", "status", "docs", "blog", "login", "signup", "auth",
  "account", "billing", "pay", "checkout", "test", "staging", "dev", "preview", "internal",
  "villo", "villoguides", "villo-guides",
];

const PATTERN = /^[a-z0-9](?:[a-z0-9]|-(?!-)){1,38}[a-z0-9]$/;

export function checkFormat(name: string): string | null {
  if (!name) return "Enter a subdomain.";
  if (name.length < 3 || name.length > 40) return "Use 3 to 40 characters.";
  if (!PATTERN.test(name)) return "Use lowercase letters, numbers, and single hyphens. It cannot start or end with a hyphen.";
  return null;
}

/**
 * Checks a name against the reserved list, extra reserved names in settings,
 * every client, every live guide, and retired slugs. guideId/clientId exclude
 * the record currently holding that name, so renaming to your own slug is a no-op.
 */
export async function checkAvailable(
  db: D1Database,
  name: string,
  opts: { guideId?: string; clientId?: string } = {},
): Promise<{ available: boolean; reason: string | null }> {
  const format = checkFormat(name);
  if (format) return { available: false, reason: format };

  if (RESERVED_SUBDOMAINS.includes(name)) return { available: false, reason: "This name is reserved." };

  const extra = await extraReservedList(db);
  if (extra.includes(name)) return { available: false, reason: "This name is reserved." };

  const client = await one<{ id: string; name: string }>(db, `SELECT id, name FROM clients WHERE subdomain = ?`, name);
  if (client && client.id !== opts.clientId) return { available: false, reason: `Already used by the client ${client.name}.` };

  const guide = await one<{ id: string; draft: string }>(db, `SELECT id, draft FROM guides WHERE slug = ?`, name);
  if (guide && guide.id !== opts.guideId) {
    const draft = JSON.parse(guide.draft || "{}");
    return { available: false, reason: `Already used by ${draft?.property?.name || "another guide"}.` };
  }

  const retired = await one<{ guide_id: string }>(db, `SELECT guide_id FROM slug_history WHERE slug = ? AND retired_at IS NOT NULL`, name);
  if (retired && retired.guide_id !== opts.guideId) {
    return { available: false, reason: "This name used to belong to another guide and can never be reused." };
  }

  return { available: true, reason: null };
}

/** What a hostname resolves to at the edge (architecture 4.1), for the public router. */
export async function resolveHostname(db: D1Database, sub: string): Promise<{ kind: "client" | "guide" | "none" }> {
  const client = await one(db, `SELECT id FROM clients WHERE subdomain = ?`, sub);
  if (client) return { kind: "client" };
  const guide = await one(db, `SELECT id FROM guides WHERE slug = ?`, sub);
  if (guide) return { kind: "guide" };
  const retired = await one(db, `SELECT guide_id FROM slug_history WHERE slug = ? AND retired_at IS NOT NULL`, sub);
  if (retired) return { kind: "guide" };
  return { kind: "none" };
}

export async function extraReservedList(db: D1Database): Promise<string[]> {
  const s = await one<{ extra_reserved: string }>(db, `SELECT extra_reserved FROM settings WHERE id = 1`);
  return s?.extra_reserved ? JSON.parse(s.extra_reserved) : [];
}
