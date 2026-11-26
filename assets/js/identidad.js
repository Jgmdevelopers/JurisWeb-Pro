"use strict";

(() => {

  /**
   * Recursos graficos predeterminados.
   */
  const recursosPredeterminados = Object.freeze({
    logo: "assets/images/branding/logo.svg",
    favicon: "assets/images/branding/logo.svg",
    imagenHero: "assets/images/hero/despacho-juridico.webp",
    imagenEstudio: "assets/images/estudio/estudio-juridico.webp",
    imagenEstudioAlt:
      "Imagen ilustrativa de un despacho jurídico.",
  });

  /**
   * Extensiones admitidas segun el tipo de recurso.
   */
  const extensionesPermitidas = Object.freeze({
    logo: ["svg", "webp", "png", "jpg", "jpeg"],
    favicon: ["svg", "png", "ico"],
    imagenHero: ["webp", "png", "jpg", "jpeg"],
    imagenEstudio: ["webp", "png", "jpg", "jpeg"],
  });

  /**
   * Valida rutas relativas de imagenes locales.
   *
   * No admite URLs externas, traversal, protocolos,
   * parametros ni fragmentos.
   */
  function validarRutaImagen(valor, tipo) {

    if (
      typeof valor !== "string" ||
      !Object.hasOwn(extensionesPermitidas, tipo)
    ) {
      return "";
    }

    const ruta = valor.trim();

    const patron =
      /^assets\/images\/(?:[a-zA-Z0-9_-]+\/)*[a-zA-Z0-9_-]+\.[a-zA-Z0-9]+$/;

    if (!patron.test(ruta)) {
      return "";
    }

    const extension = ruta
      .split(".")
      .pop()
      .toLowerCase();

    return extensionesPermitidas[tipo].includes(extension)
      ? ruta
      : "";
  }

  /**
   * Obtiene una ruta valida o el recurso predeterminado.
   */
  function obtenerRecurso(valor, tipo) {

    return (
      validarRutaImagen(valor, tipo) ||
      recursosPredeterminados[tipo]
    );
  }

  /**
   * Aplica una imagen con recuperacion ante errores.
   */
  function aplicarImagen(selector, ruta, alternativa, textoAlt) {

    const imagenes = document.querySelectorAll(selector);

    imagenes.forEach(imagen => {

      const rutaOriginal = imagen.getAttribute("src");

      if (typeof textoAlt === "string") {
        imagen.alt = textoAlt;
      }

      if (ruta === rutaOriginal) {
        return;
      }

      function recuperarImagen() {

        if (imagen.getAttribute("src") === ruta) {

          imagen.src = alternativa;

          if (imagen.hasAttribute("data-imagen-estudio")) {
            imagen.alt = recursosPredeterminados.imagenEstudioAlt;
          }
        }
      }

      imagen.addEventListener(
        "error",
        recuperarImagen,
        { once: true }
      );

      imagen.src = ruta;
    });
  }

  /**
   * Identifica el tipo MIME del favicon.
   */
  function obtenerTipoFavicon(ruta) {

    const extension = ruta
      .split(".")
      .pop()
      .toLowerCase();

    const tipos = {
      svg: "image/svg+xml",
      png: "image/png",
      ico: "image/x-icon",
    };

    return tipos[extension];
  }

  /**
   * Actualiza el favicon si el recurso puede cargarse.
   */
  function aplicarFavicon(ruta) {

    const enlaces = document.querySelectorAll(
      'link[rel="icon"]'
    );

    if (!enlaces.length) {
      return;
    }

    if (
      Array.from(enlaces).every(
        enlace => enlace.getAttribute("href") === ruta
      )
    ) {
      return;
    }

    const imagen = new Image();

    imagen.onload = () => {

      enlaces.forEach(enlace => {
        enlace.href = ruta;
        enlace.type = obtenerTipoFavicon(ruta);
      });

    };

    imagen.src = ruta;
  }

  /**
   * Actualiza la fotografia de fondo del hero.
   */
  function aplicarImagenHero(ruta) {

    const hero = document.querySelector(".hero");

    if (!hero) {
      return;
    }

    if (ruta === recursosPredeterminados.imagenHero) {
      return;
    }

    const imagen = new Image();

    imagen.onload = () => {

      const url = new URL(
        ruta,
        document.baseURI
      ).href;

      hero.style.setProperty(
        "--imagen-hero",
        `url("${url}")`
      );

    };

    imagen.src = ruta;
  }

  /**
   * Inicializa los recursos graficos institucionales.
   */
  function inicializarIdentidad(configuracion) {

    const datos =
      configuracion &&
      typeof configuracion === "object" &&
      !Array.isArray(configuracion)
        ? configuracion
        : {};

    const logo = obtenerRecurso(
      datos.logo,
      "logo"
    );

    const favicon = obtenerRecurso(
      datos.favicon,
      "favicon"
    );

    const imagenHero = obtenerRecurso(
      datos.imagenHero,
      "imagenHero"
    );

    const imagenEstudio = obtenerRecurso(
      datos.imagenEstudio,
      "imagenEstudio"
    );

    const imagenEstudioAlt =
      typeof datos.imagenEstudioAlt === "string" &&
      datos.imagenEstudioAlt.trim()
        ? datos.imagenEstudioAlt.trim()
        : recursosPredeterminados.imagenEstudioAlt;

    aplicarImagen(
      "[data-logo-institucional]",
      logo,
      recursosPredeterminados.logo
    );

    aplicarImagen(
      "[data-imagen-estudio]",
      imagenEstudio,
      recursosPredeterminados.imagenEstudio,
      imagenEstudioAlt
    );

    aplicarFavicon(favicon);

    aplicarImagenHero(imagenHero);
  }

  inicializarIdentidad(
    window.ESTUDIO?.identidad
  );

})();
