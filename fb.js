// Conexión con Firebase (usuarios y precios privados de Vascruz).
// Estos datos de conexión son públicos por diseño: la protección la dan las reglas de seguridad de la base de datos.
import { initializeApp, deleteApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {
  getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword,
  sendEmailVerification, sendPasswordResetEmail, signOut, updatePassword, EmailAuthProvider, reauthenticateWithCredential
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import {
  getFirestore, doc, getDoc, setDoc, updateDoc, addDoc, collection, query, where, orderBy, limit,
  getDocs, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore-lite.js";
// Versión liviana de Firestore (119 KB en lugar de 440 KB): carga más rápido en el celular y no se cuelga con mala señal.

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
  sendPasswordResetEmail, signOut, updatePassword, EmailAuthProvider, reauthenticateWithCredential, doc, getDoc, setDoc, updateDoc, addDoc, collection, query, where, orderBy,
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
// Número para WhatsApp: solo dígitos y, si es un celular de Bolivia de 8 cifras, se le agrega el código 591.
export function telWa(t) {
  const d = String(t || "").replace(/[^\d]/g, "");
  return d.length === 8 ? "591" + d : d;
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

// ---------- Clientes que entran con su número de celular ----------
// Firebase necesita un correo; para los clientes se arma uno interno a partir del celular
// (ej.: 70012345 → 59170012345@cliente.vascruz.com). El cliente nunca lo ve: escribe solo su celular.
export const DOMINIO_CLIENTE = "cliente.vascruz.com";
export function usuarioAEmail(u) {
  const s = String(u || "").trim().toLowerCase();
  if (s.includes("@")) return s;
  const d = telWa(s);
  return d.length >= 7 ? d + "@" + DOMINIO_CLIENTE : s;
}
export function esUsuarioCelular(email) { return String(email || "").toLowerCase().endsWith("@" + DOMINIO_CLIENTE); }
// Lo que se le muestra a la persona como "usuario": su celular, o su correo si es asesor o socio
export function usuarioVisible(email) {
  if (!esUsuarioCelular(email)) return email || "";
  const d = String(email).split("@")[0];
  return d.startsWith("591") && d.length === 11 ? d.slice(3) : d;
}
export function claveSeisNumeros() {
  const n = crypto.getRandomValues(new Uint32Array(1))[0] % 900000 + 100000;
  return String(n);
}
