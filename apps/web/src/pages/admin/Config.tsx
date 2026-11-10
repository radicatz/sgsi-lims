// Configuration hub and its slice A sections (Admin screen plan section 6; Configuration_Build_Design.md): Parameters, Validation rules,
// Lookups, Laboratory (with branch offices and numbering), Security and Formulas (view). Services, Methods and standards and
// Report templates follow in slice B. Editing is on desktop and tablet; the phone shows read-only lists (open point 5).
import { useMemo, useState, type ReactNode } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../app/api";
import { useBreakpoint } from "../../app/session";
import { Alert, Button, Card, Dialog, Empty, Icon, Seg, TextField, cx } from "../../ui";
import { Badge, Chips, KV, Note, Search, Select, Switch, Table, Tag, fmtDate, fmtWhen } from "../../ui/data";
import { useSave } from "../master/shared";

/* ---------- sections ---------- */
type SectionId = "parameters" | "services" | "methods" | "rules" | "lookups" | "templates" | "laboratory" | "security" | "formulas";
interface Section { id: SectionId; group: "LAB DATA" | "DOCUMENTS" | "SYSTEM"; title: string; text: string; count?: keyof Counts; later?: boolean }
interface Counts { parameters: number; services: number; methods: number; rules: number; lookups: number; templates: number; formulas: number }
const SECTIONS: Section[] = [
  { id: "parameters", group: "LAB DATA", title: "Parameters", text: "Codes, units, decimals, typical ranges", count: "parameters" },
  { id: "services", group: "LAB DATA", title: "Services", text: "Quick-select bundles for new job orders", count: "services", later: true },
  { id: "methods", group: "LAB DATA", title: "Methods and standards", text: "ASTM, ISO and GB/T methods per parameter", count: "methods", later: true },
  { id: "rules", group: "LAB DATA", title: "Validation rules", text: "Ranges and checks on entered values", count: "rules" },
  { id: "lookups", group: "LAB DATA", title: "Lookups", text: "Conditions, hold reasons, photo tags, send channels", count: "lookups" },
  { id: "templates", group: "DOCUMENTS", title: "Report templates", text: "The CoA template and its versions", count: "templates", later: true },
  { id: "laboratory", group: "DOCUMENTS", title: "Laboratory", text: "Name, place of issue, branch offices, numbering" },
  { id: "security", group: "SYSTEM", title: "Security", text: "Sign-in lock, idle sign-out, password rules" },
  { id: "formulas", group: "SYSTEM", title: "Formulas", text: "Calculated values, view only", count: "formulas" },
];
const NEXT_GOAL = ["Result tabs", "Field definitions"];
const LIST_LABEL: Record<string, string> = { sample_condition: "Sample conditions", hold_reason: "Hold reasons", photo_tag: "Photo tags", lithology_kind: "Lithology kinds",
  send_channel: "Send channels", not_received_reason: "Not received reasons", sample_type: "Sample types" };
const BASIS: Record<string, string> = { ar: "AR", adb: "ADB", db: "DB", daf: "DAF", ash: "Ash" };

interface Summary { counts: Counts; lastChanged: Record<string, { at: string; by: string | null }> }
interface Lookup { id: string; listKey: string; value: string; needsRemark: boolean; sortOrder: number; active: boolean }
interface Param { id: string; code: string; name: string; label: string; category: string; unit: string | null; kind: string; measuredBasis: string | null; decimals: number;
  allowsQualifier: boolean; typicalLow: number | null; typicalHigh: number | null; isGroup: boolean; active: boolean; inUse: boolean; families: string[] }
interface Rule { code: string; description: string; severity: "warn" | "block"; active: boolean; fixed: boolean; tolerance: number | null; parameter: string | null; unit: string | null; low: number | null; high: number | null }
interface Formula { id: string; parameter: string; name: string; basis: string; version: number; expression: string; inputs: string[]; validFrom: string; status: string }

const useSummary = () => useQuery({ queryKey: ["config-summary"], queryFn: () => api<Summary>("/config/summary") });
const useConfigList = <T,>(key: string, enabled = true) => useQuery({ queryKey: ["config", key], queryFn: () => api<{ items: T[] }>(`/config/${key}`).then((r) => r.items), enabled });
const KEYS = ["config", "config-summary"];
const num = (v: string) => (v.trim() === "" ? null : Number(v));
const range = (lo: number | null, hi: number | null, unit?: string | null) => (lo == null && hi == null ? "None" : `${lo ?? "…"} to ${hi ?? "…"}${unit ? ` ${unit}` : ""}`);

