import { useState } from "react";
import { Link } from "react-router-dom";
import { useInventory } from "../context/inventory-context";
import {
  analytics,
  money,
  status,
  low,
  downloadCSV,
} from "../services/analytics";
import ProductImage from "../components/UI/ProductImage";
import ProductForm from "../components/UI/ProductForm";
import {emptyProduct} from "../services/product-helpers";
import Charts from "../components/UI/Charts";
import Modal from "../components/UI/Modal";
export default function InventoryPage({ mode }) {
  const { items, moves, suppliers, loading, archive } = useInventory();
  const [query, setQuery] = useState(""),
    [category, setCategory] = useState(""),
    [view, setView] = useState("cards"),
    [sort, setSort] = useState("name"),
    [form, setForm] = useState(null),
    [detail, setDetail] = useState(null),
    [remove, setRemove] = useState(null),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState(""),
    [error, setError] = useState(""),
    [limit, setLimit] = useState("");
  const stats = analytics(items, moves);
  let admin = false;
  try {
    admin =
      JSON.parse(localStorage.getItem("usuario") || "{}").rol ===
      "Administrador";
  } catch {}
  const filtered = items
    .filter(
      (p) =>
        (mode !== "stock" ||
          (limit === "" ? low(p) : Number(p.stock) <= Number(limit))) &&
        (!category || p.categoria === category) &&
        `${p.nombre} ${p.sku} ${p.descripcion} ${p.marca}`
          .toLowerCase()
          .includes(query.toLowerCase()),
    )
    .sort((a, b) =>
      sort === "stock"
        ? a.stock - b.stock
        : sort === "price"
          ? a.precio - b.precio
          : a.nombre.localeCompare(b.nombre),
    );
  const p = detail ? items.find((i) => i.id === detail) : null;
  const exportCSV = () =>
    downloadCSV("nexo-catalogo.csv", [
      [
        "SKU",
        "Producto",
        "Categoría",
        "Stock",
        "Mínimo",
        "Precio PEN",
        "Costo PEN",
        "Proveedor",
        "Ubicación",
      ],
      ...filtered.map((p) => [
        p.sku,
        p.nombre,
        p.categoria,
        p.stock,
        p.minimo,
        p.precio,
        p.costo,
        suppliers.find((s) => s.id === p.proveedorId)?.empresa,
        p.ubicacion,
      ]),
    ]);
  async function doArchive() {
    setBusy(true);
    setError("");
    try {
      await archive(remove);
      setRemove(null);
      setMessage("Producto archivado. Su historial se conserva.");
    } catch (e) {
      setError(e.response?.data?.error || "No se pudo archivar.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">
            {mode === "summary"
              ? "01 / RESUMEN"
              : mode === "stock"
                ? "03 / STOCK Y ALERTAS"
                : "02 / CATÁLOGO"}
          </span>
          <h1>
            {mode === "summary"
              ? "Todo bajo control."
              : mode === "stock"
                ? "Anticípate al límite."
                : "Productos con identidad."}
          </h1>
          <p>
            {mode === "summary"
              ? "Las cifras de tu almacén, conectadas a cada movimiento."
              : mode === "stock"
                ? "Cada producto tiene su propio mínimo y objetivo de reposición."
                : "Fotos, proveedores y existencias en un solo lugar."}
          </p>
        </div>
        <button className="primary" onClick={() => setForm(emptyProduct())}>
          + Nuevo producto
        </button>
      </div>
      {message && (
        <div className="notice success" role="status">
          <span>{message}</span>
          <button aria-label="Cerrar aviso" onClick={() => setMessage("")}>
            ×
          </button>
        </div>
      )}
      <div className="stats">
        {[
          ["Productos activos", items.length, "Referencias del catálogo"],
          ["Unidades", stats.units, "Existencias físicas"],
          [
            "Valor a costo",
            money(stats.cost),
            stats.unknownCost
              ? `${stats.unknownCost} productos sin costo: valor parcial`
              : "Costo de referencia × unidades",
          ],
          [
            "Stock en alerta",
            stats.low.length,
            "Según mínimo de cada producto",
          ],
        ].map(([label, note, hint]) => (
          <section className="stat" key={label}>
            <span>{label}</span>
            <strong>
              <span>{loading && !items.length ? "…" : note}</span>
            </strong>
            <small>{hint}</small>
          </section>
        ))}
      </div>
      {mode === "summary" ? (
        <>
          <Charts items={items} stats={stats} />
          <div className="summary-grid">
            <section className="panel padded">
              <h2>Tu siguiente paso</h2>
              <p>
                {stats.low.length
                  ? `${stats.low.length} productos necesitan revisar su reposición.`
                  : "No hay productos bajo su mínimo configurado."}
              </p>
              <Link className="primary" to="/reportes">
                Revisar reposición →
              </Link>
            </section>
            <section className="panel padded">
              <h2>Valor a precio de venta</h2>
              <strong className="large-number">{money(stats.retail)}</strong>
              <p>
                Precio actual × unidades. No representa ventas realizadas ni
                beneficio.
              </p>
            </section>
          </div>
        </>
      ) : (
        <>
          <section className="panel filters">
            <label className="search-label">
              Buscar
              <input
                type="search"
                placeholder="Nombre, SKU, marca o descripción"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </label>
            <label>
              Categoría
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="">Todas</option>
                {[...new Set(items.map((p) => p.categoria).filter(Boolean))]
                  .sort()
                  .map((c) => (
                    <option key={c}>{c}</option>
                  ))}
              </select>
            </label>
            <label>
              Ordenar
              <select value={sort} onChange={(e) => setSort(e.target.value)}>
                <option value="name">Nombre A–Z</option>
                <option value="stock">Menor stock</option>
                <option value="price">Menor precio</option>
              </select>
            </label>
            {mode === "stock" && (
              <label>
                Límite de consulta
                <input
                  aria-label="Límite de consulta"
                  type="number"
                  min="0"
                  max="2147483647"
                  step="1"
                  placeholder="Por producto"
                  value={limit}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (
                      v === "" ||
                      (/^\d+$/.test(v) && Number(v) <= 2147483647)
                    )
                      setLimit(v);
                  }}
                />
              </label>
            )}
            <div className="filter-actions">
              <button
                className="secondary"
                onClick={() =>
                  setView((v) => (v === "cards" ? "table" : "cards"))
                }
              >
                {view === "cards" ? "Vista tabla" : "Vista tarjetas"}
              </button>
              <button className="secondary" onClick={exportCSV}>
                Exportar CSV
              </button>
            </div>
          </section>
          {mode === "stock" && (
            <p className="hint">
              El límite de consulta filtra al instante; no modifica los mínimos
              guardados. Para cambiar una alerta, edita el mínimo del producto.
            </p>
          )}
          <p className="results" role="status">
            {filtered.length} {filtered.length === 1 ? "producto" : "productos"} {query && (filtered.length === 1 ? "encontrado" : "encontrados")}
          </p>
          {!filtered.length ? (
            <div className="panel empty-state">
              <h2>{loading ? "Cargando…" : "No hay productos para mostrar"}</h2>
              <p>Añade un producto o cambia los filtros.</p>
            </div>
          ) : view === "cards" ? (
            <div className="catalog-grid">
              {filtered.map((product) => (
                <article className="product-card" key={product.id}>
                  <button
                    className="image-button"
                    onClick={() => setDetail(product.id)}
                    aria-label={`Ver detalles de ${product.nombre}`}
                  >
                    <ProductImage product={product} />
                  </button>
                  <div className="product-card-body">
                    <div className="card-top">
                      <span className="sku">{product.sku}</span>
                      <span
                        className={`badge ${status(product) === "Agotado" ? "out" : low(product) ? "low" : "ok"}`}
                      >
                        {status(product)}
                      </span>
                    </div>
                    <h2>
                      <button
                        className="title-button"
                        onClick={() => setDetail(product.id)}
                      >
                        {product.nombre}
                      </button>
                    </h2>
                    <p>
                      {product.categoria || "Sin categoría"} ·{" "}
                      {product.marca || "Sin marca"}
                    </p>
                    <div className="card-numbers">
                      <strong>{money(product.precio)}</strong>
                      <span>
                        <b>{product.stock}</b> unidades
                      </span>
                    </div>
                    <div className="card-footer">
                      <button
                        className="secondary"
                        onClick={() => setForm({ ...product })}
                      >
                        Editar
                      </button>
                      <Link
                        className="text-button"
                        to={`/movimientos?producto=${product.id}`}
                      >
                        Movimiento →
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="panel table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Stock / mínimo</th>
                    <th>Precio</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((product) => (
                    <tr key={product.id}>
                      <td>
                        <button
                          className="product-cell"
                          onClick={() => setDetail(product.id)}
                        >
                          <ProductImage product={product} />
                          <span>
                            <b>{product.nombre}</b>
                            <small>{product.sku}</small>
                          </span>
                        </button>
                      </td>
                      <td>
                        {product.stock} / {product.minimo}
                      </td>
                      <td>{money(product.precio)}</td>
                      <td>{status(product)}</td>
                      <td>
                        <button
                          className="secondary"
                          onClick={() => setForm({ ...product })}
                        >
                          Editar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
      {form && (
        <ProductForm
          key={form.id || "new"}
          product={form}
          onClose={(saved) => {
            setForm(null);
            if (saved)
              setMessage(
                "Producto guardado. Las cifras ya están actualizadas.",
              );
          }}
        />
      )}
      {p && (
        <Modal title={p.nombre} onClose={() => setDetail(null)}>
          <div className="detail-photo">
            <ProductImage product={p} />
          </div>
          <p>{p.descripcion || "Sin descripción."}</p>
          <dl className="details-grid">
            {[
              ["SKU", p.sku],
              ["Categoría", p.categoria],
              ["Marca", p.marca],
              ["Stock", p.stock],
              ["Mínimo", p.minimo],
              ["Objetivo", p.objetivo],
              ["Precio", money(p.precio)],
              ["Costo", p.costo == null ? "Sin registrar" : money(p.costo)],
              ["Ubicación", p.ubicacion],
              ["Plazo", `${p.plazoDias} días`],
              [
                "Proveedor",
                suppliers.find((s) => s.id === p.proveedorId)?.empresa,
              ],
            ].map(([k, v]) => (
              <div key={k}>
                <dt>{k}</dt>
                <dd>{v ?? "Sin registrar"}</dd>
              </div>
            ))}
          </dl>
          <div className="modal-actions">
            <Link className="primary" to={`/movimientos?producto=${p.id}`}>
              Ver movimientos
            </Link>
            {admin && (
              <button
                className="secondary danger"
                disabled={Number(p.stock) !== 0}
                onClick={() => {
                  setDetail(null);
                  setRemove(p);
                  setError("");
                }}
              >
                Archivar
              </button>
            )}
          </div>
          <p className="hint">
            Solo se archivan productos sin existencias. El historial permanece
            disponible.
          </p>
        </Modal>
      )}
      {remove && (
        <Modal
          title="Archivar producto"
          onClose={() => !busy && setRemove(null)}
        >
          <p>
            Se ocultará {remove.nombre} del catálogo activo. No se borrará su
            historial.
          </p>
          {error && (
            <div className="notice error" role="alert">
              {error}
            </div>
          )}
          <div className="modal-actions">
            <button
              className="secondary"
              disabled={busy}
              onClick={() => setRemove(null)}
            >
              Cancelar
            </button>
            <button className="primary" disabled={busy} onClick={doArchive}>
              Archivar producto
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
