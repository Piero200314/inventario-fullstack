# NEXO en Render con PostgreSQL de Aiven

**[Abrir NEXO en Render](https://inventario-fullstack-1.onrender.com)** · [Comprobar API](https://inventario-fullstack-1.onrender.com/api/health)

## Estado actual

El servicio `inventario-fullstack-1` está publicado. El despliegue inicial mostró **Deploy succeeded / Live** para el commit `9450a92`, correspondiente a la integración del [Pull Request #1](https://github.com/Piero200314/inventario-fullstack/pull/1) en `main`.

El 5 de noviembre de 2026 se verificaron HTTP 200 para la página principal y `/api/health`, conexión `postgres`, almacenamiento de imágenes `database` y HTTP 401 al consultar `/api/productos` sin token. Estas comprobaciones no sustituyen el recorrido autenticado de la sección 5.

## 1. Cómo funciona y cómo actualizarlo

Un solo **Web Service de Node** sirve la web React y la API Express. Los registros y las fotografías se conservan en PostgreSQL de Aiven. La aplicación funciona aunque la computadora de desarrollo esté apagada.

Este repositorio ya incluye la preparación de Render; no vuelvas a aplicar parches antiguos, crear otra base ni importar un respaldo completo sobre el Aiven poblado.

Para cambios nuevos, crea una rama desde `main` actualizado, revisa los archivos que vas a publicar y abre un Pull Request hacia `main`. Antes de cada commit ejecuta `node scripts/revisar-git.cjs` y revisa `git diff --cached`: el script comprueba rutas, no todo el contenido ni el historial.

`.env`, certificados y respaldos permanecen fuera de Git. Las credenciales del servicio se administran en **Environment** de Render. Si un secreto llegó a publicarse, retirarlo del último commit no lo elimina del historial: hay que cambiarlo.

## 2. Crear el servicio en Render

El servicio actual ya existe. La siguiente configuración permite revisar sus ajustes o reproducir el despliegue en otro servicio. Para uno nuevo, abre [Render Dashboard](https://dashboard.render.com), pulsa **New > Web Service**, conecta GitHub y selecciona `Piero200314/inventario-fullstack`.

| Campo | Valor |
|---|---|
| Name | `inventario-fullstack-1` en el servicio actual; un nombre disponible si creas otro |
| Language / Runtime | Node |
| Branch | `main`, con la actualización V5 integrada |
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

El servicio actual ya está **Live** en [https://inventario-fullstack-1.onrender.com](https://inventario-fullstack-1.onrender.com). Para un servicio nuevo, pulsa **Deploy web service** y espera a que el registro indique `NEXO listo` y el estado sea **Live**.

Comprueba primero `/api/health`: debe devolver `ok: true`, `database: postgres` e `imagenes: database`. Entra con tu cuenta actual; cambiar JWT_SECRET no cambia contraseñas, aunque obliga a iniciar sesión otra vez.

| Prueba | Resultado esperado |
|---|---|
| Catálogo | Productos y fotografías esperados según los datos actuales de Aiven; sin forzar una cantidad fija |
| Refrescar /productos y /resumen | Carga la aplicación y conserva sesión vigente |
| Modificar el precio de un producto de prueba | Cambio visible sin F5; persiste al recargar |
| Registrar una venta válida | Descuenta stock y actualiza estadísticas e historial |
| Retirar más que el stock | Error comprensible y ningún descuento |
| Otra ventana o dispositivo | Mismos datos después de Sincronizar |
| Reiniciar el servicio en Render | Productos, imágenes e historial siguen en Aiven |
| /api/productos sin token | 401; el catálogo HTML no da acceso a los datos sin autenticación |

Las pruebas contra esta misma base cambian también los datos que ves desde tu PC. Usa productos de prueba y comparte credenciales solo por privado con quienes hayas autorizado. Para pruebas que necesiten borrar datos o cargas intensivas, usa una base aislada.

El plan Free se suspende tras 15 minutos sin tráfico; al abrir el enlace puede tardar alrededor de un minuto en arrancar. Esto no borra los datos de Aiven. El disco de Render es temporal, por eso las fotos se guardan con IMAGE_STORAGE=database.

## 6. Próximas actualizaciones

El Pull Request inicial ya está integrado en `main`. Para cambios nuevos, utiliza otra rama y un nuevo Pull Request. Revisa en Render qué rama está configurada para desplegar y si Auto-Deploy está activado. Una actualización solo está publicada cuando su despliegue termina correctamente y se comprueba la versión pública.

Usa la tabla de la sección 5 para completar las pruebas autenticadas. Registra resultados reales, sin publicar tokens, contraseñas ni datos privados en capturas.

## Fuentes oficiales

- https://render.com/docs/deploy-node-express-app
- https://render.com/docs/web-services
- https://render.com/docs/configure-environment-variables
- https://render.com/docs/free
- https://render.com/docs/node-version

## Validación del parche

Compilación completa y lint del frontend; prueba en PostgreSQL real con navegación Chromium: login, fotos desde la base, venta, actualización del resumen, recarga de rutas React, autenticación de API, bloqueo de .env y ausencia de peticiones a localhost:3006 en la versión publicada. Esas pruebas corresponden al entorno local de producción. La publicación en Render y las tres comprobaciones públicas indicadas al comienzo de esta guía ya están confirmadas; el recorrido autenticado completo del sitio público sigue pendiente.

