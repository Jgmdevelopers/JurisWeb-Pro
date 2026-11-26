const { test, expect } = require("@playwright/test");

/**
 * Intercepta la configuracion institucional
 * sin modificar los datos reales.
 */
async function configurarPreguntas(page, preguntas) {
  await page.route("**/config/estudio.js", async ruta => {
    const respuesta = await ruta.fetch();
    const contenido = await respuesta.text();

    await ruta.fulfill({
      response: respuesta,
      body:
        contenido +
        "\nwindow.ESTUDIO.preguntasFrecuentes = " +
        JSON.stringify(preguntas) +
        ";",
    });
  });
}

/**
 * Genera preguntas utilizadas exclusivamente
 * en el entorno de pruebas.
 */
function crearPregunta(indice = 1, cambios = {}) {
  return {
    pregunta: `Pregunta de prueba ${indice}`,
    respuesta: `Respuesta de prueba ${indice}.`,
    ...cambios,
  };
}

test.describe("Preguntas frecuentes premium", () => {

  test("renderiza las preguntas configuradas", async ({ page }) => {
    await page.goto("/");

    const preguntas = await page.evaluate(
      () => window.ESTUDIO.preguntasFrecuentes
    );

    const elementos = page.locator(
      "#lista-preguntas .pregunta-item"
    );

    await expect(elementos).toHaveCount(preguntas.length);

    await expect(
      elementos.locator(".pregunta-titulo")
    ).toHaveText(
      preguntas.map(item => item.pregunta)
    );

    await expect(
      elementos.locator(".pregunta-respuesta p")
    ).toHaveText(
      preguntas.map(item => item.respuesta)
    );

    await expect(
      page.locator("#lista-preguntas details[open]")
    ).toHaveCount(0);
  });

  test("permite abrir y cerrar una pregunta", async ({ page }) => {
    await page.goto("/");

    const pregunta = page.locator(
      "#lista-preguntas details"
    ).first();

    const resumen = pregunta.locator("summary");

    const respuesta = pregunta.locator(
      ".pregunta-respuesta"
    );

    await expect(respuesta).toBeHidden();

    await resumen.click();

    await expect(pregunta).toHaveJSProperty(
      "open",
      true
    );

    await expect(respuesta).toBeVisible();

    await resumen.click();

    await expect(pregunta).toHaveJSProperty(
      "open",
      false
    );

    await expect(respuesta).toBeHidden();
  });

  test("permite mantener una sola pregunta abierta", async ({ page }) => {
    await page.goto("/");

    const preguntas = page.locator(
      "#lista-preguntas details"
    );

    const primera = preguntas.nth(0);
    const segunda = preguntas.nth(1);
    const tercera = preguntas.nth(2);

    await primera.locator("summary").click();

    await expect(primera).toHaveJSProperty(
      "open",
      true
    );

    await segunda.locator("summary").click();

    await expect(primera).toHaveJSProperty(
      "open",
      false
    );

    await expect(segunda).toHaveJSProperty(
      "open",
      true
    );

    await tercera.locator("summary").click();

    await expect(segunda).toHaveJSProperty(
      "open",
      false
    );

    await expect(tercera).toHaveJSProperty(
      "open",
      true
    );

    await expect(
      page.locator("#lista-preguntas details[open]")
    ).toHaveCount(1);
  });

  test("permite operar el acordeon mediante teclado", async ({ page }) => {
    await page.goto("/");

    const pregunta = page.locator(
      "#lista-preguntas details"
    ).first();

    const resumen = pregunta.locator("summary");

    await resumen.scrollIntoViewIfNeeded();
    await resumen.focus();

    await expect(resumen).toBeFocused();

    await page.keyboard.press("Enter");

    await expect(pregunta).toHaveJSProperty(
      "open",
      true
    );

    await page.keyboard.press("Space");

    await expect(pregunta).toHaveJSProperty(
      "open",
      false
    );

    await page.keyboard.press("Tab");

    await expect(
      page.locator("#lista-preguntas summary").nth(1)
    ).toBeFocused();
  });

  test("permite personalizar y numerar las preguntas", async ({ page }) => {
    const preguntas = [
      crearPregunta(1),
      crearPregunta(2),
      crearPregunta(3),
      crearPregunta(4),
      crearPregunta(5),
    ];

    await configurarPreguntas(page, preguntas);

    await page.goto("/");

    const elementos = page.locator(
      "#lista-preguntas .pregunta-item"
    );

    await expect(elementos).toHaveCount(5);

    await expect(
      elementos.locator(".pregunta-titulo")
    ).toHaveText(
      preguntas.map(item => item.pregunta)
    );

    await expect(
      elementos.locator(".pregunta-numero")
    ).toHaveText([
      "01",
      "02",
      "03",
      "04",
      "05",
    ]);

    for (const numero of await elementos.locator(
      ".pregunta-numero"
    ).all()) {
      await expect(numero).toHaveAttribute(
        "aria-hidden",
        "true"
      );
    }
  });

  test("descarta registros invalidos y contempla estados vacios", async ({ page }) => {
    await configurarPreguntas(page, [
      null,
      {},
      [],
      { pregunta: "Sin respuesta" },
      { pregunta: "", respuesta: "Respuesta" },
      { pregunta: 123, respuesta: "Respuesta" },
      { pregunta: "Pregunta", respuesta: "   " },
    ]);

    await page.goto("/");

    await expect(
      page.locator("#lista-preguntas details")
    ).toHaveCount(0);

    await expect(
      page.locator(".preguntas-vacio")
    ).toHaveText(
      "Las preguntas frecuentes se encuentran pendientes de configuración."
    );

    await expect(
      page.locator(".preguntas-cta")
    ).toBeVisible();

    await page.unroute("**/config/estudio.js");

    await configurarPreguntas(page, [
      crearPregunta(1),
      null,
      crearPregunta(2),
      {},
    ]);

    await page.reload();

    await expect(
      page.locator("#lista-preguntas details")
    ).toHaveCount(2);

    await expect(
      page.locator(".pregunta-numero")
    ).toHaveText(["01", "02"]);

    await expect(
      page.locator(".preguntas-vacio")
    ).toHaveCount(0);

    await page.unroute("**/config/estudio.js");
    await configurarPreguntas(page, []);

    await page.reload();

    await expect(
      page.locator("#lista-preguntas details")
    ).toHaveCount(0);

    await expect(
      page.locator(".preguntas-vacio")
    ).toBeVisible();
  });

  test("renderiza contenido HTML como texto sin ejecutar codigo", async ({ page }) => {
    const contenidoMalicioso =
      '<img src="inexistente" onerror="window.inyeccionPreguntas=true">';

    await configurarPreguntas(page, [
      crearPregunta(1, {
        pregunta: contenidoMalicioso,
        respuesta: "<strong>Respuesta de prueba</strong>",
      }),
    ]);

    await page.goto("/");

    const pregunta = page.locator(
      "#lista-preguntas details"
    ).first();

    await expect(
      pregunta.locator(".pregunta-titulo")
    ).toHaveText(contenidoMalicioso);

    await pregunta.locator("summary").click();

    await expect(
      pregunta.locator(".pregunta-respuesta p")
    ).toHaveText(
      "<strong>Respuesta de prueba</strong>"
    );

    await expect(
      pregunta.locator("summary img, .pregunta-respuesta strong")
    ).toHaveCount(0);

    expect(
      await page.evaluate(() => window.inyeccionPreguntas)
    ).toBeUndefined();
  });

  test("permite solicitar una entrevista desde las preguntas frecuentes", async ({ page }) => {
    await page.goto("/");

    const enlace = page.locator(
      "#preguntas .preguntas-cta"
    );

    await expect(enlace).toHaveAttribute(
      "href",
      "#contacto"
    );

    await enlace.click();

    await expect(page).toHaveURL(
      /#contacto$/
    );

    await expect(
      page.locator("#contacto")
    ).toBeInViewport();
  });

});
