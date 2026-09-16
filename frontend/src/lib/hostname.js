/*
  Decides which area of the app to render.

  Production uses subdomains (architecture section 4):
    villoguides.com, www      brand page
    studio.villoguides.com    studio
    forms.villoguides.com/:t  intake form
    demo.villoguides.com      sample guide
    {name}.villoguides.com    a client dashboard or a guide (the Worker decides which)

  Development uses path prefixes (architecture section 14.1), because subdomains
  are awkward on localhost:
    /            brand page
    /studio      studio
    /d/:client   client dashboard
    /forms/:t    intake form
    /g/:slug     guide
    /demo        sample guide
*/

export const ROOT_DOMAIN = import.meta.env.VITE_ROOT_DOMAIN || "villoguides.com";
export const CONTACT_EMAIL = import.meta.env.VITE_CONTACT_EMAIL || "hello@villoguides.com";

export const RESERVED_SUBDOMAINS = [
  "www", "studio", "forms", "demo", "media", "api", "admin", "app", "portal", "dashboard",
  "mail", "email", "support", "help", "status", "docs", "blog", "login", "signup", "auth",
  "account", "billing", "pay", "checkout", "test", "staging", "dev", "preview", "internal",
  "villo", "villoguides", "villo-guides",
];

export const SUBDOMAIN_PATTERN = /^[a-z0-9](?:[a-z0-9]|-(?!-)){1,38}[a-z0-9]$/;

/** Format and reserved-list check only. Uniqueness is checked by the API. */
export function checkSubdomainFormat(name) {
  if (!name) return "Enter a subdomain.";
  if (name.length < 3 || name.length > 40) return "Use 3 to 40 characters.";
  if (!SUBDOMAIN_PATTERN.test(name)) return "Use lowercase letters, numbers, and single hyphens. It cannot start or end with a hyphen.";
  if (RESERVED_SUBDOMAINS.includes(name)) return "This name is reserved.";
  return null;
}

/** Turns a property name into a subdomain suggestion. */
export function suggestSubdomain(name = "") {
  return name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 40);
}

export function isSubdomainMode(hostname = window.location.hostname) {
  return hostname === ROOT_DOMAIN || hostname.endsWith(`.${ROOT_DOMAIN}`);
}

/**
 * Returns { area, basename, client?, slug?, token?, sub? }.
 * area is one of: brand, studio, dashboard, forms, guide, demo, tenant.
 * "tenant" means a subdomain the Worker must resolve into a client or a guide.
 */
export function resolveLocation(loc = window.location) {
  const { hostname, pathname } = loc;

  if (isSubdomainMode(hostname)) {
    const sub = hostname === ROOT_DOMAIN ? "" : hostname.slice(0, -(ROOT_DOMAIN.length + 1));
    if (sub === "" || sub === "www") return { area: "brand", basename: "" };
    if (sub === "studio") return { area: "studio", basename: "" };
    if (sub === "demo") return { area: "demo", basename: "" };
    if (sub === "forms") return { area: "forms", basename: "", token: pathname.split("/")[1] || "" };
    return { area: "tenant", basename: "", sub };
  }

  const parts = pathname.split("/").filter(Boolean);
  const [first, second] = parts;
  if (first === "studio") return { area: "studio", basename: "/studio" };
  if (first === "demo") return { area: "demo", basename: "/demo" };
  if (first === "forms") return { area: "forms", basename: "/forms", token: second || "" };
  if (first === "d" && second) return { area: "dashboard", basename: `/d/${second}`, client: second };
  if (first === "g" && second) return { area: "guide", basename: `/g/${second}`, slug: second };
  return { area: "brand", basename: "" };
}

/* ---------- URL builders that work in both modes ---------- */

const origin = () => window.location.origin;
const protocol = () => window.location.protocol;

function host(sub) {
  return `${protocol()}//${sub ? `${sub}.` : ""}${ROOT_DOMAIN}`;
}

/** The address shown to people, always the production form. */
export function displayHost(sub) {
  return `${sub}.${ROOT_DOMAIN}`;
}

export function guideUrl(slug) {
  return isSubdomainMode() ? host(slug) : `${origin()}/g/${slug}`;
}

export function dashboardUrl(client, path = "") {
  return isSubdomainMode() ? `${host(client)}${path}` : `${origin()}/d/${client}${path}`;
}

export function studioUrl(path = "") {
  return isSubdomainMode() ? `${host("studio")}${path}` : `${origin()}/studio${path}`;
}

export function intakeUrl(token) {
  return isSubdomainMode() ? `${host("forms")}/${token}` : `${origin()}/forms/${token}`;
}

export function demoUrl() {
  return isSubdomainMode() ? host("demo") : `${origin()}/demo`;
}

export function brandUrl(path = "") {
  return isSubdomainMode() ? `${host("")}${path}` : `${origin()}${path}`;
}

/** Report link shown in every guide footer. */
export function reportUrl(slug) {
  return brandUrl(`/report${slug ? `?guide=${encodeURIComponent(slug)}` : ""}`);
}
