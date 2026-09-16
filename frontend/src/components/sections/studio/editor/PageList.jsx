import { useState } from "react";
import { isPageEmpty, pageWarnings } from "../../../../lib/guideSchema";
import { themeById } from "../../../../lib/guideThemes";
import { Icon } from "../../../ui/icons";

/*
  Left column of the editor: the guide's pages (drag to reorder) and the guide details.
  Empty pages are greyed out because guests never see them.
*/

const DETAILS = [
  { id: "property", label: "Property and cover", icon: "photo" },
  { id: "host", label: "Host", icon: "user" },
  { id: "theme", label: "Theme", icon: "palette" },
  { id: "subdomain", label: "Subdomain", icon: "world" },
];

function Row({ active, muted, icon, label, meta, dot, onClick, draggable, onDragStart, onDragOver, onDrop, dragOver }) {
  return (
    <li
      draggable={draggable}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      className={`relative group ${dragOver ? "before:absolute before:-top-px before:left-2 before:right-2 before:h-0.5 before:bg-navy before:rounded" : ""}`}
    >
      <button
        type="button"
        onClick={onClick}
        aria-current={active ? "true" : undefined}
        className={`w-full flex items-center gap-3 h-[38px] px-2.5 rounded-lg text-left transition-colors ${
          active ? "bg-navy-soft font-semibold" : "hover:bg-card"
        } ${muted && !active ? "text-faint" : "text-ink"}`}
      >
        {draggable && <Icon name="grip-vertical" className="absolute -left-1 text-xs text-faint opacity-0 group-hover:opacity-100 cursor-grab" />}
        <Icon name={icon} className={`text-[17px] w-[18px] text-center ${active ? "text-link" : muted ? "text-faint" : "text-muted"}`} />
        <span className="flex-1 min-w-0 truncate">{label}</span>
        {dot && <span className="w-[7px] h-[7px] rounded-full bg-accent shrink-0" title="Possible door code" />}
        {meta && <span className="shrink-0 text-xs text-faint font-normal">{meta}</span>}
      </button>
    </li>
  );
}

export function PageList({ draft, selected, onSelect, onReorder, onAddPage }) {
  const [dragId, setDragId] = useState(null);
  const [overId, setOverId] = useState(null);

  function drop(targetId) {
    if (!dragId || dragId === targetId) return;
    const ids = draft.pages.map((p) => p.id);
    const from = ids.indexOf(dragId);
    const to = ids.indexOf(targetId);
    const next = [...draft.pages];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onReorder(next);
    setDragId(null);
    setOverId(null);
  }

  return (
    <nav className="border-r border-line px-3.5 py-6 overflow-auto" aria-label="Guide pages">
      <div className="mb-7">
        <div className="flex items-center justify-between px-2.5 pb-2.5 text-xs text-muted">
          <span>Pages</span>
          <button type="button" onClick={onAddPage} aria-label="Add a page" title="Add a page" className="w-[26px] h-[26px] rounded-md grid place-items-center hover:bg-card text-md">
            <Icon name="plus" />
          </button>
        </div>
        <ul className="list-none m-0 p-0 flex flex-col gap-0.5" onDragEnd={() => setOverId(null)}>
          {draft.pages.map((p) => {
            const empty = isPageEmpty(p, draft);
            return (
              <Row
                key={p.id}
                draggable
                onDragStart={() => setDragId(p.id)}
                onDragOver={(e) => {
                  e.preventDefault();
                  setOverId(p.id);
                }}
                onDrop={() => drop(p.id)}
                dragOver={overId === p.id && dragId !== p.id}
                active={selected.kind === "page" && selected.id === p.id}
                muted={empty}
                icon={p.icon}
                label={p.title || "Untitled page"}
                dot={pageWarnings(p) > 0}
                meta={empty ? "Empty" : p.type === "places" ? String(draft.places.length) : null}
                onClick={() => onSelect({ kind: "page", id: p.id })}
              />
            );
          })}
        </ul>
      </div>
      <div>
        <div className="px-2.5 pb-2.5 text-xs text-muted">Guide details</div>
        <ul className="list-none m-0 p-0 flex flex-col gap-0.5">
          {DETAILS.map((d) => (
            <Row
              key={d.id}
              active={selected.kind === d.id}
              icon={d.icon}
              label={d.label}
              meta={d.id === "theme" ? (draft.theme.preset === "custom" ? "Custom" : themeById(draft.theme.preset).label) : null}
              onClick={() => onSelect({ kind: d.id })}
            />
          ))}
        </ul>
      </div>
    </nav>
  );
}
