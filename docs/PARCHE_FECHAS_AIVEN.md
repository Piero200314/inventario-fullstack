# NEXO - Corrección de createdAt y respaldo local

Este parche se aplica sobre NEXO V4. Corrige el error de tablas antiguas sin createdAt/updatedAt. Añade esas columnas cuando faltan; si existían como created_at/updated_at, copia sus valores. Las fechas históricas desconocidas se conservan como NULL. Las fechas de movimientos siguen siendo obligatorias. No borra tablas ni usa force/alter de Sequelize.

Se probó con MariaDB y PostgreSQL reales: migración repetida, fechas originales conocidas y desconocidas, exportación e importación, hashes de usuario, fotos, stock, rollback por conflicto, identificadores y secuencias. No se ha ejecutado este parche en tu PC ni en tu servicio Aiven.

## Instalar

1. Detén el backend con Ctrl+C.
2. Conserva una copia de los archivos que vas a reemplazar. Copia la carpeta backend del ZIP sobre C:\laragon\www\inventario-fullstack\backend, fusionando carpetas y reemplazando solo los archivos incluidos. Tus .env y certs no se incluyen ni se cambian.
3. Confirma que existe backend/.env.antes-aiven, la copia que hiciste antes de cambiar a PostgreSQL.

## Crear el respaldo local

Enciende MySQL en Laragon. En Git Bash:

```bash
cd /c/laragon/www/inventario-fullstack/backend
node scripts/preparar-respaldo-local.js
```

El script lee .env.antes-aiven, exige host local, selecciona MySQL, aplica la compatibilidad e incorpora los saldos antiguos a logística si aún no se habían migrado. Después crea ../backups/nexo-aiven-corregido.json y muestra cantidades. Tu .env de Aiven permanece intacto. El comando no inicia la API local.

Esto respalda únicamente los datos de la base indicada por aquel perfil (en tu captura: apidb). Si tu inventario completo está en otra PC, ejecuta allí el respaldo con su configuración local. Un inventario guardado únicamente en XAMPP de otro equipo no aparecerá al exportar apidb de esta instalación.

El archivo contiene datos y hashes de contraseñas: mantenlo privado. Si ya existe, no se sobrescribe; utiliza --archivo ../backups/otro-nombre.json. Si faltan fotos, el script lo indica y se detiene: conserva/restaura los archivos de uploads correspondientes.

## Preparar Aiven e importar

Una vez creado el respaldo correcto, con la API detenida:

```bash
npm.cmd run db:check
npm.cmd run migrate
node scripts/importar-datos.js --archivo ../backups/nexo-aiven-corregido.json
```

El primer comando debe indicar postgres, y la vista previa del importador debe mostrar las cantidades esperadas. Para confirmar:

```bash
node scripts/importar-datos.js --archivo ../backups/nexo-aiven-corregido.json --aplicar
npm.cmd run dev
```

El destino debe estar vacío. No crees un administrador ni cargues DEMO antes de importar. Si hay filas, el importador rechaza la operación y no borra nada. No continúes después de un error: conserva el mensaje y el respaldo.

Los usuarios importados conservan sus contraseñas. Revisa catálogo, saldos, proveedores, historial y fotos antes de dar por concluido el traslado. Las columnas de fecha nuevas admiten NULL para los registros originales sin fechas; las altas nuevas registran su fecha normalmente.
