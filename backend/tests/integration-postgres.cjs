// Disposable local PostgreSQL only; this test never uses a Neon URL or an existing database.
const assert=require('node:assert/strict'),{randomUUID}=require('node:crypto');
const u=new URL(process.env.NEXO_TEST_PG_URL || 'postgresql://nobody@127.0.0.1:55432/postgres?sslmode=disable');
if(!['127.0.0.1','localhost'].includes(u.hostname))throw Error('NEXO_TEST_PG_URL debe apuntar a PostgreSQL local de pruebas.');
const testName='nexo_test_'+Date.now();
delete process.env.NEXO_ENV_FILE;
async function main(){
 const {Client}=require('pg');const connection=new Client({connectionString:u.toString()});await connection.connect();
 await connection.query('CREATE DATABASE "'+testName+'"');
 u.pathname='/'+testName;
 process.env.DB_DIALECT='postgres';process.env.DATABASE_URL=u.toString();process.env.DIRECT_DATABASE_URL='';process.env.DB_SSL='false';process.env.IMAGE_STORAGE='database';
  process.env.DB_NAME = testName;
  process.env.JWT_SECRET = randomUUID() + randomUUID();
  process.env.ALLOW_REGISTRATION = "false";
  process.env.UPLOAD_DIR =
    process.env.NEXO_TEST_UPLOAD_DIR ||
    require("node:path").resolve("tmp-test-uploads");
  const db = require("../config/db"),
    Producto = require("../models/Producto"),
    Usuario = require("../models/Usuario");
  let server;
  try {
    await Producto.sync();
    await Usuario.sync();
    const user = await Usuario.create({
      nombre: "QA Admin",
      email: "qa@example.test",
      password: "Test-only-password-2026",
      rol: "Administrador",
    });
    await Usuario.create({
      nombre: "QA Almacenero",
      email: "worker@example.test",
      password: "Test-only-password-2026",
      rol: "Almacenero",
    });
    const old = await Producto.create({
      nombre: "Producto anterior",
      precio: 25.9,
      stock: 10,
    });
    const migrate = require("../scripts/migrar-logistica");
    await migrate();
    await migrate();
    const { Detalle, Movimiento } = require("../models/Logistica");
    assert.equal(await Producto.count(), 1);
    assert.equal(await Detalle.count(), 1);
    assert.equal(await Movimiento.count(), 1);
    assert.equal((await Producto.findByPk(old.id)).stock, 10);
    const app = require("../index");
    server = app.listen(0, "127.0.0.1");
    await new Promise((r) => server.once("listening", r));
    const base = "http://127.0.0.1:" + server.address().port;
    let token = "";
    async function call(path, method = "GET", body, override) {
      const res = await fetch(base + path, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...(override === null
            ? {}
            : { Authorization: "Bearer " + (override || token) }),
        },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
      return { status: res.status, data: await res.json() };
    }
    assert.equal(
      (await call("/productos", "GET", undefined, null)).status,
      401,
    );
    assert.equal(
      (await call("/api/auth/registro", "POST", { nombre: "X" }, null)).status,
      403,
    );
    const login = await call(
      "/api/auth/login",
      "POST",
      { email: "qa@example.test", password: "Test-only-password-2026" },
      null,
    );
    assert.equal(login.status, 200);
    token = login.data.token;
    const worker = (
      await call(
        "/api/auth/login",
        "POST",
        { email: "worker@example.test", password: "Test-only-password-2026" },
        null,
      )
    ).data.token;
    const supplier = await call("/api/proveedores", "POST", {
      empresa: "Distribuidora QA",
      contacto: "María",
      telefono: "999000000",
    });
    assert.equal(supplier.status, 201);
    assert.equal(
      (
        await call(
          "/api/proveedores",
          "POST",
          { empresa: "No autorizado" },
          worker,
        )
      ).status,
      403,
    );
    const body = {
      nombre: "Prueba nueva",
      descripcion: "Transacciones",
      precio: "180.00",
      stock: 5,
      sku: "QA-001",
      minimo: 5,
      objetivo: 20,
      plazoDias: 7,
      costo: 100,
      proveedorId: supplier.data.id,
    };
    const created = await call("/productos", "POST", body);
    assert.equal(created.status, 201, JSON.stringify(created));
    let p = created.data;
    assert.equal((await call("/productos", "POST", body)).status, 409);
    assert.equal(await Producto.count(), 2);
    const edited = await call("/productos/" + p.id, "PUT", {
      ...p,
      nombre: "Edición QA",
    });
    assert.equal(edited.status, 200);
    assert.equal(
      (
        await call("/productos/" + p.id, "PUT", {
          ...p,
          nombre: "Edición obsoleta",
        })
      ).status,
      409,
    );
    p = edited.data;
    assert.equal(
      (await call("/productos/" + p.id, "PUT", { ...p, stock: 99 })).status,
      400,
    );
    const receipt = {
      productoId: p.id,
      tipo: "entrada",
      cantidad: 5,
      motivo: "Compra QA",
      proveedorId: supplier.data.id,
      entregadoPor: "Repartidor QA",
      documento: "GUIA-QA",
      clave: randomUUID(),
    };
    const received = await call("/api/movimientos", "POST", receipt);
    assert.equal(received.status, 201);
    assert.equal(received.data.producto.stock, 10);
    assert.equal(received.data.movimiento.responsable, "QA Admin");
    assert.equal(received.data.movimiento.proveedorNombre, "Distribuidora QA");
    const again = await call("/api/movimientos", "POST", receipt);
    assert.equal(again.status, 200);
    assert.equal(again.data.producto.stock, 10);
    assert.equal(again.data.repetido, true);
    assert.equal(
      (await call("/api/movimientos", "POST", { ...receipt, cantidad: 2 }))
        .status,
      409,
    );
    assert.equal(
      (
        await call(
          "/api/movimientos",
          "POST",
          {
            productoId: p.id,
            tipo: "ajuste",
            cantidad: -1,
            motivo: "X",
            clave: randomUUID(),
          },
          worker,
        )
      ).status,
      403,
    );
    const sale = () => ({
      productoId: p.id,
      tipo: "venta",
      cantidad: 7,
      motivo: "Concurrencia",
      clave: randomUUID(),
    });
    const results = await Promise.all([
      call("/api/movimientos", "POST", sale()),
      call("/api/movimientos", "POST", sale()),
    ]);
    assert.deepEqual(results.map((r) => r.status).sort(), [201, 400]);
    assert.equal((await Producto.findByPk(p.id)).stock, 3);
    const dup = {
      productoId: p.id,
      tipo: "venta",
      cantidad: 1,
      motivo: "Reintento concurrente",
      clave: randomUUID(),
    };
    const duplicates = await Promise.all([
      call("/api/movimientos", "POST", dup),
      call("/api/movimientos", "POST", dup),
    ]);
    assert.deepEqual(duplicates.map((r) => r.status).sort(), [200, 201]);
    assert.equal((await Producto.findByPk(p.id)).stock, 2);
    const listed = await call("/productos");
    p = listed.data.find((x) => x.id === p.id);
    assert.equal(
      (await call("/productos/" + p.id, "DELETE", { revision: p.revision }))
        .status,
      400,
    );
    const adjust = await call("/api/movimientos", "POST", {
      productoId: p.id,
      tipo: "ajuste",
      cantidad: -2,
      motivo: "Conteo QA",
      clave: randomUUID(),
    });
    assert.equal(adjust.status, 201);
    p = adjust.data.producto;
    const png = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a4YQAAAAASUVORK5CYII=",
      "base64",
    );
    const upload = await fetch(base + "/api/imagenes", {
      method: "POST",
      headers: {
        "Content-Type": "image/png",
        Authorization: "Bearer " + token,
      },
      body: png,
    });
    assert.equal(upload.status, 201);
    const photo = await upload.json();
    assert.equal((await fetch(base + photo.foto)).status, 200);
    const invalid = await fetch(base + "/api/imagenes", {
      method: "POST",
      headers: {
        "Content-Type": "image/png",
        Authorization: "Bearer " + token,
      },
      body: "<svg>not-an-image</svg>",
    });
    assert.equal(invalid.status, 400);
    assert.equal(
      (await call("/productos/" + p.id, "DELETE", { revision: p.revision }))
        .status,
      200,
    );
    assert.equal((await call("/productos")).data.length, 1);
    assert.ok(
      (await call("/api/movimientos")).data.some((m) => m.productoId === p.id),
    );
    assert.equal((await Producto.findByPk(p.id)).stock, 0);
    console.log(
      "PASS PostgreSQL: migración repetible sin pérdida; JWT y roles; SKU único; edición concurrente; bloqueo de stock directo; recepción trazable; idempotencia; salidas concurrentes sin negativos; carga de imagen; archivo sin borrar historial.",
    );
  } finally {
    if (server) await new Promise((r) => server.close(r));
    await db.close();
    await connection.query('DROP DATABASE "'+testName+'"');
    await connection.end();
  }
}
main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
