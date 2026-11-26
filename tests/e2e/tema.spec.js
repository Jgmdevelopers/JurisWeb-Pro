const { test, expect } = require("@playwright/test");

const paletas = {
  clasico: {
    principal: "#101e30",
    secundario: "#1c3049",
    acento: "#b99a60",
    fondo: "#f5f2eb",
    principalRgb: "16, 30, 48",
  },
  verde: {
    principal: "#172f29",
    secundario: "#28483d",
    acento: "#c3a979",
    fondo: "#f3f3eb",
    principalRgb: "23, 47, 41",
  },
  borgona: {
    principal: "#38202b",
    secundario: "#543340",
    acento: "#c5a477",
    fondo: "#f7f0eb",
    principalRgb: "56, 32, 43",
  },
  grafito: {
    principal: "#202328",
    secundario: "#353a42",
    acento: "#b6c3ce",
    fondo: "#f1f2f4",
    principalRgb: "32, 35, 40",
  },
};

/**
 * Intercepta la configuracion institucional.
 */
async function configurarTema(page, configuracion) {
  await page.route("**/config/estudio.js", async ruta => {
    const respuesta = await ruta.fetch();
    const contenido = await respuesta.text();

    await ruta.fulfill({
      response: respuesta,
      body:
        contenido +
        "\nwindow.ESTUDIO.tema = " +
        JSON.stringify(configuracion) +
        ";",
    });
  });
}

/**
 * Obtiene los valores efectivos de las variables CSS.
 */
async function obtenerVariables(page, variables) {
  return page.evaluate(nombres => {
    const estilos = getComputedStyle(
      document.documentElement
    );

    return Object.fromEntries(
      nombres.map(nombre => [
        nombre,
        estilos.getPropertyValue(nombre).trim(),
      ])
    );
  }, variables);
}

/**
 * Comprueba la aplicacion de una paleta corporativa.
 */
async function comprobarPaleta(page, nombre) {
  const paleta = paletas[nombre];

  await expect(
    page.locator("html")
  ).toHaveAttribute("data-tema", nombre);

  const valores = await obtenerVariables(page, [
    "--navy",
    "--blue",
    "--gold",
    "--paper",
    "--principal-rgb",
  ]);

  expect(valores).toEqual({
    "--navy": paleta.principal,
    "--blue": paleta.secundario,
    "--gold": paleta.acento,
    "--paper": paleta.fondo,
    "--principal-rgb": paleta.principalRgb,
  });
}

