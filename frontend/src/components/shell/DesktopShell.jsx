import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { DemoBadge } from "./DemoBadge";
import { MobileShell, SectionList } from "./MobileShell";
import { PhoneFrame } from "./PhoneFrame";
import { ViewToggle } from "./ViewToggle";
import { SectionScreen } from "./SectionScreen";
import { SearchOverlay } from "./SearchOverlay";
import { ThemeSwitcher } from "./ThemeSwitcher";

/**
 * Desktop layout: sidebar of sections and a reading pane.
 * The Desktop and Phone toggle is shown on the demo only, so visitors can try the phone view.
 */
export function DesktopShell({ content, demo = false, footer = null, focusPageId, switcher = true, contained = false }) {
  const [mode, setMode] = useState("desktop");
  const [activeId, setActiveId] = useState(focusPageId ?? content.pages[0]?.id);
  const [searching, setSearching] = useState(false);
  const paneRef = useRef(null);
  const page = content.pages.find((p) => p.id === activeId) ?? content.pages[0];

  useEffect(() => {
    if (focusPageId) setActiveId(focusPageId);
  }, [focusPageId]);

  useLayoutEffect(() => {
    paneRef.current?.scrollTo({ top: 0 });
  }, [activeId]);

  const open = useCallback((id) => {
    setActiveId(id);
    setMode("desktop");
    setSearching(false);
  }, []);
  const closeSearch = useCallback(() => setSearching(false), []);

  return (
    <div className="desktop-shell">
      <header className="desk-header">
        <div className="desk-header__id">
          <span className="desk-header__name">{content.property.name}</span>
          {demo && <DemoBadge />}
        </div>
        <div className="desk-header__actions">
          {demo && <ViewToggle mode={mode} onChange={setMode} />}
          {mode === "desktop" && (
            <button type="button" className="search-trigger" onClick={() => setSearching(true)}>
              <i className="ti ti-search" aria-hidden="true" />
              Search the guide
            </button>
          )}
        </div>
      </header>

      {mode === "desktop" ? (
        <div className="desk-body">
          <nav className="sidebar" aria-label="Guide sections">
            <SectionList content={content} onOpen={open} activeId={page?.id} />
          </nav>
          <main className="content-pane" ref={paneRef}>
            <div className="content-pane__inner">
              {page && <SectionScreen key={page.id} page={page} content={content} />}
              {footer}
            </div>
          </main>
        </div>
      ) : (
        <main className="phone-stage">
          <PhoneFrame>
            <MobileShell content={content} embedded demo={demo} footer={footer} />
          </PhoneFrame>
          <p className="phone-stage__caption">
            This is the live phone version. Tap around; everything works the same as on a real phone.
          </p>
        </main>
      )}

      {switcher && !contained && <ThemeSwitcher placement="desktop" />}
      {searching && (
        <SearchOverlay content={content} onSelect={open} onClose={closeSearch} variant={contained ? "contained" : "modal"} />
      )}
    </div>
  );
}
