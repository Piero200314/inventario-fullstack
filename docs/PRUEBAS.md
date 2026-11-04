# Validación de NEXO 2

Fecha: 3 de noviembre de 2026. Código preparado a partir del repositorio `Piero200314/inventario-fullstack` y de los requisitos conversados. Los ensayos se realizaron en un entorno aislado; no se accedió a tu base de XAMPP ni se modificó tu PC.

## Verificaciones automatizadas realizadas

- Compilación de producción del frontend con Vite: correcta.
- Análisis estático del código frontend con Oxlint: sin advertencias en `src`.
- 5 pruebas de validación y cálculo con `node:test`: correctas.
- Integración HTTP real con Express, JWT y **MariaDB 10.11** de prueba: migración repetida, conservación de producto anterior, roles, SKU único, conflictos de edición, trazabilidad, idempotencia, operaciones concurrentes, imágenes y archivo de productos.
- Navegador Chromium, con respuestas de API controladas para la prueba de UI: inicio de sesión, alta y edición sin F5, creación de proveedores, navegación de reportes, cifras compartidas, tema persistido, filtro de límite instantáneo, venta y vista móvil.
- Inspección visual en escritorio 1440 px y móvil 390 px, tema claro/oscuro. No se observó desbordamiento horizontal de la página. Las tablas tienen desplazamiento propio.

La prueba de integración está en `backend/tests/integration.cjs`; crea y elimina una base nueva cuyo nombre debe empezar por `nexo_test_`. Nunca reutiliza `DB_NAME`. Se reserva para una base aislada con permiso de crear bases; no es necesario ejecutarla sobre tu instalación para usar la app. El ensayo local no valida el despliegue en nube, Telegram real, otros navegadores ni tu MariaDB 10.4 específico: hay que completar los pasos siguientes en tu PC.

## Pruebas de aceptación en tu equipo

Anota resultado real, fecha y evidencia. No marques una prueba como aprobada solo por haber leído esta tabla.

| Nº | Acción | Resultado esperado |
|---|---|---|
| 1 | Entrar con credenciales incorrectas y después correctas | Error claro; después catálogo con sesión válida |
| 2 | Revisar productos anteriores después de migrar | Mismos IDs, nombres, precios y stock; SKU LEGACY-ID y apertura |
| 3 | Crear proveedor con empresa, contacto y teléfono | Persistencia inmediata; aparece como opción en productos y recepciones |
| 4 | Crear producto con SKU, precio, foto y stock inicial | Aparece sin F5; resumen y alertas cambian |
| 5 | Intentar repetir SKU | Rechazo sin crear producto adicional |
| 6 | Editar precio, descripción, costo y mínimo | Ficha y cifras actualizadas sin F5; stock no editable directamente |
| 7 | Abrir misma ficha en dos navegadores; guardar ambos | Segundo formulario obsoleto recibe conflicto y pide sincronizar |
| 8 | Registrar recepción de 5 unidades | Stock +5; proveedor, repartidor, guía y usuario visibles en historial |
| 9 | Registrar venta de 2 unidades | Stock −2; historial y gráfica actualizados |
| 10 | Intentar retirar más que el stock | Rechazo; saldo e historial no cambian |
| 11 | Cambiar límite de consulta a 0, 3 y vacío | Filtro instantáneo; vacío vuelve al mínimo propio de cada producto |
| 12 | Cambiar mínimo del producto y volver a Resumen | Tarjeta, gráfica y alerta coherentes |
| 13 | Cerrar navegador, volver e iniciar sesión | Productos, proveedores, movimientos y fotos siguen guardados |
| 14 | Archivar con stock >0 | Bloqueado |
| 15 | Dejar stock cero con movimiento justificado y archivar | Sale del catálogo; movimientos permanecen |
| 16 | Entrar como Almacenero | No puede crear proveedores, ajustar stock ni archivar por API |
| 17 | Cambiar tema y recargar | Preferencia conservada en ese navegador |
| 18 | Vista móvil 390 px y zoom 200% en escritorio | Texto legible, menú accesible, formularios utilizables; tablas desplazables |
| 19 | Usar teclado: Tab, Enter y Escape en un diálogo | Foco visible, acciones accesibles y cierre al cancelar |
| 20 | Detener backend temporalmente | Aviso de conexión, datos previos conservados; no mensaje falso de guardado |
| 21 | Descargar CSV con nombre que empieza por = | Se neutraliza como texto para evitar fórmula involuntaria |
| 22 | Ejecutar bot con --dry-run | Solo lista avisos; no envía mensajes ni registra envíos |
| 23 | Respaldar y restaurar en base separada | Se recuperan datos y fotos; confirmar antes de confiar en copias |

## Caso numérico reproducible

Para los cuatro productos que usaste:

| Producto | Precio | Stock |
|---|---:|---:|
| Teclado mecánico RGB | 180.00 | 10 |
| Mouse gamer | 85.00 | 3 |
| Monitor de 24 pulgadas | 650.00 | 5 |
| Audífonos gamer | 120.00 | 0 |

Resultado: 4 productos, 18 unidades y **S/ 5,305.00 a precio de venta**. Con mínimo 5 para todos: 3 alertas. El valor a costo será desconocido/parcial hasta registrar costos; no debe confundirse con S/ 5,305.00.

Con consulta ≤3: 2 productos; ≤0: 1 producto. Cambiar la consulta no cambia los mínimos guardados. Después de una recepción de 1 mouse: 19 unidades y S/ 5,390.00 a precio de venta, sin F5.

## Evidencias para laboratorio 9 y portfolio

Captura una vez comprobados: login, tema claro/oscuro, resumen con cifras reales, catálogo con fotos, formulario, proveedores, recepción con responsable, historial, alertas, reporte y vista móvil. Evita mostrar `.env`, tokens, contraseñas o datos personales de proveedores reales. Usa datos ficticios claramente identificados en las evidencias públicas.

El laboratorio 9 puede documentar el rediseño, componentes, accesibilidad, responsividad, estado React y consumo de API. La ampliación logística debe presentarse como evolución del proyecto, sin atribuir al laboratorio requisitos que no se han verificado en su guía original.
