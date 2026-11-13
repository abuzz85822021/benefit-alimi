
const CACHE_NAME = 'benefit-alimi-v1-21';

const APP_FILES = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_FILES))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(async (keys) => {
      await Promise.all(
        keys
          .filter((key) =>
            key.startsWith('benefit-alimi-') &&
            key !== CACHE_NAME
          )
          .map((key) => caches.delete(key))
      );
      await self.clients.claim();
    })
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  if (
    event.request.method !== 'GET' ||
    url.origin !== self.location.origin
  ) return;

  event.respondWith(
    fetch(event.request)
      .catch(() => caches.match(event.request))
  );
});

// 푸시 알림 수신
self.addEventListener('push', (event) => {
  let payload = {};

  try {
    payload = event.data ? event.data.json() : {};
  } catch (error) {
    payload = {
      body: event.data ? event.data.text() : ''
    };
  }

  const title = String(
    payload.title || '혜택알리미 🔔'
  );

  const options = {
    body: String(
      payload.body || '새로운 휴가 알림이 도착했습니다.'
    ),
    icon: './icon-192.png',
    badge: './icon-192.png',
    tag: String(
      payload.tag || 'benefit-alimi-vacation'
    ),
    data: {
      url: './index.html'
    }
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// 알림을 누르면 혜택알리미 열기
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const target = new URL(
    './index.html',
    self.registration.scope
  ).href;

  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    });

    for (const client of windows) {
      if (
        new URL(client.url).origin ===
        self.location.origin
      ) {
        await client.focus();
        return;
      }
    }

    await self.clients.openWindow(target);
  })());
});