/* ======================= hub ======================= */
export function Config() {
  const { section } = useParams(); const nav = useNavigate(); const bp = useBreakpoint();
  const current = SECTIONS.find((s) => s.id === section) ?? null;
  const [q, setQ] = useState("");
  const summary = useSummary();
  const sectionList = <nav className="cfg-list" aria-label="Configuration sections">
    {(["LAB DATA", "DOCUMENTS", "SYSTEM"] as const).map((g) => <div key={g} className="col" style={{ gap: 2 }}><span className="navgroup static-label">{g}</span>
      {SECTIONS.filter((s) => s.group === g).map((s) => <Link key={s.id} to={`/config/${s.id}`} className={cx("mi", current?.id === s.id && "on")} onClick={() => setQ("")}>
        <span className="grow">{s.title}</span>{s.count && summary.data && <span className="cpill">{summary.data.counts[s.count]}</span>}</Link>)}</div>)}
    <div className="col" style={{ gap: 2 }}><span className="navgroup static-label">NEXT GOAL</span>
      {NEXT_GOAL.map((t) => <span key={t} className="mi dis"><span className="grow">{t}</span><Tag label="Next goal" /></span>)}</div></nav>;
  const body = q ? <SearchResults q={q} onOpen={(id) => { setQ(""); nav(`/config/${id}`); }} /> : current ? <SectionBody s={current} /> : <Overview summary={summary.data} />;
  return <div className="page">
    <div className="page-head"><div className="tt"><span className="t-over">Admin</span><h1 className="t-display">Configuration</h1></div>
      {bp !== "phone" && <Search label="Search" id="cfg-q" value={q} onChange={setQ} placeholder="Search settings, parameters, values" width={340} />}</div>
    {bp === "phone"
      ? current ? <><Link className="linkbtn" to="/config"><Icon n="caret-left" />All sections</Link><h2 className="t-h2" style={{ margin: 0 }}>{current.title}</h2>{body}</> : <Card>{sectionList}</Card>
      : bp === "tablet"
        ? <><Select label="Section" value={current?.id ?? ""} onChange={(v) => nav(v ? `/config/${v}` : "/config")} width={320} options={[["", "Overview"], ...SECTIONS.map((s) => [s.id, s.title] as [string, string])]} />{body}</>
        : <div className="cfg-grid"><Card className="cfg-side">{sectionList}</Card><div className="col g16" style={{ minWidth: 0 }}>{body}</div></div>}
  </div>;
}

function Overview({ summary }: { summary: Summary | undefined }) {
  const last = (id: SectionId) => {
    const l = id === "laboratory" ? [summary?.lastChanged.laboratory, summary?.lastChanged.numbering].filter(Boolean).sort((a, b) => (a!.at < b!.at ? 1 : -1))[0] : summary?.lastChanged[id];
    return l ? `Last changed ${fmtDate(l.at)}${l.by ? ` by ${l.by}` : ""}` : "Not changed yet";
  };
  return <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 12 }}>
    {SECTIONS.map((s) => <Link key={s.id} to={`/config/${s.id}`} className="mcard" style={{ textDecoration: "none", color: "inherit" }}>
      <div className="row between"><b className="t-sm w6">{s.title}</b>{s.count && summary ? <span className="cpill">{summary.counts[s.count]}</span> : null}</div>
      <span className="t-sm c-sec">{s.text}</span><span className="t-cap c-mut">{s.later ? "Built in the next slice" : last(s.id)}</span></Link>)}</div>;
}

function SectionBody({ s }: { s: Section }) {
  const editable = useBreakpoint() !== "phone";
  if (s.later) return <Card><Empty icon="hourglass" title={`${s.title} comes in the next slice`} text="Services, methods and report templates keep versions: a change makes a new version and old job orders keep theirs." /></Card>;
  switch (s.id) {
    case "parameters": return <Parameters editable={editable} />;
    case "rules": return <Rules editable={editable} />;
    case "lookups": return <Lookups editable={editable} />;
    case "laboratory": return <><LaboratorySettings editable={editable} /><NumberingSettings editable={editable} /></>;
    case "security": return <SecuritySettings editable={editable} />;
    case "formulas": return <Formulas />;
    default: return null;
  }
}

