import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useInventory } from "../context/Inventory";
import { downloadCSV } from "../services/analytics";
import Modal from "../components/UI/Modal";
const names = {
  apertura: "Apertura",
  entrada: "Recepción",
  venta: "Venta",
  salida: "Otra salida",
  ajuste: "Ajuste",
};
export default function Movements() {
  const { items, suppliers, moves, move } = useInventory();
  const [params] = useSearchParams();
  const [product, setProduct] = useState(params.get("producto") || ""),
    [type, setType] = useState(""),
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
  const shown = moves.filter(
    (m) =>
      (!product || String(m.productoId) === product) &&
      (!type || m.tipo === type),
  );
  const selected = form
    ? items.find((p) => p.id === Number(form.productoId))
    : null;
  const fresh = () => ({
    productoId: product,
    tipo: "entrada",
    cantidad: "",
    motivo: "",
    proveedorId: "",
    entregadoPor: "",
    documento: "",
    clave: crypto.randomUUID(),
  });
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await move(form);
      setForm(null);
      setMessage("Movimiento registrado. Existencias y gráficas actualizadas.");
    } catch (e) {
      setError(
        e.response?.data?.error ||
          "No se confirmó la operación. Puedes reintentar: se conserva la misma clave para evitar duplicados.",
      );
    } finally {
      setBusy(false);
    }
  }
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const productLabel = (id) =>
    items.find((p) => p.id === id)?.nombre || `Producto #${id} (archivado)`;
  function exportRows() {
    downloadCSV("nexo-movimientos.csv", [
      [
        "Fecha",
        "Producto",
        "Tipo",
        "Cantidad",
        "Antes",
        "Después",
        "Responsable",
        "Proveedor",
        "Entregado por",
        "Documento",
        "Motivo",
      ],
      ...shown.map((m) => [
        m.createdAt,
        m.productoNombre || productLabel(m.productoId),
        names[m.tipo],
        m.cantidad,
        m.antes,
        m.despues,
        m.responsable,
        m.proveedorNombre,
        m.entregadoPor,
        m.documento,
        m.motivo,
      ]),
    ]);
  }
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">05 / MOVIMIENTOS</span>
          <h1>Cada unidad tiene historia.</h1>
          <p>Recepciones, ventas, salidas y ajustes con un responsable.</p>
        </div>
        <button
          className="primary"
          disabled={!items.length}
          onClick={() => {
            setError("");
            setForm(fresh());
          }}
        >
          + Registrar movimiento
        </button>
      </div>
      {message && (
        <p className="notice success" role="status">
          {message}
        </p>
      )}
      <section className="panel filters">
        <label>
          Producto
          <select value={product} onChange={(e) => setProduct(e.target.value)}>
            <option value="">Todos los productos</option>
            {items.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre}
              </option>
            ))}
            {product && !items.some((p) => String(p.id) === product) && (
              <option value={product}>Producto #{product}</option>
            )}
          </select>
        </label>
        <label>
          Operación
          <select value={type} onChange={(e) => setType(e.target.value)}>
            <option value="">Todas</option>
            {Object.entries(names).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </label>
        <button className="secondary" onClick={exportRows}>
          Exportar CSV
        </button>
      </section>
      <p className="hint">
        Historial inmutable. Para corregir un registro, un administrador crea un
        ajuste con el motivo y la referencia original. Se muestran hasta los
        últimos 5.000 movimientos.
      </p>
      <div className="panel table-wrap">
        <table>
          <thead>
            <tr>
              <th>Fecha / operación</th>
              <th>Producto</th>
              <th>Cambio</th>
              <th>Saldo</th>
              <th>Responsable / entrega</th>
              <th>Referencia</th>
            </tr>
          </thead>
          <tbody>
            {shown.map((m) => (
              <tr key={m.id}>
                <td>
                  <b>{names[m.tipo]}</b>
                  <small>
                    #{m.id} · {new Date(m.createdAt).toLocaleString("es-PE")}
                  </small>
                </td>
                <td>{m.productoNombre || productLabel(m.productoId)}</td>
                <td className={m.cantidad < 0 ? "negative" : "positive"}>
                  {m.cantidad > 0 ? "+" : ""}
                  {m.cantidad}
                </td>
                <td>
                  {m.antes} → <b>{m.despues}</b>
                </td>
                <td>
                  <b>{m.responsable || "Sistema"}</b>
                  <small>{m.proveedorNombre || "—"}</small>
                  <small>
                    {m.entregadoPor && `Entrega: ${m.entregadoPor}`}
                  </small>
                </td>
                <td>
                  {m.documento || "Sin documento"}
                  <small>{m.motivo}</small>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!shown.length && (
          <p className="empty-state">
            Todavía no hay movimientos con estos filtros.
          </p>
        )}
      </div>
      {form && (
        <Modal
          title="Registrar movimiento"
          onClose={() => !busy && setForm(null)}
        >
          <form onSubmit={submit}>
            {error && (
              <div className="notice error" role="alert">
                {error}
              </div>
            )}
            <fieldset disabled={busy}>
              <label>
                Producto
                <select
                  aria-label="Producto"
                  required
                  value={form.productoId}
                  onChange={(e) => {
                    set("productoId", e.target.value);
                    const p = items.find(
                      (p) => p.id === Number(e.target.value),
                    );
                    set("proveedorId", p?.proveedorId || "");
                  }}
                >
                  <option value="">Selecciona un producto</option>
                  {items.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nombre} · Stock {p.stock}
                    </option>
                  ))}
                </select>
              </label>
              <div className="form-grid">
                <label>
                  Operación
                  <select
                    aria-label="Operación"
                    value={form.tipo}
                    onChange={(e) => set("tipo", e.target.value)}
                  >
                    <option value="entrada">Recepción de proveedor</option>
                    <option value="venta">Venta</option>
                    <option value="salida">Otra salida</option>
                    {admin && (
                      <option value="ajuste">Ajuste de inventario</option>
                    )}
                  </select>
                </label>
                <label>
                  {form.tipo === "ajuste" ? "Variación (+ o −)" : "Cantidad"}
                  <input
                    required
                    name="cantidad"
                    type="number"
                    step="1"
                    min={form.tipo === "ajuste" ? -2147483647 : 1}
                    max={2147483647}
                    value={form.cantidad}
                    onChange={(e) => set("cantidad", e.target.value)}
                  />
                </label>
              </div>
              {selected && (
                <p className="hint">
                  Stock actual: <b>{selected.stock}</b>. No se permiten saldos
                  negativos.
                </p>
              )}
              {form.tipo === "entrada" && (
                <>
                  <label>
                    Proveedor
                    <select
                      aria-label="Proveedor"
                      required
                      value={form.proveedorId}
                      onChange={(e) => set("proveedorId", e.target.value)}
                    >
                      <option value="">Selecciona un proveedor</option>
                      {suppliers.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.empresa}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Persona que entrega los productos
                    <input
                      name="entregadoPor"
                      required
                      maxLength={255}
                      value={form.entregadoPor}
                      onChange={(e) => set("entregadoPor", e.target.value)}
                    />
                  </label>
                </>
              )}
              <label>
                Guía / comprobante / referencia
                <input
                  name="documento"
                  maxLength={100}
                  value={form.documento}
                  onChange={(e) => set("documento", e.target.value)}
                />
              </label>
              <label>
                Motivo / observación
                <input
                  name="motivo"
                  required
                  maxLength={255}
                  value={form.motivo}
                  onChange={(e) => set("motivo", e.target.value)}
                />
              </label>
              <p className="hint">
                Tu usuario quedará registrado como responsable. Este movimiento
                no emite comprobantes tributarios.
              </p>
            </fieldset>
            <div className="modal-actions">
              <button
                className="secondary"
                type="button"
                disabled={busy}
                onClick={() => setForm(null)}
              >
                Cancelar
              </button>
              <button className="primary" disabled={busy}>
                {busy ? "Registrando…" : "Confirmar movimiento"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
