import { mapsSearchUrl } from "../lib/links";
import cover from "../assets/demo/cover.svg";
/**
 * Casa de Vista is fictional. The surrounding town and landmarks are real so
 * that the map links genuinely work; the house, hosts, and phone numbers are not.
 */
const HOST_PHONE = "+63 917 555 0142"; // sample number, not a real line
const HOST_EMAIL = "hello@casadevista.example"; // .example is a reserved, non-deliverable domain
export const casaDeVista = {
  schemaVersion: 1,
  property: {
    name: "Casa de Vista",
    tagline: "A small beach house on the La Union coast",
    address: "Sample address, San Juan, La Union",
    mapsUrl: mapsSearchUrl("San Juan, La Union"),
    coverImage: cover,
  },
  host: {
    name: "Tessa and Migs Reyes",
    photo: "",
    phone: HOST_PHONE,
    messenger: "",
    email: HOST_EMAIL,
    bio: "Migs grew up spending summers in this house. Tessa came for a weekend twelve years ago and stayed. Between them they can fix a sticky door, recommend the right surf break for your level, and tell you which bakery sells out of pan de coco first.",
  },
  theme: { preset: "daytime", colors: {} },
  pages: [
    {
      id: "welcome",
      type: "welcome",
      title: "Welcome",
      icon: "home",
      blocks: [
        {
          type: "text",
          body: "Welcome in. Drop your bags, kick off your sandals. The sea is about forty steps past the back gate.\n\nCasa de Vista started as Migs's grandmother's weekend house. We kept her capiz windows, her narra dining table, and her rule that nobody leaves hungry. Everything else we rebuilt slowly, one rainy season at a time.",
        },
        {
          type: "text",
          heading: "Using this guide",
          body: "Everything about the house is in the sections here. If you only read one thing before you arrive, make it Check-In/Out. The Wi-Fi password copies with one tap.",
        },
      ],
    },
    {
      id: "host",
      type: "host",
      title: "Meet Hosts",
      icon: "users",
      blocks: [
        {
          type: "text",
          heading: "When to reach us",
          body: "We live ten minutes up the road in town, so we're close if something needs fixing. Messages get a reply within the hour between 7 AM and 10 PM. Outside those hours, use the emergency line on the Emergency page.",
        },
        {
          type: "contact",
          methods: [
            { kind: "call", label: "Call Tessa", value: HOST_PHONE },
            { kind: "sms", label: "Send a text", value: HOST_PHONE },
          ],
        },
      ],
    },
    {
      id: "check-in-out",
      type: "steps",
      title: "Check-In/Out",
      icon: "key",
      blocks: [
        {
          type: "list",
          heading: "Times",
          items: [
            { title: "Check-in", detail: "From 2:00 PM", icon: "door-enter" },
            { title: "Check-out", detail: "By 11:00 AM", icon: "door-exit" },
            {
              title: "Early or late",
              detail: "Ask us a day ahead. If the house is free, the answer is yes.",
              icon: "clock",
            },
          ],
        },
        {
          type: "map-link",
          label: "Directions to the house",
          query: "San Juan, La Union",
          note: "From Manila it's five to six hours by car via TPLEX. The last turn is easy to miss: look for the blue gate just after the sari-sari store with the red awning.",
        },
        {
          type: "steps",
          heading: "Getting in",
          steps: [
            "Park inside the gate on the gravel, nose facing the house.",
            "The lockbox is on the left gatepost, behind the bougainvillea. The code is 2604.",
            "Take the brass key, close the lockbox, and scramble the numbers.",
            "The front door sticks in humid weather. Lift the handle slightly as you turn the key.",
            "If the lights don't come on, flip the main breaker in the hallway cabinet.",
          ],
        },
        {
          type: "steps",
          heading: "Before you leave",
          steps: [
            "Leave dishes in the sink or run the dishwasher. Either is fine.",
            "Put used towels in the laundry basket by the outdoor shower.",
            "Switch off every aircon unit and close the capiz windows.",
            "Take the trash out to the bins by the gate, sorted as the Kitchen section describes.",
            "Lock the front door, return the key to the lockbox, and scramble the code.",
          ],
        },
      ],
    },
    {
      id: "amenities",
      type: "list",
      title: "Amenities",
      icon: "sparkles",
      blocks: [
        {
          type: "list",
          items: [
            {
              title: "Pool",
              detail:
                "Saltwater, 1.4 m at the deep end. There's no lifeguard, so kids need an adult poolside.",
              icon: "pool",
            },
            {
              title: "Beach access",
              detail: "A private path from the back garden. Forty steps to the sand.",
              icon: "beach",
            },
            {
              title: "Aircon",
              detail: "In every bedroom. Remotes live in the bedside table drawers.",
              icon: "air-conditioning",
            },
            {
              title: "Kayaks",
              detail: "Two sit-on-top kayaks under the stairs, with life vests. Stay inside the point.",
              icon: "kayak",
            },
            {
              title: "Laundry",
              detail:
                "Washer by the outdoor shower. Line-dry on the roof deck; on a sunny day things dry in two hours.",
              icon: "wash-machine",
            },
            {
              title: "Outdoor shower",
              detail: "For rinsing off sand before you come inside. Hot water takes a minute to arrive.",
              icon: "droplet",
            },
            {
              title: "Parking",
              detail: "Room for two cars inside the gate. A third fits on the road shoulder.",
              icon: "car",
            },
          ],
        },
      ],
    },
    {
      id: "wifi",
      type: "wifi",
      title: "Wifi",
      icon: "wifi",
      blocks: [
        {
          type: "wifi",
          network: "CasaDeVista-Guest",
          password: "sunsetsalt24",
          note: "Strongest in the living room and on the veranda. The back bedrooms get a weaker signal.",
        },
        {
          type: "text",
          heading: "If it drops",
          body: "Unplug the white router on the living room bookshelf, count to ten, and plug it back in. Give it two minutes. Still nothing? Message us and we'll call the provider.",
        },
      ],
    },
    {
      id: "house-rules",
      type: "rules",
      title: "House Rules",
      icon: "list-check",
      blocks: [
        {
          type: "list",
          items: [
            {
              title: "Quiet hours",
              detail:
                "10 PM to 7 AM. Sound carries over water, and our neighbors are fishermen who start early.",
              icon: "moon",
            },
            {
              title: "Smoking",
              detail: "Outside only, on the beach side of the garden. Butts go in the tin can, not the sand.",
              icon: "smoking-no",
            },
            {
              title: "Guests",
              detail: "Up to 10 people overnight. Day visitors are welcome until 9 PM.",
              icon: "users",
            },
            {
              title: "Celebrations",
              detail:
                "Birthdays and small parties are fine. Tell us ahead if you're bringing a sound system.",
              icon: "confetti",
            },
            {
              title: "Pool",
              detail: "No glass in or near the pool. Plastic cups are in the cabinet by the veranda.",
              icon: "glass-off",
            },
            {
              title: "Damage",
              detail:
                "Accidents happen. Tell us early and we'll sort it out together. Deliberate damage is charged at repair cost.",
              icon: "tool",
            },
          ],
        },
      ],
    },
    {
      id: "kitchen",
      type: "steps",
      title: "Kitchen",
      icon: "tools-kitchen-2",
      blocks: [
        {
          type: "list",
          heading: "What's stocked",
          items: [
            {
              title: "Cooking basics",
              detail: "Oil, salt, pepper, sugar, soy sauce, vinegar, and garlic.",
              icon: "basket",
            },
            {
              title: "Coffee",
              detail: "Local barako beans and a French press. The grinder is in the corner cabinet.",
              icon: "coffee",
            },
            {
              title: "Drinking water",
              detail:
                "The five-gallon jug on the dispenser. Tap water is fine for cooking, not for drinking.",
              icon: "bottle",
            },
          ],
        },
        {
          type: "steps",
          heading: "Using the gas stove",
          steps: [
            "Check that the valve on the tank under the counter is turned to open.",
            "Push in the burner knob and turn it to high until it clicks and lights.",
            "Keep holding the knob for three seconds before you let go.",
            "When you're done, turn off the burners first, then close the tank valve.",
          ],
        },
        {
          type: "steps",
          heading: "Sorting trash",
          steps: [
            "Food scraps go in the green bin. We compost them for the garden.",
            "Bottles and cans go in the blue bin, rinsed.",
            "Everything else goes in the black bin.",
            "Collection is Tuesday and Friday morning. Bins go out by the gate the night before.",
          ],
        },
      ],
    },
    {
      id: "explore",
      type: "places",
      title: "Explore",
      icon: "map-pin",
      blocks: [
        {
          type: "text",
          body: "San Juan is a surf town first. Mornings are for the water, afternoons get hot, and the good stuff happens around sunset. Every place below opens in Google Maps.",
        },
      ],
    },
    {
      id: "emergency",
      type: "emergency",
      title: "Emergency",
      icon: "alert-triangle",
      blocks: [
        {
          type: "contact",
          urgent: true,
          methods: [
            {
              kind: "call",
              label: "Call 911",
              value: "911",
              detail: "National emergency hotline for police, fire, and ambulance",
            },
            {
              kind: "call",
              label: "Call the host emergency line",
              value: HOST_PHONE,
              detail: "Any hour, for anything urgent at the house",
            },
          ],
        },
        {
          type: "map-link",
          label: "Nearest hospital",
          query: "hospital San Fernando La Union",
          note: "About 25 minutes by car, in San Fernando. Tell the guard at the gate you need the emergency room.",
        },
        {
          type: "text",
          heading: "Barangay hall",
          body: "For local problems like a blocked road, stray animals, or a noise complaint, the barangay hall is at the end of our street, past the chapel. Ask for the tanod on duty.",
        },
        {
          type: "list",
          heading: "In the house",
          items: [
            { title: "First aid kit", detail: "Kitchen, top shelf above the fridge.", icon: "first-aid-kit" },
            {
              title: "Fire extinguishers",
              detail: "By the front door and next to the stove.",
              icon: "flame",
            },
            {
              title: "Flashlights",
              detail: "Hallway cabinet, with spare batteries. Brownouts happen in storm season.",
              icon: "bulb",
            },
          ],
        },
      ],
    },
    {
      id: "pet-policy",
      type: "rules",
      title: "Pet Policy",
      icon: "paw",
      blocks: [
        {
          type: "text",
          body: "Dogs and cats are welcome, up to two per stay. Our own dog, Bantay, lives in town with us, so the garden is all yours.",
        },
        {
          type: "list",
          items: [
            {
              title: "Pet fee",
              detail: "₱500 per pet per stay, paid at check-in. It covers the deep clean afterward.",
              icon: "paw",
            },
            {
              title: "Indoors",
              detail:
                "Off the beds and sofas, please. There are two washable dog beds in the hallway closet.",
              icon: "sofa",
            },
            {
              title: "On the beach",
              detail:
                "Keep dogs leashed on the path and pick up after them. Fishermen dry their nets on the sand.",
              icon: "dog",
            },
            {
              title: "Pool",
              detail: "Pets stay out of the pool. The outdoor shower is great for rinsing a sandy dog.",
              icon: "pool",
            },
            {
              title: "Alone time",
              detail: "Please don't leave pets alone in the house for more than a few hours.",
              icon: "clock",
            },
          ],
        },
      ],
    },
    {
      id: "sustainability",
      type: "text",
      title: "Sustainability",
      icon: "leaf",
      blocks: [
        {
          type: "text",
          body: "Our water comes from a deep well and a rooftop tank, and most of our daytime power comes from the sun. A few small habits keep it that way.",
        },
        {
          type: "list",
          items: [
            {
              title: "Water",
              detail:
                "Short showers, and the outdoor shower for rinsing sand. Towels get changed every three days unless you ask sooner.",
              icon: "droplet",
            },
            {
              title: "Power",
              detail: "Solar panels cover most of the daytime load. Switch the aircon off when you head out.",
              icon: "solar-panel",
            },
            {
              title: "Reef-safe sunscreen",
              detail:
                "The reef off the point is still recovering. Mineral sunscreen only in the water; there's a bottle by the door if you forgot yours.",
              icon: "sun",
            },
            {
              title: "Local sourcing",
              detail: "Eggs, bread, and coffee come from neighbors and the town market.",
              icon: "basket",
            },
            {
              title: "Less plastic",
              detail:
                "Refill your bottles from the water jug. Reusable tote bags hang by the front door for market runs.",
              icon: "recycle",
            },
          ],
        },
      ],
    },
    {
      id: "contact",
      type: "contact",
      title: "Contact",
      icon: "phone",
      blocks: [
        {
          type: "contact",
          methods: [
            { kind: "call", label: "Call us", value: HOST_PHONE, detail: "7 AM to 10 PM" },
            {
              kind: "sms",
              label: "Send a text",
              value: HOST_PHONE,
              detail: "Usually answered within the hour",
            },
            {
              kind: "email",
              label: "Email us",
              value: HOST_EMAIL,
              detail: "For booking questions and receipts",
            },
          ],
        },
        {
          type: "text",
          body: "For anything urgent outside those hours, use the emergency line on the Emergency page.",
        },
      ],
    },
  ],
  places: [
    {
      name: "Urbiztondo Beach",
      category: "Surf",
      note: "The main surf break, about ten minutes away. Boards and lessons are rented right on the sand; beginners do best in the morning.",
      mapsUrl: mapsSearchUrl("Urbiztondo Beach, San Juan, La Union"),
    },
    {
      name: "San Juan public market",
      category: "Food",
      note: "Fresh fish, fruit, and pastries. Go early for the best of the morning catch.",
      mapsUrl: mapsSearchUrl("public market San Juan La Union"),
    },
    {
      name: "Tangadan Falls",
      category: "Day trip",
      note: "A short hike and a cold swim in San Gabriel, about 40 minutes inland. Wear shoes that can get wet.",
      mapsUrl: mapsSearchUrl("Tangadan Falls, San Gabriel, La Union"),
    },
    {
      name: "Ma-Cho Temple",
      category: "Culture",
      note: "A Taoist temple on a hill in San Fernando with a wide view over the bay. Dress modestly.",
      mapsUrl: mapsSearchUrl("Ma-Cho Temple, San Fernando, La Union"),
    },
    {
      name: "Pindangan Ruins",
      category: "Culture",
      note: "The overgrown shell of a Spanish-era church in San Fernando. Quiet and shady for a late-afternoon walk.",
      mapsUrl: mapsSearchUrl("Pindangan Ruins, San Fernando, La Union"),
    },
  ],
  emergency: {
    hospital: "San Fernando, about 25 minutes by car",
    police: "911",
    barangay: "End of our street, past the chapel",
    hostLine: HOST_PHONE,
  },
};
