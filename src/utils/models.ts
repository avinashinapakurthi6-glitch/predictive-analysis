import { rmse } from "./metrics";

export type ModelKey = "linear" | "polynomial" | "exponential" | "movingAverage" | "holts" | "auto";

export type ModelResult = {
  key: ModelKey;
  name: string;
  fitted: number[];
  forecast: number[];
  rmse: number;
};

export const MODEL_LABELS: Record<ModelKey, string> = {
  linear: "Linear",
  polynomial: "Polynomial deg-3",
  exponential: "Exponential",
  movingAverage: "Moving Average",
  holts: "Holt's Double Exp.",
  auto: "Auto Best-Fit",
};

function linearFit(y: number[]): { fit: (i: number) => number } {
  const n = y.length;
  let sx = 0, sy = 0, sxx = 0, sxy = 0;
  for (let i = 0; i < n; i++) { sx += i; sy += y[i]; sxx += i * i; sxy += i * y[i]; }
  const denom = n * sxx - sx * sx;
  const slope = denom === 0 ? 0 : (n * sxy - sx * sy) / denom;
  const intercept = (sy - slope * sx) / n;
  return { fit: (i: number) => intercept + slope * i };
}

function gaussianElim(A: number[][], b: number[]): number[] {
  const n = b.length;
  const M = A.map((row, i) => [...row, b[i]]);
  for (let i = 0; i < n; i++) {
    let max = i;
    for (let k = i + 1; k < n; k++) if (Math.abs(M[k][i]) > Math.abs(M[max][i])) max = k;
    [M[i], M[max]] = [M[max], M[i]];
    if (Math.abs(M[i][i]) < 1e-12) continue;
    for (let k = i + 1; k < n; k++) {
      const f = M[k][i] / M[i][i];
      for (let j = i; j <= n; j++) M[k][j] -= f * M[i][j];
    }
  }
  const x = new Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    let s = M[i][n];
    for (let j = i + 1; j < n; j++) s -= M[i][j] * x[j];
    x[i] = M[i][i] === 0 ? 0 : s / M[i][i];
  }
  return x;
}

function polyFit(y: number[], degree: number): (i: number) => number {
  const n = y.length;
  const m = degree + 1;
  // Sum of x^k
  const sumX: number[] = new Array(2 * degree + 1).fill(0);
  for (let i = 0; i < n; i++) {
    let xp = 1;
    for (let k = 0; k < sumX.length; k++) { sumX[k] += xp; xp *= i; }
  }
  const sumXY: number[] = new Array(m).fill(0);
  for (let i = 0; i < n; i++) {
    let xp = 1;
    for (let k = 0; k < m; k++) { sumXY[k] += y[i] * xp; xp *= i; }
  }
  const A: number[][] = [];
  for (let r = 0; r < m; r++) {
    const row: number[] = [];
    for (let c = 0; c < m; c++) row.push(sumX[r + c]);
    A.push(row);
  }
  const coeffs = gaussianElim(A, sumXY);
  return (i: number) => {
    let s = 0, xp = 1;
    for (let k = 0; k < m; k++) { s += coeffs[k] * xp; xp *= i; }
    return s;
  };
}

function buildSeries(fit: (i: number) => number, n: number, horizon: number) {
  const fitted: number[] = [];
  const forecast: number[] = [];
  for (let i = 0; i < n; i++) fitted.push(fit(i));
  for (let i = 0; i < horizon; i++) forecast.push(fit(n + i));
  return { fitted, forecast };
}

function runLinear(y: number[], horizon: number): ModelResult {
  const { fit } = linearFit(y);
  const { fitted, forecast } = buildSeries(fit, y.length, horizon);
  return { key: "linear", name: MODEL_LABELS.linear, fitted, forecast, rmse: rmse(y, fitted) };
}

function runPolynomial(y: number[], horizon: number): ModelResult {
  const fit = polyFit(y, 3);
  const { fitted, forecast } = buildSeries(fit, y.length, horizon);
  return { key: "polynomial", name: MODEL_LABELS.polynomial, fitted, forecast, rmse: rmse(y, fitted) };
}

function runExponential(y: number[], horizon: number): ModelResult {
  const minV = Math.min(...y);
  const offset = minV <= 0 ? Math.abs(minV) + 1 : 0;
  const ly = y.map(v => Math.log(v + offset));
  const { fit } = linearFit(ly);
  const expFit = (i: number) => Math.exp(fit(i)) - offset;
  const { fitted, forecast } = buildSeries(expFit, y.length, horizon);
  return { key: "exponential", name: MODEL_LABELS.exponential, fitted, forecast, rmse: rmse(y, fitted) };
}

function runMovingAverage(y: number[], horizon: number): ModelResult {
  const n = y.length;
  const w = Math.max(2, Math.min(6, Math.floor(n / 3)));
  const fitted: number[] = [];
  for (let i = 0; i < n; i++) {
    const start = Math.max(0, i - w + 1);
    const slice = y.slice(start, i + 1);
    fitted.push(slice.reduce((a, b) => a + b, 0) / slice.length);
  }
  // Trend from last w points
  const last = y.slice(-w);
  const mean = last.reduce((a, b) => a + b, 0) / last.length;
  const { fit: linFit } = linearFit(last);
  const slope = linFit(1) - linFit(0);
  const forecast: number[] = [];
  for (let i = 0; i < horizon; i++) forecast.push(mean + slope * (i + 1));
  return { key: "movingAverage", name: MODEL_LABELS.movingAverage, fitted, forecast, rmse: rmse(y, fitted) };
}

function runHolts(y: number[], horizon: number): ModelResult {
  const alpha = 0.3, beta = 0.2;
  const n = y.length;
  const level: number[] = new Array(n);
  const trend: number[] = new Array(n);
  level[0] = y[0];
  trend[0] = n > 1 ? y[1] - y[0] : 0;
  const fitted: number[] = new Array(n);
  fitted[0] = level[0];
  for (let t = 1; t < n; t++) {
    fitted[t] = level[t - 1] + trend[t - 1];
    level[t] = alpha * y[t] + (1 - alpha) * (level[t - 1] + trend[t - 1]);
    trend[t] = beta * (level[t] - level[t - 1]) + (1 - beta) * trend[t - 1];
  }
  const forecast: number[] = [];
  for (let h = 1; h <= horizon; h++) forecast.push(level[n - 1] + h * trend[n - 1]);
  return { key: "holts", name: MODEL_LABELS.holts, fitted, forecast, rmse: rmse(y, fitted) };
}

export function runAll(y: number[], horizon: number): ModelResult[] {
  return [
    runLinear(y, horizon),
    runPolynomial(y, horizon),
    runExponential(y, horizon),
    runMovingAverage(y, horizon),
    runHolts(y, horizon),
  ];
}

export function runModel(key: ModelKey, y: number[], horizon: number): { chosen: ModelResult; all: ModelResult[] } {
  const all = runAll(y, horizon);
  if (key === "auto") {
    const best = [...all].sort((a, b) => a.rmse - b.rmse)[0];
    return { chosen: { ...best, key: best.key }, all };
  }
  const chosen = all.find(m => m.key === key)!;
  return { chosen, all };
}
