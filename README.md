# JurisWeb Pro v0.1.0
Plantilla estática demostrativa para estudios jurídicos. Sin dependencias ni backend. Abrir index.html o ejecutar `python -m http.server 8000` y visitar http://localhost:8000.

Editar `config/estudio.js` para los datos del cliente y `assets/css/styles.css` para la identidad. Los datos profesionales, textos, áreas, contacto y documentos legales requieren validación antes de producción. Mantener noindex hasta aprobar el contenido. No contiene formulario, seguimiento ni envío automático. GitHub Pages es adecuado para esta versión pública; nunca almacenar expedientes allí.

## Validación
`node --check assets/js/app.js` y `node --check config/estudio.js`. Revisar manualmente teclado, menú, tamaños móviles, contraste y canales configurados. Antes de publicar agregar canonical, sitemap y datos estructurados verificados; revisar política de privacidad y reglas locales de publicidad.
