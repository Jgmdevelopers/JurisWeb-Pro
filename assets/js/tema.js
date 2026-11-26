"use strict";

(() => {

  /* =========================================
     JURISWEB PRO - MOTOR DE TEMAS
     GM.DEV
     ========================================= */

  /**
   * Paleta corporativa predeterminada.
   */
  const paletaClasica = Object.freeze({
    principal: "#101e30",
    secundario: "#1c3049",
    acento: "#b99a60",
    fondo: "#f5f2eb",
    texto: "#172637",
    textoSecundario: "#526174",

    principalIntermedio: "#172a40",
    principalProfundo: "#0b1522",
    principalSombra: "#0a1422",

    acentoClaro: "#dfc58e",
    acentoHover: "#e9d4a6",
    acentoOscuro: "#795a28",
    acentoIntermedio: "#92703c",

    textoInverso: "#e0e6ed",
    textoInversoSecundario: "#d5dce5",
    textoInversoSuave: "#b6c3d3",

    borde: "#dedbd4",
    bordeSuave: "#e6e0d5",
    bordeAlternativo: "#dcd7cd",
    bordeNeutro: "#dddddd",
    bordeClaro: "#e8e4dc",

    foco: "#b76d14",
  });

  /**
   * Temas corporativos disponibles.
   */
  const temas = Object.freeze({

    clasico: paletaClasica,

    verde: Object.freeze({
      ...paletaClasica,

      principal: "#172f29",
      secundario: "#28483d",
      acento: "#c3a979",
      fondo: "#f3f3eb",
      texto: "#20362e",
      textoSecundario: "#4f655b",

      principalIntermedio: "#203b32",
      principalProfundo: "#10221d",
      principalSombra: "#0e211a",

      acentoClaro: "#e2cfa3",
      acentoHover: "#f0dfb9",
      acentoOscuro: "#665127",
      acentoIntermedio: "#70582f",

      textoInverso: "#edf2ee",
      textoInversoSecundario: "#dae5de",
      textoInversoSuave: "#b9cdc1",

      borde: "#d5dfd7",
      bordeSuave: "#e1e7dc",
      bordeAlternativo: "#cdd9cf",
      bordeNeutro: "#d5dcd6",
      bordeClaro: "#e5eae3",

      foco: "#497c64",
    }),

    borgona: Object.freeze({
      ...paletaClasica,

      principal: "#38202b",
      secundario: "#543340",
      acento: "#c5a477",
      fondo: "#f7f0eb",
      texto: "#38202b",
      textoSecundario: "#6b515e",

      principalIntermedio: "#462936",
      principalProfundo: "#291720",
      principalSombra: "#26141d",

      acentoClaro: "#e5cda7",
      acentoHover: "#f0dfc5",
      acentoOscuro: "#70502c",
      acentoIntermedio: "#795933",

      textoInverso: "#f4eaf0",
      textoInversoSecundario: "#e9dce3",
      textoInversoSuave: "#d0bcc7",

      borde: "#e3d7dc",
      bordeSuave: "#eee3e6",
      bordeAlternativo: "#ded0d6",
      bordeNeutro: "#e2d7dc",
      bordeClaro: "#f1e7e8",

      foco: "#87506b",
    }),

    grafito: Object.freeze({
      ...paletaClasica,

      principal: "#202328",
      secundario: "#353a42",
      acento: "#b6c3ce",
      fondo: "#f1f2f4",
      texto: "#202328",
      textoSecundario: "#535d68",

      principalIntermedio: "#2c3138",
      principalProfundo: "#14171a",
      principalSombra: "#101317",

      acentoClaro: "#dce4ec",
      acentoHover: "#edf2f7",
      acentoOscuro: "#455766",
      acentoIntermedio: "#536979",

      textoInverso: "#eef1f5",
      textoInversoSecundario: "#dce2e8",
      textoInversoSuave: "#bac5d0",

      borde: "#d7dde3",
      bordeSuave: "#e3e7eb",
      bordeAlternativo: "#cfd6dd",
      bordeNeutro: "#d8dde2",
      bordeClaro: "#e6eaee",

      foco: "#496c8a",
    }),

  });

  /**
   * Relacion entre la configuracion institucional
   * y las variables utilizadas por el CSS.
   */
  const variablesColores = Object.freeze({

    principal: "--navy",
    secundario: "--blue",
    acento: "--gold",
    fondo: "--paper",
    texto: "--ink",
    textoSecundario: "--muted",

    principalIntermedio: "--principal-intermedio",
    principalProfundo: "--principal-profundo",

    acentoClaro: "--acento-claro",
    acentoHover: "--acento-hover",
    acentoOscuro: "--acento-oscuro",
    acentoIntermedio: "--acento-intermedio",

    textoInverso: "--texto-inverso",
    textoInversoSecundario: "--texto-inverso-secundario",
    textoInversoSuave: "--texto-inverso-suave",

    borde: "--borde",
    bordeSuave: "--borde-suave",
    bordeAlternativo: "--borde-alternativo",
    bordeNeutro: "--borde-neutro",
    bordeClaro: "--borde-claro",

    foco: "--color-foco",

  });

  /**
   * Familias tipograficas locales autorizadas.
   *
   * No incorpora fuentes remotas.
   */
  const fuentes = Object.freeze({

    georgia: "Georgia, serif",

    palatino:
      '"Palatino Linotype", Palatino, serif',

    times:
      '"Times New Roman", Times, serif',

    sistema:
      "system-ui, sans-serif",

    arial:
      "Arial, Helvetica, sans-serif",

    verdana:
      "Verdana, Geneva, sans-serif",

  });

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
   * Admite exclusivamente colores HEX de
   * tres o seis digitos.
   */
  function normalizarColor(valor) {

    if (typeof valor !== "string") {
      return "";
    }

    const color = valor.trim().toLowerCase();

    if (/^#[0-9a-f]{6}$/.test(color)) {
      return color;
    }

    if (/^#[0-9a-f]{3}$/.test(color)) {

      return "#" + color
        .slice(1)
        .split("")
        .map(caracter => caracter.repeat(2))
        .join("");
    }

    return "";
  }

  /**
   * Convierte un color hexadecimal en RGB.
   */
  function convertirRgb(color) {

    const normalizado =
      normalizarColor(color);

    if (!normalizado) {
      return null;
    }

    return [
      parseInt(normalizado.slice(1, 3), 16),
      parseInt(normalizado.slice(3, 5), 16),
      parseInt(normalizado.slice(5, 7), 16),
    ];
  }

  /**
   * Calcula luminancia relativa.
   */
  function calcularLuminancia(color) {

    const rgb = convertirRgb(color);

    if (!rgb) {
      return null;
    }

    const valores = rgb.map(componente => {

      const valor = componente / 255;

      return valor <= 0.04045
        ? valor / 12.92
        : Math.pow(
            (valor + 0.055) / 1.055,
            2.4
          );
    });

    return (
      valores[0] * 0.2126 +
      valores[1] * 0.7152 +
      valores[2] * 0.0722
    );
  }

  /**
   * Calcula la relacion de contraste.
   */
  function calcularContraste(colorA, colorB) {

    const luminanciaA =
      calcularLuminancia(colorA);

    const luminanciaB =
      calcularLuminancia(colorB);

    if (
      luminanciaA === null ||
      luminanciaB === null
    ) {
      return 0;
    }

    const mayor = Math.max(
      luminanciaA,
      luminanciaB
    );

    const menor = Math.min(
      luminanciaA,
      luminanciaB
    );

    return (mayor + 0.05) / (menor + 0.05);
  }

  /**
   * Comprueba combinaciones esenciales de contraste.
   *
   * No reemplaza una auditoria de accesibilidad.
   */
  function validarContrastes(paleta) {

    const combinaciones = [

      // Textos sobre superficies claras.

      [paleta.texto, "#ffffff"],
      [paleta.texto, paleta.fondo],

      [paleta.textoSecundario, "#ffffff"],
      [paleta.textoSecundario, paleta.fondo],

      [paleta.principal, "#ffffff"],
      [paleta.principal, paleta.fondo],

      [paleta.acentoOscuro, "#ffffff"],
      [paleta.acentoOscuro, paleta.fondo],

      // Textos sobre superficies oscuras.

      ["#ffffff", paleta.principal],
      ["#ffffff", paleta.secundario],
      ["#ffffff", paleta.principalProfundo],

      [paleta.textoInverso, paleta.principal],

      [
        paleta.textoInversoSecundario,
        paleta.secundario,
      ],

      [
        paleta.textoInversoSuave,
        paleta.principalProfundo,
      ],

      // Botones y textos destacados.

      [paleta.principal, paleta.acentoClaro],
      [paleta.principal, paleta.acentoHover],
      [paleta.acentoClaro, paleta.secundario],

    ];

    return combinaciones.every(
      ([colorA, colorB]) =>
        calcularContraste(colorA, colorB) >= 4.5
    );
  }

  /**
   * Obtiene un tema registrado.
   */
  function obtenerTema(nombre) {

    return (
      typeof nombre === "string" &&
      Object.hasOwn(temas, nombre)
    )
      ? nombre
      : "clasico";
  }

  /**
   * Aplica exclusivamente propiedades cromaticas
   * reconocidas por el motor.
   */
  function personalizarPaleta(base, colores) {

    const paleta = { ...base };

    if (!esObjeto(colores)) {
      return paleta;
    }

    for (
      const [propiedad, valor]
      of Object.entries(colores)
    ) {

      if (!Object.hasOwn(base, propiedad)) {
        continue;
      }

      const color = normalizarColor(valor);

      if (color) {
        paleta[propiedad] = color;
      }
    }

    return paleta;
  }

  /**
   * Obtiene una familia tipografica autorizada.
   */
  function obtenerFuente(nombre, alternativa) {

    return (
      typeof nombre === "string" &&
      Object.hasOwn(fuentes, nombre)
    )
      ? fuentes[nombre]
      : fuentes[alternativa];
  }

  /**
   * Resuelve y aplica la configuracion institucional.
   */
  function inicializarTema(configuracion) {

    const datos = esObjeto(configuracion)
      ? configuracion
      : {};

    const nombreTema =
      obtenerTema(datos.preestablecido);

    const paletaBase = temas[nombreTema];

    let paleta = personalizarPaleta(
      paletaBase,
      datos.colores
    );

    let temaAplicado = nombreTema;

    /* Recuperacion ante contrastes insuficientes. */

    if (!validarContrastes(paleta)) {

      paleta = { ...paletaBase };
    }

    if (!validarContrastes(paleta)) {

      paleta = { ...paletaClasica };
      temaAplicado = "clasico";
    }

    const raiz = document.documentElement;

    /* Colores institucionales. */

    for (
      const [propiedad, variable]
      of Object.entries(variablesColores)
    ) {

      raiz.style.setProperty(
        variable,
        paleta[propiedad]
      );
    }

    /* Componentes RGB sincronizados. */

    const variablesRgb = {

      "--principal-rgb":
        paleta.principal,

      "--principal-profundo-rgb":
        paleta.principalSombra,

      "--acento-rgb":
        paleta.acento,

      "--acento-claro-rgb":
        paleta.acentoClaro,

    };

    for (
      const [variable, color]
      of Object.entries(variablesRgb)
    ) {

      raiz.style.setProperty(
        variable,
        convertirRgb(color).join(", ")
      );
    }

    /* Tipografias institucionales. */

    const tipografias =
      esObjeto(datos.tipografias)
        ? datos.tipografias
        : {};

    raiz.style.setProperty(
      "--fuente-titulos",
      obtenerFuente(
        tipografias.titulos,
        "georgia"
      )
    );

    raiz.style.setProperty(
      "--fuente-cuerpo",
      obtenerFuente(
        tipografias.cuerpo,
        "sistema"
      )
    );

    /* Identificacion del tema aplicado. */

    raiz.dataset.tema = temaAplicado;
  }

  inicializarTema(
    window.ESTUDIO?.tema
  );

})();
