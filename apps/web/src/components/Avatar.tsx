// Component layer, part of the FigCraft library port (Stack_Decision_Record S-7, S-8): Avatar.
import { cx } from "./utils";

/* ---------- labels ---------- */
export function Avatar({ name, size = 32, logo }: { name: string; size?: 24 | 28 | 32 | 40 | 64 | 100; logo?: string | null }) {
  const ini = name.replace(/^(Ir\.|Dr\.|PT|CV)\s+/, "").split(/[\s,]+/).filter((w) => /^[A-Z]/.test(w)).slice(0, 2).map((w) => w[0]).join("");
  return <span className={cx("av", size !== 32 && `s${size}`, logo && "logo")} title={name} style={logo ? { backgroundImage: `url("${logo}")` } : undefined}>{logo ? "" : ini}</span>;
}
