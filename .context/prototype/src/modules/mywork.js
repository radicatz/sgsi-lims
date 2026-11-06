/* My work (My_Work_Prototype_Plan.md): overview and queue pages, queues Q1 to Q7 of the screen plan. */
(function () {
  const ago = (iso) => { const d = daysBetween(iso.slice(0, 10), D.TODAY); if (d <= 0) { const h = Math.max(1, Math.round((Date.parse(D.TODAY + "T12:00") - Date.parse(iso.length > 10 ? iso : iso + "T08:00")) / 3600000)); return h + " h"; } return d + " d"; };
  const due = (iso) => daysBetween(D.TODAY, iso);
  const bRow = (db, b, action, link) => { const o = S.order(db, b.jo), c = S.client(db, o.client); return { key: b.no, no: b.no, sub: c.name, client: c.id, jo: b.jo, since: b.status === "analysisfinished" && b.anaDone ? b.anaDone.at : b.status === "prepfinished" && b.prepDone ? b.prepDone.at : b.date, deadline: b.deadline, status: b.status, action, link, n: b.samples.length }; };
  const QUEUES = [
    { id: "receive", label: "Batches to receive", icon: "package", roles: ["cso", "prep", "lab_admin"], action: "Open reception",
      rows: (db) => db.batches.filter((b) => ["created", "receiving"].includes(b.status)).map((b) => bRow(db, b, "Open reception", "batch-" + b.no + "-reception")) },
    { id: "arrival", label: "Samples awaiting arrival", icon: "hourglass", roles: ["cso", "prep"], action: "Add batch",
      rows: (db) => db.orders.flatMap((o) => { const w = o.samples.filter((s) => s.flag && s.flag.state === "awaiting"); if (!w.length) return []; const c = S.client(db, o.client);
        return [{ key: o.no, no: o.no, sub: c.name, client: c.id, jo: o.no, since: "2026-11-01", deadline: o.due, samples: w.map((s) => s.id), action: "Add batch", link: "order-" + o.no + "-batches" }]; }) },
    { id: "prep", label: "In preparation", icon: "flask", roles: ["prep"], action: "Continue", rows: (db) => db.batches.filter((b) => b.status === "preparation").map((b) => bRow(db, b, "Continue", "batch-" + b.no + "-preparation")) },
    { id: "entry", label: "Ready for data entry", icon: "rows", roles: ["analyst"], action: "Enter values", rows: (db) => db.batches.filter((b) => ["prepfinished", "analysis"].includes(b.status)).map((b) => bRow(db, b, "Enter values", "batch-" + b.no + "-analysis")) },
    { id: "roa", label: "Signed RoA to upload", icon: "upload-simple", roles: ["lab_admin"], action: "Upload RoA", rows: (db) => db.batches.filter((b) => b.status === "analysisfinished").map((b) => bRow(db, b, "Upload RoA", "batch-" + b.no + "-analysis")) },
    { id: "generate", label: "CoAs to generate", icon: "certificate", roles: ["lab_admin"], action: "Generate CoA",
      rows: (db) => db.orders.filter((o) => S.coaState(db, o) === "ready").map((o) => { const c = S.client(db, o.client), bs = S.batchesOf(db, o.no); const last = bs.map((b) => b.completed && b.completed.at).sort().pop() || o.created;
        return { key: o.no, no: o.no, sub: c.name, client: c.id, jo: o.no, since: last, deadline: o.due, nb: bs.length, action: "Generate CoA", link: "order-" + o.no + "-coa" }; }) },
    { id: "send", label: "CoAs to send", icon: "paper-plane-tilt", roles: ["cso"], action: "Mark sent",
      rows: (db) => db.orders.flatMap((o) => { const c = S.currentCoa(o); if (!c || c.status !== "published") return []; const cl = S.client(db, o.client);
        return [{ key: c.no, no: c.no, coa: c, sub: cl.name, client: cl.id, jo: o.no, since: c.published, deadline: addDays(c.published, 3), nb: S.batchesOf(db, o.no).length, action: "Mark sent", link: "report-" + c.no }]; }) },
  ];
  const mine = (role) => QUEUES.filter((q) => q.roles.includes(role));
  const late = (r) => r.deadline && due(r.deadline) < 0;
  MOD.work = { total: (db, role) => mine(role).reduce((a, q) => a + q.rows(db).length, 0), QUEUES };

  function Overview() {
    const { db, role, go, bp } = useApp();
    const qs = mine(role).map((q) => ({ q, rows: q.rows(db) }));
    const total = qs.reduce((a, x) => a + x.rows.length, 0);
    const wipSrc = { lab_admin: "roa", prep: "prep", analyst: "entry" }[role];
    const wip = wipSrc && (qs.find((x) => x.q.id === wipSrc) || { rows: [] }).rows[0];
    const recent = db.audit.filter((a) => a.type !== "Sign-in").slice(0, 8);
    return html`<${Page}><${PageHead} overline=${longDate(D.TODAY)} title="My work" />
      <div class="grid" style=${{ gridTemplateColumns: bp === "desktop" ? "minmax(0,1fr) 300px" : "1fr", alignItems: "start" }}>
        <div class="col g20">
          ${wip && html`<${Card} title="Work in progress"><div class="row g12" style=${{ border: "1px solid var(--surface-border)", borderRadius: "12px", padding: "12px" }}>
            <span class="av s40" style=${{ borderRadius: "10px" }}><${Icon} n="file-text" s="20" /></span>
            <div class="col grow" style=${{ gap: 0 }}><span class="row g6 wrap"><b class="t-sm w6">${wip.no}</b><span class="t-sm c-brand w5">${{ roa: "RoA upload", prep: "Preparation", entry: "Data entry" }[wipSrc]}</span></span><span class="t-cap c-sec row g6 wrap"><span>Started ${ago(wip.since)} ago</span><span>${wip.sub}</span></span></div>
            <${Button} id="wip-continue" onClick=${() => go(wip.link)}>Continue</${Button}></div></${Card}>`}
          <h2 class="t-h3">My queues</h2>
          ${total === 0 ? html`<${Card}><${Empty} icon="check-circle" title="All caught up" text="New work appears here as soon as it reaches you." action=${html`<${Button} onClick=${() => go("dashboard")}>Open the dashboard</${Button}>`} /></${Card}>`
            : html`<div class="grid" style=${{ gridTemplateColumns: bp === "phone" ? "1fr" : "repeat(auto-fill, minmax(220px, 1fr))", gap: "16px" }}>${qs.map(({ q, rows }) => { const lt = rows.filter(late).length, old = rows.map((r) => r.since).sort()[0];
              return html`<button key=${q.id} class="card" id=${"q-" + q.id} style=${{ textAlign: "left", borderColor: lt ? "var(--feedback-error)" : undefined, gap: "8px" }} onClick=${() => go("work-" + q.id)}>
                <span class="row"><span class="av s28" style=${{ borderRadius: "8px", background: "var(--primary-50)", color: "var(--action-brand-text)" }}><${Icon} n=${q.icon} /></span><b class="t-sm w6 grow">${q.label}</b><${Icon} n="caret-right" cls="c-mut" /></span>
                <span class="t-num">${rows.length}</span>
                <span class="t-cap c-sec">${rows.length ? "Oldest waiting " + ago(old) : "Nothing waiting"}</span>
                ${lt > 0 && html`<span class="t-cap c-err row g4"><${Icon} n="warning" />${lt} past due</span>`}</button>`; })}</div>`}
        </div>
        <${Card} title="Recent activity"><div class="col g12">${recent.map((a) => html`<div key=${a.id} class="row top g10"><${Avatar} name=${a.user} size=${28} /><div class="col" style=${{ gap: 0 }}><span class="t-sm">${a.user} ${a.action.toLowerCase()} ${a.rec}</span><span class="t-cap c-mut">${a.at.slice(0, 10) === D.TODAY ? "Today, " + a.at.slice(11, 16) : fmtDate(a.at)}</span></div></div>`)}</div>
          ${D.can(role, "audit.read") && html`<button class="linkbtn" onClick=${() => go("audit")}>View all</button>`}</${Card}>
      </div></${Page}>`;
  }

  function Queue({ qid }) {
    const { db, role, go, bp, toast } = useApp();
    const qs = mine(role);
    const q = qs.find((x) => x.id === qid) || qs[0];
    const [txt, setTxt] = useState(""), [co, setCo] = useState(""), [pd, setPd] = useState(false), [sel, setSel] = useState([]), [send, setSend] = useState(null);
    useEffect(() => { setSel([]); }, [qid]);
    let rows = q.rows(db).filter((r) => (!txt || (r.no + r.jo + r.sub).toLowerCase().includes(txt.toLowerCase())) && (!co || r.client === co) && (!pd || late(r)));
    const multi = q.id === "send";
    const waitCell = (r) => html`<span class=${cx("row g4", late(r) && "c-err")}>${late(r) && html`<${Icon} n="warning" />`}${ago(r.since)}</span>`;
    const cols = [
      multi && { h: html`<${Check} on=${sel.length && sel.length === rows.length} mixed=${sel.length > 0 && sel.length < rows.length} onChange=${(v) => setSel(v ? rows.map((r) => r.key) : [])} />`, render: (r) => html`<${Check} on=${sel.includes(r.key)} onChange=${(v) => setSel(v ? sel.concat([r.key]) : sel.filter((k) => k !== r.key))} />`, w: "40px" },
      { h: "Waiting", render: waitCell },
      { h: q.id === "send" ? "CoA" : q.id === "generate" || q.id === "arrival" ? "Job order" : "Batch", render: (r) => html`<div class="two"><b class="t-data-b">${r.no}</b><span>${q.id === "send" ? "Published " + fmtShort(r.since) : q.id === "arrival" ? r.samples.join(", ") : r.sub}</span></div>` },
      (q.id === "send" || !["generate", "arrival"].includes(q.id)) && { h: "Job order", render: (r) => html`<div class="two"><${RecLink} to=${"order-" + r.jo} cls="t-data">${r.jo}</${RecLink}><span>${r.sub}</span></div>` },
      q.id === "send" || q.id === "generate" ? { h: "Batches", render: (r) => plural(r.nb, "batch", "batches") } : q.id === "arrival" ? { h: "Samples", render: (r) => r.samples.length } : { h: "Status", render: (r) => html`<${Badge} label=${D.B_STATUS[r.status][0]} tone=${D.B_STATUS[r.status][1]} sm />` },
      { h: "Deadline", render: (r) => html`<span class=${cx(late(r) && "c-err")}>${fmtDate(r.deadline)}</span>` },
      { h: "", cls: "r", render: (r) => html`<${Button} id=${"act-" + r.key} onClick=${(e) => { e.stopPropagation(); multi ? setSend([r]) : go(r.link); }}>${r.action}</${Button}>` },
    ].filter(Boolean);
    const clients = [...new Set(q.rows(db).map((r) => r.client))];
    const MarkSent = SH.MarkSent;
    return html`<${Page}><${PageHead} crumb=${[["My work", "work"], [q.label]]} title=${q.label} />
      <${Tabs} items=${qs.map((x) => ({ id: x.id, label: x.label, count: x.rows(db).length }))} value=${q.id} onChange=${(id) => go("work-" + id)} />
      <div class="row g12 wrap" style=${{ alignItems: "flex-end" }}><${Search} value=${txt} onChange=${setTxt} placeholder="Search batch, job order or company" style=${{ width: bp === "phone" ? "100%" : "300px" }} />
        <${Select} label="Company" value=${co} onChange=${setCo} options=${[["", "All companies"]].concat(clients.map((c) => [c, S.client(db, c).name]))} style=${{ width: "220px" }} />
        <div style=${{ height: "40px", display: "flex", alignItems: "center" }}><${Check} on=${pd} onChange=${setPd} label="Past due only" /></div></div>
      ${bp === "phone" ? html`<div class="col g12">${rows.map((r) => html`<div key=${r.key} class="mcard" onClick=${() => !multi && go(r.link)}>
          <div class="row between">${multi ? html`<${Check} on=${sel.includes(r.key)} onChange=${(v) => setSel(v ? sel.concat([r.key]) : sel.filter((k) => k !== r.key))} label=${html`<b class="t-data-b">${r.no}</b>`} />` : html`<b class="t-data-b">${r.no}</b>`}${waitCell(r)}</div>
          <span class="t-sm">${r.sub}</span><span class="t-cap c-sec">Deadline ${fmtDate(r.deadline)}</span>
          <${Button} block onClick=${(e) => { e.stopPropagation(); multi ? setSend([r]) : go(r.link); }}>${r.action}</${Button}></div>`)}</div>`
        : html`<${Card}><${Table} cols=${cols} rows=${rows} keyOf=${(r) => r.key} onRow=${multi ? undefined : (r) => go(r.link)} rowCls=${(r) => sel.includes(r.key) && "sel"} /></${Card}>`}
      ${!rows.length && html`<${Card}><${Empty} icon="check-circle" title="Nothing waiting" text=${txt || co || pd ? "Nothing matches these filters." : "This queue is empty."} /></${Card}>`}
      ${multi && sel.length > 0 && html`<div class="sticky-bar"><span class="t-sm grow">${sel.length} selected</span><${Button} onClick=${() => setSel([])}>Clear</${Button}>
        <${Button} onClick=${() => setSend(rows.filter((r) => sel.includes(r.key)))}>Mark sent</${Button}><${Button} type="primary" icon="download-simple" onClick=${() => toast(plural(sel.length, "PDF") + " downloaded (sample files in the prototype)")}>Download PDFs</${Button}></div>`}
      ${send && MarkSent && html`<${MarkSent} coas=${send.map((r) => r.no)} onClose=${() => setSend(null)} onDone=${() => { setSend(null); setSel([]); }} />`}</${Page}>`;
  }

  ROUTES.push({ re: /^work$/, nav: "work", render: () => html`<${Overview} />` }, { re: /^work-(\w+)$/, nav: "work", render: (m) => html`<${Queue} qid=${m[1]} />` });
  FLOWS.push(
    { id: "MW1", group: "My work", title: "Work a queue", role: "prep", steps: "My work, Batches to receive, Open reception on B-2026-0422.", start: { hash: "work" } },
    { id: "MW2", group: "My work", title: "Send several CoAs", role: "cso", steps: "CoAs to send, tick both, Download PDFs, then Mark sent.", start: { hash: "work-send" } },
  );
})();
