// Row Ls · Digital signing (Nov 20, 2026). Plans: Reports/Reports_Screen_Plan.md section 16, Job Order/Job_Order_Screen_Plan.md Revision 17, App/App_Screen_Plan.md section 18.
// Run on a copy of the main file: MAIN_IN=<backup> node build-screens.js Ls, then library/stepperphone.js (the new phone job order frames get the horizontal stepper).
// 1) patch(): in-place edits of the existing frames (the new certificate drawing, Send for signature, the signatory list, labels). Not idempotent: always start from the backup.
// 2) the new frames, on a new row at the bottom of each page: Reports 02-CoA 03 (tablet, phone), 10 to 14; job order 05 CoA 06, 07; Profile 09 04, 05.
const { LIGHT } = require("../dsl.js");
require("./shell.js");
const { H } = require("./rowC.js");
const { TITLE, page, card, detailFrame } = H;
const { U } = require("./rowL.js");
const cert = require("./certpage.js");
const { icon, txt, hframe, vframe, btn, iconBtn, cardTop, badge, dialog, overlay, KIND, previewCard, thumbCard, kvCard, phoneBar, contentsCard, signatoryPanel } = U;
const SZ = { desktop: "Desktop", tablet: "Tablet", phone: "Phone" };
const HH = { desktop: 1018, tablet: 1194, phone: 1100 };

// ---------- demo documents ----------
const DRAFT = { signed: false, code: "005", client: "CV Sumber Batu Hitam", jo: "JO-2026-0132", ref: "SBH-077", address: "Jl. Pahlawan No. 7, Balikpapan" };
const SIGNED_PTBA = { signed: true, number: "CoA-JO-2026-0142-1", code: "004", client: "PT Bukit Asam Tbk", jo: "JO-2026-0142", ref: "PTBA-2210", issued: "2 Nov 2026", address: "Jl. Parigi No. 1, Tanjung Enim" };
const SIGNED_BNM = { signed: true, number: "CoA-JO-2026-0131-1", code: "001", client: "PT Bara Nusantara Mandiri", jo: "JO-2026-0131", ref: "BNM-318", issued: "28 Oct 2026", address: "Jl. Mulawarman No. 12, Samarinda" };
const CONFIG_DOC = { signed: false, code: "004", client: "PT Bukit Asam Tbk", jo: "JO-2026-0142", ref: "PTBA-2210", formRev: 3, address: "Jl. Parigi No. 1, Tanjung Enim" };
const DOC_BY_VV = { "01": DRAFT, "02": DRAFT, "03": DRAFT, "04": SIGNED_PTBA, "05": SIGNED_PTBA, "06": SIGNED_PTBA, "07": SIGNED_PTBA, "08": SIGNED_BNM, "09": SIGNED_PTBA };

