// The audit log's row-to-text mapping (Phase5_Build_Design.md 12.9, unit): changes, field labels, names for ids, result values and the summary cell.
import { describe, expect, it } from "vitest";
import { changeSummary, changesOf, fieldLabel, isSignIn, showValue, TYPE_OF_TABLE } from "./audit-text";

const names = new Map([["company:c1", "PT Bara Nusantara Mandiri"], ["batch:b1", "B-2026-0417"]]);
describe("audit text", () => {
  it("lists only the columns that changed on an update, with labels and no plumbing", () => {
    const c = changesOf({ table_name: "samples", action: "update", before: { client_ref: "A", on_hold: false, updated_at: "x", batch_id: null }, after: { client_ref: "A", on_hold: true, updated_at: "y", batch_id: "b1" } }, names);
    expect(c).toEqual([{ field: "On hold", before: "No", after: "Yes" }, { field: "Batch", before: null, after: "B-2026-0417" }]);
  });
  it("an insert lists what was set (after only) and a delete what was there (before only)", () => {
    const i = changesOf({ table_name: "job_orders", action: "insert", before: null, after: { order_no: "JO-1", company_id: "c1", id: "z", notes: null } }, names);
    expect(i).toEqual([{ field: "Job order number", before: null, after: "JO-1" }, { field: "Company", before: null, after: "PT Bara Nusantara Mandiri" }]);
    const d = changesOf({ table_name: "job_orders", action: "delete", before: { order_no: "JO-1" }, after: null }, names);
    expect(d).toEqual([{ field: "Job order number", before: "JO-1", after: null }]);
  });
  it("a result value is one change named by its parameter and basis", () => {
    const c = changesOf({ table_name: "analysis_values", action: "update", before: { basis: "adb", value_num: 5.4, qualifier: null }, after: { basis: "adb", value_num: 5.42, qualifier: null } }, names, "ASH (ADB)");
    expect(c).toEqual([{ field: "ASH (ADB)", before: "5.4", after: "5.42" }]);
    expect(changesOf({ table_name: "analysis_values", action: "update", before: { value_num: 5 }, after: { value_num: 5 } }, names, "ASH (ADB)")).toEqual([]);
  });
  it("the parent column is left out of a child row's changes", () => {
    const c = changesOf({ table_name: "batch_parameters", action: "insert", before: null, after: { batch_id: "b1", parameter_id: "p1" } }, names, null, "batch_id");
    expect(c.map((x) => x.field)).toEqual(["Parameter"]);
  });
  it("shows values the way a person reads them", () => {
    expect(showValue("depth_from", "5.1", names)).toBe("5.10");
    expect(showValue("status", "prep_finished", names)).toBe("Prep finished");
    expect(showValue("received_at", "2026-11-25T03:20:00Z", names)).toBe("25 Nov 2026, 11:20");
    expect(showValue("company_id", "gone", names)).toBe("Removed record");
    expect(showValue("remarks", "", names)).toBeNull();
    expect(fieldLabel("some_new_column")).toBe("Some new column");
  });
  it("the Changes cell says the field, or how many", () => {
    expect(changeSummary([])).toBe("");
    expect(changeSummary([{ field: "Ash (ADB)", before: "1", after: "2" }])).toBe("Ash (ADB)");
    expect(changeSummary([{ field: "a", before: null, after: "1" }, { field: "b", before: null, after: "2" }])).toBe("2 fields");
  });
  it("sign-in rows are the profile changes made on the Sign in screen; every audited table has a record type", () => {
    expect(isSignIn({ table_name: "profiles", screen: "Sign in" })).toBe(true);
    expect(isSignIn({ table_name: "profiles", screen: "Profile" })).toBe(false);
    expect(TYPE_OF_TABLE.analysis_values).toBe("Result");
    expect(TYPE_OF_TABLE.app_settings).toBe("Configuration");
  });
});
