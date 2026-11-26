import { test } from "node:test";
import assert from "node:assert/strict";

import {
  mkdtemp,
  mkdir,
  readFile,
  writeFile,
  copyFile,
  rm,
} from "node:fs/promises";

import { tmpdir } from "node:os";
import path from "node:path";

import {
  fileURLToPath,
} from "node:url";

import {
  spawnSync,
} from "node:child_process";

import {
  chromium,
} from "@playwright/test";

const raiz = fileURLToPath(
  new URL("../../", import.meta.url)
);

const generador = path.join(
  raiz,
  "scripts/generar-portada-social.mjs"
);

const rutaPortada =
  "assets/images/branding/social-cover.jpg";

const rutaLogo =
  "assets/images/branding/logo.svg";

const recursos = [
  "assets/css/theme.css",
  "assets/js/tema.js",
  rutaLogo,
];

/**
 * Prepara una configuracion institucional aislada.
 */
async function prepararEntorno(
  t,
  cambios = {}
) {

  const carpeta = await mkdtemp(
    path.join(
      tmpdir(),
      "jurisweb-portada-"
    )
  );

  t.after(async () => {

    await rm(carpeta, {
      recursive: true,
      force: true,
    });

  });

  for (const recurso of recursos) {

    const destino = path.join(
      carpeta,
      recurso
    );

    await mkdir(
      path.dirname(destino),
      { recursive: true }
    );

    await copyFile(
      path.join(raiz, recurso),
      destino
    );
  }

  await mkdir(
    path.join(carpeta, "config"),
    { recursive: true }
  );

  const configuracion = {

    nombre: "Estudio Jurídico",

    subtitulo: "Asesoramiento legal",

    ciudad: "Ushuaia, Tierra del Fuego",

    identidad: {
      logo: rutaLogo,
    },

    tema: {

      preestablecido: "clasico",

      colores: {},

      tipografias: {
        titulos: "georgia",
        cuerpo: "sistema",
      },

    },

    seo: {
      portadaSocial: {},
    },

    ...cambios,

  };

  await writeFile(

    path.join(
      carpeta,
      "config/estudio.js"
    ),

    "window.ESTUDIO = " +
      JSON.stringify(configuracion) +
      ";",

    "utf8"

  );

  return carpeta;
}

/**
 * Ejecuta el generador.
 */
async function generar(carpeta) {

  const resultado = spawnSync(

    process.execPath,

    [generador],

    {
      cwd: carpeta,
      encoding: "utf8",
      timeout: 60000,
    }

  );

  if (resultado.error) {
    throw resultado.error;
  }

  assert.equal(
    resultado.status,
    0,
    resultado.stderr
  );

  const imagen = await readFile(
    path.join(carpeta, rutaPortada)
  );

  return {
    imagen,
    salida: resultado.stdout,
  };
}

/**
 * Comprueba las dimensiones reales del JPG.
 */
async function obtenerDimensiones(imagen) {

  const navegador = await chromium.launch({
    headless: true,
  });

  try {

    const pagina = await navegador.newPage();

    return await pagina.evaluate(
      async contenido => {

        const imagen = new Image();

        imagen.src = contenido;

        await imagen.decode();

        return {

          ancho: imagen.naturalWidth,

          alto: imagen.naturalHeight,

        };

      },

      "data:image/jpeg;base64," +
        imagen.toString("base64")
    );

  } finally {

    await navegador.close();

  }
}

/**
 * Verifica el formato basico del JPG.
 */
function comprobarJpg(imagen) {

  assert.ok(imagen.length > 0);

  assert.equal(imagen[0], 0xff);

  assert.equal(imagen[1], 0xd8);

  assert.equal(
    imagen[imagen.length - 2],
    0xff
  );

  assert.equal(
    imagen[imagen.length - 1],
    0xd9
  );
}

test("genera una portada JPG valida", async t => {

  const carpeta =
    await prepararEntorno(t);

  const resultado =
    await generar(carpeta);

  comprobarJpg(resultado.imagen);

  assert.match(
    resultado.salida,
    /Portada social generada correctamente/
  );

  assert.match(
    resultado.salida,
    /Modo: demostracion/
  );
});

test("genera una imagen de 1200 por 630 pixeles", async t => {

  const carpeta =
    await prepararEntorno(t);

  const { imagen } =
    await generar(carpeta);

  const dimensiones =
    await obtenerDimensiones(imagen);

  assert.deepEqual(
    dimensiones,
    {
      ancho: 1200,
      alto: 630,
    }
  );
});

test("respeta el limite de peso de 300 KB", async t => {

  const carpeta =
    await prepararEntorno(t);

  const { imagen } =
    await generar(carpeta);

  assert.ok(
    imagen.length <= 300 * 1024
  );
});

const temas = [

  {
    nombre: "clasico",
    principal: "#101e30",
    acento: "#b99a60",
  },

  {
    nombre: "verde",
    principal: "#172f29",
    acento: "#c3a979",
  },

  {
    nombre: "borgona",
    principal: "#38202b",
    acento: "#c5a477",
  },

  {
    nombre: "grafito",
    principal: "#202328",
    acento: "#b6c3ce",
  },

];

