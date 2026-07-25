/**
 * App-shell service worker.
 *
 * Strategy:
 *  - Navigations (the page itself): network-first with cache fallback, so a
 *    deploy is picked up on the next online visit but the app still opens
 *    with no signal.
 *  - Hashed build assets (./assets/*): cache-first — the hash in the filename
 *    makes them immutable.
 *  - Everything else (icons, manifest): stale-while-revalidate.
 *
 * Game data is NOT handled here: the app streams it from the GitHub API with
 * its own Cache API layer (ww-blobs-v1), and those requests carry auth.
 */
const SHELL = 'ww-shell-v1';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(SHELL)
      .then((c) => c.addAll(['./']))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('ww-shell-') && k !== SHELL).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // never intercept cross-origin (GitHub API/game data) requests
  if (url.origin !== self.location.origin) return;

  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          void caches.open(SHELL).then((c) => c.put('./', copy));
          return res;
        })
        .catch(() => caches.match('./').then((hit) => hit ?? Response.error())),
    );
    return;
  }

  if (url.pathname.includes('/assets/')) {
    event.respondWith(
      caches.match(req).then(
        (hit) =>
          hit ??
          fetch(req).then((res) => {
            const copy = res.clone();
            void caches.open(SHELL).then((c) => c.put(req, copy));
            return res;
          }),
      ),
    );
    return;
  }

  event.respondWith(
    caches.match(req).then((hit) => {
      const refresh = fetch(req)
        .then((res) => {
          const copy = res.clone();
          void caches.open(SHELL).then((c) => c.put(req, copy));
          return res;
        })
        .catch(() => hit ?? Response.error());
      return hit ?? refresh;
    }),
  );
});
