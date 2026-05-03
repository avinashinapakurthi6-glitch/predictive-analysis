import { ForecastResult } from "../hooks/useForecaster";

function fmt(n: number, d = 2) {
  return n.toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d });
}

export default function ForecastTable({ result }: { result: ForecastResult }) {
  const { chosen, forecastDates, ci, series } = result;
  const lastActual = series[series.length - 1].value;
  return (
    <div className="card">
      <h3>Forecast</h3>
      <table>
        <thead>
          <tr>
            <th>Period</th>
            <th>Value</th>
            <th>95% CI</th>
            <th>% vs last actual</th>
          </tr>
        </thead>
        <tbody>
          {chosen.forecast.map((v, i) => {
            const half = ci.half[i];
            const pct = lastActual === 0 ? 0 : ((v - lastActual) / Math.abs(lastActual)) * 100;
            return (
              <tr key={i}>
                <td>{forecastDates[i].toISOString().slice(0, 10)}</td>
                <td>{fmt(v)}</td>
                <td className="muted">{fmt(v - half)} – {fmt(v + half)}</td>
                <td style={{ color: pct >= 0 ? "var(--green)" : "var(--red)" }}>
                  {pct >= 0 ? "+" : ""}{fmt(pct, 1)}%
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
