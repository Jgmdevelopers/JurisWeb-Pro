const { test, expect } = require("@playwright/test");

const configuracionVacia = {
  telefono: "",
  whatsapp: "",
  correo: "",
  direccion: "",
  horarioAtencion: "",
  modalidadAtencion: "",
  mapaUrl: "",
  mensajeWhatsapp: "",
};

const configuracionValida = {
  telefono: "+12025550123",
  whatsapp: "12025550123",
  correo: "contacto@example.com",
  direccion: "Direccion de prueba",
  horarioAtencion: "Lunes a viernes de 09:00 a 17:00",
  modalidadAtencion: "Presencial y virtual",
  mapaUrl:
    "https://www.google.com/maps/search/?api=1&query=Ushuaia",
  mensajeWhatsapp:
    "Hola, quisiera coordinar una entrevista.",
};

/**
 * Intercepta la configuracion institucional
 * sin modificar los archivos reales.
 */
async function configurarContacto(page, cambios = {}) {
  const configuracion = {
    ...configuracionVacia,
    ...cambios,
  };

  await page.route("**/config/estudio.js", async ruta => {
    const respuesta = await ruta.fetch();
    const contenido = await respuesta.text();

    await ruta.fulfill({
      response: respuesta,
      body:
        contenido +
        "\nObject.assign(window.ESTUDIO, " +
        JSON.stringify(configuracion) +
        ");",
    });
  });
}

