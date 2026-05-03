## Predictive Trend Forecasting App

A client-side forecasting tool that takes time-series data (CSV/XLSX or synthetic sample), fits 5 statistical models in pure JS, and renders a dashboard with charts, KPIs, residuals, model comparison, forecast table, and auto-generated insights.

### Stack note
The project runs on TanStack Start (React 19 + Vite 7), not Vite 5/CRA — but `npm install && npm run dev` already works, and Chart.js / PapaParse / xlsx are framework-agnostic. I'll keep the requested folder layout under `src/` and mount the app from a single TanStack route (`src/routes/index.tsx`), so the spec is preserved end-to-end.

### Screens (managed by `App` state, rendered from index route)
1. **Import** — drag-and-drop zone, file picker, "Load sample data" button (36 months synthetic: linear trend + 12-month seasonality + Gaussian noise).
2. **Config** — auto-detected date column(s) and numeric column(s) shown as toggle chips; 6 model cards (Linear, Polynomial deg-3, Exponential, Moving Average, Holt's, Auto Best-Fit); horizon slider 1–24; Run.
3. **Dashboard** — KPI row, main chart, residual chart, comparison chart, forecast table, prep log, insights panel; "Start over" returns to Import.

### Components
- `ImportScreen` — drop zone, parse CSV via PapaParse, XLSX via `xlsx`, sample generator
- `ConfigScreen` — column toggles, model selector cards, horizon slider
- `Dashboard` — layout grid hosting the panels below
- `KPIRow` — R² (color-coded ≥0.8 green / ≥0.5 amber / else red), RMSE, MAE, MAPE, forecast end + %Δ, record count
- `MainChart` — historical (navy filled), fitted (dashed green), forecast (dashed red), CI band (transparent red); toggles for CI / residual overlay
- `ResidualChart` — bar chart, green ≥0 / red <0, counts above & below fit
- `ComparisonChart` — horizontal bars of RMSE per model, winner red, others grey
- `ForecastTable` — Period, Value, 95% CI low–high, % change vs last actual
- `PrepLog` — ✓ green / ⚠ amber entries from preprocessing
- `InsightsPanel` — 4 generated sentences (fit quality, trend direction, volatility, MAPE interpretation)

### Hook
- `useForecaster` — owns series, config, results; runs preprocess → selected model(s) → metrics → forecast + CI.

### Utils (pure JS, no ML libs)
- `preprocess.js` — multi-format date parser (ISO, `MM/DD/YYYY`, `DD/MM/YYYY`, `YYYY-MM`, Excel serial), drop unparseable, sort asc, IQR×3 outlier flag (keep + log), dedupe dates keep-last → `{series, log}`
- `models.js`
  - Linear: closed-form least squares
  - Polynomial deg-3: Gaussian elimination on normal equations
  - Exponential: log-transform → linear fit → `exp`
  - Moving Average: window = `min(6, n/3)`, project last mean + slope
  - Holt's Double Exponential: α=0.3, β=0.2
  - Auto: run all 5, return one with lowest RMSE
- `metrics.js` — R², RMSE, MAE, MAPE, residuals, 95% CI = `RMSE × 1.96 × √(1 + i × 0.15)`

### Styling (`src/styles.css`, replacing current Tailwind theme block at bottom with overrides)
- CSS vars: `--bg:#f5f2ed --surface:#fffef9 --ink:#1a1814 --red:#c0392b --green:#1a6b3c --blue:#1a4a7a --border:#d9d4c7`
- Google Fonts: Instrument Serif (headings), IBM Plex Mono (body)
- Cards: 1px border, 4px radius, no shadows
- Responsive: single column < 600px
- All Chart.js legends disabled; custom HTML legends in components

### Technical notes
- Add deps: `chart.js`, `react-chartjs-2`, `papaparse`, `xlsx`
- Mount the whole app in `src/routes/index.tsx` (replaces placeholder); `__root.tsx` already provides shell. No SSR-only code in components — file parsing and Chart.js render client-side via `useState`/`useEffect` guards.
- Files use `.tsx`/`.ts` to satisfy strict TS (logic identical to the requested `.jsx`/`.js`).

### Deliverables
Every file written with full content:
`src/routes/index.tsx`, `src/components/{ImportScreen,ConfigScreen,Dashboard,KPIRow,MainChart,ResidualChart,ComparisonChart,ForecastTable,PrepLog,InsightsPanel}.tsx`, `src/hooks/useForecaster.ts`, `src/utils/{preprocess,models,metrics}.ts`, updated `src/styles.css`.