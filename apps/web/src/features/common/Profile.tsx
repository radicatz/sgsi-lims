// Profile (Phase 5, slice C3; frames 00-App-09-Profile-01 to 05, App_Screen_Plan.md section 6, Phase5_Build_Design.md 12.3): the header, Personal, Password with its
// Change password dialog, Preferences, Notifications (one switch per event that reaches the person's roles), and the Signature and Lab stamp cards.
import { useEffect, useState } from "react";
import { useLocation } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { navFor, passwordProblem, ROLE_LABEL, startPath, type RoleCode } from "@sgsi/shared";
import { api, ApiError } from "../../app/api";
import { useBreakpoint, useSession } from "../../app/session";
import { SigningCards } from "./SigningCards";
import { Avatar, Button, Card, Dialog, Icon, PageHead, PasswordField, Select, Seg, Switch, TextField, cx, fmtDate, toast } from "../../components";

/** The events a person can switch off (App plan 5.1 and 18.1) and the roles each one reaches (Phase 5 section 12.4); N9 reaches whoever may sign. */
export const NOTE_EVENTS: Array<{ id: string; label: string; roles: RoleCode[] | "signers" }> = [
  { id: "N1", label: "Batch ready to receive", roles: ["prep", "lab_admin"] },
  { id: "N2", label: "Samples did not arrive", roles: ["cso"] },
  { id: "N3", label: "Batch ready for data entry", roles: ["analyst"] },
  { id: "N4", label: "Analysis finished, RoA to upload", roles: ["lab_admin"] },
  { id: "N5", label: "Job order ready for its CoA", roles: ["lab_admin"] },
  { id: "N6", label: "CoA published, to send", roles: ["cso"] },
  { id: "N7", label: "Batch due within 24 h", roles: ["cso", "prep", "analyst", "lab_admin"] },
  { id: "N8", label: "Batch past its deadline", roles: ["supervisor", "manager"] },
  { id: "N9", label: "CoA waiting for my signature", roles: "signers" },
  { id: "N10", label: "CoA returned to me", roles: ["lab_admin"] },
];

interface Rules { minPasswordLength: number; requireLetterAndNumber: boolean; requireSpecialCharacter: boolean }
const toRules = (r: Rules) => ({ min_password_length: r.minPasswordLength, require_letter_and_number: r.requireLetterAndNumber, require_special_character: r.requireSpecialCharacter, forbid_email_in_password: true });

/** The rules of Configuration > Security, as a checklist that ticks while the person types. */
function Checklist({ pw, email }: { pw: string; email: string }) {
  const rules = useQuery({ queryKey: ["auth-rules"], queryFn: () => api<Rules>("/auth/rules"), staleTime: 300_000 });
  if (!rules.data) return null;
  const r = rules.data, items: Array<[string, boolean]> = [[`At least ${r.minPasswordLength} characters`, pw.length >= r.minPasswordLength]];
  if (r.requireLetterAndNumber) items.push(["A letter and a number", /[a-z]/i.test(pw) && /\d/.test(pw)]);
  if (r.requireSpecialCharacter) items.push(["A special character", /[^a-z0-9]/i.test(pw)]);
  items.push(["Not your email", !!pw && !pw.toLowerCase().includes(email.split("@")[0]!.toLowerCase())]);
  return (
    <ul className="col g6 pw-rules" id="pw-rules" style={{ listStyle: "none", margin: 0, padding: 0 }}>
      {items.map(([t, ok]) => (
        <li key={t} className={cx("row g8 t-sm", ok ? "c-ok" : "c-sec")} style={{ flexWrap: "nowrap" }}>
          <Icon n={ok ? "check-circle" : "circle"} />
          <span>{t}</span>
        </li>
      ))}
    </ul>
  );
}

