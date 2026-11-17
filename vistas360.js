// Vistas 360° por modelo (visor de Autohome / 汽车之家, pano.autohome.com.cn).
// Clave: "Marca|Modelo" exactamente como está en la hoja Base de Datos del Excel.
// Verificado el 14-nov-2026. BYD Shark 6: no se vende en China, Autohome no tiene vista 360°.
(function () {
  var A = "https://pano.autohome.com.cn/car/";
  function v(ext, int) { return { exterior: ext ? A + "ext/" + ext : null, interior: int ? A + "pano/" + int : null }; }
  window.VASCRUZ_360 = {
    "Deepal|S05":          v(78418, 78418), // 深蓝S05
    "Deepal|S07":          v(79097, 79097), // 深蓝S07
    "BYD|Dolphin Mini":    v(79267, 79267), // 海鸥 (Seagull)
    "Changan|Qiyuan Q05":  v(77546, 74167), // 长安启源Q05
    "AION|UT":             v(78742, 78742), // AION UT
    "AION|i60":            v(79078, 79078), // AION i60
    "BYD|Yuan Up":         v(71684, 71684), // 元UP
    "BYD|Sealion 06 EV":   v(76224, null),  // 海狮06 (solo exterior)
    "BYD|Sealion 07 EV":   v(71693, 71693), // 海狮07 EV
    "Mazda|EZ-60 EV":      v(72678, 72678), // 马自达EZ-60
    "Nissan|NX8":          v(76408, 76408), // 日产NX8
    "Toyota|bZ3X":         v(77656, 77656), // 铂智3X
    "Toyota|BZ5":          v(78978, 78978), // 丰田bZ5 2027款 550 PRO
    "BYD|Leopard 7":       v(76557, 76557)  // 方程豹 钛7
  };
})();
