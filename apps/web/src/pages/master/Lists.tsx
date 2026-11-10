// Drill hole (with CoA upload and history), Lithology and Seam lists and forms (Master Data screen plan, modules 10 to 12).
import { useState } from "react";
import { useSearchParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../app/api";
import { Button, Card, Dialog, Empty, Icon, TextField, toast } from "../../ui";
import { Badge, Chips, Confirm, DropZone, FileChip, Menu, Note, Pager, Radio, Search, Select, Table, Tag, fileSize, fmtDate, usePaged } from "../../ui/data";
import { KIND_LABEL, KIND_TONE, MasterList, post, useCan, useCompanyOptions, useIsPhone, useList, useSave, type DrillHole, type Lithology, type Seam } from "./shared";

/** Company filter that starts from ?company= (the client page links here). */
function useCompanyFilter() {
  const [sp, setSp] = useSearchParams(); const co = sp.get("company") ?? "";
  return [co, (v: string) => setSp(v ? { company: v } : {}, { replace: true })] as const;
}
const ReadOnly = ({ what }: { what: string }) => <Note>Read only. The lab admin {what}.</Note>;

/** Archive or restore, and delete when nothing uses the record. */
function useRowActions(path: string, key: string, label: (r: { id: string }) => string) {
  const [arch, setArch] = useState<{ id: string; archived: boolean; name: string } | null>(null), [del, setDel] = useState<{ id: string; name: string } | null>(null);
  const archive = useSave((r: { id: string; archived: boolean }) => post(`/${path}/${r.id}/${r.archived ? "restore" : "archive"}`), { keys: [key], onDone: () => setArch(null) });
  const remove = useSave((r: { id: string }) => api(`/${path}/${r.id}`, { method: "DELETE" }), { keys: [key], done: "Deleted", onDone: () => setDel(null) });
  const items = (r: { id: string; archived: boolean }, name: string, deletable: boolean) => [
    { label: r.archived ? "Restore" : "Archive", icon: "archive", onClick: () => (r.archived ? archive.mutate(r) : setArch({ ...r, name })) },
    deletable && { label: "Delete", icon: "trash", danger: true, onClick: () => setDel({ id: r.id, name }) }] as const;
  const dialogs = <>
    {arch && <Confirm title={`Archive ${arch.name}?`} text={`It stays on its samples and reports, but you can no longer pick it.`} ok="Archive" busy={archive.isPending} onOk={() => archive.mutate(arch)} onClose={() => setArch(null)} />}
    {del && <Confirm title={`Delete ${del.name}?`} text="Nothing uses it, so it can be removed for good." ok="Delete" danger busy={remove.isPending} onOk={() => remove.mutate(del)} onClose={() => setDel(null)} />}</>;
  void label; return { items, dialogs };
}

/* ======================= drill hole ======================= */
type DhChip = "all" | "missing" | "archived";
export function DrillHoles() {
  const can = useCan(), write = can("master.write"), up = can("coa.upload"), phone = useIsPhone();
  const { data = [], isLoading } = useList<DrillHole>("drill-holes");
  const [co, setCo] = useCompanyFilter(); const companies = useCompanyOptions("All companies");
  const [q, setQ] = useState(""), [chip, setChip] = useState<DhChip>("all");
  const [form, setForm] = useState<DrillHole | "new" | null>(null), [coaFor, setCoaFor] = useState<DrillHole | null>(null), [hist, setHist] = useState<DrillHole | null>(null);
  const act = useRowActions("drill-holes", "drill-holes", (r) => r.id);
  const base = data.filter((d) => (!q || `${d.code} ${d.description ?? ""}`.toLowerCase().includes(q.toLowerCase())) && (!co || d.companyId === co));
  const live = base.filter((d) => !d.archived);
  const rows = base.filter((d) => (chip === "all" ? !d.archived : chip === "missing" ? !d.archived && !d.coa : d.archived));
  const pg = usePaged(rows, 25, q + co + chip);
  const reset = (q || co || chip !== "all") ? <button type="button" className="linkbtn" onClick={() => { setQ(""); setCo(""); setChip("all"); }}>Reset</button> : null;
  const coaCell = (d: DrillHole) => d.coa
    ? <span className="row g6"><Tag label="CoA uploaded" tone="green" icon="check-circle" />{!phone && <span className="t-cap c-sec">{d.coa.fileName}</span>}</span>
    : <span className="row g8"><Tag label="CoA missing" tone="amber" icon="warning" />{up && !d.archived && <Button size="sm" icon="upload-simple" onClick={() => setCoaFor(d)}>Upload CoA</Button>}</span>;
  const menu = (d: DrillHole) => <Menu label={`More for ${d.code}`} items={[d.coa && { label: "CoA history", icon: "clock-counter-clockwise", onClick: () => setHist(d) },
    d.coa && up && !d.archived && { label: "Replace CoA", icon: "upload-simple", onClick: () => setCoaFor(d) }, ...act.items(d, d.code, d.totalSample === 0 && !d.coa)]} />;
  return <MasterList title="Drill hole" actions={write && <Button type="primary" size={phone ? "touch" : "lg"} icon="plus" id="add-dh" block={phone} onClick={() => setForm("new")}>Add drill hole</Button>}
    toolbar={<><Search label="Search" id="dh-q" value={q} onChange={setQ} placeholder="Search code or description" width={phone ? "100%" : 300} />
      <Select label="Company" value={co} onChange={setCo} options={companies.options} width={phone ? "100%" : 260} />{reset}</>}
    chips={<Chips scroll value={chip} onChange={setChip} items={[{ id: "all", label: "All", count: live.length }, { id: "missing", label: "Missing CoA", count: live.filter((d) => !d.coa).length }, { id: "archived", label: "Archived", count: base.filter((d) => d.archived).length }]} />}>
    {!write && <ReadOnly what="edits drill holes and uploads their CoAs" />}
    {isLoading ? <Card><Empty icon="cylinder" title="Loading drill holes" /></Card> : phone
      ? <div className="col g10">{pg.rows.map((d) => <div key={d.id} className="mcard" style={{ cursor: "default" }}><div className="row between"><b className="t-data-b">{d.code}</b>{write && <span className="row g4"><button type="button" className="linkbtn" onClick={() => setForm(d)}>Edit</button>{menu(d)}</span>}</div>
        <span className="t-sm c-sec">{d.description}</span><span className="t-cap c-sec">{d.companyName}, {d.totalSample} samples</span>{coaCell(d)}</div>)}
        {!pg.rows.length && <Card><Empty icon="cylinder" title="No drill holes" /></Card>}<Pager {...pg.pager} /></div>
      : <Card><Table rows={pg.rows} keyOf={(d) => d.id} cols={[
        { h: "Code", render: (d) => <b className="t-data-b">{d.code}</b> }, { h: "Description", render: (d) => d.description ?? "" }, { h: "Total sample", cls: "r", render: (d) => d.totalSample },
        { h: "Company", render: (d) => d.companyName }, { h: "CoA", render: coaCell },
        write && { h: "", cls: "r", render: (d) => <span className="row g4" style={{ justifyContent: "flex-end" }}><button type="button" className="linkbtn" onClick={() => setForm(d)}>Edit</button>{menu(d)}</span> }]}
        empty={<Empty icon="cylinder" title={q || co || chip !== "all" ? "No drill holes match" : "No drill holes yet"} text={q || co || chip !== "all" ? "Clear the search or pick another filter." : "Add the first drill hole."} />} /><Pager {...pg.pager} /></Card>}
    {form && <DrillHoleForm dh={form === "new" ? null : form} defaultCompany={co} onClose={() => setForm(null)} />}
    {coaFor && <CoaUpload dh={coaFor} onClose={() => setCoaFor(null)} />}
    {hist && <CoaHistory dh={hist} onClose={() => setHist(null)} />}
    {act.dialogs}
  </MasterList>;
}

function DrillHoleForm({ dh, defaultCompany, onClose }: { dh: DrillHole | null; defaultCompany: string; onClose: () => void }) {
  const companies = useCompanyOptions();
  const [f, setF] = useState({ companyId: dh?.companyId ?? defaultCompany, code: dh?.code ?? "", description: dh?.description ?? "" });
  const [err, setErr] = useState<Record<string, string>>({});
  const companyId = f.companyId || companies.options[0]?.[0] || "";
  const save = useSave(() => api(dh ? `/drill-holes/${dh.id}` : "/drill-holes", { method: dh ? "PATCH" : "POST", json: { ...f, companyId } }), { keys: ["drill-holes"], done: `${f.code.toUpperCase()} saved`, onDone: onClose, onField: (field, text) => setErr({ [field ?? "form"]: text }) });
  const submit = () => { if (!f.code.trim()) return setErr({ code: "Enter the drill hole code." }); setErr({}); save.mutate(undefined); };
  return <Dialog title={dh ? "Edit drill hole" : "Add drill hole"} onClose={onClose} phone={useIsPhone()}
    footer={<><Button onClick={onClose}>Cancel</Button><Button type="primary" id="sf-save" disabled={save.isPending} onClick={submit}>Save drill hole</Button></>}>
    <Select label="Company" req value={companyId} onChange={(v) => setF({ ...f, companyId: v })} options={companies.options} />
    <TextField id="dh-code" label="Code" req value={f.code} onChange={(v) => setF({ ...f, code: v.toUpperCase() })} placeholder="DH-BNM-021" error={err.code ?? null} />
    <TextField label="Description" value={f.description} onChange={(v) => setF({ ...f, description: v })} help="Free text, for example a batch label such as Batch 5." />
    {err.form && <span className="help err">{err.form}</span>}</Dialog>;
}

function CoaUpload({ dh, onClose }: { dh: DrillHole; onClose: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const save = useSave(async () => { const fd = new FormData(); fd.append("file", file!); await api(`/drill-holes/${dh.id}/coa`, { method: "POST", body: fd }); }, { keys: ["drill-holes"], done: `CoA saved for ${dh.code}`, onDone: onClose });
  const replace = !!dh.coa;
  return <Dialog title={replace ? `Replace CoA for ${dh.code}` : `Upload CoA for ${dh.code}`} phone={useIsPhone()} onClose={onClose}
    sub={replace ? "The current file moves to the history. Files are never deleted." : "The file is attached to the drill hole and shows on the dashboard."}
    footer={<><Button onClick={onClose}>Cancel</Button><Button type="primary" id="coa-save" disabled={!file || save.isPending} why="Choose a PDF first" onClick={() => save.mutate(undefined)}>{replace ? "Replace" : "Upload"}</Button></>}>
    {file ? <div className="row g10"><FileChip label={file.name} /><span className="t-cap c-mut">{fileSize(file.size)}</span><Button size="sm" icon="trash" onClick={() => setFile(null)}>Remove</Button></div>
      : <DropZone id="coa-file" text="Drop the CoA here, or click to browse" hint="PDF, up to 10 MB" accept="application/pdf"
        onFile={(f) => (f.size > 10485760 ? toast("The CoA is larger than 10 MB.", "error") : f.type !== "application/pdf" ? toast("The CoA must be a PDF file.", "error") : setFile(f))} />}</Dialog>;
}

function CoaHistory({ dh, onClose }: { dh: DrillHole; onClose: () => void }) {
  const { data = [], isLoading } = useQuery({ queryKey: ["coa-history", dh.id], queryFn: () => api<{ items: Array<{ id: string; fileName: string; sizeBytes: number; isCurrent: boolean; uploadedAt: string; uploadedBy: string | null; url: string | null }> }>(`/drill-holes/${dh.id}/coa`).then((r) => r.items) });
  return <Dialog title="CoA history" sub={dh.code} onClose={onClose} footer={<Button type="primary" onClick={onClose}>Done</Button>}>
    {isLoading ? <span className="t-sm c-mut">Loading…</span> : data.map((h) => <div key={h.id} className="row g10" style={{ borderBottom: "1px solid var(--surface-divider)", paddingBottom: 12 }}>
      <Icon n="file-pdf" s={20} /><div className="col grow" style={{ gap: 0 }}><span className="row g8"><b className="t-sm w6">{h.fileName}</b>{h.isCurrent && <Tag label="Current" tone="green" />}</span>
        <span className="t-cap c-sec">{fileSize(h.sizeBytes)}, {h.uploadedBy ?? "Unknown"}, {fmtDate(h.uploadedAt)}</span></div>
      {h.url && <a className="btn secondary sm" href={h.url} target="_blank" rel="noreferrer"><Icon n="download-simple" />Download</a>}</div>)}</Dialog>;
}

/* ======================= lithology ======================= */
type LiChip = "all" | "coal" | "parting" | "no_lithology" | "archived";
export function Lithologies() {
  const write = useCan()("master.write"), phone = useIsPhone();
  const { data = [], isLoading } = useList<Lithology>("lithologies");
  const [co, setCo] = useCompanyFilter(); const companies = useCompanyOptions("All companies");
  const [q, setQ] = useState(""), [chip, setChip] = useState<LiChip>("all"), [form, setForm] = useState<Lithology | "new" | null>(null);
  const act = useRowActions("lithologies", "lithologies", (r) => r.id);
  const base = data.filter((l) => (!q || l.name.toLowerCase().includes(q.toLowerCase())) && (!co || l.companyId === co));
  const count = (id: LiChip) => base.filter((l) => (id === "all" ? !l.archived : id === "archived" ? l.archived : l.kind === id && !l.archived)).length;
  const rows = base.filter((l) => (chip === "all" ? !l.archived : chip === "archived" ? l.archived : l.kind === chip && !l.archived));
  const pg = usePaged(rows, 25, q + co + chip);
  const menu = (l: Lithology) => <Menu label={`More for ${l.name}`} items={[...act.items(l, l.name, l.totalSample === 0)]} />;
  return <MasterList title="Lithology" actions={write && <Button type="primary" size={phone ? "touch" : "lg"} icon="plus" id="add-li" block={phone} onClick={() => setForm("new")}>Add lithology</Button>}
    toolbar={<><Search label="Search" id="li-q" value={q} onChange={setQ} placeholder="Search lithology name" width={phone ? "100%" : 300} /><Select label="Company" value={co} onChange={setCo} options={companies.options} width={phone ? "100%" : 260} /></>}
    chips={<Chips scroll value={chip} onChange={setChip} items={([["all", "All"], ["coal", "Coal"], ["parting", "Parting"], ["no_lithology", "No lithology"], ["archived", "Archived"]] as Array<[LiChip, string]>).map(([id, label]) => ({ id, label, count: count(id) }))} />}>
    {!write && <ReadOnly what="edits lithologies" />}
    {isLoading ? <Card><Empty icon="stack" title="Loading lithologies" /></Card> : <Card><Table rows={pg.rows} keyOf={(l) => l.id} cols={[
      { h: "Name", render: (l) => <b className="t-sm w6">{l.name}</b> }, { h: "Kind", render: (l) => <Tag label={KIND_LABEL[l.kind]} tone={KIND_TONE[l.kind]} /> },
      { h: "Total sample", cls: "r", render: (l) => l.totalSample }, !phone && { h: "Company", render: (l) => l.companyName },
      write && { h: "", cls: "r", render: (l) => <span className="row g4" style={{ justifyContent: "flex-end" }}><button type="button" className="linkbtn" onClick={() => setForm(l)}>Edit</button>{menu(l)}</span> }]}
      empty={<Empty icon="stack" title="No lithologies" text={q || co || chip !== "all" ? "Clear the search or pick another filter." : "Add the first lithology."} />} /><Pager {...pg.pager} /></Card>}
    {form && <LithologyForm li={form === "new" ? null : form} defaultCompany={co} onClose={() => setForm(null)} />}{act.dialogs}
  </MasterList>;
}
function LithologyForm({ li, defaultCompany, onClose }: { li: Lithology | null; defaultCompany: string; onClose: () => void }) {
  const companies = useCompanyOptions();
  const [f, setF] = useState({ companyId: li?.companyId ?? defaultCompany, name: li?.name ?? "", kind: li?.kind ?? ("coal" as Lithology["kind"]) });
  const [err, setErr] = useState<Record<string, string>>({});
  const companyId = f.companyId || companies.options[0]?.[0] || "";
  const save = useSave(() => api(li ? `/lithologies/${li.id}` : "/lithologies", { method: li ? "PATCH" : "POST", json: { ...f, companyId } }), { keys: ["lithologies"], done: `${f.name} saved`, onDone: onClose, onField: (field, text) => setErr({ [field ?? "form"]: text }) });
  const submit = () => { if (!f.name.trim()) return setErr({ name: "Enter the lithology name." }); setErr({}); save.mutate(undefined); };
  return <Dialog title={li ? "Edit lithology" : "Add lithology"} onClose={onClose} phone={useIsPhone()}
    footer={<><Button onClick={onClose}>Cancel</Button><Button type="primary" id="sf-save" disabled={save.isPending} onClick={submit}>Save lithology</Button></>}>
    <Select label="Company" req value={companyId} onChange={(v) => setF({ ...f, companyId: v })} options={companies.options} />
    <TextField id="li-name" label="Name" req value={f.name} onChange={(v) => setF({ ...f, name: v })} error={err.name ?? null} />
    <div className="field"><span className="flabel">Kind</span><div className="row g16 wrap">{(Object.keys(KIND_LABEL) as Array<Lithology["kind"]>).map((k) => <Radio key={k} on={f.kind === k} label={KIND_LABEL[k]} onChange={() => setF({ ...f, kind: k })} />)}</div></div>
    {err.form && <span className="help err">{err.form}</span>}</Dialog>;
}

/* ======================= seam ======================= */
type SeChip = "all" | "archived";
export function Seams() {
  const write = useCan()("master.write"), phone = useIsPhone();
  const { data = [], isLoading } = useList<Seam>("seams");
  const [co, setCo] = useCompanyFilter(); const companies = useCompanyOptions("All companies");
  const [q, setQ] = useState(""), [chip, setChip] = useState<SeChip>("all"), [form, setForm] = useState<Seam | "new" | null>(null);
  const act = useRowActions("seams", "seams", (r) => r.id);
  const base = data.filter((s) => (!q || `${s.code} ${s.description ?? ""}`.toLowerCase().includes(q.toLowerCase())) && (!co || s.companyId === co));
  const rows = base.filter((s) => (chip === "all" ? !s.archived : s.archived));
  const pg = usePaged(rows, 25, q + co + chip);
  const menu = (s: Seam) => <Menu label={`More for ${s.code}`} items={[...act.items(s, s.code, s.totalSample === 0)]} />;
  return <MasterList title="Seam" actions={write && <Button type="primary" size={phone ? "touch" : "lg"} icon="plus" id="add-se" block={phone} onClick={() => setForm("new")}>Add seam</Button>}
    toolbar={<><Search label="Search" id="se-q" value={q} onChange={setQ} placeholder="Search seam code" width={phone ? "100%" : 300} /><Select label="Company" value={co} onChange={setCo} options={companies.options} width={phone ? "100%" : 260} /></>}
    chips={<Chips scroll value={chip} onChange={setChip} items={[{ id: "all", label: "All", count: base.filter((s) => !s.archived).length }, { id: "archived", label: "Archived", count: base.filter((s) => s.archived).length }]} />}>
    {!write && <ReadOnly what="edits seams" />}
    {isLoading ? <Card><Empty icon="tray" title="Loading seams" /></Card> : <Card><Table rows={pg.rows} keyOf={(s) => s.id} cols={[
      { h: "Order", cls: "r", render: (s) => s.sortOrder ?? "" }, { h: "Code", render: (s) => <b className="t-data-b">{s.code}</b> }, { h: "Description", render: (s) => s.description ?? "" },
      !phone && { h: "Company", render: (s) => s.companyName }, { h: "Total sample", cls: "r", render: (s) => s.totalSample },
      write && { h: "", cls: "r", render: (s) => <span className="row g4" style={{ justifyContent: "flex-end" }}><button type="button" className="linkbtn" onClick={() => setForm(s)}>Edit</button>{menu(s)}</span> }]}
      empty={<Empty icon="tray" title="No seams" text={q || co || chip !== "all" ? "Clear the search or pick another filter." : "Add the first seam."} />} /><Pager {...pg.pager} /></Card>}
    {form && <SeamForm seam={form === "new" ? null : form} defaultCompany={co} onClose={() => setForm(null)} />}{act.dialogs}
  </MasterList>;
}
function SeamForm({ seam, defaultCompany, onClose }: { seam: Seam | null; defaultCompany: string; onClose: () => void }) {
  const companies = useCompanyOptions();
  const [f, setF] = useState({ companyId: seam?.companyId ?? defaultCompany, code: seam?.code ?? "", description: seam?.description ?? "", order: seam?.sortOrder?.toString() ?? "" });
  const [err, setErr] = useState<Record<string, string>>({});
  const companyId = f.companyId || companies.options[0]?.[0] || "";
  const save = useSave(() => api(seam ? `/seams/${seam.id}` : "/seams", { method: seam ? "PATCH" : "POST", json: { companyId, code: f.code, description: f.description, sortOrder: f.order === "" ? null : Number(f.order) } }),
    { keys: ["seams"], done: `${f.code.toUpperCase()} saved`, onDone: onClose, onField: (field, text) => setErr({ [field ?? "form"]: text }) });
  const submit = () => { const e: Record<string, string> = {}; if (!f.code.trim()) e.code = "Enter the seam code."; if (f.order !== "" && !/^\d{1,4}$/.test(f.order)) e.order = "Use a whole number."; setErr(e); if (!Object.keys(e).length) save.mutate(undefined); };
  return <Dialog title={seam ? "Edit seam" : "Add seam"} onClose={onClose} phone={useIsPhone()}
    footer={<><Button onClick={onClose}>Cancel</Button><Button type="primary" id="sf-save" disabled={save.isPending} onClick={submit}>Save seam</Button></>}>
    <Select label="Company" req value={companyId} onChange={(v) => setF({ ...f, companyId: v })} options={companies.options} />
    <TextField id="se-code" label="Code" req value={f.code} onChange={(v) => setF({ ...f, code: v.toUpperCase() })} error={err.code ?? null} />
    <TextField label="Description" value={f.description} onChange={(v) => setF({ ...f, description: v })} />
    <TextField label="Order" value={f.order} onChange={(v) => setF({ ...f, order: v })} help="Seams sort by this number, top of the sequence first. Optional." error={err.order ?? null} />
    {err.form && <span className="help err">{err.form}</span>}</Dialog>;
}
void Badge;
