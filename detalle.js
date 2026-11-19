// Cotización detallada: mismo orden y textos que la hoja "Cotizador" del Excel de Vascruz.
// d = desglose del vehículo (de la hoja "Cálculo de Costos"), precio = precio puesto en Santa Cruz (redondeado como en el Excel).

const e = (s) => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
export const usd2 = (n) => "USD " + Number(n || 0).toLocaleString("es-BO", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function filasDetalle(d) {
  const phev = d.tec === "PHEV";
  const gastos = [
    ["Compra del vehículo en China (precio FOB)", "Origen China", d.fob],
    ["Agente de carga China / inspección", "Origen China", d.agente],
    ["Naviera: flete marítimo", "Embarque", d.flete],
    ["Seguro internacional", "Embarque", d.seguro],
    ["Gasto puerto MSC Iquique", "Iquique", d.puerto],
    ["Almacenaje y manipuleo Iquique", "Iquique", d.almIqq],
    ["Desconsolidado y factura de reexpedición", "Iquique", d.descons],
    ...(phev && d.ibmetro ? [["IBMETRO y autorización previa (híbridos)", "Bolivia", d.ibmetro]] : []),
    ["Transporte Iquique → Santa Cruz (cigüeña)", "Traslado", d.cig],
    ["Gestión y servicio de importación", "Vascruz", d.gestion],
  ];
  const tributos = [
    [phev ? "Tributos aduaneros (gravamen arancelario, ICE e IVA)" : "IVA importación 14,94% (sin arancel ni ICE)", "Aduana", d.tributos],
    ["Agencia despachante", "Aduana", d.despachante],
    ["Almacenaje en aduana", "Aduana", d.almAduana],
  ];
  const subGastos = gastos.reduce((s, r) => s + (r[2] || 0), 0);
  const totGastos = subGastos + (d.pagoExt || 0);
  const subTrib = tributos.reduce((s, r) => s + (r[2] || 0), 0);
  return { gastos, tributos, subGastos, totGastos, subTrib };
}

// Tabla HTML del detallado. pagos = [reserva, chasis, iquique]
export function tablaDetalle(d, precio, pagos) {
  const f = filasDetalle(d);
  const fila = (n, txt, etapa, monto) => `<tr><td class="n">${n}</td><td>${e(txt)}</td><td class="et">${e(etapa)}</td><td class="m">${usd2(monto)}</td></tr>`;
  const tot = (txt, monto, fuerte) => `<tr class="${fuerte ? "tot" : "sub"}"><td></td><td colspan="2">${e(txt)}</td><td class="m">${fuerte ? usd2(monto) : usd2(monto)}</td></tr>`;
  const pg = pagos || [];
  return `<table class="det">
    <thead><tr><th class="n">N°</th><th>Gastos de importación — en orden de pago</th><th class="et">Etapa</th><th class="m">Monto USD</th></tr></thead>
    <tbody>
      ${f.gastos.map((r, i) => fila(i + 1, r[0], r[1], r[2])).join("")}
      ${tot("Subtotal gastos de importación", f.subGastos)}
      <tr><td></td><td>Comisión por pago al extranjero (1% sobre el subtotal)</td><td class="et">Pago exterior</td><td class="m">${usd2(d.pagoExt)}</td></tr>
      ${tot("Total gastos de importación", f.totGastos, true)}
    </tbody>
    <thead><tr><th class="n">N°</th><th>Pago de tributos y nacionalización — Aduana Bolivia</th><th class="et">Etapa</th><th class="m">Monto USD</th></tr></thead>
    <tbody>
      ${f.tributos.map((r, i) => fila(i + 1, r[0], r[1], r[2])).join("")}
      ${tot("Subtotal tributos y nacionalización", f.subTrib)}
    </tbody>
    <tbody><tr class="gran"><td></td><td colspan="2">TOTAL VEHÍCULO PUESTO EN SANTA CRUZ (USD)</td><td class="m">${usd2(precio)}</td></tr></tbody>
  </table>
  <table class="det pagos">
    <thead><tr><th class="n">N°</th><th>Plan de pagos — momento del pago</th><th class="et">%</th><th class="m">Monto USD</th></tr></thead>
    <tbody>
      <tr><td class="n">1</td><td>Reserva del vehículo</td><td class="et">50%</td><td class="m">${usd2(pg[0])}</td></tr>
      <tr><td class="n">2</td><td>Chasis listo para cargar</td><td class="et">30%</td><td class="m">${usd2(pg[1])}</td></tr>
      <tr><td class="n">3</td><td>Vehículo en Iquique</td><td class="et">20%</td><td class="m">${usd2(pg[2])}</td></tr>
      <tr class="tot"><td></td><td>Total</td><td class="et">100%</td><td class="m">${usd2(precio)}</td></tr>
    </tbody>
  </table>`;
}

export const CSS_DETALLE = `
.det{width:100%;border-collapse:collapse;font-size:13px;margin-top:14px}
.det th{background:#141414;color:#fff;font:600 11px/1.3 var(--mono, monospace);letter-spacing:.06em;text-transform:uppercase;padding:8px 10px;text-align:left}
.det td{padding:7px 10px;border-bottom:1px solid #e6dfcd;vertical-align:top}
.det .n{width:34px;text-align:center}.det .et{width:120px}.det td.et{color:#5f5d58}.det .m{width:130px;text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap}
.det tr.sub td{background:#f8f5ee;font-weight:600}
.det tr.tot td{background:#f3ead3;font-weight:700}
.det tr.gran td{background:#141414;color:#fff;font-weight:700;font-size:14px;padding:10px}
.det.pagos{margin-top:16px}
@media (max-width:600px){.det{font-size:12px}.det .et{width:auto}.det td,.det th{padding:6px}}
`;
