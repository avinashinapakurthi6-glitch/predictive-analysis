import { ForecastResult } from "../hooks/useForecaster";
import KPIRow from "./KPIRow";
import MainChart from "./MainChart";
import ResidualChart from "./ResidualChart";
import ComparisonChart from "./ComparisonChart";
import ForecastTable from "./ForecastTable";
import PrepLog from "./PrepLog";
import InsightsPanel from "./InsightsPanel";

type Props = {
  result: ForecastResult;
  onRestart: () => void;
  onReconfigure: () => void;
};

export default function Dashboard({ result, onRestart, onReconfigure }: Props) {
  return (
    <div>
      <div className="header">
        <div>
          <h1>Forecast Dashboard</h1>
          <div className="sub">{result.chosen.name} · {result.chosen.forecast.length} period horizon</div>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button onClick={onReconfigure}>Reconfigure</button>
          <button onClick={onRestart}>Start over</button>
        </div>
      </div>

      <KPIRow result={result} />

      <div className="dashboard-grid">
        <div className="col">
          <MainChart result={result} />
          <ResidualChart result={result} />
          <ComparisonChart result={result} />
        </div>
        <div className="col">
          <InsightsPanel result={result} />
          <ForecastTable result={result} />
          <PrepLog result={result} />
        </div>
      </div>
    </div>
  );
}
