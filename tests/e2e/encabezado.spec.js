const { test, expect } = require("@playwright/test");

test.describe("Encabezado premium", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("el logotipo carga correctamente", async ({ page }) => {
    const logo = page.locator(".brand-logo");

    await expect(logo).toBeVisible();

    await expect
      .poll(async () => {
        return logo.evaluate(
          (imagen) => imagen.complete && imagen.naturalWidth > 0,
        );
      })
      .toBe(true);
  });

  test("la identidad institucional es visible", async ({ page }) => {
    await expect(page.locator(".brand-nombre")).not.toBeEmpty();

    await expect(page.locator(".brand-subtitulo")).toBeVisible();
  });

  test("inicio se encuentra activo al cargar", async ({ page }) => {
    await expect(page.locator('#navegacion a[href="#inicio"]')).toHaveAttribute(
      "aria-current",
      "location",
    );
  });

  test("actualiza la seccion activa al navegar", async ({ page }) => {
    const menu = page.locator("#menu");

    if (await menu.isVisible()) {
      await menu.click();
    }

    const enlace = page.locator('#navegacion a[href="#areas"]');

    await enlace.click();

    await expect(enlace).toHaveAttribute("aria-current", "location");

    await expect(
      page.locator('#navegacion a[aria-current="location"]'),
    ).toHaveCount(1);
  });

  test("el encabezado permanece fijo al desplazarse", async ({ page }) => {
    await page.locator("#areas").scrollIntoViewIfNeeded();

    const encabezado = page.locator("#encabezado");

    await expect(encabezado).toHaveClass(/is-scrolled/);

    await expect(encabezado).toHaveCSS("position", "sticky");

    await expect(encabezado).toBeInViewport();
  });

  test("el boton de entrevista se adapta a la resolucion", async ({ page }) => {
    const boton = page.locator(".header-cta");

    const ancho = page.viewportSize().width;

    if (ancho <= 1024) {
      await expect(boton).toBeHidden();
    } else {
      await expect(boton).toBeVisible();

      await boton.click();

      await expect(page).toHaveURL(/#contacto$/);
    }
  });
});
