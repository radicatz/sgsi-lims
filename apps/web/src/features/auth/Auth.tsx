// App screens: Sign in, Forgot password, Set password (App_Screen_Plan.md sections 3.1 to 3.4; frames 00-App-04 to 06 at three sizes;
// Frames_Coverage_Check_Nov26.md, slice D). Desktop is a split page with the brand panel, tablet a navy page with the white logo,
// phone the shell colour with the colour logo; the card and its states are the same on all three.
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { passwordProblem, ROLE_LABEL, type RoleCode } from "@sgsi/shared";
import { api, ApiError, type Session } from "../../app/api";
import { lastSignIn, useBreakpoint, useSession } from "../../app/session";
import { PasswordRules, toRules, useAuthRules } from "../common/PasswordRules";
import { Alert, Button, Dialog, Icon, PasswordField, TextField, cx, toast } from "../../components";

/** The Privacy link (UU PDP No. 27/2022; decision A-1): what the system keeps about people and why. The lab confirms the wording before go-live. */
function PrivacyDialog({ phone, onClose }: { phone: boolean; onClose: () => void }) {
  return <Dialog title="Privacy" size="md" phone={phone} onClose={onClose} footer={<Button type="primary" onClick={onClose}>Close</Button>}>
    <div className="col g12 t-sm" id="privacy-text">
      <p style={{ margin: 0 }}>SGSI LIMS keeps the personal data it needs to run the laboratory's work:</p>
      <ul style={{ margin: 0, paddingLeft: 20 }} className="col g4">
        <li>for staff: name, work email, title, phone, roles, and the signature and stamp used on certificates;</li>
        <li>for client contacts: name, email and phone, to send job order documents and certificates;</li>
        <li>a record of sign-ins and of every change (the audit log), kept without expiry as ISO/IEC 17025 records.</li>
      </ul>
      <p style={{ margin: 0 }}>The data is processed under Indonesia's Personal Data Protection Law (UU PDP No. 27/2022) and is used only for the laboratory's work.</p>
      <p style={{ margin: 0 }}>To see, correct or delete your data, ask the laboratory's Superadmin.</p>
    </div>
  </Dialog>;
}

function AuthPage({ children }: { children: ReactNode }) {
  const bp = useBreakpoint();
  const [privacy, setPrivacy] = useState(false);
  const footer = <div className="afoot"><span className="aver">Version 1.0</span><button type="button" className="aprivacy" id="privacy-link" onClick={() => setPrivacy(true)}>Privacy</button></div>;
  return <div className={cx("auth", `auth-${bp}`, bp === "phone" && "touch")}>
    {bp === "desktop" && <aside className="abrandpanel" aria-label="SGSI LIMS">
      <img className="alogo" src="/sgsi-logo-white.svg" alt="Sentra Geo Survey Indonesia" width={224} />
      <div className="col g12"><p className="t-display atag">Laboratory information system for coal analysis</p><p className="t-body" style={{ margin: 0 }}>Job orders, batches, results and certificates in one place.</p></div>
      <span className="t-sm">PT Sentra Geo Survey Indonesia</span>
      <span className="amark" aria-hidden="true" />
    </aside>}
    <main className="aside">
      {bp === "tablet" && <img className="alogo" src="/sgsi-logo-white.svg" alt="Sentra Geo Survey Indonesia" width={196} />}
      {bp === "phone" && <img className="alogo" src="/sgsi-logo-primary.svg" alt="Sentra Geo Survey Indonesia" width={168} />}
      {children}
      {footer}
    </main>
    {privacy && <PrivacyDialog phone={bp === "phone"} onClose={() => setPrivacy(false)} />}
  </div>;
}

function Card({ title, sub, children, onSubmit }: { title: string; sub?: ReactNode; children: ReactNode; onSubmit?: (e: FormEvent) => void }) {
  const body = <><div className="col g6"><h1 className="t-h1" style={{ margin: 0 }}>{title}</h1>{sub && <p className="t-sm c-sec" style={{ margin: 0 }}>{sub}</p>}</div>{children}</>;
  return onSubmit ? <form className="acard" onSubmit={onSubmit} noValidate>{body}</form> : <div className="acard">{body}</div>;
}
const useSize = () => (useBreakpoint() === "phone" ? "touch" : "lg");

