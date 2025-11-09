// Mude este número a cada nova atualização para forçar a atualização do cache.
const CACHE_NAME = 'mangakos-cache-v2'; 
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
    caches.open(CACHE_NAME).then(cache => {
      console.log('Cache aberto e arquivos sendo salvos.');
      return cache.addAll(urlsToCache);
    }).then(() => {
      // Força o novo Service Worker a se tornar ativo imediatamente.
      return self.skipWaiting();
    })
  );
});

// Evento de Ativação: Limpa caches antigos
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          // Se o nome do cache não for o atual, ele será deletado.
          if (cacheName !== CACHE_NAME) {
            console.log('Deletando cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Garante que o Service Worker ativado tome controle da página imediatamente.
      return self.clients.claim();
    })
  );
});

// Evento de Fetch: Intercepta as requisições
self.addEventListener('fetch', event => {
  event.respondWith(
    // Tenta encontrar o recurso no cache primeiro.
    caches.match(event.request).then(response => response || fetch(event.request))
  );
});