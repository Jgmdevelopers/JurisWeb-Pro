const { test, expect } = require("@playwright/test");

/**
 * Intercepta la configuracion institucional
 * sin modificar los archivos reales.
 */
async function configurarConsulta(page, etapas) {
  await page.route("**/config/estudio.js", async (ruta) => {
    const respuesta = await ruta.fetch();
    const contenido = await respuesta.text();

    await ruta.fulfill({
      response: respuesta,
      body:
        contenido +
        "\nwindow.ESTUDIO.procesoConsulta = " +
        JSON.stringify(etapas) +
        ";",
    });
  });
}

/**
 * Genera una etapa utilizada exclusivamente
 * durante las pruebas automatizadas.
 */
function crearEtapa(indice = 1, cambios = {}) {
  return {
    icono: "general",
    titulo: `Etapa de prueba ${indice}`,
    descripcion: `Descripcion de la etapa ${indice}.`,
    ...cambios,
  };
}

test.describe("Proceso de consulta premium", () => {
  test("renderiza las etapas configuradas", async ({ page }) => {
    await page.goto("/");

    const etapas = await page.evaluate(() => window.ESTUDIO.procesoConsulta);

    const elementos = page.locator("#lista-consulta .consulta-etapa");

    await expect(elementos).toHaveCount(etapas.length);

    await expect(elementos.locator("h3")).toHaveText(
      etapas.map((etapa) => etapa.titulo),
    );

    await expect(elementos.locator("p")).toHaveText(
      etapas.map((etapa) => etapa.descripcion),
    );
  });

  test("los iconos SVG cargan correctamente", async ({ page }) => {
    await page.goto("/");

    const iconos = page.locator("#lista-consulta .consulta-icono");

    await expect(iconos).toHaveCount(4);

    await expect
      .poll(async () => {
        return iconos.evaluateAll((elementos) =>
          elementos.every(
            (imagen) => imagen.complete && imagen.naturalWidth > 0,
          ),
        );
      })
      .toBe(true);

    for (const icono of await iconos.all()) {
      await expect(icono).toHaveAttribute("alt", "");
    }
  });

  test("numera automaticamente las etapas", async ({ page }) => {
    await page.goto("/");

    const numeros = page.locator("#lista-consulta .consulta-numero");

    await expect(numeros).toHaveText(["01", "02", "03", "04"]);

    for (const numero of await numeros.all()) {
      await expect(numero).toHaveAttribute("aria-hidden", "true");
    }
  });

  test("adapta la distribucion a cada resolucion", async ({ page }) => {
    await page.goto("/");

    const lista = page.locator("#lista-consulta");

    const columnas = await lista.evaluate(
      (elemento) =>
        getComputedStyle(elemento).gridTemplateColumns.trim().split(/\s+/)
          .length,
    );

    const ancho = page.viewportSize().width;

    const columnasEsperadas = ancho <= 700 ? 1 : ancho <= 1024 ? 2 : 4;

    expect(columnas).toBe(columnasEsperadas);

    const primeraEtapa = lista.locator(".consulta-etapa").first();

    await expect(primeraEtapa).toHaveCSS(
      "display",
      ancho <= 700 ? "grid" : "flex",
    );
  });

  test("permite personalizar la cantidad y contenido de las etapas", async ({
    page,
  }) => {
    const etapas = [
      crearEtapa(1),
      crearEtapa(2),
      crearEtapa(3),
      crearEtapa(4),
      crearEtapa(5),
    ];

    await configurarConsulta(page, etapas);

    await page.goto("/");

    const elementos = page.locator("#lista-consulta .consulta-etapa");

    await expect(elementos).toHaveCount(5);

    await expect(elementos.locator("h3")).toHaveText(
      etapas.map((etapa) => etapa.titulo),
    );

    await expect(elementos.locator(".consulta-numero")).toHaveText([
      "01",
      "02",
      "03",
      "04",
      "05",
    ]);
  });

  test("muestra un estado alternativo cuando no existen etapas", async ({
    page,
  }) => {
    await configurarConsulta(page, []);

    await page.goto("/");

    await expect(page.locator("#lista-consulta")).toBeHidden();

    await expect(page.locator("#lista-consulta li")).toHaveCount(0);

    await expect(page.locator("#consulta-vacio")).toBeVisible();

    await expect(page.locator("#consulta-vacio")).toContainText(
      "pendiente de configuración",
    );

    await expect(page.locator(".consulta-cta")).toBeVisible();
  });

  test("descarta registros invalidos y utiliza iconografia segura", async ({
    page,
  }) => {
    await configurarConsulta(page, [
      null,
      {},
      [],
      { titulo: "Sin descripcion" },
      crearEtapa(1, {
        titulo: "   ",
      }),
      crearEtapa(2, {
        icono: "../../archivo-invalido",
      }),
      crearEtapa(3, {
        icono: "https://example.com/icono.svg",
      }),
      crearEtapa(4, {
        icono: "contacto",
      }),
    ]);

    await page.goto("/");

    const elementos = page.locator("#lista-consulta .consulta-etapa");

    await expect(elementos).toHaveCount(3);

    await expect(elementos.locator(".consulta-numero")).toHaveText([
      "01",
      "02",
      "03",
    ]);

    const iconos = elementos.locator(".consulta-icono");

    await expect(iconos.nth(0)).toHaveAttribute(
      "src",
      "assets/icons/consulta/general.svg",
    );

    await expect(iconos.nth(1)).toHaveAttribute(
      "src",
      "assets/icons/consulta/general.svg",
    );

    await expect(iconos.nth(2)).toHaveAttribute(
      "src",
      "assets/icons/consulta/contacto.svg",
    );

    await expect
      .poll(async () => {
        return iconos.evaluateAll((elementos) =>
          elementos.every(
            (imagen) => imagen.complete && imagen.naturalWidth > 0,
          ),
        );
      })
      .toBe(true);
  });

  test("renderiza contenido HTML como texto sin ejecutar codigo", async ({
    page,
  }) => {
    const contenidoMalicioso =
      '<img src="inexistente" onerror="window.inyeccionConsulta=true">';

    await configurarConsulta(page, [
      crearEtapa(1, {
        titulo: contenidoMalicioso,
        descripcion: "<strong>Texto de prueba</strong>",
      }),
    ]);

    await page.goto("/");

    const etapa = page.locator("#lista-consulta .consulta-etapa");

    await expect(etapa).toHaveCount(1);

    await expect(etapa.locator("h3")).toHaveText(contenidoMalicioso);

    await expect(etapa.locator("p")).toHaveText(
      "<strong>Texto de prueba</strong>",
    );

    await expect(etapa.locator("h3 img, p strong")).toHaveCount(0);

    expect(await page.evaluate(() => window.inyeccionConsulta)).toBeUndefined();
  });

  test("respeta la accesibilidad y el movimiento reducido", async ({
    page,
  }) => {
    await page.emulateMedia({
      reducedMotion: "reduce",
    });

    await page.goto("/");

    const lista = page.locator("#lista-consulta");

    await expect(lista).toHaveJSProperty("tagName", "OL");

    await expect(lista).toHaveAttribute(
      "aria-label",
      "Etapas del proceso de consulta",
    );

    const primeraEtapa = lista.locator(".consulta-etapa").first();

    await primeraEtapa.scrollIntoViewIfNeeded();

    await expect(primeraEtapa).toHaveCSS("opacity", "1");

    await expect(primeraEtapa).toHaveCSS("transform", "none");

    await expect(primeraEtapa.locator(".consulta-icono")).toHaveCSS(
      "transition-duration",
      "0s",
    );
  });

  test("permite solicitar una entrevista desde el proceso de consulta", async ({
    page,
  }) => {
    await page.goto("/");

    const enlace = page.locator("#consulta .consulta-cta");

    await expect(enlace).toHaveAttribute("href", "#contacto");

    await enlace.click();

    await expect(page).toHaveURL(/#contacto$/);

    await expect(page.locator("#contacto")).toBeInViewport();
  });
});
