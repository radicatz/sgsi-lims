/* Reports (Reports_Prototype_Plan.md): reports list, CoA page (draft, publish, send, revise, void), RoA page, Mark sent. */
(function () {
  const CS = D.COA_STATUS;
  const findCoa = (db, no) => { for (const o of db.orders) { const c = o.coas.find((x) => x.no === no); if (c) return { o, c }; } return null; };

  /* Mark sent: shared by My work, the job order CoA tab and the CoA page. */
  function MarkSent({ coas, onClose, onDone }) {
    const { db, update, toast, api } = useApp();
    const first = findCoa(db, coas[0]); const ct = first && S.contact(db, first.o);
    const [date, setDate] = useState(D.TODAY), [ch, setCh] = useState(["Email"]), [to, setTo] = useState(ct ? ct.name : ""), [note, setNote] = useState(""), [e, setE] = useState(null);
    const chans = db.config.lookups["Send channels"].map((x) => x[0]);
    const ok = () => { if (!ch.length) return setE("Tick at least one way it was sent."); if (!to.trim()) return setE("Enter the recipient.");
      update((d) => coas.forEach((no) => { for (const o of d.orders) { const c = o.coas.find((x) => x.no === no); if (!c) continue; c.sends.push({ date, channels: ch, recipient: coas.length > 1 ? (S.contact(d, o) || {}).name || to : to, note }); c.status = "sent"; if (["reported", "progress"].includes(o.status)) o.status = "delivered"; api.audit(d, "Report", no, "Updated", [["Sent", "", ch.join(", ") + " to " + to]], "Mark sent"); } }));
      toast(coas.length > 1 ? plural(coas.length, "CoA") + " marked as sent." : "CoA marked as sent. " + first.o.no + " is delivered."); (onDone || onClose)(); };
    return html`<${Dialog} title=${coas.length > 1 ? "Mark " + coas.length + " CoAs as sent" : "Mark CoA as sent"} sub=${coas.length > 1 ? coas.join(", ") : html`<span class="row g6 wrap"><span class="t-data">${coas[0]}</span><span>for ${S.client(db, first.o.client).name}.</span></span>`} onClose=${onClose} id="mark-sent-dlg"
      footer=${html`<${Button} onClick=${onClose}>Cancel</${Button}><${Button} type="primary" id="ms-confirm" onClick=${ok}>Confirm</${Button}>`}>
      <${DateField} id="ms-date" label="Date sent" req value=${date} onChange=${setDate} />
      <div class="field"><span class="flabel">Sent by<span class="req">*</span></span><div class="row g16 wrap">${chans.map((c) => html`<${Check} key=${c} id=${"ms-" + c} on=${ch.includes(c)} label=${c} onChange=${(v) => { setE(null); setCh(v ? ch.concat([c]) : ch.filter((x) => x !== c)); }} />`)}</div></div>
      <${TextField} id="ms-to" label="Recipient" req value=${to} onChange=${setTo} help=${coas.length > 1 ? "Each job order's contact is used; this is the fallback." : "From the job order contact."} />
      <${TextField} id="ms-note" label="Note" opt value=${note} onChange=${setNote} placeholder="e.g. courier receipt no." />${e && html`<span class="help err">${e}</span>`}</${Dialog}>`;
  }
  SH.MarkSent = MarkSent;

  /* ---------- list ---------- */
  function List() {
    const { db, go, bp, can, role, toast } = useApp();
    const both = can("coa.download") && can("roa.download");
    const [tab, setTab] = useState(can("coa.download") ? "coa" : "roa"), [q, setQ] = useState(""), [co, setCo] = useState(""), [period, setPeriod] = useState("90"), [st, setSt] = useState("all"), [sel, setSel] = useState([]), [send, setSend] = useState(null), [fl, setFl] = useState(false), [dlg, setDlg] = useState(null);
    useEffect(() => setSel([]), [tab]);
    const from = addDays(D.TODAY, -+period);
    const coas = S.allCoas(db).filter((c) => c.status !== "draft" || can("coa.write")).filter((c) => !c.published || c.published > from || c.status === "draft");
    const roas = S.allRoas(db).filter((r) => r.at > from);
    const mq = (r) => (!q || (r.no + r.jo + (r.batch || "") + S.client(db, r.client).name).toLowerCase().includes(q.toLowerCase())) && (!co || r.client === co);
    const rows = (tab === "coa" ? coas.filter((c) => st === "all" || c.status === st) : roas).filter(mq).sort((a, b) => ((a.published || a.at || "9") < (b.published || b.at || "9") ? 1 : -1));
    const pg = usePaged(rows, 10, tab + q + co + period + st);
    const chips = [{ id: "all", label: "All", count: coas.filter(mq).length }].concat(["draft", "published", "sent", "superseded"].filter((s) => s !== "draft" || can("coa.write")).map((s) => ({ id: s, label: CS[s][0], count: coas.filter((c) => c.status === s && mq(c)).length })));
    const key = (r) => r.no;
    const menuCoa = (c) => [{ label: "Open job order", icon: "clipboard-text", onClick: () => go("order-" + c.jo + "-coa") }, { label: "Print", icon: "printer", onClick: () => toast("Printing is not available in the prototype", { tone: "info" }) },
      can("coa.send") && c.status === "published" && { label: "Mark sent", icon: "paper-plane-tilt", onClick: () => setSend([c.no]) }, can("coa.revise") && ["published", "sent"].includes(c.status) && { label: "Revise", icon: "pencil-simple", onClick: () => go("report-" + c.no + "-revise") }, can("coa.void") && ["published", "sent"].includes(c.status) && { label: "Void", icon: "prohibit", danger: true, onClick: () => go("report-" + c.no + "-void") }];
    const open = (r) => go(tab === "coa" ? (r.status === "draft" ? "report-draft-" + r.jo : "report-" + r.no) : "roa-" + r.no);
    const cb = (r) => html`<${Check} on=${sel.includes(key(r))} onChange=${(v) => setSel(v ? sel.concat([key(r)]) : sel.filter((k) => k !== key(r)))} />`;
    const filters = html`<${Select} label="Period" value=${period} onChange=${setPeriod} options=${[["30", "Last 30 days"], ["90", "Last 90 days"], ["365", "This year"]]} style=${{ width: bp === "phone" ? "100%" : "180px" }} /><${Select} label="Company" value=${co} onChange=${setCo} options=${[["", "All companies"]].concat(db.clients.filter((c) => c.status !== "Archived").map((c) => [c.id, c.name]))} style=${{ width: bp === "phone" ? "100%" : "220px" }} />`;
    return html`<${Page}><${PageHead} overline=${bp === "desktop" ? longDate(D.TODAY) : "Reports"} title="Reports" />
      ${both && html`<${Tabs} id="rep-tabs" items=${[{ id: "coa", label: "CoA", count: coas.length }, { id: "roa", label: "RoA", count: roas.length }]} value=${tab} onChange=${setTab} />`}
      <div class="row g12 wrap" style=${{ alignItems: "flex-end" }}><${Search} id="rep-q" value=${q} onChange=${setQ} placeholder=${tab === "coa" ? "Search number, job order, client" : "Search RoA number, batch, job order, client"} style=${{ width: bp === "phone" ? "calc(100% - 56px)" : "300px" }} />${bp === "phone" ? html`<${IconBtn} n="funnel" type="secondary" size=${44} label="Filters" onClick=${() => setFl(true)} />` : filters}</div>
      ${tab === "coa" && html`<${Chips} scroll items=${chips} value=${st} onChange=${setSt} />`}
      ${!S.allCoas(db).length && !roas.length ? html`<${Card}><${Empty} icon="file-text" title="No reports yet" text="CoAs appear here when a job order's batches are completed and the CoA is published." /></${Card}>`
        : bp === "phone" ? html`<div class="col g10">${pg.rows.map((r) => html`<div key=${r.no + r.jo} class="mcard" onClick=${() => open(r)}><div class="row between"><b class="t-data-b">${r.no}</b>${tab === "coa" && html`<${Badge} label=${CS[r.status][0]} tone=${CS[r.status][1]} sm />`}</div><span class="t-sm">${S.client(db, r.client).name}</span><span class="t-cap c-sec row g6"><span>${r.batch || r.jo}</span><span>${fmtDate(r.published || r.at)}</span></span></div>`)}</div>`
        : html`<${Card}><${Table} rows=${pg.rows} keyOf=${(r) => r.no + r.jo} onRow=${open} rowCls=${(r) => sel.includes(key(r)) && "sel"} empty=${html`<${Empty} icon="magnifying-glass" title="No reports match" text="Try another number or clear the filters." action=${html`<${Button} onClick=${() => { setQ(""); setCo(""); setSt("all"); }}>Clear filters</${Button}>`} />`}
          cols=${tab === "coa" ? [{ h: html`<${Check} on=${sel.length > 0 && sel.length === pg.rows.length} onChange=${(v) => setSel(v ? pg.rows.map(key) : [])} />`, w: "40px", render: cb }, { h: "Number", render: (c) => html`<b class="t-data-b c-head">${c.no}</b>` }, { h: "Job order", render: (c) => html`<${RecLink} to=${"order-" + c.jo} cls="t-data">${c.jo}</${RecLink}>` },
            { h: "Client", render: (c) => { const cl = S.client(db, c.client); return html`<span class="row g8"><${Avatar} name=${cl.name} size=${28} logo=${cl.logo} /><span>${cl.name}</span></span>`; } }, { h: "Status", render: (c) => html`<${Badge} label=${CS[c.status][0]} tone=${CS[c.status][1]} sm />` },
            { h: "Published", render: (c) => (c.published ? fmtDate(c.published) : "—") }, bp === "desktop" && { h: "Signatory", render: (c) => (S.signatory(db, c.signatory) || {}).name || "—" },
            bp === "desktop" && { h: "Sent", render: (c) => (c.sends.length ? html`<span class="row g4"><${Icon} n=${c.sends[0].channels[0] === "WhatsApp" ? "whatsapp-logo" : "envelope-simple"} />${fmtShort(c.sends[c.sends.length - 1].date)}</span>` : "—") },
            { h: "", cls: "r", render: (c) => html`<span class="row g4" style=${{ justifyContent: "flex-end" }}>${c.status !== "draft" && html`<${IconBtn} n="download-simple" label=${"Download " + c.no} onClick=${() => toast(c.no + ".pdf downloaded (sample file)")} />`}<${Menu} items=${menuCoa(c)} label=${"Actions for " + c.no} /></span>` }].filter(Boolean)
          : [{ h: html`<${Check} on=${sel.length > 0 && sel.length === pg.rows.length} onChange=${(v) => setSel(v ? pg.rows.map(key) : [])} />`, w: "40px", render: cb }, { h: "RoA number", render: (r) => html`<b class="t-data-b c-head">${r.no}</b>` }, { h: "Batch", render: (r) => html`<${RecLink} to=${"batch-" + r.batch} cls="t-data">${r.batch}</${RecLink}>` }, { h: "Job order", render: (r) => html`<${RecLink} to=${"order-" + r.jo} cls="t-data">${r.jo}</${RecLink}>` },
            { h: "Client", render: (r) => S.client(db, r.client).name }, { h: "Uploaded", render: (r) => fmtDate(r.at) }, bp === "desktop" && { h: "Uploaded by", render: (r) => r.by },
            { h: "", cls: "r", render: (r) => html`<span class="row g4" style=${{ justifyContent: "flex-end" }}><${IconBtn} n="download-simple" label=${"Download " + r.no} onClick=${() => toast(r.file + " downloaded (sample file)")} /><${Menu} label=${"Actions for " + r.no} items=${[{ label: "Open batch", icon: "stack", onClick: () => go("batch-" + r.batch) }, { label: "Print", icon: "printer", onClick: () => toast("Printing is not available in the prototype", { tone: "info" }) }]} /></span>` }].filter(Boolean)} />
          <${Pager} ...${pg.pager} /></${Card}>`}
      ${sel.length > 0 && html`<div class="sticky-bar"><span class="t-sm grow">${sel.length} selected</span><${Button} onClick=${() => setSel([])}>Clear</${Button}><${Button} type="primary" icon="download-simple" onClick=${() => { toast(plural(sel.length, "PDF") + " downloaded as one ZIP (sample files)"); setSel([]); }}>Download PDFs</${Button}></div>`}
      ${fl && html`<${Dialog} title="Filters" onClose=${() => setFl(false)} footer=${html`<${Button} onClick=${() => { setCo(""); setPeriod("90"); }}>Clear all</${Button}><${Button} type="primary" onClick=${() => setFl(false)}>Apply</${Button}>`}>${filters}</${Dialog}>`}
      ${send && html`<${MarkSent} coas=${send} onClose=${() => setSend(null)} />`}</${Page}>`;
  }

  /* ---------- certificate preview (the report template drawing) ---------- */
  function Certificate({ o, c, page = 1, small }) {
    const { db } = useApp(); const cl = S.client(db, o.client), sg = S.signatory(db, c.signatory), ct = S.client(db, o.client).contacts.find((x) => x.id === c.attention);
    const bs = S.batchesOf(db, o.no); const lab = db.config.lab;
    const rows = []; bs.forEach((b) => b.samples.forEach((s) => rows.push({ s, lab: b.rows[s].lab, v: b.rows[s].values, hold: b.rows[s].hold })));
    const ps = c.params.filter((p) => D.PARAM_INFO[p] && rows.some((r) => r.v[p] != null)).slice(0, 8);
    const paper = { background: "#fff", color: "#1A1A1A", border: "1px solid var(--surface-border)", borderRadius: "6px", padding: small ? "16px" : "32px", fontSize: small ? "10px" : "12px", lineHeight: 1.5, boxShadow: "var(--e-xs)", minWidth: 0 };
    if (page === 2) return html`<div style=${paper}><b style=${{ fontFamily: "var(--f-display)", fontSize: "16px" }}>Notes and methods</b><p>Results relate only to the samples as received. ADB: air-dried basis. AR: as received. DB: dry basis. DAF: dry ash-free basis.</p>
      <p>Methods: ${c.params.filter((p) => D.PARAM_INFO[p]).slice(0, 6).map((p) => { const m = db.config.methods.find((x) => x.p === p && x.s === bs[0].std); return p + " " + (m ? bs[0].std + " " + m.m + ":" + m.e : bs[0].std); }).join("; ")}.</p>
      <p>${lab.name}, accreditation ${lab.accr}. This certificate may not be reproduced except in full.</p><p style=${{ marginTop: "40px" }}>${lab.place}, ${fmtDate(c.published || D.TODAY)}</p><p><b>${sg ? sg.name : ""}</b><br />${sg ? sg.title : ""}</p></div>`;
    return html`<div style=${paper}><div style=${{ display: "flex", gap: "12px", alignItems: "center", borderBottom: "2px solid #1B3A6F", paddingBottom: "10px" }}><span class="logo paperlogo" style=${{ width: "40px", height: "40px" }}></span><div style=${{ flex: 1 }}><b style=${{ fontFamily: "var(--f-display)", fontSize: small ? "13px" : "18px", color: "#0E2A4E" }}>Certificate of Analysis</b><div>${lab.name}</div></div><div style=${{ textAlign: "right", fontFamily: "var(--f-mono)" }}>${c.status === "draft" ? "DRAFT" : c.no}<br />FM-LAB-014 rev 3</div></div>
      <div style=${{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 16px", margin: "10px 0" }}><span>Client: <b>${cl.name}</b></span><span>Job order: ${o.no}</span><span>Attention: ${ct ? ct.name : "—"}</span><span>Client reference: ${c.po || "—"}</span><span>Samples: ${rows.length}</span><span>Bases: ${c.bases.join(", ")}</span></div>
      <div style=${{ overflowX: "auto" }}><table style=${{ borderCollapse: "collapse", width: "100%", fontFamily: "var(--f-mono)", fontSize: small ? "9px" : "11px" }}><thead><tr style=${{ background: "#F0F4FA" }}><th style=${{ textAlign: "left", padding: "4px" }}>Sample</th><th style=${{ textAlign: "left", padding: "4px" }}>Lab code</th>${ps.map((p) => html`<th key=${p} style=${{ textAlign: "right", padding: "4px" }}>${p}</th>`)}</tr></thead>
        <tbody>${rows.slice(0, small ? 6 : 14).map((r) => html`<tr key=${r.s} style=${{ borderBottom: "1px solid #EEE" }}><td style=${{ padding: "3px 4px" }}>${r.s}</td><td style=${{ padding: "3px 4px" }}>${r.lab}</td>${ps.map((p) => html`<td key=${p} style=${{ textAlign: "right", padding: "3px 4px" }}>${r.hold ? "n.a." : r.v[p] != null ? (+r.v[p]).toFixed(D.PARAM_INFO[p][3]) : ""}</td>`)}</tr>`)}</tbody></table></div>
      ${rows.length > (small ? 6 : 14) && html`<div style=${{ color: "#777", marginTop: "4px" }}>${rows.length - (small ? 6 : 14)} more rows on the PDF</div>`}</div>`;
  }
  SH.Certificate = Certificate;

  /* ---------- CoA page ---------- */
  function CoaPage({ no, draftJo, act }) {
    const { db, go, bp, can, update, toast, api, me } = useApp();
    const hit = draftJo ? (() => { const o = S.order(db, draftJo); const c = o && o.coas.find((x) => x.status === "draft"); return c ? { o, c } : null; })() : findCoa(db, no);
    const [page, setPage] = useState(1), [dlg, setDlg] = useState(act || null), [send, setSend] = useState(false);
    useEffect(() => setDlg(act || null), [act, no]);
    if (!hit) return html`<${Page}><${Card}><${Empty} icon="question" title="This report was not found" action=${html`<${Button} onClick=${() => go("reports")}>Back to reports</${Button}>`} /></${Card}></${Page}>`;
    const { o, c } = hit; const cl = S.client(db, o.client), bs = S.batchesOf(db, o.no), sg = S.signatory(db, c.signatory);
    const draft = c.status === "draft", editable = draft && can("coa.write");
    const setC = (p) => update((d) => Object.assign(d.orders.find((x) => x.no === o.no).coas.find((x) => x.status === "draft"), p));
    const newNo = "CoA-" + o.no + "-" + (o.coas.filter((x) => x.rev > 0).length + 1);
    const publish = () => { update((d) => { const od = d.orders.find((x) => x.no === o.no), x = od.coas.find((y) => y.status === "draft"); const prev = od.coas.find((y) => y.status === "published" || y.status === "sent"); if (prev) { prev.status = "superseded"; prev.supersededAt = D.TODAY; }
        Object.assign(x, { no: newNo, rev: od.coas.filter((y) => y.rev > 0).length + 1, status: "published", published: D.TODAY, by: me.name }); od.status = "reported"; api.audit(d, "Report", newNo, "Published", [["Revision", "", String(x.rev)]], "Reports, CoA page");
        api.notify(d, { to: ["cso"], ev: "N6", icon: "certificate", title: newNo + " is published", text: "Send it to " + cl.name + ".", link: "report-" + newNo }); });
      setDlg(null); toast(newNo + " published. Save these bases and signatory as " + cl.short + "'s default?"); go("report-" + newNo); };
    const crumb = [["Reports", "reports"], [draft ? "Draft CoA" : c.no]];
    const pager = html`<div class="row g8" style=${{ justifyContent: "center" }}><${IconBtn} n="caret-left" label="Previous page" disabled=${page === 1} onClick=${() => setPage(1)} /><span class="t-cap c-sec">Page ${page} of 2</span><${IconBtn} n="caret-right" label="Next page" disabled=${page === 2} onClick=${() => setPage(2)} /></div>`;
    const preview = bp === "phone" ? html`<${Card} title="Document"><${Certificate} o=${o} c=${c} small /><div class="row g10"><${Button} icon="file-pdf" onClick=${() => toast("The sample PDF opens in a new tab in the real app", { tone: "info" })}>${draft ? "Preview PDF" : "Open PDF"}</${Button}></div></${Card}>` : html`<div class="col g10"><${Certificate} o=${o} c=${c} page=${page} />${pager}</div>`;
    const menu = draft ? [can("coa.write") && { label: "Delete draft", icon: "trash", danger: true, onClick: () => setDlg("delete") }] : [{ label: "Open job order", icon: "clipboard-text", onClick: () => go("order-" + o.no + "-coa") }, can("coa.revise") && ["published", "sent"].includes(c.status) && { label: "Revise", icon: "pencil-simple", onClick: () => setDlg("revise") }, can("coa.void") && ["published", "sent"].includes(c.status) && { label: "Void", icon: "prohibit", danger: true, onClick: () => setDlg("void") }];
    const actions = draft ? (editable && html`<${Button} type="primary" icon="certificate" id="publish" onClick=${() => setDlg("publish")}>Publish</${Button}>`)
      : html`${!["void", "superseded"].includes(c.status) && html`<${Button} icon="download-simple" onClick=${() => toast(c.no + ".pdf downloaded (sample file)")}>Download</${Button}><${Button} icon="printer" onClick=${() => toast("Printing is not available in the prototype", { tone: "info" })}>Print</${Button}>`}${c.status === "superseded" && html`<${Button} icon="download-simple" onClick=${() => toast(c.no + ".pdf downloaded (sample file)")}>Download</${Button}>`}
        ${can("coa.send") && ["published", "sent"].includes(c.status) && html`<${Button} type="primary" icon="paper-plane-tilt" id="mark-sent" onClick=${() => setSend(true)}>${c.sends.length ? "Add another send" : "Mark sent"}</${Button}>`}`;
    const draftCard = editable && html`<${Card} title="Build the certificate"><div class="field"><span class="flabel">Bases</span><div class="row g16 wrap">${["ADB", "DB", "DAF", "AR"].map((x) => html`<${Check} key=${x} on=${c.bases.includes(x)} label=${x} onChange=${(v) => setC({ bases: v ? c.bases.concat([x]) : c.bases.filter((y) => y !== x) })} />`)}</div></div>
      <div class="field"><span class="flabel">Parameters on the certificate</span><div class="row g6 wrap">${o.params.filter((p) => D.PARAM_INFO[p]).map((p) => html`<button key=${p} class=${cx("ppill", c.params.includes(p) && "on")} onClick=${() => setC({ params: c.params.includes(p) ? c.params.filter((x) => x !== p) : c.params.concat([p]) })}>${p}</button>`)}</div></div>
      <div class="grid" style=${{ gridTemplateColumns: bp === "phone" ? "1fr" : "1fr 1fr", gap: "16px" }}><${Select} id="coa-att" label="Attention" value=${c.attention} onChange=${(v) => setC({ attention: v })} options=${cl.contacts.map((x) => [x.id, x.name])} />
        <${Select} id="coa-sg" label="Signatory" value=${c.signatory} onChange=${(v) => setC({ signatory: v })} options=${db.signatories.map((x) => [x.id, x.name])} /><${TextField} label="Client reference or PO" value=${c.po} onChange=${(v) => setC({ po: v })} /></div></${Card}>`;
    const details = !draft && html`<${Card} title="Details"><div><${KV} k="Job order"><${RecLink} to=${"order-" + o.no + "-coa"} cls="t-data">${o.no}</${RecLink}></${KV}><${KV} k="Client">${cl.name}</${KV}><${KV} k="Revision">${c.rev}${c.reason ? html`<span class="c-sec">  ${c.reason}</span>` : ""}</${KV}>
        <${KV} k="Published"><span class="row g10"><span>${fmtDate(c.published)}</span><span class="c-brand">${c.by}</span></span></${KV}><${KV} k="Signatory"><span class="row g10"><span>${sg ? sg.name : "—"}</span><span class="c-brand">${sg ? sg.title : ""}</span></span></${KV}><${KV} k="Bases">${c.bases.join(", ")}</${KV}></div></${Card}>
      <${Card} title="Delivery">${c.sends.length ? c.sends.map((x, i) => html`<div key=${i} class="row g8 wrap"><${Icon} n=${x.channels.includes("WhatsApp") ? "whatsapp-logo" : "envelope-simple"} cls="c-ok" /><span class="t-sm">${x.channels.join(" and ")}</span><b class="t-sm w6">${x.recipient}</b><span class="t-cap c-sec">${fmtDate(x.date)}</span></div>`) : html`<span class="t-sm c-mut">Not sent yet.</span>`}</${Card}>
      <${Card} title="Versions">${o.coas.filter((x) => x.rev > 0).map((x) => html`<button key=${x.no} class="row g8" onClick=${() => go("report-" + x.no)}><span class="t-data">${x.no}</span><${Badge} label=${CS[x.status][0]} tone=${CS[x.status][1]} sm /><span class="t-cap c-sec">${fmtShort(x.published)}</span></button>`)}</${Card}>`;
    return html`<${Page}><${PageHead} crumb=${crumb} title=${draft ? "Draft CoA" : c.no} badge=${html`<${Badge} label=${CS[c.status][0]} tone=${CS[c.status][1]} />`} actions=${html`${actions}<${Menu} size=${36} items=${menu} />`}
        meta=${html`<div class="row g12 wrap t-sm c-sec"><span class="t-data">${o.no}</span><span>${cl.name}</span>${!draft && html`<span>Revision ${c.rev}</span>`}</div>`} />
      ${c.status === "superseded" && html`<${Alert} tone="warning" title=${"Superseded by revision " + (c.rev + 1) + " on " + fmtDate(c.supersededAt)} text="This version is kept for the record. Send the current revision to the client." action=${html`<button class="linkbtn" onClick=${() => go("report-" + "CoA-" + o.no + "-" + (c.rev + 1))}>Open the current revision</button>`} />`}
      ${c.status === "void" && html`<${Alert} tone="error" title="Void" text=${c.voidReason || "This CoA is void and its number is not reused."} />`}
      <div class="grid" style=${{ gridTemplateColumns: bp === "desktop" ? "minmax(0,1.3fr) minmax(0,1fr)" : "1fr", alignItems: "start" }}>${preview}<div class="col g20">${draftCard}${details}
        <${Card} title="Built from"><div class="col g8">${bs.map((b) => html`<div key=${b.no} class="row g10 wrap"><${Icon} n="check-circle" cls="c-ok" /><${RecLink} to=${"batch-" + b.no} cls="t-data-b">${b.no}</${RecLink}>${b.roa && html`<${RecLink} to=${"roa-" + b.roa.no} cls="t-data c-sec">${b.roa.no}</${RecLink}>`}<span class="t-cap c-sec">${plural(b.samples.length, "sample")}</span></div>`)}</div></${Card}></div></div>
      ${dlg === "publish" && html`<${Confirm} title=${"Publish CoA for " + o.no + "?"} text=${"It gets the number " + newNo + " and can no longer be edited. To change it later, revise it."} ok="Publish" onClose=${() => setDlg(null)} onOk=${publish} />`}
      ${dlg === "delete" && html`<${Confirm} title="Delete this draft?" text="The job order goes back to Ready to generate." ok="Delete draft" danger onClose=${() => setDlg(null)} onOk=${() => { update((d) => { const od = d.orders.find((x) => x.no === o.no); od.coas = od.coas.filter((x) => x.status !== "draft"); }); toast("Draft deleted"); go("order-" + o.no + "-coa"); }} />`}
      ${dlg === "revise" && html`<${ReviseDlg} o=${o} c=${c} onClose=${() => setDlg(null)} />`}
      ${dlg === "void" && html`<${VoidDlg} o=${o} c=${c} onClose=${() => setDlg(null)} />`}
      ${send && html`<${MarkSent} coas=${[c.no]} onClose=${() => setSend(false)} />`}</${Page}>`;
  }
  function ReviseDlg({ o, c, onClose }) {
    const { update, toast, go, api } = useApp(); const [r, setR] = useState(""), [e, setE] = useState(null);
    return html`<${Confirm} title=${"Revise " + c.no + "?"} text=${"Revision " + c.rev + " stays current until revision " + (c.rev + 1) + " is published. The client keeps what was sent."} ok="Create revision" onClose=${onClose}
      onOk=${() => { if (!r.trim()) return setE("Say what changes"); update((d) => { const od = d.orders.find((x) => x.no === o.no); od.coas.push(Object.assign(clone(c), { no: "Draft CoA", rev: 0, status: "draft", published: null, sends: [], reason: r })); api.audit(d, "Report", c.no, "Updated", [["Revision", String(c.rev), "Draft " + (c.rev + 1)], ["Reason", "", r]], "Reports, CoA page"); }); onClose(); toast("Revision draft created"); go("report-draft-" + o.no); }}>
      <${TextField} id="rev-reason" label="Reason" req value=${r} onChange=${(v) => { setR(v); setE(null); }} error=${e} placeholder="e.g. Client reference corrected" /></${Confirm}>`;
  }
  function VoidDlg({ o, c, onClose }) {
    const { update, toast, api } = useApp(); const [r, setR] = useState(""), [e, setE] = useState(null);
    return html`<${Confirm} title=${"Void " + c.no + "?"} text="The number is never reused. Anyone who downloads it sees it marked void." ok="Void CoA" cancel="Keep CoA" danger onClose=${onClose}
      onOk=${() => { if (!r.trim()) return setE("Give the reason"); update((d) => { const x = d.orders.find((y) => y.no === o.no).coas.find((y) => y.no === c.no); x.status = "void"; x.voidReason = r; api.audit(d, "Report", c.no, "Status changed", [["Status", CS[c.status][0], "Void"], ["Reason", "", r]], "Reports, CoA page"); }); onClose(); toast(c.no + " is void"); }}>
      <${TextField} id="void-reason" label="Reason" req value=${r} onChange=${(v) => { setR(v); setE(null); }} error=${e} /></${Confirm}>`;
  }

  /* ---------- RoA page (Desktop-07-Reports-03-RoA-01-Default): signed copy preview, details, used in ---------- */
  const ROA_ROWS = ["TM", "IM", "Ash", "VM", "FC", "TS", "GCV"];
  // which bases each parameter prints on (values are stored on their measured basis: TM as received, the rest air-dried)
  const ROA_BASES = { TM: ["AR"], IM: ["ADB"], Ash: ["ADB", "DB", "AR"] };
  function roaCell(v, p, basis) {
    const x = v[p]; if (x == null) return null;
    const bases = ROA_BASES[p] || ["ADB", "DB", "DAF", "AR"]; if (!bases.includes(basis)) return null;
    if (p === "TM") return x;
    const im = v.IM, ash = v.Ash, tm = v.TM;
    if (basis === "ADB") return x;
    if (basis === "DB") return im == null ? null : (x * 100) / (100 - im);
    if (basis === "DAF") return im == null || ash == null ? null : (x * 100) / (100 - im - ash);
    if (basis === "AR") return im == null || tm == null ? null : (x * (100 - tm)) / (100 - im);
    return null;
  }
  const roaNum = (x, dec) => (x == null ? "—" : (+x).toLocaleString("en-US", { minimumFractionDigits: dec, maximumFractionDigits: dec }));
  function RoaDoc({ b, o, page, pages, per }) {
    const { db } = useApp(); const lab = db.config.lab, cl = S.client(db, o.client), ct = S.contact(db, o), sg = D.PERSONA.supervisor;
    const ps = ROA_ROWS.filter((p) => b.params.includes(p));
    const method = (p) => { if (p === "FC") return "By calculation"; const m = db.config.methods.find((x) => x.p === p && x.s === b.std); return m ? b.std + " " + m.m : b.std; };
    const list = b.samples.slice((page - 1) * per, page * per), active = b.samples.filter((s) => !b.rows[s].hold).length;
    const muted = { color: "#8A8478" }, th = { textAlign: "right", padding: "2px 4px", fontWeight: 600, color: "#4A4A4A", fontSize: "10.5px", lineHeight: 1.4, whiteSpace: "nowrap", background: "none", height: "auto" }, td = { padding: "1px 4px", fontSize: "10.5px", lineHeight: 1.4, whiteSpace: "nowrap", height: "auto", border: 0 };
    return html`<div style=${{ background: "#fff", color: "#1A1A1A", border: "1px solid var(--surface-border)", borderRadius: "4px", padding: "28px 32px 20px", fontSize: "10.5px", lineHeight: 1.45, boxShadow: "var(--e-xs)", minHeight: "760px", display: "flex", flexDirection: "column", minWidth: 0 }} id="roa-doc">
      <div style=${{ display: "flex", gap: "10px", alignItems: "flex-start" }}><span class="logo paperlogo" style=${{ width: "34px", height: "34px", flex: "none" }}></span>
        <div style=${{ flex: 1 }}><b style=${{ fontSize: "12px" }}>${lab.name.replace(/^PT /, "")}</b><div style=${muted}>${lab.address || "Jl. Pangeran Antasari 12, " + lab.place}</div></div>
        <div style=${{ textAlign: "right" }}><b style=${{ fontFamily: "var(--f-mono)", fontSize: "12px" }}>${b.roa.no}</b><div style=${{ color: "#B42318" }}>Internal, not for distribution</div><div style=${muted}>Issued ${fmtDate(b.roa.at)}</div></div></div>
      <div style=${{ textAlign: "center", fontFamily: "var(--f-display)", fontSize: "20px", fontWeight: 600, margin: "12px 0 10px", color: "#0E2A4E" }}>Report of Analysis</div>
      <div style=${{ borderTop: "1px solid #E5E0D6", paddingTop: "10px", display: "grid", gridTemplateColumns: "70px 1fr 70px 1fr", gap: "2px 8px" }}>
        <span style=${muted}>Principal</span><b>${cl.name}</b><span style=${muted}>Job order</span><b>${o.no}</b>
        <span style=${muted}>Attention</span><b>${ct ? ct.name : "—"}</b><span style=${muted}>Received</span><b>${b.confirmed ? fmtDate(b.confirmed.at) : "—"}</b>
        <span style=${muted}>Reference</span><b>${o.po || "—"}</b><span style=${muted}>Samples</span><b>${active} coal samples</b></div>
      <div style=${{ margin: "10px 0 8px" }}>Results as entered by the Analyst and signed by the Supervisor. The values are reported on four bases.</div>
      ${list.map((s) => { const r = b.rows[s]; return html`<div key=${s} style=${{ marginBottom: "10px" }}>
        <div style=${{ background: "#EEF2F8", padding: "3px 8px", borderRadius: "3px" }}><b>Sample ${s}</b><span style=${{ ...muted, marginLeft: "10px" }}>Lab ID ${r.lab}</span></div>
        ${r.hold ? html`<div style=${{ padding: "4px 8px", color: "#B42318" }}>Not analysed. Held: ${r.hold}.</div>` : html`<table style=${{ width: "100%", borderCollapse: "collapse", fontVariantNumeric: "tabular-nums" }}><thead><tr><th style=${{ ...th, textAlign: "left" }}>Parameter</th><th style=${{ ...th, textAlign: "left" }}>Unit</th>${["ADB", "DB", "DAF", "AR"].map((x) => html`<th key=${x} style=${th}>${x}</th>`)}<th style=${{ ...th, textAlign: "left", paddingLeft: "10px" }}>Method</th></tr></thead>
          <tbody>${ps.map((p) => { const info = D.PARAM_INFO[p]; return html`<tr key=${p}><td style=${td}>${info[0]}</td><td style=${td}>${info[1]}</td>${["ADB", "DB", "DAF", "AR"].map((x) => html`<td key=${x} style=${{ ...td, textAlign: "right" }}>${roaNum(roaCell(r.values, p, x), info[3])}</td>`)}<td style=${{ ...td, ...muted, paddingLeft: "10px" }}>${method(p)}</td></tr>`; })}</tbody></table>`}</div>`; })}
      <div style=${{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: "18px" }}><div><div style=${muted}>Issued at ${lab.place}</div><b>${fmtDate(b.roa.at)}</b></div>
        <div style=${{ borderTop: "1px solid #1A1A1A", paddingTop: "4px", minWidth: "150px" }}><b>${sg.name}</b><div style=${muted}>Technical Supervisor</div></div></div>
      <div style=${{ flex: 1 }}></div>
      <div style=${{ ...muted, display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: "24px", fontSize: "9.5px" }}><div>Internal, not for distribution. Signed copy kept in the laboratory file.<br />Page ${page} of ${pages}</div><div>FM-LAB-021 rev 1</div></div></div>`;
  }
  function RoaPage({ no }) {
    const { db, go, toast, bp } = useApp();
    const [page, setPage] = useState(1);
    const b = db.batches.find((x) => x.roa && x.roa.no === no);
    if (!b) return html`<${Page}><${Card}><${Empty} icon="question" title=${no + " was not found"} /></${Card}></${Page}>`;
    const o = S.order(db, b.jo), cl = S.client(db, o.client);
    const per = 2, pages = Math.max(1, Math.ceil(b.samples.length / per)), pg = Math.min(page, pages);
    const used = o.coas.filter((c) => c.rev > 0);
    const pager = html`<div class="row g8"><${IconBtn} n="caret-left" label="Previous page" disabled=${pg === 1} onClick=${() => setPage(pg - 1)} /><span class="t-cap c-sec">Page ${pg} of ${pages}</span><${IconBtn} n="caret-right" label="Next page" disabled=${pg === pages} onClick=${() => setPage(pg + 1)} /></div>`;
    return html`<${Page}><${PageHead} crumb=${[["Reports", "reports"], [no]]} title=${no} badge=${html`<${Badge} label="Signed copy" tone="blue" />`} actions=${html`<${Button} icon="download-simple" onClick=${() => toast(b.roa.file + " downloaded (sample file)")}>Download</${Button}><${Button} icon="printer" onClick=${() => toast("Printing is not available in the prototype", { tone: "info" })}>Print</${Button}>`}
        meta=${html`<div class="row g12 wrap t-sm c-sec"><${RecLink} to=${"order-" + o.no} cls="t-data">${o.no}</${RecLink}><span>${cl.name}</span><${RecLink} to=${"batch-" + b.no} cls="t-data">${b.no}</${RecLink}></div>`} />
      <${Alert} tone="info" title="Internal, not for distribution" text="This is the lab's signed paper RoA, uploaded when the batch was completed." />
      <div class="grid" style=${{ gridTemplateColumns: bp === "desktop" ? "minmax(0,1.85fr) minmax(0,1fr)" : "1fr", alignItems: "start" }}>
        <${Card} title="Preview" actions=${pager} id="roa-preview"><div style=${{ background: "var(--surface-sand)", borderRadius: "12px", padding: bp === "phone" ? "10px" : "24px 48px", overflowX: "auto" }}><${RoaDoc} b=${b} o=${o} page=${pg} pages=${pages} per=${per} /></div></${Card}>
        <div class="col g20"><${Card} title="Details"><div><${KV} k="Batch"><${RecLink} to=${"batch-" + b.no} cls="t-data">${b.no}</${RecLink}></${KV}><${KV} k="Job order"><${RecLink} to=${"order-" + o.no} cls="t-data">${o.no}</${RecLink}></${KV}><${KV} k="Client">${cl.name}</${KV}>
          <${KV} k="Samples">${plural(b.samples.length, "sample")}</${KV}><${KV} k="Standard">${b.std}</${KV}><${KV} k="Uploaded"><span class="row g10"><span>${fmtDate(b.roa.at)}</span><span class="c-brand">${b.roa.by}</span></span></${KV}>
          ${b.completed && html`<${KV} k="Batch completed"><span class="row g10"><span>${fmtDate(b.completed.at)}</span><span class="c-brand">${b.completed.by}</span></span></${KV}>`}<${KV} k="File"><span class="row g10"><span>${b.roa.file}</span>${b.roa.size && html`<span class="c-sec">${fileSize(b.roa.size)}</span>`}</span></${KV}></div></${Card}>
          <${Card} title="Used in" id="roa-used">${used.length ? html`<div class="col g8">${used.map((c) => html`<div key=${c.no} class="row g10 wrap"><${RecLink} to=${"report-" + c.no} cls="t-data">${c.no}</${RecLink}><${Badge} label=${CS[c.status][0]} tone=${CS[c.status][1]} sm /></div>`)}</div>` : html`<span class="t-sm c-mut">Not in a CoA yet. It is used when the job order's CoA is published.</span>`}</${Card}></div></div></${Page}>`;
  }

  ROUTES.push({ re: /^reports$/, nav: "reports", render: () => html`<${List} />` },
    { re: /^report-draft-(JO-\d{4}-\d{4})$/, nav: "reports", allow: (r) => D.can(r, "coa.write"), render: (m) => html`<${CoaPage} draftJo=${m[1]} />` },
    { re: /^report-(CoA-JO-\d{4}-\d{4}-\d+)(?:-(revise|void))?$/, nav: "reports", allow: (r) => D.can(r, "coa.download"), render: (m) => html`<${CoaPage} no=${m[1]} act=${m[2]} />` },
    { re: /^roa-(RoA-[\w-]+)$/, nav: "reports", allow: (r) => D.can(r, "roa.download"), render: (m) => html`<${RoaPage} no=${m[1]} />` });
  FLOWS.push(
    { id: "RE1", group: "Reports", title: "Find and download reports", role: "analyst", steps: "The Analyst sees RoAs only: filter, tick two, Download PDFs. Switch to CSO: CoAs only.", start: { hash: "reports" } },
    { id: "RE2", group: "Reports", title: "Build and publish a CoA", role: "lab_admin", steps: "Draft CoA of JO-2026-0132: bases, parameters, signatory, Publish, confirm. The CSO gets a notification.", start: { hash: "report-draft-JO-2026-0132" } },
    { id: "RE3", group: "Reports", title: "Revise and void", role: "lab_admin", steps: "CoA-JO-2026-0138-1: ⋯ Revise with a reason, publish revision 2; revision 1 shows Superseded. As Superadmin: Void.", start: { hash: "report-CoA-JO-2026-0138-1" } },
  );
})();
