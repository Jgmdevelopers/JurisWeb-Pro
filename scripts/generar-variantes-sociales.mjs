import {
  mkdtemp,
  mkdir,
  copyFile,
  readFile,
  writeFile,
  rm,
} from "node:fs/promises";

import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const raiz = process.cwd();

const carpeta = await mkdtemp(
  path.join(tmpdir(), "jurisweb-temas-")
);

const destino = path.resolve(
  raiz,
  "../recursos-originales/jurisweb-pro/portadas-sociales"
);

const recursos = [
  "assets/css/theme.css",
  "assets/js/tema.js",
  "assets/images/branding/logo.svg",
  "config/estudio.js",
];

const temas = [
  "clasico",
  "verde",
  "borgona",
  "grafito",
];

try {

  await mkdir(destino, {
    recursive: true,
  });

  for (const recurso of recursos) {

    const archivo = path.join(
      carpeta,
      recurso
    );

    await mkdir(
      path.dirname(archivo),
      { recursive: true }
    );

    await copyFile(
      path.join(raiz, recurso),
      archivo
    );
  }

  const configuracion = await readFile(
    path.join(raiz, "config/estudio.js"),
    "utf8"
  );

  for (const tema of temas) {

    await writeFile(
      path.join(
        carpeta,
        "config/estudio.js"
      ),

      configuracion +
        "\nwindow.ESTUDIO.tema = " +
        JSON.stringify({
          preestablecido: tema,
          colores: {},
          tipografias: {
            titulos: "georgia",
            cuerpo: "sistema",
          },
        }) +
        ";",

      "utf8"
    );

    const resultado = spawnSync(
      process.execPath,

      [
        path.join(
          raiz,
          "scripts/generar-portada-social.mjs"
        ),
      ],

      {
        cwd: carpeta,
        encoding: "utf8",
        timeout: 60000,
      }
    );

    if (resultado.error) {
      throw resultado.error;
    }

    if (resultado.status !== 0) {
      throw new Error(resultado.stderr);
    }

    await copyFile(
      path.join(
        carpeta,
        "assets/images/branding/social-cover.jpg"
      ),

      path.join(
        destino,
        `social-${tema}.jpg`
      )
    );

    console.log(`Portada ${tema}: OK`);
  }

  console.log(
    "\nPortadas disponibles en:"
  );

  console.log(destino);

} finally {

  await rm(carpeta, {
    recursive: true,
    force: true,
  });
}