/* search across sections, parameters, lookup values and rules */
function SearchResults({ q, onOpen }: { q: string; onOpen: (id: SectionId) => void }) {
  const params = useConfigList<Param>("parameters"), lookups = useConfigList<Lookup>("lookups"), rules = useConfigList<Rule>("rules");
  const t = q.toLowerCase(), hit = (...v: Array<string | null | undefined>) => v.some((x) => x?.toLowerCase().includes(t));
  const groups: Array<[SectionId, string, string[]]> = [
    ["parameters", "Parameters", (params.data ?? []).filter((p) => hit(p.code, p.name, p.label)).map((p) => `${p.code}, ${p.name}`)],
    ["rules", "Validation rules", (rules.data ?? []).filter((r) => hit(r.code, r.description, r.parameter)).map((r) => `${r.code}, ${r.description}`)],
    ["lookups", "Lookups", (lookups.data ?? []).filter((l) => hit(l.value, LIST_LABEL[l.listKey])).map((l) => `${LIST_LABEL[l.listKey]}: ${l.value}`)],
  ];
  const sections = SECTIONS.filter((s) => hit(s.title, s.text));
  const found = sections.length + groups.reduce((n, g) => n + g[2].length, 0);
  return <Card title={`Results for "${q}"`}>
    {!found && <span className="t-sm c-mut">Nothing matches. Try a code such as Ash or TM.</span>}
    {sections.length > 0 && <div className="col g4"><span className="flabel">Sections</span>{sections.map((s) => <button key={s.id} type="button" className="mi" onClick={() => onOpen(s.id)}>{s.title}</button>)}</div>}
    {groups.filter((g) => g[2].length).map(([id, title, items]) => <div key={id} className="col g4"><span className="flabel">{title}</span>
      {items.slice(0, 8).map((i) => <button key={i} type="button" className="mi" onClick={() => onOpen(id)}>{i}</button>)}{items.length > 8 && <span className="t-cap c-mut">and {items.length - 8} more</span>}</div>)}</Card>;
}

/* ======================= settings pages ======================= */
interface SettingsData<T> { value: T; defaults: T; updatedAt: string | null }
function useSetting<T>(key: string) { return useQuery({ queryKey: ["config", "settings", key], queryFn: () => api<SettingsData<T>>(`/config/settings/${key}`) }); }
function SettingsCard<T extends Record<string, unknown>>({ title, settingKey, editable, children }: { title: string; settingKey: string; editable: boolean;
  children: (v: T, set: (p: Partial<T>) => void, err: Record<string, string>) => ReactNode }) {
  const q = useSetting<T>(settingKey);
  const [draft, setDraft] = useState<T | null>(null), [err, setErr] = useState<Record<string, string>>({});
  const v = draft ?? q.data?.value;
  const save = useSave((body: T) => api(`/config/settings/${settingKey}`, { method: "PUT", json: body }), { keys: KEYS, done: `${title} saved`,
    onDone: () => { setDraft(null); setErr({}); }, onField: (f, text) => setErr({ [f ?? "form"]: text }) });
  if (!v || !q.data) return <Card title={title}><span className="t-sm c-mut">Loading…</span></Card>;
  const dirty = draft !== null && JSON.stringify(draft) !== JSON.stringify(q.data.value);
  return <Card title={title} actions={q.data.updatedAt ? <span className="t-cap c-mut">Saved {fmtWhen(q.data.updatedAt)}</span> : undefined}>
    <fieldset disabled={!editable} style={{ border: 0, padding: 0, margin: 0 }} className="col g16">{children(v, (p) => setDraft({ ...v, ...p }), err)}</fieldset>
    {err.form && <Alert tone="error" title={err.form} />}
    {editable && <div className="row g10 end"><Button onClick={() => setDraft(q.data!.defaults)}>Restore defaults</Button>
      <Button type="primary" id={`save-${settingKey}`} disabled={!dirty || save.isPending} why="Nothing changed" onClick={() => save.mutate(v)}>Save</Button></div>}
    {!editable && <Note>Editing is on desktop and tablet.</Note>}
  </Card>;
}
const NumField = ({ id, label, value, onChange, err, help, unit }: { id: string; label: string; value: number; onChange: (n: number) => void; err?: string | undefined; help?: string; unit?: string }) =>
  <TextField id={id} label={unit ? `${label} (${unit})` : label} type="number" value={String(value)} onChange={(t) => onChange(t === "" ? NaN : Number(t))} error={err ?? null} {...(help ? { help } : {})} />;

