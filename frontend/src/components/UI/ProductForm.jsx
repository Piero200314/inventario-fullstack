import { useState } from "react";
import Modal from "./Modal";
import ProductImage from "./ProductImage";
import {uploadPhoto} from "../../services/product-helpers";
import { useInventory } from "../../context/inventory-context";
export default function ProductForm({ product, onClose }) {
  const { suppliers, saveProduct } = useInventory();
  const [form, setForm] = useState({
      ...product,
      costo: product.costo ?? "",
      proveedorId: product.proveedorId ?? "",
    }),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await saveProduct(form);
      onClose(true);
    } catch (e) {
      setError(e.response?.data?.error || e.message || "No se pudo guardar.");
    } finally {
      setBusy(false);
    }
  }
  async function photo(e) {
    const file = e.target.files[0];
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      set("foto", await uploadPhoto(file));
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  const field = (key, label, type = "text", props = {}) => (
    <label key={key}>
      {label}
      <input
        name={key}
        type={type}
        value={form[key] ?? ""}
        onChange={(e) => set(key, e.target.value)}
        {...props}
      />
    </label>
  );
  return (
    <Modal
      title={form.id ? "Editar ficha del producto" : "Nuevo producto"}
      onClose={() => !busy && onClose()}
    >
      <form onSubmit={submit}>
        {error && (
          <div className="notice error" role="alert">
            {error}
          </div>
        )}
        <fieldset disabled={busy}>
          <div className="photo-editor">
            <ProductImage product={form} />
            <label>
              Fotografía
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={photo}
              />
              <small>Hasta 8 MB. Se optimiza antes de guardar.</small>
            </label>
            {form.foto && (
              <button
                type="button"
                className="secondary"
                onClick={() => set("foto", "")}
              >
                Quitar foto
              </button>
            )}
          </div>
          <div className="form-grid">
            {field("nombre", "Nombre", "text", {
              required: true,
              maxLength: 255,
            })}
            {field("sku", "SKU / código único", "text", {
              required: true,
              maxLength: 80,
            })}
            {field("categoria", "Categoría", "text", { maxLength: 80 })}
            {field("marca", "Marca", "text", { maxLength: 80 })}
          </div>
          <label>
            Descripción
            <textarea
              rows="3"
              maxLength={2000}
              value={form.descripcion || ""}
              onChange={(e) => set("descripcion", e.target.value)}
            />
          </label>
          <div className="form-grid">
            {field("precio", "Precio de venta (S/)", "number", {
              required: true,
              min: 0,
              max: 99999999.99,
              step: ".01",
            })}
            {field("costo", "Costo unitario de referencia (S/)", "number", {
              min: 0,
              max: 99999999.99,
              step: ".01",
            })}
            {!form.id &&
              field("stock", "Existencias iniciales", "number", {
                required: true,
                min: 0,
                max: 2147483647,
                step: 1,
              })}
            {field("minimo", "Stock mínimo / seguridad", "number", {
              required: true,
              min: 0,
              max: 2147483647,
              step: 1,
            })}
            {field("objetivo", "Stock objetivo", "number", {
              required: true,
              min: form.minimo || 0,
              max: 2147483647,
              step: 1,
            })}
            {field("plazoDias", "Plazo de reposición (días)", "number", {
              required: true,
              min: 0,
              max: 365,
              step: 1,
            })}
            {field("ubicacion", "Ubicación / estante", "text", {
              maxLength: 100,
            })}
            <label>
              Proveedor habitual
              <select
                value={form.proveedorId}
                onChange={(e) => set("proveedorId", e.target.value)}
              >
                <option value="">Sin asignar</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.empresa}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {form.id && (
            <p className="hint">
              Stock actual: <b>{form.stock}</b>. Registra entradas, ventas o
              ajustes en Movimientos.
            </p>
          )}
          <p className="hint">
            Deja el costo vacío si aún no lo conoces. El valor a costo será
            parcial.
          </p>
        </fieldset>
        <div className="modal-actions">
          <button
            type="button"
            className="secondary"
            disabled={busy}
            onClick={() => onClose()}
          >
            Cancelar
          </button>
          <button className="primary" disabled={busy}>
            {busy ? "Guardando…" : "Guardar producto"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
