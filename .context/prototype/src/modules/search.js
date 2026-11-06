/* Search (Search_Prototype_Plan.md): quick search in the top bar, results, advanced search, sample history. */
(function () {
  /* Index of every searchable record; the CSO never gets result values or RoA files (Navigation section 3). */
  function index(db, role) {
    const out = [];
    db.orders.forEach((o) => { const cl = S.client(db, o.client);
      out.push({ type: "Job orders", id: o.no, title: o.no, sub: [cl.name, o.po, D.JO_STATUS[o.status][0]], link: "order-" + o.no, client: cl.name });
      o.samples.forEach((s) => out.push({ type: "Samples", id: s.id, title: s.id, sub: [cl.name, o.no, s.hole, D.S_STATE[S.sampleState(db, o, s)][0]], link: "sample-" + s.id, client: cl.name, hole: s.hole, jo: o.no, batch: s.batch, s, o }));
      o.coas.filter((c) => c.rev > 0).forEach((c) => out.push({ type: "Reports", id: c.no, title: c.no, sub: [cl.name, D.COA_STATUS[c.status][0]], link: "report-" + c.no, allow: "coa.download" })); });
    db.batches.forEach((b) => { const o = S.order(db, b.jo), cl = S.client(db, o.client);
      out.push({ type: "Batches", id: b.no, title: b.no, sub: [cl.name, b.jo, D.B_STATUS[b.status][0]], link: "batch-" + b.no, client: cl.name });
      b.samples.forEach((sid) => out.push({ type: "Samples", id: b.rows[sid].lab, title: b.rows[sid].lab, sub: ["Lab code of " + sid, b.no], link: "sample-" + sid, alias: true }));
      if (b.roa) out.push({ type: "Reports", id: b.roa.no, title: b.roa.no, sub: [cl.name, b.no, "Signed RoA"], link: "roa-" + b.roa.no, allow: "roa.download" }); });
    db.clients.forEach((c) => out.push({ type: "Clients", id: c.id, title: c.name, sub: [c.id, c.status], link: "client-" + c.id, nav: "clients" }));
    db.drill.forEach((d) => out.push({ type: "Drill holes", id: d.code, title: d.code, sub: [S.client(db, d.cl).name, d.coa ? "CoA uploaded" : "CoA missing"], link: "drill-holes", nav: "drill-holes" }));
    return out.filter((r) => (!r.allow || D.can(role, r.allow)) && (!r.nav || D.VISIBLE[role].includes(r.nav)));
  }
  const find = (db, role, q) => { const t = q.trim().toLowerCase(); if (!t) return []; return index(db, role).filter((r) => (r.title + " " + r.sub.join(" ")).toLowerCase().includes(t)); };
  const TYPES = ["Samples", "Batches", "Job orders", "Reports", "Clients", "Drill holes"];
  const ICON = { Samples: "rows", Batches: "stack", "Job orders": "clipboard-text", Reports: "file-text", Clients: "buildings", "Drill holes": "cylinder" };
  const hashq = (q) => q.trim().replace(/[^A-Za-z0-9-]+/g, "-");

  function Quick() {
    const { db, role, go, bp, update } = useApp();
    const [q, setQ] = useState(""), [open, setOpen] = useState(false);
    const ref = useRef(), inp = useRef();
    useOutside(ref, () => setOpen(false), open);
    useEsc(() => { setOpen(false); inp.current && inp.current.blur(); }, open);
    useEffect(() => { const h = (e) => { if (e.key === "/" && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) { e.preventDefault(); inp.current && inp.current.focus(); setOpen(true); } }; document.addEventListener("keydown", h); return () => document.removeEventListener("keydown", h); }, []);
    if (bp === "phone") return html`<${IconBtn} n="magnifying-glass" size=${36} label="Search" onClick=${() => go("search")} />`;
    const res = find(db, role, q), exact = res.find((r) => r.id.toLowerCase() === q.trim().toLowerCase());
    const remember = (t) => update((d) => { d.recent = [t].concat(d.recent.filter((x) => x !== t)).slice(0, 5); });
    const pick = (r) => { remember(r.id); setOpen(false); setQ(""); go(r.link); };
    const all = () => { if (!q.trim()) return; remember(q.trim()); setOpen(false); go("search-" + hashq(q)); };
    const groups = TYPES.map((t) => [t, res.filter((r) => r.type === t)]).filter((g) => g[1].length);
    return html`<div ref=${ref} style=${{ position: "relative" }}><label class="tsearch"><${Icon} n="magnifying-glass" /><input ref=${inp} id="quick-search" value=${q} placeholder="Search by batch, lab code, or drill hole…" onFocus=${() => setOpen(true)} onInput=${(e) => { setQ(e.target.value); setOpen(true); }}
        onKeyDown=${(e) => { if (e.key === "Enter") { exact ? pick(exact) : all(); } }} /><button class="scanbtn" aria-label="Scan a label" title="Scan a label" onClick=${(e) => { e.preventDefault(); inp.current.focus(); setOpen(true); }}><${Icon} n="barcode" /></button></label>
      ${open && html`<div class="menu" id="quick-panel" style=${{ top: "46px", left: 0, right: 0, padding: "10px", maxHeight: "460px", overflowY: "auto" }}>
        ${!q.trim() ? html`<span class="t-over" style=${{ padding: "4px 10px" }}>Recent</span>${db.recent.map((t) => html`<button key=${t} class="mi" onClick=${() => { setQ(t); }}><${Icon} n="clock-counter-clockwise" />${t}</button>`)}<div class="mdiv"></div><button class="mi" onClick=${() => { setOpen(false); go("advanced-search"); }}><${Icon} n="funnel" />Advanced search</button>`
        : !res.length ? html`<div class="col g8" style=${{ padding: "10px" }}><b class="t-sm w6">Nothing matches "${q}"</b><span class="t-cap c-sec">Check the ID, or search by another field.</span><${Button} size="sm" onClick=${() => { setOpen(false); go("advanced-search"); }}>Open advanced search</${Button}></div>`
        : html`${exact && html`<span class="t-over" style=${{ padding: "4px 10px" }}>Exact match</span><button class="mi" style=${{ height: "auto", padding: "8px 10px", background: "var(--primary-50)" }} onClick=${() => pick(exact)}><${Icon} n=${ICON[exact.type]} /><span class="col" style=${{ gap: 0 }}><b class="t-data-b">${exact.title}</b><span class="t-cap c-sec row g6">${exact.sub.filter(Boolean).map((x, i) => html`<span key=${i}>${x}</span>`)}</span></span><span class="meta">Enter</span></button><div class="mdiv"></div>`}
          ${groups.map(([t, rs]) => html`<${Fragment} key=${t}><span class="t-over" style=${{ padding: "6px 10px 2px" }}>${t}</span>${rs.slice(0, 3).map((r) => html`<button key=${r.type + r.id} class="mi" style=${{ height: "auto", padding: "6px 10px" }} onClick=${() => pick(r)}><span class="col" style=${{ gap: 0 }}><span class="t-sm w6">${r.title}</span><span class="t-cap c-sec row g6">${r.sub.filter(Boolean).slice(0, 3).map((x, i) => html`<span key=${i}>${x}</span>`)}</span></span></button>`)}</${Fragment}>`)}
          <div class="mdiv"></div><button class="mi" id="see-all" onClick=${all}><${Icon} n="arrow-right" />See all ${res.length} results</button>`}</div>`}</div>`;
  }
  MOD.search = { Quick };

  function Results({ q0 }) {
    const { db, role, go, bp } = useApp();
    const [q, setQ] = useState((q0 || "").replace(/-/g, "-")), [type, setType] = useState("all");
    useEffect(() => setQ(q0 || ""), [q0]);
    const res = find(db, role, q).filter((r) => !r.alias || !find(db, role, q).some((x) => x.link === r.link && !x.alias));
    const groups = TYPES.map((t) => [t, res.filter((r) => r.type === t)]).filter((g) => g[1].length && (type === "all" || g[0] === type));
    if (!q0 && bp === "phone" && !q) return html`<${Page}><${PageHead} overline="Search" title="Search" /><${Search} id="res-q" value=${q} onChange=${setQ} placeholder="Search by batch, lab code, or drill hole…" onEnter=${() => go("search-" + hashq(q))} />
      <${Card}><${Empty} icon="barcode" title="Scan a label or type an ID" text="Samples, batches, job orders, reports, clients and drill holes." action=${html`<${Button} type="primary" size="lg" icon="barcode" onClick=${() => document.getElementById("res-q").focus()}>Scan a label</${Button}>`} /></${Card}>
      <div class="col g6"><span class="t-over">Recent</span>${db.recent.map((t) => html`<button key=${t} class="mi" onClick=${() => go("search-" + t)}><${Icon} n="clock-counter-clockwise" />${t}</button>`)}</div></${Page}>`;
    return html`<${Page}><${PageHead} overline="Search" title=${q ? 'Results for "' + q + '"' : "Search"} actions=${html`<${Button} icon="funnel" onClick=${() => go("advanced-search")}>Advanced search</${Button}>`} />
      <${Search} id="res-q" value=${q} onChange=${setQ} placeholder="Search by batch, lab code, or drill hole…" style=${{ maxWidth: "520px" }} onEnter=${() => go("search-" + hashq(q))} />
      <${Chips} scroll sm items=${[{ id: "all", label: "All", count: res.length }].concat(TYPES.map((t) => ({ id: t, label: t, count: res.filter((r) => r.type === t).length })).filter((c) => c.count))} value=${type} onChange=${setType} />
      ${!res.length ? html`<${Card}><${Empty} icon="magnifying-glass" title=${'Nothing matches "' + q + '"'} text="Check the ID, or search by another field." action=${html`<${Button} onClick=${() => go("advanced-search")}>Open advanced search</${Button}>`} /></${Card}>`
        : groups.map(([t, rs]) => html`<${Card} key=${t} title=${t} head=${html`<${CountPill} n=${rs.length} />`} actions=${type === "all" && rs.length > 4 && html`<button class="linkbtn" onClick=${() => setType(t)}>Show all</button>`}>
          <div class="col" style=${{ gap: 0 }}>${rs.slice(0, type === "all" ? 4 : 50).map((r) => html`<button key=${r.type + r.id} class="row g12" style=${{ textAlign: "left", padding: "10px 4px", borderBottom: "1px solid var(--surface-divider)" }} onClick=${() => go(r.link)}><${Icon} n=${ICON[t]} cls="c-brand" /><b class="t-data-b" style=${{ minWidth: "130px" }}>${r.title}</b><span class="t-sm c-sec row g10 wrap grow">${r.sub.filter(Boolean).map((x, i) => html`<span key=${i}>${x}</span>`)}</span><${Icon} n="caret-right" cls="c-mut" /></button>`)}</div></${Card}>`)}</${Page}>`;
  }

  /* ---------- advanced search ---------- */
  const FIELDS = { Samples: ["Sample ID", "Drill hole", "Client", "Job order", "Batch", "Status", "Condition", "Received date", "Result: Ash", "Result: GCV", "Result: TS"], Batches: ["Batch", "Client", "Status", "Standard", "Deadline"], "Job orders": ["Job order", "Client", "Status", "Due date"], Results: ["Result: parameter", "Result: value", "Entered date"] };
  const OPS = ["is", "is not", "contains", "greater than", "less than", "between", "before"];
  function rowsFor(db, type) {
    if (type === "Batches") return db.batches.map((b) => { const o = S.order(db, b.jo); return { key: b.no, link: "batch-" + b.no, Batch: b.no, Client: S.client(db, o.client).name, Status: D.B_STATUS[b.status][0], Standard: b.std, Deadline: b.deadline }; });
    if (type === "Job orders") return db.orders.map((o) => ({ key: o.no, link: "order-" + o.no, "Job order": o.no, Client: S.client(db, o.client).name, Status: D.JO_STATUS[o.status][0], "Due date": o.due }));
    const out = [];
    db.batches.forEach((b) => { const o = S.order(db, b.jo); b.samples.forEach((sid) => { const s = o.samples.find((x) => x.id === sid) || {}, r = b.rows[sid];
      const base = { key: sid, link: "sample-" + sid, "Sample ID": sid, "Lab code": r.lab, "Drill hole": s.hole, Client: S.client(db, o.client).name, "Job order": o.no, Batch: b.no, Status: D.S_STATE[S.sampleState(db, o, s)][0], Condition: r.cond, "Received date": b.confirmed ? b.confirmed.at.slice(0, 10) : "", "Depth (m)": s.from ? s.from + "–" + s.to : "", "Result: Ash": r.values.Ash, "Result: GCV": r.values.GCV, "Result: TS": r.values.TS };
      if (type === "Results") Object.entries(r.values).forEach(([p, v]) => out.push(Object.assign({}, base, { key: sid + p, "Result: parameter": p, "Result: value": v, "Entered date": b.anaDone ? b.anaDone.at.slice(0, 10) : "" })));
      else out.push(base); }); });
    return out;
  }
  function test(v, op, x) { if (v == null || v === "") return op === "is not"; const s = String(v).toLowerCase(), t = String(x || "").toLowerCase();
    if (op === "is") return s === t; if (op === "is not") return s !== t; if (op === "contains") return s.includes(t); if (op === "greater than") return +v > +x; if (op === "less than") return +v < +x; if (op === "before") return String(v) < x;
    if (op === "between") { const [a, b] = String(x).split(".."); return String(v) >= a && String(v) <= b; } return true; }
  function Advanced({ qid }) {
    const { db, role, go, bp, update, toast, me, can } = useApp();
    const types = can("values.view") ? ["Samples", "Batches", "Job orders", "Results"] : ["Samples", "Batches", "Job orders"];
    const saved = db.queries.find((x) => x.id === qid);
    const [type, setType] = useState(saved ? saved.type : "Samples"), [match, setMatch] = useState(saved ? saved.match : "all"), [conds, setConds] = useState(saved ? clone(saved.conds) : [["Drill hole", "is", ""]]), [ran, setRan] = useState(!!saved), [colsOpen, setColsOpen] = useState(false), [save, setSave] = useState(false), [nm, setNm] = useState(""), [share, setShare] = useState(false);
    useEffect(() => { if (saved) { setType(saved.type); setMatch(saved.match); setConds(clone(saved.conds)); setRan(true); } }, [qid]);
    const allCols = type === "Samples" ? ["Sample ID", "Lab code", "Drill hole", "Depth (m)", "Result: Ash", "Result: TS", "Status", "Client", "Received date", "Condition"] : type === "Results" ? ["Sample ID", "Batch", "Result: parameter", "Result: value", "Entered date", "Client"] : FIELDS[type];
    const [cols, setCols] = useState(null); const shown = (cols || allCols.slice(0, 8)).filter((c) => can("values.view") || !/^Result/.test(c));
    const rows = ran ? rowsFor(db, type).filter((r) => { const ts = conds.filter((c) => c[0] && c[2] !== "").map((c) => test(r[c[0]], c[1], c[2])); return !ts.length || (match === "all" ? ts.every(Boolean) : ts.some(Boolean)); }) : [];
    const pg = usePaged(rows, 10, JSON.stringify(conds) + match + type + ran);
    const set = (i, k, v) => { const n = clone(conds); n[i][k] = v; setConds(n); };
    const mine = db.queries.filter((x) => x.owner === me.name), shared = db.queries.filter((x) => x.shared && x.owner !== me.name);
    const qmenu = (x) => [x.owner === me.name && { label: "Rename", icon: "pencil-simple", onClick: () => { const n = x.name + " (renamed)"; update((d) => (d.queries.find((y) => y.id === x.id).name = n)); } }, { label: "Duplicate", icon: "copy", onClick: () => update((d) => d.queries.push(Object.assign(clone(x), { id: "q" + Date.now(), name: x.name + " copy", owner: me.name, shared: false }))) },
      x.owner === me.name && { label: x.shared ? "Stop sharing" : "Share", icon: "users", onClick: () => update((d) => (d.queries.find((y) => y.id === x.id).shared = !x.shared)) }, x.owner === me.name && { label: "Delete", icon: "trash", danger: true, onClick: () => update((d) => (d.queries = d.queries.filter((y) => y.id !== x.id))) }];
    const side = html`<${Card} title="Saved queries"><span class="t-over">My queries</span>${mine.length ? mine.map((x) => html`<div key=${x.id} class="row g6"><button class="linkbtn grow" style=${{ fontWeight: x.id === qid ? 700 : 500 }} onClick=${() => go("advanced-search-" + x.id)}>${x.name}</button><${Menu} size=${28} items=${qmenu(x)} /></div>`) : html`<span class="t-cap c-mut">None yet.</span>`}
      <span class="t-over">Shared with me</span>${shared.map((x) => html`<div key=${x.id} class="row g6"><button class="linkbtn grow" onClick=${() => go("advanced-search-" + x.id)}>${x.name}</button><${Menu} size=${28} items=${qmenu(x)} /></div>`)}</${Card}>`;
    return html`<${Page}><${PageHead} crumb=${[["Search", "search"], ["Advanced search"]]} title="Advanced search" />
      <div class="grid" style=${{ gridTemplateColumns: bp === "desktop" ? "260px minmax(0,1fr)" : "1fr", alignItems: "start" }}>${bp === "desktop" && side}<div class="col g20">
        <${Card} title="Conditions" actions=${html`<${Seg} label="Match" items=${[["all", "All"], ["any", "Any"]]} value=${match} onChange=${setMatch} />`}>
          <div class="row g10 wrap"><span class="t-sm c-sec">Find</span><select class="input" style=${{ width: "160px" }} id="as-type" value=${type} onChange=${(e) => { setType(e.target.value); setConds([[FIELDS[e.target.value][0], "is", ""]]); setRan(false); setCols(null); }}>${types.map((t) => html`<option key=${t}>${t}</option>`)}</select><span class="t-sm c-sec">where ${match === "all" ? "all" : "any"} of these are true</span></div>
          ${conds.map((c, i) => html`<div key=${i} class="row g8 wrap"><select class="input" style=${{ width: bp === "phone" ? "100%" : "190px" }} value=${c[0]} aria-label="Field" onChange=${(e) => set(i, 0, e.target.value)}>${FIELDS[type].filter((f) => can("values.view") || !/^Result/.test(f)).map((f) => html`<option key=${f}>${f}</option>`)}</select>
            <select class="input" style=${{ width: "150px" }} value=${c[1]} aria-label="Operator" onChange=${(e) => set(i, 1, e.target.value)}>${OPS.map((o) => html`<option key=${o}>${o}</option>`)}</select>
            <input class="input" style=${{ width: bp === "phone" ? "100%" : "220px" }} id=${"as-v" + i} value=${c[2]} placeholder=${c[1] === "between" ? "2026-10-01..2026-10-31" : "Value"} aria-label="Value" onInput=${(e) => set(i, 2, e.target.value)} />
            <${IconBtn} n="x" label="Remove condition" disabled=${conds.length === 1} onClick=${() => setConds(conds.filter((_, k) => k !== i))} /></div>`)}
          <div class="row g10 wrap"><${Button} icon="plus" onClick=${() => setConds(conds.concat([[FIELDS[type][0], "is", ""]]))}>Add condition</${Button}><span class="grow"></span><${Button} type="ghost" onClick=${() => { setConds([[FIELDS[type][0], "is", ""]]); setRan(false); }}>Clear all</${Button}><${Button} icon="floppy-disk" onClick=${() => setSave(true)}>Save query</${Button}><${Button} type="primary" icon="magnifying-glass" id="as-run" onClick=${() => setRan(true)}>Search</${Button}></div></${Card}>
        ${!ran ? html`<${Card}><${Empty} icon="funnel" title="Build a query, then press Search" text="Pick what you are searching for, add conditions, and choose whether all or any must be true." /></${Card}>`
          : html`<${Card} title=${plural(rows.length, "result")} actions=${html`<span style=${{ position: "relative" }}><${Button} icon="list" onClick=${() => setColsOpen(!colsOpen)}>Columns</${Button}>${colsOpen && html`<div class="menu" style=${{ right: 0, top: "38px", padding: "10px", gap: "8px" }}>${allCols.filter((c) => can("values.view") || !/^Result/.test(c)).map((c) => html`<${Check} key=${c} on=${shown.includes(c)} label=${c} onChange=${(v) => setCols(v ? shown.concat([c]) : shown.filter((x) => x !== c))} />`)}</div>`}</span>
              <${Button} icon="download-simple" onClick=${() => toast(plural(rows.length, "row") + " exported as CSV (sample file)")}>Export</${Button}>`}>
            ${rows.length > 500 && html`<${Alert} tone="info" title=${"Showing the first 500 of " + rows.length.toLocaleString("en-US")} text="Narrow the conditions, or export to get every row." />`}
            <${Table} rows=${pg.rows} keyOf=${(r) => r.key} onRow=${(r) => go(r.link)} cols=${shown.map((c) => ({ h: c, render: (r) => (r[c] == null || r[c] === "" ? html`<span class="c-mut">—</span>` : /Sample ID|Batch|Job order|Lab code/.test(c) ? html`<span class="t-data">${r[c]}</span>` : String(r[c])) }))} empty=${html`<${Empty} icon="magnifying-glass" title="No rows match" text="Loosen a condition, or switch Match to Any." />`} /><${Pager} ...${pg.pager} /></${Card}>`}
        ${bp !== "desktop" && side}</div></div>
      ${save && html`<${Dialog} title="Save query" size="sm" sub="Saved queries appear on the left and can be run again." onClose=${() => setSave(false)} footer=${html`<${Button} onClick=${() => setSave(false)}>Cancel</${Button}><${Button} type="primary" id="sq-save" disabled=${!nm.trim()} onClick=${() => { const id = "q" + Date.now(); update((d) => d.queries.push({ id, name: nm, owner: me.name, shared: share, type, match, conds: clone(conds) })); setSave(false); toast("Query saved"); go("advanced-search-" + id); }}>Save</${Button}>`}>
        <${TextField} id="sq-name" label="Name" req value=${nm} onChange=${setNm} placeholder="e.g. High-ash BNM samples" /><${Switch} on=${share} onChange=${setShare} label="Share with staff (they can run and duplicate it)" /></${Dialog}>`}</${Page}>`;
  }

  /* ---------- sample history ---------- */
  function History({ id }) {
    const { db, go, can, bp, role, toast } = useApp();
    let o, s; for (const x of db.orders) { const y = x.samples.find((z) => z.id === id); if (y) { o = x; s = y; break; } }
    const [vals, setVals] = useState(false);
    if (!s) return html`<${Page}><${Card}><${Empty} icon="question" title=${id + " was not found"} /></${Card}></${Page}>`;
    const b = s.batch && S.batch(db, s.batch), r = b && b.rows[id], st = S.sampleState(db, o, s);
    const ev = [{ t: "Registered on " + o.no, by: o.createdBy, at: o.created, icon: "clipboard-text" }];
    if (b) ev.push({ t: "Added to " + b.no, by: b.createdBy || "Maya Lestari", at: b.date, icon: "stack" });
    if (s.flag && s.flag.state === "awaiting") ev.push({ t: "Returned to the job order as Awaiting arrival", sub: "from " + s.flag.from, by: "Dedi Kurniawan", at: "2026-11-01", icon: "arrow-u-up-left" });
    if (s.flag && s.flag.state === "notreceived") ev.push({ t: "Marked as not received", sub: s.flag.reason, by: s.flag.by, at: s.flag.at, icon: "file-x" });
    if (b && b.confirmed) ev.push({ t: "Received", sub: r ? [r.mass && r.mass + " kg", r.cond].filter(Boolean).join(", ") : "", by: b.confirmed.by, at: b.confirmed.at, icon: "package" });
    if (r && r.hold) ev.push({ t: "Held: " + r.hold, sub: "Printed as not analysed", by: "Dedi Kurniawan", at: b.confirmed.at, icon: "prohibit" });
    if (r && r.adl) ev.push({ t: "ADL entered", sub: can("values.view") ? r.adl.v.toFixed(2) + " %" : "", by: r.adl.by, at: r.adl.at, icon: "flask" });
    if (b && b.anaDone && !r.hold) ev.push({ t: "Analysis finished", by: b.anaDone.by, at: b.anaDone.at, icon: "rows" });
    if (b && b.roa) ev.push({ t: "Reported in " + b.roa.no, by: b.roa.by, at: b.roa.at, icon: "file-text", link: can("roa.download") ? "roa-" + b.roa.no : null });
    const coa = S.currentCoa(o); if (coa && coa.published && b && b.status === "completed") ev.push({ t: "Certified in " + coa.no, by: coa.by, at: coa.published, icon: "certificate", link: "report-" + coa.no });
    return html`<${Page}><${PageHead} crumb=${[["Job orders", "orders"], [o.no, "order-" + o.no + "-samples"], [id]]} title=${id} badge=${html`<${Badge} label=${D.S_STATE[st][0]} tone=${D.S_STATE[st][1]} />`}
        actions=${html`${D.can(role, "audit.read") && html`<${Button} icon="clock-counter-clockwise" id="to-audit" onClick=${() => go("audit-" + id)}>Audit</${Button}>`}<${Button} icon="file-pdf" onClick=${() => toast(id + " history exported as PDF (sample file)")}>Export PDF</${Button}>`}
        meta=${html`<div class="row g12 wrap t-sm c-sec"><span>${S.client(db, o.client).name}</span><span>${s.hole}</span><span>${s.from && s.from + "–" + s.to + " m"}</span>${r && html`<span class="t-data">${r.lab}</span>`}</div>`} />
      <div class="grid" style=${{ gridTemplateColumns: bp === "desktop" ? "minmax(0,1fr) 320px" : "1fr", alignItems: "start" }}>
        <${Card} title="History"><div class="col g16">${ev.map((e, i) => html`<div key=${i} class="row top g12"><span style=${{ width: "10px", height: "10px", borderRadius: "5px", background: i === ev.length - 1 ? "var(--accent)" : "var(--primary)", marginTop: "6px", flex: "none" }}></span>
          <div class="col grow" style=${{ gap: "2px" }}>${e.link ? html`<a class="link t-sm" onClick=${() => go(e.link)}>${e.t}</a>` : html`<b class="t-sm w6">${e.t}</b>`}${e.sub && html`<span class="t-cap c-sec">${e.sub}</span>`}<span class="row g6 t-cap c-mut"><${Avatar} name=${e.by} size=${24} /><span>${e.by}</span><span>${fmtDate(e.at)}</span></span></div></div>`)}</div></${Card}>
        <${Card} title="Sample"><div><${KV} k="Job order"><${RecLink} to=${"order-" + o.no} cls="t-data">${o.no}</${RecLink}></${KV}><${KV} k="Batch">${b ? html`<${RecLink} to=${"batch-" + b.no} cls="t-data">${b.no}</${RecLink}>` : "—"}</${KV}><${KV} k="Description">${s.desc}</${KV}><${KV} k="Condition">${r && r.cond || "—"}</${KV}></div>
          ${r && Object.keys(r.values).length > 0 && can("values.view") && html`<${Button} size="sm" icon="eye" onClick=${() => setVals(!vals)}>View values</${Button}>${vals && html`<div>${Object.entries(r.values).map(([p, v]) => html`<${KV} key=${p} k=${p}><span class="t-data">${(+v).toFixed(D.PARAM_INFO[p] ? D.PARAM_INFO[p][3] : 2)}</span></${KV}>`)}</div>`}`}</${Card}></div></${Page}>`;
  }

  ROUTES.push({ re: /^search$/, nav: "search", render: () => html`<${Results} />` }, { re: /^search-([\w-]+)$/, nav: "search", render: (m) => html`<${Results} q0=${m[1]} />` },
    { re: /^advanced-search(?:-(q\w+))?$/, nav: "search", render: (m) => html`<${Advanced} qid=${m[1]} />` }, { re: /^sample-([A-Z]+-\d+)$/, nav: "search", render: (m) => html`<${History} id=${m[1]} />` });
  FLOWS.push(
    { id: "SE1", group: "Search", title: "Quick search", role: "lab_admin", steps: "Click the top bar search (or press /): recent searches; type BNM-3507, press Enter; the sample history opens.", start: { hash: "dashboard" } },
    { id: "SE2", group: "Search", title: "Advanced search", role: "lab_admin", steps: "Open High-ash BNM samples, switch Match to Any, Columns, Save query (shared), Export.", start: { hash: "advanced-search" } },
    { id: "SE3", group: "Search", title: "From history to audit", role: "supervisor", steps: "Sample history of BNM-3507, Audit: the audit log filtered to that sample.", start: { hash: "sample-BNM-3507" } },
  );
})();