for (const tema of temas) {

  test(
    `genera la portada con el tema ${tema.nombre}`,
    async t => {

      const carpeta =
        await prepararEntorno(t, {

          tema: {
            preestablecido: tema.nombre,
          },

        });

      const resultado =
        await generar(carpeta);

      comprobarJpg(resultado.imagen);

      assert.ok(
        resultado.salida.includes(
          `Tema: ${tema.nombre}`
        )
      );

      assert.ok(
        resultado.salida.includes(
          `Color principal: ${tema.principal}`
        )
      );

      assert.ok(
        resultado.salida.includes(
          `Color de acento: ${tema.acento}`
        )
      );
    }
  );
}

test("aplica colores corporativos personalizados", async t => {

  const carpeta =
    await prepararEntorno(t, {

      tema: {

        preestablecido: "clasico",

        colores: {
          principal: "#102030",
          acento: "#c6a46b",
        },

      },

    });

  const resultado =
    await generar(carpeta);

  assert.match(
    resultado.salida,
    /Color principal: #102030/
  );

  assert.match(
    resultado.salida,
    /Color de acento: #c6a46b/
  );

  comprobarJpg(resultado.imagen);
});

test("recupera el tema base ante contrastes invalidos", async t => {

  const carpeta =
    await prepararEntorno(t, {

      tema: {

        preestablecido: "verde",

        colores: {
          principal: "#ffffff",
        },

      },

    });

  const resultado =
    await generar(carpeta);

  assert.match(
    resultado.salida,
    /Tema: verde/
  );

  assert.match(
    resultado.salida,
    /Color principal: #172f29/
  );
});

test("la personalizacion institucional modifica la portada", async t => {

  const original =
    await prepararEntorno(t);

  const personalizado =
    await prepararEntorno(t, {

      nombre: "Estudio Jurídico Ejemplo",

      subtitulo: "Consultoría jurídica",

      ciudad: "Buenos Aires, Argentina",

    });

  const imagenOriginal =
    await generar(original);

  const imagenPersonalizada =
    await generar(personalizado);

  comprobarJpg(
    imagenPersonalizada.imagen
  );

  assert.equal(

    imagenOriginal.imagen.equals(
      imagenPersonalizada.imagen
    ),

    false

  );
});

test("adapta nombres institucionales extensos", async t => {

  const carpeta =
    await prepararEntorno(t, {

      nombre:
        "Estudio Jurídico Integral de Asesoramiento Profesional y Consultoría Institucional",

      subtitulo:
        "Atención personalizada para personas, familias y organizaciones",

    });

  const { imagen } =
    await generar(carpeta);

  comprobarJpg(imagen);

  assert.deepEqual(

    await obtenerDimensiones(imagen),

    {
      ancho: 1200,
      alto: 630,
    }

  );
});

test("utiliza un logotipo institucional personalizado", async t => {

  const rutaPersonalizada =
    "assets/images/branding/logo-cliente.svg";

  const carpeta =
    await prepararEntorno(t, {

      identidad: {
        logo: rutaPersonalizada,
      },

    });

  await writeFile(

    path.join(
      carpeta,
      rutaPersonalizada
    ),

    `<svg xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100">
      <rect width="100" height="100"
        fill="#172f29"/>
      <circle cx="50" cy="50" r="30"
        fill="#c3a979"/>
    </svg>`,

    "utf8"

  );

  const resultado =
    await generar(carpeta);

  assert.ok(

    resultado.salida.includes(
      `Logotipo: ${rutaPersonalizada}`
    )

  );

  comprobarJpg(resultado.imagen);
});

test("recupera el logotipo alternativo si el configurado no existe", async t => {

  const carpeta =
    await prepararEntorno(t, {

      identidad: {
        logo:
          "assets/images/branding/inexistente.svg",
      },

    });

  const resultado =
    await generar(carpeta);

  assert.ok(

    resultado.salida.includes(
      `Logotipo: ${rutaLogo}`
    )

  );
});

test("recupera el logotipo alternativo ante un archivo corrupto", async t => {

  const rutaCorrupta =
    "assets/images/branding/corrupto.svg";

  const carpeta =
    await prepararEntorno(t, {

      identidad: {
        logo: rutaCorrupta,
      },

    });

  await writeFile(

    path.join(
      carpeta,
      rutaCorrupta
    ),

    "Contenido que no representa una imagen",

    "utf8"

  );

  const resultado =
    await generar(carpeta);

  assert.ok(

    resultado.salida.includes(
      `Logotipo: ${rutaLogo}`
    )

  );
});

test("rechaza rutas de logotipos no autorizadas", async t => {

  const carpeta =
    await prepararEntorno(t, {

      identidad: {

        logo:
          "assets/images/../../fuera.svg",

      },

    });

  const resultado =
    await generar(carpeta);

  assert.ok(

    resultado.salida.includes(
      `Logotipo: ${rutaLogo}`
    )

  );
});

test("admite textos con caracteres HTML sin interrumpir la generacion", async t => {

  const carpeta =
    await prepararEntorno(t, {

      seo: {

        portadaSocial: {

          nombre:
            "<b>Estudio Jurídico</b>",

          subtitulo:
            "Asesoramiento & Consultoría",

          ubicacion:
            "<script>alert(1)</script>",

        },

      },

    });

  const resultado =
    await generar(carpeta);

  comprobarJpg(resultado.imagen);

  assert.deepEqual(

    await obtenerDimensiones(
      resultado.imagen
    ),

    {
      ancho: 1200,
      alto: 630,
    }

  );
});
