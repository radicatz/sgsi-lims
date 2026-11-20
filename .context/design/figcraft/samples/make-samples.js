// Sample certificates for the design (Reports_Screen_Plan.md 16.8): the CoA and the RoA as the real renderer will print them.
// HTML in the styles of the Configuration > Report templates preview (apps/web/src/styles/overlays.css .a4*): A4, 1 px of that preview = 1 pt here,
// so every size below is in pt. Colours: keys muted, strokes the warm border, values neutral, navy only for the brand name and headings.
// Cells WRAP (the preview crops them with an ellipsis). Gotenberg renders the PDF; PyMuPDF turns each page into a PNG for the FigCraft preview frames.
// node make-samples.js        (needs the Gotenberg container on :3000 and Python with pymupdf)  ->  samples/<key>.html|pdf|-p1.png ...
const fs = require("fs"), path = require("path"), cp = require("child_process");
const OUT = __dirname, ASSETS = "D:/SGSI/LIMS/.context/assets", FONTS = process.env.LOCALAPPDATA + "/Microsoft/Windows/Fonts";
const b64 = (f, mime) => `data:${mime};base64,` + fs.readFileSync(f).toString("base64");
const IMG = { icon: b64(ASSETS + "/sgsi-icon-primary.svg", "image/svg+xml"), stamp: b64(ASSETS + "/images/sgsi-stamp.svg", "image/svg+xml"), sign: b64(ASSETS + "/images/b_sutrisno-sign.png", "image/png") };
const FONT_CSS = `
@font-face { font-family: "Noto Sans"; src: url(${b64(FONTS + "/NotoSans-VF.ttf", "font/ttf")}); font-weight: 100 900; }
@font-face { font-family: "Newsreader"; src: url(${b64(FONTS + "/Newsreader.ttf", "font/ttf")}); font-weight: 200 800; }
@font-face { font-family: "JetBrains Mono"; src: url(${b64(FONTS + "/JetBrainsMono.ttf", "font/ttf")}); font-weight: 100 800; }`;
// tokens.css, light: --text-foreground, --text-heading, --text-secondary, --text-muted, --surface-border, --feedback-error
const C = { fg: "#1a1a1a", head: "#0e2a4e", sec: "#4a5876", mut: "#a4a39a", line: "#e8dfc9", err: "#c0392b" };

// ---------- values: ADB measured, the other bases converted, FC by difference on each basis from the rounded values (spec D-13) ----------
const r2 = (x) => x.toFixed(2), r0 = (x) => String(Math.round(x));
function sample(i) {
  const fixed = [[14.2, 8.1, 5.42, 39.85, 0.42, 5980, 9.15], [13.8, 7.9, 6.1, 38.9, 0.51, 5890, 10.25]][i];
  const [tm, im, ash, vm, ts, gcv, mass] = fixed || [12 + ((i * 7) % 40) / 10, 7.5 + ((i * 3) % 20) / 10, 4 + ((i * 13) % 60) / 10, 38 + ((i * 11) % 50) / 10, 0.3 + ((i * 5) % 40) / 100, 5700 + ((i * 97) % 500), 8 + ((i * 37) % 50) / 10];
  const db = 100 / (100 - im), daf = 100 / (100 - im - ash), ar = (100 - tm) / (100 - im);
  const A = { ash: [ash, ash * db, null, ash * ar], vm: [vm, vm * db, vm * daf, vm * ar], ts: [ts, ts * db, ts * daf, ts * ar], gcv: [gcv, gcv * db, gcv * daf, gcv * ar] };
  const f = (a) => a.map((x) => (x == null ? "-" : r2(x)));
  const ashS = f(A.ash), vmS = f(A.vm), tsS = f(A.ts), gcvS = A.gcv.map(r0);
  const n = (s) => Number(s);
  const fc = [100 - n(r2(im)) - n(ashS[0]) - n(vmS[0]), 100 - n(ashS[1]) - n(vmS[1]), 100 - n(vmS[2]), 100 - n(r2(tm)) - n(ashS[3]) - n(vmS[3])].map(r2);
  return { mass: r2(mass), rows: [
    ["Total Moisture", "ASTM D3302-19", "-", "-", "-", r2(tm)], ["Moisture in the Analysis Sample", "ASTM D3173-17", r2(im), "-", "-", "-"], ["Ash Content", "ASTM D3174-12", ...ashS],
    ["Volatile Matter", "ASTM D3175-20", ...vmS], ["Fixed Carbon", "ASTM D3172-13", ...fc], ["Total Sulphur", "ASTM D4239-18", ...tsS], ["Gross Calorific Value (kcal/kg)", "ASTM D5865-19", ...gcvS],
  ] };
}

