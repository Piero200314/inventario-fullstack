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
