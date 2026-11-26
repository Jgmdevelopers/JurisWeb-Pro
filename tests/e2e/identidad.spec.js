const { test, expect } = require("@playwright/test");

const recursos = {
  logo: "assets/images/branding/logo.svg",
  favicon: "assets/images/branding/logo.svg",
  imagenHero: "assets/images/hero/despacho-juridico.webp",
  imagenEstudio: "assets/images/estudio/estudio-juridico.webp",
};

/**
 * Personaliza la identidad sin modificar
 * la configuracion real del proyecto.
 */
async function configurarIdentidad(page, cambios = {}) {
  await page.route("**/config/estudio.js", async ruta => {
    const respuesta = await ruta.fetch();
    const contenido = await respuesta.text();

    await ruta.fulfill({
      response: respuesta,
      body:
        contenido +
        "\nwindow.ESTUDIO.identidad = " +
        JSON.stringify({
          ...recursos,
          ...cambios,
        }) +
        ";",
    });
  });
}

/**
 * Comprueba que una imagen se cargo correctamente.
 */
async function comprobarImagen(imagen) {
  await expect.poll(async () =>
    imagen.evaluate(elemento =>
      elemento.complete &&
      elemento.naturalWidth > 0
    )
  ).toBe(true);
}

/**
 * Reutiliza recursos existentes para simular
 * una identidad institucional diferente.
 */
async function prepararRecursosAlternativos(page) {

  await page.route(
    "**/assets/images/branding/logo-prueba.svg",
    async ruta => {
      const respuesta = await ruta.fetch({
        url: ruta.request().url().replace(
          "logo-prueba.svg",
          "logo.svg"
        ),
      });

      await ruta.fulfill({
        response: respuesta,
      });
    }
  );

  await page.route(
    "**/assets/images/branding/favicon-prueba.svg",
    async ruta => {
      const respuesta = await ruta.fetch({
        url: ruta.request().url().replace(
          "favicon-prueba.svg",
          "logo.svg"
        ),
      });

      await ruta.fulfill({
        response: respuesta,
      });
    }
  );
}

