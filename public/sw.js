const CACHE_NAME = 'stellarpay-v3';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/icon-192.png',
  '/icon-512.png',
  'https://cdn.tailwindcss.com'
];

// 1. Firebase Messaging Integration (Compat mode for Service Worker)
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyB6NqT-rmIITVZjAFZsZbD9rRGFGT_dDmA",
  authDomain: "kreativteam-be7fd.firebaseapp.com",
  projectId: "kreativteam-be7fd",
  storageBucket: "kreativteam-be7fd.firebasestorage.app",
  messagingSenderId: "833645792634",
  appId: "1:833645792634:web:83584ed61e9d4447611ac3"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[sw.js] Background message received ', payload);
  const notificationTitle = payload.notification.title || "StellarPay Notification";
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    data: payload.data
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// 2. Standard PWA Events
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      clients.claim(),
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.filter(name => name !== CACHE_NAME).map(name => caches.delete(name))
        );
      })
    ])
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request)
      .catch(() => {
        return caches.match(event.request);
      })
  );
});
