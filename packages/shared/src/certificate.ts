// The certificate (CoA): what each cell prints, and the HTML the PDF and the preview are made from.
// Reports_Build_Design.md 6.1 (payload and rules) and 6.2 (layout and print scale); the samples are .context/design/figcraft/samples/.
// Pure functions: the API reads the database, builds the payload with them, freezes it at signing, and renders it. Exact decimals (calc.ts).
import { fromAdb, round } from "./calc";

export type CertBasis = "adb" | "db" | "daf" | "ar";
export const BASIS_ORDER: CertBasis[] = ["adb", "db", "daf", "ar"];
export const BASIS_LABEL: Record<CertBasis, [string, string]> = { adb: ["ADB", "Air Dried"], db: ["DB", "Dry"], daf: ["DAF", "Dry Ash Free"], ar: ["AR", "As Received"] };

/** A parameter as the certificate needs it. `measuredBasis` is `parameters.measured_basis`; `method` is the printed method with its edition. */
export interface CertParam {
  code: string; name: string; unit: string | null; decimals: number; measuredBasis: string | null; kind: string;
  method: string | null; detectionLimit: number | null; sort: number;
  itemId?: string | null; itemLabel?: string | null;       // Ash analysis and Trace elements: one row per chosen item
}
/** One stored value (the primary one): `basis` is the basis it was entered on. */
export interface CertValue { value: string | null; qualifier: "<" | ">" | null; text: string | null; basis: string }
export interface CertSampleInput { sampleCode: string; sampleNo: string; mass: string | null; values: Record<string, CertValue> }   // key: code, or code:itemId
/** cells follow the chosen bases; span: one value across them. `label` and `unit` are the name without the unit and the unit alone, for a report with a Unit column (the RoA). */
export interface CertRow { name: string; method: string; cells: string[]; span: string | null; code: string; label: string; unit: string | null }
export interface CertSample { sampleCode: string; sampleNo: string; mass: string | null; rows: CertRow[] }

export const valueKey = (code: string, itemId?: string | null) => (itemId ? `${code}:${itemId}` : code);
const PRINT_NAME: Record<string, string> = {
  TM: "Total Moisture", IM: "Moisture in the Analysis Sample", EQM: "Equilibrium Moisture", ASH: "Ash Content", VM: "Volatile Matter", FC: "Fixed Carbon",
  TS: "Total Sulphur", GCV: "Gross Calorific Value", NCV: "Net Calorific Value", HGI: "Hardgrove Grindability Index",
};
const NOT_PRINTED = new Set(["PREP", "ADL", "O"]);   // preparation values and the oxygen that has no formula in v1 never reach the certificate
const DASH = "-";

export const plainName = (p: CertParam): string => (p.itemId ? `${PRINT_NAME[p.code] ?? p.name}, ${p.itemLabel ?? ""}` : PRINT_NAME[p.code] ?? p.name);
export const printName = (p: CertParam): string => {
  const base = plainName(p);
  return p.unit && p.unit !== "%" && !base.includes(`(${p.unit})`) ? `${base} (${p.unit})` : base;
};
/** "ASTM D3175-20", "ISO 1171:2010", "GB/T 212-2008" */
export const methodLabel = (family: string, code: string, edition: string): string =>
  family === "ASTM" ? `ASTM ${code}-${edition.slice(-2)}` : family === "ISO" ? `ISO ${code}:${edition}` : `GB/T ${code}-${edition}`;

const num = (s: string | null | undefined): number | null => (s == null || s === "" ? null : Number.isFinite(Number(s)) ? Number(s) : null);
const sub = (...xs: Array<string | null>): string | null => {   // 100 − x1 − x2 …, from the rounded printed values
  if (xs.some((x) => x == null)) return null;
  return round(xs.reduce((a, x) => a - Number(x), 100), 2);
};

