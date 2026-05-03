import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, BarElement, CategoryScale, LinearScale, Tooltip } from "chart.js";
import { ForecastResult } from "../hooks/useForecaster";

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip);

export default function ComparisonChart({ result }: { result: ForecastResult }) {
  const { all, chosen } = result;
  const sorted = [...all].sort((a, b) => a.rmse - b.rmse);
  const data = {
    labels: sorted.map((m) => m.name),
    datasets: [
      {
        label: "RMSE",
        data: sorted.map((m) => m.rmse),
        backgroundColor: sorted.map((m) => (m.key === chosen.key ? "#c0392b" : "#bcb6a8")),
        borderWidth: 0,
      },
    ],
  };
  const options = {
    indexAxis: "y" as const,
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { color: "rgba(0,0,0,0.04)" }, ticks: { font: { family: "IBM Plex Mono" } } },
      y: { grid: { display: false }, ticks: { font: { family: "IBM Plex Mono" } } },
    },
  };
  return (
    <div className="card">
      <h3>Model Comparison (RMSE)</h3>
      <div className="legend">
        <span><i className="fill" style={{ background: "#c0392b" }} /> Selected</span>
        <span><i className="fill" style={{ background: "#bcb6a8" }} /> Others</span>
      </div>
      <div className="chart-wrap short">
        <Bar data={data} options={options as any} />
      </div>
    </div>
  );
}
