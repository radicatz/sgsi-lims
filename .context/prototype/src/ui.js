/* SGSI LIMS prototype v2: shared runtime and the component layer (one component per FigCraft library set). */
const { useState, useEffect, useRef, useMemo, useContext, createContext, Fragment, useCallback } = React;
const html = htm.bind(React.createElement);
const Ctx = createContext(null);
const useApp = () => useContext(Ctx);
const cx = (...a) => a.filter(Boolean).join(" ");
const MOD = {}; // modules expose parts the shell uses (MOD.app.Bell, MOD.search.Quick, MOD.work.total)
const SH = {}; // components shared across modules (SH.MarkSent, SH.AddBatch, ...), looked up at render time

/* ---------- small helpers ---------- */
function Icon({ n, s, cls }) {
  const body = (window.ICONS && window.ICONS[n]) || '<circle cx="128" cy="128" r="40"/>';
  return html`<span class=${cx("ph", s && "i" + s, cls)} aria-hidden="true" dangerouslySetInnerHTML=${{ __html: '<svg viewBox="0 0 256 256" fill="currentColor">' + body + "</svg>" }}></span>`;
}
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
function d0(iso) { return new Date(iso.slice(0, 10) + "T00:00:00"); }
function fmtDate(iso, o = {}) { if (!iso) return "—"; const d = d0(iso); return d.getDate() + " " + MONTHS[d.getMonth()] + (o.noYear ? "" : " " + d.getFullYear()); }
function fmtShort(iso) { return fmtDate(iso, { noYear: true }); }
function fmtTime(iso) { return iso && iso.length > 10 ? iso.slice(11, 16) : ""; }
function longDate(iso) { const d = d0(iso); return DAYS[d.getDay()] + " " + d.getDate() + " " + ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"][d.getMonth()] + " " + d.getFullYear(); }
const isoLocal = (d) => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
function addDays(iso, n) { const d = d0(iso); d.setDate(d.getDate() + n); return isoLocal(d); }
function daysBetween(a, b) { return Math.round((d0(b) - d0(a)) / 86400000); }
const clone = (x) => JSON.parse(JSON.stringify(x));
const initials = (n) => n.replace(/^(Ir\.|Dr\.)\s+/, "").split(/[\s,]+/).filter((w) => /^[A-Z]/.test(w)).slice(0, 2).map((w) => w[0]).join("");
const plural = (n, a, b) => n + " " + (n === 1 ? a : b || a + "s");
const pad = (n, w = 4) => String(n).padStart(w, "0");

/* Esc closes the innermost open layer first. */
const escStack = [];
function useEsc(fn, active) {
  const ref = useRef(fn); ref.current = fn;
  useEffect(() => {
    if (!active) return;
    const h = () => ref.current();
    escStack.push(h);
    return () => { const i = escStack.lastIndexOf(h); if (i >= 0) escStack.splice(i, 1); };
  }, [active]);
}
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && escStack.length) { e.preventDefault(); escStack[escStack.length - 1](); }
});
function useOutside(ref, fn, active) {
  useEffect(() => {
    if (!active) return;
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) fn(); };
    const t = setTimeout(() => document.addEventListener("mousedown", h), 0);
    return () => { clearTimeout(t); document.removeEventListener("mousedown", h); };
  }, [active]);
}
function toFrame(node) { const host = document.querySelector(".frame"); return host ? ReactDOM.createPortal(node, host) : node; }

