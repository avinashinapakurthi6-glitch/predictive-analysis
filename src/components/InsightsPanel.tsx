import { ForecastResult } from "../hooks/useForecaster";

export default function InsightsPanel({ result }: { result: ForecastResult }) {
  const { metrics, chosen, series, residuals } = result;
  const lastActual = series[series.length - 1].value;
  const forecastEnd = chosen.forecast[chosen.forecast.length - 1];
  const pct = lastActual === 0 ? 0 : ((forecastEnd - lastActual) / Math.abs(lastActual)) * 100;
  const trendDir = pct > 2 ? "upward" : pct < -2 ? "downward" : "flat";

  const fitQuality =
    metrics.r2 >= 0.8 ? "strong" : metrics.r2 >= 0.5 ? "moderate" : "weak";

  const stdRes = Math.sqrt(residuals.reduce((s, r) => s + r * r, 0) / residuals.length);
  const meanAbs = series.reduce((s, p) => s + Math.abs(p.value), 0) / series.length;
  const volRatio = meanAbs === 0 ? 0 : stdRes / meanAbs;
  const volatility =
    volRatio < 0.1 ? "low" : volRatio < 0.25 ? "moderate" : "high";

  const mapeNote =
    metrics.mape < 10 ? "highly accurate"
    : metrics.mape < 20 ? "reasonably accurate"
    : metrics.mape < 50 ? "loose"
    : "unreliable";

  const insights = [
    `${chosen.name} produced a ${fitQuality} fit (R² = ${metrics.r2.toFixed(3)}).`,
    `The forecast trend is ${trendDir}, ending at ${forecastEnd.toFixed(2)} (${pct >= 0 ? "+" : ""}${pct.toFixed(1)}% vs last actual).`,
    `Residual volatility is ${volatility} (${(volRatio * 100).toFixed(1)}% of mean).`,
    `MAPE of ${metrics.mape.toFixed(1)}% indicates a ${mapeNote} model.`,
  ];

  return (
    <div className="card">
      <h3>Insights</h3>
      <div className="insights">
        {insights.map((s, i) => <p key={i}>{s}</p>)}
      </div>
    </div>
  );
}
