import { useEffect, useId, useRef } from "react";
import { IconButton } from "./Button";

/**
 * Modal dialog. side="right" turns it into a drawer for longer forms.
 * Closes on Escape and on a click outside the panel.
 */
export function Dialog({ open, onClose, title, description, children, footer, side, width = 460 }) {
  const titleId = useId();
  const panelRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const opener = document.activeElement;
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    panelRef.current?.querySelector("input, textarea, select, button:not([aria-label='Close'])")?.focus();
    return () => {
      window.removeEventListener("keydown", onKey);
      opener?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;
  const drawer = side === "right";
  return (
    <div
      className={`fixed inset-0 z-50 bg-scrim flex ${drawer ? "justify-end" : "items-center justify-center p-4"}`}
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`bg-card text-ink border border-line flex flex-col max-h-full ${drawer ? "h-full rounded-l-2xl" : "rounded-2xl max-h-[88vh]"}`}
        style={{ width: `min(${width}px, 100%)` }}
      >
        <div className="flex items-start justify-between gap-4 px-6 pt-5 pb-4">
          <div>
            <h2 id={titleId} className="text-xl font-semibold m-0">
              {title}
            </h2>
            {description && <p className="text-muted text-base mt-1 mb-0">{description}</p>}
          </div>
          <IconButton icon="x" label="Close" variant="ghost" size="sm" onClick={onClose} />
        </div>
        <div className="px-6 pb-6 overflow-auto flex-1">{children}</div>
        {footer && <div className="px-6 py-4 border-t border-line-soft flex justify-end gap-2">{footer}</div>}
      </div>
    </div>
  );
}
