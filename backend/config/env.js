const path = require('node:path');
const chosen = process.env.NEXO_ENV_FILE;
const result = require('dotenv').config({path: chosen ? path.resolve(chosen) : path.join(__dirname, '..', '.env'), override: Boolean(chosen), quiet: true});
if (chosen && result.error) throw Error('No se pudo abrir NEXO_ENV_FILE. Comprueba la ruta.');
