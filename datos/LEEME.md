# Datos de fichas técnicas

- `autohome_fichas.json`: datos originales de Autohome (汽车之家) por versión (`fichas`, clave = ID del Excel) y fotos por modelo (`imagenes`). Descargado el 14-nov-2026.
- `gen_fichas.py`: traduce al español y genera `../fichas.js`:
  `python3 datos/gen_fichas.py fichas.json imagenes.json catalogo.js fichas.js`
- `fichas.js` se busca por la clave `Marca|Modelo|Versión|Año` del Excel. Si cambia el nombre de una versión en el Excel, hay que regenerar.