/** Every printed row of one sample, in catalogue order. Rules: Build design 6.1. */
export function buildRows(params: CertParam[], s: CertSampleInput, bases: CertBasis[]): CertRow[] {
  const v = (code: string) => s.values[code];
  const raw = (code: string, basis: string) => { const x = v(code); return x && x.basis === basis && x.value != null && !x.qualifier ? x.value : null; };
  const im = raw("IM", "adb"), tm = raw("TM", "ar"), ash = raw("ASH", "adb");
  const asBases = (by: Partial<Record<CertBasis, string | null>>) => bases.map((b) => by[b] ?? DASH);
  const conv = (value: string, d: number): Record<CertBasis, string | null> => ({
    adb: round(value, d),
    db: im ? round(fromAdb(value, "db", { im }), d) : null,
    daf: im && ash ? round(fromAdb(value, "daf", { im, ash }), d) : null,
    ar: im && tm ? round(fromAdb(value, "ar", { im, tm }), d) : null,
  });
  const made: Record<string, Partial<Record<CertBasis, string | null>>> = {};   // the rounded cells of IM, Ash, VM and TM, which fixed carbon is worked out from
  const rows: CertRow[] = [];
  const ordered = params.filter((p) => !NOT_PRINTED.has(p.code)).sort((a, b) => a.sort - b.sort || (a.itemLabel ?? "").localeCompare(b.itemLabel ?? ""));
  const withMade = ordered.filter((p) => ["TM", "IM", "ASH", "VM"].includes(p.code));
  const row = (p: CertParam, cells: string[] | null, span: string | null = null) => rows.push({ name: printName(p), method: p.method ?? "", cells: cells ?? [], span, code: p.code, label: plainName(p), unit: p.unit ?? null });
  // detection limit and "<": the value prints as typed on its own basis and the conversions are "-"
  const qualified = (p: CertParam, x: CertValue): { q: string; shown: string } | null => {
    if (x.qualifier && x.value != null) return { q: x.qualifier, shown: round(x.value, p.decimals) ?? x.value };
    const n = num(x.value);
    if (p.detectionLimit != null && n != null && n < p.detectionLimit) return { q: "<", shown: round(String(p.detectionLimit), p.decimals) ?? String(p.detectionLimit) };
    return null;
  };
  const cellsFor = (p: CertParam, x: CertValue): { cells: string[]; span: string | null } => {
    const d = p.decimals, mb = x.basis;
    const ql = qualified(p, x);
    if (ql) return { cells: bases.map((b) => (b === mb ? `${ql.q}${ql.shown}` : DASH)), span: null };
    if (x.value == null) return x.text ? { cells: [], span: x.text } : { cells: bases.map(() => DASH), span: null };
    if (p.itemId || p.kind === "text") return { cells: [], span: round(x.value, d) ?? x.value };
    if (p.code === "TM") return { cells: asBases({ ar: round(x.value, d) }), span: null };
    if (p.code === "IM") return { cells: asBases({ adb: round(x.value, d) }), span: null };
    if (mb === "ar") return { cells: asBases({ ar: round(x.value, d) }), span: null };
    if (mb === "adb") { const c = conv(x.value, d); if (p.code === "ASH") c.daf = null; return { cells: asBases(c), span: null }; }
    return { cells: [], span: round(x.value, d) ?? x.value };   // measured on another basis (daf, ash) or on none (HGI): one value
  };
  for (const p of withMade) { const x = v(valueKey(p.code)); if (x) { const c = cellsFor(p, x); made[p.code] = Object.fromEntries(bases.map((b, i) => [b, c.cells[i] === DASH ? null : c.cells[i]])); } }
  for (const p of ordered) {
    const x = v(valueKey(p.code, p.itemId));
    if (!x) { row(p, bases.map(() => DASH)); continue; }
    if (p.code === "FC" && !p.itemId) {
      // fixed carbon: by difference on each basis, from the rounded printed values of that basis (D-13); a basis with a missing input converts the stored value
      const g = (c: string, b: CertBasis) => made[c]?.[b] ?? null;
      const diff: Partial<Record<CertBasis, string | null>> = { adb: sub(g("IM", "adb"), g("ASH", "adb"), g("VM", "adb")), db: sub(g("ASH", "db"), g("VM", "db")), daf: sub(g("VM", "daf")), ar: sub(g("TM", "ar"), g("ASH", "ar"), g("VM", "ar")) };
      const fall = x.value != null && x.basis === "adb" ? conv(x.value, p.decimals) : ({} as Partial<Record<CertBasis, string | null>>);
      row(p, bases.map((b) => diff[b] ?? fall[b] ?? DASH));
      continue;
    }
    const c = cellsFor(p, x);
    row(p, c.span != null ? null : c.cells, c.span);
  }
  return rows;
}

