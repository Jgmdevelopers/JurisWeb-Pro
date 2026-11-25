const { test, expect } = require("@playwright/test");

test.describe("Navegación principal", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  const secciones = [
    { nombre: "Inicio", id: "inicio" },
    { nombre: "El estudio", id: "estudio" },
    { nombre: "Áreas", id: "areas" },
    { nombre: "Equipo", id: "equipo" },
    { nombre: "Contacto", id: "contacto" },
  ];

  for (const seccion of secciones) {
    test(`permite navegar hacia ${seccion.nombre}`, async ({ page }) => {
      const menu = page.locator("#menu");

      if (await menu.isVisible()) {
        await menu.click();
      }

      await page.locator(`#navegacion a[href="#${seccion.id}"]`).click();

      await expect(page).toHaveURL(new RegExp(`#${seccion.id}$`));

      await expect(page.locator(`#${seccion.id}`)).toBeInViewport();
    });
  }

  test("el menú móvil abre y cierra correctamente", async ({ page }) => {
    const menu = page.locator("#menu");

    test.skip(
      !(await menu.isVisible()),
      "Prueba exclusiva de navegación móvil",
    );

    const navegacion = page.locator("#navegacion");

    await menu.click();

    await expect(navegacion).toBeVisible();

    await expect(menu).toHaveAttribute("aria-expanded", "true");

    await menu.click();

    await expect(navegacion).toBeHidden();

    await expect(menu).toHaveAttribute("aria-expanded", "false");
  });

  test("Escape cierra el menú móvil y devuelve el foco", async ({ page }) => {
    const menu = page.locator("#menu");

    test.skip(
      !(await menu.isVisible()),
      "Prueba exclusiva de navegación móvil",
    );

    await menu.click();

    await page.keyboard.press("Escape");

    await expect(page.locator("#navegacion")).toBeHidden();

    await expect(menu).toBeFocused();
  });

  test("permite acceder a la política de privacidad", async ({ page }) => {
    await page.locator('footer a[href="privacidad.html"]').click();

    await expect(page).toHaveURL(/privacidad\.html$/);
  });

  test("permite acceder al aviso legal", async ({ page }) => {
    await page.locator('footer a[href="aviso-legal.html"]').click();

    await expect(page).toHaveURL(/aviso-legal\.html$/);
  });
});
