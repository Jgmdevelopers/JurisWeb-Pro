import {
  readdir,
  readFile,
  writeFile,
} from "node:fs/promises";

import path from "node:path";

const directorios = [
  "areas",
  "consulta",
  "contacto",
  "equipo",
];

const directorioBase = "assets/icons";

const destino =
  "assets/js/iconografia-recursos.js";

const recursos = {};

for (const directorio of directorios) {

  const carpeta = path.join(
    directorioBase,
    directorio
  );

  const archivos = (
    await readdir(carpeta, {
      withFileTypes: true,
    })
  )
    .filter(archivo =>
      archivo.isFile() &&
      /^[a-zA-Z0-9_-]+\.svg$/.test(archivo.name)
    )
    .map(archivo => archivo.name)
    .sort();

  for (const archivo of archivos) {

    const ruta =
      `${directorioBase}/${directorio}/${archivo}`;

    const contenido = (
      await readFile(ruta, "utf8")
    ).trim();

    recursos[ruta] = contenido;
  }
}

const resultado = [
  '"use strict";',
  "",
  "// Archivo generado automaticamente.",
  "// No editar manualmente.",
  "// Ejecutar: npm run generar:iconografia",
  "",
  "window.ICONOGRAFIA_RECURSOS = Object.freeze(",
  JSON.stringify(recursos, null, 2),
  ");",
  "",
].join("\n");

await writeFile(
  destino,
  resultado,
  "utf8"
);

console.log(
  `Iconos generados: ${Object.keys(recursos).length}`
);

console.log(
  `Archivo generado: ${destino}`
);
