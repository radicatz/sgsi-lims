// The Quality tab's regression (Phase5_Build_Design.md 12.9, unit): slope, intercept, R², n, and the even thinning of a big scatter.
import { describe, expect, it } from "vitest";
import { regress, thin } from "./regression";

describe("regression", () => {
  it("fits an exact line", () => {
    const f = regress([[1, 3], [2, 5], [3, 7], [4, 9]]);
    expect(f.n).toBe(4);
    expect(f.slope).toBeCloseTo(2, 10);
    expect(f.intercept).toBeCloseTo(1, 10);
    expect(f.r2).toBeCloseTo(1, 10);
  });
  it("R² is below 1 for noisy points and equals the squared correlation", () => {
    const f = regress([[1, 2], [2, 1], [3, 4], [4, 3], [5, 6]]);
    expect(f.slope).toBeCloseTo(1, 10);          // Sxy = 10, Sxx = 10
    expect(f.r2).toBeCloseTo(100 / 148, 10);     // Sxy² / (Sxx · Syy), Syy = 14.8
  });
  it("a falling line has a negative slope and a high R²", () => {
    const f = regress([[0, 80], [1000, 66], [2000, 52], [3000, 40], [4000, 26]]);
    expect(f.slope!).toBeLessThan(0);
    expect(f.r2!).toBeGreaterThan(0.99);
  });
  it("gives nothing for fewer than 3 points or a vertical set", () => {
    expect(regress([[1, 1], [2, 2]])).toEqual({ n: 2, slope: null, intercept: null, r2: null });
    expect(regress([[1, 1], [1, 2], [1, 3]]).r2).toBeNull();
  });
  it("thins evenly and keeps small sets whole", () => {
    expect(thin([1, 2, 3], 5)).toEqual([1, 2, 3]);
    const t = thin(Array.from({ length: 10 }, (_, i) => i), 5);
    expect(t).toEqual([0, 2, 4, 6, 8]);
  });
});
