const { test, expect } = require("@playwright/test");

test.describe("Hero premium", () => {
  test("la fotografia institucional esta disponible", async ({
    page,
    request,
  }) => {
    const respuesta = await request.get(
      "/assets/images/hero/despacho-juridico.webp",
    );

    expect(respuesta.ok()).toBeTruthy();

    expect(respuesta.headers()["content-type"]).toContain("image/webp");

    await page.goto("/");

    const fondo = await page
      .locator(".hero")
      .evaluate(
        (elemento) => getComputedStyle(elemento, "::before").backgroundImage,
      );

    expect(fondo).toContain("despacho-juridico.webp");
  });

  test("el hero incorpora acercamiento cinematografico", async ({ page }) => {
    await page.emulateMedia({
      reducedMotion: "no-preference",
    });

    await page.goto("/");

    const animacion = await page
      .locator(".hero")
      .evaluate(
        (elemento) => getComputedStyle(elemento, "::before").animationName,
      );

    expect(animacion).toBe("acercamientoCinematografico");
  });

  test("desactiva el acercamiento con movimiento reducido", async ({
    page,
  }) => {
    await page.emulateMedia({
      reducedMotion: "reduce",
    });

    await page.goto("/");

    const animacion = await page
      .locator(".hero")
      .evaluate(
        (elemento) => getComputedStyle(elemento, "::before").animationName,
      );

    expect(animacion).toBe("none");
  });

  test("el contenido principal permanece accesible", async ({ page }) => {
    await page.goto("/");

    await expect(page.locator(".hero h1")).toBeVisible();

    await expect(page.locator(".hero .btn")).toBeVisible();

    await expect(page.locator(".hero .secondary")).toBeVisible();
  });
});
