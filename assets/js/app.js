"use strict";
const estudio = window.ESTUDIO || {};
document.querySelectorAll("[data-field]").forEach((el) => {
  const valor = estudio[el.dataset.field];
  if (typeof valor === "string" && valor.trim()) el.textContent = valor;
});

/**
 * Iconos permitidos para las áreas de práctica.
 */
const iconosAreasPermitidos = new Set([
  "civil",
  "familia",
  "laboral",
  "administrativo",
  "penal",
  "sucesiones",
  "general",
]);

/**
 * Genera las tarjetas de especialidades jurídicas
 * desde la configuración del estudio.
 */
function renderAreas(areas) {
  const contenedor = document.getElementById("lista-areas");

  if (!contenedor || !Array.isArray(areas)) {
    return;
  }

  const fragmento = document.createDocumentFragment();

  const areasValidas = areas.filter(
    (area) =>
      area &&
      typeof area.titulo === "string" &&
      area.titulo.trim() &&
      typeof area.descripcion === "string" &&
      area.descripcion.trim(),
  );

  areasValidas.forEach((area, indice) => {
    const tarjeta = document.createElement("article");

    tarjeta.className = "area-tarjeta";

    // Encabezado de la tarjeta.

    const encabezado = document.createElement("div");

    encabezado.className = "area-tarjeta-encabezado";

    // Iconografía.

    const nombreIcono = iconosAreasPermitidos.has(area.icono)
      ? area.icono
      : "general";

    const icono = document.createElement("img");

    icono.className = "area-icono";
    icono.src = `assets/icons/areas/${nombreIcono}.svg`;
    icono.alt = "";
    icono.width = 48;
    icono.height = 48;

    // Numeración automática.

    const numero = document.createElement("span");

    numero.className = "area-numero";

    numero.textContent = String(indice + 1).padStart(2, "0");

    numero.setAttribute("aria-hidden", "true");

    encabezado.append(icono, numero);

    // Contenido.

    const titulo = document.createElement("h3");

    titulo.textContent = area.titulo;

    const descripcion = document.createElement("p");

    descripcion.textContent = area.descripcion;

    // Enlace de consulta.

    const enlace = document.createElement("a");

    enlace.className = "area-enlace";
    enlace.href = "#contacto";

    enlace.setAttribute("aria-label", `Consultar sobre ${area.titulo}`);

    enlace.textContent = "Consultar";

    const flecha = document.createElement("span");

    flecha.className = "area-flecha";
    flecha.textContent = "→";
    flecha.setAttribute("aria-hidden", "true");

    enlace.append(flecha);

    tarjeta.append(encabezado, titulo, descripcion, enlace);

    fragmento.append(tarjeta);
  });

  // Estado alternativo sin especialidades configuradas.

  if (!areasValidas.length) {
    const mensaje = document.createElement("p");

    mensaje.className = "areas-vacio";

    mensaje.textContent =
      "Las áreas de práctica se encuentran pendientes de configuración.";

    fragmento.append(mensaje);
  }

  contenedor.replaceChildren(fragmento);
}

renderAreas(estudio.areas);
/**
 * Normaliza los campos de texto opcionales.
 */
function normalizarTextoProfesional(valor) {
  return typeof valor === "string" ? valor.trim() : "";
}

/**
 * Normaliza las listas de información profesional.
 */
function normalizarListaProfesional(valores) {
  if (!Array.isArray(valores)) {
    return [];
  }

  return valores.map(normalizarTextoProfesional).filter(Boolean);
}

/**
 * Valida las rutas locales de fotografías.
 */
function obtenerFotografiaProfesional(ruta) {
  const fotografia = normalizarTextoProfesional(ruta);

  const patron = /^assets\/images\/equipo\/[a-zA-Z0-9_-]+\.(webp|png|jpe?g)$/i;

  return patron.test(fotografia)
    ? fotografia
    : "assets/icons/equipo/profesional.svg";
}

