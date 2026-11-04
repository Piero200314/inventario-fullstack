# Avisos externos, nube y respaldos

## Telegram: implementación opcional

El archivo `backend/scripts/avisar-stock.js` consulta la misma base de datos y envía alertas de productos agotados o bajo su mínimo. No necesitas mantener el navegador abierto, pero sí el equipo/servidor y el proceso que ejecuta el script.

1. Crea un bot con BotFather en Telegram y obtén su token.
2. Abre conversación con tu bot y pulsa Iniciar. Obtén el chat ID de destino mediante la API de Telegram; no publiques token ni chat ID en capturas o repositorios.
3. Añade **solo al backend/.env**:

```dotenv
TELEGRAM_BOT_TOKEN=tu_token_privado
TELEGRAM_CHAT_ID=tu_chat_id
```

4. Desde `backend`, previsualiza sin enviar mensajes ni cambiar el registro de avisos:

```bash
node scripts/avisar-stock.js --dry-run
```

5. Cuando quieras enviar los avisos reales, ejecuta:

```bash
node scripts/avisar-stock.js
```

6. Para automatizarlo, configura una tarea del sistema cada 15 minutos con directorio inicial `C:\XAMPP\htdocs\inventario-fullstack\backend`, programa `C:\Program Files\nodejs\node.exe` y argumento `scripts/avisar-stock.js`. Configura **no iniciar una nueva instancia si la anterior sigue ejecutándose**. Primero verifica una ejecución manual y revisa su resultado. No se ha creado esta tarea automáticamente.

Se vuelve a avisar después de 24 horas, si pasa de bajo a agotado, o después de recuperarse y caer de nuevo. Los avisos enviados se registran en MySQL. Un error no se marca como enviado y permite reintento. Existe una pequeña posibilidad de aviso duplicado si el proceso se detiene justo después de Telegram y antes de guardar el resultado; no se promete entrega exactamente una vez. No ejecutarlo en paralelo en varias máquinas.

**Estado:** código incluido; no se ha enviado ningún mensaje real ni verificado tu bot. Los avisos internos funcionan sin Telegram.

## Base local y base en la nube

Usa dos entornos separados:

- Desarrollo: XAMPP/MariaDB local, datos de prueba, API local.
- Producción: API pública HTTPS, una base central MySQL/MariaDB, almacenamiento de fotos persistente y respaldos.

No ejecutes sincronización en ambos sentidos entre dos bases sin diseñar conflictos y operaciones pendientes. Esta versión no trabaja sin conexión y no sincroniza automáticamente una base local con otra remota.

### Configuración preparada

En el backend del servidor configura `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASS`, `JWT_SECRET`, `FRONTEND_ORIGIN` y `PORT` como secretos/variables del hosting. Usa un usuario de base con permisos adecuados, no la cuenta root local. Para una conexión TLS:

```dotenv
DB_SSL=true
# Si el proveedor entrega una CA privada:
DB_SSL_CA_FILE=/ruta/segura/ca.pem
```

No desactives la validación de certificados para ocultar un error. La configuración concreta depende del proveedor. Ejecuta la migración de manera controlada y con respaldo, no en cada solicitud ni con `sync({alter:true})`.

Configura `UPLOAD_DIR` a un volumen persistente. Un disco temporal perdería fotografías al desplegar. Si se usan Cloudinary/S3 posteriormente, hay que reemplazar la ruta de subida y guardar identificadores del proveedor; esa integración no está implementada aquí.

Para el frontend en Vercel: raíz `frontend`, comando `npm run build`, salida `dist`, `VITE_API_URL=https://tu-api-publica` y rewrite de rutas a `/index.html`. Conserva el `vercel.json` que ya tengas. **Nunca uses localhost como API de una web publicada.** No publiques secretos JWT ni contraseñas con prefijo VITE_.

`TRUST_PROXY=1` existe solo para un despliegue con exactamente un proxy confiable; no lo actives indiscriminadamente. Revisa el esquema de red de tu hosting.

## Respaldo local

Con las escrituras de la aplicación detenidas, exporta SQL y copia la carpeta de fotos. El procedimiento inicial está en LEEME_PRIMERO.md. Conserva copias fuera de `htdocs`, privadas y en otro dispositivo o almacenamiento seguro. La nube no sustituye los respaldos.

Para verificar la copia, crea una base de **restauración separada**, importa el SQL allí y revisa conteos, productos, usuarios, movimientos y apertura de fotos. Nunca pruebes una restauración sobre la base en uso. Para ensayar con la aplicación, utiliza otra copia del backend y otro `.env`/puerto que apunte a esa base de prueba.

En producción deben acordarse frecuencia, retención, cifrado y prueba de restauración. Todavía no hay un servicio de copias programadas activado.

## Reversión de esta actualización

Detén ambas aplicaciones. Restaura los archivos de código desde el respaldo en una carpeta aparte y compara antes de sustituir. Las tablas originales no se borran durante la migración, pero después de usar la nueva versión el stock puede haber cambiado.

No restaures ciegamente el SQL anterior: eliminaría operaciones posteriores al respaldo. Si ya hubo movimientos reales, conserva primero otra copia completa y prepara una reversión que preserve esos movimientos. Evita volver a ejecutar el CRUD antiguo sobre una base con movimientos activos, porque modificaría stock sin registrar historial.
