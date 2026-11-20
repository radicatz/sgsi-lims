// The certificate page every CoA preview draws (Reports_Screen_Plan.md 16.4, Reports_Build_Design.md 6.1 and 6.2).
// 560 x 792, the size of the old "Document page", so every card keeps its layout. SGSI branding (the full logo), the lab's sample RoA and CoA for the content:
// bordered table per sample (CODE SAMPLE, Test Method, a basis row, Mass as Received), dot decimals without a thousands separator, signature with the stamp.
// docPage(b, parent, o, U): U is the helper set exported by rowL.js (txt, hframe, vframe).
const PAGE_W = 595, PAGE_H = 841; // A4 in pt (1 px of the page image = 1 pt at scale 1), as the Configuration preview
const COLS = [149, 92, 74, 74, 74, 74]; // parameter, method, Air Dried, Dry, Dry Ash Free, As Received (sum 537 + 5 grid lines = 542)
const BASES = ["Air Dried", "Dry", "Dry Ash Free", "As Received"];

// [parameter, method, ADB, DB, DAF, AR]; fixed carbon is 100 minus the other values on each basis, from the rounded values (D-13)
const SAMPLE_ROWS = [
  [
    ["Total Moisture", "ASTM D3302-19", "-", "-", "-", "14.20"],
    ["Moisture in the Analysis Sample", "ASTM D3173-17", "8.10", "-", "-", "-"],
    ["Ash Content", "ASTM D3174-12", "5.42", "5.90", "-", "5.06"],
    ["Volatile Matter", "ASTM D3175-20", "39.85", "43.36", "46.08", "37.21"],
    ["Fixed Carbon", "ASTM D3172-13", "46.63", "50.74", "53.92", "43.53"],
    ["Total Sulphur", "ASTM D4239-18", "0.42", "0.46", "0.49", "0.39"],
    ["Gross Calorific Value (kcal/kg)", "ASTM D5865-19", "5980", "6507", "6915", "5584"],
  ],
  [
    ["Total Moisture", "ASTM D3302-19", "-", "-", "-", "13.80"],
    ["Moisture in the Analysis Sample", "ASTM D3173-17", "7.90", "-", "-", "-"],
    ["Ash Content", "ASTM D3174-12", "6.10", "6.62", "-", "5.71"],
    ["Volatile Matter", "ASTM D3175-20", "38.90", "42.24", "45.23", "36.41"],
    ["Fixed Carbon", "ASTM D3172-13", "47.10", "51.14", "54.77", "44.08"],
    ["Total Sulphur", "ASTM D4239-18", "0.51", "0.55", "0.59", "0.48"],
    ["Gross Calorific Value (kcal/kg)", "ASTM D5865-19", "5890", "6395", "6849", "5513"],
  ],
];
const MASS = ["9.15", "10.25"];

/** a bordered cell: the row frame is the border colour and shows through the 1 px gaps */
function cell(b, parent, w, h, o = {}) {
  return b.frame(parent, { name: o.name || "Cell", w, h, fill: o.fill || "Surface/card", layout: "h", main: o.left ? "min" : "center", cross: "center", pad: [0, 4, 0, 4], sizeH: "fixed", sizeV: "fixed" });
}
function sampleTable(b, parent, U, idx, ids) {
  const { txt } = U;
  const t = b.frame(parent, { name: "Sample table", w: 544, h: 190, fill: "Surface/border-strong", layout: "v", gap: 1, pad: [1, 1, 1, 1], sizeH: "fill", sizeV: "hug" });
  const row = (name, h) => b.frame(t, { name, w: 542, h, fill: "Surface/border-strong", layout: "h", gap: 1, sizeH: "fill", sizeV: "hug" });
  const merged = COLS[2] + COLS[3] + COLS[4] + COLS[5] + 3;
  // head 1: CODE SAMPLE | Test Method | sample code over Sample ID
  const h1 = row("Head code", 40); // two mono lines
  txt(b, cell(b, h1, COLS[0], 40, { name: "Head", fill: "Primary/primary-50" }), "CODE SAMPLE", "Caption/SemiBold", "Text/heading", "Label");
  txt(b, cell(b, h1, COLS[1], 40, { name: "Head", fill: "Primary/primary-50" }), "Test Method", "Caption/SemiBold", "Text/heading", "Label");
  const idc = b.frame(h1, { name: "Sample", w: merged, h: 40, fill: "Primary/primary-50", layout: "v", main: "center", cross: "center", sizeH: "fixed", sizeV: "fixed" });
  txt(b, idc, ids.code, "Data/Small", "Text/heading", "Sample code"); txt(b, idc, ids.id, "Data/Small", "Text/text-secondary", "Sample ID");
  // head 2: Basis | (method) | the four bases
  const h2 = row("Head basis", 18);
  txt(b, cell(b, h2, COLS[0], 18, { name: "Head", fill: "Primary/primary-50" }), "Basis", "Caption/SemiBold", "Text/heading", "Label");
  cell(b, h2, COLS[1], 18, { name: "Head", fill: "Primary/primary-50" });
  BASES.forEach((l, i) => txt(b, cell(b, h2, COLS[2 + i], 18, { name: "Head", fill: "Primary/primary-50" }), l, "Caption/Medium", "Text/heading", "Basis"));
  // mass as received, one value across
  const m = row("Mass", 16);
  txt(b, cell(b, m, COLS[0], 16, { left: true }), "Mass as Received (kg)", "Caption/Medium", "Text/foreground", "Label");
  cell(b, m, COLS[1], 16);
  txt(b, b.frame(m, { name: "Value", w: merged, h: 16, fill: "Surface/card", layout: "h", main: "center", cross: "center", sizeH: "fixed", sizeV: "fixed" }), MASS[idx], "Data/Small", "Text/foreground", "Mass");
  SAMPLE_ROWS[idx].forEach((r) => {
    const rh = r[0].length > 22 ? 28 : 16; // the two long names wrap to a second line
    const rr = row("Row", rh);
    txt(b, cell(b, rr, COLS[0], rh, { left: true }), r[0], "Caption/Medium", "Text/foreground", "Parameter", rh > 16 ? { fill: true } : {});
    txt(b, cell(b, rr, COLS[1], rh, { left: true }), r[1], "Caption/Regular", "Text/text-muted", "Method");
    for (let i = 0; i < 4; i++) txt(b, cell(b, rr, COLS[2 + i], rh), r[2 + i], "Data/Small", "Text/foreground", "Value");
  });
  return t;
}

