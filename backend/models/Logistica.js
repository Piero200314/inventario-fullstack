const { DataTypes: D } = require("sequelize");
const db = require("../config/db");
const Producto = require("./Producto");
const opts = (tableName) => ({ tableName, timestamps: true });
const Proveedor = db.define(
  "Proveedor",
  {
    empresa: { type: D.STRING, allowNull: false },
    documento: D.STRING(40),
    contacto: D.STRING,
    telefono: D.STRING(40),
    email: D.STRING,
    direccion: D.STRING,
    notas: D.TEXT,
    revision: { type: D.INTEGER, allowNull: false, defaultValue: 0 },
  },
  opts("nexo_proveedores"),
);
const Detalle = db.define(
  "Detalle",
  {
    productoId: {
      type: D.INTEGER,
      primaryKey: true,
      references: { model: "productos", key: "id" },
    },
    sku: { type: D.STRING(80), unique: true, allowNull: false },
    categoria: D.STRING(80),
    marca: D.STRING(80),
    costo: { type: D.DECIMAL(10, 2), allowNull: true },
    ubicacion: D.STRING(100),
    foto: D.STRING,
    minimo: { type: D.INTEGER, allowNull: false, defaultValue: 5 },
    objetivo: { type: D.INTEGER, allowNull: false, defaultValue: 20 },
    plazoDias: { type: D.INTEGER, allowNull: false, defaultValue: 7 },
    proveedorId: {
      type: D.INTEGER,
      references: { model: "nexo_proveedores", key: "id" },
    },
    activo: { type: D.BOOLEAN, allowNull: false, defaultValue: true },
    revision: { type: D.INTEGER, allowNull: false, defaultValue: 0 },
  },
  opts("nexo_detalles"),
);
const Movimiento = db.define(
  "Movimiento",
  {
    productoId: {
      type: D.INTEGER,
      allowNull: false,
      references: { model: "productos", key: "id" },
    },
    productoNombre: D.STRING,
    tipo: {
      type: D.ENUM("apertura", "entrada", "venta", "salida", "ajuste"),
      allowNull: false,
    },
    cantidad: { type: D.INTEGER, allowNull: false },
    antes: { type: D.INTEGER, allowNull: false },
    despues: { type: D.INTEGER, allowNull: false },
    costo: D.DECIMAL(10, 2),
    precio: D.DECIMAL(10, 2),
    motivo: { type: D.STRING, allowNull: false },
    proveedorId: {
      type: D.INTEGER,
      references: { model: "nexo_proveedores", key: "id" },
    },
    proveedorNombre: D.STRING,
    entregadoPor: D.STRING,
    documento: D.STRING(100),
    usuarioId: D.INTEGER,
    responsable: D.STRING,
    clave: { type: D.STRING(80), unique: true, allowNull: false },
    huella: D.STRING(64),
  },
  {
    ...opts("nexo_movimientos"),
    indexes: [{ fields: ["productoId", "createdAt"] }],
  },
);
const Aviso = db.define(
  "Aviso",
  {
    productoId: {
      type: D.INTEGER,
      primaryKey: true,
      references: { model: "productos", key: "id" },
    },
    enviadoEn: D.DATE,
    estado: D.STRING(30),
  },
  opts("nexo_avisos"),
);
Producto.hasOne(Detalle, { foreignKey: "productoId", as: "detalle" });
module.exports = { Producto, Detalle, Proveedor, Movimiento, Aviso };
