// Genera un archivo Excel (.xlsx) real en el navegador, sin librerías externas.
// Uso: const blob = crearXlsx({ hoja: "Precios FOB", filas: [[...], ...], anchos: [...], encabezado: 3, moneda: [8] });
//  - filas: matriz de valores (texto o número). La fila "encabezado" (1 = primera) se pone en negrita.
//  - moneda: índices de columna (0 = primera) con formato "USD 12.345".
//  - titulo: índices de fila (0 = primera) que van en negrita grande.

const enc = new TextEncoder();

const CRC_TABLA = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; }
  return t;
})();
function crc32(bytes) {
  let c = 0xFFFFFFFF;
  for (let i = 0; i < bytes.length; i++) c = CRC_TABLA[(c ^ bytes[i]) & 0xFF] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}

// ZIP sin compresión (el formato .xlsx es un ZIP con archivos XML)
function zip(archivos) {
  const partes = [], central = [];
  let offset = 0;
  for (const [nombre, texto] of archivos) {
    const nom = enc.encode(nombre), datos = enc.encode(texto), crc = crc32(datos);
    const loc = new DataView(new ArrayBuffer(30));
    loc.setUint32(0, 0x04034b50, true); loc.setUint16(4, 20, true); loc.setUint16(6, 0x0800, true);
    loc.setUint16(8, 0, true); loc.setUint32(14, crc, true); loc.setUint32(18, datos.length, true);
    loc.setUint32(22, datos.length, true); loc.setUint16(26, nom.length, true);
    partes.push(new Uint8Array(loc.buffer), nom, datos);
    const cen = new DataView(new ArrayBuffer(46));
    cen.setUint32(0, 0x02014b50, true); cen.setUint16(4, 20, true); cen.setUint16(6, 20, true); cen.setUint16(8, 0x0800, true);
    cen.setUint32(16, crc, true); cen.setUint32(20, datos.length, true); cen.setUint32(24, datos.length, true);
    cen.setUint16(28, nom.length, true); cen.setUint32(42, offset, true);
    central.push(new Uint8Array(cen.buffer), nom);
    offset += 30 + nom.length + datos.length;
  }
  const tamCentral = central.reduce((s, p) => s + p.length, 0);
  const fin = new DataView(new ArrayBuffer(22));
  fin.setUint32(0, 0x06054b50, true); fin.setUint16(8, archivos.length, true); fin.setUint16(10, archivos.length, true);
  fin.setUint32(12, tamCentral, true); fin.setUint32(16, offset, true);
  return new Blob([...partes, ...central, new Uint8Array(fin.buffer)], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
}

const xml = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]))
  .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "");
function letra(i) { let s = ""; i++; while (i > 0) { const m = (i - 1) % 26; s = String.fromCharCode(65 + m) + s; i = Math.floor((i - 1) / 26); } return s; }

export function crearXlsx({ hoja = "Hoja1", filas = [], anchos = [], encabezado = 1, moneda = [], titulo = [] }) {
  const monedaSet = new Set(moneda), tituloSet = new Set(titulo);
  const filasXml = filas.map((fila, r) => {
    const esEnc = r === encabezado - 1, esTit = tituloSet.has(r);
    const celdas = fila.map((v, c) => {
      if (v === null || v === undefined || v === "") return "";
      const ref = letra(c) + (r + 1);
      if (typeof v === "number" && isFinite(v)) {
        const s = esEnc ? 1 : monedaSet.has(c) ? 2 : 0;
        return `<c r="${ref}"${s ? ` s="${s}"` : ""}><v>${v}</v></c>`;
      }
      const s = esTit ? 3 : esEnc ? 1 : 0;
      return `<c r="${ref}" t="inlineStr"${s ? ` s="${s}"` : ""}><is><t xml:space="preserve">${xml(v)}</t></is></c>`;
    }).join("");
    return `<row r="${r + 1}">${celdas}</row>`;
  }).join("");
  const cols = anchos.length ? `<cols>${anchos.map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`).join("")}</cols>` : "";
  const congelar = encabezado > 0 ? `<sheetViews><sheetView workbookViewId="0"><pane ySplit="${encabezado}" topLeftCell="A${encabezado + 1}" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>` : "";
  const nombreHoja = xml(hoja).slice(0, 31);
  return zip([
    ["[Content_Types].xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>`],
    ["_rels/.rels", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`],
    ["xl/workbook.xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="${nombreHoja}" sheetId="1" r:id="rId1"/></sheets></workbook>`],
    ["xl/_rels/workbook.xml.rels", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`],
    ["xl/styles.xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><numFmts count="1"><numFmt numFmtId="164" formatCode="&quot;USD &quot;#,##0"/></numFmts><fonts count="3"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="14"/><name val="Calibri"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FFF3EAD3"/></patternFill></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="4"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/><xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/><xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyFont="1"/></cellXfs></styleSheet>`],
    ["xl/worksheets/sheet1.xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">${congelar}${cols}<sheetData>${filasXml}</sheetData></worksheet>`],
  ]);
}
