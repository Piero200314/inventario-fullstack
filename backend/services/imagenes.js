const fs = require('node:fs/promises'), path = require('node:path');
const {createHash} = require('node:crypto');
const db = require('../config/db'), Imagen = require('../models/Imagen'), V = require('./validacion');
const directory = path.resolve(process.env.UPLOAD_DIR || path.join(__dirname,'../uploads'));
const mode = process.env.IMAGE_STORAGE || (db.getDialect() === 'postgres' ? 'database' : 'local');
if (!['database','local'].includes(mode)) throw Error('IMAGE_STORAGE debe ser database o local.');
const validName = n => typeof n === 'string' && /^[a-f0-9-]{16,74}\.(png|jpg|webp)$/.test(n) && n.length <= 80;
const hash = b => createHash('sha256').update(b).digest('hex');
function inspect(b) {
  if (!Buffer.isBuffer(b) || b.length < 16 || b.length > 3*1024*1024) V.fallo('Selecciona una imagen PNG, JPEG o WebP de hasta 3 MB.');
  if (b.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) return {ext:'png',mime:'image/png'};
  if (b[0] === 255 && b[1] === 216 && b[2] === 255) return {ext:'jpg',mime:'image/jpeg'};
  if (b.toString('ascii',0,4) === 'RIFF' && b.toString('ascii',8,12) === 'WEBP') return {ext:'webp',mime:'image/webp'};
  V.fallo('Formato de imagen no admitido.');
}
async function read(name,transaction) {
  if (!validName(name)) return null;
  const row = await Imagen.findByPk(name,{transaction});
  if (row) return {buffer:row.datos,mime:row.mime,sha256:row.sha256};
  try {const b=await fs.readFile(path.join(directory,name));return {buffer:b,...inspect(b),sha256:hash(b)};}
  catch(e) {if(e.code === 'ENOENT') return null;throw e;}
}
async function save(name,buffer,transaction,forceDatabase=false) {
  const info=inspect(buffer);
  if (!validName(name) || path.extname(name) !== '.'+info.ext) V.fallo('Nombre de foto inválido.');
  const digest=hash(buffer);
  if (mode === 'database' || forceDatabase) {
    const [row,created]=await Imagen.findOrCreate({where:{nombre:name},defaults:{mime:info.mime,sha256:digest,datos:buffer},transaction});
    if(row.sha256 !== digest) V.fallo('La foto existente tiene contenido distinto.',409);
    return {created,path:null};
  }
  await fs.mkdir(directory,{recursive:true});const target=path.join(directory,name);
  try {await fs.writeFile(target,buffer,{flag:'wx'});return {created:true,path:target};}
  catch(e) {if(e.code !== 'EEXIST') throw e;if(hash(await fs.readFile(target)) !== digest) V.fallo('La foto existente tiene contenido distinto.',409);return {created:false,path:target};}
}
module.exports={mode,directory,validName,inspect,hash,read,save,Imagen};
