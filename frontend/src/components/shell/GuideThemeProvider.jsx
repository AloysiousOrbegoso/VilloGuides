import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { themeCss, themeById } from "../../lib/guideThemes";

const ThemeContext = createContext(null);

// Inject the guide token sets once. They are scoped to .guide[data-guide-theme].
if (typeof document !== "undefined" && !document.getElementById("guide-theme-tokens")) {
  const style = document.createElement("style");
  style.id = "guide-theme-tokens";
  style.textContent = themeCss();
  document.head.prepend(style);
}

/**
 * Holds the guest's chosen theme for one guide. Unlike the demo, this never touches
 * <html>, so a guide can render inside the studio without changing the studio's colors.
 * syncPage updates the browser theme color when the guide is the whole page.
 */
export function GuideThemeProvider({ children, initial = "daytime", syncPage = false }) {
  const [theme, setTheme] = useState(initial);

  useEffect(() => setTheme(initial), [initial]);

  useEffect(() => {
    if (!syncPage) return;
    const bg = themeById(theme).tokens.bg;
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", bg);
  }, [theme, syncPage]);

  const value = useMemo(() => ({ theme, setTheme }), [theme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside <GuideThemeProvider>");
  return ctx;
}
