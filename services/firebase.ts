import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics } from 'firebase/analytics';
import { getMessaging } from 'firebase/messaging';

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyB6NqT-rmIITVZjAFZsZbD9rRGFGT_dDmA",
  authDomain: "kreativteam-be7fd.firebaseapp.com",
  projectId: "kreativteam-be7fd",
  storageBucket: "kreativteam-be7fd.firebasestorage.app",
  messagingSenderId: "833645792634",
  appId: "1:833645792634:web:83584ed61e9d4447611ac3",
  measurementId: "G-M0YJ6963MG"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const messaging = typeof window !== 'undefined' ? getMessaging(app) : null;
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;
