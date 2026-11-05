require('../config/env');
const db=require('../config/db');
(async()=>{await db.authenticate();console.log('Conexión correcta: '+db.getDialect()+'. No se muestran credenciales.');})().catch(e=>{console.error('No se pudo conectar: '+e.name+'. Revisa .env, conexión a Internet y TLS.');process.exitCode=1;}).finally(()=>db.close());