// ---------- the document ----------
export interface CertPayload {
  v: 1; draft: boolean; number: string | null; revision: number; issuedOn: string | null; verifyCode: string | null;
  lab: { name: string; address: string; accreditation: string | null; placeOfIssue: string };
  template: { title: string; statement: string; terms: string; formCode: string; revision: number };
  client: { name: string; address: string; attention: string; reference: string };
  jobOrder: { no: string; receivedOn: string; standards: string[]; sampleCount: number };
  bases: CertBasis[]; remarks: string | null;
  samples: CertSample[];
  signatory: { name: string; title: string; onBehalfOf: string | null };
}
export interface CertAssets { fontCss: string; logo: string; signature: string | null; stamp: string | null }

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
/** "2 Nov 2026" from a date or an ISO timestamp (the day as written, no time zone shift) */
export const fmtDate = (iso: string | null | undefined): string => {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso ?? ""); return m ? `${Number(m[3])} ${MONTHS[Number(m[2]) - 1]} ${m[1]}` : "";
};
/** the code printed in the footer: 8 characters of the payload's SHA-256, as 7F3A-91C2 */
export const verifyCodeOf = (sha256hex: string): string => { const h = sha256hex.slice(0, 8).toUpperCase(); return `${h.slice(0, 4)}-${h.slice(4)}`; };
export const esc = (s: string | null | undefined): string => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** The printed documents' colours (tokens.css, light); shared by the CoA and the RoA. */
export const PRINT_COLORS = { fg: "#1a1a1a", head: "#0e2a4e", sec: "#5c5b55", mut: "#a4a39a", line: "#e8dfc9", err: "#c0392b" };
const C = PRINT_COLORS;
/** The CoA's stylesheet; the RoA builds on it so both documents print with the same fonts, colours and borders. */
export const certCss = (fontCss: string) => css(fontCss);
const css = (fontCss: string) => `${fontCss}
@page { size: 595pt 842pt; }
* { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
body { margin: 0; font: 400 8pt/12pt "Noto Sans", sans-serif; color: ${C.fg}; }
.mono { font-family: "JetBrains Mono", monospace; }
.head { display: flex; justify-content: space-between; align-items: flex-start; gap: 16pt; }
.brand { display: flex; align-items: center; gap: 10pt; min-width: 0; }
.brand img { width: 40pt; height: auto; flex: none; }
.brand b { display: block; font: 600 14pt/16pt Newsreader, serif; color: ${C.head}; }
.brand span { display: block; font-size: 7pt; line-height: 10pt; color: ${C.mut}; max-width: 280pt; }
.no { display: flex; flex-direction: column; align-items: flex-end; font-size: 7.5pt; color: ${C.mut}; }
.no b { font: 600 9pt/14pt "JetBrains Mono", monospace; color: ${C.fg}; }
h1 { margin: 12pt 0 0; text-align: center; font: 500 22pt/28pt Newsreader, serif; color: ${C.head}; }
.meta { display: grid; grid-template-columns: 1fr 1fr; gap: 24pt; margin-top: 10pt; }
.meta dl { margin: 0; display: flex; flex-direction: column; gap: 3pt; }
.meta dl > div { display: grid; grid-template-columns: 70pt 1fr; gap: 6pt; }
.meta dt { color: ${C.mut}; } .meta dd { margin: 0; font-weight: 600; color: ${C.fg}; overflow-wrap: anywhere; }
.statement { margin: 12pt 0 8pt; font-size: 8pt; line-height: 12pt; }
.t { width: 100%; border-collapse: collapse; table-layout: fixed; font-size: 7.5pt; line-height: 11pt; border: 0.75pt solid ${C.line}; margin-bottom: 8pt; }
.t.keep { break-inside: avoid; page-break-inside: avoid; }
.t thead { display: table-header-group; } .t tr { break-inside: avoid; page-break-inside: avoid; }
.t th, .t td { border: 0.75pt solid ${C.line}; padding: 2pt 5pt; text-align: center; color: ${C.fg}; white-space: normal; overflow-wrap: anywhere; }
.t th { font-weight: 700; color: ${C.head}; } .t th.id { font-weight: 400; color: ${C.sec}; }
.t th small { display: block; font: 400 6.5pt/9pt "Noto Sans", sans-serif; color: ${C.mut}; }
.t td.l { text-align: left; } .t td.m { color: ${C.mut}; }
.remarks { margin: 4pt 0 8pt; color: ${C.sec}; overflow-wrap: anywhere; }
.sign { break-inside: avoid; display: flex; justify-content: space-between; align-items: flex-end; margin-top: 12pt; font-size: 8pt; color: ${C.mut}; }
.sign .issued { display: flex; flex-direction: column; gap: 1pt; } .sign b { color: ${C.fg}; }
.sign .who { display: flex; flex-direction: column; gap: 1pt; min-width: 184pt; }
.art { position: relative; height: 46pt; } .art img.sig { position: absolute; left: 0; top: 2pt; height: 40pt; } .art img.stamp { position: absolute; left: 128pt; top: -2pt; width: 50pt; height: 50pt; }
.who .name { align-self: flex-start; border-top: 0.75pt solid ${C.fg}; padding-top: 3pt; font-weight: 600; color: ${C.fg}; min-width: 150pt; }
.mark { position: fixed; top: 38%; left: 0; right: 0; text-align: center; font: 700 90pt/1 "Noto Sans", sans-serif; color: rgba(154,90,0,0.06); transform: rotate(-24deg); letter-spacing: 6pt; }`;

