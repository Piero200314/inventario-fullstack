function fallo(message, status = 400) {
  const e = new Error(message);
  e.status = status;
  throw e;
}
function texto(v, nombre, max = 255, required = false) {
  if (v == null) v = "";
  if (typeof v !== "string" || v.length > max || (required && !v.trim()))
    fallo(`${nombre}: valor inválido (máximo ${max} caracteres).`);
  return v.trim();
}
function entero(v, nombre, min = 0, max = 2147483647) {
  if (
    v === "" ||
    v == null ||
    typeof v === "boolean" ||
    !Number.isSafeInteger(Number(v)) ||
    Number(v) < min ||
    Number(v) > max
  )
    fallo(`${nombre}: ingresa un entero entre ${min} y ${max}.`);
  return Number(v);
}
function dinero(v, nombre, optional = false) {
  if (optional && (v === "" || v == null)) return null;
  if (!/^(0|[1-9]\d*)(\.\d{1,2})?$/.test(String(v)) || Number(v) > 99999999.99)
    fallo(`${nombre}: importe no negativo, máximo 2 decimales.`);
  return Number(v);
}
function producto(b) {
  const minimo = entero(b.minimo, "Mínimo"),
    objetivo = entero(b.objetivo, "Objetivo");
  if (objetivo < minimo) fallo("El objetivo debe ser igual o mayor al mínimo.");
  const foto = texto(b.foto, "Foto");
  if (foto && !/^\/media\/[a-f0-9-]+\.(png|jpg|webp)$/.test(foto))
    fallo("Sube la foto con el selector del producto.");
  return {
    base: {
      nombre: texto(b.nombre, "Nombre", 255, true),
      descripcion: texto(b.descripcion, "Descripción", 2000),
      precio: dinero(b.precio, "Precio"),
    },
    detalle: {
      sku: texto(b.sku, "SKU", 80, true).toUpperCase(),
      categoria: texto(b.categoria, "Categoría", 80),
      marca: texto(b.marca, "Marca", 80),
      ubicacion: texto(b.ubicacion, "Ubicación", 100),
      costo: dinero(b.costo, "Costo", true),
      foto: foto || null,
      minimo,
      objetivo,
      plazoDias: entero(b.plazoDias, "Plazo", 0, 365),
      proveedorId: b.proveedorId ? entero(b.proveedorId, "Proveedor", 1) : null,
    },
  };
}
function proveedor(b) {
  const p = {};
  for (const k of [
    "empresa",
    "documento",
    "contacto",
    "telefono",
    "email",
    "direccion",
    "notas",
  ])
    p[k] = texto(
      b[k],
      k,
      k === "notas" ? 2000 : k === "telefono" || k === "documento" ? 40 : 255,
      k === "empresa",
    );
  if (p.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.email))
    fallo("Correo del proveedor inválido.");
  return p;
}
function movimiento(b) {
  const tipo = texto(b.tipo, "Tipo");
  if (!["entrada", "venta", "salida", "ajuste"].includes(tipo))
    fallo("Tipo de movimiento inválido.");
  const cantidad = entero(
    b.cantidad,
    "Cantidad",
    tipo === "ajuste" ? -2147483647 : 1,
  );
  if (!cantidad) fallo("La cantidad no puede ser cero.");
  const p = {
    productoId: entero(b.productoId, "Producto", 1),
    tipo,
    cantidad,
    motivo: texto(b.motivo, "Motivo", 255, true),
    entregadoPor: texto(b.entregadoPor, "Persona que entrega"),
    documento: texto(b.documento, "Documento", 100),
    proveedorId: b.proveedorId ? entero(b.proveedorId, "Proveedor", 1) : null,
    clave: texto(b.clave, "Clave de operación", 80, true),
  };
  if (!/^[a-zA-Z0-9-]{16,80}$/.test(p.clave))
    fallo("Clave de operación inválida.");
  if (tipo === "entrada" && (!p.entregadoPor || !p.proveedorId))
    fallo("La recepción necesita proveedor y persona que entrega.");
  return p;
}
module.exports = {
  fallo,
  texto,
  entero,
  dinero,
  producto,
  proveedor,
  movimiento,
};
