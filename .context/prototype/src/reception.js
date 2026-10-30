/* Reception and preparation (S-18): receive samples, label them, start preparation, enter ADL, finish preparation.
   Part of the job order prototype. Spec: Coal_LIMS_Development_Spec.md S-18, 9.2; plan: Reception_Preparation_Screen_Plan.md. */
(function () {
const { useState, useEffect, useRef, Fragment } = React;
const J = window.__JO;
const P = window.PROTO;
const { html, Icon, useApp, useEsc, Badge, Avatar, Dialog, ConfirmDialog, Sheet, clone, batchesOf, companyOf } = J;

const COND = ["Good", "Damaged", "Wet", "Short", "No tag"];
const HOLD_REASONS = ["Damaged", "Insufficient material", "Client request", "Other"];
const PHOTO_TAGS = ["Condition", "Weighing", "Other"];
const PHOTO_SRC = {}; // picked files stay in the page only, they are not saved with the demo data
const PU = { TM: ["ar", "%"], IM: ["adb", "%"], Ash: ["adb", "%"], VM: ["adb", "%"], FC: ["adb", "%"], TS: ["adb", "%"], GCV: ["adb", "kcal/kg"], NCV: ["ar", "kcal/kg"], HGI: ["", "index"], RD: ["", "g/cm³"] };
const puOf = (p) => PU[p] || ["", "%"];
const RANGE = { TM: [0, 60], Ash: [0, 50], TS: [0, 5], GCV: [3000, 8000] };
const slug = (p) => p.replace(/\W+/g, "_");
const arrivedS = (s) => !!(s.arrived || s.received);
const pad2 = (n) => String(n).padStart(2, "0");
const timeNow = () => { const d = new Date(); return pad2(d.getHours()) + ":" + pad2(d.getMinutes()); };
const stamp = () => "27 Oct, " + timeNow();
const num = (v) => (v === "" || v == null || isNaN(+v) ? null : +v);
const ini = (n) => n.split(" ").map((w) => w[0]).join("");

function Barcode({ code }) {
  let h = 7; for (const ch of code) h = (h * 31 + ch.charCodeAt(0)) % 9973;
  const bars = [];
  for (let i = 0; i < 44; i++) { h = (h * 1103515245 + 12345) % 2147483647; bars.push(1 + (h % 3)); }
  return html`<div class="barcode" aria-hidden="true">${bars.map((w, i) => html`<i key=${i} style=${{ width: w * 2 + "px", background: i % 2 === 0 ? "var(--foreground)" : "transparent" }}></i>`)}</div>`;
}
function LabelPreview({ s, b, o, db }) {
  return html`<div class="labelprev">
    <b class="mono" style=${{ fontSize: "22px", color: "var(--heading)" }}>${s.id}</b>
    <span class="mono" style=${{ fontSize: "12px", color: "var(--text-secondary)" }}>Lab code ${s.labCode}</span>
    <${Barcode} code=${s.labCode} />
    <span style=${{ fontSize: "11px", color: "var(--text-secondary)" }}>${o.no} · 27 Oct 2026</span>
    <span style=${{ fontSize: "11px", color: "var(--text-secondary)" }}>${companyOf(db, o).name}</span>
  </div>`;
}

function PrintDialog({ rows, b, o, db, preset, performer, onClose, onPrint }) {
  const act = rows.filter((s) => arrivedS(s) && !s.hold);
  const [only, setOnly] = useState(!preset);
  const [sel, setSel] = useState(new Set(preset ? [preset] : act.filter((s) => !(s.labels > 0)).map((s) => s.key)));
  const [copies, setCopies] = useState("1");
  const [reason, setReason] = useState("");
  const [err, setErr] = useState(null);
  const shown = only ? act.filter((s) => !(s.labels > 0) || sel.has(s.key)) : act;
  const chosen = act.filter((s) => sel.has(s.key));
  const reprint = chosen.some((s) => s.labels > 0);
  const first = chosen[0] || act[0];
  const tog = (k) => { const n = new Set(sel); n.has(k) ? n.delete(k) : n.add(k); setSel(n); setErr(null); };
  const go = () => {
    if (!chosen.length) { setErr("Tick at least one sample"); return; }
    if (reprint && !reason.trim()) { setErr("Enter a reason for the reprint; it is logged"); return; }
    onPrint(chosen.map((s) => s.key), reprint ? reason.trim() : "", +copies);
  };
  return html`<${Dialog} title="Print labels" onClose=${onClose} actions=${html`
      <button class="btn secondary" onClick=${onClose}>Cancel</button>
      <button class="btn primary" onClick=${go}><${Icon} n="printer" />Print ${chosen.length} label${chosen.length === 1 ? "" : "s"}</button>`}>
    <p style=${{ margin: 0 }}>${b.no} · ${chosen.length} selected. Label size 50 × 30 mm.</p>
    <div class="printbody">
      ${first ? html`<${LabelPreview} s=${first} b=${b} o=${o} db=${db} />` : null}
      <div style=${{ display: "flex", flexDirection: "column", gap: "10px", minWidth: 0, flex: 1 }}>
        <div class="field"><label for="pl-printer">Printer</label><select id="pl-printer" class="select"><option>Zebra ZD421 · Reception bench</option><option>Zebra ZD421 · Preparation room</option></select></div>
        <div class="field"><label for="pl-copies">Copies per sample</label><select id="pl-copies" class="select" value=${copies} onChange=${(e) => setCopies(e.target.value)}><option>1</option><option>2</option><option>3</option></select></div>
        <div class="switchrow"><button type="button" class="switch" role="switch" aria-checked=${only} aria-label="Only samples without a label" onClick=${() => { const n = !only; setOnly(n); if (n) setSel(new Set(act.filter((s) => !(s.labels > 0)).map((s) => s.key))); }}></button><div><b>Only samples without a label</b></div></div>
      </div>
    </div>
    <div class="cl-grid" style=${{ gridTemplateColumns: "repeat(2,minmax(0,1fr))" }}>
      ${shown.map((s) => html`<button key=${s.key} type="button" class=${"cb" + (sel.has(s.key) ? " on" : "")} role="checkbox" aria-checked=${sel.has(s.key)} onClick=${() => tog(s.key)}><span class="box">${sel.has(s.key) && html`<${Icon} n="check" />`}</span><span class="mono" style=${{ fontSize: "12px" }}>${s.id}</span>${s.labels > 0 && html`<span class="muted" style=${{ fontSize: "11px" }}>printed ${s.labels}×</span>`}</button>`)}
    </div>
    ${reprint && html`<div class="field"><label for="pl-reason">Reason for the reprint *</label><input id="pl-reason" class=${"input" + (err && !reason.trim() ? " err" : "")} value=${reason} placeholder="e.g. label torn" onInput=${(e) => { setReason(e.target.value); setErr(null); }} /></div>`}
    ${err && html`<span class="errmsg"><${Icon} n="warning-circle" />${err}</span>`}
  <//>`;
}

function HoldDialog({ s, onClose, onHold }) {
  const [reason, setReason] = useState(HOLD_REASONS[1]);
  const [note, setNote] = useState("");
  return html`<${Dialog} title=${"Put " + s.id + " on hold?"} onClose=${onClose} actions=${html`
      <button class="btn secondary" onClick=${onClose}>Cancel</button>
      <button class="btn danger" onClick=${() => onHold(reason, note)}>Hold sample</button>`}>
    <p style=${{ margin: 0 }}>A held sample is skipped by the checks and printed on the RoA as not analysed. You can release it later.</p>
    <div class="field"><label for="hd-reason">Reason *</label><select id="hd-reason" class="select" value=${reason} onChange=${(e) => setReason(e.target.value)}>${HOLD_REASONS.map((r) => html`<option key=${r}>${r}</option>`)}</select></div>
    <div class="field"><label for="hd-note">Note (optional)</label><input id="hd-note" class="input" value=${note} onInput=${(e) => setNote(e.target.value)} placeholder="e.g. client to resend" /></div>
  <//>`;
}

function BatchStepper({ b, arrivedN }) {
  const st = b.status;
  const cur = st === "created" ? (arrivedN ? 1 : 0) : st === "prep" ? 2 : st === "completed" ? 6 : 4;
  const names = ["Created", "Receiving", "Preparation", "Prep finished", "Analysis", "Completed"];
  const sub = [b.date.replace(/ 2026$/, ""), arrivedN ? arrivedN + " arrived" : "Waiting", b.prep ? b.prep.at.replace(/^started /, "") : "—", b.prepFinished ? b.prepFinished.at : st === "completed" || st === "analysis" || st === "finished" ? "Done" : "—", st === "prepdone" ? "Waiting for analyst" : st === "analysis" ? (b.analysis ? b.analysis.at : "In progress") : st === "finished" ? "Finished, RoA to upload" : st === "completed" ? "Done" : "—", st === "completed" ? b.roa : "—"];
  return html`<div class="stepper" role="list" aria-label="Batch progress" style=${{ gridTemplateColumns: "repeat(6,1fr)" }}>${names.map((n, i) => html`<div key=${n} role="listitem" class=${"step " + (i < cur ? "done" : i === cur ? "cur" : "")} aria-current=${i === cur ? "step" : undefined}>
    <span class="mk">${i < cur && html`<${Icon} n="check" />`}</span><b>${n}</b><small>${i <= cur ? sub[i] : " "}</small></div>`)}</div>`;
}

function RenameDialog({ b, db, onClose, onSave }) {
  const [v, setV] = useState(b.no);
  const [err, setErr] = useState(null);
  const go = () => {
    const t = v.trim();
    if (!/^B-\d{4}-\d{4}$/.test(t)) { setErr("Use the pattern B-YYYY-NNNN, for example B-2026-0425"); return; }
    if (t !== b.no && db.batches.some((x) => x.no === t)) { setErr(t + " is already used by another batch"); return; }
    if (t === b.no) { onClose(); return; }
    onSave(t);
  };
  return html`<${Dialog} title="Change batch number" onClose=${onClose} actions=${html`<button class="btn secondary" onClick=${onClose}>Cancel</button><button class="btn primary" onClick=${go}>Save</button>`}>
    <p style=${{ margin: 0 }}>The number can be changed until reception is confirmed. Lab codes follow the new number; labels already printed must be reprinted.</p>
    <div class="field"><label for="bn-no">Batch number *</label><input id="bn-no" class=${"input mono" + (err ? " err" : "")} value=${v} onInput=${(e) => { setV(e.target.value); setErr(null); }} onKeyDown=${(e) => e.key === "Enter" && go()} /></div>
    <span class="help">Pattern B-YYYY-NNNN until the lab fixes its own format.</span>
    ${err && html`<span class="errmsg"><${Icon} n="warning-circle" />${err}</span>`}
  <//>`;
}

function PhotoSheet({ s, canEdit, mode, onClose, onAdd, onRemove }) {
  const [tag, setTag] = useState("Condition");
  if (!s) return null;
  const list = s.photos || [];
  const Wrap = mode === "mobile" ? Sheet : Dialog;
  const body = html`
    ${list.length ? html`<div class="phgrid">${list.map((p) => html`<div class="phcard" key=${p.id}><div class="img">${PHOTO_SRC[p.id] ? html`<img src=${PHOTO_SRC[p.id]} alt=${p.tag + " photo of " + s.id} />` : html`<${Icon} n="image" />`}</div>
        <div class="cap"><b>${p.tag}</b><span>${p.by} · ${p.at}</span>${canEdit && html`<button class="link" style=${{ fontSize: "12px", textAlign: "left" }} aria-label=${"Remove photo " + p.name} onClick=${() => onRemove(s, p.id)}>Remove</button>`}</div></div>`)}</div>` : html`<p class="muted" style=${{ margin: 0 }}>No photos yet.</p>`}
    ${canEdit ? html`<div class="field"><span class="flabel">Tag for the next photo</span><div class="tagrow" role="radiogroup" aria-label="Photo tag">${PHOTO_TAGS.map((t) => html`<button key=${t} type="button" role="radio" aria-checked=${tag === t} class=${"tchip" + (tag === t ? " on" : "")} onClick=${() => setTag(t)}>${tag === t && html`<${Icon} n="check" />`}${t}</button>`)}</div></div>
      <div style=${{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        <label class="btn secondary"><${Icon} n="camera" />Add photo<input type="file" accept="image/*" capture="environment" style=${{ display: "none" }} aria-label="Add photo" onChange=${(e) => { const f = e.target.files && e.target.files[0]; if (f) onAdd(s, tag, f); e.target.value = ""; }} /></label>
        <button class="btn secondary" onClick=${() => onAdd(s, tag, null)}><${Icon} n="image" />Use an example photo</button></div>`
      : html`<p class="help" style=${{ margin: 0 }}>Photos are locked once reception is confirmed.</p>`}`;
  return mode === "mobile" ? html`<${Sheet} title=${"Photos · " + s.id} onClose=${onClose}><div style=${{ padding: "0 16px 16px", display: "flex", flexDirection: "column", gap: "12px" }}>${body}</div><//>`
    : html`<${Dialog} title=${"Photos · " + s.id} onClose=${onClose} actions=${html`<button class="btn secondary" onClick=${onClose}>Close</button>`}>${body}<//>`;
}

function ReceptionView() {
  const app = useApp();
  const { db, upd, route, go, role, mode, toast, guard } = app;
  const b = db.batches.find((x) => x.no === route.batch);
  const o = b && db.orders.find((x) => x.no === b.order);
  const [tab, setTab] = useState(route.tab || (b && b.status === "created" ? "reception" : b && ["analysis", "finished", "completed"].includes(b.status) ? "analysis" : "prep"));
  const performer = P.PEOPLE[role].name; // the signed-in account is stamped on every action
  const [adr, setAdr] = useState({});
  const [roaNo, setRoaNo] = useState("");
  const [roaFile, setRoaFile] = useState("");
  const [scan, setScan] = useState("");
  const [scanErr, setScanErr] = useState(null);
  const [dlg, setDlg] = useState(null);
  const [menu, setMenu] = useState(null);
  const [confirmD, setConfirmD] = useState(null);
  const [drafts, setDrafts] = useState({});
  const [rowErr, setRowErr] = useState({});
  useEsc(() => setMenu(null), !!menu);
  if (!b || !o) return html`<div class="card placeholder"><b>Batch not found</b><button class="btn primary" onClick=${() => go({ v: "list" })}>Back to job orders</button></div>`;
  const rows = o.samples.filter((s) => s.batch === b.no);
  const idx = (s) => rows.findIndex((x) => x.key === s.key) + 1;
  const isPrep = role === "prep";
  const canRecv = ["cso", "prep", "lab_admin"].includes(role);
  const canEdit = canRecv && b.status === "created";
  const canPrepEdit = isPrep && b.status === "prep";
  const canPrint = canRecv && ["created", "prep", "prepdone"].includes(b.status);
  const act = rows.filter((s) => arrivedS(s) && !s.hold);
  const heldN = rows.filter((s) => s.hold).length;
  const arrivedN = rows.filter((s) => arrivedS(s)).length;
  const printedN = act.filter((s) => s.labels > 0).length;
  const toPrint = act.filter((s) => !(s.labels > 0)).length;
  const expected = rows.length;
  const labCodeOf = (s) => "B" + b.no.slice(-4) + "-" + pad2(idx(s));
  const patch = (key, p) => upd((d) => { const oo = d.orders.find((x) => x.no === o.no); Object.assign(oo.samples.find((x) => x.key === key), p); });
  const snapshot = () => ({ order: clone(db.orders.find((x) => x.no === o.no)), batch: clone(db.batches.find((x) => x.no === b.no)) });
  const restore = (sn) => upd((d) => { d.orders[d.orders.findIndex((x) => x.no === o.no)] = sn.order; d.batches[d.batches.findIndex((x) => x.no === b.no)] = sn.batch; });
  const logLine = (text) => upd((d) => { const bb = d.batches.find((x) => x.no === b.no); bb.log = (bb.log || []).concat({ text, at: stamp() }); });

  const toggleArrived = (s) => {
    if (!canEdit) return;
    if (!s.arrived) patch(s.key, { arrived: true, arrivedAt: stamp(), arrivedBy: performer, labCode: s.labCode || labCodeOf(s), cond: s.cond || "Good" });
    else if (s.labels > 0) toast(s.id + " already has a printed label. Put it on hold instead.", { icon: "info" });
    else patch(s.key, { arrived: false, labCode: "", mass: "", cond: "", rem: "" });
  };
  const markAll = () => setConfirmD({ title: "Mark all as arrived?", body: "Every sample that is not on hold is marked arrived with condition Good. You still enter the masses.", ok: "Mark all arrived", onOk: () => upd((d) => { const oo = d.orders.find((x) => x.no === o.no); oo.samples.forEach((s) => { if (s.batch === b.no && !s.arrived && !s.received && !s.hold) Object.assign(s, { arrived: true, arrivedAt: stamp(), arrivedBy: performer, labCode: "B" + b.no.slice(-4) + "-" + pad2(rows.findIndex((x) => x.key === s.key) + 1), cond: "Good" }); }); }) });
  const doScan = () => {
    const q = scan.trim().toLowerCase(); if (!q) return;
    const s = rows.find((x) => x.id.toLowerCase() === q || (x.labCode || "").toLowerCase() === q);
    if (!s) { setScanErr("No sample “" + scan.trim() + "” in this batch"); return; }
    setScanErr(null);
    if (s.hold) { setScanErr(s.id + " is on hold. Release it first."); return; }
    if (!arrivedS(s)) { if (!canEdit) { setScanErr("Only CSO, Lab admin and Preparation can receive samples"); return; } patch(s.key, { arrived: true, arrivedAt: stamp(), arrivedBy: performer, labCode: labCodeOf(s), cond: "Good" }); toast(s.id + " found and marked arrived"); }
    else toast(s.id + " is already marked arrived", { icon: "info" });
    setScan("");
    setTimeout(() => { const el = document.getElementById("mass-" + s.key); if (el) { el.focus(); el.scrollIntoView && el.scrollIntoView({ block: "center" }); } }, 60);
  };
  const doPrint = (keys, reason, copies) => {
    upd((d) => { const oo = d.orders.find((x) => x.no === o.no); oo.samples.forEach((s) => { if (keys.includes(s.key)) { s.labels = (s.labels || 0) + 1; s.labelAt = stamp(); } }); const bb = d.batches.find((x) => x.no === b.no); bb.log = (bb.log || []).concat({ text: keys.length + " label" + (keys.length === 1 ? "" : "s") + " printed by " + performer + (reason ? " · reprint: " + reason : ""), at: stamp() }); });
    setDlg(null); toast(keys.length + " label" + (keys.length === 1 ? "" : "s") + " printed" + (reason ? " (reprint logged)" : ""), { icon: "printer" });
  };

  // guards
  const missMass = act.filter((s) => !(num(s.mass) > 0)).length;
  const missCond = act.filter((s) => !s.cond || (s.cond !== "Good" && !(s.rem || "").trim())).length;
  const rules = [
    [act.length > 0, "At least one sample has arrived"],
    [act.length > 0 && missMass === 0, "Every arrived sample has a mass" + (missMass ? " · " + missMass + " missing" : "")],
    [act.length > 0 && missCond === 0, "Every arrived sample has a condition (a remark for anything but Good)" + (missCond ? " · " + missCond + " to fix" : "")],
    [act.length > 0 && toPrint === 0, "Every arrived sample has a printed label" + (toPrint ? " · " + toPrint + " still to print" : "")],
  ];
  const canStart = canEdit && rules.every((r) => r[0]);
  const doStart = () => {
    const sn = snapshot();
    upd((d) => {
      const bb = d.batches.find((x) => x.no === b.no); const oo = d.orders.find((x) => x.no === o.no);
      bb.status = "prep"; bb.performer = performer; bb.prep = { by: performer, short: ini(performer), at: "started " + stamp() };
      const gone = [];
      oo.samples.forEach((s) => {
        if (s.batch !== b.no) return;
        if (arrivedS(s) && !s.hold && !s.received) s.received = { by: performer, at: "27 Oct 2026, " + timeNow() };
        else if (!arrivedS(s) && !s.hold) { s.batch = ""; s.released = { from: b.no, by: performer, at: stamp() }; gone.push(s.id); }
      });
      if (gone.length) {
        const kept = oo.samples.filter((s) => s.batch === b.no).length;
        bb.returned = gone; bb.samples = kept;
        bb.log = (bb.log || []).concat({ text: "Started with " + kept + " of " + (kept + gone.length) + " expected · returned to " + o.no + ": " + gone.join(", "), at: stamp() });
      }
      if (oo.status === "awaiting") oo.status = "progress";
    });
    setTab("prep"); setConfirmD(null);
    const n = act.length < expected - heldN ? expected - heldN - act.length : 0;
    toast("Reception confirmed for " + b.no + (n ? " · " + n + " sample" + (n === 1 ? "" : "s") + " returned to " + o.no : ""), { icon: "play", action: { label: "Undo", fn: () => { restore(sn); setTab("reception"); } } });
  };
  const startClick = () => {
    if (!canStart) return;
    if (act.length < expected - heldN) { const miss = rows.filter((s) => !arrivedS(s) && !s.hold).map((s) => s.id); const n = miss.length; setConfirmD({ title: "Confirm reception with " + act.length + " of " + expected + " samples?", body: miss.join(" and ") + (n === 1 ? " has" : " have") + " not arrived. " + (n === 1 ? "It leaves" : "They leave") + " this batch and go back to " + o.no + " as Awaiting arrival. When " + (n === 1 ? "it arrives" : "they arrive") + ", add " + (n === 1 ? "it" : "them") + " to a new batch. Confirming reception locks the sample information of the " + act.length + " that arrived.", counts: [["Arrived", act.length, "var(--success)"], ["On hold", heldN, "var(--text-muted)"], ["Leave the batch", n, "var(--accent-text)"]], ok: "Confirm reception", onOk: doStart }); }
    else doStart();
  };

  // preparation
  const tmOrdered = o.params.includes("TM");
  const draftOf = (s) => drafts[s.key] || {};
  const val = (s, k) => (k in draftOf(s) ? draftOf(s)[k] : (s[k] == null ? "" : s[k]));
  const setDraft = (s, k, v) => { setDrafts(Object.assign({}, drafts, { [s.key]: Object.assign({}, draftOf(s), { [k]: v }) })); setRowErr(Object.assign({}, rowErr, { [s.key]: null })); };
  const nDraft = Object.keys(drafts).length;
  const saveAll = () => {
    const errs = {}; const ok = [];
    Object.keys(drafts).forEach((key) => { const d = drafts[key]; const a = "adl" in d ? d.adl : null; if (a !== null && a !== "" && (num(a) == null || num(a) < 0 || num(a) > 100)) errs[key] = "ADL must be a number from 0 to 100"; else ok.push(key); });
    setRowErr(errs);
    if (ok.length) { upd((dd) => { const oo = dd.orders.find((x) => x.no === o.no); oo.samples.forEach((s) => { if (ok.includes(s.key)) Object.assign(s, drafts[s.key], { prepBy: performer, prepAt: stamp() }); }); }); const left = {}; Object.keys(drafts).forEach((k) => { if (!ok.includes(k)) left[k] = drafts[k]; }); setDrafts(left); toast(ok.length + " sample" + (ok.length === 1 ? "" : "s") + " saved"); }
    return Object.keys(errs).length === 0;
  };
  const needAdl = act.filter((s) => tmOrdered && !(num(s.adl) != null) ).length;
  const finishRules = [
    [!!b.prep, "Preparation started " + (b.prep ? b.prep.at.replace(/^started /, "") + " by " + b.prep.by : "")],
    [!tmOrdered || needAdl === 0, "ADL entered for every sample" + (tmOrdered ? " (TM is ordered)" : "") + (needAdl ? " · " + needAdl + " still to enter" : "")],
    [nDraft === 0, nDraft ? "Save your changes first · " + nDraft + " unsaved" : "No unsaved changes"],
  ];
  const canFinish = canPrepEdit && finishRules.every((r) => r[0]);
  const doFinish = () => {
    const sn = snapshot();
    upd((d) => { const bb = d.batches.find((x) => x.no === b.no); bb.status = "prepdone"; bb.prepFinished = { by: performer, at: stamp() }; });
    toast("Preparation finished · ready for analysis", { icon: "check-circle", action: { label: "Undo", fn: () => restore(sn) } });
  };
  const renameBatch = (nn) => {
    const old = b.no; const printed = rows.some((s) => s.labels > 0);
    upd((d) => {
      const bb = d.batches.find((x) => x.no === old); bb.no = nn;
      bb.log = (bb.log || []).concat({ text: "Batch number changed from " + old + " to " + nn + " by " + performer, at: stamp() });
      d.orders.forEach((od) => od.samples.forEach((s) => {
        if (s.batch === old) { s.batch = nn; if (s.labCode) s.labCode = "B" + nn.slice(-4) + "-" + s.labCode.split("-")[1]; }
        if (s.released && s.released.from === old) s.released.from = nn;
      }));
    });
    setDlg(null); toast("Batch number changed to " + nn + (printed ? ". Labels already printed carry " + old + ": reprint them." : ""), { icon: "pencil-simple" });
    go({ v: "reception", batch: nn, order: o.no, tab });
  };
  const addPhoto = (s, tag, file) => {
    const id = "ph" + Date.now() + Math.floor(Math.random() * 1000);
    const push = (src) => { if (src) PHOTO_SRC[id] = src; patch(s.key, { photos: (s.photos || []).concat({ id, tag, name: file ? file.name : "sample-photo.jpg", by: performer, at: stamp() }) }); };
    if (file && window.FileReader) { const fr = new FileReader(); fr.onload = () => push(fr.result); fr.onerror = () => push(null); fr.readAsDataURL(file); } else push(null);
  };
  const removePhoto = (s, id) => patch(s.key, { photos: (s.photos || []).filter((x) => x.id !== id) });
  const hold = (s, reason, note) => { patch(s.key, { hold: { reason, note, by: performer } }); setDlg(null); toast(s.id + " is on hold"); };
  const release = (s) => { patch(s.key, { hold: null }); toast(s.id + " released"); };

  /* ---- analysis (v1: one final value per sample and parameter) ---- */
  const cols = b.params.concat(b.extra || []);
  const colsIn = cols.filter((p) => p !== "FC");
  const hasFC = cols.includes("FC");
  const aRows = rows.filter((s) => arrivedS(s) && !s.hold);
  const canAnalyze = role === "analyst" && ["prepdone", "analysis"].includes(b.status);
  const aval = (s, p) => (adr[s.key] && p in adr[s.key] ? adr[s.key][p] : (s.vals && s.vals[p]) || "");
  const fcOf = (s) => { const g = (p) => num(aval(s, p)); const im = g("IM"), a = g("Ash"), vm = g("VM"); return im != null && a != null && vm != null ? (100 - im - a - vm).toFixed(2) : null; };
  const aMissing = aRows.reduce((n, s) => n + colsIn.filter((p) => num(aval(s, p)) == null).length + (hasFC && fcOf(s) == null ? 1 : 0), 0);
  const aTotal = aRows.length * (colsIn.length + (hasFC ? 1 : 0));
  const nAdr = Object.keys(adr).length;
  const rangeWarn = (s, p) => { const v = num(aval(s, p)), r = RANGE[p]; return v != null && r && (v < r[0] || v > r[1]) ? (v > r[1] ? "above " + r[1] : "below " + r[0]) : null; };
  const setVal = (s, p, v) => { setAdr(Object.assign({}, adr, { [s.key]: Object.assign({}, adr[s.key] || {}, { [p]: v }) })); setRowErr(Object.assign({}, rowErr, { [s.key + p]: null })); };
  const saveVals = () => {
    const errs = {}; const okKeys = [];
    Object.keys(adr).forEach((k) => { let bad = false; Object.keys(adr[k]).forEach((p) => { const v = adr[k][p]; const n = num(v); if (v !== "" && (n == null || n < 0 || (puOf(p)[1] === "%" && n > 100))) { errs[k + p] = puOf(p)[1] === "%" ? "0 to 100" : "A number"; bad = true; } }); if (!bad) okKeys.push(k); });
    setRowErr(errs);
    if (okKeys.length) {
      upd((d) => { const oo = d.orders.find((x) => x.no === o.no); oo.samples.forEach((s) => { if (okKeys.includes(s.key)) { s.vals = Object.assign({}, s.vals || {}, adr[s.key]); s.valsBy = performer; s.valsAt = stamp(); } }); const bb = d.batches.find((x) => x.no === b.no); if (bb.status === "prepdone") { bb.status = "analysis"; bb.analysis = { by: performer, short: ini(performer), at: "started " + stamp() }; } });
      const left = {}; Object.keys(adr).forEach((k) => { if (!okKeys.includes(k)) left[k] = adr[k]; }); setAdr(left);
      toast(okKeys.length + " sample" + (okKeys.length === 1 ? "" : "s") + " saved");
    }
    return Object.keys(errs).length === 0;
  };
  const finishARules = [
    [aMissing === 0, "A value for every ordered parameter" + (aMissing ? " · " + aMissing + " still to enter" : "")],
    [nAdr === 0, nAdr ? "Save your changes first · " + nAdr + " unsaved" : "No unsaved changes"],
  ];
  const canFinishA = canAnalyze && b.status === "analysis" && finishARules.every((r) => r[0]);
  const doFinishA = () => { const sn = snapshot(); upd((d) => { const bb = d.batches.find((x) => x.no === b.no); bb.status = "finished"; bb.analysisFinished = { by: performer, at: stamp() }; }); toast("Analysis finished · upload the signed RoA", { icon: "check-circle", action: { label: "Undo", fn: () => restore(sn) } }); };
  const canComplete = role === "lab_admin" && b.status === "finished";
  const doComplete = () => { const sn = snapshot(); upd((d) => { const bb = d.batches.find((x) => x.no === b.no); bb.status = "completed"; bb.roa = roaNo.trim(); bb.roaFile = roaFile; bb.completed = { by: performer, at: stamp() }; }); toast(b.no + " completed · " + roaNo.trim(), { icon: "check-circle", action: { label: "Undo", fn: () => restore(sn) } }); };
  app.dirtyRef.current = (nDraft || nAdr) ? { save: () => { const a = nDraft ? saveAll() : true; const c = nAdr ? saveVals() : true; return a && c; }, discard: () => { setDrafts({}); setAdr({}); } } : null;
  const stateLabel = b.status === "created" ? (arrivedN ? "Receiving" : "Created") : b.status === "prep" ? "Preparation" : "Prep finished";
  const headBadge = b.status === "created" ? html`<span class=${"badge " + (arrivedN ? "b-awaiting" : "b-created")}>${stateLabel}</span>` : html`<${Badge} s=${b.status} kind="batch" />`;
  const roPrep = !canPrepEdit;
  const hintR = !canRecv && html`<div class="note info" style=${{ margin: "0 20px 12px" }}><${Icon} n="info" />Read only. Receiving is done by the CSO, Lab admin and Preparation.</div>`;
  const hintP = !isPrep && html`<div class="note info" style=${{ margin: "0 20px 12px" }}><${Icon} n="info" />Read only. Preparation values are entered by the Preparation team.</div>`;
  const hintA = role !== "analyst" && html`<div class="note info" style=${{ margin: "0 20px 12px" }}><${Icon} n="info" />Read only. Results are entered by the Analyst.</div>`;
  const fieldInput = (s, k, w, ro, attrs) => html`<input id=${k + "-" + s.key} class=${"input mono numin" + (attrs && attrs.err ? " err" : "")} style=${{ width: w || "100%", textAlign: "right" }} inputMode="decimal" value=${attrs && attrs.draft ? val(s, k) : (s[k] == null ? "" : s[k])} disabled=${ro} aria-label=${(attrs && attrs.label || k) + ", " + s.id}
    onInput=${(e) => (attrs && attrs.draft ? setDraft(s, k, e.target.value) : patch(s.key, { [k]: e.target.value }))} />`;
  const massWarn = (s) => { const m = num(s.mass); return m != null && (m < 0.1 || m > 50); };

  const photoBtn = (s) => { const n = (s.photos || []).length; const first = (s.photos || [])[0]; return html`<button type="button" class=${"phbtn" + (n ? " has" : "")} aria-label=${"Photos, " + s.id} onClick=${() => setDlg({ type: "photos", key: s.key })}>${first ? html`<span class="phthumb">${PHOTO_SRC[first.id] ? html`<img src=${PHOTO_SRC[first.id]} alt="" />` : html`<${Icon} n="image" />`}</span>` : null}<${Icon} n="paperclip" />${n || "Add"}</button>`; };
  /* ---- reception rows ---- */
  const recvDesktop = html`<div class="grid-wrap"><div class="rgrid" style=${{ minWidth: mode === "desktop" ? "980px" : "680px" }} role="table" aria-label="Samples to receive">
    <div class="thead rrow" role="row" style=${{ gridTemplateColumns: mode === "desktop" ? "28px 110px 92px 60px 120px 130px minmax(120px,1fr) 86px 150px 32px" : "24px 100px 56px 96px 118px 70px minmax(100px,1fr) 28px" }}>
      <span>#</span><span>Sample ID</span>${mode === "desktop" && html`<span>Lab code</span>`}<span>Arrived</span><span>${mode === "desktop" ? "Mass received (kg)" : "Mass (kg)"}</span><span>Condition</span>${mode === "desktop" && html`<span>Remarks</span>`}<span>Photos</span><span>Label</span><span></span>
    </div>
    ${rows.map((s) => { const ar = arrivedS(s); const ro = !canEdit || !!s.received || !!s.hold; const wet = ar && s.cond && s.cond !== "Good";
      return html`<div class=${"rrow" + (s.hold ? " held" : "")} role="row" key=${s.key} style=${{ gridTemplateColumns: mode === "desktop" ? "28px 110px 92px 60px 120px 130px minmax(120px,1fr) 86px 150px 32px" : "24px 100px 56px 96px 118px 70px minmax(100px,1fr) 28px" }}>
        <span class="mono muted" style=${{ fontSize: "12px" }}>${idx(s)}</span>
        <span class="cell2"><b class="mono" style=${{ color: "var(--heading)" }}>${s.id}</b>${s.hold && html`<small style=${{ color: "var(--text-muted)" }}>On hold · ${s.hold.reason}</small>`}</span>
        ${mode === "desktop" && html`<span class="mono" style=${{ fontSize: "12px", color: ar ? "var(--text-secondary)" : "var(--text-muted)" }}>${s.labCode || "—"}</span>`}
        <span><button type="button" class=${"chk" + (ar ? " on" : "")} role="checkbox" aria-checked=${ar} aria-label=${"Arrived, " + s.id} disabled=${!canEdit || !!s.received || !!s.hold} onClick=${() => toggleArrived(s)}>${ar && html`<${Icon} n="check" />`}</button></span>
        <span>${fieldInput(s, "mass", "100%", ro || !ar, { label: "Mass received in kg" })}${ar && massWarn(s) && html`<small class="warnline">Check the weight</small>`}</span>
        <span><select class=${"select" + (wet ? " wetsel" : "")} value=${s.cond || ""} disabled=${ro || !ar} aria-label=${"Condition, " + s.id} onChange=${(e) => patch(s.key, { cond: e.target.value })}>${ar ? null : html`<option value="">—</option>`}${COND.map((c) => html`<option key=${c}>${c}</option>`)}</select></span>
        ${mode === "desktop" && html`<span><input class=${"input" + (ar && s.cond && s.cond !== "Good" && !(s.rem || "").trim() ? " err" : "")} value=${s.rem || ""} disabled=${ro || !ar} placeholder=${ar && s.cond && s.cond !== "Good" ? "Remark needed" : ""} aria-label=${"Remarks, " + s.id} onInput=${(e) => patch(s.key, { rem: e.target.value })} /></span>`}
        <span>${photoBtn(s)}</span>
        <span class="lbl">${ar && !s.hold ? (s.labels > 0 ? html`<span style=${{ color: "var(--success)", display: "inline-flex", gap: "6px", alignItems: "center", fontSize: "12px" }}><${Icon} n="printer" />Printed ${s.labelAt ? s.labelAt.split(", ")[1] : ""}${s.labels > 1 ? " · " + s.labels + "×" : ""}</span>` : html`<span style=${{ color: "var(--accent-text)", fontWeight: 600, display: "inline-flex", gap: "6px", alignItems: "center", fontSize: "12px" }}><${Icon} n="warning" />Not printed</span>`) : html`<span class="muted">—</span>`}</span>
        <span style=${{ position: "relative" }}><button class="ib sm" aria-label=${"Actions for " + s.id} aria-haspopup="menu" onClick=${() => setMenu(menu === s.key ? null : s.key)}><${Icon} n="dots-three-vertical" /></button>
          ${menu === s.key && html`<div class="menu" role="menu" style=${{ top: "36px", right: 0 }}>
            ${s.hold ? html`<button role="menuitem" disabled=${!canEdit} onClick=${() => { setMenu(null); release(s); }}><${Icon} n="arrow-counter-clockwise" />Release</button>`
              : html`<button role="menuitem" disabled=${!canEdit || !!s.received} onClick=${() => { setMenu(null); setDlg({ type: "hold", key: s.key }); }}><${Icon} n="prohibit" />Hold</button>`}
            <button role="menuitem" disabled=${!canPrint || !ar || !!s.hold} onClick=${() => { setMenu(null); setDlg({ type: "print", preset: s.key }); }}><${Icon} n="printer" />${s.labels > 0 ? "Reprint label" : "Print label"}</button>
          </div>`}</span>
      </div>`; })}
  </div></div>`;
  const recvCards = html`<div style=${{ display: "flex", flexDirection: "column", gap: "10px", padding: "0 12px 12px" }}>${rows.map((s) => { const ar = arrivedS(s); const ro = !canEdit || !!s.received || !!s.hold; const wet = ar && s.cond && s.cond !== "Good";
    return html`<div key=${s.key} class=${"rcard" + (wet ? " warn" : "") + (s.hold ? " held" : "")}>
      <div class="top"><button type="button" class=${"chk big" + (ar ? " on" : "")} role="checkbox" aria-checked=${ar} aria-label=${"Arrived, " + s.id} disabled=${!canEdit || !!s.received || !!s.hold} onClick=${() => toggleArrived(s)}>${ar && html`<${Icon} n="check" />`}</button>
        <div style=${{ flex: 1, minWidth: 0 }}><b class="mono" style=${{ fontSize: "14px", color: "var(--heading)", display: "block" }}>${s.id}</b><span class="mono muted" style=${{ fontSize: "12px" }}>${s.labCode || "—"}${s.hold ? " · on hold" : ""}</span></div>
        <div style=${{ fontSize: "12px", display: "flex", gap: "5px", alignItems: "center", color: ar && !s.hold ? (s.labels > 0 ? "var(--success)" : "var(--accent-text)") : "var(--text-muted)", fontWeight: ar && !(s.labels > 0) ? 600 : 400 }}>${ar && !s.hold ? html`<${Icon} n=${s.labels > 0 ? "printer" : "warning"} />${s.labels > 0 ? "Printed" : "Not printed"}` : "—"}</div>
        <button class="ib sm" aria-label=${"Actions for " + s.id} onClick=${() => setMenu(menu === s.key ? null : s.key)}><${Icon} n="dots-three-vertical" /></button></div>
      ${menu === s.key && html`<div class="rowmenu"><button disabled=${!canEdit || !!s.received} onClick=${() => { setMenu(null); s.hold ? release(s) : setDlg({ type: "hold", key: s.key }); }}>${s.hold ? "Release" : "Hold"}</button><button disabled=${!canPrint || !ar || !!s.hold} onClick=${() => { setMenu(null); setDlg({ type: "print", preset: s.key }); }}>${s.labels > 0 ? "Reprint label" : "Print label"}</button></div>`}
      <div style=${{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
        <div class="field"><label>Mass (kg)</label>${fieldInput(s, "mass", "100%", ro || !ar, { label: "Mass received in kg" })}</div>
        <div class="field"><label>Condition</label><select class=${"select" + (wet ? " wetsel" : "")} value=${s.cond || ""} disabled=${ro || !ar} aria-label=${"Condition, " + s.id} onChange=${(e) => patch(s.key, { cond: e.target.value })}>${ar ? null : html`<option value="">—</option>`}${COND.map((c) => html`<option key=${c}>${c}</option>`)}</select></div>
      </div>
      <div>${photoBtn(s)}</div>
      ${ar && html`<div style=${{ display: "grid", gridTemplateColumns: "1fr", gap: "10px" }}>
        <div class="field"><label>Remarks</label><input class=${"input" + (wet && !(s.rem || "").trim() ? " err" : "")} value=${s.rem || ""} disabled=${ro} placeholder=${wet ? "Remark needed" : ""} onInput=${(e) => patch(s.key, { rem: e.target.value })} /></div></div>`}
    </div>`; })}</div>`;

  /* ---- preparation rows ---- */
  const prepRows = rows.filter((s) => arrivedS(s));
  const prepDesktop = html`<div class="grid-wrap"><div class="rgrid" style=${{ minWidth: mode === "desktop" ? "900px" : "640px" }} role="table" aria-label="Preparation values">
    <div class="thead rrow" style=${{ gridTemplateColumns: mode === "desktop" ? "28px 110px 92px 120px minmax(120px,1fr) 110px 170px" : "24px 100px 110px minmax(100px,1fr)" }}>
      <span>#</span><span>Sample ID</span>${mode === "desktop" && html`<span>Lab code</span>`}<span>ADL (%)</span>${mode === "desktop" && html`<span>Entered by</span><span>Saved</span>`}<span>Status</span>
    </div>
    ${prepRows.map((s) => { const a = num(val(s, "adl")); const warn = a != null && a > 20; const dr = !!drafts[s.key]; const ro = roPrep || !!s.hold;
      return html`<div class=${"rrow" + (s.hold ? " held" : "")} role="row" key=${s.key} style=${{ gridTemplateColumns: mode === "desktop" ? "28px 110px 92px 120px minmax(120px,1fr) 110px 170px" : "24px 100px 110px minmax(100px,1fr)" }}>
        <span class="mono muted" style=${{ fontSize: "12px" }}>${idx(s)}</span>
        <span class="cell2"><b class="mono" style=${{ color: "var(--heading)" }}>${s.id}</b>${s.hold && html`<small>On hold</small>`}</span>
        ${mode === "desktop" && html`<span class="mono" style=${{ fontSize: "12px", color: "var(--text-secondary)" }}>${s.labCode}</span>`}
        <span>${fieldInput(s, "adl", "100%", ro, { draft: true, label: "ADL in percent", err: !!rowErr[s.key] || warn })}</span>
        ${mode === "desktop" && html`<span style=${{ display: "inline-flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "var(--text-secondary)" }}>${s.prepBy ? html`<${Avatar} name=${s.prepBy} sm />${s.prepBy}` : html`<span class="muted">—</span>`}</span>
          <span class="mono" style=${{ fontSize: "12px", color: s.prepAt ? "var(--text-secondary)" : "var(--text-muted)" }}>${s.prepAt ? s.prepAt.split(", ")[1] : "—"}</span>`}
        <span style=${{ fontSize: "12px" }}>${rowErr[s.key] ? html`<span class="errmsg">${rowErr[s.key]}</span>` : s.hold ? html`<span class="muted">On hold</span>` : dr ? html`<span style=${{ color: "var(--accent-text)", fontWeight: 600 }}>Unsaved</span>` : warn ? html`<span style=${{ color: "var(--accent-text)", fontWeight: 600, display: "inline-flex", gap: "6px", alignItems: "center" }}><${Icon} n="warning" />Check: above 20 %</span>` : num(s.adl) != null ? html`<span style=${{ color: "var(--success)", display: "inline-flex", gap: "6px", alignItems: "center" }}><${Icon} n="check-circle" />Saved</span>` : html`<span class="muted">Pending</span>`}</span>
      </div>`; })}
  </div></div>`;
  const prepCards = html`<div style=${{ display: "flex", flexDirection: "column", gap: "10px", padding: "0 12px 12px" }}>${prepRows.map((s) => { const a = num(val(s, "adl")); const warn = a != null && a > 20; const ro = roPrep || !!s.hold; const dr = !!drafts[s.key];
    return html`<div key=${s.key} class=${"rcard" + (warn ? " warn" : "")}>
      <div class="top"><div style=${{ flex: 1 }}><b class="mono" style=${{ fontSize: "14px", color: "var(--heading)", display: "block" }}>${s.id}</b><span class="mono muted" style=${{ fontSize: "12px" }}>${s.labCode}</span></div>
        <span style=${{ fontSize: "12px" }}>${rowErr[s.key] ? html`<span class="errmsg">${rowErr[s.key]}</span>` : s.hold ? "On hold" : dr ? html`<b style=${{ color: "var(--accent-text)" }}>Unsaved</b>` : warn ? html`<b style=${{ color: "var(--accent-text)" }}>Above 20 %</b>` : num(s.adl) != null ? html`<span style=${{ color: "var(--success)" }}>Saved</span>` : html`<span class="muted">Pending</span>`}</span></div>
      <div style=${{ display: "grid", gridTemplateColumns: "1fr", gap: "10px" }}>
        <div class="field"><label>ADL (%)</label>${fieldInput(s, "adl", "100%", ro, { draft: true, label: "ADL in percent", err: !!rowErr[s.key] || warn })}</div>
        </div>
    </div>`; })}</div>`;

  const ruleList = (list) => html`<div class="rules">${list.map(([ok, txt], i) => html`<div key=${i} class="rule"><${Icon} n=${ok ? "check-circle" : "circle"} cls=${ok ? "ok" : "no"} /><span style=${{ color: ok ? "var(--foreground)" : "var(--accent-text)", fontWeight: ok ? 400 : 600 }}>${txt}</span></div>`)}</div>`;
  const heldRow = rows.find((s) => s.key === (dlg && dlg.key));
  const showBar = mode === "mobile" && ((tab === "reception" && canRecv && b.status === "created") || (tab === "prep" && isPrep && b.status === "prep") || (tab === "analysis" && canAnalyze));
  const mobileBar = showBar && html`<div class="sticky-act" style=${{ display: "flex", gap: "10px" }}>
    ${tab === "reception" ? html`<button class="btn secondary" style=${{ flex: 1 }} disabled=${!canPrint || !act.length} onClick=${() => setDlg({ type: "print" })}><${Icon} n="printer" />Print${toPrint ? " (" + toPrint + ")" : ""}</button><button class="btn primary" style=${{ flex: 1 }} disabled=${!canStart} onClick=${startClick}><${Icon} n="play" />Confirm reception</button>`
      : tab === "prep" ? html`<button class="btn secondary" style=${{ flex: 1 }} disabled=${!canPrepEdit || !nDraft} onClick=${saveAll}><${Icon} n="floppy-disk" />Save all</button><button class="btn primary" style=${{ flex: 1 }} disabled=${!canFinish} onClick=${doFinish}><${Icon} n="check" />Finish</button>`
      : html`<button class="btn secondary" style=${{ flex: 1 }} disabled=${!nAdr} onClick=${saveVals}><${Icon} n="floppy-disk" />Save all</button><button class="btn primary" style=${{ flex: 1 }} disabled=${!canFinishA} onClick=${doFinishA}><${Icon} n="check" />Finish</button>`}</div>`;

  return html`<${Fragment}>
    <div class="crumb"><button onClick=${() => guard(() => go({ v: "detail", no: o.no, tab: "batches" }))}>Job orders</button><${Icon} n="caret-right" /><button onClick=${() => guard(() => go({ v: "detail", no: o.no, tab: "batches" }))} class="mono">${o.no}</button><${Icon} n="caret-right" /><span class="mono">${b.no}</span></div>
    <div class="dhead">
      <div style=${{ minWidth: 0 }}><div class="dtitle"><h1 class="mono" style=${{ fontFamily: "var(--f-display)" }}>${b.no}</h1>${headBadge}${canEdit && html`<button class="ib sm pencil" aria-label="Change batch number" title="Change batch number" onClick=${() => setDlg({ type: "rename" })}><${Icon} n="pencil-simple" /></button>`}</div>
        <div class="dmeta">${companyOf(db, o).name} · ${o.no} · ${b.standard} · ${expected} samples${(b.returned || []).length ? " · " + b.returned.length + " returned to the job order" : ""} · Deadline ${b.deadline}</div></div>
    </div>
    <${BatchStepper} b=${b} arrivedN=${arrivedN} />
    <div class="tabs" role="tablist"><button role="tab" aria-selected=${tab === "reception"} class=${"tab" + (tab === "reception" ? " on" : "")} onClick=${() => guard(() => setTab("reception"))}>Reception<span class="cnt">${expected}</span></button>
      <button role="tab" aria-selected=${tab === "prep"} class=${"tab" + (tab === "prep" ? " on" : "")} onClick=${() => setTab("prep")}>Preparation<span class="cnt">${b.status === "created" ? 0 : prepRows.length}</span></button>
      <button role="tab" aria-selected=${tab === "analysis"} class=${"tab" + (tab === "analysis" ? " on" : "")} onClick=${() => setTab("analysis")}>Analysis</button></div>
    ${tab === "reception" && html`<section class="card" aria-label="Reception">
      <div class="cardhead" style=${{ flexWrap: "wrap" }}>
        <div><h2>Reception</h2><span class="muted" style=${{ fontSize: "12px" }}>${arrivedN} of ${expected} arrived · ${printedN} label${printedN === 1 ? "" : "s"} printed · ${heldN} on hold</span></div>
        ${mode !== "mobile" && html`<div style=${{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
          <div class="search" style=${{ width: "230px" }}><${Icon} n="barcode" /><input id="scan-input" class=${"input" + (scanErr ? " err" : "")} aria-label="Scan or type a label" placeholder="Scan or type a label" value=${scan} disabled=${!canRecv} onInput=${(e) => { setScan(e.target.value); setScanErr(null); }} onKeyDown=${(e) => e.key === "Enter" && doScan()} /></div>
          ${canRecv && html`<button class="btn secondary sm" disabled=${!canEdit} onClick=${markAll}><${Icon} n="check-square-offset" />Mark all arrived</button>`}
          ${canRecv && html`<button class="btn secondary sm" disabled=${!canPrint || !act.length} onClick=${() => setDlg({ type: "print" })}><${Icon} n="printer" />Print labels${toPrint ? " (" + toPrint + ")" : ""}</button>`}
          ${canRecv && html`<button class="btn primary sm" disabled=${!canStart} onClick=${startClick} title=${canStart ? undefined : "See the checks below"}><${Icon} n="play" />Confirm reception</button>`}</div>`}
      </div>
      ${mode === "mobile" && html`<div style=${{ padding: "0 16px 12px" }}><div class="search"><${Icon} n="barcode" /><input id="scan-input" class=${"input" + (scanErr ? " err" : "")} aria-label="Scan or type a label" placeholder="Scan or type a label" value=${scan} disabled=${!canRecv} onInput=${(e) => { setScan(e.target.value); setScanErr(null); }} onKeyDown=${(e) => e.key === "Enter" && doScan()} /></div></div>`}
      ${scanErr && html`<div class="note" style=${{ background: "var(--error-100)", color: "var(--error)" }}><${Icon} n="warning-circle" />${scanErr}</div>`}
      ${hintR}
      ${(b.returned || []).length > 0 && html`<div class="note info" style=${{ margin: "0 20px 12px" }}><${Icon} n="arrow-u-up-left" /><span>${b.returned.length} sample${b.returned.length === 1 ? "" : "s"} returned to ${o.no} when reception was confirmed: ${b.returned.join(", ")}. </span><button class="link" onClick=${() => guard(() => go({ v: "detail", no: o.no, tab: "samples" }))}>Open the job order's samples</button></div>`}
      ${rows.length === 0 ? html`<div class="empty"><${Icon} n="list-numbers" /><b>No samples in this batch</b><span>Add sample IDs on the job order first.</span></div>` : mode === "mobile" ? recvCards : recvDesktop}
      ${b.status === "created" && html`<div class="rulebox"><p class="sechead">Before you can confirm reception</p>${ruleList(rules)}</div>`}
      ${b.log && b.log.length > 0 && html`<div class="rulebox" style=${{ paddingTop: 0 }}><p class="sechead">Log</p>${b.log.slice(-4).map((l, i) => html`<div key=${i} class="muted" style=${{ fontSize: "12px" }}>${l.at} · ${l.text}</div>`)}</div>`}
    </section>`}
    ${tab === "prep" && html`<section class="card" aria-label="Preparation">
      ${b.status === "prepdone" && html`<div class="note ok" style=${{ margin: "0", borderRadius: "16px 16px 0 0" }}><${Icon} n="check-circle" />Ready for analysis. An analyst can start analysis from Input ROA.</div>`}
      <div class="cardhead" style=${{ flexWrap: "wrap" }}>
        <div><h2>Preparation</h2><span class="muted" style=${{ fontSize: "12px" }}>${b.status === "created" ? "Starts after Confirm reception" : prepRows.filter((s) => num(s.adl) != null).length + " of " + prepRows.length + " ADL values saved" + (b.prep ? " · started " + b.prep.at.replace(/^started /, "") + " by " + b.prep.by : "") + (b.prepFinished ? " · finished " + b.prepFinished.at + " by " + b.prepFinished.by : "")}</span></div>
        ${mode !== "mobile" && isPrep && b.status === "prep" && html`<div style=${{ display: "flex", gap: "8px" }}><button class="btn secondary sm" disabled=${!canPrepEdit || !nDraft} onClick=${saveAll}><${Icon} n="floppy-disk" />Save all${nDraft ? " (" + nDraft + ")" : ""}</button><button class="btn primary sm" disabled=${!canFinish} onClick=${doFinish}><${Icon} n="check" />Finish Preparation</button></div>`}
        ${mode !== "mobile" && canRecv && b.status === "prepdone" && html`<button class="btn secondary sm" disabled=${!canPrint} onClick=${() => setDlg({ type: "print" })}><${Icon} n="printer" />Reprint labels</button>`}
      </div>
      ${b.status === "created" ? html`<div class="empty"><${Icon} n="flask" /><b>Preparation has not started</b><span>Receive the samples on the Reception tab, then use Confirm reception.</span></div>` : html`${hintP}${mode === "mobile" ? prepCards : prepDesktop}
        <div class="rulebox"><p class="sechead">${b.status === "prepdone" ? "Preparation checks" : "Before you can finish preparation"}</p>${ruleList(finishRules)}</div>`}
    </section>`}
    ${tab === "analysis" && html`<section class="card" aria-label="Analysis">
      <div class="cardhead" style=${{ flexWrap: "wrap" }}>
        <div><h2>Analysis</h2><span class="muted" style=${{ fontSize: "12px" }}>${["created", "prep"].includes(b.status) ? "Starts when preparation is finished" : (aTotal - aMissing) + " of " + aTotal + " values saved" + (b.analysis ? " · " + b.analysis.at + " by " + b.analysis.by : "") + (b.analysisFinished ? " · finished " + b.analysisFinished.at + " by " + b.analysisFinished.by : "")}</span></div>
        ${mode !== "mobile" && canAnalyze && html`<div style=${{ display: "flex", gap: "8px" }}><button class="btn secondary sm" disabled=${!nAdr} onClick=${saveVals}><${Icon} n="floppy-disk" />Save all${nAdr ? " (" + nAdr + ")" : ""}</button><button class="btn primary sm" disabled=${!canFinishA} onClick=${doFinishA}><${Icon} n="check" />Finish Analysis</button></div>`}
      </div>
      ${["created", "prep"].includes(b.status) ? html`<div class="empty"><${Icon} n="flask" /><b>Analysis has not started</b><span>The analyst enters results after preparation is finished.</span></div>` : html`${hintA}
        ${mode === "mobile" ? html`<div style=${{ display: "flex", flexDirection: "column", gap: "10px", padding: "0 12px 12px" }}>${aRows.map((s) => html`<div key=${s.key} class="rcard">
          <div class="top"><b class="mono" style=${{ fontSize: "14px", color: "var(--heading)" }}>${s.id}</b></div>
          <div style=${{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>${cols.map((p) => html`<div class="field" key=${p}><label>${p} <span class="muted">${puOf(p)[0]} ${puOf(p)[1]}</span></label>${p === "FC" ? html`<div class="calc">${fcOf(s) || "—"}</div>` : html`<input id=${"val-" + s.key + "-" + slug(p)} class=${"input mono numin" + (rowErr[s.key + p] || rangeWarn(s, p) ? " err" : "")} style=${{ textAlign: "right" }} inputMode="decimal" value=${aval(s, p)} disabled=${!canAnalyze} aria-label=${p + ", " + s.id} onInput=${(e) => setVal(s, p, e.target.value)} />`}${(rowErr[s.key + p] || rangeWarn(s, p)) && html`<span class="warnnote">${rowErr[s.key + p] || "Check: " + rangeWarn(s, p)}</span>`}</div>`)}</div></div>`)}</div>`
        : html`<div class="grid-wrap"><div class="rgrid" style=${{ minWidth: (140 + cols.length * 96 + 120) + "px" }} role="table" aria-label="Results">
          <div class="thead rrow" style=${{ gridTemplateColumns: "28px 110px " + cols.map(() => "minmax(88px,1fr)").join(" ") + " 120px" }}><span>#</span><span>Sample ID</span>${cols.map((p) => html`<span key=${p} class="cell2"><b>${p}</b><small>${puOf(p)[0]} ${puOf(p)[1]}</small></span>`)}<span>Status</span></div>
          ${aRows.map((s, i) => html`<div class="rrow" role="row" key=${s.key} style=${{ gridTemplateColumns: "28px 110px " + cols.map(() => "minmax(88px,1fr)").join(" ") + " 120px" }}>
            <span class="mono muted" style=${{ fontSize: "12px" }}>${idx(s)}</span><span class="cell2"><b class="mono" style=${{ color: "var(--heading)" }}>${s.id}</b></span>
            ${cols.map((p) => html`<span key=${p} class="cell2">${p === "FC" ? html`<div class="calc" title="100 − (IM + Ash + VM)">${fcOf(s) || "—"}</div>` : html`<input id=${"val-" + s.key + "-" + slug(p)} class=${"input mono numin" + (rowErr[s.key + p] ? " err" : rangeWarn(s, p) ? " warncell" : "")} style=${{ width: "100%", textAlign: "right" }} inputMode="decimal" value=${aval(s, p)} disabled=${!canAnalyze} aria-label=${p + ", " + s.id} onInput=${(e) => setVal(s, p, e.target.value)} />`}${(rowErr[s.key + p] || rangeWarn(s, p)) && html`<small class="warnnote">${rowErr[s.key + p] || "Check: " + rangeWarn(s, p)}</small>`}</span>`)}
            <span style=${{ fontSize: "12px" }}>${adr[s.key] ? html`<span style=${{ color: "var(--accent-text)", fontWeight: 600 }}>Unsaved</span>` : colsIn.every((p) => num(aval(s, p)) != null) ? html`<span style=${{ color: "var(--success)", display: "inline-flex", gap: "6px", alignItems: "center" }}><${Icon} n="check-circle" />Saved</span>` : html`<span class="muted">Pending</span>`}</span>
          </div>`)}</div></div>`}
        ${b.status === "analysis" && html`<div class="rulebox"><p class="sechead">Before you can finish analysis</p>${ruleList(finishARules)}</div>`}
        ${["finished", "completed"].includes(b.status) && html`<div class="rulebox"><p class="sechead">Signed RoA</p>
          ${b.status === "completed" ? html`<div style=${{ display: "flex", gap: "10px", alignItems: "center", fontSize: "13px" }}><${Icon} n="file-pdf" /><b class="mono">${b.roa}</b><span class="muted">${b.roaFile || "signed RoA (PDF)"}</span></div>`
          : canComplete ? html`<div style=${{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "flex-end" }}>
              <div class="field" style=${{ width: "200px" }}><label for="roa-no">RoA number *</label><input id="roa-no" class="input mono" value=${roaNo} placeholder="RoA-0417" onInput=${(e) => setRoaNo(e.target.value)} /></div>
              <label class="btn secondary"><${Icon} n="upload-simple" />${roaFile || "Upload signed RoA (PDF)"}<input type="file" accept="application/pdf" style=${{ display: "none" }} onChange=${(e) => setRoaFile(e.target.files && e.target.files[0] ? e.target.files[0].name : "")} /></label>
              <button class="btn secondary" onClick=${() => { setRoaFile("RoA-signed.pdf"); if (!roaNo.trim()) setRoaNo("RoA-" + b.no.slice(-4)); }}>Use an example PDF</button>
              <button class="btn primary" disabled=${!roaNo.trim() || !roaFile} onClick=${doComplete}><${Icon} n="check" />Complete batch</button></div>`
          : html`<span class="muted" style=${{ fontSize: "13px" }}>Waiting for the Lab admin to upload the signed RoA and complete the batch.</span>`}</div>`}
      `}
    </section>`}
    ${mobileBar}
    ${dlg && dlg.type === "rename" && html`<${RenameDialog} b=${b} db=${db} onClose=${() => setDlg(null)} onSave=${renameBatch} />`}
    ${dlg && dlg.type === "photos" && html`<${PhotoSheet} s=${rows.find((x) => x.key === dlg.key)} canEdit=${canEdit} mode=${mode} onClose=${() => setDlg(null)} onAdd=${addPhoto} onRemove=${removePhoto} />`}
    ${dlg && dlg.type === "print" && html`<${PrintDialog} rows=${rows} b=${b} o=${o} db=${db} preset=${dlg.preset} performer=${performer} onClose=${() => setDlg(null)} onPrint=${doPrint} />`}
    ${dlg && dlg.type === "hold" && heldRow && html`<${HoldDialog} s=${heldRow} onClose=${() => setDlg(null)} onHold=${(r, n) => hold(heldRow, r, n)} />`}
    ${confirmD && html`<${Dialog} title=${confirmD.title} onClose=${() => setConfirmD(null)} actions=${html`<button class="btn secondary" onClick=${() => setConfirmD(null)}>Cancel</button><button class="btn primary" onClick=${() => { const f = confirmD.onOk; setConfirmD(null); f(); }}>${confirmD.ok}</button>`}>
      <p style=${{ margin: 0 }}>${confirmD.body}</p>
      ${confirmD.counts && html`<div class="counts">${confirmD.counts.map(([k, v, c]) => html`<div key=${k}><b class="mono" style=${{ color: c }}>${v}</b><span>${k}</span></div>`)}</div>`}
    <//>`}
  <//>`;
}

window.__REC = { ReceptionView };
})();
