/* Service worker: permite jugar sin conexión.

   Estrategia "primero la red": si hay internet siempre se carga la última
   versión publicada en GitHub (y se guarda una copia); si no hay internet,
   se usa la copia guardada.

   Al añadir un juego nuevo, añade su archivo a PRECACHE. */
const CACHE = 'juegos-v5';
const PRECACHE = [
  './',
  'index.html',
  'manifest.webmanifest',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'shared/common.js',
  'shared/turns.js',
  'shared/estilo.css',
  'juegos/gestrudis.html',
  'juegos/tabu.html',
  'juegos/sound-charades.html',
  'juegos/just-one.html',
  'juegos/debates.html',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  event.respondWith(
    fetch(req)
      .then((res) => {
        // Guarda copia de lo propio y de las fuentes de Google (para Gestrudis)
        const url = new URL(req.url);
        const cacheable = url.origin === location.origin ||
          url.hostname.endsWith('fonts.googleapis.com') ||
          url.hostname.endsWith('fonts.gstatic.com');
        if (cacheable && (res.ok || res.type === 'opaque')) {
          const copy = res.clone();
          caches.open(CACHE).then((cache) => cache.put(req, copy));
        }
        return res;
      })
      .catch(() =>
        caches.match(req, { ignoreSearch: true }).then((hit) =>
          hit || (req.mode === 'navigate' ? caches.match('index.html') : Response.error())
        )
      )
  );
});
