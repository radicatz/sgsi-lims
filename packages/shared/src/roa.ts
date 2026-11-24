// The Report of Analysis (RoA) the app drafts for a batch (owner, Nov 24 2026): the SGSI RoA template (.context/deliverables/SGSI_ROA_Template.docx)
// with one table per sample. The lab prints it, the Supervisor signs it on paper, and the Lab admin uploads the signed copy (D-49 is unchanged).
// Reuses the certificate's row rules (buildRows), so a value prints the same on the RoA and on the CoA. Differences from the CoA: Reports_Build_Design.md 17.
import { BASIS_LABEL, PRINT_COLORS, buildRows, certCss, esc, fmtDate, type CertBasis, type CertParam, type CertRow, type CertSampleInput } from "./certificate";

/** SGSI template order: As Received first. Every basis is printed: the RoA is the lab's full record, the CoA prints what the client chose. */
export const ROA_BASES: CertBasis[] = ["ar", "adb", "db", "daf"];
const LABEL: Record<CertBasis, string> = { ar: "AR", adb: "ADB", db: "DB", daf: "DAF" };

export interface RoaSample { sampleCode: string; labId: string; mass: string | null; rows: CertRow[] }
export interface RoaPayload {
  number: string | null;              // the lab's RoA number; null prints a line to write it in
  reportedOn: string;                 // date the RoA was drafted
  lab: { name: string; address: string; accreditation: string | null; placeOfIssue: string };
  client: { name: string; address: string; attention: string; reference: string };
  batchNo: string; jobOrderNo: string; standard: string;
  receivedOn: string; testedFrom: string | null; testedTo: string | null;
  samples: RoaSample[];
  remarks: string | null;
  formCode: string;
}
export interface RoaAssets { fontCss: string; logo: string }

export const roaSample = (params: CertParam[], s: CertSampleInput): RoaSample =>
  ({ sampleCode: s.sampleCode, labId: s.sampleNo, mass: s.mass, rows: buildRows(params, s, ROA_BASES) });

const unitText = (u: string | null) => (u === "%" ? "wt. %" : u ?? "");
const dateRange = (a: string | null, b: string | null) => {
  if (!a && !b) return "";
  const x = fmtDate(a ?? b), y = fmtDate(b ?? a);
  return x === y ? x : `${x} to ${y}`;
};

const C = PRINT_COLORS;
/** The CoA's stylesheet (fonts, colours, borders, header, meta, table, signature) plus the few rules only the RoA needs. */
const css = (fontCss: string) => `${certCss(fontCss)}
.t td.unit { color: ${C.sec}; } .t td.m { text-align: left; }
.t th.lbl { text-align: left; font-weight: 400; color: ${C.mut}; }
.notes { margin: 0 0 8pt; font-size: 7pt; line-height: 10pt; color: ${C.mut}; }
.who .for { color: ${C.mut}; } .who .co { font-weight: 600; color: ${C.fg}; }
.write { display: inline-block; width: 92pt; height: 12pt; border-bottom: 0.75pt solid ${C.fg}; }`;

function sampleBlock(s: RoaSample): string {
  const n = ROA_BASES.length;
  const heads = ROA_BASES.map((b) => `<th>${LABEL[b]}<small>${BASIS_LABEL[b][1]}</small></th>`).join("");
  const body = s.rows.map((r) => {
    const name = `${esc(r.label)}${r.code === "FC" ? "<sup>1</sup>" : ""}`;
    const cells = r.span != null ? `<td colspan="${n}" class="mono">${esc(r.span)}</td>` : r.cells.map((c) => `<td class="mono">${esc(c)}</td>`).join("");
    return `<tr><td class="l">${name}</td><td class="unit">${esc(unitText(r.unit))}</td>${cells}<td class="m">${esc(r.method)}</td></tr>`;
  }).join("");
  // the head mirrors the CoA's CODE SAMPLE rows: the sample code, the lab sample ID under it, then the column names
  return `<table class="t${s.rows.length > 22 ? "" : " keep"}"><colgroup><col style="width:26%"><col style="width:7%">${ROA_BASES.map(() => '<col style="width:10.5%">').join("")}<col style="width:25%"></colgroup><thead>
<tr><th colspan="2" class="lbl">Sample code</th><th colspan="${n + 1}" class="mono">${esc(s.sampleCode || "-")}</th></tr>
<tr><th colspan="2" class="lbl">Lab sample ID</th><th colspan="${n + 1}" class="mono id">${esc(s.labId)}</th></tr>
<tr><th>Parameter</th><th>Unit</th>${heads}<th>Test Method</th></tr></thead>
<tbody><tr><td class="l">Mass as Received</td><td class="unit">kg</td><td colspan="${n}" class="mono">${esc(s.mass ?? "-")}</td><td></td></tr>${body}</tbody></table>`;
}

