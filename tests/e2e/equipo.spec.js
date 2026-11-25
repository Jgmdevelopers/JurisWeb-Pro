const { test, expect } = require("@playwright/test");

const fotografiaAlternativa = "assets/icons/equipo/profesional.svg";

/**
 * Genera datos ficticios utilizados exclusivamente
 * dentro del entorno de pruebas.
 */
function crearProfesional(indice = 1, cambios = {}) {
  return {
    nombre: "Profesional",
    apellido: `Prueba ${indice}`,
    titulo: "Abogado de prueba",
    matricula: `TEST-${indice}`,
    jurisdiccion: "Jurisdiccion de prueba",
    fotografia: "",
    biografia: "Biografia utilizada en pruebas automatizadas.",
    formacion: ["Formacion de prueba"],
    especialidades: ["Derecho civil"],
    acreditaciones: ["Acreditacion de prueba"],
    linkedin: "",
    ...cambios,
  };
}

/**
 * Intercepta la configuración sin modificar
 * los datos reales del proyecto.
 */
async function configurarEquipo(page, profesionales) {
  await page.route("**/config/estudio.js", async (ruta) => {
    const respuesta = await ruta.fetch();
    const contenido = await respuesta.text();

    await ruta.fulfill({
      response: respuesta,
      body:
        contenido +
        "\nwindow.ESTUDIO.equipo = " +
        JSON.stringify(profesionales) +
        ";",
    });
  });
}

/**
 * Obtiene la cantidad de columnas de una cuadrícula.
 */
async function obtenerColumnas(localizador) {
  return localizador.evaluate(
    (elemento) =>
      getComputedStyle(elemento).gridTemplateColumns.trim().split(/\s+/).length,
  );
}

