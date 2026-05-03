import { ForecastResult } from "../hooks/useForecaster";

function fmt(n: number, d = 2) {
  if (!isFinite(n)) return "—";
  return n.toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d });
}

export default function KPIRow({ result }: { result: ForecastResult }) {
  const { metrics, series, chosen } = result;
  const r2Class = metrics.r2 >= 0.8 ? "green" : metrics.r2 >= 0.5 ? "amber" : "red";
  const lastActual = series[series.length - 1].value;
  const forecastEnd = chosen.forecast[chosen.forecast.length - 1];
  const pct = lastActual === 0 ? 0 : ((forecastEnd - lastActual) / Math.abs(lastActual)) * 100;

  return (
    <div className="kpi-row">
      <div className={`kpi ${r2Class}`}>
        <div className="label">R²</div>
        <div className="value">{fmt(metrics.r2, 3)}</div>
        <div className="sub">Goodness of fit</div>
      </div>
      <div className="kpi">
        <div className="label">RMSE</div>
        <div className="value">{fmt(metrics.rmse)}</div>
      </div>
      <div className="kpi">
        <div className="label">MAE</div>
        <div className="value">{fmt(metrics.mae)}</div>
      </div>
      <div className="kpi">
        <div className="label">MAPE</div>
        <div className="value">{fmt(metrics.mape, 1)}%</div>
      </div>
      <div className="kpi">
        <div className="label">Forecast end</div>
        <div className="value">{fmt(forecastEnd)}</div>
        <div className="sub" style={{ color: pct >= 0 ? "var(--green)" : "var(--red)" }}>
          {pct >= 0 ? "▲" : "▼"} {fmt(Math.abs(pct), 1)}%
        </div>
      </div>
      <div className="kpi">
        <div className="label">Records</div>
        <div className="value">{series.length}</div>
      </div>
    </div>
  );
}