interface SecurityV extends Record<string, unknown> { lock_after_attempts: number; lock_minutes: number; idle_sign_out_minutes: number; warn_before_seconds: number; min_password_length: number;
  require_letter_and_number: boolean; require_special_character: boolean; forbid_email_in_password: boolean; reset_link_minutes: number; invite_days: number }
function SecuritySettings({ editable }: { editable: boolean }) {
  return <SettingsCard<SecurityV> title="Security" settingKey="security" editable={editable}>{(v, set, e) => <>
    <div className="cfg-form">
      <NumField id="sec-lock" label="Lock after failed attempts" value={v.lock_after_attempts} onChange={(n) => set({ lock_after_attempts: n })} err={e.lock_after_attempts} help="3 to 10" />
      <NumField id="sec-lockmin" label="Lock for" unit="minutes" value={v.lock_minutes} onChange={(n) => set({ lock_minutes: n })} err={e.lock_minutes} />
      <NumField id="sec-idle" label="Idle sign-out after" unit="minutes" value={v.idle_sign_out_minutes} onChange={(n) => set({ idle_sign_out_minutes: n })} err={e.idle_sign_out_minutes} />
      <NumField id="sec-warn" label="Warn before sign-out" unit="seconds" value={v.warn_before_seconds} onChange={(n) => set({ warn_before_seconds: n })} err={e.warn_before_seconds} />
      <NumField id="sec-pwlen" label="Password length at least" unit="characters" value={v.min_password_length} onChange={(n) => set({ min_password_length: n })} err={e.min_password_length} help="8 to 64" />
      <NumField id="sec-invite" label="Invite link works for" unit="days" value={v.invite_days} onChange={(n) => set({ invite_days: n })} err={e.invite_days} /></div>
    <div className="col g10"><Switch on={v.require_letter_and_number} onChange={(b) => set({ require_letter_and_number: b })} label="Passwords need a letter and a number" />
      <Switch on={v.require_special_character} onChange={(b) => set({ require_special_character: b })} label="Passwords need a special character" />
      <Switch on={v.forbid_email_in_password} onChange={(b) => set({ forbid_email_in_password: b })} label="Passwords may not contain the email" /></div>
    <KV k="Reset link works for">{v.reset_link_minutes} minutes, set in Supabase Auth</KV></>}</SettingsCard>;
}

interface LabV extends Record<string, unknown> { name: string; address: string; accreditation: string; place_of_issue: string; branches: Array<{ code: string; name: string }> }
function LaboratorySettings({ editable }: { editable: boolean }) {
  return <SettingsCard<LabV> title="Laboratory" settingKey="laboratory" editable={editable}>{(v, set, e) => <>
    <div className="cfg-form">
      <TextField id="lab-name" label="Laboratory name" req value={v.name} onChange={(t) => set({ name: t })} error={e.name ?? null} />
      <TextField id="lab-place" label="Place of issue" req value={v.place_of_issue} onChange={(t) => set({ place_of_issue: t })} error={e.place_of_issue ?? null} help={`Printed as "Issued at ${v.place_of_issue || "…"}"`} />
      <TextField label="Accreditation number" value={v.accreditation} onChange={(t) => set({ accreditation: t })} />
      <TextField label="Address" value={v.address} onChange={(t) => set({ address: t })} /></div>
    <div className="field"><span className="flabel">Branch offices</span>
      <div className="col g8">{v.branches.map((b, i) => <div key={i} className="row g8">
        <div style={{ width: 90 }}><TextField label={`Code ${i + 1}`} value={b.code} onChange={(t) => set({ branches: v.branches.map((x, j) => (j === i ? { ...x, code: t.toUpperCase().slice(0, 2) } : x)) })} /></div>
        <div className="grow"><TextField label={`Office ${i + 1}`} value={b.name} onChange={(t) => set({ branches: v.branches.map((x, j) => (j === i ? { ...x, name: t } : x)) })} /></div>
        {editable && v.branches.length > 1 && <Button size="sm" icon="trash" onClick={() => set({ branches: v.branches.filter((_, j) => j !== i) })}>Remove</Button>}</div>)}
        {editable && <div className="row"><Button size="sm" icon="plus" onClick={() => set({ branches: [...v.branches, { code: "", name: "" }] })}>Add branch office</Button></div>}</div>
      {e.branches && <span className="help err">{e.branches}</span>}
      <span className="help">The two-letter code goes into the Sample ID, for example RI for Rapak Indah. A batch belongs to one branch.</span></div></>}</SettingsCard>;
}

