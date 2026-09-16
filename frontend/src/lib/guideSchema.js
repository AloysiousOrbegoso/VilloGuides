import { looksLikeCode } from "./sensitive";

/*
  GuideContent helpers (architecture section 8.2). The same shape is used by the
  intake mapper, the studio editor, the public guide, and the demo. The backend
  validates the same shape with Zod.
*/

export const SCHEMA_VERSION = 1;

export const LIMITS = { pages: 20, places: 30, images: 25, bytes: 100 * 1024 };

// Open item in the architecture (section 16): the Kitchen icon is still to be chosen.
// Change it here and every guide, the editor, and the brand page follow.
export const KITCHEN_ICON = "tools-kitchen-2";

export const STANDARD_SECTIONS = [
  { id: "welcome", type: "welcome", title: "Welcome", icon: "home" },
  { id: "host", type: "host", title: "Meet Hosts", icon: "users" },
  { id: "check-in-out", type: "steps", title: "Check-In/Out", icon: "key" },
  { id: "amenities", type: "list", title: "Amenities", icon: "sparkles" },
  { id: "wifi", type: "wifi", title: "WiFi", icon: "wifi" },
  { id: "house-rules", type: "rules", title: "House Rules", icon: "list-check" },
  { id: "kitchen", type: "steps", title: "Kitchen", icon: KITCHEN_ICON },
  { id: "explore", type: "places", title: "Explore", icon: "map-pin" },
  { id: "emergency", type: "emergency", title: "Emergency", icon: "alert-triangle" },
  { id: "pet-policy", type: "rules", title: "Pet Policy", icon: "paw" },
  { id: "sustainability", type: "text", title: "Sustainability", icon: "leaf" },
  { id: "contact", type: "contact", title: "Contact", icon: "phone" },
];

export const PAGE_TYPE_LABELS = {
  welcome: "Welcome page",
  host: "Host page",
  steps: "Steps page",
  list: "List page",
  wifi: "Wi-Fi page",
  rules: "Rules page",
  places: "Places page",
  emergency: "Emergency page",
  text: "Text page",
  contact: "Contact page",
};

export const BLOCK_TYPES = [
  { type: "text", label: "Text", icon: "align-left" },
  { type: "steps", label: "Steps", icon: "list-numbers" },
  { type: "list", label: "List", icon: "list" },
  { type: "image", label: "Image", icon: "photo" },
  { type: "video", label: "Video", icon: "player-play" },
  { type: "link", label: "Link", icon: "link" },
  { type: "wifi", label: "Wi-Fi", icon: "wifi" },
  { type: "contact", label: "Contact", icon: "address-book" },
  { type: "map-link", label: "Map link", icon: "map-2" },
];

export const blockMeta = (type) => BLOCK_TYPES.find((b) => b.type === type) ?? BLOCK_TYPES[0];

export function uid(prefix = "") {
  const rand = Math.random().toString(36).slice(2, 8);
  return `${prefix}${Date.now().toString(36)}${rand}`;
}

export function newBlock(type) {
  switch (type) {
    case "text": return { type, heading: "", body: "" };
    case "steps": return { type, heading: "", steps: [""] };
    case "list": return { type, heading: "", items: [{ title: "", detail: "", icon: "" }] };
    case "image": return { type, src: "", alt: "", caption: "" };
    case "video": return { type, provider: "youtube", videoId: "", title: "" };
    case "link": return { type, label: "", href: "", description: "" };
    case "wifi": return { type, network: "", password: "", note: "" };
    case "contact": return { type, heading: "", methods: [{ kind: "call", label: "", value: "", detail: "" }] };
    case "map-link": return { type, label: "", query: "", note: "" };
    default: return { type: "text", heading: "", body: "" };
  }
}

export function newPage(title = "New page") {
  return { id: uid("page-"), type: "text", title, icon: "file-text", blocks: [newBlock("text")] };
}

export function emptyGuide(propertyName = "") {
  return {
    schemaVersion: SCHEMA_VERSION,
    property: { name: propertyName, tagline: "", address: "", mapsUrl: "", coverImage: "" },
    host: { name: "", photo: "", phone: "", messenger: "", email: "", bio: "" },
    theme: { preset: "daytime", colors: {} },
    pages: STANDARD_SECTIONS.map((s) => ({ ...s, blocks: [] })),
    places: [],
    emergency: { hospital: "", police: "", barangay: "", hostLine: "" },
  };
}

