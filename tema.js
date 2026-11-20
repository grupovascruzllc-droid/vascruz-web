/* VASCRUZ · Tema claro / oscuro compartido (mismo funcionamiento que la portada).
   Se carga en el <head>: aplica el tema guardado antes de pintar la página
   y, cuando la página está lista, pone el botón redondo en la cabecera. */
(function () {
  var root = document.documentElement;
  try { var t = localStorage.getItem("tema"); if (t === "light" || t === "dark") root.dataset.theme = t; } catch (e) {}
  if (root.classList.contains("solo-claro")) return; // documentos para imprimir: siempre claros

  var ico = {
    auto: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 3a9 9 0 0 0 0 18z" fill="currentColor"/></svg>',
    light: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
    dark: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>'
  };
  var nombre = { auto: "Tema automático (según su dispositivo)", light: "Tema claro", dark: "Tema oscuro" };
  function actual() { return root.dataset.theme || "auto"; }

  function poner() {
    var nav = document.querySelector("header .nav");
    if (!nav || document.getElementById("tema")) return;
    var b = document.createElement("button");
    b.type = "button"; b.className = "tema"; b.id = "tema";
    var pintar = function () { var t = actual(); b.innerHTML = ico[t]; b.title = nombre[t] + " · pulse para cambiar"; b.setAttribute("aria-label", b.title); };
    b.addEventListener("click", function () {
      var sig = { auto: "light", light: "dark", dark: "auto" }[actual()];
      if (sig === "auto") delete root.dataset.theme; else root.dataset.theme = sig;
      try { sig === "auto" ? localStorage.removeItem("tema") : localStorage.setItem("tema", sig); } catch (e) {}
      pintar();
    });
    pintar();
    // Lo pone a la derecha, junto a los botones o datos de usuario que ya haya
    var der = document.createElement("div"); der.className = "nav-der";
    var ultimo = nav.lastElementChild;
    if (ultimo && ultimo !== nav.firstElementChild) { nav.insertBefore(der, ultimo); der.appendChild(b); der.appendChild(ultimo); }
    else { der.appendChild(b); nav.appendChild(der); }
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", poner); else poner();
})();
