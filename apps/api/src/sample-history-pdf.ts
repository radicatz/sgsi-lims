// Sample history as a PDF (Phase 5, slice B; the Export PDF button on frame Desktop-08-Search-04-Sample_history-01-Default): the page's sample card and timeline on A4,
// with the lab logo and the fonts embedded, rendered by Gotenberg like the CoA and the RoA. Values appear only when the history carries them (result.read).
import { baseAssets, PdfUnavailable } from "./pdf";
import { env } from "./env";
import { TZ } from "./batch-lib";
import type { SampleHistory } from "./routes/sample-history";

const esc = (v: unknown) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
const when = (iso: string) => {
  const d = new Date(iso);
  const day = d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: TZ });
  const time = d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: TZ });
  return `${day}, ${time}`;
};

export function renderHistoryHtml(h: SampleHistory): string {
  const a = baseAssets(), s = h.sample;
  const depth = s.depthFrom != null && s.depthTo != null ? `${s.depthFrom.toFixed(2)} to ${s.depthTo.toFixed(2)} m` : "-";
  const kv: Array<[string, string]> = [
    ["Drill hole", s.drillHole ?? "-"], ["Depth", depth], ["Description", s.description ?? "-"], ["Ply or composite", s.plyComp === "comp" ? "Composite" : s.plyComp === "ply" ? "Ply" : "-"], ["Sample type", s.sampleType ?? "-"],
    ["Mass received", s.mass != null ? `${s.mass.toFixed(2)} kg` : "-"], ["Condition", s.condition ?? "-"], ["Status", s.status],
    ...(s.held ? [["Held reason", [s.held.reason, s.held.note].filter(Boolean).join(", ") || "-"] as [string, string]] : []),
  ];
  const ids = [s.sampleCode, s.clientRef, s.orderNo, s.batchNo, s.company].filter(Boolean).map((x) => `<span>${esc(x)}</span>`).join("");
  const events = h.events.map((e) => `
    <div class="ev ${e.tone}">
      <i class="dot"></i>
      <div class="body">
        <div class="tt">${esc(e.title)}</div>
        ${e.detail ? `<div class="meta">${e.detail.split("\t").map((x) => `<span>${esc(x)}</span>`).join("")}</div>` : ""}
        ${e.values?.length ? `<div class="vals">${e.values.map((v) => `<span><b>${esc(v.code)}</b> ${esc(v.value)} <em>${esc(v.basis)}</em></span>`).join("")}</div>` : ""}
        ${e.at ? `<div class="meta">${e.by ? `<span>${esc(e.by)}</span>` : ""}<span>${esc(when(e.at))}</span></div>` : ""}
      </div>
    </div>`).join("");
  return `<!doctype html><html><head><meta charset="utf-8"><style>
${a.fontCss}
* { box-sizing: border-box; }
body { margin: 0; font: 400 10pt/1.45 "Noto Sans", sans-serif; color: #1B2A3E; }
header { display: flex; align-items: center; gap: 10pt; padding-bottom: 10pt; border-bottom: 1px solid #E6E1D3; }
header img { width: 30pt; height: 30pt; }
header .lab { font: 600 12pt/1.2 "Newsreader", serif; color: #13294B; }
header .doc { margin-left: auto; font: 500 8pt/1.2 "JetBrains Mono", monospace; letter-spacing: 1.2pt; text-transform: uppercase; color: #8A877D; }
h1 { font: 500 22pt/1.15 "Newsreader", serif; color: #13294B; margin: 14pt 0 4pt; }
.ids { display: flex; flex-wrap: wrap; gap: 4pt 12pt; font: 400 9pt/1.4 "JetBrains Mono", monospace; color: #5C5B55; }
h2 { font: 600 12pt/1.2 "Newsreader", serif; color: #13294B; margin: 18pt 0 8pt; }
table { border-collapse: collapse; width: 100%; }
td { padding: 3pt 0; vertical-align: top; } td.k { width: 110pt; color: #5C5B55; }
.ev { display: flex; gap: 8pt; padding: 7pt 0; border-top: 1px solid #EEEAE0; break-inside: avoid; }
.ev:first-child { border-top: 0; }
.dot { width: 6pt; height: 6pt; border-radius: 50%; background: #2E7D5B; margin-top: 4pt; flex: none; }
.ev.warn .dot { background: #E0A43A; } .ev.pending .dot { background: #C9C4B6; }
.tt { font-weight: 600; color: #13294B; } .ev.pending .tt { font-weight: 400; color: #8A877D; }
.meta { display: flex; flex-wrap: wrap; gap: 2pt 10pt; font-size: 8.5pt; color: #5C5B55; margin-top: 2pt; }
.vals { display: flex; flex-wrap: wrap; gap: 2pt 12pt; font: 400 8.5pt/1.4 "JetBrains Mono", monospace; margin-top: 3pt; }
.vals em { font-style: normal; color: #8A877D; }
footer { margin-top: 18pt; padding-top: 8pt; border-top: 1px solid #E6E1D3; font-size: 8pt; color: #8A877D; }
</style></head><body>
<header><img src="${a.logo}" alt=""><span class="lab">${esc(h.lab)}</span><span class="doc">Sample history</span></header>
<h1>${esc(s.title)}</h1>
<div class="ids">${ids}</div>
<h2>Sample</h2>
<table>${kv.map(([k, v]) => `<tr><td class="k">${esc(k)}</td><td>${esc(v)}</td></tr>`).join("")}</table>
<h2>History</h2>
<div>${events}</div>
<footer>Printed ${esc(when(new Date().toISOString()))} from SGSI LIMS. Grey entries are steps not reached yet.</footer>
</body></html>`;
}

/** A4, the same margins as the CoA (34 pt top, 40 pt sides), 40 pt at the bottom (no running footer). */
export async function renderHistoryPdf(h: SampleHistory): Promise<Buffer> {
  const fd = new FormData();
  fd.append("files", new Blob([renderHistoryHtml(h)], { type: "text/html" }), "index.html");
  const pt = (n: number) => String(Math.round((n / 72) * 10000) / 10000);
  for (const [k, v] of Object.entries({ paperWidth: pt(595), paperHeight: pt(842), marginTop: pt(34), marginBottom: pt(40), marginLeft: pt(40), marginRight: pt(40), printBackground: "true", preferCssPageSize: "false" })) fd.append(k, v);
  let res: Response;
  try { res = await fetch(`${env.GOTENBERG_URL}/forms/chromium/convert/html`, { method: "POST", body: fd, signal: AbortSignal.timeout(60_000) }); }
  catch { throw new PdfUnavailable("The PDF service is not available."); }
  if (!res.ok) throw new PdfUnavailable(`The PDF service refused the history (${res.status}).`);
  const pdf = Buffer.from(await res.arrayBuffer());
  if (pdf.subarray(0, 5).toString("latin1") !== "%PDF-") throw new PdfUnavailable("The PDF service did not return a PDF.");
  return pdf;
}
