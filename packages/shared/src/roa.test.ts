// The RoA the app drafts (SGSI template): same fixture as certificate.test.ts, the lab's sample RoA "OC - 1 - JGI" (pdf-roa-contoh.pdf).
import { describe, expect, it } from "vitest";
import type { CertParam, CertSampleInput } from "./certificate";
import { ROA_BASES, renderRoaHtml, roaSample, type RoaPayload } from "./roa";

const P = (code: string, name: string, unit: string | null, decimals: number, mb: string | null, sort: number, method: string | null): CertParam =>
  ({ code, name, unit, decimals, measuredBasis: mb, kind: "numeric", method, detectionLimit: null, sort });
const PARAMS: CertParam[] = [
  P("TM", "Total moisture", "%", 2, "ar", 10, "ASTM D3302-19"), P("IM", "Inherent moisture", "%", 2, "adb", 11, "ASTM D3173-17"), P("ASH", "Ash", "%", 2, "adb", 20, "ASTM D3174-12"),
  P("VM", "Volatile matter", "%", 2, "adb", 21, "ASTM D3175-20"), P("FC", "Fixed carbon", "%", 2, "adb", 22, "ASTM D3172-13"), P("GCV", "Gross calorific value", "kcal/kg", 0, "adb", 40, "ASTM D5865-19"),
];
const val = (value: string, basis: string) => ({ value, qualifier: null, text: null, basis });
const SAMPLE: CertSampleInput = {
  sampleCode: "004.RI.001.Lot01", sampleNo: "SG.261029.004.RI.001", mass: "9.15",
  values: { TM: val("29.60", "ar"), IM: val("12.32", "adb"), ASH: val("0.69", "adb"), VM: val("45.90", "adb"), FC: val("41.09", "adb"), GCV: val("5914", "adb") },
};
const s = roaSample(PARAMS, SAMPLE);
const by = Object.fromEntries(s.rows.map((r) => [r.label, r]));
const payload: RoaPayload = {
  number: null, reportedOn: "2026-11-24", lab: { name: "PT Sentra Geo Survey Indonesia", address: "Jl. Rapak Indah No. 120", accreditation: null, placeOfIssue: "Samarinda" },
  client: { name: "PT Bukit Asam Tbk", address: "Jl. Parigi No. 1", attention: "Budi Santoso", reference: "PTBA-2210" },
  batchNo: "B-2026-0412", jobOrderNo: "JO-2026-0142", standard: "ASTM", receivedOn: "2026-10-29", testedFrom: "2026-10-30", testedTo: "2026-11-01", samples: [s], remarks: null, formCode: "FM-LAB-021",
};

describe("RoA", () => {
  it("prints every basis in the SGSI order AR, ADB, DB, DAF, with the same values as the CoA", () => {
    expect(ROA_BASES).toEqual(["ar", "adb", "db", "daf"]);
    expect(by["Total Moisture"]!.cells).toEqual(["29.60", "-", "-", "-"]);
    expect(by["Ash Content"]!.cells).toEqual(["0.55", "0.69", "0.79", "-"]);
    expect(by["Volatile Matter"]!.cells).toEqual(["36.85", "45.90", "52.35", "52.76"]);
    expect(by["Gross Calorific Value"]!.cells).toEqual(["4748", "5914", "6745", "6798"]);
  });
  it("keeps the unit in its own column and the name without it", () => {
    expect(by["Gross Calorific Value"]!.unit).toBe("kcal/kg");
    const html = renderRoaHtml(payload, { fontCss: "", logo: "" });
    expect(html).toContain('<td class="unit">wt. %</td>');
    expect(html).toMatch(/<th>Parameter<\/th><th>Unit<\/th><th>AR<small>As Received<\/small><\/th><th>ADB<small>Air Dried<\/small><\/th><th>DB<small>Dry<\/small><\/th><th>DAF<small>Dry Ash Free<\/small><\/th><th>Test Method<\/th>/);
  });
  it("prints the SGSI header fields, the lab sample ID per sample, the fixed carbon note and a signature line for the Supervisor", () => {
    const html = renderRoaHtml(payload, { fontCss: "", logo: "" });
    for (const t of ["<h1>Report of Analysis</h1>", "Reference order", "Consignment", "Coal", "Tested", "30 Oct 2026 to 1 Nov 2026", "Lab sample ID", "SG.261029.004.RI.001",
      "Fixed Carbon<sup>1</sup>", "calculated by difference", "For and on behalf of", "Laboratory Supervisor", "Reported 24 Nov 2026", "Issued at Samarinda"]) expect(html).toContain(t);
    expect(html).toContain('<span class="write"></span>');   // no number yet: a line to write it in
    expect(renderRoaHtml({ ...payload, number: "RoA-0412" }, { fontCss: "", logo: "" })).toContain("RoA-0412");
  });
});
