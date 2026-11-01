/* Only public offline-help assets enter this cache. Private pages and API responses never do. */
const CACHE = "dukaan-dost-public-shell-v1";
const ASSETS = ["/offline.html", "/icons/icon-192.png", "/icons/icon-512.png", "/icons/icon-maskable-512.png"];
self.addEventListener("install", (event) => { event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting())); });
self.addEventListener("activate", (event) => { event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key.startsWith("dukaan-dost-public-shell-") && key !== CACHE).map((key) => caches.delete(key)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== self.location.origin || url.pathname.startsWith("/api/") || req.headers.has("rsc")) return;
  if (ASSETS.includes(url.pathname) && !url.search) {
    event.respondWith(caches.match(req).then((cached) => cached || fetch(req))); return;
  }
  if (req.mode === "navigate") {
    // Network first, never cache authenticated documents or a ledger snapshot.
    event.respondWith(fetch(req).catch(() => caches.match("/offline.html")));
  }
});
