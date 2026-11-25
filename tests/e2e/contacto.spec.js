const { test, expect } = require("@playwright/test");

test.describe("Contacto y preguntas frecuentes", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("el botón principal conduce a contacto", async ({ page }) => {
    await page.locator('.hero a[href="#contacto"]').click();

    await expect(page).toHaveURL(/#contacto$/);

    await expect(page.locator("#contacto")).toBeInViewport();
  });

  test("no genera canales de contacto sin configurar", async ({ page }) => {
    await expect(page.locator("#canales a")).toHaveCount(0);
  });

  test("permite desplegar una pregunta frecuente", async ({ page }) => {
    const pregunta = page.locator("#preguntas details").first();

    await pregunta.locator("summary").click();

    await expect(pregunta).toHaveAttribute("open", "");

    await expect(pregunta.locator("p")).toBeVisible();
  });
});
