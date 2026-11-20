const offlineCache = "mirror-magic-offline-v1";
const offlinePage = "/offline.html";
self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(offlineCache);
      await cache.addAll([offlinePage, "/app-icon-192.png"]);
      await self.skipWaiting();
    })(),
  );
});
self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter(
            (k) => k.startsWith("mirror-magic-offline-") && k !== offlineCache,
          )
          .map((k) => caches.delete(k)),
      );
      await self.clients.claim();
    })(),
  );
});
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== "GET" || url.origin !== self.location.origin)
    return;
  if (event.request.mode === "navigate") {
    if (
      url.pathname === "/" ||
      url.pathname === "/bookings" ||
      url.pathname === "/staff" ||
      url.pathname === "/api-docs"
    ) {
      event.respondWith(
        fetch(event.request).catch(
          async () => (await caches.match(offlinePage)) || Response.error(),
        ),
      );
    }
  } else if (url.pathname === "/app-icon-192.png") {
    event.respondWith(
      caches.match(event.request).then((hit) => hit || fetch(event.request)),
    );
  }
});
