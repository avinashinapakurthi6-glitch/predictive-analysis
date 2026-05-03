import { useEffect, useMemo, useState } from "react";
import { detectColumns } from "../utils/preprocess";
import { ModelKey, MODEL_LABELS } from "../utils/models";

type Props = {
  rows: Record<string, any>[];
  initial?: { dateCol?: string; valueCol?: string };
  onBack: () => void;
  onRun: (dateCol: string, valueCol: string, model: ModelKey, horizon: number) => void;
};

const MODEL_DESCRIPTIONS: Record<ModelKey, string> = {
  linear: "Closed-form least squares.",
  polynomial: "Cubic curve via normal equations.",
  exponential: "Log-linear growth model.",
  movingAverage: "Window mean + slope projection.",
  holts: "Level + trend smoothing (α=0.3, β=0.2).",
  auto: "Run all 5, pick lowest RMSE.",
};

export default function ConfigScreen({ rows, initial, onBack, onRun }: Props) {
  const detected = useMemo(() => detectColumns(rows), [rows]);
  const [dateCol, setDateCol] = useState<string>(initial?.dateCol || detected.dateCols[0] || "");
  const [valueCol, setValueCol] = useState<string>(initial?.valueCol || detected.numericCols[0] || "");
  const [model, setModel] = useState<ModelKey>("auto");
  const [horizon, setHorizon] = useState(12);

  useEffect(() => {
    if (!dateCol && detected.dateCols.length) setDateCol(detected.dateCols[0]);
    if (!valueCol && detected.numericCols.length) setValueCol(detected.numericCols[0]);
  }, [detected, dateCol, valueCol]);

  const allCols = rows.length ? Object.keys(rows[0]) : [];
  const dateOptions = detected.dateCols.length ? detected.dateCols : allCols;
  const valueOptions = detected.numericCols.length ? detected.numericCols : allCols;

  const canRun = dateCol && valueCol;

  return (
    <div>
      <div className="header">
        <div>
          <h1>Configure Forecast</h1>
          <div className="sub">{rows.length} rows loaded · pick columns and a model</div>
        </div>
        <button onClick={onBack}>← Back</button>
      </div>

      <div className="card" style={{ marginBottom: "1rem" }}>
        <h4>Date column</h4>
        <div className="col-toggles">
          {dateOptions.map((c) => (
            <button key={c} className={`toggle ${dateCol === c ? "active" : ""}`} onClick={() => setDateCol(c)}>
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="card" style={{ marginBottom: "1rem" }}>
        <h4>Value column</h4>
        <div className="col-toggles">
          {valueOptions.map((c) => (
            <button key={c} className={`toggle ${valueCol === c ? "active" : ""}`} onClick={() => setValueCol(c)}>
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="card" style={{ marginBottom: "1rem" }}>
        <h4>Model</h4>
        <div className="model-grid">
          {(Object.keys(MODEL_LABELS) as ModelKey[]).map((k) => (
            <button
              key={k}
              className={`model-card ${model === k ? "active" : ""}`}
              onClick={() => setModel(k)}
            >
              <div className="name">{MODEL_LABELS[k]}</div>
              <div className="desc">{MODEL_DESCRIPTIONS[k]}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="card" style={{ marginBottom: "1rem" }}>
        <h4>Forecast horizon: {horizon} period{horizon !== 1 ? "s" : ""}</h4>
        <input type="range" min={1} max={24} value={horizon} onChange={(e) => setHorizon(+e.target.value)} />
      </div>

      <button className="primary" disabled={!canRun} onClick={() => onRun(dateCol, valueCol, model, horizon)}>
        Run Forecast →
      </button>
    </div>
  );
}
