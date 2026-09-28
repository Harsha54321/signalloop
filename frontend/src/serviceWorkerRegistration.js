// Registers the offline service worker (production builds only, so
// `npm start` during development is never affected by caching).
export function register() {
  if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;

  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register(`${process.env.PUBLIC_URL}/service-worker.js`)
      .then(() => navigator.serviceWorker.ready)
      .then((registration) => {
        // Hand the worker the files this page already loaded so the app is
        // fully available offline right after the first visit.
        const urls = performance
          .getEntriesByType("resource")
          .map((entry) => entry.name)
          .filter((u) => u.startsWith(window.location.origin) && !u.includes("/api/"));
        urls.push(window.location.href);
        if (registration.active) {
          registration.active.postMessage({ type: "CACHE_URLS", urls });
        }
      })
      .catch(() => {
        /* offline support is a bonus - never break the app if it fails */
      });
  });
}
