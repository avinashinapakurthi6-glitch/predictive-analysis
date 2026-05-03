import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import ImportScreen from "../components/ImportScreen";
import ConfigScreen from "../components/ConfigScreen";
import Dashboard from "../components/Dashboard";
import { useForecaster } from "../hooks/useForecaster";
import type { ModelKey } from "../utils/models";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Predictive Trend Forecasting" },
      { name: "description", content: "Upload time-series data and forecast trends with 5 statistical models." },
    ],
  }),
  component: Index,
});

type Screen = "import" | "config" | "dashboard";

function Index() {
  const [screen, setScreen] = useState<Screen>("import");
  const [rows, setRows] = useState<Record<string, any>[] | null>(null);
  const [suggested, setSuggested] = useState<{ dateCol?: string; valueCol?: string } | undefined>();
  const [dateCol, setDateCol] = useState<string | null>(null);
  const [valueCol, setValueCol] = useState<string | null>(null);
  const [model, setModel] = useState<ModelKey>("auto");
  const [horizon, setHorizon] = useState(12);

  const result = useForecaster(rows, dateCol, valueCol, model, horizon);

  return (
    <div className="app">
      {screen === "import" && (
        <ImportScreen
          onLoaded={(r, s) => {
            setRows(r);
            setSuggested(s);
            setScreen("config");
          }}
        />
      )}
      {screen === "config" && rows && (
        <ConfigScreen
          rows={rows}
          initial={suggested}
          onBack={() => setScreen("import")}
          onRun={(d, v, m, h) => {
            setDateCol(d); setValueCol(v); setModel(m); setHorizon(h);
            setScreen("dashboard");
          }}
        />
      )}
      {screen === "dashboard" && result && (
        <Dashboard
          result={result}
          onRestart={() => { setRows(null); setDateCol(null); setValueCol(null); setScreen("import"); }}
          onReconfigure={() => setScreen("config")}
        />
      )}
      {screen === "dashboard" && !result && (
        <div className="card">
          <h3>Not enough data</h3>
          <p className="muted">Need at least 4 valid points after preprocessing.</p>
          <button onClick={() => setScreen("config")}>Back</button>
        </div>
      )}
    </div>
  );
}
