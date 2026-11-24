// Descargar PDF sin usar la ventana de impresión del navegador (en el iPhone esa ventana a veces deja el PDF en blanco).
// Arma el archivo aquí mismo: toma una "foto" nítida de la hoja y la coloca en un A4, siempre en UNA sola hoja.
const LIBS = [
  ["html2canvas", "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"],
  ["jspdf", "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"],
];
const cargar = (src) => new Promise((ok, mal) => {
  const s = document.createElement("script"); s.src = src; s.onload = ok; s.onerror = () => mal(new Error("No se pudo cargar " + src)); document.head.appendChild(s);
});

// Safari (Mac o iPhone): su ventana de impresión puede dejar el PDF en blanco, así que ahí se usa el PDF armado por la página.
export const esSafari = /^((?!chrome|android|crios|fxios|edg).)*safari/i.test(navigator.userAgent);
export const esIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

// hoja: el elemento a convertir · nombre: nombre del archivo · clase: estilo compacto (igual al impreso)
export async function crearPDF(hoja, clase) {
  for (const [g, src] of LIBS) if (!window[g]) await cargar(src);
  if (document.fonts) await document.fonts.ready;
  await Promise.all([...hoja.querySelectorAll("img")].map(i => i.complete ? 0 : new Promise(r => { i.onload = i.onerror = r; })));
  const estilo = hoja.getAttribute("style") || "";
  hoja.classList.add(clase);
  hoja.style.width = "186mm"; hoja.style.removeProperty("--zoom");
  try {
    const canvas = await window.html2canvas(hoja, { scale: 2.5, backgroundColor: "#ffffff", useCORS: true, logging: false, windowWidth: 1100 });
    const pdf = new window.jspdf.jsPDF({ unit: "mm", format: "a4", compress: true });
    const anchoMax = 186, altoMax = 273;                     // A4 (210 × 297 mm) con márgenes de 12 mm
    let w = anchoMax, h = canvas.height * anchoMax / canvas.width;
    if (h > altoMax) { h = altoMax; w = canvas.width * h / canvas.height; }   // si no entra, se reduce: siempre una hoja
    pdf.addImage(canvas.toDataURL("image/jpeg", 0.93), "JPEG", 12 + (anchoMax - w) / 2, 12, w, h);
    return pdf;
  } finally {
    hoja.classList.remove(clase); hoja.setAttribute("style", estilo);
  }
}

export async function descargarPDF(hoja, nombre, clase) {
  const pdf = await crearPDF(hoja, clase);
  pdf.save(nombre);
}

// Imprimir de forma segura en Safari: abre el PDF ya armado (el visor de PDF de Safari imprime bien).
export async function abrirPDF(hoja, clase) {
  const ventana = window.open("", "_blank");          // se abre en el mismo clic para que Safari no la bloquee
  if (ventana) ventana.document.write("<p style=\"font:16px system-ui;padding:40px;text-align:center\">Preparando PDF…</p>");
  const pdf = await crearPDF(hoja, clase);
  const url = URL.createObjectURL(pdf.output("blob"));
  if (ventana) ventana.location.href = url; else location.href = url;
}