/* ---------- actions ---------- */
function Button({ type = "secondary", size = "md", tone, icon, trail, block, disabled, why, onClick, children, id, title }) {
  const app = useApp();
  const sz = app && app.bp === "phone" && size === "lg" ? "touch" : size;
  return html`<button id=${id} class=${cx("btn", type, sz, tone, block && "block")} disabled=${disabled} title=${disabled && why ? why : title} onClick=${onClick}>
    ${icon && html`<${Icon} n=${icon} />`}${children}${trail && html`<${Icon} n=${trail} />`}</button>`;
}
function IconBtn({ n, label, type, size = 32, onClick, disabled, title, id }) {
  return html`<button id=${id} class=${cx("ib", type, size !== 32 && "s" + size)} aria-label=${label} title=${title || label} disabled=${disabled} onClick=${(e) => { e.stopPropagation(); onClick && onClick(e); }}><${Icon} n=${n} s=${size === 44 ? 20 : undefined} /></button>`;
}
function LinkBtn({ icon, children, onClick, disabled }) {
  return html`<button class="linkbtn" disabled=${disabled} onClick=${onClick}>${icon && html`<${Icon} n=${icon} />`}${children}</button>`;
}
/* A link to another record; plain text when the role cannot open that page (Navigation section 3). */
function RecLink({ to, children, cls }) {
  const { go, canOpen } = useApp();
  if (!to || !canOpen(to)) return html`<span class=${cls}>${children}</span>`;
  return html`<a class=${cx("link", cls)} onClick=${(e) => { e.stopPropagation(); go(to); }}>${children}</a>`;
}

/* ---------- status and labels ---------- */
function Badge({ label, tone = "grey", sm }) { return html`<span class=${cx("badge", "tn-" + tone, sm && "sm")}>${label}</span>`; }
function Tag({ label, tone = "outline", icon }) { return html`<span class=${cx("tag", "tn-" + tone)}>${icon && html`<${Icon} n=${icon} />`}${label}</span>`; }
function CountPill({ n, tone }) { return html`<span class=${cx("cpill", tone)}>${n}</span>`; }
function Avatar({ name, size = 32, logo }) { return html`<span class=${cx("av", size !== 32 && "s" + size, logo && "logo-" + logo)} title=${name}>${logo ? "" : initials(name || "?")}</span>`; }
function Role({ r }) { return html`<span class="role">${r}</span>`; }
function FileChip({ type = "PDF", label, missing, onClick }) {
  return html`<button class=${cx("filechip", missing && "miss")} onClick=${(e) => { e.stopPropagation(); onClick && onClick(); }}><${Icon} n=${missing ? "file-x" : type === "PDF" ? "file-pdf" : type === "XLS" ? "file-xls" : "file-csv"} />${label || type}</button>`;
}
function Delta({ v }) { const tone = v.startsWith("+") ? "green" : v.startsWith("-") ? "red" : "grey"; return html`<span class=${cx("delta", "tn-" + tone)}>${v}</span>`; }
function Person({ name, sub, size = 24 }) {
  return html`<span class="row g6" style=${{ minWidth: 0 }}><${Avatar} name=${name} size=${size} /><span class="col g4" style=${{ gap: 0 }}><span class="t-sm w5 ellip">${name}</span>${sub && html`<span class="t-cap c-sec">${sub}</span>`}</span></span>`;
}

