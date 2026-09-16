import { BLOCK_TYPES, PAGE_TYPE_LABELS, STANDARD_SECTIONS, isPageEmpty, newBlock } from "../../../../lib/guideSchema";
import { mapsSearchUrl } from "../../../../lib/links";
import { Button, IconButton } from "../../../ui/Button";
import { Field, Input, Textarea } from "../../../ui/Field";
import { Icon } from "../../../ui/icons";
import { Menu } from "../../../ui/Menu";
import { BlockEditor } from "./BlockEditor";

const CUSTOM_ICONS = ["file-text", "info-circle", "car", "bus", "plane", "swimming", "bike", "baby-carriage", "calendar", "gift", "shopping-bag", "star"];

/** Middle column when a page is selected: page title, its blocks, and places for the Explore page. */
export function PageEditor({ draft, page, onPageChange, onPlacesChange, onDeletePage, onGoTo }) {
  const standard = STANDARD_SECTIONS.some((s) => s.id === page.id);
  const shown = !isPageEmpty(page, draft);
  const setBlocks = (blocks) => onPageChange({ ...page, blocks });

  function move(i, dir) {
    const next = [...page.blocks];
    const [b] = next.splice(i, 1);
    next.splice(i + dir, 0, b);
    setBlocks(next);
  }

  return (
    <div className="max-w-[640px] mx-auto">
      <div className="flex items-start justify-between gap-5 mb-8">
        <div className="flex-1 min-w-0">
          <input
            value={page.title}
            onChange={(e) => onPageChange({ ...page, title: e.target.value })}
            aria-label="Page title"
            className="w-full bg-transparent border-0 p-0 text-2xl font-semibold text-ink focus:outline-none tracking-tight"
          />
          <p className="mt-1 mb-0 text-sm text-muted">{PAGE_TYPE_LABELS[page.type] ?? "Page"}</p>
        </div>
        <div className="flex items-center gap-2 pt-2">
          <span className={`flex items-center gap-2 text-sm whitespace-nowrap ${shown ? "text-muted" : "text-faint"}`}>
            <span className={`w-2 h-2 rounded-full ${shown ? "bg-navy" : "bg-faint"}`} />
            {shown ? "Shown to guests" : "Hidden until it has content"}
          </span>
          {!standard && (
            <Menu
              width={220}
              trigger={({ toggle }) => <IconButton icon="dots" label="Page options" size="sm" variant="ghost" onClick={toggle} />}
              items={[{ label: "Delete page", icon: "trash", danger: true, onClick: onDeletePage }]}
            />
          )}
        </div>
      </div>

      {!standard && (
        <div className="mb-6">
          <p className="text-sm text-muted mt-0 mb-2">Icon</p>
          <div className="flex flex-wrap gap-1">
            {CUSTOM_ICONS.map((n) => (
              <button
                key={n}
                type="button"
                aria-label={n}
                title={n}
                onClick={() => onPageChange({ ...page, icon: n })}
                className={`w-9 h-9 rounded-lg grid place-items-center text-lg border ${page.icon === n ? "border-navy bg-navy-soft text-ink" : "border-transparent text-muted hover:bg-card"}`}
              >
                <Icon name={n} />
              </button>
            ))}
          </div>
        </div>
      )}

      {page.type === "host" && (
        <div className="flex items-center gap-3 bg-navy-soft rounded-xl px-4 py-3 mb-4 text-sm">
          <Icon name="info-circle" className="text-link text-lg" />
          <span className="flex-1">The host card on this page comes from the host details.</span>
          <Button size="sm" variant="link" onClick={() => onGoTo({ kind: "host" })}>
            Edit host details
          </Button>
        </div>
      )}

      <div className="flex flex-col gap-4">
        {page.blocks.map((b, i) => (
          <BlockEditor
            key={`${page.id}-${i}-${b.type}`}
            block={b}
            isFirst={i === 0}
            isLast={i === page.blocks.length - 1}
            onChange={(nb) => setBlocks(page.blocks.map((x, j) => (j === i ? nb : x)))}
            onMove={(dir) => move(i, dir)}
            onDuplicate={() => {
              const next = [...page.blocks];
              next.splice(i + 1, 0, structuredClone(b));
              setBlocks(next);
            }}
            onRemove={() => setBlocks(page.blocks.filter((_, j) => j !== i))}
          />
        ))}
      </div>

      <Menu
        align="left"
        width={320}
        trigger={({ toggle }) => (
          <button
            type="button"
            onClick={toggle}
            className="mt-4 w-full h-12 flex items-center justify-center gap-2 border border-dashed border-line rounded-xl text-muted font-semibold hover:text-ink hover:border-faint"
          >
            <Icon name="plus" />
            Add block
          </button>
        )}
        items={BLOCK_TYPES.map((t) => ({ label: t.label, icon: t.icon, onClick: () => setBlocks([...page.blocks, newBlock(t.type)]) }))}
      />

      {page.type === "places" && <PlacesEditor places={draft.places} onChange={onPlacesChange} />}
    </div>
  );
}

function PlacesEditor({ places, onChange }) {
  const set = (i, patch) => onChange(places.map((p, j) => (j === i ? { ...p, ...patch } : p)));
  return (
    <section className="mt-10">
      <div className="flex items-end justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold m-0">Places nearby</h2>
          <p className="text-sm text-muted mt-1 mb-0">{places.length} of 30. Each opens in Google Maps.</p>
        </div>
        <Button
          size="sm"
          icon="plus"
          disabled={places.length >= 30}
          onClick={() => onChange([...places, { name: "", category: "", note: "", mapsUrl: "" }])}
        >
          Add place
        </Button>
      </div>
      <div className="flex flex-col gap-3">
        {places.map((p, i) => (
          <div key={i} className="group bg-card border border-line rounded-xl px-5 py-4">
            <div className="grid grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_32px] gap-3 items-end">
              <Field label="Name">
                <Input
                  value={p.name}
                  onChange={(e) => set(i, { name: e.target.value })}
                  onBlur={() => !p.mapsUrl && p.name && set(i, { mapsUrl: mapsSearchUrl(p.name) })}
                />
              </Field>
              <Field label="Category">
                <Input value={p.category} onChange={(e) => set(i, { category: e.target.value })} />
              </Field>
              <IconButton icon="x" label={`Remove ${p.name || "place"}`} size="sm" variant="ghost" className="mb-1" onClick={() => onChange(places.filter((_, j) => j !== i))} />
            </div>
            <div className="mt-3">
              <Textarea value={p.note} minRows={1} onChange={(e) => set(i, { note: e.target.value })} placeholder="Why guests should go, and when" aria-label="Note" />
            </div>
            <div className="mt-3">
              <Input
                value={p.mapsUrl}
                onChange={(e) => set(i, { mapsUrl: e.target.value.trim() })}
                placeholder="Google Maps link"
                aria-label="Google Maps link"
                invalid={p.mapsUrl && !/^https?:\/\//i.test(p.mapsUrl)}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
