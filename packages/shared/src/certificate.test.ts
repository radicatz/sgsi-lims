// Fixture: the first sample of the lab's sample RoA (pdf-roa-contoh.pdf, "OC - 1 - JGI", SS-1172): TM 29.60 ar, IM 12.32, Ash 0.69, VM 45.90, TS 1.03, GCV 5914 (adb).
import { describe, expect, it } from "vitest";
import { buildRows, fmtDate, methodLabel, renderCertificateHtml, verifyCodeOf, valueKey, type CertParam, type CertPayload, type CertSampleInput } from "./certificate";

const P = (code: string, name: string, unit: string | null, decimals: number, mb: string | null, sort: number, method: string | null, extra: Partial<CertParam> = {}): CertParam =>
  ({ code, name, unit, decimals, measuredBasis: mb, kind: "numeric", method, detectionLimit: null, sort, ...extra });
const PARAMS: CertParam[] = [
  P("TM", "Total moisture", "%", 2, "ar", 10, "ASTM D3302-19"), P("IM", "Inherent moisture", "%", 2, "adb", 11, "ASTM D3173-17"), P("ASH", "Ash", "%", 2, "adb", 20, "ASTM D3174-12"),
  P("VM", "Volatile matter", "%", 2, "adb", 21, "ASTM D3175-20"), P("FC", "Fixed carbon", "%", 2, "adb", 22, "ASTM D3172-13"), P("TS", "Total sulfur", "%", 2, "adb", 30, "ASTM D4239-18"),
  P("GCV", "Gross calorific value", "kcal/kg", 0, "adb", 40, "ASTM D5865-19"), P("PREP", "Preparation", null, 0, null, 1, null), P("ADL", "Air-dried loss", "%", 2, "ar", 2, null),
];
const val = (value: string, basis: string) => ({ value, qualifier: null, text: null, basis });
const SAMPLE: CertSampleInput = {
  sampleCode: "004.RI.001.Lot01", sampleNo: "SG.261029.004.RI.001", mass: "9.15",
  values: { TM: val("29.60", "ar"), IM: val("12.32", "adb"), ASH: val("0.69", "adb"), VM: val("45.90", "adb"), FC: val("41.09", "adb"), TS: val("1.03", "adb"), GCV: val("5914", "adb"), ADL: val("8.40", "ar") },
};
const ALL = ["adb", "db", "daf", "ar"] as const;
const by = (rows: ReturnType<typeof buildRows>) => Object.fromEntries(rows.map((r) => [r.name, r]));

describe("certificate rows", () => {
  const rows = by(buildRows(PARAMS, SAMPLE, [...ALL]));
  it("prints each parameter on the bases the lab's RoA uses", () => {
    expect(rows["Total Moisture"]!.cells).toEqual(["-", "-", "-", "29.60"]);                // TM: as received only
    expect(rows["Moisture in the Analysis Sample"]!.cells).toEqual(["12.32", "-", "-", "-"]);  // IM: air dried only
    expect(rows["Ash Content"]!.cells).toEqual(["0.69", "0.79", "-", "0.55"]);               // Ash: no dry ash free
    expect(rows["Volatile Matter"]!.cells).toEqual(["45.90", "52.35", "52.76", "36.85"]);
    expect(rows["Total Sulphur"]!.cells).toEqual(["1.03", "1.17", "1.18", "0.83"]);
  });
  it("prints the calorific value as whole kcal/kg with the unit in the name, no thousands separator", () => {
    expect(rows["Gross Calorific Value (kcal/kg)"]!.cells).toEqual(["5914", "6745", "6798", "4748"]);
  });
  it("works out fixed carbon by difference on each basis from the rounded values (D-13)", () => {
    // the lab's paper prints 32.99 for AR, which is the converted value; the difference gives 33.00 (to confirm with the lab)
    expect(rows["Fixed Carbon"]!.cells).toEqual(["41.09", "46.86", "47.24", "33.00"]);
  });
  it("leaves out preparation values and keeps the method column", () => {
    expect(Object.keys(rows)).not.toContain("Preparation");
    expect(Object.keys(rows).some((n) => /Air-dried/.test(n))).toBe(false);
    expect(rows["Volatile Matter"]!.method).toBe("ASTM D3175-20");
  });
  it("drops a basis the draft turned off, and keeps the order", () => {
    const r = by(buildRows(PARAMS, SAMPLE, ["adb", "ar"]));
    expect(r["Volatile Matter"]!.cells).toEqual(["45.90", "36.85"]);
    expect(r["Fixed Carbon"]!.cells).toEqual(["41.09", "33.00"]);
  });
  it("shows a dash when an input is missing, never zero", () => {
    const s: CertSampleInput = { ...SAMPLE, values: { IM: val("12.32", "adb"), VM: val("45.90", "adb") } };   // no TM, no Ash
    const r = by(buildRows(PARAMS, s, [...ALL]));
    expect(r["Volatile Matter"]!.cells).toEqual(["45.90", "52.35", "-", "-"]);
  });
  it("prints a value below the detection limit as <limit, on its own basis only", () => {
    const ps = PARAMS.map((p) => (p.code === "TS" ? { ...p, detectionLimit: 0.05 } : p));
    const r = by(buildRows(ps, { ...SAMPLE, values: { ...SAMPLE.values, TS: val("0.03", "adb") } }, [...ALL]));
    expect(r["Total Sulphur"]!.cells).toEqual(["<0.05", "-", "-", "-"]);
  });
  it("prints a typed qualifier as typed", () => {
    const r = by(buildRows(PARAMS, { ...SAMPLE, values: { ...SAMPLE.values, TS: { value: "0.10", qualifier: "<", text: null, basis: "adb" } } }, [...ALL]));
    expect(r["Total Sulphur"]!.cells).toEqual(["<0.10", "-", "-", "-"]);
  });
  it("puts a value with no basis and a group item in one cell across the bases", () => {
    const hgi = P("HGI", "Hardgrove grindability index", null, 0, null, 60, "ASTM D409-16");
    const item = P("TRACE", "Trace elements", "ppm", 1, "adb", 84, null, { itemId: "i1", itemLabel: "Pb" });
    const s: CertSampleInput = { ...SAMPLE, values: { ...SAMPLE.values, HGI: val("50", ""), [valueKey("TRACE", "i1")]: val("12.30", "adb") } };
    const r = buildRows([...PARAMS, hgi, item], s, [...ALL]);
    expect(r.find((x) => x.name === "Hardgrove Grindability Index")).toMatchObject({ span: "50", cells: [] });
    expect(r.find((x) => x.name === "Trace elements, Pb (ppm)")).toMatchObject({ span: "12.3" });
  });
});

