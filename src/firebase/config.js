// src/firebase/config.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAClCBoTWCA_lpTMOo6v8AFSML6acDT8EI",
  authDomain: "vcdproyect.firebaseapp.com",
  projectId: "vcdproyect",
  storageBucket: "vcdproyect.firebasestorage.app",
  messagingSenderId: "669530962604",
  appId: "1:669530962604:web:2de5b2c74d7da4ca6a3d09",
  measurementId: "G-KQES7Q9EKT"
};

// Inicializa la app
export const app = initializeApp(firebaseConfig);

// Exporta servicios individuales
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
