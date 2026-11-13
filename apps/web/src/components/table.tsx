// Component layer, part of the FigCraft library port (Stack_Decision_Record S-7, S-8): table.
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { IconBtn } from "./Button";
import { Icon } from "./Icon";
import { cx, toFrame, useEsc, useOutside } from "./utils";

export interface PagerState { page: number; pages: number; total: number; from: number; to: number; onPage: (n: number) => void }

export function usePaged<T>(rows: T[], size: number, key: string) {
  const [page, setPage] = useState(1);
  useEffect(() => setPage(1), [key]);
  const pages = Math.max(1, Math.ceil(rows.length / size)); const p = Math.min(page, pages);
  const pager: PagerState = { page: p, pages, total: rows.length, from: rows.length ? (p - 1) * size + 1 : 0, to: Math.min(p * size, rows.length), onPage: setPage };
  return { rows: rows.slice((p - 1) * size, p * size), pager };
}

export function Pager({ page, pages, total, from, to, onPage, compact }: PagerState & { compact?: boolean }) {
  if (!total) return null;
  if (compact) return <div className="pager compact">
    <button type="button" className="pg" aria-label="Previous page" disabled={page <= 1} onClick={() => onPage(page - 1)}><Icon n="caret-left" /></button>
    <span className="pos" aria-live="polite">{page} / {pages}</span>
    <button type="button" className="pg" aria-label="Next page" disabled={page >= pages} onClick={() => onPage(page + 1)}><Icon n="caret-right" /></button></div>;
  const nums: number[] = []; for (let i = 1; i <= pages; i++) if (i <= 3 || i === pages || Math.abs(i - page) <= 1) nums.push(i);
  return <div className="pager"><span className="info">Showing {from}–{to} of {total}</span>
    <button type="button" className="pg" aria-label="Previous page" disabled={page <= 1} onClick={() => onPage(page - 1)}><Icon n="caret-left" /></button>
    {nums.map((n) => <button key={n} type="button" className={cx("pg", n === page && "on")} onClick={() => onPage(n)}>{n}</button>)}
    <button type="button" className="pg" aria-label="Next page" disabled={page >= pages} onClick={() => onPage(page + 1)}><Icon n="caret-right" /></button></div>;
}

/* ---------- table ---------- */
export interface Col<T> { h: string; cls?: string; w?: number; fit?: boolean; fill?: boolean; cut?: boolean; render: (r: T, i: number) => ReactNode; sort?: (r: T) => string | number | null }

export interface SortState { h: string; dir: "asc" | "desc" }

/** Click a sortable head: first ascending, then descending, then back to the page's own order. The clicked head shows a caret in the action colour. */
export function useSort(initial?: SortState) {
  const [sort, setSort] = useState<SortState | null>(initial ?? null);
  const onSort = (h: string) => setSort((s) => (!s || s.h !== h ? { h, dir: "asc" } : s.dir === "asc" ? { h, dir: "desc" } : null));
  return { sort, onSort };
}

export function sortRows<T>(rows: T[], cols: Array<Col<T> | false | null | undefined>, sort: SortState | null): T[] {
  const col = sort && (cols.filter(Boolean) as Array<Col<T>>).find((c) => c.h === sort.h);
  if (!col?.sort) return rows;
  const key = col.sort, k = sort!.dir === "asc" ? 1 : -1;
  return [...rows].sort((a, b) => {
    const x = key(a), y = key(b);
    if (x == null && y == null) return 0; if (x == null) return 1; if (y == null) return -1;   // empty values stay last
    return (typeof x === "number" && typeof y === "number" ? x - y : String(x).localeCompare(String(y), "en", { numeric: true, sensitivity: "base" })) * k;
  });
}

/** Column sizing: w = fixed width, fit = hug the content, fill = take the remaining width. */
const colStyle = (c: { w?: number; fit?: boolean; fill?: boolean; cut?: boolean }): React.CSSProperties | undefined =>
  c.w ? { width: c.w, minWidth: c.w, maxWidth: c.w } : c.fit ? { width: "1%", whiteSpace: "nowrap" } : c.fill ? (c.cut ? { width: "100%", maxWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } : { width: "100%" }) : undefined;
