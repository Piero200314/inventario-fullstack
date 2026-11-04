# NEXO 2 · actualización integral

Actualización para el proyecto existente `inventario-fullstack` (React/Vite + Express/Sequelize + MariaDB/MySQL). Preparada el 3 de noviembre de 2026. Mantiene la identidad roja y añade un tema claro, texto más legible, catálogo fotográfico, proveedores y movimientos trazables.

**No reemplaces tu base de datos ni tu archivo `.env`.** Este paquete es una actualización de código, no una copia de tus datos. No incluye credenciales ni fotografías de tus productos.

## Instalación en tu PC con XAMPP

Tu carpeta: `C:\XAMPP\htdocs\inventario-fullstack`.
Tu MariaDB actual: `127.0.0.1:3307`, base `inventario_nexo`.

1. Detén las terminales del frontend y backend con Ctrl+C. Mantén MySQL de XAMPP encendido.
2. Haz un respaldo antes de copiar. En **Git Bash**:

```bash
cd /c/XAMPP/htdocs/inventario-fullstack
NEXO_BACKUP="../respaldo-nexo-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$NEXO_BACKUP"
tar --exclude=node_modules --exclude=.git -czf "$NEXO_BACKUP/proyecto.tar.gz" backend frontend
/c/XAMPP/mysql/bin/mysqldump.exe -h 127.0.0.1 -P 3307 -u root --single-transaction --routines --triggers inventario_nexo > "$NEXO_BACKUP/inventario_nexo.sql"
```

El último comando usa la cuenta local sin contraseña que ya comprobaste. Si ahora tiene contraseña, añade `-p` y escríbela cuando se solicite. Si el comando muestra un error, **no continúes con la migración** hasta tener un respaldo válido. El respaldo de código puede contener tu `.env`: guárdalo en privado y no lo subas a GitHub.

3. Extrae este ZIP en una carpeta aparte. Copia las carpetas **backend**, **frontend** y **docs** dentro de tu proyecto. Acepta reemplazar los archivos del mismo nombre. Copia también este LEEME. No borres las carpetas originales ni crees `frontend/frontend`.
4. Instala las dependencias desde la raíz del proyecto:

```bash
npm.cmd install --prefix backend
npm.cmd install --prefix frontend
```

5. En la misma terminal entra al backend y ejecuta la migración:

```bash
cd backend
node scripts/migrar-logistica.js
```

Debes ver: `Migración completa. Productos y usuarios conservados.`
La migración crea cuatro tablas `nexo_*`. No borra ni recrea `productos` o `usuarios`, no usa `force:true` ni `alter:true`. Agrega un SKU `LEGACY-ID` y un movimiento de apertura a cada producto anterior. Puedes ejecutar de nuevo la migración sin duplicar esas aperturas. Mantén el backend detenido mientras migra.

Si aparece `ECONNREFUSED`, comprueba XAMPP y `DB_PORT=3307` en **backend/.env**. Si falta una tabla original, comprueba que `DB_NAME` apunta a tu base existente; no crees otra vacía para ocultar el problema.

6. Inicia el backend desde la carpeta `backend`:

```bash
npm.cmd run dev
```

7. Abre **otra terminal Git Bash** y ejecuta:

```bash
cd /c/XAMPP/htdocs/inventario-fullstack/frontend
npm.cmd run dev
```

8. Abre `http://localhost:5173`, desactiva la traducción automática de esta página e inicia sesión con tu usuario existente. Haz una recarga completa una vez tras instalar. Después, crear/editar o registrar movimientos debe actualizar las cifras sin F5.

## Qué cambia en el uso

- **Resumen:** productos, unidades, costo de referencia, alertas y gráficas de disponibilidad, stock y movimientos.
- **Catálogo:** fotografías subidas desde el equipo, SKU único, categoría, marca, precio, costo, proveedor, ubicación, mínimo, objetivo y plazo de reposición. Vista de tarjetas o tabla, búsqueda y CSV.
- **Stock y alertas:** aplica el mínimo propio de cada producto. El “límite de consulta” solo cambia el filtro al instante; no modifica la configuración guardada. Para cambiar una alerta permanente, edita el mínimo del producto.
- **Proveedores:** empresa, documento, persona de contacto, teléfono, email, dirección y notas. Edición reservada al Administrador.
- **Movimientos:** recepción, venta, otra salida y ajuste. El usuario autenticado queda como responsable. La recepción requiere proveedor y persona que entrega; también admite guía o comprobante.
- **Reposición y reportes:** consumo registrado de 30 días, cobertura y propuesta orientativa. No inventa ventas anteriores ni pedidos pendientes.
- **Tema:** claro/oscuro con preferencia guardada en ese navegador. Inter se sirve con la aplicación, texto base de 16 px y controles de al menos 44 px.

