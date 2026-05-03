import { useRef, useState } from "react";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { generateSample } from "../utils/preprocess";

type Props = {
  onLoaded: (rows: Record<string, any>[], suggested?: { dateCol?: string; valueCol?: string }) => void;
};

export default function ImportScreen({ onLoaded }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    setError(null);
    const name = file.name.toLowerCase();
    try {
      if (name.endsWith(".csv")) {
        Papa.parse<Record<string, any>>(file, {
          header: true,
          dynamicTyping: true,
          skipEmptyLines: true,
          complete: (res) => {
            if (!res.data.length) { setError("No rows found in CSV"); return; }
            onLoaded(res.data);
          },
          error: (err) => setError(err.message),
        });
      } else if (name.endsWith(".xlsx") || name.endsWith(".xls")) {
        const buf = await file.arrayBuffer();
        const wb = XLSX.read(buf, { type: "array", cellDates: true });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json<Record<string, any>>(ws, { defval: null });
        if (!rows.length) { setError("No rows found in worksheet"); return; }
        onLoaded(rows);
      } else {
        setError("Unsupported file type. Use CSV or XLSX.");
      }
    } catch (e: any) {
      setError(e?.message || "Failed to parse file");
    }
  };

  return (
    <div>
      <div className="header">
        <div>
          <h1>Predictive Trend Forecasting</h1>
          <div className="sub">Upload time-series data — get fitted models, forecasts, and insights.</div>
        </div>
      </div>

      <div
        className={`dropzone ${over ? "over" : ""}`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setOver(true); }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          const f = e.dataTransfer.files[0];
          if (f) handleFile(f);
        }}
      >
        <h3>Drop CSV or XLSX here</h3>
        <div className="muted small">or click to browse</div>
        <input
          ref={inputRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        />
      </div>

      {error && <p style={{ color: "var(--red)", marginTop: "1rem" }}>{error}</p>}

      <div style={{ marginTop: "1.5rem", display: "flex", gap: "0.75rem", alignItems: "center" }}>
        <button
          className="primary"
          onClick={() => {
            const { rows } = generateSample();
            onLoaded(rows, { dateCol: "date", valueCol: "sales" });
          }}
        >
          Load sample data
        </button>
        <span className="muted small">36 months of synthetic monthly sales</span>
      </div>
    </div>
  );
}
