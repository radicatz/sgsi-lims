/* Dashboard (Dashboard_Prototype_Plan.md): Operations and Quality & reports, charts as SVG computed from the demo data. */
(function () {
  const BCOL = { created: "var(--status-st-created)", receiving: "var(--status-st-created)", preparation: "var(--status-st-prep)", prepfinished: "var(--status-st-prep)", analysis: "var(--primary)", analysisfinished: "var(--status-st-finished)", completed: "var(--status-st-completed)" };
  const sunday = addDays(D.TODAY, 7 - d0(D.TODAY).getDay());
  const inRange = (iso, from) => iso && iso.slice(0, 10) > from && iso.slice(0, 10) <= D.TODAY;
  const band = (ratio) => (ratio <= 1 ? "var(--status-st-completed)" : ratio <= 1.25 ? "var(--status-st-prep)" : "var(--feedback-error)");

  function useScope() {
    const { db } = useApp();
    const [period, setPeriod] = useState("30"), [co, setCo] = useState("");
    const from = addDays(D.TODAY, -+period), prevFrom = addDays(from, -+period);
    const orders = db.orders.filter((o) => !co || o.client === co);
    const batches = db.batches.filter((b) => orders.some((o) => o.no === b.jo));
    return { period, setPeriod, co, setCo, from, prevFrom, orders, batches };
  }
  function Filters({ sc, inline }) {
    const { db } = useApp();
    const cls = db.clients.filter((c) => c.status === "Active");
    return html`<${Select} id="db-period" label="Period" value=${sc.period} onChange=${sc.setPeriod} options=${[["7", "Last 7 days"], ["30", "Last 30 days"], ["90", "Last 90 days"]]} style=${{ width: inline ? "100%" : "200px" }} />
      <${Select} id="db-company" label="Company" value=${sc.co} onChange=${sc.setCo} options=${[["", "All companies"]].concat(cls.map((c) => [c.id, c.name]))} style=${{ width: inline ? "100%" : "220px" }} />`;
  }

  function DashboardPage({ tab }) {
    const { role, bp, go, can } = useApp();
    const sc = useScope();
    const [sheet, setSheet] = useState(false);
    const quality = can("dashboard.quality") && tab === "quality";
    return html`<${Page}><${PageHead} overline=${longDate(D.TODAY)} title="Dashboard" actions=${bp === "phone" ? html`<${Button} icon="funnel" onClick=${() => setSheet(true)}>Filters</${Button}>` : html`<div class="row g12" style=${{ alignItems: "flex-end" }}><${Filters} sc=${sc} /></div>`} />
      ${can("dashboard.quality") && html`<${Tabs} id="db-tabs" items=${[{ id: "ops", label: "Operations" }, { id: "quality", label: "Quality & reports" }]} value=${quality ? "quality" : "ops"} onChange=${(t) => go(t === "quality" ? "dashboard-quality" : "dashboard")} />`}
      ${quality ? html`<${Quality} sc=${sc} />` : html`<${Operations} sc=${sc} />`}
      ${sheet && html`<${Dialog} title="Filters" onClose=${() => setSheet(false)} footer=${html`<${Button} onClick=${() => { sc.setPeriod("30"); sc.setCo(""); }}>Clear all</${Button}><${Button} type="primary" onClick=${() => setSheet(false)}>Apply</${Button}>`}><${Filters} sc=${sc} inline /></${Dialog}>`}</${Page}>`;
  }

  /* ---------- Operations ---------- */
  function Operations({ sc }) {
    const { db, role, bp, go } = useApp();
    const { batches, orders, from, prevFrom } = sc;
    const active = batches.filter((b) => b.status !== "completed");
    const doneIn = batches.filter((b) => b.completed && inRange(b.completed.at, from));
    const dueWeek = active.filter((b) => b.deadline <= sunday);
    const pastDue = active.filter((b) => b.deadline < D.TODAY);
    const recvd = (f, t) => batches.filter((b) => b.confirmed && b.confirmed.at.slice(0, 10) > f && b.confirmed.at.slice(0, 10) <= t).reduce((a, b) => a + b.samples.length, 0);
    const rNow = recvd(from, D.TODAY), rPrev = recvd(prevFrom, from);
    const delta = rPrev ? Math.round(((rNow - rPrev) / rPrev) * 100) : 0;
    const tat = doneIn.map((b) => daysBetween(b.confirmed.at, b.completed.at));
    const mean = tat.length ? tat.reduce((a, x) => a + x, 0) / tat.length : 0;
    const queues = MOD.work.QUEUES.filter((q) => q.roles.includes(role)).map((q) => ({ q, n: q.rows(db).length })).filter((x) => x.n);
    const [f, setF] = useState("all");
    const rows = active.filter((b) => f === "all" || (f === "due" ? b.deadline <= addDays(D.TODAY, 7) && b.deadline >= D.TODAY : b.deadline < D.TODAY)).sort((a, b) => (a.deadline < b.deadline ? -1 : 1));
    const pg = usePaged(rows, 8, f + sc.co);
    const due24 = active.filter((b) => b.deadline <= addDays(D.TODAY, 1) && b.deadline >= D.TODAY);
    const counts = D.B_ORDER.map((s) => [s, batches.filter((b) => b.status === s && (s !== "completed" || (b.completed && inRange(b.completed.at, from)))).length]);
    const joc = ["draft", "awaiting", "progress", "reported", "delivered"].map((s) => [s, orders.filter((o) => o.status === s).length]);
    const types = {}; batches.filter((b) => b.confirmed && inRange(b.confirmed.at, from)).forEach((b) => { const o = S.order(db, b.jo); b.samples.forEach((sid) => { const s = o.samples.find((x) => x.id === sid); const t = s ? s.type : "Ply"; types[t] = (types[t] || 0) + 1; }); });
    const days = []; for (let i = 13; i >= 0; i--) { const dd = addDays(D.TODAY, -i); days.push([dd, batches.filter((b) => b.confirmed && b.confirmed.at.slice(0, 10) === dd).reduce((a, b) => a + b.samples.length, 0)]); }
    const byCo = {}; doneIn.forEach((b) => { const c = S.order(db, b.jo).client; (byCo[c] = byCo[c] || []).push(daysBetween(b.confirmed.at, b.completed.at)); });
    const tatCo = Object.entries(byCo).map(([c, a]) => [S.client(db, c).short, a.reduce((x, y) => x + y, 0) / a.length]).sort((a, b) => a[1] - b[1]);
    const [day, setDay] = useState(D.TODAY);
    const week = []; const mon = addDays(D.TODAY, 1 - (d0(D.TODAY).getDay() || 7)); for (let i = 0; i < 7; i++) week.push(addDays(mon, i));
    const g3 = bp === "desktop" ? "repeat(3, minmax(0,1fr))" : bp === "tablet" ? "repeat(2, minmax(0,1fr))" : "1fr";
    if (!batches.length) return html`<${Card}><${Empty} icon="squares-four" title="No data for this period" text="Try a longer period or another company." /></${Card}>`;
    return html`
      ${queues.length > 0 && html`<${Card} cls="row" style=${{ flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: "20px" }}><h2 class="t-h3">Your queues</h2>
        ${queues.map(({ q, n }) => html`<button key=${q.id} class="row g6 t-sm" onClick=${() => go("work-" + q.id)}><span class="c-sec">${q.label}</span><b class=${cx("t-sm w6", q.rows(db).some((r) => r.deadline < D.TODAY) && "c-err")}>${n}</b></button>`)}
        <span class="grow"></span><button class="linkbtn" onClick=${() => go("work")}><${Icon} n="arrow-right" />Open My work</button></${Card}>`}
      <div class="grid" style=${{ gridTemplateColumns: bp === "phone" ? "1fr 1fr" : "repeat(4, minmax(0,1fr))", gap: bp === "phone" ? "12px" : "20px" }}>
        <${Kpi} label="Batches in progress" value=${active.length} sub=${[doneIn.length + " completed", batches.filter((b) => b.date > from || b.status !== "completed").length + " total"]} />
        <${Kpi} label="Due this week" value=${dueWeek.length} sub=${[html`<span class="c-err">${pastDue.length} past due</span>`, dueWeek.length - pastDue.length + " on time"]} />
        <${Kpi} label="Samples received" value=${rNow.toLocaleString("en-US")} delta=${(delta >= 0 ? "+" : "") + delta + "%"} sub=${["Last " + sc.period + " days", plural(batches.filter((b) => b.confirmed && inRange(b.confirmed.at, from)).length, "batch", "batches")]} />
        <${Kpi} label="Mean turnaround" value=${mean.toFixed(1) + " d"} sub=${["Target 5 d", mean <= 5 ? "On target" : "Over target"]} color=${band(mean / 5)} />
      </div>
      <div class="grid" style=${{ gridTemplateColumns: g3 }}>
        <${Card} title="Batch workflow"><div class="col g12">${counts.map(([s, n]) => html`<${HBar} key=${s} label=${D.B_STATUS[s][0]} v=${n} max=${Math.max(...counts.map((x) => x[1]), 1)} color=${BCOL[s]} />`)}</div></${Card}>
        <${Card} title="Job orders by status"><div class="col g12">${joc.map(([s, n]) => html`<${HBar} key=${s} label=${D.JO_STATUS[s][0]} v=${n} max=${Math.max(...joc.map((x) => x[1]), 1)} color="var(--primary)" />`)}</div></${Card}>
        <${Card} title="Sample type mix"><${Donut} parts=${Object.entries(types)} /></${Card}>
      </div>
      <div class="grid" style=${{ gridTemplateColumns: bp === "desktop" ? "minmax(0,2fr) minmax(0,1fr)" : "1fr" }}>
        <${Card} title="Samples received per day"><${DayBars} days=${days} /></${Card}>
        <${Card} title="Turnaround by company" head=${html`<span class="t-cap c-mut">Target 5 days</span>`}><div class="col g12">${tatCo.length ? tatCo.map(([c, v]) => html`<div key=${c} class="hbar" style=${{ gridTemplateColumns: "130px 1fr 52px" }}><span class="ellip">${c}</span><span class="bar" style=${{ width: Math.min(100, (v / 8) * 100) + "%", background: band(v / 5) }}></span><span class="v">${v.toFixed(1)} d</span></div>`) : html`<span class="t-sm c-mut">No completed batches in this period.</span>`}</div></${Card}>
      </div>
      <div class="grid" style=${{ gridTemplateColumns: bp === "desktop" ? "minmax(0,2fr) minmax(0,1fr)" : "1fr", alignItems: "start" }}>
        <${Card} title="Active batches" id="active-batches" actions=${html`<${Chips} sm items=${[{ id: "all", label: "All", count: active.length }, { id: "due", label: "Due", count: active.filter((b) => b.deadline <= addDays(D.TODAY, 7) && b.deadline >= D.TODAY).length }, { id: "late", label: "Late", count: pastDue.length }]} value=${f} onChange=${setF} />`}>
          ${bp === "phone" ? html`<div class="col g10">${pg.rows.map((b) => html`<${BatchMini} key=${b.no} b=${b} />`)}</div>`
          : html`<${Table} rows=${pg.rows} onRow=${(b) => go("batch-" + b.no)} cols=${[
            { h: "Batch", render: (b) => html`<b class="t-data-b">${b.no}</b>` }, { h: "Company", render: (b) => S.client(db, S.order(db, b.jo).client).name },
            { h: "Job order", render: (b) => html`<span class="t-data c-brand">${b.jo}</span>` },
            { h: "Deadline", render: (b) => html`<span class="row g4" style=${{ color: b.deadline < D.TODAY ? "var(--feedback-error)" : b.deadline <= addDays(D.TODAY, 1) ? "var(--feedback-warning)" : undefined }}>${fmtShort(b.deadline)}${b.deadline < D.TODAY && html`<${Icon} n="warning" />`}</span>` },
            { h: "Progress", render: (b) => { const [a, n] = S.progress(b); return html`<span class="num">${a} / ${n}</span>`; } },
            { h: "Status", render: (b) => html`<${Badge} label=${D.B_STATUS[b.status][0]} tone=${D.B_STATUS[b.status][1]} sm />` }]} />`}
          <${Pager} ...${pg.pager} /></${Card}>
        <div class="col g20">
          ${due24.length > 0 && html`<${Card} cls="callout"><span class="t-over">Deadline alert</span><h2 class="t-h3">${plural(due24.length, "batch is", "batches are")} due within 24 h</h2>
            <span class="t-sm" style=${{ opacity: 0.9 }}>${due24[0].no} is still in ${D.B_STATUS[due24[0].status][0].toLowerCase()}.</span>
            <${Button} type="accent" size="lg" block onClick=${() => go("batch-" + due24[0].no)}>Open batch</${Button}></${Card}>`}
          <${Card} title="This week"><div class="row g4">${week.map((dd) => { const has = active.some((b) => b.deadline === dd); return html`<button key=${dd} class=${cx("weekday", dd === D.TODAY && "today", dd === day && "sel")} onClick=${() => setDay(dd)}><span>${["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d0(dd).getDay()]}</span><b>${d0(dd).getDate()}</b><span class="d" style=${{ visibility: has ? "visible" : "hidden" }}></span></button>`; })}</div>
            <div class="col g12">${active.filter((b) => b.deadline === day).map((b) => html`<button key=${b.no} class="row top between" style=${{ textAlign: "left" }} onClick=${() => go("batch-" + b.no)}><span class="col" style=${{ gap: "2px" }}><b class="t-data-b">${b.no}</b><span class="t-cap c-sec row g6 wrap"><span>${fmtDate(b.deadline, { noYear: true })}</span><span>${S.client(db, S.order(db, b.jo).client).name}</span></span></span>${b.deadline === D.TODAY ? html`<${Tag} label="Due today" tone="amber" icon="clock" />` : b.deadline < D.TODAY && html`<${Tag} label="Overdue" tone="red" icon="alarm" />`}</button>`)}
              ${!active.some((b) => b.deadline === day) && html`<span class="t-sm c-mut">No deadlines on this day.</span>`}</div></${Card}>
        </div></div>`;
  }
  function Kpi({ label, value, sub, delta, color }) {
    return html`<div class="card kpi"><span class="lbl">${label}</span><div class="row g10"><span class="t-num" style=${color ? { color } : undefined}>${value}</span>${delta && html`<${Delta} v=${delta} />`}</div><span class="sub">${(sub || []).map((s, i) => html`<span key=${i}>${s}</span>`)}</span></div>`;
  }
  function HBar({ label, v, max, color }) { return html`<div class="hbar"><span class="ellip">${label}</span><span class="bar" style=${{ width: Math.max(v ? 3 : 0, (v / max) * 100) + "%", background: color }}></span><span class="v">${v}</span></div>`; }
  function BatchMini({ b }) {
    const { db, go } = useApp(); const [a, n] = S.progress(b);
    return html`<div class="mcard" onClick=${() => go("batch-" + b.no)}><div class="row between"><b class="t-data-b">${b.no}</b><${Badge} label=${D.B_STATUS[b.status][0]} tone=${D.B_STATUS[b.status][1]} sm /></div>
      <span class="t-sm">${S.client(db, S.order(db, b.jo).client).name}</span><div class="row g10"><span class=${cx("t-cap", b.deadline < D.TODAY ? "c-err" : "c-sec")}>Due ${fmtShort(b.deadline)}</span><${Progress} v=${a} max=${n} /><span class="t-cap num">${a}/${n}</span></div></div>`;
  }
  const MIX = ["var(--primary)", "var(--accent)", "var(--status-st-completed)", "var(--status-st-finished)", "var(--rust)"];
  function Donut({ parts }) {
    const total = parts.reduce((a, p) => a + p[1], 0) || 1; let acc = 0;
    const R = 80, r = 52, C = 100;
    const arc = (a0, a1) => { const p = (a) => [C + R * Math.sin(a), C - R * Math.cos(a)], q = (a) => [C + r * Math.sin(a), C - r * Math.cos(a)]; const L = a1 - a0 > Math.PI ? 1 : 0;
      const [x0, y0] = p(a0), [x1, y1] = p(a1), [x2, y2] = q(a1), [x3, y3] = q(a0); return `M${x0},${y0} A${R},${R} 0 ${L} 1 ${x1},${y1} L${x2},${y2} A${r},${r} 0 ${L} 0 ${x3},${y3} Z`; };
    return html`<div class="row g16 wrap" style=${{ justifyContent: "center" }}><svg class="chart" viewBox="0 0 200 200" width="180" height="180" role="img" aria-label="Sample type mix">
      ${parts.map(([k, v], i) => { const a0 = (acc / total) * 2 * Math.PI; acc += v; const a1 = Math.min((acc / total) * 2 * Math.PI, 2 * Math.PI - 0.0001); return html`<path key=${k} d=${arc(a0, a1)} fill=${MIX[i % MIX.length]}><title>${k}: ${v}</title></path>`; })}
      <text x="100" y="100" text-anchor="middle" style=${{ font: "500 26px var(--f-display)", fill: "var(--text-heading)" }}>${total.toLocaleString("en-US")}</text><text x="100" y="120" text-anchor="middle">samples</text></svg>
      <div class="legend">${parts.map(([k, v], i) => html`<span key=${k}><i style=${{ background: MIX[i % MIX.length] }}></i>${k} <b style=${{ color: "var(--text-foreground)" }}>${Math.round((v / total) * 100)}%</b></span>`)}</div></div>`;
  }
  function DayBars({ days }) {
    const max = Math.max(...days.map((d) => d[1]), 1), W = 640, H = 150, bw = W / days.length;
    const [tip, setTip] = useState(null);
    return html`<div style=${{ position: "relative" }}><svg class="chart" viewBox=${"0 0 " + W + " " + (H + 22)} width="100%" role="img" aria-label="Samples received per day">
      <line x1="0" x2=${W} y1=${H} y2=${H} stroke="var(--surface-border)" />
      ${days.map(([d, v], i) => { const h = v ? Math.max(6, (v / max) * (H - 10)) : 4; return html`<g key=${d} onMouseEnter=${() => setTip({ i, d, v })} onMouseLeave=${() => setTip(null)}>
        <rect x=${i * bw + bw * 0.28} y=${H - h} width=${bw * 0.44} height=${h} rx="3" fill=${d === D.TODAY ? "var(--accent)" : "var(--primary)"} opacity=${v ? 1 : 0.35} />
        <rect x=${i * bw} y="0" width=${bw} height=${H} fill="transparent" /><text x=${i * bw + bw / 2} y=${H + 16} text-anchor="middle">${d0(d).getDate()}</text></g>`; })}</svg>
      ${tip && html`<div class="tip" style=${{ left: (tip.i / days.length) * 100 + "%", top: "0" }}>${fmtDate(tip.d, { noYear: true })}: ${plural(tip.v, "sample")}</div>`}</div>`;
  }

  /* ---------- Quality & reports ---------- */
  function Quality({ sc }) {
    const { db, bp, can, go } = useApp();
    const done = sc.batches.filter((b) => b.status === "completed");
    const doneIn = done.filter((b) => b.completed && inRange(b.completed.at, sc.from));
    const pts = []; done.forEach((b) => b.samples.forEach((sid) => { const v = b.rows[sid].values; if (v.Ash != null && v.GCV != null) pts.push({ id: sid, lab: b.rows[sid].lab, b: b.no, hole: (S.order(db, b.jo).samples.find((s) => s.id === sid) || {}).hole, v }); }));
    const dets = doneIn.reduce((a, b) => a + b.samples.reduce((x, s) => x + Object.keys(b.rows[s].values).length, 0), 0);
    const active = db.drill.filter((d) => d.status === "Active" && (!sc.co || d.cl === sc.co));
    const withCoa = active.filter((d) => d.coa).length;
    const [basis, setBasis] = useState("ADB");
    const conv = (v) => ({ ADB: v.GCV, AR: v.TM != null ? (v.GCV * (100 - v.TM)) / (100 - v.IM) : v.GCV * 0.85, DB: (v.GCV * 100) / (100 - v.IM), DAF: (v.GCV * 100) / (100 - v.IM - v.Ash) }[basis]);
    const trend = done.slice().sort((a, b) => (a.completed.at < b.completed.at ? -1 : 1)).slice(-22).map((b) => { const vs = b.samples.map((s) => b.rows[s].values).filter((v) => v.GCV); return [b.no, vs.length ? vs.reduce((a, v) => a + conv(v), 0) / vs.length : null]; }).filter((x) => x[1]);
    return html`
      <div class="grid" style=${{ gridTemplateColumns: bp === "phone" ? "1fr 1fr" : "repeat(4, minmax(0,1fr))", gap: bp === "phone" ? "12px" : "20px" }}>
        <${Kpi} label="Batches completed" value=${doneIn.length} delta=${"+" + Math.max(1, Math.round(doneIn.length / 6))} sub=${[done.length + " total"]} />
        <${Kpi} label="RoA uploaded" value=${doneIn.length} delta=${"+" + Math.max(1, Math.round(doneIn.length / 8))} sub=${[sc.batches.filter((b) => b.status === "analysisfinished").length + " waiting for upload"]} />
        <div class="card kpi"><span class="lbl">Drill holes with CoA</span><span class="t-num">${withCoa} of ${active.length}</span><div class="row g10"><${Progress} v=${withCoa} max=${active.length} /><span class="t-cap num">${Math.round((withCoa / Math.max(1, active.length)) * 100)}%</span></div><span class="sub">${active.length - withCoa} missing</span></div>
        <${Kpi} label="Determinations" value=${dets.toLocaleString("en-US")} delta="+9%" sub=${["Last " + sc.period + " days"]} />
      </div>
      <div class="grid" style=${{ gridTemplateColumns: bp === "desktop" ? "repeat(3, minmax(0,1fr))" : "1fr" }}>
        <${Scatter} title="CV vs Ash" pts=${pts} x=${(p) => p.v.Ash} y=${(p) => p.v.GCV} fx=${(v) => "Ash " + v.toFixed(1) + "%"} fy=${(v) => "CV " + Math.round(v).toLocaleString("en-US")} />
        <${Scatter} title="RD vs Ash" pts=${pts.filter((p) => p.v.RD)} x=${(p) => p.v.Ash} y=${(p) => p.v.RD} fx=${(v) => "Ash " + v.toFixed(1) + "%"} fy=${(v) => "RD " + v.toFixed(2)} />
        <${Scatter} title="FC vs GCV" pts=${pts.filter((p) => p.v.FC)} x=${(p) => p.v.GCV} y=${(p) => p.v.FC} fx=${(v) => "CV " + Math.round(v).toLocaleString("en-US")} fy=${(v) => "FC " + v.toFixed(1) + "%"} />
      </div>
      <${Card} title="Trend CV" actions=${html`<${Seg} label="Basis" items=${["ADB", "AR", "DB", "DAF"]} value=${basis} onChange=${setBasis} />`}><${Trend} pts=${trend} unit="kcal/kg" limit=${basis === "AR" ? 5400 : 6300} /></${Card}>
      <${DrillHoles} co=${sc.co} />`;
  }
  function fit(pts) { const n = pts.length; if (n < 2) return { a: 0, b: 0, r2: 0 }; const mx = pts.reduce((s, p) => s + p[0], 0) / n, my = pts.reduce((s, p) => s + p[1], 0) / n;
    let sxy = 0, sxx = 0, syy = 0; pts.forEach(([x, y]) => { sxy += (x - mx) * (y - my); sxx += (x - mx) ** 2; syy += (y - my) ** 2; }); const b = sxy / sxx; return { a: my - b * mx, b, r2: (sxy * sxy) / (sxx * syy) }; }
  function Scatter({ title, pts, x, y, fx, fy }) {
    const [tip, setTip] = useState(null);
    const P = pts.map((p) => [x(p), y(p), p]); const W = 300, H = 200, pad = 16;
    const xs = P.map((p) => p[0]), ys = P.map((p) => p[1]);
    const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
    const sx = (v) => pad + ((v - x0) / (x1 - x0 || 1)) * (W - 2 * pad), sy = (v) => H - pad - ((v - y0) / (y1 - y0 || 1)) * (H - 2 * pad);
    const f = fit(P);
    return html`<${Card} title=${title} head=${html`<span class="t-cap c-sec">R² ${f.r2.toFixed(2)}, n ${P.length}</span>`}><div style=${{ position: "relative" }}><svg class="chart" viewBox=${"0 0 " + W + " " + H} width="100%" role="img" aria-label=${title}>
      <line x1=${pad} x2=${pad} y1=${pad} y2=${H - pad} stroke="var(--surface-border)" /><line x1=${pad} x2=${W - pad} y1=${H - pad} y2=${H - pad} stroke="var(--surface-border)" />
      <line x1=${sx(x0)} y1=${sy(f.a + f.b * x0)} x2=${sx(x1)} y2=${sy(f.a + f.b * x1)} stroke="var(--primary-100)" stroke-width="16" stroke-linecap="round" opacity="0.6" />
      ${P.map(([vx, vy, p], i) => html`<circle key=${i} cx=${sx(vx)} cy=${sy(vy)} r="3" fill="var(--primary)" onMouseEnter=${() => setTip({ left: (sx(vx) / W) * 100, top: (sy(vy) / H) * 100, t: p.id + "  " + fx(vx) + "  " + fy(vy) + (p.hole ? "  " + p.hole : "") })} onMouseLeave=${() => setTip(null)} style=${{ cursor: "pointer" }} />`)}</svg>
      ${tip && html`<div class="tip" style=${{ left: "calc(" + tip.left + "% - 40px)", top: "calc(" + tip.top + "% - 40px)" }}>${tip.t}</div>`}</div></${Card}>`;
  }
  function Trend({ pts, limit, unit }) {
    const W = 720, H = 170, pad = 20; const vs = pts.map((p) => p[1]).concat([limit]); const lo = Math.min(...vs) - 150, hi = Math.max(...vs) + 150;
    const sx = (i) => pad + (i / Math.max(1, pts.length - 1)) * (W - 2 * pad), sy = (v) => H - pad - ((v - lo) / (hi - lo)) * (H - 2 * pad);
    const [tip, setTip] = useState(null);
    return html`<div style=${{ position: "relative" }}><svg class="chart" viewBox=${"0 0 " + W + " " + H} width="100%" role="img" aria-label="Trend CV">
      <line x1=${pad} x2=${W - pad} y1=${sy(limit)} y2=${sy(limit)} stroke="var(--rust)" /><text x=${pad} y=${sy(limit) - 6} style=${{ fill: "var(--rust)" }}>Limit ${limit.toLocaleString("en-US")} ${unit}</text>
      <polyline fill="none" stroke="var(--primary)" stroke-width="2" points=${pts.map((p, i) => sx(i) + "," + sy(p[1])).join(" ")} />
      ${pts.map((p, i) => html`<circle key=${i} cx=${sx(i)} cy=${sy(p[1])} r="6" fill="transparent" onMouseEnter=${() => setTip({ l: (sx(i) / W) * 100, t: p[0] + ": " + Math.round(p[1]).toLocaleString("en-US") + " " + unit })} onMouseLeave=${() => setTip(null)} />`)}</svg>
      ${tip && html`<div class="tip" style=${{ left: "calc(" + tip.l + "% - 60px)", top: "0" }}>${tip.t}</div>`}</div>`;
  }
  function DrillHoles({ co }) {
    const { db, can, bp } = useApp();
    const [f, setF] = useState("all"), [q, setQ] = useState(""), [up, setUp] = useState(null);
    const all = db.drill.filter((d) => d.status === "Active" && (!co || d.cl === co));
    const rows = all.filter((d) => (f === "all" || !d.coa) && (!q || d.code.toLowerCase().includes(q.toLowerCase())));
    const pg = usePaged(rows, 8, f + q + co);
    const roaOf = (d) => { const b = db.batches.find((x) => x.roa && S.order(db, x.jo).samples.some((s) => s.hole === d.code)); return b ? b.roa.no : "—"; };
    const Up = SH.CoaUpload;
    return html`<${Card} title="Drill holes" actions=${html`<${Chips} sm items=${[{ id: "all", label: "All", count: all.length }, { id: "missing", label: "Missing CoA", count: all.filter((d) => !d.coa).length }]} value=${f} onChange=${setF} /><${Search} value=${q} onChange=${setQ} placeholder="Search drill hole" style=${{ width: bp === "phone" ? "100%" : "220px", height: "32px" }} />`}>
      <${Table} rows=${pg.rows} keyOf=${(d) => d.code} cols=${[{ h: "Code", render: (d) => html`<b class="t-data-b">${d.code}</b>` }, { h: "Company", render: (d) => S.client(db, d.cl).name }, { h: "Samples", cls: "r", render: (d) => d.samples },
        { h: "RoA", render: (d) => html`<span class="t-data c-sec">${roaOf(d)}</span>` },
        { h: "CoA", render: (d) => d.coa ? html`<span class="row g6"><${Tag} label="CoA uploaded" tone="green" icon="check-circle" /><span class="t-cap c-sec">${d.coa.file}</span></span>` : html`<${Tag} label="CoA missing" icon="file-x" />` },
        can("coa.upload") && { h: "", cls: "r", render: (d) => html`<${Button} size="sm" icon="upload-simple" onClick=${() => setUp(d.code)}>${d.coa ? "Replace CoA" : "Upload CoA"}</${Button}>` }].filter(Boolean)} />
      <${Pager} ...${pg.pager} />${up && Up && html`<${Up} code=${up} onClose=${() => setUp(null)} />`}</${Card}>`;
  }

  ROUTES.push({ re: /^dashboard$/, nav: "dashboard", render: () => html`<${DashboardPage} tab="ops" />` }, { re: /^dashboard-quality$/, nav: "dashboard", render: () => html`<${DashboardPage} tab="quality" />` });
  FLOWS.push(
    { id: "DB1", group: "Dashboard", title: "Operations by role", role: "lab_admin", steps: "Change the Period, pick the Due chip, open a batch; Deadline alert, Open batch. Switch to Supervisor and CSO: the CSO has no tabs.", start: { hash: "dashboard" } },
    { id: "DB2", group: "Dashboard", title: "Quality & reports", role: "lab_admin", steps: "Hover a scatter point, switch Trend CV to AR, pick Missing CoA, Upload CoA.", start: { hash: "dashboard-quality" } },
  );
})();
