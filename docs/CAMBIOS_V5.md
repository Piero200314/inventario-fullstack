# Cambios y estado real de NEXO V5

Actualizado el **5 de noviembre de 2026**.

**[Demo publicada en Render](https://inventario-fullstack-1.onrender.com)** · [Estado de la API](https://inventario-fullstack-1.onrender.com/api/health)

## Componentes incluidos

| Entrega | Incluido en V5 |
|---|---|
| Sistema completo | Frontend, API, catálogo DEMO de 20 productos con fotos, documentación y pruebas |
| Galaxia V2 y neón V3 | Estrellas y planetas en movimiento, marcos animados, dos temas y pausa |
| Compatibilidad Aiven | PostgreSQL con TLS verificado, fechas antiguas y traslado de datos |
| Catálogo y limpieza | Respaldo y archivado dirigido LEGACY-4 a LEGACY-8 tras comprobar los DEMO |
| Render | Web/API en un servicio, rutas recargables, build y Node fijado |
| Actualización de PC | Respaldo local y protección de archivos privados antes de cambiar la conexión |

## Confirmado en el entorno del proyecto

- La PC principal generó un respaldo del MySQL local con 1 usuario, 25 productos, 4 proveedores, 25 detalles, 29 movimientos y 20 imágenes. Son cantidades de ese respaldo, no una medición actual de la base pública.
- La PC principal comprobó conexión con PostgreSQL de Aiven y almacenamiento de imágenes en base de datos.
- El commit `e0e5d7e` se subió a `actualizacion-pc-principal-v5`. El [Pull Request #1](https://github.com/Piero200314/inventario-fullstack/pull/1) se integró en `main` mediante `9450a92`.
- Render mostró **Deploy succeeded / Live**, ejecutando `node backend/index.js` en el puerto asignado por la plataforma.
- La URL pública es [https://inventario-fullstack-1.onrender.com](https://inventario-fullstack-1.onrender.com).

## Comprobaciones públicas del 5 de noviembre de 2026

| Solicitud | Resultado observado |
|---|---|
| `GET /` con aceptación de HTML | HTTP 200, aplicación NEXO |
| `GET /api/health` | HTTP 200, `ok: true`, `database: postgres`, `imagenes: database` |
| `GET /api/productos` sin token | HTTP 401, requiere Bearer |

Estas lecturas no crearon ni modificaron registros. No acreditan un recorrido autenticado completo ni una prueba de carga.

## Validación local previa

Se aprobaron pruebas con PostgreSQL/MariaDB temporales: transacciones y roles; traslado de IDs, bcrypt y fechas; imágenes compartidas; catálogo y archivado dirigido con respaldo, repetición sin duplicados y rollback.

La consolidación verificó instalación con ambos lockfiles, 8 tests de backend, lint frontend y build de producción. También se probó con Chromium en modo de producción: login, fotos, venta, resumen actualizado y recarga de rutas sin llamadas a localhost:3006. Estos resultados corresponden a entornos de prueba locales.

## Por completar o verificar

- Recorrido autenticado en el dominio público: login, catálogo/fotos, proveedores, movimientos, reportes y recarga de rutas.
- Sincronización de datos entre dispositivos y persistencia tras reiniciar el servicio, usando registros de prueba.
- Confirmar si se aplicó la limpieza dirigida; no se presume una cantidad fija de productos activos.
- Comparar los registros exclusivos del respaldo MySQL con Aiven antes de cualquier mezcla. Un respaldo local creado no demuestra que todos sus registros se hayan trasladado.
- Revisar el informe de dependencias del backend: la instalación de la PC principal mostró 4 vulnerabilidades moderadas; no se ha analizado aquí su impacto.
- Completar pruebas de recuperación y seguridad. Telegram es opcional y requiere su propia configuración.

Las pruebas de escritura contra el servicio publicado afectan a la base compartida. Los respaldos y secretos no se incluyen en GitHub. El código del repositorio no reemplaza un respaldo actualizado.

La guía de Neon y los PDF de laboratorio/video son documentos históricos anteriores a la publicación de V5. Para el despliegue actual, consulta [LEEME_RENDER.md](../LEEME_RENDER.md).

