// Ejecutar localmente para promover una cuenta ya registrada.
require('../config/env');
const sequelize = require("../config/db");
const Usuario = require("../models/Usuario");
(async () => {
  try {
    const email = process.argv[2];
    if (!email)
      throw new Error("Uso: node scripts/hacer-admin.js correo@ejemplo.com");
    const usuario = await Usuario.findOne({
      where: { email: email.trim().toLowerCase() },
    });
    if (!usuario) throw new Error("Registra primero esa cuenta desde Postman.");
    usuario.rol = "Administrador";
    await usuario.save();
    console.log("Rol actualizado a Administrador. Vuelve a iniciar sesión.");
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
})();
