/**
 * Guide color themes, ported from the Casa de Vista demo. Three moods of the same
 * property. Token roles are stable across themes; only the values change, so
 * components never need to know which theme is active.
 */
export const themes = [
  {
    id: "daytime",
    label: "Daytime",
    swatch: ["#F7F2EA", "#3E7C7B"],
    tokens: {
      bg: "#F7F2EA",
      surface: "#FFFFFF",
      surfaceSunk: "#EFE8DC",
      heading: "#1F3B3A",
      ink: "#2B2B26",
      muted: "#66665B",
      line: "#E2D9CA",
      accent: "#3E7C7B",
      accentInk: "#FFFFFF",
      urgent: "#C4622D",
      urgentSoft: "#F6E1D3",
      highlight: "#3E7C7B",
    },
  },
  {
    id: "golden-hour",
    label: "Golden Hour",
    swatch: ["#F2E3D0", "#D9A441"],
    tokens: {
      bg: "#F2E3D0",
      surface: "#FBF4EA",
      surfaceSunk: "#EAD6BD",
      heading: "#2E3230",
      ink: "#2F2A22",
      muted: "#6E6150",
      line: "#E0CBAF",
      accent: "#3F6F66",
      accentInk: "#FFFFFF",
      urgent: "#A94E1F",
      urgentSoft: "#F1D2BC",
      highlight: "#D9A441",
    },
  },
  {
    id: "reef",
    label: "Reef",
    swatch: ["#DCE8E5", "#C9A97A"],
    tokens: {
      bg: "#DCE8E5",
      surface: "#F5F9F7",
      surfaceSunk: "#CCDDD9",
      heading: "#123332",
      ink: "#1E2B2A",
      muted: "#4F6361",
      line: "#C2D6D2",
      accent: "#2B6867",
      accentInk: "#FFFFFF",
      urgent: "#B4552A",
      urgentSoft: "#F0DACB",
      highlight: "#B48E57",
    },
  },
];
export const toVar = (key) => `--${key.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}`;

/** Builds the `.guide[data-guide-theme="..."] { --bg: ...; }` rules injected once at startup. */
export function themeCss() {
  return themes
    .map((t) => {
      const body = Object.entries(t.tokens)
        .map(([k, v]) => `  ${toVar(k)}: ${v};`)
        .join("\n");
      const sel = `.guide[data-guide-theme="${t.id}"]`;
      // "custom" starts from Daytime; the property's colors are applied inline on top.
      return t.id === "daytime" ? `${sel},\n.guide[data-guide-theme="custom"] {\n${body}\n}` : `${sel} {\n${body}\n}`;
    })
    .join("\n");
}

/** The few colors the studio lets you set for a custom theme. */
export const CUSTOM_COLOR_KEYS = [
  { key: "bg", label: "Background" },
  { key: "surface", label: "Tiles and cards" },
  { key: "heading", label: "Headings" },
  { key: "accent", label: "Icons and links" },
  { key: "urgent", label: "Emergency and main buttons" },
];

/** Inline CSS variables for a custom theme. */
export function customThemeStyle(theme) {
  if (!theme || theme.preset !== "custom") return undefined;
  const style = {};
  for (const [k, v] of Object.entries(theme.colors || {})) {
    if (/^#[0-9a-f]{3,8}$/i.test(v)) style[toVar(k)] = v;
  }
  return style;
}

export const themeById = (id) => themes.find((t) => t.id === id) ?? themes[0];
