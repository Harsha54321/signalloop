/* SignalLoop service worker - makes the app open and run with NO internet.
 *
 * - Pages (navigation): network-first, falling back to the cached app shell.
 * - Static files (JS/CSS/images): cache-first, saved the first time they load.
 * - API calls to the backend are never touched (the app handles those itself).
 *
 * Bump CACHE_VERSION if you ever need to force every device to drop old caches.
 */
const CACHE_VERSION = "signalloop-v1";

const CORE_FILES = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_VERSION)
      .then((cache) => cache.addAll(CORE_FILES))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

// The page tells us which files it already loaded (the hashed JS/CSS bundles)
// so they get cached on the very first visit, not only the second.
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "CACHE_URLS") {
    event.waitUntil(
      caches.open(CACHE_VERSION).then((cache) =>
        Promise.all(event.data.urls.map((url) => cache.add(url).catch(() => {})))
      )
    );
  }
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // backend API lives on another origin
  if (url.pathname.startsWith("/api")) return;

  // Opening / refreshing the app
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put("./index.html", copy));
          return response;
        })
        .catch(() => caches.match("./index.html"))
    );
    return;
  }

  // Static assets
  event.respondWith(
    caches.match(request).then(
      (cached) =>
        cached ||
        fetch(request).then((response) => {
          if (response && response.ok) {
            const copy = response.clone();
            caches.open(CACHE_VERSION).then((cache) => cache.put(request, copy));
          }
          return response;
        })
    )
  );
});
