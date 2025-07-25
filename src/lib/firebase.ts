
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// مقادیر نمونه برای جلوگیری از خطا در محیط توسعه
// لطفاً این مقادیر را با پیکربندی واقعی پروژه Firebase خود جایگزین کنید.
const firebaseConfig = {
  apiKey: "AIzaSyA_...SAMPLE...", // نمونه کلید API
  authDomain: "project.firebaseapp.com",
  projectId: "project-id",
  storageBucket: "project.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abcdef1234567890"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);

export { app, auth };
