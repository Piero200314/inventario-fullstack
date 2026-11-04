export const money = (v) =>
  new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" }).format(
    Number(v) || 0,
  );
export const low = (p) => Number(p.stock) <= Number(p.minimo);
export const status = (p) =>
  Number(p.stock) === 0 ? "Agotado" : low(p) ? "Stock bajo" : "Disponible";
export function analytics(items, moves, now = Date.now()) {
  const since = now - 30 * 86400000,
    recent = moves.filter(
      (m) =>
        new Date(m.createdAt).getTime() >= since &&
        new Date(m.createdAt).getTime() <= now,
    );
  const sales = recent.filter((m) => m.tipo === "venta"),
    sold = new Map();
  sales.forEach((m) =>
    sold.set(
      m.productoId,
      (sold.get(m.productoId) || 0) + Math.abs(Number(m.cantidad)),
    ),
  );
  const recommendations = items.map((p) => {
    const sales30 = sold.get(p.id) || 0,
      daily = sales30 / 30,
      trigger = Math.ceil(daily * Number(p.plazoDias) + Number(p.minimo));
    return {
      ...p,
      sales30,
      daily,
      trigger,
      coverage: daily ? Number(p.stock) / daily : null,
      suggested:
        Number(p.stock) <= trigger
          ? Math.max(
              0,
              Math.ceil(
                Math.max(Number(p.objetivo), trigger) - Number(p.stock),
              ),
            )
          : 0,
    };
  });
  const labels = Array.from({ length: 14 }, (_, i) =>
    new Date(now - (13 - i) * 86400000).toISOString().slice(0, 10),
  );
  const series = labels.map((day) => ({ day, in: 0, out: 0 }));
  for (const m of recent) {
    const d = series.find(
      (s) => s.day === new Date(m.createdAt).toISOString().slice(0, 10),
    );
    if (!d) continue;
    if (m.tipo === "entrada") d.in += Number(m.cantidad);
    if (["venta", "salida"].includes(m.tipo))
      d.out += Math.abs(Number(m.cantidad));
  }
  return {
    units: items.reduce((n, p) => n + Number(p.stock), 0),
    retail: items.reduce((n, p) => n + Number(p.stock) * Number(p.precio), 0),
    cost: items.reduce(
      (n, p) => n + (p.costo == null ? 0 : Number(p.stock) * Number(p.costo)),
      0,
    ),
    unknownCost: items.filter((p) => p.costo == null).length,
    low: items.filter(low),
    salesUnits: sales.reduce((s, m) => s + Math.abs(Number(m.cantidad)), 0),
    salesValue: sales.reduce(
      (s, m) => s + Math.abs(Number(m.cantidad)) * Number(m.precio),
      0,
    ),
    recommendations,
    series,
  };
}
export function csv(rows) {
  return (
    "\ufeff" +
    rows
      .map((row) =>
        row
          .map((v) => {
            let s = String(v ?? "");
            if (/^[=+@\-\t\r]/.test(s)) s = "'" + s;
            return '"' + s.replaceAll('"', '""') + '"';
          })
          .join(";"),
      )
      .join("\r\n")
  );
}
export function downloadCSV(name, rows) {
  const url = URL.createObjectURL(
    new Blob([csv(rows)], { type: "text/csv;charset=utf-8" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
