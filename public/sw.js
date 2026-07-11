importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyDp8-HY4YxpR3hHWeDLEtyA3AV78siWyvo",
  authDomain: "dnfl-bdc76.firebaseapp.com",
  projectId: "dnfl-bdc76",
  storageBucket: "dnfl-bdc76.firebasestorage.app",
  messagingSenderId: "118876262664",
  appId: "1:118876262664:web:c92b7f408f168f6df69cbd"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const notification = payload.notification || {};
  const data = payload.data || {};
  const title = notification.title || data.title || '새 알림';
  const body = notification.body || data.body || '';
  self.registration.showNotification(title, {
    body,
    icon: '/logo.png',
    badge: '/logo.png',
    data: {
      url: data.url || '/'
    }
  });
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(targetUrl);
      return undefined;
    })
  );
});
