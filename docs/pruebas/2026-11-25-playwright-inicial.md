# Registro de pruebas E2E — JurisWeb Pro

## 1. Información general

- Fecha: 25/11/2026.
- Versión: v0.2.0-dev.
- Rama: feature/identidad-visual-v1.
- Commit base de aplicación: dda04c8.
- Node.js: v22.22.0.
- npm: 10.9.2.
- Herramienta: Playwright.
- Navegador: Chromium.
- Workers: 2.

## 2. Objetivos

- Validar diseño responsive.
- Verificar navegación y menú móvil.
- Comprobar animaciones y microinteracciones.
- Validar accesibilidad básica.
- Detectar errores JavaScript.
- Verificar la carga de recursos esenciales.
- Establecer una base de pruebas de regresión.

## 3. Resoluciones evaluadas

- Escritorio: 1920 x 1080.
- Escritorio: 1440 x 900.
- Tablet horizontal: 1024 x 768.
- Tablet vertical: 768 x 1024.
- Móvil: 390 x 844.
- Móvil pequeño: 320 x 568.

## 4. Incidencia detectada

Durante las primeras ejecuciones se detectaron
fallos intermitentes relacionados con las clases
motion-ready e is-visible.

El análisis mediante Playwright Trace Viewer
permitió identificar errores:

    net::ERR_CONNECTION_REFUSED

Los errores afectaban la descarga de recursos
JavaScript y CSS.

## 5. Investigación

Se verificó:

- Orden de ejecución de scripts defer.
- Sintaxis JavaScript.
- Inicialización de animaciones.
- Funcionamiento de IntersectionObserver.
- Carga de recursos esenciales.
- Comportamiento con dos workers simultáneos.
- Aislamiento del servidor HTTP.

El cambio del puerto 8000 al 8765 no eliminó
los fallos intermitentes.

## 6. Solución adoptada

Se reemplazó el servidor HTTP de Python por
http-server basado en Node.js.

Configuración:

- Puerto exclusivo: 8765.
- Dirección: 127.0.0.1.
- Caché HTTP deshabilitada.
- Reutilización de servidores deshabilitada.
- Dos workers simultáneos.

No se modificó la lógica funcional de la aplicación.

La causa raíz interna del rechazo de conexiones
no pudo determinarse de manera concluyente.

## 7. Resultados finales

### Estabilidad HTTP

- Casos ejecutados: 30.
- Superados: 30.
- Fallidos: 0.
- Duración: 31.2 segundos.

### Suite completa

- Casos definidos: 132.
- Superados: 124.
- Fallidos: 0.
- Omitidos: 8.
- Duración: 1.4 minutos.

Las omisiones corresponden a pruebas exclusivas
del menú móvil en resoluciones de escritorio
y tablet superiores al breakpoint establecido.

## 8. Conclusión

Infraestructura inicial de pruebas E2E validada.

La migración del servidor permitió completar
las pruebas de estabilidad y regresión sin fallos.

## 9. Mejoras futuras

- Regresión visual mediante screenshots.
- Pruebas multinavegador.
- Auditoría automatizada de accesibilidad.
- Integración continua con GitHub Actions.
- Pruebas de rendimiento.
- Validación en dispositivos físicos.
