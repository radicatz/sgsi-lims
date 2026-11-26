// Who is signed in, sign-in and sign-out, the idle sign-out (App screens: Session timeout) and the breakpoint.
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { Me } from "@sgsi/shared";
import { api, loadSession, saveSession, setOnExpired, type Session } from "./api";
import { Button, Dialog } from "../components";

/** Why the person is on the sign-in page: the idle timer, a session that could not be refreshed, or their own Sign out (App plan 3.1 and 4). */
export type SignedOutReason = "timeout" | "expired" | "manual" | null;
const LAST = "sgsi.lastSignIn";
/** The email and the idle minutes of the person the timer signed out, so the sign-in page can pre-fill the email and say how long (App plan 3.1, Signed out). */
export const lastSignIn = (): { email: string; minutes: number } | null => { try { return JSON.parse(sessionStorage.getItem(LAST) ?? "null"); } catch { return null; } };
interface Ctx {
  me: Me | null; loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: (reason?: SignedOutReason) => Promise<void>;
  adopt: (s: Session) => void;
  signedOut: SignedOutReason; can: (...p: string[]) => boolean;
}
const SessionCtx = createContext<Ctx | null>(null);
export const useSession = () => useContext(SessionCtx)!;

export function SessionProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient();
  const [has, setHas] = useState(() => !!loadSession());
  const [signedOut, setSignedOut] = useState<SignedOutReason>(null);
  const meQ = useQuery({ queryKey: ["me"], queryFn: () => api<Me>("/me"), enabled: has, staleTime: 60_000, refetchInterval: 30_000 });

  const clear = useCallback((reason: SignedOutReason) => {
    const was = qc.getQueryData<Me>(["me"]);
    try {
      if (was && (reason === "timeout" || reason === "expired")) sessionStorage.setItem(LAST, JSON.stringify({ email: was.email, minutes: was.settings.idleSignOutMinutes }));
      else sessionStorage.removeItem(LAST);
    } catch { /* storage blocked */ }
    saveSession(null); setHas(false); setSignedOut(reason); qc.clear();
  }, [qc]);
  useEffect(() => setOnExpired(() => clear("expired")), [clear]);

  const adopt = (s: Session) => { saveSession(s); setSignedOut(null); setHas(true); qc.invalidateQueries({ queryKey: ["me"] }); };
  const signIn = async (email: string, password: string) => adopt(await api<Session>("/auth/sign-in", { method: "POST", json: { email, password } }));
  const signOut = async (reason: SignedOutReason = "manual") => { await api("/auth/sign-out", { method: "POST" }).catch(() => undefined); clear(reason); };
  const me = has ? meQ.data ?? null : null;
  const can = (...p: string[]) => !!me && p.some((x) => me.permissions.includes(x));

  return <SessionCtx.Provider value={{ me, loading: has && meQ.isLoading, signIn, signOut, adopt, signedOut, can }}>
    {children}{me && <IdleTimer minutes={me.settings.idleSignOutMinutes} warn={me.settings.warnBeforeSeconds} onTimeout={() => signOut("timeout")} />}
  </SessionCtx.Provider>;
}

/** "Still there?" before the idle sign-out; any activity resets the clock (Configuration, Security). */
function IdleTimer({ minutes, warn, onTimeout }: { minutes: number; warn: number; onTimeout: () => void }) {
  const last = useRef(Date.now());
  const [left, setLeft] = useState<number | null>(null);
  useEffect(() => {
    const bump = () => { if (left === null) last.current = Date.now(); };
    const evs = ["mousedown", "keydown", "touchstart", "scroll"];
    evs.forEach((e) => window.addEventListener(e, bump, { passive: true }));
    const t = setInterval(() => {
      const idle = (Date.now() - last.current) / 1000, limit = minutes * 60;
      if (idle >= limit) onTimeout();
      else if (idle >= limit - warn) setLeft(Math.ceil(limit - idle));
    }, 1000);
    return () => { evs.forEach((e) => window.removeEventListener(e, bump)); clearInterval(t); };
  }, [minutes, warn, left]);
  if (left === null) return null;
  const stay = () => { last.current = Date.now(); setLeft(null); };
  return <Dialog title="Still there?" size="sm" onClose={stay} footer={<><Button onClick={onTimeout}>Sign out</Button><Button type="primary" onClick={stay}>Stay signed in</Button></>}>
    <p className="t-sm c-sec" style={{ margin: 0 }}>You will be signed out in <b className="c-head">{left} seconds</b> to keep the lab's data safe.</p></Dialog>;
}

export type Breakpoint = "desktop" | "tablet" | "phone";
export function useBreakpoint(): Breakpoint {
  const get = () => (window.innerWidth >= 1200 ? "desktop" : window.innerWidth >= 700 ? "tablet" : "phone");
  const [bp, setBp] = useState<Breakpoint>(get);
  useEffect(() => { const h = () => setBp(get()); window.addEventListener("resize", h); return () => window.removeEventListener("resize", h); }, []);
  return bp;
}
