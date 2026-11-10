// The component layer: one component per FigCraft library set, with the library's property names
// (Stack_Decision_Record S-7, S-8). Ported from the prototype (.context/prototype/src/ui.js); more sets arrive with each module.
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Icon } from "./Icon";

export { Icon };
export const cx = (...a: Array<string | false | null | undefined>) => a.filter(Boolean).join(" ");

/* ---------- Esc closes the innermost layer ---------- */
const escStack: Array<() => void> = [];
document.addEventListener("keydown", (e) => { if (e.key === "Escape" && escStack.length) { e.preventDefault(); escStack[escStack.length - 1]!(); } });
export function useEsc(fn: () => void, active: boolean) {
  const ref = useRef(fn); ref.current = fn;
  useEffect(() => {
    if (!active) return;
    const h = () => ref.current();
    escStack.push(h);
    return () => { const i = escStack.lastIndexOf(h); if (i >= 0) escStack.splice(i, 1); };
  }, [active]);
}
export function useOutside(ref: React.RefObject<HTMLElement | null>, fn: () => void, active: boolean) {
  useEffect(() => {
    if (!active) return;
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) fn(); };
    const t = setTimeout(() => document.addEventListener("mousedown", h), 0);
    return () => { clearTimeout(t); document.removeEventListener("mousedown", h); };
  }, [active]);
}
const toFrame = (node: ReactNode) => { const host = document.querySelector(".frame"); return host ? createPortal(node, host) : node; };

/* ---------- actions ---------- */
type BtnType = "primary" | "secondary" | "tertiary" | "ghost";
export function Button({ type = "secondary", size = "md", tone, icon, trail, block, disabled, why, onClick, children, id, submit }: {
  type?: BtnType; size?: "sm" | "md" | "lg" | "touch"; tone?: "danger" | "accent"; icon?: string; trail?: string; block?: boolean;
  disabled?: boolean; why?: string; onClick?: () => void; children: ReactNode; id?: string; submit?: boolean }) {
  return <button id={id} type={submit ? "submit" : "button"} className={cx("btn", type, size, tone, block && "block")} disabled={disabled} title={disabled ? why : undefined} onClick={onClick}>
    {icon && <Icon n={icon} />}{children}{trail && <Icon n={trail} />}</button>;
}
export function IconBtn({ n, label, type, size = 32, onClick, disabled }: { n: string; label: string; type?: "secondary" | "tertiary" | "primary"; size?: 28 | 32 | 36 | 44; onClick?: () => void; disabled?: boolean }) {
  return <button type="button" className={cx("ib", type, size !== 32 && `s${size}`)} aria-label={label} title={label} disabled={disabled} onClick={(e) => { e.stopPropagation(); onClick?.(); }}>
    <Icon n={n} s={size === 44 ? 20 : 14} /></button>;
}

/* ---------- labels ---------- */
export function Avatar({ name, size = 32 }: { name: string; size?: 24 | 28 | 32 | 40 | 64 }) {
  const ini = name.replace(/^(Ir\.|Dr\.)\s+/, "").split(/[\s,]+/).filter((w) => /^[A-Z]/.test(w)).slice(0, 2).map((w) => w[0]).join("");
  return <span className={cx("av", size !== 32 && `s${size}`)} title={name}>{ini}</span>;
}
export function Alert({ tone = "info", title, text, action }: { tone?: "error" | "warning" | "info" | "success"; title: string; text?: ReactNode; action?: ReactNode }) {
  const ic = { error: "warning-circle", warning: "warning", info: "info", success: "check-circle" }[tone];
  return <div className={`alert al-${tone}`} role={tone === "error" ? "alert" : "status"}><Icon n={ic} /><div className="grow"><b>{title}</b>{text && <span>{text}</span>}</div>{action}</div>;
}
export function Empty({ icon = "question", title, text, action }: { icon?: string; title: string; text?: string; action?: ReactNode }) {
  return <div className="empty"><span className="ic"><Icon n={icon} s={24} /></span><h3 className="t-h3">{title}</h3>{text && <p>{text}</p>}{action}</div>;
}
export function Card({ title, actions, children, className }: { title?: string; actions?: ReactNode; children: ReactNode; className?: string }) {
  return <section className={cx("card", className)}>{(title || actions) && <div className="card-head">{title && <h2 className="t-h3">{title}</h2>}{actions && <div className="row g8 wrap">{actions}</div>}</div>}{children}</section>;
}
export function PageHead({ overline, title, actions }: { overline?: string; title: string; actions?: ReactNode }) {
  return <div className="page-head"><div className="tt">{overline && <span className="t-over">{overline}</span>}<h1 className="t-display">{title}</h1></div>{actions && <div className="row g10 wrap">{actions}</div>}</div>;
}

