// VASCRUZ · Seguimiento de importaciones de clientes
//  - Administrador: pestaña "Pedidos" para crear y actualizar cada importación (etapas, contenedor, videos).
//  - Cliente: pestaña "Mi importación" con la línea de tiempo, sus datos, videos y botón a la naviera.
// Solo el administrador escribe; cada cliente solo puede leer sus propios pedidos (reglas de Firestore).

export const ETAPAS = [
  ["reserva", "Reserva confirmada", "Recibimos su reserva y emitimos la orden de compra."],
  ["compra", "Compra en fábrica", "Pagamos al fabricante y se asigna su vehículo."],
  ["preparacion", "Idioma español y cargador", "Se configura el idioma español y se prepara el cargador."],
  ["inspeccion", "Inspección y fotos", "Revisamos el vehículo y tomamos fotos y videos antes de cargar."],
  ["carga", "Carga en contenedor", "El vehículo se fija dentro del contenedor y se precinta."],
  ["zarpe", "Zarpe del puerto chino", "El barco sale del puerto de origen con su contenedor."],
  ["transito", "En tránsito marítimo", "Su contenedor viaja por mar hacia Iquique, Chile."],
  ["iquique", "Llegada a Iquique", "El barco llega al puerto de Iquique."],
  ["desconsolidado", "Desconsolidado en Iquique", "Se abre el contenedor y se prepara la reexpedición."],
  ["traslado", "Traslado a Bolivia", "Su vehículo viaja en cigüeña de Iquique a Bolivia."],
  ["aduana", "Aduana y nacionalización", "La agencia despachante nacionaliza su vehículo."],
  ["entrega", "Entregado", "¡Su vehículo está listo y entregado!"],
];
const NAVIERAS = ["MSC", "Maersk", "CMA CGM", "COSCO", "Hapag-Lloyd", "ONE", "Evergreen", "Otra"];

// Enlace de seguimiento en la web de cada naviera (si no hay uno directo, buscador universal)
export function enlaceNaviera(naviera, n) {
  const c = encodeURIComponent(String(n || "").trim().toUpperCase());
  if (!c) return "";
  switch (naviera) {
    case "MSC": return `https://www.msc.com/en/track-a-shipment?trackingNumber=${c}&trackingMode=0`;
    case "Maersk": return `https://www.maersk.com/tracking/${c}`;
    case "CMA CGM": return `https://www.cma-cgm.com/ebusiness/tracking/search?SearchBy=Container&Reference=${c}`;
    case "COSCO": return `https://elines.coscoshipping.com/ebusiness/cargoTracking?trackingType=CONTAINER&number=${c}`;
    case "Hapag-Lloyd": return `https://www.hapag-lloyd.com/en/online-business/track/track-by-container-solution.html?container=${c}`;
    default: return `https://www.track-trace.com/container?number=${c}`;
  }
}

// Videos y fotos: YouTube y Google Drive se ven dentro de la página
export function medioHTML(url, titulo, esc) {
  const u = String(url || "").trim(); if (!u) return "";
  const yt = u.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/))([\w-]{11})/);
  if (yt) return `<div class="medio"><div class="marco"><iframe src="https://www.youtube-nocookie.com/embed/${yt[1]}?rel=0" title="${esc(titulo || "Video")}" loading="lazy" allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen" allowfullscreen></iframe></div>${titulo ? `<small>${esc(titulo)}</small>` : ""}</div>`;
  const dr = u.match(/drive\.google\.com\/(?:file\/d\/|open\?id=)([\w-]{20,})/);
  if (dr) return `<div class="medio"><div class="marco"><iframe src="https://drive.google.com/file/d/${dr[1]}/preview" title="${esc(titulo || "Video")}" loading="lazy" allow="autoplay; fullscreen" allowfullscreen></iframe></div>${titulo ? `<small>${esc(titulo)}</small>` : ""}</div>`;
  if (/\.(jpe?g|png|webp|gif)(\?|$)/i.test(u)) return `<div class="medio"><a href="${esc(u)}" target="_blank" rel="noopener"><img src="${esc(u)}" alt="${esc(titulo || "Foto")}" loading="lazy"></a>${titulo ? `<small>${esc(titulo)}</small>` : ""}</div>`;
  return `<div class="medio"><a class="btn btn-line btn-sm" href="${esc(u)}" target="_blank" rel="noopener">▶ ${esc(titulo || "Ver archivo")}</a></div>`;
}

