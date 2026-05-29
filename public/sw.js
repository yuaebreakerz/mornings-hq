// Service Worker for Mornings HQ
const CACHE_NAME = 'mornings-hq-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/logo.png',
  '/logo_app.jpg',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS).catch(err => console.log('Caching assets error:', err));
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
});

self.addEventListener('fetch', (event) => {
  // Let network requests with API calls pass through without caching
  if (event.request.url.includes('/exec') || event.request.url.includes('google')) {
    return;
  }
  
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      return cachedResponse || fetch(event.request);
    })
  );
});

// Listen for notifications
self.addEventListener('push', (event) => {
  let data = { title: 'Mornings HQ', body: 'Ada aktivitas baru di sistem Anda!' };
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { title: 'Mornings HQ', body: event.data.text() };
    }
  }

  const options = {
    body: data.body,
    icon: '/notification_icon.png',
    badge: '/notification_badge.png',
    vibrate: [100, 50, 100],
    data: {
      primaryKey: 1
    }
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});