// =====================================================================================================
// 1 · in-place patches
// =====================================================================================================
function patch(b) {
  const N = b.reg.N, log = [];
  const tops = [];
  for (const [k, pid] of Object.entries(b.pageIds)) for (const id of N[pid].children || []) { const n = N[id]; if (n.type === "frame" && n.name && !/ ref$/.test(n.name)) tops.push({ id, name: n.name, kind: k }); }
  const walk = (id, fn, parent = null) => { fn(N[id], id, parent); (N[id].children || []).forEach((c) => walk(c, fn, id)); };
  const texts = (id, rx) => { const out = []; walk(id, (n, i) => { if (n.type === "text" && rx.test(n.characters || "")) out.push(i); }); return out; };
  const named = (id, name) => { const out = []; walk(id, (n, i, p) => { if (n.name === name) out.push({ id: i, parent: p }); }); return out; };
  const setText = (ids, s) => ids.forEach((i) => b.raw("node.set", { ids: [i], props: { characters: s } }));
  const byName = (rx) => tops.filter((f) => rx.test(f.name));

  // P1 the new certificate drawing in every CoA preview (Reports 02-CoA desktop and tablet, Configuration template New_version)
  for (const f of tops) {
    const m = /^(Desktop|Tablet)-07-Reports-02-CoA-(\d\d)-/.exec(f.name);
    const opts = m ? DOC_BY_VV[m[2]] : f.name === "Desktop-14-Configuration-06-Report_templates-02-New_version" ? CONFIG_DOC : null;
    if (!opts) continue;
    for (const pg of named(f.id, "Document page")) {
      const index = N[pg.parent].children.indexOf(pg.id);
      b.raw("edit.delete", { ids: [pg.id] });
      cert.docPage(b, pg.parent, { ...opts, rev: 1, index }, U);
      log.push(`certificate drawing: ${f.name}`);
    }
  }
  // P2 Publish becomes Send for signature (Reports 02-CoA 01, 02, 03 on every size)
  for (const f of byName(/^(Desktop|Tablet|Phone)-07-Reports-02-CoA-0[123]-/)) { const t = texts(f.id, /^Publish$/); setText(t, "Send for signature"); log.push(`Send for signature: ${f.name} (${t.length})`); }
  // P3 Contents card: the signatory note and the optional On behalf of field
  for (const f of byName(/^(Desktop|Tablet|Phone)-07-Reports-02-CoA-0[123]-/)) {
    const cc = named(f.id, "Contents card")[0]; if (!cc) continue;
    const sz = f.kind === "phone" ? "touch" : "md";
    txt(b, cc.id, "People with signing rights. They sign with their own login.", "Caption/Regular", "Text/text-muted", "Signatory note", { fill: true });
    b.instV(cc.id, "Text field", `State=Default, Size=${sz}`, { texts: { Label: "On behalf of (optional)", Value: "e.g. Laboratory Manager" }, setProps: { "Show helper": false }, props: { sizingH: "fill" } });
    log.push(`Contents card: ${f.name}`);
  }
  // P4 the confirm dialog (desktop 03)
  for (const f of byName(/^Desktop-07-Reports-02-CoA-03-Publish_confirm$/)) {
    setText(texts(f.id, /^Publish CoA for JO-2026-0132\?$/), "Send CoA for signature?");
    setText(texts(f.id, /^It gets the number CoA-JO-2026-0132-1/), "Ir. Bambang Sutrisno, M.T. is asked to sign it. You can't change the contents until it is signed, returned or withdrawn.");
    b.raw("node.set", { ids: [f.id], props: { name: "Desktop-07-Reports-02-CoA-03-Send_for_signature_confirm" } });
    log.push("renamed 03 Send_for_signature_confirm");
  }
  // P5 the signatory list: signing rights only, no edit icons, no Type manually
  for (const f of byName(/^Desktop-07-Reports-02-CoA-02-Draft_signatory$/)) {
    for (const d of named(f.id, "Signatory dropdown")) { b.raw("edit.delete", { ids: [d.id] }); signatoryPanel(b, { root: f.id }, 886); log.push("signatory panel: " + f.name); }
  }
  // P6 job order form: the label, and the signatory list of the two list frames
  for (const f of byName(/New_job_order/)) { setText(texts(f.id, /^Default signatory \(optional\)$/), "Signatory (optional)"); setText(texts(f.id, /^Default signatory$/), "Signatory"); }
  for (const f of byName(/^(Desktop|Tablet|Phone)-03-Job_orders-03-Job_order_detail-0[12]-Overview/)) setText(texts(f.id, /^Default signatory$/), "Signatory");
  for (const nm of ["Desktop-03-Job_orders-02-New_job_order-06-Signatory_dropdown_list", "Phone-03-Job_orders-02-New_job_order-06-Signatory_sheet_list"]) {
    const f = tops.find((x) => x.name === nm); if (!f) { log.push("MISSING " + nm); continue; }
    const dd = named(f.id, "Signatory dropdown")[0] || named(f.id, "List")[0];
    const kids = N[dd.id].children, rows = kids.filter((c) => N[c].name === "Option row"), add = kids.find((c) => N[c].name === "Button");
    b.raw("edit.delete", { ids: [rows[1], add] });
    [[rows[0], "Laboratory Manager"], [rows[2], "Technical Supervisor"]].forEach(([r, d]) => { named(r, "Actions").forEach((a) => b.raw("node.set", { ids: [a.id], props: { visible: false } })); setText(texts(r, /./).filter((i) => N[i].name === "Detail"), d); });
    log.push("signatory list: " + nm);
  }
  // P7 the two typed-name edit frames are retired (kept, not deleted)
  for (const f of byName(/^(Desktop-03-Job_orders-02-New_job_order-07-Signatory_dropdown_edit|Phone-03-Job_orders-02-New_job_order-07-Signatory_sheet_edit)$/)) { b.raw("node.set", { ids: [f.id], props: { name: f.name + "_retired" } }); log.push("retired: " + f.name); }
  // P8 Details: the signer, not the Lab admin, published it
  for (const f of byName(/^(Desktop-07-Reports-02-CoA-0[4-9]|Tablet-07-Reports-02-CoA-04|Phone-07-Reports-02-CoA-04)-/)) for (const d of named(f.id, "Details card")) setText(texts(d.id, /^Maya Lestari$/), "Bambang Sutrisno");
  console.log(log.join("\n"));
}

