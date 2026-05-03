import { ForecastResult } from "../hooks/useForecaster";

export default function PrepLog({ result }: { result: ForecastResult }) {
  return (
    <div className="card">
      <h3>Preprocessing Log</h3>
      <ul className="log-list">
        {result.log.map((e, i) => (
          <li key={i} className={e.kind}>
            {e.kind === "ok" ? "✓" : "⚠"} {e.message}
          </li>
        ))}
      </ul>
    </div>
  );
}
