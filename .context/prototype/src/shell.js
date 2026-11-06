/* App state, routing, review bar and the app shell (shared plan sections 3 and 5). */
const STORE = "sgsi-lims-proto-v2";
function loadStore() { try { const s = JSON.parse(localStorage.getItem(STORE) || "null"); if (s && (s.db ? s.db.version === 2 : s.ui)) return s; } catch (e) {} return null; }
function saveStore(s) { try { localStorage.setItem(STORE, JSON.stringify(s)); } catch (e) {} }
const clock = () => { const d = new Date(); return D.TODAY + "T" + String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0"); };

/* Routes: modules push {re, nav, render(m), allow(role)}; nav is the sidebar item that is active and that decides access. */
const ROUTES = [];
function matchRoute(hash) {
  for (const r of ROUTES) { const m = hash.match(r.re); if (m) return { r, m }; }
  return null;
}
const FLOWS = []; // modules push {id, group, title, role, steps, start: {hash, prep(d, api)}}
const SPEC_ONLY = [
  "PDFs are sample images, and uploads keep only the file name.",
  "Print is not available inside the prototype page.",
  "Session timeout runs on a 60-second demo timer, started from this bar, instead of 30 minutes.",
  "Notifications are not pushed in real time; they appear when the flow that raises them runs.",
  "The reset and invite emails are not sent; Link sent has a demo link instead.",
  "Saved queries and saved filters live in this browser only.",
  "Import list and Import (S-16) show a toast.",
  "Input ROA and Review ROA are hidden, as in v1.",
];
const BUILT_FROM_PATTERN = [
  "Row menus (drawn closed in every frame), with the items each plan names",
  "Job order Files and History tabs",
  "History item in the Samples tab and Reception row menus",
  "Audit link on Sample history",
  "Edit and Close job order dialogs",
  "Delete draft on the Draft CoA",
  "Tablet and phone versions of states drawn on desktop only",
  "My work queues without a frame (In preparation, Ready for data entry, and others)",
];

function App() {
  const saved = useMemo(loadStore, []);
  const [db, setDb] = useState(() => (saved && saved.db) || D.seed());
  const [ui, setUiS] = useState(() => Object.assign({ width: "fit", role: "lab_admin", theme: "light", barMin: false, signedIn: false, collapsed: {} }, saved && saved.ui));
  const [toasts, setToasts] = useState([]);
  const [hash, setHash] = useState(() => location.hash.slice(1));
  const [vp, setVp] = useState({ w: window.innerWidth, h: window.innerHeight });
  const [timeout, setTimeoutDlg] = useState(false);
  window.__setDb = setDb;
  const setUi = (p) => setUiS((u) => Object.assign({}, u, typeof p === "function" ? p(u) : p));
  useEffect(() => saveStore({ db, ui }), [db, ui]);
  useEffect(() => { const h = () => setHash(location.hash.slice(1)); window.addEventListener("hashchange", h); return () => window.removeEventListener("hashchange", h); }, []);
  useEffect(() => { const h = () => setVp({ w: window.innerWidth, h: window.innerHeight }); window.addEventListener("resize", h); return () => window.removeEventListener("resize", h); }, []);
  useEffect(() => { document.documentElement.setAttribute("data-theme", ui.theme); }, [ui.theme]);

  const role = ui.role, me = D.PERSONA[role];
  const go = useCallback((h) => { if (location.hash.slice(1) === h) setHash(h); else location.hash = h; }, []);
  const toast = useCallback((text, o = {}) => { const id = Math.random().toString(36).slice(2); setToasts((t) => t.concat([Object.assign({ id, text }, o)])); setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), o.undo ? 10000 : 4200); }, []);
  const dropToast = (id) => setToasts((t) => t.filter((x) => x.id !== id));
  /* update(fn): fn mutates a copy of the data; audit() and notify() add entries as the signed-in persona */
  const update = useCallback((fn) => setDb((cur) => { const d = clone(cur); fn(d); return d; }), []);
  const api = {
    audit: (d, type, rec, action, fields, screen) => d.audit.unshift({ id: "a" + Date.now() + Math.random(), at: clock(), user: me.name, type, rec, action, fields: fields || [], screen }),
    notify: (d, n) => d.notes.unshift(Object.assign({ id: "n" + Date.now() + Math.random(), at: clock(), read: [] }, n)),
    now: clock,
  };
  const can = (p) => D.can(role, p);
  const canNav = (nav) => nav === "any" || D.VISIBLE[role].includes(nav);
  const canOpen = (h) => { const mt = matchRoute(h); return !!mt && canNav(mt.r.nav) && (!mt.r.allow || mt.r.allow(role)); };
  const unread = db.notes.filter((n) => n.to.includes(role) && !n.read.includes(role)).length;

  // width and breakpoint
  const barH = ui.barMin ? 0 : 0;
  const availW = vp.w;
  const W = ui.width === "fit" ? availW : ui.width;
  const bp = W >= 1200 ? "desktop" : W >= 700 ? "tablet" : "phone";
  const zoom = ui.width === "fit" ? 1 : Math.min(1, (availW - (availW > W ? 0 : 0)) / W);

  const signIn = (r) => { setUi({ role: r, signedIn: true }); go(D.START(r)); };
  const signOut = (why) => { setUi({ signedIn: false, signedOut: why || null }); go("login"); };
  const startFlow = (f) => {
    const d = D.seed();
    if (f.start.prep) f.start.prep(d, api);
    setDb(d); setUi({ role: f.role, signedIn: f.start.signedOut ? false : true, signedOut: null });
    setTimeout(() => go(f.start.hash), 0);
  };
  const reset = () => { setDb(D.seed()); setUi({ signedIn: false, signedOut: null }); go("login"); toast("Demo data reset"); };
  const collapsed = !!(ui.collapsed[role]);
  const setCollapsed = (v) => setUi((u) => ({ collapsed: Object.assign({}, u.collapsed, { [role]: v }) }));

  const ctx = { db, setDb, update, ui, setUi, role, me, go, hash, toast, toasts, dropToast, api, can, canNav, canOpen, bp, unread, signIn, signOut, collapsed, setCollapsed, startTimeout: () => setTimeoutDlg(true) };

  // route resolution
  let content, navActive = null, authPage = false;
  const h = hash || (ui.signedIn ? D.START(role) : "login");
  const mt = matchRoute(h);
  if (mt && mt.r.auth) { authPage = true; content = mt.r.render(mt.m); }
  else if (!ui.signedIn) { const lm = matchRoute("login"); authPage = true; content = lm.r.render(lm.m); }
  else if (!mt) { navActive = null; content = html`<${NotFound} />`; }
  else if (!canNav(mt.r.nav) || (mt.r.allow && !mt.r.allow(role))) { content = html`<${NoAccess} />`; }
  else { navActive = mt.r.nav; content = mt.r.render(mt.m); }

  const frameStyle = ui.width === "fit" ? { width: "100%", height: "100%" } : { width: W + "px", height: "calc(" + (100 / zoom) + "% )", zoom };
  return html`<${Ctx.Provider} value=${ctx}>
    <div class="stage">
      <${ReviewBar} onFlow=${startFlow} onReset=${reset} />
      <div class="viewport">
        <div class=${cx("frame", bp, bp === "phone" && "touch")} style=${frameStyle} key=${role + bp}>
          ${authPage ? content : html`<${Shell} navActive=${navActive}>${content}</${Shell}>`}
          <${Toasts} />
          ${timeout && html`<${SessionTimeout} onClose=${() => setTimeoutDlg(false)} />`}
        </div>
      </div>
    </div>
  </${Ctx.Provider}>`;
}

