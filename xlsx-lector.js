// Lectura del Excel de Vascruz en el navegador (solo para el panel del administrador).
// Las funciones de lectura son las mismas que usa el botón "Actualizar web" del Mac.

function decodeXml(s) {
  return s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, function (m, n) { return String.fromCodePoint(+n); })
    .replace(/&#x([0-9a-fA-F]+);/g, function (m, n) { return String.fromCodePoint(parseInt(n, 16)); })
    .replace(/&amp;/g, "&");
}

function attrs(s) {
  var out = {}, re = /([\w:]+)="([^"]*)"/g, m;
  while ((m = re.exec(s))) out[m[1]] = decodeXml(m[2]);
  return out;
}

function parseSharedStrings(xml) {
  var out = [];
  if (!xml) return out;
  var re = /<si>([\s\S]*?)<\/si>|<si\/>/g, m;
  while ((m = re.exec(xml))) {
    var body = m[1] || "";
    body = body.replace(/<rPh[\s\S]*?<\/rPh>/g, "");
    var t = "", rt = /<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g, k;
    while ((k = rt.exec(body))) t += k[1];
    out.push(decodeXml(t));
  }
  return out;
}

// Devuelve { "Nombre de hoja": "xl/worksheets/sheetN.xml" }
function parseSheetMap(workbookXml, relsXml) {
  var rels = {}, re = /<Relationship\s([^>]*?)\/?>/g, m;
  while ((m = re.exec(relsXml))) {
    var a = attrs(m[1]);
    var target = a.Target || "";
    if (target.charAt(0) === "/") target = target.slice(1);
    else target = "xl/" + target;
    rels[a.Id] = target;
  }
  var out = {}, rs = /<sheet\s([^>]*?)\/?>/g;
  while ((m = rs.exec(workbookXml))) {
    var b = attrs(m[1]);
    out[b.name] = rels[b["r:id"]];
  }
  return out;
}

function colIndex(ref) {
  var letters = ref.replace(/[0-9]/g, ""), n = 0;
  for (var i = 0; i < letters.length; i++) n = n * 26 + (letters.charCodeAt(i) - 64);
  return n;
}

// Devuelve { fila: { columna: valor } } con los valores ya calculados por Excel
function parseSheet(xml, shared) {
  var rows = {}, re = /<c\s([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g, m;
  while ((m = re.exec(xml))) {
    var a = attrs(m[1]), inner = m[2] || "";
    if (!a.r) continue;
    var row = parseInt(a.r.replace(/[A-Z]/g, ""), 10), col = colIndex(a.r);
    var vm = /<v(?:\s[^>]*)?>([\s\S]*?)<\/v>/.exec(inner), v = vm ? decodeXml(vm[1]) : null, val = null;
    if (a.t === "s") val = v === null ? null : shared[parseInt(v, 10)];
    else if (a.t === "inlineStr") {
      var t = "", rt = /<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g, k;
      while ((k = rt.exec(inner))) t += k[1];
      val = decodeXml(t);
    } else if (a.t === "str") val = v;
    else if (a.t === "b") val = v === "1";
    else if (a.t === "e") val = { error: v };
    else val = v === null || v === "" ? null : Number(v);
    if (val === null) continue;
    if (!rows[row]) rows[row] = {};
    rows[row][col] = val;
  }
  return rows;
}

function cell(sheet, r, c) {
  var row = sheet[r];
  if (!row) return null;
  var v = row[c];
  if (v === undefined || v === null) return null;
  if (typeof v === "string") { v = v.trim(); return v === "" ? null : v; }
  return v;
}

function isYes(v) {
  if (v === null) return false;
  var s = String(v).trim().toLowerCase();
  return s === "sí" || s === "si" || s === "s" || s === "yes" || s === "x" || s === "true";
}

function safeFileName(name) {
  return String(name).normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^A-Za-z0-9._-]+/g, "_");
}

function textOrNull(v) {
  if (v === null || v === undefined) return null;
  if (typeof v === "object") return null; // errores de fórmula
  var s = String(v).trim();
  return s === "" || s === "-" ? null : s;
}

