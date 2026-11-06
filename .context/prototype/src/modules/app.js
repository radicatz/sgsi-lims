/* App group (App_Prototype_Plan.md): sign in, passwords, notifications, user menu, profile. */
(function () {
  function AuthFrame({ children }) {
    return html`<div class="auth"><div class="acard">
      <div class="abrand"><span class="logo"></span><div><div class="t-h2">SGSI LIMS</div><div class="t-sm c-sec">Laboratory information system for coal analysis</div></div></div>
      ${children}</div><div class="row g12 t-cap c-mut"><span>Version 1.0</span><span class="link" style=${{ fontWeight: 500 }}>Privacy (UU PDP No. 27/2022)</span></div></div>`;
  }
  const emailRole = (db, email) => { const u = db.users.find((x) => x.email.toLowerCase() === email.trim().toLowerCase()); if (!u) return null; return { u, role: Object.keys(D.PERSONA).find((r) => D.PERSONA[r].user === u.id) || u.roles[0] }; };

  function SignIn() {
    const { db, ui, setUi, signIn, go } = useApp();
    const [email, setEmail] = useState("maya@sgsi.co.id"), [pw, setPw] = useState("");
    const [err, setErr] = useState(null);
    const fails = ui.fails || 0;
    const locked = fails >= db.config.security.lockAfter;
    const submit = (e) => {
      e && e.preventDefault();
      if (locked) return;
      const hit = emailRole(db, email);
      if (!hit || pw === "wrong" || !pw) { const n = fails + 1; setUi({ fails: n }); setErr(n >= db.config.security.lockAfter ? "locked" : "wrong"); return; }
      if (hit.u.status === "Locked") { setErr("locked"); return; }
      if (hit.u.status !== "Active") { setErr("inactive"); return; }
      setUi({ fails: 0, signedOut: null }); signIn(hit.role);
    };
    const alert = locked || err === "locked" ? html`<${Alert} tone="error" title="Too many failed attempts" text="Try again at 10:42, or reset your password." action=${html`<button class="linkbtn" onClick=${() => go("forgot")}>Reset</button>`} />`
      : err === "wrong" ? html`<${Alert} tone="error" title="The email or password is not correct." text="Check both and try again." />`
      : err === "inactive" ? html`<${Alert} tone="error" title="This account cannot sign in" text="Ask your lab admin to reactivate it." />`
      : ui.signedOut === "timeout" ? html`<${Alert} tone="info" title="You were signed out" text="30 minutes without activity. Sign in to continue." />` : null;
    return html`<${AuthFrame}><form class="col g16" onSubmit=${submit} id="signin-form">
      <h1 class="t-h3">Sign in</h1>${alert}
      <${TextField} id="si-email" label="Email" value=${email} onChange=${setEmail} placeholder="name@sgsi.co.id" type="email" />
      <div class="col g6"><${PasswordField} id="si-pw" label="Password" value=${pw} onChange=${setPw} placeholder="Your password" /><div class="row end"><button type="button" class="linkbtn" onClick=${() => go("forgot")}>Forgot password?</button></div></div>
      <button class="btn primary lg block" id="si-submit" type="submit" disabled=${locked}>Sign in</button>
      <div class="t-cap c-mut">Demo: any staff email from the Users list with any password signs in. The password "wrong" shows the error. Accounts: ${D.ROLES.map((r) => S.user(db, D.PERSONA[r].user).email).join(", ")}.</div>
    </form></${AuthFrame}>`;
  }
  function Forgot() {
    const { go } = useApp();
    const [email, setEmail] = useState("maya@sgsi.co.id"), [sent, setSent] = useState(false), [left, setLeft] = useState(42);
    useEffect(() => { if (!sent) return; const t = setInterval(() => setLeft((s) => Math.max(0, s - 1)), 1000); return () => clearInterval(t); }, [sent]);
    return html`<${AuthFrame}>${sent ? html`<div class="col g16"><h1 class="t-h3">Check your email</h1><p class="t-sm c-sec" style=${{ margin: 0 }}>If ${email} has an account, a reset link is on its way. It works for 60 minutes.</p>
        <${Note}>Demo: <a class="link" onClick=${() => go("set-password-reset")}>open the reset link</a></${Note}>
        <${Button} type="secondary" size="lg" block disabled=${left > 0} onClick=${() => setLeft(42)}>${left > 0 ? "Resend link in 0:" + String(left).padStart(2, "0") : "Resend link"}</${Button}>
        <${Button} type="ghost" size="lg" block onClick=${() => go("login")}>Back to sign in</${Button}></div>`
      : html`<form class="col g16" onSubmit=${(e) => { e.preventDefault(); setSent(true); }}><h1 class="t-h3">Reset your password</h1><p class="t-sm c-sec" style=${{ margin: 0 }}>Enter your work email. We send a link to set a new password.</p>
        <${TextField} id="fp-email" label="Email" value=${email} onChange=${setEmail} type="email" />
        <button class="btn primary lg block" type="submit">Send reset link</button><${Button} type="ghost" size="lg" block onClick=${() => go("login")}>Back to sign in</${Button}></form>`}</${AuthFrame}>`;
  }
  function SetPassword({ kind }) {
    const { go, db, signIn, setUi, toast, update, api } = useApp();
    const [a, setA] = useState(""), [b, setB] = useState(""), [err, setErr] = useState(null);
    const sec = db.config.security;
    if (kind === "expired") return html`<${AuthFrame}><div class="col g16"><h1 class="t-h3">This link has expired</h1><p class="t-sm c-sec" style=${{ margin: 0 }}>Reset links work for ${sec.resetValid} minutes. Ask for a new one.</p>
      <${Button} type="primary" size="lg" block onClick=${() => go("forgot")}>Send a new link</${Button}><${Button} type="ghost" size="lg" block onClick=${() => go("login")}>Back to sign in</${Button}></div></${AuthFrame}>`;
    const invited = kind === "invite" ? db.users.find((u) => u.status === "Invited") : null;
    const ok = () => {
      if (a.length < sec.minLen || (sec.letterNum && !(/[a-z]/i.test(a) && /\d/.test(a)))) return setErr("Use at least " + sec.minLen + " characters with a letter and a number.");
      if (a !== b) return setErr("The two passwords are not the same.");
      if (invited) { update((d) => { const u = d.users.find((x) => x.id === invited.id); u.status = "Active"; u.last = "Today, " + api.now().slice(11); }); setUi({ role: "analyst" }); toast("Welcome, " + invited.name + ". Your password is set."); signIn("analyst"); }
      else { toast("Password set. Sign in with the new one."); go("login"); }
    };
    return html`<${AuthFrame}><form class="col g16" onSubmit=${(e) => { e.preventDefault(); ok(); }}>
      <h1 class="t-h3">${invited ? "Welcome, " + invited.name.split(" ")[0] : "Set a new password"}</h1>
      <p class="t-sm c-sec" style=${{ margin: 0 }}>${invited ? "Set a password for " + invited.email + " to finish your account." : "Use at least " + sec.minLen + " characters with a letter and a number."}</p>
      <${PasswordField} id="np1" label="New password" value=${a} onChange=${setA} error=${err} />
      <${PasswordField} id="np2" label="Confirm password" value=${b} onChange=${setB} />
      <button class="btn primary lg block" type="submit">${invited ? "Set password and sign in" : "Set password"}</button></form></${AuthFrame}>`;
  }

  /* ---------- notifications ---------- */
  const when = (iso) => (iso.slice(0, 10) === D.TODAY ? "Today, " + iso.slice(11, 16) : fmtDate(iso, { noYear: true }) + ", " + iso.slice(11, 16));
  function NotifItem({ n, onOpen }) {
    const { role } = useApp();
    const unread = !n.read.includes(role);
    return html`<button class="row top g12" style=${{ textAlign: "left", width: "100%", padding: "12px", borderRadius: "10px" }} onClick=${() => onOpen(n)} onMouseEnter=${(e) => (e.currentTarget.style.background = "var(--primary-50)")} onMouseLeave=${(e) => (e.currentTarget.style.background = "")}>
      <span class="av" style=${{ background: "var(--primary-50)", color: "var(--action-brand-text)" }}><${Icon} n=${n.icon || "bell"} /></span>
      <span class="col grow" style=${{ gap: "2px" }}><span class=${cx("t-sm", unread ? "w6" : "w5")}>${n.title}</span><span class="t-cap c-sec">${n.text}</span><span class="t-cap c-mut">${when(n.at)}</span></span>
      ${unread && html`<span style=${{ width: "8px", height: "8px", borderRadius: "4px", background: "var(--primary)", marginTop: "6px", flex: "none" }} aria-label="Unread"></span>`}</button>`;
  }
  function useNotes() {
    const { db, role, update, go } = useApp();
    const mine = db.notes.filter((n) => n.to.includes(role)).sort((a, b) => (a.at < b.at ? 1 : -1));
    const open = (n) => { update((d) => { const x = d.notes.find((y) => y.id === n.id); if (!x.read.includes(role)) x.read.push(role); }); go(n.link); };
    const markAll = () => update((d) => d.notes.forEach((x) => { if (x.to.includes(role) && !x.read.includes(role)) x.read.push(role); }));
    return { mine, open, markAll, unread: mine.filter((n) => !n.read.includes(role)) };
  }
  function Bell() {
    const { unread, bp, go } = useApp();
    const [open, setOpen] = useState(false);
    const ref = useRef();
    useOutside(ref, () => setOpen(false), open);
    useEsc(() => setOpen(false), open);
    return html`<div ref=${ref} style=${{ position: "relative" }}>
      <div class="bellwrap"><${IconBtn} n="bell" type="secondary" size=${36} label=${"Notifications" + (unread ? ", " + unread + " unread" : "")} onClick=${() => (bp === "phone" ? go("notifications") : setOpen(!open))} />
        ${unread > 0 && html`<span class="badge-n">${unread}</span>`}</div>
      ${open && html`<${NotifPanel} onClose=${() => setOpen(false)} />`}</div>`;
  }
  function NotifPanel({ onClose }) {
    const { go } = useApp();
    const { mine, open, markAll, unread } = useNotes();
    const [tab, setTab] = useState("all");
    const list = (tab === "all" ? mine : unread).slice(0, 6);
    return html`<div class="menu" style=${{ right: 0, top: "44px", width: "400px", padding: "16px", gap: "8px" }} id="notif-panel">
      <div class="card-head"><h2 class="t-h3">Notifications</h2><button class="linkbtn" disabled=${!unread.length} onClick=${markAll}>Mark all read</button></div>
      <${Tabs} items=${[{ id: "all", label: "All" }, { id: "unread", label: "Unread", count: unread.length }]} value=${tab} onChange=${setTab} />
      <div class="col" style=${{ gap: 0, maxHeight: "420px", overflowY: "auto" }}>${list.length ? list.map((n) => html`<${NotifItem} key=${n.id} n=${n} onOpen=${(x) => { onClose(); open(x); }} />`) : html`<${Empty} icon="bell" title="You're all caught up" text="New hand-offs to your queues appear here." />`}</div>
      <div class="divider"></div><div class="row" style=${{ justifyContent: "center" }}><button class="linkbtn" onClick=${() => { onClose(); go("notifications"); }}>See all notifications</button></div></div>`;
  }
  function NotificationsPage() {
    const { mine, open, markAll, unread } = useNotes();
    const [tab, setTab] = useState("all"), [n, setN] = useState(8);
    const list = tab === "all" ? mine : unread;
    return html`<${Page}><${PageHead} overline="Notifications" title="Notifications" actions=${html`<${Button} disabled=${!unread.length} onClick=${markAll}>Mark all read</${Button}>`} />
      <${Tabs} items=${[{ id: "all", label: "All" }, { id: "unread", label: "Unread", count: unread.length }]} value=${tab} onChange=${setTab} />
      <${Card}>${list.length ? html`<div class="col" style=${{ gap: 0 }}>${list.slice(0, n).map((x) => html`<${NotifItem} key=${x.id} n=${x} onOpen=${open} />`)}</div>
        ${list.length > n && html`<div class="row" style=${{ justifyContent: "center" }}><${Button} onClick=${() => setN(n + 8)}>Load more</${Button}></div>`}`
        : html`<${Empty} icon="bell" title="You're all caught up" text="New hand-offs to your queues appear here." />`}</${Card}></${Page}>`;
  }

  /* ---------- user menu and profile ---------- */
  function UserMenu({ onClose }) {
    const { go, signOut, me, role, bp } = useApp();
    return html`<div class="menu" style=${{ right: 0, top: "48px", width: "260px" }} id="user-menu">
      <div class="row g10" style=${{ padding: "8px 10px" }}><${Avatar} name=${me.name} size=${40} /><span class="col" style=${{ gap: 0 }}><b class="t-sm w6">${me.name}</b><span class="t-cap c-sec">${D.ROLE_FULL[role]}</span></span></div><div class="mdiv"></div>
      <button class="mi" onClick=${() => { onClose(); go("profile"); }}><${Icon} n="user" />Profile</button>
      <button class="mi" onClick=${() => { onClose(); go("profile-notifications"); }}><${Icon} n="bell" />Notification settings</button><div class="mdiv"></div>
      <button class="mi" id="sign-out" onClick=${() => { onClose(); signOut(); }}><${Icon} n="sign-out" />Sign out</button></div>`;
  }
  const NOTIF_SW = [["receive", "Batch ready to receive"], ["roa", "Analysis finished, RoA to upload"], ["coa", "Job order ready for its CoA"], ["due", "Batch due within 24 h"]];
  function Profile({ focus }) {
    const { me, role, db, update, toast, collapsed, setCollapsed, signOut, bp, api } = useApp();
    const u = S.user(db, me.user || "u2") || {};
    const prefs = db.prefs[u.id] || {};
    const [name, setName] = useState(u.name), [start, setStart] = useState(prefs.start || D.START(role));
    const [sw, setSw] = useState(prefs.sw || { receive: true, roa: true, coa: true, due: true });
    const [pw, setPw] = useState(null);
    const ref = useRef();
    useEffect(() => { if (focus && ref.current) ref.current.scrollIntoView({ block: "start" }); }, [focus]);
    const save = () => { update((d) => { const x = d.users.find((y) => y.id === u.id); x.name = name; d.prefs[u.id] = { start, sw }; api.audit(d, "User", u.name, "Updated", [["Profile", "", "Saved"]], "Profile"); }); toast("Profile saved"); };
    return html`<${Page}><${PageHead} overline="Profile" title="Profile" actions=${html`<${Button} icon="sign-out" onClick=${() => signOut()}>Sign out</${Button}>`} />
      <div class="grid" style=${{ gridTemplateColumns: bp === "desktop" ? "1fr 1fr" : "1fr" }}>
        <${Card} title="Your account"><div class="row g12"><${Avatar} name=${u.name} size=${64} /><div class="col g4"><b class="t-h3">${u.name}</b><span class="row g6 wrap">${u.roles.map((r) => html`<${Role} key=${r} r=${D.ROLE_LABEL[r]} />`)}</span></div></div>
          <${TextField} id="pf-name" label="Name" value=${name} onChange=${setName} /><${TextField} label="Email" value=${u.email} readOnly help="Your lab admin changes the email." /><${TextField} label="Title (printed on reports)" value=${u.title} readOnly />
          <div class="row"><${Button} icon="lock-simple" onClick=${() => setPw("form")}>Change password</${Button}></div></${Card}>
        <div class="col g20"><${Card} title="Layout"><div class="field"><span class="flabel">Sidebar</span><${Seg} items=${[["exp", "Expanded"], ["col", "Collapsed"]]} value=${collapsed ? "col" : "exp"} onChange=${(v) => setCollapsed(v === "col")} label="Sidebar" /><span class="help">Applies on desktop. Tablets always show the rail.</span></div>
            <${Select} id="pf-start" label="Start page" value=${start} onChange=${setStart} options=${D.VISIBLE[role].filter((v) => ["work", "dashboard", "orders", "batches", "reports"].includes(v)).map((v) => [v, { work: "My work", dashboard: "Dashboard", orders: "Job orders", batches: "Batches", reports: "Reports" }[v]])} /></${Card}>
          <section class="card" ref=${ref} id="notif-settings"><div class="card-head"><h2 class="t-h3">Notifications</h2></div><span class="t-sm c-sec">Choose which hand-offs reach your bell.</span>
            ${NOTIF_SW.map(([k, l]) => html`<${Switch} key=${k} id=${"sw-" + k} on=${sw[k]} label=${l} onChange=${(v) => setSw(Object.assign({}, sw, { [k]: v }))} />`)}</section></div></div>
      <div class=${bp === "phone" ? "sticky-bar" : "row end"}><${Button} type="primary" size="lg" onClick=${save}>Save</${Button}></div>
      ${pw && html`<${ChangePassword} onClose=${() => setPw(null)} />`}</${Page}>`;
  }
  function ChangePassword({ onClose }) {
    const { db, toast } = useApp();
    const [cur, setCur] = useState(""), [a, setA] = useState(""), [b, setB] = useState(""), [err, setErr] = useState({});
    const sec = db.config.security;
    const ok = () => {
      const e = {};
      if (!cur) e.cur = "Enter your current password.";
      if (a.length < sec.minLen || !(/[a-z]/i.test(a) && /\d/.test(a))) e.a = "Use at least " + sec.minLen + " characters with a letter and a number.";
      else if (a !== b) e.b = "The two passwords are not the same.";
      setErr(e); if (Object.keys(e).length) return;
      onClose(); toast("Password changed");
    };
    return html`<${Dialog} title="Change password" sub=${"Use at least " + sec.minLen + " characters with a letter and a number."} size="sm" onClose=${onClose} id="pw-dialog"
      footer=${html`<${Button} onClick=${onClose}>Cancel</${Button}><${Button} type="primary" onClick=${ok}>Change password</${Button}>`}>
      <${PasswordField} id="cp-cur" label="Current password" value=${cur} onChange=${setCur} error=${err.cur} />
      <${PasswordField} id="cp-a" label="New password" value=${a} onChange=${setA} error=${err.a} />
      <${PasswordField} id="cp-b" label="Confirm new password" value=${b} onChange=${setB} error=${err.b} /></${Dialog}>`;
  }

  MOD.app = { Bell, UserMenu };
  ROUTES.push(
    { re: /^login$/, auth: true, nav: "login", render: () => html`<${SignIn} />` },
    { re: /^forgot$/, auth: true, nav: "login", render: () => html`<${Forgot} />` },
    { re: /^set-password-(reset|invite|expired)$/, auth: true, nav: "login", render: (m) => html`<${SetPassword} kind=${m[1]} />` },
    { re: /^notifications$/, nav: "any", render: () => html`<${NotificationsPage} />` },
    { re: /^profile(-notifications)?$/, nav: "any", render: (m) => html`<${Profile} focus=${!!m[1]} />` },
  );
  FLOWS.push(
    { id: "AP1", group: "App", title: "Sign in and land on the start page", role: "cso", steps: "Sign in with rina@sgsi.co.id and any password; My work opens. Try maya@ (My work) and hendra@ (Dashboard).", start: { hash: "login", signedOut: true } },
    { id: "AP2", group: "App", title: "Wrong password, then locked", role: "lab_admin", steps: "Type the password \"wrong\" and sign in; repeat until Locked shows, then Reset.", start: { hash: "login", signedOut: true } },
    { id: "AP3", group: "App", title: "Forgot and set password", role: "analyst", steps: "Forgot password, Send reset link, open the demo link, set a new password, sign in.", start: { hash: "forgot", signedOut: true } },
    { id: "AP4", group: "App", title: "Accept an invite", role: "analyst", steps: "Sari Anggraini opens her invite link, sets a password and lands on My work.", start: { hash: "set-password-invite", signedOut: true } },
    { id: "AP5", group: "App", title: "Notifications", role: "lab_admin", steps: "Bell (3 unread), Unread tab, open an item; Mark all read; See all notifications.", start: { hash: "work" } },
    { id: "AP6", group: "App", title: "Profile and password", role: "prep", steps: "User menu, Profile, sidebar Collapsed, Change password (try a short one first), Sign out.", start: { hash: "profile" } },
    { id: "AP7", group: "App", title: "Session timeout", role: "cso", steps: "Spec only, Start the session timeout; Stay signed in. Start it again and let it run out.", start: { hash: "work" } },
    { id: "AP8", group: "App", title: "No access", role: "cso", steps: "The CSO opens the Users page by link: No access, then Go to My work.", start: { hash: "users" } },
  );
})();