/**
 * Valida enlaces hacia perfiles de LinkedIn.
 */
function obtenerLinkedinProfesional(valor) {
  if (typeof valor !== "string" || !valor.trim()) {
    return "";
  }

  try {
    const url = new URL(valor);

    const dominioPermitido =
      url.hostname === "linkedin.com" || url.hostname === "www.linkedin.com";

    if (
      url.protocol !== "https:" ||
      !dominioPermitido ||
      url.username ||
      url.password ||
      url.port ||
      !/^\/in\/[a-zA-Z0-9_%.-]+\/?$/.test(url.pathname)
    ) {
      return "";
    }

    return url.href;
  } catch {
    return "";
  }
}

/**
 * Agrega una lista de información profesional
 * solamente cuando existen elementos válidos.
 */
function agregarListaProfesional(contenedor, titulo, valores) {
  const elementos = normalizarListaProfesional(valores);

  if (!elementos.length) {
    return;
  }

  const bloque = document.createElement("div");

  bloque.className = "profesional-detalle";

  const encabezado = document.createElement("h4");

  encabezado.textContent = titulo;

  const lista = document.createElement("ul");

  elementos.forEach((valor) => {
    const elemento = document.createElement("li");

    elemento.textContent = valor;

    lista.append(elemento);
  });

  bloque.append(encabezado, lista);

  contenedor.append(bloque);
}

/**
 * Renderiza los perfiles profesionales
 * desde la configuración institucional.
 */