// =====================================================================================================
// 2 · new frames
// =====================================================================================================
const sheet = (b, s, h, sh, title, text, cancel, ok, body) => {
  overlay(b, s, "phone", h);
  const v = b.v("Bottom sheet");
  const id = b.instV(s.root, "Bottom sheet", undefined, { texts: { Title: title }, props: { absolute: true, x: 0, y: h - sh, width: 390 } });
  const bt = v.insts.filter((i) => i.name === "Button");
  b.raw("node.set", { ids: [id + bt[0].pos + 3], props: { characters: cancel } }); b.raw("node.set", { ids: [id + bt[1].pos + 3], props: { characters: ok } });
  const bd = id + v.names.Body;
  b.raw("node.set", { ids: [bd], props: { sizingV: "hug", fill: "none", mainAlign: "min", gap: 14 } }); b.raw("node.set", { ids: [id], props: { sizingV: "hug" } });
  if (text) txt(b, bd, text, "Body small/Regular", "Text/text-secondary", "Text", { fill: true });
  if (body) body(bd);
  return id;
};
const signBody = (b, bd, phone) => {
  const p = phone ? vframe(b, bd, "Signature preview", 8, { fill: "Surface/muted", r: 12, pad: [12, 16, 12, 16] }) : hframe(b, bd, "Signature preview", 16, { sizeH: "fill", fill: "Surface/muted", r: 12, pad: [12, 16, 12, 16], cross: "center" });
  cert.signatureArt(b, p, U, { signed: true, w: 190, h: 72 });
  const t = vframe(b, p, "Signatory", 2, { sizeH: phone ? "fill" : "hug" });
  txt(b, t, "Ir. Bambang Sutrisno, M.T.", "Body small/SemiBold", "Text/heading", "Name"); txt(b, t, "Laboratory Manager", "Caption/Regular", "Text/text-secondary", "Title"); txt(b, t, "Printed on the certificate with the lab stamp.", "Caption/Regular", "Text/text-muted", "Note", { fill: true });
  b.instV(bd, "Password field", `State=Default, Size=${phone ? "touch" : "md"}`, { texts: { Label: "Password", Helper: "Signing needs your own password." }, setProps: { "Show helper": true, Value: "Enter your password" }, props: { sizingH: "fill" } });
};
const returnBody = (b, bd, phone) => b.instV(bd, "Textarea", `State=Default, Size=${phone ? "touch" : "md"}`, { texts: { Label: "Comment *", Value: "e.g. Remarks missing for sample 3" }, setProps: { "Show helper": false }, props: { sizingH: "fill" } });
const DIALOGS = {
  send: { title: "Send CoA for signature?", text: "Ir. Bambang Sutrisno, M.T. is asked to sign it. You can't change the contents until it is signed, returned or withdrawn.", cancel: "Cancel", ok: "Send for signature", sh: 290 },
  sign: { title: "Sign and publish CoA for JO-2026-0132?", text: "It gets the number CoA-JO-2026-0132-1, your signature and the lab stamp, and can no longer be edited.", cancel: "Cancel", ok: "Sign and publish", body: signBody, sh: 600 },
  ret: { title: "Return the draft to Maya Lestari?", text: "Maya Lestari can change it and send it again.", cancel: "Cancel", ok: "Return draft", body: returnBody, sh: 420 },
};
function withDialog(b, s, kind, key) {
  const D = DIALOGS[key], phone = kind === "phone";
  if (phone) sheet(b, s, HH.phone, D.sh, D.title, D.text, D.cancel, D.ok, D.body && ((bd) => D.body(b, bd, true)));
  else dialog(b, s, kind, HH[kind], "md", D.title, D.text, D.cancel, D.ok, D.body ? (bd) => D.body(b, bd, false) : null);
}

