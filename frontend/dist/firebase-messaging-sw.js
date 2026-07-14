importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

// These config parameters will be overridden on the client initialization,
// but the background service worker needs a default initialization structure.
// In a production setup, these correspond to the client Firebase project values.
firebase.initializeApp({
  apiKey: "mock-api-key",
  authDomain: "mock-auth-domain",
  projectId: "mock-project-id",
  storageBucket: "mock-storage-bucket",
  messagingSenderId: "mock-sender-id",
  appId: "mock-app-id"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Background Message received:', payload);
  const notificationTitle = payload.notification?.title || 'NutriCoach Update';
  const notificationOptions = {
    body: payload.notification?.body || 'You have a new update.',
    icon: '/logo.png',
    badge: '/badge.png',
    data: payload.data
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const clickAction = event.notification.data?.click_action || '/dashboard';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Find active dashboard tab and focus/navigate it
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url.includes('/dashboard') && 'focus' in client) {
          if (client.postMessage) {
            client.postMessage({
              type: 'NAVIGATE_SECTION',
              clickAction: clickAction
            });
          }
          return client.focus();
        }
      }
      // Or open a new tab
      if (clients.openWindow) {
        return clients.openWindow(clickAction);
      }
    })
  );
});
