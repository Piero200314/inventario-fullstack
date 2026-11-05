const fs = require('node:fs/promises');
const {Transaction} = require('sequelize');
const db = require('../config/db'), Usuario = require('../models/Usuario');
const {Producto,Proveedor,Detalle,Movimiento,Aviso} = require('../models/Logistica');
const Images = require('./imagenes');
const models = {usuarios:Usuario,productos:Producto,nexo_proveedores:Proveedor,nexo_detalles:Detalle,nexo_movimientos:Movimiento,nexo_avisos:Aviso};
async function exportData() {
  return db.transaction({isolationLevel:Transaction.ISOLATION_LEVELS.REPEATABLE_READ},async transaction => {
    const tables = {};
    for(const [name,Model] of Object.entries(models)) tables[name]=(await Model.findAll({transaction})).map(x=>x.get({plain:true}));
    const photos = new Map((await Images.Imagen.findAll({transaction})).map(x=>[x.nombre,{nombre:x.nombre,base64:x.datos.toString('base64'),sha256:x.sha256}]));
    for(const d of tables.nexo_detalles) if(d.foto) {
      const name=d.foto.replace(/^\/media\//,'');
      if(photos.has(name)) continue;
      const image=await Images.read(name,transaction);
      if(!image) throw Error('Falta la foto '+name+'. Exporta desde la PC que conserva backend/uploads.');
      photos.set(name,{nombre:name,base64:image.buffer.toString('base64'),sha256:Images.hash(image.buffer)});
    }
    return {format:'nexo-transfer',version:1,createdAt:new Date().toISOString(),source:db.getDialect(),tables,imagenes:[...photos.values()]};
  });
}
function summaries(data) {return {...Object.fromEntries(Object.entries(data.tables).map(([name,rows])=>[name,rows.length])),nexo_imagenes:data.imagenes.length};}
async function validate(data) {
  if(data?.format!=='nexo-transfer'||data.version!==1||!data.tables||!Array.isArray(data.imagenes)) throw Error('Formato de respaldo NEXO no válido. Usa exportar-datos.js.');
  const keys=Object.keys(data.tables);
  if(keys.length!==Object.keys(models).length||keys.some(k=>!models[k])) throw Error('El respaldo contiene tablas no admitidas o incompletas.');
  const ids={};
  for(const [name,Model] of Object.entries(models)) {
    const rows=data.tables[name];if(!Array.isArray(rows)||rows.length>100000) throw Error('Cantidad de filas inválida: '+name);
    ids[name]=new Set();const pk=Model.primaryKeyAttribute;
    for(const row of rows) {
      if(!row||Object.keys(row).some(k=>!Object.hasOwn(Model.rawAttributes,k))) throw Error('Columnas inválidas en '+name);
      if(!Number.isInteger(row[pk])||row[pk]<1||ids[name].has(row[pk])) throw Error('ID inválido o duplicado en '+name);
      ids[name].add(row[pk]);
      if(name==='usuarios'&&!/^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(row.password||'')) throw Error('El respaldo debe contener hashes bcrypt, no contraseñas en texto.');
      for (const field of ['createdAt','updatedAt']) {
        const unknown = ['usuarios','productos'].includes(name) && row[field] === null;
        if (!unknown && !Number.isFinite(Date.parse(row[field]))) throw Error('Fecha inválida en '+name);
      }
      await Model.build(row).validate({hooks:false});
    }
  }
  for(const row of [...data.tables.nexo_detalles,...data.tables.nexo_movimientos,...data.tables.nexo_avisos]) {
    if(!ids.productos.has(row.productoId)) throw Error('El respaldo referencia un producto inexistente.');
    if(row.proveedorId!=null&&!ids.nexo_proveedores.has(row.proveedorId)) throw Error('El respaldo referencia un proveedor inexistente.');
  }
  const names=new Set();
  for(const photo of data.imagenes) {
    if(!Images.validName(photo.nombre)||names.has(photo.nombre)||typeof photo.base64!=='string'||photo.base64.length>4*1024*1024) throw Error('Foto inválida o duplicada en el respaldo.');
    const b=Buffer.from(photo.base64,'base64');const info=Images.inspect(b);
    if(b.toString('base64')!==photo.base64||!photo.nombre.endsWith('.'+info.ext)||Images.hash(b)!==photo.sha256) throw Error('La foto no coincide con su huella.');
    names.add(photo.nombre);
  }
  for(const d of data.tables.nexo_detalles) if(d.foto&&(!d.foto.startsWith('/media/')||!names.has(d.foto.slice(7)))) throw Error('Falta una foto referenciada en el respaldo.');
  return data;
}
async function assertEmpty(transaction) {
  for(const Model of [...Object.values(models),Images.Imagen]) if(await Model.count({transaction})) throw Error('Destino con datos. La importación solo admite una base vacía; no borra ni mezcla registros.');
}
async function importData(data,apply=false) {
  await validate(data);await assertEmpty();
  if(!apply) return summaries(data);
  await db.transaction(async transaction => {
    // Lock table writes during the empty-database check and restore on Postgres.
    if(db.getDialect()==='postgres') await db.query('LOCK TABLE "usuarios","productos","nexo_proveedores","nexo_detalles","nexo_movimientos","nexo_avisos","nexo_imagenes" IN EXCLUSIVE MODE',{transaction});
    await assertEmpty(transaction);
    for(const [name,Model] of Object.entries(models)) {
      const rows=data.tables[name];
      // Raw, validated inserts preserve explicit NULL dates and existing bcrypt
      // hashes. Model.bulkCreate would fill unknown timestamps with today's date.
      for(let i=0;i<rows.length;i+=250) await db.getQueryInterface().bulkInsert(name,rows.slice(i,i+250),{transaction},Model.rawAttributes);
    }
    for(const p of data.imagenes) await Images.save(p.nombre,Buffer.from(p.base64,'base64'),transaction,true);
    if(db.getDialect()==='postgres') for(const [name,Model] of Object.entries(models)) if(Model.rawAttributes.id?.autoIncrement) {
      // Table names are fixed by the model list, never obtained from input.
      await db.query(`SELECT setval(pg_get_serial_sequence('${name}','id'), COALESCE((SELECT MAX(id) FROM "${name}"),1), EXISTS(SELECT 1 FROM "${name}"))`,{transaction});
    }
  });
  return summaries(data);
}
async function readFile(file) {
  const stat=await fs.stat(file);if(stat.size>200*1024*1024) throw Error('Respaldo demasiado grande: máximo 200 MB para esta herramienta.');
  return JSON.parse(await fs.readFile(file,'utf8'));
}
module.exports={exportData,importData,validate,summaries,readFile};
