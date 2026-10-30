/* SGSI job order prototype. React 18 + htm, no build step. Sources: .context/prototype/src, joined by build.py. */
(function () {
const { useState, useEffect, useRef, useMemo, useContext, createContext, Fragment } = React;
const html = htm.bind(React.createElement);
const P = window.PROTO;
const Ctx = createContext(null);
const useApp = () => useContext(Ctx);

/* ---------- small helpers ---------- */
function Icon({ n, cls }) {
  return html`<span class=${"ph " + (cls || "")} aria-hidden="true" dangerouslySetInnerHTML=${{ __html: '<svg viewBox="0 0 256 256" fill="currentColor">' + (window.ICONS[n] || "") + "</svg>" }}></span>`;
}
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
function fmtDate(iso) { if (!iso) return "—"; const [y, m, d] = iso.split("-").map(Number); return d + " " + MONTHS[m - 1] + " " + y; }
function addDays(iso, n) { const d = new Date(iso + "T00:00:00"); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); }
function clone(x) { return JSON.parse(JSON.stringify(x)); }
const OPEN = ["awaiting", "progress"];
const isLate = (o) => o.due && o.due < P.TODAY && OPEN.includes(o.status);
const companyOf = (db, o) => db.companies.find((c) => c.id === o.company) || { name: "—", address: "" };
const contactOf = (db, o) => db.contacts.find((c) => c.id === o.contact);
const signatoryOf = (db, o) => db.signatories.find((s) => s.id === o.signatory);
const batchesOf = (db, no) => db.batches.filter((b) => b.order === no);
const templateOf = (id) => P.TEMPLATES.find((t) => t.id === id);
function paramsLabel(o) {
  const t = templateOf(o.template);
  if (t) return t.label;
  if (!o.params.length) return "—";
  return "Custom";
}
const received = (o) => o.samples.filter((s) => s.received).length;
const initials = (name) => name.split(" ").filter((w) => /^[A-Z]/.test(w)).slice(0, 2).map((w) => w[0]).join("");
const KEY = "sgsi-jo-proto-v5";
function loadSaved() { try { const s = JSON.parse(localStorage.getItem(KEY) || "null"); if (s && s.db && s.db.version === 5) return s; } catch (e) {} return null; }
function persist(s) { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {} }

/* Esc closes the innermost open layer first. */
const escStack = [];
function useEsc(fn, active) {
  const ref = useRef(fn); ref.current = fn;
  useEffect(() => {
    if (!active) return;
    const h = () => ref.current();
    escStack.push(h);
    return () => { const i = escStack.lastIndexOf(h); if (i >= 0) escStack.splice(i, 1); };
  }, [active]);
}
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && escStack.length) { e.preventDefault(); escStack[escStack.length - 1](); }
});
function useOutside(ref, fn, active) {
  useEffect(() => {
    if (!active) return;
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) fn(); };
    const t = setTimeout(() => document.addEventListener("mousedown", h), 0);
    return () => { clearTimeout(t); document.removeEventListener("mousedown", h); };
  }, [active]);
}

/* ---------- permissions ---------- */
// Hidden when the role cannot use an action; disabled with a reason when the state blocks it.
function perm(db, role, action, o) {
  const no = { show: false };
  const ok = { show: true, enabled: true };
  const blocked = (why) => ({ show: true, enabled: false, why });
  const anyPrep = o && batchesOf(db, o.no).some((b) => b.status !== "created");
  switch (action) {
    case "create": return role === "cso" ? ok : no;
    case "edit":
      if (role !== "cso") return no;
      if (["cancelled", "closed", "delivered"].includes(o.status)) return blocked("A " + P.STATUS[o.status].toLowerCase() + " job order can't be edited");
      return anyPrep ? blocked("Editing closes once preparation starts") : ok;
    case "cancel":
      if (role !== "cso") return no;
      if (["cancelled", "closed", "delivered", "reported"].includes(o.status)) return blocked("Only open job orders can be cancelled");
      return received(o) ? blocked("Only before any sample is received") : ok;
    case "close":
      if (role !== "cso") return no;
      return o.status === "delivered" ? ok : blocked("Only a delivered job order can be closed");
    case "addBatch": // spec: batch.create is allowed for CSO, Preparation and Lab admin
      if (!["cso", "prep", "lab_admin"].includes(role)) return no;
      if (["cancelled", "closed", "draft"].includes(o.status)) return blocked("Not for a " + P.STATUS[o.status].toLowerCase() + " job order");
      return o.samples.some((s) => !s.batch) ? ok : blocked("Every registered sample is already in a batch");
    case "editSamples":
      if (role !== "cso") return no;
      return ["cancelled", "closed", "delivered"].includes(o.status) ? blocked("Samples are read-only now") : ok;
    case "markSent": return role === "cso" ? ok : no;
    default: return ok;
  }
}

