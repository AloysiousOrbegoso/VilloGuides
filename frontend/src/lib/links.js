/** Official Google Maps search URL format. Opens the Maps app on phones. */
export function mapsSearchUrl(query) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
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
