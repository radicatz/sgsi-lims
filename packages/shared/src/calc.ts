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

export type Standard = "ISO" | "ASTM" | "GBT";
const J_PER_CAL = new Decimal("4.1868");
const half = (d: Decimal, places: number) => d.toDecimalPlaces(places, Decimal.ROUND_HALF_UP);

/** Hydrogen estimated from the proximate analysis (Seyler), for Net CV when hydrogen is not measured (owner, Nov 16 2026):
 *  H daf = 0.069 × (GCV daf / 100 + VM daf) − 2.86, GCV in kcal/kg. Returns H on the air-dried basis, 2 decimals, converted from the
 *  rounded daf value as the lab's workbook does (spec 3.6 W-1). */
export function hydrogenSeyler(gcvAdb: Num, vmAdb: Num, im: Num, ash: Num): string | null {
  const [g, v, i, a] = [dec(gcvAdb), dec(vmAdb), dec(im), dec(ash)];
  if (!g || !v || !i || !a) return null;
  const organic = new Decimal(100).minus(i).minus(a);          // 100 − IM − Ash
  if (organic.lte(0)) return null;
  const toDaf = (x: Decimal) => x.times(100).dividedBy(organic);
  const hDaf = half(new Decimal("0.069").times(toDaf(g).dividedBy(100).plus(toDaf(v))).minus("2.86"), 2);
  return half(hDaf.times(organic).dividedBy(100), 2).toFixed(2);
}

/** Net calorific value, as received, kcal/kg, from GCV (ADB, kcal/kg), TM, IM and hydrogen (ADB, excluding the hydrogen in the
 *  moisture, as the ultimate analysis reports it; or the Seyler estimate). The formula follows the job order's standard (spec 12.1, W-4):
 *  - ISO 1928:     NCV ar (J/g) = GCV ar × 4.1868 − 206 × H ar − 23.05 × TM
 *  - GB/T 213:     the same with 23 × TM
 *  - ASTM D5865:   NCV ar = GCV ar − 5.72 × 9 × (H ar + 0.1119 × TM), the hydrogen of the moisture added back
 *  where X ar = X adb × (100 − TM) / (100 − IM). Checked against the shipment workbook (Test Report #2): ISO 4745, ASTM 4730. */
export function netCalorific(gcvAdb: Num, tm: Num, im: Num, hAdb: Num, standard: Standard = "ISO"): string | null {
  const [g, t, i, h] = [dec(gcvAdb), dec(tm), dec(im), dec(hAdb)];
  if (!g || !t || !i || !h) return null;
  const k = new Decimal(100).minus(t).dividedBy(new Decimal(100).minus(i));   // ADB to AR
  const gAr = g.times(k), hAr = h.times(k);
  const net = standard === "ASTM"
    ? gAr.minus(new Decimal("5.72").times(9).times(hAr.plus(new Decimal("0.1119").times(t))))
    : gAr.times(J_PER_CAL).minus(new Decimal(206).times(hAr)).minus(new Decimal(standard === "GBT" ? "23" : "23.05").times(t)).dividedBy(J_PER_CAL);
  return half(net, 0).toFixed(0);
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
