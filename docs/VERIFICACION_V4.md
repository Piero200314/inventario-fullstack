# Verificación de NEXO 4

> **Documento histórico anterior a V5.** El despliegue actual utiliza PostgreSQL de Aiven y está [publicado en Render](https://inventario-fullstack-1.onrender.com). Consulta [la configuración actual](../LEEME_RENDER.md) y [el estado verificado](CAMBIOS_V5.md). Los pasos y pendientes de esta guía describen la entrega original; no repitas importaciones sobre una base poblada.


Fecha: 4 de noviembre de 2026. Las pruebas con bases se ejecutaron sobre instancias temporales y datos ficticios. No se conectó al proyecto Neon del alumno ni a su MariaDB de la otra PC.

## Backend

- 8 pruebas unitarias aprobadas: importes, enteros, mínimo/objetivo, referencias de foto, trazabilidad, analítica/CSV, URI PostgreSQL, TLS verificado y selección de URI directa.
- PostgreSQL 16.15 real: migración repetible, preservación del producto previo, autenticación, roles, SKU único con rollback, edición obsoleta, rechazo de edición directa de stock, recepción trazable, idempotencia, salidas simultáneas sin saldo negativo, fotos y archivo con historial.
- MariaDB 10.11 real: repetición de la batería anterior para conservar la alternativa local.
- Importación DEMO en PostgreSQL: 20 productos, 20 fotos BYTEA y 20 aperturas; 212 unidades y S/ 37,644 de valor de referencia inicial. Al repetir, no se duplican los SKU.
- Configuración inicial: un JWT_SECRET vacío se genera y un secreto existente se conserva al volver a ejecutar la utilidad.

## Traslado MariaDB -> PostgreSQL

Un caso con usuario bcrypt, IDs explícitos, un producto con foto local, recepción, venta y producto archivado verificó:

1. La vista previa no escribe filas.
2. Un conflicto SQL provocado después de comenzar las inserciones revierte toda la restauración.
3. Una importación válida conserva hashes, IDs, fechas, archivo lógico, saldo, proveedores, movimientos y fotografía.
4. Las siguientes altas usan secuencias PostgreSQL correctas, sin colisionar con IDs importados.
5. Repetir la importación sobre un destino poblado es rechazado.
6. Dos procesos HTTP independientes, apuntando a la misma base y sin fotos en sus carpetas de disco, consultan los mismos registros e imagen. Un alta desde uno aparece al consultar el otro.

## Frontend

Se verifican compilación de producción y Oxlint con deny-warnings. La prueba en Chromium utiliza una API simulada para aislar la interfaz y comprobar login, alta/edición, actualización del resumen sin F5, filtro de stock en vivo, venta, proveedores, reportes, temas y vista móvil. Los efectos V3 conservan controles de pausa; el logo y los marcos permanecen en ambos temas. No es una prueba de carga ni una auditoría de accesibilidad completa.

## Pendiente al configurar tu entorno

- Crear/elegir el proyecto Neon y probar sus URI pooled/directa con TLS real.
- Exportar los datos reales desde la PC que los conserva y comparar cantidades, saldos e historial después de importarlos.
- Verificar fotos y cambios desde tus dos dispositivos y tu red.
- Medir latencia y rendimiento de animaciones en el equipo utilizado para el video.
- Probar respaldo/restauración periódicos y, si se publica, alojamiento HTTPS de API y frontend.
- Completar el QA de seguridad y recuperación; los casos aprobados no acreditan seguridad absoluta.

Los scripts de integración se ejecutan solo contra bases locales desechables con prefijo nexo_test_. No ejecutes pruebas destructivas sobre tu proyecto real de Neon.

