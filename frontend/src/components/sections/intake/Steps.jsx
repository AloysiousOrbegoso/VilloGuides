import { AMENITY_OPTIONS, KEY_METHODS, KITCHEN_OPTIONS, PLACE_CATEGORIES } from "../../../lib/intakeMapper";
import { themes } from "../../../lib/guideThemes";
import { looksLikeCode, stripCodes } from "../../../lib/sensitive";
import { Button, IconButton } from "../../ui/Button";
import { Checkbox, Field, Input, Select, SensitiveWarning, Textarea } from "../../ui/Field";
import { Icon } from "../../ui/icons";

/*
  One component per intake step. All of them take (answers, set) where set patches
  one section of the answers object. Questions are plain language, controls are large,
  and nothing here is required except what missingRequired() flags.
*/

const TIMES = ["", "6:00 AM", "7:00 AM", "8:00 AM", "9:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM", "6:00 PM", "7:00 PM", "8:00 PM", "Any time"];

function Q({ label, hint, children, htmlFor }) {
  return (
    <Field label={label} hint={hint} size="lg" htmlFor={htmlFor} className="mb-7">
      {children}
    </Field>
  );
}

/** Large text area that warns when the answer looks like a door code. */
function CodeAwareText({ value, onChange, placeholder, label, hint, id }) {
  return (
    <Q label={label} hint={hint} htmlFor={id}>
      <Textarea id={id} size="lg" minRows={3} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
      {looksLikeCode(value) && (
        <div className="mt-3">
          <SensitiveWarning size="lg" onRemove={() => onChange(stripCodes(value))} />
        </div>
      )}
    </Q>
  );
}

function Chips({ options, selected, onToggle, getId = (o) => o, getLabel = (o) => o, getIcon }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const id = getId(o);
        const on = selected.includes(id);
        return (
          <button
            key={id}
            type="button"
            aria-pressed={on}
            onClick={() => onToggle(id)}
            className={`inline-flex items-center gap-2 h-11 px-4 rounded-full border text-md transition-colors ${
              on ? "bg-navy-soft border-navy text-ink font-semibold" : "bg-card border-line text-muted"
            }`}
          >
            {getIcon && <Icon name={getIcon(o)} className="text-lg" />}
            {getLabel(o)}
            {on && <Icon name="check" className="text-sm" />}
          </button>
        );
      })}
    </div>
  );
}

const toggle = (list, id) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);

export function PropertyStep({ answers, set }) {
  const a = answers.property;
  return (
    <>
      <Q label="Property name" htmlFor="ip-name">
        <Input id="ip-name" size="lg" value={a.name} onChange={(e) => set("property", { name: e.target.value })} />
      </Q>
      <Q label="One line about the place" hint="Shown under the name on the cover" htmlFor="ip-tag">
        <Input id="ip-tag" size="lg" value={a.tagline} onChange={(e) => set("property", { tagline: e.target.value })} placeholder="A pine cabin above Baguio" />
      </Q>
      <Q label="Address" htmlFor="ip-addr">
        <Input id="ip-addr" size="lg" value={a.address} onChange={(e) => set("property", { address: e.target.value })} />
      </Q>
      <Q label="City or town" htmlFor="ip-city">
        <Input id="ip-city" size="lg" value={a.city} onChange={(e) => set("property", { city: e.target.value })} />
      </Q>
      <Q label="Welcome message" hint="The first thing guests read. A sentence or two is plenty." htmlFor="ip-wel">
        <Textarea id="ip-wel" size="lg" minRows={4} value={a.welcome} onChange={(e) => set("property", { welcome: e.target.value })} />
      </Q>
    </>
  );
}

export function HostStep({ answers, set }) {
  const a = answers.host;
  return (
    <>
      <Q label="Your name" hint="How guests should address you" htmlFor="ih-name">
        <Input id="ih-name" size="lg" value={a.name} onChange={(e) => set("host", { name: e.target.value })} />
      </Q>
      <Q label="Phone number" htmlFor="ih-phone">
        <Input id="ih-phone" size="lg" type="tel" inputMode="tel" value={a.phone} onChange={(e) => set("host", { phone: e.target.value })} placeholder="+63 917 000 0000" />
      </Q>
      <Q label="Email" htmlFor="ih-email">
        <Input id="ih-email" size="lg" type="email" value={a.email} onChange={(e) => set("host", { email: e.target.value })} />
      </Q>
      <Q label="Messenger username" hint="Leave empty to skip Messenger" htmlFor="ih-msg">
        <Input id="ih-msg" size="lg" value={a.messenger} onChange={(e) => set("host", { messenger: e.target.value })} />
      </Q>
      <Q label="When can guests reach you?" htmlFor="ih-hours">
        <Input id="ih-hours" size="lg" value={a.hours} onChange={(e) => set("host", { hours: e.target.value })} placeholder="between 7 AM and 10 PM" />
      </Q>
      <Q label="A little about you" htmlFor="ih-bio">
        <Textarea id="ih-bio" size="lg" minRows={3} value={a.bio} onChange={(e) => set("host", { bio: e.target.value })} />
      </Q>
    </>
  );
}