// ---------- Reports: the signing views ----------
const contentsReadOnly = (b, parent) => kvCard(b, parent, "Contents", [["Template", "House CoA template, version 1"], ["Bases", "ADB, DB, DAF, AR"], ["Parameters", "8 parameters"], ["Samples", "11 samples", "1 not received is left out"], ["Attention", "Budi Santoso"], ["Client reference", "SBH-077"], ["Remarks", "None"], ["Signatory", "Ir. Bambang Sutrisno, M.T."], ["On behalf of", "None"]]);
const ALERTS = {
  awaiting: ["Info", "Waiting for Ir. Bambang Sutrisno, M.T. to sign", "Sent by Maya Lestari on 4 Nov 2026. Withdraw it to change the contents."],
  review: ["Info", "Maya Lestari asks you to sign this certificate", "Sent on 4 Nov 2026. Check every page, then sign or return it with a comment."],
  returned: ["Warning", "Returned by Ir. Bambang Sutrisno, M.T. on 4 Nov 2026", "Remarks are missing for the second sample. Add them and send the certificate again."],
};
function signPage(b, x, y, kind, o) {
  page(b, kind);
  const phone = kind === "phone", view = o.view;
  const s = b.shell({ name: `${SZ[kind]}-07-Reports-02-CoA-${o.vv}-${o.variant}`, x, y, kind, active: "Reports", role: o.role });
  const m = s.main;
  b.instV(m, "Breadcrumb", "Levels=2", { texts: { 0: "Reports", 1: "Draft CoA" } });
  const hd = hframe(b, m, "Header", 16, { sizeH: "fill", main: "spaceBetween", cross: "center", wrap: kind === "tablet" });
  const id = vframe(b, hd, "Identity", 6, { sizeH: phone ? "fill" : "hug" });
  const ti = hframe(b, id, "Title", 12, phone ? { sizeH: "fill", wrap: true } : {});
  txt(b, ti, "Draft CoA", phone ? "Heading/H1" : "Display/XL", "Text/heading", "Title");
  if (view === "awaiting" || view === "review") b.instV(ti, "Status badge", "Status=Awaiting samples, Size=md", { texts: { Label: "Awaiting signature" } }); else badge(b, ti, "Draft");
  const sub = hframe(b, id, "Facts", 12, { wrap: true, sizeH: phone ? "fill" : "hug" });
  txt(b, sub, "JO-2026-0132", "Data", "Primary/primary", "Job order"); txt(b, sub, "CV Sumber Batu Hitam", "Body small/Regular", "Text/text-secondary", "Client"); txt(b, sub, "Revision 1", "Body small/Regular", "Text/text-secondary", "Revision");
  if (!phone) {
    const act = hframe(b, hd, "Actions", 8);
    if (view === "awaiting") { btn(b, act, "Secondary", "Withdraw", "arrow-u-up-left"); iconBtn(b, act, "dots-three", 36); }
    if (view === "review") { btn(b, act, "Secondary", "Return", "arrow-u-up-left"); btn(b, act, "Primary", "Sign and publish", "pencil-simple-line"); }
    if (view === "returned" || view === "draft") { btn(b, act, "Primary", "Send for signature", "paper-plane-tilt"); iconBtn(b, act, "dots-three", 36); }
  }
  if (ALERTS[view]) b.instV(m, "Inline alert", `Tone=${ALERTS[view][0]}`, { texts: { 0: ALERTS[view][1], 1: ALERTS[view][2] }, hide: ["Action"], props: { sizingH: "fill" } });
  const right = (p) => (view === "returned" || view === "draft" ? contentsCard(b, p, kind) : contentsReadOnly(b, p));
  const doc = { kind: "coa", draft: true, ...DRAFT };
  if (kind === "desktop") {
    const cols = b.frame(m, { name: "Columns", w: 1128, h: 900, layout: "h", gap: 20, cross: "min", sizeH: "fill", sizeV: "hug" });
    previewCard(b, cols, kind, doc);
    const rc = vframe(b, cols, "Right column", 16, { sizeH: "fixed" }); b.raw("node.set", { ids: [rc], props: { width: 378, sizingH: "fixed" } });
    right(rc);
  } else if (kind === "tablet") { previewCard(b, m, kind, doc); right(m); }
  else { thumbCard(b, m, { file: "Draft preview" }); right(m); }
  if (phone && !o.dialog) {
    const bars = { awaiting: ["Preview PDF", "Withdraw"], review: ["Return", "Sign and publish"], returned: ["Preview PDF", "Send for signature"], draft: ["Preview PDF", "Send for signature"] }[view];
    phoneBar(b, s, bars[0], bars[1]);
  }
  if (o.dialog) withDialog(b, s, kind, o.dialog);
  return s;
}