// Construye el catálogo público a partir de las hojas del Excel.
// base = "Base de Datos", lista = "Lista de Precios", ficha = "Ficha Técnica"
function buildCatalog(base, lista, ficha) {
  var modelos = [], errores = [];
  // Columna opcional "Mostrar precio en web" (se busca por su título en la fila 3). Vacío = Sí.
  var colMostrar = null;
  for (var c = 1; c <= 60; c++) {
    var h = cell(base, 3, c);
    if (h !== null && /mostrar\s+precio/i.test(String(h))) { colMostrar = c; break; }
  }
  for (var r = 4; cell(base, r, 1) !== null; r++) {
    if (!isYes(cell(base, r, 16))) continue;
    var marca = textOrNull(cell(base, r, 2)), modelo = textOrNull(cell(base, r, 3)), version = textOrNull(cell(base, r, 4));
    var nombre = [marca, modelo, version].filter(Boolean).join(" ");
    // Verifica que la fila de la Lista de Precios corresponda al mismo vehículo
    if (textOrNull(cell(lista, r, 1)) !== marca || textOrNull(cell(lista, r, 3)) !== version) {
      errores.push("Fila " + r + ": la Lista de Precios no coincide con la Base de Datos (" + nombre + ").");
      continue;
    }
    var mostrarPrecio = colMostrar === null || cell(base, r, colMostrar) === null || isYes(cell(base, r, colMostrar));
    var precio = cell(lista, r, 10);
    if (mostrarPrecio && (typeof precio !== "number" || !isFinite(precio) || precio <= 0)) {
      errores.push("Fila " + r + ": " + nombre + " no tiene precio calculado.");
      continue;
    }
    var aut = cell(base, r, 9);
    var colores = textOrNull(cell(base, r, 13));
    if (colores) colores = colores.replace(/\s*\(\d+\)/g, "").replace(/\s+/g, " ").trim();
    var fotoOrigen = textOrNull(cell(base, r, 17));
    var f = function (c) { return textOrNull(cell(ficha, r, c)); };
    modelos.push({
      id: cell(base, r, 1),
      marca: marca,
      modelo: modelo,
      version: version,
      anio: textOrNull(cell(base, r, 5)),
      tec: textOrNull(cell(base, r, 7)),
      tipo: textOrNull(cell(base, r, 8)),
      autonomia: typeof aut === "number" ? aut : null,
      colores: colores || "Consultar colores disponibles",
      precio: mostrarPrecio ? Math.round(precio) : null,
      foto: fotoOrigen ? "img/autos/" + safeFileName(fotoOrigen).replace(/\.[^.]+$/, "") + ".jpg" : null,
      foto_origen: fotoOrigen,
      ficha: {
        bateria: f(3), bateria_destacado: f(4), potencia: f(5), potencia_destacado: f(6),
        traccion: f(7), dimensiones: f(8), distancia_ejes: f(9), carga: f(10), destacado: f(11)
      }
    });
  }
  return { modelos: modelos, errores: errores };
}

function modelKey(m) { return [m.marca, m.modelo, m.version, m.anio].join("|"); }
function modelName(m) { return [m.marca, m.modelo, m.version].filter(Boolean).join(" ") + (m.anio ? " (" + m.anio + ")" : ""); }
function usd(n) { return n === null || n === undefined ? "Consultar precio" : "USD " + String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, "."); }

function publicModel(m) {
  var c = {};
  for (var k in m) if (k !== "foto_origen") c[k] = m[k];
  return c;
}

function catalogFile(modelos, fotosOrigen, fecha) {
  var data = { actualizado: fecha, modelos: modelos.map(publicModel), fotos_origen: fotosOrigen };
  return "// Generado automáticamente desde el Excel de Vascruz con \"Actualizar web\". No editar a mano.\n" +
    "window.VASCRUZ_CATALOGO = " + JSON.stringify(data, null, 1) + ";\n";
}

