import { mockApi, compressImage } from "../data/mock/mockApi";
import { isSubdomainMode } from "./hostname";

/*
  One API surface for every area. VITE_API_MODE picks the implementation:
    mock  in-browser data (Phase 1)
    live  the Cloudflare Worker (Phase 2 onward), endpoints from architecture section 9

  Components import { api } and never know which one they are talking to.
*/

const MODE = import.meta.env.VITE_API_MODE === "live" ? "live" : "mock";

class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

/**
 * In production the Worker knows the area from the hostname. In development with
 * path routing, every request goes to localhost, so the intended hostname is sent
 * in a header. The Worker must only honour it when DEV_IDENTITY is set (Phase 2).
 */
let devHost = null;
export function setDevHost(host) {
  devHost = host;
}

async function request(method, path, body, { raw = false } = {}) {
  const headers = { Accept: "application/json" };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (devHost && !isSubdomainMode()) headers["X-Villo-Dev-Host"] = devHost;
  const res = await fetch(path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body), credentials: "include" });
  if (!res.ok) {
    let message = "Something went wrong. Try again.";
    try {
      message = (await res.json()).error ?? message;
    } catch {
      /* keep the default message */
    }
    throw new ApiError(message, res.status);
  }
  if (raw) return res;
  return res.status === 204 ? null : res.json();
}

const get = (p) => request("GET", p);
const post = (p, b = {}) => request("POST", p, b);
const put = (p, b) => request("PUT", p, b);
const patch = (p, b) => request("PATCH", p, b);
const qs = (o) => {
  const s = new URLSearchParams(Object.entries(o || {}).filter(([, v]) => v != null && v !== "")).toString();
  return s ? `?${s}` : "";
};

/** Presigned upload: ask the Worker for a URL, PUT the compressed file, return its key URL. */
async function presignedUpload(presignPath, file) {
  const compressed = await compressImage(file);
  const { uploadUrl, url } = await post(presignPath, { contentType: compressed.type, size: compressed.size });
  const res = await fetch(uploadUrl, { method: "PUT", body: compressed, headers: { "Content-Type": compressed.type } });
  if (!res.ok) throw new ApiError("The photo could not be uploaded. Try again.", res.status);
  return { url };
}

const S = "/api/studio";
const D = "/api/dashboard";

const liveApi = {
  mode: "live",

  // Studio
  getStudioMe: () => get(`${S}/me`),
  getQueue: () => get(`${S}/queue`),
  getStudioStats: () => get(`${S}/stats`),
  listGuides: (f) => get(`${S}/guides${qs(f)}`),
  createGuide: (b) => post(`${S}/guides`, b),
  getGuide: (id) => get(`${S}/guides/${id}`),
  saveDraft: (id, draft) => put(`${S}/guides/${id}/draft`, { draft }),
  updateGuideMeta: (id, b) => patch(`${S}/guides/${id}`, b),
  publishGuide: (id) => post(`${S}/guides/${id}/publish`),
  unpublishGuide: (id) => post(`${S}/guides/${id}/unpublish`),
  suspendGuide: (id) => post(`${S}/guides/${id}/suspend`),
  renameGuide: (id, slug) => post(`${S}/guides/${id}/rename`, { slug }),
  listVersions: (id) => get(`${S}/guides/${id}/versions`),
  restoreVersion: (id, v) => post(`${S}/guides/${id}/restore/${v}`),
  markPaid: (id, b) => post(`${S}/guides/${id}/payment`, b),
  markUnpaid: (id) => request("DELETE", `${S}/guides/${id}/payment`),
  checkSubdomain: (name, opts) => get(`${S}/subdomains/${encodeURIComponent(name)}/available${qs(opts)}`),
  listIntakeLinks: () => get(`${S}/intake-links`),
  createIntakeLink: (b) => post(`${S}/intake-links`, b),
  expireIntakeLink: (t) => post(`${S}/intake-links/${t}/expire`),
  listClients: () => get(`${S}/clients`),
  createClient: (b) => post(`${S}/clients`, b),
  updateClient: (id, b) => put(`${S}/clients/${id}`, b),
  setClientCustomDomain: (id, b) => post(`${S}/clients/${id}/custom-domain`, b),
  getClientCustomDomainStatus: (id) => get(`${S}/clients/${id}/custom-domain/status`),
  removeClientCustomDomain: (id) => request("DELETE", `${S}/clients/${id}/custom-domain`),
  addClientUser: (id, b) => post(`${S}/clients/${id}/users`, b),
  updateClientUser: (uid, b) => put(`${S}/client-users/${uid}`, b),
  removeClientUser: (uid) => request("DELETE", `${S}/client-users/${uid}`),
  listChangeRequests: () => get(`${S}/change-requests`),
  updateChangeRequest: (id, b) => patch(`${S}/change-requests/${id}`, b),
  listActivity: () => get(`${S}/activity`),
  getSettings: () => get(`${S}/settings`),
  updateSettings: (b) => put(`${S}/settings`, b),
  resetMockData: async () => ({ ok: false }),
  uploadImage: (file) => presignedUpload(`${S}/uploads/presign`, file),

  // Client dashboard. The client comes from the hostname and the Access JWT, not the argument.
  getDashboardMe: () => get(`${D}/me`),
  listDashboardGuides: () => get(`${D}/guides`),
  getDashboardGuide: (_sub, id) => get(`${D}/guides/${id}`),
  listNotes: (id) => get(`${D}/guides/${id}/notes`),
  addNote: (id, body) => post(`${D}/guides/${id}/notes`, { body }),
  listDashboardRequests: () => get(`${D}/change-requests`),
  createChangeRequest: (_sub, b) => post(`${D}/change-requests`, b),
  startPropertyCheckout: (_sub, b) => post(`${D}/new-property/checkout`, b),
  getNewPropertyStatus: (_sub, guideId) => get(`${D}/new-property/status/${guideId}`),
  capturePaypalOrder: (_sub, b) => post(`${D}/new-property/paypal/capture`, b),
  exportClient: async () => {
    const res = await request("GET", `${D}/export`, undefined, { raw: true });
    return res.blob();
  },

  // Intake
  getIntake: (t) => get(`/api/intake/${t}`),
  saveIntake: (t, answers) => put(`/api/intake/${t}`, { answers }),
  uploadIntakePhoto: (t, file) => presignedUpload(`/api/intake/${t}/uploads/presign`, file),
  submitIntake: (t, answers) => post(`/api/intake/${t}/submit`, { answers }),

  // Public
  resolveHost: () => get(`/api/host`),
  getPublicGuide: async () => {
    try {
      return { state: "published", ...(await get(`/api/guide`)) };
    } catch (e) {
      if (e.status === 404) return { state: "notfound" };
      if (e.status === 410) return { state: "unavailable" };
      throw e;
    }
  },
  reportGuide: (b) => post(`/api/report`, b),
  unlockPrivateBlock: (blockId, pin) => post(`/api/guide/unlock`, { blockId, pin }),
};

export const api = MODE === "live" ? liveApi : mockApi;
export const API_MODE = MODE;
export { ApiError };
