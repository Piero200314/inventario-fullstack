# NEXO V5: acceso y primeros pasos

**[Abrir la demo en Render](https://inventario-fullstack-1.onrender.com)**

La aplicación está publicada en Render y utiliza PostgreSQL de Aiven para datos y fotografías. La actualización V5 ya se integró en `main` mediante el [Pull Request #1](https://github.com/Piero200314/inventario-fullstack/pull/1).

- Para probar la web, abre la demo y utiliza una cuenta autorizada. Las credenciales se comparten por privado; el registro público está desactivado.
- Para desarrollar desde otra PC, sigue [ACTUALIZAR_PC_PRINCIPAL.md](ACTUALIZAR_PC_PRINCIPAL.md).
- Para revisar o reproducir el despliegue, consulta [LEEME_RENDER.md](LEEME_RENDER.md).
- Para conocer lo comprobado y lo pendiente, lee [docs/CAMBIOS_V5.md](docs/CAMBIOS_V5.md).

El repositorio reúne frontend, backend, catálogo DEMO con 20 fotografías, galaxia y marcos animados, pruebas y documentación. No necesitas aplicar los paquetes anteriores por separado.

Conserva tus archivos privados y respalda cualquier inventario local antes de cambiar de conexión. Conectarse al mismo Aiven permite consultar sus registros; cambiar de conexión no copia ni mezcla automáticamente una base MySQL local.

La disponibilidad básica del sitio, la conexión PostgreSQL y el rechazo de consultas de productos sin token se comprobaron el 5 de noviembre de 2026. Falta completar el recorrido autenticado del despliegue público.

No publiques `.env`, certificados, respaldos, tokens ni contraseñas en GitHub.

