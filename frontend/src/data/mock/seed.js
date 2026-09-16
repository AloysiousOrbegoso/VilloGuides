import { emptyAnswers, mapIntakeToGuide } from "../../lib/intakeMapper";

/*
  Phase 1 mock data. Every property, person, and number here is fictional.
  Places are real landmarks so map links open somewhere sensible.
  The shape mirrors the D1 tables in architecture section 8.1.
*/

const day = 24 * 60 * 60 * 1000;
const ago = (days, hours = 0) => new Date(Date.now() - days * day - hours * 3600 * 1000).toISOString();
const ahead = (days) => new Date(Date.now() + days * day).toISOString();

const PLACES = {
  Baguio: [
    ["Burnham Park", "Nature", "Rowboats on the lake and a long walk under the pines. Busy on weekends."],
    ["Session Road", "Food", "The main street for cafes, bakeries, and a late dinner."],
    ["Good Shepherd Convent", "Shopping", "Ube jam and cookies made by the sisters. Go early, it sells out."],
    ["Mines View Park", "Nature", "A lookout over the old mining valleys. Best in the morning before the fog."],
  ],
  Boracay: [
    ["White Beach Station 2", "Beach", "The calmest swimming in the morning. Sunset crowds after 5 PM."],
    ["D'Mall", "Shopping", "Pharmacy, groceries, and souvenirs in one place."],
    ["Puka Shell Beach", "Beach", "Quieter and wilder at the north end. Bring water and shade."],
  ],
  Siargao: [
    ["Cloud 9 boardwalk", "Beach", "The famous surf break. Watch from the tower if you are not surfing."],
    ["Magpupungko Rock Pools", "Nature", "Tidal pools that only appear at low tide. Check the tide chart first."],
    ["General Luna public market", "Groceries", "Fresh fish and fruit every morning."],
  ],
  Tagaytay: [
    ["People's Park in the Sky", "Nature", "The highest point in town, with a view of Taal Lake on clear days."],
    ["Picnic Grove", "Nature", "Open lawns and horse rides. Good for families."],
    ["Mahogany Market", "Food", "Bulalo for lunch is the local tradition."],
  ],
  Batangas: [
    ["Anilao dive shops", "Beach", "Snorkel and dive trips leave from the resorts along the coast road."],
    ["Mabini town proper", "Groceries", "Groceries, a pharmacy, and an ATM."],
  ],
};

function answersFor({ name, city, tagline, host, phone, email, wifi, preset, pets = "", sustainability = "" }) {
  const a = emptyAnswers(name);
  a.property = {
    name,
    tagline,
    address: `Sample address, ${city}`,
    city,
    welcome: `Welcome to ${name}. Make yourself at home. Everything you need for your stay is in this guide, and the Wi-Fi password copies with one tap.`,
  };
  a.host = { name: host, phone, messenger: "", email, bio: `${host.split(" ")[0]} looks after ${name} and lives nearby.`, hours: "between 7 AM and 10 PM" };
  a.checkin = {
    checkIn: "2:00 PM",
    checkOut: "11:00 AM",
    keyMethod: "host",
    directions: "We meet you at the gate and walk you through the house.",
    parking: "One parking space in front of the gate.",
    checkoutSteps: "Switch off the aircon and lights.\nLeave used towels in the bathroom.\nLock the door and leave the key on the kitchen table.",
  };
  a.wifi = { network: wifi, password: "sunrise2026", note: "The router is in the living room cabinet if you need to restart it." };
  a.rules = { quietHours: "10 PM to 7 AM", smoking: "no", parties: "no", maxGuests: "6", other: "Please remove shoes indoors." };
  a.amenities = { selected: ["aircon", "hot-shower", "parking", "towels", "workspace"], other: "" };
  a.kitchen = { appliances: ["Stove", "Refrigerator", "Rice cooker", "Kettle"], howTo: "Turn the gas knob at the tank before using the stove, and off again after.", trash: "Separate wet and dry. Collection is on Tuesdays and Fridays." };
  a.places = (PLACES[city] || []).map(([pname, category, note]) => ({ name: pname, category, note }));
  a.emergency = { hospital: `${city} general hospital`, police: "911", barangay: "Barangay hall, two streets down the main road.", hostLine: phone, firstAid: "Kitchen cabinet above the sink.", extinguisher: "Beside the front door." };
  a.pets = pets ? { allowed: pets, fee: pets === "yes" ? "₱500 per stay" : "", rules: pets === "yes" ? "Off the beds and sofas, please." : "" } : a.pets;
  a.sustainability = { notes: sustainability };
  a.branding = { preset, notes: "" };
  a.consent = true;
  return a;
}

