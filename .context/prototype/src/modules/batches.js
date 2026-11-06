/* Batches (Batch_Prototype_Plan.md): batch list, batch page with Reception, Preparation and Analysis tabs. */
(function () {
  const BS = D.B_STATUS;
  const NUMP = (b) => b.params.filter((p) => D.PARAM_INFO[p] && !["Ash analysis", "Trace elements", "Metal in ash", "Sizing", "Forms of sulfur"].includes(p));
  const GRP = { TM: "Moisture", IM: "Moisture", EQM: "Moisture", Ash: "Proximate", VM: "Proximate", FC: "Proximate", TS: "Sulfur", GCV: "Calorific", NCV: "Calorific", HGI: "Physical", RD: "Physical", C: "Ultimate", H: "Ultimate", N: "Ultimate", O: "Ultimate" };
  const fmtN = (v, p) => (v == null || v === "" ? "" : (+v).toFixed(D.PARAM_INFO[p] ? D.PARAM_INFO[p][3] : 2));
  const outOf = (db, p, v) => { const r = db.config.params.find((x) => x.code === p); return r && v !== "" && v != null && (+v < r.lo || +v > r.hi); };
  const tabFor = (b) => (["created", "receiving"].includes(b.status) ? "reception" : ["preparation", "prepfinished"].includes(b.status) ? (b.status === "prepfinished" ? "analysis" : "preparation") : "analysis");

  /* ---------- list ---------- */
  function List() {
    const { db, go, bp, role, can } = useApp();
    const pre = role === "prep" ? "toprep" : role === "analyst" ? "toanalyse" : "all";
    const [st, setSt] = useState(pre), [q, setQ] = useState(""), [co, setCo] = useState(""), [fl, setFl] = useState(false), [f, setF] = useState({ std: "", from: "", to: "" }), [pick, setPick] = useState(false), [jo, setJo] = useState(""), [ab, setAb] = useState(null);
    const all = db.batches.slice().sort((a, b) => (a.no < b.no ? 1 : -1));
    const match = (b) => { const o = S.order(db, b.jo); return (!q || (b.no + b.jo + b.samples.join(" ")).toLowerCase().includes(q.toLowerCase())) && (!co || o.client === co) && (!f.std || b.std === f.std) && (!f.from || b.date >= f.from) && (!f.to || b.date <= f.to); };
    const inSt = (b, s) => s === "all" || (s === "toprep" ? ["created", "receiving", "preparation"].includes(b.status) : s === "toanalyse" ? ["prepfinished", "analysis"].includes(b.status) : b.status === s);
    const rows = all.filter((b) => inSt(b, st) && match(b));
    const pg = usePaged(rows, 10, st + q + co + JSON.stringify(f));
    const chips = [{ id: "all", label: "All", count: all.filter(match).length }].concat(role === "prep" ? [{ id: "toprep", label: "Batches to prepare", count: all.filter((b) => inSt(b, "toprep") && match(b)).length }] : role === "analyst" ? [{ id: "toanalyse", label: "Ready for data entry", count: all.filter((b) => inSt(b, "toanalyse") && match(b)).length }] : [])
      .concat(Object.keys(BS).filter((k) => k !== "receiving").map((k) => ({ id: k, label: BS[k][0], count: all.filter((b) => b.status === k && match(b)).length })));
    const openJo = db.orders.filter((o) => ["awaiting", "progress"].includes(o.status) && o.samples.some((s) => !s.batch && !(s.flag && s.flag.state === "notreceived")));
    const cl = (b) => S.client(db, S.order(db, b.jo).client);
    return html`<${Page}><${PageHead} overline=${bp === "desktop" ? longDate(D.TODAY) : "Batches"} title="Batches" actions=${can("batch.create") && bp !== "phone" && html`<${Button} type="primary" size="lg" icon="plus" id="list-add-batch" onClick=${() => setPick(true)}>Add batch</${Button}>`} />
      <${Chips} scroll items=${chips} value=${st} onChange=${setSt} />
      <div class="row g12 wrap" style=${{ alignItems: "flex-end" }}><${Search} id="b-q" value=${q} onChange=${setQ} placeholder="Search batch, sample or job order" style=${{ width: bp === "phone" ? "calc(100% - 56px)" : "320px" }} />
        ${bp !== "phone" && html`<${Select} label="Company" value=${co} onChange=${setCo} options=${[["", "All companies"]].concat(db.clients.filter((c) => c.status === "Active").map((c) => [c.id, c.name]))} style=${{ width: "220px" }} />`}
        <span class="grow"></span>${bp === "phone" ? html`<${IconBtn} n="funnel" type="secondary" size=${44} label="Filters" onClick=${() => setFl(true)} />` : html`<${Button} size="lg" icon="funnel" onClick=${() => setFl(true)}>Filters</${Button}>`}</div>
      ${bp === "phone" ? html`<div class="col g10">${pg.rows.map((b) => html`<div key=${b.no} class="mcard" onClick=${() => go("batch-" + b.no)}><div class="row between"><b class="t-data-b">${b.no}</b><${Badge} label=${BS[b.status][0]} tone=${BS[b.status][1]} sm /></div><span class="t-sm">${cl(b).name}</span><span class="t-cap c-sec row g6"><span>${b.jo}</span><span>${b.std}</span><span class=${b.deadline < D.TODAY && b.status !== "completed" ? "c-err" : ""}>Due ${fmtShort(b.deadline)}</span></span></div>`)}${!rows.length && html`<${Card}><${Empty} icon="magnifying-glass" title="No batches match" text="Check the number or clear the filters." /></${Card}>`}</div>`
        : html`<${Card}><${Table} rows=${pg.rows} onRow=${(b) => go("batch-" + b.no)} cols=${[{ h: "Company", render: (b) => cl(b).name }, { h: "Batch no.", render: (b) => html`<b class="t-data-b c-head">${b.no}</b>` }, { h: "Job order", render: (b) => html`<span class="t-data c-brand">${b.jo}</span>` }, { h: "Batch date", render: (b) => fmtDate(b.date) },
          { h: "Deadline", render: (b) => html`<span class=${b.deadline < D.TODAY && b.status !== "completed" ? "c-err" : ""}>${fmtDate(b.deadline)}</span>` }, { h: "Samples", cls: "r", render: (b) => { const n = b.samples.length; return html`<span class="num">${b.confirmed ? n : b.samples.filter((s) => b.rows[s].arrived).length} / ${b.confirmed ? b.confirmed.of : n}</span>`; } },
          { h: "Status", render: (b) => html`<${Badge} label=${BS[b.status][0]} tone=${BS[b.status][1]} sm />` }, { h: "RoA", render: (b) => (b.roa ? html`<${RecLink} to=${"roa-" + b.roa.no} cls="t-data">${b.roa.no}</${RecLink}>` : html`<span class="c-mut">—</span>`) }]}
          empty=${!all.length ? html`<${Empty} icon="stack" title="No batches yet" text="Batches are created from a job order. Open a job order and use Add batch." />` : html`<${Empty} icon="magnifying-glass" title="No batches match" text=${q ? "Nothing matches " + q + ". Check the number or clear the filters." : "Clear the filters to see every batch."} action=${html`<${Button} onClick=${() => { setQ(""); setCo(""); setSt("all"); setF({ std: "", from: "", to: "" }); }}>Clear filters</${Button}>`} />`} /><${Pager} ...${pg.pager} /></${Card}>`}
      ${bp === "phone" && can("batch.create") && html`<div class="sticky-bar"><${Button} type="primary" size="lg" icon="plus" onClick=${() => setPick(true)}>Add batch</${Button}></div>`}
      ${fl && html`<${Dialog} title="Filters" sub="Narrow the batch list." size="lg" onClose=${() => setFl(false)} footer=${html`<${Button} onClick=${() => { setCo(""); setF({ std: "", from: "", to: "" }); }}>Clear all</${Button}><${Button} type="primary" onClick=${() => setFl(false)}>Show ${plural(rows.length, "batch", "batches")}</${Button}>`}>
        <div class="grid" style=${{ gridTemplateColumns: bp === "phone" ? "1fr" : "1fr 1fr", gap: "16px" }}><${Select} label="Company" value=${co} onChange=${setCo} options=${[["", "All companies"]].concat(db.clients.filter((c) => c.status === "Active").map((c) => [c.id, c.name]))} />
        <${Select} label="Status" value=${st} onChange=${setSt} options=${[["all", "All statuses"]].concat(Object.keys(BS).map((k) => [k, BS[k][0]]))} /><${Select} label="Standard" value=${f.std} onChange=${(v) => setF(Object.assign({}, f, { std: v }))} options=${[["", "Any standard"]].concat(D.STANDARDS.map((s) => [s, s]))} /><span></span>
        <${DateField} label="Batch date from" value=${f.from} onChange=${(v) => setF(Object.assign({}, f, { from: v }))} /><${DateField} label="Batch date to" value=${f.to} onChange=${(v) => setF(Object.assign({}, f, { to: v }))} /></div></${Dialog}>`}
      ${pick && html`<${Dialog} title="Add batch" size="sm" sub="A batch is created from a job order. Choose the job order first." onClose=${() => setPick(false)} footer=${html`<${Button} onClick=${() => setPick(false)}>Cancel</${Button}><${Button} type="primary" id="pick-next" disabled=${!jo} onClick=${() => { setPick(false); setAb(jo); }}>Next</${Button}>`}>
        <${Select} id="pick-jo" label="Job order" req value=${jo} onChange=${setJo} placeholder="Search job order or company" options=${openJo.map((o) => [o.no, o.no + "  " + S.client(db, o.client).name])} /></${Dialog}>`}
      ${ab && SH.AddBatch && html`<${SH.AddBatch} jo=${ab} onClose=${() => setAb(null)} />`}</${Page}>`;
  }

  /* ---------- batch page ---------- */
  function BatchPage({ no, tab }) {
    const { db, go, bp, can, update, toast, api } = useApp();
    const b = S.batch(db, no);
    const [num, setNum] = useState(false);
    if (!b) return html`<${Page}><${Card}><${Empty} icon="question" title=${no + " was not found"} action=${html`<${Button} onClick=${() => go("batches")}>Back to batches</${Button}>`} /></${Card}></${Page}>`;
    const t = ["reception", "preparation", "analysis"].includes(tab) ? tab : tabFor(b);
    const o = S.order(db, b.jo), cl = S.client(db, o.client), idx = D.B_ORDER.indexOf(b.status);
    const arrived = b.samples.filter((s) => b.rows[s].arrived).length;
    const stepIdx = [0, 1, 2, 3, 4, 4, 5][idx];
    const steps = [{ title: "Created", meta: fmtShort(b.date) }, { title: "Receiving", meta: b.confirmed ? fmtShort(b.confirmed.at) : idx === 1 ? "Current" : "—" }, { title: "Preparation", meta: b.prepDone ? fmtShort(b.prepDone.at) : idx === 2 ? "Current" : "—" }, { title: "Prep finished", meta: b.prepDone ? fmtShort(b.prepDone.at) : "—" }, { title: "Analysis", meta: b.anaDone ? fmtShort(b.anaDone.at) : idx === 4 ? "Started " + fmtShort(b.prepDone.at) : "—" }, { title: "Completed", meta: b.completed ? fmtShort(b.completed.at) : "—" }];
    const go2 = (x) => go("batch-" + b.no + "-" + x);
    return html`<${Page}><${PageHead} crumb=${[["Batches", "batches"], [b.no]]} title=${b.no} badge=${html`${can("batch.number") && !b.confirmed && html`<${IconBtn} n="pencil-simple" label="Edit batch number" onClick=${() => setNum(true)} />`}<${Badge} label=${BS[b.status][0]} tone=${BS[b.status][1]} />`}
        actions=${html`<${Menu} size=${36} items=${[{ label: "Open the job order", icon: "clipboard-text", onClick: () => go("order-" + b.jo + "-batches") }, { label: "History", icon: "clock-counter-clockwise", onClick: () => go2("reception") }]} />`}
        meta=${html`<div class="col g4"><b class="t-body w5">${cl.name}</b><div class="row g16 wrap t-cap c-mut"><span class="row g4"><${Icon} n="clipboard-text" /><${RecLink} to=${"order-" + b.jo + "-batches"} cls="t-data">${b.jo}</${RecLink}></span><span class="row g4"><${Icon} n="certificate" />${b.std}</span>
          <span class=${cx("row g4", b.deadline < D.TODAY && b.status !== "completed" && "c-err")}><${Icon} n="calendar-blank" />Due ${fmtDate(b.deadline)}</span><span class="row g4"><${Icon} n="stack" />${b.confirmed ? plural(b.samples.length, "sample") : arrived + " of " + b.samples.length + " arrived"}</span></div></div>`} />
      <${Card}><${Stepper} steps=${steps} current=${b.status === "completed" ? 6 : stepIdx} vertical=${bp === "phone"} /></${Card}>
      <${Tabs} id="b-tabs" items=${[{ id: "reception", label: "Reception", count: b.samples.length }, { id: "preparation", label: "Preparation" }, { id: "analysis", label: "Analysis" }]} value=${t} onChange=${go2} />
      ${t === "reception" && html`<${Reception} key=${b.no} b=${b} />`}${t === "preparation" && html`<${Preparation} key=${b.no + b.status} b=${b} />`}${t === "analysis" && html`<${Analysis} key=${b.no + b.status} b=${b} />`}
      ${num && html`<${NumberDlg} b=${b} onClose=${() => setNum(false)} />`}</${Page}>`;
  }
  function NumberDlg({ b, onClose }) {
    const { db, update, toast, go, api } = useApp(); const [v, setV] = useState(b.no), [e, setE] = useState(null);
    const printed = b.samples.filter((s) => b.rows[s].label === "printed").length;
    return html`<${Dialog} title="Edit batch number" size="sm" sub=${printed ? "Labels already printed for " + plural(printed, "sample") + " must be reprinted. Lab codes follow the new number." : "Lab codes follow the new number."} onClose=${onClose} footer=${html`<${Button} onClick=${onClose}>Cancel</${Button}><${Button} type="primary" id="num-save" onClick=${() => {
      if (!/^B-\d{4}-\d{4}$/.test(v)) return setE("Use the pattern B-YYYY-NNNN."); if (v !== b.no && db.batches.some((x) => x.no === v)) return setE(v + " is already used.");
      update((d) => { const x = d.batches.find((y) => y.no === b.no); x.no = v; x.samples.forEach((s, i) => { x.rows[s].lab = "B" + v.slice(-4) + "-" + String(i + 1).padStart(2, "0"); if (x.rows[s].label === "printed") x.rows[s].label = "none"; }); d.orders.find((o) => o.no === x.jo).samples.forEach((s) => { if (s.batch === b.no) s.batch = v; }); api.audit(d, "Batch", v, "Updated", [["Batch no.", b.no, v]], "Batch page"); });
      onClose(); toast("Batch number changed to " + v); go("batch-" + v + "-reception"); }}>Save</${Button}>`}><${TextField} id="num-v" label="Batch no." req value=${v} onChange=${(x) => { setV(x); setE(null); }} mono error=${e} /></${Dialog}>`;
  }

  /* ---------- reception ---------- */
  function Reception({ b }) {
    const { db, update, toast, can, bp, go, api, me } = useApp();
    const write = can("reception") && !b.confirmed;
    const [scan, setScan] = useState(""), [dlg, setDlg] = useState(null);
    const conds = db.config.lookups["Sample conditions"].map((x) => x[0]);
    const setRow = (sid, p) => update((d) => { const x = d.batches.find((y) => y.no === b.no); Object.assign(x.rows[sid], p); if (x.status === "created" && x.samples.some((s) => x.rows[s].arrived)) x.status = "receiving"; });
    const arrivedIds = b.samples.filter((s) => b.rows[s].arrived);
    const unprinted = arrivedIds.filter((s) => b.rows[s].label !== "printed");
    const checks = [["At least one sample arrived", arrivedIds.length > 0], ["Every arrived sample has a mass", arrivedIds.every((s) => b.rows[s].mass)], ["Every arrived sample has a condition, with a remark unless Good", arrivedIds.every((s) => b.rows[s].cond && (b.rows[s].cond === "Good" || b.rows[s].remark))], ["Every arrived sample has a printed label" + (unprinted.length ? " (" + unprinted.length + " to print)" : ""), arrivedIds.length > 0 && !unprinted.length]];
    const ready = checks.every((c) => c[1]);
    const doScan = () => { const code = scan.trim().toUpperCase(); const sid = b.samples.find((s) => s === code || b.rows[s].lab === code); if (!sid) { toast(code + " is not in this batch", { tone: "error" }); return; } setRow(sid, { arrived: true, cond: b.rows[sid].cond || "Good" }); setScan(""); toast(sid + " marked as arrived"); };
    const confirm = () => { const before = clone(db); const missing = b.samples.filter((s) => !b.rows[s].arrived && !b.rows[s].hold);
      update((d) => { const x = d.batches.find((y) => y.no === b.no), o = d.orders.find((y) => y.no === b.jo);
        missing.forEach((sid) => { const s = o.samples.find((y) => y.id === sid); s.batch = null; s.flag = { state: "awaiting", from: b.no }; delete x.rows[sid]; });
        x.samples = x.samples.filter((s) => !missing.includes(s)); x.status = "preparation"; x.confirmed = { by: me.name, at: api.now(), of: b.samples.length };
        if (o.status === "awaiting") o.status = "progress";
        x.log.push({ at: api.now(), by: me.name, text: "Confirmed with " + x.samples.length + " of " + b.samples.length + " expected." + (missing.length ? " Returned to " + b.jo + ": " + missing.join(", ") + "." : "") });
        api.audit(d, "Batch", b.no, "Status changed", [["Status", BS[b.status][0], "Preparation"], ["Samples", String(b.samples.length), String(x.samples.length)]], "Batch page, Reception tab");
        if (missing.length) api.notify(d, { to: ["cso"], ev: "N2", icon: "warning", title: plural(missing.length, "sample") + " of " + b.jo + " did not arrive", text: "Add them to a new batch when they come, or mark them not received.", link: "order-" + b.jo + "-samples" }); });
      setDlg(null); toast("Reception confirmed. " + b.no + " is in preparation.", { undo: () => window.__setDb && window.__setDb(before) }); };
    const condIcon = (r) => (!r.cond ? null : r.cond === "Good" ? html`<${Icon} n="check-circle" cls="c-ok" />` : html`<${Icon} n="warning" cls="c-warn" />`);
    const rowMenu = (sid) => [write && (b.rows[sid].hold ? { label: "Release", icon: "arrow-counter-clockwise", onClick: () => setRow(sid, { hold: null }) } : { label: "Hold", icon: "prohibit", disabled: !b.rows[sid].arrived, why: "Only an arrived sample can be held", onClick: () => setDlg({ k: "hold", sid }) }),
      write && b.rows[sid].arrived && { label: b.rows[sid].label === "printed" ? "Reprint label" : "Print label", icon: "printer", onClick: () => setDlg({ k: "print", ids: [sid] }) }, { label: "History", icon: "clock-counter-clockwise", onClick: () => go("sample-" + sid) }];
    const head = write && html`<label class="search" style=${{ width: bp === "phone" ? "100%" : "220px", height: "32px" }}><${Icon} n="magnifying-glass" /><input id="scan" value=${scan} placeholder="Scan or type a label" onInput=${(e) => setScan(e.target.value)} onKeyDown=${(e) => e.key === "Enter" && doScan()} /><span class="scanbtn" style=${{ width: "22px", height: "22px" }}><${Icon} n="barcode" /></span></label>
      <${Button} icon="check" onClick=${() => setDlg({ k: "all" })}>Mark all arrived</${Button}><${Button} icon="printer" id="print-labels" disabled=${!unprinted.length} onClick=${() => setDlg({ k: "print", ids: unprinted })}>Print labels${unprinted.length ? " (" + unprinted.length + ")" : ""}</${Button}>
      <${Button} type="primary" icon="check-circle" id="confirm-reception" disabled=${!ready} why="Finish the checklist below first" onClick=${() => setDlg({ k: "confirm" })}>Confirm reception</${Button}>`;
    const R = (sid) => b.rows[sid];
    return html`<${Card} title="Reception" actions=${head}>
      ${b.confirmed && html`<${Alert} tone="success" title=${"Reception confirmed by " + b.confirmed.by + " on " + fmtDate(b.confirmed.at)} text=${(b.log.slice(-1)[0] || {}).text || "Sample information is locked."} action=${b.confirmed.of > b.samples.length && html`<button class="linkbtn" onClick=${() => go("order-" + b.jo + "-samples")}>Open the job order's samples</button>`} />`}
      ${!can("reception") && !b.confirmed && html`<${Note}>Reception is done by the Preparation team, the CSO or the lab admin.</${Note}>`}
      ${bp === "phone" ? html`<div class="col g10">${b.samples.map((sid) => html`<div key=${sid} class="mcard" style=${{ cursor: "default" }}><div class="row between"><${Check} on=${R(sid).arrived} disabled=${!write} label=${html`<b class="t-data-b">${sid}</b>`} onChange=${(v) => setRow(sid, { arrived: v, cond: v ? R(sid).cond || "Good" : "" })} /><span class="t-data c-sec">${R(sid).lab}</span></div>
          ${R(sid).arrived && html`<div class="grid" style=${{ gridTemplateColumns: "1fr 1fr", gap: "8px" }}><${TextField} label="Mass" suffix="kg" value=${R(sid).mass || ""} disabled=${!write} onChange=${(v) => setRow(sid, { mass: v })} /><${Select} label="Condition" value=${R(sid).cond} disabled=${!write} onChange=${(v) => setRow(sid, { cond: v })} options=${conds} /></div>
          <div class="row between"><button class="linkbtn" onClick=${() => setDlg({ k: "photos", sid })}><${Icon} n="plus" />Photos (${R(sid).photos.length})</button>${R(sid).label === "printed" ? html`<${Tag} label="Printed" tone="green" icon="printer" />` : html`<${Tag} label="Not printed" tone="amber" icon="printer" />`}</div>`}</div>`)}</div>`
      : html`<${Table} id="reception-table" rows=${b.samples.map((s, i) => ({ id: s, i }))} rowCls=${(r) => (R(r.id).hold ? "lockrow" : null)} cols=${[{ h: "#", render: (r) => html`<span class="c-mut">${r.i + 1}</span>` }, { h: "Sample ID", render: (r) => html`<b class="t-data-b c-head">${r.id}</b>` }, { h: "Lab code", render: (r) => html`<span class="t-data c-sec">${R(r.id).arrived ? R(r.id).lab : "—"}</span>` },
        { h: "Arrived", cls: "c", render: (r) => html`<${Check} on=${R(r.id).arrived} disabled=${!write} onChange=${(v) => setRow(r.id, { arrived: v, cond: v ? R(r.id).cond || "Good" : "", mass: v ? R(r.id).mass : null })} />` },
        { h: "Mass (kg)", w: "96px", render: (r) => R(r.id).arrived ? html`<input class="cell" aria-label=${"Mass of " + r.id} disabled=${!write} value=${R(r.id).mass || ""} onInput=${(e) => setRow(r.id, { mass: e.target.value })} />` : html`<span class="c-mut">—</span>` },
        { h: "Condition", render: (r) => R(r.id).arrived ? html`<span class="row g6"><select class="cell l" style=${{ width: "110px", height: "32px", border: "1px solid var(--surface-border-strong)", borderRadius: "6px", background: "var(--surface-card)" }} disabled=${!write} value=${R(r.id).cond} aria-label=${"Condition of " + r.id} onChange=${(e) => setRow(r.id, { cond: e.target.value })}>${conds.map((c) => html`<option key=${c}>${c}</option>`)}</select>${condIcon(R(r.id))}</span>` : html`<span class="c-mut">—</span>` },
        { h: "Remarks", render: (r) => R(r.id).hold ? html`<${Tag} label=${"Held: " + R(r.id).hold} tone="red" icon="prohibit" />` : R(r.id).arrived && write ? html`<input class="cell l" style=${{ width: "160px" }} placeholder=${R(r.id).cond === "Good" ? "—" : "Remark needed"} value=${R(r.id).remark} aria-label=${"Remark for " + r.id} onInput=${(e) => setRow(r.id, { remark: e.target.value })} />` : R(r.id).remark || html`<span class="c-mut">—</span>` },
        { h: "Photos", render: (r) => R(r.id).arrived ? html`<button class="linkbtn" onClick=${() => setDlg({ k: "photos", sid: r.id })}>${R(r.id).photos.length ? html`<span class="av s28" style=${{ borderRadius: "6px" }}><${Icon} n="package" /></span>${R(r.id).photos.length > 1 && "+" + (R(r.id).photos.length - 1)}` : html`<${Icon} n="plus" />Add`}</button>` : html`<span class="c-mut">—</span>` },
        { h: "Label", render: (r) => !R(r.id).arrived ? html`<span class="c-mut">—</span>` : R(r.id).label === "printed" ? html`<${Tag} label="Printed" tone="green" icon="printer" />` : html`<${Tag} label="Not printed" tone="amber" icon="printer" />` },
        { h: "", render: (r) => html`<${Menu} size=${28} items=${rowMenu(r.id)} label=${"More for " + r.id} />` }]} />`}
      ${!b.confirmed && html`<div class="col g6"><b class="t-sm w6">Before you can confirm reception</b>${checks.map(([l, ok]) => html`<span key=${l} class=${cx("row g6 t-cap", ok ? "" : "c-mut")}><${Icon} n=${ok ? "check-circle" : "circle"} cls=${ok ? "c-ok" : ""} />${l}</span>`)}</div>`}
      ${dlg && dlg.k === "all" && html`<${Confirm} title="Mark all samples as arrived?" text=${plural(b.samples.length, "sample") + " get the condition Good. Enter the mass of each one after."} ok="Mark all arrived" onClose=${() => setDlg(null)} onOk=${() => { update((d) => { const x = d.batches.find((y) => y.no === b.no); x.samples.forEach((s) => { x.rows[s].arrived = true; x.rows[s].cond = x.rows[s].cond || "Good"; }); x.status = "receiving"; }); setDlg(null); }} />`}
      ${dlg && dlg.k === "print" && html`<${PrintDlg} b=${b} ids=${dlg.ids} onClose=${() => setDlg(null)} />`}
      ${dlg && dlg.k === "photos" && html`<${PhotosDlg} b=${b} sid=${dlg.sid} write=${write} onClose=${() => setDlg(null)} />`}
      ${dlg && dlg.k === "hold" && html`<${HoldDlg} b=${b} sid=${dlg.sid} onClose=${() => setDlg(null)} />`}
      ${dlg && dlg.k === "confirm" && (() => { const miss = b.samples.filter((s) => !R(s).arrived && !R(s).hold); return miss.length
        ? html`<${Confirm} title=${"Confirm reception with " + (b.samples.length - miss.length) + " of " + b.samples.length + " samples?"} text=${miss.join(" and ") + " have not arrived. They go back to " + b.jo + " as Awaiting arrival and can join a new batch later. The sample information locks."} ok="Confirm reception" onClose=${() => setDlg(null)} onOk=${confirm} />`
        : html`<${Confirm} title="Confirm reception?" text=${"Every sample arrived. The sample information locks and " + b.no + " moves to Preparation."} ok="Confirm reception" onClose=${() => setDlg(null)} onOk=${confirm} />`; })()}</${Card}>`;
  }
  function PrintDlg({ b, ids, onClose }) {
    const { update, toast } = useApp(); const [n, setN] = useState("1"), [pr, setPr] = useState("Zebra ZD421 (Prep room)"), [only, setOnly] = useState(true);
    const list = only ? ids.filter((s) => b.rows[s].label !== "printed") : ids; const L = list.length ? list : ids;
    return html`<${Dialog} title=${"Print " + plural(L.length, "label")} size="sm" sub=${"Labels for " + L.join(", ") + "."} onClose=${onClose} footer=${html`<${Button} onClick=${onClose}>Cancel</${Button}><${Button} type="primary" id="print-go" onClick=${() => { update((d) => { const x = d.batches.find((y) => y.no === b.no); L.forEach((s) => (x.rows[s].label = "printed")); }); onClose(); toast(plural(L.length * +n, "label") + " sent to " + pr.split(" (")[0]); }}>Print ${plural(L.length, "label")}</${Button}>`}>
      <${Select} label="Printer" value=${pr} onChange=${setPr} options=${["Zebra ZD421 (Prep room)", "Zebra ZD421 (Reception)"]} /><${TextField} label="Copies per sample" value=${n} onChange=${setN} /><${Check} on=${only} onChange=${setOnly} label="Only samples without a label" /></${Dialog}>`;
  }
  function PhotosDlg({ b, sid, write, onClose }) {
    const { db, update, me, api } = useApp(); const [tag, setTag] = useState("Condition"); const ph = S.batch(db, b.no).rows[sid].photos;
    return html`<${Dialog} title=${"Photos of " + sid} size="lg" sub="Tag each photo. Photos lock when reception is confirmed." onClose=${onClose} footer=${html`<${Button} onClick=${onClose}>Close</${Button}>`}>
      ${write && html`<div class="row g10 wrap"><${Chips} sm items=${["Condition", "Weighing", "Other"].map((x) => ({ id: x, label: x }))} value=${tag} onChange=${setTag} /></div>
        <${DropZone} text="Add photo" hint="JPG or PNG; on a tablet or phone the camera opens" accept="image/*" onFile=${(f) => update((d) => d.batches.find((y) => y.no === b.no).rows[sid].photos.push({ name: f.name, tag, by: me.name, at: api.now() }))} />`}
      <div class="grid" style=${{ gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: "12px" }}>${ph.map((p, i) => html`<div key=${i} class="col g4"><div style=${{ height: "100px", borderRadius: "10px", background: "var(--surface-sand)", display: "flex", alignItems: "center", justifyContent: "center" }}><${Icon} n="package" s="24" /></div><${Tag} label=${p.tag} /><span class="t-cap c-sec">${p.by}, ${p.at.slice(11)}</span></div>`)}
        ${!ph.length && html`<span class="t-sm c-mut">No photos yet.</span>`}</div></${Dialog}>`;
  }
  function HoldDlg({ b, sid, onClose }) {
    const { db, update, toast, api } = useApp(); const [r, setR] = useState("Insufficient");
    return html`<${Confirm} title=${"Hold " + sid + "?"} text="A held sample stays in the batch and prints as not analysed on the RoA. The checklists ignore it." ok="Hold sample" onClose=${onClose}
      onOk=${() => { update((d) => { d.batches.find((y) => y.no === b.no).rows[sid].hold = r; api.audit(d, "Sample", sid, "Status changed", [["Hold", "", r]], "Batch page, Reception tab"); }); onClose(); toast(sid + " is on hold"); }}>
      <${Select} id="hold-reason" label="Reason" req value=${r} onChange=${setR} options=${db.config.lookups["Hold reasons"].map((x) => x[0])} /></${Confirm}>`;
  }

  /* ---------- preparation ---------- */
  function Preparation({ b }) {
    const { db, update, toast, can, bp, api, me } = useApp();
    const write = can("adl") && b.status === "preparation";
    const [v, setV] = useState(() => Object.fromEntries(b.samples.map((s) => [s, b.rows[s].adl ? String(b.rows[s].adl.v) : ""])));
    useEffect(() => setV(Object.fromEntries(b.samples.map((s) => [s, b.rows[s].adl ? String(b.rows[s].adl.v) : ""]))), [b.no, b.status]);
    if (!b.confirmed) return html`<${Card} title="Preparation"><${Empty} icon="flask" title="Preparation starts after reception" text="Confirm reception first. Then the Preparation team enters ADL here." /></${Card}>`;
    const act = b.samples.filter((s) => !b.rows[s].hold);
    const dirty = act.some((s) => (b.rows[s].adl ? String(b.rows[s].adl.v) : "") !== v[s]);
    const saveAll = () => { update((d) => { const x = d.batches.find((y) => y.no === b.no); act.forEach((s) => { if (v[s] !== "" && (!x.rows[s].adl || String(x.rows[s].adl.v) !== v[s])) x.rows[s].adl = { v: +v[s], by: me.name, at: api.now() }; }); api.audit(d, "Batch", b.no, "Updated", [["ADL", "", "Saved"]], "Batch page, Preparation tab"); }); toast("ADL saved"); };
    const done = act.every((s) => v[s] !== "");
    const finish = () => { saveAll(); update((d) => { const x = d.batches.find((y) => y.no === b.no); x.status = "prepfinished"; x.prepDone = { by: me.name, at: api.now() }; api.audit(d, "Batch", b.no, "Status changed", [["Status", "Preparation", "Prep finished"]], "Batch page, Preparation tab");
      api.notify(d, { to: ["analyst"], ev: "N3", icon: "flask", title: b.no + " is ready for data entry", text: plural(act.length, "sample") + ", ADL done by " + me.name + ".", link: "batch-" + b.no + "-analysis" }); }); toast(b.no + " preparation finished. The analysts are notified."); };
    const warn = (x) => x !== "" && (+x < 0 || +x > 20 || +x > 15);
    return html`<${Card} title="Preparation" actions=${write && html`<${Button} icon="floppy-disk" disabled=${!dirty} onClick=${saveAll}>Save all</${Button}><${Button} type="primary" icon="check-circle" id="finish-prep" disabled=${!done} why="Enter ADL for every sample first" onClick=${finish}>Finish Preparation</${Button}>`}>
      ${b.prepDone && html`<${Alert} tone="success" title=${"Preparation finished by " + b.prepDone.by + " on " + fmtDate(b.prepDone.at)} text="The ADL values are locked." />`}
      ${!can("adl") && b.status === "preparation" && html`<${Note}>ADL is entered by the Preparation team only.</${Note}>`}
      <${Table} id="prep-table" rows=${b.samples.map((s, i) => ({ id: s, i }))} rowCls=${(r) => (b.rows[r.id].hold ? "lockrow" : null)} cols=${[{ h: "#", render: (r) => html`<span class="c-mut">${r.i + 1}</span>` }, { h: "Sample ID", render: (r) => html`<b class="t-data-b c-head">${r.id}</b>` }, { h: "Lab code", render: (r) => html`<span class="t-data c-sec">${b.rows[r.id].lab}</span>` },
        { h: "ADL (%)", w: "130px", render: (r) => b.rows[r.id].hold ? html`<${Tag} label="Held" tone="red" />` : html`<span class="row g6"><input class=${cx("cell", warn(v[r.id]) && "warn")} id=${"adl-" + r.i} aria-label=${"ADL of " + r.id} disabled=${!write} value=${v[r.id]} onInput=${(e) => setV(Object.assign({}, v, { [r.id]: e.target.value.replace(",", ".") }))} />${warn(v[r.id]) && html`<${Tip} text="Above the typical range (0 to 15 %). Check the value."><${Icon} n="warning" cls="c-warn" /></${Tip}>`}</span>` },
        { h: "Entered by", render: (r) => b.rows[r.id].adl ? html`<span class="row g6"><${Avatar} name=${b.rows[r.id].adl.by} size=${24} /><span class="t-sm">${b.rows[r.id].adl.by}</span><span class="t-cap c-sec">${fmtShort(b.rows[r.id].adl.at)}</span></span>` : html`<span class="c-mut">—</span>` }]} />
      ${write && html`<div class="col g6"><b class="t-sm w6">Before you can finish preparation</b><span class=${cx("row g6 t-cap", !done && "c-mut")}><${Icon} n=${done ? "check-circle" : "circle"} cls=${done ? "c-ok" : ""} />ADL for every sample (${act.filter((s) => v[s] !== "").length} of ${act.length})</span></div>`}</${Card}>`;
  }

  /* ---------- analysis ---------- */
  function Analysis({ b }) {
    const { db, update, toast, can, bp, api, me, role } = useApp();
    const ps = NUMP(b), act = b.samples.filter((s) => !b.rows[s].hold);
    const write = can("result.write") && ["prepfinished", "analysis"].includes(b.status);
    const init = () => Object.fromEntries(act.map((s) => [s, Object.fromEntries(ps.map((p) => [p, b.rows[s].values[p] != null ? String(b.rows[s].values[p]) : ""]))]));
    const [v, setV] = useState(init), [file, setFile] = useState(null), [rno, setRno] = useState("RoA-" + b.no.slice(-4));
    useEffect(() => setV(init()), [b.no, b.status]);
    if (!["prepfinished", "analysis", "analysisfinished", "completed"].includes(b.status)) return html`<${Card} title="Analysis"><${Empty} icon="flask" title="Analysis starts after preparation" text="The analysts enter values here once the Preparation team finishes ADL." /></${Card}>`;
    const calc = (s) => { const x = v[s] || {}; return ps.includes("FC") && x.IM !== "" && x.Ash !== "" && x.VM !== "" ? (100 - +x.IM - +x.Ash - +x.VM).toFixed(2) : ""; };
    const val = (s, p) => (p === "FC" ? calc(s) : (v[s] || {})[p] || "");
    const total = act.length * ps.length, have = act.reduce((a, s) => a + ps.filter((p) => val(s, p) !== "").length, 0);
    const warns = act.filter((s) => ps.some((p) => outOf(db, p, val(s, p))));
    const dirty = act.some((s) => ps.some((p) => p !== "FC" && (b.rows[s].values[p] != null ? String(b.rows[s].values[p]) : "") !== v[s][p]));
    const commit = (d) => { const x = d.batches.find((y) => y.no === b.no); act.forEach((s) => ps.forEach((p) => { const y = val(s, p); if (y !== "") x.rows[s].values[p] = +y; })); if (x.status === "prepfinished") x.status = "analysis"; };
    const saveAll = () => { update((d) => { commit(d); api.audit(d, "Result", b.no, "Updated", [["Values saved", "", String(have)]], "Batch page, Analysis tab"); }); toast(have + " values saved"); };
    const finish = () => { update((d) => { commit(d); const x = d.batches.find((y) => y.no === b.no); x.status = "analysisfinished"; x.anaDone = { by: me.name, at: api.now() }; api.audit(d, "Batch", b.no, "Status changed", [["Status", "Analysis", "Analysis finished"]], "Batch page, Analysis tab");
      api.notify(d, { to: ["lab_admin"], ev: "N4", icon: "flask", title: b.no + " analysis is finished", text: "Upload the signed RoA to complete the batch.", link: "batch-" + b.no + "-analysis" }); }); toast(b.no + " analysis finished. The lab admin uploads the signed RoA."); };
    const complete = () => { update((d) => { const x = d.batches.find((y) => y.no === b.no); x.status = "completed"; x.completed = { by: me.name, at: api.now() }; x.roa = { no: rno, file: file.name, by: me.name, at: D.TODAY }; api.audit(d, "Batch", b.no, "Status changed", [["Status", "Analysis finished", "Completed"], ["RoA", "", rno]], "Batch page, Analysis tab");
      const o = d.orders.find((y) => y.no === b.jo); const bs = d.batches.filter((y) => y.jo === b.jo); if (bs.every((y) => y.status === "completed") && o.samples.every((s) => s.batch || (s.flag && s.flag.state === "notreceived"))) api.notify(d, { to: ["lab_admin"], ev: "N5", icon: "certificate", title: "All batches of " + b.jo + " are completed", text: "Generate the CoA.", link: "order-" + b.jo + "-coa" }); }); toast(b.no + " completed with " + rno); };
    const hideVals = !can("values.view");
    const groups = []; ps.forEach((p) => { const g = GRP[p] || "Other"; const last = groups[groups.length - 1]; if (last && last[0] === g) last[1]++; else groups.push([g, 1]); });
    const RoaCard = b.status === "analysisfinished" || b.status === "completed" ? html`<${Card} title="Signed RoA" head=${b.roa && html`<${Tag} label="Uploaded" tone="green" icon="check-circle" />`}>
      ${b.roa ? html`<div class="row g10 wrap">${can("roa.download") ? html`<${FileChip} label=${b.roa.file} />` : html`<span class="t-data">${b.roa.no}</span>`}<span class="t-sm">${can("roa.download") ? b.roa.no : ""}</span><span class="t-cap c-sec">Uploaded by ${b.roa.by} on ${fmtDate(b.roa.at)}</span></div>`
        : can("roa.upload") ? html`<span class="t-sm c-sec">Upload the lab's signed paper RoA to complete the batch.</span><${TextField} id="roa-no" label="RoA number" req value=${rno} onChange=${setRno} mono style=${{ maxWidth: "260px" }} />${file ? html`<div class="row g10"><${FileChip} label=${file.name} /><span class="t-cap c-mut">${fileSize(file.size)}</span><${IconBtn} n="trash" label="Remove file" onClick=${() => setFile(null)} /></div>` : html`<${DropZone} text="Drop the signed RoA here, or click to browse" onFile=${setFile} />`}
          <div class="row"><${Button} type="primary" icon="check-circle" id="complete-batch" disabled=${!file || !rno} why="Add the signed RoA first" onClick=${complete}>Complete batch</${Button}></div>
          ${!file && html`<button class="linkbtn" id="roa-sample" onClick=${() => setFile({ name: rno + "-signed.pdf", size: 412000 })}>Use a sample signed RoA</button>`}`
        : html`<span class="t-sm c-sec">The lab admin uploads the signed RoA.</span>`}</${Card}>` : null;
    if (hideVals) return html`<${Card} title="Analysis"><div class="row g10"><${Progress} v=${have} max=${total} /><span class="t-sm">${have} of ${total} values saved</span></div><span class="t-sm c-sec">Values are visible to the lab only. The CoA carries the approved results.</span></${Card}>${RoaCard}`;
    return html`<${Card} title="Analysis" head=${html`<span class="row g8 t-cap c-sec"><span>${have} of ${total} values saved</span>${b.prepDone && html`<span class="c-mut">Started ${fmtShort(b.prepDone.at)}</span>`}</span>`} actions=${write && html`<${Button} icon="floppy-disk" disabled=${!dirty} id="save-values" onClick=${saveAll}>Save all</${Button}><${Button} type="primary" icon="check-circle" id="finish-analysis" disabled=${have < total} why="Enter a value for every ordered parameter first" onClick=${finish}>Finish Analysis</${Button}>`}>
      ${b.anaDone && html`<${Alert} tone="success" title=${"Analysis finished by " + b.anaDone.by + " on " + fmtDate(b.anaDone.at)} text="The values are locked." />`}
      ${!can("result.write") && ["prepfinished", "analysis"].includes(b.status) && html`<${Note}>Values are entered by the analysts.</${Note}>`}
      ${write && html`<button class="linkbtn" id="fill-demo" onClick=${() => { const n = clone(v); act.forEach((s) => { const g = D.values(ps); ps.forEach((p) => { if (n[s][p] === "" && g[p] != null && p !== "FC") n[s][p] = String(g[p]); }); }); setV(n); }}>Fill the empty cells with demo values</button>`}
      <div class="tblwrap"><table class="tbl" id="analysis-table"><thead><tr><th></th><th></th>${groups.map(([g, n]) => html`<th key=${g} colSpan=${n} class="t-over" style=${{ background: "none", fontSize: "10px" }}>${g}</th>`)}</tr>
        <tr><th>#</th><th>Sample ID</th>${ps.map((p) => html`<th key=${p}><span class="col" style=${{ gap: 0 }}><span>${p}</span><span class="c-mut" style=${{ fontWeight: 400, fontSize: "11px" }}>${[D.PARAM_INFO[p][1], (D.PARAM_INFO[p][2] || "").toLowerCase()].filter((x) => x && x !== "—").join(" ")}</span></span></th>`)}</tr></thead>
        <tbody>${b.samples.map((s, i) => html`<tr key=${s} class=${b.rows[s].hold ? "lockrow" : ""}><td class="c-mut">${i + 1}</td><td><b class="t-data-b c-head">${s}</b></td>${ps.map((p) => { if (b.rows[s].hold) return html`<td key=${p} class="c-mut">—</td>`; const x = val(s, p), w = outOf(db, p, x);
          return html`<td key=${p} style=${{ minWidth: "84px" }}>${p === "FC" ? html`<input class="cell" disabled value=${x ? "ƒ " + x : "ƒ"} aria-label=${"FC of " + s + ", calculated"} />` : html`<input class=${cx("cell", w && "warn")} id=${"v-" + i + "-" + p} disabled=${!write} value=${x} aria-label=${p + " of " + s} title=${w ? "Outside the typical range: check it" : undefined} onInput=${(e) => { const n = clone(v); n[s][p] = e.target.value.replace(",", "."); setV(n); }} />`}</td>`; })}</tr>`)}</tbody></table></div>
      ${["prepfinished", "analysis"].includes(b.status) && html`<div class="col g6"><b class="t-sm w6">Before you can finish analysis</b><span class=${cx("row g6 t-cap", have < total && "c-mut")}><${Icon} n=${have >= total ? "check-circle" : "circle"} cls=${have >= total ? "c-ok" : ""} />A value for every ordered parameter: ${have} of ${total}</span>
        ${warns.length > 0 && html`<span class="row g6 t-cap c-warn"><${Icon} n="warning" />${warns.join(", ")} ${warns.length > 1 ? "have" : "has"} values outside the typical range: check them</span>`}</div>`}</${Card}>${RoaCard}`;
  }

  ROUTES.push({ re: /^batches$/, nav: "batches", render: () => html`<${List} />` }, { re: /^batch-(B-\d{4}-\d{4})(?:-(\w+))?$/, nav: "batches", render: (m) => html`<${BatchPage} no=${m[1]} tab=${m[2]} />` });
  FLOWS.push(
    { id: "BA1", group: "Batches", title: "Receive a batch", role: "prep", steps: "Batches (Batches to prepare), B-2026-0422: type KEP-3301 in Scan, tick the others, masses, a Wet sample with a remark, photos, Print labels.", start: { hash: "batches" } },
    { id: "BA2", group: "Batches", title: "Confirm with fewer, hold", role: "prep", steps: "B-2026-0422: 6 of 8 arrived (prepared), hold one; Confirm reception; 2 go back to JO-2026-0137.", start: { hash: "batch-B-2026-0422-reception", prep: (d) => { const b = d.batches.find((x) => x.no === "B-2026-0422"); b.status = "receiving"; b.samples.slice(0, 6).forEach((s, i) => Object.assign(b.rows[s], { arrived: true, mass: (2 + i * 0.13).toFixed(2), cond: i === 2 ? "Wet" : "Good", remark: i === 2 ? "Bag wet on arrival" : "", label: "printed" })); } } },
    { id: "BA3", group: "Batches", title: "Late samples into a new batch", role: "cso", steps: "JO-2026-0139 Batches: MCR-2206 is awaiting arrival; Add batch pre-ticks it; Create batch.", start: { hash: "order-JO-2026-0139-batches" } },
    { id: "BA4", group: "Batches", title: "Enter ADL and finish", role: "prep", steps: "B-2026-0420 Preparation: ADL for each sample (22.4 warns), Save all, Finish Preparation.", start: { hash: "batch-B-2026-0420-preparation" } },
    { id: "BA5", group: "Batches", title: "Analysis and RoA", role: "analyst", steps: "B-2026-0418 Analysis: fill the empty cells, Finish Analysis. Switch to Lab admin: upload the signed RoA, Complete batch.", start: { hash: "batch-B-2026-0418-analysis" } },
    { id: "BA6", group: "Batches", title: "Read-only batch", role: "cso", steps: "B-2026-0418 as CSO: progress only, no values; RoA numbers are plain text.", start: { hash: "batch-B-2026-0418-analysis" } },
    { id: "BA7", group: "Batches", title: "Edit the batch number", role: "lab_admin", steps: "B-2026-0422: pencil, try B-2026-0421 (already used), then B-2026-0430.", start: { hash: "batch-B-2026-0422" } },
    { id: "BA8", group: "Batches", title: "Add a batch from the list", role: "lab_admin", steps: "Batches, Add batch, choose JO-2026-0137, Next, Create batch.", start: { hash: "batches" } },
  );
})();
