// Data-screen components ported from the prototype (.context/prototype/src/ui.js): tables, paging, chips, menus, form controls.
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { Button, Dialog, Icon, IconBtn, cx, toFrame, useEsc, useOutside } from "./index";

export type Tone = "grey" | "green" | "red" | "amber" | "blue" | "outline" | "orange";
export const Badge = ({ label, tone = "grey", sm }: { label: string; tone?: Tone; sm?: boolean }) => <span className={cx("badge", "tn-" + tone, sm && "sm")}>{label}</span>;
export const Tag = ({ label, tone = "outline", icon }: { label: string; tone?: Tone; icon?: string }) => <span className={cx("tag", "tn-" + tone)}>{icon && <Icon n={icon} />}{label}</span>;
export const KV = ({ k, children }: { k: string; children: ReactNode }) => <div className="kv"><span>{k}</span><span>{children}</span></div>;
export const Note = ({ children, icon = "info" }: { children: ReactNode; icon?: string }) => <div className="note"><Icon n={icon} /><span>{children}</span></div>;
export const FileChip = ({ label, missing, onClick }: { label: string; missing?: boolean; onClick?: () => void }) =>
  <button type="button" className={cx("filechip", missing && "miss")} onClick={(e) => { e.stopPropagation(); onClick?.(); }}><Icon n={missing ? "file-x" : "file-pdf"} />{label}</button>;

/* ---------- filter chips and paging ---------- */
export function Chips<T extends string>({ items, value, onChange, scroll }: { items: Array<{ id: T; label: string; count?: number }>; value: T; onChange: (v: T) => void; scroll?: boolean }) {
  return <div className={cx("chips", scroll && "scroll")}>{items.map((c) => <button key={c.id} type="button" className={cx("chip", value === c.id && "on")} aria-pressed={value === c.id} onClick={() => onChange(c.id)}>
    {c.label}{c.count !== undefined && <span className="n">{c.count}</span>}</button>)}</div>;
}
export interface PagerState { page: number; pages: number; total: number; from: number; to: number; onPage: (n: number) => void }
export function usePaged<T>(rows: T[], size: number, key: string) {
  const [page, setPage] = useState(1);
  useEffect(() => setPage(1), [key]);
  const pages = Math.max(1, Math.ceil(rows.length / size)); const p = Math.min(page, pages);
  const pager: PagerState = { page: p, pages, total: rows.length, from: rows.length ? (p - 1) * size + 1 : 0, to: Math.min(p * size, rows.length), onPage: setPage };
  return { rows: rows.slice((p - 1) * size, p * size), pager };
}
export function Pager({ page, pages, total, from, to, onPage }: PagerState) {
  if (!total) return null;
  const nums: number[] = []; for (let i = 1; i <= pages; i++) if (i <= 3 || i === pages || Math.abs(i - page) <= 1) nums.push(i);
  return <div className="pager"><span className="info">Showing {from}–{to} of {total}</span>
    <button type="button" className="pg" aria-label="Previous page" disabled={page <= 1} onClick={() => onPage(page - 1)}><Icon n="caret-left" /></button>
    {nums.map((n) => <button key={n} type="button" className={cx("pg", n === page && "on")} onClick={() => onPage(n)}>{n}</button>)}
    <button type="button" className="pg" aria-label="Next page" disabled={page >= pages} onClick={() => onPage(page + 1)}><Icon n="caret-right" /></button></div>;
}

/* ---------- table ---------- */
export interface Col<T> { h: string; cls?: string; render: (r: T, i: number) => ReactNode }
export function Table<T>({ cols, rows, onRow, keyOf, empty }: { cols: Array<Col<T> | false | null | undefined>; rows: T[]; onRow?: (r: T) => void; keyOf: (r: T) => string; empty?: ReactNode }) {
  const cs = cols.filter(Boolean) as Array<Col<T>>;
  return <div className="tblwrap"><table className="tbl"><thead><tr>{cs.map((c, i) => <th key={i} className={c.cls}>{c.h}</th>)}</tr></thead>
    <tbody>{rows.map((r, ri) => <tr key={keyOf(r)} className={cx(onRow && "click")} onClick={onRow ? () => onRow(r) : undefined}>{cs.map((c, i) => <td key={i} className={c.cls}>{c.render(r, ri)}</td>)}</tr>)}</tbody></table>
    {!rows.length && empty}</div>;
}

