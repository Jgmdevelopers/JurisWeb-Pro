# JurisWeb Pro — v0.2.0-dev

Plantilla institucional demostrativa de GM.DEV para estudios jurídicos, reutilizable por cliente. HTML, CSS y JavaScript estáticos, sin backend ni dependencias de ejecución en el navegador. Node.js, Playwright y http-server se utilizan para desarrollo y validación.

## Desarrollo local

```bash
npm ci
npx playwright install chromium
npm run serve:test
```

Abrir http://127.0.0.1:8765. Detener el servidor manual antes de ejecutar las suites Playwright, que inician su propio servidor.

## Personalización

Editar `config/estudio.js`: identidad, logo, fotografías, datos institucionales, contacto, áreas, profesionales, FAQ, proceso de consulta, footer, tema y 56 campos editoriales. Los temas clásico, verde, borgoña y grafito admiten colores y tipografías autorizados, con validación de contraste y respaldo. Las variables CSS se centralizan en `assets/css/theme.css`.

```bash
npm run generar:iconografia
npm run generar:portada-social
npm run generar:seo
npm run validar:seo
```

Regenerar iconografía al cambiar los SVG del catálogo. La portada JPG de 1200 × 630 se genera con Chromium y conserva la leyenda demostrativa. `npm run generar:variantes-sociales` exporta las cuatro variantes fuera del repositorio, en ../recursos-originales/jurisweb-pro/portadas-sociales. La ruta local de imagen social requiere una URL base HTTPS para emitir etiquetas sociales absolutas. El generador SEO actualiza los tres HTML y mantiene noindex,nofollow.

## Pruebas

```bash
npm run test:responsive
npm run test:animaciones
npm run test:tema
npm run test:iconografia
npm run test:editorial
npm run test:seo
npm run test:portada-social
```

Usar suites específicas durante el desarrollo. Ejecutar `npm test` (regresión Playwright) y las suites Node por separado antes de integrar o liberar una versión. Playwright cubre seis tamaños de pantalla con Chromium; no equivale a una auditoría multinavegador.

## Cierre de desarrollo — 26/11/2026

Rama: `feature/identidad-visual-v1`. Último commit funcional: `bcdc70e`.

- Identidad premium, navegación, hero, estudio, áreas, equipo, proceso de consulta, FAQ, contacto y footer.
- Identidad gráfica configurable, temas corporativos e iconografía adaptable.
- Motor editorial: 78 PASS, 56 campos.
- SEO estático: 16 PASS Node y 48 PASS Playwright.
- Portadas sociales: 16 PASS; portada clásica 1200 × 630, 53.406 bytes; cuatro variantes generadas.
- Revalidación editorial: 30 PASS responsive y 30 PASS animaciones.
- Registro histórico por etapas: 918 resultados positivos y 8 omisiones previstas; no es el resultado de una única regresión ni un recuento de casos únicos.

## Próximos pasos

1. Control de publicación comercial con comportamiento seguro por defecto y aprobaciones explícitas.
2. Validador integral de configuración, perfiles comerciales y documentación.
3. CI, auditorías de seguridad/accesibilidad, revisión visual y multinavegador, regresión integral, PR hacia develop y release v0.2.0.

## Restricciones de publicación

Todavía es una demostración, no una web jurídica aprobada ni una release v0.2.0. No contiene formularios, seguimiento propio ni envío automático. No almacenar expedientes ni datos sensibles en el repositorio o sitio estático. Antes de producción verificar identidad, matrículas, jurisdicción, derechos de imágenes, datos de contacto, contenido, privacidad y reglas de publicidad profesional; revisar los documentos legales provisionales. Quedan pendientes dominio, imagen social públicamente accesible, sitemap y datos estructurados verificados. Noindex no es control de acceso.

Tablero: https://trello.com/b/UFEIhl6c/jurisweb-pro-desarrollo-y-readmao
