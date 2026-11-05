# NEXO en Render con PostgreSQL de Aiven

## Qué se publica

Un solo **Web Service de Node** sirve la web React y la API Express. La base de datos y las fotos siguen en el PostgreSQL de Aiven ya configurado. No crees otra base en Render ni repitas la importación del catálogo.

Los datos del código van a GitHub; los registros, las contraseñas de acceso, las fotos guardadas en PostgreSQL y los movimientos no se publican en el repositorio. Una vez desplegado, NEXO funciona aunque tu computadora esté apagada.

Este parche requiere el proyecto NEXO V4 con los parches de Aiven ya instalados. Copia su contenido en `C:\laragon\www\inventario-fullstack`. No modifica tu .env. Añade la configuración de Render y reemplaza backend/index.js y frontend/src/services/api.js.

## 1. Respaldo y rama para probar

En Git Bash:

```bash
cd /c/laragon/www/inventario-fullstack
node backend/scripts/exportar-datos.js --archivo backups/nexo-antes-render.json
git remote -v
git switch -c actualizacion-pc-principal-v5
git add .
node scripts/revisar-git.cjs
git diff --cached --stat
```

El origen debe ser tu repositorio `Piero200314/inventario-fullstack`. Si la rama ya existe usa `git switch actualizacion-pc-principal-v5`. Si el respaldo ya existe, elige otro nombre: no lo sobreescribas.

No hagas commit si la comprobación avisa de archivos privados. Por ejemplo, para un .env previamente rastreado:

```bash
git rm --cached --ignore-unmatch backend/.env frontend/.env backend/.env.antes-aiven
node scripts/revisar-git.cjs
```

Si muestra otros archivos, quita del índice exactamente esas rutas. El comando anterior conserva las copias locales. Si alguna credencial llegó a publicarse en un commit anterior, retirarla del último commit no la elimina del historial: cambia esa credencial.

Cuando la revisión termine correctamente:

```bash
git commit -m "feat: preparar NEXO para pruebas en Render con Aiven"
git push -u origin actualizacion-pc-principal-v5
```

La revisión detecta rutas privadas y generadas; revisa también el contenido que vas a publicar. Mantén respaldos y .env fuera de GitHub.

## 2. Crear el servicio en Render

Abre https://dashboard.render.com y entra con tu cuenta. Pulsa **New > Web Service**, conecta GitHub y selecciona `Piero200314/inventario-fullstack`.

| Campo | Valor |
|---|---|
| Name | nexo-inventario-pruebas, o un nombre disponible |
| Language / Runtime | Node |
| Branch | actualizacion-pc-principal-v5 |
| Root Directory | Déjalo vacío: se necesitan backend y frontend |
| Build Command | `node backend/scripts/build-render.js` |
| Start Command | `node backend/index.js` |
| Instance Type | Free para estas pruebas |
| Health Check Path | `/api/health` |

El build instala las dependencias de ambos proyectos y compila React. No ejecuta migraciones, no importa datos y no necesita conectarse a la base. No uses `npm run dev` ni nodemon en Render.

## 3. Variables de entorno del servicio

Añádelas en **Environment**. En los campos individuales se escriben los valores **sin comillas**.

| Key | Value |
|---|---|
| NODE_ENV | production |
| NODE_VERSION | 24.22.1 |
| SERVE_FRONTEND | true |
| TRUST_PROXY | 1 |
| DB_DIALECT | postgres |
| DATABASE_URL | La URI actual que funciona en tu backend/.env, con tu contraseña vigente |
| DB_SSL | true |
| DB_SSL_CA_FILE | /etc/secrets/aiven-ca.pem |
| IMAGE_STORAGE | database |
| JWT_SECRET | Una clave aleatoria privada de al menos 32 caracteres |
| JWT_EXPIRES_IN | 1h |
| ALLOW_REGISTRATION | false |

Para generar JWT_SECRET, ejecuta en tu terminal y copia el resultado únicamente a Render:

```bash
node -e "console.log(require('node:crypto').randomBytes(48).toString('hex'))"
```

No añadas PORT: Render lo proporciona. No añadas VITE_API_URL ni FRONTEND_ORIGIN para este despliegue en un solo servicio; la web usa su propio dominio y el backend toma RENDER_EXTERNAL_URL automáticamente. No pongas ninguna credencial en una variable que empiece por VITE_: esas variables se incorporan al código público del navegador.

DIRECT_DATABASE_URL no es necesaria para arrancar: no se ejecutan migraciones ni importaciones en Render.

## 4. Certificado de Aiven

En **Environment > Secret Files > Add Secret File**:

- Filename: `aiven-ca.pem`
- Contents: todo el contenido de tu archivo local `backend/certs/aiven-ca.pem`, incluyendo `-----BEGIN CERTIFICATE-----` y `-----END CERTIFICATE-----`.

No pegues aquí la URI ni una contraseña. No subas el .env como archivo del repositorio. Si creaste el servicio antes de añadir el certificado, añade el archivo y vuelve a desplegar.

## 5. Desplegar y comprobar

Pulsa **Create Web Service / Deploy**. Cuando el registro indique `NEXO listo` y el servicio esté **Live**, abre la URL HTTPS que Render le asigne. Esa es la URL para compartir: no localhost.

Comprueba primero `/api/health`: debe devolver `ok: true`, `database: postgres` e `imagenes: database`. Entra con tu cuenta actual; cambiar JWT_SECRET no cambia contraseñas, aunque obliga a iniciar sesión otra vez.

| Prueba | Resultado esperado |
|---|---|
| Catálogo | 20 productos activos si ya aplicaste la limpieza; fotografías visibles |
| Refrescar /productos y /resumen | Carga la aplicación y conserva sesión vigente |
| Modificar el precio de un producto de prueba | Cambio visible sin F5; persiste al recargar |
| Registrar una venta válida | Descuenta stock y actualiza estadísticas e historial |
| Retirar más que el stock | Error comprensible y ningún descuento |
| Otra ventana o dispositivo | Mismos datos después de Sincronizar |
| Reiniciar el servicio en Render | Productos, imágenes e historial siguen en Aiven |
| /api/productos sin token | 401; el catálogo HTML no da acceso a los datos sin autenticación |

Las pruebas contra esta misma base cambian también los datos que ves desde tu PC. Usa productos de prueba y comparte credenciales solo por privado con quienes hayas autorizado. Para pruebas que necesiten borrar datos o cargas intensivas, usa una base aislada.

El plan Free se suspende tras 15 minutos sin tráfico; al abrir el enlace puede tardar alrededor de un minuto en arrancar. Esto no borra los datos de Aiven. El disco de Render es temporal, por eso las fotos se guardan con IMAGE_STORAGE=database.

## 6. Después de las pruebas

La rama main permanece intacta durante las pruebas. Cuando confirmes el funcionamiento, crea un Pull Request de `actualizacion-pc-principal-v5` hacia `main`. Después de integrarlo, cambia la rama de despliegue en Render a main.

## Fuentes oficiales

- https://render.com/docs/deploy-node-express-app
- https://render.com/docs/web-services
- https://render.com/docs/configure-environment-variables
- https://render.com/docs/free
- https://render.com/docs/node-version

## Validación del parche

Compilación completa y lint del frontend; prueba en PostgreSQL real con navegación Chromium: login, fotos desde la base, venta, actualización del resumen, recarga de rutas React, autenticación de API, bloqueo de .env y ausencia de peticiones a localhost:3006 en la versión publicada. Esto es una validación local del modo de producción; el despliegue en tu cuenta Render todavía debe ejecutarse y comprobarse.