// ---------- html ----------
const BASES = [["ADB", "Air Dried"], ["DB", "Dry"], ["DAF", "Dry Ash Free"], ["AR", "As Received"]];
function table(d, i) {
  const s = sample(i), code = `${d.code}.RI.${String(i + 1).padStart(3, "0")}.Lot01`, id = `SG.${d.rcv}.${d.code}.RI.${String(i + 1).padStart(3, "0")}`;
  if (d.held && i === d.held) return `<table class="t"><colgroup><col style="width:34%"><col style="width:22%"><col></colgroup><thead><tr><th>CODE SAMPLE</th><th>Test Method</th><th class="mono">${code}<small class="mono">${id}</small></th></tr></thead><tbody><tr><td colspan="3" class="held">Not analysed. Held at reception: sample damaged on arrival.</td></tr></tbody></table>`;
  return `<table class="t"><colgroup><col style="width:30%"><col style="width:20%"><col><col><col><col></colgroup><thead>
    <tr><th rowspan="2">CODE SAMPLE</th><th rowspan="3">Test Method</th><th colspan="4" class="mono">${code}</th></tr>
    <tr><th colspan="4" class="mono id">${id}</th></tr>
    <tr><th>Basis</th>${BASES.map(([a, f]) => `<th>${a}<small>${f}</small></th>`).join("")}</tr></thead><tbody>
    <tr><td class="l">Mass as Received (kg)</td><td></td><td colspan="4" class="mono">${s.mass}</td></tr>
    ${s.rows.map((r) => `<tr><td class="l">${r[0]}</td><td class="m">${r[1]}</td>${r.slice(2).map((v) => `<td class="mono">${v}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
}
const CSS = `${FONT_CSS}
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
.no .err { color: ${C.err}; }
h1 { margin: 12pt 0 0; text-align: center; font: 500 22pt/28pt Newsreader, serif; color: ${C.head}; }
.meta { display: grid; grid-template-columns: 1fr 1fr; gap: 24pt; margin-top: 10pt; }
.meta dl { margin: 0; display: flex; flex-direction: column; gap: 3pt; }
.meta dl > div { display: grid; grid-template-columns: 70pt 1fr; gap: 6pt; }
.meta dt { color: ${C.mut}; } .meta dd { margin: 0; font-weight: 600; color: ${C.fg}; }
.statement { margin: 12pt 0 8pt; font-size: 8pt; line-height: 12pt; }
.t { width: 100%; border-collapse: collapse; table-layout: fixed; font-size: 7.5pt; line-height: 11pt; border: 0.75pt solid ${C.line}; margin-bottom: 8pt; break-inside: avoid; page-break-inside: avoid; }
.t th, .t td { border: 0.75pt solid ${C.line}; padding: 2pt 5pt; text-align: center; color: ${C.fg}; white-space: normal; overflow-wrap: anywhere; }
.t th { font-weight: 700; color: ${C.head}; } .t th.id { font-weight: 400; color: ${C.sec}; }
.t th small { display: block; font: 400 6.5pt/9pt "Noto Sans", sans-serif; color: ${C.mut}; } .t th small.mono { font-family: "JetBrains Mono", monospace; }
.t td.l { text-align: left; } .t td.m { color: ${C.mut}; } .t td.held { text-align: left; color: ${C.sec}; }
.t td.mono, .t th.mono { font-size: 7.5pt; }
.remarks { margin: 4pt 0 8pt; color: ${C.sec}; }
.sign { break-inside: avoid; display: flex; justify-content: space-between; align-items: flex-end; margin-top: 12pt; font-size: 8pt; color: ${C.mut}; }
.sign .issued { display: flex; flex-direction: column; gap: 1pt; } .sign b { color: ${C.fg}; }
.sign .who { display: flex; flex-direction: column; gap: 1pt; min-width: 184pt; }
.art { position: relative; height: 46pt; } .art img.sig { position: absolute; left: 0; top: 2pt; height: 40pt; } .art img.stamp { position: absolute; left: 128pt; top: -2pt; width: 50pt; height: 50pt; }
.who .name { align-self: flex-start; border-top: 0.75pt solid ${C.fg}; padding-top: 3pt; font-weight: 600; color: ${C.fg}; min-width: 150pt; }
.mark { position: fixed; top: 38%; left: 0; right: 0; text-align: center; font: 700 90pt/1 "Noto Sans", sans-serif; color: rgba(154,90,0,0.06); transform: rotate(-24deg); letter-spacing: 6pt; }`;
function html(d) {
  const roa = d.kind === "roa", n = d.n, tables = Array.from({ length: n }, (_, i) => table(d, i)).join("");
  const num = roa ? d.number : d.draft ? "Assigned at signing" : d.number;
  return `<!doctype html><html><head><meta charset="utf-8"><style>${CSS}</style></head><body>${d.draft ? '<div class="mark">DRAFT</div>' : ""}
  <div class="head"><div class="brand"><img src="${IMG.icon}"><div><b>PT Sentra Geo Survey Indonesia</b><span>Jl. Rapak Indah No. 120, Loa Bakung, Sungai Kunjang, Samarinda, Kalimantan Timur 75243. Accreditation LP-1234-IDN</span></div></div>
  <div class="no"><b>${num}</b>${roa ? '<span class="err">Internal, not for distribution</span>' : `<span>Revision ${d.rev || 1}</span>`}<span>${d.draft ? "Draft" : "Issued " + d.issued}</span></div></div>
  <h1>${roa ? "Report of Analysis" : "Certificate of Analysis"}</h1>
  <div class="meta"><dl><div><dt>Principal</dt><dd>${d.client}</dd></div><div><dt>Address</dt><dd>${d.address}</dd></div><div><dt>Attention</dt><dd>${d.attention}</dd></div><div><dt>Reference</dt><dd>${d.ref}</dd></div></dl>
  <dl><div><dt>${roa ? "Batch" : "Job order"}</dt><dd class="mono">${roa ? d.batch : d.jo}</dd></div>${roa ? `<div><dt>Job order</dt><dd class="mono">${d.jo}</dd></div>` : ""}<div><dt>Received</dt><dd>${d.rcvText}</dd></div><div><dt>Samples</dt><dd>${roa ? "11 coal samples, 1 held" : "11 coal samples"}</dd></div>${roa ? "" : `<div><dt>Standard</dt><dd>ASTM</dd></div>`}</dl></div>
  <p class="statement">${roa ? "Results as entered by the Analyst and signed by the Supervisor. The values are reported on four bases." : "Samples were prepared and analysed in accordance with the ASTM methods listed. The results relate to the samples as received."}</p>
  ${tables}
  ${d.remarks ? `<p class="remarks">Remarks: ${d.remarks}</p>` : ""}
  <div class="sign"><div class="issued"><span>Issued at Samarinda</span><b>${d.draft ? "Date of signing" : d.issued}</b></div>
  <div class="who"><div class="art">${d.signed ? `<img class="sig" src="${IMG.sign}"><img class="stamp" src="${IMG.stamp}">` : ""}</div><span class="name">${d.signer}</span><span>${d.signerTitle}</span></div></div></body></html>`;
}
const footer = (d) => `<html><head><style>${FONT_CSS} body{margin:0;width:100%} .f{width:100%;margin:0 40pt;padding-top:6pt;border-top:0.75pt solid ${C.line};display:flex;justify-content:space-between;align-items:flex-end;font:400 7pt/10pt "Noto Sans",sans-serif;color:${C.mut};-webkit-print-color-adjust:exact} .r{text-align:right}</style></head><body>
<div class="f"><div>${d.kind === "roa" ? "Internal, not for distribution. Signed copy kept in the laboratory file." : "This certificate may not be reproduced except in full."}<br>Page <span class="pageNumber"></span> of <span class="totalPages"></span></div><div class="r">${d.kind === "roa" ? "" : (d.draft ? "Verify at signing<br>" : "Verify 7F3A-91C2<br>")}${d.form}</div></div></body></html>`;

const MGR = { signer: "Ir. Bambang Sutrisno, M.T.", signerTitle: "Laboratory Manager" };
const DOCS = [
  { key: "coa-draft-sbh", kind: "coa", draft: true, ...MGR, client: "CV Sumber Batu Hitam", address: "Jl. Pahlawan No. 7, Balikpapan", attention: "Budi Santoso", ref: "SBH-077", jo: "JO-2026-0132", code: "005", rcv: "261029", rcvText: "29 Oct 2026", n: 11, form: "FM-LAB-014 rev 2" },
  { key: "coa-signed-ptba", kind: "coa", signed: true, ...MGR, number: "CoA-JO-2026-0142-1", issued: "2 Nov 2026", client: "PT Bukit Asam Tbk", address: "Jl. Parigi No. 1, Tanjung Enim", attention: "Budi Santoso", ref: "PTBA-2210", jo: "JO-2026-0142", code: "004", rcv: "261029", rcvText: "29 Oct 2026", n: 11, form: "FM-LAB-014 rev 2" },
  { key: "coa-signed-bnm-r1", kind: "coa", signed: true, ...MGR, number: "CoA-JO-2026-0131-1", issued: "28 Oct 2026", client: "PT Bara Nusantara Mandiri", address: "Jl. Mulawarman No. 12, Samarinda", attention: "Budi Hartono", ref: "BNM-318", jo: "JO-2026-0131", code: "001", rcv: "261021", rcvText: "21 Oct 2026", n: 11, form: "FM-LAB-014 rev 2" },
  { key: "coa-draft-ptba-rev3", kind: "coa", draft: true, ...MGR, number: "Assigned at signing", client: "PT Bukit Asam Tbk", address: "Jl. Parigi No. 1, Tanjung Enim", attention: "Budi Santoso", ref: "PTBA-2210", jo: "JO-2026-0142", code: "004", rcv: "261029", rcvText: "29 Oct 2026", n: 11, form: "FM-LAB-014 rev 3" },
  { key: "roa-0412", kind: "roa", number: "RoA-0412", issued: "2 Nov 2026", signer: "Hendra Wijaya, S.T.", signerTitle: "Technical Supervisor", client: "PT Bukit Asam Tbk", address: "Jl. Parigi No. 1, Tanjung Enim", attention: "Budi Santoso", ref: "PTBA-2210", batch: "B-2026-0412", jo: "JO-2026-0142", code: "004", rcv: "261029", rcvText: "29 Oct 2026", n: 12, held: 11, form: "FM-LAB-021 rev 1" },
];
const PY = `import sys, pymupdf
doc = pymupdf.open(sys.argv[1]); print(len(doc))
for i, p in enumerate(doc): p.get_pixmap(matrix=pymupdf.Matrix(3, 3), alpha=False).save(sys.argv[2] + "-p%d.png" % (i + 1))`;
(async () => {
  const only = process.argv[2];
  for (const d of DOCS) {
    if (only && d.key !== only) continue;
    const h = html(d); fs.writeFileSync(path.join(OUT, d.key + ".html"), h);
    const fd = new FormData();
    fd.append("files", new Blob([h], { type: "text/html" }), "index.html"); fd.append("files", new Blob([footer(d)], { type: "text/html" }), "footer.html");
    for (const [k, v] of Object.entries({ paperWidth: "8.2639", paperHeight: "11.6944", marginTop: "0.4722", marginBottom: "0.9", marginLeft: "0.5556", marginRight: "0.5556", printBackground: "true", preferCssPageSize: "false" })) fd.append(k, v);
    const res = await fetch("http://localhost:3000/forms/chromium/convert/html", { method: "POST", body: fd });
    if (!res.ok) { console.log("FAILED", d.key, res.status, (await res.text()).slice(0, 300)); continue; }
    const pdf = path.join(OUT, d.key + ".pdf"); fs.writeFileSync(pdf, Buffer.from(await res.arrayBuffer()));
    const pages = cp.execFileSync("python", ["-c", PY, pdf, path.join(OUT, d.key)], { encoding: "utf8" }).trim().split("\n").pop();
    console.log(d.key, "pages", pages, Math.round(fs.statSync(pdf).size / 1024) + " KB");
  }
})();
