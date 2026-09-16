import { useEffect, useId, useMemo, useRef, useState } from "react";
import { searchGuide } from "../../lib/search";
const SUGGESTIONS = ["wifi", "checkout", "parking", "trash", "hospital"];
export function SearchOverlay({ content, onSelect, onClose, variant = "contained" }) {
  const [query, setQuery] = useState("");
  const inputRef = useRef(null);
  const listId = useId();
  const results = useMemo(() => searchGuide(content, query), [content, query]);
  useEffect(() => {
    const opener = document.activeElement;
    inputRef.current?.focus();
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      opener?.focus?.();
    };
  }, [onClose]);
  return (
    <div
      className={`search search--${variant}`}
      role="dialog"
      aria-modal="true"
      aria-label="Search the guide"
      onMouseDown={(e) => variant === "modal" && e.target === e.currentTarget && onClose()}
    >
      <div className="search__panel">
        <div className="search__bar">
          <i className="ti ti-search search__glass" aria-hidden="true" />
          <input
            ref={inputRef}
            className="search__input"
            type="search"
            placeholder="Search the guide"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-controls={listId}
            autoComplete="off"
            enterKeyHint="search"
            onKeyDown={(e) => e.key === "Enter" && results[0] && onSelect(results[0].pageId)}
          />
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close search">
            <i className="ti ti-x" aria-hidden="true" />
          </button>
        </div>

        <div className="search__body" id={listId} aria-live="polite">
          {query.trim() === "" ? (
            <div className="search__empty">
              <p>Look up anything in the guide. For example:</p>
              <div className="search__chips">
                {SUGGESTIONS.map((s) => (
                  <button key={s} type="button" className="chip" onClick={() => setQuery(s)}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : results.length === 0 ? (
            <p className="search__empty">
              Nothing matches "{query.trim()}". Try a shorter word, like "pool" or "key".
            </p>
          ) : (
            <ul className="search__results">
              {results.map((r) => (
                <li key={r.pageId}>
                  <button type="button" className="search__result" onClick={() => onSelect(r.pageId)}>
                    <i className={`ti ti-${r.icon}`} aria-hidden="true" />
                    <span>
                      <span className="search__result-title">{r.pageTitle}</span>
                      <span className="search__result-snippet">{r.snippet}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
