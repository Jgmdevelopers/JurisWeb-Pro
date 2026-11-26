const { test, expect } = require("@playwright/test");

const prefijoSvg =
  "data:image/svg+xml;charset=utf-8,";

/**
 * Configura temporalmente una identidad corporativa.
 */
async function configurarTema(page, nombre) {

  await page.route(
    "**/config/estudio.js",
    async ruta => {

      const respuesta = await ruta.fetch();

      const contenido = await respuesta.text();

      await ruta.fulfill({
        response: respuesta,
        body:
          contenido +
          "\nwindow.ESTUDIO.tema = " +
          JSON.stringify({
            preestablecido: nombre,
            colores: {},
            tipografias: {
              titulos: "georgia",
              cuerpo: "sistema",
            },
          }) +
          ";",
      });
    }
  );
}

/**
 * Obtiene el contenido SVG adaptado.
 */
async function obtenerSvg(imagen) {

  const src =
    await imagen.getAttribute("src");

  expect(src).toBeTruthy();

  expect(src.startsWith(prefijoSvg)).toBe(true);

  return decodeURIComponent(
    src.slice(prefijoSvg.length)
  );
}

/**
 * Comprueba la carga de recursos graficos,
 * incluyendo aquellos ocultos por configuracion.
 */
async function comprobarCarga(imagen) {

  if (await imagen.isVisible()) {
    await imagen.scrollIntoViewIfNeeded();
  }

  await expect.poll(async () =>

    imagen.evaluate(async elemento => {

      if (
        elemento.complete &&
        elemento.naturalWidth > 0
      ) {
        return true;
      }

      const recurso = new Image();

      recurso.src = elemento.src;

      try {

        await recurso.decode();

        return recurso.naturalWidth > 0;

      } catch {

        return false;
      }

    })

  ).toBe(true);
}

/**
 * Comprueba la adaptacion cromatica de un grupo.
 */
async function comprobarIconos(iconos, color) {

  expect(await iconos.count()).toBeGreaterThan(0);

  for (const icono of await iconos.all()) {

    await expect(icono).toHaveAttribute(
      "src",
      /^data:image\/svg\+xml/
    );

    const svg = await obtenerSvg(icono);

    expect(svg).toContain(color);

    await comprobarCarga(icono);
  }
}

/**
 * Cambia el tema sin recargar la pagina.
 */
async function cambiarTema(page, nombre) {

  await page.evaluate(tema => {

    window.ESTUDIO.tema.preestablecido = tema;

    const script = document.createElement(
      "script"
    );

    script.src = "assets/js/tema.js";

    document.head.append(script);

  }, nombre);

  await expect(
    page.locator("html")
  ).toHaveAttribute(
    "data-tema",
    nombre
  );
}