/* ---------- row menu, anchored under its button inside .frame ---------- */
export interface MenuItem { label: string; icon?: string; onClick: () => void; danger?: boolean; disabled?: boolean; why?: string }
export function Menu({ items, label = "More actions", size = 32 }: { items: Array<MenuItem | false | null | undefined>; label?: string; size?: 32 | 36 }) {
  const [open, setOpen] = useState<{ top: number; right: number } | null>(null);
  const ref = useRef<HTMLSpanElement>(null);
  useOutside(ref, () => setOpen(null), !!open); useEsc(() => setOpen(null), !!open);
  const list = items.filter(Boolean) as MenuItem[];
  if (!list.length) return null;
  const toggle = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation(); if (open) return setOpen(null);
    const frame = document.querySelector(".frame")!, fr = frame.getBoundingClientRect(), r = e.currentTarget.getBoundingClientRect();
    const h = list.length * 38 + 14; const below = r.bottom - fr.top + 4;
    setOpen({ right: Math.max(8, fr.right - r.right), top: below + h > fr.height - 8 ? Math.max(8, r.top - fr.top - h - 4) : below });
  };
  return <span ref={ref} style={{ display: "inline-flex" }}><IconBtn n="dots-three" label={label} size={size} onClick={toggle} />
    {open && toFrame(<div className="menu" role="menu" style={{ top: open.top, right: open.right }} onMouseDown={(e) => e.stopPropagation()}>
      {list.map((it) => <button key={it.label} type="button" role="menuitem" className={cx("mi", it.danger && "danger")} disabled={!!it.disabled} title={it.disabled ? it.why : undefined}
        onClick={(e) => { e.stopPropagation(); setOpen(null); it.onClick(); }}>{it.icon && <Icon n={it.icon} />}{it.label}</button>)}</div>)}</span>;
}

/* ---------- form controls ---------- */
const Field = ({ label, req, help, error, id, children }: { label?: string | undefined; req?: boolean | undefined; help?: string | undefined; error?: string | null | undefined; id: string; children: ReactNode }) =>
  <div className="field">{label && <label className="flabel" htmlFor={id}>{label}{req && <span className="req">*</span>}</label>}{children}
    {error ? <span className="help err">{error}</span> : help ? <span className="help">{help}</span> : null}</div>;
