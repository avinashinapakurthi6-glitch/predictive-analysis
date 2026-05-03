import { useMemo } from "react";
import { preprocess, Point, LogEntry } from "../utils/preprocess";
import { runModel, ModelKey, ModelResult } from "../utils/models";
import { ciHalfWidth, mae, mape, rmse, residuals, rSquared } from "../utils/metrics";

export type ForecastResult = {
  series: Point[];
  log: LogEntry[];
  chosen: ModelResult;
  all: ModelResult[];
  metrics: { r2: number; rmse: number; mae: number; mape: number };
  residuals: number[];
  forecastDates: Date[];
  ci: { half: number[] };
};

export function useForecaster(
  rows: Record<string, any>[] | null,
  dateCol: string | null,
  valueCol: string | null,
  modelKey: ModelKey,
  horizon: number
): ForecastResult | null {
  return useMemo(() => {
    if (!rows || !dateCol || !valueCol) return null;
    const { series, log } = preprocess(rows, dateCol, valueCol);
    if (series.length < 4) {
      return null;
    }
    const y = series.map(p => p.value);
    const { chosen, all } = runModel(modelKey, y, horizon);
    const r2 = rSquared(y, chosen.fitted);
    const rm = rmse(y, chosen.fitted);
    const ma = mae(y, chosen.fitted);
    const mp = mape(y, chosen.fitted);
    const res = residuals(y, chosen.fitted);
    // Forecast dates — infer step from last two
    const forecastDates: Date[] = [];
    const last = series[series.length - 1].date;
    const prev = series[series.length - 2].date;
    const stepDays = Math.max(1, Math.round((last.getTime() - prev.getTime()) / 86400000));
    for (let i = 1; i <= horizon; i++) {
      forecastDates.push(new Date(last.getTime() + i * stepDays * 86400000));
    }
    const half = chosen.forecast.map((_, i) => ciHalfWidth(rm, i));
    return {
      series,
      log,
      chosen,
      all,
      metrics: { r2, rmse: rm, mae: ma, mape: mp },
      residuals: res,
      forecastDates,
      ci: { half },
    };
  }, [rows, dateCol, valueCol, modelKey, horizon]);
}
