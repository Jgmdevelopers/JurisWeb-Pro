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

import { fileURLToPath } from "node:url";

import { spawnSync } from "node:child_process";

const raiz = fileURLToPath(
  new URL("../../", import.meta.url)
);

const generador = path.join(
  raiz,
  "scripts/generar-seo.mjs"
);

const documentos = [
  "index.html",
  "privacidad.html",
  "aviso-legal.html",
];

/**
 * Prepara un entorno aislado para cada prueba.
 */
async function prepararEntorno(t, seo = {}) {

  const carpeta = await mkdtemp(
    path.join(tmpdir(), "jurisweb-seo-")
  );

  t.after(async () => {

    await rm(carpeta, {
      recursive: true,
      force: true,
    });
  });

  await mkdir(
    path.join(carpeta, "config")
  );

  for (const archivo of documentos) {

    await copyFile(
      path.join(raiz, archivo),
      path.join(carpeta, archivo)
    );
  }

  const configuracion = {
    nombre: "Estudio Jurídico de Prueba",
    seo,
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
 * Ejecuta el generador en un entorno aislado.
 */
function ejecutar(carpeta, ...argumentos) {

  const resultado = spawnSync(
    process.execPath,

    [generador, ...argumentos],

    {
      cwd: carpeta,
      encoding: "utf8",
      timeout: 10000,
    }
  );

  if (resultado.error) {
    throw resultado.error;
  }

  return resultado;
}

/**
 * Comprueba una ejecucion exitosa.
 */
function generar(carpeta) {

  const resultado = ejecutar(carpeta);

  assert.equal(
    resultado.status,
    0,
    resultado.stderr
  );

  return resultado;
}

async function leer(carpeta, archivo) {

  return readFile(
    path.join(carpeta, archivo),
    "utf8"
  );
}

test("genera metadatos en los tres documentos", async t => {

  const carpeta = await prepararEntorno(t);

  generar(carpeta);

  for (const archivo of documentos) {

    const html = await leer(carpeta, archivo);

    assert.match(html, /<!-- SEO:INICIO -->/);

    assert.match(html, /<!-- SEO:FIN -->/);

    assert.match(html, /<title>.+<\/title>/);

    assert.match(
      html,
      /name="description"/
    );

    assert.match(
      html,
      /property="og:title"/
    );

    assert.match(
      html,
      /name="twitter:card"/
    );
  }
});

test("personaliza los metadatos de la pagina principal", async t => {

  const carpeta = await prepararEntorno(t, {

    titulo: "Estudio Jurídico Personalizado",

    descripcion: "Asesoramiento profesional.",

    openGraph: {
      titulo: "Conocé nuestro estudio",
      descripcion: "Atención jurídica personalizada.",
      nombreSitio: "Estudio Personalizado",
    },

  });

  generar(carpeta);

  const html = await leer(
    carpeta,
    "index.html"
  );

  assert.ok(
    html.includes(
      "<title>Estudio Jurídico Personalizado</title>"
    )
  );

  assert.ok(
    html.includes(
      'name="description" content="Asesoramiento profesional."'
    )
  );

  assert.ok(
    html.includes(
      'property="og:title" content="Conocé nuestro estudio"'
    )
  );

  assert.ok(
    html.includes(
      'property="og:site_name" content="Estudio Personalizado"'
    )
  );
});

test("personaliza las paginas legales independientemente", async t => {

  const carpeta = await prepararEntorno(t, {

    titulo: "Pagina principal",

    paginas: {

      privacidad: {
        titulo: "Privacidad institucional",
        descripcion: "Descripcion de privacidad.",
      },

      avisoLegal: {
        titulo: "Condiciones legales",
        descripcion: "Descripcion del aviso legal.",
      },

    },
  });

  generar(carpeta);

  const privacidad = await leer(
    carpeta,
    "privacidad.html"
  );

  const aviso = await leer(
    carpeta,
    "aviso-legal.html"
  );

  assert.ok(
    privacidad.includes(
      "<title>Privacidad institucional</title>"
    )
  );

  assert.ok(
    privacidad.includes(
      'name="description" content="Descripcion de privacidad."'
    )
  );

  assert.ok(
    aviso.includes(
      "<title>Condiciones legales</title>"
    )
  );

  assert.ok(
    aviso.includes(
      'name="description" content="Descripcion del aviso legal."'
    )
  );
});

test("genera URL canonicas bajo un subdirectorio", async t => {

  const carpeta = await prepararEntorno(t, {

    urlCanonica:
      "https://ejemplo.example/estudio",

  });

  generar(carpeta);

  const esperados = {

    "index.html":
      "https://ejemplo.example/estudio/",

    "privacidad.html":
      "https://ejemplo.example/estudio/privacidad.html",

    "aviso-legal.html":
      "https://ejemplo.example/estudio/aviso-legal.html",

  };

  for (const archivo of documentos) {

    const html = await leer(carpeta, archivo);

    assert.ok(
      html.includes(
        `rel="canonical" href="${esperados[archivo]}"`
      )
    );

    assert.ok(
      html.includes(
        `property="og:url" content="${esperados[archivo]}"`
      )
    );
  }
});

test("genera las URL de una imagen social local", async t => {

  const carpeta = await prepararEntorno(t, {

    urlCanonica:
      "https://ejemplo.example/estudio/",

    imagenSocial:
      "assets/images/branding/social-cover.jpg",

    imagenSocialAlt:
      "Identidad grafica institucional",

  });

  generar(carpeta);

  const html = await leer(
    carpeta,
    "index.html"
  );

  const imagen =
    "https://ejemplo.example/estudio/assets/images/branding/social-cover.jpg";

  assert.ok(
    html.includes(
      `property="og:image" content="${imagen}"`
    )
  );

  assert.ok(
    html.includes(
      `name="twitter:image" content="${imagen}"`
    )
  );

  assert.ok(
    html.includes(
      'name="twitter:card" content="summary_large_image"'
    )
  );

  assert.ok(
    html.includes(
      'property="og:image:alt" content="Identidad grafica institucional"'
    )
  );
});

test("admite una imagen social HTTPS absoluta", async t => {

  const imagen =
    "https://ejemplo.example/portada.png";

  const carpeta = await prepararEntorno(t, {

    imagenSocial: imagen,

    twitter: {
      tarjeta: "summary",
    },

  });

  generar(carpeta);

  const html = await leer(
    carpeta,
    "index.html"
  );

  assert.ok(
    html.includes(
      `property="og:image" content="${imagen}"`
    )
  );

  assert.ok(
    html.includes(
      'name="twitter:card" content="summary"'
    )
  );
});

test("omite URL invalidas o inseguras", async t => {

  const valores = [
    "javascript:alert(1)",
    "http://ejemplo.example",
    "https://usuario:clave@ejemplo.example/",
    "https://ejemplo.example/?consulta=1",
    "https://ejemplo.example/#inicio",
  ];

  for (const valor of valores) {

    const carpeta = await prepararEntorno(t, {

      urlCanonica: valor,

      imagenSocial:
        "javascript:alert(1)",

    });

    generar(carpeta);

    const html = await leer(
      carpeta,
      "index.html"
    );

    assert.doesNotMatch(
      html,
      /rel="canonical"/
    );

    assert.doesNotMatch(
      html,
      /property="og:url"/
    );

    assert.doesNotMatch(
      html,
      /property="og:image"/
    );
  }
});

test("rechaza rutas sociales fuera del directorio autorizado", async t => {

  const carpeta = await prepararEntorno(t, {

    urlCanonica:
      "https://ejemplo.example/",

    imagenSocial:
      "assets/images/../../archivo.png",

  });

  generar(carpeta);

  const html = await leer(
    carpeta,
    "index.html"
  );

  assert.doesNotMatch(
    html,
    /property="og:image"/
  );
});

test("escapa caracteres HTML en titulos y atributos", async t => {

  const carpeta = await prepararEntorno(t, {

    titulo:
      '<script>alert("SEO")</script>',

    descripcion:
      '" onload="alert(1)" & contenido',

  });

  generar(carpeta);

  const html = await leer(
    carpeta,
    "index.html"
  );

  assert.ok(
    html.includes(
      "&lt;script&gt;alert(&quot;SEO&quot;)&lt;/script&gt;"
    )
  );

  assert.ok(
    html.includes(
      "&quot; onload=&quot;alert(1)&quot; &amp; contenido"
    )
  );

  assert.doesNotMatch(
    html,
    /<script>alert\("SEO"\)<\/script>/
  );
});

test("utiliza valores alternativos ante configuraciones invalidas", async t => {

  const carpeta = await prepararEntorno(t, {

    titulo: null,

    descripcion: "A".repeat(501),

    idioma: "idioma invalido",

    openGraph: {
      tipo: "desconocido",
    },

  });

  generar(carpeta);

  const html = await leer(
    carpeta,
    "index.html"
  );

  assert.ok(
    html.includes(
      'lang="es-AR"'
    )
  );

  assert.ok(
    html.includes(
      "<title>Estudio Jurídico de Prueba | Demostración</title>"
    )
  );

  assert.ok(
    html.includes(
      'property="og:type" content="website"'
    )
  );

  assert.ok(
    html.includes(
      'name="twitter:card" content="summary"'
    )
  );
});

test("mantiene bloqueada la indexacion", async t => {

  const carpeta = await prepararEntorno(t, {

    robots: "index,follow",

    indexacionPermitida: true,

  });

  generar(carpeta);

  for (const archivo of documentos) {

    const html = await leer(carpeta, archivo);

    const robots = [
      ...html.matchAll(
        /<meta name="robots" content="([^"]+)"\s*\/?>/g
      ),
    ];

    assert.equal(robots.length, 1);

    assert.equal(
      robots[0][1],
      "noindex,nofollow"
    );
  }
});