/* ---------- page structure ---------- */
function Page({ children, wide }) { return html`<div class="page">${children}</div>`; }
function PageHead({ overline, title, crumb, actions, badge, meta, children }) {
  return html`<div class="col g12">
    ${crumb && html`<${Crumb} items=${crumb} />`}
    <div class="page-head">
      <div class="tt">
        ${overline && html`<span class="t-over">${overline}</span>`}
        <div class="row g12 wrap"><h1 class="t-display">${title}</h1>${badge}</div>
        ${meta}
      </div>
      ${actions && html`<div class="row g10 wrap">${actions}</div>`}
    </div>
    ${children}
  </div>`;
}
function Crumb({ items }) {
  const { go } = useApp();
  return html`<nav class="crumb" aria-label="Breadcrumb">${items.map((it, i) => html`<${Fragment} key=${i}>
    ${i > 0 && html`<${Icon} n="caret-right" />`}
    ${i === items.length - 1 ? html`<b>${it[0]}</b>` : html`<a onClick=${() => go(it[1])}>${it[0]}</a>`}
  </${Fragment}>`)}</nav>`;
}
function Card({ title, head, actions, children, cls, style, id }) {
  return html`<section class=${cx("card", cls)} style=${style} id=${id}>
    ${(title || actions || head) && html`<div class="card-head">${title && html`<h2 class="t-h3">${title}</h2>`}${head}${actions && html`<div class="row g8 wrap">${actions}</div>`}</div>`}
    ${children}
  </section>`;
}
function Tabs({ items, value, onChange, id }) {
  return html`<div class="tabs" role="tablist" id=${id}>${items.map((t) => html`<button key=${t.id} role="tab" aria-selected=${value === t.id} class=${cx("tab", value === t.id && "on")} onClick=${() => onChange(t.id)}>
    <span class="r">${t.label}${t.count !== undefined && html`<${CountPill} n=${t.count} tone=${t.alert ? "alert" : value === t.id ? "primary" : undefined} />`}</span><span class="u"></span></button>`)}</div>`;
}
function Chips({ items, value, onChange, scroll, sm }) {
  return html`<div class=${cx("chips", scroll && "scroll")}>${items.map((c) => html`<button key=${c.id} class=${cx("chip", value === c.id && "on", sm && "sm")} aria-pressed=${value === c.id} onClick=${() => onChange(c.id)}>${c.label}${c.count !== undefined && html`<span class="n">${c.count}</span>`}</button>`)}</div>`;
}
function Seg({ items, value, onChange, label }) {
  return html`<div class="seg" role="group" aria-label=${label}>${items.map((it) => { const [v, l] = Array.isArray(it) ? it : [it, it]; return html`<button key=${v} aria-pressed=${value === v} onClick=${() => onChange(v)}>${l}</button>`; })}</div>`;
}
function Pager({ page, pages, total, from, to, onPage }) {
  if (!total) return null;
  const nums = []; for (let i = 1; i <= pages; i++) if (i <= 3 || i === pages || Math.abs(i - page) <= 1) nums.push(i);
  return html`<div class="pager"><span class="info">Showing ${from}–${to} of ${total}</span>
    <button class="pg" aria-label="Previous page" disabled=${page <= 1} onClick=${() => onPage(page - 1)}><${Icon} n="caret-left" /></button>
    ${nums.map((n) => html`<button key=${n} class=${cx("pg", n === page && "on")} onClick=${() => onPage(n)}>${n}</button>`)}
    <button class="pg" aria-label="Next page" disabled=${page >= pages} onClick=${() => onPage(page + 1)}><${Icon} n="caret-right" /></button></div>`;
}
function usePaged(rows, size, key) {
  const [page, setPage] = useState(1);
  useEffect(() => setPage(1), [key]);
  const pages = Math.max(1, Math.ceil(rows.length / size));
  const p = Math.min(page, pages);
  return { rows: rows.slice((p - 1) * size, p * size), pager: { page: p, pages, total: rows.length, from: rows.length ? (p - 1) * size + 1 : 0, to: Math.min(p * size, rows.length), onPage: setPage } };
}
function Stepper({ steps, current, vertical }) {
  return html`<div class=${vertical ? "vstep" : "stepper"}>${steps.map((s, i) => { const st = i < current ? "done" : i === current ? "cur" : "up";
    return html`<div key=${i} class=${cx("step", st)}><span class="mk">${st === "done" && html`<${Icon} n="check" />`}</span><span class="col" style=${{ gap: 0 }}><b>${s.title}</b>${s.meta && html`<small>${s.meta}</small>`}</span></div>`; })}</div>`;
}
function Progress({ v, max, tone }) { const pct = max ? Math.min(100, Math.round((v / max) * 100)) : 0; return html`<span class="progress ${tone || ""}"><i style=${{ width: pct + "%" }}></i></span>`; }
function KV({ k, children }) { return html`<div class="kv"><span>${k}</span><span>${children}</span></div>`; }
function Empty({ icon = "tray", title, text, action }) {
  return html`<div class="empty"><span class="ic"><${Icon} n=${icon} s="24" /></span><h3 class="t-h3">${title}</h3>${text && html`<p>${text}</p>`}${action}</div>`;
}
function Alert({ tone = "info", title, text, action }) {
  const ic = { error: "warning-circle", warning: "warning", info: "info", success: "check-circle" }[tone];
  return html`<div class=${"alert al-" + tone} role=${tone === "error" ? "alert" : undefined}><${Icon} n=${ic} /><div class="grow"><b>${title}</b>${text && html`<span>${text}</span>`}</div>${action}</div>`;
}
function Note({ children, icon = "info" }) { return html`<div class="note"><${Icon} n=${icon} /><span>${children}</span></div>`; }

