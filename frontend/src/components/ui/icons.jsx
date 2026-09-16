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
/**
 * Real logo, swapped in for the placeholder sailboat mark.
 * tile: draws it on a rounded square (26px nav tile, 44px sign-in tile).
 */
export function BrandMark({ size = 26, tile = false, tileColor = "var(--navy)", className = "" }) {
  const glyph = (
    <img
      src="/favicon.svg"
      alt=""
      width={tile ? Math.round(size * 0.6) : size}
      height={tile ? Math.round(size * 0.6) : size}
      style={{ display: "block", objectFit: "contain" }}
    />
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