interface NumberingV extends Record<string, unknown> { job_order: string; batch: string; sample_id: string; sample_code: string; coa: string; sample_no_width: number }
function NumberingSettings({ editable }: { editable: boolean }) {
  const pat = (id: string, label: string, k: keyof NumberingV, v: NumberingV, set: (p: Partial<NumberingV>) => void, e: Record<string, string>, example: string) =>
    <TextField id={id} label={label} value={String(v[k])} onChange={(t) => set({ [k]: t } as Partial<NumberingV>)} error={e[k as string] ?? null} help={`For example ${example}`} />;
  return <SettingsCard<NumberingV> title="Numbering" settingKey="numbering" editable={editable}>{(v, set, e) => <>
    <div className="cfg-form">
      {pat("num-jo", "Job order", "job_order", v, set, e, "JO-2026-0142")}{pat("num-batch", "Batch", "batch", v, set, e, "B-2026-0318")}
      {pat("num-sid", "Sample ID", "sample_id", v, set, e, "SG.260901.001.RI.001")}{pat("num-scode", "Sample code", "sample_code", v, set, e, "001.RI.001.Lot01")}
      {pat("num-coa", "CoA", "coa", v, set, e, "CoA-JO-2026-0142-1")}
      <NumField id="num-width" label="Sample ID running number" unit="digits" value={v.sample_no_width} onChange={(n) => set({ sample_no_width: n })} err={e.sample_no_width} help="3 allows 999 samples per client and day" /></div>
    <Note>Tokens: {"{YYYY} {YY} {MM} {DD} {YYMMDD}"} date; {"{NNNN} {NNN} {NN}"} running number; {"{CCC}"} company code; {"{BB}"} branch office; {"{LOT}"} lot; {"{job_order} {revision}"} for the CoA. A change applies to new numbers only.</Note></>}</SettingsCard>;
}

/* ======================= lists ======================= */
function Lookups({ editable }: { editable: boolean }) {
  const { data = [], isLoading } = useConfigList<Lookup>("lookups");
  const [form, setForm] = useState<Lookup | { listKey: string } | null>(null);
  if (isLoading) return <Card><span className="t-sm c-mut">Loading…</span></Card>;
  const keys = Object.keys(LIST_LABEL).filter((k) => data.some((l) => l.listKey === k) || k === "not_received_reason" || k === "sample_type");
  return <>{keys.map((k) => { const rows = data.filter((l) => l.listKey === k);
    return <Card key={k} title={LIST_LABEL[k]!} actions={editable && <Button size="sm" icon="plus" id={`add-${k}`} onClick={() => setForm({ listKey: k })}>Add value</Button>}>
      {rows.length ? <Table rows={rows} keyOf={(l) => l.id} cols={[
        { h: "Value", render: (l) => <span className="row g8"><b className="t-sm w6">{l.value}</b>{l.needsRemark && <Tag label="Needs a remark" />}</span> },
        { h: "Order", cls: "r", render: (l) => l.sortOrder }, { h: "Status", render: (l) => <Badge label={l.active ? "Active" : "Inactive"} tone={l.active ? "green" : "grey"} sm /> },
        editable && { h: "", cls: "r", render: (l) => <button type="button" className="linkbtn" onClick={() => setForm(l)}>Edit</button> }]} />
        : <span className="t-sm c-mut">No values yet.</span>}</Card>; })}
    {form && <LookupForm item={form} onClose={() => setForm(null)} />}</>;
}
function LookupForm({ item, onClose }: { item: Lookup | { listKey: string }; onClose: () => void }) {
  const existing = "id" in item ? item : null;
  const [f, setF] = useState({ value: existing?.value ?? "", needsRemark: existing?.needsRemark ?? false, sortOrder: String(existing?.sortOrder ?? 0), active: existing?.active ?? true });
  const [err, setErr] = useState<Record<string, string>>({});
  const save = useSave(() => api(existing ? `/config/lookups/${existing.id}` : "/config/lookups", { method: existing ? "PATCH" : "POST",
    json: { listKey: item.listKey, value: f.value, needsRemark: f.needsRemark, sortOrder: Number(f.sortOrder) || 0, active: f.active } }),
    { keys: KEYS, done: `${f.value} saved`, onDone: onClose, onField: (k, t) => setErr({ [k ?? "form"]: t }) });
  const submit = () => { if (!f.value.trim()) return setErr({ value: "Enter the value." }); setErr({}); save.mutate(undefined); };
  return <Dialog title={existing ? "Edit value" : "Add value"} sub={LIST_LABEL[item.listKey]} onClose={onClose}
    footer={<><Button onClick={onClose}>Cancel</Button><Button type="primary" id="lk-save" disabled={save.isPending} onClick={submit}>Save</Button></>}>
    <TextField id="lk-value" label="Value" req value={f.value} onChange={(t) => setF({ ...f, value: t })} error={err.value ?? null} />
    <TextField label="Order" type="number" value={f.sortOrder} onChange={(t) => setF({ ...f, sortOrder: t })} help="Lists sort by this number, then by name." />
    <Switch on={f.needsRemark} onChange={(b) => setF({ ...f, needsRemark: b })} label="Needs a remark when chosen" />
    <Switch id="lk-active" on={f.active} onChange={(b) => setF({ ...f, active: b })} label="Active (inactive values stay on old records but cannot be picked)" />
    {err.form && <span className="help err">{err.form}</span>}</Dialog>;
}

