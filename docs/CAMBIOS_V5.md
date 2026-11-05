# Cambios y estado real — 4 de noviembre de 2026

| Entrega | Incluido en V5 |
|---|---|
| Sistema completo V4 | Frontend, API, 20 fotos DEMO, documentación y pruebas |
| Galaxia V2 y neón V3 | Ya integrados: estrellas y planetas en movimiento, marcos, temas y pausa |
| Parche Fechas Aiven | Compatibilidad createdAt/updatedAt, fechas desconocidas NULL y traslado de datos |
| Catálogo y limpieza | Respaldo y archivado dirigido LEGACY-4 a LEGACY-8 tras comprobar los 20 DEMO |
| Render Aiven | Web/API en un servicio, rutas recargables, build, Node fijado y revisión de Git |
| Documentación V5 | Actualización de la PC principal y protección de sus datos locales |

Confirmado en capturas previas: Laragon conectó a Aiven PostgreSQL, importó 2 usuarios y 5 productos sin fotos/proveedores en aquel respaldo y arrancó el backend. La cuenta piero@inventario.test existe como Administrador. Se creó un commit local en pruebas-render; el push mostrado falló por autenticar otra cuenta.

Sin confirmación posterior: aplicación de la limpieza en la base del usuario, push exitoso, Render Live y traslado del inventario original de la PC principal. El código no equivale a un respaldo de datos actuales.

Pruebas previas del código: PostgreSQL/MariaDB reales, transacciones y roles; traslado de IDs, bcrypt y fechas; imágenes compartidas; catálogo/archivado dirigido con respaldo, repetición sin duplicados y rollback; build/lint; navegador Chromium en modo de producción con login, fotos, venta, resumen actualizado y recarga de rutas sin llamadas a localhost:3006.

Las pruebas locales del código no sustituyen comprobar tu instalación y el despliegue real. Los PDF del laboratorio y video son documentación histórica anterior a V5.

Verificación de esta consolidación: instalación con ambos lockfiles, 8 tests de backend aprobados, lint frontend sin advertencias y build de producción completado. Se compararon 63 archivos de código/estilos/dependencias con las fuentes previamente probadas.