function sampleTable(p: CertPayload, s: CertSample): string {
  const n = p.bases.length, w = Math.round((50 / n) * 100) / 100;
  const long = s.rows.length > 22;
  const cols = `<col style="width:30%"><col style="width:20%">${p.bases.map(() => `<col style="width:${w}%">`).join("")}`;
  const heads = p.bases.map((b) => `<th>${BASIS_LABEL[b][0]}<small>${BASIS_LABEL[b][1]}</small></th>`).join("");
  const body = s.rows.map((r) => `<tr><td class="l">${esc(r.name)}</td><td class="m">${esc(r.method)}</td>${r.span != null ? `<td colspan="${n}" class="mono">${esc(r.span)}</td>` : r.cells.map((c) => `<td class="mono">${esc(c)}</td>`).join("")}</tr>`).join("");
  return `<table class="t${long ? "" : " keep"}"><colgroup>${cols}</colgroup><thead>
    <tr><th rowspan="2">CODE SAMPLE</th><th rowspan="3">Test Method</th><th colspan="${n}" class="mono">${esc(s.sampleCode)}</th></tr>
    <tr><th colspan="${n}" class="mono id">${esc(s.sampleNo)}</th></tr>
    <tr><th>Basis</th>${heads}</tr></thead><tbody>
    <tr><td class="l">Mass as Received (kg)</td><td></td><td colspan="${n}" class="mono">${esc(s.mass ?? DASH)}</td></tr>${body}</tbody></table>`;
}