function Parameters({ editable }: { editable: boolean }) {
  const { data = [], isLoading } = useConfigList<Param>("parameters");
  const [q, setQ] = useState(""), [cat, setCat] = useState("all"), [form, setForm] = useState<Param | null>(null);
  const cats = useMemo(() => [...new Set(data.filter((p) => !p.isGroup).map((p) => p.category))], [data]);
  const base = data.filter((p) => !p.isGroup && (!q || `${p.code} ${p.name} ${p.label}`.toLowerCase().includes(q.toLowerCase())));
  const rows = base.filter((p) => cat === "all" || p.category === cat);
  if (isLoading) return <Card><span className="t-sm c-mut">Loading…</span></Card>;
  return <>
    <Search label="Search" id="pa-q" value={q} onChange={setQ} placeholder="Search code or name" width={320} />
    <Chips scroll value={cat} onChange={setCat} items={[{ id: "all", label: "All", count: base.length }, ...cats.map((c) => ({ id: c, label: c, count: base.filter((p) => p.category === c).length }))]} />
    <Card><Table rows={rows} keyOf={(p) => p.id} cols={[
      { h: "Code", render: (p) => <b className="t-data-b">{p.code}</b> }, { h: "Name", render: (p) => <span className="t-sm">{p.name}</span> }, { h: "Unit", render: (p) => p.unit ?? "" },
      { h: "Group", render: (p) => p.category }, { h: "Basis", render: (p) => (p.measuredBasis ? BASIS[p.measuredBasis] : "") }, { h: "Decimals", cls: "r", render: (p) => p.decimals },
      { h: "Methods", render: (p) => <span className="row g4" style={{ flexWrap: "nowrap" }}>{p.families.map((f) => <Tag key={f} label={f} />)}</span> },
      { h: "Typical range", render: (p) => <span className="t-sm">{range(p.typicalLow, p.typicalHigh)}</span> },
      { h: "Status", render: (p) => <Badge label={p.active ? "Active" : "Inactive"} tone={p.active ? "green" : "grey"} sm /> },
      editable && { h: "", cls: "r", render: (p) => <button type="button" className="linkbtn" onClick={() => setForm(p)}>Edit</button> }]}
      empty={<Empty icon="flask" title="No parameters match" />} /></Card>
    {form && <ParamForm p={form} cats={cats} onClose={() => setForm(null)} />}</>;
}
function ParamForm({ p, cats, onClose }: { p: Param; cats: string[]; onClose: () => void }) {
  const [f, setF] = useState({ code: p.code, name: p.name, label: p.label, category: p.category, unit: p.unit ?? "", measuredBasis: p.measuredBasis ?? "", decimals: String(p.decimals),
    allowsQualifier: p.allowsQualifier, typicalLow: p.typicalLow?.toString() ?? "", typicalHigh: p.typicalHigh?.toString() ?? "", active: p.active });
  const [err, setErr] = useState<Record<string, string>>({});
  const set = (x: Partial<typeof f>) => setF({ ...f, ...x });
  const save = useSave(() => api(`/config/parameters/${p.id}`, { method: "PATCH", json: { code: f.code, name: f.name, label: f.label, category: f.category, unit: f.unit || null,
    measuredBasis: f.measuredBasis || null, decimals: Number(f.decimals), allowsQualifier: f.allowsQualifier, typicalLow: num(f.typicalLow), typicalHigh: num(f.typicalHigh), active: f.active } }),
    { keys: KEYS, done: `${f.code} saved`, onDone: onClose, onField: (k, t) => setErr({ [k ?? "form"]: t }) });
  const submit = () => {
    const e: Record<string, string> = {};
    if (!f.name.trim()) e.name = "Enter the name."; if (!/^\d$/.test(f.decimals)) e.decimals = "0 to 6.";
    const lo = num(f.typicalLow), hi = num(f.typicalHigh);
    if ((f.typicalLow && Number.isNaN(lo)) || (f.typicalHigh && Number.isNaN(hi))) e.typicalHigh = "Use numbers."; else if (lo != null && hi != null && lo >= hi) e.typicalHigh = "The low end must be below the high end.";
    setErr(e); if (!Object.keys(e).length) save.mutate(undefined);
  };
  return <Dialog title={`Edit ${p.code}`} sub={p.name} onClose={onClose} footer={<><Button onClick={onClose}>Cancel</Button><Button type="primary" id="pa-save" disabled={save.isPending} onClick={submit}>Save</Button></>}>
    <div className="cfg-form">
      <TextField id="pa-code" label="Code" req value={f.code} onChange={(t) => set({ code: t })} error={err.code ?? null} {...(p.inUse ? { help: "In use, so the code is locked." } : {})} />
      <TextField id="pa-label" label="Label" req value={f.label} onChange={(t) => set({ label: t })} help="Shown on pills and column heads." />
      <TextField id="pa-name" label="Name" req value={f.name} onChange={(t) => set({ name: t })} error={err.name ?? null} />
      <Select label="Group" value={f.category} onChange={(v) => set({ category: v })} options={cats.map((c) => [c, c] as [string, string])} />
      <TextField label="Unit" value={f.unit} onChange={(t) => set({ unit: t })} />
      <Select label="Measured basis" value={f.measuredBasis} onChange={(v) => set({ measuredBasis: v })} options={[["", "None"], ...Object.entries(BASIS)]} />
      <TextField id="pa-dec" label="Decimals" type="number" value={f.decimals} onChange={(t) => set({ decimals: t })} error={err.decimals ?? null} />
      <div />
      <TextField id="pa-lo" label="Typical range, low" type="number" value={f.typicalLow} onChange={(t) => set({ typicalLow: t })} />
      <TextField id="pa-hi" label="Typical range, high" type="number" value={f.typicalHigh} onChange={(t) => set({ typicalHigh: t })} error={err.typicalHigh ?? null} help="Values outside get a warning (V-31)." /></div>
    {p.inUse && <style>{`#pa-code { pointer-events: none; opacity: .6 }`}</style>}
    <Switch on={f.allowsQualifier} onChange={(b) => set({ allowsQualifier: b })} label="Allows qualified values such as <0.01" />
    <Switch id="pa-active" on={f.active} onChange={(b) => set({ active: b })} label="Active (an inactive parameter cannot be picked on new job orders)" />
    {err.form && <span className="help err">{err.form}</span>}</Dialog>;
}

