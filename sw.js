const CACHE_NAME = 'handwerker-hub-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  'https://cdn.tailwindcss.com',
  'https://cdnjs.cloudflare.com/ajax/libs/react/18.2.0/umd/react.production.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.2.0/umd/react-dom.production.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/babel-standalone/7.22.5/babel.min.js',
  'https://unpkg.com/lucide@latest/dist/umd/lucide.js'
];

// Installation des Service Workers
self.addEventListener('install', function(event) {
  console.log('Service Worker installiert');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('Cache geöffnet');
        return cache.addAll(urlsToCache);
      })
  );
});

// Aktivierung des Service Workers
self.addEventListener('activate', function(event) {
  console.log('Service Worker aktiviert');
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheName !== CACHE_NAME) {
            console.log('Alter Cache gelöscht:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch Event - Cache-First Strategie
self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        // Cache hit - return response
        if (response) {
          return response;
        }

        // Clone the request
        var fetchRequest = event.request.clone();

        return fetch(fetchRequest).then(
          function(response) {
            // Check if we received a valid response
            if(!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone the response
            var responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then(function(cache) {
                cache.put(event.request, responseToCache);
              });

            return response;
          }
        ).catch(function() {
          // Fallback für offline
          if (event.request.destination === 'document') {
            return caches.match('/index.html');
          }
        });
      }
      )
  );
});

// Background Sync für Offline-Buchungen (erweiterte Funktionalität)
self.addEventListener('sync', function(event) {
  if (event.tag === 'background-sync') {
    console.log('Background Sync ausgeführt');
    event.waitUntil(
      // Hier könnten Offline-Buchungen synchronisiert werden
      Promise.resolve()
    );
  }
});

// Push Notifications (erweiterte Funktionalität)
self.addEventListener('push', function(event) {
  const options = {
    body: event.data ? event.data.text() : 'HandwerkerHub Benachrichtigung',
    icon: 'https://via.placeholder.com/192x192/2563eb/ffffff?text=HH',
    badge: 'https://via.placeholder.com/72x72/2563eb/ffffff?text=HH',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: '1'
    },
    actions: [
      {
        action: 'explore',
        title: 'App öffnen',
        icon: 'https://via.placeholder.com/128x128/2563eb/ffffff?text=HH'
      },
      {
        action: 'close',
        title: 'Schließen'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('HandwerkerHub', options)
  );
});

// Notification Click Handler
self.addEventListener('notificationclick', function(event) {
  console.log('Notification click Received.');

  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});
