// public/sw.js
const CACHE = "campfire-v2";

// Shell + manifest + icons (always cached)
const CORE_ASSETS = [
  "/",
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(CORE_ASSETS)));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
});

// Strategy:
// - Lesson JSON + MP3: cache-first (works offline)
// - Everything else: network-first, fall back to cache
self.addEventListener("fetch", (e) => {
  const url = e.request.url;

  // Cache-first for lesson content + audio
  if (url.includes("/content/") || url.endsWith(".json") || url.endsWith(".mp3")) {
    e.respondWith(
      caches.match(e.request).then((res) => {
        if (res) return res;
        return fetch(e.request).then((net) => {
          return caches.open(CACHE).then((c) => {
            c.put(e.request, net.clone());
            return net;
          });
        });
      })
    );
    return;
  }

  // Default: network-first
  e.respondWith(
    fetch(e.request).catch(() => caches.match(e.request))
  );
});