function renderEquipo(profesionales) {
  const contenedor = document.getElementById("lista-equipo");

  if (!contenedor || !Array.isArray(profesionales)) {
    return;
  }

  const profesionalesValidos = profesionales.filter(
    (profesional) =>
      profesional &&
      typeof profesional === "object" &&
      !Array.isArray(profesional) &&
      (normalizarTextoProfesional(profesional.nombre) ||
        normalizarTextoProfesional(profesional.apellido) ||
        normalizarTextoProfesional(profesional.titulo)),
  );

  contenedor.classList.remove(
    "equipo-individual",
    "equipo-doble",
    "equipo-multiple",
  );

  if (profesionalesValidos.length === 1) {
    contenedor.classList.add("equipo-individual");
  } else if (profesionalesValidos.length === 2) {
    contenedor.classList.add("equipo-doble");
  } else if (profesionalesValidos.length > 2) {
    contenedor.classList.add("equipo-multiple");
  }

  const fragmento = document.createDocumentFragment();

  profesionalesValidos.forEach((profesional) => {
    const nombreCompleto = [
      normalizarTextoProfesional(profesional.nombre),
      normalizarTextoProfesional(profesional.apellido),
    ]
      .filter(Boolean)
      .join(" ");

    const tituloProfesional = normalizarTextoProfesional(profesional.titulo);

    const nombreVisible = nombreCompleto || tituloProfesional || "Profesional";

    const tarjeta = document.createElement("article");

    tarjeta.className = "profesional-tarjeta";

    /* Fotografía */

    const fotografia = document.createElement("div");

    fotografia.className = "profesional-fotografia";

    const imagen = document.createElement("img");

    imagen.src = obtenerFotografiaProfesional(profesional.fotografia);

    imagen.alt = "";
    imagen.width = 320;
    imagen.height = 400;
    imagen.loading = "lazy";
    imagen.decoding = "async";

    imagen.addEventListener(
      "error",
      () => {
        imagen.src = "assets/icons/equipo/profesional.svg";
      },
      { once: true },
    );

    fotografia.append(imagen);

    /* Contenido profesional */

    const contenido = document.createElement("div");

    contenido.className = "profesional-contenido";

    const etiqueta = document.createElement("p");

    etiqueta.className = "profesional-etiqueta";

    etiqueta.textContent = nombreCompleto
      ? tituloProfesional || "Profesional"
      : "Perfil institucional";

    const nombre = document.createElement("h3");

    nombre.textContent = nombreVisible;

    contenido.append(etiqueta, nombre);

    /* Matrícula y jurisdicción */

    const matricula = normalizarTextoProfesional(profesional.matricula);

    const jurisdiccion = normalizarTextoProfesional(profesional.jurisdiccion);

    if (matricula || jurisdiccion) {
      const credenciales = document.createElement("p");

      credenciales.className = "profesional-credenciales";

      credenciales.textContent = [
        matricula ? `Matrícula: ${matricula}` : "",
        jurisdiccion,
      ]
        .filter(Boolean)
        .join(" · ");

      contenido.append(credenciales);
    }

    /* Biografía */

    const biografia = normalizarTextoProfesional(
      profesional.biografia || profesional.descripcion,
    );

    if (biografia) {
      const parrafo = document.createElement("p");

      parrafo.className = "profesional-biografia";

      parrafo.textContent = biografia;

      contenido.append(parrafo);
    }

    /* Formación y especialidades */

    agregarListaProfesional(
      contenido,
      "Formación académica",
      profesional.formacion,
    );

    agregarListaProfesional(
      contenido,
      "Especialidades",
      profesional.especialidades,
    );

    agregarListaProfesional(
      contenido,
      "Acreditaciones",
      profesional.acreditaciones,
    );

    /* Acciones */

    const acciones = document.createElement("div");

    acciones.className = "profesional-acciones";

    const entrevista = document.createElement("a");

    entrevista.className = "profesional-cta";
    entrevista.href = "#contacto";

    entrevista.textContent = "Solicitar entrevista →";

    entrevista.setAttribute(
      "aria-label",
      `Solicitar entrevista con ${nombreVisible}`,
    );

    acciones.append(entrevista);

    /* LinkedIn opcional */

    const linkedin = obtenerLinkedinProfesional(profesional.linkedin);

    if (linkedin) {
      const enlace = document.createElement("a");

      enlace.className = "profesional-linkedin";

      enlace.href = linkedin;

      enlace.target = "_blank";

      enlace.rel = "noopener noreferrer";

      enlace.textContent = "LinkedIn";

      enlace.setAttribute(
        "aria-label",
        `LinkedIn de ${nombreVisible} (nueva pestaña)`,
      );

      acciones.append(enlace);
    }

    contenido.append(acciones);

    tarjeta.append(fotografia, contenido);

    fragmento.append(tarjeta);
  });

  /* Estado vacío */

  if (!profesionalesValidos.length) {
    const mensaje = document.createElement("p");

    mensaje.className = "equipo-vacio";

    mensaje.textContent =
      "El equipo profesional se encuentra pendiente de configuración.";

    fragmento.append(mensaje);
  }

  contenedor.replaceChildren(fragmento);
}

renderEquipo(estudio.equipo);
/**
 * Iconografia permitida para el proceso de consulta.
 */
const iconosConsultaPermitidos = new Set([
  "contacto",
  "evaluacion",
  "orientacion",
  "acompanamiento",
  "general",
]);

/**
 * Renderiza las etapas configuradas del proceso
 * de consulta juridica.
 */
