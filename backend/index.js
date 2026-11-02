require('dotenv').config();
const express = require('express');
const cors = require('cors');
const sequelize = require('./config/db');
const Producto = require('./models/Producto');
const helmet = require('helmet');
const { rateLimit } = require('express-rate-limit');
const autenticar = require('./middleware/authMiddleware');
require('./models/Usuario');
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  throw new Error('Configura JWT_SECRET: ejecuta node scripts/configurar-seguridad.js');
}
const app = express();
app.disable('x-powered-by');
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_ORIGIN || 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '20kb' }));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 100,
  standardHeaders: 'draft-7', legacyHeaders: false,
  message: { error: 'Demasiadas peticiones. Intenta más tarde.' }
}));
app.use('/api/auth', rateLimit({ windowMs: 15 * 60 * 1000, limit: 20,
  standardHeaders: 'draft-7', legacyHeaders: false,
  message: { error: 'Demasiados intentos de autenticación. Espera 15 minutos.' }
}), require('./routes/authRoutes'));
app.get('/', (req, res) => res.send('API Backend funcionando exitosamente'));
const fields = ['nombre', 'descripcion', 'precio', 'stock'];
function datos(body) {
  if (typeof body.nombre !== 'string' || !body.nombre.trim() ||
      body.precio === '' || body.precio == null || !Number.isFinite(Number(body.precio)) || Number(body.precio) < 0 ||
      body.stock === '' || body.stock == null || !Number.isSafeInteger(Number(body.stock)) || Number(body.stock) < 0) {
    throw new Error('Ingresa nombre, precio no negativo y stock entero no negativo.');
  }
  return Object.fromEntries(fields.map(k => [k, k === 'nombre' ? body.nombre.trim() : body[k]]));
}
app.get(['/productos', '/api/productos'], autenticar(['Administrador', 'Almacenero']), async (req, res) => {
  try { res.json(await Producto.findAll({ order: [['id', 'ASC']] })); }
  catch (error) { res.status(500).json({ error: error.message }); }
});
app.post(['/productos', '/api/productos'], autenticar(['Administrador', 'Almacenero']), async (req, res) => {
  try { res.status(201).json(await Producto.create(datos(req.body || {}))); }
  catch (error) { res.status(400).json({ error: error.message }); }
});
app.put(['/productos/:id', '/api/productos/:id'], autenticar(['Administrador', 'Almacenero']), async (req, res) => {
  try {
    const producto = await Producto.findByPk(req.params.id);
    if (!producto) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json(await producto.update(datos(req.body || {})));
  } catch (error) { res.status(400).json({ error: error.message }); }
});
app.delete(['/productos/:id', '/api/productos/:id'], autenticar(['Administrador']), async (req, res) => {
  try {
    const producto = await Producto.findByPk(req.params.id);
    if (!producto) return res.status(404).json({ error: 'Producto no encontrado' });
    await producto.destroy();
    res.json({ message: 'Producto eliminado' });
  } catch (error) { res.status(500).json({ error: error.message }); }
});
app.use((error, req, res, next) => {
  if (error.type === 'entity.parse.failed') return res.status(400).json({ error: 'JSON inválido.' });
  if (error.type === 'entity.too.large') return res.status(413).json({ error: 'Cuerpo demasiado grande.' });
  console.error('Error interno:', error.name);
  res.status(500).json({ error: 'Error interno del servidor.' });
});
const PORT = process.env.PORT || 3006;
async function iniciarServidor() {
  try {
    await sequelize.authenticate();
    await sequelize.sync({ force: false });
    console.log('Base de datos conectada y sincronizada.');
    app.listen(PORT, () => console.log(`Servidor corriendo en http://localhost:${PORT}`));
  } catch (error) {
    console.error('Error al conectar con la base de datos:', error.message);
    process.exitCode = 1;
  }
}
iniciarServidor();