export function TextArea({ label, value, onChange, placeholder, id }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; id?: string }) {
  const auto = useId(); const fid = id ?? auto;
  return <Field label={label} id={fid}><textarea className="input" id={fid} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} /></Field>;
}
export function Select({ label, req, help, error, value, onChange, options, id, disabled, width }: { label?: string; req?: boolean; help?: string; error?: string | null; value: string; onChange: (v: string) => void;
  options: Array<[string, string]>; id?: string; disabled?: boolean; width?: number | string }) {
  const auto = useId(); const fid = id ?? auto;
  return <div style={width ? { width, maxWidth: "100%" } : undefined}><Field label={label} req={req} help={help} error={error} id={fid}>
    <div className={cx("input", error && "err", disabled && "dis")}><select id={fid} value={value} disabled={disabled} onChange={(e) => onChange(e.target.value)}>
      {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select><Icon n="caret-down" /></div></Field></div>;
}
export function Search({ value, onChange, placeholder, id, width }: { value: string; onChange: (v: string) => void; placeholder: string; id?: string; width?: number | string }) {
  return <label className="search" style={width ? { width, maxWidth: "100%" } : undefined}><Icon n="magnifying-glass" /><input id={id} value={value} placeholder={placeholder} aria-label={placeholder} onChange={(e) => onChange(e.target.value)} />
    {value && <button type="button" aria-label="Clear search" onClick={() => onChange("")}><Icon n="x" /></button>}</label>;
}
export function Check({ on, onChange, label, id }: { on: boolean; onChange: (v: boolean) => void; label: string; id?: string }) {
  return <label className={cx("cb", on && "on")} id={id} onClick={(e) => { e.preventDefault(); onChange(!on); }}>
    <span className="box" role="checkbox" aria-checked={on} tabIndex={0} onKeyDown={(e) => { if (e.key === " ") { e.preventDefault(); onChange(!on); } }}>{on && <Icon n="check" />}</span>{label}</label>;
}
export function Radio({ on, onChange, label }: { on: boolean; onChange: () => void; label: string }) {
  return <label className={cx("rd", on && "on")} onClick={(e) => { e.preventDefault(); onChange(); }}><span className="circ" role="radio" aria-checked={on} tabIndex={0} onKeyDown={(e) => { if (e.key === " ") { e.preventDefault(); onChange(); } }} />{label}</label>;
}
export function Switch({ on, onChange, label, id }: { on: boolean; onChange: (v: boolean) => void; label: string; id?: string }) {
  return <label className={cx("sw", on && "on")} id={id} onClick={(e) => { e.preventDefault(); onChange(!on); }}><span className="tr" role="switch" aria-checked={on} tabIndex={0} onKeyDown={(e) => { if (e.key === " ") { e.preventDefault(); onChange(!on); } }} />{label}</label>;
}
export function DropZone({ text = "Drop the file here, or click to browse", hint = "PDF, up to 10 MB", accept, onFile, id }: { text?: string; hint?: string; accept?: string; onFile: (f: File) => void; id?: string }) {
  const ref = useRef<HTMLInputElement>(null); const [over, setOver] = useState(false);
  return <div className={cx("dz", over && "over")} onClick={() => ref.current?.click()} onDragOver={(e) => { e.preventDefault(); setOver(true); }} onDragLeave={() => setOver(false)}
    onDrop={(e) => { e.preventDefault(); setOver(false); const f = e.dataTransfer.files[0]; if (f) onFile(f); }}>
    <Icon n="upload-simple" s={20} /><b>{text}</b><span className="t-cap">{hint}</span>
    <input ref={ref} id={id} type="file" accept={accept} hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = ""; }} /></div>;
}
export function Confirm({ title, text, ok = "Confirm", danger, busy, onOk, onClose }: { title: string; text?: string; ok?: string; danger?: boolean; busy?: boolean; onOk: () => void; onClose: () => void }) {
  return <Dialog title={title} size="sm" onClose={onClose} footer={<><Button onClick={onClose}>Cancel</Button><Button type="primary" tone={danger ? "danger" : undefined} disabled={!!busy} onClick={onOk}>{ok}</Button></>}>
    {text && <p className="t-sm c-sec" style={{ margin: 0 }}>{text}</p>}</Dialog>;
}
export const fileSize = (b: number) => (b >= 1048576 ? (b / 1048576).toFixed(1) + " MB" : Math.max(1, Math.round(b / 1024)) + " KB");
export const fmtDate = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Makassar" });

/* ---------- page tabs (list switches, owner rule) ---------- */
export function Tabs<T extends string>({ items, value, onChange }: { items: Array<{ id: T; label: string; count?: number }>; value: T; onChange: (v: T) => void }) {
  return <div className="tabs" role="tablist">{items.map((t) => <button key={t.id} type="button" role="tab" aria-selected={value === t.id} className={cx("tab", value === t.id && "on")} onClick={() => onChange(t.id)}>
    <span className="r">{t.label}{t.count !== undefined && <span className={cx("cpill", value === t.id && "primary")}>{t.count}</span>}</span><span className="u" /></button>)}</div>;
}
/** "Today 08:02", "Yesterday", or "4 Nov 2026", in the lab's time zone. */
export function fmtWhen(iso: string | null | undefined) {
  if (!iso) return "Never";
  const d = new Date(iso), tz = "Asia/Makassar";
  const day = (x: Date) => x.toLocaleDateString("en-CA", { timeZone: tz });
  if (day(d) === day(new Date())) return "Today " + d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: tz });
  return fmtDate(iso);
}
