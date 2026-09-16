import type { D1Database } from "@cloudflare/workers-types";

/**
 * Thin helpers over D1's raw API so model files read like plain SQL instead of
 * repeating .bind().first()/.all() everywhere. Every JSON column (draft, content,
 * answers, detail) is stored as serialized text (architecture 8.1) and parsed here
 * at the model boundary, so routes never see raw JSON strings.
 */

export const now = () => new Date().toISOString();

export function newId(prefix: string) {
  const rand = crypto.randomUUID().replace(/-/g, "").slice(0, 10);
  return `${prefix}_${rand}`;
}

export async function one<T>(db: D1Database, sql: string, ...params: unknown[]): Promise<T | null> {
  return db.prepare(sql).bind(...params).first<T>();
}

export async function many<T>(db: D1Database, sql: string, ...params: unknown[]): Promise<T[]> {
  const res = await db.prepare(sql).bind(...params).all<T>();
  return res.results ?? [];
}

export async function run(db: D1Database, sql: string, ...params: unknown[]) {
  return db.prepare(sql).bind(...params).run();
}

/** Parses a JSON text column, returning a fallback if the row itself was null. */
export function parseJson<T>(text: string | null | undefined, fallback: T): T {
  if (!text) return fallback;
  try {
    return JSON.parse(text) as T;
  } catch {
    return fallback;
  }
}

export const toJson = (value: unknown) => JSON.stringify(value ?? null);

/** HTTP-flavoured error a route handler can throw and have the app catch (see index.ts). */
export class ApiError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}
