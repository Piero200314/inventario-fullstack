import { useState } from "react";
import { useInventory } from "../context/Inventory";
import Modal from "../components/UI/Modal";
export default function Suppliers() {
  const { suppliers, items, saveSupplier } = useInventory();
  const [query, setQuery] = useState(""),
    [form, setForm] = useState(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [message, setMessage] = useState("");
  let admin = false;
  try {
    admin =
      JSON.parse(localStorage.getItem("usuario") || "{}").rol ===
      "Administrador";
  } catch {}
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await saveSupplier(form);
      setForm(null);
      setMessage("Proveedor guardado.");
    } catch (e) {
      setError(e.response?.data?.error || "No se pudo guardar.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">04 / PROVEEDORES</span>
          <h1>Tu red de suministro.</h1>
          <p>Empresas y contactos que dan continuidad a tu inventario.</p>
        </div>
        {admin && (
          <button
            className="primary"
            onClick={() => {
              setError("");
              setForm({
                empresa: "",
                documento: "",
                contacto: "",
                telefono: "",
                email: "",
                direccion: "",
                notas: "",
              });
            }}
          >
            + Nuevo proveedor
          </button>
        )}
      </div>
      {message && (
        <p className="notice success" role="status">
          {message}
        </p>
      )}
      <label className="panel padded">
        Buscar empresa o contacto
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Nombre, contacto, teléfono…"
        />
      </label>
      <div className="supplier-grid">
        {suppliers
          .filter((s) =>
            `${s.empresa} ${s.contacto} ${s.telefono}`
              .toLowerCase()
              .includes(query.toLowerCase()),
          )
          .map((s) => (
            <article className="panel padded" key={s.id}>
              <span className="eyebrow">PROVEEDOR #{s.id}</span>
              <h2>{s.empresa}</h2>
              <dl className="contact-list">
                {[
                  ["Documento", s.documento],
                  ["Contacto", s.contacto],
                  ["Teléfono", s.telefono],
                  ["Correo", s.email],
                  ["Dirección", s.direccion],
                ].map(([label, v]) => (
                  <div key={label}>
                    <dt>{label}</dt>
                    <dd>{v || "Sin registrar"}</dd>
                  </div>
                ))}
              </dl>
              <p>{s.notas}</p>
              <div className="card-footer">
                <span className="hint">
                  {items.filter((p) => p.proveedorId === s.id).length} productos
                  vinculados
                </span>
                {admin && (
                  <button
                    className="secondary"
                    onClick={() => {
                      setError("");
                      setForm({ ...s });
                    }}
                  >
                    Editar
                  </button>
                )}
              </div>
            </article>
          ))}
      </div>
      {!suppliers.length && (
        <div className="empty-state">
          <h2>Tu red empieza aquí</h2>
          <p>
            {admin
              ? "Registra tu primer proveedor para documentar las recepciones."
              : "Un administrador puede registrar proveedores."}
          </p>
        </div>
      )}
      {form && (
        <Modal
          title={form.id ? "Editar proveedor" : "Nuevo proveedor"}
          onClose={() => !busy && setForm(null)}
        >
          <form onSubmit={submit}>
            {error && (
              <p role="alert" className="notice error">
                {error}
              </p>
            )}
            <fieldset disabled={busy}>
              <div className="form-grid">
                {[
                  ["empresa", "Empresa / razón social"],
                  ["documento", "RUC / documento"],
                  ["contacto", "Persona de contacto"],
                  ["telefono", "Teléfono"],
                  ["email", "Correo electrónico"],
                  ["direccion", "Dirección"],
                ].map(([key, label]) => (
                  <label key={key}>
                    {label}
                    <input
                      name={key}
                      required={key === "empresa"}
                      type={
                        key === "email"
                          ? "email"
                          : key === "telefono"
                            ? "tel"
                            : "text"
                      }
                      maxLength={
                        ["telefono", "documento"].includes(key) ? 40 : 255
                      }
                      value={form[key] || ""}
                      onChange={(e) =>
                        setForm({ ...form, [key]: e.target.value })
                      }
                    />
                  </label>
                ))}
              </div>
              <label>
                Notas
                <textarea
                  maxLength={2000}
                  value={form.notas || ""}
                  onChange={(e) => setForm({ ...form, notas: e.target.value })}
                />
              </label>
            </fieldset>
            <div className="modal-actions">
              <button
                type="button"
                className="secondary"
                disabled={busy}
                onClick={() => setForm(null)}
              >
                Cancelar
              </button>
              <button className="primary" disabled={busy}>
                {busy ? "Guardando…" : "Guardar proveedor"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