// ---------- job order: the CoA card while it waits ----------
const JO0141 = { no: "JO-2026-0141", meta: "PT Kaltara Energi Prima · Attn. Sari Wulandari · PO KEP-118 · Due 23 Oct 2026", counts: { b: 1, s: 8, f: 2 } };
function coaAwaiting(b, main) {
  const c = card(b, main, "CoA card");
  const hd = b.frame(c, { name: "Card head", w: 400, h: 32, layout: "h", gap: 12, cross: "center", main: "spaceBetween", sizeH: "fill", sizeV: "fixed" });
  const t = b.frame(hd, { name: "Titles", w: 200, h: 26, layout: "h", gap: 10, cross: "center", sizeH: "hug", sizeV: "hug" });
  b.text(t, "Certificate of Analysis", { style: "Heading/H3", color: "Text/heading", name: "Title" });
  b.instV(t, "Status badge", "Status=Awaiting samples, Size=md", { texts: { Label: "Awaiting signature" } });
  const n = b.frame(c, { name: "Note", w: 400, h: 44, fill: "Primary/primary-50", r: 10, layout: "h", gap: 8, pad: [10, 14, 10, 14], cross: "center", wrap: true, sizeH: "fill", sizeV: "hug" });
  icon(b, n, "hourglass", "Text/text-secondary");
  txt(b, n, "Waiting for", "Body small/Regular", "Text/foreground", "Text"); txt(b, n, "Ir. Bambang Sutrisno, M.T.", "Body small/SemiBold", "Text/foreground", "Signatory"); txt(b, n, "to sign.", "Body small/Regular", "Text/foreground", "Text");
  txt(b, c, "Sent for signature by Maya Lestari on 4 Nov 2026.", "Body small/Regular", "Text/text-secondary", "Sent by", { fill: true });
  btn(b, c, "Ghost", "Open in Reports", "arrow-right", { size: "md" });
}
function joPage(b, x, y, kind, vv, variant, role, dialogKey) {
  const s = detailFrame(b, x, y, kind, { ...JO0141, name: `${SZ[kind]}-03-Job_orders-05-CoA_and_actions-${vv}-${variant}`, status: "In progress", steps: ["14 Oct", "15 Oct", "16 Oct", "22 Oct", "", ""], cur: 4, tab: "CoA", role });
  coaAwaiting(b, s.main);
  if (dialogKey) {
    const title = "Move the signature request?", text = "The CoA for JO-2026-0141 waits for Ir. Bambang Sutrisno, M.T. If Hendra Wijaya, S.T. becomes the signatory, the request moves to the new signatory and both are notified.";
    if (kind === "phone") sheet(b, s, HH.phone, 340, title, text, "Cancel", "Move request");
    else dialog(b, s, kind, HH[kind], "md", title, text, "Cancel", "Move request", null);
  }
  return s;
}

