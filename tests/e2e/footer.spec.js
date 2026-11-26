const { test, expect } = require("@playwright/test");

/**
 * Intercepta la configuracion institucional
 * sin modificar los archivos reales.
 */
async function configurarFooter(page, cambios = {}) {
  await page.route("**/config/estudio.js", async ruta => {
    const respuesta = await ruta.fetch();
    const contenido = await respuesta.text();

    await ruta.fulfill({
      response: respuesta,
      body:
        contenido +
        "\nObject.assign(window.ESTUDIO, " +
        JSON.stringify(cambios) +
        ");",
    });
  });
}

test.describe("Footer institucional premium", () => {

  test("renderiza la identidad institucional configurada", async ({ page }) => {
    await configurarFooter(page, {
      nombre: "Estudio de prueba",
      subtitulo: "Asesoramiento profesional",
      ciudad: "Ciudad de prueba",
      footer: {
        descripcion: "Descripcion institucional de prueba.",
      },
    });

    await page.goto("/");

    await expect(
      page.locator(".footer-nombre")
    ).toHaveText("Estudio de prueba");

    await expect(
      page.locator(".footer-subtitulo")
    ).toHaveText("Asesoramiento profesional");

    await expect(
      page.locator(".footer-ubicacion")
    ).toContainText("Ciudad de prueba");

    await expect(
      page.locator("#footer-descripcion")
    ).toHaveText("Descripcion institucional de prueba.");

    const logo = page.locator(".footer-logo");

    await expect.poll(async () => {
      return logo.evaluate(imagen =>
        imagen.complete &&
        imagen.naturalWidth > 0
      );
    }).toBe(true);
  });

  test("contiene enlaces hacia todas las secciones institucionales", async ({ page }) => {
    await page.goto("/");

    const navegacion = page.locator(
      ".footer-navegacion"
    );

    await expect(navegacion).toHaveAttribute(
      "aria-label",
      "Navegación del pie de página"
    );

    const destinos = [
      "#inicio",
      "#estudio",
      "#areas",
      "#equipo",
      "#consulta",
      "#preguntas",
      "#contacto",
    ];

    const enlaces = navegacion.locator("a");

    await expect(enlaces).toHaveCount(
      destinos.length
    );

    for (let indice = 0; indice < destinos.length; indice++) {
      await expect(
        enlaces.nth(indice)
      ).toHaveAttribute(
        "href",
        destinos[indice]
      );

      await expect(
        page.locator(destinos[indice])
      ).toHaveCount(1);
    }

    await page.locator(".footer-cta").click();

    await expect(page).toHaveURL(
      /#contacto$/
    );

    await expect(
      page.locator("#contacto")
    ).toBeInViewport();

    await page.locator(".footer-volver").click();

    await expect(page).toHaveURL(
      /#inicio$/
    );

    await expect(
      page.locator("#inicio")
    ).toBeInViewport();
  });

  test("mantiene disponibles las paginas legales", async ({ page, request }) => {
    await page.goto("/");

    const destinos = [
      "privacidad.html",
      "aviso-legal.html",
    ];

    for (const destino of destinos) {

      await expect(
        page.locator(`footer a[href="${destino}"]`)
      ).toBeVisible();

      const url = new URL(
        destino,
        page.url()
      ).href;

      const respuesta = await request.get(url);

      expect(respuesta.ok()).toBe(true);

      expect(
        respuesta.headers()["content-type"]
      ).toContain("text/html");
    }

    await expect(
      page.locator(".footer-aviso")
    ).toContainText(
      "no sustituye una consulta profesional"
    );
  });

  test("actualiza automaticamente el anio de copyright", async ({ page }) => {
    await page.goto("/");

    const anio = await page.evaluate(
      () => String(new Date().getFullYear())
    );

    await expect(
      page.locator("#footer-anio")
    ).toHaveText(anio);
  });

  test("permite configurar y ocultar la firma del desarrollador", async ({ page }) => {
    await page.goto("/");

    const desarrollador = page.locator(
      "#footer-desarrollador"
    );

    await page.evaluate(() => {
      renderFooter({
        mostrarFirmaDesarrollador: true,
        desarrollador: "GM.DEV",
        producto: "JurisWeb Pro",
      });
    });

    await expect(desarrollador).toBeVisible();

    await expect(
      page.locator("#footer-firma")
    ).toHaveText("GM.DEV");

    await expect(
      page.locator("#footer-producto")
    ).toHaveText("JurisWeb Pro");

    await page.evaluate(() => {
      renderFooter({
        mostrarFirmaDesarrollador: false,
      });
    });

    await expect(desarrollador).toBeHidden();

    await page.evaluate(() => {
      renderFooter({
        mostrarFirmaDesarrollador: true,
        desarrollador: "Desarrollador de prueba",
        producto: "Producto de prueba",
      });
    });

    await expect(desarrollador).toBeVisible();

    await expect(
      page.locator("#footer-firma")
    ).toHaveText("Desarrollador de prueba");

    await expect(
      page.locator("#footer-producto")
    ).toHaveText("Producto de prueba");
  });

  test("valida enlaces externos y renderiza los textos de forma segura", async ({ page }) => {
    await page.goto("/");

    const resultados = await page.evaluate(() => {
      return [
        "https://example.com/",
        "http://example.com/",
        "javascript:alert(1)",
        "data:text/html,prueba",
        "https://usuario:clave@example.com/",
        "",
        null,
      ].map(validarUrlDesarrollador);
    });

    expect(resultados).toEqual([
      "https://example.com/",
      "",
      "",
      "",
      "",
      "",
      "",
    ]);

    await page.evaluate(() => {
      renderFooter({
        desarrollador: "GM.DEV",
        urlDesarrollador: "https://example.com/",
      });
    });

    const firma = page.locator("#footer-firma");

    await expect(firma).toHaveJSProperty(
      "tagName",
      "A"
    );

    await expect(firma).toHaveAttribute(
      "href",
      "https://example.com/"
    );

    await expect(firma).toHaveAttribute(
      "target",
      "_blank"
    );

    await expect(firma).toHaveAttribute(
      "rel",
      "noopener noreferrer"
    );

    const contenidoMalicioso =
      '<img src="inexistente" onerror="window.inyeccionFooter=true">';

    await page.evaluate(contenido => {
      renderFooter({
        descripcion: contenido,
        desarrollador: contenido,
        producto: "<strong>Producto</strong>",
        urlDesarrollador: "javascript:alert(1)",
      });
    }, contenidoMalicioso);

    await expect(firma).toHaveJSProperty(
      "tagName",
      "SPAN"
    );

    await expect(firma).toHaveText(
      contenidoMalicioso
    );

    await expect(
      page.locator("#footer-descripcion")
    ).toHaveText(contenidoMalicioso);

    await expect(
      page.locator("#footer-producto")
    ).toHaveText("<strong>Producto</strong>");

    await expect(
      page.locator(
        "#footer-firma img, " +
        "#footer-descripcion img, " +
        "#footer-producto strong"
      )
    ).toHaveCount(0);

    expect(
      await page.evaluate(
        () => window.inyeccionFooter
      )
    ).toBeUndefined();
  });

  test("dispone de un favicon institucional valido", async ({ page, request }) => {
    await page.goto("/");

    const favicon = page.locator(
      'head link[rel="icon"][type="image/svg+xml"]'
    );

    await expect(favicon).toHaveCount(1);

    await expect(favicon).toHaveAttribute(
      "href",
      "assets/images/branding/logo.svg"
    );

    const ruta = await favicon.getAttribute("href");

    const respuesta = await request.get(
      new URL(ruta, page.url()).href
    );

    expect(respuesta.ok()).toBe(true);

    expect(
      respuesta.headers()["content-type"]
    ).toContain("image/svg+xml");

    expect(
      await respuesta.text()
    ).toContain("<svg");
  });

  test("adapta la distribucion sin desbordamiento horizontal", async ({ page }) => {
    await page.goto("/");

    const composicion = page.locator(
      ".footer-composicion"
    );

    const columnas = await composicion.evaluate(
      elemento =>
        getComputedStyle(elemento)
          .gridTemplateColumns
          .trim()
          .split(/\s+/)
          .length
    );

    const ancho = page.viewportSize().width;

    const columnasEsperadas =
      ancho <= 700 ? 1 :
      ancho <= 1024 ? 2 : 3;

    expect(columnas).toBe(
      columnasEsperadas
    );

    const desbordamiento = await page.evaluate(() =>
      document.documentElement.scrollWidth >
      document.documentElement.clientWidth
    );

    expect(desbordamiento).toBe(false);

    await expect(
      page.locator(".footer-copyright")
    ).toBeVisible();
  });

});
