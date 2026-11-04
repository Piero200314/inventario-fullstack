const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');
module.exports = (rolesPermitidos = []) => async (req, res, next) => {
  const match = /^Bearer ([^\s]+)$/i.exec(req.headers.authorization || '');
  if (!match) return res.status(401).json({ error: 'Acceso denegado: proporciona un token Bearer.' });
  let payload;
  try { payload = jwt.verify(match[1], process.env.JWT_SECRET, { algorithms: ['HS256'] }); }
  catch { return res.status(401).json({ error: 'Sesión inválida o expirada.' }); }
  try {
    const usuario = await Usuario.findByPk(payload.id, { attributes: ['id', 'nombre', 'rol'] });
    if (!usuario) return res.status(401).json({ error: 'Usuario no disponible.' });
    if (rolesPermitidos.length && !rolesPermitidos.includes(usuario.rol)) {
      return res.status(403).json({ error: 'Permisos insuficientes.' });
    }
    req.usuario = usuario;
    next();
  } catch (error) { next(error); }
};

