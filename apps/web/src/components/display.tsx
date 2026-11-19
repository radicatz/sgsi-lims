// Component layer, part of the FigCraft library port (Stack_Decision_Record S-7, S-8): display.
import { useLayoutEffect, useRef, type ReactNode } from "react";
import { Icon } from "./Icon";
import { cx } from "./utils";

// Data-screen components ported from the prototype (.context/prototype/src/ui.js): tables, paging, chips, menus, form controls.

export type Tone = "grey" | "green" | "red" | "amber" | "blue" | "outline" | "orange" | "muted" | "purple" | "navy";

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

/* ---------- page tabs (list switches, owner rule) ---------- */
/** The job order's life as steps (Stepper in the library): a mark per step, its name and a short note. */
/** On a narrow screen the steps keep their width and the row scrolls sideways (frame Phone 04-02-01); it opens with the current step in the middle. */
export function Stepper({ steps }: { steps: Array<{ name: string; note?: string; state: "done" | "cur" | "up" }> }) {
  const ref = useRef<HTMLDivElement>(null), cur = steps.find((s) => s.state === "cur")?.name ?? steps.filter((s) => s.state === "done").pop()?.name;
  useLayoutEffect(() => {
    const el = ref.current, step = el?.querySelector<HTMLElement>(".step.cur") ?? el?.querySelector<HTMLElement>(".step.done:last-of-type");
    if (!el || !step || el.scrollWidth <= el.clientWidth) return;
    el.scrollLeft = step.offsetLeft - (el.clientWidth - step.offsetWidth) / 2;   // instant: only this row moves, never the page
  }, [cur]);
  return <div ref={ref} className="stepper" role="list">{steps.map((s) => <div key={s.name} role="listitem" className={cx("step", s.state)} aria-current={s.state === "cur" ? "step" : undefined}>
    <span className="mk">{s.state === "done" && <Icon n="check" s={14} />}</span><b>{s.name}</b>{s.note && <small>{s.note}</small>}</div>)}</div>;
}

export function Tabs<T extends string>({ items, value, onChange }: { items: Array<{ id: T; label: string; count?: number }>; value: T; onChange: (v: T) => void }) {
  return <div className="tabs" role="tablist">{items.map((t) => <button key={t.id} type="button" role="tab" aria-selected={value === t.id} className={cx("tab", value === t.id && "on")} onClick={() => onChange(t.id)}>
    <span className="r">{t.label}{t.count !== undefined && <span className={cx("cpill", value === t.id && "primary")}>{t.count}</span>}</span><span className="u" /></button>)}</div>;
}