test("mantiene charset y viewport antes del bloque SEO", async t => {

  const carpeta = await prepararEntorno(t, {

    titulo: "A".repeat(150),

    descripcion: "B".repeat(500),

  });

  generar(carpeta);

  for (const archivo of documentos) {

    const html = await leer(carpeta, archivo);

    const charset =
      html.indexOf('<meta charset="utf-8"');

    const viewport =
      html.indexOf('<meta name="viewport"');

    const bloque =
      html.indexOf("<!-- SEO:INICIO -->");

    assert.ok(charset >= 0);

    assert.ok(viewport > charset);

    assert.ok(bloque > viewport);

    const finCharset =
      html.indexOf(">", charset) + 1;

    assert.ok(
      Buffer.byteLength(
        html.slice(0, finCharset),
        "utf8"
      ) <= 1024
    );
  }
});

test("preserva el contenido del body y las referencias existentes", async t => {

  const carpeta = await prepararEntorno(t);

  const originales = {};

  for (const archivo of documentos) {

    originales[archivo] =
      await leer(carpeta, archivo);
  }

  generar(carpeta);

  const extraerBody = html =>
    html.match(
      /<body\b[\s\S]*<\/body>/i
    )?.[0].replace(/\r\n/g, "\n");

  const extraerReferencias = html =>
    html.match(
      /<script\b[^>]*\bsrc=[^>]*>|<link\b(?=[^>]*\brel="(?:stylesheet|icon)")[^>]*>/gi
    ) || [];

  for (const archivo of documentos) {

    const html = await leer(carpeta, archivo);

    const original = originales[archivo]
      .replace(/\r\n/g, "\n");

    assert.ok(extraerBody(original));

    assert.equal(
      extraerBody(html),
      extraerBody(original)
    );

    assert.deepEqual(
      extraerReferencias(html),
      extraerReferencias(original)
    );
  }
});

