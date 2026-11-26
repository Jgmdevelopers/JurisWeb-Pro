"use strict";

(() => {

  /* =========================================
     JURISWEB PRO - MOTOR EDITORIAL
     GM.DEV
     ========================================= */

  /**
   * Limites editoriales.
   */
  const longitudMaxima = 1000;

  const propiedadesRestringidas = new Set([
    "__proto__",
    "prototype",
    "constructor",
  ]);

  /**
   * Comprueba que el valor sea un objeto.
   */
  function esObjeto(valor) {

    return (
      valor !== null &&
      typeof valor === "object" &&
      !Array.isArray(valor)
    );
  }

  /**
   * Resuelve una propiedad editorial anidada.
   */
  function obtenerTexto(configuracion, ruta) {

    if (
      !esObjeto(configuracion) ||
      typeof ruta !== "string" ||
      !/^[a-zA-Z][a-zA-Z0-9]*(\.[a-zA-Z][a-zA-Z0-9]*){1,4}$/.test(ruta)
    ) {
      return "";
    }

    const propiedades = ruta.split(".");

    let valor = configuracion;

    for (const propiedad of propiedades) {

      if (
        propiedadesRestringidas.has(propiedad) ||
        !esObjeto(valor) ||
        !Object.hasOwn(valor, propiedad)
      ) {
        return "";
      }

      valor = valor[propiedad];
    }

    if (typeof valor !== "string") {
      return "";
    }

    const texto = valor.trim();

    if (
      !texto ||
      texto.length > longitudMaxima
    ) {
      return "";
    }

    return texto;
  }

  /**
   * Aplica texto sin interpretar contenido HTML.
   */
  function aplicarTexto(elemento, texto) {

    if (!texto) {
      return;
    }

    /*
     * Los elementos editoriales deben contener
     * exclusivamente texto.
     *
     * Los iconos, enlaces y otros elementos
     * estructurales se conservan fuera del nodo.
     */
    if (elemento.children.length > 0) {
      return;
    }

    elemento.textContent = texto;
  }

  /**
   * Inicializa el contenido editorial.
   */
  function inicializarEditorial(configuracion) {

    if (!esObjeto(configuracion)) {
      return;
    }

    const elementos = document.querySelectorAll(
      "[data-texto]"
    );

    elementos.forEach(elemento => {

      const ruta = elemento.dataset.texto;

      const texto = obtenerTexto(
        configuracion,
        ruta
      );

      aplicarTexto(elemento, texto);
    });
  }

  inicializarEditorial(
    window.ESTUDIO?.textos
  );

})();
