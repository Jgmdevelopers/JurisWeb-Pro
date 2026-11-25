const { test, expect } = require("@playwright/test");

test.describe("Animaciones y accesibilidad", () => {
  test("las animaciones se inicializan correctamente", async ({ page }) => {
    await page.emulateMedia({
      reducedMotion: "no-preference",
    });

    await page.goto("/");

    await expect(page.locator("html")).toHaveClass(/motion-ready/);
  });

  test("las tarjetas aparecen al ingresar en pantalla", async ({ page }) => {
    await page.emulateMedia({
      reducedMotion: "no-preference",
    });

    await page.goto("/");

    const tarjeta = page.locator("#lista-areas article").first();

    await tarjeta.scrollIntoViewIfNeeded();

    await expect(tarjeta).toHaveClass(/is-visible/);

    await expect(tarjeta).toHaveCSS("opacity", "1");
  });

  test("respeta la preferencia de movimiento reducido", async ({ page }) => {
    await page.emulateMedia({
      reducedMotion: "reduce",
    });

    await page.goto("/");

    await expect(page.locator("html")).not.toHaveClass(/motion-ready/);

    await expect(page.locator("html")).toHaveCSS("scroll-behavior", "auto");

    await expect(page.locator(".hero-art svg")).toHaveCSS(
      "animation-name",
      "none",
    );

    await expect(page.locator("h1")).toBeVisible();
  });

  test("permite acceder al enlace de salto por teclado", async ({ page }) => {
    await page.goto("/");

    await page.keyboard.press("Tab");

    await expect(page.locator(".skip")).toBeFocused();
  });
});

test.describe("Funcionamiento sin JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("el contenido principal permanece visible", async ({ page }) => {
    await page.goto("/");

    await expect(page.locator("h1")).toBeVisible();

    await expect(page.locator("#lista-areas article").first()).toHaveCSS(
      "opacity",
      "1",
    );

    await expect(page.locator("#navegacion")).toBeVisible();
  });
});
