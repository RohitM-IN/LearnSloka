const CACHE_NAME = "shlokpatham-cache-v5"; // Updated cache version
const OFFLINE_ASSETS = [
  "/",
  "/index.html",
  "/offline.html",
  "/rudra/rudra.mp3",
  "/rudra/rudra.srt",
  "/purushasuktam/purushsukta.mp3",
  "/purushasuktam/purushsukta.srt",
  "/songs.json",
  "/vite.svg",
  "/favicon.ico",
  "/manifest.json",
  "/android-icon-192x192.png",
  "/apple-icon-180x180.png",
  "/favicon-32x32.png",
  "/favicon-96x96.png",
  "/favicon-16x16.png",
  "/ms-icon-144x144.png",
  "/ms-icon-150x150.png",
  "/ms-icon-310x310.png",
  "/ms-icon-70x70.png",
  "/assets/react.svg",
  "/src/index.css",
  "/src/main.tsx",
  "/src/App.tsx"
];

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

  if (requestURL.pathname.endsWith(".mp3")) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) {
          // Update in background
          fetch(event.request).then((fresh) => {
            if (fresh.ok && fresh.status === 200) {
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, fresh.clone());
              });
            }
          }).catch((err) => console.error("Failed to fetch resource in background:", err));
          return cached; // play immediately from cache
        }
        return fetch(event.request).then((fresh) => {
          if (fresh.ok && fresh.status === 200) {
            const freshClone = fresh.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, freshClone));
          }
          return fresh;
        }).catch((err) => {
          console.error("Failed to fetch resource:", err);
          return caches.match("/offline.html"); // Fallback to offline page
        });
      })
    );
    return;
  }

  if (requestURL.pathname.endsWith(".srt")) {
    event.respondWith(
      fetch(event.request).then((fresh) => {
        if (fresh.ok && fresh.status === 200) {
          return fresh;
        }
        throw new Error("Network response was not ok");
      }).catch((err) => {
        console.error("Failed to fetch resource from network:", err);
        return caches.match(event.request); // Fallback to cache if available
      })
    );
    return;
  }

  // For everything else: try cache first, fallback to network
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request).then((response) => {
      if (response.ok && response.status === 200) {
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
      }
      return response;
    }).catch((err) => {
      console.error("Failed to fetch resource:", err);
      return caches.match("/offline.html"); // Fallback to offline page
    }))
  );
});
