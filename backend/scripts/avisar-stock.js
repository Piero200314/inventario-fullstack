require("dotenv").config();
const db = require("../config/db"),
  { Aviso } = require("../models/Logistica"),
  { lista } = require("../services/logistica");
async function run() {
  const dry = process.argv.includes("--dry-run");
  if (
    !dry &&
    (!process.env.TELEGRAM_BOT_TOKEN || !process.env.TELEGRAM_CHAT_ID)
  )
    throw Error(
      "Configura TELEGRAM_BOT_TOKEN y TELEGRAM_CHAT_ID en backend/.env.",
    );
  await db.authenticate();
  for (const p of await lista()) {
    const estado =
      p.stock === 0 ? "agotado" : p.stock <= p.minimo ? "bajo" : "normal";
    let a = await Aviso.findByPk(p.id);
    if (!a && !dry)
      [a] = await Aviso.findOrCreate({
        where: { productoId: p.id },
        defaults: { estado: "normal" },
      });
    if (!a) a = { estado: "normal", enviadoEn: null };
    if (estado === "normal") {
      if (!dry) await a.update({ estado, enviadoEn: null });
      continue;
    }
    if (
      a.estado === estado &&
      a.enviadoEn &&
      Date.now() - new Date(a.enviadoEn) < 24 * 3600e3
    )
      continue;
    const text = `NEXO · ${estado.toUpperCase()}\n${p.sku} · ${p.nombre}\nExistencias: ${p.stock}. Mínimo: ${p.minimo}.\nRevisa la reposición en el inventario.`;
    if (dry) {
      console.log(text);
      continue;
    }
    const response = await fetch(
      `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: process.env.TELEGRAM_CHAT_ID, text }),
        signal: AbortSignal.timeout(10000),
      },
    );
    const result = await response.json();
    if (!response.ok || !result.ok)
      throw Error(
        "Telegram no aceptó el aviso. Revisa configuración o espera antes de reintentar.",
      );
    await a.update({ estado, enviadoEn: new Date() });
  }
}
run()
  .catch((e) => {
    console.error(e.message);
    process.exitCode = 1;
  })
  .finally(() => db.close());
