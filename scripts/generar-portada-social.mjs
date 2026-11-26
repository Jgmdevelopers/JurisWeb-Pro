import {
  readFile,
  writeFile,
  mkdir,
} from "node:fs/promises";

import path from "node:path";

import vm from "node:vm";

import { chromium } from "@playwright/test";

/* =========================================
   JURISWEB PRO - PORTADA SOCIAL
   GM.DEV
   ========================================= */

const ancho = 1200;
const alto = 630;

const pesoMaximo = 300 * 1024;

const rutaSalida =
  "assets/images/branding/social-cover.jpg";

const rutaLogoAlternativo =
  "assets/images/branding/logo.svg";

/**
 * Carga la configuracion institucional local.
 */
async function cargarConfiguracion() {

  const contenido = await readFile(
    "config/estudio.js",
    "utf8"
  );

  const contexto = {
    window: {},
  };

  vm.runInNewContext(
    contenido,
    contexto,
    {
      filename: "config/estudio.js",
      timeout: 1000,
    }
  );

  return contexto.window.ESTUDIO || {};
}

/**
 * Normaliza textos institucionales.
 */
function normalizarTexto(
  valor,
  alternativo = "",
  longitudMaxima = 120
) {

  if (typeof valor !== "string") {
    return alternativo;
  }

  const texto = valor
    .replace(/\s+/g, " ")
    .trim();

  if (
    !texto ||
    texto.length > longitudMaxima
  ) {
    return alternativo;
  }

  return texto;
}

/**
 * Obtiene los textos de la portada.
 */
function obtenerTextos(estudio) {

  const portada =
    estudio.seo?.portadaSocial || {};

  return {

    nombre: normalizarTexto(
      portada.nombre,
      normalizarTexto(
        estudio.nombre,
        "Estudio Jurídico"
      )
    ),

    subtitulo: normalizarTexto(
      portada.subtitulo,
      normalizarTexto(
        estudio.subtitulo,
        "Asesoramiento legal"
      )
    ),

    ubicacion: normalizarTexto(
      portada.ubicacion,
      normalizarTexto(
        estudio.ciudad,
        ""
      )
    ),

    demostracion: "MODELO DEMOSTRATIVO",

  };
}

/**
 * Valida rutas locales de imagenes.
 */
function validarRutaLogo(valor) {

  return (
    typeof valor === "string" &&
    /^assets\/images\/(?:[a-zA-Z0-9_-]+\/)*[a-zA-Z0-9_-]+\.(svg|png|jpg|jpeg|webp)$/i.test(valor)
  );
}

/**
 * Convierte una imagen local a una Data URI.
 */
async function cargarLogo(ruta) {

  const extension =
    path.extname(ruta).toLowerCase();

  const tipos = {
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".webp": "image/webp",
  };

  const tipo = tipos[extension];

  if (!tipo) {
    throw new Error(
      "Formato de logotipo no autorizado."
    );
  }

  const contenido = await readFile(ruta);

  if (!contenido.length) {
    throw new Error(
      "El logotipo esta vacio."
    );
  }

  if (contenido.length > 5 * 1024 * 1024) {

    throw new Error(
      "El logotipo supera el limite de 5 MB."
    );
  }

  return (
    `data:${tipo};base64,` +
    contenido.toString("base64")
  );
}

/**
 * Obtiene el logotipo configurado y su alternativa.
 */
async function obtenerLogo(estudio) {

  const solicitado =
    estudio.identidad?.logo;

  const rutas = [
    solicitado,
    rutaLogoAlternativo,
  ];

  const candidatos = [];

  for (const ruta of new Set(rutas)) {

    if (!validarRutaLogo(ruta)) {
      continue;
    }

    try {

      candidatos.push({
        ruta,
        contenido: await cargarLogo(ruta),
      });

    } catch {

      // Intentar con el siguiente candidato.

    }
  }

  if (!candidatos.length) {

    throw new Error(
      "No se encontro un logotipo valido."
    );
  }

  return candidatos;
}

