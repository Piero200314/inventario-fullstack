import api from "./api";
export const emptyProduct = () => ({
  nombre: "",
  descripcion: "",
  sku: "",
  categoria: "",
  marca: "",
  precio: "",
  costo: "",
  stock: 0,
  minimo: 5,
  objetivo: 20,
  plazoDias: 7,
  ubicacion: "",
  proveedorId: "",
  foto: "",
});
export async function uploadPhoto(file) {
  if (
    !["image/png", "image/jpeg", "image/webp"].includes(file.type) ||
    file.size > 8 * 1024 * 1024
  )
    throw Error("Usa PNG, JPEG o WebP de hasta 8 MB.");
  const bitmap = await createImageBitmap(file);
  try {
    const scale = Math.min(1, 1200 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    canvas
      .getContext("2d")
      .drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise((resolve) =>
      canvas.toBlob(resolve, "image/webp", 0.85),
    );
    if (!blob || blob.size > 3 * 1024 * 1024)
      throw Error("La imagen optimizada supera 3 MB. Elige una más pequeña.");
    const { data } = await api.post("/api/imagenes", blob, {
      headers: { "Content-Type": blob.type },
      timeout: 30000,
    });
    return data.foto;
  } finally {
    bitmap.close();
  }
}