/* ---------- shared bits ---------- */
function Badge({ s, kind }) {
  const label = kind === "batch" ? P.BATCH_STATUS[s] : P.STATUS[s];
  return html`<span class=${"badge b-" + s}>${label}</span>`;
}
function CoaCell({ o }) {
  const c = o.coa;
  if (c.state === "notready") return html`<span class="muted">—</span>`;
  if (c.state === "draft") return html`<span class="sec">Draft</span>`;
  if (c.state === "published") return html`<span class="sec">Published</span>`;
  const last = c.sent[c.sent.length - 1];
  const ch = P.CHANNELS.find((x) => x.id === last.channel);
  return html`<span style=${{ display: "inline-flex", gap: "6px", alignItems: "center", color: "var(--success)", fontWeight: 600 }}><${Icon} n=${ch.icon} />Sent</span>`;
}
function Field({ label, id, error, help, children, style }) {
  return html`<div class="field" style=${style}>
    ${label && html`<label for=${id}>${label}</label>`}
    ${children}
    ${error ? html`<span class="errmsg" id=${id + "-err"}><${Icon} n="warning-circle" />${error}</span>` : help ? html`<span class="help">${help}</span>` : null}
  </div>`;
}
function Avatar({ name, sm }) { return html`<span class=${"av" + (sm ? " sm" : "")}>${initials(name)}</span>`; }

/* ---------- toasts ---------- */
function Toasts() {
  const { toasts, dropToast } = useApp();
  return html`<div class="toasts" role="status" aria-live="polite">
    ${toasts.map((t) => html`<div class="toast" key=${t.id}>
      <${Icon} n=${t.icon || "check-circle"} />
      <span style=${{ flex: 1 }}>${t.text}</span>
      ${t.action && html`<button onClick=${() => { t.action.fn(); dropToast(t.id); }}>${t.action.label}</button>`}
      <button aria-label="Dismiss" onClick=${() => dropToast(t.id)}><${Icon} n="x" /></button>
    </div>`)}
  </div>`;
}

/* Overlays render at the app root, so a dialog or sheet opened inside a card or field still covers the screen. */
function toRoot(node) { const host = document.querySelector(".app"); return host ? ReactDOM.createPortal(node, host) : node; }

/* ---------- dialogs ---------- */
function Dialog({ title, children, actions, onClose }) {
  useEsc(onClose, true);
  const ref = useRef();
  useEffect(() => { const b = ref.current && ref.current.querySelector("textarea,input,button.primary,button.danger"); b && b.focus(); }, []);
  return toRoot(html`<div class="dialog-scrim" onMouseDown=${(e) => e.target === e.currentTarget && onClose()}>
    <div class="dialog" role="dialog" aria-modal="true" aria-label=${title} ref=${ref}>
      <div class="dh"><h3>${title}</h3></div>
      <div class="db">${children}</div>
      <div class="df">${actions}</div>
    </div>
  </div>`);
}
function ConfirmDialog({ d, close }) {
  return html`<${Dialog} title=${d.title} onClose=${close} actions=${html`
    <button class="btn secondary" onClick=${close}>${d.cancelLabel || "Cancel"}</button>
    ${d.alt && html`<button class="btn secondary" onClick=${() => { close(); d.alt.fn(); }}>${d.alt.label}</button>`}
    <button class=${"btn " + (d.danger ? "danger" : "primary")} onClick=${() => { close(); d.onOk(); }}>${d.ok}</button>`}>
    ${d.body && html`<p style=${{ margin: 0 }}>${d.body}</p>`}
  <//>`;
}

