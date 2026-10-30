/* Part 2: job order form (contact and signatory pickers, parameters, group checklists), detail tabs, dialogs, app root. */
(function () {
const { useState, useEffect, useRef, useMemo, Fragment } = React;
const J = window.__JO;
const { html, Icon, useApp, Ctx, useEsc, useOutside, perm, Badge, Field, Avatar, Toasts, Dialog, ConfirmDialog, ReviewBar, Shell, Outside, ListView, Sheet,
  fmtDate, addDays, clone, isLate, companyOf, contactOf, signatoryOf, batchesOf, templateOf, paramsLabel, received, loadSaved, persist } = J;
const P = window.PROTO;
const TODAY = P.TODAY;
const todayShort = "27 Oct";
const insideOverlay = (t) => t && t.closest && t.closest(".dialog-scrim,.toasts,.review,.panel-r");

/* ========== pickers: contact person, default signatory ========== */
const KINDS = {
  contact: { label: "contact", add: "Add contact", cols: [["name", "Name *"], ["phone", "Phone *"], ["email", "Email (optional)"]], required: ["name", "phone"], newTitle: "New contact" },
  signatory: { label: "signatory", add: "Add signatory", cols: [["name", "Name *"], ["title", "Title *"]], required: ["name", "title"], newTitle: "New signatory" },
};
function validateDraft(kind, d) {
  const e = {};
  if (!d.name.trim()) e.name = "Enter a name";
  if (kind === "contact" && !d.phone.trim()) e.phone = "Enter a phone number";
  if (kind === "contact" && d.email.trim() && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(d.email.trim())) e.email = "Check the email address";
  if (kind === "signatory" && !d.title.trim()) e.title = "Enter the title printed under the name";
  return e;
}
function Picker({ kind, items, selectedId, onSelect, onClose, onSave, onDelete, mobile }) {
  const K = KINDS[kind];
  const [edit, setEdit] = useState(null); // {id|null, draft, err}
  const ref = useRef();
  const firstRef = useRef();
  useEsc(() => (edit ? setEdit(null) : onClose()), true);
  useOutside(ref, () => {}, false);
  useEffect(() => {
    if (mobile) return;
    const h = (e) => { if (ref.current && !ref.current.contains(e.target) && !insideOverlay(e.target) && !e.target.closest(".selbox")) onClose(); };
    const t = setTimeout(() => document.addEventListener("mousedown", h), 0);
    return () => { clearTimeout(t); document.removeEventListener("mousedown", h); };
  }, []);
  useEffect(() => { if (edit && firstRef.current) firstRef.current.focus(); }, [edit && edit.id, !!edit]);
  const blank = kind === "contact" ? { name: "", phone: "", email: "" } : { name: "", title: "" };
  const startAdd = () => setEdit({ id: null, draft: blank, err: {} });
  const startEdit = (it) => setEdit({ id: it.id, draft: Object.assign({}, blank, it), err: {} });
  const setD = (k, v) => setEdit(Object.assign({}, edit, { draft: Object.assign({}, edit.draft, { [k]: v }), err: Object.assign({}, edit.err, { [k]: null }) }));
  const save = () => {
    const err = validateDraft(kind, edit.draft);
    if (Object.keys(err).length) { setEdit(Object.assign({}, edit, { err })); return; }
    const id = onSave(edit.draft, edit.id);
    if (edit.id) setEdit(null); else { onSelect(id); onClose(); }
  };
  const inputFor = (k, label, i) => html`<div class="ein" style=${kind === "contact" ? { width: k === "name" ? "132px" : k === "phone" ? "152px" : undefined, flex: k === "email" ? 1 : "none" } : { width: k === "name" ? "250px" : undefined, flex: k === "title" ? 1 : "none" }}>
    <input ref=${i === 0 ? firstRef : undefined} id=${"pk-" + k} class=${"input" + (edit.err[k] ? " err" : "")} aria-label=${label} placeholder=${k === "email" ? "user@example.com" : k === "phone" ? "+62 8xx xxxx xxxx" : label.replace(" *", "")} value=${edit.draft[k]}
      onInput=${(e) => setD(k, e.target.value)} onKeyDown=${(e) => e.key === "Enter" && save()} />
    ${edit.err[k] && html`<span class="errmsg"><${Icon} n="warning-circle" />${edit.err[k]}</span>`}
  </div>`;
  const editActs = html`<div class="acts">
    <button aria-label=${"Save " + K.label} title="Save" onClick=${save}><${Icon} n="floppy-disk" /></button>
    <button aria-label="Editing" disabled><${Icon} n="pencil-simple" /></button>
    <button class="del" aria-label=${edit && edit.id ? "Discard changes" : "Discard new " + K.label} title="Discard" onClick=${() => setEdit(null)}><${Icon} n="trash" /></button>
  </div>`;
  const second = (it) => kind === "contact" ? [it.phone, it.email || "—"] : [it.title];
  if (mobile) {
    return html`<${Sheet} title=${kind === "contact" ? "Contact person" : "Default signatory"} onClose=${() => (edit ? setEdit(null) : onClose())}>
      <div role="listbox" aria-label=${K.label + " list"}>
        ${items.map((it) => edit && edit.id === it.id ? null : html`<div key=${it.id} class=${"mrow" + (it.id === selectedId ? " sel" : "") + (edit ? " dim" : "")} role="option" aria-selected=${it.id === selectedId}
            onClick=${() => { if (!edit) { onSelect(it.id); onClose(); } }}>
          <div class="info"><b>${it.name}</b><small>${second(it).filter((x) => x && x !== "—").join(" · ")}</small></div>
          <div class="acts">
            ${it.id === selectedId ? html`<button aria-label="Selected" disabled=${!!edit} style=${{ color: edit ? undefined : "var(--brand-text)" }}><${Icon} n="check" /></button>` : html`<span class="blank"></span>`}
            <button aria-label=${"Edit " + it.name} disabled=${!!edit} onClick=${(e) => { e.stopPropagation(); startEdit(it); }}><${Icon} n="pencil-simple" /></button>
            <button class="del" aria-label=${"Remove " + it.name} disabled=${!!edit || it.id === selectedId} title=${it.id === selectedId ? "Choose another " + K.label + " first" : undefined} onClick=${(e) => { e.stopPropagation(); onDelete(it); }}><${Icon} n="trash" /></button>
          </div>
        </div>`)}
        ${edit && html`<div class="medit">
          <div class="eh"><b>${edit.id ? "Edit " + K.label : K.newTitle}</b>
            <button class="ib" aria-label="Save" onClick=${save} style=${{ color: "var(--brand-text)" }}><${Icon} n="floppy-disk" /></button>
            <button class="ib" aria-label="Discard" onClick=${() => setEdit(null)} style=${{ color: "var(--error)" }}><${Icon} n="trash" /></button></div>
          ${K.cols.map(([k, label], i) => html`<${Field} key=${k} label=${label} id=${"pkm-" + k} error=${edit.err[k]}>
            <input ref=${i === 0 ? firstRef : undefined} id=${"pkm-" + k} class=${"input" + (edit.err[k] ? " err" : "")} value=${edit.draft[k]} placeholder=${k === "email" ? "user@example.com" : ""} onInput=${(e) => setD(k, e.target.value)} />
          <//>`)}
        </div>`}
      </div>
      <div style=${{ padding: "4px 8px 0" }}><button class="padd" disabled=${!!edit} onClick=${startAdd}><${Icon} n="plus" />${K.add}</button></div>
    <//>`;
  }
  return html`<div class="pop" ref=${ref} role="dialog" aria-label=${kind === "contact" ? "Contacts of the company" : "Signatories"}>
    <div role="listbox">
      ${items.length === 0 && !edit && html`<div class="muted" style=${{ padding: "14px 16px", fontSize: "13px" }}>No ${K.label}s yet. Add the first one.</div>`}
      ${items.map((it) => {
        if (edit && edit.id === it.id) return html`<div key=${it.id} class="prow edit">${K.cols.map(([k, l], i) => inputFor(k, l, i))}${editActs}</div>`;
        const sel = it.id === selectedId;
        return html`<div key=${it.id} class=${"prow" + (kind === "signatory" ? " sig" : "") + (sel ? " sel" : "") + (edit ? " dim" : "")} role="option" aria-selected=${sel} tabIndex=${edit ? -1 : 0}
            onClick=${() => { if (!edit) { onSelect(it.id); onClose(); } }} onKeyDown=${(e) => { if (!edit && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); onSelect(it.id); onClose(); } }}>
          <span class="c1">${it.name}</span>
          ${kind === "contact" ? html`<span class="c2">${it.phone}</span><span class="c3">${it.email || "—"}</span>` : html`<span class="c3">${it.title}</span>`}
          <div class="acts">
            ${sel ? html`<button aria-label="Selected" tabIndex="-1" style=${{ color: edit ? "var(--border-strong)" : undefined }}><${Icon} n="check" /></button>` : html`<span class="blank"></span>`}
            <button aria-label=${"Edit " + it.name} disabled=${!!edit} onClick=${(e) => { e.stopPropagation(); startEdit(it); }}><${Icon} n="pencil-simple" /></button>
            <button class="del" aria-label=${"Remove " + it.name} disabled=${!!edit || sel} title=${sel ? "Choose another " + K.label + " first" : undefined} onClick=${(e) => { e.stopPropagation(); onDelete(it); }}><${Icon} n="trash" /></button>
          </div>
        </div>`;
      })}
      ${edit && !edit.id && html`<div class="prow edit">${K.cols.map(([k, l], i) => inputFor(k, l, i))}${editActs}</div>`}
    </div>
    <button class="padd" style=${{ marginLeft: "8px" }} disabled=${!!edit} onClick=${startAdd}><${Icon} n="plus" />${K.add}</button>
  </div>`;
}

function PickField({ kind, label, id, value, items, onChange, disabled, disabledText, error, placeholder }) {
  const app = useApp();
  const { db, upd, toast, confirm, mode } = app;
  const [openP, setOpen] = useState(false);
  const cur = items.find((x) => x.id === value);
  const save = (draft, editId) => {
    let newId = editId;
    upd((d) => {
      const list = kind === "contact" ? d.contacts : d.signatories;
      if (editId) Object.assign(list.find((x) => x.id === editId), draft);
      else { newId = (kind === "contact" ? "ct" : "sg") + Date.now(); list.push(Object.assign({ id: newId }, draft, kind === "contact" ? { company: app.formCompany } : {})); }
    });
    toast(editId ? draft.name + " updated" : draft.name + " added to " + (kind === "contact" ? companyOfId(db, app.formCompany) : "signatories"));
    return newId;
  };
  const del = (it) => confirm({
    title: "Remove " + it.name + " from " + (kind === "contact" ? "contacts" : "signatories") + "?",
    body: kind === "contact" ? "Submitted job orders keep this contact's name on their documents." : "Issued CoAs keep this signatory's name.",
    ok: "Remove", danger: true,
    onOk: () => {
      let removed, idx;
      upd((d) => { const list = kind === "contact" ? d.contacts : d.signatories; idx = list.findIndex((x) => x.id === it.id); removed = list.splice(idx, 1)[0]; });
      toast(it.name + " removed", { action: { label: "Undo", fn: () => upd((d) => (kind === "contact" ? d.contacts : d.signatories).splice(idx, 0, removed)) } });
    },
  });
  const mobile = mode === "mobile";
  return html`<div class="field">
    <label id=${id + "-l"} for=${id}>${label}</label>
    <div class="selwrap">
      <button id=${id} type="button" class=${"selbox" + (openP && !mobile ? " open" : "") + (error ? " err" : "")} disabled=${disabled} aria-haspopup="listbox" aria-expanded=${openP} aria-labelledby=${id + "-l " + id}
        onClick=${() => setOpen(!openP)}>
        <span class="v">${disabled ? html`<span class="m">${disabledText}</span>` : cur ? (kind === "contact"
          ? html`<span>${cur.name}</span><span class="m">${cur.phone}</span>${!mobile && cur.email && html`<span class="m">${cur.email}</span>`}`
          : html`<span>${cur.name}</span>${!mobile && html`<span class="m">${cur.title}</span>`}`) : html`<span class="m">${placeholder}</span>`}</span>
        <${Icon} n=${openP && !mobile ? "caret-up" : "caret-down"} />
      </button>
      ${openP && html`<${Picker} kind=${kind} items=${items} selectedId=${value} mobile=${mobile} onSelect=${onChange} onClose=${() => { setOpen(false); setTimeout(() => { const b = document.getElementById(id); b && b.focus(); }, 0); }} onSave=${save} onDelete=${del} />`}
    </div>
    ${error && html`<span class="errmsg"><${Icon} n="warning-circle" />${error}</span>`}
  </div>`;
}
const companyOfId = (db, id) => (db.companies.find((c) => c.id === id) || {}).name || "the company";

/* ========== company combobox ========== */
function CompanySelect({ value, onPick, onNew, error }) {
  const { db } = useApp();
  const cur = db.companies.find((c) => c.id === value);
  const [q, setQ] = useState(cur ? cur.name : "");
  const [openL, setOpen] = useState(false);
  const ref = useRef();
  useOutside(ref, () => setOpen(false), openL);
  useEsc(() => setOpen(false), openL);
  useEffect(() => { setQ(cur ? cur.name : ""); }, [value]);
  const list = db.companies.filter((c) => c.name.toLowerCase().includes(q.trim().toLowerCase()) || (cur && q === cur.name));
  const exact = db.companies.some((c) => c.name.toLowerCase() === q.trim().toLowerCase());
  return html`<div class="field" ref=${ref}>
    <label for="jf-company">Company name *</label>
    <div class="selwrap">
      <input id="jf-company" class=${"input" + (error ? " err" : "")} role="combobox" aria-expanded=${openL} autocomplete="off" placeholder="Search or add a company" value=${q}
        onFocus=${() => setOpen(true)} onInput=${(e) => { setQ(e.target.value); setOpen(true); }} />
      ${openL && html`<div class="pop" role="listbox" style=${{ paddingBottom: "6px" }}>
        ${list.map((c) => html`<div key=${c.id} class=${"prow" + (c.id === value ? " sel" : "")} role="option" aria-selected=${c.id === value} onMouseDown=${(e) => { e.preventDefault(); onPick(c.id); setQ(c.name); setOpen(false); }}>
          <span style=${{ flex: 1, fontWeight: 500 }}>${c.name}</span><span class="muted" style=${{ fontSize: "12px" }}>${db.contacts.filter((x) => x.company === c.id).length} contacts</span>
          ${c.id === value && html`<${Icon} n="check" cls="brandtxt" />`}</div>`)}
        ${q.trim() && !exact && html`<div class="prow" role="option" onMouseDown=${(e) => { e.preventDefault(); onNew(q.trim()); setOpen(false); }}>
          <${Icon} n="plus" /><span style=${{ color: "var(--brand-text)", fontWeight: 600 }}>Add “${q.trim()}” as a new company</span></div>`}
      </div>`}
    </div>
    ${error && html`<span class="errmsg"><${Icon} n="warning-circle" />${error}</span>`}
  </div>`;
}

/* ========== parameters ========== */
function Checklist({ name, selected, onApply, onClose, mobile, style }) {
  const G = P.GROUP_PILLS[name];
  const [sel, setSel] = useState(new Set(selected && selected.length ? selected : G.preset));
  const [q, setQ] = useState("");
  const ref = useRef();
  const all = G.sections.flatMap((s) => s.items);
  useEsc(onClose, true);
  useEffect(() => {
    if (mobile) return;
    const h = (e) => { if (ref.current && !ref.current.contains(e.target) && !insideOverlay(e.target)) onClose(); };
    const t = setTimeout(() => document.addEventListener("mousedown", h), 0);
    return () => { clearTimeout(t); document.removeEventListener("mousedown", h); };
  }, []);
  useEffect(() => { const i = ref.current && ref.current.querySelector("input"); i && i.focus(); }, []);
  const tog = (it) => { const s = new Set(sel); s.has(it) ? s.delete(it) : s.add(it); setSel(s); };
  const norm = (s) => s.toLowerCase().replace(/₂/g, "2").replace(/₃/g, "3").replace(/₄/g, "4").replace(/₅/g, "5");
  const match = (it) => !q.trim() || norm(it).includes(norm(q.trim()));
  const body = html`
    <div class="search"><${Icon} n="magnifying-glass" /><input class="input" aria-label=${"Search " + G.title} placeholder=${name === "Ash analysis" ? "Search oxides, ratios and indices" : "Search elements"} value=${q} onInput=${(e) => setQ(e.target.value)} /></div>
    ${G.sections.map((s) => { const its = s.items.filter(match); return its.length ? html`<div key=${s.label}>
      <p class="sechead" style=${{ marginBottom: "4px" }}>${s.label} · ${s.items.length}</p>
      <div class="cl-grid">${its.map((it) => html`<button key=${it} type="button" class=${"cb" + (sel.has(it) ? " on" : "")} role="checkbox" aria-checked=${sel.has(it)} onClick=${() => tog(it)}><span class="box">${sel.has(it) && html`<${Icon} n="check" />`}</span>${it}</button>`)}</div>
    </div>` : null; })}
    ${!all.some(match) && html`<p class="muted" style=${{ margin: 0, fontSize: "13px" }}>Nothing matches “${q}”.</p>`}
    <div style=${{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
      <button class="link" type="button" onClick=${() => setSel(new Set(all))}>Select all</button>
      <button class="link" type="button" onClick=${() => setSel(new Set())}>Clear</button>
      <span style=${{ flex: 1 }}></span>
      <button class="btn secondary sm" type="button" onClick=${onClose}>Cancel</button>
      <button class="btn primary sm" type="button" onClick=${() => onApply(all.filter((x) => sel.has(x)))}>Apply · ${sel.size} parameters</button>
    </div>`;
  if (mobile) return html`<${Sheet} title=${G.title} onClose=${onClose} right=${html`<span class="muted" style=${{ fontSize: "12px" }}>${sel.size} of ${all.length}</span>`}><div style=${{ padding: "0 16px", display: "flex", flexDirection: "column", gap: "12px" }}>${body}</div><//>`;
  return html`<div class="checklist" ref=${ref} role="dialog" aria-label=${G.title + " checklist"} style=${style}>
    <div style=${{ display: "flex", alignItems: "center", gap: "8px" }}><b style=${{ fontSize: "15px", flex: 1, color: "var(--heading)" }}>${G.title}</b>
      <span class="muted" style=${{ fontSize: "12px" }}>${sel.size} of ${all.length} selected</span>
      <button class="ib sm" aria-label="Close" type="button" onClick=${onClose}><${Icon} n="x" /></button></div>
    ${body}
  </div>`;
}
function applyTemplate(form, t) {
  const gbt = form.standards.includes("GB/T");
  const params = t.params.concat(gbt && t.gbt ? t.gbt : []);
  const groupItems = {};
  params.forEach((p) => { if (P.GROUP_PILLS[p]) groupItems[p] = (form.groupItems[p] && form.groupItems[p].length ? form.groupItems[p] : P.GROUP_PILLS[p].preset).slice(); });
  const f = Object.assign({}, form, { template: t.id, params, groupItems, prep: t.id === "prep" ? true : form.prep });
  if (!form.dueTouched) f.due = addDays(TODAY, t.days);
  return f;
}
function Params({ form, setForm, error }) {
  const { mode, toast } = useApp();
  const [cl, setCl] = useState(null); // {name, style}
  const boxRef = useRef();
  const gbt = form.standards.includes("GB/T");
  const lockedBy = (p) => Object.keys(P.DEPENDS).find((k) => form.params.includes(k) && P.DEPENDS[k].includes(p));
  const toggle = (p) => {
    if (lockedBy(p)) return;
    let params = form.params.slice();
    if (params.includes(p)) params = params.filter((x) => x !== p);
    else { params.push(p); (P.DEPENDS[p] || []).forEach((d) => !params.includes(d) && params.push(d)); }
    setForm(Object.assign({}, form, { params, template: null }));
  };
  const openGroup = (p, ev) => {
    if (mode === "mobile") { setCl({ name: p }); return; }
    const box = boxRef.current.getBoundingClientRect(), r = ev.currentTarget.getBoundingClientRect();
    const zoom = box.width / boxRef.current.offsetWidth || 1;
    const top = (r.bottom - box.top) / zoom + 6;
    const w = Math.min(560, boxRef.current.offsetWidth);
    const left = Math.max(0, Math.min((r.left - box.left) / zoom, boxRef.current.offsetWidth - w));
    setCl({ name: p, style: { top: top + "px", left: left + "px" } });
  };
  const applyGroup = (name, items) => {
    const groupItems = Object.assign({}, form.groupItems, { [name]: items });
    let params = form.params.filter((x) => x !== name);
    if (items.length) params.push(name);
    setForm(Object.assign({}, form, { params, groupItems, template: null }));
    setCl(null);
  };
  const deps = Object.keys(P.DEPENDS).filter((k) => form.params.includes(k));
  return html`<div class="field" ref=${boxRef} style=${{ position: "relative", gap: "10px" }}>
    <div class="phdr"><span class="flabel" id="jf-params-l">Parameters *</span><span class="muted" style=${{ fontSize: "12px" }}>${form.params.length} selected</span></div>
    <div><span class="help">Quick select</span>
      <div class="tmpls" role="group" aria-label="Templates">
        ${P.TEMPLATES.map((t) => html`<button key=${t.id} type="button" class=${"tmpl" + (form.template === t.id ? " on" : "")} aria-pressed=${form.template === t.id} onClick=${() => setForm(applyTemplate(form, t))}>${t.label}</button>`)}
        <button type="button" class="tmpl" onClick=${() => setForm(Object.assign({}, form, { params: [], groupItems: {}, template: null }))}>Clear</button>
      </div></div>
    <div class="pgroups" id="jf-params" tabIndex="-1" aria-labelledby="jf-params-l">
      ${P.PARAM_GROUPS.map((g) => html`<div class="pgroup" key=${g.id}><span class="gl">${g.label}</span><div class="pills">
        ${g.items.map((p) => {
          const on = form.params.includes(p);
          const grp = !!P.GROUP_PILLS[p];
          const lock = on && lockedBy(p);
          const gOnly = P.GBT_ONLY.includes(p) && !gbt;
          const n = grp && on ? (form.groupItems[p] || []).length : 0;
          return html`<button key=${p} type="button" class=${"pill" + (on ? " on" : "") + (lock ? " locked" : "")} aria-pressed=${on} disabled=${gOnly}
              title=${lock ? "Needed for " + lock : gOnly ? "GB/T only: add GB/T under Standard" : grp ? "Choose the items" : undefined}
              aria-haspopup=${grp ? "dialog" : undefined}
              onClick=${(e) => (grp ? openGroup(p, e) : toggle(p))}>
            ${lock ? html`<${Icon} n="lock-simple" />` : on ? html`<${Icon} n="check" />` : null}${p}${grp && n ? " · " + n : ""}
            ${P.SUBCONTRACTED.includes(p) && html`<span class="gtag">SUB</span>`}${P.GBT_ONLY.includes(p) && html`<span class="gtag">GB/T</span>`}
            ${grp && html`<${Icon} n="caret-right" />`}
          </button>`;
        })}
      </div></div>`)}
    </div>
    ${deps.length > 0 && html`<p class="autonote" style=${{ margin: 0 }}>${deps.map((k) => k + " needs " + P.DEPENDS[k].join(", ")).join(" · ")}, so those stay on.</p>`}
    <div><button type="button" class="btn ghost sm" onClick=${() => toast("Search parameters finds any catalogue parameter. It is specified, not built in the prototype.", { icon: "info" })}><${Icon} n="magnifying-glass" />Search parameters</button></div>
    ${error && html`<span class="errmsg" id="jf-params-err"><${Icon} n="warning-circle" />${error}</span>`}
    ${cl && html`<${Checklist} name=${cl.name} selected=${form.groupItems[cl.name]} mobile=${mode === "mobile"} style=${cl.style} onClose=${() => setCl(null)} onApply=${(items) => applyGroup(cl.name, items)} />`}
  </div>`;
}

/* ========== job order form (create, edit; modal or two-step on phones) ========== */
function blankForm(preset) {
  const f = { company: null, address: "", po: "", contact: null, standards: ["ASTM"], prep: true, template: "basic", params: [], groupItems: {}, sampleType: "Exploration cores", expected: "", due: addDays(TODAY, 5), dueTouched: false, priority: "Standard", signatory: null, samplesNow: "now", notes: "", files: [] };
  Object.assign(f, applyTemplate(f, P.TEMPLATES[0]), { dueTouched: false });
  return Object.assign(f, preset || {});
}
function formFromOrder(db, o) {
  return { company: o.company, address: companyOf(db, o).address, po: o.po, contact: o.contact, standards: o.standards.slice(), prep: o.prep, template: o.template, params: o.params.slice(), groupItems: clone(o.groupItems), sampleType: o.sampleType, expected: o.expected || "", due: o.due, dueTouched: true, priority: o.priority, signatory: o.signatory, samplesNow: "later", notes: o.notes, files: [] };
}
function checkForm(f, draft) {
  const e = {};
  if (!f.company) e.company = "Choose or add a company";
  if (draft) return e;
  if (!f.contact) e.contact = "Choose a contact for this job order";
  if (!f.params.length && f.template !== "prep") e.params = "Pick at least one parameter or a template";
  if (!f.expected || Number(f.expected) < 1) e.expected = "Enter the expected number of samples";
  if (!f.due) e.due = "Enter a due date";
  return e;
}
const ERR_ORDER = [["company", "jf-company", "Company name"], ["contact", "jf-contact", "Contact person"], ["params", "jf-params", "Parameters"], ["expected", "jf-expected", "Expected samples"], ["due", "jf-due", "Due date"]];

function JobForm({ layer }) {
  const app = useApp();
  const { db, upd, closeLayer, toast, go, mode, confirm, role } = app;
  const editing = layer.mode === "edit";
  const order = editing ? db.orders.find((o) => o.no === layer.no) : null;
  const [form, setFormRaw] = useState(() => (editing ? formFromOrder(db, order) : blankForm(layer.preset)));
  const [errors, setErrors] = useState({});
  const [tried, setTried] = useState(false);
  const [step, setStep] = useState(1);
  const dirty = useRef(false);
  const sumRef = useRef();
  app.formCompany = form.company;
  const setForm = (f) => { dirty.current = true; setFormRaw(f); if (tried) setErrors(checkForm(f)); };
  const set = (p) => setForm(Object.assign({}, form, p));
  const tryClose = () => {
    if (!dirty.current) return closeLayer();
    confirm({ title: editing ? "Discard your changes?" : "Discard this job order?", body: editing ? "The changes you made are not saved." : "The job order you started is not saved.", ok: "Discard", danger: true, cancelLabel: "Keep editing", onOk: closeLayer });
  };
  useEsc(tryClose, true);
  const setCompany = (id) => { const c = db.companies.find((x) => x.id === id); set({ company: id, address: c.address, contact: null }); };
  const newCompany = (name) => {
    const id = "co" + Date.now();
    upd((d) => d.companies.push({ id, name, address: "", prefix: name.replace(/^(PT|CV)\s+/i, "").slice(0, 3).toUpperCase() }));
    setForm(Object.assign({}, form, { company: id, address: "", contact: null }));
    toast(name + " will be saved as a new company", { icon: "buildings" });
  };
  const toggleStd = (s) => {
    let st = form.standards.includes(s) ? form.standards.filter((x) => x !== s) : form.standards.concat(s);
    if (!st.length) return;
    let params = form.params;
    if (!st.includes("GB/T")) params = params.filter((p) => !P.GBT_ONLY.includes(p));
    else if (form.template === "coking") params = params.concat(P.GBT_ONLY.filter((p) => !params.includes(p)));
    set({ standards: st, params });
  };
  const focusErr = (errs) => {
    const first = ERR_ORDER.find(([k]) => errs[k]);
    setTimeout(() => { if (sumRef.current) sumRef.current.focus(); else if (first) { const el = document.getElementById(first[1]); el && el.focus(); } }, 0);
  };
  const submit = (asDraft) => {
    const errs = checkForm(form, asDraft);
    setTried(!asDraft); setErrors(errs);
    if (Object.keys(errs).length) { focusErr(errs); if (mode === "mobile" && ERR_ORDER.some(([k]) => errs[k])) setStep(1); return; }
    if (editing) {
      upd((d) => { const o = d.orders.find((x) => x.no === order.no);
        Object.assign(o, { company: form.company, contact: form.contact, po: form.po, standards: form.standards, prep: form.prep, template: form.template, params: form.params, groupItems: form.groupItems, sampleType: form.sampleType, expected: Number(form.expected) || null, due: form.due, priority: form.priority, signatory: form.signatory, notes: form.notes });
        const c = d.companies.find((x) => x.id === form.company); if (c && form.address) c.address = form.address; });
      closeLayer(); toast(order.no + " updated"); return;
    }
    const no = "JO-2026-0" + db.nextNo;
    upd((d) => {
      d.nextNo += 1;
      const c = d.companies.find((x) => x.id === form.company); if (c && form.address) c.address = form.address;
      d.orders.unshift({ no, company: form.company, contact: form.contact, po: form.po, standards: form.standards, template: form.template, params: form.params, groupItems: form.groupItems, sampleType: form.sampleType, expected: Number(form.expected) || null, due: asDraft ? form.due : form.due, priority: form.priority, signatory: form.signatory, prep: form.prep, status: asDraft ? "draft" : "awaiting", created: "27 Oct 2026", createdBy: P.PEOPLE[role].name, notes: form.notes, samples: [], coa: { state: "notready" }, files: form.files.length });
    });
    closeLayer();
    if (asDraft) { toast(no + " saved as a draft"); go({ v: "list" }); return; }
    toast(no + " submitted · Add samples", { action: form.samplesNow === "now" ? null : { label: "Add samples", fn: () => go({ v: "detail", no, tab: "samples" }) } });
    go({ v: "detail", no, tab: form.samplesNow === "now" ? "samples" : "overview" });
  };
  const nErr = Object.keys(errors).length;
  const contacts = db.contacts.filter((c) => c.company === form.company);
  const summary = tried && nErr > 0 && html`<div class="errsum" tabIndex="-1" ref=${sumRef} role="alert">
    <b>Fix ${nErr} field${nErr > 1 ? "s" : ""} to submit</b>
    ${ERR_ORDER.filter(([k]) => errors[k]).map(([k, id, l]) => html`<button key=${k} type="button" onClick=${() => { if (mode === "mobile") setStep(1); setTimeout(() => { const el = document.getElementById(id); el && el.focus(); }, 0); }}>${l}</button>`)}
  </div>`;
  const company = html`<p class="sechead">Company</p>
    <div class="row2"><${CompanySelect} value=${form.company} onPick=${setCompany} onNew=${newCompany} error=${errors.company} />
      <${Field} label="Client reference / PO" id="jf-po"><input id="jf-po" class="input" value=${form.po} placeholder="PO 4500-0000" onInput=${(e) => set({ po: e.target.value })} /><//></div>
    <${Field} label="Company address (optional)" id="jf-address"><input id="jf-address" class="input" value=${form.address} onInput=${(e) => set({ address: e.target.value })} /><//>
    <${PickField} kind="contact" label="Contact person *" id="jf-contact" value=${form.contact} items=${contacts} onChange=${(id) => set({ contact: id })} disabled=${!form.company} disabledText="Select a company first" placeholder="Select a contact" error=${errors.contact} />`;
  const work = html`<p class="sechead">Work</p>
    <div class="field"><span class="flabel">Standard *</span>
      <div class="tchips" role="group" aria-label="Standard">${["ASTM", "ISO", "GB/T"].map((s) => { const on = form.standards.includes(s); const last = on && form.standards.length === 1;
        return html`<button key=${s} type="button" class=${"tchip" + (on ? " on" : "")} aria-pressed=${on} title=${last ? "At least one standard stays on" : undefined} onClick=${() => toggleStd(s)}>${on && html`<${Icon} n="check" />`}${s}</button>`; })}</div></div>
    <div class="switchrow"><button type="button" class="switch" role="switch" aria-checked=${form.prep} aria-label="Sample preparation by the lab" onClick=${() => set({ prep: !form.prep })}></button>
      <div><b>Sample preparation by the lab</b><small>Weights, drying and crushing are logged by the Preparation team</small></div></div>
    <${Params} form=${form} setForm=${setForm} error=${errors.params} />
    <div class="row2">
      <${Field} label="Sample type" id="jf-type"><select id="jf-type" class="select" value=${form.sampleType} onChange=${(e) => set({ sampleType: e.target.value })}><option>Exploration cores</option><option>Shipment</option><option>Stockpile</option><option>Other</option></select><//>
      <${Field} label="Expected samples *" id="jf-expected" error=${errors.expected}><input id="jf-expected" type="number" min="1" inputmode="numeric" class=${"input" + (errors.expected ? " err" : "")} value=${form.expected} placeholder="12" onInput=${(e) => set({ expected: e.target.value })} /><//>
    </div>
    <div class="row2">
      <${Field} label="Due date *" id="jf-due" error=${errors.due} help=${!form.dueTouched && form.due ? "Suggested from the turnaround of the parameters" : null}><input id="jf-due" type="date" class=${"input" + (errors.due ? " err" : "")} value=${form.due} onInput=${(e) => set({ due: e.target.value, dueTouched: true })} /><//>
      <${Field} label="Priority" id="jf-priority"><select id="jf-priority" class="select" value=${form.priority} onChange=${(e) => set({ priority: e.target.value })}><option>Standard</option><option>Urgent</option></select><//>
    </div>`;
  const report = html`<p class="sechead">Report</p>
    <${PickField} kind="signatory" label="Default signatory (optional)" id="jf-signatory" value=${form.signatory} items=${db.signatories} onChange=${(id) => set({ signatory: id })} placeholder="Select a signatory" />`;
  const samples = !editing && html`<p class="sechead">Samples</p>
    <div class="field"><div class="segc" role="group" aria-label="When to add sample IDs">
      <button type="button" aria-pressed=${form.samplesNow === "now"} onClick=${() => set({ samplesNow: "now" })}>Add samples now</button>
      <button type="button" aria-pressed=${form.samplesNow === "later"} onClick=${() => set({ samplesNow: "later" })}>Later</button></div>
      <span class="help">${form.samplesNow === "now" ? "The Samples tab opens after you submit." : "You can add sample IDs from the job order at any time."}</span></div>`;
  const notes = html`<p class="sechead">Notes and files</p>
    <${Field} label="Notes" id="jf-notes"><textarea id="jf-notes" class="input" value=${form.notes} placeholder="Anything the lab should know" onInput=${(e) => set({ notes: e.target.value })}></textarea><//>
    <label class="drop"><input type="file" multiple class="vh" onChange=${(e) => set({ files: form.files.concat(Array.from(e.target.files).map((f) => f.name)) })} />
      <${Icon} n="upload-simple" /> Drop the quote, PO or client letter here, or <span class="link">browse</span></label>
    ${form.files.length > 0 && html`<div class="files">${form.files.map((f, i) => html`<span class="fchip" key=${i}><${Icon} n="paperclip" />${f}</span>`)}</div>`}`;
  const title = editing ? "Edit " + order.no : "New job order";
  const subtitle = editing ? companyOf(db, order).name : "Enter the company's request. Sample IDs come next.";
  if (mode === "mobile") {
    const next = () => { const errs = checkForm(form); delete errs.due; const s1 = {}; ["company", "contact", "params", "expected", "due"].forEach((k) => errs[k] && (s1[k] = errs[k])); if (Object.keys(s1).length) { setTried(true); setErrors(s1); focusErr(s1); return; } setStep(2); document.querySelector(".full .fbody") && (document.querySelector(".full .fbody").scrollTop = 0); };
    return html`<div class="full" role="dialog" aria-modal="true" aria-label=${title}>
      <div class="fhead"><div class="t"><button class="ib" aria-label="Close" onClick=${tryClose}><${Icon} n="x" /></button><h2>${title}</h2><span class="muted" style=${{ fontSize: "12px" }}>Step ${step} of 2</span></div>
        <div class="progress2"><i class="on"></i><i class=${step === 2 ? "on" : ""}></i></div></div>
      <div class="fbody">${summary}${step === 1 ? html`${company}${work}` : html`${report}${samples}${notes}`}</div>
      <div class="ffoot">${step === 1
        ? html`<button class="btn secondary" onClick=${() => submit(true)}>Save as draft</button><button class="btn primary" onClick=${next}>Next<${Icon} n="arrow-right" /></button>`
        : html`<button class="btn secondary" onClick=${() => setStep(1)}>Back</button><button class="btn primary" onClick=${() => submit(false)}>${editing ? "Save changes" : "Submit"}</button>`}</div>
    </div>`;
  }
  return html`<div class="scrim" onMouseDown=${(e) => e.target === e.currentTarget && tryClose()}>
    <div class="modal" role="dialog" aria-modal="true" aria-labelledby="jf-title">
      <div class="mhead"><div><h2 id="jf-title">${title}</h2><p>${subtitle}</p></div><button class="ib" aria-label="Close" onClick=${tryClose}><${Icon} n="x" /></button></div>
      <div class="mbody">${summary}${company}${work}${report}${samples}${notes}</div>
      <div class="mfoot"><button class="btn secondary" onClick=${tryClose}>Cancel</button>
        ${!editing && html`<button class="btn secondary" onClick=${() => submit(true)}>Save as draft</button>`}
        <button class="btn primary" onClick=${() => submit(false)}>${editing ? "Save changes" : "Submit"}</button></div>
    </div>
  </div>`;
}

/* ========== detail ========== */
function stepOf(o) { return { draft: 0, awaiting: 1, progress: 2, reported: 5, delivered: 6, closed: 6, cancelled: -1 }[o.status]; }
function stepDates(db, o) {
  const bs = batchesOf(db, o.no);
  const rec = o.samples.find((s) => s.received);
  return [o.created.replace(/ 2026$/, ""), rec ? rec.received.at.split(",")[0].replace(/ 2026$/, "") : "", bs[0] && bs[0].analysis ? bs[0].analysis.at.replace(/^(started|done) /, "").split(",")[0] : "",
    o.coa.published ? o.coa.published.replace(/ 2026$/, "") : "", o.coa.published ? o.coa.published.replace(/ 2026$/, "") : "", o.coa.sent ? o.coa.sent[0].date : ""];
}
function Stepper({ o }) {
  const { db, mode } = useApp();
  const cur = stepOf(o), dates = stepDates(db, o);
  if (cur < 0) return html`<div class="note" style=${{ margin: 0 }}><${Icon} n="prohibit" />Cancelled${o.cancelReason ? ": " + o.cancelReason : ""}</div>`;
  const st = (i) => (i < cur ? "done" : i === cur ? "cur" : "");
  if (mode === "mobile") return html`<div class="vstepper" aria-label="Progress">${P.STEPS.map((s, i) => html`<div key=${s} class=${"vstep " + st(i)} aria-current=${i === cur ? "step" : undefined}>
    <span class="mk">${i < cur && html`<${Icon} n="check" />`}</span><div><b>${s}</b>${i < cur && dates[i] && html`<small>${dates[i]}</small>`}${i === cur && html`<small>Current</small>`}</div></div>`)}</div>`;
  return html`<div class="stepper" role="list" aria-label="Progress">${P.STEPS.map((s, i) => html`<div key=${s} role="listitem" class=${"step " + st(i)} aria-current=${i === cur ? "step" : undefined} aria-label=${"Step " + (i + 1) + " of 6, " + s + (i === cur ? ", current" : i < cur ? ", done" : "")}>
    <span class="mk">${i < cur && html`<${Icon} n="check" />`}</span><b>${s}</b><small>${i < cur ? dates[i] || "Done" : i === cur ? "Current" : " "}</small></div>`)}</div>`;
}
function DetailView() {
  const app = useApp();
  const { db, route, go, role, mode, open, guard } = app;
  const o = db.orders.find((x) => x.no === route.no);
  const [menu, setMenu] = useState(false);
  const mref = useRef();
  useOutside(mref, () => setMenu(false), menu);
  useEsc(() => setMenu(false), menu);
  if (!o) return html`<div class="card placeholder"><b>Job order not found</b><button class="btn primary" onClick=${() => go({ v: "list" })}>Back to job orders</button></div>`;
  const ct = contactOf(db, o), bs = batchesOf(db, o.no);
  const tab = route.tab || "overview";
  const setTab = (t) => guard(() => go({ v: "detail", no: o.no, tab: t }));
  const pe = perm(db, role, "edit", o), pc = perm(db, role, "cancel", o), pcl = perm(db, role, "close", o), pb = perm(db, role, "addBatch", o);
  const tabs = [["overview", "Overview"], ["batches", "Batches", bs.length], ["samples", "Samples", o.samples.length], ["files", "Files", o.files], ["coa", "CoA"], ["history", "History"]];
  // Add batch lives only in the Batches tab. The header offers Add samples while a job order has none.
  const primary = role === "cso" && o.status === "awaiting" && !o.samples.length && mode !== "mobile" ? html`<button class="btn primary" onClick=${() => setTab("samples")}><${Icon} n="plus" />Add samples</button>` : null;
  return html`<${Fragment}>
    <div class="crumb"><button onClick=${() => guard(() => go({ v: "list" }))}>Job orders</button><${Icon} n="caret-right" /><span class="mono">${o.no}</span></div>
    <div class="dhead">
      <div style=${{ minWidth: 0 }}><div class="dtitle"><h1 class="mono" style=${{ fontFamily: "var(--f-display)" }}>${o.no}</h1><${Badge} s=${o.status} /></div>
        <div class="dmeta">${companyOf(db, o).name}${ct ? " · Attn. " + ct.name : ""}${o.po ? " · " + o.po : ""} · Due ${fmtDate(o.due)}${isLate(o) ? " (past due)" : ""}</div></div>
      <div class="dactions" ref=${mref}>${primary}
        <button class="ib outline" aria-label="More actions" aria-haspopup="menu" aria-expanded=${menu} onClick=${() => setMenu(!menu)}><${Icon} n="dots-three" /></button>
        ${menu && html`<div class="menu" role="menu" style=${{ top: "48px", right: 0 }}>
          ${pe.show && html`<button role="menuitem" disabled=${!pe.enabled} onClick=${() => { setMenu(false); open({ type: "jobform", mode: "edit", no: o.no }); }}><${Icon} n="pencil-simple" />Edit</button>${!pe.enabled && html`<div class="why">${pe.why}</div>`}`}
          ${pc.show && html`<button role="menuitem" class="dang" disabled=${!pc.enabled} onClick=${() => { setMenu(false); open({ type: "cancel", no: o.no }); }}><${Icon} n="prohibit" />Cancel job order</button>${!pc.enabled && html`<div class="why">${pc.why}</div>`}`}
          ${pcl.show && html`<button role="menuitem" disabled=${!pcl.enabled} onClick=${() => { setMenu(false); open({ type: "close", no: o.no }); }}><${Icon} n="archive" />Close job order</button>${!pcl.enabled && html`<div class="why">${pcl.why}</div>`}`}
          <button role="menuitem" onClick=${() => { setMenu(false); app.toast("Link copied: " + o.no, { icon: "link-simple" }); }}><${Icon} n="link-simple" />Copy link</button>
        </div>`}
      </div>
    </div>
    <${Stepper} o=${o} />
    <div class="tabs" role="tablist">${tabs.map(([k, l, n]) => html`<button key=${k} role="tab" aria-selected=${tab === k} class=${"tab" + (tab === k ? " on" : "")} onClick=${() => setTab(k)}>${l}${n != null && html`<span class="cnt">${n}</span>`}</button>`)}</div>
    ${tab === "overview" && html`<${Overview} o=${o} />`}
    ${tab === "batches" && html`<${BatchesTab} o=${o} />`}
    ${tab === "samples" && html`<${SamplesTab} o=${o} />`}
    ${tab === "coa" && html`<${CoaTab} o=${o} />`}
    ${(tab === "files" || tab === "history") && html`<div class="card placeholder"><b>${tab === "files" ? "Files" : "History"}</b><span>Designed in a later round. ${tab === "files" ? o.files + " file" + (o.files === 1 ? "" : "s") + " attached in the demo data." : "It will list every change with who and when."}</span></div>`}
  <//>`;
}
function Overview({ o }) {
  const { db, role, open, go } = useApp();
  const c = companyOf(db, o), ct = contactOf(db, o), sg = signatoryOf(db, o), bs = batchesOf(db, o.no);
  const pe = perm(db, role, "edit", o);
  const extra = Object.keys(o.groupItems || {}).map((k) => k + ": " + o.groupItems[k].length + " items");
  return html`<div class="grid2">
    <section class="card" aria-label="Properties">
      <div class="cardhead"><h2>Properties</h2>${pe.show && html`<button class="btn ghost sm" disabled=${!pe.enabled} title=${pe.why} onClick=${() => open({ type: "jobform", mode: "edit", no: o.no })}><${Icon} n="pencil-simple" />Edit</button>`}</div>
      <dl class="props">
        <dt>Company</dt><dd>${c.name}</dd>
        <dt>Address</dt><dd>${c.address || "—"}</dd>
        <dt>Contact</dt><dd>${ct ? html`${ct.name}<br /><span class="muted">${ct.phone}${ct.email ? " · " + ct.email : ""}</span>` : "—"}</dd>
        <dt>Client reference</dt><dd>${o.po || "—"}</dd>
        <dt>Parameters</dt><dd>${paramsLabel(o)}${o.params.length ? " · " + o.params.length + " parameters" : ""}
          ${o.params.length > 0 && html`<div class="minipills">${o.params.map((p) => html`<span class="minipill" key=${p}>${p}${o.groupItems && o.groupItems[p] ? " · " + o.groupItems[p].length : ""}</span>`)}</div>`}</dd>
        <dt>Standard</dt><dd>${o.standards.join(" + ")}</dd>
        <dt>Preparation</dt><dd>${o.prep ? "By the lab (Preparation team)" : "Prepared by the client"}</dd>
        <dt>Expected samples</dt><dd>${o.expected ? o.expected + " · " + o.sampleType : "—"}</dd>
        <dt>Priority</dt><dd>${o.priority}</dd>
        <dt>Due date</dt><dd class=${isLate(o) ? "late" : ""}>${fmtDate(o.due)}</dd>
        <dt>Default signatory</dt><dd>${sg ? sg.name + " · " + sg.title : "—"}</dd>
        <dt>Created by</dt><dd>${o.createdBy} · ${o.created}</dd>
        <dt>Notes</dt><dd>${o.notes || "—"}</dd>
      </dl>
    </section>
    <div style=${{ display: "flex", flexDirection: "column", gap: "20px", minWidth: 0 }}>
      <section class="card" aria-label="Batches">
        <div class="cardhead"><h2>Batches</h2><span class="muted" style=${{ fontSize: "12px" }}>${bs.length} batch${bs.length === 1 ? "" : "es"} · ${o.samples.length} samples</span></div>
        ${bs.length === 0 ? html`<p class="muted" style=${{ padding: "0 20px 18px", margin: 0, fontSize: "13px" }}>No batches yet. The lab admin groups registered samples into batches.</p>`
        : bs.map((b) => html`<button key=${b.no} class="brow" onClick=${() => go({ v: "outside", nav: "batches", label: "Batch " + b.no, back: { v: "detail", no: o.no, tab: "overview" } })}>
          <div class="t"><span class="mono" style=${{ fontWeight: 600, color: "var(--heading)" }}>${b.no}</span><${Badge} s=${b.status} kind="batch" /><span class="tag">${b.standard}</span><span class="muted" style=${{ marginLeft: "auto", fontSize: "12px" }}>${b.samples} samples · RoA ${b.roa}</span></div>
          ${b.prep && html`<div class="perf"><${Avatar} name=${b.prep.by} sm /><span>Prep: ${b.prep.by} · ${b.prep.at}</span></div>`}
          ${b.analysis && html`<div class="perf"><${Avatar} name=${b.analysis.by} sm /><span>Analysis: ${b.analysis.by} · ${b.analysis.at}</span></div>`}
        </button>`)}
      </section>
      <section class="card" aria-label="Certificate of Analysis">
        <div class="cardhead"><h2>Certificate of Analysis</h2>${o.coa.state !== "notready" && html`<span class=${"badge " + (o.coa.state === "sent" ? "b-delivered" : "b-reported")}>${o.coa.state === "sent" ? "Sent" : "Published"}</span>`}</div>
        <p class="sec" style=${{ padding: "0 20px", margin: "0 0 14px", fontSize: "13px" }}>${o.coa.state === "notready" ? "The CoA can be generated once every batch has an approved RoA." : o.coa.number + " · published " + o.coa.published + " by " + o.coa.by}</p>
        <div style=${{ padding: "0 20px 18px" }}><button class="btn secondary sm" onClick=${() => go({ v: "detail", no: o.no, tab: "coa" })}>Open the CoA tab<${Icon} n="arrow-right" /></button></div>
      </section>
    </div>
  </div>`;
}

/* batches */
function BatchesTab({ o }) {
  const { db, role, open, go, mode } = useApp();
  const bs = batchesOf(db, o.no);
  const pb = perm(db, role, "addBatch", o);
  const unb = o.samples.filter((s) => !s.batch).length;
  const cols = mode === "desktop" ? "130px 90px 80px minmax(0,1.3fr) 140px minmax(0,1.6fr) 80px 110px 36px" : "130px 80px 80px 140px 110px 36px";
  const toBatch = (b) => go({ v: "outside", nav: "batches", label: "Batch " + b.no, back: { v: "detail", no: o.no, tab: "batches" } });
  return html`<section class="card" aria-label="Batches">
    <div class="cardhead"><div><h2>Batches</h2><span class="muted" style=${{ fontSize: "12px" }}>${bs.length} batch${bs.length === 1 ? "" : "es"} · ${o.samples.length} samples registered</span></div>
      ${pb.show && html`<button class="btn secondary" disabled=${!pb.enabled} title=${pb.why} onClick=${() => open({ type: "addbatch", no: o.no })}><${Icon} n="plus" />Add batch</button>`}</div>
    ${o.samples.length > 0 && html`<div class=${"note " + (unb ? "" : "ok")}><${Icon} n=${unb ? "info" : "check-circle"} />${unb ? unb + " of " + o.samples.length + " registered samples are not in a batch yet" : "All " + o.samples.length + " samples are in a batch"}</div>`}
    ${bs.length === 0 ? html`<div class="empty"><${Icon} n="package" /><b>No batches yet</b><span>${o.samples.length ? "Use Add batch above to group the registered samples and start preparation." : "Register sample IDs first; batches are made from them."}</span></div>`
    : mode === "mobile" ? html`<div>${bs.map((b) => html`<button key=${b.no} class="mcard" onClick=${() => toBatch(b)}>
        <div class="top"><span class="mono" style=${{ fontWeight: 600, color: "var(--heading)" }}>${b.no}</span><${Badge} s=${b.status} kind="batch" /></div>
        <div class="meta"><span><span class="tag">${b.standard}</span> ${b.samples} samples</span><span>Due ${b.deadline.replace(/ 2026$/, "")}</span></div></button>`)}</div>`
    : html`<div style=${{ padding: "0 8px 8px" }}>
      <div class="thead" style=${{ gridTemplateColumns: cols }}><span>Batch no.</span><span>Standard</span><span>Samples</span>${mode === "desktop" && html`<span>Parameters</span>`}<span>Status</span>${mode === "desktop" && html`<span>Prep and analysis</span><span>RoA</span>`}<span>Deadline</span><span></span></div>
      ${bs.map((b) => html`<div key=${b.no} class="trow" style=${{ gridTemplateColumns: cols }} tabIndex="0" onClick=${() => toBatch(b)} onKeyDown=${(e) => e.key === "Enter" && toBatch(b)}>
        <span class="cell2"><b class="mono">${b.no}</b><small>${b.date}</small></span><span><span class="tag">${b.standard}</span></span><span class="num">${b.samples}</span>
        ${mode === "desktop" && html`<span class="cell2"><b style=${{ fontWeight: 500 }}>${templateOf(o.template) ? templateOf(o.template).label : b.params.length + " parameters"}</b><small>${b.extra.length ? "+ " + b.extra.join(", ") + " compared with the job order" : "Same as the job order"}</small></span>`}
        <span><${Badge} s=${b.status} kind="batch" /></span>
        ${mode === "desktop" && html`<span style=${{ fontSize: "12px" }}>${b.prep ? html`<div class="perf" style=${{ marginTop: 0 }}><${Avatar} name=${b.prep.by} sm />Prep: ${b.prep.by.split(" ")[0]} · ${b.prep.at}</div>` : html`<span class="muted">Not started</span>`}
          ${b.analysis && html`<div class="perf"><${Avatar} name=${b.analysis.by} sm />Analysis: ${b.analysis.by.split(" ")[0]} · ${b.analysis.at}</div>`}</span><span class="mono" style=${{ fontSize: "12px" }}>${b.roa}</span>`}
        <span class="num">${b.deadline.replace(/ 2026$/, "")}</span><span><${Icon} n="caret-right" cls="muted" /></span>
      </div>`)}</div>`}
  </section>`;
}
function AddBatch({ layer }) {
  const { db, upd, closeLayer, toast, go, mode, confirm } = useApp();
  const o = db.orders.find((x) => x.no === layer.no);
  const free = o.samples.filter((s) => !s.batch);
  const no = "B-2026-0" + db.nextBatch;
  const [std, setStd] = useState(o.standards[0]);
  const [sel, setSel] = useState(new Set(free.slice(0, Math.min(8, free.length)).map((s) => s.key)));
  const [params, setParams] = useState(o.params.concat(o.no === "JO-2026-0137" ? ["HGI"] : []));
  const [deadline, setDeadline] = useState(addDays(TODAY, 5));
  const [prio, setPrio] = useState("Standard");
  const [coc, setCoc] = useState("");
  const [notes, setNotes] = useState("");
  const [err, setErr] = useState(null);
  const close = () => confirm({ title: "Discard this batch?", body: "Nothing is saved yet.", ok: "Discard", danger: true, cancelLabel: "Keep editing", onOk: closeLayer });
  useEsc(close, true);
  const added = params.filter((p) => !o.params.includes(p)), removed = o.params.filter((p) => !params.includes(p));
  const togP = (p) => setParams(params.includes(p) ? params.filter((x) => x !== p) : params.concat(p));
  const create = () => {
    if (!sel.size) { setErr("Tick at least one sample"); return; }
    upd((d) => {
      d.nextBatch += 1;
      d.batches.push({ no, order: o.no, standard: std, date: "27 Oct 2026", samples: sel.size, params, extra: added, status: "created", prep: null, analysis: null, roa: "—", deadline: fmtDate(deadline) });
      d.orders.find((x) => x.no === o.no).samples.forEach((s) => { if (sel.has(s.key)) s.batch = no; });
    });
    closeLayer(); toast(no + " created · " + sel.size + " samples · " + std); go({ v: "detail", no: o.no, tab: "batches" });
  };
  const body = html`
    <div class="row3"><${Field} label="Batch no." id="ab-no"><input id="ab-no" class="input mono" value=${no} readOnly /><//>
      <${Field} label="Batch date" id="ab-date"><input id="ab-date" class="input" value="27 Oct 2026" readOnly /><//>
      <${Field} label="Deadline" id="ab-deadline"><input id="ab-deadline" type="date" class="input" value=${deadline} onInput=${(e) => setDeadline(e.target.value)} /><//></div>
    <div class="field"><span class="flabel">Standard *</span>
      <div class="tchips" role="radiogroup" aria-label="Standard for this batch">${o.standards.map((s) => html`<button key=${s} type="button" role="radio" aria-checked=${std === s} class=${"tchip" + (std === s ? " on" : "")} onClick=${() => setStd(s)}>${std === s && html`<${Icon} n="check" />`}${s}</button>`)}</div>
      <span class="help">One standard per batch. ${o.standards.length > 1 ? "This job order has " + o.standards.join(" and ") + "." : "The job order uses " + o.standards[0] + " only."}</span></div>
    <div class="field"><div class="phdr"><span class="flabel">Samples *</span><span class="muted" style=${{ fontSize: "12px" }}>${sel.size} of ${free.length} selected</span></div>
      <div><button class="link" type="button" onClick=${() => setSel(new Set(free.map((s) => s.key)))}>Select all (${free.length})</button> · <button class="link" type="button" onClick=${() => setSel(new Set())}>Clear</button></div>
      <div class="cl-grid">${free.map((s) => html`<button key=${s.key} type="button" class=${"cb" + (sel.has(s.key) ? " on" : "")} role="checkbox" aria-checked=${sel.has(s.key)} onClick=${() => { const n = new Set(sel); n.has(s.key) ? n.delete(s.key) : n.add(s.key); setSel(n); setErr(null); }}>
        <span class="box">${sel.has(s.key) && html`<${Icon} n="check" />`}</span><span class="mono" style=${{ fontSize: "12px" }}>${s.id}</span></button>`)}</div>
      ${err && html`<span class="errmsg"><${Icon} n="warning-circle" />${err}</span>`}</div>
    <div class="field"><span class="flabel">Parameters</span>
      <div class="pills">${P.PARAM_GROUPS.flatMap((g) => g.items).filter((p) => o.params.includes(p) || ["HGI", "NCV", "RD", "C", "H", "N", "O"].includes(p)).map((p) => html`<button key=${p} type="button" class=${"pill" + (params.includes(p) ? " on" : "")} aria-pressed=${params.includes(p)} onClick=${() => togP(p)}>${params.includes(p) && html`<${Icon} n="check" />`}${p}</button>`)}</div>
      <span class="help">${added.length || removed.length ? [added.length ? "+ " + added.join(", ") : "", removed.length ? "− " + removed.join(", ") : ""].filter(Boolean).join(" · ") + " compared with the job order" : "Same parameters as the job order"}</span></div>
    <div class="row2"><${Field} label="Priority" id="ab-prio"><select id="ab-prio" class="select" value=${prio} onChange=${(e) => setPrio(e.target.value)}><option>Standard</option><option>Urgent</option></select><//>
      <${Field} label="CoC no. (optional)" id="ab-coc"><input id="ab-coc" class="input" value=${coc} placeholder="Chain of custody form" onInput=${(e) => setCoc(e.target.value)} /><//></div>
    <${Field} label="Notes" id="ab-notes"><textarea id="ab-notes" class="input" value=${notes} onInput=${(e) => setNotes(e.target.value)}></textarea><//>`;
  if (mode === "mobile") return html`<div class="full" role="dialog" aria-modal="true" aria-label="Add batch">
    <div class="fhead"><div class="t"><button class="ib" aria-label="Close" onClick=${close}><${Icon} n="x" /></button><h2>Add batch</h2><span class="tagnd">Not drawn yet</span></div></div>
    <div class="fbody">${body}</div><div class="ffoot"><button class="btn secondary" onClick=${close}>Cancel</button><button class="btn primary" onClick=${create}>Create batch</button></div></div>`;
  return html`<div class="scrim" onMouseDown=${(e) => e.target === e.currentTarget && close()}>
    <div class="modal" role="dialog" aria-modal="true" aria-labelledby="ab-title">
      <div class="mhead"><div><h2 id="ab-title">Add batch</h2><p>${o.no} · ${companyOf(db, o).name}</p></div><button class="ib" aria-label="Close" onClick=${close}><${Icon} n="x" /></button></div>
      <div class="mbody">${body}</div>
      <div class="mfoot"><button class="btn secondary" onClick=${close}>Cancel</button><button class="btn primary" onClick=${create}>Create batch</button></div>
    </div></div>`;
}

/* samples */
function parseRows(text) {
  const lines = text.split(/\r?\n/);
  return lines.map((l) => { const c = l.split(/\t|;/); return { id: (c[0] || "").trim(), desc: (c[1] || "").trim(), depth: (c[2] || "").trim(), remarks: (c[3] || "").trim() }; });
}
function PastePreview({ text, existing, onAdd, onClose }) {
  const [t, setT] = useState(text || "");
  const rows = t ? parseRows(t) : [];
  const nonEmpty = rows.filter((r) => r.id);
  const seen = new Set(existing.map((x) => x.toLowerCase()));
  let dup = 0;
  const marked = nonEmpty.map((r) => { const k = r.id.toLowerCase(); const d = seen.has(k); seen.add(k); if (d) dup++; return Object.assign({ dup: d }, r); });
  const empty = rows.length - nonEmpty.length;
  return html`<${Dialog} title=${t ? "Paste preview" : "Paste from Excel"} onClose=${onClose} actions=${html`
      <button class="btn secondary" onClick=${onClose}>Cancel</button>
      <button class="btn primary" disabled=${!nonEmpty.length} onClick=${() => onAdd(nonEmpty)}>Add ${nonEmpty.length} rows</button>`}>
    ${!t ? html`<p style=${{ margin: 0 }}>Copy the columns Sample ID, Description, Depth / lot and Remarks in Excel, then paste below.</p>
      <textarea class="input" aria-label="Paste rows" placeholder="Paste here (Ctrl+V)" onPaste=${(e) => { e.preventDefault(); setT(e.clipboardData.getData("text")); }} onInput=${(e) => setT(e.target.value)}></textarea>
      <button class="btn secondary sm" style=${{ alignSelf: "flex-start" }} onClick=${() => setT(P.PASTE_SAMPLE)}><${Icon} n="clipboard" />Use example rows</button>`
    : html`<div style=${{ display: "flex", gap: "8px", flexWrap: "wrap" }}><span class="badge b-delivered">${nonEmpty.length - dup} new</span>${dup > 0 && html`<span class="badge b-cancelled">${dup} duplicate</span>`}${empty > 0 && html`<span class="badge b-draft">${empty} empty, ignored</span>`}</div>
      <div class="grid-wrap" style=${{ border: "1px solid var(--border)", borderRadius: "10px" }}>
        <table style=${{ borderCollapse: "collapse", fontSize: "12px", width: "100%", minWidth: "420px" }}>
          <thead><tr style=${{ background: "var(--primary-50)", textAlign: "left" }}>${["Sample ID", "Description", "Depth / lot", "Remarks"].map((h) => html`<th key=${h} style=${{ padding: "8px 10px", fontWeight: 600 }}>${h}</th>`)}</tr></thead>
          <tbody>${marked.slice(0, 10).map((r, i) => html`<tr key=${i} style=${{ borderTop: "1px solid var(--divider)", background: r.dup ? "var(--error-100)" : undefined }}>
            <td class="mono" style=${{ padding: "6px 10px", color: r.dup ? "var(--error)" : undefined }}>${r.id}${r.dup ? " · duplicate" : ""}</td><td style=${{ padding: "6px 10px" }}>${r.desc}</td><td style=${{ padding: "6px 10px" }}>${r.depth}</td><td style=${{ padding: "6px 10px" }}>${r.remarks}</td></tr>`)}</tbody>
        </table></div>
      ${marked.length > 10 && html`<span class="help">Showing the first 10 of ${marked.length} rows.</span>`}
      <span class="help">Duplicates are added and marked, so you can fix them in the grid before saving.</span>`}
  <//>`;
}
function SamplesTab({ o }) {
  const app = useApp();
  const { db, upd, role, mode, toast, open } = app;
  const ps = perm(db, role, "editSamples", o);
  const editable = ps.show && ps.enabled;
  const [rows, setRows] = useState(() => clone(o.samples));
  const [dirtyKeys, setDirty] = useState(new Set());
  const [paste, setPaste] = useState(null);
  const [tip, setTip] = useState(null);
  const [saveErr, setSaveErr] = useState(null);
  const [msheet, setMsheet] = useState(null);
  const secRef = useRef();
  useEffect(() => { setRows(clone(o.samples)); setDirty(new Set()); }, [o.no, o.samples.length]);
  const dupOf = (i) => { const id = rows[i].id.trim().toLowerCase(); if (!id) return -1; return rows.findIndex((r, j) => j < i && r.id.trim().toLowerCase() === id); };
  const dups = rows.map((_, i) => dupOf(i));
  const nDup = dups.filter((d) => d >= 0).length;
  const setCell = (i, k, v) => { const r = rows.slice(); r[i] = Object.assign({}, r[i], { [k]: v }); setRows(r); const d = new Set(dirtyKeys); d.add(r[i].key); setDirty(d); setSaveErr(null); };
  const addRows = (list) => {
    const r = rows.slice(); const d = new Set(dirtyKeys);
    list.forEach((x, n) => { const key = "new" + Date.now() + n; r.push({ key, id: x.id || "", desc: x.desc || "", depth: x.depth || "", remarks: x.remarks || "", batch: "", received: null }); d.add(key); });
    setRows(r); setDirty(d); setPaste(null);
  };
  const save = () => {
    const blank = rows.filter((r) => dirtyKeys.has(r.key) && !r.id.trim()).length;
    if (nDup) { setSaveErr("Fix " + nDup + " duplicate ID" + (nDup > 1 ? "s" : "") + " before saving"); return false; }
    const keep = rows.filter((r) => r.id.trim());
    const n = dirtyKeys.size - blank;
    upd((d) => { const x = d.orders.find((y) => y.no === o.no); x.samples = clone(keep); if (!x.expected) x.expected = keep.length; });
    setDirty(new Set()); toast(n + " sample" + (n === 1 ? "" : "s") + " saved"); return true;
  };
  app.dirtyRef.current = dirtyKeys.size ? { save, discard: () => { setRows(clone(o.samples)); setDirty(new Set()); } } : null;
  useEffect(() => () => { app.dirtyRef.current = null; }, []);
  const nRec = rows.filter((r) => r.received).length;
  const onCellPaste = (i, e) => { const t = e.clipboardData.getData("text"); if (t.includes("\n") || t.includes("\t")) { e.preventDefault(); setPaste({ text: t }); } };
  const toolbar = html`<div class="cardhead" style=${{ flexWrap: "wrap" }}>
    <div><h2>${rows.filter((r) => r.id.trim()).length} samples registered</h2><span class="muted" style=${{ fontSize: "12px" }}>${nRec ? nRec + " received" : "None received yet"}${o.expected ? " · " + o.expected + " expected" : ""}</span></div>
    ${editable && mode !== "mobile" && html`<div style=${{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
      <button class="btn secondary sm" onClick=${() => addRows([{}])}><${Icon} n="plus" />Add row</button>
      <button class="btn secondary sm" onClick=${() => setPaste({ text: "" })}><${Icon} n="clipboard" />Paste from Excel</button>
      <button class="btn secondary sm" onClick=${() => toast("Import list opens the import wizard (S-16), designed later.", { icon: "info" })}><${Icon} n="upload-simple" />Import list</button>
      <button class="btn primary sm" disabled=${!dirtyKeys.size} onClick=${save}><${Icon} n="floppy-disk" />Save${dirtyKeys.size ? " (" + dirtyKeys.size + ")" : ""}</button></div>`}
  </div>`;
  const hint = editable
    ? html`<p class="sec" style=${{ margin: "0 20px 12px", fontSize: "12px", display: "flex", gap: "6px", alignItems: "center" }}><${Icon} n="info" />Paste IDs from Excel, or type them. The Preparation team receives samples by these IDs.</p>`
    : html`<div class="note info"><${Icon} n="info" />${role === "prep" ? "Read only. Receive samples in Reception, where these IDs are checked against the labels." : ps.why || "Read only for your role."}</div>`;
  if (!rows.length) return html`<section class="card">${toolbar}<div class="empty"><${Icon} n="list-numbers" /><b>No samples yet</b><span>Add the sample IDs the company sent, so the lab can receive and label them.</span>
      ${editable && html`<div style=${{ display: "flex", gap: "8px", flexWrap: "wrap", justifyContent: "center" }}>
        <button class="btn primary" onClick=${() => (mode === "mobile" ? setMsheet({}) : setPaste({ text: "" }))}><${Icon} n=${mode === "mobile" ? "plus" : "clipboard"} />${mode === "mobile" ? "Add sample" : "Paste from Excel"}</button>
        ${mode !== "mobile" && html`<button class="btn secondary" onClick=${() => addRows([{}])}><${Icon} n="plus" />Add row</button>`}</div>`}</div>
    ${paste && html`<${PastePreview} text=${paste.text} existing=${[]} onClose=${() => setPaste(null)} onAdd=${addRows} />`}
    ${msheet && html`<${MobileSample} onClose=${() => setMsheet(null)} onAdd=${(s) => { upd((d) => d.orders.find((y) => y.no === o.no).samples.push(Object.assign({ key: "m" + Date.now(), batch: "", received: null }, s))); setMsheet(null); toast(s.id + " added"); }} />`}
  </section>`;
  if (mode === "mobile") return html`<section class="card">${toolbar}${hint}
    ${rows.map((r) => html`<div key=${r.key} class="mcard"><div class="top"><span class="mono" style=${{ fontWeight: 600, color: "var(--heading)" }}>${r.id}</span>
      <span class=${"badge " + (r.received ? "b-delivered" : "b-registered")}>${r.received ? "Received" : "Registered"}</span></div>
      <div class="meta"><span>${r.desc}</span><span>${r.batch || "No batch"}</span></div></div>`)}
    ${editable && html`<div style=${{ padding: "12px 16px" }}><button class="btn secondary" style=${{ width: "100%" }} onClick=${() => setMsheet({})}><${Icon} n="plus" />Add sample</button></div>`}
    ${msheet && html`<${MobileSample} onClose=${() => setMsheet(null)} onAdd=${(s) => { upd((d) => d.orders.find((y) => y.no === o.no).samples.push(Object.assign({ key: "m" + Date.now(), batch: "", received: null }, s))); setMsheet(null); toast(s.id + " added"); }} />`}
  </section>`;
  return html`<section class="card" style=${{ position: "relative" }} ref=${secRef}>${toolbar}${hint}
    ${saveErr && html`<div class="note" style=${{ background: "var(--error-100)", color: "var(--error)" }}><${Icon} n="warning-circle" />${saveErr}</div>`}
    <div class="grid-wrap" style=${{ padding: "0 8px 8px" }}><div class="sgrid" role="grid" aria-label="Sample IDs">
      <div class="thead" role="row"><span>#</span><span>Sample ID *</span><span>Client description</span><span>Depth / lot reference</span><span>Remarks</span><span>Batch</span><span>Status</span></div>
      ${rows.map((r, i) => { const locked = !!r.received || !editable; const d = dups[i];
        return html`<${Fragment} key=${r.key}><div class="srow" role="row">
          <span class="idx" onMouseEnter=${(e) => { if (!r.received || !secRef.current) return; const s = secRef.current.getBoundingClientRect(), c = e.currentTarget.getBoundingClientRect(), z = s.width / secRef.current.offsetWidth || 1; setTip({ i, y: (c.bottom - s.top) / z + 4, x: (c.left - s.left) / z }); }} onMouseLeave=${() => setTip(null)}>${dirtyKeys.has(r.key) ? html`<span class="udot" title="Not saved"></span>` : r.received ? html`<${Icon} n="lock-simple" />` : null}${i + 1}</span>
          <input class=${"cellin idcell" + (d >= 0 ? " dup" : "")} aria-label=${"Sample ID, row " + (i + 1)} value=${r.id} disabled=${locked} title=${r.received ? "Received by " + r.received.by + ", " + r.received.at + ". Received samples can't be edited." : undefined} onInput=${(e) => setCell(i, "id", e.target.value)} onPaste=${(e) => onCellPaste(i, e)} />
          <input class="cellin" aria-label=${"Client description, row " + (i + 1)} value=${r.desc} disabled=${locked} onInput=${(e) => setCell(i, "desc", e.target.value)} />
          <input class="cellin" aria-label=${"Depth or lot, row " + (i + 1)} value=${r.depth} disabled=${locked} onInput=${(e) => setCell(i, "depth", e.target.value)} />
          <input class="cellin" aria-label=${"Remarks, row " + (i + 1)} value=${r.remarks} disabled=${locked} onInput=${(e) => setCell(i, "remarks", e.target.value)} />
          <span class="mono" style=${{ fontSize: "12px", color: r.batch ? "var(--heading)" : "var(--text-muted)" }}>${r.batch || "—"}</span>
          <span><span class=${"badge " + (r.received ? "b-delivered" : "b-registered")}>${r.received ? "Received" : "Registered"}</span></span>
        </div>${d >= 0 && html`<div class="srow" style=${{ minHeight: 0, borderBottom: "1px solid var(--divider)" }}><span></span><span class="dupmsg" style=${{ gridColumn: "2 / -1" }}>${r.id} is already in row ${d + 1}. Change one of them.</span></div>`}<//>`; })}
    </div></div>
    ${tip && html`<div class="tip" style=${{ left: tip.x + "px", top: tip.y + "px" }}>Received by ${rows[tip.i].received.by}, ${rows[tip.i].received.at}. Received samples can't be edited.</div>`}
    ${editable && html`<p style=${{ margin: "4px 20px 16px", fontSize: "12px" }}><button class="link" onClick=${() => addRows([{}])}>+ Add a row</button><span class="muted">, or paste a column of IDs from Excel into any Sample ID cell.</span></p>`}
    ${paste && html`<${PastePreview} text=${paste.text} existing=${rows.map((r) => r.id).filter(Boolean)} onClose=${() => setPaste(null)} onAdd=${addRows} />`}
  </section>`;
}
function MobileSample({ onClose, onAdd }) {
  const [s, setS] = useState({ id: "", desc: "", depth: "", remarks: "" });
  const [err, setErr] = useState(null);
  return html`<${Sheet} title="Add sample" onClose=${onClose}><div style=${{ padding: "0 16px", display: "flex", flexDirection: "column", gap: "12px" }}>
    <${Field} label="Sample ID *" id="ms-id" error=${err}><input id="ms-id" class=${"input mono" + (err ? " err" : "")} value=${s.id} onInput=${(e) => { setS(Object.assign({}, s, { id: e.target.value })); setErr(null); }} /><//>
    <${Field} label="Client description" id="ms-desc"><input id="ms-desc" class="input" value=${s.desc} onInput=${(e) => setS(Object.assign({}, s, { desc: e.target.value }))} /><//>
    <${Field} label="Depth / lot reference" id="ms-depth"><input id="ms-depth" class="input" value=${s.depth} onInput=${(e) => setS(Object.assign({}, s, { depth: e.target.value }))} /><//>
    <button class="btn primary" onClick=${() => (s.id.trim() ? onAdd(s) : setErr("Enter the sample ID"))}>Add sample</button></div><//>`;
}

/* CoA */
function CoaTab({ o }) {
  const { db, role, open, toast, mode } = useApp();
  const c = o.coa, bs = batchesOf(db, o.no), sg = signatoryOf(db, o);
  if (c.state === "notready") return html`<section class="card"><div class="cardhead"><h2>Certificate of Analysis</h2><span class="badge b-draft">Not ready</span></div>
    <p class="sec" style=${{ padding: "0 20px", margin: "0 0 12px", fontSize: "13px" }}>The CoA can be generated once every batch has an approved RoA.</p>
    <div style=${{ padding: "0 20px 18px", display: "flex", flexDirection: "column", gap: "8px" }}>${bs.length ? bs.map((b) => html`<div key=${b.no} style=${{ display: "flex", gap: "10px", alignItems: "center", fontSize: "13px" }}>
      <${Icon} n=${b.roa !== "—" ? "check-circle" : "clock-counter-clockwise"} /><span class="mono">${b.no}</span><span class="muted">${b.roa !== "—" ? "RoA approved" : "RoA not approved yet"}</span></div>`) : html`<span class="muted" style=${{ fontSize: "13px" }}>No batches yet.</span>`}</div></section>`;
  const canSend = perm(db, role, "markSent", o).show;
  return html`<section class="card">
    <div class="cardhead" style=${{ flexWrap: "wrap" }}><div style=${{ display: "flex", gap: "10px", alignItems: "center" }}><h2>Certificate of Analysis</h2><span class=${"badge " + (c.state === "sent" ? "b-delivered" : "b-reported")}>${c.state === "sent" ? "Sent" : "Published"}</span></div>
      <div style=${{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        <button class="btn secondary sm" onClick=${() => toast("In the app the PDF opens in a new tab. The prototype has no PDF.", { icon: "file-pdf" })}><${Icon} n="file-pdf" />Download PDF</button>
        ${mode !== "mobile" && html`<button class="btn secondary sm" onClick=${() => toast("Print opens the PDF in the app. Not in the prototype.", { icon: "printer" })}><${Icon} n="printer" />Print</button>`}
        ${canSend && html`<button class="btn primary sm" onClick=${() => open({ type: "marksent", no: o.no })}><${Icon} n="paper-plane-tilt" />${c.state === "sent" ? "Add another send" : "Mark sent"}</button>`}</div></div>
    <div class="coafacts">
      <div class="kv"><small>Number</small><b class="mono">${c.number}</b></div><div class="kv"><small>Revision</small><b>${c.rev}</b></div>
      <div class="kv"><small>Published</small><b>${c.published} by ${c.by}</b></div><div class="kv"><small>Signatory</small><b>${sg ? sg.name + " · " + sg.title : "—"}</b></div>
      <div class="kv"><small>Covers</small><b>${bs.length} batch${bs.length === 1 ? "" : "es"} · ${o.samples.length} samples</b></div></div>
    ${(c.sent || []).map((s, i) => { const ch = P.CHANNELS.find((x) => x.id === s.channel); return html`<div class="sentcard" key=${i}><${Icon} n=${ch.icon} /><span>Sent ${s.channel === "hardcopy" ? "as a hard copy" : "via " + ch.label} to <b>${s.to}</b> · ${s.date}${s.note ? " · " + s.note : ""}</span></div>`; })}
    <p class="sechead" style=${{ padding: "0 20px 8px" }}>Built from</p>
    ${bs.map((b) => html`<div key=${b.no} class="note info" style=${{ marginBottom: "8px" }}><span class="mono">${b.no}</span><span>${b.roa} · approved by Hendra Wijaya, S.T.</span></div>`)}
    <div style=${{ height: "10px" }}></div>
  </section>`;
}
function MarkSent({ layer }) {
  const { db, upd, closeLayer, toast, mode } = useApp();
  const o = db.orders.find((x) => x.no === layer.no);
  const ct = contactOf(db, o);
  const [date, setDate] = useState(TODAY);
  const [ch, setCh] = useState(null);
  const [to, setTo] = useState(ct ? ct.name : "");
  const [note, setNote] = useState("");
  const [err, setErr] = useState({});
  const confirmIt = () => {
    const e = {};
    if (!ch) e.ch = "Choose how the CoA was sent";
    if (!to.trim()) e.to = "Enter who received it";
    if (date > TODAY) e.date = "The date can't be in the future";
    setErr(e); if (Object.keys(e).length) return;
    const prev = clone(o);
    const [y, m, d] = date.split("-").map(Number);
    upd((x) => { const t = x.orders.find((q) => q.no === o.no); t.coa.sent = (t.coa.sent || []).concat({ channel: ch, to: to.trim(), date: d + " " + ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][m - 1], note }); t.coa.state = "sent"; if (t.status === "reported") t.status = "delivered"; });
    closeLayer();
    toast("CoA marked as sent · " + o.no + " is delivered", { action: { label: "Undo", fn: () => upd((x) => { const i = x.orders.findIndex((q) => q.no === o.no); x.orders[i] = prev; }) } });
  };
  const form = html`
    <div class="row2"><${Field} label="Date sent *" id="ms-date" error=${err.date}><input id="ms-date" type="date" max=${TODAY} class="input" value=${date} onInput=${(e) => setDate(e.target.value)} /><//>
      <${Field} label="Recipient *" id="ms-to" error=${err.to} help="Pre-filled from the job order contact"><input id="ms-to" class="input" value=${to} onInput=${(e) => setTo(e.target.value)} /><//></div>
    <div class="field"><span class="flabel">Channel *</span><div class="segc" role="radiogroup" aria-label="Channel">${P.CHANNELS.map((c) => html`<button key=${c.id} type="button" role="radio" aria-checked=${ch === c.id} aria-pressed=${ch === c.id} onClick=${() => { setCh(c.id); setErr(Object.assign({}, err, { ch: null })); }}><${Icon} n=${c.icon} /> ${c.label}</button>`)}</div>
      ${err.ch && html`<span class="errmsg"><${Icon} n="warning-circle" />${err.ch}</span>`}</div>
    <${Field} label="Note (optional)" id="ms-note"><input id="ms-note" class="input" value=${note} placeholder="e.g. courier receipt no." onInput=${(e) => setNote(e.target.value)} /><//>`;
  if (mode === "mobile") return html`<${Sheet} title="Mark CoA as sent" onClose=${closeLayer}><div style=${{ padding: "0 16px", display: "flex", flexDirection: "column", gap: "14px" }}>${form}<button class="btn primary" onClick=${confirmIt}>Confirm</button></div><//>`;
  return html`<${Dialog} title="Mark CoA as sent" onClose=${closeLayer} actions=${html`<button class="btn secondary" onClick=${closeLayer}>Cancel</button><button class="btn primary" onClick=${confirmIt}>Confirm</button>`}>
    <p style=${{ margin: 0 }}>${o.coa.number} · ${companyOf(db, o).name}</p>${form}<//>`;
}
function CancelOrder({ layer }) {
  const { db, upd, closeLayer, toast } = useApp();
  const o = db.orders.find((x) => x.no === layer.no);
  const [reason, setReason] = useState("");
  const [err, setErr] = useState(null);
  return html`<${Dialog} title=${"Cancel " + o.no + "?"} onClose=${closeLayer} actions=${html`<button class="btn secondary" onClick=${closeLayer}>Keep job order</button>
      <button class="btn danger" onClick=${() => { if (!reason.trim()) { setErr("Enter a reason; it is shown on the job order"); return; } const prev = o.status;
        upd((d) => { const t = d.orders.find((q) => q.no === o.no); t.status = "cancelled"; t.cancelReason = reason.trim(); }); closeLayer();
        toast(o.no + " cancelled", { action: { label: "Undo", fn: () => upd((d) => { const t = d.orders.find((q) => q.no === o.no); t.status = prev; delete t.cancelReason; }) } }); }}>Cancel job order</button>`}>
    <p style=${{ margin: 0 }}>No sample has been received yet, so the job order can still be cancelled. The company and its contacts stay.</p>
    <${Field} label="Reason *" id="cx-reason" error=${err}><textarea id="cx-reason" class=${"input" + (err ? " err" : "")} value=${reason} placeholder="e.g. Client postponed the shipment" onInput=${(e) => { setReason(e.target.value); setErr(null); }}></textarea><//>
  <//>`;
}
function CloseOrder({ layer }) {
  const { db, upd, closeLayer, toast } = useApp();
  const o = db.orders.find((x) => x.no === layer.no);
  return html`<${Dialog} title=${"Close " + o.no + "?"} onClose=${closeLayer} actions=${html`<button class="btn secondary" onClick=${closeLayer}>Cancel</button>
      <button class="btn primary" onClick=${() => { upd((d) => (d.orders.find((q) => q.no === o.no).status = "closed")); closeLayer(); toast(o.no + " closed", { action: { label: "Undo", fn: () => upd((d) => (d.orders.find((q) => q.no === o.no).status = "delivered")) } }); }}>Close job order</button>`}>
    <p style=${{ margin: 0 }}>The CoA was delivered. Closing moves the job order out of the open lists; it stays searchable.</p>
  <//>`;
}

/* ========== app root ========== */
function Skeleton() {
  return html`<div style=${{ display: "flex", flexDirection: "column", gap: "16px" }} aria-busy="true" aria-label="Loading">
    <div class="skel" style=${{ height: "16px", width: "220px" }}></div><div class="skel" style=${{ height: "40px", width: "340px" }}></div>
    <div class="skel" style=${{ height: "44px" }}></div>${[0, 1, 2, 3, 4].map((i) => html`<div key=${i} class="skel" style=${{ height: "56px" }}></div>`)}</div>`;
}
const DEFAULT_UI = { width: "fit", role: "cso", barMin: false, collapsed: false, list: { status: "all", q: "", company: "", std: "", due: "", sort: "due", sortDir: 1, page: 1 } };
function App() {
  const saved = useMemo(() => loadSaved(), []);
  const [db, setDb] = useState(() => (saved ? saved.db : P.seed()));
  const [ui, setUiRaw] = useState(() => Object.assign({}, DEFAULT_UI, saved ? saved.ui : {}, { list: Object.assign({}, DEFAULT_UI.list, saved && saved.ui ? saved.ui.list : {}) }));
  const [route, setRoute] = useState(() => (saved && saved.route) || { v: "list" });
  const [layer, setLayer] = useState(null);
  const [dlg, setDlg] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState("desktop");
  const [zoom, setZoom] = useState(1);
  const [devH, setDevH] = useState(800);
  const devRef = useRef(), stageRef = useRef(), barRef = useRef();
  const dirtyRef = useRef(null), searchRef = useRef(null);
  useEffect(() => { persist({ db, ui, route }); }, [db, ui, route]);
  const setUi = (p) => setUiRaw((u) => Object.assign({}, u, p));
  const upd = (fn) => setDb((d) => { const n = clone(d); fn(n); return n; });
  const toast = (text, opts) => { const id = Date.now() + Math.random(); setToasts((t) => t.concat(Object.assign({ id, text }, opts || {}))); setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), opts && opts.action ? 10000 : 5000); };
  const dropToast = (id) => setToasts((t) => t.filter((x) => x.id !== id));
  const go = (r) => { setRoute(r); setLoading(true); setTimeout(() => setLoading(false), 280); const m = document.getElementById("main"); m && (m.scrollTop = 0); };
  const confirm = (d) => setDlg(d);
  const guard = (next) => {
    const d = dirtyRef.current;
    if (!d) return next();
    setDlg({ title: "Save your sample changes?", body: "Some rows are not saved yet.", ok: "Save", cancelLabel: "Stay here", alt: { label: "Discard", fn: () => { d.discard(); dirtyRef.current = null; next(); } }, onOk: () => { if (d.save()) { dirtyRef.current = null; next(); } } });
  };
  // fit the device to the screen
  useEffect(() => {
    const fit = () => {
      const bar = barRef.current ? barRef.current.offsetHeight : 48;
      const vw = document.documentElement.clientWidth, vh = window.innerHeight;
      if (ui.width === "fit") { setZoom(1); setDevH(vh - bar); return; }
      const avail = Math.max(320, vw - 32);
      const z = Math.min(1, avail / ui.width);
      setZoom(z); setDevH(Math.max(560, (vh - bar - 48) / z));
    };
    fit(); window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, [ui.width, ui.barMin]);
  useEffect(() => {
    if (!devRef.current) return;
    const pick = (w) => setMode(w >= 1200 ? "desktop" : w >= 768 ? "tablet" : "mobile");
    if (ui.width !== "fit") { pick(ui.width); return; }
    const ro = new ResizeObserver(() => pick(devRef.current.getBoundingClientRect().width));
    ro.observe(devRef.current); return () => ro.disconnect();
  }, [ui.width]);
  // keyboard: N new job order, / search
  useEffect(() => {
    const h = (e) => {
      const t = e.target; if (/INPUT|TEXTAREA|SELECT/.test(t.tagName) || t.isContentEditable || layer || dlg || e.metaKey || e.ctrlKey || e.altKey) return;
      if (route.v !== "list") return;
      if (e.key === "n" && ui.role === "cso") { e.preventDefault(); setLayer({ type: "jobform", mode: "create" }); }
      if (e.key === "/" && searchRef.current && searchRef.current.current) { e.preventDefault(); searchRef.current.current.focus(); }
    };
    document.addEventListener("keydown", h); return () => document.removeEventListener("keydown", h);
  }, [route, layer, dlg, ui.role]);
  const startFlow = (id) => {
    const fresh = P.seed();
    const f = window.__JO.FLOWS.find((x) => x.id === id);
    const L = Object.assign({}, DEFAULT_UI.list);
    let r = { v: "list" }, lay = null, width = ui.width;
    const bnm = { company: "bnm", address: fresh.companies[0].address };
    if (["F1", "F1a", "F1b", "F10", "F11"].includes(id)) lay = { type: "jobform", mode: "create" };
    if (["F1c", "F1d", "F1e", "F8"].includes(id)) lay = { type: "jobform", mode: "create", preset: id === "F1e" ? Object.assign({ contact: "ct1" }, bnm) : bnm };
    if (id === "F2") { fresh.orders.unshift({ no: "JO-2026-0143", company: "bnm", contact: "ct1", po: "PO 4500-2252", standards: ["ASTM"], template: "basic", params: P.TEMPLATES[0].params.slice(), groupItems: {}, sampleType: "Exploration cores", expected: 12, due: addDays(TODAY, 5), priority: "Standard", signatory: "sg1", prep: true, status: "awaiting", created: "27 Oct 2026", createdBy: "Rina Kartika", notes: "", samples: [], coa: { state: "notready" }, files: 0 }); fresh.nextNo = 144; r = { v: "detail", no: "JO-2026-0143", tab: "samples" }; }
    if (id === "F2b") r = { v: "detail", no: "JO-2026-0142", tab: "samples" };
    if (id === "F3") L.status = "progress";
    if (id === "F4") L.status = "reported";
    if (id === "F9") r = { v: "detail", no: "JO-2026-0137", tab: "batches" };
    if (id === "F5") r = { v: "detail", no: "JO-2026-0138", tab: "overview" };
    if (id === "F6") r = { v: "detail", no: "JO-2026-0137", tab: "samples" };
    if (id === "F7") width = 390;
    dirtyRef.current = null;
    setDb(fresh); setUiRaw((u) => Object.assign({}, u, { role: f.role, list: L, width })); setLayer(lay); setDlg(null); go(r);
    toast(f.id + " · " + f.title + ": started", { icon: "play" });
  };
  const reset = () => { dirtyRef.current = null; setDb(P.seed()); setLayer(null); setUiRaw((u) => Object.assign({}, u, { list: DEFAULT_UI.list })); go({ v: "list" }); toast("Demo data reset"); };
  const ctx = { db, upd, ui, setUi, role: ui.role, route, go, open: setLayer, closeLayer: () => setLayer(null), confirm, toast, toasts, dropToast, mode, guard, dirtyRef, searchRef, formCompany: null };
  const fit = ui.width === "fit";
  const devStyle = fit ? { height: devH + "px" } : { width: ui.width + "px", height: devH + "px", zoom, flex: "none" };
  return html`<${Ctx.Provider} value=${ctx}>
    <div class="page">
      <div ref=${barRef} style=${{ position: "sticky", top: 0, zIndex: 90 }}><${ReviewBar} ui=${ui} setUi=${setUi} onStart=${startFlow} onReset=${reset} /></div>
      <div class=${"stage" + (fit ? " fit" : "")} ref=${stageRef}>
        <div class="device" ref=${devRef} style=${devStyle}>
          <div class=${"app is-" + mode}>
            <${Shell}>${loading ? html`<${Skeleton} />` : route.v === "list" ? html`<${ListView} />` : route.v === "detail" ? html`<${DetailView} key=${route.no} />` : html`<${Outside} />`}<//>
            ${layer && layer.type === "jobform" && html`<${JobForm} key=${layer.mode + (layer.no || "")} layer=${layer} />`}
            ${layer && layer.type === "addbatch" && html`<${AddBatch} layer=${layer} />`}
            ${layer && layer.type === "marksent" && html`<${MarkSent} layer=${layer} />`}
            ${layer && layer.type === "cancel" && html`<${CancelOrder} layer=${layer} />`}
            ${layer && layer.type === "close" && html`<${CloseOrder} layer=${layer} />`}
            ${dlg && html`<${ConfirmDialog} d=${dlg} close=${() => setDlg(null)} />`}
            <${Toasts} />
          </div>
        </div>
      </div>
    </div>
  <//>`;
}
ReactDOM.createRoot(document.getElementById("root")).render(html`<${App} />`);
})();