test.describe("Contacto premium", () => {

  test("muestra el estado alternativo sin canales configurados", async ({ page }) => {
    await configurarContacto(page);

    await page.goto("/");

    await expect(
      page.locator("#canales a")
    ).toHaveCount(0);

    await expect(
      page.locator("#canales")
    ).toBeHidden();

    await expect(
      page.locator("#contacto-vacio")
    ).toBeVisible();

    await expect(
      page.locator("#datos-contacto")
    ).toContainText(
      "pendientes de configuración"
    );

    await expect(
      page.locator(".contacto-privacidad")
    ).toBeVisible();
  });

  test("renderiza todos los canales configurados", async ({ page }) => {
    await configurarContacto(page, configuracionValida);

    await page.goto("/");

    const canales = page.locator(
      "#canales .contacto-canal"
    );

    await expect(canales).toHaveCount(4);

    await expect(
      canales.locator(".contacto-canal-titulo")
    ).toHaveText([
      "WhatsApp",
      "Teléfono",
      "Correo electrónico",
      "Cómo llegar",
    ]);

    await expect(
      page.locator("#contacto-vacio")
    ).toBeHidden();

    await expect(
      page.locator("#canales")
    ).toBeVisible();
  });

  test("permite habilitar canales de forma independiente", async ({ page }) => {
    await configurarContacto(page, {
      correo: configuracionValida.correo,
    });

    await page.goto("/");

    const canales = page.locator("#canales a");

    await expect(canales).toHaveCount(1);

    await expect(canales.first()).toHaveAttribute(
      "href",
      "mailto:contacto@example.com"
    );

    await expect(
      page.locator("#contacto-vacio")
    ).toBeHidden();

    await expect(
      page.locator("#contacto-horario")
    ).toBeHidden();

    await expect(
      page.locator("#contacto-modalidad")
    ).toBeHidden();
  });

  test("valida el formato internacional de Whatsapp", async ({ page }) => {
    await page.goto("/");

    const resultados = await page.evaluate(() => {
      const numeros = [
        "12025550123",
        " 12025550123 ",
        "+12025550123",
        "0123456789",
        "123",
        "1234567890123456",
        "1234abc5678",
        "javascript:alert(1)",
        null,
        12025550123,
      ];

      return numeros.map(validarWhatsapp);
    });

    expect(resultados).toEqual([
      "12025550123",
      "12025550123",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
    ]);
  });

  test("codifica correctamente el mensaje inicial de Whatsapp", async ({ page }) => {
    const mensaje =
      "Hola, quisiera una entrevista. ¿Hay disponibilidad? & Gracias.";

    await configurarContacto(page, {
      whatsapp: configuracionValida.whatsapp,
      mensajeWhatsapp: mensaje,
    });

    await page.goto("/");

    const enlace = page.locator("#canales a");

    await expect(enlace).toHaveCount(1);

    const href = await enlace.getAttribute("href");
    const url = new URL(href);

    expect(url.protocol).toBe("https:");
    expect(url.hostname).toBe("wa.me");
    expect(url.pathname).toBe("/12025550123");

    expect(
      url.searchParams.get("text")
    ).toBe(mensaje);

    expect(
      Array.from(url.searchParams.keys())
    ).toEqual(["text"]);

    await page.evaluate(() => {
      renderContacto({
        whatsapp: "12025550123",
        mensajeWhatsapp: "",
      });
    });

    const enlaceAlternativo = new URL(
      await enlace.getAttribute("href")
    );

    expect(
      enlaceAlternativo.searchParams.get("text")
    ).toBe(
      "Hola, quisiera coordinar una entrevista."
    );

    await page.evaluate(() => {
      renderContacto({
        whatsapp: "12025550123",
        mensajeWhatsapp: "a".repeat(600),
      });
    });

    const enlaceLimitado = new URL(
      await enlace.getAttribute("href")
    );

    expect(
      enlaceLimitado.searchParams.get("text")
    ).toHaveLength(500);
  });

  test("valida los numeros telefonicos", async ({ page }) => {
    await page.goto("/");

    const resultados = await page.evaluate(() => {
      const numeros = [
        "+12025550123",
        "1234567",
        " 1234567 ",
        "123",
        "1234567890123456",
        "1234abc5678",
        "tel:123456789",
        "javascript:alert(1)",
        null,
      ];

      return numeros.map(validarTelefono);
    });

    expect(resultados).toEqual([
      "+12025550123",
      "1234567",
      "1234567",
      "",
      "",
      "",
      "",
      "",
      "",
    ]);
  });

  test("valida los correos electronicos", async ({ page }) => {
    await page.goto("/");

    const resultados = await page.evaluate(() => {
      const correos = [
        "contacto@example.com",
        " contacto@example.com ",
        "contacto+prueba@example.com",
        "correo-invalido",
        "contacto@example",
        "contacto@example.com?subject=prueba",
        "contacto@example.com\r\nBcc:otro@example.com",
        "javascript:alert(1)",
        null,
      ];

      return correos.map(validarCorreoContacto);
    });

    expect(resultados).toEqual([
      "contacto@example.com",
      "contacto@example.com",
      "contacto+prueba@example.com",
      "",
      "",
      "",
      "",
      "",
      "",
    ]);
  });

  test("restringe los enlaces de mapas a destinos permitidos", async ({ page }) => {
    await page.goto("/");

    const resultados = await page.evaluate(() => {
      const enlaces = [
        "https://www.google.com/maps/search/?api=1&query=Ushuaia",
        "https://maps.app.goo.gl/AbCd1234",
        "https://maps.google.com/?q=Ushuaia",
        "http://www.google.com/maps",
        "https://www.google.com.example.com/maps",
        "https://example.com/maps",
        "https://www.google.com/search",
        "https://usuario@www.google.com/maps",
        "https://www.google.com:8443/maps",
        "javascript:alert(1)",
        null,
      ];

      return enlaces.map(validarMapaContacto);
    });

    expect(resultados).toEqual([
      "https://www.google.com/maps/search/?api=1&query=Ushuaia",
      "https://maps.app.goo.gl/AbCd1234",
      "https://maps.google.com/?q=Ushuaia",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
    ]);
  });

  test("renderiza la informacion institucional opcional", async ({ page }) => {
    await configurarContacto(page, configuracionValida);

    await page.goto("/");

    await expect(
      page.locator("#contacto-direccion")
    ).toBeVisible();

    await expect(
      page.locator("#contacto-direccion")
    ).toHaveText(configuracionValida.direccion);

    await expect(
      page.locator("#contacto-horario")
    ).toBeVisible();

    await expect(
      page.locator("#contacto-horario-texto")
    ).toHaveText(configuracionValida.horarioAtencion);

    await expect(
      page.locator("#contacto-modalidad")
    ).toBeVisible();

    await expect(
      page.locator("#contacto-modalidad-texto")
    ).toHaveText(configuracionValida.modalidadAtencion);

    await page.evaluate(() => {
      renderContacto({});
    });

    await expect(
      page.locator("#contacto-direccion")
    ).toBeHidden();

    await expect(
      page.locator("#contacto-horario")
    ).toBeHidden();

    await expect(
      page.locator("#contacto-modalidad")
    ).toBeHidden();
  });

  test("renderiza contenido como texto sin ejecutar codigo", async ({ page }) => {
    const contenidoMalicioso =
      '<img src="inexistente" onerror="window.inyeccionContacto=true">';

    await configurarContacto(page, {
      direccion: contenidoMalicioso,
      horarioAtencion: "<strong>Horario de prueba</strong>",
      modalidadAtencion: contenidoMalicioso,
      telefono: "javascript:alert(1)",
      whatsapp: "javascript:alert(1)",
      correo: "javascript:alert(1)",
      mapaUrl: "javascript:alert(1)",
    });

    await page.goto("/");

    await expect(
      page.locator("#contacto-direccion")
    ).toHaveText(contenidoMalicioso);

    await expect(
      page.locator("#contacto-horario-texto")
    ).toHaveText(
      "<strong>Horario de prueba</strong>"
    );

    await expect(
      page.locator("#contacto-modalidad-texto")
    ).toHaveText(contenidoMalicioso);

    await expect(
      page.locator(
        "#contacto-direccion img, " +
        "#contacto-horario-texto strong, " +
        "#contacto-modalidad-texto img"
      )
    ).toHaveCount(0);

    await expect(
      page.locator("#canales a")
    ).toHaveCount(0);

    expect(
      await page.evaluate(
        () => window.inyeccionContacto
      )
    ).toBeUndefined();
  });

  test("aplica atributos seguros a los enlaces externos", async ({ page }) => {
    await configurarContacto(page, configuracionValida);

    await page.goto("/");

    const externos = page.locator(
      '#canales a[target="_blank"]'
    );

    await expect(externos).toHaveCount(2);

    for (const enlace of await externos.all()) {
      await expect(enlace).toHaveAttribute(
        "rel",
        "noopener noreferrer"
      );

      await expect(enlace).toHaveAttribute(
        "aria-label",
        /nueva pestaña/
      );
    }

    const telefono = page.locator(
      '#canales a[href^="tel:"]'
    );

    const correo = page.locator(
      '#canales a[href^="mailto:"]'
    );

    await expect(telefono).toHaveAttribute(
      "href",
      "tel:+12025550123"
    );

    await expect(correo).toHaveAttribute(
      "href",
      "mailto:contacto@example.com"
    );

    await expect(telefono).not.toHaveAttribute(
      "target",
      "_blank"
    );

    await expect(correo).not.toHaveAttribute(
      "target",
      "_blank"
    );
  });

  test("carga los iconos y adapta la distribucion responsive", async ({ page }) => {
    await configurarContacto(page, configuracionValida);

    await page.goto("/");

    const iconos = page.locator(
      "#contacto img"
    );

    await expect(iconos).toHaveCount(9);

    await expect.poll(async () => {
      return iconos.evaluateAll(elementos =>
        elementos.every(imagen =>
          imagen.complete &&
          imagen.naturalWidth > 0
        )
      );
    }).toBe(true);

    for (const icono of await iconos.all()) {
      await expect(icono).toHaveAttribute(
        "alt",
        ""
      );
    }

    const composicion = page.locator(
      ".contacto-composicion"
    );

    const columnas = await composicion.evaluate(elemento =>
      getComputedStyle(elemento)
        .gridTemplateColumns
        .trim()
        .split(/\s+/)
        .length
    );

    expect(columnas).toBe(
      page.viewportSize().width <= 700 ? 1 : 2
    );

    const desbordamiento = await page.evaluate(() =>
      document.documentElement.scrollWidth >
      document.documentElement.clientWidth
    );

    expect(desbordamiento).toBe(false);
  });

});
