import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  browserLocalPersistence, 
  setPersistence 
} from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';

// Firebase configuration using Vite env vars with user-provided project fallbacks
export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCKtBVG_eXJMeCyWTMQT89YsGQeD8hY1Y4",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "new-exact-pay-project.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "new-exact-pay-project",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "new-exact-pay-project.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "80566128214",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:80566128214:web:e75f1cda4e32b25c8375f7"
};

// Initialize Firebase app singleton
export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Auth with local browser persistence
export const auth = getAuth(app);
setPersistence(auth, browserLocalPersistence).catch((err) => {
  console.warn('Could not set Firebase auth persistence:', err);
});

// Auth Providers
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Initialize Firestore
export const db = getFirestore(app);

// Verify Firestore connectivity safely in the background
export async function testFirestoreConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn("Firestore client offline or database pending provisioning.");
    }
  }
}
