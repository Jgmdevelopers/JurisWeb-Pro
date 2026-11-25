"use strict";

/**
 * Inicializa las animaciones de aparición
 * progresiva del contenido.
 */
function inicializarAnimaciones() {
  const movimientoReducido = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  );

  if (movimientoReducido.matches || !("IntersectionObserver" in window)) {
    return;
  }

  const elementos = document.querySelectorAll(
    ".section h2, .section .eyebrow, .grid article, details",
  );

  if (!elementos.length) {
    return;
  }

  const observador = new IntersectionObserver(
    (entradas, instancia) => {
      entradas.forEach((entrada) => {
        if (entrada.isIntersecting) {
          entrada.target.classList.add("is-visible");

          // La animación se ejecuta una sola vez.
          instancia.unobserve(entrada.target);
        }
      });
    },
    {
      threshold: 0.1,
      rootMargin: "0px",
    },
  );

  elementos.forEach((elemento) => {
    // No ocultar elementos muy altos que podrían
    // no alcanzar el umbral de intersección.
    if (elemento.offsetHeight > window.innerHeight) {
      return;
    }

    elemento.classList.add("reveal");

    observador.observe(elemento);
  });

  // Aparición secuencial de tarjetas.

  document.querySelectorAll(".grid").forEach((grilla) => {
    grilla.querySelectorAll("article").forEach((tarjeta, indice) => {
      const retraso = Math.min(indice, 5) * 90;

      tarjeta.style.setProperty("--reveal-delay", `${retraso}ms`);
    });
  });

  document.documentElement.classList.add("motion-ready");

  movimientoReducido.addEventListener("change", (evento) => {
    if (evento.matches) {
      observador.disconnect();

      document.documentElement.classList.remove("motion-ready");
    }
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", inicializarAnimaciones, {
    once: true,
  });
} else {
  inicializarAnimaciones();
}
