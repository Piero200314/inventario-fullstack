import { useState } from "react";
import api from "../../services/api";
export default function ProductImage({ product }) {
  const [bad, setBad] = useState("");
  return product.foto && bad !== product.foto ? (
    <img
      className="product-image"
      src={new URL(product.foto, api.defaults.baseURL).href}
      alt={product.nombre}
      loading="lazy"
      onError={() => setBad(product.foto)}
    />
  ) : (
    <div className="image-placeholder" aria-label="Producto sin fotografía">
      <span>◇</span>
      <small>Sin fotografía</small>
    </div>
  );
}
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
