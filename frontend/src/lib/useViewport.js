import { useSyncExternalStore } from "react";
export const DESKTOP_QUERY = "(min-width: 1024px)";
function subscribe(cb) {
  const mq = window.matchMedia(DESKTOP_QUERY);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}
/** Real device breakpoint detection. Desktop shell at >= 1024px, mobile shell below. */
export function useViewport() {
  const isDesktop = useSyncExternalStore(
    subscribe,
    () => window.matchMedia(DESKTOP_QUERY).matches,
    () => false,
  );
  return { isDesktop };
}
