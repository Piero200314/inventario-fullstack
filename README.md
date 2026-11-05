# NEXO V5 — inventario en la nube

**[Abrir NEXO: demo en Render](https://inventario-fullstack-1.onrender.com)** · [Estado de la API](https://inventario-fullstack-1.onrender.com/api/health)

Sistema de gestión de inventario desarrollado para el Laboratorio 09. Incluye catálogo con fotografías, proveedores, movimientos, alertas y reportes, con una interfaz de galaxia y neón animados.

**Despliegue publicado y comprobado el 5 de noviembre de 2026.** La actualización V5 se integró en `main` mediante el [Pull Request #1](https://github.com/Piero200314/inventario-fullstack/pull/1).

## Demo y acceso

Abre el enlace de Render desde una PC o un móvil. La aplicación funciona sin mantener encendida la computadora de desarrollo. El registro público está desactivado: solicita una cuenta de prueba al administrador y recibe sus credenciales por un canal privado.

El servicio gratuito puede tardar alrededor de un minuto en responder después de un periodo de inactividad. Los datos y las fotografías se conservan en Aiven.

| Componente | Tecnología y alojamiento |
|---|---|
| Interfaz | React 19 y Vite 8; compilación servida por Render |
| API | Node.js, Express 5 y Sequelize 6 en el mismo servicio de Render |
| Base de datos | PostgreSQL en Aiven, con conexión TLS verificada |
| Fotografías | Tabla `nexo_imagenes` en PostgreSQL |
| Acceso | JWT, bcrypt y roles Administrador/Almacenero |

Para instalar o actualizar una PC, consulta [ACTUALIZAR_PC_PRINCIPAL.md](ACTUALIZAR_PC_PRINCIPAL.md). La configuración del servicio publicado está en [LEEME_RENDER.md](LEEME_RENDER.md).

## Funciones

- Resumen, Catálogo, Stock y alertas, Proveedores, Movimientos y Reposición/reportes.
- Estado compartido actualizado al guardar productos o registrar movimientos, sin F5. Otras ventanas/dispositivos consultan al pulsar Sincronizar, recuperar foco y periódicamente; no usa WebSockets.
- Fotos optimizadas, SKU único, categoría, marca, costo, precio, mínimo, objetivo, plazo de suministro, ubicación y proveedor.
- Recepciones con proveedor y persona que entrega; responsable, referencia y observaciones en el historial.
- Stock transaccional y bloqueo de fila; rechazo de saldos negativos y conflictos de edición. Mensaje de stock insuficiente comprensible.
- Archivado de productos con stock cero, conservando historial.
- Gráficos de disponibilidad, existencias y entradas/salidas; ventas y propuestas orientativas de reposición.
- Inter con pesos locales, tema claro/oscuro, diseño adaptable, galaxia con estrellas y planetas animados, marcos rojos neón y control para pausar el movimiento.
- JWT, bcrypt, roles Administrador/Almacenero y registro público desactivado por defecto.
- PostgreSQL de Aiven o MySQL/MariaDB local mediante configuración. Cada proceso usa una base; no hay sincronización bidireccional automática ni modo offline con reconciliación.
- Fotos en PostgreSQL con IMAGE_STORAGE=database para conservarlas entre dispositivos y reinicios de Render.
- Traslado con validación a un destino vacío; compatibilidad con tablas antiguas sin createdAt/updatedAt. Fechas históricas desconocidas se conservan como NULL.
- Catálogo DEMO opcional: 20 productos, 20 fotos y 3 proveedores ficticios. Omite los SKU existentes sin sobrescribirlos.
- Respaldo y archivado dirigido de LEGACY-4 a LEGACY-8: herramienta para la captura de la otra PC, no una limpieza general.
- React y Express en un solo servicio de Render: mismo dominio para la API, rutas recargables, TLS con CA, build y comprobación de rutas privadas de Git.

## Datos privados

Las credenciales se configuran privadamente en `backend/.env` para desarrollo y en Environment/Secret Files de Render para el servicio publicado. Las plantillas del repositorio solo muestran valores de ejemplo. Las 20 imágenes incluidas corresponden al catálogo DEMO.

Para consultar tus registros cloud, conecta el backend al mismo Aiven. El inventario que aún esté solo en MySQL local debe respaldarse por separado. La importación completa exige una base vacía: no mezcla ni elimina un destino poblado.

.gitignore excluye .env y sus copias, certificados, respaldos y archivos generados. Un archivo ya rastreado debe retirarse del índice de Git sin borrar la copia local. Las plantillas .env.example no contienen credenciales reales.

## Arranque

Node >=22.12 compatible con Vite; Render se fija en 24.22.1. Desde la raíz:

```bash
npm.cmd ci --prefix backend
npm.cmd ci --prefix frontend
```

Conserva tu backend/.env si funciona. Para una instalación nueva usa backend/.env.example como plantilla y completa privadamente Aiven y el CA. Dentro de backend:

```bash
node scripts/configurar-seguridad.js
npm.cmd run db:check
npm.cmd run dev
```

En otra terminal, dentro de frontend: `npm.cmd run dev`. Abre http://localhost:5173. La API usa http://localhost:3006. VITE_API_URL solo recibe una URL HTTP de API, nunca credenciales PostgreSQL. Si el puerto de Vite cambia, ajusta FRONTEND_ORIGIN y reinicia la API.

Para una base nueva ejecuta primero migrate. Aiven ya tenía tablas y usuarios en la instalación anterior: no repitas importaciones ni crees otro administrador para conectar una nueva PC.

## Comprobaciones

```bash
npm.cmd test --prefix backend
npm.cmd run lint --prefix frontend
npm.cmd run build --prefix frontend
node scripts/revisar-git.cjs
```

La última comprobación requiere estar dentro del repositorio Git. Detecta rutas privadas/generadas, no sustituye revisar el contenido del commit.

## Documentación

- [Actualizar la PC principal](ACTUALIZAR_PC_PRINCIPAL.md).
- [Render con Aiven](LEEME_RENDER.md).
- [Cambios y estado real](docs/CAMBIOS_V5.md).
- [Parche de fechas](docs/PARCHE_FECHAS_AIVEN.md).
- [Catálogo y limpieza dirigida](docs/CATALOGO_Y_LIMPIEZA.md).
- [Arquitectura](docs/ARQUITECTURA.md) y [Telegram opcional](docs/TELEGRAM_Y_NUBE.md).

La guía de Neon y los PDF de laboratorio/video se conservan como documentos históricos; para Aiven y Render prevalece V5. Telegram necesita configuración y ejecución: no está activado por descargar el código. Las propuestas no gestionan órdenes de compra; no hay lotes, FEFO, FIFO ni cálculo de utilidad realizada.

## Estado comprobado del despliegue

El 5 de noviembre de 2026 se comprobaron estas respuestas en el dominio público:

| Solicitud | Resultado |
|---|---|
| `GET /`, navegación HTML | HTTP 200; entrega de la aplicación |
| `GET /api/health` | HTTP 200; `ok: true`, `database: postgres`, `imagenes: database` |
| `GET /api/productos` sin token | HTTP 401; acceso a datos protegido |

Estas comprobaciones verifican disponibilidad básica y acceso protegido. El recorrido autenticado completo del sitio publicado sigue pendiente; utiliza la guía de [pruebas en Render](LEEME_RENDER.md#5-desplegar-y-comprobar) antes de presentarlo. Las pruebas de escritura afectan a la misma base compartida.

Los resultados previos de pruebas locales y las verificaciones pendientes se distinguen en [Cambios y estado real](docs/CAMBIOS_V5.md).

