import type { D1Database } from "@cloudflare/workers-types";
import { ApiError, newId, now, one, run } from "../db";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function addClientUser(db: D1Database, clientId: string, email: string, role: "admin" | "support") {
  const e = email.trim().toLowerCase();
  if (!EMAIL.test(e)) throw new ApiError("Enter a valid email.");
  const existing = await one(db, `SELECT id FROM client_users WHERE client_id = ? AND email = ?`, clientId, e);
  if (existing) throw new ApiError("This email is already on the list.");
  const id = newId("u");
  await run(db, `INSERT INTO client_users (id, client_id, email, role, created_at) VALUES (?, ?, ?, ?, ?)`, id, clientId, e, role, now());
  return one(db, `SELECT * FROM client_users WHERE id = ?`, id);
}

export async function updateClientUser(db: D1Database, id: string, role: "admin" | "support") {
  await run(db, `UPDATE client_users SET role = ? WHERE id = ?`, role, id);
  return one(db, `SELECT * FROM client_users WHERE id = ?`, id);
}

export async function removeClientUser(db: D1Database, id: string) {
  await run(db, `DELETE FROM client_users WHERE id = ?`, id);
}

export async function findUser(db: D1Database, clientId: string, email: string) {
  return one<{ role: "admin" | "support" }>(db, `SELECT role FROM client_users WHERE client_id = ? AND email = ?`, clientId, email);
}
