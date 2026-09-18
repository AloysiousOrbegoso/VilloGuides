import imageCompression from "browser-image-compression";
import { buildSeed, MOCK_STUDIO_OWNER } from "./seed";
import { migrate, validateGuide, emptyGuide } from "../../lib/guideSchema";
import { emptyAnswers, mapIntakeToGuide } from "../../lib/intakeMapper";
import { RESERVED_SUBDOMAINS, checkSubdomainFormat, dashboardUrl } from "../../lib/hostname";

/*
  Mock API for Phase 1. Same function names and return shapes as the live API in
  src/lib/api.js, so swapping to the Worker in Phase 2 changes no component.

  Data lives in memory and is saved to localStorage so a reload keeps your edits.
  Studio > Settings has "Reset mock data".
*/

const KEY = "vg-mock-db-v1";
const LATENCY = 180;
const MAX_RENAMES = 3;

let db = load();

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* fall through to a fresh seed */
  }
  return buildSeed();
}

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(db));
  } catch {
    // Quota exceeded, usually from photos. Keep working in memory for this visit.
  }
}

const wait = (v) => new Promise((resolve) => setTimeout(() => resolve(structuredClone(v)), LATENCY));
const fail = (message, status = 400) => {
  const err = new Error(message);
  err.status = status;
  return new Promise((_, reject) => setTimeout(() => reject(err), LATENCY));
};
const now = () => new Date().toISOString();
const id = (p) => `${p}_${Math.random().toString(36).slice(2, 10)}`;
const token = () => Array.from(crypto.getRandomValues(new Uint8Array(6)), (b) => "abcdefghjkmnpqrstuvwxyz23456789"[b % 31]).join("") + Math.random().toString(36).slice(2, 4);

function log(action, { guide_id = null, client_id = null, detail = {}, actor = "studio" } = {}) {
  const nextId = (db.audit_log.at(-1)?.id ?? 0) + 1;
  db.audit_log.push({ id: nextId, actor, action, guide_id, client_id, detail, created_at: now() });
}

const clientById = (cid) => db.clients.find((c) => c.id === cid);
const guideById = (gid) => db.guides.find((g) => g.id === gid);

function paidCount(cid) {
  return db.guides.filter((g) => g.client_id === cid && g.paid === 1).length;
}

/** Architecture 8.1: derived, not stored. */
function eligible(client) {
  return paidCount(client.id) >= 2 || client.dashboard_addon_paid === 1;
}

function withClient(g) {
  const c = clientById(g.client_id);
  const link = db.intake_links.filter((l) => l.guide_id === g.id).sort((a, b) => b.created_at.localeCompare(a.created_at))[0];
  return {
    ...g,
    draft: migrate(g.draft),
    client: c ? { id: c.id, name: c.name, subdomain: c.subdomain, type: c.type } : null,
    intake: link ? { token: link.token, status: link.status, submitted_at: link.submitted_at } : null,
    property_name: g.draft?.property?.name || "Untitled property",
  };
}

function subdomainTaken(name, { guideId, clientId } = {}) {
  if (RESERVED_SUBDOMAINS.includes(name) || db.settings.extra_reserved.includes(name)) return "This name is reserved.";
  const c = db.clients.find((x) => x.subdomain === name);
  if (c && c.id !== clientId) return `Already used by the client ${c.name}.`;
  const g = db.guides.find((x) => x.slug === name);
  if (g && g.id !== guideId) return `Already used by ${g.draft?.property?.name || "another guide"}.`;
  const retired = db.slug_history.find((s) => s.slug === name && s.retired_at);
  if (retired && retired.guide_id !== guideId) return "This name used to belong to another guide and can never be reused.";
  if (retired && retired.guide_id === guideId) return "This is a retired name for this guide. Retired names only redirect.";
  return null;
}

