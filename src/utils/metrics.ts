export function rSquared(actual: number[], pred: number[]): number {
  const mean = actual.reduce((a, b) => a + b, 0) / actual.length;
  let ssRes = 0, ssTot = 0;
  for (let i = 0; i < actual.length; i++) {
    ssRes += (actual[i] - pred[i]) ** 2;
    ssTot += (actual[i] - mean) ** 2;
  }
  return ssTot === 0 ? 0 : 1 - ssRes / ssTot;
}

export function rmse(actual: number[], pred: number[]): number {
  const n = actual.length;
  let s = 0;
  for (let i = 0; i < n; i++) s += (actual[i] - pred[i]) ** 2;
  return Math.sqrt(s / n);
}

export function mae(actual: number[], pred: number[]): number {
  const n = actual.length;
  let s = 0;
  for (let i = 0; i < n; i++) s += Math.abs(actual[i] - pred[i]);
  return s / n;
}

export function mape(actual: number[], pred: number[]): number {
  let s = 0, c = 0;
  for (let i = 0; i < actual.length; i++) {
    if (actual[i] !== 0) { s += Math.abs((actual[i] - pred[i]) / actual[i]); c++; }
  }
  return c === 0 ? 0 : (s / c) * 100;
}

export function residuals(actual: number[], pred: number[]): number[] {
  return actual.map((a, i) => a - pred[i]);
}

export function ciHalfWidth(rmseVal: number, i: number): number {
  return rmseVal * 1.96 * Math.sqrt(1 + i * 0.15);
}
