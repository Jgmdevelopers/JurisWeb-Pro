const { test, expect } = require("@playwright/test");

const cantidadCampos = 56;

/**
 * Modifica exclusivamente la configuracion
 * editorial durante una prueba.
 */
async function configurarEditorial(page, expresion) {

  await page.route(
    "**/config/estudio.js",
    async ruta => {

      const respuesta = await ruta.fetch();

      const contenido = await respuesta.text();

      await ruta.fulfill({
        response: respuesta,
        body:
          contenido +
          "\nwindow.ESTUDIO.textos = (" +
          expresion +
          ");",
      });
    }
  );
}

/**
 * Aplica una configuracion editorial parcial.
 */
async function configurarTextos(page, textos) {

  await configurarEditorial(
    page,
    JSON.stringify(textos)
  );
}

/**
 * Localiza un campo editorial.
 */
function campoEditorial(page, campo) {

  return page.locator(
    `[data-texto="${campo}"]`
  );
}

/**
 * Comprueba el contenido de varios campos.
 */
async function comprobarTextos(page, campos) {

  for (
    const [campo, texto]
    of Object.entries(campos)
  ) {

    const elemento = campoEditorial(
      page,
      campo
    );

    await expect(elemento).toHaveCount(1);

    await expect(elemento).toHaveText(texto);
  }
}