// ---------- Profile: signature and stamp ----------
const role = (b, p, label) => b.instV(p, "Role badge", "Property 1=Default", { texts: { Label: label } });
function stampBox(b, parent) {
  const box = b.frame(parent, { name: "Preview", w: 300, h: 112, fill: "Surface/muted", r: 12, layout: "h", main: "center", cross: "center", sizeH: "fill", sizeV: "fixed" });
  const art = b.frame(box, { name: "Stamp art", w: 200, h: 88, sizeH: "fixed", sizeV: "fixed" });
  cert.stampArt(b, art, U, 60, 4, 80);
}
function profileSigning(b, x, y, kind, vv, variant, withDialog_) {
  page(b, kind);
  const phone = kind === "phone", sz = phone ? "touch" : "md";
  const s = b.shell({ name: `${SZ[kind]}-00-App-09-Profile-${vv}-${variant}`, x, y, kind, active: "none", role: "Manager" });
  const m = s.main;
  const hd = phone ? vframe(b, m, "Header", 16) : hframe(b, m, "Header", 16, { sizeH: "fill", main: "spaceBetween", cross: "center" });
  const idt = hframe(b, hd, "Identity", 16, { sizeH: phone ? "fill" : "hug" });
  const av = b.frame(idt, { name: "Avatar", w: 64, h: 64, fill: "Accent/accent-100", r: 999, layout: "h", main: "center", cross: "center", sizeH: "fixed", sizeV: "fixed" }); txt(b, av, "BS", "Heading/H2", "Accent/accent-text", "Initials");
  const t = vframe(b, idt, "Text", 6, { sizeH: phone ? "fill" : "hug" }); const tr = hframe(b, t, "Name row", 12, { wrap: true, sizeH: phone ? "fill" : "hug" });
  txt(b, tr, "Ir. Bambang Sutrisno, M.T.", phone ? "Heading/H1" : "Display/XL", "Text/heading", "Title", phone ? { fill: true } : {}); role(b, tr, "Manager"); txt(b, t, "bambang@sgsi.co.id", "Body small/Regular", "Text/text-secondary", "Email");
  b.instV(hd, "Button", `Type=Secondary, Tone=Default, Size=${phone ? "touch" : "lg"}, State=Default`, { texts: { Label: "Sign out" }, setProps: { "Leading icon": true, "Leading glyph": b.iconId("sign-out") }, props: phone ? { sizingH: "fill" } : undefined });
  const personal = (p) => { const c = card(b, p, "Personal card"); cardTop(b, c, "Personal"); b.instV(c, "Text field", `State=Filled, Size=${sz}`, { texts: { Label: "Name", Value: "Ir. Bambang Sutrisno, M.T." }, setProps: { "Show helper": false }, props: { sizingH: "fill" } }); b.instV(c, "Key-value row", "Layout=Inline", { texts: { Key: "Email", Value: "bambang@sgsi.co.id" }, props: { sizingH: "fill" } }); b.instV(c, "Key-value row", "Layout=Inline", { texts: { Key: "Title", Value: "Laboratory Manager" }, props: { sizingH: "fill" } }); txt(b, c, "Printed on the certificates you sign. Only a Superadmin can change the email and the title.", "Caption/Regular", "Text/text-muted", "Note", { fill: true }); b.instV(c, "Button", "Type=Primary, Tone=Default, Size=md, State=Disabled", { texts: { Label: "Save" }, setProps: { "Leading icon": false } }); };
  const password = (p) => { const c = card(b, p, "Password card"); cardTop(b, c, "Password"); txt(b, c, "Last changed 12 Oct 2026", "Body small/Regular", "Text/text-secondary", "Changed"); b.instV(c, "Button", "Type=Secondary, Tone=Default, Size=md, State=Default", { texts: { Label: "Change password" }, setProps: { "Leading icon": true, "Leading glyph": b.iconId("lock-simple") } }); };
  const signature = (p) => {
    const c = card(b, p, "Signature card"); cardTop(b, c, "Signature");
    const box = b.frame(c, { name: "Preview", w: 300, h: 112, fill: "Surface/muted", r: 12, layout: "h", main: "center", cross: "center", sizeH: "fill", sizeV: "fixed" });
    cert.signatureArt(b, box, U, { signed: true, stamp: false, w: 200, h: 88 });
    txt(b, c, "Set on 3 Nov 2026", "Caption/Regular", "Text/text-muted", "Set on");
    b.instV(c, "Button", "Type=Secondary, Tone=Default, Size=md, State=Default", { texts: { Label: "Replace signature" }, setProps: { "Leading icon": true, "Leading glyph": b.iconId("upload-simple") } });
    txt(b, c, "Only you can change your signature. It is placed on the certificates you sign.", "Caption/Regular", "Text/text-muted", "Note", { fill: true });
  };
  const stamp = (p) => {
    const c = card(b, p, "Lab stamp card"); cardTop(b, c, "Lab stamp"); stampBox(b, c);
    txt(b, c, "Set on 3 Nov 2026", "Caption/Regular", "Text/text-muted", "Set on");
    b.instV(c, "Button", "Type=Secondary, Tone=Default, Size=md, State=Default", { texts: { Label: "Replace stamp" }, setProps: { "Leading icon": true, "Leading glyph": b.iconId("upload-simple") } });
    txt(b, c, "Printed only beside an authorised signature.", "Caption/Regular", "Text/text-muted", "Note", { fill: true });
  };
  const prefs = (p) => { const c = card(b, p, "Preferences card"); cardTop(b, c, "Preferences"); const g = vframe(b, c, "Sidebar", 6); txt(b, g, "Sidebar", "Caption/Medium", "Text/text-secondary", "Label"); b.instV(g, "Segmented control", "Items=2, Selected=1", { texts: { 0: "Expanded", 1: "Collapsed" } }); b.instV(c, "Key-value row", "Layout=Inline", { texts: { Key: "Language", Value: "English" }, props: { sizingH: "fill" } }); txt(b, c, "Indonesian terms are kept for RoA and CoA.", "Caption/Regular", "Text/text-muted", "Note", { fill: true }); };
  const notes = (p) => { const c = card(b, p, "Notifications card"); cardTop(b, c, "Notifications"); ["Batch past its deadline", "CoA waiting for my signature"].forEach((l) => b.instV(c, "Switch", "On=On, State=Default", { texts: { Label: l } })); txt(b, c, "Notifications are in the app only.", "Caption/Regular", "Text/text-muted", "Note", { fill: true }); };
  if (kind === "desktop") { const cols = b.frame(m, { name: "Columns", w: 1128, h: 600, layout: "h", gap: 20, cross: "min", sizeH: "fill", sizeV: "hug" }); const l = vframe(b, cols, "Left column", 20); const r = vframe(b, cols, "Right column", 20); personal(l); password(l); signature(l); stamp(l); prefs(r); notes(r); }
  else { personal(m); password(m); signature(m); stamp(m); prefs(m); notes(m); }
  if (withDialog_) {
    const title = "Replace your signature", text = "Use a PNG with a transparent background, at most 1 MB. It replaces the old one on new certificates only.";
    const body = (bd) => {
      b.instV(bd, "Drop zone", "State=Default", { texts: { Title: "Drop the PNG here, or click to browse", Hint: "PNG with a transparent background, up to 1 MB" }, props: { sizingH: "fill" } });
      const f = hframe(b, bd, "Chosen file", 12, { sizeH: "fill", fill: "Surface/muted", r: 10, pad: [8, 12, 8, 12], cross: "center" });
      cert.signatureArt(b, f, U, { signed: true, stamp: false, w: 120, h: 48 });
      const tt = vframe(b, f, "File", 1, { sizeH: "fill" }); txt(b, tt, "signature-b-sutrisno.png", "Body small/SemiBold", "Text/heading", "File name"); txt(b, tt, "38 KB, 600 by 240 px", "Caption/Regular", "Text/text-muted", "Size");
      txt(b, bd, "Older certificates keep the signature they were signed with.", "Caption/Regular", "Text/text-muted", "Note", { fill: true });
    };
    if (phone) sheet(b, s, HH.phone, 620, title, text, "Cancel", "Save signature", body);
    else dialog(b, s, kind, HH[kind], "md", title, text, "Cancel", "Save signature", body);
  }
  return s;
}