El stock inicial se indica al crear un producto. Después se modifica únicamente desde **Movimientos**, para conservar trazabilidad. El Administrador puede ajustar y archivar un producto con stock cero. Archivar no borra su historial. No hay botón de eliminación permanente.

Los datos se guardan en MariaDB/MySQL; las fotos en `backend/uploads` o `UPLOAD_DIR`. No se guardan productos únicamente en localStorage. La foto se optimiza en el navegador a un máximo de 1200 px y se sube al backend; subirla y cancelar el formulario puede dejar un archivo sin asignar, que se conserva para no borrar fotos utilizadas.

Los cambios propios se reflejan al recibir confirmación del servidor. Otros usuarios se reflejan al recuperar el foco o mediante revisión cada minuto mientras la pestaña está visible. No es sincronización instantánea por WebSockets ni funcionamiento sin conexión.

## Primera comprobación

Sigue `docs/PRUEBAS.md`. Empieza por tus productos existentes: confirma sus nombres y existencias, asigna SKU, proveedor, costo y mínimos, y sube tus propias fotos.

Comprueba después:

```bash
# Desde la raíz del proyecto
npm.cmd test --prefix backend
npm.cmd run lint --prefix frontend
npm.cmd run build --prefix frontend
```

## Seguridad y configuración

Se mantiene tu JWT_SECRET existente. El registro público pasa a estar desactivado por defecto: tus usuarios actuales siguen entrando. Solo si necesitas crear un usuario local de prueba, añade temporalmente `ALLOW_REGISTRATION=true` al `.env` del backend y reinícialo; vuelve a `false` al terminar. El alta nunca asigna el rol Administrador.

Añade al `.gitignore` existente si aún no están:

```gitignore
**/node_modules/
**/.env
**/.env.local
frontend/dist/
backend/uploads/*
!backend/uploads/.gitignore
backend/tmp-test-uploads/
*.sql
```

Para un SQL de estructura que decidas publicar más adelante, utiliza una excepción explícita a `*.sql`; nunca incluyas usuarios, contraseñas o datos personales. El `.env.logistica.example` solo es referencia, no sustituye tu `.env`.

## Qué queda preparado y qué no

- El script de Telegram está implementado, **no activado ni probado con una cuenta real**. Lee `docs/TELEGRAM_Y_NUBE.md`.
- La API puede usar una base remota con TLS; aún no se ha contratado ni desplegado hosting. Fotos requieren almacenamiento persistente, no un disco temporal.
- No hay sincronización bidireccional automática entre dos bases. Local es desarrollo; nube será producción.
- Quedan para una fase posterior: órdenes de compra y recepciones parciales contra orden, reservas, múltiples almacenes, lotes/vencimientos/FEFO, devoluciones relacionadas, facturación, costo promedio/FIFO, aprobación de compras y analítica ABC completa. Se priorizó un flujo funcional y verificable antes de añadir pantallas sin respaldo real.
- Los listados históricos están limitados a 5.000 movimientos; el reporte advierte si llega al límite. Para mayores volúmenes corresponde agregar paginación y agregaciones de servidor.
- Esta entrega incluye documentación técnica. El informe académico del laboratorio 9 con tus capturas se completa después de validar la instalación en tu PC.

## Commit después de comprobar

```bash
cd /c/XAMPP/htdocs/inventario-fullstack
git status --short
git add frontend/src frontend/index.html frontend/package.json frontend/package-lock.json backend/index.js backend/config/db.js backend/models backend/controllers/authController.js backend/services backend/scripts backend/tests backend/package.json backend/package-lock.json backend/.env.logistica.example backend/uploads/.gitignore docs LEEME_PRIMERO.md
# Si editaste .gitignore, añádelo también:
git add .gitignore
git diff --cached --stat
git commit -m "Integra catalogo, proveedores, movimientos y temas en NEXO"
git push origin main
```

Revisa la lista antes del commit; no añadas respaldos, `.env` ni fotografías privadas. No se ha realizado ningún commit o despliegue desde esta entrega.
