const Usuario = require("../models/Usuario");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
exports.registrar = async (req, res) => {
  if (process.env.ALLOW_REGISTRATION !== "true")
    return res
      .status(403)
      .json({
        error: "Registro público desactivado. Contacta al administrador.",
      });
  const { nombre, email, password } = req.body || {};
  if (
    typeof nombre !== "string" ||
    !nombre.trim() ||
    nombre.length > 255 ||
    typeof email !== "string" ||
    email.length > 255 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    typeof password !== "string" ||
    password.length < 10 ||
    Buffer.byteLength(password, "utf8") > 72
  ) {
    return res
      .status(400)
      .json({
        error:
          "Revisa nombre y email. La contraseña debe tener al menos 10 caracteres y como máximo 72 bytes.",
      });
  }
  try {
    // El registro público nunca asigna privilegios administrativos.
    const usuario = await Usuario.create({
      nombre: nombre.trim(),
      email: email.trim().toLowerCase(),
      password,
      rol: "Almacenero",
    });
    res
      .status(201)
      .json({
        message: "Usuario registrado exitosamente",
        id: usuario.id,
        rol: usuario.rol,
      });
  } catch (error) {
    if (error.name === "SequelizeUniqueConstraintError")
      return res.status(409).json({ error: "El correo ya está registrado." });
    if (error.name === "SequelizeValidationError")
      return res.status(400).json({ error: "Datos de usuario inválidos." });
    console.error("Error al registrar usuario:", error.name);
    res.status(500).json({ error: "No se pudo registrar al usuario." });
  }
};
exports.login = async (req, res) => {
  const { email, password } = req.body || {};
  if (
    typeof email !== "string" ||
    typeof password !== "string" ||
    email.length > 255 ||
    Buffer.byteLength(password, "utf8") > 72
  ) {
    return res
      .status(400)
      .json({ error: "Ingresa email y contraseña válidos." });
  }
  try {
    const usuario = await Usuario.findOne({
      where: { email: email.trim().toLowerCase() },
    });
    if (!usuario || !(await bcrypt.compare(password, usuario.password))) {
      return res.status(401).json({ error: "Credenciales inválidas." });
    }
    const token = jwt.sign(
      { id: usuario.id, rol: usuario.rol },
      process.env.JWT_SECRET,
      {
        algorithm: "HS256",
        expiresIn: process.env.JWT_EXPIRES_IN || "1h",
      },
    );
    res.json({
      message: "Inicio de sesión exitoso",
      token,
      usuario: { id: usuario.id, nombre: usuario.nombre, rol: usuario.rol },
    });
  } catch (error) {
    console.error("Error de login:", error.name);
    res.status(500).json({ error: "No se pudo iniciar sesión." });
  }
};
