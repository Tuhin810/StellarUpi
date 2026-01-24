
// Give the service worker access to Firebase Messaging.
// Note: These scripts must be accessible from the browser.
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker by passing in
// your app's Firebase config object.
// https://firebase.google.com/docs/web/setup#config-object
firebase.initializeApp({
  apiKey: "AIzaSyB6NqT-rmIITVZjAFZsZbD9rRGFGT_dDmA",
  authDomain: "kreativteam-be7fd.firebaseapp.com",
  projectId: "kreativteam-be7fd",
  storageBucket: "kreativteam-be7fd.firebasestorage.app",
  messagingSenderId: "833645792634",
  appId: "1:833645792634:web:83584ed61e9d4447611ac3"
});

// Retrieve an instance of Firebase Messaging so that it can handle background
// messages.
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  // Customize notification here
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    data: payload.data
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
