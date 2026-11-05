# NEXO V5 · arquitectura y alcance

Despliegue actual: [NEXO en Render](https://inventario-fullstack-1.onrender.com). Web y API comparten dominio; PostgreSQL y las imágenes están en Aiven.

## Flujo de datos

React (Render) → API Express con JWT (Render) → servicios de logística → transacción Sequelize → PostgreSQL (Aiven).

MySQL/MariaDB sigue disponible como alternativa de desarrollo local. Cada proceso selecciona una base mediante configuración; no hay sincronización bidireccional automática.

Las fotos siguen esta ruta: selección → optimización WebP en el navegador → carga autenticada → tabla `nexo_imagenes` de PostgreSQL con `IMAGE_STORAGE=database`. Se almacenan como binario; el catálogo las solicita mediante `/media/:archivo`. No dependen del disco temporal de Render. La configuración local también admite archivos en `backend/uploads`.

La fuente Inter se distribuye dentro del frontend mediante Fontsource. Express sirve la compilación de Vite cuando `SERVE_FRONTEND=true` y atiende las rutas React al recargarlas.

## Persistencia y compatibilidad

Se conservan las tablas originales `productos` y `usuarios`. La migración añade:

| Tabla | Propósito |
|---|---|
| `nexo_detalles` | Relación 1:1 con producto, SKU único, metadatos, costos, foto, proveedor, límites y revisión |
| `nexo_proveedores` | Empresa, contacto y datos operativos |
| `nexo_movimientos` | Aperturas, recepciones, ventas, salidas y ajustes con saldo anterior/posterior y responsable |
| `nexo_avisos` | Estado del último aviso externo enviado por producto |
| `nexo_imagenes` | Fotografías binarias compartidas entre procesos que usan la misma base |

No se infiere el costo a partir del precio de venta: un producto antiguo conserva costo desconocido hasta que se registre. El stock existente se registra como apertura, no como compra ni venta histórica. No se modifican las contraseñas de usuarios.

## Consistencia

- React comparte inventario, proveedores e historial a través de un único proveedor de contexto. Una operación exitosa actualiza ese estado con la respuesta del servidor.
- Una lectura iniciada antes de una modificación no reemplaza el resultado de esa modificación.
- Las actualizaciones de ficha requieren la revisión actual. Un formulario antiguo recibe HTTP 409.
- La operación de stock toma un bloqueo de fila del producto; movimiento y saldo se confirman en una misma transacción. Si algo falla, se revierte todo.
- Cada solicitud de movimiento usa una clave única. Repetir la misma solicitud devuelve el movimiento anterior. Una clave reutilizada con contenido distinto produce HTTP 409.
- La clave evita duplicados mientras se conserva la solicitud. Si el usuario cierra el formulario y registra deliberadamente otra operación, se genera una clave nueva.
- Aperturas y movimientos no se editan ni eliminan desde la API. Un error se compensa con un ajuste documentado del Administrador.
- Un producto con stock no puede archivarse. El archivo oculta el producto pero mantiene relaciones e historial.
- PostgreSQL aporta transacciones y bloqueo de filas en el despliegue actual. En la alternativa MySQL/MariaDB se requieren tablas InnoDB; valida el motor de una instalación antigua.

## Roles

| Acción | Administrador | Almacenero |
|---|---|---|
| Consultar inventario, contactos, reportes y movimientos | Sí | Sí |
| Crear/editar ficha de producto | Sí | Sí |
| Registrar recepción, venta y salida | Sí | Sí |
| Ajustar inventario | Sí | No |
| Crear/editar proveedor | Sí | No |
| Archivar producto sin stock | Sí | No |

La API comprueba los roles; ocultar un botón no es el control de seguridad. El registro público queda cerrado por defecto. No se incluye una pantalla de administración de usuarios.

## Endpoints

| Método y ruta | Función |
|---|---|
| POST `/api/auth/login` | Sesión existente |
| GET `/api/health` | Disponibilidad y tipo de base/almacenamiento, sin credenciales |
| GET/POST `/api/productos` | Consultar/crear producto |
| PUT `/productos/:id` | Editar metadatos, precio y límites con revisión |
| DELETE `/productos/:id` | Archivar, enviando `{revision}`; no borrar |
| GET/POST `/api/proveedores` | Consultar/crear proveedor |
| PUT `/api/proveedores/:id` | Editar con revisión |
| GET `/api/movimientos` | Hasta últimos 5.000; filtros opcionales `productoId` y `desde` |
| POST `/api/movimientos` | Movimiento transaccional e idempotente |
| GET `/api/alertas` | Productos activos con stock <= mínimo |
| POST `/api/imagenes` | Archivo binario PNG/JPEG/WebP, máximo 3 MB, autenticado |
| GET `/media/:archivo` | Fotografía de producto pública |

En Render, el frontend usa el origen de la propia página. En desarrollo, `VITE_API_URL` puede contener el origen HTTP del backend, por ejemplo `http://localhost:3006`, sin añadir `/api` ni credenciales de base.

La API conserva `/productos` y `/productos/:id` por compatibilidad, y ofrece también sus variantes `/api/productos`. Una navegación HTML a `/productos` sirve React; las consultas de datos siguen requiriendo token. Todos los productos y contactos se consultan con autenticación, pero las fotografías de catálogo son públicas para mostrar imágenes normales. No subas documentos personales como fotos.

## Cálculos

- Unidades físicas: suma de stock de productos activos.
- Valor a costo: suma de stock × costo unitario de referencia conocido. Se marca como parcial si falta costo.
- Valor a precio de venta: stock × precio actual; no es utilidad ni facturación realizada.
- Ventas: únicamente movimientos `venta`. Conservan precio y costo de referencia de ese momento.
- Cobertura: stock / demanda diaria registrada. Sin ventas muestra “Sin historial de ventas”.
- Reposición: demanda diaria × plazo + mínimo; si stock llega a ese punto, sugiere completar hasta el mayor entre objetivo y punto.
- La ventana de ventas es móvil de 30 días. El gráfico diario muestra 14 días con agrupación UTC, indicada en pantalla.

No se descuentan órdenes pendientes ni se calculan reservas porque esos módulos no existen en esta fase. No se afirma rentabilidad real: faltan impuestos, costos operativos, descuentos, devoluciones y valoración contable. El máximo histórico de 5.000 registros limita la analítica de operaciones grandes y debe sustituirse por consultas agregadas del servidor antes de escalar.

## Presentación y accesibilidad

Inter 400/500/600/700 servida localmente; texto principal 16 px, etiquetas 15 px, textos auxiliares 12–14 px. No se usan pesos 200/300. Temas por variables CSS; preferencia guardada por navegador. Controles de al menos 44 px, foco visible, campos etiquetados, saltar al contenido y diálogos nativos. Gráficas con texto/valores y tabla alternativa para la serie temporal. La preferencia de movimiento reducido desactiva animaciones.

El atributo `translate=no` y la etiqueta `notranslate` reducen interferencias de traductores que modifican nodos de React. Un límite de errores muestra una recuperación si una vista falla. Esto no sustituye corregir un error de aplicación; conserva el mensaje de consola si reaparece.

## Fuentes técnicas

- Sequelize 6, transacciones: https://sequelize.org/docs/v6/other-topics/transactions/
- Fontsource, instalación: https://fontsource.org/docs/getting-started/install
- Inter: https://fontsource.org/fonts/inter/about
- Telegram Bot API: https://core.telegram.org/bots/api

## Próximas fases

1. Órdenes de compra con líneas, estados, aprobaciones y recepciones parciales.
2. Reservas, múltiples almacenes y transferencias con doble movimiento.
3. Lotes, seriales, vencimiento, FEFO y devoluciones vinculadas.
4. Paginación, índices adicionales y reportes agregados de servidor; ABC con historia suficiente.
5. Costeo definido con un profesional contable: promedio ponderado o FIFO.
6. Almacenamiento de objetos si crece el catálogo y copias programadas con simulacro de restauración.

Esta entrega es una versión funcional ampliada, no un ERP terminado ni un sistema fiscal.

