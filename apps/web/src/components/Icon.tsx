// Icons: the official Phosphor icon font (@phosphor-icons/web, Regular weight), the same set as the FigCraft library.
// Any glyph name from the design works as is (kebab-case, e.g. "check-square-offset"); see https://phosphoricons.com.
import "@phosphor-icons/web/regular";

export function Icon({ n, s = 14, className }: { n: string; s?: 14 | 16 | 20 | 24 | 32; className?: string }) {
  return <i className={["ph", `ph-${n}`, s !== 14 ? `i${s}` : "", className].filter(Boolean).join(" ")} aria-hidden="true" />;
}
