/**
 * Server-side twin of frontend/src/lib/intakeMapper.js. Kept here so intake
 * links start with a correctly-shaped answers object (used in Phase 2 by
 * createIntakeLink) and so the Worker can re-run the same mapping on submit
 * in Phase 3, rather than trusting whatever shape the client sends.
 *
 * If the frontend's question set changes, mirror the change here. The two
 * are intentionally duplicated rather than shared, since the frontend and
 * the Worker build separately (JS/Vite vs TypeScript/Wrangler).
 */

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
    amenities: { selected: [] as string[], other: "" },
    kitchen: { appliances: [] as string[], howTo: "", trash: "" },
    places: [] as { name: string; category: string; note: string }[],
    emergency: { hospital: "", police: "911", barangay: "", hostLine: "", firstAid: "", extinguisher: "" },
    pets: { allowed: "", fee: "", rules: "" },
    sustainability: { notes: "" },
    photos: { cover: "", gallery: [] as { url: string; caption: string }[] },
    branding: { preset: "daytime", notes: "" },
    consent: false,
  };
}

export type IntakeAnswers = ReturnType<typeof emptyAnswers>;

const has = (v: unknown): v is string => typeof v === "string" && v.trim() !== "";
const lines = (v: string | undefined) => (v || "").split("\n").map((s) => s.trim()).filter(Boolean);

