require('./config/env');
const express = require("express"),
  cors = require("cors"),
  helmet = require("helmet");
const { rateLimit } = require("express-rate-limit");
const { randomUUID } = require("node:crypto");
const db = require("./config/db"),
  auth = require("./middleware/authMiddleware");
const { Proveedor, Movimiento, Detalle } = require("./models/Logistica");
require("./models/Usuario");
const L = require("./services/logistica"),
  V = require("./services/validacion");
const images = require("./services/imagenes");
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32)
  throw Error("Configura JWT_SECRET con scripts/configurar-seguridad.js");
const app = express();
app.disable("x-powered-by");
if (process.env.TRUST_PROXY === "1") app.set("trust proxy", 1);
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(
  cors({
    origin: process.env.FRONTEND_ORIGIN || process.env.RENDER_EXTERNAL_URL || "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 600,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: { error: "Demasiadas peticiones. Espera unos minutos." },
  }),
);
require('./services/frontend')(app);
const access = auth(["Administrador", "Almacenero"]),
  admin = auth(["Administrador"]);
const wrap = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res)).catch(next);
app.get('/media/:nombre', wrap(async(req,res) => {
  const photo = await images.read(req.params.nombre);
  if(!photo) return res.status(404).json({error:'Foto no encontrada.'});
  res.set('Cache-Control','public, max-age=604800, immutable');
  res.set('ETag','"'+photo.sha256+'"');
  res.type(photo.mime);
  if(req.fresh) return res.status(304).end();
  res.send(photo.buffer);
}));
app.get('/api/health', wrap(async(req,res) => {
  await db.authenticate();
  res.json({ok:true,servicio:'NEXO',database:db.getDialect(),imagenes:images.mode});
}));
app.post(
  "/api/imagenes",
  access,
  express.raw({
    type: ["image/png", "image/jpeg", "image/webp"],
    limit: "3mb",
  }),
  wrap(async (req, res) => {
    const b = req.body, { ext } = images.inspect(b);
    const name = `${randomUUID()}.${ext}`;
    await images.save(name, b);
    res.status(201).json({ foto: `/media/${name}` });
  }),
);
app.use(express.json({ limit: "30kb" }));
const authRoutes = require("./routes/authRoutes");
app.use(
  "/api/auth",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: { error: "Demasiados intentos. Espera 15 minutos." },
  }),
  authRoutes,
);
app.get("/", (req, res) => res.json({ servicio: "NEXO", version: "4.0" }));
app.get(
  ["/productos", "/api/productos"],
  access,
  wrap(async (req, res) => res.json(await L.lista())),
);
app.post(
  ["/productos", "/api/productos"],
  access,
  wrap(async (req, res) =>
    res.status(201).json(await L.crear(req.body, req.usuario)),
  ),
);
app.put(
  ["/productos/:id", "/api/productos/:id"],
  access,
  wrap(async (req, res) =>
    res.json(await L.editar(V.entero(req.params.id, "ID", 1), req.body)),
  ),
);
app.delete(
  ["/productos/:id", "/api/productos/:id"],
  admin,
  wrap(async (req, res) => {
    await L.archivar(V.entero(req.params.id, "ID", 1), req.body?.revision);
    res.json({ message: "Producto archivado. Historial conservado." });
  }),
);
app.get(
  "/api/proveedores",
  access,
  wrap(async (req, res) =>
    res.json(await Proveedor.findAll({ order: [["empresa", "ASC"]] })),
  ),
);
app.post(
  "/api/proveedores",
  admin,
  wrap(async (req, res) =>
    res.status(201).json(await Proveedor.create(V.proveedor(req.body))),
  ),
);
app.put(
  "/api/proveedores/:id",
  admin,
  wrap(async (req, res) => {
    const data = V.proveedor(req.body),
      revision = V.entero(req.body.revision, "Revisión");
    const [count] = await Proveedor.update(
      { ...data, revision: revision + 1 },
      { where: { id: V.entero(req.params.id, "ID", 1), revision } },
    );
    if (!count) V.fallo("Proveedor modificado o inexistente. Sincroniza.", 409);
    res.json(await Proveedor.findByPk(req.params.id));
  }),
);
app.get(
  "/api/movimientos",
  access,
  wrap(async (req, res) => {
    const { Op } = require("sequelize");
    const where = {};
    if (req.query.productoId)
      where.productoId = V.entero(req.query.productoId, "Producto", 1);
    if (req.query.desde) {
      const date = new Date(req.query.desde);
      if (!Number.isFinite(+date)) V.fallo("Fecha inválida.");
      where.createdAt = { [Op.gte]: date };
    }
    res.json(
      await Movimiento.findAll({ where, order: [["id", "DESC"]], limit: 5000 }),
    );
  }),
);
app.post(
  "/api/movimientos",
  access,
  wrap(async (req, res) => {
    const r = await L.registrar(req.body, req.usuario);
    res.status(r.repetido ? 200 : 201).json(r);
  }),
);
app.get(
  "/api/alertas",
  access,
  wrap(async (req, res) =>
    res.json(
      (await L.lista())
        .filter((p) => Number(p.stock) <= p.minimo)
        .map((p) => ({
          productoId: p.id,
          nombre: p.nombre,
          stock: p.stock,
          minimo: p.minimo,
          estado: p.stock === 0 ? "agotado" : "bajo",
        })),
    ),
  ),
);
app.use((e, req, res, next) => {
  if (e.type === "entity.parse.failed")
    return res.status(400).json({ error: "JSON inválido." });
  if (e.type === "entity.too.large")
    return res
      .status(413)
      .json({ error: "Archivo o datos demasiado grandes." });
  if (e.name === "SequelizeUniqueConstraintError")
    return res
      .status(409)
      .json({ error: "SKU o clave de operación duplicados." });
  if (e.status) return res.status(e.status).json({ error: e.message });
  console.error(e.name, e.message);
  res
    .status(500)
    .json({ error: "No se pudo completar la operación. Revisa el servidor." });
});
async function start() {
  await db.authenticate();
  await Detalle.count();
  await images.Imagen.count();
  app.listen(process.env.PORT || 3006, '0.0.0.0', () =>
    console.log("NEXO listo. Puerto " + (process.env.PORT || 3006)),
  );
}
if (require.main === module)
  start().catch((e) => {
    console.error(
      "Ejecuta primero node scripts/migrar-logistica.js. " + e.message,
    );
    process.exitCode = 1;
  });
module.exports = app;
