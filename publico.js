// Lectura rápida de documentos públicos (proformas y catálogos que se abren con su enlace).
// No carga el sistema de usuarios de Firebase: hace una sola consulta directa, así la página
// (y el PDF) aparecen casi al instante, también en el celular.
const PROYECTO = "vascruz-web";
const CLAVE = "AIzaSyCd7ccK2wu2x8Iw_1bCU-PG5adlvBAlaFM";   // dato público; la protección la dan las reglas de la base de datos

function valor(v) {
  if (!v) return null;
  if ("stringValue" in v) return v.stringValue;
  if ("integerValue" in v) return Number(v.integerValue);
  if ("doubleValue" in v) return Number(v.doubleValue);
  if ("booleanValue" in v) return v.booleanValue;
  if ("nullValue" in v) return null;
  if ("timestampValue" in v) { const d = new Date(v.timestampValue); return { toDate: () => d, seconds: d.getTime() / 1000 }; }
  if ("mapValue" in v) return campos(v.mapValue.fields || {});
  if ("arrayValue" in v) return (v.arrayValue.values || []).map(valor);
  return null;
}
function campos(f) { const o = {}; for (const k in f) o[k] = valor(f[k]); return o; }

// Devuelve los datos del documento, o null si no existe.
export async function leerPublico(coleccion, id) {
  const r = await fetch(`https://firestore.googleapis.com/v1/projects/${PROYECTO}/databases/(default)/documents/${coleccion}/${encodeURIComponent(id)}?key=${CLAVE}`);
  if (r.status === 404) return null;
  if (!r.ok) throw new Error("No se pudo leer " + coleccion);
  const j = await r.json();
  return campos(j.fields || {});
}

export function usd(n) {
  return n === null || n === undefined || isNaN(n) ? "—" : "USD " + String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}
export function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
export function nombreAuto(m) {
  return [m.marca, m.modelo, m.version].filter(Boolean).join(" ") + (m.anio ? " (" + m.anio + ")" : "");
}
export function telWa(t) {
  const d = String(t || "").replace(/[^\d]/g, "");
  return d.length === 8 ? "591" + d : d;
}

// Espera fotos y letras antes de abrir el diálogo de imprimir (sin esperas fijas largas).
export async function listoParaImprimir(caja) {
  const imgs = [...caja.querySelectorAll("img")];
  imgs.forEach(i => { i.loading = "eager"; });
  const tope = new Promise(r => setTimeout(r, 6000));   // por si alguna foto no carga, no se queda esperando
  await Promise.race([Promise.all([
    ...imgs.map(i => i.complete ? 0 : new Promise(r => { i.onload = i.onerror = r; })),
    document.fonts ? document.fonts.ready : 0
  ]), tope]);
}
