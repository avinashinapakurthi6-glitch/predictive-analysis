export type Point = { date: Date; value: number };
export type LogEntry = { kind: "ok" | "warn"; message: string };

function parseDate(raw: any): Date | null {
  if (raw == null || raw === "") return null;
  if (raw instanceof Date && !isNaN(raw.getTime())) return raw;
  if (typeof raw === "number") {
    // Excel serial date
    const epoch = new Date(Date.UTC(1899, 11, 30));
    const d = new Date(epoch.getTime() + raw * 86400000);
    return isNaN(d.getTime()) ? null : d;
  }
  const s = String(raw).trim();
  if (!s) return null;
  // ISO yyyy-mm-dd or yyyy-mm
  const iso = /^(\d{4})-(\d{1,2})(?:-(\d{1,2}))?$/.exec(s);
  if (iso) {
    const d = new Date(Date.UTC(+iso[1], +iso[2] - 1, iso[3] ? +iso[3] : 1));
    return isNaN(d.getTime()) ? null : d;
  }
  // mm/dd/yyyy or dd/mm/yyyy (assume mm/dd if first <=12)
  const slash = /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/.exec(s);
  if (slash) {
    let a = +slash[1], b = +slash[2], y = +slash[3];
    if (y < 100) y += 2000;
    let month: number, day: number;
    if (a > 12) { day = a; month = b; } else { month = a; day = b; }
    const d = new Date(Date.UTC(y, month - 1, day));
    return isNaN(d.getTime()) ? null : d;
  }
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

function parseNum(raw: any): number | null {
  if (raw == null || raw === "") return null;
  if (typeof raw === "number") return isFinite(raw) ? raw : null;
  const n = parseFloat(String(raw).replace(/[, ]/g, ""));
  return isFinite(n) ? n : null;
}

export function preprocess(
  rows: Record<string, any>[],
  dateCol: string,
  valueCol: string
): { series: Point[]; log: LogEntry[] } {
  const log: LogEntry[] = [];
  log.push({ kind: "ok", message: `Loaded ${rows.length} rows` });

  const parsed: Point[] = [];
  let dropped = 0;
  for (const r of rows) {
    const d = parseDate(r[dateCol]);
    const v = parseNum(r[valueCol]);
    if (!d || v == null) { dropped++; continue; }
    parsed.push({ date: d, value: v });
  }
  if (dropped > 0) log.push({ kind: "warn", message: `Dropped ${dropped} unparseable rows` });
  else log.push({ kind: "ok", message: "All rows parsed successfully" });

  parsed.sort((a, b) => a.date.getTime() - b.date.getTime());
  log.push({ kind: "ok", message: "Sorted ascending by date" });

  // Dedupe (keep last)
  const map = new Map<number, Point>();
  for (const p of parsed) map.set(p.date.getTime(), p);
  const dedupCount = parsed.length - map.size;
  if (dedupCount > 0) log.push({ kind: "warn", message: `Removed ${dedupCount} duplicate dates (kept last)` });
  const series = Array.from(map.values()).sort((a, b) => a.date.getTime() - b.date.getTime());

  // IQR x 3 outlier detection (keep, log)
  if (series.length >= 4) {
    const sorted = [...series].map(p => p.value).sort((a, b) => a - b);
    const q = (p: number) => {
      const idx = (sorted.length - 1) * p;
      const lo = Math.floor(idx), hi = Math.ceil(idx);
      return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo);
    };
    const q1 = q(0.25), q3 = q(0.75);
    const iqr = q3 - q1;
    const lo = q1 - 3 * iqr, hi = q3 + 3 * iqr;
    const outliers = series.filter(p => p.value < lo || p.value > hi).length;
    if (outliers > 0) log.push({ kind: "warn", message: `Detected ${outliers} outlier(s) (IQR×3) — kept` });
    else log.push({ kind: "ok", message: "No outliers detected (IQR×3)" });
  }

  log.push({ kind: "ok", message: `Final series: ${series.length} points` });
  return { series, log };
}

export function detectColumns(rows: Record<string, any>[]): { dateCols: string[]; numericCols: string[] } {
  if (!rows.length) return { dateCols: [], numericCols: [] };
  const cols = Object.keys(rows[0]);
  const dateCols: string[] = [];
  const numericCols: string[] = [];
  for (const c of cols) {
    let dateHits = 0, numHits = 0, total = 0;
    for (const r of rows.slice(0, 50)) {
      const v = r[c];
      if (v == null || v === "") continue;
      total++;
      if (parseDate(v)) dateHits++;
      const n = parseNum(v);
      if (n != null && !(typeof v === "string" && parseDate(v))) numHits++;
    }
    if (total > 0 && dateHits / total > 0.7) dateCols.push(c);
    else if (total > 0 && numHits / total > 0.7) numericCols.push(c);
  }
  return { dateCols, numericCols };
}

export function generateSample(): { rows: Record<string, any>[]; dateCol: string; valueCol: string } {
  const rows: Record<string, any>[] = [];
  const start = new Date(Date.UTC(2022, 0, 1));
  for (let i = 0; i < 36; i++) {
    const d = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + i, 1));
    const trend = 100 + i * 4;
    const season = 25 * Math.sin((2 * Math.PI * i) / 12);
    const noise = (Math.random() - 0.5) * 15;
    rows.push({
      date: d.toISOString().slice(0, 10),
      sales: Math.round((trend + season + noise) * 100) / 100,
    });
  }
  return { rows, dateCol: "date", valueCol: "sales" };
}