export const CSS_PEDIDOS = `
.seg-card{display:grid;grid-template-columns:minmax(0,.9fr) minmax(0,1.1fr);gap:22px;align-items:center}
.seg-card img.foto{width:100%;aspect-ratio:4/3;object-fit:cover;border-radius:16px;background:var(--surface)}
.seg-estado{display:inline-flex;align-items:center;gap:8px;font:600 12px var(--mono);letter-spacing:.12em;text-transform:uppercase;color:var(--gold)}
.seg-estado::before{content:"";width:9px;height:9px;border-radius:50%;background:var(--gold-2);box-shadow:0 0 0 0 rgba(210,173,85,.6);animation:latido 1.8s infinite}
@keyframes latido{70%{box-shadow:0 0 0 10px rgba(210,173,85,0)}100%{box-shadow:0 0 0 0 rgba(210,173,85,0)}}
.barra{height:8px;border-radius:999px;background:var(--surface-2,var(--surface));overflow:hidden;margin:14px 0 6px}
.barra span{display:block;height:100%;border-radius:999px;background:linear-gradient(90deg,#a8822a,#f0d58c);transition:width 1s}
.seg-datos{display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:10px;margin-top:18px}
.seg-datos div{border:1px solid var(--line);border-radius:12px;padding:10px 12px;background:var(--card)}
.seg-datos small{display:block;font:11px var(--mono);letter-spacing:.1em;text-transform:uppercase;color:var(--muted)}
.seg-datos b{font-size:14.5px;word-break:break-word}
.linea-t{list-style:none;margin:8px 0 0;padding:0;position:relative}
.linea-t::before{content:"";position:absolute;left:17px;top:6px;bottom:6px;width:2px;background:var(--line)}
.linea-t li{position:relative;padding:0 0 22px 52px}
.linea-t .pto{position:absolute;left:6px;top:2px;width:24px;height:24px;border-radius:50%;border:2px solid var(--line);background:var(--card);display:grid;place-items:center;font-size:12px;color:#111}
.linea-t li.hecho .pto{background:linear-gradient(135deg,#f0d58c,#c9a14a);border-color:#c9a14a}
.linea-t li.actual .pto{border-color:var(--gold-2);box-shadow:0 0 0 6px color-mix(in srgb,var(--gold-2) 22%,transparent)}
.linea-t li.hecho::after{content:"";position:absolute;left:17px;top:26px;bottom:0;width:2px;background:linear-gradient(#c9a14a,#f0d58c)}
.linea-t li:last-child::after{display:none}
.linea-t h4{margin:0;font-size:15.5px}
.linea-t li:not(.hecho):not(.actual) h4{color:var(--muted);font-weight:600}
.linea-t .fecha{font:12px var(--mono);color:var(--gold)}
.linea-t p{margin:4px 0 0;color:var(--muted);font-size:13.5px}
.linea-t .nota{margin-top:6px;padding:8px 12px;border-radius:10px;background:var(--surface);color:var(--fg);font-size:13.5px}
.medios{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:12px;margin-top:10px}
.medio .marco{position:relative;aspect-ratio:16/9;border-radius:12px;overflow:hidden;background:#000}
.medio iframe{position:absolute;inset:0;width:100%;height:100%;border:0}
.medio img{width:100%;aspect-ratio:16/9;object-fit:cover;border-radius:12px}
.medio small{display:block;margin-top:4px;color:var(--muted);font-size:12.5px}
.pagos-c{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:12px}
.pagos-c div{border:1px solid var(--line);border-radius:12px;padding:12px;background:var(--card)}
.pagos-c small{display:block;color:var(--muted);font-size:12px}
.pagos-c b{display:block;font-size:16px}
.pagos-c .ok{color:var(--green)}.pagos-c .pend{color:var(--muted)}
.ed-etapas{display:grid;gap:8px;margin-top:8px}
.ed-etapa{display:grid;grid-template-columns:auto minmax(0,1fr) 150px;gap:8px 10px;align-items:center;border:1px solid var(--line);border-radius:12px;padding:10px;background:var(--card)}
.ed-etapa input[type=checkbox]{width:20px;height:20px}
.ed-etapa .nota-in{grid-column:2/-1}
.ed-medio{display:grid;grid-template-columns:170px minmax(0,1fr) minmax(0,1.4fr) auto;gap:8px;margin-top:8px;align-items:center}
@media (max-width:760px){.seg-card{grid-template-columns:1fr}.pagos-c{grid-template-columns:1fr}.ed-etapa{grid-template-columns:auto minmax(0,1fr)}.ed-etapa input[type=date]{grid-column:2}.ed-medio{grid-template-columns:1fr}}
`;

