const { test, expect } = require("@playwright/test");

test.describe("Diseño responsive", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("la página principal carga correctamente", async ({ page }) => {
    await expect(page.locator("h1")).toBeVisible();

    await expect(page.locator("main")).toBeVisible();

    await expect(page.locator("footer")).toBeVisible();
  });

  test("no existe desbordamiento horizontal", async ({ page }) => {
    await expect
      .poll(async () => {
        return page.evaluate(() => {
          const anchoVentana = document.documentElement.clientWidth;

          const anchoContenido = Math.max(
            document.documentElement.scrollWidth,
            document.body.scrollWidth,
          );

          return anchoContenido <= anchoVentana + 1;
        });
      })
      .toBe(true);
  });

  test("el encabezado se adapta a la resolución", async ({ page }) => {
    const ancho = page.viewportSize().width;

    const menu = page.locator("#menu");

    const navegacion = page.locator("#navegacion");

    if (ancho <= 700) {
      await expect(menu).toBeVisible();

      await expect(navegacion).toBeHidden();
    } else {
      await expect(menu).toBeHidden();

      await expect(navegacion).toBeVisible();
    }
  });

  test("no existen errores JavaScript durante la carga", async ({ page }) => {
    const errores = [];

    page.on("pageerror", (error) => {
      errores.push(error.message);
    });

    await page.reload();

    await expect(page.locator("h1")).toBeVisible();

    expect(errores).toEqual([]);
  });
});

test("los recursos esenciales cargan sin errores", async ({ page }) => {
  const errores = [];

  page.on("pageerror", (error) => {
    errores.push(`JavaScript: ${error.message}`);
  });

  page.on("requestfailed", (solicitud) => {
    errores.push(
      `Solicitud: ${solicitud.url()} - ${solicitud.failure()?.errorText}`,
    );
  });

  page.on("response", (respuesta) => {
    if (respuesta.status() >= 400) {
      errores.push(`HTTP ${respuesta.status()}: ${respuesta.url()}`);
    }
  });

  await page.goto("/", {
    waitUntil: "load",
  });

  expect(errores).toEqual([]);
});