# Design system

The standardised rules behind every screen. Tokens live in `frontend/src/index.css`; components live in `frontend/src/components/ui`.

## Principles

1. Quiet, dense, functional internal tools. No card clutter, no decorative colour coding.
2. Maroon appears only where an action matters, the way the logo uses it only for the flag.
3. Studio uses a sidebar because it is used daily and has many sections. The client dashboard uses a top bar because it is used occasionally and has few.
4. Large tap targets and plain sentence-case copy. Buttons say exactly what happens.
5. No all-caps labels, no arrow-suffixed buttons, no numbered markers unless the content is a real sequence.

## Colour

The fixed brand palette comes from the logo and never changes: charcoal `#1E1E1E`, navy `#032747`, maroon `#830000`, off-white `#E5E5EA`, light grey `#D9D9D9`.

Everything else is a token that swaps between light and dark through `data-theme` on `<html>`. Use the Tailwind names, not raw hex.

| Token | Tailwind | Light | Dark | Used for |
|---|---|---|---|---|
| `--bg` | `canvas` | `#F4F4F2` | `#141414` | Page background |
| `--sidebar` | `sidebar` | `#1E1E1E` | `#101112` | Studio sidebar, dashboard top bar |
| `--card` | `card` | `#FFFFFF` | `#1D1D1D` | Panels, tables, dialogs |
| `--border` | `line` | `#E2E2DF` | `#2C2C2C` | Outlines |
| `--border-soft` | `line-soft` | `#EDEDEB` | `#252525` | Row dividers |
| `--text` | `ink` | `#1E1E1E` | `#E5E5EA` | Body text |
| `--muted` | `muted` | `#6B6B68` | `#9A9A97` | Secondary text |
| `--faint` | `faint` | `#A3A3A0` | `#6A6A67` | Placeholders, disabled |
| `--navy` | `navy` | `#032747` | `#1C5A86` | Selected states, structural accents |
| `--navy-soft` | `navy-soft` | `#E8ECF0` | `#1A2530` | Selected backgrounds |
| `--accent` | `accent` | `#830000` | `#B33A3A` | Primary actions only |
| `--field` | `field` | `#FAFAF9` | `#232323` | Input backgrounds |
| `--pill` | `pill` | `#F7E9E9` | `#3A2323` | Status pills needing attention |
| `--ok` | `ok` | `#2F5D46` | `#7DB396` | Confirmations |
| `--warn-bg` | `warn-bg` | `#FBF3E4` | `#29241A` | The door-code warning |

Navy and maroon are lightened in dark mode because the originals disappear against a dark canvas.

Dark mode is a user preference with a toggle in the studio and dashboard header, defaulting to the system setting. Public pages, the intake form, and guides are always light: guests and property owners have no settings to change. `index.html` applies the saved choice before first paint so there is no flash.

## Type

| Typeface | Use |
|---|---|
| EB Garamond | Brand moments: wordmark, marketing headlines, page titles on public pages, guide headings |
| Open Sans | Everything else: studio and dashboard UI, body text, buttons, tables, forms |

Studio and dashboard UI use Open Sans only, so the two never compete. EB Garamond is set at 500 or 600 weight, never 700, because the heavier weight is synthesised and looks muddy.

| Class | Size | Use |
|---|---|---|
| `text-xs` | 12px | Column headers, metadata |
| `text-sm` | 13px | Secondary text, hints |
| `text-base` | 14px | Default UI text |
| `text-md` | 15px | Emphasised body, intake labels |
| `text-lg` | 16px | Intake and public body. 16px stops phones zooming on focus |
| `text-xl` | 18px | Block headings, panel titles |
| `text-2xl` | 26px | Screen titles |
| `text-3xl` | 34px | Intake step titles |
| `text-4xl` | 44px | Public page headlines |
| `text-5xl` | 64px | Hero |

## Controls

Two sizes. `md` at 40px for the studio and dashboard, where rows are dense and the mouse is precise. `lg` at 52px for the intake form and public pages, which are filled in on phones.

- `Button` variants: `primary` (maroon, one per screen), `secondary`, `ghost`, `danger`, `link`.
- `IconButton` always needs a `label`; it becomes both the accessible name and the tooltip.
- `Field` wraps a label, hint, and error around any control. `Input`, `Textarea` (grows with its content), `Select`, `Checkbox`, `Segmented`, `SearchInput`.
- `Dialog` centres by default, or becomes a right drawer with `side="right"` for longer forms.
- `Table` is one quiet surface: hairline rows, muted header, no zebra stripes. It scrolls sideways below 640px rather than squashing.
- `Pill` carries status. Only states that need action use the accent tone.
- `Toast` handles short confirmations such as "Link copied". One at a time.

## Spacing

Screen padding is 32px in the studio, 24px in the dashboard, and 20px on phones. Panels use 24px inside. Related fields sit 12px apart, groups 20px, sections 28px or more. The editor column is capped at 640px so lines stay readable.

## Icons

Tabler outline webfont, through `<Icon name="wifi" />`. Brand marks are inline SVG in `ui/icons.jsx`. `BrandMark` is a placeholder: when the final logo files arrive, only that component's contents change, because every caller already passes a fixed size.

The Kitchen section uses `tools-kitchen-2`. It is set once as `KITCHEN_ICON` in `lib/guideSchema.js`, so changing it updates every guide, the editor, and the brand page together.

## Guides are separate

Published guides carry the property's own palette and its Daytime, Golden Hour, and Reef themes, not the VilloGuides palette. Those styles live in `guide.css`, entirely scoped under `.guide`, with theme variables set on `.guide[data-guide-theme]`. Nothing in this design system leaks into a guide, and nothing in a guide leaks out.

## Writing

Sentence case everywhere. Buttons name the action: "Mark as paid", not "Submit". Errors say what to do next. No em-dashes and no emojis, in the interface or in code comments.
