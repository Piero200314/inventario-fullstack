// Run from backend. Preview is the default; --aplicar writes after a backup.
require('../config/env');
const fs = require('node:fs/promises');
const path = require('node:path');
const { randomUUID, createHash } = require('node:crypto');
const { spawnSync } = require('node:child_process');
const db = require('../config/db');
const Usuario = require('../models/Usuario');
const { Producto, Detalle, Movimiento } = require('../models/Logistica');
const Images = require('../services/imagenes');
const V = require('../services/validacion');
const Transfer = require('../services/transferencia');
const targets = ['LEGACY-4', 'LEGACY-5', 'LEGACY-6', 'LEGACY-7', 'LEGACY-8'];
const demoSkus = Array.from({ length: 20 }, (_, i) => `DEMO-${String(i + 1).padStart(3, '0')}`);
function importer(email, apply) {
  const args = [path.join(__dirname, 'importar-catalogo-demo.js'), '--email', email];
  if (apply) args.push('--aplicar');
  const child = spawnSync(process.execPath, args, { cwd: path.resolve(__dirname, '..'), env: process.env, stdio: 'inherit' });
  if (child.error || child.status !== 0) throw Error('El catalogo no pudo importarse. Los registros LEGACY no se archivaron.');
}
async function candidates(transaction, lock = false) {
  const rows = [];
  for (const sku of targets) {
    const initial = await Detalle.findOne({ where: { sku }, transaction });
    if (!initial) throw Error(`Falta ${sku}. Se cancela para no actuar sobre un inventario diferente.`);
    const options = { transaction };
    if (lock) options.lock = transaction.LOCK.UPDATE;
    const p = await Producto.findByPk(initial.productoId, options);
    const d = await Detalle.findByPk(initial.productoId, options);
    if (!p || d?.sku !== sku) throw Error(`Cambio inesperado en ${sku}. Se cancela.`);
    if (!Number.isInteger(p.stock) || p.stock < 0 || (!d.activo && p.stock !== 0)) throw Error(`Saldo inconsistente en ${sku}.`);
    rows.push({ p, d });
  }
  return rows;
}
async function main() {
  const args = process.argv.slice(2), allowed = new Set(['--email', '--aplicar']);
  const emailAt = args.indexOf('--email'), email = args[emailAt + 1];
  if (emailAt < 0 || !email || email.startsWith('--') || args.filter((x, i) => i !== emailAt + 1).some(x => !allowed.has(x))) throw Error('Uso: node scripts/preparar-catalogo-fotos.js --email tu-correo [--aplicar]');
  const apply = args.includes('--aplicar');
  if (db.getDialect() !== 'postgres') throw Error('Esta herramienta se preparo para la base PostgreSQL de Aiven. Revisa .env.');
  if (process.env.IMAGE_STORAGE !== 'database') throw Error('Configura IMAGE_STORAGE=database para guardar las fotos en Aiven.');
  if (process.env.NODE_ENV === 'production') throw Error('Catalogo de demostracion: no se ejecuta en produccion.');
  await db.authenticate();
  const user = await Usuario.findOne({ where: { email: email.trim().toLowerCase() } });
  if (!user || user.rol !== 'Administrador') throw Error('Indica el correo de un administrador existente.');
  const rows = await candidates();
  console.log('Solo se retiraran del catalogo estos cinco codigos:');
  console.table(rows.map(({ p, d }) => ({ sku: d.sku, nombre: p.nombre, stock: p.stock, accion: d.activo ? 'Ajustar a cero y archivar' : 'Ya archivado' })));
  importer(user.email, false);
  if (!apply) {
    console.log('VISTA PREVIA: no se guardaron cambios ni respaldo. Para continuar, repite con --aplicar.');
    return;
  }
  // This private snapshot includes users, password hashes and all current history.
  const backup = await Transfer.exportData();
  const dest = path.resolve(__dirname, '../../backups', `nexo-antes-catalogo-${Date.now()}-${randomUUID().slice(0, 8)}.json`);
  await fs.mkdir(path.dirname(dest), { recursive: true });
  await fs.writeFile(dest, JSON.stringify(backup, null, 2), { flag: 'wx', mode: 0o600 });
  console.log('Respaldo privado creado: ' + dest);
  // Import commits before retiring old products: a failed import leaves them visible.
  importer(user.email, true);
  const retired = await db.transaction(async transaction => {
    // Verify the twenty replacements and their database images before archiving.
    for (const sku of demoSkus) {
      const d = await Detalle.findOne({ where: { sku }, transaction });
      if (!d?.activo || !d.foto?.startsWith('/media/')) throw Error(`No esta listo ${sku}. Los LEGACY se conservan.`);
      const image = await Images.Imagen.findByPk(d.foto.slice(7), { transaction });
      if (!image) throw Error(`Falta la foto de ${sku}. Los LEGACY se conservan.`);
    }
    const locked = await candidates(transaction, true);
    let count = 0;
    for (const { p, d } of locked) {
      if (!d.activo) continue;
      if (p.stock > 0) {
        const v = V.movimiento({ productoId: p.id, tipo: 'ajuste', cantidad: -p.stock,
          motivo: 'Retiro de registro de prueba al cargar el catalogo DEMO con fotos',
          documento: 'LIMPIEZA-CATALOGO-DEMO', clave: 'limpieza-demo-' + randomUUID() });
        const huella = createHash('sha256').update(JSON.stringify(v)).digest('hex');
        await Movimiento.create({ ...v, productoNombre: p.nombre, antes: p.stock, despues: 0,
          costo: d.costo, precio: p.precio, usuarioId: user.id, responsable: user.nombre, huella }, { transaction });
        await p.update({ stock: 0 }, { transaction });
      }
      await d.update({ activo: false, revision: d.revision + 1 }, { transaction });
      count++;
    }
    return count;
  });
  const active = await Detalle.count({ where: { activo: true } });
  console.log(`LISTO: ${retired} registros de prueba archivados. Catalogo activo: ${active} productos.`);
  console.log('Usuarios y movimientos anteriores conservados. Abre NEXO y pulsa Sincronizar.');
}
main().catch(e => { console.error('No se completo la preparacion:', e.message); process.exitCode = 1; }).finally(() => db.close());
