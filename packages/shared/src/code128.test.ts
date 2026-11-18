import { describe, expect, it } from "vitest";
import { code128Bars, code128Patterns, code128Values } from "./code128";

describe("code 128 B", () => {
  it("has 107 patterns of 11 modules (the stop of 13)", () => {
    expect(code128Patterns.length).toBe(107);
    code128Patterns.forEach((p, i) => {
      const sum = [...p].reduce((a, c) => a + Number(c), 0);
      expect(sum, `symbol ${i}`).toBe(i === 106 ? 13 : 11);
    });
  });
  it("every pattern is distinct", () => expect(new Set(code128Patterns).size).toBe(107));
  it("computes the check symbol: start B 104 + 'A' (33) x 1 = 137, mod 103 = 34", () => {
    expect(code128Values("A")).toEqual([104, 33, 34, 106]);
  });
  it("the Sample ID of the demo data fits", () => {
    const { bars, width } = code128Bars("SG.261105.007.RI.001");
    expect(width).toBe(11 * (1 + 20 + 1) + 13);   // start, 20 characters, check, stop
    expect(bars[0]![0]).toBe(0);
  });
  it("refuses a character the set cannot hold", () => expect(() => code128Values("é")).toThrow());
});