/** The RoA as one HTML document (A4, pt units); fonts and logo come in as data URIs, so the PDF never needs the network. Laid out like the CoA. */
export function renderRoaHtml(p: RoaPayload, a: RoaAssets): string {
  const n = p.samples.length;
  const row = (k: string, v: string, mono = false) => `<div><dt>${k}</dt><dd${mono ? ' class="mono"' : ""}>${v || "-"}</dd></div>`;
  return `<!doctype html><html><head><meta charset="utf-8"><title>${esc(p.number ?? `RoA ${p.batchNo}`)}</title><style>${css(a.fontCss)}</style></head><body>
<div class="head"><div class="brand"><img src="${a.logo}"><div><b>${esc(p.lab.name)}</b><span>${esc(p.lab.address)}${p.lab.accreditation ? ". Accreditation " + esc(p.lab.accreditation) : ""}</span></div></div>
<div class="no">${p.number ? `<b>${esc(p.number)}</b>` : '<span class="write"></span><span>Report No.</span>'}<span>Reported ${esc(fmtDate(p.reportedOn))}</span></div></div>
<h1>Report of Analysis</h1>
<div class="meta"><dl>${row("Principal", esc(p.client.name))}${row("Address", esc(p.client.address))}${row("Attention", esc(p.client.attention))}${row("Reference order", esc(p.client.reference))}${row("Consignment", "Coal")}</dl>
<dl>${row("Batch", esc(p.batchNo), true)}${row("Job order", esc(p.jobOrderNo), true)}${row("Samples", `${n} coal ${n === 1 ? "sample" : "samples"}`)}${row("Received", esc(fmtDate(p.receivedOn)))}${row("Tested", esc(dateRange(p.testedFrom, p.testedTo)))}${row("Standard", esc(p.standard))}</dl></div>
<p class="statement">The samples identified below were tested using the methods listed. Results are reported on the indicated basis.</p>
${p.samples.map(sampleBlock).join("\n")}
<p class="notes"><sup>1</sup> Fixed Carbon is calculated by difference on the corresponding reporting basis.</p>
${p.remarks ? `<p class="remarks">Remarks: ${esc(p.remarks)}</p>` : ""}
<div class="sign"><div class="issued"><span>Issued at ${esc(p.lab.placeOfIssue)}</span><b>${esc(fmtDate(p.reportedOn))}</b></div>
<div class="who"><span class="for">For and on behalf of</span><span class="co">${esc(p.lab.name)}</span><div class="art"></div><span class="name">&nbsp;</span><span>Laboratory Supervisor</span></div></div>
</body></html>`;
}

/** The footer Gotenberg repeats on every page. */
export function renderRoaFooter(p: RoaPayload, fontCss: string): string {
  return `<html><head><style>${fontCss} body{margin:0;width:100%} .f{width:100%;margin:0 40pt;padding-top:6pt;border-top:0.75pt solid ${C.line};display:flex;justify-content:space-between;align-items:flex-end;font:400 7pt/10pt "Noto Sans",sans-serif;color:${C.mut};-webkit-print-color-adjust:exact} .r{text-align:right}</style></head><body>
<div class="f"><div>Results apply only to the samples tested. Internal report, not for distribution.<br>Page <span class="pageNumber"></span> of <span class="totalPages"></span></div><div class="r">${esc(p.number ?? p.batchNo)}<br>${esc(p.formCode)}</div></div></body></html>`;
}
