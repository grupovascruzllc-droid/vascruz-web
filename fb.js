// Conexión con Firebase (usuarios y precios privados de Vascruz).
// Estos datos de conexión son públicos por diseño: la protección la dan las reglas de seguridad de la base de datos.
import { initializeApp, deleteApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {
  getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword,
  sendEmailVerification, sendPasswordResetEmail, signOut
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import {
  getFirestore, doc, getDoc, setDoc, updateDoc, addDoc, collection, query, where, orderBy, limit,
  getDocs, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

const CONFIG = {
  apiKey: "AIzaSyCd7ccK2wu2x8Iw_1bCU-PG5adlvBAlaFM",
  authDomain: "vascruz-web.firebaseapp.com",
  projectId: "vascruz-web",
  storageBucket: "vascruz-web.firebasestorage.app",
  messagingSenderId: "100359411607",
  appId: "1:100359411607:web:1e8394de63d267fabe56d2"
};
const app = initializeApp(CONFIG);

// El administrador crea la cuenta de un asesor o socio sin cerrar su propia sesión:
// se usa una conexión aparte solo para crear el usuario y luego se cierra.
export async function crearCuenta(email, pass) {
  const tmp = initializeApp(CONFIG, "crear-" + Date.now());
  try {
    const a = getAuth(tmp);
    const cred = await createUserWithEmailAndPassword(a, email, pass);
    const uid = cred.user.uid;
    await signOut(a);
    return uid;
  } finally {
    await deleteApp(tmp);
  }
}

export const auth = getAuth(app);
auth.languageCode = "es";
export const db = getFirestore(app);
export {
  onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendEmailVerification,
  sendPasswordResetEmail, signOut, doc, getDoc, setDoc, updateDoc, addDoc, collection, query, where, orderBy,
  limit, getDocs, serverTimestamp
};

export function usd(n) {
  return n === null || n === undefined || isNaN(n) ? "—" : "USD " + String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}
export function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
export function nombreAuto(m) {
  return [m.marca, m.modelo, m.version].filter(Boolean).join(" ") + (m.anio ? " (" + m.anio + ")" : "");
}
// Mensajes de error de Firebase en español
export function errorEs(e) {
  const c = (e && e.code) || "";
  const t = {
    "auth/invalid-email": "El correo no es válido.",
    "auth/missing-password": "Escriba su contraseña.",
    "auth/weak-password": "La contraseña debe tener al menos 6 caracteres.",
    "auth/email-already-in-use": "Ese correo ya está registrado. Use \"Ingresar\" o \"Olvidé mi contraseña\".",
    "auth/invalid-credential": "Correo o contraseña incorrectos.",
    "auth/wrong-password": "Correo o contraseña incorrectos.",
    "auth/user-not-found": "No hay una cuenta con ese correo.",
    "auth/too-many-requests": "Demasiados intentos. Espere unos minutos e intente de nuevo.",
    "auth/network-request-failed": "Sin conexión a internet. Revise su conexión.",
    "permission-denied": "No tiene permiso para ver esta información."
  };
  return t[c] || (e && e.message) || "Ocurrió un error. Intente de nuevo.";
}
