const fs = require('node:fs/promises'), path = require('node:path');
const args = process.argv.slice(2);
function arg(name, fallback) {const i=args.indexOf(name);if(i<0)return fallback;if(!args[i+1]||args[i+1].startsWith('--'))throw Error('Falta el valor de '+name);return args[i+1];}
process.env.NEXO_ENV_FILE = path.resolve(arg('--perfil',path.join(__dirname,'../.env.antes-aiven')));
require('../config/env');
if (!['localhost','127.0.0.1'].includes(process.env.DB_HOST) || !process.env.DB_NAME)
  throw Error('El perfil debe ser la configuración original de MySQL local. No se ejecutará contra la nube.');
process.env.DB_DIALECT='mysql';process.env.DATABASE_URL='';process.env.DIRECT_DATABASE_URL='';
process.env.DB_SSL='false';delete process.env.DB_SSL_CA_FILE;process.env.IMAGE_STORAGE='local';
const db=require('../config/db'),T=require('../services/transferencia');
async function main(){
  const dest=path.resolve(arg('--archivo',path.join(__dirname,'../../backups/nexo-aiven-corregido.json')));
  if(!dest.endsWith('.json'))throw Error('El respaldo debe terminar en .json.');
  try {await fs.access(dest);throw Error('El archivo ya existe. Conserva ese respaldo o elige otro con --archivo.');}
  catch(e){if(e.code!=='ENOENT')throw e;}
  console.log('Origen: MySQL local, base '+process.env.DB_NAME+'. Configuración cloud conservada.');
  await require('./migrar-logistica')();
  const data=await T.exportData(),json=JSON.stringify(data);
  if(Buffer.byteLength(json)>200*1024*1024)throw Error('El respaldo supera los 200 MB admitidos por esta herramienta.');
  await fs.mkdir(path.dirname(dest),{recursive:true});await fs.writeFile(dest,json,{flag:'wx',mode:0o600});
  console.log('Respaldo creado: '+dest);console.log(T.summaries(data));
}
main().catch(e=>{console.error(e.message);process.exitCode=1;}).finally(()=>db.close());
