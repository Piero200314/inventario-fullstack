const test = require("node:test"),
  assert = require("node:assert/strict");
const V = require("../services/validacion");
const base = {
  nombre: "Teclado",
  sku: "TEC-01",
  precio: "180.00",
  costo: "100.20",
  minimo: 5,
  objetivo: 20,
  plazoDias: 7,
};
test("importes: rechaza negativos, fracciones de centavo y coerciones", () => {
  for (const v of [-1, "", null, true, "1.999", "NaN"])
    assert.throws(() => V.dinero(v, "Precio"));
  assert.equal(V.dinero("0", "Precio"), 0);
  assert.equal(V.dinero("", "Costo", true), null);
});
test("stock: solo enteros no negativos dentro de MySQL INT", () => {
  for (const v of [-1, 1.5, 2147483648, "", true])
    assert.throws(() => V.entero(v, "Stock"));
  assert.equal(V.entero("0", "Stock"), 0);
});
test("objetivo >= mínimo, SKU obligatorio y fotos limitadas al servidor", () => {
  assert.equal(V.producto(base).detalle.sku, "TEC-01");
  assert.throws(() => V.producto({ ...base, objetivo: 2 }));
  assert.throws(() => V.producto({ ...base, sku: " " }));
  assert.throws(() => V.producto({ ...base, foto: "javascript:alert(1)" }));
  assert.throws(() =>
    V.producto({ ...base, foto: "https://external/image.svg" }),
  );
});
test("recepción requiere trazabilidad; ajuste firmado y salida positiva", () => {
  const b = {
    productoId: 1,
    tipo: "entrada",
    cantidad: 1,
    motivo: "Compra",
    clave: "12345678-abcdefgh",
  };
  assert.throws(() => V.movimiento(b));
  assert.equal(
    V.movimiento({ ...b, proveedorId: 1, entregadoPor: "Ana" }).cantidad,
    1,
  );
  assert.equal(
    V.movimiento({ ...b, tipo: "ajuste", cantidad: -2 }).cantidad,
    -2,
  );
  assert.throws(() => V.movimiento({ ...b, tipo: "venta", cantidad: -2 }));
  assert.throws(() => V.movimiento({ ...b, tipo: "ajuste", cantidad: 0 }));
});
test("analítica: valores, umbrales, ventas reales y CSV seguro", async () => {
  const { analytics, csv } =
    await import("../../frontend/src/services/analytics.js");
  const now = Date.now();
  const items = [
    {
      id: 1,
      stock: 10,
      precio: 180,
      costo: 100,
      minimo: 5,
      objetivo: 20,
      plazoDias: 7,
    },
    {
      id: 2,
      stock: 3,
      precio: 85,
      costo: null,
      minimo: 5,
      objetivo: 10,
      plazoDias: 7,
    },
    {
      id: 3,
      stock: 5,
      precio: 650,
      costo: 400,
      minimo: 5,
      objetivo: 20,
      plazoDias: 7,
    },
    {
      id: 4,
      stock: 0,
      precio: 120,
      costo: 80,
      minimo: 5,
      objetivo: 20,
      plazoDias: 7,
    },
  ];
  const moves = [
    {
      productoId: 1,
      tipo: "venta",
      cantidad: -30,
      precio: 180,
      createdAt: new Date(now).toISOString(),
    },
    {
      productoId: 1,
      tipo: "salida",
      cantidad: -100,
      createdAt: new Date(now).toISOString(),
    },
  ];
  const a = analytics(items, moves, now);
  assert.equal(a.units, 18);
  assert.equal(a.retail, 5305);
  assert.equal(a.cost, 3000);
  assert.equal(a.unknownCost, 1);
  assert.equal(a.low.length, 3);
  assert.equal(a.salesUnits, 30);
  assert.equal(a.recommendations[0].trigger, 12);
  assert.equal(a.recommendations[0].suggested, 10);
  assert.equal(a.recommendations[0].coverage, 10);
  assert.match(csv([["=SUM(A1)", "x;y"]]), /"'=SUM\(A1\)";"x;y"/);
});