test.describe("Motor de temas corporativos", () => {

  test("aplica el tema clasico predeterminado", async ({ page }) => {
    await configurarTema(page, {
      preestablecido: "clasico",
    });

    await page.goto("/");

    await comprobarPaleta(page, "clasico");

    const variables = await obtenerVariables(page, [
      "--fuente-titulos",
      "--fuente-cuerpo",
    ]);

    expect(variables).toEqual({
      "--fuente-titulos": "Georgia, serif",
      "--fuente-cuerpo": "system-ui, sans-serif",
    });
  });

  test("aplica el tema verde institucional", async ({ page }) => {
    await configurarTema(page, {
      preestablecido: "verde",
    });

    await page.goto("/");

    await comprobarPaleta(page, "verde");

    await expect(
      page.locator(".hero")
    ).toHaveCSS(
      "background-color",
      "rgb(23, 47, 41)"
    );
  });

  test("aplica el tema borgona ejecutivo", async ({ page }) => {
    await configurarTema(page, {
      preestablecido: "borgona",
    });

    await page.goto("/");

    await comprobarPaleta(page, "borgona");
  });

  test("aplica el tema grafito contemporaneo", async ({ page }) => {
    await configurarTema(page, {
      preestablecido: "grafito",
    });

    await page.goto("/");

    await comprobarPaleta(page, "grafito");
  });

  test("permite personalizar los colores corporativos", async ({ page }) => {
    await configurarTema(page, {
      preestablecido: "clasico",

      colores: {
        principal: "#14283d",
        secundario: "#243e56",
        acento: "#c5ad82",
        acentoClaro: "#e7d3ad",
      },
    });

    await page.goto("/");

    const variables = await obtenerVariables(page, [
      "--navy",
      "--blue",
      "--gold",
      "--acento-claro",
      "--principal-rgb",
      "--acento-rgb",
      "--acento-claro-rgb",
    ]);

    expect(variables).toEqual({
      "--navy": "#14283d",
      "--blue": "#243e56",
      "--gold": "#c5ad82",
      "--acento-claro": "#e7d3ad",
      "--principal-rgb": "20, 40, 61",
      "--acento-rgb": "197, 173, 130",
      "--acento-claro-rgb": "231, 211, 173",
    });
  });

  test("normaliza colores HEX y sincroniza componentes RGB", async ({ page }) => {
    await configurarTema(page, {
      preestablecido: "clasico",

      colores: {
        principal: " #123 ",
        acento: "#ABC",
        principalSombra: "#234",
        acentoClaro: "#DEF",
      },
    });

    await page.goto("/");

    const variables = await obtenerVariables(page, [
      "--navy",
      "--gold",
      "--acento-claro",
      "--principal-rgb",
      "--principal-profundo-rgb",
      "--acento-rgb",
      "--acento-claro-rgb",
    ]);

    expect(variables).toEqual({
      "--navy": "#112233",
      "--gold": "#aabbcc",
      "--acento-claro": "#ddeeff",
      "--principal-rgb": "17, 34, 51",
      "--principal-profundo-rgb": "34, 51, 68",
      "--acento-rgb": "170, 187, 204",
      "--acento-claro-rgb": "221, 238, 255",
    });
  });

  test("permite configurar tipografias autorizadas", async ({ page }) => {
    await configurarTema(page, {
      preestablecido: "clasico",

      tipografias: {
        titulos: "palatino",
        cuerpo: "arial",
      },
    });

    await page.goto("/");

    const variables = await obtenerVariables(page, [
      "--fuente-titulos",
      "--fuente-cuerpo",
    ]);

    expect(
      variables["--fuente-titulos"]
    ).toContain("Palatino");

    expect(
      variables["--fuente-cuerpo"]
    ).toBe("Arial, Helvetica, sans-serif");

    await expect(
      page.locator(".hero h1")
    ).toHaveCSS("font-family", /Palatino/i);

    await expect(
      page.locator("body")
    ).toHaveCSS("font-family", /Arial/i);
  });

  test("recupera valores predeterminados ante configuraciones invalidas", async ({ page }) => {
    await configurarTema(page, {
      preestablecido: "tema-inexistente",

      colores: {
        principal: "red",
        secundario: "rgb(20, 30, 40)",
        acento: "#12345678",
        fondo: null,
        texto: 123,
      },

      tipografias: {
        titulos: "fuente-inexistente",
        cuerpo: "url(https://example.com/fuente)",
      },
    });

    await page.goto("/");

    await comprobarPaleta(page, "clasico");

    const variables = await obtenerVariables(page, [
      "--fuente-titulos",
      "--fuente-cuerpo",
    ]);

    expect(variables).toEqual({
      "--fuente-titulos": "Georgia, serif",
      "--fuente-cuerpo": "system-ui, sans-serif",
    });
  });

  test("recupera la paleta base ante contraste insuficiente", async ({ page }) => {
    await configurarTema(page, {
      preestablecido: "verde",

      colores: {
        principal: "#ffffff",
        texto: "#ffffff",
        fondo: "#ffffff",
        acento: "#ff0000",
      },
    });

    await page.goto("/");

    await comprobarPaleta(page, "verde");

    const variables = await obtenerVariables(page, [
      "--ink",
      "--acento-claro",
    ]);

    expect(variables).toEqual({
      "--ink": "#20362e",
      "--acento-claro": "#e2cfa3",
    });
  });

  test("rechaza propiedades no autorizadas e inyeccion CSS", async ({ page }) => {
    await configurarTema(page, {
      preestablecido: "clasico",

      colores: {
        principal: "#101e30; display:none",
        acento: "url(https://example.com/imagen)",
        texto: "var(--white)",
        "--variable-no-autorizada": "#ff0000",
        propiedadInexistente: "#ff0000",
      },

      tipografias: {
        titulos: "Arial; display:none",
        cuerpo: "url(https://example.com/fuente)",
      },
    });

    await page.goto("/");

    await comprobarPaleta(page, "clasico");

    const variables = await obtenerVariables(page, [
      "--variable-no-autorizada",
      "--fuente-titulos",
      "--fuente-cuerpo",
    ]);

    expect(variables).toEqual({
      "--variable-no-autorizada": "",
      "--fuente-titulos": "Georgia, serif",
      "--fuente-cuerpo": "system-ui, sans-serif",
    });

    await expect(
      page.locator("body")
    ).toBeVisible();
  });

  test("aplica el tema corporativo en las paginas legales", async ({ page }) => {
    await configurarTema(page, {
      preestablecido: "borgona",

      tipografias: {
        titulos: "georgia",
        cuerpo: "verdana",
      },
    });

    for (const destino of [
      "/privacidad.html",
      "/aviso-legal.html",
    ]) {

      await page.goto(destino);

      await comprobarPaleta(page, "borgona");

      await expect(
        page.locator("body")
      ).toHaveCSS("font-family", /Verdana/i);

      await expect(
        page.locator("main h1")
      ).toBeVisible();
    }
  });

  test.describe("Funcionamiento sin JavaScript", () => {

    test.use({
      javaScriptEnabled: false,
    });

    test("conserva el tema clasico definido en CSS", async ({ page }) => {
      await page.goto("/");

      const variables = await obtenerVariables(page, [
        "--navy",
        "--blue",
        "--gold",
        "--paper",
        "--fuente-titulos",
        "--fuente-cuerpo",
      ]);

      expect(variables).toEqual({
        "--navy": "#101e30",
        "--blue": "#1c3049",
        "--gold": "#b99a60",
        "--paper": "#f5f2eb",
        "--fuente-titulos": "Georgia, serif",
        "--fuente-cuerpo": "system-ui, sans-serif",
      });

      await expect(
        page.locator(".hero h1")
      ).toBeVisible();

      await expect(
        page.locator("footer")
      ).toBeVisible();
    });

  });

});
