import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { DemoBadge } from "./DemoBadge";
import { HomeScreen } from "./HomeScreen";
import { SectionScreen } from "./SectionScreen";
import { PlacesScreen } from "./PlacesScreen";
import { SearchOverlay } from "./SearchOverlay";
import { ThemeSwitcher } from "./ThemeSwitcher";

const TABS = [
  { id: "home", label: "Home", icon: "home" },
  { id: "guide", label: "Guide", icon: "book" },
  { id: "places", label: "Places", icon: "map-pin" },
  { id: "host", label: "Host", icon: "users" },
];

/**
 * Phone layout: tile grid, section screens, bottom tabs, search.
 * embedded: inside a phone frame or preview, where the page owns the theme switcher.
 * focusPageId: when set (studio preview), jumps to that section.
 */
export function MobileShell({ content, embedded = false, demo = false, footer = null, focusPageId, switcher = true }) {
  const [tab, setTab] = useState("home");
  const [sectionId, setSectionId] = useState(focusPageId ?? null);
  const [searching, setSearching] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (focusPageId !== undefined) setSectionId(focusPageId);
  }, [focusPageId]);

  const page = sectionId ? content.pages.find((p) => p.id === sectionId) : undefined;
  const hostPage = content.pages.find((p) => p.type === "host");
  const explorePage = content.pages.find((p) => p.type === "places");
  const exploreIntro = explorePage?.blocks.find((b) => b.type === "text");

  useLayoutEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
  }, [tab, sectionId]);

  const openSection = useCallback((id) => {
    setSectionId(id);
    setSearching(false);
  }, []);
  const closeSearch = useCallback(() => setSearching(false), []);

  function goTab(t) {
    setTab(t);
    setSectionId(null);
  }

  const tabs = TABS.filter((t) => (t.id === "places" ? content.places.length > 0 : t.id === "host" ? !!hostPage : true));

  let screen;
  if (page) {
    screen = <SectionScreen page={page} content={content} />;
  } else if (tab === "guide") {
    screen = (
      <article className="section-screen">
        <header className="section-screen__head">
          <h1 className="section-screen__title">The guide</h1>
        </header>
        <SectionList content={content} onOpen={openSection} />
      </article>
    );
  } else if (tab === "places") {
    screen = <PlacesScreen places={content.places} intro={exploreIntro?.body} />;
  } else if (tab === "host" && hostPage) {
    screen = <SectionScreen page={hostPage} content={content} />;
  } else {
    screen = <HomeScreen content={content} onOpen={openSection} />;
  }

  return (
    <div className={`mobile-shell${embedded ? " mobile-shell--embedded" : ""}`}>
      <header className="topbar">
        {page ? (
          <button type="button" className="icon-btn topbar__back" onClick={() => setSectionId(null)} aria-label="Back">
            <i className="ti ti-chevron-left" aria-hidden="true" />
          </button>
        ) : null}
        <div className="topbar__id">
          <span className="topbar__name">{content.property.name}</span>
          {demo && <DemoBadge />}
        </div>
        <button type="button" className="icon-btn" onClick={() => setSearching(true)} aria-label="Search the guide">
          <i className="ti ti-search" aria-hidden="true" />
        </button>
      </header>

      <main className="mobile-shell__scroll" ref={scrollRef}>
        {screen}
        {footer}
      </main>

      <nav className="bottom-nav" aria-label="Main">
        {tabs.map((t) => {
          const active = !page && tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              className="bottom-nav__item"
              aria-current={active ? "page" : undefined}
              onClick={() => goTab(t.id)}
            >
              <i className={`ti ti-${t.icon}`} aria-hidden="true" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </nav>

      {!embedded && switcher && <ThemeSwitcher placement="mobile" />}
      {searching && <SearchOverlay content={content} onSelect={openSection} onClose={closeSearch} />}
    </div>
  );
}

/** Vertical list of all sections: used by the mobile Guide tab and the desktop sidebar. */
export function SectionList({ content, onOpen, activeId }) {
  return (
    <ul className="section-list">
      {content.pages.map((p) => (
        <li key={p.id}>
          <button
            type="button"
            className={`section-list__item${p.type === "emergency" ? " section-list__item--urgent" : ""}`}
            aria-current={activeId === p.id ? "page" : undefined}
            onClick={() => onOpen(p.id)}
          >
            <i className={`ti ti-${p.icon}`} aria-hidden="true" />
            <span>{p.title}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}
