import {
  readFile,
  writeFile,
} from "node:fs/promises";

import vm from "node:vm";

/* =========================================
   JURISWEB PRO - GENERADOR SEO
   GM.DEV
   ========================================= */

const inicioBloque = "<!-- SEO:INICIO -->";

const finBloque = "<!-- SEO:FIN -->";

const modoComprobacion =
  process.argv.includes("--check");

/**
 * Carga la configuracion local de confianza.
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
 * Normaliza textos y conserva valores alternativos.
 */
function normalizarTexto(
  valor,
  alternativo = "",
  longitudMaxima = 500
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
 * Escapa texto para contenido y atributos HTML.
 */
function escaparHtml(valor) {

  const caracteres = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  };

  return String(valor).replace(
    /[&<>"']/g,
    caracter => caracteres[caracter]
  );
}

/**
 * Valida una URL HTTPS absoluta.
 */
function validarUrlHttps(valor) {

  if (
    typeof valor !== "string" ||
    !valor.trim()
  ) {
    return "";
  }

  try {

    const url = new URL(valor.trim());

    if (
      url.protocol !== "https:" ||
      url.username ||
      url.password
    ) {
      return "";
    }

    return url.href;

  } catch {

    return "";
  }
}

/**
 * Valida la URL base de publicacion.
 */
function obtenerUrlBase(valor) {

  const validada = validarUrlHttps(valor);

  if (!validada) {
    return "";
  }

  const url = new URL(validada);

  if (url.search || url.hash) {
    return "";
  }

  // Permite publicar bajo un subdirectorio,
  // por ejemplo mediante GitHub Pages.

  if (!url.pathname.endsWith("/")) {
    url.pathname += "/";
  }

  return url.href;
}

/**
 * Genera las URL de las paginas institucionales.
 */
function obtenerUrlPagina(base, archivo) {

  if (!base) {
    return "";
  }

  if (archivo === "index.html") {
    return base;
  }

  return new URL(archivo, base).href;
}

/**
 * Admite imagenes sociales locales o HTTPS.
 */
function obtenerImagenSocial(valor, base) {

  if (
    typeof valor !== "string" ||
    !valor.trim()
  ) {
    return "";
  }

  const ruta = valor.trim();

  const absoluta = validarUrlHttps(ruta);

  if (absoluta) {

    const url = new URL(absoluta);

    return /\.(jpg|jpeg|png|webp)$/i.test(
      url.pathname
    )
      ? absoluta
      : "";
  }

  if (
    !base ||
    !/^assets\/images\/(?:[a-zA-Z0-9_-]+\/)*[a-zA-Z0-9_-]+\.(jpg|jpeg|png|webp)$/i.test(ruta)
  ) {
    return "";
  }

  return new URL(ruta, base).href;
}

/**
 * Valida el idioma institucional.
 */
function obtenerIdioma(valor) {

  if (typeof valor !== "string") {
    return "es-AR";
  }

  try {

    const [idioma] =
      Intl.getCanonicalLocales(valor);

    return idioma || "es-AR";

  } catch {

    return "es-AR";
  }
}

/**
 * Genera una etiqueta meta.
 */
function crearMeta(atributo, nombre, contenido) {

  return (
    `<meta ${atributo}="${escaparHtml(nombre)}" ` +
    `content="${escaparHtml(contenido)}" />`
  );
}

/**
 * Normaliza los metadatos de una pagina.
 */
function obtenerDatosPagina(estudio, archivo) {

  const seo = estudio.seo || {};

  const nombre = normalizarTexto(
    estudio.nombre,
    "Estudio Jurídico",
    120
  );

  const idioma = obtenerIdioma(seo.idioma);

  const base = obtenerUrlBase(
    seo.urlCanonica
  );

  const canonica = obtenerUrlPagina(
    base,
    archivo
  );

  const imagen = obtenerImagenSocial(
    seo.imagenSocial,
    base
  );

  const esInicio = archivo === "index.html";

  let titulo;

  let descripcion;

  if (esInicio) {

    titulo = normalizarTexto(
      seo.titulo,
      `${nombre} | Demostración`,
      150
    );

    descripcion = normalizarTexto(
      seo.descripcion,
      "Demostración de una página institucional para estudios jurídicos."
    );

  } else {

    const esPrivacidad =
      archivo === "privacidad.html";

    const clave = esPrivacidad
      ? "privacidad"
      : "avisoLegal";

    const pagina =
      seo.paginas?.[clave] || {};

    titulo = normalizarTexto(
      pagina.titulo,
      esPrivacidad
        ? "Privacidad"
        : "Aviso legal",
      150
    );

    descripcion = normalizarTexto(
      pagina.descripcion,
      `Información institucional de ${nombre}.`
    );
  }

  const og = seo.openGraph || {};

  const tituloSocial = esInicio
    ? normalizarTexto(og.titulo, titulo, 150)
    : titulo;

  const descripcionSocial = esInicio
    ? normalizarTexto(og.descripcion, descripcion)
    : descripcion;

  const nombreSitio = normalizarTexto(
    og.nombreSitio,
    nombre,
    120
  );

  const tipoSolicitado = normalizarTexto(
    og.tipo,
    "website",
    30
  );

  const tipo = ["website", "article"].includes(
    tipoSolicitado
  )
    ? tipoSolicitado
    : "website";

  const tarjetaSolicitada =
    seo.twitter?.tarjeta;

  const tarjeta = imagen &&
    tarjetaSolicitada !== "summary"
      ? "summary_large_image"
      : "summary";

  const imagenAlt = normalizarTexto(
    seo.imagenSocialAlt,
    `Identidad institucional de ${nombre}`,
    300
  );

  return {
    titulo,
    descripcion,
    idioma,
    canonica,
    imagen,
    imagenAlt,
    tituloSocial,
    descripcionSocial,
    nombreSitio,
    tipo,
    tarjeta,
  };
}

/**
 * Construye el bloque de metadatos estaticos.
 */
function generarBloqueSeo(datos) {

  const etiquetas = [

    inicioBloque,

    `<title>${escaparHtml(datos.titulo)}</title>`,

    crearMeta(
      "name",
      "description",
      datos.descripcion
    ),

    crearMeta(
      "name",
      "robots",
      "noindex,nofollow"
    ),

    crearMeta(
      "property",
      "og:title",
      datos.tituloSocial
    ),

    crearMeta(
      "property",
      "og:description",
      datos.descripcionSocial
    ),

    crearMeta(
      "property",
      "og:type",
      datos.tipo
    ),

    crearMeta(
      "property",
      "og:site_name",
      datos.nombreSitio
    ),

    crearMeta(
      "property",
      "og:locale",
      datos.idioma.replace(/-/g, "_")
    ),

    crearMeta(
      "name",
      "twitter:card",
      datos.tarjeta
    ),

    crearMeta(
      "name",
      "twitter:title",
      datos.tituloSocial
    ),

    crearMeta(
      "name",
      "twitter:description",
      datos.descripcionSocial
    ),

  ];

  if (datos.canonica) {

    etiquetas.push(

      `<link rel="canonical" href="${escaparHtml(datos.canonica)}" />`,

      crearMeta(
        "property",
        "og:url",
        datos.canonica
      )

    );
  }

  if (datos.imagen) {

    etiquetas.push(

      crearMeta(
        "property",
        "og:image",
        datos.imagen
      ),

      crearMeta(
        "property",
        "og:image:alt",
        datos.imagenAlt
      ),

      crearMeta(
        "name",
        "twitter:image",
        datos.imagen
      ),

      crearMeta(
        "name",
        "twitter:image:alt",
        datos.imagenAlt
      )

    );
  }

  etiquetas.push(finBloque);

  return etiquetas
    .map(etiqueta => `    ${etiqueta}`)
    .join("\n");
}

/**
 * Reemplaza exclusivamente los metadatos del head.
 */
function actualizarHtml(html, datos) {

  const patronHead =
    /(<head\b[^>]*>)([\s\S]*?)(<\/head\s*>)/gi;

  const coincidencias = [
    ...html.matchAll(patronHead),
  ];

  if (coincidencias.length !== 1) {

    throw new Error(
      "Se esperaba exactamente un elemento head."
    );
  }

  const bloque = generarBloqueSeo(datos);

  let resultado = html.replace(

    patronHead,

    (_, apertura, contenido, cierre) => {

      const tieneInicio =
        contenido.includes(inicioBloque);

      const tieneFin =
        contenido.includes(finBloque);

      if (tieneInicio !== tieneFin) {

        throw new Error(
          "Bloque SEO incompleto."
        );
      }

      if (tieneInicio) {

        const patronBloque =
          /^[ \t]*<!-- SEO:INICIO -->[\s\S]*?<!-- SEO:FIN -->/gm;

        const bloques = [
          ...contenido.matchAll(patronBloque),
        ];

        if (bloques.length !== 1) {

          throw new Error(
            "Cantidad incorrecta de bloques SEO."
          );
        }

        contenido = contenido.replace(
          patronBloque,
          () => bloque
        );

      } else {

        // Migracion inicial de metadatos.

        contenido = contenido

          .replace(
            /<title\b[^>]*>[\s\S]*?<\/title\s*>/gi,
            ""
          )

          .replace(
            /<meta\b(?=[^>]*\bname\s*=\s*["'](?:description|robots|twitter:[^"']+)["'])[^>]*>/gi,
            ""
          )

          .replace(
            /<meta\b(?=[^>]*\bproperty\s*=\s*["']og:[^"']+["'])[^>]*>/gi,
            ""
          )

          .replace(
            /<link\b(?=[^>]*\brel\s*=\s*["']canonical["'])[^>]*>/gi,
            ""
          );

        contenido = contenido.replace(
          /^[ \t]*\r?\n/gm,
          ""
        );

        contenido =
          "\n" +
          bloque +
          "\n" +
          contenido.replace(/^\s*\n/, "");
      }

      // Mantener charset y viewport al comienzo del head.

      const patronCharset =
        /^[ \t]*<meta\b(?=[^>]*\bcharset\s*=)[^>]*>[ \t]*\r?\n?/gim;

      const patronViewport =
        /^[ \t]*<meta\b(?=[^>]*\bname\s*=\s*["']viewport["'])[^>]*>[ \t]*\r?\n?/gim;

      const charset = [
        ...contenido.matchAll(patronCharset),
      ];

      const viewport = [
        ...contenido.matchAll(patronViewport),
      ];

      if (charset.length !== 1 || viewport.length !== 1) {

        throw new Error(
          "Se esperaba una declaracion charset y viewport por documento."
        );
      }

      contenido = contenido
        .replace(patronCharset, "")
        .replace(patronViewport, "")
        .replace(/^\s+/, "");

      contenido =
        "\n    " +
        charset[0][0].trim() +
        "\n    " +
        viewport[0][0].trim() +
        "\n    " +
        contenido;

      return apertura + contenido + cierre;
    }
  );

  resultado = resultado.replace(

    /(<html\b[^>]*\blang\s*=\s*["'])[^"']+(["'])/i,

    (_, apertura, cierre) =>
      apertura +
      escaparHtml(datos.idioma) +
      cierre

  );

  return resultado;
}

/**
 * Genera los documentos institucionales.
 */
async function generarSeo() {

  const estudio = await cargarConfiguracion();

  const archivos = [
    "index.html",
    "privacidad.html",
    "aviso-legal.html",
  ];

  const resultados = [];

  // Preparar todos los documentos antes de escribir.

  for (const archivo of archivos) {

    const original = (
      await readFile(archivo, "utf8")
    ).replace(/\r\n/g, "\n");

    const datos = obtenerDatosPagina(
      estudio,
      archivo
    );

    const generado = actualizarHtml(
      original,
      datos
    );

    resultados.push({
      archivo,
      original,
      generado,
      datos,
    });
  }

  let cambios = 0;

  for (const resultado of resultados) {

    const {
      archivo,
      original,
      generado,
      datos,
    } = resultado;

    if (original !== generado) {

      cambios++;

      if (!modoComprobacion) {

        await writeFile(
          archivo,
          generado,
          "utf8"
        );
      }
    }

    console.log(`\n${archivo}`);

    console.log(`  Titulo: ${datos.titulo}`);

    console.log(
      `  Canonica: ${datos.canonica || "No configurada"}`
    );

    console.log(
      `  Imagen social: ${datos.imagen || "No configurada"}`
    );

    console.log(
      "  Indexacion: bloqueada"
    );
  }

  console.log(
    `\nDocumentos procesados: ${resultados.length}`
  );

  console.log(
    `Documentos con cambios: ${cambios}`
  );

  if (modoComprobacion && cambios) {

    console.error(
      "Los metadatos requieren regeneracion."
    );

    process.exitCode = 1;

  } else {

    console.log(
      modoComprobacion
        ? "Metadatos sincronizados."
        : "Generacion SEO completada."
    );
  }
}

generarSeo().catch(error => {

  console.error(
    "Error al generar SEO:",
    error.message
  );

  process.exitCode = 1;
});
