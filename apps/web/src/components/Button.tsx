// Component layer, part of the FigCraft library port (Stack_Decision_Record S-7, S-8): Button.
import { type ReactNode } from "react";
import { Icon } from "./Icon";
import { cx } from "./utils";

/* ---------- actions ---------- */
type BtnType = "primary" | "secondary" | "tertiary" | "ghost";

export function Button({ type = "secondary", size = "md", tone, icon, trail, block, disabled, why, onClick, children, id, submit }: {
  type?: BtnType; size?: "sm" | "md" | "lg" | "touch"; tone?: "danger" | "accent"; icon?: string; trail?: string; block?: boolean;
  disabled?: boolean; why?: string; onClick?: () => void; children: ReactNode; id?: string; submit?: boolean }) {
  return <button id={id} type={submit ? "submit" : "button"} className={cx("btn", type, size, tone, block && "block")} disabled={disabled} title={disabled ? why : undefined} onClick={onClick}>
    {icon && <Icon n={icon} />}{children}{trail && <Icon n={trail} />}</button>;
}

export function IconBtn({ n, label, title, type, size = 32, onClick, disabled }: { n: string; label: string; title?: string; type?: "secondary" | "tertiary" | "primary"; size?: 28 | 32 | 36 | 44; onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void; disabled?: boolean }) {
  return <button type="button" className={cx("ib", type, size !== 32 && `s${size}`)} aria-label={label} title={title ?? label} disabled={disabled} onClick={(e) => { e.stopPropagation(); onClick?.(e); }}>
    <Icon n={n} s={size === 44 ? 20 : 14} /></button>;
}
