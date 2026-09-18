import { useEffect, useRef, useState } from "react";
import { blockMeta, parseVideo } from "../../../../lib/guideSchema";
import { looksLikeCode, stripCodes } from "../../../../lib/sensitive";
import { copyText } from "../../../../lib/clipboard";
import { IconButton } from "../../../ui/Button";
import { Checkbox, Field, Input, Select, SensitiveWarning, Textarea } from "../../../ui/Field";
import { Icon } from "../../../ui/icons";
import { Menu } from "../../../ui/Menu";
import { ImageField } from "./ImageField";

/*
  One block in the editor. The card layout is the same for every type:
  type label and tools on top, an inline heading where the type has one, then fields.
*/

const HAS_HEADING = ["text", "steps", "list", "contact", "private"];

export function BlockEditor({ block, onChange, onMove, onDuplicate, onRemove, isFirst, isLast }) {
  const meta = blockMeta(block.type);
  const set = (patch) => onChange({ ...block, ...patch });

  return (
    <section className="group bg-card border border-line rounded-xl px-6 pt-5 pb-6" aria-label={`${meta.label} block`}>
      <div className="flex items-center gap-2 text-sm text-muted mb-3">
        <Icon name={meta.icon} className="text-md" />
        {meta.label}
        <div className="ml-auto flex gap-0.5 opacity-60 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity">
          <IconButton icon="arrow-up" label="Move up" size="sm" variant="ghost" disabled={isFirst} onClick={() => onMove(-1)} />
          <IconButton icon="arrow-down" label="Move down" size="sm" variant="ghost" disabled={isLast} onClick={() => onMove(1)} />
          <Menu
            width={180}
            trigger={({ toggle }) => <IconButton icon="dots" label="Block options" size="sm" variant="ghost" onClick={toggle} />}
            items={[
              { label: "Duplicate", icon: "copy", onClick: onDuplicate },
              "divider",
              { label: "Delete block", icon: "trash", danger: true, onClick: onRemove },
            ]}
          />
        </div>
      </div>

      {HAS_HEADING.includes(block.type) && (
        <input
          value={block.heading ?? ""}
          onChange={(e) => set({ heading: e.target.value })}
          placeholder="Heading (optional)"
          aria-label="Block heading"
          className="w-full bg-transparent border-0 border-b border-transparent hover:border-line-soft focus:border-navy focus:outline-none text-xl font-semibold text-ink placeholder:text-faint placeholder:font-normal pb-1.5 mb-4"
        />
      )}

      <BlockFields block={block} set={set} />
    </section>
  );
}

/** Warning under a text field when it looks like a door code. "Keep it" hides it for this visit. */
function CodeCheck({ text, onRemove }) {
  const [kept, setKept] = useState(false);
  if (kept || !looksLikeCode(text)) return null;
  return (
    <div className="mt-2.5">
      <SensitiveWarning onRemove={onRemove} onKeep={() => setKept(true)} />
    </div>
  );
}

function RowTools({ onRemove, label }) {
  return (
    <IconButton
      icon="x"
      label={label}
      size="sm"
      variant="ghost"
      className="opacity-0 group-hover/row:opacity-100 focus:opacity-100 mt-1"
      onClick={onRemove}
    />
  );
}

function AddRow({ onClick, children }) {
  return (
    <button type="button" onClick={onClick} className="inline-flex items-center gap-1.5 text-sm font-semibold text-link hover:underline underline-offset-4">
      <Icon name="plus" />
      {children}
    </button>
  );
}