/* ---------- forms ---------- */
function Field({ label, req, opt, help, error, children, id, style }) {
  return html`<div class="field" style=${style}>${label && html`<label class="flabel" for=${id}>${label}${req && html`<span class="req">*</span>`}${opt && html`<span class="opt">(optional)</span>`}</label>`}
    ${children}${error ? html`<span class="help err">${error}</span>` : help ? html`<span class="help">${help}</span>` : null}</div>`;
}
function TextField({ label, req, opt, help, error, value, onChange, placeholder, id, type = "text", suffix, icon, disabled, readOnly, style, mono }) {
  return html`<${Field} label=${label} req=${req} opt=${opt} help=${help} error=${error} id=${id} style=${style}>
    <div class=${cx("input", error && "err", (disabled || readOnly) && "dis")}>${icon && html`<${Icon} n=${icon} />`}
      <input id=${id} type=${type} value=${value == null ? "" : value} placeholder=${placeholder} disabled=${disabled} readOnly=${readOnly} style=${mono ? { fontFamily: "var(--f-mono)" } : undefined} onInput=${(e) => onChange && onChange(e.target.value)} />
      ${suffix && html`<span class="sfx">${suffix}</span>`}</div></${Field}>`;
}
function TextArea({ label, opt, value, onChange, placeholder, id }) {
  return html`<${Field} label=${label} opt=${opt} id=${id}><textarea class="input" id=${id} value=${value || ""} placeholder=${placeholder} onInput=${(e) => onChange(e.target.value)}></textarea></${Field}>`;
}
function Select({ label, req, opt, help, error, value, onChange, options, id, disabled, placeholder, style }) {
  return html`<${Field} label=${label} req=${req} opt=${opt} help=${help} error=${error} id=${id} style=${style}>
    <div class=${cx("input", error && "err", disabled && "dis")}><select id=${id} value=${value == null ? "" : value} disabled=${disabled} onChange=${(e) => onChange(e.target.value)}>
      ${placeholder && html`<option value="" disabled>${placeholder}</option>`}
      ${options.map((o) => { const [v, l] = Array.isArray(o) ? o : [o, o]; return html`<option key=${v} value=${v}>${l}</option>`; })}
    </select><${Icon} n="caret-down" /></div></${Field}>`;
}
function DateField(p) { return html`<${TextField} ...${p} type="date" />`; }
function PasswordField({ label, value, onChange, id, error, help, placeholder }) {
  const [show, setShow] = useState(false);
  return html`<${Field} label=${label} id=${id} error=${error} help=${help}><div class=${cx("input", error && "err")} style=${{ paddingRight: "4px" }}>
    <input id=${id} type=${show ? "text" : "password"} value=${value} placeholder=${placeholder} onInput=${(e) => onChange(e.target.value)} />
    <${IconBtn} n=${show ? "eye-slash" : "eye"} label=${show ? "Hide password" : "Show password"} onClick=${() => setShow(!show)} /></div></${Field}>`;
}
function Search({ value, onChange, placeholder, id, style, onEnter }) {
  return html`<label class="search" style=${style}><${Icon} n="magnifying-glass" /><input id=${id} value=${value} placeholder=${placeholder} onInput=${(e) => onChange(e.target.value)} onKeyDown=${(e) => e.key === "Enter" && onEnter && onEnter()} />
    ${value && html`<button aria-label="Clear search" onClick=${() => onChange("")}><${Icon} n="x" /></button>`}</label>`;
}
function Check({ on, mixed, onChange, label, disabled, id }) {
  return html`<label class=${cx("cb", on && "on", mixed && "on", disabled && "dis")} id=${id} onClick=${(e) => { e.preventDefault(); e.stopPropagation(); !disabled && onChange(!on); }}>
    <span class="box" role="checkbox" aria-checked=${mixed ? "mixed" : !!on} tabIndex="0" onKeyDown=${(e) => e.key === " " && (e.preventDefault(), !disabled && onChange(!on))}>${mixed ? html`<span style=${{ width: "8px", height: "2px", background: "currentColor" }}></span>` : on && html`<${Icon} n="check" />`}</span>${label}</label>`;
}
function Radio({ on, onChange, label }) {
  return html`<label class=${cx("rd", on && "on")} onClick=${(e) => { e.preventDefault(); onChange(); }}><span class="circ" role="radio" aria-checked=${!!on} tabIndex="0"></span>${label}</label>`;
}
function Switch({ on, onChange, label, id }) {
  return html`<label class=${cx("sw", on && "on")} id=${id} onClick=${(e) => { e.preventDefault(); onChange(!on); }}><span class="tr" role="switch" aria-checked=${!!on} tabIndex="0"></span>${label}</label>`;
}
function DropZone({ text = "Drop the file here, or click to browse", hint = "PDF, up to 10 MB", onFile, accept }) {
  const ref = useRef(); const [over, setOver] = useState(false);
  const take = (f) => f && onFile({ name: f.name, size: f.size });
  return html`<div class=${cx("dz", over && "over")} onClick=${() => ref.current.click()} onDragOver=${(e) => { e.preventDefault(); setOver(true); }} onDragLeave=${() => setOver(false)} onDrop=${(e) => { e.preventDefault(); setOver(false); take(e.dataTransfer.files[0]); }}>
    <${Icon} n="upload-simple" s="20" /><b>${text}</b><span class="t-cap">${hint}</span>
    <input ref=${ref} type="file" accept=${accept} hidden onChange=${(e) => take(e.target.files[0])} /></div>`;
}
const fileSize = (b) => (b > 1e6 ? (b / 1e6).toFixed(1) + " MB" : Math.max(1, Math.round(b / 1e3)) + " KB");