export function CheckinStep({ answers, set }) {
  const a = answers.checkin;
  return (
    <>
      <div className="grid grid-cols-2 gap-3 mb-7">
        <Field label="Check-in from" size="lg" htmlFor="ic-in">
          <Select id="ic-in" size="lg" value={a.checkIn} onChange={(e) => set("checkin", { checkIn: e.target.value })}>
            {TIMES.map((t) => (
              <option key={t || "none"} value={t}>
                {t || "Choose"}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Check-out by" size="lg" htmlFor="ic-out">
          <Select id="ic-out" size="lg" value={a.checkOut} onChange={(e) => set("checkin", { checkOut: e.target.value })}>
            {TIMES.map((t) => (
              <option key={t || "none"} value={t}>
                {t || "Choose"}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      <Q label="How do guests get the key?">
        <Chips
          options={KEY_METHODS}
          selected={a.keyMethod ? [a.keyMethod] : []}
          onToggle={(id) => set("checkin", { keyMethod: a.keyMethod === id ? "" : id })}
          getId={(o) => o.id}
          getLabel={(o) => o.label}
        />
      </Q>
      <CodeAwareText
        id="ic-dir"
        label="How do guests get in?"
        hint="Walk them from the gate to the front door."
        value={a.directions}
        onChange={(directions) => set("checkin", { directions })}
      />
      <Q label="Where do they park?" htmlFor="ic-park">
        <Textarea id="ic-park" size="lg" minRows={2} value={a.parking} onChange={(e) => set("checkin", { parking: e.target.value })} />
      </Q>
      <Q label="What should guests do before they leave?" hint="One step per line" htmlFor="ic-outsteps">
        <Textarea id="ic-outsteps" size="lg" minRows={4} value={a.checkoutSteps} onChange={(e) => set("checkin", { checkoutSteps: e.target.value })} />
      </Q>
    </>
  );
}

export function WifiStep({ answers, set }) {
  const a = answers.wifi;
  return (
    <>
      <Q label="Network name" hint="Exactly as it appears on a phone" htmlFor="iw-net">
        <Input id="iw-net" size="lg" value={a.network} onChange={(e) => set("wifi", { network: e.target.value })} autoCapitalize="off" spellCheck={false} />
      </Q>
      <Q label="Password" hint="Guests copy this with one tap. It is safe to include." htmlFor="iw-pass">
        <Input id="iw-pass" size="lg" value={a.password} onChange={(e) => set("wifi", { password: e.target.value })} autoCapitalize="off" spellCheck={false} />
      </Q>
      <Q label="Anything else about the Wi-Fi?" hint="Where the router is, or how to restart it" htmlFor="iw-note">
        <Textarea id="iw-note" size="lg" minRows={2} value={a.note} onChange={(e) => set("wifi", { note: e.target.value })} />
      </Q>
    </>
  );
}

export function RulesStep({ answers, set }) {
  const a = answers.rules;
  return (
    <>
      <Q label="Quiet hours" htmlFor="ir-quiet">
        <Input id="ir-quiet" size="lg" value={a.quietHours} onChange={(e) => set("rules", { quietHours: e.target.value })} placeholder="10 PM to 7 AM" />
      </Q>
      <Q label="Smoking">
        <Chips
          options={[
            { id: "no", label: "Not allowed" },
            { id: "outside", label: "Outside only" },
            { id: "yes", label: "Allowed" },
          ]}
          selected={a.smoking ? [a.smoking] : []}
          onToggle={(id) => set("rules", { smoking: a.smoking === id ? "" : id })}
          getId={(o) => o.id}
          getLabel={(o) => o.label}
        />
      </Q>
      <Q label="Parties and events">
        <Chips
          options={[
            { id: "no", label: "Not allowed" },
            { id: "ask", label: "Ask first" },
            { id: "yes", label: "Allowed" },
          ]}
          selected={a.parties ? [a.parties] : []}
          onToggle={(id) => set("rules", { parties: a.parties === id ? "" : id })}
          getId={(o) => o.id}
          getLabel={(o) => o.label}
        />
      </Q>
      <Q label="Maximum number of guests" htmlFor="ir-max">
        <Input id="ir-max" size="lg" inputMode="numeric" value={a.maxGuests} onChange={(e) => set("rules", { maxGuests: e.target.value.replace(/\D/g, "") })} />
      </Q>
      <Q label="Other house rules" hint="One per line" htmlFor="ir-other">
        <Textarea id="ir-other" size="lg" minRows={3} value={a.other} onChange={(e) => set("rules", { other: e.target.value })} />
      </Q>
    </>
  );
}

export function AmenitiesStep({ answers, set }) {
  const a = answers.amenities;
  return (
    <>
      <Q label="What does the place have?" hint="Tap everything that applies">
        <Chips
          options={AMENITY_OPTIONS}
          selected={a.selected}
          onToggle={(id) => set("amenities", { selected: toggle(a.selected, id) })}
          getId={(o) => o.id}
          getLabel={(o) => o.label}
          getIcon={(o) => o.icon}
        />
      </Q>
      <Q label="Anything else?" hint="One per line" htmlFor="ia-other">
        <Textarea id="ia-other" size="lg" minRows={3} value={a.other} onChange={(e) => set("amenities", { other: e.target.value })} />
      </Q>
    </>
  );
}

export function KitchenStep({ answers, set }) {
  const a = answers.kitchen;
  return (
    <>
      <Q label="What's in the kitchen?">
        <Chips options={KITCHEN_OPTIONS} selected={a.appliances} onToggle={(id) => set("kitchen", { appliances: toggle(a.appliances, id) })} />
      </Q>
      <Q label="Anything guests need to know to use it?" hint="A gas tank valve, a tricky oven, a water filter" htmlFor="ik-how">
        <Textarea id="ik-how" size="lg" minRows={3} value={a.howTo} onChange={(e) => set("kitchen", { howTo: e.target.value })} />
      </Q>
      <Q label="Trash and recycling" hint="Where it goes and which days it is collected" htmlFor="ik-trash">
        <Textarea id="ik-trash" size="lg" minRows={3} value={a.trash} onChange={(e) => set("kitchen", { trash: e.target.value })} />
      </Q>
    </>
  );
}

export function PlacesStep({ answers, setAnswers }) {
  const places = answers.places;
  const update = (i, patch) => setAnswers({ ...answers, places: places.map((p, j) => (j === i ? { ...p, ...patch } : p)) });
  return (
    <>
      <p className="text-md text-muted mt-0 mb-6 leading-relaxed">Your favourites, not a tourist list. Guests trust the host's picks most.</p>
      <div className="flex flex-col gap-4 mb-5">
        {places.map((p, i) => (
          <div key={i} className="bg-card border border-line rounded-xl p-4">
            <div className="flex gap-3 items-start">
              <div className="flex-1 flex flex-col gap-3">
                <Input size="lg" value={p.name} onChange={(e) => update(i, { name: e.target.value })} placeholder="Name of the place" aria-label={`Place ${i + 1}`} />
                <Select size="lg" value={p.category} onChange={(e) => update(i, { category: e.target.value })} aria-label="Category">
                  <option value="">Choose a category</option>
                  {PLACE_CATEGORIES.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </Select>
                <Textarea size="lg" minRows={2} value={p.note} onChange={(e) => update(i, { note: e.target.value })} placeholder="Why guests should go, and when" aria-label="Note" />
              </div>
              <IconButton icon="x" label={`Remove ${p.name || "place"}`} onClick={() => setAnswers({ ...answers, places: places.filter((_, j) => j !== i) })} />
            </div>
          </div>
        ))}
      </div>
      <Button
        size="lg"
        icon="plus"
        block
        disabled={places.length >= 30}
        onClick={() => setAnswers({ ...answers, places: [...places, { name: "", category: "", note: "" }] })}
      >
        Add a place
      </Button>
    </>
  );
}

export function EmergencyStep({ answers, set }) {
  const a = answers.emergency;
  return (
    <>
      <Q label="Nearest hospital" hint="The name and roughly how far it is" htmlFor="ie-hosp">
        <Input id="ie-hosp" size="lg" value={a.hospital} onChange={(e) => set("emergency", { hospital: e.target.value })} />
      </Q>
      <Q label="Emergency number" htmlFor="ie-police">
        <Input id="ie-police" size="lg" value={a.police} onChange={(e) => set("emergency", { police: e.target.value })} />
      </Q>
      <Q label="Your emergency line" hint="A number guests can call at any hour" htmlFor="ie-host">
        <Input id="ie-host" size="lg" type="tel" value={a.hostLine} onChange={(e) => set("emergency", { hostLine: e.target.value })} />
      </Q>
      <Q label="Barangay hall or local help" htmlFor="ie-brgy">
        <Textarea id="ie-brgy" size="lg" minRows={2} value={a.barangay} onChange={(e) => set("emergency", { barangay: e.target.value })} />
      </Q>
      <Q label="Where is the first aid kit?" htmlFor="ie-aid">
        <Input id="ie-aid" size="lg" value={a.firstAid} onChange={(e) => set("emergency", { firstAid: e.target.value })} />
      </Q>
      <Q label="Where is the fire extinguisher?" htmlFor="ie-ext">
        <Input id="ie-ext" size="lg" value={a.extinguisher} onChange={(e) => set("emergency", { extinguisher: e.target.value })} />
      </Q>
    </>
  );
}

export function PetsStep({ answers, set }) {
  const a = answers.pets;
  return (
    <>
      <Q label="Are pets allowed?">
        <Chips
          options={[
            { id: "yes", label: "Yes" },
            { id: "ask", label: "Ask first" },
            { id: "no", label: "No" },
          ]}
          selected={a.allowed ? [a.allowed] : []}
          onToggle={(id) => set("pets", { allowed: a.allowed === id ? "" : id })}
          getId={(o) => o.id}
          getLabel={(o) => o.label}
        />
      </Q>
      {a.allowed && a.allowed !== "no" && (
        <>
          <Q label="Pet fee" htmlFor="ipt-fee">
            <Input id="ipt-fee" size="lg" value={a.fee} onChange={(e) => set("pets", { fee: e.target.value })} placeholder="₱500 per stay" />
          </Q>
          <Q label="Rules for pets" hint="One per line" htmlFor="ipt-rules">
            <Textarea id="ipt-rules" size="lg" minRows={3} value={a.rules} onChange={(e) => set("pets", { rules: e.target.value })} />
          </Q>
        </>
      )}
    </>
  );
}

export function SustainabilityStep({ answers, set }) {
  return (
    <Q label="Anything guests can do to help?" hint="Water, power, recycling, or local sourcing" htmlFor="is-notes">
      <Textarea id="is-notes" size="lg" minRows={5} value={answers.sustainability.notes} onChange={(e) => set("sustainability", { notes: e.target.value })} />
    </Q>
  );
}

export function PhotosStep({ answers, setAnswers, onUpload, uploading, error }) {
  const { cover, gallery } = answers.photos;
  const all = [cover, ...gallery.map((g) => g.url)].filter(Boolean);

  function makeCover(url) {
    const rest = all.filter((u) => u !== url);
    setAnswers({ ...answers, photos: { cover: url, gallery: rest.map((u) => ({ url: u, caption: "" })) } });
  }

  function remove(url) {
    const rest = all.filter((u) => u !== url);
    setAnswers({ ...answers, photos: { cover: rest[0] ?? "", gallery: rest.slice(1).map((u) => ({ url: u, caption: "" })) } });
  }

  return (
    <>
      <p className="text-md text-muted mt-0 mb-6 leading-relaxed">Tap a photo to make it the cover. Bright daytime shots of the outside work best.</p>
      <div className="grid grid-cols-3 gap-2.5 mb-4">
        {all.map((url) => (
          <div key={url} className="relative aspect-square rounded-xl overflow-hidden group">
            <button type="button" onClick={() => makeCover(url)} className="absolute inset-0" aria-label={url === cover ? "Cover photo" : "Make this the cover"}>
              <img src={url} alt="" className="w-full h-full object-cover" />
            </button>
            {url === cover && <span className="absolute left-2 bottom-2 text-xs bg-black/70 text-white rounded-full px-2 py-0.5 pointer-events-none">Cover</span>}
            <IconButton icon="x" label="Remove photo" size="sm" className="absolute right-1.5 top-1.5" onClick={() => remove(url)} />
          </div>
        ))}
        {uploading > 0 &&
          Array.from({ length: uploading }).map((_, i) => (
            <div key={`u${i}`} className="aspect-square rounded-xl bg-card border border-line grid place-items-center text-xs text-muted gap-2">
              <Icon name="loader-2" className="animate-spin text-lg" />
              Resizing
            </div>
          ))}
      </div>
      <label className="w-full h-14 border-[1.5px] border-dashed border-faint rounded-xl flex items-center justify-center gap-2 font-semibold text-md text-link cursor-pointer mb-6">
        <Icon name="camera-plus" className="text-xl" />
        Add photos
        <input type="file" accept="image/jpeg,image/png,image/webp" multiple className="sr-only" onChange={(e) => onUpload(e.target.files)} />
      </label>
      {error && <p className="text-accent text-md mt-0 mb-4">{error}</p>}
      <p className="flex gap-2.5 items-start text-sm text-muted m-0">
        <Icon name="lock" className="text-md mt-0.5" />
        Photos stay private until your guide is published. You can add up to 25.
      </p>
    </>
  );
}

export function BrandingStep({ answers, set }) {
  const a = answers.branding;
  return (
    <>
      <Q label="Which colours suit the place?" hint="We can change this later.">
        <div className="flex flex-col gap-2.5">
          {themes.map((t) => (
            <button
              key={t.id}
              type="button"
              aria-pressed={a.preset === t.id}
              onClick={() => set("branding", { preset: t.id })}
              className={`flex items-center gap-3.5 bg-card border rounded-xl px-4 py-3.5 text-left ${a.preset === t.id ? "border-navy ring-1 ring-navy" : "border-line"}`}
            >
              <span className="w-9 h-9 rounded-full border border-line shrink-0" style={{ background: `linear-gradient(135deg, ${t.swatch[0]} 50%, ${t.swatch[1]} 50%)` }} />
              <span className="font-semibold text-md">{t.label}</span>
              {a.preset === t.id && <Icon name="check" className="ml-auto text-link" />}
            </button>
          ))}
        </div>
      </Q>
      <Q label="Anything else we should know?" hint="Anything that does not fit the questions above" htmlFor="ib-notes">
        <Textarea id="ib-notes" size="lg" minRows={4} value={a.notes} onChange={(e) => set("branding", { notes: e.target.value })} />
      </Q>
    </>
  );
}

export function ReviewStep({ answers, steps, filled, missing, onGoTo, onConsent }) {
  const skipped = steps.filter((s) => s.id !== "review" && !filled[s.id]);
  const photoCount = (answers.photos.cover ? 1 : 0) + answers.photos.gallery.length;
  const done = steps.length - 1 - skipped.length;

  return (
    <>
      <p className="text-md text-muted mt-0 mb-6 leading-relaxed">Skipped sections are left out of the guide. You can fill them in later.</p>

      {Object.keys(missing).length > 0 && (
        <div className="border border-warn-line bg-warn-bg text-warn-ink rounded-xl px-4 py-3.5 mb-6">
          <p className="font-semibold m-0 mb-2">A few answers are still needed</p>
          <ul className="list-none m-0 p-0 flex flex-col gap-1.5">
            {Object.entries(missing).map(([stepId, message]) => (
              <li key={stepId} className="flex justify-between gap-3 text-md">
                <span>{message}</span>
                <button type="button" className="font-semibold underline underline-offset-3 shrink-0" onClick={() => onGoTo(stepId)}>
                  Fill in
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex items-center gap-3.5 py-4 border-y border-line mb-6">
        <Icon name="circle-check" className="text-2xl text-ok" />
        <div>
          <p className="font-semibold m-0 text-md">
            {done} of {steps.length - 1} sections filled in
          </p>
          <p className="text-sm text-muted m-0">
            {photoCount} {photoCount === 1 ? "photo" : "photos"} added
          </p>
        </div>
      </div>

      {skipped.length > 0 && (
        <div className="mb-7">
          <h3 className="text-sm font-normal text-muted m-0 mb-1.5">Skipped</h3>
          {skipped.map((s) => (
            <div key={s.id} className="flex items-center justify-between py-2.5 text-md">
              <span>{s.title}</span>
              <button type="button" className="text-link font-semibold text-base" onClick={() => onGoTo(s.id)}>
                Fill in
              </button>
            </div>
          ))}
        </div>
      )}

      <Checkbox size="lg" checked={answers.consent} onChange={onConsent}>
        I agree to the <a href="/privacy" target="_blank" rel="noreferrer" className="text-navy underline underline-offset-2">privacy policy</a> and confirm I can share
        these details and photos.
      </Checkbox>
    </>
  );
}
