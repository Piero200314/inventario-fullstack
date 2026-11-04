const { createHash } = require("node:crypto");
const db = require("../config/db");
const {
  Producto,
  Detalle,
  Proveedor,
  Movimiento,
} = require("../models/Logistica");
const V = require("./validacion");
async function proveedorExiste(id, transaction) {
  if (id && !(await Proveedor.findByPk(id, { transaction })))
    V.fallo("Proveedor inexistente.");
}
function plano(p) {
  const j = p.toJSON();
  const d = j.detalle;
  delete j.detalle;
  if (!d) return null;
  const { productoId, createdAt, updatedAt, ...meta } = d;
  return { ...j, ...meta };
}
async function lista(transaction) {
  return (
    await Producto.findAll({
      include: [
        {
          model: Detalle,
          as: "detalle",
          where: { activo: true },
          required: true,
        },
      ],
      order: [["id", "DESC"]],
      transaction,
    })
  ).map(plano);
}
async function uno(id, transaction) {
  return plano(
    await Producto.findByPk(id, {
      include: [{ model: Detalle, as: "detalle" }],
      transaction,
    }),
  );
}
async function crear(body, usuario) {
  const v = V.producto(body),
    stock = V.entero(body.stock, "Stock inicial");
  return db.transaction(async (transaction) => {
    await proveedorExiste(v.detalle.proveedorId, transaction);
    const p = await Producto.create({ ...v.base, stock }, { transaction });
    await Detalle.create({ ...v.detalle, productoId: p.id }, { transaction });
    const apertura = await Movimiento.create(
      {
        productoId: p.id,
        productoNombre: p.nombre,
        tipo: "apertura",
        cantidad: stock,
        antes: 0,
        despues: stock,
        costo: v.detalle.costo,
        precio: v.base.precio,
        motivo: "Alta de producto",
        usuarioId: usuario.id,
        responsable: usuario.nombre,
        clave: `alta-${p.id}`,
      },
      { transaction },
    );
    return { ...(await uno(p.id, transaction)), apertura };
  });
}
async function editar(id, body) {
  const v = V.producto(body);
  return db.transaction(async (transaction) => {
    const p = await Producto.findByPk(id, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!p) V.fallo("Producto no encontrado.", 404);
    const d = await Detalle.findByPk(id, { transaction });
    if (!d?.activo) V.fallo("Producto archivado o sin migrar.", 409);
    if (V.entero(body.revision, "Revisión") !== d.revision)
      V.fallo(
        "Otro usuario modificó este producto. Sincroniza y vuelve a abrirlo.",
        409,
      );
    if (body.stock !== undefined && Number(body.stock) !== p.stock)
      V.fallo("Cambia el stock desde Movimientos.");
    await proveedorExiste(v.detalle.proveedorId, transaction);
    await p.update(v.base, { transaction });
    await d.update({ ...v.detalle, revision: d.revision + 1 }, { transaction });
    return uno(id, transaction);
  });
}
async function registrar(body, usuario) {
  const v = V.movimiento(body);
  if (v.tipo === "ajuste" && usuario.rol !== "Administrador")
    V.fallo("Solo un administrador puede ajustar existencias.", 403);
  const huella = createHash("sha256").update(JSON.stringify(v)).digest("hex");
  return db.transaction(async (transaction) => {
    const p = await Producto.findByPk(v.productoId, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!p) V.fallo("Producto inexistente.", 404);
    const previo = await Movimiento.findOne({
      where: { clave: v.clave },
      transaction,
    });
    if (previo) {
      if (previo.huella !== huella || previo.usuarioId !== usuario.id)
        V.fallo("La clave ya pertenece a otra operación.", 409);
      return {
        producto: await uno(p.id, transaction),
        movimiento: previo,
        repetido: true,
      };
    }
    const d = await Detalle.findByPk(p.id, { transaction });
    if (!d?.activo) V.fallo("Producto archivado o sin migrar.", 409);
    await proveedorExiste(v.proveedorId, transaction);
    const supplier = v.proveedorId
      ? await Proveedor.findByPk(v.proveedorId, { transaction })
      : null;
    const delta = ["venta", "salida"].includes(v.tipo)
      ? -v.cantidad
      : v.cantidad;
    const despues = Number(p.stock) + delta;
    V.entero(despues, "Stock resultante");
    const m = await Movimiento.create(
      {
        ...v,
        productoNombre: p.nombre,
        cantidad: delta,
        antes: p.stock,
        despues,
        costo: d.costo,
        precio: p.precio,
        usuarioId: usuario.id,
        responsable: usuario.nombre,
        proveedorNombre: supplier?.empresa,
        huella,
      },
      { transaction },
    );
    await p.update({ stock: despues }, { transaction });
    await d.increment("revision", { transaction });
    return {
      producto: await uno(p.id, transaction),
      movimiento: m,
      repetido: false,
    };
  });
}
async function archivar(id, revision) {
  return db.transaction(async (transaction) => {
    const p = await Producto.findByPk(id, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!p) V.fallo("Producto inexistente.", 404);
    const d = await Detalle.findByPk(id, { transaction });
    if (!d) V.fallo("Ejecuta la migración.", 409);
    if (V.entero(revision, "Revisión") !== d.revision)
      V.fallo("Producto modificado. Sincroniza.", 409);
    if (p.stock !== 0)
      V.fallo("Solo puedes archivar productos sin existencias.");
    await d.update(
      { activo: false, revision: d.revision + 1 },
      { transaction },
    );
  });
}
module.exports = { lista, crear, editar, registrar, archivar };
