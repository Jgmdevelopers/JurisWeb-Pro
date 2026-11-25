const { test, expect } = require("@playwright/test");

test.describe("Presentacion institucional premium", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("la fotografia institucional carga correctamente", async ({ page }) => {
    const imagen = page.locator(".estudio-imagen");

    await imagen.scrollIntoViewIfNeeded();

    await expect(imagen).toBeInViewport();

    await expect
      .poll(async () => {
        return imagen.evaluate(
          (elemento) => elemento.complete && elemento.naturalWidth > 0,
        );
      })
      .toBe(true);
  });

  test("la presentacion institucional contiene texto", async ({ page }) => {
    await expect(page.locator("#estudio h2")).toBeVisible();

    await expect(
      page.locator('#estudio [data-field="presentacion"]'),
    ).not.toBeEmpty();

    await expect(
      page.locator('#estudio [data-field="enfoque"]'),
    ).not.toBeEmpty();
  });

  test("presenta los tres valores institucionales", async ({ page }) => {
    await expect(page.locator(".estudio-valor")).toHaveCount(3);

    await expect(page.locator(".estudio-valor .estudio-icono")).toHaveCount(3);
  });

  test("permite navegar hacia las areas de practica", async ({ page }) => {
    await page.locator(".estudio-cta").click();

    await expect(page).toHaveURL(/#areas$/);

    await expect(page.locator("#areas")).toBeInViewport();
  });

  test("la composicion se adapta a la resolucion", async ({ page }) => {
    const columnas = await page
      .locator(".estudio-composicion")
      .evaluate(
        (elemento) =>
          getComputedStyle(elemento).gridTemplateColumns.trim().split(/\s+/)
            .length,
      );

    const ancho = page.viewportSize().width;

    expect(columnas).toBe(ancho <= 700 ? 1 : 2);
  });

  test("la imagen permanece visible con movimiento reducido", async ({
    page,
  }) => {
    await page.emulateMedia({
      reducedMotion: "reduce",
    });

    await page.reload();

    const fotografia = page.locator(".estudio-fotografia");

    await fotografia.scrollIntoViewIfNeeded();

    await expect(fotografia).toHaveCSS("opacity", "1");

    await expect(fotografia).toHaveCSS("transform", "none");
  });
});
