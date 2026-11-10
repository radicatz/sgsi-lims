import { describe, expect, it } from "vitest";
import { fixedCarbon, fromAdb, netCalorific, outOfRange, round, isValidNumber } from "./calc";
import { navFor, startPath } from "./permissions";
import { passwordProblem } from "./schemas";

describe("calculations (spec 12.1)", () => {
  it("FC = 100 − IM − Ash − VM, exact", () => {
    expect(fixedCarbon("8.12", "6.05", "39.20")).toBe("46.63");          // Analysis_entering_results frame, row 1
    expect(fixedCarbon(0.1, 0.2, 0.3)).toBe("99.40");                       // no float drift
    expect(fixedCarbon("8.12", null, "39.2")).toBeNull();
  });
  it("rounds half away from zero to the parameter's decimals", () => {
    expect(round("2.345", 2)).toBe("2.35");
    expect(round("5419.5", 0)).toBe("5420");
  });
  it("rejects decimal commas instead of converting them", () => {
    expect(isValidNumber("12,40")).toBe(false);
    expect(isValidNumber("12.40")).toBe(true);
  });
  it("NCV and basis conversion", () => {
    expect(netCalorific("6000", "30", "10", "5")).toBe("4228");
    expect(fromAdb("10", "db", { im: "10" })).toBe("11.111111111111111111");
    expect(fromAdb("10", "ar", { im: "10", tm: "30" })).toBe("7.7777777777777777778");
  });
  it("range warning", () => {
    expect(outOfRange("52.10", { low: 0, high: 45 })).toBe(true);
    expect(outOfRange("12", { low: 0, high: 45 })).toBe(false);
  });
});

describe("navigation (Navigation plan section 2)", () => {
  const grid: Record<string, string[]> = {
    cso: ["company.read", "order.read", "batch.read", "coa.download", "dashboard.operations", "search.use", "work.use"],
    prep: ["order.read", "batch.read", "dashboard.operations", "search.use", "work.use"],
    analyst: ["order.read", "batch.read", "roa.download", "dashboard.operations", "search.use", "work.use"],
    lab_admin: ["company.read", "master.read", "order.read", "batch.read", "coa.download", "roa.download", "dashboard.operations", "search.use", "work.use"],
    supervisor: ["master.read", "order.read", "batch.read", "coa.download", "roa.download", "dashboard.operations", "search.use", "audit.read"],
    manager: ["company.read", "master.read", "order.read", "batch.read", "coa.download", "dashboard.operations", "search.use", "audit.read"],
    superadmin: ["company.read", "master.read", "order.read", "batch.read", "coa.download", "dashboard.operations", "search.use", "audit.read", "user.manage", "config.write"],
  };
  const count = (r: string) => navFor(grid[r]!).flatMap((g) => g.items).length;
  it("sidebar item counts per role", () => {
    expect([count("cso"), count("prep"), count("analyst"), count("lab_admin"), count("supervisor"), count("manager"), count("superadmin")]).toEqual([7, 5, 6, 10, 9, 10, 12]);
  });
  it("start page", () => {
    expect(startPath(grid.cso!)).toBe("/work");
    expect(startPath(grid.supervisor!)).toBe("/");
    expect(startPath(grid.cso!, "/orders")).toBe("/orders");
    expect(startPath(grid.prep!, "/users")).toBe("/work");
  });
});

describe("password rules (Configuration, Security)", () => {
  const rules = { min_password_length: 10, require_letter_and_number: true, require_special_character: false, forbid_email_in_password: true };
  it("explains what is missing", () => {
    expect(passwordProblem("short1", rules)).toBe("Use at least 10 characters with a letter and a number.");
    expect(passwordProblem("longenoughpw", rules)).toBe("Use at least 10 characters with a letter and a number.");
    expect(passwordProblem("maya123456x", rules, "maya@sgsi.co.id")).toBe("Don't use your email in the password.");
    expect(passwordProblem("coal-lab-2026", rules, "maya@sgsi.co.id")).toBeNull();
  });
});