test("la generacion es idempotente y no duplica metadatos", async t => {

  const carpeta = await prepararEntorno(t);

  generar(carpeta);

  const originales = {};

  for (const archivo of documentos) {

    originales[archivo] =
      await leer(carpeta, archivo);
  }

  const segunda = generar(carpeta);

  assert.match(
    segunda.stdout,
    /Documentos con cambios: 0/
  );

  for (const archivo of documentos) {

    const html = await leer(carpeta, archivo);

    assert.equal(
      html,
      originales[archivo]
    );

    assert.equal(
      [...html.matchAll(/<title>/g)].length,
      1
    );

    assert.equal(
      [...html.matchAll(/<!-- SEO:INICIO -->/g)].length,
      1
    );
  }
});

test("el modo check detecta cambios sin modificar documentos", async t => {

  const carpeta = await prepararEntorno(t, {

    titulo:
      "Titulo de prueba pendiente de sincronizacion",

  });

  const originales = {};

  for (const archivo of documentos) {

    originales[archivo] =
      await leer(carpeta, archivo);
  }

  const pendiente = ejecutar(
    carpeta,
    "--check"
  );

  assert.equal(pendiente.status, 1);

  for (const archivo of documentos) {

    assert.equal(
      await leer(carpeta, archivo),
      originales[archivo]
    );
  }

  generar(carpeta);

  const sincronizado = ejecutar(
    carpeta,
    "--check"
  );

  assert.equal(
    sincronizado.status,
    0,
    sincronizado.stderr
  );

  assert.match(
    sincronizado.stdout,
    /Metadatos sincronizados/
  );
});

test("rechaza bloques SEO incompletos sin modificar documentos", async t => {

  const carpeta = await prepararEntorno(t);

  const ruta = path.join(
    carpeta,
    "aviso-legal.html"
  );

  const html = await leer(
    carpeta,
    "aviso-legal.html"
  );

  await writeFile(
    ruta,
    html.replace("<!-- SEO:FIN -->", ""),
    "utf8"
  );

  const originales = {};

  for (const archivo of documentos) {

    originales[archivo] =
      await leer(carpeta, archivo);
  }

  const resultado = ejecutar(carpeta);

  assert.equal(resultado.status, 1);

  assert.match(
    resultado.stderr,
    /Bloque SEO incompleto/
  );

  for (const archivo of documentos) {

    assert.equal(
      await leer(carpeta, archivo),
      originales[archivo]
    );
  }
});
