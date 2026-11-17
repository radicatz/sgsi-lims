// Component layer, part of the FigCraft library port (Stack_Decision_Record S-7, S-8): Button.
import { createContext, useContext, type ReactNode } from "react";
import { Icon } from "./Icon";
import { cx } from "./utils";

/* ---------- actions ---------- */
type BtnType = "primary" | "secondary" | "tertiary" | "ghost";
type BtnSize = "sm" | "md" | "lg" | "touch";

/** The size a Button takes when it has no `size` of its own. A Dialog footer provides "lg" (owner, Nov 12 2026: every action button at the bottom of a dialog is lg). */
export const ButtonSizeContext = createContext<BtnSize>("md");

/**
 * `iconOnly` is the FigCraft Icon button: a circle holding `icon`, named by `label` (read out and shown as the tooltip).
 * It is ghost unless a type is given, keeps size md (32) inside a Dialog footer, sizes sm 28, md 32, lg 36, touch 44,
 * and stops its click from reaching the table row it sits in.
 */
export function Button({ type, size, tone, icon, trail, block, iconOnly, label, title, disabled, why, onClick, children, id, submit }: {
  type?: BtnType; size?: BtnSize; tone?: "danger" | "accent"; icon?: string; trail?: string; block?: boolean;
  iconOnly?: boolean; label?: string; title?: string;
  disabled?: boolean; why?: string; onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void; children?: ReactNode; id?: string; submit?: boolean }) {
  const inherited = useContext(ButtonSizeContext);
  size = size ?? (iconOnly ? "md" : inherited);
  type = type ?? (iconOnly ? "ghost" : "secondary");
  const tip = title ?? (disabled && why ? why : iconOnly ? label : undefined);
  return <button id={id} type={submit ? "submit" : "button"} className={cx("btn", type, size, tone, block && "block", iconOnly && "icon")} aria-label={label} disabled={disabled} title={tip}
    onClick={(e) => { if (iconOnly) e.stopPropagation(); onClick?.(e); }}>
    {iconOnly ? icon && <Icon n={icon} s={size === "touch" ? 20 : 14} /> : <>{icon && <Icon n={icon} />}{children}{trail && <Icon n={trail} />}</>}</button>;
}