/* ---------- review bar ---------- */
function ReviewBar({ onFlow, onReset }) {
  const { ui, setUi, startTimeout } = useApp();
  const [panel, setPanel] = useState(null);
  const ref = useRef();
  useOutside(ref, () => setPanel(null), !!panel);
  useEsc(() => setPanel(null), !!panel);
  if (ui.barMin) return html`<button class="rtab" aria-label="Show review tools" onClick=${() => setUi({ barMin: false })}><${Icon} n="caret-down" /></button>`;
  const widths = [["fit", "Fit"], [1440, "Desktop 1440"], [834, "Tablet 834"], [390, "Phone 390"]];
  const groups = []; FLOWS.forEach((f) => { let g = groups.find((x) => x.name === f.group); if (!g) groups.push((g = { name: f.group, items: [] })); g.items.push(f); });
  return html`<div class="rbar" ref=${ref}>
    <div class="brandline"><b>SGSI LIMS prototype</b><small>Demo data, today is Thu 5 Nov 2026</small></div>
    <span class="rl">Width</span><div class="rseg">${widths.map(([v, l]) => html`<button key=${v} aria-pressed=${ui.width === v} onClick=${() => setUi({ width: v })}>${l}</button>`)}</div>
    <span class="rl">Role</span><div class="rseg">${D.ROLES.map((r) => html`<button key=${r} aria-pressed=${ui.role === r} onClick=${() => { setUi({ role: r, signedIn: true }); location.hash = D.START(r); }}>${D.ROLE_LABEL[r]}</button>`)}</div>
    <span class="rl">Theme</span><div class="rseg">${[["light", "Light"], ["dark", "Dark"]].map(([v, l]) => html`<button key=${v} aria-pressed=${ui.theme === v} onClick=${() => setUi({ theme: v })}>${l}</button>`)}</div>
    <span class="grow"></span>
    <button class="rbtn" onClick=${() => setPanel(panel === "flows" ? null : "flows")}><${Icon} n="flow-arrow" />Flows</button>
    <button class="rbtn" onClick=${() => setPanel(panel === "spec" ? null : "spec")}><${Icon} n="list-checks" />Spec only</button>
    <button class="rbtn" onClick=${() => setPanel(panel === "reset" ? null : "reset")}><${Icon} n="arrow-counter-clockwise" />Reset demo</button>
    <button class="rbtn" aria-label="Hide review tools" onClick=${() => { setPanel(null); setUi({ barMin: true }); }}><${Icon} n="caret-up" /></button>
    ${panel === "flows" && html`<div class="rpanel" id="flows-panel"><h2>Flows</h2><p class="lead">Each flow starts from fresh demo data with the right role and screen. The steps say what to try.</p>
      ${groups.map((g) => html`<div key=${g.name}><div class="grp">${g.name}</div>${g.items.map((f) => html`<div class="flow" key=${f.id}><span class="id">${f.id}</span><div><b>${f.title}</b><span>${D.ROLE_LABEL[f.role]}. ${f.steps}</span></div>
        <button class="btn primary sm" id=${"start-" + f.id} onClick=${() => { setPanel(null); onFlow(f); }}><${Icon} n="play" />Start</button></div>`)}</div>`)}</div>`}
    ${panel === "spec" && html`<div class="rpanel"><h2>Spec only</h2><p class="lead">What the prototype shows but does not do.</p><ul class="speclist">${SPEC_ONLY.map((s) => html`<li key=${s}>${s}</li>`)}</ul>
      <div class="row" style=${{ marginTop: "12px" }}><button class="btn secondary sm" onClick=${() => { setPanel(null); startTimeout(); }}><${Icon} n="clock" />Start the session timeout</button></div>
      <h2 style=${{ marginTop: "18px", fontSize: "17px" }}>Built from the pattern</h2><p class="lead">Not drawn as frames; built from existing patterns so the flows are complete.</p><ul class="speclist">${BUILT_FROM_PATTERN.map((s) => html`<li key=${s}>${s}</li>`)}</ul></div>`}
    ${panel === "reset" && html`<div class="rpanel"><h2>Reset the demo?</h2><p class="lead">Every record goes back to the start state and you are signed out. Width, role and theme stay.</p>
      <div class="row end"><button class="btn secondary" onClick=${() => setPanel(null)}>Keep my changes</button><button class="btn primary" onClick=${() => { setPanel(null); onReset(); }}>Reset demo</button></div></div>`}
  </div>`;
}