function parseCatalogFile(text) {
  if (!text) return null;
  var i = text.indexOf("{"), j = text.lastIndexOf("}");
  if (i < 0 || j < 0) return null;
  try { return JSON.parse(text.slice(i, j + 1)); } catch (e) { return null; }
}

// Compara catálogo publicado vs nuevo. Devuelve líneas legibles.
function diffCatalog(oldCat, nuevos) {
  var lines = [], oldMap = {}, newMap = {};
  var viejos = (oldCat && oldCat.modelos) || [];
  viejos.forEach(function (m) { oldMap[modelKey(m)] = m; });
  nuevos.forEach(function (m) { newMap[modelKey(m)] = m; });
  nuevos.forEach(function (m) {
    var o = oldMap[modelKey(m)];
    if (!o) { lines.push("➕ Nuevo: " + modelName(m) + " — " + usd(m.precio)); return; }
    if (o.precio !== m.precio) {
      if (m.precio === null) lines.push("🔒 Precio oculto (dirá \"Consultar precio\"): " + modelName(m));
      else if (o.precio === null || o.precio === undefined) lines.push("💲 Precio visible otra vez: " + modelName(m) + " — " + usd(m.precio));
      else lines.push("💲 " + modelName(m) + ": " + usd(o.precio) + " → " + usd(m.precio));
    }
    var a = JSON.stringify(publicModel(o)), b = JSON.stringify(publicModel(m));
    if (o.precio === m.precio && a !== b) lines.push("✏️ Datos actualizados: " + modelName(m));
  });
  viejos.forEach(function (m) {
    if (!newMap[modelKey(m)]) lines.push("➖ Se quita de la web: " + modelName(m));
  });
  return lines;
}