/* ---------- forms ---------- */
export function TextField({ label, value, onChange, error, help, type = "text", placeholder, autoComplete, id, req }: {
  label: string; value: string; onChange: (v: string) => void; error?: string | null; help?: string; type?: string; placeholder?: string; autoComplete?: string; id?: string; req?: boolean }) {
  const auto = useId(); const fid = id ?? auto;
  return <div className="field"><label className="flabel" htmlFor={fid}>{label}{req && <span className="req">*</span>}</label>
    <div className={cx("input", error && "err")}><input id={fid} type={type} value={value} placeholder={placeholder} autoComplete={autoComplete} aria-invalid={!!error} onChange={(e) => onChange(e.target.value)} /></div>
    {error ? <span className="help err">{error}</span> : help ? <span className="help">{help}</span> : null}</div>;
}
export function PasswordField({ label, value, onChange, error, help, placeholder, autoComplete = "current-password", id }: {
  label: string; value: string; onChange: (v: string) => void; error?: string | null; help?: string; placeholder?: string; autoComplete?: string; id?: string }) {
  const [show, setShow] = useState(false); const auto = useId(); const fid = id ?? auto;
  return <div className="field"><label className="flabel" htmlFor={fid}>{label}</label>
    <div className={cx("input", error && "err")} style={{ paddingRight: 4 }}><input id={fid} type={show ? "text" : "password"} value={value} placeholder={placeholder} autoComplete={autoComplete} aria-invalid={!!error} onChange={(e) => onChange(e.target.value)} />
      <IconBtn n={show ? "eye-slash" : "eye"} label={show ? "Hide password" : "Show password"} onClick={() => setShow(!show)} /></div>
    {error ? <span className="help err">{error}</span> : help ? <span className="help">{help}</span> : null}</div>;
}
export function Seg<T extends string>({ items, value, onChange, label }: { items: Array<[T, string]>; value: T; onChange: (v: T) => void; label: string }) {
  return <div className="seg" role="group" aria-label={label}>{items.map(([v, l]) => <button key={v} type="button" aria-pressed={value === v} onClick={() => onChange(v)}>{l}</button>)}</div>;
}

/* ---------- overlays ---------- */
export function Dialog({ title, sub, size = "md", onClose, children, footer, phone }: {
  title: string; sub?: ReactNode; size?: "sm" | "md" | "lg" | "xl"; onClose: () => void; children?: ReactNode; footer?: ReactNode; phone?: boolean }) {
  useEsc(onClose, true);
  return toFrame(<div className={cx("scrim", phone && "sheet")} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
    <div className={cx("dialog", size)} role="dialog" aria-modal="true" aria-label={title}>
      <div className="dh"><div className="tt"><h2 className="t-h3">{title}</h2>{sub && <p className="t-sm c-sec" style={{ margin: 0 }}>{sub}</p>}</div><IconBtn n="x" label="Close" onClick={onClose} /></div>
      {children && <div className="db">{children}</div>}
      {footer && <div className="df">{footer}</div>}
    </div></div>);
}

/* ---------- toasts ---------- */
type ToastItem = { id: number; text: string; tone?: "error" | "info" };
let pushToast: (t: Omit<ToastItem, "id">) => void = () => undefined;
export const toast = (text: string, tone?: "error" | "info") => pushToast(tone ? { text, tone } : { text });
export function Toasts() {
  const [list, setList] = useState<ToastItem[]>([]);
  useEffect(() => { pushToast = (t) => { const id = Date.now() + Math.random(); setList((l) => [...l, { ...t, id }]); setTimeout(() => setList((l) => l.filter((x) => x.id !== id)), 4200); }; }, []);
  return <div className="toasts" aria-live="polite">{list.map((t) => <div key={t.id} className={cx("toast", t.tone)}><Icon n={t.tone === "error" ? "warning-circle" : t.tone === "info" ? "info" : "check-circle"} s={20} /><span>{t.text}</span></div>)}</div>;
}
