const { test, expect } = require("@playwright/test");

/**
 * Simula una configuración personalizada sin
 * modificar los archivos reales del proyecto.
 */
async function configurarAreas(page, areas) {
  await page.route("**/config/estudio.js", async (ruta) => {
    const respuesta = await ruta.fetch();
    const contenido = await respuesta.text();

    await ruta.fulfill({
      response: respuesta,
      body:
        contenido + "\nwindow.ESTUDIO.areas = " + JSON.stringify(areas) + ";",
    });
  });
}

test.describe("Areas de practica premium", () => {
  test("renderiza las especialidades configuradas", async ({ page }) => {
    await page.goto("/");

    const areas = await page.evaluate(() => window.ESTUDIO.areas);

    const tarjetas = page.locator("#lista-areas article");

    await expect(tarjetas).toHaveCount(areas.length);

    await expect(tarjetas.locator("h3")).toHaveText(
      areas.map((area) => area.titulo),
    );

    await expect(tarjetas.locator("p")).toHaveText(
      areas.map((area) => area.descripcion),
    );
  });

  test("los iconos SVG cargan correctamente", async ({ page }) => {
    await page.goto("/");

    const iconos = page.locator("#lista-areas .area-icono");

    await expect(iconos).toHaveCount(6);

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

  test("numera automaticamente las especialidades", async ({ page }) => {
    await page.goto("/");

    await expect(page.locator("#lista-areas .area-numero")).toHaveText([
      "01",
      "02",
      "03",
      "04",
      "05",
      "06",
    ]);
  });

  test("los enlaces de consulta conducen al contacto", async ({ page }) => {
    await page.goto("/");

    const enlaces = page.locator("#lista-areas .area-enlace");

    await expect(enlaces).toHaveCount(6);

    for (const enlace of await enlaces.all()) {
      await expect(enlace).toHaveAttribute("href", "#contacto");
    }

    const enlaceCivil = page.getByRole("link", {
      name: "Consultar sobre Derecho civil",
      exact: true,
    });

    await enlaceCivil.click();

    await expect(page).toHaveURL(/#contacto$/);

    await expect(page.locator("#contacto")).toBeInViewport();
  });

  test("las columnas se adaptan a la resolucion", async ({ page }) => {
    await page.goto("/");

    const columnas = await page
      .locator("#lista-areas")
      .evaluate(
        (elemento) =>
          getComputedStyle(elemento).gridTemplateColumns.trim().split(/\s+/)
            .length,
      );

    const ancho = page.viewportSize().width;

    const columnasEsperadas = ancho <= 700 ? 1 : ancho <= 1024 ? 2 : 3;

    expect(columnas).toBe(columnasEsperadas);
  });

  test("muestra un mensaje cuando no hay areas configuradas", async ({
    page,
  }) => {
    await configurarAreas(page, []);

    await page.goto("/");

    await expect(page.locator("#lista-areas article")).toHaveCount(0);

    await expect(page.locator(".areas-vacio")).toHaveText(
      "Las áreas de práctica se encuentran pendientes de configuración.",
    );
  });

  test("utiliza un icono seguro ante una configuracion invalida", async ({
    page,
  }) => {
    await configurarAreas(page, [
      {
        icono: "../../archivo-invalido",
        titulo: "Derecho comercial",
        descripcion: "Especialidad personalizada.",
      },
      {
        titulo: "Otra especialidad",
        descripcion: "Especialidad sin icono.",
      },
      null,
      {
        titulo: "",
        descripcion: "Registro invalido.",
      },
    ]);

    await page.goto("/");

    const tarjetas = page.locator("#lista-areas article");

    await expect(tarjetas).toHaveCount(2);

    const iconos = tarjetas.locator(".area-icono");

    for (const icono of await iconos.all()) {
      await expect(icono).toHaveAttribute(
        "src",
        "assets/icons/areas/general.svg",
      );
    }

    await expect(tarjetas.locator(".area-numero")).toHaveText(["01", "02"]);

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
      '<img src="inexistente" onerror="window.inyeccionEjecutada=true">';

    await configurarAreas(page, [
      {
        icono: "general",
        titulo: contenidoMalicioso,
        descripcion: "<strong>Texto de prueba</strong>",
      },
    ]);

    await page.goto("/");

    const tarjeta = page.locator("#lista-areas article");

    await expect(tarjeta).toHaveCount(1);

    await expect(tarjeta.locator("h3")).toHaveText(contenidoMalicioso);

    await expect(tarjeta.locator("p")).toHaveText(
      "<strong>Texto de prueba</strong>",
    );

    await expect(tarjeta.locator("h3 img")).toHaveCount(0);

    await expect(tarjeta.locator("p strong")).toHaveCount(0);

    const ejecucion = await page.evaluate(() => window.inyeccionEjecutada);

    expect(ejecucion).toBeUndefined();
  });
});
