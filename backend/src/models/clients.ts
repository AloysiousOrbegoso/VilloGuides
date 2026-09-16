import type { D1Database } from "@cloudflare/workers-types";
import { many, newId, now, one, run } from "../db";
import type { Bindings } from "../types";
import { createClientAccessApp, syncClientAccessPolicy } from "../services/accessApi";

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
  access_app_id: string | null;
  access_policy_id: string | null;
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

/**
 * Called from models/clientUsers.ts after any staff change. Creates the
 * client's Access application the first time it has any staff at all, or
 * updates the existing policy's Include list to match every time after.
 * A no-op, and never throws, when CF_API_TOKEN/CF_ACCOUNT_ID are unset, so
 * the manual "paste an AUD in by hand" flow keeps working unchanged until
 * these are configured, and a Cloudflare API hiccup here can never break
 * the actual act of adding or removing a staff email.
 */
export async function syncClientAccess(env: Bindings, clientId: string): Promise<void> {
  const db = env.DB;
  const client = await one<ClientRow>(db, `SELECT * FROM clients WHERE id = ?`, clientId);
  if (!client) return;

  const users = await many<{ email: string }>(db, `SELECT email FROM client_users WHERE client_id = ?`, clientId);
  const emails = users.map((u) => u.email);

  try {
    let appId = client.access_app_id;
    let aud = client.access_aud;

    if (!appId) {
      if (emails.length === 0) return; // nothing to protect yet; wait for the first staff email
      const created = await createClientAccessApp(env, { clientName: client.name, subdomain: client.subdomain });
      if (!created) return; // not configured; manual flow still applies
      appId = created.appId;
      aud = created.aud;
    }

    const policyId = await syncClientAccessPolicy(env, { appId, existingPolicyId: client.access_policy_id, emails });

    await run(
      db,
      `UPDATE clients SET access_app_id = ?, access_aud = ?, access_policy_id = ? WHERE id = ?`,
      appId, aud, policyId, clientId,
    );
  } catch (err) {
    // Never let a Cloudflare API problem break the staff change itself,
    // the same reasoning as every other best-effort side effect in this
    // codebase (email notifications, cache purges).
    console.error("syncClientAccess failed:", err);
  }
}
