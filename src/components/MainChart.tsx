import { useState } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS, LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Filler,
} from "chart.js";
import { ForecastResult } from "../hooks/useForecaster";

ChartJS.register(LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Filler);

function fmtDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

export default function MainChart({ result }: { result: ForecastResult }) {
  const [showCI, setShowCI] = useState(true);
  const [showResid, setShowResid] = useState(false);
  const { series, chosen, forecastDates, ci, residuals } = result;

  const histLabels = series.map((p) => fmtDate(p.date));
  const fcLabels = forecastDates.map(fmtDate);
  const labels = [...histLabels, ...fcLabels];
  const n = series.length;
  const h = chosen.forecast.length;

  const historical: (number | null)[] = [...series.map((p) => p.value), ...new Array(h).fill(null)];
  const fitted: (number | null)[] = [...chosen.fitted, ...new Array(h).fill(null)];
  const forecast: (number | null)[] = [...new Array(n - 1).fill(null), chosen.fitted[n - 1] ?? series[n - 1].value, ...chosen.forecast];
  const upper: (number | null)[] = [...new Array(n).fill(null), ...chosen.forecast.map((v, i) => v + ci.half[i])];
  const lower: (number | null)[] = [...new Array(n).fill(null), ...chosen.forecast.map((v, i) => v - ci.half[i])];
  const resOverlay: (number | null)[] = showResid ? [...residuals, ...new Array(h).fill(null)] : [];

  const data = {
    labels,
    datasets: [
      {
        label: "Historical",
        data: historical,
        borderColor: "#1a4a7a",
        backgroundColor: "rgba(26,74,122,0.12)",
        fill: true,
        tension: 0.25,
        pointRadius: 2,
        borderWidth: 2,
      },
      {
        label: "Fitted",
        data: fitted,
        borderColor: "#1a6b3c",
        borderDash: [4, 4],
        borderWidth: 1.5,
        pointRadius: 0,
        fill: false,
        tension: 0.25,
      },
      {
        label: "Forecast",
        data: forecast,
        borderColor: "#c0392b",
        borderDash: [6, 4],
        borderWidth: 2,
        pointRadius: 2,
        fill: false,
        tension: 0.25,
      },
      ...(showCI
        ? [
            {
              label: "CI Upper",
              data: upper,
              borderColor: "rgba(192,57,43,0.0)",
              backgroundColor: "rgba(192,57,43,0.15)",
              pointRadius: 0,
              fill: "+1",
              tension: 0.25,
            },
            {
              label: "CI Lower",
              data: lower,
              borderColor: "rgba(192,57,43,0.0)",
              pointRadius: 0,
              fill: false,
              tension: 0.25,
            },
          ]
        : []),
      ...(showResid
        ? [
            {
              label: "Residuals",
              data: resOverlay,
              borderColor: "rgba(107,102,96,0.6)",
              borderWidth: 1,
              pointRadius: 0,
              fill: false,
            },
          ]
        : []),
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { mode: "index" as const, intersect: false } },
    scales: {
      x: { grid: { color: "rgba(0,0,0,0.04)" }, ticks: { maxTicksLimit: 10, font: { family: "IBM Plex Mono" } } },
      y: { grid: { color: "rgba(0,0,0,0.04)" }, ticks: { font: { family: "IBM Plex Mono" } } },
    },
    interaction: { mode: "nearest" as const, axis: "x" as const, intersect: false },
  };

  return (
    <div className="card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "0.5rem" }}>
        <h3>{chosen.name}</h3>
        <div className="toolbar">
          <button className={`toggle ${showCI ? "active" : ""}`} onClick={() => setShowCI((v) => !v)}>95% CI</button>
          <button className={`toggle ${showResid ? "active" : ""}`} onClick={() => setShowResid((v) => !v)}>Residuals</button>
        </div>
      </div>
      <div className="legend">
        <span><i style={{ background: "#1a4a7a" }} /> Historical</span>
        <span><i className="dashed" style={{ background: "repeating-linear-gradient(90deg,#1a6b3c 0 4px,transparent 4px 7px)" }} /> Fitted</span>
        <span><i className="dashed" style={{ background: "repeating-linear-gradient(90deg,#c0392b 0 4px,transparent 4px 7px)" }} /> Forecast</span>
        {showCI && <span><i className="fill" style={{ background: "rgba(192,57,43,0.2)" }} /> 95% CI</span>}
      </div>
      <div className="chart-wrap">
        <Line data={data} options={options as any} />
      </div>
    </div>
  );
}