/** Change password (frames 09-Profile-02 and -03; on the phone a sheet that fills the screen). */
function PasswordDialog({ email, phone, onClose }: { email: string; phone: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const rules = useQuery({ queryKey: ["auth-rules"], queryFn: () => api<Rules>("/auth/rules"), staleTime: 300_000 });
  const [cur, setCur] = useState(""), [pw, setPw] = useState(""), [again, setAgain] = useState(""), [err, setErr] = useState<Record<string, string>>({});
  const save = useMutation({
    mutationFn: () => api("/me/password", { method: "POST", json: { current: cur, password: pw } }),
    onSuccess: () => { toast("Password changed"); qc.invalidateQueries({ queryKey: ["me"] }); onClose(); },
    onError: (e) => { const x = e as ApiError; setErr({ [x.field ?? "form"]: x.text ?? "The password could not be changed." }); },
  });
  const go = () => {
    const e: Record<string, string> = {};
    if (!cur) e.current = "Enter your current password.";
    const p = rules.data ? passwordProblem(pw, toRules(rules.data), email) : null;
    if (!pw) e.password = "Enter a new password.";
    else if (p) e.password = p;
    if (again !== pw) e.again = "The two passwords are not the same.";
    setErr(e);
    if (!Object.keys(e).length) save.mutate();
  };
  return (
    <Dialog title="Change password" size="md" phone={phone} onClose={onClose}
      footer={<><Button onClick={onClose}>Cancel</Button><Button type="primary" id="pw-save" disabled={save.isPending} onClick={go}>Change password</Button></>}>
      {err.form && <span className="t-sm c-err" role="alert">{err.form}</span>}
      <PasswordField id="pw-current" label="Current password" value={cur} onChange={(v) => { setCur(v); setErr({}); }} error={err.current ?? null} autoComplete="current-password" />
      <PasswordField id="pw-new" label="New password" value={pw} onChange={(v) => { setPw(v); setErr({}); }} error={err.password ?? null} autoComplete="new-password" />
      <PasswordField id="pw-again" label="Confirm new password" value={again} onChange={(v) => { setAgain(v); setErr({}); }} error={err.again ?? null} autoComplete="new-password" />
      <Checklist pw={pw} email={email} />
    </Dialog>
  );
}

export function Profile() {
  const { me, signOut } = useSession(), bp = useBreakpoint(), phone = bp === "phone", loc = useLocation();
  const qc = useQueryClient();
  const [name, setName] = useState(me!.fullName), [pwOpen, setPwOpen] = useState(false);
  const start = me!.prefs.startPage ?? startPath(me!.permissions);
  const save = useMutation({
    mutationFn: (body: Record<string, unknown>) => api("/me", { method: "PATCH", json: body }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["me"] }); },
    onError: (e) => toast((e as Error).message, "error"),
  });
  // "Notification settings" in the user menu opens the page at its Notifications card
  useEffect(() => { if (loc.hash === "#notifications") document.getElementById("pf-notes")?.scrollIntoView({ block: "start" }); }, [loc.hash]);
  const hasWork = me!.permissions.includes("work.use");
  const pages = navFor(me!.permissions).flatMap((g) => g.items).filter((i) => ["/work", "/", "/orders", "/batches", "/reports"].includes(i.path));
  const collapsed = me!.prefs.sidebar === "collapsed";
  const signs = me!.permissions.includes("report.sign");
  const notes = NOTE_EVENTS.filter((e) => (e.roles === "signers" ? signs : e.roles.some((r) => me!.roles.includes(r))));
  // the switches keep their own copy until the saved profile comes back, so two quick taps both count (each save sends the whole set)
  const [local, setLocal] = useState<Record<string, boolean>>({});
  const off = { ...(me!.prefs.notifications ?? {}), ...local };
  const changed = name.trim() !== me!.fullName && name.trim().length >= 2;
  const roles = (me!.roles as RoleCode[]).map((r) => <span key={r} className="role">{ROLE_LABEL[r] ?? r}</span>);
  const changedOn = me!.passwordChangedAt ? fmtDate(me!.passwordChangedAt) : null;

  const personal = (
    <Card title="Personal">
      <TextField id="pf-name" label="Name" value={name} onChange={setName} />
      <div className="col g4">
        <span className="flabel">Email</span>
        <span className="t-sm" id="pf-email">{me!.email}</span>
        <span className="t-cap c-mut">Only a Superadmin can change the email.</span>
      </div>
      <div><Button type="primary" id="pf-save" disabled={!changed || save.isPending} onClick={() => save.mutate({ fullName: name.trim() }, { onSuccess: () => toast("Profile saved") })}>Save</Button></div>
    </Card>
  );
  const password = (
    <Card title="Password">
      <span className="t-sm c-sec" id="pf-pw-date">{changedOn ? `Last changed ${changedOn}` : "Not changed since the account was set up"}</span>
      <div><Button icon="lock-simple" id="pf-pw" onClick={() => setPwOpen(true)}>Change password</Button></div>
    </Card>
  );
  const prefs = (
    <Card title="Preferences">
      <div className="field"><span className="flabel">Sidebar</span>
        <Seg label="Sidebar" items={[["expanded", "Expanded"], ["collapsed", "Collapsed"]]} value={collapsed ? "collapsed" : "expanded"} onChange={(v) => save.mutate({ prefs: { sidebar: v } })} />
        <span className="t-cap c-mut">Applies on desktop. Tablets always show the rail.</span></div>
      <div className="col g4"><span className="flabel">Language</span><span className="t-sm">English</span><span className="t-cap c-mut">Indonesian terms are kept for RoA and CoA.</span></div>
      {hasWork && <Select id="pf-start" label="Start page" value={start} onChange={(v) => save.mutate({ prefs: { startPage: v } })} options={pages.map((p) => [p.path, p.label] as [string, string])} />}
    </Card>
  );
  const notices = (
    <Card title="Notifications">
      <div className="col g12" id="pf-notes">
        {notes.map((e) => (
          <Switch key={e.id} id={`nt-${e.id}`} label={e.label} on={off[e.id] !== false} onChange={(on) => { const next = { ...off, [e.id]: on }; setLocal((l) => ({ ...l, [e.id]: on })); save.mutate({ prefs: { notifications: next } }); }} />
        ))}
        <span className="t-cap c-mut">Notifications are in the app only.</span>
      </div>
    </Card>
  );
  return (
    <div className="page">
      <PageHead title={me!.fullName} avatar={<Avatar name={me!.fullName} size={64} />} actions={phone ? undefined : <Button size="lg" icon="sign-out" id="pf-signout" onClick={() => signOut()}>Sign out</Button>}
        sub={<span className="col g6"><span className="row g6 wrap">{roles}</span><span className="t-sm c-sec">{me!.email}</span></span>} />
      {phone && <Button size="touch" block icon="sign-out" id="pf-signout" onClick={() => signOut()}>Sign out</Button>}
      {bp === "desktop" ? (
        <div className="pf-cols">
          <div className="col g16" style={{ minWidth: 0 }}>{personal}{password}<SigningCards phone={false} /></div>
          <div className="col g16" style={{ minWidth: 0 }}>{prefs}{notices}</div>
        </div>
      ) : (
        <div className="col g16">{personal}{password}<SigningCards phone={phone} />{prefs}{notices}</div>
      )}
      {pwOpen && <PasswordDialog email={me!.email} phone={phone} onClose={() => setPwOpen(false)} />}
    </div>
  );
}