function BlockFields({ block, set }) {
  switch (block.type) {
    case "text":
      return (
        <>
          <Textarea value={block.body} onChange={(e) => set({ body: e.target.value })} minRows={3} placeholder="Write for guests. Short paragraphs read best on phones." aria-label="Text" />
          <CodeCheck text={block.body} onRemove={() => set({ body: stripCodes(block.body) })} />
        </>
      );

    case "steps": {
      const steps = block.steps ?? [];
      const setStep = (i, v) => set({ steps: steps.map((s, j) => (j === i ? v : s)) });
      return (
        <>
          <ol className="list-none m-0 p-0 flex flex-col gap-2.5 mb-4">
            {steps.map((s, i) => (
              <li key={i} className="group/row">
                <div className="grid grid-cols-[28px_minmax(0,1fr)_32px] gap-2.5 items-start">
                  <span className="w-[26px] h-[26px] mt-[7px] rounded-full bg-field border border-line text-xs font-semibold text-muted grid place-items-center">
                    {i + 1}
                  </span>
                  <Textarea value={s} minRows={1} onChange={(e) => setStep(i, e.target.value)} aria-label={`Step ${i + 1}`} />
                  <RowTools label={`Remove step ${i + 1}`} onRemove={() => set({ steps: steps.filter((_, j) => j !== i) })} />
                </div>
                <div className="pl-[38px] pr-[42px]">
                  <CodeCheck text={s} onRemove={() => setStep(i, stripCodes(s))} />
                </div>
              </li>
            ))}
          </ol>
          <AddRow onClick={() => set({ steps: [...steps, ""] })}>Add step</AddRow>
        </>
      );
    }

    case "list": {
      const items = block.items ?? [];
      const setItem = (i, patch) => set({ items: items.map((it, j) => (j === i ? { ...it, ...patch } : it)) });
      return (
        <>
          <div className="grid grid-cols-[40px_minmax(0,0.9fr)_minmax(0,1.3fr)_32px] gap-2.5 text-xs text-muted mb-1.5">
            <span>Icon</span>
            <span>Item</span>
            <span>Detail</span>
          </div>
          <ul className="list-none m-0 p-0 flex flex-col gap-2.5 mb-4">
            {items.map((it, i) => (
              <li key={i} className="group/row">
                <div className="grid grid-cols-[40px_minmax(0,0.9fr)_minmax(0,1.3fr)_32px] gap-2.5 items-start">
                  <IconPicker value={it.icon} onChange={(icon) => setItem(i, { icon })} />
                  <Input value={it.title} onChange={(e) => setItem(i, { title: e.target.value })} aria-label={`Item ${i + 1}`} />
                  <Textarea value={it.detail ?? ""} minRows={1} onChange={(e) => setItem(i, { detail: e.target.value })} aria-label={`Detail ${i + 1}`} />
                  <RowTools label={`Remove item ${i + 1}`} onRemove={() => set({ items: items.filter((_, j) => j !== i) })} />
                </div>
                <div className="pl-[50px] pr-[42px]">
                  <CodeCheck text={it.detail} onRemove={() => setItem(i, { detail: stripCodes(it.detail) })} />
                </div>
              </li>
            ))}
          </ul>
          <AddRow onClick={() => set({ items: [...items, { title: "", detail: "", icon: "point" }] })}>Add item</AddRow>
        </>
      );
    }

    case "image":
      return (
        <div className="flex flex-col gap-4">
          <ImageField value={block.src} onChange={(src) => set({ src })} aspect="16/10" />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Describe the photo" hint="Read aloud by screen readers">
              <Input value={block.alt} onChange={(e) => set({ alt: e.target.value })} />
            </Field>
            <Field label="Caption" hint="Shown under the photo">
              <Input value={block.caption ?? ""} onChange={(e) => set({ caption: e.target.value })} />
            </Field>
          </div>
        </div>
      );

    case "video":
      return <VideoFields block={block} set={set} />;

    case "link":
      return (
        <div className="grid grid-cols-2 gap-3">
          <Field label="Button text">
            <Input value={block.label} onChange={(e) => set({ label: e.target.value })} placeholder="Book an airport transfer" />
          </Field>
          <Field label="Web address">
            <Input value={block.href} onChange={(e) => set({ href: e.target.value.trim() })} placeholder="https://" invalid={block.href && !/^https?:\/\//i.test(block.href)} />
          </Field>
          <Field label="Description" className="col-span-2">
            <Input value={block.description ?? ""} onChange={(e) => set({ description: e.target.value })} />
          </Field>
        </div>
      );

    case "wifi":
      return (
        <div className="grid grid-cols-2 gap-3">
          <Field label="Network name">
            <Input value={block.network} onChange={(e) => set({ network: e.target.value })} />
          </Field>
          <Field label="Password">
            <Input value={block.password} onChange={(e) => set({ password: e.target.value })} spellCheck={false} />
          </Field>
          <Field label="Note" className="col-span-2">
            <Input value={block.note ?? ""} onChange={(e) => set({ note: e.target.value })} placeholder="Where the router is, or how to restart it" />
          </Field>
        </div>
      );

    case "contact": {
      const methods = block.methods ?? [];
      const setM = (i, patch) => set({ methods: methods.map((m, j) => (j === i ? { ...m, ...patch } : m)) });
      return (
        <>
          <div className="grid grid-cols-[120px_minmax(0,1fr)_minmax(0,1fr)_32px] gap-2.5 text-xs text-muted mb-1.5">
            <span>Type</span>
            <span>Button text</span>
            <span>Number, username, or email</span>
          </div>
          <ul className="list-none m-0 p-0 flex flex-col gap-2.5 mb-4">
            {methods.map((m, i) => (
              <li key={i} className="group/row grid grid-cols-[120px_minmax(0,1fr)_minmax(0,1fr)_32px] gap-2.5 items-start">
                <Select value={m.kind} onChange={(e) => setM(i, { kind: e.target.value })} aria-label="Contact type">
                  <option value="call">Call</option>
                  <option value="sms">Text</option>
                  <option value="messenger">Messenger</option>
                  <option value="email">Email</option>
                </Select>
                <Input value={m.label} onChange={(e) => setM(i, { label: e.target.value })} aria-label="Button text" />
                <Input value={m.value} onChange={(e) => setM(i, { value: e.target.value })} aria-label="Contact value" />
                <RowTools label="Remove contact" onRemove={() => set({ methods: methods.filter((_, j) => j !== i) })} />
              </li>
            ))}
          </ul>
          <div className="flex items-center justify-between gap-4">
            <AddRow onClick={() => set({ methods: [...methods, { kind: "call", label: "", value: "", detail: "" }] })}>Add contact</AddRow>
            <Checkbox checked={!!block.urgent} onChange={(urgent) => set({ urgent })}>
              <span className="text-sm text-muted">Emergency style</span>
            </Checkbox>
          </div>
        </>
      );
    }

    case "map-link":
      return (
        <div className="grid grid-cols-2 gap-3">
          <Field label="Button text">
            <Input value={block.label} onChange={(e) => set({ label: e.target.value })} placeholder="Nearest hospital" />
          </Field>
          <Field label="Place or address" hint="Opens in Google Maps">
            <Input value={block.query} onChange={(e) => set({ query: e.target.value })} />
          </Field>
          <Field label="Note" className="col-span-2">
            <Input value={block.note ?? ""} onChange={(e) => set({ note: e.target.value })} />
          </Field>
        </div>
      );

    case "private":
      return <PrivateFields block={block} set={set} />;

    default:
      return <p className="text-muted m-0">This block type can't be edited here.</p>;
  }
}

function VideoFields({ block, set }) {
  const [raw, setRaw] = useState(block.videoId ? (block.provider === "vimeo" ? `https://vimeo.com/${block.videoId}` : `https://youtu.be/${block.videoId}`) : "");
  const parsed = raw ? parseVideo(raw) : null;
  return (
    <div className="grid grid-cols-2 gap-3">
      <Field
        label="YouTube or Vimeo link"
        className="col-span-2"
        error={raw && !parsed ? "Paste a YouTube or Vimeo link." : ""}
        hint="Only the video ID is stored. Other sites are not allowed."
      >
        <Input
          value={raw}
          onChange={(e) => {
            setRaw(e.target.value);
            const p = parseVideo(e.target.value);
            if (p) set(p);
          }}
          placeholder="https://youtu.be/..."
        />
      </Field>
      <Field label="Title" className="col-span-2" hint="Describes the video for screen readers">
        <Input value={block.title} onChange={(e) => set({ title: e.target.value })} />
      </Field>
    </div>
  );
}

/**
 * The one place a door or lockbox code is meant to go, so unlike text/steps/
 * list this deliberately has no CodeCheck warning on the body field.
 */
function PrivateFields({ block, set }) {
  const [copied, setCopied] = useState(false);

  async function copyPin() {
    const ok = await copyText(block.pin || "");
    if (!ok) return;
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex flex-col gap-4">
      <Field label="Content" hint="Shown only after a guest enters the correct PIN. Door and lockbox codes belong here.">
        <Textarea
          value={block.body}
          onChange={(e) => set({ body: e.target.value })}
          minRows={2}
          placeholder="The lockbox code, gate code, or other sensitive detail"
          aria-label="Private content"
        />
      </Field>
      <Field label="PIN" hint="Share this with the guest yourself, by text or email, separately from the guide link. At least 4 characters.">
        <div className="flex gap-2">
          <Input
            value={block.pin ?? ""}
            onChange={(e) => set({ pin: e.target.value })}
            spellCheck={false}
            aria-label="PIN"
            className="flex-1"
          />
          <IconButton icon={copied ? "check" : "copy"} label="Copy PIN" onClick={copyPin} disabled={!block.pin} />
        </div>
      </Field>
    </div>
  );
}

const ICON_CHOICES = [
  "point", "check", "clock", "door-enter", "door-exit", "key", "car", "wifi", "bed", "bath", "droplet", "flame", "bolt",
  "air-conditioning", "pool", "beach", "sun", "moon", "smoking-no", "users", "paw", "trash", "recycle", "tools-kitchen-2",
  "coffee", "device-tv", "wash-machine", "first-aid-kit", "phone", "map-pin", "sparkles", "leaf", "receipt", "info-circle",
];

/** Picks a Tabler icon from a short curated set, so guides stay consistent. */
function IconPicker({ value, onChange }) {
  return <IconGrid value={value} onChange={onChange} />;
}

function IconGrid({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);
  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Choose icon"
        aria-expanded={open}
        className="w-10 h-10 rounded-lg border border-line bg-field grid place-items-center text-lg text-muted hover:text-ink"
      >
        <Icon name={value || "point"} />
      </button>
      {open && (
        <div
          className="absolute z-30 left-0 mt-1.5 p-2 w-[272px] grid grid-cols-7 gap-1 bg-card border border-line rounded-xl shadow-[0_12px_32px_-12px_rgba(0,0,0,0.25)]"
        >
          {ICON_CHOICES.map((n) => (
            <button
              key={n}
              type="button"
              title={n}
              aria-label={n}
              onClick={() => {
                onChange(n);
                setOpen(false);
              }}
              className={`w-8 h-8 rounded-md grid place-items-center text-md hover:bg-field ${value === n ? "bg-navy-soft text-ink" : "text-muted"}`}
            >
              <Icon name={n} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
