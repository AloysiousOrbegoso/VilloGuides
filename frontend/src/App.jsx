/**
 * Resolves which area to render from the hostname (production) or the path
 * prefix (development): brand, studio, dashboard, forms, guide, or demo.
 * See lib/hostname.js and architecture sections 4 and 14.1.
 *
 * TODO (Phase 1): route to each area's top-level component, code-split with
 * React.lazy so a guest loading a guide never downloads the studio bundle.
 */
export default function App() {
  return null;
}
