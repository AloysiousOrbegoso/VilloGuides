import { useEffect, useState } from "react";
import { CUSTOM_COLOR_KEYS, themes, themeById } from "../../../../lib/guideThemes";
import { mapsSearchUrl } from "../../../../lib/links";
import { displayHost } from "../../../../lib/hostname";
import { shortDate } from "../../../../lib/format";
import { Button } from "../../../ui/Button";
import { Field, Input, Textarea } from "../../../ui/Field";
import { Icon } from "../../../ui/icons";
import { SubdomainInput } from "../SubdomainInput";
import { ImageField } from "./ImageField";

function Heading({ title, children }) {
  return (
    <div className="mb-8">
      <h2 className="text-2xl font-semibold m-0 tracking-tight">{title}</h2>
      {children && <p className="mt-1 mb-0 text-sm text-muted">{children}</p>}
    </div>
  );
}

const Card = ({ children }) => <div className="bg-card border border-line rounded-xl px-6 py-6 flex flex-col gap-5">{children}</div>;

export function PropertyEditor({ draft, onChange, meta, onMetaChange }) {
  const p = draft.property;
  const set = (patch) => onChange({ ...draft, property: { ...p, ...patch } });
  const [city, setCity] = useState(meta.city || "");
  const [owner, setOwner] = useState(meta.owner_name || "");
  useEffect(() => {
    setCity(meta.city || "");
    setOwner(meta.owner_name || "");
  }, [meta.city, meta.owner_name]);

  return (
    <div className="max-w-[640px] mx-auto">
      <Heading title="Property and cover">The cover is the one bold moment of the guide.</Heading>
      <div className="flex flex-col gap-4">
        <Card>
          <Field label="Property name">
            <Input value={p.name} onChange={(e) => set({ name: e.target.value })} />
          </Field>
          <Field label="Tagline" hint="One short line under the name on the cover">
            <Input value={p.tagline} onChange={(e) => set({ tagline: e.target.value })} />
          </Field>
          <Field label="Cover photo">
            <ImageField value={p.coverImage} onChange={(coverImage) => set({ coverImage })} aspect="4/3.4" />
          </Field>
        </Card>
        <Card>
          <Field label="Address">
            <Input value={p.address} onChange={(e) => set({ address: e.target.value })} />
          </Field>
          <Field label="Google Maps link">
            <div className="flex gap-2">
              <Input value={p.mapsUrl} onChange={(e) => set({ mapsUrl: e.target.value.trim() })} placeholder="https://" />
              <Button onClick={() => set({ mapsUrl: mapsSearchUrl(p.address) })} disabled={!p.address}>
                From address
              </Button>
            </div>
          </Field>
        </Card>
        <Card>
          <p className="text-sm text-muted m-0">Used by the directory and search in the client dashboard. Not shown to guests.</p>
          <div className="grid grid-cols-2 gap-3">
            <Field label="City">
              <Input value={city} onChange={(e) => setCity(e.target.value)} onBlur={() => city !== meta.city && onMetaChange({ city })} />
            </Field>
            <Field label="Owner">
              <Input value={owner} onChange={(e) => setOwner(e.target.value)} onBlur={() => owner !== meta.owner_name && onMetaChange({ owner_name: owner })} />
            </Field>
          </div>
        </Card>
      </div>
    </div>
  );
}

export function HostEditor({ draft, onChange }) {
  const h = draft.host;
  const set = (patch) => onChange({ ...draft, host: { ...h, ...patch } });
  return (
    <div className="max-w-[640px] mx-auto">
      <Heading title="Host">Shown on the Meet Hosts page. Without a photo, guests see initials.</Heading>
      <div className="flex flex-col gap-4">
        <Card>
          <Field label="Name">
            <Input value={h.name} onChange={(e) => set({ name: e.target.value })} />
          </Field>
          <Field label="Photo">
            <ImageField value={h.photo} onChange={(photo) => set({ photo })} round />
          </Field>
          <Field label="About">
            <Textarea value={h.bio} minRows={3} onChange={(e) => set({ bio: e.target.value })} />
          </Field>
        </Card>
        <Card>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Phone">
              <Input value={h.phone} onChange={(e) => set({ phone: e.target.value })} />
            </Field>
            <Field label="Email">
              <Input value={h.email} onChange={(e) => set({ email: e.target.value })} />
            </Field>
            <Field label="Messenger username" hint="Leave empty to hide Messenger" className="col-span-2">
              <Input value={h.messenger} onChange={(e) => set({ messenger: e.target.value })} />
            </Field>
          </div>
        </Card>
      </div>
    </div>
  );
}

