const CACHE_NAME = 'mangakos-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/style.css',
  '/app.js',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/icon-maskable-512x512.png',
  'https://code.jquery.com/jquery-3.7.1.min.js',
  'https://cdn.datatables.net/2.0.8/css/dataTables.dataTables.css',
  'https://cdn.datatables.net/responsive/3.0.2/css/responsive.dataTables.min.css',
  'https://cdn.datatables.net/2.0.8/js/dataTables.js',
  'https://cdn.datatables.net/responsive/3.0.2/js/dataTables.responsive.min.js'
];

// Evento de Instalação: Salva os arquivos no cache
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache aberto');
        return cache.addAll(urlsToCache);
      })
  );
});

// Evento de Fetch: Intercepta as requisições
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Se encontrar no cache, retorna do cache. Senão, busca na rede.
        return response || fetch(event.request);
      })
  );
});