// ---------- build ----------
function bottoms(b) {
  const N = b.reg.N, out = {};
  for (const [k, pid] of Object.entries(b.pageIds)) { let m = 0; for (const id of N[pid].children || []) { const n = N[id]; m = Math.max(m, (n.transform ? n.transform[5] : 0) + (n.height || 0)); } out[k] = Math.ceil((m + 600) / 100) * 100; }
  return out;
}
exports.build = (b) => {
  patch(b);
  const Y = bottoms(b);
  for (const k of ["desktop", "tablet", "phone"]) { page(b, k); TITLE(b, 0, Y[k] - 90, "P  Digital signing (Nov 20, 2026)"); }
  const G = { desktop: { step: 1560, ry: 2300, per: 4 }, tablet: { step: 954, ry: 2500, per: 4 }, phone: { step: 510, ry: 2400, per: 6 } };
  for (const kind of ["desktop", "tablet", "phone"]) {
    const list = [];
    if (kind !== "desktop") list.push((x, y) => signPage(b, x, y, kind, { vv: "03", variant: "Send_for_signature_confirm", role: "Lab", view: "draft", dialog: "send" }));
    list.push(
      (x, y) => signPage(b, x, y, kind, { vv: "10", variant: "Awaiting_signature", role: "Lab", view: "awaiting" }),
      (x, y) => signPage(b, x, y, kind, { vv: "11", variant: "Sign_review", role: "Manager", view: "review" }),
      (x, y) => signPage(b, x, y, kind, { vv: "12", variant: "Sign_dialog", role: "Manager", view: "review", dialog: "sign" }),
      (x, y) => signPage(b, x, y, kind, { vv: "13", variant: "Return_dialog", role: "Manager", view: "review", dialog: "ret" }),
      (x, y) => signPage(b, x, y, kind, { vv: "14", variant: "Returned", role: "Lab", view: "returned" }),
      (x, y) => joPage(b, x, y, kind, "06", "Awaiting_signature", "Lab", false),
      (x, y) => joPage(b, x, y, kind, "07", "Signatory_change_confirm", "CSO", true),
      (x, y) => profileSigning(b, x, y, kind, "04", "Signing", false),
      (x, y) => profileSigning(b, x, y, kind, "05", "Signature_upload", true),
    );
    const g = G[kind];
    list.forEach((fn, n) => fn(g.step * (n % g.per), Y[kind] + g.ry * Math.floor(n / g.per)));
  }
  b.lsEnd = Y;
};
