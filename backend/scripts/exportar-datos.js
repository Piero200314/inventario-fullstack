require('../config/env');
const fs=require('node:fs/promises'),path=require('node:path');
const db=require('../config/db'),T=require('../services/transferencia');
async function main(){
  const args=process.argv.slice(2),i=args.indexOf('--archivo');
  if(i<0||!args[i+1])throw Error('Uso: node scripts/exportar-datos.js --archivo ../backups/nexo.json');
  const dest=path.resolve(args[i+1]);if(!dest.endsWith('.json'))throw Error('El archivo debe terminar en .json.');
  await db.authenticate();const data=await T.exportData();
  await fs.mkdir(path.dirname(dest),{recursive:true});
  await fs.writeFile(dest,JSON.stringify(data),{flag:'wx',mode:0o600});
  console.log('Respaldo creado. Contiene usuarios (hashes), datos y fotos. Mantenlo privado.');
  console.log(T.summaries(data));
}
main().catch(e=>{console.error(e.message);process.exitCode=1;}).finally(()=>db.close());