test.describe("Configuracion editorial institucional", () => {

  test("vincula todos los campos definidos en la configuracion", async ({ page }) => {

    await page.goto("/");

    const resultado = await page.evaluate(() => {

      function obtenerCampos(objeto, prefijo = "") {

        return Object.entries(objeto).flatMap(
          ([clave, valor]) => {

            const ruta = prefijo
              ? `${prefijo}.${clave}`
              : clave;

            if (
              valor !== null &&
              typeof valor === "object" &&
              !Array.isArray(valor)
            ) {

              return obtenerCampos(
                valor,
                ruta
              );
            }

            return [ruta];
          }
        );
      }

      const definidos = obtenerCampos(
        window.ESTUDIO.textos
      ).sort();

      const elementos = Array.from(
        document.querySelectorAll(
          "[data-texto]"
        )
      );

      const vinculados = elementos.map(
        elemento => elemento.dataset.texto
      ).sort();

      return {
        definidos,
        vinculados,

        unicos: new Set(vinculados).size,

        invalidos: elementos.filter(
          elemento =>
            elemento.children.length > 0
        ).length,
      };
    });

    expect(
      resultado.definidos
    ).toHaveLength(cantidadCampos);

    expect(
      resultado.vinculados
    ).toEqual(resultado.definidos);

    expect(
      resultado.unicos
    ).toBe(cantidadCampos);

    expect(
      resultado.invalidos
    ).toBe(0);
  });

  test("conserva los textos originales de la plantilla", async ({ page }) => {

    const respuesta = await page.request.get("/");

    expect(respuesta.ok()).toBe(true);

    const htmlOriginal = await respuesta.text();

    await page.goto("/");

    const diferencias = await page.evaluate(html => {

      const documentoOriginal =
        new DOMParser().parseFromString(
          html,
          "text/html"
        );

      const normalizar = texto =>
        texto.replace(/\s+/g, " ").trim();

      const elementos = Array.from(
        document.querySelectorAll(
          "[data-texto]"
        )
      );

      return elementos.flatMap(elemento => {

        const campo = elemento.dataset.texto;

        const original =
          documentoOriginal.querySelector(
            `[data-texto="${campo}"]`
          );

        if (!original) {
          return [campo];
        }

        return normalizar(
          elemento.textContent
        ) === normalizar(
          original.textContent
        )
          ? []
          : [campo];
      });

    }, htmlOriginal);

    expect(diferencias).toEqual([]);

    await expect(
      page.locator("[data-texto]")
    ).toHaveCount(cantidadCampos);
  });

  test("personaliza los textos del encabezado", async ({ page }) => {

    await configurarTextos(page, {

      encabezado: {
        inicio: "Principal",
        estudio: "Nosotros",
        areas: "Especialidades",
        equipo: "Profesionales",
        contacto: "Consultas",
        cta: "Coordinar cita",
      },

    });

    await page.goto("/");

    await comprobarTextos(page, {
      "encabezado.inicio": "Principal",
      "encabezado.estudio": "Nosotros",
      "encabezado.areas": "Especialidades",
      "encabezado.equipo": "Profesionales",
      "encabezado.contacto": "Consultas",
      "encabezado.cta": "Coordinar cita",
    });

    await expect(
      campoEditorial(page, "encabezado.cta")
    ).toHaveAttribute("href", "#contacto");
  });

  test("personaliza el contenido principal del hero", async ({ page }) => {

    await configurarTextos(page, {

      hero: {
        etiqueta: "SERVICIOS JURÍDICOS",

        titulo:
          "Experiencia jurídica a tu servicio.",

        descripcion:
          "Atención profesional y personalizada.",

        ctaPrincipal: "Coordinar consulta",

        ctaSecundaria: "Ver especialidades",
      },

    });

    await page.goto("/");

    await comprobarTextos(page, {
      "hero.etiqueta": "SERVICIOS JURÍDICOS",

      "hero.titulo":
        "Experiencia jurídica a tu servicio.",

      "hero.descripcion":
        "Atención profesional y personalizada.",

      "hero.ctaPrincipal": "Coordinar consulta",

      "hero.ctaSecundaria": "Ver especialidades",
    });

    await expect(
      page.locator("#inicio [data-field='ciudad']")
    ).toHaveCount(1);

    await expect(
      campoEditorial(page, "hero.ctaPrincipal")
    ).toHaveAttribute("href", "#contacto");

    await expect(
      campoEditorial(page, "hero.ctaSecundaria")
    ).toHaveAttribute("href", "#areas");
  });

  test("personaliza el estudio y sus valores institucionales", async ({ page }) => {

    await configurarTextos(page, {

      estudio: {
        etiqueta: "NUESTRA FIRMA",
        titulo: "Una atención cercana.",
        leyenda: "Respeto y compromiso",
        cta: "Ver servicios jurídicos",

        valores: {

          confidencialidad: {
            titulo: "Privacidad",

            descripcion:
              "Resguardo de la información.",
          },

          comunicacion: {
            titulo: "Claridad",

            descripcion:
              "Comunicación comprensible.",
          },

          rigor: {
            titulo: "Responsabilidad",

            descripcion:
              "Evaluación profesional individual.",
          },

        },
      },

    });

    await page.goto("/");

    await comprobarTextos(page, {

      "estudio.etiqueta": "NUESTRA FIRMA",
      "estudio.titulo": "Una atención cercana.",
      "estudio.leyenda": "Respeto y compromiso",
      "estudio.cta": "Ver servicios jurídicos",

      "estudio.valores.confidencialidad.titulo":
        "Privacidad",

      "estudio.valores.confidencialidad.descripcion":
        "Resguardo de la información.",

      "estudio.valores.comunicacion.titulo":
        "Claridad",

      "estudio.valores.comunicacion.descripcion":
        "Comunicación comprensible.",

      "estudio.valores.rigor.titulo":
        "Responsabilidad",

      "estudio.valores.rigor.descripcion":
        "Evaluación profesional individual.",

    });

    await expect(
      page.locator(".estudio-valor svg")
    ).toHaveCount(3);

    await expect(
      page.locator("#estudio [data-field='presentacion']")
    ).toHaveCount(1);

    await expect(
      page.locator("#estudio [data-field='enfoque']")
    ).toHaveCount(1);
  });

  test("personaliza todas las secciones editoriales restantes", async ({ page }) => {

    const secciones = [
      "areas",
      "equipo",
      "consulta",
      "preguntas",
      "contacto",
    ];

    await configurarEditorial(page, `
      Object.fromEntries(
        ${JSON.stringify(secciones)}.map(seccion => [
          seccion,
          Object.fromEntries(
            Object.keys(
              window.ESTUDIO.textos[seccion]
            ).map(campo => [
              campo,
              "Personalizado " + seccion + "." + campo
            ])
          )
        ])
      )
    `);

    await page.goto("/");

    for (const seccion of secciones) {

      const campos = page.locator(
        `[data-texto^="${seccion}."]`
      );

      expect(
        await campos.count()
      ).toBeGreaterThan(0);

      for (const elemento of await campos.all()) {

        const campo = await elemento.getAttribute(
          "data-texto"
        );

        await expect(elemento).toHaveText(
          `Personalizado ${campo}`
        );
      }
    }
  });

  test("personaliza todos los textos editoriales del footer", async ({ page }) => {

    await configurarEditorial(page, `
      ({
        footer: Object.fromEntries(
          Object.keys(
            window.ESTUDIO.textos.footer
          ).map(campo => [
            campo,
            "Pie " + campo
          ])
        )
      })
    `);

    await page.goto("/");

    const campos = page.locator(
      '#pie-pagina [data-texto^="footer."]'
    );

    await expect(campos).toHaveCount(11);

    for (const elemento of await campos.all()) {

      const campo = await elemento.getAttribute(
        "data-texto"
      );

      await expect(elemento).toHaveText(
        "Pie " + campo.split(".")[1]
      );
    }

    await expect(
      page.locator('#pie-pagina a[href="privacidad.html"]')
    ).toHaveCount(1);

    await expect(
      page.locator('#pie-pagina a[href="aviso-legal.html"]')
    ).toHaveCount(1);
  });

  test("preserva las flechas y enlaces de las llamadas a la accion", async ({ page }) => {

    await configurarTextos(page, {

      estudio: {
        cta: "Ver servicios",
      },

      consulta: {
        cta: "Coordinar consulta",
      },

      preguntas: {
        cta: "Consultar dudas",
      },

      footer: {
        cta: "Contactar",
        volver: "Regresar",
      },

    });

    await page.goto("/");

    const botones = [
      {
        clase: ".estudio-cta",
        campo: "estudio.cta",
        texto: "Ver servicios",
        destino: "#areas",
        flecha: "→",
      },
      {
        clase: ".consulta-cta",
        campo: "consulta.cta",
        texto: "Coordinar consulta",
        destino: "#contacto",
        flecha: "→",
      },
      {
        clase: ".preguntas-cta",
        campo: "preguntas.cta",
        texto: "Consultar dudas",
        destino: "#contacto",
        flecha: "→",
      },
      {
        clase: ".footer-cta",
        campo: "footer.cta",
        texto: "Contactar",
        destino: "#contacto",
        flecha: "→",
      },
      {
        clase: ".footer-volver",
        campo: "footer.volver",
        texto: "Regresar",
        destino: "#inicio",
        flecha: "↑",
      },
    ];

    for (const datos of botones) {

      const boton = page.locator(datos.clase);

      const texto = boton.locator(
        `[data-texto="${datos.campo}"]`
      );

      const flecha = boton.locator(
        'span[aria-hidden="true"]'
      );

      await expect(boton).toHaveAttribute(
        "href",
        datos.destino
      );

      await expect(texto).toHaveText(
        datos.texto
      );

      await expect(flecha).toHaveCount(1);

      await expect(flecha).toHaveText(
        datos.flecha
      );

      await expect(texto).toHaveCSS(
        "transform",
        "none"
      );

      const admiteHover = await page.evaluate(
        () => matchMedia(
          "(hover: hover) and (pointer: fine)"
        ).matches
      );

      if (admiteHover && await boton.isVisible()) {

        await boton.hover();

        await expect(texto).toHaveCSS(
          "transform",
          "none"
        );

        await page.mouse.move(0, 0);
      }
    }
  });

  test("conserva los textos alternativos ante configuraciones parciales", async ({ page }) => {

    await configurarTextos(page, {

      hero: {
        titulo: "Título personalizado.",
      },

      estudio: {
        valores: {
          rigor: {
            titulo: "Responsabilidad",
          },
        },
      },

    });

    await page.goto("/");

    await comprobarTextos(page, {

      "hero.titulo":
        "Título personalizado.",

      "hero.ctaPrincipal":
        "Solicitar una entrevista",

      "estudio.titulo":
        "Una mirada profesional y cercana.",

      "estudio.valores.rigor.titulo":
        "Responsabilidad",

      "estudio.valores.comunicacion.titulo":
        "Comunicación",

      "contacto.titulo":
        "Toda solución comienza con una conversación.",

    });
  });

  test("rechaza valores invalidos y propiedades heredadas", async ({ page }) => {

    await configurarEditorial(page, `
      ({
        hero: {
          titulo: "",
          descripcion: "   ",
          etiqueta: null,
          ctaPrincipal: 123,
          ctaSecundaria: ["Texto"]
        },

        estudio: {
          titulo: { contenido: "Invalido" },
          leyenda: "A".repeat(1001)
        },

        areas: Object.create({
          titulo: "Propiedad heredada"
        }),

        equipo: null
      })
    `);

    await page.goto("/");

    await comprobarTextos(page, {

      "hero.titulo":
        "Claridad jurídica para decisiones importantes.",

      "hero.descripcion":
        "Un espacio de asesoramiento profesional, con atención personalizada y respeto por la confidencialidad.",

      "hero.etiqueta":
        "ASESORAMIENTO JURÍDICO",

      "hero.ctaPrincipal":
        "Solicitar una entrevista",

      "hero.ctaSecundaria":
        "Conocer áreas de práctica",

      "estudio.titulo":
        "Una mirada profesional y cercana.",

      "estudio.leyenda":
        "Compromiso · Confianza · Rigor",

      "areas.titulo":
        "Soluciones jurídicas para cada necesidad.",

      "equipo.titulo":
        "Compromiso profesional y atención personalizada.",

    });
  });

  test("muestra contenido HTML como texto literal sin ejecutarlo", async ({ page }) => {

    const contenido =
      '<img src="inexistente" onerror="window.INYECCION_EDITORIAL=true">';

    await configurarTextos(page, {
      hero: {
        titulo: contenido,
      },
    });

    await page.goto("/");

    const titulo = campoEditorial(
      page,
      "hero.titulo"
    );

    await expect(titulo).toHaveText(
      contenido
    );

    await expect(
      titulo.locator("img")
    ).toHaveCount(0);

    expect(
      await page.evaluate(
        () => window.INYECCION_EDITORIAL
      )
    ).toBeUndefined();
  });

  test("preserva los avisos institucionales y demostrativos", async ({ page }) => {

    await configurarTextos(page, {

      contacto: {
        titulo: "Contactanos",

        privacidad: "",

        aviso: "",
      },

      footer: {
        navegacionTitulo: "Menú",

        aviso: "",

        demo: "",
      },

      areas: {
        aviso: "",
      },

    });

    await page.goto("/");

    await expect(
      page.locator(".demo")
    ).toBeVisible();

    await expect(
      page.locator(".demo")
    ).toContainText(
      "No representa un estudio real"
    );

    await expect(
      page.locator(".footer-demo")
    ).toHaveText(
      "Versión de demostración"
    );

    await expect(
      page.locator(".areas-aviso")
    ).toContainText(
      "sujetas a validación profesional"
    );

    await expect(
      page.locator(".contacto-privacidad")
    ).toContainText(
      "No compartas expedientes"
    );

    await expect(
      page.locator(".footer-aviso")
    ).toContainText(
      "no sustituye una consulta profesional"
    );

    await expect(
      page.locator('meta[name="robots"]')
    ).toHaveAttribute(
      "content",
      "noindex,nofollow"
    );
  });

  test.describe("Funcionamiento sin JavaScript", () => {

    test.use({
      javaScriptEnabled: false,
    });

    test("conserva todos los textos estaticos originales", async ({ page }) => {

      await page.goto("/");

      await expect(
        page.locator("[data-texto]")
      ).toHaveCount(cantidadCampos);

      await expect(
        page.locator("h1")
      ).toBeVisible();

      await comprobarTextos(page, {

        "hero.titulo":
          "Claridad jurídica para decisiones importantes.",

        "estudio.titulo":
          "Una mirada profesional y cercana.",

        "areas.titulo":
          "Soluciones jurídicas para cada necesidad.",

        "contacto.titulo":
          "Toda solución comienza con una conversación.",

        "footer.cta":
          "Solicitar una entrevista",

      });

      const camposVacios =
        await page.locator("[data-texto]")
          .evaluateAll(elementos =>
            elementos.filter(
              elemento =>
                !elemento.textContent.trim()
            ).length
          );

      expect(camposVacios).toBe(0);
    });
  });
});
