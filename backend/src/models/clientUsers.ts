import type { D1Database } from "@cloudflare/workers-types";
import { ApiError, newId, now, one, run } from "../db";
import type { Bindings } from "../types";
import { syncClientAccess } from "./clients";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function addClientUser(env: Bindings, clientId: string, email: string, role: "admin" | "support") {
  const db = env.DB;
  const e = email.trim().toLowerCase();
  if (!EMAIL.test(e)) throw new ApiError("Enter a valid email.");
  const existing = await one(db, `SELECT id FROM client_users WHERE client_id = ? AND email = ?`, clientId, e);
  if (existing) throw new ApiError("This email is already on the list.");
  const id = newId("u");
  await run(db, `INSERT INTO client_users (id, client_id, email, role, created_at) VALUES (?, ?, ?, ?, ?)`, id, clientId, e, role, now());
  const user = await one(db, `SELECT * FROM client_users WHERE id = ?`, id);
  await syncClientAccess(env, clientId);
  return user;
}

export async function updateClientUser(db: D1Database, id: string, role: "admin" | "support") {
  await run(db, `UPDATE client_users SET role = ? WHERE id = ?`, role, id);
  return one(db, `SELECT * FROM client_users WHERE id = ?`, id);
}

export async function removeClientUser(env: Bindings, id: string) {
  const db = env.DB;
  const row = await one<{ client_id: string }>(db, `SELECT client_id FROM client_users WHERE id = ?`, id);
  await run(db, `DELETE FROM client_users WHERE id = ?`, id);
  if (row) await syncClientAccess(env, row.client_id);
}

export async function findUser(db: D1Database, clientId: string, email: string) {
  return one<{ role: "admin" | "support" }>(db, `SELECT role FROM client_users WHERE client_id = ? AND email = ?`, clientId, email);
}