test.describe("Equipo profesional premium", () => {
  test("renderiza los perfiles configurados", async ({ page }) => {
    const profesionales = [
      crearProfesional(1),
      crearProfesional(2),
      crearProfesional(3),
    ];

    await configurarEquipo(page, profesionales);

    await page.goto("/");

    const tarjetas = page.locator("#lista-equipo .profesional-tarjeta");

    await expect(tarjetas).toHaveCount(3);

    await expect(tarjetas.locator("h3")).toHaveText([
      "Profesional Prueba 1",
      "Profesional Prueba 2",
      "Profesional Prueba 3",
    ]);

    await expect(tarjetas.locator(".profesional-credenciales")).toHaveCount(3);
  });

  test("adapta el diseno para un profesional", async ({ page }) => {
    await configurarEquipo(page, [crearProfesional()]);

    await page.goto("/");

    const equipo = page.locator("#lista-equipo");

    await expect(equipo).toHaveClass(/equipo-individual/);

    const tarjeta = equipo.locator(".profesional-tarjeta");

    await expect(tarjeta).toHaveCount(1);

    const ancho = page.viewportSize().width;

    expect(await obtenerColumnas(tarjeta)).toBe(ancho <= 700 ? 1 : 2);
  });

  test("adapta el diseno para dos profesionales", async ({ page }) => {
    await configurarEquipo(page, [crearProfesional(1), crearProfesional(2)]);

    await page.goto("/");

    const equipo = page.locator("#lista-equipo");

    await expect(equipo).toHaveClass(/equipo-doble/);

    const ancho = page.viewportSize().width;

    expect(await obtenerColumnas(equipo)).toBe(ancho <= 700 ? 1 : 2);
  });

  test("adapta el diseno para multiples profesionales", async ({ page }) => {
    await configurarEquipo(page, [
      crearProfesional(1),
      crearProfesional(2),
      crearProfesional(3),
      crearProfesional(4),
    ]);

    await page.goto("/");

    const equipo = page.locator("#lista-equipo");

    await expect(equipo).toHaveClass(/equipo-multiple/);

    await expect(equipo.locator("article")).toHaveCount(4);

    const ancho = page.viewportSize().width;

    const columnasEsperadas = ancho <= 700 ? 1 : ancho <= 1024 ? 2 : 3;

    expect(await obtenerColumnas(equipo)).toBe(columnasEsperadas);
  });

  test("muestra un estado vacio sin profesionales validos", async ({
    page,
  }) => {
    await configurarEquipo(page, [null, {}, [], { nombre: "   " }]);

    await page.goto("/");

    await expect(page.locator("#lista-equipo article")).toHaveCount(0);

    await expect(page.locator(".equipo-vacio")).toHaveText(
      "El equipo profesional se encuentra pendiente de configuración.",
    );
  });

  test("utiliza la fotografia alternativa y omite credenciales vacias", async ({
    page,
  }) => {
    await configurarEquipo(page, [
      crearProfesional(1, {
        fotografia: "",
        matricula: "",
        jurisdiccion: "",
      }),
    ]);

    await page.goto("/");

    const imagen = page.locator(".profesional-fotografia img");

    await imagen.scrollIntoViewIfNeeded();

    await expect(imagen).toHaveAttribute("src", fotografiaAlternativa);

    await expect
      .poll(async () => {
        return imagen.evaluate(
          (elemento) => elemento.complete && elemento.naturalWidth > 0,
        );
      })
      .toBe(true);

    await expect(page.locator(".profesional-credenciales")).toHaveCount(0);
  });

  test("recupera una fotografia inexistente mediante el recurso alternativo", async ({
    page,
  }) => {
    const rutaInexistente = "assets/images/equipo/inexistente.webp";

    await page.route("**/assets/images/equipo/inexistente.webp", (ruta) =>
      ruta.fulfill({
        status: 404,
        body: "",
      }),
    );

    await configurarEquipo(page, [
      crearProfesional(1, {
        fotografia: rutaInexistente,
      }),
    ]);

    await page.goto("/");

    const imagen = page.locator(".profesional-fotografia img");

    await imagen.scrollIntoViewIfNeeded();

    await expect(imagen).toHaveAttribute("src", fotografiaAlternativa);

    await expect
      .poll(async () => {
        return imagen.evaluate(
          (elemento) => elemento.complete && elemento.naturalWidth > 0,
        );
      })
      .toBe(true);
  });

  test("rechaza rutas de fotografias no permitidas", async ({ page }) => {
    await configurarEquipo(page, [
      crearProfesional(1, {
        fotografia: "../../archivo.webp",
      }),
      crearProfesional(2, {
        fotografia: "https://example.com/foto.png",
      }),
      crearProfesional(3, {
        fotografia: "assets/images/equipo/foto.svg",
      }),
    ]);

    await page.goto("/");

    const imagenes = page.locator(".profesional-fotografia img");

    await expect(imagenes).toHaveCount(3);

    for (const imagen of await imagenes.all()) {
      await expect(imagen).toHaveAttribute("src", fotografiaAlternativa);
    }
  });

  test("renderiza formacion especialidades y acreditaciones validas", async ({
    page,
  }) => {
    await configurarEquipo(page, [
      crearProfesional(1, {
        formacion: ["Formacion de prueba", "", null],
        especialidades: ["Derecho civil", "Derecho laboral"],
        acreditaciones: ["Acreditacion de prueba"],
      }),
    ]);

    await page.goto("/");

    const detalles = page.locator(".profesional-detalle");

    await expect(detalles).toHaveCount(3);

    await expect(detalles.locator("h4")).toHaveText([
      "Formación académica",
      "Especialidades",
      "Acreditaciones",
    ]);

    await expect(detalles.locator("li")).toHaveText([
      "Formacion de prueba",
      "Derecho civil",
      "Derecho laboral",
      "Acreditacion de prueba",
    ]);
  });

  test("valida los enlaces profesionales de Linkedin", async ({ page }) => {
    await configurarEquipo(page, [
      crearProfesional(1, {
        linkedin: "https://www.linkedin.com/in/perfil-prueba",
      }),
      crearProfesional(2, {
        linkedin: "javascript:alert(1)",
      }),
      crearProfesional(3, {
        linkedin: "https://linkedin.com.example.com/in/prueba",
      }),
      crearProfesional(4, {
        linkedin: "http://www.linkedin.com/in/prueba",
      }),
    ]);

    await page.goto("/");

    const enlaces = page.locator(".profesional-linkedin");

    await expect(enlaces).toHaveCount(1);

    await expect(enlaces).toHaveAttribute(
      "href",
      "https://www.linkedin.com/in/perfil-prueba",
    );

    await expect(enlaces).toHaveAttribute("target", "_blank");

    await expect(enlaces).toHaveAttribute("rel", "noopener noreferrer");
  });

  test("renderiza contenido HTML como texto sin ejecutar codigo", async ({
    page,
  }) => {
    const contenidoMalicioso =
      '<img src="inexistente" onerror="window.inyeccionEquipo=true">';

    await configurarEquipo(page, [
      crearProfesional(1, {
        nombre: contenidoMalicioso,
        apellido: "",
        biografia: "<strong>Biografia de prueba</strong>",
        formacion: ["<script>window.inyeccionEquipo=true</script>"],
      }),
    ]);

    await page.goto("/");

    const tarjeta = page.locator(".profesional-tarjeta");

    await expect(tarjeta.locator("h3")).toHaveText(contenidoMalicioso);

    await expect(tarjeta.locator(".profesional-biografia")).toHaveText(
      "<strong>Biografia de prueba</strong>",
    );

    await expect(tarjeta.locator("h3 img, strong, li script")).toHaveCount(0);

    expect(await page.evaluate(() => window.inyeccionEquipo)).toBeUndefined();
  });

  test("permite solicitar una entrevista desde el perfil", async ({ page }) => {
    await configurarEquipo(page, [crearProfesional()]);

    await page.goto("/");

    const enlace = page.getByRole("link", {
      name: "Solicitar entrevista con Profesional Prueba 1",
      exact: true,
    });

    await expect(enlace).toHaveAttribute("href", "#contacto");

    await enlace.click();

    await expect(page).toHaveURL(/#contacto$/);

    await expect(page.locator("#contacto")).toBeInViewport();
  });
});