export const mockApi = {
  mode: "mock",

  /* ---------------- Studio ---------------- */

  async getStudioMe() {
    return wait({ email: MOCK_STUDIO_OWNER });
  },

  async getQueue() {
    const rows = db.guides
      .filter((g) => g.status === "in_review")
      .map(withClient)
      .map((g) => ({ ...g, kind: g.published_version ? "updated" : "new", submitted_at: g.intake?.submitted_at || g.updated_at }))
      .sort((a, b) => (b.submitted_at || "").localeCompare(a.submitted_at || ""));
    return wait(rows);
  },

  async getStudioStats() {
    return wait({
      pending: db.guides.filter((g) => g.status === "in_review").length,
      published: db.guides.filter((g) => g.status === "published").length,
      clients: db.clients.length,
      openRequests: db.change_requests.filter((r) => r.status === "open").length,
    });
  },

  async listGuides({ clientId, status, q } = {}) {
    let rows = db.guides.map(withClient);
    if (clientId) rows = rows.filter((g) => g.client_id === clientId);
    if (status) rows = rows.filter((g) => g.status === status);
    if (q) {
      const t = q.toLowerCase();
      rows = rows.filter((g) => [g.property_name, g.city, g.owner_name, g.slug, g.client?.name].some((v) => (v || "").toLowerCase().includes(t)));
    }
    return wait(rows.sort((a, b) => b.updated_at.localeCompare(a.updated_at)));
  },

  async createGuide({ clientId, propertyName, city = "", ownerName = "" }) {
    if (!clientById(clientId)) return fail("Choose a client.");
    if (!propertyName?.trim()) return fail("Add the property name.");
    const g = {
      id: id("g"),
      client_id: clientId,
      slug: null,
      status: "draft",
      draft: { ...emptyGuide(propertyName.trim()), theme: { preset: db.settings.default_theme, colors: {} } },
      published_version: null,
      published_at: null,
      paid: 0,
      payment_method: null,
      payment_amount: null,
      payment_currency: null,
      payment_reference: null,
      paid_at: null,
      owner_name: ownerName,
      city,
      renames: 0,
      updated_at: now(),
      created_at: now(),
    };
    db.guides.push(g);
    log("guide.created", { guide_id: g.id, client_id: clientId });
    persist();
    return wait(withClient(g));
  },

  async getGuide(gid) {
    const g = guideById(gid);
    if (!g) return fail("Guide not found.", 404);
    const history = db.slug_history.filter((s) => s.guide_id === gid);
    return wait({ ...withClient(g), slug_history: history, max_renames: MAX_RENAMES });
  },

  async saveDraft(gid, draft) {
    const g = guideById(gid);
    if (!g) return fail("Guide not found.", 404);
    g.draft = draft;
    g.updated_at = now();
    if (draft.property?.name) g.owner_name = g.owner_name || "";
    persist();
    return wait({ updated_at: g.updated_at });
  },

  async updateGuideMeta(gid, { city, owner_name }) {
    const g = guideById(gid);
    if (!g) return fail("Guide not found.", 404);
    if (city !== undefined) g.city = city;
    if (owner_name !== undefined) g.owner_name = owner_name;
    g.updated_at = now();
    persist();
    return wait(withClient(g));
  },

  async publishGuide(gid) {
    const g = guideById(gid);
    if (!g) return fail("Guide not found.", 404);
    if (g.paid !== 1) return fail("Record the payment before publishing.");
    const v = validateGuide(g.draft);
    if (!v.ok) return fail(v.errors[0]);
    if (!g.slug) return fail("Choose a subdomain before publishing.");
    const fmt = checkSubdomainFormat(g.slug);
    if (fmt) return fail(fmt);
    const next = (g.published_version ?? 0) + 1;
    db.guide_versions.push({ id: db.guide_versions.length + 1, guide_id: gid, version: next, content: g.draft, created_at: now() });
    g.published_version = next;
    g.status = "published";
    g.published_at = now();
    g.updated_at = now();
    if (!db.slug_history.some((s) => s.slug === g.slug)) db.slug_history.push({ slug: g.slug, guide_id: gid, retired_at: null });
    db.intake_links.filter((l) => l.guide_id === gid && l.status === "submitted").forEach((l) => (l.reviewed = true));
    log("guide.published", { guide_id: gid, client_id: g.client_id, detail: { version: next } });
    persist();
    return wait(withClient(g));
  },

  async unpublishGuide(gid) {
    const g = guideById(gid);
    if (!g) return fail("Guide not found.", 404);
    g.status = "unpublished";
    g.updated_at = now();
    log("guide.unpublished", { guide_id: gid, client_id: g.client_id });
    persist();
    return wait(withClient(g));
  },

  async suspendGuide(gid) {
    const g = guideById(gid);
    if (!g) return fail("Guide not found.", 404);
    g.status = "suspended";
    log("guide.suspended", { guide_id: gid, client_id: g.client_id });
    persist();
    return wait(withClient(g));
  },

  /** Sets the first slug, or renames a published guide and keeps the old slug as a redirect forever. */
  async renameGuide(gid, slug) {
    const g = guideById(gid);
    if (!g) return fail("Guide not found.", 404);
    const fmt = checkSubdomainFormat(slug);
    if (fmt) return fail(fmt);
    if (slug === g.slug) return wait(withClient(g));
    const taken = subdomainTaken(slug, { guideId: gid });
    if (taken) return fail(taken);
    const everPublished = g.published_version != null;
    if (everPublished) {
      if (g.renames >= MAX_RENAMES) return fail(`This guide has been renamed ${MAX_RENAMES} times, the limit.`);
      const old = db.slug_history.find((s) => s.slug === g.slug);
      if (old) old.retired_at = now();
      g.renames += 1;
      db.slug_history.push({ slug, guide_id: gid, retired_at: null });
      log("guide.renamed", { guide_id: gid, client_id: g.client_id, detail: { from: g.slug, to: slug } });
    }
    g.slug = slug;
    g.updated_at = now();
    persist();
    return wait(withClient(g));
  },

  async listVersions(gid) {
    return wait(
      db.guide_versions
        .filter((v) => v.guide_id === gid)
        .map(({ content, ...rest }) => ({ ...rest, pages: content.pages?.length ?? 0 }))
        .sort((a, b) => b.version - a.version),
    );
  },

  /** Republishes an older version as a new version number. */
  async restoreVersion(gid, version) {
    const g = guideById(gid);
    const v = db.guide_versions.find((x) => x.guide_id === gid && x.version === version);
    if (!g || !v) return fail("Version not found.", 404);
    g.draft = structuredClone(v.content);
    const next = (g.published_version ?? 0) + 1;
    db.guide_versions.push({ id: db.guide_versions.length + 1, guide_id: gid, version: next, content: g.draft, created_at: now() });
    g.published_version = next;
    g.status = "published";
    g.published_at = now();
    g.updated_at = now();
    log("guide.restored", { guide_id: gid, client_id: g.client_id, detail: { from: version, version: next } });
    persist();
    return wait(withClient(g));
  },

  async markPaid(gid, { method, amount, currency, reference, paidAt }) {
    const g = guideById(gid);
    if (!g) return fail("Guide not found.", 404);
    if (!method) return fail("Choose how they paid.");
    if (!(amount > 0)) return fail("Enter the amount received.");
    Object.assign(g, {
      paid: 1,
      payment_method: method,
      payment_amount: Math.round(amount),
      payment_currency: currency,
      payment_reference: reference || null,
      paid_at: paidAt || now(),
    });
    log("payment.recorded", { guide_id: gid, client_id: g.client_id, detail: { method, amount, currency } });
    persist();
    return wait(withClient(g));
  },

  async markUnpaid(gid) {
    const g = guideById(gid);
    if (!g) return fail("Guide not found.", 404);
    Object.assign(g, { paid: 0, payment_method: null, payment_amount: null, payment_currency: null, payment_reference: null, paid_at: null });
    log("payment.removed", { guide_id: gid, client_id: g.client_id });
    persist();
    return wait(withClient(g));
  },

  async checkSubdomain(name, opts = {}) {
    const fmt = checkSubdomainFormat(name);
    if (fmt) return wait({ available: false, reason: fmt });
    const taken = subdomainTaken(name, opts);
    return wait({ available: !taken, reason: taken });
  },

  /* Intake links */

  async listIntakeLinks() {
    const rows = db.intake_links
      .map((l) => {
        const g = guideById(l.guide_id);
        return { ...l, answers: undefined, guide: g ? withClient(g) : null };
      })
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
    return wait(rows);
  },

  async createIntakeLink({ guideId, clientId, propertyName }) {
    let g = guideId ? guideById(guideId) : null;
    if (!g) {
      if (!clientId) return fail("Choose a client.");
      if (!propertyName?.trim()) return fail("Add the property name.");
      const created = await mockApi.createGuide({ clientId, propertyName });
      g = guideById(created.id);
    }
    const previous = db.intake_links.filter((l) => l.guide_id === g.id).sort((a, b) => b.created_at.localeCompare(a.created_at))[0];
    const link = {
      token: token(),
      guide_id: g.id,
      status: "sent",
      answers: previous?.answers ?? emptyAnswers(g.draft?.property?.name || ""),
      submitted_at: null,
      expires_at: new Date(Date.now() + db.settings.intake_link_days * 86400000).toISOString(),
      created_at: now(),
    };
    if (previous && previous.status !== "expired") previous.status = "expired";
    db.intake_links.push(link);
    log("intake_link.created", { guide_id: g.id, client_id: g.client_id });
    persist();
    return wait({ ...link, answers: undefined, guide: withClient(g) });
  },

  async expireIntakeLink(tok) {
    const l = db.intake_links.find((x) => x.token === tok);
    if (!l) return fail("Link not found.", 404);
    l.status = "expired";
    l.expires_at = now();
    log("intake_link.expired", { guide_id: l.guide_id });
    persist();
    return wait({ ok: true });
  },

  /* Clients */

  async listClients() {
    return wait(
      db.clients.map((c) => ({
        ...c,
        guides: db.guides.filter((g) => g.client_id === c.id).length,
        paid_guides: paidCount(c.id),
        eligible: eligible(c),
        users: db.client_users.filter((u) => u.client_id === c.id),
      })),
    );
  },

  async createClient({ name, subdomain, type }) {
    if (!name?.trim()) return fail("Add the client's name.");
    const fmt = checkSubdomainFormat(subdomain);
    if (fmt) return fail(fmt);
    const taken = subdomainTaken(subdomain);
    if (taken) return fail(taken);
    const c = { id: id("c"), name: name.trim(), subdomain, type, logo_key: null, brand_color: null, custom_domain: null, plan: "standard", dashboard_addon_paid: 0, access_aud: null, created_at: now() };
    db.clients.push(c);
    log("client.created", { client_id: c.id });
    persist();
    return wait(c);
  },

  async updateClient(cid, patch) {
    const c = clientById(cid);
    if (!c) return fail("Client not found.", 404);
    if (patch.subdomain && patch.subdomain !== c.subdomain) {
      const fmt = checkSubdomainFormat(patch.subdomain);
      if (fmt) return fail(fmt);
      const taken = subdomainTaken(patch.subdomain, { clientId: cid });
      if (taken) return fail(taken);
    }
    const allowed = ["name", "subdomain", "type", "dashboard_addon_paid", "access_aud", "brand_color"];
    for (const k of allowed) if (patch[k] !== undefined) c[k] = patch[k];
    log("client.updated", { client_id: cid, detail: patch });
    persist();
    return wait(c);
  },

  /**
   * No real Cloudflare gateway to simulate here either (same reasoning as
   * startPropertyCheckout for the payment gateways): registration succeeds
   * immediately and status reads back as already active, so the studio UI
   * itself can be exercised end to end without a live Cloudflare account.
   */
  async setClientCustomDomain(cid, { domain, scope }) {
    const c = clientById(cid);
    if (!c) return fail("Client not found.", 404);
    const taken = db.clients.some((x) => x.id !== cid && x.custom_domain === domain);
    if (taken) return fail("Another client is already using this domain.");
    if (!domain || !/^[a-z0-9-]+(\.[a-z0-9-]+)+$/i.test(domain)) return fail("Enter a valid domain, like acme-rentals.com.");
    Object.assign(c, {
      custom_domain: domain,
      custom_domain_scope: scope,
      custom_domain_dashboard_hostname_id: scope !== "guides" ? id("ch") : null,
      custom_domain_guides_hostname_id: scope !== "dashboard" ? id("ch") : null,
    });
    log("client.custom_domain_set", { client_id: cid, detail: { domain, scope } });
    persist();
    return wait({
      domain,
      scope,
      dashboard: scope !== "guides" ? { status: "active", sslStatus: "active" } : null,
      guides: scope !== "dashboard" ? { status: "active", sslStatus: "active" } : null,
      cnameTarget: "fallback.villoguides.com",
    });
  },

  async getClientCustomDomainStatus(cid) {
    const c = clientById(cid);
    if (!c || !c.custom_domain) return fail("This client has no custom domain set.");
    return wait({
      domain: c.custom_domain,
      scope: c.custom_domain_scope,
      dashboard: c.custom_domain_dashboard_hostname_id ? { status: "active", sslStatus: "active" } : null,
      guides: c.custom_domain_guides_hostname_id ? { status: "active", sslStatus: "active" } : null,
      cnameTarget: "fallback.villoguides.com",
    });
  },

  async removeClientCustomDomain(cid) {
    const c = clientById(cid);
    if (!c || !c.custom_domain) return fail("This client has no custom domain set.");
    Object.assign(c, { custom_domain: null, custom_domain_scope: null, custom_domain_dashboard_hostname_id: null, custom_domain_guides_hostname_id: null });
    log("client.custom_domain_removed", { client_id: cid });
    persist();
    return wait({ ok: true });
  },

  async addClientUser(cid, { email, role }) {
    const e = (email || "").trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) return fail("Enter a valid email.");
    if (db.client_users.some((u) => u.client_id === cid && u.email === e)) return fail("This email is already on the list.");
    const u = { id: id("u"), client_id: cid, email: e, role, created_at: now() };
    db.client_users.push(u);
    log("client_user.added", { client_id: cid, detail: { email: e, role } });
    persist();
    return wait(u);
  },

  async updateClientUser(uidv, { role }) {
    const u = db.client_users.find((x) => x.id === uidv);
    if (!u) return fail("User not found.", 404);
    u.role = role;
    persist();
    return wait(u);
  },

  async removeClientUser(uidv) {
    const u = db.client_users.find((x) => x.id === uidv);
    db.client_users = db.client_users.filter((x) => x.id !== uidv);
    if (u) log("client_user.removed", { client_id: u.client_id, detail: { email: u.email } });
    persist();
    return wait({ ok: true });
  },

  /* Change requests, activity, settings */

  async listChangeRequests() {
    return wait(
      db.change_requests
        .map((r) => ({ ...r, guide: r.guide_id ? withClient(guideById(r.guide_id)) : null, client: clientById(r.client_id) }))
        .sort((a, b) => b.created_at.localeCompare(a.created_at)),
    );
  },

  async updateChangeRequest(rid, { status }) {
    const r = db.change_requests.find((x) => x.id === rid);
    if (!r) return fail("Request not found.", 404);
    r.status = status;
    log(`change_request.${status}`, { guide_id: r.guide_id, client_id: r.client_id });
    persist();
    return wait(r);
  },

  async listActivity() {
    return wait(
      [...db.audit_log]
        .reverse()
        .map((a) => ({ ...a, guide_name: a.guide_id ? guideById(a.guide_id)?.draft?.property?.name : null, client_name: a.client_id ? clientById(a.client_id)?.name : null })),
    );
  },

  async getSettings() {
    return wait({ ...db.settings, reserved: RESERVED_SUBDOMAINS });
  },

  async updateSettings(patch) {
    db.settings = { ...db.settings, ...patch };
    log("settings.updated", { detail: patch });
    persist();
    return wait(db.settings);
  },

  async resetMockData() {
    db = buildSeed();
    persist();
    return wait({ ok: true });
  },

  /** Editor photo upload. Live: presigned R2 URL. Mock: a short-lived blob: URL, see compressToObjectUrl. */
  async uploadImage(file) {
    return wait({ url: await compressToObjectUrl(file) });
  },

  /* ---------------- Client dashboard ---------------- */

  async getDashboardMe(sub) {
    const c = db.clients.find((x) => x.subdomain === sub);
    if (!c) return fail("Not found.", 404);
    const users = db.client_users.filter((u) => u.client_id === c.id);
    const wantRole = sessionStorage.getItem("vg-mock-role");
    const user = users.find((u) => u.role === wantRole) ?? users.find((u) => u.role === "admin") ?? users[0];
    if (!user) return fail("No staff emails are set up for this client.", 403);
    return wait({ user: { email: user.email, role: user.role }, client: { id: c.id, name: c.name, subdomain: c.subdomain, type: c.type }, eligible: eligible(c) });
  },

  async listDashboardGuides(sub) {
    const c = db.clients.find((x) => x.subdomain === sub);
    if (!c) return fail("Not found.", 404);
    return wait(
      db.guides
        .filter((g) => g.client_id === c.id && g.status === "published")
        .map((g) => {
          const v = db.guide_versions.find((x) => x.guide_id === g.id && x.version === g.published_version);
          return {
            id: g.id,
            slug: g.slug,
            property_name: v?.content.property.name ?? g.draft.property.name,
            city: g.city,
            owner_name: g.owner_name,
            published_at: g.published_at,
            notes: db.guide_notes.filter((n) => n.guide_id === g.id).length,
          };
        })
        .sort((a, b) => a.property_name.localeCompare(b.property_name)),
    );
  },

  async getDashboardGuide(sub, gid) {
    const c = db.clients.find((x) => x.subdomain === sub);
    const g = guideById(gid);
    if (!c || !g || g.client_id !== c.id || g.status !== "published") return fail("Guide not found.", 404);
    const v = db.guide_versions.find((x) => x.guide_id === g.id && x.version === g.published_version);
    return wait({ id: g.id, slug: g.slug, city: g.city, owner_name: g.owner_name, published_at: g.published_at, content: migrate(v.content), client_name: c.name });
  },

  async listNotes(gid) {
    return wait(db.guide_notes.filter((n) => n.guide_id === gid).sort((a, b) => b.created_at.localeCompare(a.created_at)));
  },

  async addNote(gid, body, author) {
    if (!body?.trim()) return fail("Write a note first.");
    const n = { id: id("n"), guide_id: gid, author, body: body.trim(), created_at: now() };
    db.guide_notes.push(n);
    persist();
    return wait(n);
  },

  async createChangeRequest(sub, { guideId, type, body }, requestedBy, role) {
    const c = db.clients.find((x) => x.subdomain === sub);
    if (!c) return fail("Not found.", 404);
    if ((type === "removal" || type === "new_property") && role !== "admin") return fail("Only admins can send this request.", 403);
    if (!body?.trim()) return fail("Describe what should change.");
    const r = { id: id("r"), guide_id: guideId || null, client_id: c.id, type, body: body.trim(), requested_by: requestedBy, status: "open", created_at: now() };
    db.change_requests.push(r);
    log("change_request.created", { guide_id: guideId, client_id: c.id, actor: requestedBy, detail: { type } });
    persist();
    return wait(r);
  },

  /**
   * Mock stands in for both real gateways: no external redirect, no keys
   * needed. Creates the draft guide, marks it paid immediately, and points
   * straight at the app's own "complete" page so the same UI that would run
   * against a real Xendit or PayPal redirect can still be exercised here.
   */
  async startPropertyCheckout(sub, { provider, propertyName, city }) {
    const c = db.clients.find((x) => x.subdomain === sub);
    if (!c) return fail("Not found.", 404);
    if (!propertyName?.trim()) return fail("Add the property name.");
    const guide = await mockApi.createGuide({ clientId: c.id, propertyName, city });
    await mockApi.markPaid(guide.id, {
      method: provider === "paypal" ? "PayPal" : "Xendit (sample)",
      amount: provider === "paypal" ? 1500 : 85000,
      currency: provider === "paypal" ? "USD" : "PHP",
      reference: `MOCK-${guide.id}`,
    });
    return wait({ redirectUrl: dashboardUrl(sub, `/requests/new-property/complete?provider=${provider}&guide=${guide.id}&mock=1`) });
  },

  async getNewPropertyStatus(_sub, guideId) {
    const g = guideById(guideId);
    if (!g) return fail("Not found.", 404);
    return wait({ paid: g.paid === 1, status: g.status, property_name: g.draft?.property?.name });
  },

  /** Real PayPal capture has no mock equivalent worth simulating separately; startPropertyCheckout already marks it paid. */
  async capturePaypalOrder(_sub, { guideId }) {
    return mockApi.getNewPropertyStatus(_sub, guideId);
  },

  async listDashboardRequests(sub) {
    const c = db.clients.find((x) => x.subdomain === sub);
    if (!c) return fail("Not found.", 404);
    return wait(
      db.change_requests
        .filter((r) => r.client_id === c.id)
        .map((r) => ({ ...r, guide: r.guide_id ? { property_name: guideById(r.guide_id)?.draft?.property?.name } : null }))
        .sort((a, b) => b.created_at.localeCompare(a.created_at)),
    );
  },

  /** Live: a ZIP of content and photos. Mock: the same data as one JSON file. */
  async exportClient(sub) {
    const c = db.clients.find((x) => x.subdomain === sub);
    if (!c) return fail("Not found.", 404);
    const guides = db.guides
      .filter((g) => g.client_id === c.id && g.status === "published")
      .map((g) => ({ slug: g.slug, content: db.guide_versions.find((v) => v.guide_id === g.id && v.version === g.published_version)?.content }));
    return wait({ client: c.name, exported_at: now(), guides });
  },

  /* ---------------- Intake form ---------------- */

  async getIntake(tok) {
    const l = db.intake_links.find((x) => x.token === tok);
    if (!l) return fail("This link doesn't exist.", 404);
    const g = guideById(l.guide_id);
    const expired = l.status === "expired" || (l.expires_at && l.expires_at < now());
    if (expired) return fail("This link has expired.", 410);
    return wait({ status: l.status, answers: l.answers ?? emptyAnswers(g?.draft?.property?.name), client_name: clientById(g?.client_id)?.name ?? "" });
  },

  async saveIntake(tok, answers) {
    const l = db.intake_links.find((x) => x.token === tok);
    if (!l || l.status === "expired") return fail("This link has expired.", 410);
    l.answers = answers;
    if (l.status === "sent") l.status = "in_progress";
    persist();
    return wait({ saved_at: now() });
  },

  async uploadIntakePhoto(tok, file) {
    const l = db.intake_links.find((x) => x.token === tok);
    if (!l) return fail("This link has expired.", 410);
    return wait({ url: await compressToObjectUrl(file) });
  },

  async submitIntake(tok, answers) {
    const l = db.intake_links.find((x) => x.token === tok);
    if (!l || l.status === "expired") return fail("This link has expired.", 410);
    const g = guideById(l.guide_id);
    l.answers = answers;
    l.status = "submitted";
    l.submitted_at = now();
    g.draft = mapIntakeToGuide(answers, g.draft);
    g.status = "in_review";
    g.city = answers.property.city || g.city;
    g.owner_name = answers.host.name || g.owner_name;
    g.updated_at = now();
    log("intake.submitted", { guide_id: g.id, client_id: g.client_id, actor: "owner", detail: { update: g.published_version != null } });
    persist();
    return wait({ ok: true });
  },

  /* ---------------- Public ---------------- */

  /** What a hostname resolves to (architecture 4.1). Custom domains (11.3) have no real hostname to resolve locally, so this only covers the ordinary *.villoguides.com case. */
  async resolveHost(sub) {
    if (db.clients.some((c) => c.subdomain === sub)) return wait({ kind: "client", subdomain: sub });
    if (db.guides.some((g) => g.slug === sub)) return wait({ kind: "guide", slug: sub });
    if (db.slug_history.some((s) => s.slug === sub && s.retired_at)) return wait({ kind: "guide", slug: sub });
    return wait({ kind: "none" });
  },

  async getPublicGuide(slug) {
    const g = db.guides.find((x) => x.slug === slug);
    if (!g) {
      const retired = db.slug_history.find((s) => s.slug === slug && s.retired_at);
      if (retired) {
        const target = guideById(retired.guide_id);
        if (target?.slug) return wait({ state: "redirect", slug: target.slug });
      }
      return wait({ state: "notfound" });
    }
    if (g.status === "unpublished" || g.status === "suspended" || !g.published_version) {
      return wait({ state: g.published_version ? "unavailable" : "notfound" });
    }
    const v = db.guide_versions.find((x) => x.guide_id === g.id && x.version === g.published_version);
    return wait({ state: "published", content: migrate(v.content), managedBy: clientById(g.client_id)?.name ?? "" });
  },

  async reportGuide({ guide, reason, details, email }) {
    if (!reason) return fail("Choose a reason.");
    db.reports.push({ guide, reason, details, email, created_at: now() });
    log("guide.reported", { detail: { guide, reason }, actor: "guest" });
    persist();
    return wait({ ok: true });
  },

  /**
   * No real gateway to simulate here, unlike the live Worker this doesn't
   * scope the search to one hostname-resolved guide first, since the mock
   * has no hostname concept to resolve against; it just compares the PIN
   * against whichever published guide actually has a block with this id,
   * which block ids (timestamped and random) are unique enough for.
   */
  async unlockPrivateBlock(blockId, pin) {
    for (const g of db.guides) {
      if (g.status !== "published" || !g.published_version) continue;
      const v = db.guide_versions.find((x) => x.guide_id === g.id && x.version === g.published_version);
      const block = findPrivateBlock(v?.content, blockId);
      if (!block) continue;
      if (block.pin !== pin) return fail("Incorrect PIN.");
      return wait({ body: block.body });
    }
    return fail("Incorrect PIN.");
  },
};

