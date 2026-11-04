import { Link } from "react-router-dom";
import { useInventory } from "../context/Inventory";
import { analytics, money, downloadCSV } from "../services/analytics";
export default function Reports() {
  const { items, moves, suppliers } = useInventory(),
    a = analytics(items, moves);
  const recommendations = a.recommendations
    .slice()
    .sort((x, y) => y.suggested - x.suggested);
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">06 / REPOSICIÓN Y REPORTES</span>
          <h1>Decide con contexto.</h1>
          <p>Demanda registrada, disponibilidad y capital en existencias.</p>
        </div>
        <button
          className="secondary"
          onClick={() =>
            downloadCSV("nexo-reposicion.csv", [
              [
                "SKU",
                "Producto",
                "Stock",
                "Ventas 30d",
                "Punto reposición",
                "Sugerencia",
                "Costo unitario",
              ],
              ...recommendations.map((p) => [
                p.sku,
                p.nombre,
                p.stock,
                p.sales30,
                p.trigger,
                p.suggested,
                p.costo,
              ]),
            ])
          }
        >
          Exportar propuesta
        </button>
      </div>
      <div className="notice info">
        Las propuestas son orientativas. Revisa pedidos pendientes, presupuesto
        y plazos antes de comprar. Este módulo todavía no gestiona órdenes de
        compra.
      </div>
      {moves.length >= 5000 && (
        <div className="notice error" role="alert">
          Se alcanzó el límite de 5.000 movimientos cargados. Los indicadores
          históricos pueden ser parciales; no uses esta propuesta para decidir
          compras sin consultar el historial completo.
        </div>
      )}
      <div className="stats">
        <section className="stat">
          <span>Unidades vendidas</span>
          <strong>{a.salesUnits}</strong>
          <small>Últimos 30 días registrados</small>
        </section>
        <section className="stat">
          <span>Importe de ventas</span>
          <strong>{money(a.salesValue)}</strong>
          <small>Sin impuestos ni devoluciones calculados</small>
        </section>
        <section className="stat">
          <span>Productos a revisar</span>
          <strong>
            {recommendations.filter((p) => p.suggested > 0).length}
          </strong>
          <small>Según punto de reposición</small>
        </section>
        <section className="stat">
          <span>Sin ventas en 30 días</span>
          <strong>{recommendations.filter((p) => !p.sales30).length}</strong>
          <small>No implica baja demanda por sí solo</small>
        </section>
      </div>
      <section className="panel table-wrap">
        <table>
          <thead>
            <tr>
              <th>Producto</th>
              <th>Stock</th>
              <th>Ventas 30 d</th>
              <th>Cobertura</th>
              <th>Punto de reposición</th>
              <th>Compra sugerida</th>
              <th>Proveedor</th>
            </tr>
          </thead>
          <tbody>
            {recommendations.map((p) => (
              <tr key={p.id}>
                <td>
                  <b>{p.nombre}</b>
                  <small>{p.sku}</small>
                </td>
                <td>{p.stock}</td>
                <td>{p.sales30}</td>
                <td>
                  {p.coverage == null
                    ? "Sin historial de ventas"
                    : `${p.coverage.toFixed(1)} días`}
                </td>
                <td>{p.trigger}</td>
                <td>
                  <b>{p.suggested} unidades</b>
                  <small>
                    {p.costo == null
                      ? "Sin costo de referencia"
                      : money(p.suggested * Number(p.costo))}
                  </small>
                </td>
                <td>
                  {suppliers.find((s) => s.id === p.proveedorId)?.empresa ||
                    "Sin asignar"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <section className="panel padded formula">
        <h2>Cómo leer esta propuesta</h2>
        <ul>
          <li>
            Demanda diaria = unidades registradas como venta en los últimos 30
            días / 30.
          </li>
          <li>
            Punto de reposición = demanda diaria × plazo de entrega + stock
            mínimo (reserva de seguridad).
          </li>
          <li>
            Cuando el stock llega al punto, la propuesta cubre hasta el mayor
            valor entre objetivo y punto de reposición.
          </li>
          <li>
            La cobertura estima cuántos días duraría el stock al ritmo
            registrado. No considera estacionalidad ni demanda no atendida.
          </li>
          <li>
            Las aperturas, recepciones, ajustes y otras salidas no se
            interpretan como ventas. Con menos de 30 días de registro la
            estimación puede infravalorar la demanda.
          </li>
        </ul>
        <p>
          El costo es una referencia editable: esta versión no implementa
          valoración contable FIFO ni costo promedio ponderado.
        </p>
        <Link className="text-button" to="/movimientos">
          Registrar ventas y recepciones →
        </Link>
      </section>
    </>
  );
}