function renderProcesoConsulta(etapas) {
  const contenedor = document.getElementById("lista-consulta");

  const mensajeVacio = document.getElementById("consulta-vacio");

  if (!contenedor || !Array.isArray(etapas)) {
    return;
  }

  const etapasValidas = etapas.filter(
    (etapa) =>
      etapa &&
      typeof etapa === "object" &&
      !Array.isArray(etapa) &&
      typeof etapa.titulo === "string" &&
      etapa.titulo.trim() &&
      typeof etapa.descripcion === "string" &&
      etapa.descripcion.trim(),
  );

  const fragmento = document.createDocumentFragment();

  etapasValidas.forEach((etapa, indice) => {
    const elemento = document.createElement("li");

    elemento.className = "consulta-etapa";

    /* Contenedor del icono */

    const contenedorIcono = document.createElement("div");

    contenedorIcono.className = "consulta-icono-contenedor";

    /* Iconografia segura */

    const nombreIcono = iconosConsultaPermitidos.has(etapa.icono)
      ? etapa.icono
      : "general";

    const icono = document.createElement("img");

    icono.className = "consulta-icono";

    icono.src = `assets/icons/consulta/${nombreIcono}.svg`;

    icono.alt = "";
    icono.width = 48;
    icono.height = 48;

    /* Numeracion automatica */

    const numero = document.createElement("span");

    numero.className = "consulta-numero";

    numero.textContent = String(indice + 1).padStart(2, "0");

    numero.setAttribute("aria-hidden", "true");

    contenedorIcono.append(icono, numero);

    /* Contenido de la etapa */

    const contenido = document.createElement("div");

    contenido.className = "consulta-contenido";

    const titulo = document.createElement("h3");

    titulo.textContent = etapa.titulo.trim();

    const descripcion = document.createElement("p");

    descripcion.textContent = etapa.descripcion.trim();

    contenido.append(titulo, descripcion);

    elemento.append(contenedorIcono, contenido);

    fragmento.append(elemento);
  });

  contenedor.replaceChildren(fragmento);

  /* Distribucion segun cantidad de etapas */

  const columnas = Math.max(1, Math.min(etapasValidas.length, 4));

  contenedor.style.setProperty("--consulta-columnas", String(columnas));

  /* Estado alternativo */

  contenedor.hidden = etapasValidas.length === 0;

  if (mensajeVacio) {
    mensajeVacio.hidden = etapasValidas.length > 0;
  }
}

renderProcesoConsulta(estudio.procesoConsulta);
/**
 * Renderiza las preguntas frecuentes
 * desde la configuracion institucional.
 */
function renderPreguntasFrecuentes(preguntas) {
  const contenedor = document.getElementById("lista-preguntas");

  if (!contenedor || !Array.isArray(preguntas)) {
    return;
  }

  const preguntasValidas = preguntas.filter(
    (item) =>
      item &&
      typeof item === "object" &&
      !Array.isArray(item) &&
      typeof item.pregunta === "string" &&
      item.pregunta.trim() &&
      typeof item.respuesta === "string" &&
      item.respuesta.trim(),
  );

  const fragmento = document.createDocumentFragment();

  preguntasValidas.forEach((item, indice) => {
    /* Contenedor desplegable */

    const detalle = document.createElement("details");

    detalle.className = "pregunta-item";

    detalle.setAttribute("name", "preguntas-frecuentes");

    /* Encabezado interactivo */

    const resumen = document.createElement("summary");

    /* Numeracion */

    const numero = document.createElement("span");

    numero.className = "pregunta-numero";

    numero.textContent = String(indice + 1).padStart(2, "0");

    numero.setAttribute("aria-hidden", "true");

    /* Pregunta */

    const titulo = document.createElement("span");

    titulo.className = "pregunta-titulo";

    titulo.textContent = item.pregunta.trim();

    /* Indicador visual */

    const indicador = document.createElement("span");

    indicador.className = "pregunta-indicador";

    indicador.setAttribute("aria-hidden", "true");

    resumen.append(numero, titulo, indicador);

    /* Respuesta */

    const respuesta = document.createElement("div");

    respuesta.className = "pregunta-respuesta";

    const texto = document.createElement("p");

    texto.textContent = item.respuesta.trim();

    respuesta.append(texto);

    /* Integracion */

    detalle.append(resumen, respuesta);

    fragmento.append(detalle);
  });

  /* Estado vacio */
  if (!preguntasValidas.length) {
    const mensaje = document.createElement("p");

    mensaje.className = "preguntas-vacio";

    mensaje.textContent =
      "Las preguntas frecuentes se encuentran pendientes de configuración.";

    fragmento.append(mensaje);
  }

  contenedor.replaceChildren(fragmento);
}

