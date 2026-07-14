import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "mock-api-key",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "mock-auth-domain",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "mock-project-id",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "mock-storage-bucket",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "mock-sender-id",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "mock-app-id"
};

let app;
let messaging: any = null;

try {
  if (import.meta.env.VITE_FIREBASE_API_KEY) {
    app = initializeApp(firebaseConfig);
    messaging = getMessaging(app);
  }
} catch (error) {
  console.warn('Firebase client failed to initialize. Web push notifications will not be active.', error);
}

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY || "";

/**
 * Request notification permissions and register token.
 */
export const requestPushPermission = async (
  onTokenSuccess: (token: string) => Promise<any>
): Promise<string | null> => {
  if (!messaging) {
    console.warn('FCM messaging is not initialized.');
    return null;
  }

  // Check if browser supports Service Workers and Notifications
  if (!('serviceWorker' in navigator) || !('Notification' in window)) {
    console.warn('Push notifications are not supported in this browser.');
    return null;
  }

  // Do not prompt if denied previously
  if (Notification.permission === 'denied') {
    console.log('Notification permission has been previously denied by user.');
    return null;
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      const token = await getToken(messaging, {
        vapidKey: VAPID_KEY,
      });
      if (token) {
        await onTokenSuccess(token);
        console.log('FCM Device Token registered:', token);
        return token;
      } else {
        console.warn('No FCM token obtained. Check VAPID key configurations.');
      }
    } else {
      console.log('Notification permission denied by user.');
    }
  } catch (error) {
    console.error('An error occurred while requesting notification permission:', error);
  }
  return null;
};

/**
 * Registers an onMessage callback for foreground messages.
 */
export const listenForForegroundMessages = (
  onNotificationReceived: (payload: any) => void
) => {
  if (!messaging) return () => {};
  return onMessage(messaging, (payload) => {
    console.log('Foreground message received:', payload);
    onNotificationReceived(payload);
  });
};
