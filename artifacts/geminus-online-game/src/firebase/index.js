import { initializeApp } from "firebase/app";
import { getAuth, browserSessionPersistence, setPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyByD5GQpTz5QglcAwp4oqwSQJBkbFK6cKs",
  authDomain: "geminus-c901b.firebaseapp.com",
  projectId: "geminus-c901b",
  storageBucket: "geminus-c901b.firebasestorage.app",
  messagingSenderId: "382594725291",
  appId: "1:382594725291:web:d061f4113e09ecbf838eee",
  measurementId: "G-J6B6ZFP3DN"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Fix iOS Safari: Firebase defaults to IndexedDB which Safari blocks.
// browserSessionPersistence uses sessionStorage instead — works on all browsers.
setPersistence(auth, browserSessionPersistence).catch(() => {});
