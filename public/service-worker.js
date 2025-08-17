const CACHE_NAME = "shlokpatham-cache-v10"; // Updated cache version
const MP3_ASSETS = [
  "/rudra/rudra.mp3",
  "/purushasuktam/purushsukta.mp3"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(MP3_ASSETS);
    })
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

  if (MP3_ASSETS.includes(requestURL.pathname)) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) {
          return cached; // Serve from cache
        }
        return fetch(event.request).catch((err) => {
          console.error("Failed to fetch resource:", err);
          return new Response("", { status: 404, statusText: "Not Found" }); // Return 404 for failed fetch
        });
      })
    );
  }
});
