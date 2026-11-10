// Phase 0 pages: Profile, Notifications (list arrives in phase 5), a holding page per module, Not found.
import { useState } from "react";
import { useNavigate } from "react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { navFor, startPath } from "@sgsi/shared";
import { api } from "../app/api";
import { useSession } from "../app/session";
import { Avatar, Button, Card, Empty, PageHead, Seg, TextField, toast } from "../ui";

const PHASE: Record<string, [number, string]> = {
  "/work": [5, "My work queues"], "/": [5, "Dashboard"], "/orders": [2, "Job orders"], "/batches": [3, "Batches"], "/reports": [4, "Reports"],
  "/search": [5, "Search"], "/clients": [1, "Clients"], "/master/drill-holes": [1, "Drill hole"], "/master/lithologies": [1, "Lithology"],
  "/master/seams": [1, "Seam"], "/users": [1, "Users"], "/config": [1, "Configuration"], "/audit": [5, "Audit log"], "/notifications": [5, "Notifications"],
};

export function Coming({ path }: { path: string }) {
  const [phase, name] = PHASE[path] ?? [0, "This page"];
  return <div className="page"><PageHead overline={new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })} title={name} />
    <Card><Empty icon="stack" title={`${name} is built in phase ${phase}`} text="The sign-in, your role's sidebar and this page's access rule already work. The screen itself follows the v1 build plan." /></Card></div>;
}

export function NotFound() {
  const nav = useNavigate(); const { me } = useSession();
  return <div className="page"><Card><Empty icon="question" title="This page does not exist" text="The link may be old or mistyped." action={<Button type="primary" onClick={() => nav(startPath(me!.permissions))}>Go to the start page</Button>} /></Card></div>;
}

export function Profile() {
  const { me, signOut } = useSession();
  const qc = useQueryClient();
  const [name, setName] = useState(me!.fullName);
  const [start, setStart] = useState(me!.prefs.startPage ?? startPath(me!.permissions));
  const save = useMutation({
    mutationFn: (body: Record<string, unknown>) => api("/me", { method: "PATCH", json: body }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["me"] }); toast("Profile saved"); },
    onError: (e) => toast((e as Error).message, "error"),
  });
  const pages = navFor(me!.permissions).flatMap((g) => g.items).filter((i) => ["/work", "/", "/orders", "/batches", "/reports"].includes(i.path));
  const collapsed = me!.prefs.sidebar === "collapsed";
  return <div className="page"><PageHead overline="Profile" title="Profile" actions={<Button icon="sign-out" onClick={() => signOut()}>Sign out</Button>} />
    <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", alignItems: "start" }}>
      <Card title="Your account"><div className="row g12"><Avatar name={me!.fullName} size={64} /><div className="col g4"><b className="t-h3">{me!.fullName}</b>
        <span className="row g6 wrap">{me!.roles.map((r) => <span key={r} className="role">{r.replace("_", " ")}</span>)}</span></div></div>
        <TextField label="Name" value={name} onChange={setName} /><TextField label="Email" value={me!.email} onChange={() => undefined} help="Your lab admin changes the email." /></Card>
      <Card title="Layout"><div className="field"><span className="flabel">Sidebar</span>
        <Seg label="Sidebar" items={[["expanded", "Expanded"], ["collapsed", "Collapsed"]]} value={collapsed ? "collapsed" : "expanded"} onChange={(v) => save.mutate({ prefs: { sidebar: v } })} />
        <span className="help">Applies on desktop. Tablets always show the rail.</span></div>
        <div className="field"><label className="flabel" htmlFor="pf-start">Start page</label><div className="input"><select id="pf-start" value={start} onChange={(e) => setStart(e.target.value)}>
          {pages.map((p) => <option key={p.path} value={p.path}>{p.label}</option>)}</select></div></div></Card>
    </div>
    <div className="row end"><Button type="primary" size="lg" disabled={save.isPending} onClick={() => save.mutate({ fullName: name, prefs: { startPage: start } })}>Save</Button></div></div>;
}
