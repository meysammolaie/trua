
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// مقادیر نمونه برای جلوگیری از خطا در محیط توسعه
// لطفاً این مقادیر را با پیکربندی واقعی پروژه Firebase خود جایگزین کنید.
const firebaseConfig = {
  "projectId": "verdant-vault-7k4w3",
  "appId": "1:983159235723:web:3e19f9d3265da955d1a08e",
  "storageBucket": "verdant-vault-7k4w3.appspot.com",
  "apiKey": "AIzaSyAy3Bv1uVw3t6av9JW2z60R4NOkgDV9nLg",
  "authDomain": "verdant-vault-7k4w3.firebaseapp.com",
  "messagingSenderId": "983159235723"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);

export { app, auth };