/** Applied whenever content is read. Bump SCHEMA_VERSION and add a step here for schema changes. */
export function migrate(content) {
  if (!content) return emptyGuide();
  const c = structuredClone(content);
  c.schemaVersion = c.schemaVersion ?? 1;
  c.property = { name: "", tagline: "", address: "", mapsUrl: "", coverImage: "", ...c.property };
  c.host = { name: "", photo: "", phone: "", messenger: "", email: "", bio: "", ...c.host };
  c.theme = { preset: "daytime", colors: {}, ...c.theme };
  c.pages = c.pages ?? [];
  c.places = c.places ?? [];
  c.emergency = { hospital: "", police: "", barangay: "", hostLine: "", ...c.emergency };
  return c;
}

const filled = (v) => typeof v === "string" && v.trim() !== "";

export function isBlockEmpty(b) {
  switch (b.type) {
    case "text": return !filled(b.body);
    case "steps": return !(b.steps ?? []).some(filled);
    case "list": return !(b.items ?? []).some((i) => filled(i.title));
    case "image": return !filled(b.src);
    case "video": return !filled(b.videoId);
    case "link": return !filled(b.href);
    case "wifi": return !filled(b.network) && !filled(b.password);
    case "contact": return !(b.methods ?? []).some((m) => filled(m.value));
    case "map-link": return !filled(b.query);
    default: return true;
  }
}

export function isPageEmpty(page, content) {
  if (page.type === "welcome") return false;
  if (page.type === "places" && content.places.length > 0) return false;
  if (page.type === "host" && (filled(content.host.name) || filled(content.host.bio))) return false;
  return page.blocks.every(isBlockEmpty);
}

/** What guests see: empty sections and empty blocks are left out automatically. */
export function visibleContent(content) {
  const c = migrate(content);
  return {
    ...c,
    pages: c.pages
      .filter((p) => !isPageEmpty(p, c))
      .map((p) => ({ ...p, blocks: p.blocks.filter((b) => !isBlockEmpty(b)) })),
  };
}

export function countImages(content) {
  let n = content.property.coverImage ? 1 : 0;
  if (content.host.photo) n += 1;
  for (const p of content.pages) n += p.blocks.filter((b) => b.type === "image" && b.src).length;
  return n;
}

const isHttp = (url) => /^https?:\/\//i.test(url);

/** Every text field in a block, for the door-code check. */
function blockTexts(b) {
  switch (b.type) {
    case "text": return [b.heading, b.body];
    case "steps": return [b.heading, ...(b.steps ?? [])];
    case "list": return [b.heading, ...(b.items ?? []).flatMap((i) => [i.title, i.detail])];
    case "wifi": return [b.note];
    case "contact": return (b.methods ?? []).map((m) => m.detail);
    case "image": return [b.caption];
    case "link": return [b.description];
    case "map-link": return [b.note];
    default: return [];
  }
}

export function blockHasCode(b) {
  return blockTexts(b).some(looksLikeCode);
}

export function pageWarnings(page) {
  return page.blocks.filter(blockHasCode).length;
}

/** Light client-side validation. The Worker repeats it with Zod before publishing. */
export function validateGuide(content) {
  const errors = [];
  const c = migrate(content);
  if (!filled(c.property.name)) errors.push("Add the property name.");
  if (c.pages.length > LIMITS.pages) errors.push(`Use at most ${LIMITS.pages} pages.`);
  if (c.places.length > LIMITS.places) errors.push(`Use at most ${LIMITS.places} places.`);
  if (countImages(c) > LIMITS.images) errors.push(`Use at most ${LIMITS.images} images.`);
  const size = new Blob([JSON.stringify(c)]).size;
  if (size > LIMITS.bytes) errors.push("The guide is over 100 KB of text. Shorten some sections.");
  for (const p of c.pages) {
    for (const b of p.blocks) {
      if (b.type === "link" && filled(b.href) && !isHttp(b.href)) errors.push(`${p.title}: links must start with http or https.`);
      if (b.type === "video" && filled(b.videoId) && !/^[\w-]{5,20}$/.test(b.videoId)) errors.push(`${p.title}: the video ID looks wrong.`);
    }
  }
  for (const pl of c.places) {
    if (filled(pl.mapsUrl) && !isHttp(pl.mapsUrl)) errors.push(`${pl.name || "A place"}: the map link must start with http or https.`);
  }
  const shown = visibleContent(c).pages.length;
  return { ok: errors.length === 0, errors, shown, total: c.pages.length, bytes: size };
}

/** Accepts a YouTube or Vimeo URL or a bare ID. Only the provider and ID are stored. */
export function parseVideo(input) {
  const s = (input || "").trim();
  let m = s.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{6,20})/);
  if (m) return { provider: "youtube", videoId: m[1] };
  m = s.match(/vimeo\.com\/(?:video\/)?(\d{5,12})/);
  if (m) return { provider: "vimeo", videoId: m[1] };
  if (/^\d{5,12}$/.test(s)) return { provider: "vimeo", videoId: s };
  if (/^[\w-]{6,20}$/.test(s)) return { provider: "youtube", videoId: s };
  return null;
}
