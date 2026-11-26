const { test, expect } = require("@playwright/test");

const documentos = [
  "/",
  "/privacidad.html",
  "/aviso-legal.html",
];

function metaNombre(page, nombre) {

  return page.locator(
    `head meta[name="${nombre}"]`
  );
}

function metaPropiedad(page, propiedad) {

  return page.locator(
    `head meta[property="${propiedad}"]`
  );
}

async function comprobarMeta(
  elemento,
  contenido
) {

  await expect(elemento).toHaveCount(1);

  await expect(elemento).toHaveAttribute(
    "content",
    contenido
  );
}

async function obtenerMetadatos(page) {

  return page.evaluate(() => {

    const obtener = (atributo, nombre) =>
      document.head.querySelector(
        `meta[${atributo}="${nombre}"]`
      )?.content || "";

    return {

      titulo: document.title,

      descripcion: obtener(
        "name",
        "description"
      ),

      robots: obtener(
        "name",
        "robots"
      ),

      tituloSocial: obtener(
        "property",
        "og:title"
      ),

      descripcionSocial: obtener(
        "property",
        "og:description"
      ),

      tarjeta: obtener(
        "name",
        "twitter:card"
      ),

      idioma: document.documentElement.lang,

      codificacion: document.characterSet,

    };
  });
}

test.describe("SEO y metadatos institucionales", () => {

  test("interpreta el titulo y la descripcion institucional", async ({ page }) => {

    await page.goto("/");

    await expect(page).toHaveTitle(
      "Estudio Jurídico | Demostración"
    );

    await expect(
      page.locator("head title")
    ).toHaveCount(1);

    await comprobarMeta(

      metaNombre(page, "description"),

      "Demostración de una página institucional para estudios jurídicos."

    );
  });

  test("interpreta los metadatos Open Graph", async ({ page }) => {

    await page.goto("/");

    const esperados = {

      "og:title":
        "Estudio Jurídico | Demostración",

      "og:description":
        "Demostración de una página institucional para estudios jurídicos.",

      "og:type":
        "website",

      "og:site_name":
        "Estudio Jurídico",

      "og:locale":
        "es_AR",

    };

    for (
      const [propiedad, contenido]
      of Object.entries(esperados)
    ) {

      await comprobarMeta(

        metaPropiedad(page, propiedad),

        contenido

      );
    }

    // No generar direcciones ficticias.

    await expect(
      metaPropiedad(page, "og:url")
    ).toHaveCount(0);

    await expect(
      metaPropiedad(page, "og:image")
    ).toHaveCount(0);
  });

  test("interpreta Twitter Cards sin imagen social", async ({ page }) => {

    await page.goto("/");

    await comprobarMeta(

      metaNombre(page, "twitter:card"),

      "summary"

    );

    await comprobarMeta(

      metaNombre(page, "twitter:title"),

      "Estudio Jurídico | Demostración"

    );

    await comprobarMeta(

      metaNombre(page, "twitter:description"),

      "Demostración de una página institucional para estudios jurídicos."

    );

    await expect(
      metaNombre(page, "twitter:image")
    ).toHaveCount(0);
  });

  test("mantiene bloqueada la indexacion en todos los documentos", async ({ page }) => {

    for (const documento of documentos) {

      await page.goto(documento);

      await comprobarMeta(

        metaNombre(page, "robots"),

        "noindex,nofollow"

      );

      await expect(
        page.locator('head link[rel="canonical"]')
      ).toHaveCount(0);
    }
  });

  test("interpreta correctamente el idioma y la codificacion", async ({ page }) => {

    for (const documento of documentos) {

      const respuesta = await page.goto(
        documento
      );

      expect(respuesta.ok()).toBe(true);

      const html = await respuesta.text();

      const posicionCharset =
        html.indexOf('<meta charset="utf-8"');

      const posicionSeo =
        html.indexOf("<!-- SEO:INICIO -->");

      expect(
        posicionCharset
      ).toBeGreaterThanOrEqual(0);

      expect(
        posicionSeo
      ).toBeGreaterThan(posicionCharset);

      const finCharset =
        html.indexOf(">", posicionCharset) + 1;

      expect(

        Buffer.byteLength(
          html.slice(0, finCharset),
          "utf8"
        )

      ).toBeLessThanOrEqual(1024);

      await expect(
        page.locator("html")
      ).toHaveAttribute("lang", "es-AR");

      expect(

        await page.evaluate(
          () => document.characterSet
        )

      ).toBe("UTF-8");

      await expect(
        page.locator("head meta[charset]")
      ).toHaveCount(1);
    }
  });

  test("interpreta los metadatos de privacidad", async ({ page }) => {

    await page.goto("/privacidad.html");

    await expect(page).toHaveTitle(
      "Privacidad"
    );

    await comprobarMeta(

      metaNombre(page, "description"),

      "Información institucional sobre privacidad y tratamiento de datos."

    );

    await comprobarMeta(

      metaPropiedad(page, "og:title"),

      "Privacidad"

    );

    await comprobarMeta(

      metaNombre(page, "twitter:title"),

      "Privacidad"

    );
  });

  test("interpreta los metadatos del aviso legal", async ({ page }) => {

    await page.goto("/aviso-legal.html");

    await expect(page).toHaveTitle(
      "Aviso legal"
    );

    await comprobarMeta(

      metaNombre(page, "description"),

      "Información sobre el alcance y las condiciones de uso del sitio institucional."

    );

    await comprobarMeta(

      metaPropiedad(page, "og:title"),

      "Aviso legal"

    );

    await comprobarMeta(

      metaNombre(page, "twitter:title"),

      "Aviso legal"

    );
  });

  test.describe("SEO sin JavaScript", () => {

    test.use({
      javaScriptEnabled: false,
    });

    test("los metadatos permanecen disponibles sin ejecutar scripts", async ({ page }) => {

      const titulos = {

        "/":
          "Estudio Jurídico | Demostración",

        "/privacidad.html":
          "Privacidad",

        "/aviso-legal.html":
          "Aviso legal",

      };

      for (const documento of documentos) {

        await page.goto(documento);

        const datos = await obtenerMetadatos(
          page
        );

        expect(datos.titulo).toBe(
          titulos[documento]
        );

        expect(
          datos.descripcion.length
        ).toBeGreaterThan(0);

        expect(datos.tituloSocial).toBe(
          datos.titulo
        );

        expect(datos.descripcionSocial).toBe(
          datos.descripcion
        );

        expect(datos.robots).toBe(
          "noindex,nofollow"
        );

        expect(datos.tarjeta).toBe(
          "summary"
        );

        expect(datos.idioma).toBe(
          "es-AR"
        );

        expect(datos.codificacion).toBe(
          "UTF-8"
        );
      }
    });
  });
});
