# Actualizar la PC principal a NEXO V5

El ZIP reúne todos los archivos de código entregados. No ejecuta cambios en las bases por copiarlo y no incluye credenciales reales.

## 1. Conserva tu instalación

Detén frontend y backend con Ctrl+C. Haz una copia privada de tu carpeta actual del proyecto, fuera del repositorio. Conserva especialmente .git, backend/.env, frontend/.env si existe, backend/certs y backend/uploads.

Si esta PC tiene MySQL/MariaDB con registros propios, exporta esa base desde phpMyAdmin antes de modificarla. Guarda el SQL fuera de GitHub. Ese inventario puede ser diferente al de Aiven.

## 2. Copia el paquete

Extrae el ZIP. **Copia el contenido de la carpeta inventario-fullstack dentro de tu proyecto existente** y acepta reemplazar el código. No crees otra carpeta inventario-fullstack dentro de la primera ni borres el proyecto anterior. Copia también .gitignore y .node-version.

Tu ubicación puede ser C:\xampp\htdocs\inventario-fullstack o C:\laragon\www\inventario-fullstack, según esta PC. Abre Git Bash Here en la carpeta real del proyecto.

El paquete no trae .env reales ni certificados/uploads/backups privados, por lo que no los sustituye.

## 3. Instala dependencias

Desde la raíz del proyecto:

```bash
npm.cmd ci --prefix backend
npm.cmd ci --prefix frontend
```

Así también se instala @fontsource/inter y se evita el error de importación de la tipografía. Usa los package.json y package-lock.json incluidos.

## 4. Respalda el inventario local antes de conectar a Aiven

Solo si tu backend/.env todavía usa MySQL/MariaDB local, conserva su configuración y exporta mediante el código compatible. Desde la raíz:

```bash
cd backend
cp -n .env .env.local-antes-v5
node scripts/preparar-respaldo-local.js --perfil .env.local-antes-v5 --archivo ../backups/nexo-pc-principal-antes-v5.json
```

Requiere el servidor MySQL/MariaDB encendido y un perfil local válido. Primero añade columnas/tablas de compatibilidad y luego exporta datos e imágenes referenciadas de esta PC. No borra productos ni cambia tu .env activo; conserva también el SQL previo del paso 1.

Si el respaldo de salida ya existe, usa otro nombre. Si .env.local-antes-v5 ya existe, revisa privadamente que corresponda a esta instalación: cp -n no lo reemplaza. Si falta una foto, conserva uploads y resuelve esa imagen antes de seguir.

**No importes ese respaldo en Aiven ya poblado.** El importador completo exige una base vacía. Para sumar los registros locales exclusivos de esta PC se necesita una mezcla controlada, evitando duplicados e historia incoherente. El catálogo DEMO no recupera esos cambios reales.

## 5. Configura Aiven en esta PC

Si backend/.env ya conecta a Aiven, consérvalo y comprueba que su certificado exista aquí. Si sigue conectado a MySQL, cambia la conexión solo después de respaldar lo local.

Usa backend/.env.example como referencia, sin copiarlo encima de tu archivo privado sin respaldo. Configura:

- DB_DIALECT=postgres.
- DATABASE_URL con la URI vigente de tu consola Aiven; DIRECT_DATABASE_URL puede usar esa misma URI directa.
- DB_SSL=true y DB_SSL_CA_FILE=./certs/aiven-ca.pem.
- IMAGE_STORAGE=database.
- PORT=3006 y FRONTEND_ORIGIN=http://localhost:5173 para el desarrollo local.
- JWT_SECRET privado y JWT_EXPIRES_IN=1h; ALLOW_REGISTRATION=false.

Descarga el certificado CA de tu consola y guárdalo como backend/certs/aiven-ca.pem. No reutilices una contraseña antigua del chat si ya la cambiaste. No envíes .env ni claves por capturas.

Dentro de backend:

```bash
node scripts/configurar-seguridad.js
npm.cmd run db:check
```

La primera utilidad conserva JWT_SECRET si existe o lo genera si está vacío. La segunda debe indicar postgres. La base Aiven anterior ya tenía tablas y usuarios: no repitas importar-datos.js, crear-admin.js ni la limpieza de LEGACY automáticamente. Si aparecen tablas faltantes, verifica primero que elegiste el mismo servicio/base y ejecuta migrate solo cuando corresponda.

## 6. Arranca NEXO

Dentro de backend:

```bash
npm.cmd run dev
```

En otra terminal, dentro de frontend:

```bash
npm.cmd run dev
```

Abre http://localhost:5173. Si conservas un frontend/.env, VITE_API_URL debe ser http://localhost:3006, sin credenciales PostgreSQL. Si Vite usa otro puerto, actualiza FRONTEND_ORIGIN al origen real y reinicia la API.

Entra con las credenciales actuales de NEXO, que son distintas a las de Aiven. El ZIP no incluye contraseñas de login.

Revisa fotos, catálogo e historial. Al usar el mismo Aiven verás los datos compartidos. Si en la otra PC aplicaste el catálogo y la limpieza, deberían existir 20 productos activos; no borres ni inventes registros para hacer coincidir esa cantidad.

## 7. Herramientas opcionales

Para añadir los DEMO si faltan: `node scripts/importar-catalogo-demo.js --email TU_CORREO` muestra la vista previa; si corresponde, repite con --aplicar. Los SKU existentes no se sobrescriben.

preparar-catalogo-fotos.js solo retira LEGACY-4 a LEGACY-8, los cinco seleccionados de la otra PC. No lo uses para limpiar el inventario original de esta PC. Una importación de respaldo completa solo se aplica en una base vacía.

## 8. GitHub y Render

El último push mostrado fue rechazado por usar otra cuenta. No se confirmó una subida posterior ni un servicio Live. Puedes comprobar el estado real desde la raíz:

```bash
git remote -v
git status
git fetch origin
git branch -a
```

Conserva el repositorio; no uses push --force. Para preparar esta actualización sin tocar main:

```bash
git switch -c actualizacion-pc-principal-v5
git add .
node scripts/revisar-git.cjs
git diff --cached --stat
```

Si la revisión detecta rutas privadas ya rastreadas, retira exactamente esas rutas del índice con git rm --cached, sin borrar las copias locales; repite la revisión. No hagas commit con .env, respaldos ni certificados. Revisa también el contenido de los cambios.

Cuando esté correcto:

```bash
git commit -m "feat: consolidar NEXO con Aiven, catalogo y Render"
git push -u origin actualizacion-pc-principal-v5
```

En Render sigue LEEME_RENDER.md, seleccionando **actualizacion-pc-principal-v5**, la rama que acabas de subir. Root Directory vacío, Build Command `node backend/scripts/build-render.js` y Start Command `node backend/index.js`.

Las credenciales se configuran directamente en Render, el certificado en Secret Files, y los registros/fotos siguen en Aiven. Publicar el código no vuelve a importar ni sincronizar la base local.