/* ---------- shell ---------- */
function Shell({ navActive, children }) {
  const { bp, collapsed, setCollapsed, hash } = useApp();
  const [drawer, setDrawer] = useState(false);
  const mainRef = useRef();
  useEsc(() => setDrawer(false), drawer);
  useEffect(() => { mainRef.current && (mainRef.current.scrollTop = 0); setDrawer(false); }, [hash]);
  const rail = bp === "tablet" || (bp === "desktop" && collapsed);
  return html`<${TopBar} onMenu=${() => setDrawer(true)} />
    <div class="body">
      ${bp !== "phone" && html`<nav class=${cx("side", rail && "rail")} aria-label="Main"><${NavList} rail=${rail} active=${navActive} />
        <span style=${{ height: "24px", flex: "none" }}></span>
        ${bp === "desktop" && html`<button class="nav" title=${rail ? "Expand" : undefined} onClick=${() => setCollapsed(!collapsed)}><${Icon} n=${rail ? "caret-double-right" : "caret-double-left"} s="20" /><span class="lbl">Collapse</span></button>`}</nav>`}
      <main class="main" id="main" ref=${mainRef}>${children}</main>
    </div>
    ${drawer && html`<div class="scrim" style=${{ justifyContent: "flex-start", alignItems: "stretch", padding: 0 }} onMouseDown=${(e) => e.target === e.currentTarget && setDrawer(false)}>
      <nav class="side" style=${{ width: "300px", boxShadow: "var(--e-xl)" }} aria-label="Main"><${DrawerHead} onClose=${() => setDrawer(false)} /><${NavList} active=${navActive} /></nav></div>`}`;
}
function DrawerHead({ onClose }) {
  const { me, role, go } = useApp();
  return html`<div class="col g12" style=${{ paddingBottom: "8px" }}><div class="row between"><span class="logo" style=${{ width: "36px", height: "36px" }}></span><${IconBtn} n="x" label="Close menu" onClick=${onClose} /></div>
    <button class="row g10" style=${{ textAlign: "left" }} onClick=${() => go("profile")}><${Avatar} name=${me.name} size=${40} /><span class="col" style=${{ gap: 0 }}><b class="t-sm w6">${me.name}</b><span class="t-cap c-sec">${D.ROLE_FULL[role]}</span></span></button><div class="divider"></div></div>`;
}
function NavList({ rail, active }) {
  const { role, go, db } = useApp();
  const [shut, setShut] = useState({});
  const vis = D.VISIBLE[role];
  const workCount = MOD.work && MOD.work.total ? MOD.work.total(db, role) : 0;
  return D.NAV.map((g, gi) => { const items = g.items.filter((it) => vis.includes(it[0])); if (!items.length) return null;
    return html`<${Fragment} key=${g.group}>${rail ? gi > 0 && html`<div class="raildiv"></div>` : html`<button class="navgroup" onClick=${() => setShut(Object.assign({}, shut, { [g.group]: !shut[g.group] }))}><span>${g.group}</span><${Icon} n=${shut[g.group] ? "caret-right" : "caret-down"} /></button>`}
      ${(rail || !shut[g.group]) && items.map(([id, label, icon]) => html`<button key=${id} class=${cx("nav", active === id && "on")} title=${rail ? label : undefined} aria-current=${active === id ? "page" : undefined} onClick=${() => go(id)} style=${{ position: "relative" }}>
        <${Icon} n=${icon} s="20" /><span class="lbl">${label}</span>${id === "work" && workCount > 0 && html`<span class="cnt">${workCount}</span>`}</button>`)}</${Fragment}>`; });
}
function TopBar({ onMenu }) {
  const { bp, me, role, go } = useApp();
  const [menu, setMenu] = useState(false);
  const ref = useRef();
  useOutside(ref, () => setMenu(false), menu);
  useEsc(() => setMenu(false), menu);
  const Quick = MOD.search && MOD.search.Quick, Bell = MOD.app && MOD.app.Bell, UserMenu = MOD.app && MOD.app.UserMenu;
  return html`<header class="topbar">
    ${bp === "phone" && html`<${IconBtn} n="list" label="Open menu" size=${36} onClick=${onMenu} />`}
    <div class="brand" onClick=${() => go(D.START(role))}><span class="logo"></span>${bp !== "phone" && html`<div><b>SGSI LIMS</b><small>Sentra Geo Survey Indonesia</small></div>`}</div>
    <span class="grow"></span>
    ${Quick && html`<${Quick} />`}
    ${Bell && html`<${Bell} />`}
    <div ref=${ref} style=${{ position: "relative" }}>
      <button class="userchip" aria-label="User menu" aria-expanded=${menu} onClick=${() => setMenu(!menu)}><${Avatar} name=${me.name} />${bp === "desktop" && html`<span style=${{ textAlign: "left" }}><b>${me.name}</b><small>${me.title}</small></span>`}</button>
      ${menu && UserMenu && html`<${UserMenu} onClose=${() => setMenu(false)} />`}
    </div>
  </header>`;
}
function NoAccess() {
  const { role, go } = useApp();
  const start = D.START(role);
  return html`<div class="page"><${Card}><${Empty} icon="lock-simple" title="You don't have access to this page" text="Your role doesn't include this page. Ask your lab admin if you need it."
    action=${html`<${Button} type="primary" size="lg" onClick=${() => go(start)}>${start === "work" ? "Go to My work" : "Go to Dashboard"}</${Button}>`} /></${Card}></div>`;
}
function NotFound() {
  const { role, go } = useApp();
  return html`<div class="page"><${Card}><${Empty} icon="question" title="This page does not exist" text="The link may be old or mistyped." action=${html`<${Button} type="primary" onClick=${() => go(D.START(role))}>Go to the start page</${Button}>`} /></${Card}></div>`;
}
function SessionTimeout({ onClose }) {
  const { signOut, db } = useApp();
  const [left, setLeft] = useState(db.config.security.warn);
  useEffect(() => { const t = setInterval(() => setLeft((s) => s - 1), 1000); return () => clearInterval(t); }, []);
  useEffect(() => { if (left <= 0) { onClose(); signOut("timeout"); } }, [left]);
  return html`<${Dialog} title="Still there?" size="sm" onClose=${onClose} footer=${html`<${Button} onClick=${() => { onClose(); signOut(); }}>Sign out</${Button}><${Button} type="primary" onClick=${onClose}>Stay signed in</${Button}>`}>
    <p class="t-sm c-sec" style=${{ margin: 0 }}>You will be signed out in <b class="c-head">${left} seconds</b> to keep the lab's data safe. Unsaved changes stay on this page.</p></${Dialog}>`;
}
