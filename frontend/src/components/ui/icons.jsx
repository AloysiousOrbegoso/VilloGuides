/*
  Icons: Tabler outline webfont for UI and guides, inline SVG for brand marks.
  Use <Icon name="wifi" /> rather than writing the class by hand.
*/
import logoMark from "../../assets/brand/logo-mark.svg";

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
 * The real logo mark: a charcoal rounded-square tile with the sailboat icon
 * already baked in (architecture 3.1). Because the tile is part of the image
 * itself, `tile`/`tileColor` no longer draw anything, they are kept only so
 * every existing call site (studio sidebar, dashboard top bar, coming soon
 * pages, intake welcome screen) keeps working unchanged.
 *
 * width and height are always set explicitly from `size`, not left to the
 * browser's intrinsic sizing. That omission was the cause of the logo
 * rendering oversized in the guide footer.
 */
export function BrandMark({ size = 26, className = "" }) {
  return (
    <img
      src={logoMark}
      alt=""
      width={size}
      height={size}
      className={className}
      style={{ display: "block", width: size, height: size }}
    />
  );
}

/** Serif wordmark, used only where the logo mark appears without the lockup's built-in text. */
export function Wordmark({ className = "" }) {
  return <span className={`font-serif font-medium text-black ${className}`}>Villo Guides</span>;
}