const CACHE_NAME = "shlokpatham-cache-v8"; // Incremented cache version
const MP3_ASSETS = [
  "/rudra/rudra.mp3",
  "/purushasuktam/purushsukta.mp3"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(MP3_ASSETS))
  );
  self.skipWaiting(); // Force the waiting service worker to become active
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log(`Deleting old cache: ${key}`);
            return caches.delete(key);
          }
        })
      )
    )
  );
  self.clients.claim(); // Take control of all clients immediately
});

self.addEventListener("fetch", (event) => {
  const requestURL = new URL(event.request.url);

  if (requestURL.pathname.endsWith(".mp3")) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) {
          // Update in background
          fetch(event.request)
            .then((fresh) => {
              if (fresh.ok && fresh.status === 200) {
                caches.open(CACHE_NAME).then((cache) => {
                  cache.put(event.request, fresh.clone());
                });
              }
            })
            .catch((err) =>
              console.error("Failed to fetch resource in background:", err)
            );
          return cached; // Play immediately from cache
        }
        return fetch(event.request)
          .then((fresh) => {
            if (fresh.ok && fresh.status === 200) {
              const freshClone = fresh.clone();
              caches.open(CACHE_NAME).then((cache) =>
                cache.put(event.request, freshClone)
              );
            }
            return fresh;
          })
          .catch((err) => {
            console.error("Failed to fetch resource:", err);
            return new Response("", { status: 404, statusText: "Not Found" }); // Return 404 for failed fetch
          });
      })
    );
  }
});
