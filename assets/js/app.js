"use strict";
const estudio = window.ESTUDIO || {};
document.querySelectorAll("[data-field]").forEach((el) => {
  const valor = estudio[el.dataset.field];
  if (typeof valor === "string" && valor.trim()) el.textContent = valor;
});
function renderTarjetas(id, items) {
  const cont = document.getElementById(id);
  if (!cont || !Array.isArray(items)) return;
  cont.replaceChildren();
  for (const item of items) {
    const card = document.createElement("article"),
      h = document.createElement("h3"),
      p = document.createElement("p");
    h.textContent = item.titulo;
    p.textContent = item.descripcion;
    card.append(h, p);
    cont.append(card);
  }
}
renderTarjetas("lista-areas", estudio.areas);
renderTarjetas("lista-equipo", estudio.equipo);
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
