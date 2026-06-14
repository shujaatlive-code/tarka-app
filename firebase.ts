import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Read config from Vite env. Falls back to mock strings so the page doesn't crash prior to setup.
const firebaseConfig = {
  apiKey: (import.meta as any).env.VITE_FIREBASE_API_KEY || "mock-api-key",
  authDomain: (import.meta as any).env.VITE_FIREBASE_AUTH_DOMAIN || "mock-auth-domain",
  projectId: (import.meta as any).env.VITE_FIREBASE_PROJECT_ID || "tarka-app",
  storageBucket: (import.meta as any).env.VITE_FIREBASE_STORAGE_BUCKET || "tarka-app.appspot.com",
  messagingSenderId: (import.meta as any).env.VITE_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: (import.meta as any).env.VITE_FIREBASE_APP_ID || "1:123456789:web:123456"
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Auto-authenticate anonymously to assign a stable UID
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    try {
      await signInAnonymously(auth);
      console.log("Authenticated anonymously. Session UID:", auth.currentUser?.uid);
      window.dispatchEvent(new Event('authReady'));
    } catch (err) {
      console.warn("Firebase Auth failed (operating in LocalStorage mock mode):", err);
    }
  } else {
    console.log("Session active. UID:", user.uid);
    window.dispatchEvent(new Event('authReady'));
  }
});

// Helper check to verify if Firebase config credentials are set
export function isFirebaseConfigured(): boolean {
  return !!(import.meta as any).env.VITE_FIREBASE_API_KEY && (import.meta as any).env.VITE_FIREBASE_API_KEY !== "mock-api-key";
}
