/* Job orders (Job_Order_Prototype_Plan.md): list, New/Edit job order, detail with six tabs, Add batch, CoA, dialogs. */
(function () {
  const ST = D.JO_STATUS;
  const nextNo = (list, prefix, w = 4) => prefix + pad(Math.max(...list.map((x) => +x.slice(-w))) + 1, w);
  const svcLabel = (o) => { const s = D.SERVICES.find((x) => x.id === o.service); if (!s) return "Custom"; const same = s.params.length === o.params.length && s.params.every((p) => o.params.includes(p)); return { label: s.label, custom: !same }; };
  const pastDue = (o) => o.due < D.TODAY && ["awaiting", "progress", "draft"].includes(o.status);
  const editable = (db, o) => !S.batchesOf(db, o.no).some((b) => b.status !== "created") && !["cancelled", "closed", "delivered", "reported"].includes(o.status);
  const coaCell = (db, o) => { const st = S.coaState(db, o), c = S.currentCoa(o);
    if (st === "sent") { const ch = c.sends[c.sends.length - 1].channels[0]; return html`<${Tag} label=${"Sent by " + ch} tone="green" icon="check-circle" />`; }
    if (st === "published") return html`<${Tag} label="Published" tone="green" icon="check-circle" />`;
    if (st === "draft") return html`<${Tag} label="Draft" tone="grey" icon="pencil-simple" />`;
    if (st === "ready") return html`<${Tag} label="Ready" tone="amber" icon="certificate" />`;
    return html`<${Tag} label="No CoA" icon="file-x" />`; };

  /* ---------- list ---------- */
  function List() {
    const { db, go, bp, can, role } = useApp();
    const [st, setSt] = useState("all"), [q, setQ] = useState(""), [co, setCo] = useState(""), [cso, setCso] = useState(""), [due, setDue] = useState(""), [form, setForm] = useState(null), [dlg, setDlg] = useState(null), [flt, setFlt] = useState(false), [std, setStd] = useState("");
    const base = db.orders.slice().sort((a, b) => (a.no < b.no ? 1 : -1));
    const match = (o) => (!q || (o.no + S.client(db, o.client).name + o.po).toLowerCase().includes(q.toLowerCase())) && (!co || o.client === co) && (!cso || o.cso === cso) && (!due || o.due <= due) && (!std || o.standards.includes(std));
    const rows = base.filter((o) => (st === "all" || o.status === st) && match(o));
    const pg = usePaged(rows, 10, st + q + co + cso + due + std);
    const chips = [{ id: "all", label: "All", count: base.filter(match).length }].concat(Object.keys(ST).map((k) => ({ id: k, label: ST[k][0], count: base.filter((o) => o.status === k && match(o)).length })));
    const menu = (o) => [{ label: "Open", icon: "arrow-right", onClick: () => go("order-" + o.no) },
      can("order.write") && { label: "Edit", icon: "pencil-simple", disabled: !editable(db, o), why: "Editing closes once preparation starts", onClick: () => setForm(o.no) },
      can("order.write") && { label: "Cancel job order", icon: "prohibit", danger: true, disabled: S.received(db, o) > 0 || ["cancelled", "closed", "delivered", "reported"].includes(o.status), why: "Only before any sample is received", onClick: () => setDlg({ k: "cancel", o }) }];
    const filtersUI = html`<${Select} id="jo-co" label="Company" value=${co} onChange=${setCo} options=${[["", "All companies"]].concat(db.clients.filter((c) => c.status !== "Archived").map((c) => [c.id, c.name]))} style=${{ width: bp === "phone" ? "100%" : "200px" }} />
      <${Select} id="jo-cso" label="CSO" value=${cso} onChange=${setCso} options=${[["", "All CSOs"], ["Rina Kartika", "Rina Kartika"]]} style=${{ width: bp === "phone" ? "100%" : "200px" }} />
      <${DateField} id="jo-due" label="Due by" value=${due} onChange=${setDue} style=${{ width: bp === "phone" ? "100%" : "200px" }} />`;
    return html`<${Page}><${PageHead} overline=${bp === "desktop" ? longDate(D.TODAY) : "Job orders"} title="Job orders" actions=${can("order.write") && bp !== "phone" && html`<${Button} type="primary" size="lg" icon="plus" id="new-jo" onClick=${() => setForm("new")}>New job order</${Button}>`} />
      ${bp === "phone" ? html`<div class="row g10"><${Search} id="jo-q" value=${q} onChange=${setQ} placeholder="Search no., company, PO…" style=${{ flex: 1 }} /><${IconBtn} n="funnel" type="secondary" size=${44} label="Filters" onClick=${() => setFlt(true)} /></div><${Chips} scroll items=${chips} value=${st} onChange=${setSt} />`
        : html`<${Chips} items=${chips} value=${st} onChange=${setSt} /><div class="row g12 wrap" style=${{ alignItems: "flex-end" }}><${Search} id="jo-q" value=${q} onChange=${setQ} placeholder="Search no., company, PO…" style=${{ width: bp === "desktop" ? "320px" : "100%" }} />${bp === "desktop" && filtersUI}<span class="grow"></span><${Button} size="lg" icon="funnel" onClick=${() => setFlt(true)}>Filters</${Button}></div>`}
      ${!db.orders.length ? html`<${Card}><${Empty} icon="clipboard-text" title="No job orders yet" text="A job order holds a company's request and its sample IDs. Create the first one." action=${can("order.write") && html`<${Button} type="primary" icon="plus" onClick=${() => setForm("new")}>New job order</${Button}>`} /></${Card}>`
        : bp === "phone" ? html`<div class="col g12">${pg.rows.map((o) => html`<${OrderCard} key=${o.no} o=${o} />`)}</div>`
        : html`<${Card} id="jo-table"><${Table} rows=${pg.rows} onRow=${(o) => go("order-" + o.no)} cols=${[
          { h: "No.", render: (o) => html`<b class="t-data-b c-head">${o.no}</b>` },
          { h: "Client", render: (o) => { const c = S.contact(db, o); return html`<div class="two"><b>${S.client(db, o.client).name}</b><span class="row g6"><span>Attn. ${c ? c.name : "—"}</span>${o.po && html`<span>${o.po}</span>`}</span></div>`; } },
          bp === "desktop" && { h: "Service", render: (o) => svcLabel(o).label },
          { h: "Samples", cls: "r", render: (o) => html`<span class="num">${S.received(db, o)} / ${o.expected}</span>` },
          bp === "desktop" && { h: "Batches", cls: "r", render: (o) => { const bs = S.batchesOf(db, o.no); return html`<span class="num">${bs.filter((b) => b.roa).length} / ${bs.length}</span>`; } },
          { h: "Due", render: (o) => html`<span class=${cx(pastDue(o) && "c-err")}>${fmtDate(o.due)}</span>` },
          { h: "Status", render: (o) => html`<${Badge} label=${ST[o.status][0]} tone=${ST[o.status][1]} sm />` },
          bp === "desktop" && { h: "CoA", render: (o) => coaCell(db, o) },
          { h: "", cls: "r", w: "40px", render: (o) => html`<${Menu} vertical items=${menu(o)} label=${"Actions for " + o.no} />` }].filter(Boolean)}
          empty=${html`<${Empty} icon="magnifying-glass" title="No job orders match" text="Try another number or clear the filters." action=${html`<${Button} onClick=${() => { setQ(""); setCo(""); setCso(""); setDue(""); setSt("all"); setStd(""); }}>Clear filters</${Button}>`} />`} />
          <${Pager} ...${pg.pager} /></${Card}>`}
      ${bp === "phone" && html`<${Pager} ...${pg.pager} />`}
      ${bp === "phone" && can("order.write") && html`<div class="sticky-bar"><${Button} type="primary" size="lg" icon="plus" id="new-jo" onClick=${() => setForm("new")}>New job order</${Button}></div>`}
      ${flt && html`<${Dialog} title="Filters" sub="Narrow the job order list." onClose=${() => setFlt(false)} footer=${html`<${Button} onClick=${() => { setCo(""); setCso(""); setDue(""); setStd(""); }}>Clear all</${Button}><${Button} type="primary" onClick=${() => setFlt(false)}>Show ${rows.length} job orders</${Button}>`}>
        ${filtersUI}<${Select} label="Standard" value=${std} onChange=${setStd} options=${[["", "Any standard"]].concat(D.STANDARDS.map((s) => [s, s]))} /></${Dialog}>`}
      ${form && html`<${OrderForm} edit=${form === "new" ? null : form} onClose=${() => setForm(null)} />`}
      ${dlg && dlg.k === "cancel" && html`<${CancelDlg} o=${dlg.o} onClose=${() => setDlg(null)} />`}</${Page}>`;
  }
  function OrderCard({ o }) {
    const { db, go } = useApp(); const bs = S.batchesOf(db, o.no), sv = svcLabel(o), c = S.currentCoa(o);
    return html`<div class="mcard" onClick=${() => go("order-" + o.no)}><div class="row between"><b class="t-data-b c-head">${o.no}</b><${Badge} label=${ST[o.status][0]} tone=${ST[o.status][1]} sm /></div>
      <b class="t-body w6">${S.client(db, o.client).name}</b><span class="t-cap c-sec row g6"><span>${sv.label}</span><span>${o.standards.join(", ")}</span></span>
      <div class="row between t-cap c-sec"><span>Batches ${bs.filter((b) => b.status === "completed").length} / ${bs.length}</span><span class=${cx(pastDue(o) && "c-err")}>Due ${fmtShort(o.due)}</span></div>
      <div class="row g10"><${Progress} v=${S.received(db, o)} max=${o.expected || 1} /><span class="t-cap num">${S.received(db, o)}/${o.expected}</span></div>
      <div class="row between t-cap c-mut"><span>RoA ${bs.filter((b) => b.roa).length} / ${bs.length}</span><span>${c ? "CoA " + D.COA_STATUS[c.status][0] : "CoA —"}</span></div></div>`;
  }

  /* ---------- New / Edit job order ---------- */
  function OrderForm({ edit, onClose }) {
    const { db, update, go, toast, bp, api, me } = useApp();
    const src = edit ? S.order(db, edit) : null;
    const [f, setF] = useState(() => src ? { client: src.client, po: src.po, address: S.client(db, src.client).address, contact: src.contact, standards: src.standards.slice(), params: src.params.slice(), groupItems: clone(src.groupItems), prep: true, service: src.service, sampleType: src.sampleType, expected: String(src.expected), due: src.due, priority: src.priority, signatory: src.signatory, notes: src.notes, files: src.files.slice() }
      : { client: "", po: "", address: "", contact: "", standards: ["ASTM"], params: D.BASIC.slice(), groupItems: {}, prep: true, service: "basic", sampleType: "Exploration cores", expected: "", due: addDays(D.TODAY, 5), priority: "Standard", signatory: "sg1", notes: "", files: [] });
    const [err, setErr] = useState(null), [step, setStep] = useState(1), [ask, setAsk] = useState(false), [dirty, setDirty] = useState(false);
    const set = (p) => { setF((x) => Object.assign({}, x, p)); setDirty(true); };
    const client = f.client && db.clients.find((c) => c.id === f.client);
    const validate = (draft) => { const e = []; if (!f.client) e.push(["fc-company", "Company name"]); if (!draft) { if (!f.contact) e.push(["fc-contact", "Contact person"]); if (!(+f.expected > 0)) e.push(["fc-expected", "Expected samples"]); } return e; };
    const save = (draft) => {
      const e = validate(draft);
      if (e.length) { setErr(e); setStep(1); setTimeout(() => { const el = document.getElementById("fc-errsum"); el && el.focus(); }, 30); return; }
      let no = edit;
      update((d) => {
        if (client && f.address !== client.address) d.clients.find((c) => c.id === f.client).address = f.address;
        const body = { client: f.client, po: f.po, contact: f.contact, standards: f.standards, params: f.params, groupItems: f.groupItems, service: f.service, sampleType: f.sampleType, expected: +f.expected || 0, due: f.due, priority: f.priority, signatory: f.signatory, notes: f.notes, files: f.files };
        if (edit) { const o = d.orders.find((x) => x.no === edit); Object.assign(o, body); if (o.status === "draft" && !draft) o.status = "awaiting"; api.audit(d, "Job order", edit, "Updated", [["Fields", "", "Request edited"]], "Job order, Edit"); }
        else { no = nextNo(d.orders.map((o) => o.no), "JO-2026-"); d.orders.push(Object.assign({ no, status: draft ? "draft" : "awaiting", created: D.TODAY, createdBy: me.name, cso: me.name, samples: [], coas: [] }, body)); api.audit(d, "Job order", no, "Created", [["Client", "", S.client(d, f.client).name], ["Service", "", (D.SERVICES.find((s) => s.id === f.service) || {}).label || "Custom"]], "Job orders, New job order"); }
      });
      onClose();
      if (edit) toast(edit + " saved"); else if (draft) toast(no + " saved as a draft"); else { toast(no + " submitted. Add the sample IDs next."); go("order-" + no + "-samples"); }
    };
    const close = () => (dirty ? setAsk(true) : onClose());
    const phone = bp === "phone";
    const sec = (t) => html`<span class="t-over" style=${{ color: "var(--accent-text)" }}>${t}</span>`;
    const half = phone ? "1fr" : "1fr 1fr";
    const partA = html`
      ${err && html`<div id="fc-errsum" tabIndex="-1"><${Alert} tone="error" title=${"Fix " + plural(err.length, "field") + " to submit"} text=${html`${err.map(([id, l], i) => html`<${Fragment} key=${id}>${i ? ", " : ""}<a class="link" onClick=${() => { const el = document.getElementById(id); el && el.focus(); }}>${l}</a></${Fragment}>`)}`} /></div>`}
      ${sec("Company")}
      <div class="grid" style=${{ gridTemplateColumns: half, gap: "16px" }}>
        <${CompanyPick} value=${f.client} error=${err && err.some((x) => x[0] === "fc-company") ? "Choose the company" : null} onPick=${(id) => { const c = db.clients.find((x) => x.id === id); set({ client: id, address: c ? c.address : "", contact: c && (c.contacts.find((x) => x.def) || c.contacts[0] || {}).id || "" }); }} />
        <${TextField} id="fc-po" label="Client reference / PO" value=${f.po} onChange=${(v) => set({ po: v })} placeholder="e.g. PO 4500-2241" /></div>
      <${TextField} id="fc-address" label="Company address" opt value=${f.address} onChange=${(v) => set({ address: v })} help="Editing the address here updates the company record." disabled=${!f.client} />
      <${ContactPick} clientId=${f.client} value=${f.contact} onChange=${(id) => set({ contact: id })} error=${err && err.some((x) => x[0] === "fc-contact") ? "Choose a contact" : null} />
      ${sec("Work")}
      <${ParamPicker} f=${f} set=${set} />
      <div class="grid" style=${{ gridTemplateColumns: half, gap: "16px" }}>
        <${Select} id="fc-type" label="Sample type" value=${f.sampleType} onChange=${(v) => set({ sampleType: v })} options=${["Exploration cores", "Shipment", "Stockpile", "Channel samples"]} />
        <${TextField} id="fc-expected" label="Expected samples" req value=${f.expected} onChange=${(v) => set({ expected: v.replace(/\D/g, "") })} placeholder="e.g. 12" error=${err && err.some((x) => x[0] === "fc-expected") ? "Enter how many samples are coming" : null} />
        <${DateField} id="fc-due" label="Due date" value=${f.due} onChange=${(v) => set({ due: v })} help="Suggested from the template turnaround." />
        <${Select} id="fc-priority" label="Priority" value=${f.priority} onChange=${(v) => set({ priority: v })} options=${["Standard", "Urgent"]} /></div>`;
    const partB = html`${sec("Report")}<${SignatoryPick} value=${f.signatory} onChange=${(id) => set({ signatory: id })} />
      ${sec("Notes and files")}<${TextArea} id="fc-notes" label="Notes" value=${f.notes} onChange=${(v) => set({ notes: v })} placeholder="Add a note for the lab…" />
      ${f.files.map((x) => html`<div key=${x.name} class="row g10"><${FileChip} type=${/\.xlsx?$/.test(x.name) ? "XLS" : /\.csv$/.test(x.name) ? "CSV" : "PDF"} /><span class="t-sm grow ellip">${x.name}</span><span class="t-cap c-mut">${fileSize(x.size)}</span><${IconBtn} n="trash" label=${"Remove " + x.name} onClick=${() => set({ files: f.files.filter((y) => y !== x) })} /></div>`)}
      <${DropZone} hint="PDF, XLS or CSV, up to 10 MB" onFile=${(x) => set({ files: f.files.concat([Object.assign(x, { by: me.name, at: D.TODAY })]) })} />`;
    const title = edit ? "Edit " + edit : "New job order";
    if (phone) return html`<${Dialog} full title=${title} onClose=${close} id="order-form"
        footer=${step === 1 ? html`<${Button} size="lg" onClick=${() => save(true)}>Save as draft</${Button}><${Button} type="primary" size="lg" id="fc-next" onClick=${() => setStep(2)}>Next</${Button}>` : html`<${Button} size="lg" onClick=${() => setStep(1)}>Back</${Button}><${Button} type="primary" size="lg" id="fc-submit" onClick=${() => save(false)}>${edit ? "Save changes" : "Submit"}</${Button}>`}>
        <div class="col g6"><span class="t-cap c-sec">Step ${step} of 2</span><${Progress} v=${step} max=${2} /></div>${step === 1 ? partA : partB}
        ${ask && html`<${Confirm} title="Discard changes?" text="What you entered in this form is lost." ok="Discard" danger onOk=${onClose} onClose=${() => setAsk(false)} cancel="Keep editing" />`}</${Dialog}>`;
    return html`<${Dialog} size="xl" title=${title} sub="Enter the company's request. Sample IDs come next." onClose=${close} id="order-form"
      footer=${html`<${Button} onClick=${close}>Cancel</${Button}>${(!edit || src.status === "draft") && html`<${Button} id="fc-draft" onClick=${() => save(true)}>Save as draft</${Button}>`}<${Button} type="primary" id="fc-submit" onClick=${() => save(false)}>${edit ? "Save changes" : "Submit"}</${Button}>`}>
      ${partA}${partB}
      ${ask && html`<${Confirm} title="Discard changes?" text="What you entered in this form is lost." ok="Discard" danger onOk=${onClose} onClose=${() => setAsk(false)} cancel="Keep editing" />`}</${Dialog}>`;
  }
  function CompanyPick({ value, onPick, error }) {
    const { db, update, api } = useApp();
    const cur = db.clients.find((c) => c.id === value);
    const [q, setQ] = useState(cur ? cur.name : ""), [open, setOpen] = useState(false);
    const ref = useRef(); useOutside(ref, () => setOpen(false), open);
    useEffect(() => setQ(cur ? cur.name : ""), [value]);
    const list = db.clients.filter((c) => c.status === "Active" && c.name.toLowerCase().includes(q.toLowerCase()));
    const addNew = () => { const id = q.replace(/[^A-Za-z]/g, "").slice(0, 3).toUpperCase() + (db.clients.length + 1); update((d) => { d.clients.push({ id, name: q, short: q, status: "Active", address: "", created: D.TODAY, contacts: [] }); api.audit(d, "Master data", q, "Created", [["Client", "", q]], "New job order"); }); setTimeout(() => onPick(id), 0); setOpen(false); };
    return html`<div class="field" ref=${ref} style=${{ position: "relative" }}><label class="flabel" for="fc-company">Company name<span class="req">*</span></label>
      <div class=${cx("input", error && "err")}><input id="fc-company" value=${q} placeholder="Search or add a company" onFocus=${() => setOpen(true)} onInput=${(e) => { setQ(e.target.value); setOpen(true); }} autocomplete="off" /><${Icon} n="caret-down" /></div>
      ${error && html`<span class="help err">${error}</span>`}
      ${open && html`<div class="menu" style=${{ top: "68px", left: 0, right: 0 }}>${list.map((c) => html`<button key=${c.id} class="mi" onMouseDown=${(e) => { e.preventDefault(); onPick(c.id); setOpen(false); }}><${Avatar} name=${c.name} size=${24} logo=${c.logo} />${c.name}</button>`)}
        ${q && !list.some((c) => c.name.toLowerCase() === q.toLowerCase()) && html`<button class="mi" onMouseDown=${(e) => { e.preventDefault(); addNew(); }}><${Icon} n="plus" />Add "${q}" as a new company</button>`}</div>`}</div>`;
  }
  /* Contact person and Default signatory: one value, a list with check, pencil, trash and Add (Job order plan section 6, rows Contact and Signatory). */
  function OptionPicker({ id, label, req, opt, value, items, render, fields, onChange, onSave, onRemove, addLabel, disabled, disabledText, error, sheetTitle }) {
    const { bp } = useApp();
    const [open, setOpen] = useState(false), [ed, setEd] = useState(null), [rm, setRm] = useState(null), [msg, setMsg] = useState(null);
    const ref = useRef(); useOutside(ref, () => { if (!ed && !rm) setOpen(false); }, open && bp !== "phone");
    useEsc(() => (ed ? setEd(null) : setOpen(false)), open);
    const cur = items.find((x) => x.id === value);
    const saveEd = () => { const m = fields.find((fl) => fl.req && !(ed[fl.k] || "").trim()); if (m) return setMsg("Enter the " + m.label.toLowerCase() + "."); const nid = onSave(ed); setEd(null); setMsg(null); if (nid) { onChange(nid); setOpen(false); } };
    const row = (x) => ed && ed.id === x.id ? editRow() : html`<div key=${x.id} class="row g10" style=${{ padding: "8px 10px", borderRadius: "10px", border: "1px solid " + (x.id === value ? "var(--primary-300)" : "var(--surface-border)"), background: x.id === value ? "var(--primary-50)" : "var(--surface-card)", opacity: ed ? 0.45 : 1 }}>
      <button class="col grow" style=${{ gap: 0, textAlign: "left" }} disabled=${!!ed} onClick=${() => { onChange(x.id); setOpen(false); }}>${render(x)}</button>
      ${x.id === value && html`<${Icon} n="check" cls="c-brand" />`}
      <${IconBtn} n="pencil-simple" label=${"Edit " + x.name} disabled=${!!ed} onClick=${() => setEd(Object.assign({}, x))} />
      ${onRemove && html`<${Tip} text=${x.id === value ? "Choose another contact first" : "Remove " + x.name}><${IconBtn} n="trash" label=${"Remove " + x.name} disabled=${!!ed || x.id === value} onClick=${() => setRm(x)} /></${Tip}>`}</div>`;
    const editRow = () => html`<div key="edit" class="col g10" style=${{ padding: "10px", borderRadius: "10px", border: "1px solid var(--primary)", background: "var(--surface-card)" }}>
      <div class="grid" style=${{ gridTemplateColumns: bp === "phone" ? "1fr" : "repeat(" + fields.length + ", 1fr)", gap: "10px" }}>${fields.map((fl) => html`<${TextField} key=${fl.k} id=${id + "-" + fl.k} label=${fl.label} req=${fl.req} value=${ed[fl.k] || ""} onChange=${(v) => setEd(Object.assign({}, ed, { [fl.k]: v }))} />`)}</div>
      ${msg && html`<span class="help err">${msg}</span>`}<div class="row end"><${Button} size="sm" onClick=${() => { setEd(null); setMsg(null); }}>Cancel</${Button}><${Button} size="sm" type="primary" icon="floppy-disk" id=${id + "-save"} onClick=${saveEd}>Save</${Button}></div></div>`;
    const panel = html`<div class="col g6">${items.map(row)}${ed && !ed.id && editRow()}
      <button class="linkbtn" style=${{ padding: "6px 4px", opacity: ed ? 0.45 : 1 }} disabled=${!!ed} id=${id + "-add"} onClick=${() => setEd({ id: null })}><${Icon} n="plus" />${addLabel}</button></div>`;
    return html`<div class="field" ref=${ref} style=${{ position: "relative" }}><span class="flabel">${label}${req && html`<span class="req">*</span>`}${opt && html`<span class="opt">(optional)</span>`}</span>
      <button id=${id} class=${cx("input selbtn", error && "err", disabled && "dis")} disabled=${disabled} aria-expanded=${open} onClick=${() => setOpen(!open)}>
        <span class=${cx("v", !cur && "ph0")}>${cur ? html`<span class="row g10">${render(cur, true)}</span>` : disabled ? disabledText : "Select"}</span><${Icon} n="caret-down" /></button>
      ${error && html`<span class="help err">${error}</span>`}
      ${open && (bp === "phone" ? html`<${Dialog} title=${sheetTitle || label} onClose=${() => setOpen(false)}>${panel}</${Dialog}>` : html`<div class="menu" style=${{ top: "68px", left: 0, right: 0, padding: "10px", zIndex: 46 }}>${panel}</div>`)}
      ${rm && html`<${Confirm} title=${"Remove " + rm.name + " from contacts?"} text="Submitted job orders keep this contact's name on their documents." ok="Remove" danger onClose=${() => setRm(null)} onOk=${() => { onRemove(rm); setRm(null); }} />`}</div>`;
  }
  function ContactPick({ clientId, value, onChange, error }) {
    const { db, update, toast, bp, api } = useApp();
    const c = db.clients.find((x) => x.id === clientId);
    const items = c ? c.contacts : [];
    return html`<${OptionPicker} id="fc-contact" label="Contact person" req value=${value} items=${items} error=${error} disabled=${!c} disabledText="Select a company first" addLabel="Add contact" sheetTitle="Contact person"
      render=${(x, inField) => html`<span class="t-sm w5">${x.name}</span>${(!inField || true) && html`<span class="t-cap c-sec row g6 wrap"><span>${x.phone}</span>${x.email && bp !== "phone" && html`<span>${x.email}</span>`}</span>`}`}
      fields=${[{ k: "name", label: "Name", req: true }, { k: "phone", label: "Phone", req: true }, { k: "email", label: "Email" }]} onChange=${onChange}
      onSave=${(x) => { let nid = x.id; update((d) => { const cl = d.clients.find((y) => y.id === clientId); if (x.id) Object.assign(cl.contacts.find((y) => y.id === x.id), x); else { nid = "c" + Date.now(); cl.contacts.push(Object.assign({}, x, { id: nid, position: "" })); } api.audit(d, "Master data", x.name, x.id ? "Updated" : "Created", [["Contact", "", x.name]], "New job order"); }); toast(x.id ? "Contact saved" : x.name + " added to " + c.name); return x.id ? null : nid; }}
      onRemove=${(x) => { const before = clone(c.contacts); update((d) => { const cl = d.clients.find((y) => y.id === clientId); cl.contacts = cl.contacts.filter((y) => y.id !== x.id); }); toast(x.name + " removed", { undo: () => update((d) => { d.clients.find((y) => y.id === clientId).contacts = before; }) }); }} />`;
  }
  function SignatoryPick({ value, onChange }) {
    const { db, update, toast } = useApp();
    return html`<${OptionPicker} id="fc-signatory" label="Default signatory" opt value=${value} items=${db.signatories} addLabel="Add signatory" sheetTitle="Default signatory"
      render=${(x) => html`<span class="t-sm w5">${x.name}</span><span class="t-cap c-sec">${x.title}</span>`} fields=${[{ k: "name", label: "Name", req: true }, { k: "title", label: "Title", req: true }]} onChange=${onChange}
      onSave=${(x) => { let nid = x.id; update((d) => { if (x.id) Object.assign(d.signatories.find((y) => y.id === x.id), x); else { nid = "sg" + Date.now(); d.signatories.push(Object.assign({}, x, { id: nid })); } }); toast(x.id ? "Signatory saved" : x.name + " added"); return x.id ? null : nid; }} />`;
  }
  /* Standard chips, quick select, search, parameter pills with dependants, coverage tags and group checklists. */
  function ParamPicker({ f, set }) {
    const { bp } = useApp();
    const [q, setQ] = useState(""), [grp, setGrp] = useState(null);
    const on = (p) => f.params.includes(p);
    const lockedBy = (p) => Object.keys(D.DEPENDS).find((k) => on(k) && D.DEPENDS[k].includes(p));
    const toggle = (p) => { if (lockedBy(p) || !D.covered(p, f.standards)) return; let ps = on(p) ? f.params.filter((x) => x !== p) : f.params.concat([p]); if (!on(p) && D.DEPENDS[p]) D.DEPENDS[p].forEach((x) => { if (!ps.includes(x)) ps.push(x); }); set({ params: ps }); };
    const pick = (s) => { const ps = s.params.filter((p) => D.covered(p, f.standards)); const gi = {}; ps.forEach((p) => { if (D.GROUP_PILLS[p]) gi[p] = D.GROUP_PILLS[p].preset.slice(); }); set({ params: ps, service: s.id, groupItems: gi }); };
    const stdToggle = (s) => { const has = f.standards.includes(s); if (has && f.standards.length === 1) return; const stds = has ? f.standards.filter((x) => x !== s) : f.standards.concat([s]); set({ standards: stds, params: f.params.filter((p) => D.covered(p, stds)) }); };
    const count = f.params.length + (f.prep ? 1 : 0);
    const hit = (p) => !q || p.toLowerCase().includes(q.toLowerCase()) || D.SHORT(p).toLowerCase().includes(q.toLowerCase());
    const pill = (p) => { const isG = !!D.GROUP_PILLS[p], lk = lockedBy(p), na = !D.covered(p, f.standards), n = isG && f.groupItems[p] ? f.groupItems[p].length : 0;
      const tags = D.coverTags(p), sub = D.SUBCONTRACTED.includes(p);
      const el = html`<button key=${p} class=${cx("ppill", on(p) && "on", lk && "lock", na && "na", isG && "grp")} aria-pressed=${on(p)} disabled=${na} onClick=${() => (isG ? setGrp(p) : toggle(p))}>
        ${lk && html`<${Icon} n="lock-simple" />`}${p}${isG && (n ? " " + n + "/" + D.GROUP_PILLS[p].sections.reduce((a, s) => a + s.items.length, 0) : "")}${isG && " ▸"}
        ${tags.map((t) => html`<span key=${t} class="ctag">${t}</span>`)}${sub && html`<span class="ctag">SUB</span>`}</button>`;
      return lk ? html`<${Tip} key=${p} text=${lk + " needs " + D.DEPENDS[lk].join(", ") + ", so " + p + " stays on."}>${el}</${Tip}>` : na ? html`<${Tip} key=${p} text=${"No " + f.standards.join(" + ") + " method. Add " + Object.keys(D.STD_METHODS[p]).join(" or ") + " under Standard."}>${el}</${Tip}>` : el; };
    return html`<div class="field"><span class="flabel">Standard<span class="req">*</span></span><div class="chips">${D.STANDARDS.map((s) => { const el = html`<button key=${s} class=${cx("chip sm", f.standards.includes(s) && "on")} aria-pressed=${f.standards.includes(s)} onClick=${() => stdToggle(s)}>${s}</button>`;
        return f.standards.includes(s) && f.standards.length === 1 ? html`<${Tip} key=${s} text="At least one standard stays on">${el}</${Tip}>` : el; })}</div></div>
      <div class="field"><div class="row between"><span class="flabel">Parameters<span class="req">*</span></span><span class="t-cap c-mut" id="fc-count">${count} selected</span></div>
        <div class="row g4 wrap"><span class="t-cap c-mut" style=${{ marginRight: "6px" }}>Quick select</span>${D.SERVICES.map((s) => html`<${Button} key=${s.id} type="ghost" size="sm" onClick=${() => pick(s)}>${s.label}</${Button}>`)}<${Button} type="ghost" size="sm" onClick=${() => set({ params: [], groupItems: {} })}>Clear</${Button}></div>
        <${Search} id="fc-psearch" value=${q} onChange=${setQ} placeholder="Search parameters…" />
        <div class="col g10" style=${{ marginTop: "4px" }}>
          ${(!q || "preparation".includes(q.toLowerCase())) && html`<div class="row top g10"><span class="t-cap c-sec" style=${{ width: bp === "phone" ? "84px" : "100px", flex: "none", paddingTop: "8px" }}>Preparation</span><div class="row g6 wrap"><button class=${cx("ppill", f.prep && "on")} aria-pressed=${f.prep} onClick=${() => set({ prep: !f.prep })}>Preparation</button></div></div>`}
          ${D.PARAM_GROUPS.map((g) => { const items = g.items.filter(hit); if (!items.length) return null; return html`<div key=${g.id} class="row top g10"><span class="t-cap c-sec" style=${{ width: bp === "phone" ? "84px" : "100px", flex: "none", paddingTop: "8px" }}>${g.label}</span><div class="row g6 wrap">${items.map(pill)}</div></div>`; })}
          ${q && !D.PARAM_GROUPS.some((g) => g.items.some(hit)) && html`<span class="t-sm c-mut">No parameter matches "${q}".</span>`}</div></div>
      ${grp && html`<${GroupList} name=${grp} sel=${f.groupItems[grp] || (f.params.includes(grp) ? [] : D.GROUP_PILLS[grp].preset)} onClose=${() => setGrp(null)} onApply=${(items) => { const gi = Object.assign({}, f.groupItems, { [grp]: items }); const ps = items.length ? (f.params.includes(grp) ? f.params : f.params.concat([grp])) : f.params.filter((p) => p !== grp); set({ groupItems: gi, params: ps }); setGrp(null); }} />`}`;
  }
  function GroupList({ name, sel, onClose, onApply }) {
    const [s, setS] = useState(sel.slice()), [q, setQ] = useState("");
    const g = D.GROUP_PILLS[name], total = g.sections.reduce((a, x) => a + x.items.length, 0);
    return html`<${Dialog} title=${name + ", " + s.length + " of " + total} size="md" onClose=${onClose} id="group-list" footer=${html`<${Button} onClick=${onClose}>Cancel</${Button}><${Button} type="primary" id="group-apply" onClick=${() => onApply(s)}>Done</${Button}>`}>
      <${Search} id="gl-q" value=${q} onChange=${setQ} placeholder="Search parameters…" /><div class="row g12"><button class="linkbtn" onClick=${() => setS(g.sections.flatMap((x) => x.items))}>Select all</button><button class="linkbtn" onClick=${() => setS([])}>Clear</button></div>
      ${g.sections.map((sec) => { const it = sec.items.filter((x) => !q || x.toLowerCase().includes(q.toLowerCase())); if (!it.length) return null; return html`<div key=${sec.label} class="col g8"><span class="t-over">${sec.label}</span><div class="grid" style=${{ gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: "10px" }}>${it.map((x) => html`<${Check} key=${x} on=${s.includes(x)} label=${x} onChange=${(v) => setS(v ? s.concat([x]) : s.filter((y) => y !== x))} />`)}</div></div>`; })}</${Dialog}>`;
  }

  /* ---------- detail ---------- */
  const TABS = ["overview", "samples", "batches", "files", "coa", "history"];
  function Detail({ no, tab }) {
    const { db, go, bp, can, role } = useApp();
    const o = S.order(db, no);
    const [form, setForm] = useState(false), [dlg, setDlg] = useState(null);
    if (!o) return html`<${Page}><${Card}><${Empty} icon="question" title=${no + " was not found"} action=${html`<${Button} onClick=${() => go("orders")}>Back to job orders</${Button}>`} /></${Card}></${Page}>`;
    const t = TABS.includes(tab) ? tab : "overview";
    const bs = S.batchesOf(db, o.no), c = S.contact(db, o), cl = S.client(db, o.client);
    const menu = [can("order.write") && { label: "Edit", icon: "pencil-simple", disabled: !editable(db, o), why: "Editing closes once preparation starts", onClick: () => setForm(true) },
      can("order.write") && { label: "Cancel job order", icon: "prohibit", danger: true, disabled: S.received(db, o) > 0 || ["cancelled", "closed", "delivered", "reported"].includes(o.status), why: "Only before any sample is received", onClick: () => setDlg("cancel") },
      can("order.write") && { label: "Close job order", icon: "archive", disabled: o.status !== "delivered", why: "Only a delivered job order can be closed", onClick: () => setDlg("close") }];
    const steps = stepsOf(db, o);
    const go2 = (x) => go("order-" + o.no + (x === "overview" ? "" : "-" + x));
    return html`<${Page}><${PageHead} crumb=${[["Job orders", "orders"], [o.no]]} title=${o.no} badge=${html`<${Badge} label=${ST[o.status][0]} tone=${ST[o.status][1]} />`}
        actions=${html`${o.samples.length === 0 && can("order.write") && o.status !== "cancelled" && html`<${Button} type="primary" icon="plus" onClick=${() => go2("samples")}>Add samples</${Button}>`}<${Menu} items=${menu} size=${36} />`}
        meta=${html`<div class="col g4"><b class="t-body w5">${cl.name}</b><div class="row g16 wrap t-cap c-mut"><span class="row g4"><${Icon} n="user" />${c ? c.name : "—"}</span>${o.po && html`<span class="row g4"><${Icon} n="clipboard-text" />${o.po}</span>`}
          <span class=${cx("row g4", pastDue(o) && "c-err")}><${Icon} n="calendar-blank" />${fmtDate(o.due)}${pastDue(o) && html`<b class="w6"> Past due</b>`}</span></div></div>`} />
      ${o.status !== "cancelled" && o.status !== "draft" && html`<${Card}><${Stepper} steps=${steps.list} current=${steps.cur} vertical=${bp === "phone"} /></${Card}>`}
      ${o.status === "cancelled" && html`<${Alert} tone="error" title="Cancelled" text=${o.cancelReason || "Cancelled before any sample arrived."} />`}
      <${Tabs} id="jo-tabs" items=${[{ id: "overview", label: "Overview" }, { id: "samples", label: "Samples", count: o.samples.length }, { id: "batches", label: "Batches", count: bs.length }, { id: "files", label: "Files", count: o.files.length }, { id: "coa", label: "CoA" }, { id: "history", label: "History" }]} value=${t} onChange=${go2} />
      ${t === "overview" && html`<${Overview} o=${o} onEdit=${() => setForm(true)} />`}
      ${t === "samples" && html`<${SamplesTab} o=${o} />`}
      ${t === "batches" && html`<${BatchesTab} o=${o} />`}
      ${t === "files" && html`<${FilesTab} o=${o} />`}
      ${t === "coa" && html`<${CoaTab} o=${o} />`}
      ${t === "history" && html`<${HistoryTab} o=${o} />`}
      ${form && html`<${OrderForm} edit=${o.no} onClose=${() => setForm(false)} />`}
      ${dlg === "cancel" && html`<${CancelDlg} o=${o} onClose=${() => setDlg(null)} />`}
      ${dlg === "close" && html`<${CloseDlg} o=${o} onClose=${() => setDlg(null)} />`}</${Page}>`;
  }
  function stepsOf(db, o) {
    const bs = S.batchesOf(db, o.no), c = S.currentCoa(o);
    const firstConf = bs.map((b) => b.confirmed && b.confirmed.at).filter(Boolean).sort()[0], firstAna = bs.map((b) => b.prepDone && b.prepDone.at).filter(Boolean).sort()[0];
    const allDone = bs.length && bs.every((b) => b.status === "completed") ? bs.map((b) => b.completed.at).sort().pop() : null;
    const pub = c && c.published && c.status !== "draft" ? c.published : null, sent = c && c.sends.length ? c.sends[0].date : null;
    const d = (x) => (x ? fmtShort(x) : "—");
    const list = [{ title: "Registered", meta: d(o.created) }, { title: "Samples received", meta: d(firstConf) }, { title: "Analysis", meta: firstAna ? "Started " + fmtShort(firstAna) : "—" }, { title: "RoA approved", meta: d(allDone) }, { title: "CoA published", meta: d(pub) }, { title: "Sent to client", meta: d(sent) }];
    const cur = sent ? 6 : pub ? 5 : allDone ? 4 : firstAna ? 2 : firstConf ? 2 : 1;
    return { list, cur };
  }
  function Overview({ o, onEdit }) {
    const { db, bp, can, go } = useApp();
    const c = S.contact(db, o), cl = S.client(db, o.client), sv = svcLabel(o), sg = S.signatory(db, o.signatory), bs = S.batchesOf(db, o.no);
    const awaiting = o.samples.filter((s) => s.flag && s.flag.state === "awaiting");
    return html`<div class="grid" style=${{ gridTemplateColumns: bp === "desktop" ? "minmax(0,1fr) minmax(0,0.75fr)" : "1fr", alignItems: "start" }}>
      <${Card} title="Properties" actions=${can("order.write") && editable(db, o) && html`<${Button} type="ghost" icon="pencil-simple" onClick=${onEdit}>Edit</${Button}>`}><div>
        <${KV} k="Company">${cl.name}</${KV}><${KV} k="Address">${cl.address}</${KV}>
        <${KV} k="Contact">${c ? html`<span class="row g12 wrap"><span>${c.name}</span><span class="c-sec">${c.phone}</span>${c.email && html`<span class="c-sec">${c.email}</span>`}</span>` : "—"}</${KV}>
        <${KV} k="Client reference">${o.po || "—"}</${KV}>
        <${KV} k="Parameters"><span class="col g6"><span class="row g10 wrap"><span>${sv.label}</span>${sv.custom && html`<span class="c-mut">customized</span>`}<span class="grow"></span><span class="c-brand">${plural(o.params.length + 1, "parameter")}</span></span>
          <span class="row g4 wrap"><span class="badge sm nodot tn-outline">Preparation</span>${o.params.map((p) => html`<span key=${p} class="badge sm nodot tn-outline">${D.SHORT(p)}${o.groupItems[p] ? " " + o.groupItems[p].length : ""}</span>`)}</span></span></${KV}>
        <${KV} k="Standard">${o.standards.join(", ")}</${KV}>
        <${KV} k="Expected samples"><span class="row g10"><span>${o.expected}</span><span class="c-brand">${o.sampleType}</span></span></${KV}>
        <${KV} k="Priority">${o.priority}</${KV}><${KV} k="Due date"><span class=${cx(pastDue(o) && "c-err")}>${fmtDate(o.due)}</span></${KV}>
        <${KV} k="Default signatory">${sg ? html`<span class="row g10 wrap"><span>${sg.name}</span><span class="c-brand">${sg.title}</span></span>` : "—"}</${KV}>
        <${KV} k="Created by"><span class="row g10"><span>${o.createdBy}</span><span class="c-brand">${fmtDate(o.created)}</span></span></${KV}>
        <${KV} k="Notes">${o.notes || "—"}</${KV}></div></${Card}>
      <div class="col g20"><${Card} title="Batches">${bs.length ? bs.map((b) => html`<div key=${b.no} class="col g6" style=${{ paddingBottom: "12px", borderBottom: "1px solid var(--surface-divider)" }}>
          <div class="row g8 wrap"><${RecLink} to=${"batch-" + b.no} cls="t-data-b">${b.no}</${RecLink}><${Badge} label=${D.B_STATUS[b.status][0]} tone=${D.B_STATUS[b.status][1]} sm /><${Tag} label=${b.std} /><span class="grow"></span><span class="t-cap c-sec">${plural(b.samples.length, "sample")}</span>${b.roa ? html`<${RecLink} to=${"roa-" + b.roa.no} cls="t-data">${b.roa.no}</${RecLink}>` : html`<span class="t-cap c-mut">—</span>`}</div>
          <${PersonLine} k="Preparation" p=${b.prepDone || (b.confirmed && { by: b.confirmed.by, at: b.confirmed.at, started: true })} /><${PersonLine} k="Analysis" p=${b.anaDone || (["analysis"].includes(b.status) && { by: "Fitri Handayani", at: b.prepDone.at, started: true })} /></div>`)
          : html`<span class="t-sm c-mut">No batches yet.</span>`}
        ${awaiting.length > 0 && html`<${Note} icon="warning">${plural(awaiting.length, "sample is", "samples are")} awaiting arrival: ${awaiting.map((s) => s.id).join(", ")}.</${Note}>`}</${Card}>
        <${CoaCard} o=${o} /></div></div>`;
  }
  function PersonLine({ k, p }) {
    return html`<div class="row g10 t-cap"><span class="c-mut" style=${{ width: "78px" }}>${k}</span>${p ? html`<${Avatar} name=${p.by} size=${24} /><span class="t-sm grow">${p.by}</span><span class="row g4"><span class="c-mut">${p.started ? "Started" : ""}</span><span class="c-sec">${fmtShort(p.at)}</span></span>` : html`<span class="c-mut">—</span>`}</div>`;
  }
  function CoaCard({ o }) {
    const { db, go } = useApp(); const st = S.coaState(db, o), c = S.currentCoa(o);
    const tag = { none: html`<${Tag} label="Pending" icon="clock" />`, ready: html`<${Tag} label="Ready to generate" tone="amber" icon="certificate" />`, draft: html`<${Tag} label="Draft" icon="pencil-simple" />`, published: html`<${Tag} label="Published" tone="blue" icon="certificate" />`, sent: html`<${Tag} label="Sent" tone="green" icon="check-circle" />` }[st];
    return html`<${Card} cls="flat" style=${{ background: "var(--surface-muted)" }}><div class="row g10"><${Icon} n="certificate" s="20" cls="c-brand" /><b class="t-sm w6 grow">Certificate of Analysis</b>${tag}</div>
      <span class="t-cap c-sec">${st === "none" ? "The CoA can be generated once every batch has an approved RoA." : st === "ready" ? "Every batch is completed. The lab admin can generate the CoA." : st === "draft" ? "A draft is in progress in Reports." : c.no + (st === "sent" ? " was sent to the client." : " is published and waiting to be sent.")}</span>
      ${st !== "none" && html`<button class="linkbtn" onClick=${() => go("order-" + o.no + "-coa")}><${Icon} n="arrow-right" />Open the CoA tab</button>`}</${Card}>`;
  }

  /* ---------- samples tab ---------- */
  const PASTE = "MCR-9001\tPly A1 upper\tDH-MCR-011\t6.20\t6.55\tComposite\nMCR-9002\tPly A1 lower\tDH-MCR-011\t6.55\t6.90\t\nMCR-9003\tPly A2\tDH-MCR-011\t8.10\t8.45\tComposite";
  function SamplesTab({ o }) {
    const { db, update, toast, can, bp, go, api } = useApp();
    const write = can("order.write") && !["cancelled", "closed", "delivered"].includes(o.status);
    const [rows, setRows] = useState(null), [paste, setPaste] = useState(false), [nr, setNr] = useState(null);
    useEffect(() => setRows(null), [o.no]);
    const list = rows || o.samples;
    const dirty = !!rows;
    const ids = list.map((s) => s.id.trim().toUpperCase());
    const dup = ids.findIndex((x, i) => x && ids.indexOf(x) !== i);
    const edit = (i, k, v) => { const r = clone(list); r[i][k] = v; r[i]._dirty = true; setRows(r); };
    const add = (n = 1) => { const r = clone(list); for (let k = 0; k < n; k++) r.push({ id: "", desc: "", type: "Ply", hole: "", from: "", to: "", batch: null, flag: null, _dirty: true }); setRows(r); };
    const save = () => { if (dup >= 0) return; const clean = list.filter((s) => s.id.trim()).map((s) => { const x = Object.assign({}, s); delete x._dirty; x.id = x.id.trim().toUpperCase(); return x; });
      const n = clean.length - o.samples.length;
      update((d) => { const x = d.orders.find((y) => y.no === o.no); x.samples = clean; if (x.expected < clean.length) x.expected = clean.length; api.audit(d, "Job order", o.no, "Updated", [["Samples", String(o.samples.length), String(clean.length)]], "Job order, Samples tab"); });
      setRows(null); toast(plural(Math.max(n, list.filter((s) => s._dirty).length), "sample") + " saved"); };
    const state = (s) => (s._dirty ? "expected" : S.sampleState(db, o, s));
    const lockText = (s) => { const b = s.batch && S.batch(db, s.batch); if (b && b.confirmed) return "Received on " + fmtShort(b.confirmed.at) + " by " + b.confirmed.by + ". Received samples can't be edited."; return "In " + s.batch + ". Remove it from the batch before editing."; };
    const canEditRow = (s) => write && ["expected"].includes(state(s));
    const action = (s, i) => { const st = state(s);
      if (!can("order.write")) return null;
      if (st === "received" || st === "inbatch" || st === "held") return html`<${Tip} text=${lockText(s)}><${IconBtn} n="lock-simple" label="Locked" disabled /></${Tip}>`;
      if (st === "notreceived") return html`<${Tip} text="Restore"><${IconBtn} n="arrow-counter-clockwise" label=${"Restore " + s.id} onClick=${() => restore(s)} /></${Tip}>`;
      if (s._dirty) return html`<${IconBtn} n="trash" label="Remove row" onClick=${() => setRows(list.filter((_, k) => k !== i))} />`;
      return html`<${Tip} text="Mark as not received"><${IconBtn} n="file-x" label=${"Mark " + s.id + " as not received"} onClick=${() => setNr(s)} /></${Tip}>`; };
    const restore = (s) => { update((d) => { const x = d.orders.find((y) => y.no === o.no).samples.find((y) => y.id === s.id); const from = x.flag.from; x.flag = from ? { state: "awaiting", from } : null; api.audit(d, "Sample", s.id, "Status changed", [["State", "Not received", from ? "Awaiting arrival" : "Expected"]], "Job order, Samples tab"); }); toast(s.id + " restored"); };
    if (!list.length && !rows) return html`<${Card} title="Registered Samples"><${Empty} icon="rows" title="No samples yet" text="Add the sample IDs the company sent, so the lab can receive them against this list." action=${write && html`<div class="row g10 wrap" style=${{ justifyContent: "center" }}><${Button} type="primary" icon="plus" id="add-samples" onClick=${() => add(3)}>Add samples</${Button}><${Button} icon="copy" onClick=${() => setPaste(true)}>Paste from Excel</${Button}></div>`} />${paste && html`<${PasteDlg} o=${o} existing=${[]} onClose=${() => setPaste(false)} onAdd=${(r) => { setRows(r.map((x) => Object.assign(x, { _dirty: true }))); setPaste(false); }} />`}</${Card}>`;
    const hd = html`${write && html`<${Button} icon="plus" onClick=${() => add()}>${bp === "phone" ? "Add sample" : "Add row"}</${Button}><${Button} icon="copy" id="paste-btn" onClick=${() => setPaste(true)}>Paste from Excel</${Button}><${Button} icon="upload-simple" onClick=${() => toast("Import is designed later (S-16)", { tone: "info" })}>Import list</${Button}>
      <${Button} type=${dirty ? "primary" : "secondary"} icon="floppy-disk" id="samples-save" disabled=${!dirty || dup >= 0} onClick=${save}>${dirty ? "Save (" + list.filter((s) => s._dirty).length + ")" : "Save"}</${Button}>`}`;
    const stBadge = (s) => { const st = state(s); return html`<${Badge} label=${D.S_STATE[st][0]} tone=${D.S_STATE[st][1]} sm />`; };
    return html`<${Card} title="Registered Samples" actions=${hd}>
      ${dup >= 0 && html`<${Alert} tone="error" title="Fix 1 duplicate ID before saving" text=${ids[dup] + " is already in row " + (ids.indexOf(ids[dup]) + 1) + "."} />`}
      ${!write && can("batch.create") && html`<${Note}>Receive samples on the batch page. Rows here are the client's list.</${Note}>`}
      ${bp === "phone" ? html`<div class="col g10">${list.map((s, i) => html`<div key=${i} class="mcard" style=${{ cursor: "default" }}><div class="row between"><b class="t-data-b">${s.id || "New sample"}</b>${stBadge(s)}</div>
          ${canEditRow(s) && s._dirty ? html`<${TextField} label="Sample ID" value=${s.id} onChange=${(v) => edit(i, "id", v)} mono />` : null}
          <span class="t-sm">${s.desc}</span><span class="t-cap c-sec row g6"><span>${s.hole}</span><span>${s.from && s.from + "–" + s.to + " m"}</span></span>
          <div class="row between">${s.batch ? html`<${RecLink} to=${"batch-" + s.batch} cls="t-data">${s.batch}</${RecLink}>` : html`<span class="t-cap c-mut">No batch</span>`}${action(s, i)}</div></div>`)}</div>`
      : html`<${Table} id="samples-table" rows=${list} keyOf=${(s) => s.id + list.indexOf(s)} rowCls=${(s) => (dup >= 0 && s.id.trim().toUpperCase() === ids[dup] ? "errrow" : null)} cols=${[
        { h: "#", w: "36px", render: (s, i) => html`<span class="c-mut row g4">${i + 1}${s._dirty && html`<span class="dirty" title="Unsaved"></span>`}</span>` },
        { h: "Sample ID", render: (s, i) => canEditRow(s) && s._dirty ? html`<input class="cell l" style=${{ fontFamily: "var(--f-mono)" }} value=${s.id} aria-label="Sample ID" onInput=${(e) => edit(i, "id", e.target.value)} />` : html`<b class="t-data-b c-head">${s.id}</b>` },
        { h: "Client description", render: (s, i) => canEditRow(s) && s._dirty ? html`<input class="cell l" value=${s.desc} aria-label="Client description" onInput=${(e) => edit(i, "desc", e.target.value)} />` : s.desc },
        { h: "Depth / lot reference", render: (s, i) => canEditRow(s) && s._dirty ? html`<input class="cell l" value=${s.hole} placeholder="Drill hole" aria-label="Drill hole" onInput=${(e) => edit(i, "hole", e.target.value)} />` : html`<span class="row g8"><span>${s.hole}</span><span>${s.from && s.from + "–" + s.to + " m"}</span></span>` },
        bp === "desktop" && { h: "Remarks", render: (s) => s.remark || (s.type === "Composite" ? "Composite" : "") },
        { h: "Batch", render: (s) => s.batch ? html`<${RecLink} to=${"batch-" + s.batch} cls="t-data">${s.batch}</${RecLink}>` : html`<span class="c-mut">—</span>` },
        { h: "Status", render: stBadge },
        { h: "Action", cls: "c", render: (s, i) => html`<span class="row g4" style=${{ justifyContent: "center" }}>${action(s, i)}${!s._dirty && html`<${Menu} vertical size=${28} label=${"More for " + s.id} items=${[{ label: "History", icon: "clock-counter-clockwise", onClick: () => go("sample-" + s.id) }]} />`}</span>` }].filter(Boolean)} />`}
      ${paste && html`<${PasteDlg} o=${o} existing=${ids} onClose=${() => setPaste(false)} onAdd=${(r) => { setRows(clone(list).concat(r.map((x) => Object.assign(x, { _dirty: true })))); setPaste(false); }} />`}
      ${nr && html`<${NotReceivedDlg} o=${o} s=${nr} onClose=${() => setNr(null)} />`}</${Card}>`;
  }
  function PasteDlg({ o, existing, onClose, onAdd }) {
    const [t, setT] = useState(""), [cols, setCols] = useState(["Sample ID", "Client description", "Drill hole", "From (m)", "To (m)", "Remarks"]);
    const pfx = (o.samples[0] && o.samples[0].id.split("-")[0]) || "BNM";
    const sample = () => setT(Array.from({ length: 12 }, (_, i) => pfx + "-" + (9601 + (i === 11 ? 1 : i)) + "\t" + ["Ply 1 upper", "Ply 1 lower", "Composite", "Ply 2"][i % 4] + "\tDH-" + pfx + "-031\t" + (10.2 + i * 0.7).toFixed(2) + "\t" + (10.9 + i * 0.7).toFixed(2) + "\t" + (i % 4 === 2 ? "Composite" : "")).join("\n"));
    const parsed = t.trim() ? t.trim().split(/\r?\n/).map((l) => l.split("\t")) : [];
    const seen = existing.slice(); const rows = parsed.map((c) => { const id = (c[0] || "").trim().toUpperCase(); const d = seen.includes(id); seen.push(id); return { id, desc: c[1] || "", hole: c[2] || "", from: c[3] || "", to: c[4] || "", remark: c[5] || "", dup: d }; });
    const fresh = rows.filter((r) => !r.dup);
    return html`<${Dialog} title="Paste from Excel" size="lg" id="paste-dlg" sub=${rows.length ? rows.length + " rows found: " + fresh.length + " new, " + (rows.length - fresh.length) + " duplicate. Duplicates are skipped." : "Copy the rows in Excel and paste them here. Columns are read left to right."} onClose=${onClose}
      footer=${html`<${Button} onClick=${onClose}>Cancel</${Button}><${Button} type="primary" id="paste-add" disabled=${!fresh.length} onClick=${() => onAdd(fresh.map((r) => ({ id: r.id, desc: r.desc, type: /composite/i.test(r.desc) ? "Composite" : "Ply", hole: r.hole, from: r.from, to: r.to, remark: r.remark, batch: null, flag: null })))}>Add ${plural(fresh.length, "row")}</${Button}>`}>
      ${!rows.length ? html`<textarea class="input" id="paste-area" style=${{ height: "140px", fontFamily: "var(--f-mono)" }} placeholder="Paste here (Ctrl+V)" value=${t} onInput=${(e) => setT(e.target.value)}></textarea><div class="row"><${Button} size="sm" id="paste-sample" onClick=${sample}>Use sample rows</${Button}></div>`
        : html`<div class="row g6 wrap"><span class="tag tn-outline">${plural(rows.length, "row")} found</span><span class="tag tn-green">${fresh.length} new</span>${rows.length > fresh.length && html`<span class="tag tn-red">${rows.length - fresh.length} duplicate</span>`}</div>
          <div class="grid" style=${{ gridTemplateColumns: "repeat(6, minmax(0,1fr))", gap: "8px" }}>${cols.map((c, i) => html`<${Select} key=${i} label=${"Column " + "ABCDEF"[i]} value=${c} onChange=${(v) => { const n = cols.slice(); n[i] = v; setCols(n); }} options=${["Sample ID", "Client description", "Drill hole", "From (m)", "To (m)", "Remarks", "Ignore"]} />`)}</div>
          <${Table} rows=${rows} keyOf=${(r) => r.id + Math.random()} rowCls=${(r) => r.dup && "errrow"} cols=${[{ h: "Sample ID", render: (r) => html`<b class="t-data-b">${r.id}</b>` }, { h: "Description", k: "desc" }, { h: "Drill hole", k: "hole" }, { h: "From", k: "from" }, { h: "To", k: "to" }, { h: "", render: (r) => r.dup && html`<${Tag} label="Duplicate" tone="red" icon="copy" />` }]} />
          <div class="row"><${Button} size="sm" onClick=${() => setT("")}>Paste again</${Button}></div>`}</${Dialog}>`;
  }
  function NotReceivedDlg({ o, s, onClose }) {
    const { update, toast, api } = useApp(); const [r, setR] = useState("Client did not send it"), [other, setOther] = useState("");
    return html`<${Confirm} title=${"Mark " + s.id + " as not received?"} text="The sample stays on the job order with this state. The CoA no longer waits for it. You can restore it if it turns up." ok="Mark as not received" onClose=${onClose}
      onOk=${() => { update((d) => { const x = d.orders.find((y) => y.no === o.no).samples.find((y) => y.id === s.id); x.flag = { state: "notreceived", reason: r === "Other" ? other : r, from: x.flag && x.flag.from, by: "Rina Kartika", at: D.TODAY }; api.audit(d, "Sample", s.id, "Status changed", [["State", "Expected", "Not received"], ["Reason", "", r]], "Job order, Samples tab"); }); onClose(); toast(s.id + " marked as not received"); }}>
      <${Select} id="nr-reason" label="Reason" req value=${r} onChange=${setR} options=${["Client did not send it", "Lost in transit", "Other"]} />${r === "Other" && html`<${TextField} label="Describe the reason" value=${other} onChange=${setOther} />`}</${Confirm}>`;
  }

  /* ---------- batches tab and Add batch ---------- */
  function BatchesTab({ o }) {
    const { db, can, go, bp } = useApp();
    const [add, setAdd] = useState(false);
    const bs = S.batchesOf(db, o.no);
    const free = o.samples.filter((s) => !s.batch && !(s.flag && s.flag.state === "notreceived"));
    const awaiting = o.samples.filter((s) => s.flag && s.flag.state === "awaiting");
    const allowed = can("batch.create") && !["cancelled", "closed", "draft"].includes(o.status);
    const pp = (p) => p ? html`<span class="row g6"><${Avatar} name=${p.by} size=${24} /><span class="col" style=${{ gap: 0 }}><span class="t-sm">${p.by}</span><span class="t-cap c-sec">${fmtShort(p.at)}</span></span></span>` : html`<span class="c-mut">—</span>`;
    return html`<${Card} title="Batches" actions=${allowed && html`<${Button} size="sm" icon="plus" id="add-batch" disabled=${!free.length} why="Every registered sample is already in a batch" onClick=${() => setAdd(true)}>Add batch</${Button}>`}>
      ${awaiting.length > 0 && html`<${Alert} tone="warning" title=${plural(awaiting.length, "sample is", "samples are") + " awaiting arrival"} text=${awaiting.map((s) => s.id + " (from " + s.flag.from + ")").join(", ") + ". Add them to a new batch when they arrive, or mark them not received on the Samples tab."} />`}
      ${!bs.length ? html`<${Empty} icon="stack" title="No batches yet" text="Use Add batch above to group the registered samples and send them to the lab." />`
        : bp === "phone" ? html`<div class="col g10">${bs.map((b) => html`<div key=${b.no} class="mcard" onClick=${() => go("batch-" + b.no)}><div class="row between"><b class="t-data-b">${b.no}</b><${Badge} label=${D.B_STATUS[b.status][0]} tone=${D.B_STATUS[b.status][1]} sm /></div><span class="t-cap c-sec row g6"><span>${b.std}</span><span>${plural(b.samples.length, "sample")}</span><span>Due ${fmtShort(b.deadline)}</span></span></div>`)}</div>`
        : html`<${Table} id="batches-table" rows=${bs} onRow=${(b) => go("batch-" + b.no)} cols=${[{ h: "Batch no.", render: (b) => html`<b class="t-data-b c-brand">${b.no}</b>` }, { h: "Standard", render: (b) => html`<${Tag} label=${b.std} />` }, { h: "Samples", cls: "r", render: (b) => b.samples.length },
          bp === "desktop" && { h: "Parameters", render: (b) => { const same = b.params.length === o.params.length && b.params.every((p) => o.params.includes(p)); return same ? svcLabel(o).label : html`<span class="row g4"><span>Custom</span><span class="c-sec">${b.params.length}</span></span>`; } },
          { h: "Status", render: (b) => html`<${Badge} label=${D.B_STATUS[b.status][0]} tone=${D.B_STATUS[b.status][1]} sm />` }, { h: "Preparation", render: (b) => pp(b.prepDone) }, { h: "Analysis", render: (b) => pp(b.anaDone) },
          { h: "RoA", render: (b) => b.roa ? html`<${RecLink} to=${"roa-" + b.roa.no} cls="t-data">${b.roa.no}</${RecLink}>` : html`<span class="c-mut">—</span>` }, { h: "Deadline", render: (b) => fmtShort(b.deadline) }].filter(Boolean)} />`}
      ${add && html`<${AddBatch} jo=${o.no} onClose=${() => setAdd(false)} />`}</${Card}>`;
  }
  function AddBatch({ jo, onClose }) {
    const { db, update, toast, go, bp, api, me } = useApp();
    const o = S.order(db, jo), cl = S.client(db, o.client);
    const free = o.samples.filter((s) => !s.batch && !(s.flag && s.flag.state === "notreceived"));
    const late = free.filter((s) => s.flag && s.flag.state === "awaiting");
    const prev = S.batchesOf(db, jo).slice(-1)[0];
    const svc = D.SERVICES.find((s) => s.id === o.service) || D.SERVICES[0];
    const [f, setF] = useState(() => ({ no: nextNo(db.batches.map((b) => b.no), "B-2026-"), coc: "", date: D.TODAY, deadline: late.length ? o.due : [addDays(D.TODAY, svc.days), o.due].sort()[0], std: prev ? prev.std : o.standards[0], priority: prev ? prev.priority : o.priority, params: prev ? prev.params.slice() : o.params.slice(), sel: (late.length ? late : free.slice(0, 8)).map((s) => s.id) }));
    const [step, setStep] = useState(1), [err, setErr] = useState(null);
    const set = (p) => setF(Object.assign({}, f, p));
    const extra = f.params.filter((p) => !o.params.includes(p)), less = o.params.filter((p) => !f.params.includes(p));
    const create = () => {
      if (db.batches.some((b) => b.no === f.no)) return setErr(f.no + " is already used. Pick another number.");
      if (!f.sel.length) return setErr("Tick at least one sample.");
      update((d) => { const od = d.orders.find((x) => x.no === jo); const rows = {}; f.sel.forEach((sid, i) => { rows[sid] = { lab: "B" + f.no.slice(-4) + "-" + String(i + 1).padStart(2, "0"), arrived: false, mass: null, cond: "", remark: "", label: "none", photos: [], hold: null, adl: null, values: {} }; const s = od.samples.find((x) => x.id === sid); s.batch = f.no; s.flag = null; });
        d.batches.push({ no: f.no, jo, std: f.std, date: f.date, deadline: f.deadline, priority: f.priority, params: f.params, coc: f.coc, samples: f.sel.slice(), rows, status: "created", log: [], roa: null, createdBy: me.name });
        api.audit(d, "Batch", f.no, "Created", [["Samples", "", String(f.sel.length)], ["Standard", "", f.std]], "Job order, Add batch");
        api.notify(d, { to: ["prep", "lab_admin"], ev: "N1", icon: "stack", title: f.no + " is ready to receive", text: "Created by " + me.name + " for " + jo + ".", link: "batch-" + f.no }); });
      onClose(); toast(f.no + " created. " + plural(f.sel.length, "sample") + ", " + f.std + ".");
    };
    const settings = html`<div class="grid" style=${{ gridTemplateColumns: bp === "phone" ? "1fr" : "1fr 1fr", gap: "16px" }}>
        <${TextField} id="ab-no" label="Batch no." req value=${f.no} onChange=${(v) => { set({ no: v }); setErr(null); }} mono error=${err && err.includes("used") ? err : null} />
        <${TextField} id="ab-coc" label="CoC no." opt value=${f.coc} onChange=${(v) => set({ coc: v })} placeholder="Chain of custody form" />
        <${DateField} label="Batch date" value=${f.date} onChange=${(v) => set({ date: v })} /><${DateField} label="Deadline" value=${f.deadline} onChange=${(v) => set({ deadline: v })} help=${late.length ? "The job order's due date, for late samples." : null} /></div>
      <div class="field"><span class="flabel">Standard<span class="req">*</span></span><div class="chips">${o.standards.map((s) => html`<button key=${s} class=${cx("chip sm", f.std === s && "on")} onClick=${() => set({ std: s })}>${s}</button>`)}</div><span class="help">One standard per batch.</span></div>
      <${Select} label="Priority" value=${f.priority} onChange=${(v) => set({ priority: v })} options=${["Standard", "Urgent"]} />
      <div class="field"><span class="flabel">Parameters</span><div class="row g6 wrap">${o.params.concat(["HGI", "NCV", "RD", "C", "H", "N", "O"].filter((p) => !o.params.includes(p))).filter((p) => D.covered(p, [f.std])).map((p) => html`<button key=${p} class=${cx("ppill", f.params.includes(p) && "on")} onClick=${() => set({ params: f.params.includes(p) ? f.params.filter((x) => x !== p) : f.params.concat([p]) })}>${D.SHORT(p)}</button>`)}</div>
        ${(extra.length > 0 || less.length > 0) && html`<span class="help">${extra.length > 0 && "+ " + extra.join(", ")}${extra.length && less.length ? "; " : ""}${less.length > 0 && "− " + less.join(", ")} compared with the job order</span>`}</div>
      ${prev && html`<${Note}>Settings copied from ${prev.no}: ${prev.std}, ${svcLabel(o).label} and ${prev.priority} priority.</${Note}>`}`;
    const pickList = html`<div class="field"><div class="row between"><span class="flabel">Samples (${f.sel.length} of ${free.length})</span><span class="row g12"><button class="linkbtn" onClick=${() => set({ sel: free.map((s) => s.id) })}>Select all (${free.length})</button><button class="linkbtn" onClick=${() => set({ sel: [] })}>Clear</button></span></div>
      <div class="grid" style=${{ gridTemplateColumns: bp === "phone" ? "1fr 1fr" : "repeat(4, minmax(0,1fr))", gap: "10px" }}>${free.map((s) => html`<div key=${s.id} class="col" style=${{ gap: "2px" }}><${Check} on=${f.sel.includes(s.id)} label=${html`<span class="t-data">${s.id}</span>`} onChange=${(v) => set({ sel: v ? f.sel.concat([s.id]) : f.sel.filter((x) => x !== s.id) })} />${s.flag && s.flag.state === "awaiting" && html`<span class="t-cap c-warn row g4" style=${{ paddingLeft: "26px" }}><span>Awaiting arrival</span><span class="c-mut">from ${s.flag.from}</span></span>`}</div>`)}</div>
      ${err && !err.includes("used") && html`<span class="help err">${err}</span>`}</div>`;
    const sub = html`<span class="row g8"><span class="t-data">${o.no}</span><span>${cl.name}</span></span>`;
    if (bp === "phone") return html`<${Dialog} full title="Add batch" onClose=${onClose} id="add-batch-dlg" footer=${step === 1 ? html`<${Button} type="primary" size="lg" onClick=${() => setStep(2)}>Next (${f.sel.length} selected)</${Button}>` : html`<${Button} size="lg" onClick=${() => setStep(1)}>Back</${Button}><${Button} type="primary" size="lg" id="ab-create" onClick=${create}>Create batch</${Button}>`}>
      ${sub}<div class="col g6"><span class="t-cap c-sec">Step ${step} of 2</span><${Progress} v=${step} max=${2} /></div>${step === 1 ? pickList : settings}</${Dialog}>`;
    return html`<${Dialog} size="xl" title="Add batch" sub=${sub} onClose=${onClose} id="add-batch-dlg" footer=${html`<${Button} onClick=${onClose}>Cancel</${Button}><${Button} type="primary" id="ab-create" onClick=${create}>Create batch</${Button}>`}>${settings}${pickList}</${Dialog}>`;
  }
  SH.AddBatch = AddBatch;

  /* ---------- files, CoA, history ---------- */
  function FilesTab({ o }) {
    const { update, toast, can, me, api } = useApp(); const write = can("order.write") || can("batch.create");
    return html`<${Card} title="Files">${o.files.length ? html`<div class="col g10">${o.files.map((x) => html`<div key=${x.name} class="row g10" style=${{ padding: "8px 0", borderBottom: "1px solid var(--surface-divider)" }}><${FileChip} type=${/\.xlsx?$/.test(x.name) ? "XLS" : "PDF"} /><b class="t-sm w5 grow ellip">${x.name}</b><span class="t-cap c-mut">${fileSize(x.size)}</span><span class="t-cap c-sec">${x.by}</span><span class="t-cap c-sec">${fmtShort(x.at)}</span>
        <${IconBtn} n="download-simple" label=${"Download " + x.name} onClick=${() => toast(x.name + " downloaded (sample file)")} />${write && html`<${IconBtn} n="trash" label=${"Remove " + x.name} onClick=${() => { update((d) => { const od = d.orders.find((y) => y.no === o.no); od.files = od.files.filter((y) => y.name !== x.name); api.audit(d, "Job order", o.no, "Updated", [["File", x.name, ""]], "Job order, Files tab"); }); toast(x.name + " removed"); }} />`}</div>`)}</div>`
      : html`<span class="t-sm c-mut">No files yet.</span>`}${write && html`<${DropZone} hint="PDF, XLS or CSV, up to 10 MB" onFile=${(x) => { update((d) => { d.orders.find((y) => y.no === o.no).files.push(Object.assign(x, { by: me.name, at: D.TODAY })); api.audit(d, "Job order", o.no, "Updated", [["File", "", x.name]], "Job order, Files tab"); }); toast(x.name + " added"); }} />`}</${Card}>`;
  }
  function CoaTab({ o }) {
    const { db, can, go, toast, update, api, role } = useApp();
    const [send, setSend] = useState(false);
    const st = S.coaState(db, o), c = S.currentCoa(o), bs = S.batchesOf(db, o.no), sg = c && S.signatory(db, c.signatory);
    const unsettled = o.samples.filter((s) => !s.batch && !(s.flag && s.flag.state === "notreceived"));
    const gen = () => { update((d) => { const od = d.orders.find((x) => x.no === o.no); od.coas.push({ no: "Draft CoA", rev: 0, status: "draft", published: null, by: null, signatory: od.signatory, bases: ["ADB", "AR"], params: od.params.filter((p) => D.PARAM_INFO[p]), attention: od.contact, po: od.po, sends: [] }); api.audit(d, "Report", o.no, "Created", [["CoA", "", "Draft"]], "Job order, CoA tab"); }); go("report-draft-" + o.no); };
    if (st === "none") return html`<${Card} title="Certificate of Analysis" actions=${html`<${Tag} label="Pending" icon="clock" />`}><span class="t-sm c-sec">The CoA can be generated once every batch has an approved RoA.</span>${unsettled.length > 0 && html`<${Note} icon="warning">${plural(unsettled.length, "registered sample is", "registered samples are")} not in a batch or marked not received yet.</${Note}>`}</${Card}>`;
    if (st === "ready") return html`<${Card} title="Certificate of Analysis" actions=${html`<${Tag} label="Ready to generate" tone="amber" icon="certificate" />`}><span class="t-sm c-sec">Every batch is completed with its signed RoA. ${can("coa.write") ? "Generate the CoA to build and publish it in Reports." : "The lab admin generates the CoA."}</span>
      <${BuiltFrom} bs=${bs} />${can("coa.write") && html`<div class="row"><${Button} type="primary" icon="certificate" id="gen-coa" onClick=${gen}>Generate CoA</${Button}></div>`}</${Card}>`;
    if (st === "draft") return html`<${Card} title="Certificate of Analysis" actions=${html`<${Tag} label="Draft in progress" icon="pencil-simple" />`}><span class="t-sm c-sec">A draft is being built in Reports.</span>${can("coa.write") && html`<div class="row"><${Button} type="primary" onClick=${() => go("report-draft-" + o.no)}>Continue draft</${Button}></div>`}</${Card}>`;
    return html`<${Card} title="Certificate of Analysis" head=${html`<${Badge} label=${st === "sent" ? "Delivered" : "Published"} tone=${st === "sent" ? "green" : "blue"} />`} actions=${html`<${Button} icon="file-pdf" onClick=${() => toast(c.no + ".pdf downloaded (sample file)")}>Download PDF</${Button}><${Button} icon="printer" onClick=${() => toast("Printing is not available in the prototype", { tone: "info" })}>Print</${Button}>${can("coa.send") && html`<${Button} type="primary" icon="paper-plane-tilt" id="mark-sent" onClick=${() => setSend(true)}>${c.sends.length ? "Add another send" : "Mark sent"}</${Button}>`}`}>
      <div><${KV} k="Number"><span class="t-data">${c.no}</span></${KV}><${KV} k="Revision">${c.rev}</${KV}><${KV} k="Published"><span class="row g10"><span>${fmtDate(c.published)}</span><span class="c-brand">${c.by}</span></span></${KV}>
        <${KV} k="Signatory"><span class="row g10"><span>${sg ? sg.name : "—"}</span><span class="c-brand">${sg ? sg.title : ""}</span></span></${KV}><${KV} k="Covers"><span class="row g10"><span>${plural(bs.length, "batch", "batches")}</span><span class="c-brand">${plural(o.samples.filter((s) => s.batch).length, "sample")}</span></span></${KV}></div>
      ${c.sends.map((x, i) => html`<div key=${i} class="row g8 wrap" style=${{ background: "var(--feedback-success-100)", borderRadius: "10px", padding: "10px 12px" }}><${Icon} n=${x.channels.includes("WhatsApp") ? "whatsapp-logo" : x.channels.includes("Email") ? "envelope-simple" : "paper-plane-tilt"} cls="c-ok" /><span class="t-sm">Sent by ${x.channels.join(" and ")} to</span><b class="t-sm w6">${x.recipient}</b><span class="t-sm c-sec">${fmtDate(x.date)}</span></div>`)}
      <div class="row"><button class="linkbtn" onClick=${() => go("report-" + c.no)}><${Icon} n="arrow-right" />Open in Reports</button></div>
      <${BuiltFrom} bs=${bs} />${send && SH.MarkSent && html`<${SH.MarkSent} coas=${[c.no]} onClose=${() => setSend(false)} onDone=${() => setSend(false)} />`}</${Card}>`;
  }
  function BuiltFrom({ bs }) {
    return html`<div class="col g8"><span class="t-sm w6">Built from</span>${bs.map((b) => html`<div key=${b.no} class="row g10 wrap" style=${{ background: "var(--primary-50)", borderRadius: "10px", padding: "10px 12px" }}><${Icon} n="check-circle" cls="c-ok" /><${RecLink} to=${"batch-" + b.no} cls="t-data-b">${b.no}</${RecLink}>${b.roa && html`<${RecLink} to=${"roa-" + b.roa.no} cls="t-data c-sec">${b.roa.no}</${RecLink}>`}<span class="t-cap c-sec">${b.completed ? "Approved by " + b.completed.by : "Not completed"}</span></div>`)}</div>`;
  }
  function HistoryTab({ o }) {
    const { db } = useApp();
    const keys = [o.no].concat(o.samples.map((s) => s.id), S.batchesOf(db, o.no).map((b) => b.no), o.coas.map((c) => c.no));
    const rows = db.audit.filter((a) => keys.includes(a.rec));
    const List = SH.AuditList;
    return html`<${Card} title="History">${rows.length ? (List ? html`<${List} rows=${rows} />` : null) : html`<span class="t-sm c-mut">No changes recorded yet.</span>`}</${Card}>`;
  }
  function CancelDlg({ o, onClose }) {
    const { update, toast, api } = useApp(); const [r, setR] = useState(""), [e, setE] = useState(null);
    return html`<${Confirm} title=${"Cancel " + o.no + "?"} text="No sample has been received yet, so the job order can be cancelled. It stays in the list as Cancelled." ok="Cancel job order" cancel="Keep job order" danger onClose=${onClose}
      onOk=${() => { if (!r.trim()) return setE("Give the reason"); update((d) => { const x = d.orders.find((y) => y.no === o.no); x.status = "cancelled"; x.cancelReason = r; api.audit(d, "Job order", o.no, "Status changed", [["Status", ST[o.status][0], "Cancelled"], ["Reason", "", r]], "Job order"); }); onClose(); toast(o.no + " cancelled"); }}>
      <${TextField} id="cancel-reason" label="Reason" req value=${r} onChange=${(v) => { setR(v); setE(null); }} error=${e} placeholder="e.g. Client postponed the campaign" /></${Confirm}>`;
  }
  function CloseDlg({ o, onClose }) {
    const { update, toast, api } = useApp();
    return html`<${Confirm} title=${"Close " + o.no + "?"} text="The job order is delivered. Closing it keeps every record and takes it off the open lists." ok="Close job order" onClose=${onClose}
      onOk=${() => { update((d) => { d.orders.find((y) => y.no === o.no).status = "closed"; api.audit(d, "Job order", o.no, "Status changed", [["Status", "Delivered", "Closed"]], "Job order"); }); onClose(); toast(o.no + " closed"); }} />`;
  }

  ROUTES.push({ re: /^orders$/, nav: "orders", render: () => html`<${List} />` }, { re: /^order-(JO-\d{4}-\d{4})(?:-(\w+))?$/, nav: "orders", render: (m) => html`<${Detail} no=${m[1]} tab=${m[2]} />` });
  FLOWS.push(
    { id: "JO1", group: "Job orders", title: "Create a job order", role: "cso", steps: "New job order, PT Bara Nusantara Mandiri, contact, Standard, quick select, pills, expected samples, Submit; the Samples tab opens.", start: { hash: "orders" } },
    { id: "JO2", group: "Job orders", title: "Draft and validation", role: "cso", steps: "New job order, Submit with nothing filled: Fix 3 fields. Fill the company only and Save as draft.", start: { hash: "orders" } },
    { id: "JO3", group: "Job orders", title: "Contacts and signatory", role: "cso", steps: "In New job order: add, edit and remove a contact; add a signatory. The client page shows the same contacts.", start: { hash: "orders" } },
    { id: "JO4", group: "Job orders", title: "Ash checklist and coking standards", role: "cso", steps: "Ash analysis, search, Done. Standard ASTM + GB/T, Coking coal: pills show their tags.", start: { hash: "orders" } },
    { id: "JO5", group: "Job orders", title: "Register samples", role: "cso", steps: "JO-2026-0134 Samples: Paste from Excel, Use sample rows (1 duplicate), Add rows, Save. Rows of JO-2026-0139 are locked.", start: { hash: "order-JO-2026-0134-samples" } },
    { id: "JO6", group: "Job orders", title: "Add a batch", role: "lab_admin", steps: "JO-2026-0137 Batches, Add batch, Create batch with the 8 remaining samples.", start: { hash: "order-JO-2026-0137-batches" } },
    { id: "JO7", group: "Job orders", title: "Generate and send the CoA", role: "lab_admin", steps: "JO-2026-0141 CoA tab, Generate CoA, publish it in Reports (RE2); then as CSO Mark sent with two channels.", start: { hash: "order-JO-2026-0141-coa" } },
    { id: "JO8", group: "Job orders", title: "Edit, cancel, close", role: "cso", steps: "JO-2026-0134 ⋯ Edit, then Cancel with a reason; JO-2026-0133 ⋯ Close.", start: { hash: "order-JO-2026-0134" } },
    { id: "JO9", group: "Job orders", title: "Create on a phone", role: "cso", steps: "Phone width: New job order, step 1, Next, step 2, Submit.", start: { hash: "orders" } },
    { id: "JO10", group: "Job orders", title: "Mark a sample not received", role: "cso", steps: "JO-2026-0139 Samples: restore MCR-2208, then mark MCR-2206 not received.", start: { hash: "order-JO-2026-0139-samples" } },
    { id: "JO11", group: "Job orders", title: "Files and history", role: "cso", steps: "JO-2026-0142 Files: add a file. History: see the changes.", start: { hash: "order-JO-2026-0142-files" } },
    { id: "JO12", group: "Job orders", title: "Read-only visit", role: "prep", steps: "Preparation opens JO-2026-0139: Samples has no edit controls; Add batch is still on the Batches tab.", start: { hash: "order-JO-2026-0139-samples" } },
  );
})();
