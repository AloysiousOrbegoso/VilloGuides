import { useState } from "react";
import { themes } from "../../lib/guideThemes";
import { useTheme } from "./GuideThemeProvider";
const swatchBg = (t) => `linear-gradient(135deg, ${t.swatch[0]} 50%, ${t.swatch[1]} 50%)`;
/**
 * Floating control shared by both shells. On desktop all three swatches show.
 * On phones it collapses to the current swatch so it never sits on top of content.
 */
export function ThemeSwitcher({ placement = "desktop" }) {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(placement === "desktop");
  const current = themes.find((t) => t.id === theme) ?? themes[0];
  if (!open) {
    return (
      <div className={`theme-switcher theme-switcher--${placement}`}>
        <button
          type="button"
          className="theme-switcher__toggle"
          aria-expanded="false"
          aria-label={`Colour theme: ${current.label}. Change`}
          style={{ background: swatchBg(current) }}
          onClick={() => setOpen(true)}
        />
      </div>
    );
  }
  return (
    <div
      className={`theme-switcher theme-switcher--${placement}`}
      role="radiogroup"
      aria-label="Colour theme"
    >
      <span className="theme-switcher__label" aria-hidden="true">
        {current.label}
      </span>
      {themes.map((t) => (
        <button
          key={t.id}
          type="button"
          role="radio"
          aria-checked={t.id === theme}
          aria-label={t.label}
          title={t.label}
          className="theme-switcher__swatch"
          style={{ background: swatchBg(t) }}
          onClick={() => {
            setTheme(t.id);
            if (placement === "mobile") setOpen(false);
          }}
        />
      ))}
    </div>
  );
}
