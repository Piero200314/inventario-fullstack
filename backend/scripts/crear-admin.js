require('../config/env');
const {Writable}=require('node:stream');
const readline=require('node:readline/promises');
const db=require('../config/db'),Usuario=require('../models/Usuario');
async function main(){
  await db.authenticate();
  if(await Usuario.count())throw Error('Ya existen usuarios. Conserva la cuenta importada o usa hacer-admin.js para una cuenta existente.');
  if(!process.stdin.isTTY)throw Error('Ejecuta esta utilidad en una terminal interactiva; no recibe contraseñas por argumentos.');
  const output=new Writable({write(chunk,enc,cb){if(!output.muted)process.stdout.write(chunk);cb();}});
  const rl=readline.createInterface({input:process.stdin,output,terminal:true});
  try{
    const nombre=(await rl.question('Nombre: ')).trim(),email=(await rl.question('Correo: ')).trim().toLowerCase();
    process.stdout.write('Contraseña (no se muestra): ');output.muted=true;
    const password=await rl.question('');output.muted=false;process.stdout.write('\n');
    if(!nombre||nombre.length>255||!/^\S+@\S+\.\S+$/.test(email)||email.length>255||password.length<10||Buffer.byteLength(password)>72)throw Error('Revisa nombre, correo y contraseña (10 caracteres como mínimo y 72 bytes como máximo).');
    await Usuario.create({nombre,email,password,rol:'Administrador'});console.log('Administrador creado. Inicia sesión con el correo y contraseña que elegiste.');
  }finally{output.muted=false;rl.close();}
}
main().catch(e=>{console.error(e.message);process.exitCode=1;}).finally(()=>db.close());
