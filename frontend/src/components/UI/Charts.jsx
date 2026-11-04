export default function Charts({ items, stats }) {
  const top = items
      .slice()
      .sort((a, b) => Number(b.stock) - Number(a.stock))
      .slice(0, 6),
    max = Math.max(1, ...top.map((p) => Number(p.stock)));
  const counts = [
    items.filter((p) => Number(p.stock) > p.minimo).length,
    items.filter((p) => Number(p.stock) > 0 && Number(p.stock) <= p.minimo)
      .length,
    items.filter((p) => Number(p.stock) === 0).length,
  ];
  const colors = ["#25b799", "#e6aa32", "#ff4166"];
  let offset = 0;
  const total = items.length;
  const series = stats.series,
    scale = Math.max(1, ...series.map((s) => Math.max(s.in, s.out)));
  return (
    <div className="chart-grid">
      <section className="panel chart">
        <div className="panel-heading">
          <h2>Disponibilidad</h2>
          <span className="eyebrow">EN ESTE MOMENTO</span>
        </div>
        <div className="donut-layout">
          <svg
            viewBox="0 0 120 120"
            role="img"
            aria-label={`Disponibles ${counts[0]}, stock bajo ${counts[1]}, agotados ${counts[2]}`}
          >
            <circle
              cx="60"
              cy="60"
              r="45"
              fill="none"
              stroke="var(--line)"
              strokeWidth="13"
            />
            {counts.map((n, i) => {
              const length = total ? (n / total) * 100 : 0,
                o = offset;
              offset += length;
              return (
                <circle
                  key={i}
                  cx="60"
                  cy="60"
                  r="45"
                  fill="none"
                  stroke={colors[i]}
                  strokeWidth="13"
                  pathLength="100"
                  strokeDasharray={`${length} ${100 - length}`}
                  strokeDashoffset={-o}
                  transform="rotate(-90 60 60)"
                />
              );
            })}
            <text
              x="60"
              y="59"
              textAnchor="middle"
              fill="currentColor"
              fontSize="23"
              fontWeight="700"
            >
              {total}
            </text>
            <text
              x="60"
              y="75"
              textAnchor="middle"
              fill="currentColor"
              fontSize="9"
            >
              productos
            </text>
          </svg>
          <ul className="legend">
            {["Disponible", "Stock bajo", "Agotado"].map((s, i) => (
              <li key={s}>
                <i style={{ background: colors[i] }} />
                <span>{s}</span>
                <b>{counts[i]}</b>
              </li>
            ))}
          </ul>
        </div>
      </section>
      <section className="panel chart">
        <div className="panel-heading">
          <h2>Existencias por producto</h2>
          <span className="eyebrow">TOP 6</span>
        </div>
        {!top.length ? (
          <p>Añade tu primer producto para ver la distribución.</p>
        ) : (
          top.map((p) => (
            <div className="bar-row" key={p.id}>
              <span title={p.nombre}>{p.nombre}</span>
              <div className="bar-track">
                <i style={{ width: `${(Number(p.stock) / max) * 100}%` }} />
              </div>
              <b>{p.stock}</b>
            </div>
          ))
        )}
      </section>
      <section className="panel chart wide">
        <div className="panel-heading">
          <h2>Entradas y salidas</h2>
          <span className="hint">Últimos 14 días · fechas UTC · unidades</span>
        </div>
        <div
          className="timeline"
          role="img"
          aria-label="Comparación diaria de entradas y salidas de unidades"
        >
          {series.map((s) => (
            <div
              className="day"
              key={s.day}
              title={`${s.day}: ${s.in} entradas / ${s.out} salidas`}
            >
              <div className="day-bars">
                <i
                  className="in"
                  style={{ height: `${(s.in / scale) * 100}%` }}
                />
                <i
                  className="out"
                  style={{ height: `${(s.out / scale) * 100}%` }}
                />
              </div>
              <span>{s.day.slice(8)}</span>
            </div>
          ))}
        </div>
        <p className="hint">
          <span className="dot in" /> Entradas <span className="dot out" />{" "}
          Ventas y otras salidas. No incluye aperturas ni ajustes.
        </p>
        <details>
          <summary>Ver datos de la gráfica</summary>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Fecha UTC</th>
                  <th>Entradas</th>
                  <th>Salidas</th>
                </tr>
              </thead>
              <tbody>
                {series.map((s) => (
                  <tr key={s.day}>
                    <td>{s.day}</td>
                    <td>{s.in}</td>
                    <td>{s.out}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      </section>
    </div>
  );
}