// --- Lector mínimo de archivos .xlsx (zip) con las herramientas del navegador ---
async function unzipXlsx(buf) {
  const dv = new DataView(buf), u8 = new Uint8Array(buf);
  let eocd = -1;
  for (let i = u8.length - 22; i >= Math.max(0, u8.length - 70000); i--) if (dv.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
  if (eocd < 0) throw new Error("El archivo no parece un Excel (.xlsx).");
  const n = dv.getUint16(eocd + 10, true); let p = dv.getUint32(eocd + 16, true);
  const files = {}, td = new TextDecoder("utf-8");
  for (let k = 0; k < n; k++) {
    const method = dv.getUint16(p + 10, true), csize = dv.getUint32(p + 20, true);
    const nlen = dv.getUint16(p + 28, true), xlen = dv.getUint16(p + 30, true), clen = dv.getUint16(p + 32, true);
    const loc = dv.getUint32(p + 42, true);
    const name = td.decode(u8.subarray(p + 46, p + 46 + nlen));
    p += 46 + nlen + xlen + clen;
    if (!/^xl\/(workbook\.xml|_rels\/workbook\.xml\.rels|sharedStrings\.xml|worksheets\/sheet\d+\.xml)$/.test(name)) continue;
    const start = loc + 30 + dv.getUint16(loc + 26, true) + dv.getUint16(loc + 28, true);
    const data = u8.subarray(start, start + csize);
    let out;
    if (method === 0) out = data;
    else if (method === 8) out = new Uint8Array(await new Response(new Blob([data]).stream().pipeThrough(new DecompressionStream("deflate-raw"))).arrayBuffer());
    else throw new Error("Formato de compresión no soportado.");
    files[name] = td.decode(out);
  }
  return files;
}

// Lee el Excel maestro y arma los datos privados:
//  - asesores: precio puesto en Santa Cruz de cada vehículo (aunque en la web pública diga "Consultar precio")
//  - socios: precio FOB
// Solo toma las filas con "Sí" en "Incluir en catálogo". Clave = ID del Excel (el mismo de la web).
// Desglose de costos (hoja "Cálculo de Costos") y comisión del asesor externo (hoja "Comisiones"),
// igual que la hoja "Cotizador" del Excel. Solo para vehículos con "Sí" en "Incluir en catálogo".
function buildDetalle(base, calc, comis) {
  var desglose = {}, comisiones = {}, errores = [];
  var filaCalc = {}, filaCom = {};
  for (var r = 5; r <= 400; r++) { var a = cell(calc, r, 1); if (a !== null) filaCalc[String(a)] = r; }
  for (var r2 = 4; r2 <= 400; r2++) { var b = cell(comis, r2, 1); if (b !== null) filaCom[String(b)] = r2; }
  var n2 = function (v) { return typeof v === "number" && isFinite(v) ? Math.round(v * 100) / 100 : 0; };
  for (var r3 = 4; cell(base, r3, 1) !== null; r3++) {
    if (!isYes(cell(base, r3, 16))) continue;
    var id = String(cell(base, r3, 1));
    var nombre = [cell(base, r3, 2), cell(base, r3, 3), cell(base, r3, 4)].filter(Boolean).join(" ");
    var rc = filaCalc[id];
    if (!rc) { errores.push(nombre + ": no está en la hoja Cálculo de Costos."); continue; }
    var c = function (col) { return n2(cell(calc, rc, col)); };
    var fob = c(5);
    if (!fob) { errores.push(nombre + ": sin FOB en Cálculo de Costos."); continue; }
    desglose[id] = {
      tec: textOrNull(cell(base, r3, 7)) || "", cont: c(4),
      fob: fob, agente: c(13), flete: c(6), seguro: c(7), puerto: c(14), almIqq: c(15), descons: c(16),
      ibmetro: textOrNull(cell(base, r3, 7)) === "PHEV" ? c(17) : 0, cig: c(19), gestion: c(26), pagoExt: c(18),
      tributos: c(12), despachante: c(20), almAduana: c(21)
    };
    var rm = filaCom[id];
    var com = rm ? cell(comis, rm, 5) : null;
    if (typeof com === "number" && isFinite(com)) comisiones[id] = Math.round(com);
    else errores.push(nombre + ": sin comisión de asesor en la hoja Comisiones.");
  }
  return { desglose: desglose, comisiones: comisiones, errores: errores };
}

export async function leerExcelPrivado(arrayBuffer) {
  const f = await unzipXlsx(arrayBuffer);
  const map = parseSheetMap(f["xl/workbook.xml"], f["xl/_rels/workbook.xml.rels"]);
  const shared = parseSharedStrings(f["xl/sharedStrings.xml"] || "");
  const hoja = (nombre) => {
    if (!map[nombre]) throw new Error("No encuentro la hoja \"" + nombre + "\" en el Excel.");
    let path = map[nombre].replace(/^\//, ""); if (!path.startsWith("xl/")) path = "xl/" + path;
    if (!f[path]) throw new Error("No pude leer la hoja \"" + nombre + "\".");
    return parseSheet(f[path], shared);
  };
  const base = hoja("Base de Datos"), lista = hoja("Lista de Precios");
  const det = buildDetalle(base, hoja("Cálculo de Costos"), hoja("Comisiones"));
  const precios = {}, fob = {}, errores = [];
  let n = 0;
  for (let r = 4; cell(base, r, 1) !== null; r++) {
    if (!isYes(cell(base, r, 16))) continue;
    const id = String(cell(base, r, 1));
    const nombre = [cell(base, r, 2), cell(base, r, 3), cell(base, r, 4)].filter(Boolean).join(" ");
    if (textOrNull(cell(lista, r, 1)) !== textOrNull(cell(base, r, 2)) || textOrNull(cell(lista, r, 3)) !== textOrNull(cell(base, r, 4))) {
      errores.push("Fila " + r + ": la Lista de Precios no coincide con la Base de Datos (" + nombre + ")."); continue;
    }
    const p = cell(lista, r, 10), fo = cell(base, r, 12);
    if (typeof p === "number" && p > 0) precios[id] = Math.round(p); else errores.push(nombre + ": sin precio calculado.");
    if (typeof fo === "number" && fo > 0) fob[id] = Math.round(fo); else errores.push(nombre + ": sin FOB.");
    n++;
  }
  return { n, precios, fob, desglose: det.desglose, comisiones: det.comisiones, errores: errores.concat(det.errores) };
}
