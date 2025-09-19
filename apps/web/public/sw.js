const CACHE_NAME = "roughrefine-cache-v1";
const PRECACHE_URLS = [
  "/",
  "/index.html",
  "/manifest.webmanifest",
  "/icons/app-icon.svg",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS)).then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") {
    return;
  }

  const url = new URL(request.url);

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put("/index.html", copy));
          return response;
        })
        .catch(async () => (await caches.match("/index.html")) ?? Response.error()),
    );
    return;
  }

  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        const networkFetch = fetch(request)
          .then((response) => {
            if (!response || response.status !== 200 || response.type !== "basic") {
              return response;
            }
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
            return response;
          })
          .catch(() => cachedResponse);

        return cachedResponse ?? networkFetch;
      }),
    );
  }
});
