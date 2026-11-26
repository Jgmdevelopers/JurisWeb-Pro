"use strict";

(() => {

  /* =========================================
     JURISWEB PRO - ICONOGRAFIA ADAPTABLE
     GM.DEV
     ========================================= */

  const recursos =
    window.ICONOGRAFIA_RECURSOS || {};

  /**
   * Correspondencia entre colores originales
   * y variables cromaticas institucionales.
   */
  const equivalencias = Object.freeze({

    "#92703c": "--acento-intermedio",

    "#dfc58e": "--acento-claro",

    "#101e30": "--navy",

    "#b99a60": "--gold",

  });

  const cache = new Map();

  const imagenesProcesadas = new WeakMap();

  /**
   * Obtiene los colores efectivos del tema.
   */
  function obtenerColoresActivos() {

    const estilos = getComputedStyle(
      document.documentElement
    );

    const colores = {};

    for (
      const [original, variable]
      of Object.entries(equivalencias)
    ) {

      const valor = estilos
        .getPropertyValue(variable)
        .trim()
        .toLowerCase();

      colores[original] =
        /^#[0-9a-f]{6}$/.test(valor)
          ? valor
          : original;
    }

    return colores;
  }

  /**
   * Comprueba que el recurso pertenece
   * al catalogo institucional autorizado.
   */
  function obtenerRutaOriginal(imagen) {

    const actual =
      imagen.getAttribute("src") || "";

    if (Object.hasOwn(recursos, actual)) {
      return actual;
    }

    const registro =
      imagenesProcesadas.get(imagen);

    if (
      registro &&
      actual === registro.generado
    ) {
      return registro.original;
    }

    return "";
  }

  /**
   * Sustituye exclusivamente atributos
   * cromaticos reconocidos.
   */
  function recolorearSvg(contenido, colores) {

    return contenido.replace(

      /(\b(?:fill|stroke)\s*=\s*)(["'])(#[0-9a-fA-F]{6})\2/g,

      (
        coincidencia,
        atributo,
        comilla,
        color
      ) => {

        const nuevo =
          colores[color.toLowerCase()];

        if (!nuevo) {
          return coincidencia;
        }

        return (
          atributo +
          comilla +
          nuevo +
          comilla
        );
      }
    );
  }

  /**
   * Genera y reutiliza la variante cromatica.
   */
  function obtenerIconoAdaptado(ruta, colores) {

    const clave =
      ruta + "|" +
      Object.values(colores).join("|");

    if (cache.has(clave)) {
      return cache.get(clave);
    }

    const contenido = recursos[ruta];

    const adaptado = recolorearSvg(
      contenido,
      colores
    );

    /*
     * Conserva la URL original cuando el tema
     * no modifica los colores del recurso.
     */
    if (contenido === adaptado) {
      return ruta;
    }

    const url =
      "data:image/svg+xml;charset=utf-8," +
      encodeURIComponent(adaptado);

    cache.set(clave, url);

    return url;
  }

  /**
   * Actualiza una imagen institucional.
   */
  function adaptarImagen(imagen, colores) {

    if (!(imagen instanceof HTMLImageElement)) {
      return;
    }

    const ruta = obtenerRutaOriginal(imagen);

    if (!ruta) {
      return;
    }

    const adaptado = obtenerIconoAdaptado(
      ruta,
      colores
    );

    if (
      imagen.getAttribute("src") === adaptado
    ) {
      return;
    }

    imagenesProcesadas.set(imagen, {
      original: ruta,
      generado: adaptado,
    });

    imagen.setAttribute("src", adaptado);
  }

  /**
   * Recorre los recursos graficos existentes.
   */
  function actualizarIconografia() {

    const colores = obtenerColoresActivos();

    document
      .querySelectorAll("img[src]")
      .forEach(imagen => {
        adaptarImagen(imagen, colores);
      });
  }

  /**
   * Detecta iconos incorporados dinamicamente.
   */
  function observarIconografia() {

    const observador = new MutationObserver(
      cambios => {

        const colores = obtenerColoresActivos();

        for (const cambio of cambios) {

          if (cambio.type === "attributes") {

            adaptarImagen(
              cambio.target,
              colores
            );

            continue;
          }

          for (const nodo of cambio.addedNodes) {

            if (!(nodo instanceof Element)) {
              continue;
            }

            if (nodo.matches("img[src]")) {
              adaptarImagen(nodo, colores);
            }

            nodo
              .querySelectorAll("img[src]")
              .forEach(imagen => {
                adaptarImagen(imagen, colores);
              });
          }
        }
      }
    );

    observador.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["src"],
    });

    /*
     * Detecta modificaciones posteriores
     * de las variables del tema.
     */
    const observadorTema =
      new MutationObserver(() => {

        actualizarIconografia();

      });

    observadorTema.observe(
      document.documentElement,
      {
        attributes: true,
        attributeFilter: [
          "style",
          "data-tema",
        ],
      }
    );
  }

  actualizarIconografia();

  observarIconografia();

})();