/**
 * Construye la estructura de la portada.
 */
async function construirHtml() {

  const temaCss = await readFile(
    "assets/css/theme.css",
    "utf8"
  );

  return `<!doctype html>

<html lang="es-AR">

<head>

<meta charset="utf-8">

<style>

${temaCss}

* {
  box-sizing: border-box;
}

html,
body {
  width: ${ancho}px;
  height: ${alto}px;
  margin: 0;
  overflow: hidden;
}

body {

  color: var(--texto-inverso);

  font-family: var(--fuente-cuerpo);

  background:
    linear-gradient(
      135deg,
      var(--navy),
      var(--blue)
    );
}

.portada {

  position: relative;

  width: 100%;
  height: 100%;

  padding: 58px 100px 48px;

  display: grid;

  grid-template-rows:
    160px
    150px
    12px
    76px
    1fr
    32px;

  align-items: center;
  justify-items: center;

  text-align: center;

}

.portada::before,
.portada::after {

  content: "";

  position: absolute;

  pointer-events: none;

}

.portada::before {

  inset: 30px;

  border: 1px solid var(--gold);

}

.portada::after {

  inset: 42px;

  border: 1px solid var(--acento-claro);

  opacity: .25;

}

.logotipo {

  width: 145px;
  height: 145px;

  display: block;

  object-fit: contain;

}

.nombre {

  width: 100%;

  max-height: 150px;

  color: var(--white);

  font-family: var(--fuente-titulos);

  font-size: 70px;

  font-weight: 400;

  line-height: 1.1;

  overflow-wrap: anywhere;

}

.separador {

  width: 160px;

  height: 2px;

  background: var(--gold);

}

.subtitulo {

  width: 100%;

  color: var(--acento-claro);

  font-size: 30px;

  line-height: 1.2;

  letter-spacing: .09em;

  overflow-wrap: anywhere;

}

.ubicacion {

  width: 100%;

  color: var(--white);

  font-size: 25px;

  line-height: 1.2;

  overflow-wrap: anywhere;

}

.demostracion {

  color: var(--acento-claro);

  font-size: 18px;

  letter-spacing: .12em;

}

</style>

</head>

<body>

<main class="portada">

  <img
    class="logotipo"
    id="logotipo"
    alt=""
  >

  <div
    class="nombre"
    id="nombre"
  ></div>

  <div
    class="separador"
    aria-hidden="true"
  ></div>

  <div
    class="subtitulo"
    id="subtitulo"
  ></div>

  <div
    class="ubicacion"
    id="ubicacion"
  ></div>

  <div
    class="demostracion"
    id="demostracion"
  ></div>

</main>

</body>

</html>`;
}

/**
 * Genera la portada institucional.
 */
