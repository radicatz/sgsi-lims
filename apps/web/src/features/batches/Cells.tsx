// Cells shared by the Preparation and Analysis tabs (library: Grid cell, Checklist item): a value field with its states, the checklist under a tab, the
// "n of m saved" text, and the number format. States: Saved (white), Unsaved (amber fill), Warning (amber fill, warning icon), Calculated (muted, ƒ), Locked (muted, lock).
import { useEffect, useState } from "react";
import { Icon, cx } from "../../components";

/** A value as the screens print it: a dot, no thousands space (frames show "8,42" and "5 912"; the app follows the rest of the app, spec 14.4). */
export const num = (v: string | number | null | undefined, decimals?: number) => {
  if (v == null || v === "") return "";
  const n = Number(v);
  return Number.isFinite(n) && decimals != null ? n.toFixed(decimals) : String(v);
};

export type CellState = "saved" | "dirty" | "warn" | "err";
/** An editable value: it keeps its own text while it is typed, and follows the saved value when that changes. */
export function ValueField({ id, value, state, label, onChange, onEnter }: { id?: string; value: string; state: CellState; label: string; onChange: (v: string) => void; onEnter?: () => void }) {
  const [v, setV] = useState(value);
  useEffect(() => setV(value), [value]);
  return (
    <span className={cx("vcell", state)}>
      {state === "warn" && <Icon n="warning" />}
      <input id={id} className="cell" inputMode="decimal" value={v} aria-label={label} onChange={(e) => { setV(e.target.value); onChange(e.target.value); }}
        onKeyDown={(e) => { if (e.key === "Enter") onEnter?.(); }} />
    </span>
  );
}
/** A value that can't change (the batch moved on): muted, with a lock. */
export const LockedValue = ({ value, label }: { value: string; label: string }) => (
  <span className="vcell locked" role="img" aria-label={`${label}, ${value}, locked`}><Icon n="lock-simple" /><span className="t-data-sm">{value}</span></span>
);
/** A value worked out from others (FC, Net CV): muted, ƒ, never typed. */
export const CalcValue = ({ value, label }: { value: string; label: string }) => (
  <span className="vcell calc" aria-label={`${label}, calculated`}><i className="fx" aria-hidden="true">ƒ</i><span className="t-data-sm">{value || ""}</span></span>
);

export interface Check { ok: boolean; text: string; warn?: boolean }
/** "Before you can finish …": a line per condition, ticked when it holds; a warning line has a warning icon and never blocks. */
export function Checklist({ title, items }: { title: string; items: Check[] }) {
  if (!items.length) return null;
  return (
    <div className="col g6" aria-label={title}>
      <b className="t-sm w6 c-head">{title}</b>
      {items.map((c) => (
        <span key={c.text} className={cx("row g8 t-sm", c.ok ? "c-for" : "c-sec")} style={{ flexWrap: "nowrap", alignItems: "flex-start" }}>
          <span className={c.warn ? "c-warn" : c.ok ? "c-ok" : "c-mut"}><Icon n={c.warn ? "warning" : c.ok ? "check-circle" : "circle"} /></span>
          {c.text}
        </span>
      ))}
    </div>
  );
}
