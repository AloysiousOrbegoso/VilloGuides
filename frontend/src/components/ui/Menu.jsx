import { useEffect, useRef, useState } from "react";
import { Icon } from "./icons";

/**
 * Small popover menu. items: [{ label, icon, onClick, danger, disabled }] or "divider".
 * trigger: render prop receiving { open, toggle }.
 */
export function Menu({ trigger, items, align = "right", width = 220 }) {
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
      {trigger({ open, toggle: () => setOpen((o) => !o) })}
      {open && (
        <div
          role="menu"
          className={`absolute z-40 mt-1.5 py-1.5 bg-card border border-line rounded-xl shadow-[0_12px_32px_-12px_rgba(0,0,0,0.25)] ${align === "right" ? "right-0" : "left-0"}`}
          style={{ width }}
        >
          {items.filter(Boolean).map((it, i) =>
            it === "divider" ? (
              <div key={`d${i}`} className="my-1.5 border-t border-line-soft" />
            ) : (
              <button
                key={it.label}
                role="menuitem"
                type="button"
                disabled={it.disabled}
                onClick={() => {
                  setOpen(false);
                  it.onClick?.();
                }}
                className={`w-full flex items-center gap-2.5 px-3.5 h-9 text-left text-base hover:bg-field disabled:text-faint disabled:hover:bg-transparent ${
                  it.danger ? "text-accent" : "text-ink"
                }`}
              >
                {it.icon && <Icon name={it.icon} className="text-md text-muted" />}
                {it.label}
              </button>
            ),
          )}
        </div>
      )}
    </div>
  );
}