/* ---------- review bar, flows ---------- */
const FLOWS = [
  { id: "F1", title: "Create a job order", role: "cso", steps: "New job order → company → contact from the dropdown → template → expected samples → signatory → Submit" },
  { id: "F1a", title: "Save as draft", role: "cso", steps: "New job order → pick a company only → Save as draft → Draft row in the list" },
  { id: "F1b", title: "Validation errors", role: "cso", steps: "New job order → Submit with empty fields → error summary, jump to each field" },
  { id: "F1c", title: "Add a new contact", role: "cso", steps: "Contact person → + Add contact → name and phone → Save (floppy disk)" },
  { id: "F1d", title: "Edit a contact", role: "cso", steps: "Contact person → pencil on Sari Wulandari → change the phone → Save" },
  { id: "F1e", title: "Add a signatory", role: "cso", steps: "Default signatory → + Add signatory → name and title → Save" },
  { id: "F8", title: "Remove a contact", role: "cso", steps: "Contact person → trash on Sari Wulandari → Remove → Undo in the toast" },
  { id: "F10", title: "Pick Ash analysis items", role: "cso", steps: "Parameters → Ash analysis ▸ (9 preset) → search “SO” → tick SO₃ → Apply · 10 parameters" },
  { id: "F11", title: "Coking coal with ASTM + GB/T", role: "cso", steps: "Standard: add GB/T → template Coking coal → G – Index joins" },
  { id: "F2", title: "Register sample IDs", role: "cso", steps: "Samples tab (empty) → Paste from Excel → Use example rows → Add rows → fix the duplicate → Save" },
  { id: "F2b", title: "Locked rows", role: "cso", steps: "JO-2026-0142 → Samples → hover a lock: who received it and when" },
  { id: "F3", title: "Follow progress", role: "cso", steps: "Chip In progress → JO-2026-0142 → stepper, Properties, Batches" },
  { id: "F9", title: "Add a batch", role: "lab_admin", steps: "JO-2026-0137 → Batches (empty) → + Add batch → 8 of 16 samples, ASTM, HGI → Create batch" },
  { id: "F4", title: "Send the CoA", role: "cso", steps: "Chip Reported → JO-2026-0141 → CoA → Mark sent → WhatsApp → Confirm" },
  { id: "F5", title: "Edit, cancel, close", role: "cso", steps: "JO-2026-0138 → ⋯ → Edit or Cancel job order (reason required)" },
  { id: "F6", title: "Read-only visit", role: "prep", steps: "As Preparation → JO-2026-0137 → Samples: no edit controls" },
  { id: "F12", title: "Receive a batch", role: "prep", steps: "JO-2026-0134 → Batches → B-2026-0421 → scan BNM-3301 → tick the rest → masses → one sample Wet with a remark" },
  { id: "F13", title: "Print and reprint labels", role: "prep", steps: "Four samples arrived → Print labels → reprint one with a reason" },
  { id: "F14", title: "Start with fewer samples", role: "prep", steps: "4 of 6 arrived and printed → Confirm reception → confirm “Confirm reception with 4 of 6 samples?” → the 2 others return to the job order as Awaiting arrival" },
  { id: "F15", title: "Hold a sample", role: "prep", steps: "Row menu → Hold → Insufficient material → the checks skip it" },
  { id: "F16", title: "Enter ADL and finish", role: "prep", steps: "B-2026-0419, Preparation tab → ADL for each sample (one above 20 % warns) → Save all → Finish Preparation" },
  { id: "F17", title: "Read-only view of reception", role: "cso", steps: "As CSO → B-2026-0419 → arrival, condition, mass and ADL, no edit controls" },
  { id: "F18", title: "Add late samples to a new batch", role: "prep", steps: "JO-2026-0134 → Batches (amber note: 2 awaiting arrival) → Add batch → the 2 are ticked, settings copied → Create batch" },
  { id: "F19", title: "Mark a sample as not received", role: "cso", steps: "JO-2026-0134 → Samples → Mark as not received on BNM-3305 → reason → Mark → Restore" },
  { id: "F20", title: "Add photos at reception", role: "prep", steps: "B-2026-0421 → Photos on BNM-3301 → Add photo → tag Condition → add another tagged Weighing → close: the count shows in the table" },
  { id: "F21", title: "Change a batch number", role: "lab_admin", steps: "B-2026-0421 → pencil next to the number → type B-2026-0425 → Save (a used number is refused)" },
  { id: "F22", title: "Enter results as Analyst", role: "analyst", steps: "B-2026-0417 → Analysis tab → the remaining samples → one value per parameter (FC is calculated) → Save all → Finish Analysis" },
  { id: "F23", title: "Upload the signed RoA and complete", role: "lab_admin", steps: "B-2026-0417, analysis finished → RoA number and PDF → Complete batch" },
  { id: "F7", title: "Create on a phone", role: "cso", steps: "Phone width → New job order → step 1 → Next → step 2 → Submit" },
];
const SPEC_ONLY = [
  ["Import list", "The import wizard (S-16) is designed later; the button shows a note."],
  ["Search parameters", "Finds any of the ~230 catalogue parameters; not in the prototype."],
  ["Save filter", "Saved filters per user are not in the prototype."],
  ["Download PDF, Print", "Open the real PDF in the app; here they show a note."],
  ["Files and History tabs", "Placeholders; designed in a later round."],
  ["Error and offline states", "Banners with Retry and kept input are specified in the screen plan, not simulated."],
  ["Publish a CoA draft", "Lab admin steps 6–8 belong to the Report review screen."],
  ["Notification and My work queue", "The CSO notification when preparation starts with fewer samples, and the queue “Samples awaiting arrival”, belong to My work (S-19) and the notification list; not in the prototype."],
  ["Analyst worksheet", "Replicates, weighings, calculations, mass after preparation, top size and on-screen review are the next goal; v1 enters one final value per parameter."],
  ["Photos and RoA files", "Files picked in the prototype stay in the page only; they are not saved after a reload. The real app stores them in file storage."],
  ["Batch detail, reception, result entry", "Links lead to “Outside this prototype”."],
];
const NOT_DRAWN = ["Edit job order (the create modal, pre-filled)", "Filters panel and filter sheet", "Add batch on a phone", "Ash analysis checklist on a phone", "Trace elements checklist"];