function mapsSearchUrl(query: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

const STANDARD_SECTIONS = [
  { id: "welcome", type: "welcome", title: "Welcome", icon: "home" },
  { id: "host", type: "host", title: "Meet Hosts", icon: "users" },
  { id: "check-in-out", type: "steps", title: "Check-In/Out", icon: "key" },
  { id: "amenities", type: "list", title: "Amenities", icon: "sparkles" },
  { id: "wifi", type: "wifi", title: "WiFi", icon: "wifi" },
  { id: "house-rules", type: "rules", title: "House Rules", icon: "list-check" },
  { id: "kitchen", type: "steps", title: "Kitchen", icon: "tools-kitchen-2" },
  { id: "explore", type: "places", title: "Explore", icon: "map-pin" },
  { id: "emergency", type: "emergency", title: "Emergency", icon: "alert-triangle" },
  { id: "pet-policy", type: "rules", title: "Pet Policy", icon: "paw" },
  { id: "sustainability", type: "text", title: "Sustainability", icon: "leaf" },
  { id: "contact", type: "contact", title: "Contact", icon: "phone" },
];

function page(id: string, blocks: unknown[]) {
  const def = STANDARD_SECTIONS.find((s) => s.id === id)!;
  return { ...def, blocks: blocks.filter(Boolean) };
}
const text = (heading: string, body: string | undefined) => (has(body) ? { type: "text", heading: heading || "", body: body!.trim() } : null);
const list = (heading: string, items: { title: string; detail?: string; icon?: string }[]) => (items.length ? { type: "list", heading: heading || "", items } : null);
const steps = (heading: string, arr: string[]) => (arr.length ? { type: "steps", heading: heading || "", steps: arr } : null);

/**
 * Turns intake answers into GuideContent (architecture 8.2, 10.1 step 4).
 * `existing` lets a resubmission update a guide that already has custom pages
 * or a chosen theme, without clobbering anything the studio added by hand.
 */
export function mapIntakeToGuide(answers: IntakeAnswers, existing?: Record<string, unknown>) {
  const a = answers;
  const base = (existing as Record<string, any>) ?? {
    property: {}, host: {}, theme: { preset: "daytime", colors: {} }, pages: [], places: [], emergency: {},
  };
  const city = a.property.city;

  const contactMethods = [
    has(a.host.phone) && { kind: "call", label: "Call", value: a.host.phone, detail: a.host.hours || "" },
    has(a.host.phone) && { kind: "sms", label: "Send a text", value: a.host.phone, detail: "" },
    has(a.host.messenger) && { kind: "messenger", label: "Message on Messenger", value: a.host.messenger, detail: "" },
    has(a.host.email) && { kind: "email", label: "Email", value: a.host.email, detail: "" },
  ].filter(Boolean) as { kind: string; label: string; value: string; detail: string }[];

  const keyLabel = KEY_METHODS.find((k) => k.id === a.checkin.keyMethod)?.label;

  const amenityItems = a.amenities.selected
    .map((id) => AMENITY_OPTIONS.find((o) => o.id === id))
    .filter(Boolean)
    .map((o) => ({ title: o!.label, detail: "", icon: o!.icon }));
  lines(a.amenities.other).forEach((t) => amenityItems.push({ title: t, detail: "", icon: "check" }));

  const ruleItems = [
    has(a.rules.quietHours) && { title: "Quiet hours", detail: a.rules.quietHours, icon: "moon" },
    a.rules.smoking === "no" && { title: "No smoking", detail: "Not anywhere on the property.", icon: "smoking-no" },
    a.rules.smoking === "outside" && { title: "Smoking outside only", detail: "Please use the outdoor areas.", icon: "smoking" },
    a.rules.parties === "no" && { title: "No parties or events", detail: "", icon: "confetti-off" },
    a.rules.parties === "ask" && { title: "Events by request", detail: "Ask the host before planning a gathering.", icon: "confetti" },
    has(a.rules.maxGuests) && { title: "Maximum guests", detail: `${a.rules.maxGuests} people, including visitors.`, icon: "users" },
  ].filter(Boolean) as { title: string; detail: string; icon: string }[];
  lines(a.rules.other).forEach((t) => ruleItems.push({ title: t, detail: "", icon: "point" }));

  const emergencyItems = [
    has(a.emergency.firstAid) && { title: "First aid kit", detail: a.emergency.firstAid, icon: "first-aid-kit" },
    has(a.emergency.extinguisher) && { title: "Fire extinguisher", detail: a.emergency.extinguisher, icon: "flame" },
  ].filter(Boolean) as { title: string; detail: string; icon: string }[];

  const emergencyContacts = [
    has(a.emergency.police) && { kind: "call", label: `Call ${a.emergency.police}`, value: a.emergency.police, detail: "Police, fire, and ambulance" },
    has(a.emergency.hostLine) && { kind: "call", label: "Call the host emergency line", value: a.emergency.hostLine, detail: "For anything urgent at the property" },
  ].filter(Boolean) as { kind: string; label: string; value: string; detail: string }[];

  const petBlocks: unknown[] = [];
  if (a.pets.allowed === "no") petBlocks.push(text("", "Pets are not allowed at this property."));
  if (a.pets.allowed === "yes" || a.pets.allowed === "ask") {
    const items: { title: string; detail: string; icon: string }[] = [];
    if (a.pets.allowed === "ask") items.push({ title: "Ask first", detail: "Message the host before bringing a pet.", icon: "message" });
    if (has(a.pets.fee)) items.push({ title: "Pet fee", detail: a.pets.fee, icon: "receipt" });
    lines(a.pets.rules).forEach((t) => items.push({ title: t, detail: "", icon: "paw" }));
    petBlocks.push(text("", a.pets.allowed === "yes" ? "Pets are welcome." : ""), list("", items));
  }

  const gallery = a.photos.gallery.map((g) => ({ type: "image", src: g.url, alt: g.caption || a.property.name, caption: g.caption || "" }));

  const pages = [
    page("welcome", [text("", a.property.welcome), ...gallery.slice(0, 6)]),
    page("host", [
      text("When to reach us", a.host.hours ? `Messages are answered ${a.host.hours}.` : undefined),
      contactMethods.length ? { type: "contact", heading: "", methods: contactMethods } : null,
    ]),
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
      list("What's in the kitchen", a.kitchen.appliances.map((t) => ({ title: t, detail: "", icon: "tools-kitchen-2" }))),
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

  const standardIds = new Set(STANDARD_SECTIONS.map((s) => s.id));
  const custom = (base.pages ?? []).filter((p: { id: string }) => !standardIds.has(p.id));

  return {
    schemaVersion: 1,
    property: {
      ...base.property,
      name: a.property.name,
      tagline: a.property.tagline,
      address: a.property.address,
      mapsUrl: has(a.property.address) ? mapsSearchUrl([a.property.address, city].filter(has).join(", ")) : base.property?.mapsUrl ?? "",
      coverImage: a.photos.cover || base.property?.coverImage || "",
    },
    host: { ...base.host, name: a.host.name, phone: a.host.phone, messenger: a.host.messenger, email: a.host.email, bio: a.host.bio },
    theme: { ...(base.theme ?? { preset: "daytime", colors: {} }), preset: a.branding.preset || base.theme?.preset || "daytime" },
    pages: [...pages, ...custom],
    places: a.places
      .filter((p) => has(p.name))
      .slice(0, 30)
      .map((p) => ({ name: p.name.trim(), category: p.category || "", note: p.note || "", mapsUrl: mapsSearchUrl([p.name, city].filter(has).join(", ")) })),
    emergency: { hospital: a.emergency.hospital, police: a.emergency.police, barangay: a.emergency.barangay, hostLine: a.emergency.hostLine },
  };
}