describe("certificate text", () => {
  it("names methods by their standard family", () => {
    expect(methodLabel("ASTM", "D3175", "2020")).toBe("ASTM D3175-20");
    expect(methodLabel("ISO", "1171", "2010")).toBe("ISO 1171:2010");
    expect(methodLabel("GBT", "212", "2008")).toBe("GB/T 212-2008");
  });
  it("formats dates and the verification code", () => {
    expect(fmtDate("2026-11-02")).toBe("2 Nov 2026");
    expect(fmtDate("2026-11-02T08:30:00.000Z")).toBe("2 Nov 2026");
    expect(verifyCodeOf("7f3a91c2d4e5")).toBe("7F3A-91C2");
  });
});

describe("certificate html", () => {
  const payload: CertPayload = {
    v: 1, draft: false, number: "CoA-JO-2026-0142-1", revision: 1, issuedOn: "2026-11-02", verifyCode: "7F3A-91C2",
    lab: { name: "PT Sentra Geo Survey Indonesia", address: "Jl. Rapak Indah No. 120", accreditation: "LP-1234-IDN", placeOfIssue: "Samarinda" },
    template: { title: "Certificate of Analysis", statement: "Samples were analysed.", terms: "This certificate may not be reproduced except in full.", formCode: "FM-LAB-014", revision: 2 },
    client: { name: "PT <Bukit> Asam", address: "Tanjung Enim", attention: "Budi Santoso", reference: "PTBA-2210" },
    jobOrder: { no: "JO-2026-0142", receivedOn: "2026-10-29", standards: ["ASTM"], sampleCount: 1 },
    bases: ["adb", "ar"], remarks: null,
    samples: [{ sampleCode: SAMPLE.sampleCode, sampleNo: SAMPLE.sampleNo, mass: SAMPLE.mass, rows: buildRows(PARAMS, SAMPLE, ["adb", "ar"]) }],
    signatory: { name: "Ir. Bambang Sutrisno, M.T.", title: "Laboratory Manager", onBehalfOf: null },
  };
  const assets = { fontCss: "", logo: "data:image/svg+xml;base64,AA==", signature: "data:image/png;base64,AA==", stamp: "data:image/png;base64,BB==" };
  it("escapes text, shows one column per chosen basis and the signature on a signed certificate", () => {
    const html = renderCertificateHtml(payload, assets);
    expect(html).toContain("PT &lt;Bukit&gt; Asam");
    expect(html).toContain("<th>ADB<small>Air Dried</small></th><th>AR<small>As Received</small></th>");
    expect(html).not.toContain("Dry Ash Free");
    expect(html).toContain('class="sig"'); expect(html).toContain('class="stamp"'); expect(html).not.toContain("DRAFT");
    expect(html).toContain("Issued 2 Nov 2026");
  });
  it("marks a draft and leaves the signature space empty", () => {
    const html = renderCertificateHtml({ ...payload, draft: true, number: null, issuedOn: null }, assets);
    expect(html).toContain("DRAFT"); expect(html).toContain("Assigned at signing"); expect(html).not.toContain('class="sig"');
  });
});
