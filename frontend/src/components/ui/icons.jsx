/*
  Icons: Tabler outline webfont for UI and guides, inline SVG for brand marks.
  Use <Icon name="wifi" /> rather than writing the class by hand.
*/

export function Icon({ name, className = "", label }) {
  return (
    <i
      className={`ti ti-${name} ${className}`}
      aria-hidden={label ? undefined : "true"}
      aria-label={label}
      role={label ? "img" : undefined}
    />
  );
}

/**
 * Placeholder brand mark. The final logo files replace this component's contents only:
 * every caller passes a fixed size, so the swap is a file replacement (architecture 3.1).
 * tile: draws the mark on a rounded square (26px nav tile, 44px sign-in tile).
 */
export function BrandMark({ size = 26, tile = false, tileColor = "var(--navy)", className = "" }) {
  const glyph = (
    <svg width={tile ? Math.round(size * 0.54) : size} height={tile ? Math.round(size * 0.54) : size} viewBox="0 0 132 132" fill="none" aria-hidden="true">
      <rect x="34" y="18" width="64" height="96" rx="4" stroke={tile ? "#E5E5EA" : "currentColor"} strokeWidth="10" />
      <circle cx="76" cy="66" r="10" fill="#B33A3A" />
    </svg>
  );
  if (!tile) return <span className={`inline-flex ${className}`}>{glyph}</span>;
  return (
    <span
      className={`inline-grid place-items-center shrink-0 ${className}`}
      style={{ width: size, height: size, borderRadius: Math.round(size * 0.24), background: tileColor }}
    >
      {glyph}
    </span>
  );
}

/** Serif wordmark used on public pages. */
export function Wordmark({ className = "" }) {
  return <span className={`font-serif font-medium text-black ${className}`}>Villo Guides</span>;
}
