// Calculations shared by the web app (preview) and the API (saved value). Spec 12, Stack_Decision_Record S-10.
// Exact decimals (decimal.js): no float drift on certificates.
import Decimal from "decimal.js";

export type Num = string | number | null | undefined;
const dec = (v: Num): Decimal | null => {
  if (v === null || v === undefined || v === "") return null;
  const s = typeof v === "number" ? String(v) : v.trim().replace(/\s/g, "");
  if (!/^-?\d+(\.\d+)?$/.test(s)) return null; // decimal commas are rejected, never converted (spec 14.4)
  return new Decimal(s);
};
export const isValidNumber = (v: Num): boolean => dec(v) !== null;

/** Round half away from zero to the parameter's decimals, as printed. */
export function round(v: Num, decimals: number): string | null {
  const d = dec(v);
  return d === null ? null : d.toDecimalPlaces(decimals, Decimal.ROUND_HALF_UP).toFixed(decimals);
}

/** FC (ADB) = 100 − IM − Ash − VM. Null until all three inputs exist. */
export function fixedCarbon(im: Num, ash: Num, vm: Num): string | null {
  const [a, b, c] = [dec(im), dec(ash), dec(vm)];
  if (!a || !b || !c) return null;
  return new Decimal(100).minus(a).minus(b).minus(c).toFixed(2);
}

/** NCV (AR) from GCV (ADB): GCV × (100 − TM) / (100 − IM) − 5.85 × (9 × H + TM). */
export function netCalorific(gcv: Num, tm: Num, im: Num, h: Num): string | null {
  const [g, t, i, hh] = [dec(gcv), dec(tm), dec(im), dec(h)];
  if (!g || !t || !i || !hh) return null;
  const ar = g.times(new Decimal(100).minus(t)).dividedBy(new Decimal(100).minus(i));
  return ar.minus(new Decimal(5.85).times(hh.times(9).plus(t))).toFixed(0);
}

export type Basis = "adb" | "ar" | "db" | "daf";
/** Convert a value reported on ADB to another basis. */
export function fromAdb(value: Num, to: Basis, m: { im: Num; tm?: Num; ash?: Num }): string | null {
  const v = dec(value), im = dec(m.im);
  if (!v || !im) return null;
  if (to === "adb") return v.toString();
  if (to === "db") return v.times(100).dividedBy(new Decimal(100).minus(im)).toString();
  if (to === "ar") { const tm = dec(m.tm); return tm ? v.times(new Decimal(100).minus(tm)).dividedBy(new Decimal(100).minus(im)).toString() : null; }
  const ash = dec(m.ash);
  return ash ? v.times(100).dividedBy(new Decimal(100).minus(im).minus(ash)).toString() : null;
}

export interface RangeRule { low?: number | null; high?: number | null }
/** Range warning used on the Preparation and Analysis tabs (typical range from Configuration, V-31 to V-50). */
export function outOfRange(v: Num, r: RangeRule): boolean {
  const d = dec(v);
  if (!d) return false;
  return (r.low != null && d.lessThan(r.low)) || (r.high != null && d.greaterThan(r.high));
}
