import { KITCHEN_ICON, SCHEMA_VERSION, STANDARD_SECTIONS, emptyGuide, migrate } from "./guideSchema";
import { mapsSearchUrl } from "./links";

/*
  Intake answers to GuideContent (architecture 10.1, step 4).
  The owner answers plain questions. This file turns them into guide pages.
  Empty answers produce empty pages, which guests never see.
*/

export const INTAKE_STEPS = [
  { id: "property", title: "Property basics" },
  { id: "host", title: "About you" },
  { id: "checkin", title: "Check-in and check-out" },
  { id: "wifi", title: "Wi-Fi" },
  { id: "rules", title: "House rules" },
  { id: "amenities", title: "Amenities" },
  { id: "kitchen", title: "Kitchen" },
  { id: "places", title: "Places nearby" },
  { id: "emergency", title: "Emergency" },
  { id: "pets", title: "Pet policy" },
  { id: "sustainability", title: "Sustainability" },
  { id: "photos", title: "Photos" },
  { id: "branding", title: "Look and feel" },
  { id: "review", title: "Review" },
];

export const AMENITY_OPTIONS = [
  { id: "aircon", label: "Air conditioning", icon: "air-conditioning" },
  { id: "hot-shower", label: "Hot shower", icon: "droplet" },
  { id: "pool", label: "Pool", icon: "pool" },
  { id: "beach", label: "Beach access", icon: "beach" },
  { id: "parking", label: "Parking", icon: "car" },
  { id: "washer", label: "Washing machine", icon: "wash-machine" },
  { id: "tv", label: "TV", icon: "device-tv" },
  { id: "workspace", label: "Workspace", icon: "desk" },
  { id: "grill", label: "Grill", icon: "grill" },
  { id: "fireplace", label: "Fireplace", icon: "flame" },
  { id: "generator", label: "Backup power", icon: "bolt" },
  { id: "towels", label: "Towels and linens", icon: "bed" },
];

export const KITCHEN_OPTIONS = [
  "Stove", "Oven", "Microwave", "Refrigerator", "Rice cooker", "Coffee maker", "Kettle", "Water dispenser", "Toaster", "Blender",
];

export const PLACE_CATEGORIES = ["Food", "Coffee", "Beach", "Nature", "Culture", "Shopping", "Day trip", "Groceries", "Pharmacy"];

export const KEY_METHODS = [
  { id: "lockbox", label: "Lockbox" },
  { id: "host", label: "Host meets them" },
  { id: "smartlock", label: "Smart lock" },
  { id: "front-desk", label: "Front desk" },
];

export function emptyAnswers(propertyName = "") {
  return {
    property: { name: propertyName, tagline: "", address: "", city: "", welcome: "" },
    host: { name: "", phone: "", messenger: "", email: "", bio: "", hours: "" },
    checkin: { checkIn: "2:00 PM", checkOut: "11:00 AM", keyMethod: "", directions: "", parking: "", checkoutSteps: "" },
    wifi: { network: "", password: "", note: "" },
    rules: { quietHours: "", smoking: "", parties: "", maxGuests: "", other: "" },
    amenities: { selected: [], other: "" },
    kitchen: { appliances: [], howTo: "", trash: "" },
    places: [],
    emergency: { hospital: "", police: "911", barangay: "", hostLine: "", firstAid: "", extinguisher: "" },
    pets: { allowed: "", fee: "", rules: "" },
    sustainability: { notes: "" },
    photos: { cover: "", gallery: [] },
    branding: { preset: "daytime", notes: "" },
    consent: false,
  };
}

const has = (v) => typeof v === "string" && v.trim() !== "";
const lines = (v) => (v || "").split("\n").map((s) => s.trim()).filter(Boolean);

/** Whether the owner filled anything in on a step. Used by the review step. */
export function stepFilled(answers, stepId) {
  const a = answers[stepId];
  if (stepId === "places") return (answers.places || []).some((p) => has(p.name));
  if (stepId === "photos") return has(answers.photos?.cover) || (answers.photos?.gallery || []).length > 0;
  if (stepId === "amenities") return (a.selected || []).length > 0 || has(a.other);
  if (stepId === "kitchen") return (a.appliances || []).length > 0 || has(a.howTo) || has(a.trash);
  if (stepId === "branding") return true;
  if (stepId === "emergency") return ["hospital", "barangay", "hostLine", "firstAid", "extinguisher"].some((k) => has(a[k]));
  if (stepId === "checkin") return true;
  return Object.values(a || {}).some((v) => (Array.isArray(v) ? v.length > 0 : has(String(v ?? ""))));
}

