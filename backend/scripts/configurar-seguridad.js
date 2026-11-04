// Ejecutar desde la carpeta backend. Conserva las variables de MySQL.
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const envPath = path.join(__dirname, "..", ".env");
if (!fs.existsSync(envPath))
  throw new Error("Falta .env. Conserva el archivo de la guía 7.");
let contenido = fs.readFileSync(envPath, "utf8");
const variables = {
  JWT_SECRET: crypto.randomBytes(48).toString("hex"),
  JWT_EXPIRES_IN: "1h",
  FRONTEND_ORIGIN: "http://localhost:5173",
};
for (const [clave, valor] of Object.entries(variables)) {
  if (!new RegExp(`^\\s*${clave}\\s*=`, "m").test(contenido))
    contenido += `\n${clave}=${valor}\n`;
}
fs.writeFileSync(envPath, contenido);
console.log(
  "Configuración de seguridad completada. La clave se guarda únicamente en .env.",
);
