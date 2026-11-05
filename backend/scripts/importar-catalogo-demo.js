require('../config/env');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const db=require('../config/db'),Usuario=require('../models/Usuario');
const {Producto,Detalle,Proveedor,Movimiento}=require('../models/Logistica');
const V=require('../services/validacion'),Images=require('../services/imagenes');
const dir=path.resolve(__dirname,'../catalogo-demo');
function sha(b){return crypto.createHash('sha256').update(b).digest('hex');}
async function main(){
 const args=process.argv.slice(2),apply=args.includes('--aplicar');
 const index=args.indexOf('--email');const email=index>=0?args[index+1]:null;
 if(!email)throw Error('Uso: node scripts/importar-catalogo-demo.js --email tu-correo [--aplicar]');
 if(apply&&process.env.NODE_ENV==='production')throw Error('Catálogo de pruebas: importación desactivada en producción.');
 const data=JSON.parse(fs.readFileSync(path.join(dir,'catalogo.json'),'utf8'));
 if(data.version!==1||data.productos.length!==20)throw Error('Catálogo incompleto o de versión inesperada.');
 const seen=new Set(),prepared=data.productos.map(row=>{
  if(!/^DEMO-\d{3}$/.test(row.sku)||seen.has(row.sku))throw Error('SKU demo inválido o duplicado.');seen.add(row.sku);
  if(path.basename(row.imagen)!==row.imagen||!row.imagen.endsWith('.png'))throw Error('Ruta de imagen inválida.');
  const image=fs.readFileSync(path.join(dir,'imagenes',row.imagen));
  if(!image.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))throw Error('Imagen inválida: '+row.imagen);
  const filename=sha('nexo-demo-catalogo-v1:'+row.sku)+'.png';
  const validated=V.producto({...row,proveedorId:null,foto:'/media/'+filename});
  V.entero(row.stock,'Stock inicial');
  if(!Number.isInteger(row.proveedor)||!data.proveedores[row.proveedor])throw Error('Proveedor demo inválido.');
  return {row,image,filename,validated};
 });
 await db.authenticate();await Detalle.count();
 const user=await Usuario.findOne({where:{email:email.trim().toLowerCase()}});
 if(!user||user.rol!=='Administrador')throw Error('Indica el correo de un Administrador existente. No se crea ni cambia ningún usuario.');
 const pending=[];
 for(const p of prepared){const existing=await Detalle.findOne({where:{sku:p.row.sku}});console.log(`${existing?'OMITIR':'AÑADIR'} ${p.row.sku} · ${p.row.nombre} · stock ${p.row.stock}`);if(!existing)pending.push(p);}
 if(!apply){console.log(`VISTA PREVIA: ${pending.length} nuevos. No se modificó la base ni se copiaron fotos. Añade --aplicar para importar.`);return;}
 if(!pending.length){console.log('Nada que importar. Los códigos DEMO ya existen; no se sobrescribieron.');return;}
 const uploads=path.resolve(process.env.UPLOAD_DIR||path.join(__dirname,'../uploads'));fs.mkdirSync(uploads,{recursive:true});
 const copied=[];
 try{
  await db.transaction(async transaction=>{
   const suppliers=[];
   for(const s of data.proveedores){
    const valid=V.proveedor(s);let supplier=await Proveedor.findOne({where:{documento:s.documento},transaction});
    if(supplier&&supplier.empresa!==s.empresa)throw Error('El documento demo pertenece a otro proveedor. Importación cancelada.');
    if(!supplier)supplier=await Proveedor.create(valid,{transaction});suppliers.push(supplier);
   }
   for(const p of pending){
    const saved=await Images.save(p.filename,p.image,transaction);
    if(saved.created&&saved.path)copied.push(saved.path);
    const product=await Producto.create({...p.validated.base,stock:p.row.stock},{transaction});
    await Detalle.create({...p.validated.detalle,productoId:product.id,proveedorId:suppliers[p.row.proveedor].id},{transaction});
    await Movimiento.create({productoId:product.id,productoNombre:product.nombre,tipo:'apertura',cantidad:p.row.stock,antes:0,despues:p.row.stock,costo:p.row.costo,precio:p.row.precio,motivo:'Catálogo DEMO v1 · saldo inicial ficticio',usuarioId:user.id,responsable:user.nombre,clave:`demo-catalogo-v1-${p.row.sku}`},{transaction});
   }
  });
 }catch(e){for(const target of copied){try{fs.unlinkSync(target);}catch{}}throw e;}
 console.log(`Importación confirmada: ${pending.length} productos con foto. Datos anteriores conservados. Reinicia el backend y sincroniza la web.`);
}
main().catch(e=>{console.error('No se completó la importación:',e.message);process.exitCode=1;}).finally(()=>db.close());
