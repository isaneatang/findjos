const CACHE_NAME = "findjos-shell-v1";

self.addEventListener("install", (event) => {
  // Activates the worker immediately so the demo can begin caching on first visit.
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  // Takes control of open pages without requiring a second reload.
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  // Uses network-first behavior so listings stay fresh when a connection exists.
  if (event.request.method === "GET") {
    event.respondWith(fetch(event.request).catch(() => caches.match(event.request)));
  }
});
