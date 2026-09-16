import { useColorMode } from "../../lib/theme";
import { IconButton } from "./Button";

/** Light and dark mode for the studio and client dashboard. onDark: for the charcoal top bar. */
export function ThemeToggle({ onDark = false }) {
  const { mode, toggle } = useColorMode();
  const dark = mode === "dark";
  const label = dark ? "Switch to light mode" : "Switch to dark mode";
  if (onDark) {
    return (
      <button
        type="button"
        onClick={toggle}
        aria-label={label}
        title={label}
        className="inline-grid place-items-center w-8 h-8 rounded-lg border border-white/15 text-nav-muted hover:text-nav-ink"
      >
        <i className={`ti ti-${dark ? "sun" : "moon"}`} aria-hidden="true" />
      </button>
    );
  }
  return <IconButton icon={dark ? "sun" : "moon"} label={label} onClick={toggle} />;
}
