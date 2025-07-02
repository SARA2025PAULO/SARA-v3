// Importa las funciones necesarias desde los SDK de Firebase
import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

// Tu configuración específica de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDffNaaeQSU-toOqbgZw8M6Rvye6SDBiR0",
  authDomain: "sarav3-ff879.firebaseapp.com",
  projectId: "sarav3-ff879",
  storageBucket: "sarav3-ff879.firebasestorage.app",
  messagingSenderId: "525365848502",
  appId: "1:525365848502:web:3d60024abf3728765cf917"
};

// Inicializa Firebase de forma segura (solo una instancia)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];

// Exporta instancias listas para usar en toda la aplicación
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
