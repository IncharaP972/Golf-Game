// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDcLoKKdkNlo--jyynShEHQtosZoSkxg70",
  authDomain: "golf-game-dfbc2.firebaseapp.com",
  projectId: "golf-game-dfbc2",
  storageBucket: "golf-game-dfbc2.firebasestorage.app",
  messagingSenderId: "832671217316",
  appId: "1:832671217316:web:c9a607c01aeea1e3ead831",
  measurementId: "G-RQBYM9FZB8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);

// Initialize Analytics (only in browser environment)
let analytics: any;
if (typeof window !== 'undefined') {
  analytics = getAnalytics(app);
}

export { analytics };
export default app;
