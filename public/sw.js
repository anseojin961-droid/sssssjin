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
  const { title, body } = payload.notification;
  self.registration.showNotification(title, {
    body,
    icon: '/logo.png',
    badge: '/logo.png'
  });
});