function makeGuide({ id, clientId, slug, status, city, owner, paid, publishedDaysAgo, updatedDaysAgo = 1, answers, payment }) {
  const content = mapIntakeToGuide(answers);
  return {
    guide: {
      id,
      client_id: clientId,
      slug,
      status,
      draft: content,
      published_version: publishedDaysAgo != null ? 1 : null,
      published_at: publishedDaysAgo != null ? ago(publishedDaysAgo) : null,
      paid: paid ? 1 : 0,
      payment_method: paid ? payment?.method ?? "GCash" : null,
      payment_amount: paid ? payment?.amount ?? 85000 : null,
      payment_currency: paid ? payment?.currency ?? "PHP" : null,
      payment_reference: paid ? payment?.reference ?? `REF-${id.toUpperCase()}` : null,
      paid_at: paid ? ago((publishedDaysAgo ?? 1) + 1) : null,
      owner_name: owner,
      city,
      renames: 0,
      updated_at: ago(updatedDaysAgo),
      created_at: ago((publishedDaysAgo ?? 3) + 5),
    },
    version: publishedDaysAgo != null ? { guide_id: id, version: 1, content, created_at: ago(publishedDaysAgo) } : null,
  };
}

export function buildSeed() {
  const clients = [
    { id: "c_sunbay", name: "Sunbay Rentals", subdomain: "sunbay", type: "company", logo_key: null, brand_color: null, custom_domain: null, plan: "standard", dashboard_addon_paid: 0, access_aud: "mock-aud-sunbay", created_at: ago(60) },
    { id: "c_pinecrest", name: "Pinecrest Stays", subdomain: "pinecrest", type: "company", logo_key: null, brand_color: null, custom_domain: null, plan: "standard", dashboard_addon_paid: 0, access_aud: "mock-aud-pinecrest", created_at: ago(40) },
    { id: "c_soriano", name: "Ana Soriano", subdomain: "anasoriano", type: "individual", logo_key: null, brand_color: null, custom_domain: null, plan: "standard", dashboard_addon_paid: 1, access_aud: "mock-aud-anasoriano", created_at: ago(30) },
    { id: "c_delacruz", name: "Ramon Dela Cruz", subdomain: "delacruz", type: "individual", logo_key: null, brand_color: null, custom_domain: null, plan: "standard", dashboard_addon_paid: 0, access_aud: null, created_at: ago(6) },
  ];

  const client_users = [
    { id: "u1", client_id: "c_sunbay", email: "maria@sunbayrentals.example", role: "admin", created_at: ago(60) },
    { id: "u2", client_id: "c_sunbay", email: "jun@sunbayrentals.example", role: "support", created_at: ago(50) },
    { id: "u3", client_id: "c_pinecrest", email: "ella@pinecreststays.example", role: "admin", created_at: ago(40) },
    { id: "u4", client_id: "c_soriano", email: "ana.soriano@example.com", role: "admin", created_at: ago(30) },
  ];

  const specs = [
    { id: "g_casaluna", clientId: "c_sunbay", slug: "casaluna", status: "in_review", city: "Baguio", owner: "Lito Ramos", paid: false, updatedDaysAgo: 0,
      answers: answersFor({ name: "Casa Luna", city: "Baguio", tagline: "A pine cabin above Baguio", host: "Lito Ramos", phone: "+63 917 555 0188", email: "lito@example.com", wifi: "CasaLuna_5G", preset: "golden-hour" }) },
    { id: "g_mangogrove", clientId: "c_sunbay", slug: "mangogroveb2", status: "published", city: "Boracay", owner: "Joy Alvarez", paid: true, publishedDaysAgo: 20,
      answers: answersFor({ name: "Mango Grove B2", city: "Boracay", tagline: "Two bedrooms, five minutes from the sand", host: "Joy Alvarez", phone: "+63 917 555 0121", email: "joy@example.com", wifi: "MangoGrove_B2", preset: "reef", pets: "no" }) },
    { id: "g_palmridge", clientId: "c_sunbay", slug: "palmridge4", status: "published", city: "Boracay", owner: "Joy Alvarez", paid: true, publishedDaysAgo: 14,
      answers: answersFor({ name: "Palm Ridge 4", city: "Boracay", tagline: "A quiet villa on the hill road", host: "Joy Alvarez", phone: "+63 917 555 0121", email: "joy@example.com", wifi: "PalmRidge4", preset: "daytime", sustainability: "Refill your bottles from the water dispenser. Solar panels cover most of the daytime power." }) },
    { id: "g_seabreeze", clientId: "c_sunbay", slug: null, status: "draft", city: "Siargao", owner: "Carlo Diaz", paid: false,
      answers: { ...answersFor({ name: "Seabreeze Loft", city: "Siargao", tagline: "", host: "", phone: "", email: "", wifi: "", preset: "daytime" }) } },
    { id: "g_pinehollow", clientId: "c_pinecrest", slug: "pinehollow", status: "published", city: "Baguio", owner: "Ella Cruz", paid: true, publishedDaysAgo: 30, payment: { method: "Bank transfer", amount: 1500, currency: "USD", reference: "BPI-448213" },
      answers: answersFor({ name: "Pine Hollow Cabin", city: "Baguio", tagline: "Fireplace, fog, and strawberry taho", host: "Ella Cruz", phone: "+63 917 555 0133", email: "ella@example.com", wifi: "PineHollow", preset: "golden-hour", pets: "yes" }) },
    { id: "g_cedarhouse", clientId: "c_pinecrest", slug: "cedarhouse", status: "published", city: "Tagaytay", owner: "Ella Cruz", paid: true, publishedDaysAgo: 25,
      answers: answersFor({ name: "Cedar House", city: "Tagaytay", tagline: "A ridge house with a view of Taal", host: "Ella Cruz", phone: "+63 917 555 0133", email: "ella@example.com", wifi: "CedarHouse", preset: "daytime" }) },
    { id: "g_maplenook", clientId: "c_pinecrest", slug: "maplenook", status: "in_review", city: "Tagaytay", owner: "Ella Cruz", paid: true, publishedDaysAgo: 12, updatedDaysAgo: 1,
      answers: answersFor({ name: "Maple Nook", city: "Tagaytay", tagline: "A small studio for two", host: "Ella Cruz", phone: "+63 917 555 0133", email: "ella@example.com", wifi: "MapleNook", preset: "reef" }) },
    { id: "g_bahaykubo", clientId: "c_soriano", slug: "bahaykubo", status: "published", city: "Siargao", owner: "Ana Soriano", paid: true, publishedDaysAgo: 9,
      answers: answersFor({ name: "Bahay Kubo Suites", city: "Siargao", tagline: "Bamboo rooms by the palm groves", host: "Ana Soriano", phone: "+63 917 555 0177", email: "ana.soriano@example.com", wifi: "BahayKubo", preset: "reef" }) },
    { id: "g_villamarisol", clientId: "c_delacruz", slug: "villamarisol", status: "in_review", city: "Batangas", owner: "Ramon Dela Cruz", paid: false, updatedDaysAgo: 2,
      answers: answersFor({ name: "Villa Marisol", city: "Batangas", tagline: "A dive house on the Anilao coast", host: "Ramon Dela Cruz", phone: "+63 917 555 0199", email: "ramon@example.com", wifi: "VillaMarisol", preset: "reef" }) },
  ];

  const built = specs.map(makeGuide);

  // Casa Luna arrives with a lockbox code in its directions, so the studio warning has something to catch.
  const casaAnswers = specs[0].answers;
  casaAnswers.checkin.keyMethod = "lockbox";
  casaAnswers.checkin.directions = "Park on the left of the gate. The key is in the lockbox beside the front door. The code is 4821.";
  built[0].guide.draft = mapIntakeToGuide(casaAnswers);

  const guides = built.map((b) => b.guide);
  const guide_versions = built.filter((b) => b.version).map((b, i) => ({ id: i + 1, ...b.version }));

  const slug_history = [
    { slug: "mangogroveb2", guide_id: "g_mangogrove", retired_at: null },
    { slug: "mangogrove", guide_id: "g_mangogrove", retired_at: ago(18) },
    { slug: "palmridge4", guide_id: "g_palmridge", retired_at: null },
    { slug: "pinehollow", guide_id: "g_pinehollow", retired_at: null },
    { slug: "cedarhouse", guide_id: "g_cedarhouse", retired_at: null },
    { slug: "maplenook", guide_id: "g_maplenook", retired_at: null },
    { slug: "bahaykubo", guide_id: "g_bahaykubo", retired_at: null },
  ];
  guides.find((g) => g.id === "g_mangogrove").renames = 1;

  const seabreeze = specs.find((s) => s.id === "g_seabreeze").answers;
  const intake_links = [
    { token: "k8f2x9q7", guide_id: "g_casaluna", status: "submitted", answers: casaAnswers, submitted_at: ago(0, 3), expires_at: ahead(27), created_at: ago(4) },
    { token: "p3m7r2d9", guide_id: "g_seabreeze", status: "sent", answers: seabreeze, submitted_at: null, expires_at: ahead(29), created_at: ago(1) },
    { token: "z4n8c1v6", guide_id: "g_maplenook", status: "submitted", answers: specs[6].answers, submitted_at: ago(1), expires_at: ahead(20), created_at: ago(15) },
    { token: "t9w2k5h3", guide_id: "g_villamarisol", status: "submitted", answers: specs[8].answers, submitted_at: ago(2), expires_at: ahead(26), created_at: ago(5) },
    { token: "e1x7q2p4", guide_id: "g_palmridge", status: "expired", answers: specs[2].answers, submitted_at: ago(16), expires_at: ago(2), created_at: ago(35) },
  ];

  const guide_notes = [
    { id: "n1", guide_id: "g_mangogrove", author: "maria@sunbayrentals.example", body: "Owner prefers Viber over text messages.", created_at: ago(6) },
    { id: "n2", guide_id: "g_mangogrove", author: "jun@sunbayrentals.example", body: "Guests keep asking about the airport transfer. Maybe add it to the guide.", created_at: ago(2) },
    { id: "n3", guide_id: "g_pinehollow", author: "ella@pinecreststays.example", body: "Fireplace wood is restocked every Friday.", created_at: ago(10) },
  ];

  const change_requests = [
    { id: "r1", guide_id: "g_mangogrove", client_id: "c_sunbay", type: "edit", body: "The Wi-Fi password changed to palmtree88. Please update the guide.", requested_by: "jun@sunbayrentals.example", status: "open", created_at: ago(0, 5) },
    { id: "r2", guide_id: "g_palmridge", client_id: "c_sunbay", type: "edit", body: "Check-out time is now 12:00 PM on weekends.", requested_by: "maria@sunbayrentals.example", status: "open", created_at: ago(3) },
    { id: "r3", guide_id: "g_cedarhouse", client_id: "c_pinecrest", type: "edit", body: "Add the new bakery on the ridge road to the places list.", requested_by: "ella@pinecreststays.example", status: "done", created_at: ago(12) },
  ];

  const audit_log = [
    { id: 1, actor: "studio", action: "guide.published", guide_id: "g_pinehollow", client_id: "c_pinecrest", detail: { version: 1 }, created_at: ago(30) },
    { id: 2, actor: "studio", action: "guide.published", guide_id: "g_cedarhouse", client_id: "c_pinecrest", detail: { version: 1 }, created_at: ago(25) },
    { id: 3, actor: "studio", action: "guide.published", guide_id: "g_mangogrove", client_id: "c_sunbay", detail: { version: 1 }, created_at: ago(20) },
    { id: 4, actor: "studio", action: "guide.renamed", guide_id: "g_mangogrove", client_id: "c_sunbay", detail: { from: "mangogrove", to: "mangogroveb2" }, created_at: ago(18) },
    { id: 5, actor: "studio", action: "guide.published", guide_id: "g_palmridge", client_id: "c_sunbay", detail: { version: 1 }, created_at: ago(14) },
    { id: 6, actor: "studio", action: "guide.published", guide_id: "g_maplenook", client_id: "c_pinecrest", detail: { version: 1 }, created_at: ago(12) },
    { id: 7, actor: "studio", action: "guide.published", guide_id: "g_bahaykubo", client_id: "c_soriano", detail: { version: 1 }, created_at: ago(9) },
    { id: 8, actor: "owner", action: "intake.submitted", guide_id: "g_villamarisol", client_id: "c_delacruz", detail: {}, created_at: ago(2) },
    { id: 9, actor: "owner", action: "intake.submitted", guide_id: "g_maplenook", client_id: "c_pinecrest", detail: { update: true }, created_at: ago(1) },
    { id: 10, actor: "studio", action: "intake_link.created", guide_id: "g_seabreeze", client_id: "c_sunbay", detail: {}, created_at: ago(1) },
    { id: 11, actor: "jun@sunbayrentals.example", action: "change_request.created", guide_id: "g_mangogrove", client_id: "c_sunbay", detail: { type: "edit" }, created_at: ago(0, 5) },
    { id: 12, actor: "owner", action: "intake.submitted", guide_id: "g_casaluna", client_id: "c_sunbay", detail: {}, created_at: ago(0, 3) },
  ];

  const settings = {
    default_theme: "daytime",
    notification_email: "",
    extra_reserved: [],
    intake_link_days: 30,
  };

  const reports = [];

  return { clients, client_users, guides, guide_versions, slug_history, intake_links, guide_notes, change_requests, audit_log, settings, reports };
}

/** The signed-in studio owner in development (DEV_IDENTITY in the Worker). */
export const MOCK_STUDIO_OWNER = "owner@villoguides.com";