function findPrivateBlock(content, blockId) {
  for (const p of content?.pages ?? []) {
    for (const b of p.blocks ?? []) {
      if (b.type === "private" && b.id === blockId) return b;
    }
  }
  return null;
}

const ALLOWED = ["image/jpeg", "image/png", "image/webp"];

/** Architecture 5.4 and 12: max 1600px WebP, 1 MB after compression, type allowlist. */
export async function compressImage(file) {
  if (!ALLOWED.includes(file.type)) throw new Error("Use a JPG, PNG, or WebP photo.");
  const out = await imageCompression(file, { maxWidthOrHeight: 1600, maxSizeMB: 1, fileType: "image/webp", useWebWorker: true, initialQuality: 0.82 });
  if (out.size > 1024 * 1024) throw new Error("This photo is still over 1 MB after resizing. Try a smaller one.");
  return out;
}

/**
 * The real backend only ever stores a short filename reference in a guide's
 * content (architecture 8.2's 100 KB limit is on that text, never on photo
 * bytes); the actual image lives separately in R2. The mock has no R2, so
 * it used to embed the entire compressed photo as base64 text directly into
 * the content object, which meant a single photo alone could exceed the
 * 100 KB check that was only ever meant to apply to the words of a guide.
 *
 * A blob: URL fixes this correctly rather than working around the symptom:
 * it is short (well under any text limit) and, unlike a data: URL, is a
 * real renderable image reference the browser resolves from memory, not a
 * giant string sitting in the JSON itself. The one honest tradeoff: a
 * blob: URL only lives for the current browser session, so a mock-mode
 * photo does not survive a hard page refresh. That is a real limitation,
 * but specific to this local testing convenience; the deployed backend has
 * no such limitation, since it stores actual files in R2, not object URLs.
 */
async function compressToObjectUrl(file) {
  const out = await compressImage(file);
  return URL.createObjectURL(out);
}
