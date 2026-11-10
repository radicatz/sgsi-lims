// App screens: Sign in, Forgot password, Set password (App_Screen_Plan.md sections 3.1 to 3.4).
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Link, useNavigate } from "react-router";
import { api, ApiError, type Session } from "../app/api";
import { useSession } from "../app/session";
import { Alert, Button, PasswordField, TextField } from "../ui";

function AuthFrame({ children }: { children: ReactNode }) {
  return <div className="auth"><div className="acard">
    <div className="abrand"><span className="logo" /><div><div className="t-h2">SGSI LIMS</div><div className="t-sm c-sec">Laboratory information system for coal analysis</div></div></div>
    {children}</div><div className="row g12 t-cap c-mut"><span>Version 1.0</span><span>Privacy (UU PDP No. 27/2022)</span></div></div>;
}

export function SignIn() {
  const { signIn, signedOut } = useSession();
  const [email, setEmail] = useState(""), [pw, setPw] = useState(""), [err, setErr] = useState<ApiError | null>(null), [busy, setBusy] = useState(false);
  const submit = async (e: FormEvent) => {
    e.preventDefault(); setBusy(true); setErr(null);
    try { await signIn(email, pw); } catch (x) { setErr(x instanceof ApiError ? x : new ApiError(0, "network", "Cannot reach the server", "Check the connection and try again.")); }
    finally { setBusy(false); }
  };
  return <AuthFrame><form className="col g16" onSubmit={submit} noValidate>
    <h1 className="t-h3">Sign in</h1>
    {err ? <Alert tone="error" title={err.title ?? err.text} text={err.title ? err.text : undefined} action={err.code === "locked" ? <Link className="linkbtn" to="/forgot">Reset</Link> : undefined} />
      : signedOut === "timeout" ? <Alert tone="info" title="You were signed out" text="Too long without activity. Sign in to continue." />
      : signedOut === "expired" ? <Alert tone="info" title="Your session has ended" text="Sign in again to continue." /> : null}
    <TextField id="si-email" label="Email" type="email" autoComplete="username" value={email} onChange={setEmail} placeholder="name@sgsi.co.id" />
    <div className="col g6"><PasswordField id="si-pw" label="Password" value={pw} onChange={setPw} placeholder="Your password" />
      <div className="row end"><Link className="linkbtn" to="/forgot">Forgot password?</Link></div></div>
    <Button type="primary" size="lg" block submit disabled={busy || !email || !pw} id="si-submit">{busy ? "Signing in…" : "Sign in"}</Button>
  </form></AuthFrame>;
}

export function Forgot() {
  const [email, setEmail] = useState(""), [sent, setSent] = useState(false), [left, setLeft] = useState(42);
  useEffect(() => { if (!sent) return; const t = setInterval(() => setLeft((s) => Math.max(0, s - 1)), 1000); return () => clearInterval(t); }, [sent]);
  const send = async (e?: FormEvent) => { e?.preventDefault(); await api("/auth/forgot", { method: "POST", json: { email } }).catch(() => undefined); setSent(true); setLeft(42); };
  return <AuthFrame>{sent
    ? <div className="col g16"><h1 className="t-h3">Check your email</h1><p className="t-sm c-sec" style={{ margin: 0 }}>If {email} has an account, a reset link is on its way.</p>
        <Button size="lg" block disabled={left > 0} onClick={() => send()}>{left > 0 ? `Resend link in 0:${String(left).padStart(2, "0")}` : "Resend link"}</Button>
        <Link className="btn ghost lg block" to="/login">Back to sign in</Link></div>
    : <form className="col g16" onSubmit={send}><h1 className="t-h3">Reset your password</h1><p className="t-sm c-sec" style={{ margin: 0 }}>Enter your work email. We send a link to set a new password.</p>
        <TextField label="Email" type="email" value={email} onChange={setEmail} autoComplete="username" />
        <Button type="primary" size="lg" block submit disabled={!email}>Send reset link</Button><Link className="btn ghost lg block" to="/login">Back to sign in</Link></form>}</AuthFrame>;
}

/** Opened from the invite or reset email: Supabase puts the session in the address hash (#access_token=…&type=invite). */
export function SetPassword() {
  const { adopt } = useSession();
  const nav = useNavigate();
  const [link] = useState(() => new URLSearchParams(window.location.hash.slice(1)));
  const [a, setA] = useState(""), [b, setB] = useState(""), [err, setErr] = useState<string | null>(null), [busy, setBusy] = useState(false);
  const invite = link.get("type") === "invite";
  const token = link.get("access_token"), refreshToken = link.get("refresh_token");
  if (link.get("error_code") || !token || !refreshToken)
    return <AuthFrame><div className="col g16"><h1 className="t-h3">This link has expired</h1><p className="t-sm c-sec" style={{ margin: 0 }}>Links work for a limited time. Ask for a new one.</p>
      <Link className="btn primary lg block" to="/forgot">Send a new link</Link><Link className="btn ghost lg block" to="/login">Back to sign in</Link></div></AuthFrame>;
  const save = async (e: FormEvent) => {
    e.preventDefault(); setErr(null);
    if (a !== b) return setErr("The two passwords are not the same.");
    setBusy(true);
    try {
      const r = await fetch("/api/auth/set-password", { method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${token}` }, body: JSON.stringify({ password: a }) });
      if (!r.ok) { const j = await r.json().catch(() => ({})); throw new Error(j.text ?? "The password could not be set."); }
      history.replaceState(null, "", "/set-password");
      if (invite) { adopt({ accessToken: token, refreshToken, expiresAt: null }); nav("/"); } else nav("/login");
    } catch (x) { setErr((x as Error).message); } finally { setBusy(false); }
  };
  return <AuthFrame><form className="col g16" onSubmit={save}>
    <h1 className="t-h3">{invite ? "Welcome to SGSI LIMS" : "Set a new password"}</h1>
    <PasswordField label="New password" value={a} onChange={setA} autoComplete="new-password" error={err} />
    <PasswordField label="Confirm password" value={b} onChange={setB} autoComplete="new-password" />
    <Button type="primary" size="lg" block submit disabled={busy || !a}>{invite ? "Set password and sign in" : "Set password"}</Button></form></AuthFrame>;
}
export type { Session };
