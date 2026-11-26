// Least-squares line through a scatter (spec S-01 and 13.6: the regression is computed on the server). y = intercept + slope * x; r2 is the coefficient of determination.
export interface Fit { n: number; slope: number | null; intercept: number | null; r2: number | null }
export function regress(points: Array<[number, number]>): Fit {
  const n = points.length;
  if (n < 3) return { n, slope: null, intercept: null, r2: null };
  let sx = 0, sy = 0;
  for (const [x, y] of points) { sx += x; sy += y; }
  const mx = sx / n, my = sy / n;
  let sxx = 0, sxy = 0, syy = 0;
  for (const [x, y] of points) { sxx += (x - mx) ** 2; sxy += (x - mx) * (y - my); syy += (y - my) ** 2; }
  if (sxx === 0) return { n, slope: null, intercept: null, r2: null };
  const slope = sxy / sxx, intercept = my - slope * mx;
  return { n, slope, intercept, r2: syy === 0 ? 1 : (sxy * sxy) / (sxx * syy) };
}
/** At most `max` points, spread evenly (the chart draws these; `n` still counts all). */
export function thin<T>(rows: T[], max: number): T[] {
  if (rows.length <= max) return rows;
  const out: T[] = [], step = rows.length / max;
  for (let i = 0; i < max; i++) out.push(rows[Math.floor(i * step)]!);
  return out;
}
