# Neon, traslado de datos y uso desde otra PC

> **Documento histórico anterior a V5.** El despliegue actual utiliza PostgreSQL de Aiven y está [publicado en Render](https://inventario-fullstack-1.onrender.com). Consulta [la configuración actual](../LEEME_RENDER.md) y [el estado verificado](CAMBIOS_V5.md). Los pasos y pendientes de esta guía describen la entrega original; no repitas importaciones sobre una base poblada.


## 1. Qué cambia

El navegador se comunica con tu API Express. La API se conecta a PostgreSQL de Neon con TLS verificado. Las credenciales de la base permanecen en el backend, nunca en React. Se conserva la alternativa MariaDB local.

En esta entrega, Neon centraliza los registros y también las fotos del catálogo pequeño: se almacenan como BYTEA en `nexo_imagenes`, hasta 3 MB por foto recibida por la API, después de la optimización del frontend. Esto permite verlas desde otros backends sin copiar uploads en cada PC. Los datos binarios consumen almacenamiento de la base; para un catálogo grande conviene incorporar almacenamiento de objetos. No se contrató ni configuró otro servicio de imágenes.

Trabajar con una misma base cloud no crea una web pública. Puedes iniciar frontend y backend localmente en cada equipo, con la misma base Neon. Para dar acceso a otras personas mediante un enlace se deberá alojar también la API y el frontend. Vercel para el frontend por sí solo no publica la API local.

## 2. Extraer e instalar en el equipo nuevo

El ZIP contiene una carpeta `inventario-fullstack`. Extrae esa carpeta en un directorio elegido; por ejemplo `C:\proyectos\inventario-fullstack`. Si ya tienes un clon, conserva su carpeta .git y tus .env, respalda los cambios propios y copia el contenido del paquete sobre él, sin borrar carpetas de datos.

En Git Bash, ajusta la ruta a la que elegiste:

```bash
cd /c/proyectos/inventario-fullstack
node -v
npm.cmd -v
npm.cmd ci --prefix backend
npm.cmd ci --prefix frontend
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Ejecuta las dos últimas copias solo si no existen esos .env. Para Node se requiere >=22.12. En macOS/Linux utiliza npm en lugar de npm.cmd. No se distribuyen node_modules: npm ci los instala usando los lockfiles.

## 3. Preparar Neon

1. Entra en https://console.neon.tech y crea un proyecto para NEXO, o elige uno que hayas preparado para este inventario.
2. Abre **Connect** y selecciona la rama, base y rol correctos. Para trasladar datos utiliza una base vacía dedicada al proyecto.
3. Copia la cadena PostgreSQL con Connection pooling activado a DATABASE_URL. El servidor suele incluir `-pooler`.
4. Desactiva Connection pooling y copia la cadena directa a DIRECT_DATABASE_URL. Es para creación de esquema y restauración.
5. Conserva las URI en tu archivo backend/.env, entre comillas. Copia solo la URI: no pegues el prefijo psql ni las comillas simples de un comando de terminal. Si usas las cadenas que genera el panel no debes reconstruir ni reescribir manualmente la contraseña.

```dotenv
DB_DIALECT=postgres
DATABASE_URL="CADENA_POSTGRESQL_POOLED_DEL_PANEL"
DIRECT_DATABASE_URL="CADENA_POSTGRESQL_DIRECTA_DEL_PANEL"
DB_SSL=true
IMAGE_STORAGE=database
PORT=3006
FRONTEND_ORIGIN=http://localhost:5173
JWT_SECRET=
JWT_EXPIRES_IN=1h
ALLOW_REGISTRATION=false
```

Los textos CADENA... son marcadores: debes reemplazarlos. No me envíes las cadenas completas, porque contienen la contraseña de la base. El código analiza la URI por separado y usa validación del certificado TLS; no incorpora rejectUnauthorized:false para la nube. Para una CA particular puedes configurar DB_SSL_CA_FILE. Los secretos no deben ponerse en VITE_ ni subirse a GitHub.

Desde backend:

```bash
cd backend
node scripts/configurar-seguridad.js
npm.cmd run db:check
npm.cmd run migrate
```

Esperado: conexión PostgreSQL correcta y migración completa. La migración crea las tablas que falten; no usa force ni alter ni elimina tablas originales. Una base de datos local debe existir antes de crear sus tablas. No continúes importando hasta que ambos comandos terminen correctamente.

**Antes de crear un administrador o importar DEMO, elige la ruta A o B.**

## 4A. Conservar exactamente el inventario de la otra PC

El inventario vivo no se incluye en este ZIP porque está en tu MariaDB local anterior. Necesitas acceso a aquella PC o un respaldo suyo. El exportador incluido incorpora tablas y fotos en un único JSON privado; un SQL de MariaDB no se ejecuta directamente como si fuera PostgreSQL.

### En la PC anterior, que conserva los registros y backend/uploads

1. Conserva una copia de su proyecto, .env y uploads, y un respaldo SQL habitual si lo utilizas. Detén la API y cualquier importación, bot o tarea que escriba registros durante el traslado.
2. Copia el backend V4 sobre el anterior sin borrar su .env ni uploads y actualiza dependencias con npm.cmd ci.
3. Su backend/.env debe seguir señalando a MariaDB. Añade/ajusta DB_DIALECT=mysql, IMAGE_STORAGE=local; conserva host, puerto, DB_NAME, DB_USER y DB_PASS reales. DATABASE_URL y DIRECT_DATABASE_URL deben quedar vacíos si estaban configurados. No cambies los datos por los marcadores de Neon todavía.
4. Inicia MySQL/MariaDB de XAMPP. En backend ejecuta:

```bash
npm.cmd ci
npm.cmd run migrate
node scripts/exportar-datos.js --archivo ../backups/nexo-traslado.json
```

El exportador obtiene una instantánea consistente de las tablas e incluye las fotos referenciadas, incluso de productos archivados. Si falta una foto, se detiene: restaura ese archivo desde la PC que lo conserva. Si el archivo destino ya existe, no lo sobrescribe: usa otro nombre para un respaldo nuevo.

5. Traslada privadamente `backups/nexo-traslado.json` al equipo nuevo. Contiene nombres de usuario, hashes de contraseñas y datos comerciales: no lo adjuntes al video ni lo publiques en GitHub. La contraseña de Neon y JWT_SECRET no se exportan.

### En la PC nueva, ya configurada con Neon y tablas vacías

No crees usuarios ni cargues DEMO antes de importar. Mantén detenida la API mientras restauras. Coloca el JSON en la carpeta backups del proyecto. Dentro de backend:

```bash
node scripts/importar-datos.js --archivo ../backups/nexo-traslado.json
```

Sin --aplicar solo valida, muestra cantidades y comprueba que el destino esté vacío. No escribe datos. Si todo es correcto:

```bash
node scripts/importar-datos.js --archivo ../backups/nexo-traslado.json --aplicar
```

La restauración se realiza en una transacción y conserva IDs, hashes bcrypt sin volver a cifrarlos, fechas, proveedores, detalles, usuarios, historial, avisos y fotos; ajusta las secuencias de PostgreSQL para las siguientes altas. Si el destino ya tiene filas, rechaza la operación. No tiene opción de borrar o mezclar automáticamente. Ante un error se revierte la restauración, aunque el esquema creado previamente permanece.

Después, inicia la API y accede con tu correo y contraseña existentes. Verifica cantidades, saldos, historial y fotografías antes de dejar de utilizar la instalación anterior. Mantén aquel respaldo.

Si solo conservas un dump SQL de MariaDB, restaúralo primero en MariaDB y utiliza este exportador, o solicita un procedimiento específico para ese dump; no lo importes a Neon a ciegas.

## 4B. Empezar con datos nuevos y catálogo DEMO

Utiliza esta ruta solo si quieres un inventario nuevo. Dentro de backend, después de migrate:

```bash
npm.cmd run admin:create
```

La utilidad solicita nombre, correo y contraseña; la contraseña no se muestra ni se recibe como argumento. Si Git Bash indica que no es una terminal interactiva, abre PowerShell en backend y ejecuta `node scripts/crear-admin.js`, o utiliza `winpty node scripts/crear-admin.js` desde Git Bash. No existe una contraseña administrativa predeterminada en el paquete.

Para añadir los 20 productos ficticios, reemplaza el correo por el de ese administrador:

```bash
node scripts/importar-catalogo-demo.js --email TU_CORREO
node scripts/importar-catalogo-demo.js --email TU_CORREO --aplicar
```

El primer comando es vista previa. El segundo guarda productos, proveedores, aperturas y fotos; omite SKU DEMO existentes y no sobrescribe sus saldos. Las imágenes incluidas son ilustraciones de prueba. La carga DEMO está bloqueada con NODE_ENV=production.

## 5. Iniciar y probar

Abre una terminal en backend:

```bash
npm.cmd run dev
```

Otra terminal en frontend:

```bash
npm.cmd run dev
```

Abre la dirección que muestre Vite. El frontend/.env contiene `VITE_API_URL=http://localhost:3006`. El diagnóstico `http://localhost:3006/api/health` debe responder ok:true, database:postgres e imagenes:database. No muestra URI ni claves.

En otro dispositivo instala el mismo código, configura su backend con la misma rama/base Neon y ejecútalo allí. Inicia sesión de nuevo. Para una comprobación:

1. Crea un producto de prueba en el equipo A, con una foto.
2. En el equipo B pulsa Sincronizar: deben aparecer sus datos y la misma imagen.
3. Registra una recepción en A. Sincroniza B y compara el saldo y el historial.
4. Recarga B y reinicia su backend: deben conservarse los datos y la fotografía.

Las mutaciones del propio usuario actualizan React al recibir la respuesta del servidor. En otros equipos usa Sincronizar; también se consulta al volver a la ventana si han pasado más de 30 segundos y periódicamente cada 60 segundos mientras está visible. No son WebSockets ni actualización instantánea entre dispositivos.

La galaxia, los marcos rojos, menú activo y logo neón funcionan en los dos temas. El control visible de pausa detiene los efectos. La elección de tema y de pausa es local a cada navegador.

## 6. Alternativa local

Para MariaDB, copia .env.mysql.example como .env solo en una instalación nueva, completa el puerto y las credenciales de tu servidor y crea la base inventario_nexo si no existe:

```sql
CREATE DATABASE IF NOT EXISTS inventario_nexo CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Después ejecuta configurar-seguridad, migrate y la ruta A/B según corresponda. Si ya tienes un .env real, edítalo conservando su contenido. Para PostgreSQL local se admite DATABASE_URL PostgreSQL con sslmode=disable únicamente para localhost/127.0.0.1. Cambiar el .env selecciona otra base: no copia ni fusiona datos.

Opcionalmente puedes mantener un perfil `backend/.env.local` y otro `backend/.env.neon`; el arranque puede elegirlos con `NEXO_ENV_FILE=.env.neon node index.js`, ejecutado desde backend. El perfil explícito tiene prioridad sobre variables existentes. No distribuyas estos perfiles.

## 7. Respaldo y errores frecuentes

- **Destino con datos:** no borres la base para superar el mensaje. Usa una base dedicada vacía para restaurar o continúa trabajando con los datos que ya hay. Esta herramienta no hace merges.
- **Foto no encontrada:** exporta desde la PC que tiene uploads. En una base ya poblada cuyas fotos locales sí conservas, `node scripts/subir-fotos-db.js` muestra la vista previa y `--aplicar` las incorpora a la tabla de imágenes.
- **Error de conexión:** revisa la URI completa del panel, contraseña vigente, acceso a Internet, rama y base. Para migrate e importación usa la URI directa. No desactives TLS para Neon.
- **CORS:** FRONTEND_ORIGIN debe coincidir con el origen exacto de Vite. Reinicia el backend después de modificarlo y reinicia Vite después de modificar VITE_API_URL.
- **Backend/DB no accesible:** no existe un fallback que escriba silenciosamente en otra base. React muestra el error y, si estaba cargado, el último estado de esa sesión; no proporciona operaciones offline.
- **Límite del exportador:** 200 MB de JSON por archivo en esta utilidad para el proyecto. Para volúmenes superiores utiliza un proceso de migración por lotes y respaldo propio de PostgreSQL. Mantén respaldos independientes: tener un servidor cloud no sustituye probar una restauración.

Fuentes técnicas consultadas: https://neon.com/docs/guides/sequelize ; https://neon.com/docs/connect/connect-from-any-app ; https://sequelize.org/docs/v6/other-topics/dialect-specific-things/ ; https://node-postgres.com/features/ssl .