function Rules({ editable }: { editable: boolean }) {
  const { data = [], isLoading } = useConfigList<Rule>("rules");
  const [form, setForm] = useState<Rule | null>(null);
  if (isLoading) return <Card><span className="t-sm c-mut">Loading…</span></Card>;
  return <><Card><Table rows={data} keyOf={(r) => r.code} cols={[
    { h: "Rule", render: (r) => <b className="t-data-b">{r.code}</b> }, { h: "Applies to", render: (r) => <span className="t-sm">{r.description}</span> },
    { h: "Severity", render: (r) => <Badge label={r.severity === "block" ? "Block" : "Warn"} tone={r.severity === "block" ? "red" : "amber"} sm /> },
    { h: "Bounds", render: (r) => <span className="t-sm">{r.parameter ? range(r.low, r.high, r.unit) : r.tolerance != null ? `± ${r.tolerance}` : "Fixed check"}</span> },
    { h: "Status", render: (r) => <Badge label={r.active ? "Active" : "Off"} tone={r.active ? "green" : "grey"} sm /> },
    editable && { h: "", cls: "r", render: (r) => (r.fixed ? <Tag label="Fixed" /> : <button type="button" className="linkbtn" onClick={() => setForm(r)}>Edit</button>) }]} /></Card>
    <Note>Block stops the value from being saved; Warn saves it with a flag. Range bounds are the parameter's typical range.</Note>
    {form && <RuleForm r={form} onClose={() => setForm(null)} />}</>;
}
function RuleForm({ r, onClose }: { r: Rule; onClose: () => void }) {
  const [f, setF] = useState({ severity: r.severity, active: r.active, tolerance: r.tolerance?.toString() ?? "", low: r.low?.toString() ?? "", high: r.high?.toString() ?? "" });
  const [err, setErr] = useState<Record<string, string>>({});
  const save = useSave(() => api(`/config/rules/${r.code}`, { method: "PATCH", json: { severity: f.severity, active: f.active,
    ...(r.tolerance != null ? { tolerance: Number(f.tolerance) } : {}), ...(r.parameter ? { low: num(f.low), high: num(f.high) } : {}) } }),
    { keys: KEYS, done: `${r.code} saved`, onDone: onClose, onField: (k, t) => setErr({ [k ?? "form"]: t }) });
  const submit = () => {
    const lo = num(f.low), hi = num(f.high);
    if (r.parameter && lo != null && hi != null && lo >= hi) return setErr({ high: "The low end must be below the high end." });
    setErr({}); save.mutate(undefined);
  };
  return <Dialog title={`Edit ${r.code}`} sub={r.description} onClose={onClose} footer={<><Button onClick={onClose}>Cancel</Button><Button type="primary" id="ru-save" disabled={save.isPending} onClick={submit}>Save</Button></>}>
    <div className="field"><span className="flabel">Severity</span><Seg label="Severity" items={[["warn", "Warn"], ["block", "Block"]]} value={f.severity} onChange={(v) => setF({ ...f, severity: v })} /></div>
    {r.tolerance != null && <TextField id="ru-tol" label="Tolerance (%)" type="number" value={f.tolerance} onChange={(t) => setF({ ...f, tolerance: t })} />}
    {r.parameter && <div className="cfg-form"><TextField id="ru-lo" label={`Low${r.unit ? ` (${r.unit})` : ""}`} type="number" value={f.low} onChange={(t) => setF({ ...f, low: t })} />
      <TextField id="ru-hi" label={`High${r.unit ? ` (${r.unit})` : ""}`} type="number" value={f.high} onChange={(t) => setF({ ...f, high: t })} error={err.high ?? null} /></div>}
    <Switch id="ru-active" on={f.active} onChange={(b) => setF({ ...f, active: b })} label="Active" />
    {err.form && <span className="help err">{err.form}</span>}</Dialog>;
}

function Formulas() {
  const { data = [], isLoading } = useConfigList<Formula>("formulas");
  if (isLoading) return <Card><span className="t-sm c-mut">Loading…</span></Card>;
  return <><Card><Table rows={data} keyOf={(f) => f.id} cols={[
    { h: "Calculates", render: (f) => <span className="row g8"><b className="t-data-b">{f.parameter}</b><span className="t-sm c-sec">{f.name}</span></span> },
    { h: "Basis", render: (f) => BASIS[f.basis] ?? f.basis }, { h: "Expression", render: (f) => <code className="t-data">{f.expression}</code> },
    { h: "Version", cls: "r", render: (f) => f.version }, { h: "Used since", render: (f) => fmtDate(f.validFrom) }]} /></Card>
    <Note>Formulas are fixed in v1. A change goes through the product owner and becomes a new version, so results keep the formula they were calculated with.</Note></>;
}
