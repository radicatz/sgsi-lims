// Sample labels (Batch_Build_Design.md section 9; spec 6.1, F-LBL-01): 50 x 30 mm, the sample code, the company, a Code 128 barcode of the Sample ID, the
// Sample ID, the job order and the date received. The printer is not known yet (request item 7), so a print goes through the browser's print window.
import { code128Bars } from "@sgsi/shared";

export interface LabelData { sampleNo: string; sampleCode: string; orderNo: string; receivedOn: string; company: string }

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

/** The barcode as an SVG string: the bars, with a quiet zone of 10 modules each side. */
export function barcodeSvg(text: string, height = 11): string {
  const { bars, width } = code128Bars(text), total = width + 20;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${total} 10" preserveAspectRatio="none" width="100%" height="${height}mm" shape-rendering="crispEdges" role="img" aria-label="Barcode of ${esc(text)}">`
    + `<g fill="#000">${bars.map(([x, w]) => `<rect x="${x + 10}" y="0" width="${w}" height="10"/>`).join("")}</g></svg>`;
}

/** One label as HTML (used for the preview in the dialog and for the print sheet). */
export const labelHtml = (l: LabelData) => `<div class="slbl"><div class="top"><b>${esc(l.sampleCode)}</b><span>${esc(l.company)}</span></div>${barcodeSvg(l.sampleNo)}`
  + `<div class="id">${esc(l.sampleNo)}</div><div class="foot"><span>${esc(l.orderNo)}</span><span>${esc(l.receivedOn)}</span></div></div>`;

export const LABEL_CSS = `.slbl{box-sizing:border-box;width:50mm;height:30mm;padding:2mm 2.5mm;display:flex;flex-direction:column;justify-content:space-between;background:#fff;color:#000;font:6.5pt/1.2 "Noto Sans",Arial,sans-serif;overflow:hidden}
.slbl .top{display:flex;justify-content:space-between;align-items:baseline;gap:2mm}.slbl .top b{font:700 9pt/1.1 "Noto Sans Mono",Consolas,monospace}.slbl .id{font:6.5pt/1 "Noto Sans Mono",Consolas,monospace;text-align:center}
.slbl .foot{display:flex;justify-content:space-between}`;

/** Print the labels, `copies` of each, through a hidden frame: no pop-up to be blocked. */
export function printLabels(labels: LabelData[], copies: number) {
  const sheet = labels.flatMap((l) => Array.from({ length: copies }, () => `<section>${labelHtml(l)}</section>`)).join("");
  const frame = document.createElement("iframe");
  frame.setAttribute("aria-hidden", "true");
  Object.assign(frame.style, { position: "fixed", right: "0", bottom: "0", width: "0", height: "0", border: "0" });
  document.body.appendChild(frame);
  const doc = frame.contentDocument!;
  doc.open();
  doc.write(`<!doctype html><html><head><meta charset="utf-8"><title>Labels</title><style>@page{size:50mm 30mm;margin:0}html,body{margin:0}section{page-break-after:always;break-after:page}${LABEL_CSS}</style></head><body>${sheet}</body></html>`);
  doc.close();
  const done = () => setTimeout(() => frame.remove(), 1000);
  frame.contentWindow!.addEventListener("afterprint", done);
  // a browser under automation (the browser tests) has no print window to answer, so it stops here
  if ((navigator as Navigator & { webdriver?: boolean }).webdriver) return done();
  setTimeout(() => { frame.contentWindow!.focus(); frame.contentWindow!.print(); done(); }, 150);
}