/* ---------- overlays ---------- */
/* Centered dialog on desktop and tablet; bottom sheet on the phone (or full screen when full is set). */
function Dialog({ title, sub, size = "md", onClose, children, footer, split, full, id }) {
  const { bp } = useApp();
  useEsc(onClose, true);
  const ref = useRef();
  useEffect(() => { const el = ref.current && ref.current.querySelector("input, select, textarea, button.btn.primary"); el && el.focus && el.focus({ preventScroll: true }); }, []);
  if (bp === "phone" && full) return toFrame(html`<div class="fullscreen" ref=${ref} role="dialog" aria-modal="true" aria-label=${title} id=${id}>
    <div class="fh"><h2 class="t-h3 grow">${title}</h2><${IconBtn} n="x" label="Close" onClick=${onClose} /></div>
    <div class="fb">${sub && html`<p class="t-sm c-sec" style=${{ margin: 0 }}>${sub}</p>`}${children}</div>${footer && html`<div class="ff">${footer}</div>`}</div>`);
  return toFrame(html`<div class=${cx("scrim", bp === "phone" && "sheet")} onMouseDown=${(e) => e.target === e.currentTarget && onClose()}>
    <div class=${cx("dialog", size)} role="dialog" aria-modal="true" aria-label=${title} ref=${ref} id=${id}>
      <div class="dh"><div class="tt"><h2 class="t-h3">${title}</h2>${sub && html`<p class="t-sm c-sec" style=${{ margin: 0 }}>${sub}</p>`}</div><${IconBtn} n="x" label="Close" onClick=${onClose} /></div>
      <div class="db">${children}</div>
      ${footer && html`<div class=${cx("df", split && "split")}>${footer}</div>`}
    </div></div>`);
}
function Confirm({ title, text, ok = "Confirm", cancel = "Cancel", danger, onOk, onClose, children, disabled }) {
  return html`<${Dialog} title=${title} size="sm" onClose=${onClose} footer=${html`<${Button} onClick=${onClose}>${cancel}</${Button}><${Button} type="primary" tone=${danger && "danger"} disabled=${disabled} onClick=${onOk}>${ok}</${Button}>`}>
    ${text && html`<p class="t-sm c-sec" style=${{ margin: 0 }}>${text}</p>`}${children}</${Dialog}>`;
}
/* Overflow / row menu anchored to its button. items: [{label, icon, onClick, danger, disabled, why}] or "-" */
function Menu({ items, label = "More actions", vertical, size = 32, align = "right" }) {
  const [open, setOpen] = useState(null);
  const ref = useRef();
  useOutside(ref, () => setOpen(null), !!open);
  useEsc(() => setOpen(null), !!open);
  const list = items.filter(Boolean);
  if (!list.length) return null;
  const toggle = (e) => {
    e.stopPropagation();
    if (open) return setOpen(null);
    const fr = document.querySelector(".frame").getBoundingClientRect(), r = e.currentTarget.getBoundingClientRect(), z = fr.width / document.querySelector(".frame").offsetWidth;
    const x = (r.right - fr.left) / z, y = (r.bottom - fr.top) / z, h = list.length * 38 + 14, H = fr.height / z;
    setOpen({ right: align === "right" ? Math.max(8, document.querySelector(".frame").offsetWidth - x) : undefined, left: align === "left" ? (r.left - fr.left) / z : undefined, top: y + h > H - 8 ? Math.max(8, (r.top - fr.top) / z - h - 4) : y + 4 });
  };
  return html`<span ref=${ref} style=${{ display: "inline-flex" }}><${IconBtn} n=${vertical ? "dots-three-vertical" : "dots-three"} label=${label} size=${size} type=${size >= 36 ? "secondary" : undefined} onClick=${toggle} />
    ${open && toFrame(html`<div class="menu" role="menu" style=${{ top: open.top + "px", right: open.right != null ? open.right + "px" : undefined, left: open.left != null ? open.left + "px" : undefined }} onMouseDown=${(e) => e.stopPropagation()}>
      ${list.map((it, i) => it === "-" ? html`<div class="mdiv" key=${i}></div>` : html`<button key=${i} role="menuitem" class=${cx("mi", it.danger && "danger")} disabled=${it.disabled} title=${it.disabled ? it.why : undefined} onClick=${(e) => { e.stopPropagation(); setOpen(null); it.onClick(); }}>${it.icon && html`<${Icon} n=${it.icon} />`}${it.label}${it.meta && html`<span class="meta">${it.meta}</span>`}</button>`)}
    </div>`)}</span>`;
}
/* Hover tooltip rendered in the frame. */
function Tip({ text, children }) {
  const [pos, setPos] = useState(null);
  const show = (e) => { const f = document.querySelector(".frame"); const fr = f.getBoundingClientRect(), r = e.currentTarget.getBoundingClientRect(), z = fr.width / f.offsetWidth; setPos({ left: (r.left - fr.left) / z, top: (r.bottom - fr.top) / z + 6 }); };
  return html`<span onMouseEnter=${show} onMouseLeave=${() => setPos(null)} onFocus=${show} onBlur=${() => setPos(null)} style=${{ display: "inline-flex" }}>${children}${pos && toFrame(html`<div class="tip" role="tooltip" style=${{ left: pos.left + "px", top: pos.top + "px" }}>${text}</div>`)}</span>`;
}
function Toasts() {
  const { toasts, dropToast } = useApp();
  return html`<div class="toasts" aria-live="polite">${toasts.map((t) => html`<div key=${t.id} class=${cx("toast", t.tone)}><${Icon} n=${t.tone === "error" ? "warning-circle" : t.tone === "info" ? "info" : "check-circle"} s="20" /><span>${t.text}</span>
    ${t.undo && html`<button onClick=${() => { t.undo(); dropToast(t.id); }}>Undo</button>`}</div>`)}</div>`;
}

/* ---------- table ---------- */
/* cols: [{h, k|render, cls, w}] rows: objects; onRow: click handler */
function Table({ cols, rows, onRow, rowCls, sel, empty, id, keyOf }) {
  return html`<div class="tblwrap" id=${id}><table class="tbl"><thead><tr>${cols.map((c, i) => html`<th key=${i} class=${c.cls} style=${c.w ? { width: c.w } : undefined}>${c.h}</th>`)}</tr></thead>
    <tbody>${rows.map((r, ri) => html`<tr key=${keyOf ? keyOf(r) : r.id || r.no || ri} class=${cx(onRow && "click", rowCls && rowCls(r))} onClick=${onRow ? () => onRow(r) : undefined}>
      ${cols.map((c, i) => html`<td key=${i} class=${c.cls}>${c.render ? c.render(r, ri) : r[c.k]}</td>`)}</tr>`)}</tbody></table>
    ${!rows.length && empty}</div>`;
}
