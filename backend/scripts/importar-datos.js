process.env.NEXO_DB_DIRECT='1';
require('../config/env');
const db=require('../config/db'),T=require('../services/transferencia');
async function main(){
  const args=process.argv.slice(2),i=args.indexOf('--archivo'),apply=args.includes('--aplicar');
  if(i<0||!args[i+1])throw Error('Uso: node scripts/importar-datos.js --archivo ../backups/nexo.json [--aplicar]');
  await db.authenticate();const data=await T.readFile(args[i+1]);
  console.log(await T.importData(data,apply));
  console.log(apply?'Importación confirmada. Identificadores, contraseñas, historial y fotos conservados.':'VISTA PREVIA: no se escribió ningún dato. Añade --aplicar para confirmar.');
}
main().catch(e=>{console.error(e.message);process.exitCode=1;}).finally(()=>db.close());
