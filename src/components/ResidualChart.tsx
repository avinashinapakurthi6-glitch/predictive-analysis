import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, BarElement, CategoryScale, LinearScale, Tooltip } from "chart.js";
import { ForecastResult } from "../hooks/useForecaster";

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip);

export default function ResidualChart({ result }: { result: ForecastResult }) {
  const { residuals, series } = result;
  const above = residuals.filter((r) => r >= 0).length;
  const below = residuals.length - above;
  const data = {
    labels: series.map((p) => p.date.toISOString().slice(0, 10)),
    datasets: [
      {
        label: "Residual",
        data: residuals,
        backgroundColor: residuals.map((r) => (r >= 0 ? "#1a6b3c" : "#c0392b")),
        borderWidth: 0,
      },
    ],
  };
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { display: false }, ticks: { maxTicksLimit: 8, font: { family: "IBM Plex Mono" } } },
      y: { grid: { color: "rgba(0,0,0,0.04)" }, ticks: { font: { family: "IBM Plex Mono" } } },
    },
  };
  return (
    <div className="card">
      <h3>Residuals</h3>
      <div className="legend">
        <span><i className="fill" style={{ background: "#1a6b3c" }} /> Above fit ({above})</span>
        <span><i className="fill" style={{ background: "#c0392b" }} /> Below fit ({below})</span>
      </div>
      <div className="chart-wrap short">
        <Bar data={data} options={options as any} />
      </div>
    </div>
  );
}