export function iniciarPedidos(cx) {
  const { db, doc, getDoc, getDocs, addDoc, updateDoc, setDoc, collection, query, where, serverTimestamp, $, esc, usd, fecha, nombreAuto, telWa, busy, msg, CAT, catById } = cx;
  let deleteDoc = null;
  const titulo = (k) => (ETAPAS.find(e => e[0] === k) || [k, k])[1];
  const ultimaEtapa = (p) => { let u = null; ETAPAS.forEach(e => { if (p.etapas && p.etapas[e[0]] && p.etapas[e[0]].hecho) u = e[0]; }); return u; };
  const avance = (p) => Math.round(ETAPAS.filter(e => p.etapas && p.etapas[e[0]] && p.etapas[e[0]].hecho).length / ETAPAS.length * 100);
  const fechaTxt = (f) => f ? new Date(f + "T12:00:00").toLocaleDateString("es-BO", { day: "2-digit", month: "long", year: "numeric" }) : "";

  // ---------- Vista del cliente ----------
  function tarjeta(p, id, deAdmin) {
    const m = catById[p.vehiculo_id] || {};
    const ult = ultimaEtapa(p), pct = avance(p);
    const idxUlt = ETAPAS.findIndex(e => e[0] === ult);
    const sig = ETAPAS[idxUlt + 1];
    const link = enlaceNaviera(p.naviera, p.contenedor);
    const precio = Number(p.precio) || 0;
    const pg = [["reserva", "Reserva 50%", .5], ["chasis", "Chasis 30%", .3], ["iquique", "Iquique 20%", .2]];
    const wa = telWa(p.asesor_tel) || "59177006107";
    const items = ETAPAS.map((e, i) => {
      const d = (p.etapas && p.etapas[e[0]]) || {}, hecho = !!d.hecho, actual = !hecho && i === idxUlt + 1;
      const medios = (p.medios || []).filter(x => x.etapa === e[0]);
      return `<li class="${hecho ? "hecho" : actual ? "actual" : ""}"><span class="pto">${hecho ? "✓" : ""}</span>
        <h4>${esc(e[1])}</h4>${hecho && d.fecha ? `<div class="fecha">${esc(fechaTxt(d.fecha))}</div>` : actual ? `<div class="fecha">En curso</div>` : ""}
        ${hecho || actual ? `<p>${esc(e[2])}</p>` : ""}${d.nota ? `<div class="nota">${esc(d.nota)}</div>` : ""}
        ${medios.length ? `<div class="medios">${medios.map(x => medioHTML(x.url, x.titulo, esc)).join("")}</div>` : ""}</li>`;
    }).join("");
    return `<article class="card" style="margin-bottom:22px">
      <div class="seg-card">
        <img class="foto" src="${esc(p.foto || m.foto || "img/logo.png")}" alt="">
        <div>
          <div class="seg-estado">${ult === "entrega" ? "Entregado" : esc(ult ? titulo(ult) : "Pedido registrado")}</div>
          <h2 style="margin:8px 0 2px">${esc(p.vehiculo_nombre || nombreAuto(m))}</h2>
          <div class="muted">${p.color ? "Color: " + esc(p.color) : ""}</div>
          <div class="barra"><span style="width:${pct}%"></span></div>
          <div class="muted" style="font-size:13px">${pct}% del proceso${sig && ult !== "entrega" ? " · Próximo paso: " + esc(sig[1]) : ""}</div>
          <div class="actions">
            ${link ? `<a class="btn btn-gold" href="${esc(link)}" target="_blank" rel="noopener" data-copiar="${esc(p.contenedor)}">Ver mi contenedor en ${esc(p.naviera && p.naviera !== "Otra" ? p.naviera : "la naviera")}</a>` : ""}
            <a class="btn btn-line" href="https://wa.me/${wa}?text=${encodeURIComponent("Hola " + (p.asesor_nombre || "Vascruz") + ", consulto por el seguimiento de mi " + (p.vehiculo_nombre || "vehículo") + (p.chasis ? " (chasis " + p.chasis + ")" : "") + ".")}" target="_blank" rel="noopener">Hablar con mi asesor</a>
            ${deAdmin ? `<button class="btn btn-line" data-editar="${id}">Editar pedido</button>` : ""}
          </div>
          ${link ? `<p class="muted" style="font-size:12.5px;margin:8px 0 0">Al pulsar copiamos su número de contenedor <b>${esc(p.contenedor)}</b>: si la página de la naviera lo pide, péguelo en su buscador.</p>` : ""}
        </div>
      </div>
      <div class="seg-datos">
        ${[["N.° de chasis (VIN)", p.chasis], ["Contenedor", p.contenedor], ["BL", p.bl], ["Naviera", p.naviera], ["Puerto de origen", p.origen], ["Llegada estimada a Iquique", fechaTxt(p.eta)], ["Su asesor", p.asesor_nombre]]
          .filter(r => r[1]).map(r => `<div><small>${esc(r[0])}</small><b>${esc(r[1])}</b></div>`).join("")}
      </div>
      <h3 style="margin:26px 0 6px">Seguimiento de su importación</h3>
      <ol class="linea-t">${items}</ol>
      ${precio ? `<h3 style="margin:10px 0 0">Pagos</h3><div class="pagos-c">${pg.map(([k, t, f]) => `<div><small>${t}</small><b>${usd(precio * f)}</b><span class="${p.pagos && p.pagos[k] ? "ok" : "pend"}">${p.pagos && p.pagos[k] ? "✓ Pagado" : "Pendiente"}</span></div>`).join("")}</div>` : ""}
      ${p.actualizado ? `<p class="muted" style="font-size:12px;margin:16px 0 0">Última actualización: ${esc(fecha(p.actualizado))}</p>` : ""}
    </article>`;
  }
  function activarCopiar(caja) {
    caja.querySelectorAll("[data-copiar]").forEach(a => a.addEventListener("click", () => { try { navigator.clipboard.writeText(a.dataset.copiar); } catch (_) {} }));
  }

  async function miImportacion(ME) {
    const caja = $("#mi-pedido");
    caja.innerHTML = `<p class="muted">Cargando…</p>`;
    const s = await getDocs(query(collection(db, "pedidos"), where("cliente_uid", "==", ME.uid)));
    if (s.empty) { caja.innerHTML = `<div class="card"><h2>Aún no hay pedidos en su cuenta</h2><p class="muted">Cuando Vascruz registre su importación, aquí verá cada etapa, su número de contenedor y los videos del proceso.</p><a class="btn btn-gold" href="https://wa.me/59177006107" target="_blank" rel="noopener">Escribir a Vascruz</a></div>`; return; }
    caja.innerHTML = s.docs.map(d => tarjeta(d.data(), d.id, false)).join("");
    activarCopiar(caja);
  }

  // ---------- Panel del administrador ----------
  let USU = [], EDIT = null;
  async function adminPedidos() {
    const [ps, us] = await Promise.all([getDocs(collection(db, "pedidos")), getDocs(collection(db, "usuarios"))]);
    USU = us.docs.map(d => ({ id: d.id, ...d.data() }));
    const lista = ps.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => ((b.actualizado?.seconds) || 0) - ((a.actualizado?.seconds) || 0));
    $("#ped-lista").innerHTML = lista.map(p => { const u = ultimaEtapa(p);
      return `<tr><td><b>${esc(p.cliente_nombre || "")}</b><br><span class="muted">${esc(p.cliente_tel || "")}</span></td><td>${esc(p.vehiculo_nombre || "")}<br><span class="muted">${esc(p.chasis || "")}</span></td>
        <td>${esc(p.contenedor || "—")}<br><span class="muted">${esc(p.naviera || "")}</span></td><td><span class="pill ${u === "entrega" ? "g" : ""}">${esc(u ? titulo(u) : "Registrado")}</span><br><span class="muted">${avance(p)}%</span></td>
        <td><div class="actions" style="margin:0"><button class="btn btn-gold btn-sm" data-ed="${p.id}">Actualizar</button></div></td></tr>`; }).join("")
      || `<tr><td colspan="5" class="muted">Todavía no hay pedidos. Pulse "Nuevo pedido".</td></tr>`;
    $("#ped-lista").querySelectorAll("[data-ed]").forEach(b => b.onclick = () => abrir(lista.find(p => p.id === b.dataset.ed)));
    const sinClientes = !USU.some(u => u.rol === "cliente");
    $("#ped-aviso").hidden = !sinClientes;
  }

  function opciones(arr, sel) { return arr.map(([v, t]) => `<option value="${esc(v)}" ${String(v) === String(sel ?? "") ? "selected" : ""}>${esc(t)}</option>`).join(""); }

  function abrir(p) {
    EDIT = p || null; p = p || { etapas: {}, medios: [], pagos: {} };
    const clientes = USU.filter(u => u.rol === "cliente").map(u => [u.id, u.nombre + (u.telefono ? " · " + u.telefono : "")]);
    const asesores = [["", "Vascruz (oficina)"], ...USU.filter(u => u.rol === "asesor" || u.rol === "admin").map(u => [u.id, u.nombre])];
    const ase = USU.find(u => u.nombre === p.asesor_nombre && (u.rol === "asesor" || u.rol === "admin"));
    const f = $("#ped-form");
    f.hidden = false;
    f.innerHTML = `<h2>${EDIT ? "Actualizar pedido" : "Nuevo pedido"}</h2>
      <div class="row2">
        <div><label>Cliente</label><select id="pf-cliente">${clientes.length ? opciones(clientes, p.cliente_uid) : `<option value="">Primero cree el usuario del cliente</option>`}</select></div>
        <div><label>Asesor a cargo</label><select id="pf-asesor">${opciones(asesores, ase ? ase.id : "")}</select></div>
      </div>
      <div class="row2">
        <div><label>Vehículo</label><select id="pf-auto">${opciones(CAT.map(m => [m.id, nombreAuto(m)]), p.vehiculo_id)}</select></div>
        <div><label>Color</label><input id="pf-color" value="${esc(p.color || "")}"></div>
      </div>
      <div class="row2">
        <div><label>N.° de chasis (VIN)</label><input id="pf-chasis" value="${esc(p.chasis || "")}" style="text-transform:uppercase"></div>
        <div><label>Precio puesto en Santa Cruz (USD)</label><input id="pf-precio" type="number" min="0" value="${esc(p.precio || "")}"></div>
      </div>
      <div class="row2">
        <div><label>N.° de contenedor</label><input id="pf-cont" value="${esc(p.contenedor || "")}" placeholder="Ej.: MSCU1234567" style="text-transform:uppercase"></div>
        <div><label>Naviera</label><select id="pf-nav">${opciones(NAVIERAS.map(n => [n, n]), p.naviera || "MSC")}</select></div>
      </div>
      <div class="row2">
        <div><label>BL (conocimiento de embarque) <span class="muted">(opcional)</span></label><input id="pf-bl" value="${esc(p.bl || "")}"></div>
        <div><label>Puerto de origen</label><input id="pf-origen" value="${esc(p.origen || "")}" placeholder="Ej.: Shanghái"></div>
      </div>
      <div class="row2">
        <div><label>Llegada estimada a Iquique</label><input id="pf-eta" type="date" value="${esc(p.eta || "")}"></div>
        <div><label>Pagos recibidos</label><div class="actions" style="margin:4px 0 0">${[["reserva", "Reserva 50%"], ["chasis", "Chasis 30%"], ["iquique", "Iquique 20%"]].map(([k, t]) => `<label style="display:flex;gap:6px;align-items:center;margin:0;font-weight:500"><input type="checkbox" id="pf-pago-${k}" style="width:auto" ${p.pagos && p.pagos[k] ? "checked" : ""}>${t}</label>`).join("")}</div></div>
      </div>
      <h3 style="margin-top:18px">Etapas</h3><p class="muted" style="margin:2px 0 0">Marque cada etapa cumplida, con su fecha y, si quiere, una nota para el cliente.</p>
      <div class="ed-etapas">${ETAPAS.map(([k, t]) => { const d = (p.etapas || {})[k] || {}; return `<div class="ed-etapa"><input type="checkbox" data-k="${k}" ${d.hecho ? "checked" : ""}><b>${esc(t)}</b><input type="date" data-f="${k}" value="${esc(d.fecha || "")}"><input class="nota-in" data-n="${k}" placeholder="Nota para el cliente (opcional)" value="${esc(d.nota || "")}"></div>`; }).join("")}</div>
      <h3 style="margin-top:18px">Videos y fotos</h3><p class="muted" style="margin:2px 0 0">Pegue el enlace de YouTube (no listado) o de Google Drive (compartido "cualquiera con el enlace").</p>
      <div id="pf-medios"></div>
      <button type="button" class="btn btn-line btn-sm" id="pf-mas" style="margin-top:8px">+ Agregar video o foto</button>
      <div class="actions" style="margin-top:20px"><button type="button" class="btn btn-gold" id="pf-guardar">Guardar pedido</button><button type="button" class="btn btn-line" id="pf-cancelar">Cancelar</button>${EDIT ? `<button type="button" class="btn btn-red" id="pf-borrar">Eliminar pedido</button>` : ""}</div>
      <div class="msg" id="m-ped" hidden></div>`;
    const medios = $("#pf-medios");
    const filaMedio = (x = {}) => { const d = document.createElement("div"); d.className = "ed-medio";
      d.innerHTML = `<select data-m="etapa">${opciones(ETAPAS.map(e => [e[0], e[1]]), x.etapa || "carga")}</select><input data-m="titulo" placeholder="Título (ej.: Cambio de idioma)" value="${esc(x.titulo || "")}"><input data-m="url" placeholder="https://youtu.be/… o https://drive.google.com/…" value="${esc(x.url || "")}"><button type="button" class="btn btn-line btn-sm">Quitar</button>`;
      d.querySelector("button").onclick = () => d.remove(); medios.appendChild(d); };
    (p.medios || []).forEach(filaMedio);
    $("#pf-mas").onclick = () => filaMedio();
    $("#pf-cancelar").onclick = () => { f.hidden = true; EDIT = null; };
    f.querySelectorAll("input[type=checkbox][data-k]").forEach(c => c.onchange = () => { const fi = f.querySelector(`[data-f="${c.dataset.k}"]`); if (c.checked && !fi.value) fi.value = new Date().toISOString().slice(0, 10); });
    $("#pf-auto").onchange = () => { const pr = cx.PRECIOS_DE && cx.PRECIOS_DE($("#pf-auto").value); if (pr && !$("#pf-precio").value) $("#pf-precio").value = pr; };
    if (!EDIT) $("#pf-auto").onchange();
    $("#pf-guardar").onclick = (ev) => busy(ev.target, guardar);
    if (EDIT) $("#pf-borrar").onclick = (ev) => busy(ev.target, borrar);
    f.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function guardar() {
    const m = $("#m-ped");
    const cli = USU.find(u => u.id === $("#pf-cliente").value);
    if (!cli) return msg(m, "Elija el cliente. Si no aparece, créelo primero en \"Usuarios\" como tipo Cliente.", "err");
    const auto = catById[$("#pf-auto").value];
    const ase = USU.find(u => u.id === $("#pf-asesor").value);
    const etapas = {};
    ETAPAS.forEach(([k]) => { const c = $(`[data-k="${k}"]`), fe = $(`[data-f="${k}"]`).value, no = $(`[data-n="${k}"]`).value.trim();
      if (c.checked || fe || no) etapas[k] = { hecho: c.checked, fecha: fe, nota: no }; });
    const medios = [...document.querySelectorAll("#pf-medios .ed-medio")].map(d => ({ etapa: d.querySelector('[data-m="etapa"]').value, titulo: d.querySelector('[data-m="titulo"]').value.trim(), url: d.querySelector('[data-m="url"]').value.trim() })).filter(x => x.url);
    const datos = {
      cliente_uid: cli.id, cliente_nombre: cli.nombre || cli.email, cliente_tel: cli.telefono || "",
      asesor_nombre: ase ? ase.nombre : "Vascruz", asesor_tel: ase ? (ase.telefono || "") : "59177006107",
      vehiculo_id: auto ? String(auto.id) : "", vehiculo_nombre: auto ? nombreAuto(auto) : "", foto: auto ? (auto.foto || "") : "",
      color: $("#pf-color").value.trim(), chasis: $("#pf-chasis").value.trim().toUpperCase(), precio: Number($("#pf-precio").value) || 0,
      contenedor: $("#pf-cont").value.trim().toUpperCase().replace(/\s+/g, ""), naviera: $("#pf-nav").value, bl: $("#pf-bl").value.trim(),
      origen: $("#pf-origen").value.trim(), eta: $("#pf-eta").value,
      pagos: { reserva: $("#pf-pago-reserva").checked, chasis: $("#pf-pago-chasis").checked, iquique: $("#pf-pago-iquique").checked },
      etapas, medios, actualizado: serverTimestamp(), actualizado_por: cx.ME().email
    };
    try {
      if (EDIT) await updateDoc(doc(db, "pedidos", EDIT.id), datos);
      else await addDoc(collection(db, "pedidos"), { ...datos, creado: serverTimestamp() });
    } catch (err) { return msg(m, cx.errorEs(err) + (err.code === "permission-denied" ? " Revise que las reglas nuevas de Firebase estén publicadas." : ""), "err"); }
    const ult = ultimaEtapa(datos);
    const url = location.origin + location.pathname;
    const texto = `Hola ${datos.cliente_nombre}, actualizamos el seguimiento de su ${datos.vehiculo_nombre}${ult ? ": " + titulo(ult) : ""}. Véalo con su usuario en ${url} → "Mi importación".`;
    $("#ped-form").innerHTML = `<div class="msg ok" style="margin:0">✅ Pedido guardado. El cliente ya ve la actualización en "Mi importación".</div>
      <div class="actions">${datos.cliente_tel ? `<a class="btn btn-gold" href="https://wa.me/${telWa(datos.cliente_tel)}?text=${encodeURIComponent(texto)}" target="_blank" rel="noopener">Avisar al cliente por WhatsApp</a>` : ""}<button type="button" class="btn btn-line" id="pf-cerrar">Cerrar</button></div>`;
    $("#pf-cerrar").onclick = () => { $("#ped-form").hidden = true; };
    EDIT = null; await adminPedidos();
  }

  async function borrar() {
    if (!EDIT || !confirm(`¿Eliminar el pedido de ${EDIT.cliente_nombre}? El cliente dejará de verlo. No se puede deshacer.`)) return;
    if (!deleteDoc) deleteDoc = (await import("https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore-lite.js")).deleteDoc;
    await deleteDoc(doc(db, "pedidos", EDIT.id));
    $("#ped-form").hidden = true; EDIT = null; await adminPedidos();
  }

  $("#ped-nuevo").onclick = () => abrir(null);
  return { adminPedidos, miImportacion, tarjeta };
}