renderPreguntasFrecuentes(estudio.preguntasFrecuentes);
const canales = document.getElementById("canales");
function agregarCanal(texto, url) {
  const a = document.createElement("a");
  a.className = "btn";
  a.textContent = texto;
  a.href = url;
  canales.append(a);
}
if (canales) {
  if (/^\d{8,15}$/.test(estudio.whatsapp || ""))
    agregarCanal(
      "WhatsApp",
      "https://wa.me/" +
        estudio.whatsapp +
        "?text=" +
        encodeURIComponent("Hola, quisiera coordinar una entrevista."),
    );
  if (/^\+?\d{7,15}$/.test(estudio.telefono || ""))
    agregarCanal("Llamar", "tel:" + estudio.telefono);
  if (/^[\w.+-]+@[\w.-]+\.[a-z]{2,}$/i.test(estudio.correo || ""))
    agregarCanal("Correo", "mailto:" + estudio.correo);
  if (canales.children.length)
    document.getElementById("datos-contacto").textContent =
      estudio.direccion || "Seleccione un canal de contacto.";
}
const menu = document.getElementById("menu"),
  nav = document.getElementById("navegacion");
if (menu && nav) {
  const mq = matchMedia("(max-width:700px)");
  function sincronizar() {
    menu.hidden = !mq.matches;
    nav.hidden = mq.matches;
    menu.setAttribute("aria-expanded", String(!mq.matches));
  }
  sincronizar();
  mq.addEventListener("change", sincronizar);
  menu.addEventListener("click", () => {
    nav.hidden = !nav.hidden;
    menu.setAttribute("aria-expanded", String(!nav.hidden));
  });
  nav.addEventListener("click", (e) => {
    if (mq.matches && e.target.closest("a")) sincronizar();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && mq.matches && !nav.hidden) {
      sincronizar();
      menu.focus();
    }
  });
}
/**
 * Actualiza el encabezado y la navegación
 * según la posición del desplazamiento.
 */
function inicializarNavegacionActiva() {
  const encabezado = document.getElementById("encabezado");

  const enlaces = Array.from(
    document.querySelectorAll('#navegacion a[href^="#"]'),
  );

  if (!encabezado || !enlaces.length) {
    return;
  }

  const secciones = enlaces
    .map((enlace) => ({
      enlace,
      seccion: document.getElementById(enlace.hash.slice(1)),
    }))
    .filter((item) => item.seccion);

  if (!secciones.length) {
    return;
  }

  let actualizacionPendiente = false;

  function actualizarNavegacion() {
    const desplazamiento = window.scrollY;

    encabezado.classList.toggle("is-scrolled", desplazamiento > 30);

    const limite = encabezado.offsetHeight + 60;

    let seccionActiva = secciones[0];

    for (const item of secciones) {
      const posicion = item.seccion.getBoundingClientRect();

      if (posicion.top <= limite) {
        seccionActiva = item;
      }
    }

    const finalPagina =
      desplazamiento > 0 &&
      Math.ceil(desplazamiento + window.innerHeight) >=
        document.documentElement.scrollHeight - 2;

    if (finalPagina) {
      seccionActiva = secciones[secciones.length - 1];
    }

    enlaces.forEach((enlace) => {
      if (enlace === seccionActiva.enlace) {
        enlace.setAttribute("aria-current", "location");
      } else {
        enlace.removeAttribute("aria-current");
      }
    });

    actualizacionPendiente = false;
  }

  function solicitarActualizacion() {
    if (actualizacionPendiente) {
      return;
    }

    actualizacionPendiente = true;

    window.requestAnimationFrame(actualizarNavegacion);
  }

  window.addEventListener("scroll", solicitarActualizacion, { passive: true });

  window.addEventListener("resize", solicitarActualizacion);

  window.addEventListener("hashchange", solicitarActualizacion);

  actualizarNavegacion();
}

inicializarNavegacionActiva();