const swatchBg = (a, b) => `linear-gradient(135deg, ${a} 50%, ${b} 50%)`;

export function ThemeEditor({ draft, onChange }) {
  const t = draft.theme;
  const set = (patch) => onChange({ ...draft, theme: { ...t, ...patch } });
  const base = themeById("daytime").tokens;
  const options = [...themes.map((x) => ({ id: x.id, label: x.label, swatch: x.swatch })), { id: "custom", label: "Custom", swatch: [t.colors?.bg || base.bg, t.colors?.accent || base.accent] }];

  return (
    <div className="max-w-[640px] mx-auto">
      <Heading title="Theme">The guide uses the property's colors, not Villo Guides colors.</Heading>
      <div className="grid grid-cols-2 gap-3 mb-6">
        {options.map((o) => (
          <button
            key={o.id}
            type="button"
            aria-pressed={t.preset === o.id}
            onClick={() => set({ preset: o.id })}
            className={`flex items-center gap-3 bg-card border rounded-xl px-4 py-3.5 text-left ${t.preset === o.id ? "border-navy ring-1 ring-navy" : "border-line hover:border-faint"}`}
          >
            <span className="w-8 h-8 rounded-full border border-line shrink-0" style={{ background: swatchBg(o.swatch[0], o.swatch[1]) }} />
            <span className="font-semibold">{o.label}</span>
            {t.preset === o.id && <Icon name="check" className="ml-auto text-link" />}
          </button>
        ))}
      </div>
      {t.preset === "custom" ? (
        <Card>
          <p className="text-sm text-muted m-0">Starts from Daytime. Guests cannot switch themes on a custom guide.</p>
          <div className="grid grid-cols-2 gap-4">
            {CUSTOM_COLOR_KEYS.map(({ key, label }) => (
              <Field key={key} label={label}>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={t.colors?.[key] || base[key]}
                    onChange={(e) => set({ colors: { ...t.colors, [key]: e.target.value } })}
                    className="w-10 h-10 rounded-lg border border-line bg-field p-1 cursor-pointer"
                    aria-label={label}
                  />
                  <Input value={t.colors?.[key] || base[key]} onChange={(e) => set({ colors: { ...t.colors, [key]: e.target.value } })} />
                </div>
              </Field>
            ))}
          </div>
        </Card>
      ) : (
        <p className="text-sm text-muted m-0">Guests can switch between the three presets from the guide.</p>
      )}
    </div>
  );
}

export function SubdomainEditor({ guide, onRename }) {
  const [sub, setSub] = useState({ value: guide.slug || "", ok: false });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const published = guide.published_version != null;
  const left = guide.max_renames - guide.renames;
  const retired = (guide.slug_history || []).filter((s) => s.retired_at);
  useEffect(() => setSub({ value: guide.slug || "", ok: false }), [guide.slug]);

  async function save() {
    setBusy(true);
    setError("");
    try {
      await onRename(sub.value);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-[640px] mx-auto">
      <Heading title="Subdomain">{guide.slug ? `Live address: ${displayHost(guide.slug)}` : "Choose the address guests will open."}</Heading>
      <Card>
        <Field label={published ? "New subdomain" : "Subdomain"}>
          <SubdomainInput value={sub.value} initial={guide.slug || ""} guideId={guide.id} onChange={setSub} />
        </Field>
        {published && (
          <p className="text-sm text-muted m-0 leading-relaxed">
            The old address keeps redirecting here forever, so printed QR codes still work. Retired names can never be reused.{" "}
            {left > 0 ? `${left} of ${guide.max_renames} renames left.` : "This guide has reached the rename limit."}
          </p>
        )}
        {error && <p className="text-sm text-accent m-0">{error}</p>}
        <div>
          <Button variant="primary" onClick={save} disabled={busy || !sub.ok || (published && left <= 0)}>
            {published ? "Rename" : "Save subdomain"}
          </Button>
        </div>
      </Card>
      {retired.length > 0 && (
        <div className="mt-6">
          <p className="text-sm text-muted mt-0 mb-2">Retired addresses, redirecting here</p>
          <ul className="list-none m-0 p-0">
            {retired.map((s) => (
              <li key={s.slug} className="flex justify-between py-2 border-b border-line-soft text-sm">
                <span>{displayHost(s.slug)}</span>
                <span className="text-muted">Retired {shortDate(s.retired_at)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