async function generarPortada() {

  const estudio =
    await cargarConfiguracion();

  const textos =
    obtenerTextos(estudio);

  const candidatos =
    await obtenerLogo(estudio);

  const html =
    await construirHtml();

  const motorTema = await readFile(
    "assets/js/tema.js",
    "utf8"
  );

  const navegador = await chromium.launch({
    headless: true,
  });

  try {

    const pagina = await navegador.newPage({

      viewport: {
        width: ancho,
        height: alto,
      },

      deviceScaleFactor: 1,

      locale: "es-AR",

      reducedMotion: "reduce",

    });

    // No permitir solicitudes a servicios externos.

    await pagina.route(
      /^https?:\/\//,
      ruta => ruta.abort()
    );

    await pagina.setContent(html);

    // Reutilizar el motor de temas original.

    await pagina.evaluate(tema => {

      window.ESTUDIO = {
        tema,
      };

    }, JSON.parse(
      JSON.stringify(estudio.tema || {})
    ));

    await pagina.addScriptTag({
      content: motorTema,
    });

    // Insertar textos sin interpretar HTML.

    await pagina.evaluate(datos => {

      for (
        const [id, texto]
        of Object.entries(datos)
      ) {

        document.getElementById(id)
          .textContent = texto;

      }

    }, textos);

    // Comprobar que el logotipo pueda decodificarse.

    let logoAplicado = "";

    for (const candidato of candidatos) {

      const valido = await pagina.evaluate(
        async contenido => {

          const imagen =
            document.getElementById("logotipo");

          imagen.src = contenido;

          try {

            await imagen.decode();

            return imagen.naturalWidth > 0 &&
              imagen.naturalHeight > 0;

          } catch {

            return false;

          }

        },
        candidato.contenido
      );

      if (valido) {

        logoAplicado = candidato.ruta;

        break;

      }
    }

    if (!logoAplicado) {

      throw new Error(
        "No fue posible decodificar el logotipo."
      );
    }

    await pagina.evaluate(async () => {

      await document.fonts.ready;

      function ajustarTexto(
        id,
        tamanoMaximo,
        tamanoMinimo,
        alturaMaxima
      ) {

        const elemento =
          document.getElementById(id);

        let tamano = tamanoMaximo;

        elemento.style.fontSize =
          `${tamano}px`;

        while (

          (
            elemento.scrollHeight > alturaMaxima ||
            elemento.scrollWidth > elemento.clientWidth
          ) &&

          tamano > tamanoMinimo

        ) {

          tamano--;

          elemento.style.fontSize =
            `${tamano}px`;

        }

        if (
          elemento.scrollHeight > alturaMaxima ||
          elemento.scrollWidth > elemento.clientWidth
        ) {

          throw new Error(
            `El campo ${id} no cabe en la portada.`
          );
        }
      }

      ajustarTexto(
        "nombre",
        70,
        28,
        150
      );

      ajustarTexto(
        "subtitulo",
        30,
        16,
        76
      );

      ajustarTexto(
        "ubicacion",
        25,
        14,
        60
      );

    });

    const datosTema =
      await pagina.evaluate(() => {

        const raiz =
          document.documentElement;

        const estilos =
          getComputedStyle(raiz);

        return {

          tema: raiz.dataset.tema,

          principal:
            estilos.getPropertyValue("--navy").trim(),

          acento:
            estilos.getPropertyValue("--gold").trim(),

        };
      });

    // Reducir la calidad solo si resulta necesario.

    let imagen;

    let calidad = 92;

    while (calidad >= 60) {

      imagen = await pagina.screenshot({

        type: "jpeg",

        quality: calidad,

        animations: "disabled",

        scale: "css",

      });

      if (imagen.length <= pesoMaximo) {
        break;
      }

      calidad -= 5;

    }

    if (
      !imagen ||
      imagen.length > pesoMaximo
    ) {

      throw new Error(
        "La portada supera el peso maximo permitido."
      );
    }

    await mkdir(
      path.dirname(rutaSalida),
      {
        recursive: true,
      }
    );

    await writeFile(
      rutaSalida,
      imagen
    );

    console.log(
      "\nPortada social generada correctamente."
    );

    console.log(
      `Archivo: ${rutaSalida}`
    );

    console.log(
      `Resolucion: ${ancho} x ${alto}`
    );

    console.log(
      `Peso: ${(imagen.length / 1024).toFixed(2)} KB`
    );

    console.log(
      `Calidad JPG: ${calidad}`
    );

    console.log(
      `Tema: ${datosTema.tema}`
    );

    console.log(
      `Color principal: ${datosTema.principal}`
    );

    console.log(
      `Color de acento: ${datosTema.acento}`
    );

    console.log(
      `Logotipo: ${logoAplicado}`
    );

    console.log(
      "Modo: demostracion"
    );

  } finally {

    await navegador.close();

  }
}

generarPortada().catch(error => {

  console.error(
    "Error al generar la portada:",
    error.message
  );

  process.exitCode = 1;

});
