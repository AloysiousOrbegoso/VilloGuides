import type { D1Database } from "@cloudflare/workers-types";
import { many, newId, now, one, run } from "../db";

export type ClientRow = {
  id: string;
  name: string;
  subdomain: string;
  type: "company" | "individual";
  logo_key: string | null;
  brand_color: string | null;
  custom_domain: string | null;
  plan: string;
  dashboard_addon_paid: number;
  access_aud: string | null;
  created_at: string;
};

export async function listClients(db: D1Database) {
  const rows = await many<ClientRow>(db, `SELECT * FROM clients ORDER BY name`);
  const out = [];
  for (const c of rows) {
    const paid = await one<{ n: number }>(db, `SELECT COUNT(*) AS n FROM guides WHERE client_id = ? AND paid = 1`, c.id);
    const users = await many(db, `SELECT id, client_id, email, role, created_at FROM client_users WHERE client_id = ? ORDER BY email`, c.id);
    const guides = await one<{ n: number }>(db, `SELECT COUNT(*) AS n FROM guides WHERE client_id = ?`, c.id);
    const paidGuides = paid?.n ?? 0;
    out.push({
      ...c,
      guides: guides?.n ?? 0,
      paid_guides: paidGuides,
      eligible: paidGuides >= 2 || c.dashboard_addon_paid === 1,
      users,
    });
  }
  return out;
}

export async function getClientBySubdomain(db: D1Database, subdomain: string) {
  return one<ClientRow>(db, `SELECT * FROM clients WHERE subdomain = ?`, subdomain);
}

export async function createClient(db: D1Database, input: { name: string; subdomain: string; type: "company" | "individual" }) {
  const id = newId("c");
  await run(
    db,
    `INSERT INTO clients (id, name, subdomain, type, created_at) VALUES (?, ?, ?, ?, ?)`,
    id, input.name, input.subdomain, input.type, now(),
  );
  return one<ClientRow>(db, `SELECT * FROM clients WHERE id = ?`, id);
}

const UPDATABLE = ["name", "subdomain", "type", "dashboard_addon_paid", "access_aud", "brand_color"] as const;

export async function updateClient(db: D1Database, id: string, patch: Partial<ClientRow>) {
  const fields = UPDATABLE.filter((k) => patch[k] !== undefined);
  if (fields.length === 0) return one<ClientRow>(db, `SELECT * FROM clients WHERE id = ?`, id);
  const sql = `UPDATE clients SET ${fields.map((f) => `${f} = ?`).join(", ")} WHERE id = ?`;
  await run(db, sql, ...fields.map((f) => patch[f] as unknown), id);
  return one<ClientRow>(db, `SELECT * FROM clients WHERE id = ?`, id);
}

export async function isDashboardEligible(db: D1Database, clientId: string) {
  const c = await one<ClientRow>(db, `SELECT * FROM clients WHERE id = ?`, clientId);
  if (!c) return false;
  const paid = await one<{ n: number }>(db, `SELECT COUNT(*) AS n FROM guides WHERE client_id = ? AND paid = 1`, clientId);
  return (paid?.n ?? 0) >= 2 || c.dashboard_addon_paid === 1;
}
