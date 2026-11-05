require('../config/env');
const db=require('../config/db'),Images=require('../services/imagenes');
const {Detalle}=require('../models/Logistica');
async function main(){
  const apply=process.argv.includes('--aplicar');await db.authenticate();
  const names=[...new Set((await Detalle.findAll()).map(d=>d.foto?.slice(7)).filter(Boolean))];
  const rows=[];for(const name of names){const p=await Images.read(name);if(!p)throw Error('Falta foto '+name);rows.push({name,...p});}
  if(apply)await db.transaction(async t=>{for(const p of rows)await Images.save(p.name,p.buffer,t,true);});
  console.log((apply?'Fotos guardadas en la base: ':'VISTA PREVIA, sin escritura: ')+rows.length);
}
main().catch(e=>{console.error(e.message);process.exitCode=1;}).finally(()=>db.close());