test.describe("Iconografia institucional adaptable", () => {

  test("conserva los recursos originales en el tema clasico", async ({ page }) => {

    await configurarTema(page, "clasico");

    await page.goto("/");

    const iconos = page.locator(
      'img[src^="assets/icons/"]'
    );

    expect(
      await iconos.count()
    ).toBeGreaterThan(0);

    await expect(
      page.locator('img[src^="data:image/svg+xml"]')
    ).toHaveCount(0);

    for (const icono of await iconos.all()) {

      await expect(icono).toHaveAttribute(
        "src",
        /^assets\/icons\/.*\.svg$/
      );
    }
  });

  test("adapta los iconos de areas juridicas", async ({ page }) => {

    await configurarTema(page, "grafito");

    await page.goto("/");

    await comprobarIconos(
      page.locator(".area-icono"),
      "#536979"
    );
  });

  test("adapta los iconos del proceso de consulta", async ({ page }) => {

    await configurarTema(page, "verde");

    await page.goto("/");

    await comprobarIconos(
      page.locator(".consulta-icono"),
      "#e2cfa3"
    );
  });

  test("adapta ambos colores del icono de evaluacion", async ({ page }) => {

    await configurarTema(page, "grafito");

    await page.goto("/");

    const iconos = page.locator(
      ".consulta-icono"
    );

    await expect(
      iconos.first()
    ).toHaveAttribute(
      "src",
      /^data:image\/svg\+xml/
    );

    let encontrado = false;

    for (const icono of await iconos.all()) {

      const svg = await obtenerSvg(icono);

      if (
        svg.includes("#202328") &&
        svg.includes("#dce4ec")
      ) {

        encontrado = true;

        await comprobarCarga(icono);
      }
    }

    expect(encontrado).toBe(true);
  });

  test("adapta la iconografia de contacto", async ({ page }) => {

    await configurarTema(page, "borgona");

    await page.goto("/");

    await comprobarIconos(
      page.locator(
        '#contacto img[src^="data:image/svg+xml"]'
      ),
      "#e5cda7"
    );
  });

  test("adapta los iconos funcionales del footer", async ({ page }) => {

    await configurarTema(page, "grafito");

    await page.goto("/");

    await comprobarIconos(
      page.locator(
        ".footer-ubicacion img, .footer-aviso img"
      ),
      "#dce4ec"
    );
  });

  test("adapta la imagen alternativa del profesional", async ({ page }) => {

    await configurarTema(page, "verde");

    await page.goto("/");

    const imagen = page.locator(
      ".profesional-fotografia img"
    ).first();

    await expect(imagen).toHaveAttribute(
      "src",
      /^data:image\/svg\+xml/
    );

    const svg = await obtenerSvg(imagen);

    expect(svg).toContain("#172f29");

    expect(svg).toContain("#c3a979");

    await comprobarCarga(imagen);
  });

  test("preserva los logotipos y fotografias institucionales", async ({ page }) => {

    await configurarTema(page, "grafito");

    await page.goto("/");

    const logos = page.locator(
      "[data-logo-institucional]"
    );

    await expect(logos).toHaveCount(2);

    for (const logo of await logos.all()) {

      await expect(logo).toHaveAttribute(
        "src",
        "assets/images/branding/logo.svg"
      );
    }

    await expect(
      page.locator("[data-imagen-estudio]")
    ).toHaveAttribute(
      "src",
      "assets/images/estudio/estudio-juridico.webp"
    );

    await expect(
      page.locator('link[rel="icon"]')
    ).toHaveAttribute(
      "href",
      "assets/images/branding/logo.svg"
    );
  });

  test("actualiza y restaura los iconos al cambiar de tema", async ({ page }) => {

    await configurarTema(page, "clasico");

    await page.goto("/");

    const icono = page.locator(
      ".area-icono"
    ).first();

    const original =
      await icono.getAttribute("src");

    expect(original).toMatch(
      /^assets\/icons\/areas\/.*\.svg$/
    );

    await cambiarTema(page, "grafito");

    await expect(icono).toHaveAttribute(
      "src",
      /^data:image\/svg\+xml/
    );

    expect(
      await obtenerSvg(icono)
    ).toContain("#536979");

    await cambiarTema(page, "verde");

    await expect.poll(async () =>
      decodeURIComponent(
        await icono.getAttribute("src")
      )
    ).toContain("#70582f");

    await cambiarTema(page, "clasico");

    await expect(icono).toHaveAttribute(
      "src",
      original
    );

    await comprobarCarga(icono);
  });

  test.describe("Funcionamiento sin JavaScript", () => {

    test.use({
      javaScriptEnabled: false,
    });

    test("conserva la iconografia estatica original", async ({ page }) => {

      await page.goto("/");

      const iconos = page.locator(
        'img[src^="assets/icons/"]'
      );

      expect(
        await iconos.count()
      ).toBeGreaterThan(0);

      await expect(
        page.locator(
          'img[src^="data:image/svg+xml"]'
        )
      ).toHaveCount(0);

      for (const icono of await iconos.all()) {

        await expect(icono).toHaveAttribute(
          "src",
          /^assets\/icons\/.*\.svg$/
        );
      }
    });
  });
});