/** The certificate as one HTML document (A4 pages, pt units). `assets` carries the fonts and images as data URIs, so a PDF never needs the network. */
export function renderCertificateHtml(p: CertPayload, a: CertAssets): string {
  const rcv = fmtDate(p.jobOrder.receivedOn);
  const sign = p.draft ? "" : `${a.signature ? `<img class="sig" src="${a.signature}">` : ""}${a.stamp ? `<img class="stamp" src="${a.stamp}">` : ""}`;
  return `<!doctype html><html><head><meta charset="utf-8"><title>${esc(p.number ?? "Draft CoA")}</title><style>${css(a.fontCss)}</style></head><body>${p.draft ? '<div class="mark">DRAFT</div>' : ""}
<div class="head"><div class="brand"><img src="${a.logo}"><div><b>${esc(p.lab.name)}</b><span>${esc(p.lab.address)}${p.lab.accreditation ? ". Accreditation " + esc(p.lab.accreditation) : ""}</span></div></div>
<div class="no"><b>${esc(p.number ?? "Assigned at signing")}</b><span>Revision ${p.revision}</span><span>${p.draft ? "Draft" : "Issued " + fmtDate(p.issuedOn)}</span></div></div>
<h1>${esc(p.template.title)}</h1>
<div class="meta"><dl><div><dt>Principal</dt><dd>${esc(p.client.name)}</dd></div><div><dt>Address</dt><dd>${esc(p.client.address)}</dd></div><div><dt>Attention</dt><dd>${esc(p.client.attention)}</dd></div><div><dt>Reference</dt><dd>${esc(p.client.reference)}</dd></div></dl>
<dl><div><dt>Job order</dt><dd class="mono">${esc(p.jobOrder.no)}</dd></div><div><dt>Received</dt><dd>${esc(rcv)}</dd></div><div><dt>Samples</dt><dd>${p.jobOrder.sampleCount} coal ${p.jobOrder.sampleCount === 1 ? "sample" : "samples"}</dd></div><div><dt>Standard</dt><dd>${esc(p.jobOrder.standards.join(", "))}</dd></div></dl></div>
<p class="statement">${esc(p.template.statement)}</p>
${p.samples.map((s) => sampleTable(p, s)).join("\n")}
${p.remarks ? `<p class="remarks">Remarks: ${esc(p.remarks)}</p>` : ""}
<div class="sign"><div class="issued"><span>Issued at ${esc(p.lab.placeOfIssue)}</span><b>${p.draft ? "Date of signing" : fmtDate(p.issuedOn)}</b></div>
<div class="who"><div class="art">${sign}</div><span class="name">${esc(p.signatory.name)}</span><span>${esc(p.signatory.title)}</span>${p.signatory.onBehalfOf ? `<span>On behalf of ${esc(p.signatory.onBehalfOf)}</span>` : ""}</div></div></body></html>`;
}

/** The footer Gotenberg repeats on every page: the terms, page n of m, the verification code and the form code with its revision. */
export function renderCertificateFooter(p: CertPayload, fontCss: string): string {
  return `<html><head><style>${fontCss} body{margin:0;width:100%} .f{width:100%;margin:0 40pt;padding-top:6pt;border-top:0.75pt solid ${C.line};display:flex;justify-content:space-between;align-items:flex-end;font:400 7pt/10pt "Noto Sans",sans-serif;color:${C.mut};-webkit-print-color-adjust:exact} .r{text-align:right}</style></head><body>
<div class="f"><div>${esc(p.template.terms)}<br>Page <span class="pageNumber"></span> of <span class="totalPages"></span></div><div class="r">${p.draft ? "Verify at signing" : "Verify " + esc(p.verifyCode ?? "")}<br>${esc(p.template.formCode)} rev ${p.template.revision}</div></div></body></html>`;
}
