self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(clients.claim()));
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.open('pht-cache').then(cache =>
      cache.match(event.request).then(resp => {
        return resp || fetch(event.request).then(networkResp => {
          cache.put(event.request, networkResp.clone());
          return networkResp;
        }).catch(() => resp)
      })
    )
  );
});
// TODO: queue POST /kiosk/check when offline and replay on reconnect.
