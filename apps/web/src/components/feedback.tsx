// Component layer, part of the FigCraft library port (Stack_Decision_Record S-7, S-8): feedback.
import { useEffect, useState, type ReactNode } from "react";
import { Icon } from "./Icon";
import { cx } from "./utils";

export function Alert({ tone = "info", title, text, action }: { tone?: "error" | "warning" | "info" | "success"; title: string; text?: ReactNode; action?: ReactNode }) {
  const ic = { error: "warning-circle", warning: "warning", info: "info", success: "check-circle" }[tone];
  return <div className={`alert al-${tone}`} role={tone === "error" ? "alert" : "status"}><Icon n={ic} /><div className="grow"><b>{title}</b>{text && <span>{text}</span>}</div>{action}</div>;
}

export function Empty({ icon = "question", title, text, action }: { icon?: string; title: string; text?: string; action?: ReactNode }) {
  return <div className="empty"><span className="ic"><Icon n={icon} s={24} /></span><h3 className="t-h3">{title}</h3>{text && <p>{text}</p>}{action}</div>;
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