/** the stamp: the placeholder component "sgsi-stamp" (.context/assets/images/sgsi-stamp.svg, 750 wide), scaled to size */
const STAMP_W = 750.74, SIG_W = 600, SIG_H = 190;
function stampArt(b, parent, U, x, y, size = 56) {
  const id = b.comp(parent, "sgsi-stamp");
  b.raw("transform.scale", { ids: [id], factor: size / STAMP_W }); b.raw("node.set", { ids: [id], props: { x: Math.round(x), y: Math.round(y) } });
  return id;
}
/** the placeholder signature (component "b_sutrisno-sign", from b_sutrisno-sign.png) over the stamp, as on the lab's sample CoA; unsigned: a dashed box */
function signatureArt(b, parent, U, o = {}) {
  const { txt } = U, w = o.w || 200, h = o.h || 56;
  const art = b.frame(parent, { name: o.name || "Signature art", w, h, sizeH: "fixed", sizeV: "fixed" });
  if (!o.signed) {
    const d = b.frame(art, { name: "Placeholder", w, h, stroke: "Surface/border-strong", sw: 1, dash: [4, 3], r: 8, layout: "h", main: "center", cross: "center", sizeH: "fixed", sizeV: "fixed" });
    txt(b, d, "Signature placed at signing", "Caption/Regular", "Text/text-muted", "Hint");
    return art;
  }
  const stamp = o.stamp !== false;
  if (stamp) { const s = Math.min(h, 64); stampArt(b, art, U, w - s, (h - s) / 2, s); }
  const sw = stamp ? w * 0.74 : Math.min(w * 0.9, (h * 0.9 * SIG_W) / SIG_H), f = sw / SIG_W;
  const sg = b.comp(art, "b_sutrisno-sign");
  b.raw("transform.scale", { ids: [sg], factor: f }); b.raw("node.set", { ids: [sg], props: { x: Math.round(stamp ? 0 : (w - sw) / 2), y: Math.round((h - SIG_H * f) / 2) } });
  return art;
}
// The page the previews show is an image of the real PDF (samples/make-samples.js renders it through Gotenberg; PyMuPDF rasterises each page).
// So its type, colours and scale are the printed ones, not the app's text styles. Keys: coa-draft-sbh, coa-signed-ptba, coa-signed-bnm-r1, coa-draft-ptba-rev3, roa-0412.
const SAMPLES_DIR = "D:/SGSI/LIMS/.context/design/figcraft/samples";
function docKey(o) {
  if (o.sample) return o.sample;
  if (o.kind === "roa") return "roa-0412";
  if (o.signed) return /Bara/.test(o.client || "") ? "coa-signed-bnm-r1" : "coa-signed-ptba";
  return o.formRev === 3 ? "coa-draft-ptba-rev3" : "coa-draft-sbh";
}
function docPage(b, parent, o = {}, U) { // eslint-disable-line no-unused-vars
  const id = b.step("image.place", { path: `${SAMPLES_DIR}/${docKey(o)}-p${o.page || 1}.png`, parent, x: 0, y: 0, width: PAGE_W, height: PAGE_H, name: "Document page" }, 1);
  b.raw("style.apply", { ids: [id], style: "Elevation/md" });
  return id;
}
module.exports = { docPage, signatureArt, stampArt, PAGE_W, PAGE_H };
