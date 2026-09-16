/**
 * Registers the offline service worker (architecture 6.1, 5.5), and only
 * ever for guide and demo hostnames. Studio, dashboards, the brand page, and
 * the intake form call this too (every area shares one App.jsx), but the
 * area check below makes it a no-op everywhere except a published guide or
 * the sample guidebook.
 */
export function registerServiceWorkerIfGuide(area) {
  if (area !== "guide" && area !== "demo") return;
  if (!("serviceWorker" in navigator)) return;

  const register = () => {
    navigator.serviceWorker.register("/sw.js").catch((err) => {
      // Offline caching is a nice-to-have, never something a guide's core
      // functionality should depend on. Fails silently to the guest; logged
      // for anyone checking the console.
      console.warn("Offline caching unavailable:", err);
    });
  };

  // This runs inside a React effect, which fires after mount, by which
  // point the window's own "load" event has often already happened. An
  // addEventListener("load", ...) attached after the fact never fires, so
  // check readyState first rather than assuming the event is still coming.
  if (document.readyState === "complete") {
    register();
  } else {
    window.addEventListener("load", register, { once: true });
  }
}