/** Required answers, flagged before submit. Returns { stepId: message }. */
export function missingRequired(answers) {
  const out = {};
  if (!has(answers.property.name)) out.property = "Add the property name.";
  if (!has(answers.host.name)) out.host = "Add the host's name.";
  else if (!has(answers.host.phone) && !has(answers.host.email)) out.host = "Add a phone number or email so guests can reach you.";
  if (!has(answers.checkin.checkIn) || !has(answers.checkin.checkOut)) out.checkin = "Add check-in and check-out times.";
  return out;
}

function page(id, blocks) {
  const def = STANDARD_SECTIONS.find((s) => s.id === id);
  return { ...def, blocks: blocks.filter(Boolean) };
}

const text = (heading, body) => (has(body) ? { type: "text", heading: heading || "", body: body.trim() } : null);
const list = (heading, items) => (items.length ? { type: "list", heading: heading || "", items } : null);
const steps = (heading, arr) => (arr.length ? { type: "steps", heading: heading || "", steps: arr } : null);

export function mapIntakeToGuide(answers, existing) {
  const a = answers;
  const base = existing ? migrate(existing) : emptyGuide(a.property.name);
  const city = a.property.city;

  const contactMethods = [
    has(a.host.phone) && { kind: "call", label: "Call", value: a.host.phone, detail: a.host.hours || "" },
    has(a.host.phone) && { kind: "sms", label: "Send a text", value: a.host.phone, detail: "" },
    has(a.host.messenger) && { kind: "messenger", label: "Message on Messenger", value: a.host.messenger, detail: "" },
    has(a.host.email) && { kind: "email", label: "Email", value: a.host.email, detail: "" },
  ].filter(Boolean);

  const keyLabel = KEY_METHODS.find((k) => k.id === a.checkin.keyMethod)?.label;

  const amenityItems = (a.amenities.selected || [])
    .map((id) => AMENITY_OPTIONS.find((o) => o.id === id))
    .filter(Boolean)
    .map((o) => ({ title: o.label, detail: "", icon: o.icon }));
  lines(a.amenities.other).forEach((t) => amenityItems.push({ title: t, detail: "", icon: "check" }));

  const ruleItems = [
    has(a.rules.quietHours) && { title: "Quiet hours", detail: a.rules.quietHours, icon: "moon" },
    a.rules.smoking === "no" && { title: "No smoking", detail: "Not anywhere on the property.", icon: "smoking-no" },
    a.rules.smoking === "outside" && { title: "Smoking outside only", detail: "Please use the outdoor areas.", icon: "smoking" },
    a.rules.parties === "no" && { title: "No parties or events", detail: "", icon: "confetti-off" },
    a.rules.parties === "ask" && { title: "Events by request", detail: "Ask the host before planning a gathering.", icon: "confetti" },
    has(a.rules.maxGuests) && { title: "Maximum guests", detail: `${a.rules.maxGuests} people, including visitors.`, icon: "users" },
  ].filter(Boolean);
  lines(a.rules.other).forEach((t) => ruleItems.push({ title: t, detail: "", icon: "point" }));

  const emergencyItems = [
    has(a.emergency.firstAid) && { title: "First aid kit", detail: a.emergency.firstAid, icon: "first-aid-kit" },
    has(a.emergency.extinguisher) && { title: "Fire extinguisher", detail: a.emergency.extinguisher, icon: "flame" },
  ].filter(Boolean);

  const emergencyContacts = [
    has(a.emergency.police) && { kind: "call", label: `Call ${a.emergency.police}`, value: a.emergency.police, detail: "Police, fire, and ambulance" },
    has(a.emergency.hostLine) && { kind: "call", label: "Call the host emergency line", value: a.emergency.hostLine, detail: "For anything urgent at the property" },
  ].filter(Boolean);

  const petBlocks = [];
  if (a.pets.allowed === "no") petBlocks.push(text("", "Pets are not allowed at this property."));
  if (a.pets.allowed === "yes" || a.pets.allowed === "ask") {
    const items = [];
    if (a.pets.allowed === "ask") items.push({ title: "Ask first", detail: "Message the host before bringing a pet.", icon: "message" });
    if (has(a.pets.fee)) items.push({ title: "Pet fee", detail: a.pets.fee, icon: "receipt" });
    lines(a.pets.rules).forEach((t) => items.push({ title: t, detail: "", icon: "paw" }));
    petBlocks.push(text("", a.pets.allowed === "yes" ? "Pets are welcome." : ""), list("", items));
  }

  const gallery = (a.photos.gallery || []).map((g) => ({ type: "image", src: g.url, alt: g.caption || a.property.name, caption: g.caption || "" }));

  const pages = [
    page("welcome", [text("", a.property.welcome), ...gallery.slice(0, 6)]),
    page("host", [text("When to reach us", a.host.hours ? `Messages are answered ${a.host.hours}.` : ""), contactMethods.length ? { type: "contact", heading: "", methods: contactMethods } : null]),
    page("check-in-out", [
      list("Times", [
        { title: "Check-in", detail: has(a.checkin.checkIn) ? `From ${a.checkin.checkIn}` : "", icon: "door-enter" },
        { title: "Check-out", detail: has(a.checkin.checkOut) ? `By ${a.checkin.checkOut}` : "", icon: "door-exit" },
      ]),
      text("Getting in", [keyLabel ? `Key: ${keyLabel}.` : "", a.checkin.directions].filter(has).join("\n\n")),
      text("Parking", a.checkin.parking),
      steps("Before you leave", lines(a.checkin.checkoutSteps)),
    ]),
    page("amenities", [list("", amenityItems)]),
    page("wifi", [has(a.wifi.network) || has(a.wifi.password) ? { type: "wifi", network: a.wifi.network, password: a.wifi.password, note: a.wifi.note } : null]),
    page("house-rules", [list("", ruleItems)]),
    page("kitchen", [
      list("What's in the kitchen", (a.kitchen.appliances || []).map((t) => ({ title: t, detail: "", icon: KITCHEN_ICON }))),
      text("How to use it", a.kitchen.howTo),
      text("Trash and recycling", a.kitchen.trash),
    ]),
    page("explore", []),
    page("emergency", [
      emergencyContacts.length ? { type: "contact", heading: "Emergency numbers", methods: emergencyContacts, urgent: true } : null,
      has(a.emergency.hospital) ? { type: "map-link", label: "Nearest hospital", query: a.emergency.hospital, note: "" } : null,
      text("Barangay hall", a.emergency.barangay),
      list("In the house", emergencyItems),
    ]),
    page("pet-policy", petBlocks),
    page("sustainability", [text("", a.sustainability.notes)]),
    page("contact", [contactMethods.length ? { type: "contact", heading: "", methods: contactMethods } : null]),
  ];

  // Keep any custom pages the studio already added to this guide.
  const standardIds = new Set(STANDARD_SECTIONS.map((s) => s.id));
  const custom = base.pages.filter((p) => !standardIds.has(p.id));

  return {
    ...base,
    schemaVersion: SCHEMA_VERSION,
    property: {
      ...base.property,
      name: a.property.name,
      tagline: a.property.tagline,
      address: a.property.address,
      mapsUrl: has(a.property.address) ? mapsSearchUrl([a.property.address, city].filter(has).join(", ")) : base.property.mapsUrl,
      coverImage: a.photos.cover || base.property.coverImage,
    },
    host: { ...base.host, name: a.host.name, phone: a.host.phone, messenger: a.host.messenger, email: a.host.email, bio: a.host.bio },
    theme: { ...base.theme, preset: a.branding.preset || base.theme.preset },
    pages: [...pages, ...custom],
    places: (a.places || [])
      .filter((p) => has(p.name))
      .slice(0, 30)
      .map((p) => ({
        name: p.name.trim(),
        category: p.category || "",
        note: p.note || "",
        mapsUrl: mapsSearchUrl([p.name, city].filter(has).join(", ")),
      })),
    emergency: { hospital: a.emergency.hospital, police: a.emergency.police, barangay: a.emergency.barangay, hostLine: a.emergency.hostLine },
  };
}