test.describe("Identidad visual configurable", () => {

  test("conserva los recursos graficos predeterminados", async ({ page }) => {
    await page.goto("/");

    const logos = page.locator(
      "[data-logo-institucional]"
    );

    await expect(logos).toHaveCount(2);

    for (const logo of await logos.all()) {
      await expect(logo).toHaveAttribute(
        "src",
        recursos.logo
      );

      await comprobarImagen(logo);
    }

    await expect(
      page.locator("[data-imagen-estudio]")
    ).toHaveAttribute(
      "src",
      recursos.imagenEstudio
    );

    await expect(
      page.locator('link[rel="icon"]')
    ).toHaveAttribute(
      "href",
      recursos.favicon
    );

    const fondo = await page.locator(".hero").evaluate(
      elemento =>
        getComputedStyle(elemento, "::before")
          .backgroundImage
    );

    expect(fondo).toContain(
      "despacho-juridico.webp"
    );
  });

  test("personaliza los logotipos del encabezado y footer", async ({ page }) => {
    await prepararRecursosAlternativos(page);

    const logoAlternativo =
      "assets/images/branding/logo-prueba.svg";

    await configurarIdentidad(page, {
      logo: logoAlternativo,
    });

    await page.goto("/");

    const logos = page.locator(
      "[data-logo-institucional]"
    );

    await expect(logos).toHaveCount(2);

    for (const logo of await logos.all()) {
      await expect(logo).toHaveAttribute(
        "src",
        logoAlternativo
      );

      await comprobarImagen(logo);
    }
  });

  test("permite personalizar el favicon institucional", async ({ page }) => {
    await prepararRecursosAlternativos(page);

    const faviconAlternativo =
      "assets/images/branding/favicon-prueba.svg";

    await configurarIdentidad(page, {
      favicon: faviconAlternativo,
    });

    await page.goto("/");

    const favicon = page.locator(
      'link[rel="icon"]'
    );

    await expect(favicon).toHaveAttribute(
      "href",
      faviconAlternativo
    );

    await expect(favicon).toHaveAttribute(
      "type",
      "image/svg+xml"
    );
  });

  test("personaliza la fotografia de fondo del hero", async ({ page }) => {
    await configurarIdentidad(page, {
      imagenHero: recursos.imagenEstudio,
    });

    await page.goto("/");

    await expect.poll(async () =>
      page.locator(".hero").evaluate(elemento =>
        getComputedStyle(elemento, "::before")
          .backgroundImage
      )
    ).toContain("estudio-juridico.webp");
  });

  test("personaliza la fotografia institucional", async ({ page }) => {
    await configurarIdentidad(page, {
      imagenEstudio: recursos.imagenHero,
    });

    await page.goto("/");

    const imagen = page.locator(
      "[data-imagen-estudio]"
    );

    await expect(imagen).toHaveAttribute(
      "src",
      recursos.imagenHero
    );

    await imagen.scrollIntoViewIfNeeded();

    await comprobarImagen(imagen);
  });

  test("permite configurar el texto alternativo de la fotografia", async ({ page }) => {
    await configurarIdentidad(page, {
      imagenEstudioAlt:
        "Interior del estudio jurídico de prueba.",
    });

    await page.goto("/");

    await expect(
      page.locator("[data-imagen-estudio]")
    ).toHaveAttribute(
      "alt",
      "Interior del estudio jurídico de prueba."
    );
  });

  test("rechaza rutas externas y formatos no permitidos", async ({ page }) => {
    await configurarIdentidad(page, {
      logo: "https://example.com/logo.svg",
      favicon: "javascript:alert(1)",
      imagenHero: "../../imagen.webp",
      imagenEstudio: "assets/images/prueba.html",
    });

    await page.goto("/");

    const logos = page.locator(
      "[data-logo-institucional]"
    );

    for (const logo of await logos.all()) {
      await expect(logo).toHaveAttribute(
        "src",
        recursos.logo
      );
    }

    await expect(
      page.locator('link[rel="icon"]')
    ).toHaveAttribute(
      "href",
      recursos.favicon
    );

    await expect(
      page.locator("[data-imagen-estudio]")
    ).toHaveAttribute(
      "src",
      recursos.imagenEstudio
    );

    const fondo = await page.locator(".hero").evaluate(
      elemento =>
        getComputedStyle(elemento, "::before")
          .backgroundImage
    );

    expect(fondo).toContain(
      "despacho-juridico.webp"
    );
  });

  test("recupera los recursos originales ante errores de carga", async ({ page }) => {
    await page.route(
      "**/assets/images/**/inexistente.*",
      ruta => ruta.fulfill({
        status: 404,
        body: "",
      })
    );

    await configurarIdentidad(page, {
      logo: "assets/images/branding/inexistente.svg",
      favicon: "assets/images/branding/inexistente.svg",
      imagenHero: "assets/images/hero/inexistente.webp",
      imagenEstudio: "assets/images/estudio/inexistente.webp",
    });

    await page.goto("/");

    const logos = page.locator(
      "[data-logo-institucional]"
    );

    for (const logo of await logos.all()) {
      await expect(logo).toHaveAttribute(
        "src",
        recursos.logo
      );

      await comprobarImagen(logo);
    }

    const imagen = page.locator(
      "[data-imagen-estudio]"
    );

    await imagen.scrollIntoViewIfNeeded();

    await expect(imagen).toHaveAttribute(
      "src",
      recursos.imagenEstudio
    );

    await comprobarImagen(imagen);

    await expect(
      page.locator('link[rel="icon"]')
    ).toHaveAttribute(
      "href",
      recursos.favicon
    );

    const fondo = await page.locator(".hero").evaluate(
      elemento =>
        getComputedStyle(elemento, "::before")
          .backgroundImage
    );

    expect(fondo).toContain(
      "despacho-juridico.webp"
    );
  });

  test("personaliza el favicon de las paginas legales", async ({ page }) => {
    await prepararRecursosAlternativos(page);

    const faviconAlternativo =
      "assets/images/branding/favicon-prueba.svg";

    await configurarIdentidad(page, {
      favicon: faviconAlternativo,
    });

    for (const destino of [
      "/privacidad.html",
      "/aviso-legal.html",
    ]) {

      await page.goto(destino);

      await expect(
        page.locator('link[rel="icon"]')
      ).toHaveAttribute(
        "href",
        faviconAlternativo
      );
    }
  });

  test.describe("Funcionamiento sin JavaScript", () => {

    test.use({
      javaScriptEnabled: false,
    });

    test("conserva los recursos graficos estaticos", async ({ page }) => {
      await page.goto("/");

      const logos = page.locator(
        "[data-logo-institucional]"
      );

      await expect(logos).toHaveCount(2);

      for (const logo of await logos.all()) {
        await expect(logo).toHaveAttribute(
          "src",
          recursos.logo
        );
      }

      await expect(
        page.locator("[data-imagen-estudio]")
      ).toHaveAttribute(
        "src",
        recursos.imagenEstudio
      );

      await expect(
        page.locator('link[rel="icon"]')
      ).toHaveAttribute(
        "href",
        recursos.favicon
      );

      await expect(
        page.locator(".hero h1")
      ).toBeVisible();
    });

  });

});
