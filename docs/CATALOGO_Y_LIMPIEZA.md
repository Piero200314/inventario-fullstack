# NEXO: catalogo con fotos y retiro de los cinco registros de prueba

Copia la carpeta `backend` de este ZIP dentro de `C:\laragon\www\inventario-fullstack`.
Solo se añade `backend/scripts/preparar-catalogo-fotos.js`. No reemplaza .env ni contraseñas.
Requiere el proyecto V4 y el parche de fechas ya instalados, con la conexión a Aiven funcionando.

1. Detén el backend con Ctrl+C. No uses el sistema mientras se ejecuta la preparación.
2. En Git Bash:

```bash
cd /c/laragon/www/inventario-fullstack/backend
node scripts/preparar-catalogo-fotos.js --email piero@inventario.test
```

La vista previa muestra exactamente LEGACY-4, LEGACY-5, LEGACY-6, LEGACY-7 y LEGACY-8.
Si falta alguno, se cancela. No selecciona todos los productos ni todos los códigos LEGACY.

3. Para aplicar:

```bash
node scripts/preparar-catalogo-fotos.js --email piero@inventario.test --aplicar
npm.cmd run dev
```

4. En la web, pulsa Sincronizar.

## Resultado

- Respaldo privado nuevo en `backups/nexo-antes-catalogo-*.json`, antes de guardar cambios.
- Añade los 20 productos DEMO con sus fotografías y 3 proveedores ficticios.
- Omite los códigos DEMO ya existentes: no sobrescribe precios, fotos ni cantidades modificadas.
- Comprueba que estén activos los 20 productos DEMO y que existan sus imágenes en PostgreSQL.
- Retira los cinco registros indicados del catálogo activo: registra un ajuste a cero con responsable y motivo y después los archiva.
- Conserva usuarios, contraseñas y todo el historial anterior. Los ajustes no son ventas.
- No borra tablas ni productos de forma definitiva. Los archivados quedan fuera del catálogo, alertas y totales activos; su historial continúa en Movimientos.
- Si se partió de los cinco registros de la captura, quedarán 20 productos activos.

Este catálogo usa datos de ejemplo y cantidades iniciales. No recupera los cambios que quedaron en otra PC.
Si la importación falla, los registros antiguos no se archivan. Si falla el archivado, sus ajustes se revierten juntos; el catálogo DEMO ya importado se conserva y es posible repetir el comando.
Una segunda ejecución no duplica productos ni ajustes de los registros ya archivados.

El respaldo incluye hashes de contraseñas: consérvalo privado, fuera de GitHub. La restauración completa requiere una base vacía; no lo importes sobre Aiven ya poblado.
