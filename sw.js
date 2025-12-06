
const CACHE_NAME = 'dlive-cache-v2';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  'https://cdn.tailwindcss.com',
  'https://aistudiocdn.com/react-dom@^19.2.1/',
  'https://aistudiocdn.com/react@^19.2.1/',
  'https://cdn-icons-png.flaticon.com/512/3047/3047928.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Caching all: app shell and content');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // For API calls or external dynamic content (if any), we might want Network First.
  // For static assets and app shell, we want Cache First.
  
  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        // Return cached hit
        return response;
      }
      
      // Clone the request because it's a stream
      const fetchRequest = event.request.clone();

      return fetch(fetchRequest).then((response) => {
        // Check if we received a valid response
        if (!response || response.status !== 200 || response.type !== 'basic' && response.type !== 'cors') {
          return response;
        }

        // Clone the response because it's a stream
        const responseToCache = response.clone();

        caches.open(CACHE_NAME).then((cache) => {
          // Cache new requests dynamically
          if (event.request.method === 'GET') {
             cache.put(event.request, responseToCache);
          }
        });

        return response;
      }).catch(() => {
        // Fallback logic could go here
        console.log('Offline: Could not fetch resource');
      });
    })
  );
});