function ReviewBar({ ui, setUi, onStart, onReset }) {
  const [panel, setPanel] = useState(null);
  const ref = useRef();
  useOutside(ref, () => setPanel(null), !!panel);
  useEsc(() => setPanel(null), !!panel);
  const widths = [["fit", "Fit"], [1440, "Desktop 1440"], [834, "Tablet 834"], [390, "Phone 390"]];
  const roles = [["cso", "CSO"], ["lab_admin", "Lab admin"], ["prep", "Preparation"], ["analyst", "Analyst"]];
  if (ui.barMin) return html`<button class="review-tab" ref=${ref} aria-label="Show review tools" onClick=${() => setUi({ barMin: false })}><${Icon} n="caret-down" /></button>`;
  return html`<div class="review" ref=${ref}>
    <div class="brandline"><span>SGSI Job Orders</span><small>prototype · demo data</small></div>
    <div class="hide-min" style=${{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
      <span class="rlabel">Width</span>
      <div class="seg-r">${widths.map(([v, l]) => html`<button key=${v} aria-pressed=${ui.width === v} onClick=${() => setUi({ width: v })}>${l}</button>`)}</div>
    </div>
    <div class="hide-min" style=${{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
      <span class="rlabel">Role</span>
      <div class="seg-r">${roles.map(([v, l]) => html`<button key=${v} aria-pressed=${ui.role === v} onClick=${() => setUi({ role: v })}>${l}</button>`)}</div>
    </div>
    <div class="hide-min" style=${{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
      <span class="rlabel">Theme</span>
      <div class="seg-r">${[["light", "Light"], ["dark", "Dark"]].map(([v, l]) => html`<button key=${v} aria-pressed=${(ui.theme || "light") === v} onClick=${() => setUi({ theme: v })}>${l}</button>`)}</div>
    </div>
    <span class="grow"></span>
    <button class="rbtn hide-min" onClick=${() => setPanel(panel === "flows" ? null : "flows")}><${Icon} n="flow-arrow" />Flows</button>
    <button class="rbtn hide-min" onClick=${() => setPanel(panel === "spec" ? null : "spec")}><${Icon} n="list-checks" />Spec only</button>
    <button class="rbtn hide-min" onClick=${() => setPanel(panel === "reset" ? null : "reset")}><${Icon} n="arrow-counter-clockwise" />Reset demo</button>
    <button class="rbtn" aria-label="Hide review tools" onClick=${() => { setPanel(null); setUi({ barMin: true }); }}><${Icon} n="caret-up" /></button>
    ${panel === "flows" && html`<div class="panel-r">
      <h2>Flows</h2>
      <p class="lead">Each flow starts from fresh demo data, with the right role and screen. Steps in bold are what to try.</p>
      ${FLOWS.map((f) => html`<div class="flow" key=${f.id}>
        <span class="id">${f.id}</span>
        <div><b>${f.title}</b><span>${f.steps}</span></div>
        <button class="btn primary sm" onClick=${() => { setPanel(null); onStart(f.id); }}><${Icon} n="play" />Start</button>
      </div>`)}
    </div>`}
    ${panel === "spec" && html`<div class="panel-r">
      <h2>Spec only</h2>
      <p class="lead">Rules the prototype does not perform. They are specified in the job order plans.</p>
      <ul class="speclist">${SPEC_ONLY.map(([a, b]) => html`<li key=${a}><b>${a}</b> · ${b}</li>`)}</ul>
      <h2 style=${{ marginTop: "18px", fontSize: "18px" }}>Built here, not drawn yet</h2>
      <p class="lead">Made from existing patterns so the flows are complete. They still need frames in screens.pen.</p>
      <ul class="speclist">${NOT_DRAWN.map((a) => html`<li key=${a}>${a}<span class="tagnd">Not drawn yet</span></li>`)}</ul>
    </div>`}
    ${panel === "reset" && html`<div class="panel-r">
      <h2>Reset the demo?</h2>
      <p class="lead">Job orders, contacts, samples and batches go back to the start state. Your width and role stay.</p>
      <div style=${{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
        <button class="btn secondary" onClick=${() => setPanel(null)}>Keep my changes</button>
        <button class="btn primary" onClick=${() => { setPanel(null); onReset(); }}>Reset demo</button>
      </div>
    </div>`}
  </div>`;
}

/* ---------- shell ---------- */
const NAV = [
  { id: "mywork", label: "My work", icon: "tray" },
  { id: "dashboard", label: "Dashboard", icon: "squares-four" },
  { group: "Work" },
  { id: "jobs", label: "Job orders", icon: "clipboard-text" },
  { id: "batches", label: "Batches", icon: "package" },
  { id: "input", label: "Input ROA", icon: "flask" },
  { id: "review", label: "Review ROA", icon: "check-square-offset" },
  { id: "reports", label: "Reports", icon: "file-text" },
  { id: "search", label: "Search", icon: "magnifying-glass" },
  { group: "Master data" },
  { id: "clients", label: "Clients", icon: "buildings" },
  { id: "drill", label: "Drill hole", icon: "cylinder" },
  { id: "litho", label: "Lithology", icon: "stack" },
  { id: "seam", label: "Seam", icon: "rows" },
  { group: "Admin" },
  { id: "users", label: "Users", icon: "users" },
  { id: "config", label: "Configuration", icon: "gear-six" },
  { id: "audit", label: "Audit log", icon: "clock-counter-clockwise" },
];
function NavList({ rail, onPick }) {
  const { route } = useApp();
  const cur = route.v === "outside" ? route.nav : "jobs";
  return NAV.map((n, i) => n.group
    ? html`<div class="navgroup" key=${"g" + i}><span>${n.group}</span><${Icon} n="caret-down" /></div>`
    : html`<button key=${n.id} class=${"nav" + (cur === n.id ? " on" : "")} title=${rail ? n.label : undefined} aria-current=${cur === n.id ? "page" : undefined} onClick=${() => onPick(n)}><${Icon} n=${n.icon} /><span>${n.label}</span></button>`);
}
function Shell({ children }) {
  const { mode, ui, setUi, go, role } = useApp();
  const [drawer, setDrawer] = useState(false);
  useEsc(() => setDrawer(false), drawer);
  const person = P.PEOPLE[role];
  const pick = (n) => { setDrawer(false); n.id === "jobs" ? go({ v: "list" }) : go({ v: "outside", nav: n.id, label: n.label }); };
  const rail = mode === "tablet" || (mode === "desktop" && ui.collapsed);
  return html`<div class="app-inner" style=${{ display: "contents" }}>
    <header class="topbar">
      ${mode === "mobile" && html`<button class="ib" aria-label="Open menu" onClick=${() => setDrawer(true)}><${Icon} n="list" /></button>`}
      <div class="brand"><span class="logo" role="img" aria-label="SGSI"></span>
        <div><b>SGSI LIMS</b>${mode !== "mobile" && html`<small>Coal laboratory command center</small>`}</div></div>
      <span class="grow"></span>
      ${mode === "desktop" && html`<div class="gsearch"><span>Search job orders, samples, batches…</span><span class="go"><${Icon} n="magnifying-glass" /></span></div>`}
      ${mode !== "desktop" && html`<button class="ib" aria-label="Search"><${Icon} n="magnifying-glass" /></button>`}
      <button class="ib outline" aria-label="Notifications"><${Icon} n="bell" /><span class="dot"></span></button>
      <div class="userchip"><${Avatar} name=${person.name} />${mode === "desktop" && html`<div><b>${person.name}</b><small>${person.title}</small></div>`}</div>
    </header>
    <div class="body">
      ${mode !== "mobile" && html`<nav class=${"side" + (rail ? " rail" : "")} aria-label="Main">
        <${NavList} rail=${rail} onPick=${pick} />
        <span class="grow"></span>
        ${mode === "desktop" && html`<div class="divider"></div>
          <button class="nav" title=${rail ? "Expand" : undefined} onClick=${() => setUi({ collapsed: !ui.collapsed })}><${Icon} n=${rail ? "caret-double-right" : "caret-double-left"} /><span>Collapse</span></button>`}
      </nav>`}
      <main class="main" id="main">${children}</main>
    </div>
    ${drawer && html`<div class="drawer-scrim" onClick=${() => setDrawer(false)}></div>
      <nav class="drawer" aria-label="Main">
        <div class="dhead"><div class="brand"><span class="logo"></span><div><b>SGSI LIMS</b></div></div><button class="ib" aria-label="Close menu" onClick=${() => setDrawer(false)}><${Icon} n="x" /></button></div>
        <${NavList} rail=${false} onPick=${pick} />
      </nav>`}
  </div>`;
}
function Outside() {
  const { route, go } = useApp();
  return html`<div class="card placeholder" style=${{ marginTop: "8px" }}>
    <b>${route.label} is outside this prototype</b>
    <p style=${{ margin: "0 0 16px" }}>This prototype covers the job order module only. ${route.label} has its own frames in screens.pen.</p>
    <button class="btn primary" onClick=${() => go(route.back || { v: "list" })}><${Icon} n="arrow-right" />Back to job orders</button>
  </div>`;
}

/* ---------- list ---------- */
function ListView() {
  const app = useApp();
  const { db, mode, role, ui, setUi, go, open } = app;
  const L = ui.list;
  const setL = (p) => setUi({ list: Object.assign({}, L, p) });
  const [menu, setMenu] = useState(null);
  const [fsheet, setFsheet] = useState(false);
  const searchRef = useRef();
  app.searchRef.current = searchRef;
  useEsc(() => setMenu(null), !!menu);
  const companies = db.companies;
  const base = db.orders.filter((o) => {
    const c = companyOf(db, o);
    const ct = contactOf(db, o);
    const q = L.q.trim().toLowerCase();
    if (q && !(o.no.toLowerCase().includes(q) || c.name.toLowerCase().includes(q) || (o.po || "").toLowerCase().includes(q) || (ct && ct.name.toLowerCase().includes(q)))) return false;
    if (L.company && o.company !== L.company) return false;
    if (L.std && !o.standards.includes(L.std)) return false;
    if (L.due === "week" && !(o.due && o.due >= P.TODAY && o.due <= addDays(P.TODAY, 7))) return false;
    if (L.due === "late" && !isLate(o)) return false;
    return true;
  });
  const counts = { all: base.length };
  Object.keys(P.STATUS).forEach((s) => (counts[s] = base.filter((o) => o.status === s).length));
  let rows = L.status === "all" ? base : base.filter((o) => o.status === L.status);
  const dir = L.sortDir;
  rows = rows.slice().sort((a, b) => {
    let x, y;
    if (L.sort === "no") { x = a.no; y = b.no; }
    else if (L.sort === "status") { x = Object.keys(P.STATUS).indexOf(a.status); y = Object.keys(P.STATUS).indexOf(b.status); }
    else { x = a.due || "9999"; y = b.due || "9999"; }
    return (x < y ? -1 : x > y ? 1 : 0) * dir;
  });
  const per = 10, pages = Math.max(1, Math.ceil(rows.length / per)), page = Math.min(L.page, pages);
  const shown = rows.slice((page - 1) * per, page * per);
  const totalOpen = db.orders.filter((o) => OPEN.includes(o.status)).length;
  const waiting = db.orders.filter((o) => o.status === "awaiting").length;
  const canCreate = perm(db, role, "create").show;
  const sortBtn = (key, label) => html`<button onClick=${() => setL({ sort: key, sortDir: L.sort === key ? -L.sortDir : 1, page: 1 })} aria-label=${"Sort by " + label}>${label}<${Icon} n="arrows-down-up" /></button>`;
  const active = [];
  if (L.company) active.push(["company", companies.find((c) => c.id === L.company).name]);
  if (L.std) active.push(["std", "Standard: " + L.std]);
  if (L.due) active.push(["due", L.due === "week" ? "Due this week" : "Past due"]);
  const cols = mode === "desktop" ? "150px minmax(0,1.6fr) minmax(0,1.1fr) 84px 84px 120px 150px 100px 36px" : "130px minmax(0,1.6fr) 110px 150px 90px 36px";
  const rowMenu = (o) => {
    const e = perm(db, role, "edit", o), c = perm(db, role, "cancel", o);
    return html`<div class="menu" role="menu" onClick=${(ev) => ev.stopPropagation()}>
      <button role="menuitem" onClick=${() => { setMenu(null); go({ v: "detail", no: o.no, tab: "overview" }); }}><${Icon} n="eye" />Open</button>
      ${e.show && e.enabled && html`<button role="menuitem" disabled=${!e.enabled} onClick=${() => { setMenu(null); open({ type: "jobform", mode: "edit", no: o.no }); }}><${Icon} n="pencil-simple" />Edit</button>${!e.enabled && html`<div class="why">${e.why}</div>`}`}
      ${c.show && c.enabled && html`<button role="menuitem" class="dang" disabled=${!c.enabled} onClick=${() => { setMenu(null); open({ type: "cancel", no: o.no }); }}><${Icon} n="prohibit" />Cancel job order</button>${!c.enabled && html`<div class="why">${c.why}</div>`}`}
    </div>`;
  };
  const filterFields = html`
    <${Field} label="Company" id="f-company"><select id="f-company" class="select" value=${L.company} onChange=${(e) => setL({ company: e.target.value, page: 1 })}><option value="">All companies</option>${companies.map((c) => html`<option key=${c.id} value=${c.id}>${c.name}</option>`)}</select><//>
    <${Field} label="Standard" id="f-std"><select id="f-std" class="select" value=${L.std} onChange=${(e) => setL({ std: e.target.value, page: 1 })}><option value="">Any standard</option><option>ASTM</option><option>ISO</option><option>GB/T</option></select><//>
    <${Field} label="Due date" id="f-due"><select id="f-due" class="select" value=${L.due} onChange=${(e) => setL({ due: e.target.value, page: 1 })}><option value="">Any date</option><option value="week">Due this week</option><option value="late">Past due</option></select><//>`;
  return html`<${Fragment}>
    <div class="phead">
      <div><div class="overline">Work · Tuesday 27 October 2026</div><h1 class="h1">Job orders</h1>
        <p class="sub">${db.orders.length} job orders · ${totalOpen} open, ${waiting} waiting for samples</p></div>
      ${canCreate && mode !== "mobile" && html`<button class="btn primary" onClick=${() => open({ type: "jobform", mode: "create" })}><${Icon} n="plus" />New job order</button>`}
    </div>
    <div class="chips" role="group" aria-label="Status">
      ${["all"].concat(Object.keys(P.STATUS)).map((s) => html`<button key=${s} class=${"chip" + (L.status === s ? " on" : "")} aria-pressed=${L.status === s} onClick=${() => setL({ status: s, page: 1 })}>${s === "all" ? "All" : P.STATUS[s]}<span class="cnt">${counts[s]}</span></button>`)}
    </div>
    <div class="filters">
      <div class="search" style=${{ width: mode === "desktop" ? "300px" : "auto", flex: mode === "desktop" ? "none" : 1 }}>
        <${Icon} n="magnifying-glass" />
        <input ref=${searchRef} id="f-q" class="input" placeholder="Job order, company, PO" aria-label="Search job orders" value=${L.q} onInput=${(e) => setL({ q: e.target.value, page: 1 })} />
      </div>
      ${mode === "desktop" && html`<div style=${{ display: "flex", gap: "12px", flex: 1 }}>${filterFields}</div>`}
      ${mode !== "desktop" && html`<button class="btn secondary" onClick=${() => setFsheet(true)}><${Icon} n="funnel" />Filters${active.length ? " · " + active.length : ""}</button>`}
    </div>
    ${active.length > 0 && html`<div class="fchips">${active.map(([k, l]) => html`<span class="fchip" key=${k}>${l}<button class="ib sm" style=${{ width: "22px", height: "22px", fontSize: "12px" }} aria-label=${"Remove filter " + l} onClick=${() => setL({ [k]: "", page: 1 })}><${Icon} n="x" /></button></span>`)}
      <button class="link" style=${{ fontSize: "12px" }} onClick=${() => setL({ company: "", std: "", due: "", q: "", page: 1 })}>Clear filters</button></div>`}
    <div class="card tpanel">
      ${db.orders.length === 0 ? html`<div class="empty"><${Icon} n="clipboard-text" /><b>No job orders yet</b><span>Create the first one when a company sends samples or a request.</span>${canCreate && html`<button class="btn primary" onClick=${() => open({ type: "jobform", mode: "create" })}><${Icon} n="plus" />New job order</button>`}</div>`
      : rows.length === 0 ? html`<div class="empty"><${Icon} n="magnifying-glass" /><b>No job orders match</b><span>${L.q ? "Nothing matches “" + L.q + "” with these filters." : "No job orders with these filters."}</span><button class="btn secondary" onClick=${() => setL({ status: "all", company: "", std: "", due: "", q: "", page: 1 })}>Clear filters</button></div>`
      : mode === "mobile" ? html`<div>${shown.map((o) => {
          const ct = contactOf(db, o);
          return html`<button class="mcard" key=${o.no} onClick=${() => go({ v: "detail", no: o.no, tab: "overview" })}>
            <div class="top"><span class="mono" style=${{ fontWeight: 600, color: "var(--heading)" }}>${o.no}</span><${Badge} s=${o.status} /></div>
            <div style=${{ fontWeight: 600, marginTop: "4px" }}>${companyOf(db, o).name}</div>
            <div class="meta"><span>${o.samples.length} samples · ${paramsLabel(o)}</span><span class=${isLate(o) ? "late" : ""}>${isLate(o) ? html`<${Icon} n="warning" />` : null}Due ${o.due ? fmtDate(o.due).slice(0, -5) : "—"}</span></div>
            ${ct && html`<div class="meta" style=${{ marginTop: "2px" }}><span>Attn. ${ct.name}</span><${CoaCell} o=${o} /></div>`}
          </button>`;
        })}</div>`
      : html`<div role="table" aria-label="Job orders">
        <div class="thead" role="row" style=${{ gridTemplateColumns: cols }}>
          <span>${sortBtn("no", "No.")}</span><span>Company</span>
          ${mode === "desktop" && html`<span>Parameters</span><span>Samples</span><span>Batches</span>`}
          <span>${sortBtn("due", "Due")}</span><span>${sortBtn("status", "Status")}</span><span>CoA</span><span></span>
        </div>
        ${shown.map((o) => {
          const ct = contactOf(db, o), bs = batchesOf(db, o.no);
          return html`<div class="trow" role="row" key=${o.no} style=${{ gridTemplateColumns: cols }} tabIndex="0"
              onClick=${() => go({ v: "detail", no: o.no, tab: "overview" })} onKeyDown=${(e) => e.key === "Enter" && e.target === e.currentTarget && go({ v: "detail", no: o.no, tab: "overview" })}>
            <span class="no">${o.no}</span>
            <span class="cell2"><b>${companyOf(db, o).name}</b><small>${mode === "desktop" ? (ct ? "Attn. " + ct.name : "No contact yet") : o.samples.length + " samples · " + paramsLabel(o)}</small></span>
            ${mode === "desktop" && html`<span class="cell2"><b style=${{ fontWeight: 500 }}>${paramsLabel(o)}</b><small>${o.params.length ? o.params.length + " parameters · " + o.standards.join(" + ") : "Not set"}</small></span>
              <span class="num">${received(o)} / ${o.expected || o.samples.length || "—"}</span>
              <span class="num">${bs.filter((b) => b.roa !== "—").length} / ${bs.length}</span>`}
            <span class=${"num " + (isLate(o) ? "late" : "")}>${isLate(o) ? html`<${Icon} n="warning" />` : null}${fmtDate(o.due)}</span>
            <span><${Badge} s=${o.status} /></span>
            <span><${CoaCell} o=${o} /></span>
            <span style=${{ position: "relative" }}><button class="ib sm" aria-label=${"Actions for " + o.no} aria-haspopup="menu" onClick=${(e) => { e.stopPropagation(); setMenu(menu === o.no ? null : o.no); }}><${Icon} n="dots-three-vertical" /></button></span>
            ${menu === o.no && rowMenu(o)}
          </div>`;
        })}
      </div>`}
      ${rows.length > 0 && html`<div class="tfoot"><span class="muted" style=${{ fontSize: "12px" }}>Showing ${(page - 1) * per + 1}–${Math.min(page * per, rows.length)} of ${rows.length}</span>
        <div class="pager" aria-label="Pages">
          <button aria-label="Previous page" disabled=${page === 1} onClick=${() => setL({ page: page - 1 })}><${Icon} n="caret-left" /></button>
          ${Array.from({ length: pages }, (_, i) => html`<button key=${i} class=${page === i + 1 ? "on" : ""} aria-current=${page === i + 1 ? "page" : undefined} onClick=${() => setL({ page: i + 1 })}>${i + 1}</button>`)}
          <button aria-label="Next page" disabled=${page === pages} onClick=${() => setL({ page: page + 1 })}><${Icon} n="caret-right" /></button>
        </div></div>`}
    </div>
    ${canCreate && mode === "mobile" && html`<div class="sticky-act"><button class="btn primary" onClick=${() => open({ type: "jobform", mode: "create" })}><${Icon} n="plus" />New job order</button></div>`}
    ${fsheet && html`<${Sheet} title="Filters" onClose=${() => setFsheet(false)}>
      <div style=${{ padding: "0 16px", display: "flex", flexDirection: "column", gap: "14px" }}>${filterFields}
        <button class="btn primary" onClick=${() => setFsheet(false)}>Show ${rows.length} job orders</button></div>
    <//>`}
  <//>`;
}

/* ---------- sheet (mobile, tablet filters) ---------- */
function Sheet({ title, onClose, children, right }) {
  useEsc(onClose, true);
  return toRoot(html`<div class="sheet-scrim" onMouseDown=${(e) => e.target === e.currentTarget && onClose()}>
    <div class="sheet" role="dialog" aria-modal="true" aria-label=${title}>
      <div class="handle"></div>
      <div class="shead"><h3>${title}</h3><div style=${{ display: "flex", gap: "4px", alignItems: "center" }}>${right}<button class="ib" aria-label="Close" onClick=${onClose}><${Icon} n="x" /></button></div></div>
      ${children}
    </div>
  </div>`);
}

window.__JO = { html, Icon, useApp, Ctx, useEsc, useOutside, perm, Badge, CoaCell, Field, Avatar, Toasts, Dialog, ConfirmDialog, ReviewBar, Shell, Outside, ListView, Sheet,
  fmtDate, addDays, clone, isLate, companyOf, contactOf, signatoryOf, batchesOf, templateOf, paramsLabel, received, initials, loadSaved, persist, FLOWS };
})();