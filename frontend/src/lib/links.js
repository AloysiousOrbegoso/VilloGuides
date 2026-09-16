/** Official Google Maps search URL format. Opens the Maps app on phones. */
export function mapsSearchUrl(query) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

/**
 * Render-time guard for the one block type that stores an arbitrary URL
 * directly (LinkBlock). Publish-time validation already blocks saving
 * anything that isn't http/https (architecture 12), but that is a soft
 * guard: a future code path, a bug, or a direct API call could still put
 * something else in front of a guest. This is the check that actually
 * protects a guest, since it runs at the moment the link would render as
 * clickable, not just at the moment it was saved.
 */
export function isSafeExternalUrl(url) {
  if (typeof url !== "string" || url.trim() === "") return false;
  try {
    // No base argument: this only ever accepts an already-absolute URL.
    // Passing a base would let an empty string or plain text resolve as a
    // "valid" relative reference against it, which is wrong here, a link
    // block should only ever hold a real external URL, never something
    // that silently resolves to a placeholder domain.
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

const dialable = (v) => v.replace(/[^\d+]/g, "");
export function contactHref(m) {
  switch (m.kind) {
    case "call":
      return `tel:${dialable(m.value)}`;
    case "sms":
      return `sms:${dialable(m.value)}`;
    case "messenger":
      return `https://m.me/${encodeURIComponent(m.value)}`;
    case "email":
      return `mailto:${m.value}`;
  }
}
export const contactIcon = {
  call: "phone",
  sms: "message",
  messenger: "brand-messenger",
  email: "mail",
};
