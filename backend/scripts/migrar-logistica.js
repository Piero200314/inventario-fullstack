process.env.NEXO_DB_DIRECT = '1';
require('../config/env');
const db = require("../config/db");
const {
  Producto,
  Detalle,
  Proveedor,
  Movimiento,
  Aviso,
} = require("../models/Logistica");
async function migrar() {
  await db.authenticate();
  // Create missing tables; never alter or drop existing tables.
  await Producto.sync();
  await require('../models/Usuario').sync();
  await require('../services/fechas-legacy')();
  await Proveedor.sync();
  await Detalle.sync();
  await Movimiento.sync();
  await Aviso.sync();
  await require('../models/Imagen').sync();
  for (const original of await Producto.findAll())
    await db.transaction(async (transaction) => {
      const p = await Producto.findByPk(original.id, {
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      const [d, created] = await Detalle.findOrCreate({
        where: { productoId: p.id },
        defaults: {
          sku: `LEGACY-${p.id}`,
          minimo: 5,
          objetivo: Math.max(20, Number(p.stock)),
        },
        transaction,
      });
      if (created)
        await Movimiento.create(
          {
            productoId: p.id,
            productoNombre: p.nombre,
            tipo: "apertura",
            cantidad: p.stock,
            antes: 0,
            despues: p.stock,
            motivo: "Saldo existente al activar logística",
            responsable: "Migración",
            clave: `migracion-apertura-${p.id}`,
          },
          { transaction },
        );
    });
  console.log("Migración completa. Productos y usuarios conservados.");
}
module.exports = migrar;
if (require.main === module)
  migrar()
    .catch((e) => {
      console.error(e.message);
      process.exitCode = 1;
    })
    .finally(() => db.close());
