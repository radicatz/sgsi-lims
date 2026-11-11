// Component layer, part of the FigCraft library port (Stack_Decision_Record S-7, S-8): utils.
import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";

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

export const toFrame = (node: ReactNode) => { const host = document.querySelector(".frame"); return host ? createPortal(node, host) : node; };
