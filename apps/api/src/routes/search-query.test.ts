import { describe, expect, it } from "vitest";
import { Bad, build, type Def } from "./search-query";

const ALL = ["order.read", "batch.read", "result.read", "search.use"];
const def = (conditions: Def["conditions"], over: Partial<Def> = {}): Def => ({ target: "samples", match: "all", conditions, ...over });

describe("advanced search query builder", () => {
  it("binds every value as a parameter and never puts it in the SQL", () => {
    const evil = "x'; drop table samples; --";
    const b = build(def([{ field: "client_ref", op: "is", value: evil }]), ALL);
    expect(b.sql).not.toContain("drop table");
    expect(b.sql).toContain("$1");
    expect(b.params).toEqual([evil.toLowerCase()]);
  });
  it("refuses a field that is not in the list", () => {
    expect(() => build(def([{ field: "s.id; --", op: "is", value: "1" }]), ALL)).toThrow(Bad);
  });
  it("refuses an operator that does not apply to the field type", () => {
    expect(() => build(def([{ field: "client_ref", op: "gt", value: "1" }]), ALL)).toThrow(/does not apply/);
    expect(() => build(def([{ field: "status", op: "contains", value: "x" }]), ALL)).toThrow(Bad);
  });
  it("text operators: is, is not, contains, starts with, is empty", () => {
    expect(build(def([{ field: "client_ref", op: "contains", value: "50%" }]), ALL).params).toEqual([String.raw`%50\%%`]);
    expect(build(def([{ field: "client_ref", op: "starts", value: "BNM" }]), ALL).params).toEqual(["bnm%"]);
    expect(build(def([{ field: "client_ref", op: "is_not", value: "A" }]), ALL).sql).toContain("<>");
    expect(build(def([{ field: "client_ref", op: "empty" }]), ALL).params).toEqual([]);
  });
  it("number operators check the value is a number, and accept a decimal comma", () => {
    expect(build(def([{ field: "depth_from", op: "gt", value: "10,5" }]), ALL).params).toEqual(["10.5"]);
    expect(() => build(def([{ field: "depth_from", op: "gt", value: "abc" }]), ALL)).toThrow(/not a number/);
    expect(build(def([{ field: "depth_from", op: "between", value: ["1", "2"] }]), ALL).params).toEqual(["1", "2"]);
    expect(() => build(def([{ field: "depth_from", op: "between", value: ["1"] }]), ALL)).toThrow(/two values/);
  });
  it("date operators need an ISO date", () => {
    expect(build(def([{ field: "received", op: "after", value: "2026-10-01" }]), ALL).params).toEqual(["2026-10-01"]);
    expect(() => build(def([{ field: "received", op: "on", value: "1 Oct" }]), ALL)).toThrow(/not a date/);
    expect(build(def([{ field: "received", op: "between", value: ["2026-10-01", "2026-10-31"] }]), ALL).sql).toContain("between");
  });
  it("choice operators accept only the listed options", () => {
    expect(build(def([{ field: "status", op: "is", value: "held" }]), ALL).params).toEqual(["held"]);
    expect(build(def([{ field: "status", op: "any", value: ["held", "received"] }]), ALL).params).toEqual([["held", "received"]]);
    expect(() => build(def([{ field: "status", op: "is", value: "nonsense" }]), ALL)).toThrow(/not an option/);
  });
  it("Match any joins with or, Match all with and", () => {
    const c = [{ field: "client_ref", op: "is", value: "a" }, { field: "order", op: "is", value: "b" }];
    expect(build(def(c, { match: "any" }), ALL).sql).toContain(" or ");
    expect(build(def(c, { match: "all" }), ALL).sql).toContain(" and ");
  });
  it("targets: each target has its own fields", () => {
    expect(build({ target: "batches", match: "all", conditions: [{ field: "deadline", op: "before", value: "2026-11-01" }] }, ALL).sql).toContain("b.deadline_on");
    expect(build({ target: "orders", match: "all", conditions: [{ field: "po", op: "contains", value: "x" }] }, ALL).sql).toContain("j.client_reference");
    expect(build({ target: "results", match: "all", conditions: [{ field: "value", op: "gt", value: "10" }, { field: "basis", op: "is", value: "adb" }] }, ALL).sql).toContain("a.round = 1");
    expect(() => build({ target: "batches", match: "all", conditions: [{ field: "parameter", op: "is", value: "x" }] }, ALL)).toThrow(Bad);
  });
  it("the Results target and result conditions need result.read (the CSO has none)", () => {
    const cso = ["order.read", "batch.read", "search.use"];
    expect(() => build({ target: "results", match: "all", conditions: [] }, cso)).toThrow(/not part of your access/);
    expect(() => build(def([{ field: "result", op: "gt", param: "ASH", basis: "adb", value: "10" }]), cso)).toThrow(/not part of your access/);
  });
  it("a result condition on samples binds the parameter, basis and value", () => {
    const b = build(def([{ field: "result", op: "gt", param: "ash", basis: "adb", value: "10" }]), ALL);
    expect(b.params).toHaveLength(3);
    expect(b.params).toEqual(expect.arrayContaining(["ASH", "adb", "10"]));
    expect(b.sql).toContain("exists");
  });
});
