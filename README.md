# NEXO V5 — inventario con Aiven y preparación para Render

Proyecto completo consolidado el **4 de noviembre de 2026**. Incluye frontend, backend, los parches entregados, 20 fotografías del catálogo DEMO, pruebas y documentación.

**Empieza por [ACTUALIZAR_PC_PRINCIPAL.md](ACTUALIZAR_PC_PRINCIPAL.md)**. Para publicar después, sigue [LEEME_RENDER.md](LEEME_RENDER.md).

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

Este ZIP no contiene .env reales, contraseñas, tokens, certificados, respaldos personales ni fotos adicionales que solo estén en backend/uploads de otra instalación. Sí contiene las 20 imágenes ficticias del catálogo DEMO.

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

Este paquete no demuestra que Render esté publicado ni que el último push llegara a GitHub. Esas comprobaciones se hacen desde tu instalación.