export function SignIn() {
  const { signIn, signedOut } = useSession();
  const size = useSize();
  const state = useLocation().state as { email?: string } | null;
  const last = signedOut === "timeout" || signedOut === "expired" ? lastSignIn() : null;
  const [email, setEmail] = useState(state?.email ?? last?.email ?? ""), [pw, setPw] = useState("");
  const [err, setErr] = useState<ApiError | null>(null), [busy, setBusy] = useState(false);
  // Locked: Sign in stays off until the lock time, then the alert goes (App plan 3.1, Locked)
  const until = err?.code === "locked" ? (err.data as { until?: string } | undefined)?.until ?? null : null;
  const [now, setNow] = useState(Date.now());
  useEffect(() => { if (!until) return; const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, [until]);
  const locked = !!until && new Date(until).getTime() > now;
  useEffect(() => { if (until && !locked) setErr(null); }, [until, locked]);
  const submit = async (e: FormEvent) => {
    e.preventDefault(); if (locked) return;
    setBusy(true); setErr(null);
    try { await signIn(email.trim(), pw); }
    catch (x) { setErr(x instanceof ApiError ? x : new ApiError(0, "network", "Cannot reach the server", "Check the connection and try again.")); setPw(""); }
    finally { setBusy(false); }
  };
  const alert = err ? <Alert tone={err.code === "locked" ? "warning" : "error"} title={err.title ?? err.text} text={err.title ? err.text : undefined}
      action={err.code === "locked" ? <Link className="linkbtn" id="si-reset" to={`/forgot?email=${encodeURIComponent(email.trim())}`}>Reset password</Link> : undefined} />
    : signedOut === "timeout" ? <Alert tone="info" title="You were signed out" text={`${last?.minutes ?? 30} minutes without activity. Sign in to continue.`} />
    : signedOut === "expired" ? <Alert tone="info" title="Your session has ended" text="Sign in again to continue." />
    : signedOut === "manual" ? <Alert tone="info" title="You signed out." /> : null;
  return <AuthPage><Card title="Sign in" sub="Coal analysis, from job order to certificate." onSubmit={submit}>
    {alert}
    <TextField id="si-email" label="Email" type="email" autoComplete="username" value={email} onChange={setEmail} placeholder="name@sgsi.co.id" />
    <PasswordField id="si-pw" label="Password" value={pw} onChange={setPw} placeholder="Enter your password" disabled={locked} />
    <div className="row end"><Link className="linkbtn" id="si-forgot" to={email.trim() ? `/forgot?email=${encodeURIComponent(email.trim())}` : "/forgot"}>Forgot password?</Link></div>
    <Button type="primary" size={size} block submit disabled={busy || locked || !email.trim() || !pw} id="si-submit">{busy ? "Signing in…" : "Sign in"}</Button>
  </Card></AuthPage>;
}

const RESEND = 60; // seconds before Resend link works again (App plan 3.3; decision A-2)
export function Forgot() {
  const size = useSize();
  const rules = useAuthRules();
  const [email, setEmail] = useState(() => new URLSearchParams(window.location.search).get("email") ?? "");
  const [sent, setSent] = useState(false), [left, setLeft] = useState(RESEND), [busy, setBusy] = useState(false);
  useEffect(() => { if (!sent) return; const t = setInterval(() => setLeft((s) => Math.max(0, s - 1)), 1000); return () => clearInterval(t); }, [sent]);
  const send = async (e?: FormEvent) => {
    e?.preventDefault(); if (!email.trim()) return;
    setBusy(true); await api("/auth/forgot", { method: "POST", json: { email: email.trim() } }).catch(() => undefined); setBusy(false);
    setSent(true); setLeft(RESEND);
  };
  const mins = rules.data?.resetLinkMinutes ?? 60;
  if (sent) return <AuthPage><Card title="Check your email" sub={`If an account uses ${email.trim()}, a link is on its way. It works for ${mins} minutes.`}>
    <div className="row" style={{ justifyContent: "center" }}><span className="aicon"><Icon n="envelope-simple" s={20} /></span></div>
    <Button size={size} block id="fp-resend" disabled={left > 0 || busy} onClick={() => send()}>{left > 0 ? `Resend link in ${Math.floor(left / 60)}:${String(left % 60).padStart(2, "0")}` : "Resend link"}</Button>
    <Link className={cx("btn ghost block", size)} to="/login" state={{ email: email.trim() }}>Back to sign in</Link>
  </Card></AuthPage>;
  return <AuthPage><Card title="Reset your password" sub="Enter the email you sign in with. We send a link to set a new password." onSubmit={send}>
    <TextField id="fp-email" label="Email" type="email" value={email} onChange={setEmail} autoComplete="username" placeholder="name@sgsi.co.id" />
    <Button type="primary" size={size} block submit id="fp-send" disabled={!email.trim() || busy}>Send reset link</Button>
    <Link className={cx("btn ghost block", size)} to="/login">Back to sign in</Link>
  </Card></AuthPage>;
}

interface LinkInfo { email: string; fullName: string | null; invited: boolean; roles: string[]; invitedBy: string | null }

/** Opened from the invite or reset link: Supabase puts the session in the address hash (#access_token=…); `?kind=` says invite or reset, also when the link has expired. */
export function SetPassword() {
  const { adopt } = useSession();
  const nav = useNavigate();
  const size = useSize();
  const rules = useAuthRules();
  const [link] = useState(() => new URLSearchParams(window.location.hash.slice(1)));
  const [kind] = useState(() => new URLSearchParams(window.location.search).get("kind"));
  const token = link.get("access_token"), refreshToken = link.get("refresh_token");
  const info = useQuery({
    queryKey: ["link-info", token], enabled: !!token && !link.get("error_code"), retry: false, staleTime: Infinity,
    queryFn: async () => { const r = await fetch("/api/auth/link-info", { headers: { authorization: `Bearer ${token}` } }); if (!r.ok) throw new Error("expired"); return (await r.json()) as LinkInfo; },
  });
  const [a, setA] = useState(""), [b, setB] = useState(""), [err, setErr] = useState<{ a?: string; b?: string; form?: string }>({}), [busy, setBusy] = useState(false);

  const expired = !!link.get("error_code") || !token || !refreshToken || info.isError;
  if (expired) {
    const invite = kind === "invite";
    return <AuthPage><Card title="This link has expired" sub={invite ? `Invite links work for ${rules.data?.inviteDays ?? 7} days. Ask your Superadmin for a new invite.`
        : `Reset links work for ${rules.data?.resetLinkMinutes ?? 60} minutes. Ask for a new one and use it soon after.`}>
      {!invite && <Link className={cx("btn primary block", size)} id="sp-new-link" to="/forgot">Send a new link</Link>}
      <Link className={cx("btn block", invite ? "primary" : "ghost", size)} to="/login">Back to sign in</Link>
    </Card></AuthPage>;
  }
  if (!info.data) return <AuthPage><div className="acard"><span className="t-sm c-sec">Checking the link…</span></div></AuthPage>;

  const d = info.data, invite = d.invited || kind === "invite";
  const save = async (e: FormEvent) => {
    e.preventDefault();
    const p = rules.data ? passwordProblem(a, toRules(rules.data), d.email) : null;
    const next = { a: !a ? "Enter a new password." : p ?? undefined, b: b !== a ? "The two passwords are not the same." : undefined };
    setErr(next); if (next.a || next.b) return;
    setBusy(true);
    try {
      const r = await fetch("/api/auth/set-password", { method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${token}` }, body: JSON.stringify({ password: a }) });
      if (!r.ok) { const j = await r.json().catch(() => ({})); setErr(j.field === "password" ? { a: j.text } : { form: j.text ?? "The password could not be set." }); return; }
      history.replaceState(null, "", "/set-password");
      // straight in: the sign-in route sends a signed-in person to their start page once their roles have loaded (My work or the Dashboard, App plan 3.2)
      if (invite) { adopt({ accessToken: token!, refreshToken: refreshToken!, expiresAt: null }); nav("/login", { replace: true }); }
      else {
        // the reset link's own session is not kept: the person signs in with the new password (App plan 3.4)
        await fetch("/api/auth/sign-out", { method: "POST", headers: { authorization: `Bearer ${token}` } }).catch(() => undefined);
        toast("Password set. Sign in with your new password.");
        nav("/login", { replace: true, state: { email: d.email } });
      }
    } finally { setBusy(false); }
  };
  const sub = invite ? `${d.invitedBy ? `${d.invitedBy} added you to the lab.` : "You were added to the lab."} Set a password to sign in.` : `For ${d.email}`;
  return <AuthPage><Card title={invite ? "Welcome to SGSI LIMS" : "Set a new password"} sub={sub} onSubmit={save}>
    {invite && <div className="row g8 wrap" id="sp-account"><b className="t-sm c-head">{d.email}</b>{(d.roles as RoleCode[]).map((r) => <span key={r} className="role">{ROLE_LABEL[r] ?? r}</span>)}</div>}
    {err.form && <Alert tone="error" title={err.form} />}
    <PasswordField id="sp-new" label="New password" value={a} onChange={(v) => { setA(v); setErr({}); }} error={err.a ?? null} autoComplete="new-password" placeholder="Enter a new password" />
    <PasswordField id="sp-again" label="Confirm password" value={b} onChange={(v) => { setB(v); setErr({}); }} error={err.b ?? null} autoComplete="new-password" placeholder="Enter it again" />
    <PasswordRules pw={a} email={d.email} />
    <Button type="primary" size={size} block submit id="sp-save" disabled={busy || !a}>{invite ? "Set password and sign in" : "Set password"}</Button>
  </Card></AuthPage>;
}
export type { Session };
