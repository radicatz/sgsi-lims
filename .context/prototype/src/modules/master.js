/* Master data (Master_Data_Prototype_Plan.md): clients and the client page, drill hole with CoA, lithology, seam. */
(function () {
  const ST_TONE = { Active: "green", Inactive: "grey", Archived: "outline" };
  const coName = (db, id) => (S.client(db, id) || {}).name || id;
  const used = (db, cl) => db.orders.some((o) => o.client === cl);

  function MasterList({ title, overline, add, addLabel, search, chips, chip, setChip, extra, rows, cols, empty, children }) {
    const { bp } = useApp();
    return html`<${Page}><${PageHead} overline=${overline} title=${title} actions=${bp !== "phone" && add} />
      <div class="row g12 wrap" style=${{ alignItems: "flex-end" }}>${search}${extra}</div>${chips && html`<${Chips} scroll items=${chips} value=${chip} onChange=${setChip} />`}
      ${children}${bp === "phone" && add && html`<div class="sticky-bar">${add}</div>`}</${Page}>`;
  }

  /* ---------- clients ---------- */
  function Clients() {
    const { db, go, can, bp, update, toast, api } = useApp();
    const write = can("company.manage");
    const [q, setQ] = useState(""), [st, setSt] = useState("all"), [form, setForm] = useState(null), [arch, setArch] = useState(null);
    const base = db.clients.filter((c) => !q || (c.name + c.id).toLowerCase().includes(q.toLowerCase()));
    const rows = base.filter((c) => (st === "all" ? c.status !== "Archived" : c.status === st));
    const pg = usePaged(rows, 10, q + st);
    const total = (c) => db.orders.filter((o) => o.client === c.id).reduce((a, o) => a + o.samples.length, 0);
    return html`<${MasterList} overline="Master data" title="Clients" add=${write && html`<${Button} type="primary" size="lg" icon="plus" id="add-client" onClick=${() => setForm("new")}>Add client</${Button}>`}
      search=${html`<${Search} id="cl-q" value=${q} onChange=${setQ} placeholder="Search client name or code" style=${{ width: bp === "phone" ? "100%" : "320px" }} />`}
      chips=${[{ id: "all", label: "All", count: base.filter((c) => c.status !== "Archived").length }, { id: "Active", label: "Active", count: base.filter((c) => c.status === "Active").length }, { id: "Inactive", label: "Inactive", count: base.filter((c) => c.status === "Inactive").length }, { id: "Archived", label: "Archived", count: base.filter((c) => c.status === "Archived").length }]} chip=${st} setChip=${setSt}>
      ${bp === "phone" ? html`<div class="col g10">${pg.rows.map((c) => html`<div key=${c.id} class="mcard" onClick=${() => go("client-" + c.id)}><div class="row g10"><${Avatar} name=${c.name} size=${40} logo=${c.logo} /><div class="col grow" style=${{ gap: 0 }}><b class="t-sm w6">${c.name}</b><span class="t-cap c-sec row g6"><span>${c.id}</span><span>${plural(total(c), "sample")}</span></span></div><${Badge} label=${c.status} tone=${ST_TONE[c.status]} sm /></div></div>`)}</div>`
      : html`<${Card}><${Table} rows=${pg.rows} keyOf=${(c) => c.id} onRow=${(c) => go("client-" + c.id)} cols=${[{ h: "Client", render: (c) => html`<span class="row g10"><${Avatar} name=${c.name} size=${40} logo=${c.logo} /><b class="t-sm w6">${c.name}</b></span>` }, { h: "Code", render: (c) => html`<span class="t-data">${c.id}</span>` },
        bp === "desktop" && { h: "Address", render: (c) => html`<span class="t-sm c-sec">${c.address}</span>` }, { h: "Status", render: (c) => html`<${Badge} label=${c.status} tone=${ST_TONE[c.status]} sm />` }, { h: "Total sample", cls: "r", render: (c) => total(c) }, bp === "desktop" && { h: "Created", render: (c) => fmtDate(c.created) },
        write && { h: "", cls: "r", render: (c) => html`<span class="row g4" style=${{ justifyContent: "flex-end" }}><button class="linkbtn" onClick=${(e) => { e.stopPropagation(); setForm(c.id); }}>Edit</button><${Menu} label=${"More for " + c.name} items=${[c.status === "Archived" ? { label: "Restore", icon: "arrow-counter-clockwise", onClick: () => { update((d) => (d.clients.find((x) => x.id === c.id).status = "Active")); toast(c.name + " restored"); } } : { label: "Archive", icon: "archive", onClick: () => setArch(c) }, !used(db, c.id) && { label: "Delete", icon: "trash", danger: true, onClick: () => { update((d) => (d.clients = d.clients.filter((x) => x.id !== c.id))); toast(c.name + " deleted"); } }]} /></span>` }].filter(Boolean)}
        empty=${html`<${Empty} icon="buildings" title="No clients yet" text="Add the first client to start taking job orders." />`} /><${Pager} ...${pg.pager} /></${Card}>`}
      ${form && html`<${ClientForm} id=${form === "new" ? null : form} onClose=${() => setForm(null)} />`}
      ${arch && html`<${Confirm} title=${"Archive " + arch.name + "?"} text="It stays on its job orders and reports, but no new job order can pick it. You can restore it later." ok="Archive" onClose=${() => setArch(null)} onOk=${() => { update((d) => { d.clients.find((x) => x.id === arch.id).status = "Archived"; api.audit(d, "Master data", arch.name, "Updated", [["Status", arch.status, "Archived"]], "Clients"); }); setArch(null); toast(arch.name + " archived"); }} />`}</${MasterList}>`;
  }
  function ClientForm({ id, onClose }) {
    const { db, update, toast, go, bp, api } = useApp();
    const c = id && S.client(db, id);
    const [f, setF] = useState(c ? { name: c.name, code: c.id, status: c.status, address: c.address, billing: c.billing || "", same: !c.billing, logo: c.logoFile || null } : { name: "", code: "", status: "Active", address: "", billing: "", same: true, logo: null });
    const [e, setE] = useState({}); const set = (p) => setF(Object.assign({}, f, p));
    const save = () => { const er = {}; if (!f.name.trim()) er.name = "Enter the client name"; if (!f.code.trim()) er.code = "Enter a short code"; else if (!c && db.clients.some((x) => x.id === f.code.toUpperCase())) er.code = f.code.toUpperCase() + " is already used"; setE(er); if (Object.keys(er).length) return;
      update((d) => { if (c) { const x = d.clients.find((y) => y.id === id); Object.assign(x, { name: f.name, short: f.name.replace(/^(PT|CV)\s+/, ""), status: f.status, address: f.address, billing: f.same ? "" : f.billing, logo: f.logo ? x.logo : null, logoFile: f.logo }); }
        else d.clients.push({ id: f.code.toUpperCase(), name: f.name, short: f.name.replace(/^(PT|CV)\s+/, ""), status: f.status, address: f.address, created: D.TODAY, contacts: [], logoFile: f.logo }); api.audit(d, "Master data", f.name, c ? "Updated" : "Created", [["Client", "", f.name]], "Clients"); });
      onClose(); toast(c ? f.name + " saved" : f.name + " added"); if (!c) go("client-" + f.code.toUpperCase()); };
    return html`<${Dialog} title=${c ? "Edit client" : "Add client"} full onClose=${onClose} id="client-form" footer=${html`<${Button} onClick=${onClose}>Cancel</${Button}><${Button} type="primary" id="cl-save" onClick=${save}>Save client</${Button}>`}>
      ${f.logo ? html`<div class="row g12"><span class="av s64 logo-ptba" style=${{ borderRadius: "12px" }}></span><div class="col grow" style=${{ gap: 0 }}><span class="t-sm w5">${f.logo.name}</span><span class="t-cap c-sec">${f.logo.dims || ""} ${fileSize(f.logo.size)}</span></div><${Button} size="sm" onClick=${() => set({ logo: null })}>Remove</${Button}></div>`
        : html`<${DropZone} text="Drop or click to add logo" hint="PNG or SVG, shown round at 40 and 64 px" accept="image/*" onFile=${(x) => set({ logo: Object.assign(x, { dims: "960 × 270" }) })} />`}
      <div class="grid" style=${{ gridTemplateColumns: bp === "phone" ? "1fr" : "2fr 1fr", gap: "16px" }}><${TextField} id="cl-name" label="Name" req value=${f.name} onChange=${(v) => set({ name: v })} placeholder="Client name" error=${e.name} /><${TextField} id="cl-code" label="Code" req value=${f.code} onChange=${(v) => set({ code: v })} placeholder="Short, unique, e.g. BNM" disabled=${!!c} error=${e.code} mono /></div>
      <${Select} label="Status" value=${f.status} onChange=${(v) => set({ status: v })} options=${["Active", "Inactive"]} />
      <${TextArea} label="Address" value=${f.address} onChange=${(v) => set({ address: v })} /><${Check} on=${f.same} onChange=${(v) => set({ same: v })} label="Billing address same as address" />${!f.same && html`<${TextArea} label="Billing address" value=${f.billing} onChange=${(v) => set({ billing: v })} />`}</${Dialog}>`;
  }
  function ClientPage({ id }) {
    const { db, go, can, bp, update, toast, api } = useApp();
    const c = S.client(db, id), write = can("company.manage");
    const [form, setForm] = useState(false), [ct, setCt] = useState(null);
    if (!c) return html`<${Page}><${Card}><${Empty} icon="question" title="This client was not found" /></${Card}></${Page}>`;
    const jos = db.orders.filter((o) => o.client === id).sort((a, b) => (a.no < b.no ? 1 : -1));
    const coas = S.allCoas(db).filter((x) => x.client === id && x.rev > 0);
    const holes = db.drill.filter((d) => d.cl === id);
    return html`<${Page}><${PageHead} crumb=${[["Clients", "clients"], [c.name]]} title=${html`<span class="row g16"><${Avatar} name=${c.name} size=${64} logo=${c.logo} /><span>${c.name}</span></span>`} badge=${html`<${Badge} label=${c.status} tone=${ST_TONE[c.status]} />`}
        actions=${write && html`<${Button} icon="pencil-simple" onClick=${() => setForm(true)}>Edit</${Button}><${Menu} size=${36} items=${[{ label: c.status === "Archived" ? "Restore" : "Archive", icon: "archive", onClick: () => { update((d) => (d.clients.find((x) => x.id === id).status = c.status === "Archived" ? "Active" : "Archived")); toast(c.name + (c.status === "Archived" ? " restored" : " archived")); } }]} />`} />
      <div class="grid" style=${{ gridTemplateColumns: bp === "desktop" ? "minmax(0,0.8fr) minmax(0,1.2fr)" : "1fr", alignItems: "start" }}>
        <${Card} title="Details"><div><${KV} k="Code"><span class="t-data">${c.id}</span></${KV}><${KV} k="Address">${c.address || "—"}</${KV}><${KV} k="Billing address">${c.billing || "Same as address"}</${KV}><${KV} k="Created">${fmtDate(c.created)}</${KV}><${KV} k="Job orders">${jos.length}</${KV}><${KV} k="Drill holes">${holes.length}</${KV}></div></${Card}>
        <${Card} title="Contacts" actions=${write && html`<${Button} size="sm" icon="plus" id="add-contact" onClick=${() => setCt({})}>Add contact</${Button}>`}>
          ${c.contacts.length ? html`<${Table} rows=${c.contacts} cols=${[{ h: "Name", render: (x) => html`<span class="row g8"><b class="t-sm w6">${x.name}</b>${x.def && html`<${Tag} label="Default" tone="blue" />`}</span>` }, { h: "Position", k: "position" }, bp !== "phone" && { h: "Email", render: (x) => x.email || "—" }, { h: "Phone", k: "phone" },
            write && { h: "", cls: "r", render: (x) => html`<${Menu} label=${"More for " + x.name} items=${[{ label: "Edit", icon: "pencil-simple", onClick: () => setCt(x) }, !x.def && { label: "Make default", icon: "check", onClick: () => { update((d) => d.clients.find((y) => y.id === id).contacts.forEach((y) => (y.def = y.id === x.id))); toast(x.name + " is the default contact"); } }, !x.def && { label: "Archive", icon: "archive", onClick: () => { update((d) => { const cl = d.clients.find((y) => y.id === id); cl.contacts = cl.contacts.filter((y) => y.id !== x.id); }); toast(x.name + " archived"); } }]} />` }].filter(Boolean)} />`
            : html`<span class="t-sm c-mut">No contacts yet.</span>`}<${Note}>The default contact is pre-filled as Attention on new job orders. The job order form adds and edits the same contacts.</${Note}></${Card}></div>
      <${Card} title="Job orders"><${Table} rows=${jos.slice(0, 8)} onRow=${(o) => go("order-" + o.no)} cols=${[{ h: "No.", render: (o) => html`<span class="t-data-b">${o.no}</span>` }, { h: "Service", render: (o) => (D.SERVICES.find((s) => s.id === o.service) || {}).label }, { h: "Due", render: (o) => fmtDate(o.due) }, { h: "Status", render: (o) => html`<${Badge} label=${D.JO_STATUS[o.status][0]} tone=${D.JO_STATUS[o.status][1]} sm />` }]} empty=${html`<span class="t-sm c-mut">No job orders yet.</span>`} /></${Card}>
      <${Card} title="Certificates">${coas.length ? html`<${Table} rows=${coas.slice(0, 8)} keyOf=${(x) => x.no} onRow=${(x) => go("report-" + x.no)} cols=${[{ h: "CoA", render: (x) => html`<span class="t-data">${x.no}</span>` }, { h: "Published", render: (x) => fmtDate(x.published) }, { h: "Status", render: (x) => html`<${Badge} label=${D.COA_STATUS[x.status][0]} tone=${D.COA_STATUS[x.status][1]} sm />` }]} />` : html`<span class="t-sm c-mut">No certificates yet.</span>`}</${Card}>
      ${form && html`<${ClientForm} id=${id} onClose=${() => setForm(false)} />`}${ct && html`<${ContactForm} cl=${c} x=${ct} onClose=${() => setCt(null)} />`}</${Page}>`;
  }
  function ContactForm({ cl, x, onClose }) {
    const { update, toast, api } = useApp(); const [f, setF] = useState(Object.assign({ name: "", position: "", email: "", phone: "+62 ", def: false }, x)), [e, setE] = useState(null);
    const set = (p) => setF(Object.assign({}, f, p));
    return html`<${Dialog} title=${x.id ? "Edit contact" : "Add contact"} onClose=${onClose} id="contact-form" footer=${html`<${Button} onClick=${onClose}>Cancel</${Button}><${Button} type="primary" id="ct-save" onClick=${() => { if (!f.name.trim()) return setE("Enter the name");
        update((d) => { const c = d.clients.find((y) => y.id === cl.id); if (f.def) c.contacts.forEach((y) => (y.def = false)); if (x.id) Object.assign(c.contacts.find((y) => y.id === x.id), f); else c.contacts.push(Object.assign({}, f, { id: "c" + Date.now() })); if (!c.contacts.some((y) => y.def)) c.contacts[0].def = true; api.audit(d, "Master data", f.name, x.id ? "Updated" : "Created", [["Contact", "", f.name]], "Client page"); });
        onClose(); toast(x.id ? "Contact saved" : f.name + " added"); }}>Save contact</${Button}>`}>
      <${TextField} id="ct-name" label="Name" req value=${f.name} onChange=${(v) => set({ name: v })} error=${e} /><${TextField} label="Position" value=${f.position} onChange=${(v) => set({ position: v })} />
      <${TextField} label="Email" value=${f.email} onChange=${(v) => set({ email: v })} /><${TextField} label="Phone" value=${f.phone} onChange=${(v) => set({ phone: v })} />
      <${Switch} id="ct-def" on=${f.def} onChange=${(v) => set({ def: v })} label="Default contact (pre-fills Attention on new job orders)" /></${Dialog}>`;
  }

  /* ---------- drill hole ---------- */
  function CoaUpload({ code, onClose }) {
    const { db, update, toast, me, api } = useApp(); const [file, setFile] = useState(null);
    return html`<${Dialog} title=${"Upload CoA for " + code} sub="The file is attached to the drill hole and shows on the dashboard." onClose=${onClose} id="coa-upload" footer=${html`<${Button} onClick=${onClose}>Cancel</${Button}><${Button} type="primary" id="cu-upload" disabled=${!file} onClick=${() => { update((d) => { const x = d.drill.find((y) => y.code === code); const h = { file: file.name, at: D.TODAY, by: me.name }; x.coa = { file: file.name, at: D.TODAY, history: ((x.coa && x.coa.history) || []).concat([h]) }; api.audit(d, "Master data", code, "Updated", [["CoA", "", file.name]], "Drill hole, Upload CoA"); }); onClose(); toast("CoA uploaded for " + code); }}>Upload</${Button}>`}>
      ${file ? html`<div class="row g10"><${FileChip} label=${file.name} /><span class="t-cap c-mut">${fileSize(file.size)}</span><${IconBtn} n="trash" label="Remove file" onClick=${() => setFile(null)} /></div>` : html`<${DropZone} text="Drop the CoA here, or click to browse" onFile=${setFile} />`}
      ${!file && html`<button class="linkbtn" id="cu-sample" onClick=${() => setFile({ name: "CoA-" + code.slice(3) + ".pdf", size: 238000 })}>Use a sample CoA file</button>`}</${Dialog}>`;
  }
  SH.CoaUpload = CoaUpload;
  function DrillHoles() {
    const { db, can, bp, update, toast, api } = useApp(); const write = can("master.write"), up = can("coa.upload");
    const [q, setQ] = useState(""), [co, setCo] = useState(""), [st, setSt] = useState("all"), [dlg, setDlg] = useState(null);
    const base = db.drill.filter((d) => (!q || (d.code + d.desc).toLowerCase().includes(q.toLowerCase())) && (!co || d.cl === co));
    const rows = base.filter((d) => (st === "all" ? d.status === "Active" : st === "missing" ? d.status === "Active" && !d.coa : d.status === "Archived"));
    const pg = usePaged(rows, 10, q + co + st);
    return html`<${MasterList} overline="Master data" title="Drill hole" add=${write && html`<${Button} icon="upload-simple" onClick=${() => toast("Import is designed later (S-16)", { tone: "info" })}>Import</${Button}><${Button} type="primary" size="lg" icon="plus" id="add-dh" onClick=${() => setDlg({ k: "form" })}>Add drill hole</${Button}>`}
      search=${html`<${Search} value=${q} onChange=${setQ} placeholder="Search code or description" style=${{ width: bp === "phone" ? "100%" : "300px" }} />`} extra=${html`<${Select} label="Company" value=${co} onChange=${setCo} options=${[["", "All companies"]].concat(db.clients.filter((c) => c.status === "Active").map((c) => [c.id, c.name]))} style=${{ width: bp === "phone" ? "100%" : "220px" }} />`}
      chips=${[{ id: "all", label: "All", count: base.filter((d) => d.status === "Active").length }, { id: "missing", label: "Missing CoA", count: base.filter((d) => d.status === "Active" && !d.coa).length }, { id: "archived", label: "Archived", count: base.filter((d) => d.status === "Archived").length }]} chip=${st} setChip=${setSt}>
      ${!write && html`<${Note}>Read only. The lab admin edits drill holes and uploads their CoAs.</${Note}>`}
      <${Card}><${Table} rows=${pg.rows} keyOf=${(d) => d.code} cols=${[{ h: "Code", render: (d) => html`<b class="t-data-b">${d.code}</b>` }, { h: "Description", k: "desc" }, { h: "Total sample", cls: "r", render: (d) => d.samples }, bp !== "phone" && { h: "Company", render: (d) => coName(db, d.cl) },
        { h: "CoA", render: (d) => d.coa ? html`<span class="row g6"><${Tag} label="CoA uploaded" tone="green" icon="check-circle" />${bp === "desktop" && html`<span class="t-cap c-sec">${d.coa.file}</span>`}</span>` : html`<span class="row g8"><${Tag} label="CoA missing" icon="file-x" />${up && d.status === "Active" && html`<${Button} id=${"up-" + d.code} icon="upload-simple" onClick=${() => setDlg({ k: "up", code: d.code })}>Upload CoA</${Button}>`}</span>` },
        write && { h: "", cls: "r", render: (d) => html`<span class="row g4" style=${{ justifyContent: "flex-end" }}><button class="linkbtn" onClick=${() => setDlg({ k: "form", d })}>Edit</button><${Menu} label=${"More for " + d.code} items=${[d.coa && { label: "CoA history", icon: "clock-counter-clockwise", onClick: () => setDlg({ k: "hist", d }) }, d.coa && up && { label: "Replace CoA", icon: "upload-simple", onClick: () => setDlg({ k: "up", code: d.code }) },
          { label: d.status === "Archived" ? "Restore" : "Archive", icon: "archive", onClick: () => { update((x) => (x.drill.find((y) => y.code === d.code).status = d.status === "Archived" ? "Active" : "Archived")); toast(d.code + (d.status === "Archived" ? " restored" : " archived")); } }, !d.samples && { label: "Delete", icon: "trash", danger: true, onClick: () => { update((x) => (x.drill = x.drill.filter((y) => y.code !== d.code))); toast(d.code + " deleted"); } }]} /></span>` }].filter(Boolean)} />
        <${Pager} ...${pg.pager} /></${Card}>
      ${dlg && dlg.k === "up" && html`<${CoaUpload} code=${dlg.code} onClose=${() => setDlg(null)} />`}
      ${dlg && dlg.k === "hist" && html`<${Dialog} title="CoA history" sub=${dlg.d.code} onClose=${() => setDlg(null)} footer=${html`<${Button} type="primary" onClick=${() => setDlg(null)}>Done</${Button}>`}>${dlg.d.coa.history.slice().reverse().map((h, i) => html`<div key=${i} class="row g10"><${FileChip} label=${h.file} /><span class="t-cap c-sec grow">${h.by}, ${fmtDate(h.at)}</span>${i === 0 && html`<${Tag} label="Current" tone="green" />`}<${IconBtn} n="download-simple" label=${"Download " + h.file} onClick=${() => toast(h.file + " downloaded (sample file)")} /></div>`)}</${Dialog}>`}
      ${dlg && dlg.k === "form" && html`<${SimpleForm} title=${dlg.d ? "Edit drill hole" : "Add drill hole"} saveLabel="Save drill hole" fields=${[["cl", "Company", "select", true], ["code", "Code", "text", true], ["desc", "Description", "text"]]} init=${dlg.d || { cl: "BNM", code: "DH-BNM-0" + (db.drill.filter((d) => d.cl === "BNM").length + 5), desc: "" }}
        onSave=${(f) => { update((x) => { if (dlg.d) Object.assign(x.drill.find((y) => y.code === dlg.d.code), f); else x.drill.unshift(Object.assign({ samples: 0, status: "Active", coa: null }, f)); api.audit(x, "Master data", f.code, dlg.d ? "Updated" : "Created", [["Drill hole", "", f.code]], "Drill hole"); }); toast(f.code + " saved"); setDlg(null); }} onClose=${() => setDlg(null)} />`}</${MasterList}>`;
  }
  function SimpleForm({ title, saveLabel, fields, init, onSave, onClose, children }) {
    const { db } = useApp(); const [f, setF] = useState(Object.assign({}, init)), [e, setE] = useState(null);
    return html`<${Dialog} title=${title} full onClose=${onClose} id="simple-form" footer=${html`<${Button} onClick=${onClose}>Cancel</${Button}><${Button} type="primary" id="sf-save" onClick=${() => { const m = fields.find((x) => x[3] && !String(f[x[0]] || "").trim()); if (m) return setE(m[1] + " is required"); onSave(f); }}>${saveLabel}</${Button}>`}>
      ${fields.map(([k, l, t, req, opts]) => t === "select" ? html`<${Select} key=${k} label=${l} req=${req} value=${f[k]} onChange=${(v) => setF(Object.assign({}, f, { [k]: v }))} options=${db.clients.filter((c) => c.status === "Active").map((c) => [c.id, c.name])} />`
        : t === "radio" ? html`<div key=${k} class="field"><span class="flabel">${l}</span><div class="row g16 wrap">${opts.map((o) => html`<${Radio} key=${o} on=${f[k] === o} label=${o} onChange=${() => setF(Object.assign({}, f, { [k]: o }))} />`)}</div></div>`
        : html`<${TextField} key=${k} id=${"sf-" + k} label=${l} req=${req} value=${f[k]} onChange=${(v) => setF(Object.assign({}, f, { [k]: v }))} mono=${k === "code"} />`)}${e && html`<span class="help err">${e}</span>`}${children}</${Dialog}>`;
  }

  /* ---------- lithology and seam ---------- */
  function Lithology() {
    const { db, can, bp, update, toast } = useApp(); const write = can("master.write");
    const [q, setQ] = useState(""), [co, setCo] = useState(""), [k, setK] = useState("all"), [dlg, setDlg] = useState(null);
    const base = db.litho.filter((l) => (!q || l.name.toLowerCase().includes(q.toLowerCase())) && (!co || l.cl === co));
    const rows = base.filter((l) => (k === "all" ? l.status === "Active" : k === "Archived" ? l.status === "Archived" : l.kind === k && l.status === "Active"));
    return html`<${MasterList} overline="Master data" title="Lithology" add=${write && html`<${Button} icon="upload-simple" onClick=${() => toast("Import is designed later (S-16)", { tone: "info" })}>Import</${Button}><${Button} type="primary" size="lg" icon="plus" onClick=${() => setDlg({})}>Add lithology</${Button}>`}
      search=${html`<${Search} value=${q} onChange=${setQ} placeholder="Search lithology name" style=${{ width: bp === "phone" ? "100%" : "300px" }} />`} extra=${html`<${Select} label="Company" value=${co} onChange=${setCo} options=${[["", "All companies"]].concat(db.clients.filter((c) => c.status === "Active").map((c) => [c.id, c.name]))} style=${{ width: bp === "phone" ? "100%" : "220px" }} />`}
      chips=${[["all", "All"], ["Coal", "Coal"], ["Parting", "Parting"], ["No lithology", "No lithology"], ["Archived", "Archived"]].map(([id, l]) => ({ id, label: l, count: base.filter((x) => (id === "all" ? x.status === "Active" : id === "Archived" ? x.status === "Archived" : x.kind === id && x.status === "Active")).length }))} chip=${k} setChip=${setK}>
      ${!write && html`<${Note}>Read only. The lab admin edits lithologies.</${Note}>`}
      <${Card}><${Table} rows=${rows} cols=${[{ h: "Name", render: (l) => html`<b class="t-sm w6">${l.name}</b>` }, { h: "Kind", render: (l) => html`<${Tag} label=${l.kind} tone=${l.kind === "Coal" ? "blue" : l.kind === "Parting" ? "amber" : "outline"} />` }, { h: "Total sample", cls: "r", render: (l) => l.samples }, bp !== "phone" && { h: "Company", render: (l) => coName(db, l.cl) },
        write && { h: "", cls: "r", render: (l) => html`<span class="row g4" style=${{ justifyContent: "flex-end" }}><button class="linkbtn" onClick=${() => setDlg(l)}>Edit</button><${Menu} items=${[{ label: "Archive", icon: "archive", onClick: () => { update((d) => (d.litho.find((x) => x.id === l.id).status = "Archived")); toast(l.name + " archived"); } }]} /></span>` }].filter(Boolean)} /></${Card}>
      ${dlg && html`<${SimpleForm} title=${dlg.id ? "Edit lithology" : "Add lithology"} saveLabel="Save lithology" fields=${[["cl", "Company", "select", true], ["name", "Name", "text", true], ["kind", "Kind", "radio", true, ["Coal", "Parting", "No lithology"]]]} init=${dlg.id ? dlg : { cl: "KEP", name: "", kind: "Parting" }}
        onSave=${(f) => { update((d) => { if (dlg.id) Object.assign(d.litho.find((x) => x.id === dlg.id), f); else d.litho.push(Object.assign({ id: "l" + Date.now(), samples: 0, status: "Active" }, f)); }); toast(f.name + " saved"); setDlg(null); }} onClose=${() => setDlg(null)} />`}</${MasterList}>`;
  }
  function Seams() {
    const { db, can, bp, update, toast } = useApp(); const write = can("master.write");
    const [q, setQ] = useState(""), [co, setCo] = useState(""), [st, setSt] = useState("all"), [dlg, setDlg] = useState(null);
    const base = db.seams.filter((s) => (!q || s.code.toLowerCase().includes(q.toLowerCase())) && (!co || s.cl === co));
    const rows = base.filter((s) => (st === "all" ? s.status === "Active" : s.status === "Archived"));
    const pg = usePaged(rows, 12, q + co + st);
    return html`<${MasterList} overline="Master data" title="Seam" add=${write && html`<${Button} icon="upload-simple" onClick=${() => toast("Import is designed later (S-16)", { tone: "info" })}>Import</${Button}><${Button} type="primary" size="lg" icon="plus" onClick=${() => setDlg({})}>Add seam</${Button}>`}
      search=${html`<${Search} value=${q} onChange=${setQ} placeholder="Search seam code" style=${{ width: bp === "phone" ? "100%" : "300px" }} />`} extra=${html`<${Select} label="Company" value=${co} onChange=${setCo} options=${[["", "All companies"]].concat(db.clients.filter((c) => c.status === "Active").map((c) => [c.id, c.name]))} style=${{ width: bp === "phone" ? "100%" : "220px" }} />`}
      chips=${[{ id: "all", label: "All", count: base.filter((s) => s.status === "Active").length }, { id: "Archived", label: "Archived", count: base.filter((s) => s.status === "Archived").length }]} chip=${st} setChip=${setSt}>
      ${!write && html`<${Note}>Read only. The lab admin edits seams.</${Note}>`}
      <${Card}><${Table} rows=${pg.rows} cols=${[{ h: "Code", render: (s) => html`<b class="t-data-b">${s.code}</b>` }, { h: "Description", k: "desc" }, { h: "Order", cls: "r", k: "order" }, bp !== "phone" && { h: "Company", render: (s) => coName(db, s.cl) },
        write && { h: "", cls: "r", render: (s) => html`<span class="row g4" style=${{ justifyContent: "flex-end" }}><button class="linkbtn" onClick=${() => setDlg(s)}>Edit</button><${Menu} items=${[{ label: "Archive", icon: "archive", onClick: () => { update((d) => (d.seams.find((x) => x.id === s.id).status = "Archived")); toast(s.code + " archived"); } }]} /></span>` }].filter(Boolean)} /><${Pager} ...${pg.pager} /></${Card}>
      ${dlg && html`<${SimpleForm} title=${dlg.id ? "Edit seam" : "Add seam"} saveLabel="Save seam" fields=${[["cl", "Company", "select", true], ["code", "Code", "text", true], ["desc", "Description", "text"], ["order", "Order", "text"]]} init=${dlg.id ? dlg : { cl: "KEP", code: "A2U3", desc: "Seam A2, upper 3", order: "8" }}
        onSave=${(f) => { update((d) => { if (dlg.id) Object.assign(d.seams.find((x) => x.id === dlg.id), f); else d.seams.push(Object.assign({ id: "s" + Date.now(), status: "Active" }, f)); }); toast(f.code + " saved"); setDlg(null); }} onClose=${() => setDlg(null)} />`}</${MasterList}>`;
  }

  ROUTES.push({ re: /^clients$/, nav: "clients", render: () => html`<${Clients} />` }, { re: /^client-(\w+)$/, nav: "clients", render: (m) => html`<${ClientPage} id=${m[1]} />` },
    { re: /^drill-holes$/, nav: "drill-holes", render: () => html`<${DrillHoles} />` }, { re: /^lithologies$/, nav: "lithologies", render: () => html`<${Lithology} />` }, { re: /^seams$/, nav: "seams", render: () => html`<${Seams} />` });
  FLOWS.push(
    { id: "MD1", group: "Master data", title: "Client page", role: "cso", steps: "Clients, PT Bara Nusantara Mandiri, Add contact with Default on; then New job order picks that contact.", start: { hash: "clients" } },
    { id: "MD2", group: "Master data", title: "Drill hole CoA", role: "lab_admin", steps: "Missing CoA chip, Upload CoA, use the sample file; CoA history. Switch to Supervisor: read only.", start: { hash: "drill-holes" } },
    { id: "MD3", group: "Master data", title: "Lithology and seam", role: "lab_admin", steps: "Edit Carbonaceous Claystone's kind; add a seam.", start: { hash: "lithologies" } },
  );
})();
