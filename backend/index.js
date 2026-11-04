require("dotenv").config();
const express = require("express"),
  cors = require("cors"),
  helmet = require("helmet");
const { rateLimit } = require("express-rate-limit");
const fs = require("node:fs"),
  path = require("node:path"),
  { randomUUID } = require("node:crypto");
const db = require("./config/db"),
  auth = require("./middleware/authMiddleware");
const { Proveedor, Movimiento, Detalle } = require("./models/Logistica");
require("./models/Usuario");
const L = require("./services/logistica"),
  V = require("./services/validacion");
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32)
  throw Error("Configura JWT_SECRET con scripts/configurar-seguridad.js");
const app = express();
app.disable("x-powered-by");
if (process.env.TRUST_PROXY === "1") app.set("trust proxy", 1);
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(
  cors({
    origin: process.env.FRONTEND_ORIGIN || "http://localhost:5173",
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
const images = path.resolve(
  process.env.UPLOAD_DIR || path.join(__dirname, "uploads"),
);
fs.mkdirSync(images, { recursive: true });
app.use(
  "/media",
  express.static(images, {
    dotfiles: "deny",
    index: false,
    immutable: true,
    maxAge: "7d",
  }),
);
const access = auth(["Administrador", "Almacenero"]),
  admin = auth(["Administrador"]);
const wrap = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res)).catch(next);
app.post(
  "/api/imagenes",
  access,
  express.raw({
    type: ["image/png", "image/jpeg", "image/webp"],
    limit: "3mb",
  }),
  wrap(async (req, res) => {
    const b = req.body;
    if (!Buffer.isBuffer(b) || b.length < 16)
      V.fallo("Selecciona una imagen PNG, JPEG o WebP.");
    let ext;
    if (b.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])))
      ext = "png";
    else if (b[0] === 255 && b[1] === 216 && b[2] === 255) ext = "jpg";
    else if (
      b.toString("ascii", 0, 4) === "RIFF" &&
      b.toString("ascii", 8, 12) === "WEBP"
    )
      ext = "webp";
    else V.fallo("Formato de imagen no admitido.");
    const name = `${randomUUID()}.${ext}`;
    await fs.promises.writeFile(path.join(images, name), b, { flag: "wx" });
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
app.get("/", (req, res) => res.json({ servicio: "NEXO", version: "2.0" }));
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
  app.listen(process.env.PORT || 3006, () =>
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