export function Table<T>({ cols, rows, onRow, keyOf, empty, sort, onSort }: { cols: Array<Col<T> | false | null | undefined>; rows: T[]; onRow?: (r: T) => void; keyOf: (r: T) => string; empty?: ReactNode;
  sort?: SortState | null; onSort?: (h: string) => void }) {
  const cs = cols.filter(Boolean) as Array<Col<T>>;
  return <div className="tblwrap"><table className="tbl"><thead><tr>{cs.map((c, i) => {
    const on = !!c.sort && sort?.h === c.h;
    return <th key={i} style={colStyle(c)} className={cx(c.cls, c.sort && "sortable", on && "sorted")} aria-sort={on ? (sort!.dir === "asc" ? "ascending" : "descending") : undefined}>
      {c.sort && onSort ? <button type="button" className="sorth" onClick={() => onSort(c.h)}>{c.h}<Icon n={on ? (sort!.dir === "asc" ? "caret-up" : "caret-down") : "arrows-down-up"} /></button> : c.h}</th>;
  })}</tr></thead>
    <tbody>{rows.map((r, ri) => <tr key={keyOf(r)} className={cx(onRow && "click")} onClick={onRow ? () => onRow(r) : undefined}>{cs.map((c, i) => <td key={i} className={c.cls} style={colStyle(c)}>{c.render(r, ri)}</td>)}</tr>)}</tbody></table>
    {!rows.length && empty}</div>;
}

/* ---------- row actions: icon-only ghost buttons, one per action the row allows (the Actions column) ---------- */
export interface RowAction { label: string; icon: string; why?: string; onClick: () => void; show?: boolean; disabled?: boolean }

export function RowActions({ items }: { items: RowAction[] }) {
  return <span className="acts" role="group" aria-label="Actions">{items.filter((a) => a.show !== false).map((a) => <IconBtn key={a.label} n={a.icon} label={a.label} title={a.disabled ? a.why : undefined} disabled={!!a.disabled} onClick={a.onClick} />)}</span>;
}

/* ---------- row menu, anchored under its button inside .frame ---------- */
export interface MenuItem { label: string; icon?: string; onClick: () => void; danger?: boolean; disabled?: boolean; why?: string }

export function Menu({ items, label = "More actions", size = 32, vertical }: { items: Array<MenuItem | false | null | undefined>; label?: string; size?: 32 | 36; vertical?: boolean }) {
  /* top and right place the menu under its button, right edges together; `left` is the button's left edge, and `flip` (set after the menu is measured) places the menu from its left edge when the right-aligned one would leave the screen */
  const [open, setOpen] = useState<{ top: number; right: number; left: number; flip?: number } | null>(null);
  const ref = useRef<HTMLSpanElement>(null), menuRef = useRef<HTMLDivElement>(null);
  useOutside(ref, () => setOpen(null), !!open); useEsc(() => setOpen(null), !!open);
  useLayoutEffect(() => {
    if (!open || open.flip !== undefined || !menuRef.current) return;
    const fr = document.querySelector(".frame")!.getBoundingClientRect(), m = menuRef.current.getBoundingClientRect();
    if (m.left < fr.left + 8) setOpen({ ...open, flip: Math.min(Math.max(8, open.left), Math.max(8, fr.width - 8 - m.width)) });
  }, [open]);
  const list = items.filter(Boolean) as MenuItem[];
  if (!list.length) return null;
  const toggle = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation(); if (open) return setOpen(null);
    const frame = document.querySelector(".frame")!, fr = frame.getBoundingClientRect(), r = e.currentTarget.getBoundingClientRect();
    const h = list.length * 38 + 14; const below = r.bottom - fr.top + 4;
    setOpen({ right: Math.max(8, fr.right - r.right), left: r.left - fr.left, top: below + h > fr.height - 8 ? Math.max(8, r.top - fr.top - h - 4) : below });
  };
  return <span ref={ref} style={{ display: "inline-flex" }}><IconBtn n={vertical ? "dots-three-vertical" : "dots-three"} label={label} size={size} onClick={toggle} />
    {open && toFrame(<div ref={menuRef} className="menu" role="menu" style={open.flip !== undefined ? { top: open.top, left: open.flip } : { top: open.top, right: open.right }} onMouseDown={(e) => e.stopPropagation()}>
      {list.map((it) => <button key={it.label} type="button" role="menuitem" className={cx("mi", it.danger && "danger")} disabled={!!it.disabled} title={it.disabled ? it.why : undefined}
        onClick={(e) => { e.stopPropagation(); setOpen(null); it.onClick(); }}>{it.icon && <Icon n={it.icon} />}{it.label}</button>)}</div>)}</span>;
}
