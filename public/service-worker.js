const CACHE_NAME = "shlokpatham-cache-v3"; // bump to force reload when needed
const OFFLINE_ASSETS = ["/", "/index.html", "/rudra.mp3"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(OFFLINE_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((key) => key !== CACHE_NAME && caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const requestURL = new URL(event.request.url);

  // If requesting rudra.mp3 → cache-first
  if (requestURL.pathname.endsWith("/rudra.mp3")) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) {
          // Update in background
          fetch(event.request).then((fresh) => {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, fresh);
            });
          });
          return cached; // play immediately from cache
        }
        return fetch(event.request).then((fresh) => {
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, fresh.clone()));
          return fresh;
        });
      })
    );
    return;
  }

  // For everything else: try cache first, fallback to network
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
