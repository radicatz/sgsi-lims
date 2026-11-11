// Clients list, the client page with its contacts, and the client and contact forms (Master Data screen plan, module 09).
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../app/api";
import { Avatar, Button, Card, Dialog, Empty, Icon, PageHead, TextField, toast } from "../../ui";
import { Badge, Check, Chips, Confirm, KV, Menu, Note, Pager, RowActions, Search, Select, Switch, Tag, Table, TextArea, DropZone, fileSize, fmtDate, sortRows, usePaged, useSort, type Col } from "../../ui/data";
import { MasterList, STATUS_LABEL, STATUS_TONE, post, useCan, useCompanies, useIsPhone, useSave, type Company, type Contact } from "./shared";

type Chip = "all" | "active" | "inactive" | "archived";

export function Clients() {
  const can = useCan(), write = can("company.manage"), phone = useIsPhone(), nav = useNavigate();
  const { data, isLoading } = useCompanies();
  const [q, setQ] = useState(""), [chip, setChip] = useState<Chip>("all");
  const [form, setForm] = useState<Company | "new" | null>(null), [arch, setArch] = useState<Company | null>(null), [del, setDel] = useState<Company | null>(null);
  const base = (data ?? []).filter((c) => !q || `${c.name} ${c.code}`.toLowerCase().includes(q.toLowerCase()));
  const live = base.filter((c) => c.status !== "archived");
  const refresh = { keys: ["companies"] };
  const archive = useSave((c: Company) => post(`/companies/${c.id}/${c.status === "archived" ? "restore" : "archive"}`), { ...refresh, onDone: () => setArch(null) });
  const remove = useSave((c: Company) => api(`/companies/${c.id}`, { method: "DELETE" }), { ...refresh, done: "Client deleted", onDone: () => setDel(null) });
  const inUse = (c: Company) => c.jobOrders + c.drillHoles + c.lithologies + c.seams > 0;
  const archiveOrRestore = (c: Company) => (c.status === "archived" ? archive.mutate(c) : setArch(c));
  const { sort, onSort } = useSort({ h: "Client", dir: "asc" });
  const cols: Array<Col<Company> | false> = [
    { h: "Client", sort: (c) => c.name, render: (c) => <span className="row g10"><Avatar name={c.name} size={40} logo={c.logoUrl} /><b className="t-sm w6">{c.name}</b></span> },
    { h: "Code", sort: (c) => c.code, render: (c) => <span className="t-data">{c.code}</span> },
    { h: "Address", sort: (c) => c.address, render: (c) => <span className="t-sm c-sec">{c.address ?? ""}</span> },
    { h: "Status", sort: (c) => c.status, render: (c) => <Badge label={STATUS_LABEL[c.status]} tone={STATUS_TONE[c.status]} sm /> },
    { h: "Total sample", cls: "r", sort: (c) => c.totalSample, render: (c) => c.totalSample },
    { h: "Created", sort: (c) => c.createdAt, render: (c) => fmtDate(c.createdAt) },
    write && { h: "Actions", render: (c) => <RowActions items={[{ label: `Edit ${c.name}`, icon: "pencil-simple", onClick: () => setForm(c) },
      { label: c.status === "archived" ? `Restore ${c.name}` : `Archive ${c.name}`, icon: c.status === "archived" ? "arrow-counter-clockwise" : "archive", onClick: () => archiveOrRestore(c) },
      { label: `Delete ${c.name}`, icon: "trash", onClick: () => setDel(c), show: !inUse(c) }]} /> }];
  const rows = sortRows(base.filter((c) => (chip === "all" ? c.status !== "archived" : c.status === chip)), cols, sort);
  const pg = usePaged(rows, 25, q + chip + (sort?.h ?? "") + (sort?.dir ?? ""));
  return <MasterList title="Clients"
    actions={write && <Button type="primary" size={phone ? "touch" : "lg"} icon="plus" id="add-client" block={phone} onClick={() => setForm("new")}>Add client</Button>}
    toolbar={<Search label="Search" id="cl-q" value={q} onChange={setQ} placeholder="Search client name or code" width={phone ? "100%" : 320} />}
    chips={<Chips scroll value={chip} onChange={setChip} items={[{ id: "all", label: "All", count: live.length }, { id: "active", label: "Active", count: base.filter((c) => c.status === "active").length },
      { id: "inactive", label: "Inactive", count: base.filter((c) => c.status === "inactive").length }, { id: "archived", label: "Archived", count: base.filter((c) => c.status === "archived").length }]} />}>
    {isLoading ? <Card><Empty icon="buildings" title="Loading clients" /></Card> : phone
      ? <div className="col g10">{pg.rows.map((c) => <div key={c.id} className="icard" onClick={() => nav(`/clients/${c.id}`)}>
          <div className="top"><Avatar name={c.name} size={40} logo={c.logoUrl} /><div className="col grow" style={{ gap: 0, minWidth: 0 }}><b className="t-sm w6 ellip">{c.name}</b><span className="t-cap c-sec ellip">{c.address ?? ""}</span></div>
            {write && <Menu vertical label={`More for ${c.name}`} items={[{ label: "Edit", icon: "pencil-simple", onClick: () => setForm(c) },
              { label: c.status === "archived" ? "Restore" : "Archive", icon: c.status === "archived" ? "arrow-counter-clockwise" : "archive", onClick: () => archiveOrRestore(c) },
              !inUse(c) && { label: "Delete", icon: "trash", danger: true, onClick: () => setDel(c) }]} />}</div>
          <div className="meta"><span className="pillcode">{c.code}</span><Badge label={STATUS_LABEL[c.status]} tone={STATUS_TONE[c.status]} sm /><span className="cnt">{c.totalSample.toLocaleString("en-US")} samples</span></div></div>)}
          {!pg.rows.length && <Card><Empty icon="buildings" title="No clients yet" text="Add the first client to start taking job orders." /></Card>}<Pager {...pg.pager} /></div>
      : <Card><Table rows={pg.rows} keyOf={(c) => c.id} onRow={(c) => nav(`/clients/${c.id}`)} cols={cols} sort={sort} onSort={onSort}
        empty={<Empty icon="buildings" title={q || chip !== "all" ? "No clients match" : "No clients yet"} text={q || chip !== "all" ? "Clear the search or pick another filter." : "Add the first client to start taking job orders."} />} /><Pager {...pg.pager} /></Card>}
    {form && <ClientForm company={form === "new" ? null : form} onClose={() => setForm(null)} onCreated={(id) => nav(`/clients/${id}`)} />}
    {arch && <Confirm title={`Archive ${arch.name}?`} text="It stays on its job orders and reports, but no new job order can pick it. You can restore it later." ok="Archive" busy={archive.isPending} onOk={() => archive.mutate(arch)} onClose={() => setArch(null)} />}
    {del && <Confirm title={`Delete ${del.name}?`} text="Nothing uses this client, so it can be removed for good." ok="Delete" danger busy={remove.isPending} onOk={() => remove.mutate(del)} onClose={() => setDel(null)} />}
  </MasterList>;
}

/* ---------- client form: logo, name, code, status, addresses ---------- */
function ClientForm({ company, onClose, onCreated }: { company: Company | null; onClose: () => void; onCreated?: (id: string) => void }) {
  const phone = useIsPhone();
  const [f, setF] = useState({ name: company?.name ?? "", code: company?.code ?? "", status: company && company.status !== "archived" ? company.status : "active", address: company?.address ?? "", billing: company?.billingAddress ?? "", companyCode: company?.companyCode ?? "" });
  const superadmin = useCan()("config.write");
  const [same, setSame] = useState(!company?.billingAddress);
  const [logo, setLogo] = useState<File | null>(null), [dropLogo, setDropLogo] = useState(false);
  const [err, setErr] = useState<Record<string, string>>({});
  const set = (p: Partial<typeof f>) => setF({ ...f, ...p });
  const preview = logo ? URL.createObjectURL(logo) : dropLogo ? null : company?.logoUrl ?? null;
  const save = useSave(async () => {
    const body = { name: f.name, code: f.code, status: f.status, address: f.address, billingAddress: same ? "" : f.billing,
      ...(company && superadmin && f.companyCode !== company.companyCode ? { companyCode: f.companyCode } : {}) };
    const id = company ? company.id : ((await api<{ id: string }>("/companies", { method: "POST", json: body })).id);
    if (company) await api(`/companies/${company.id}`, { method: "PATCH", json: body });
    if (logo) { const fd = new FormData(); fd.append("file", logo); await api(`/companies/${id}/logo`, { method: "POST", body: fd }); }
    else if (dropLogo && company?.logoUrl) await api(`/companies/${id}/logo`, { method: "DELETE" });
    return id;
  }, { keys: ["companies", "company"], done: company ? `${f.name} saved` : `${f.name} added`, onDone: (id) => { onClose(); if (!company) onCreated?.(id as string); }, onField: (field, text) => setErr({ [field ?? "form"]: text }) });
  const submit = () => {
    const e: Record<string, string> = {};
    if (!f.name.trim()) e.name = "Enter the client name."; if (!f.code.trim()) e.code = "Enter a short code.";
    setErr(e); if (!Object.keys(e).length) save.mutate(undefined);
  };
  return <Dialog title={company ? "Edit client" : "Add client"} size="lg" phone={phone} onClose={onClose}
    footer={<><Button onClick={onClose}>Cancel</Button><Button type="primary" id="cl-save" disabled={save.isPending} onClick={submit}>Save client</Button></>}>
    {preview ? <div className="row g12"><Avatar name={f.name || "?"} size={64} logo={preview} /><div className="col grow" style={{ gap: 0 }}><span className="t-sm w5">{logo?.name ?? company?.logoName}</span>{logo && <span className="t-cap c-sec">{fileSize(logo.size)}</span>}</div>
      <Button size="sm" icon="trash" onClick={() => { setLogo(null); setDropLogo(true); }}>Remove</Button></div>
      : <DropZone id="cl-logo" text="Drop or click to add logo" hint="PNG, JPEG, SVG or WebP, up to 2 MB. Shown round at 40 and 64 px." accept="image/png,image/jpeg,image/svg+xml,image/webp"
        onFile={(file) => { if (file.size > 2097152) return toast("The logo is larger than 2 MB.", "error"); setLogo(file); setDropLogo(false); }} />}
    <div className="grid" style={{ gridTemplateColumns: phone ? "1fr" : "2fr 1fr", gap: 16 }}>
      <TextField id="cl-name" label="Name" req value={f.name} onChange={(v) => set({ name: v })} placeholder="Client name" error={err.name ?? null} />
      <TextField id="cl-code" label="Code" req value={f.code} onChange={(v) => set({ code: v.toUpperCase() })} placeholder="BNM" error={err.code ?? null} /></div>
    {company && superadmin && <TextField id="cl-ccode" label="Company code (Sample ID)" value={f.companyCode} onChange={(v) => set({ companyCode: v.replace(/\D/g, "").slice(0, 3) })} error={err.companyCode ?? null}
      help={company.companyCodeLocked ? "Locked: this client already has received samples." : "Three digits, used in every Sample ID. Locks after the first received sample."} />}
    {company?.companyCodeLocked && superadmin && <style>{`#cl-ccode { pointer-events: none; opacity: .6 }`}</style>}
    <Select label="Status" value={f.status} onChange={(v) => set({ status: v as typeof f.status })} options={[["active", "Active"], ["inactive", "Inactive"]]} />
    <TextArea label="Address" value={f.address} onChange={(v) => set({ address: v })} />
    <Check on={same} onChange={setSame} label="Billing address same as address" />
    {!same && <TextArea label="Billing address" value={f.billing} onChange={(v) => set({ billing: v })} />}
    {err.form && <span className="help err">{err.form}</span>}
  </Dialog>;
}

/* ---------- client page ---------- */
interface ClientPageData extends Company { contacts: Contact[] }
export function ClientPage() {
  const { id } = useParams(); const can = useCan(), write = can("company.manage"), phone = useIsPhone(), nav = useNavigate();
  const { data: c, isLoading, isError } = useQuery({ queryKey: ["company", id], queryFn: () => api<ClientPageData>(`/companies/${id}`) });
  const [form, setForm] = useState(false), [ct, setCt] = useState<Contact | "new" | null>(null), [arch, setArch] = useState(false);
  const archive = useSave(() => post(`/companies/${id}/${c?.status === "archived" ? "restore" : "archive"}`), { keys: ["companies", "company"], onDone: () => setArch(false) });
  const makeDefault = useSave((k: Contact) => post(`/contacts/${k.id}/default`), { keys: ["company"], done: "Default contact changed" });
  const dropContact = useSave((k: Contact) => post(`/contacts/${k.id}/archive`), { keys: ["company"], done: "Contact archived" });
  const [del, setDel] = useState(false);
  const remove = useSave(() => api(`/companies/${id}`, { method: "DELETE" }), { keys: ["companies", "company"], done: "Client deleted", onDone: () => { setDel(false); nav("/clients"); } });
  const { sort, onSort } = useSort();
  if (isLoading) return <div className="page"><Card><Empty icon="buildings" title="Loading client" /></Card></div>;
  if (isError || !c) return <div className="page"><Card><Empty icon="question" title="This client was not found" action={<Button onClick={() => nav("/clients")}>Back to clients</Button>} /></Card></div>;
  const lists: Array<[string, number, string]> = [["Drill holes", c.drillHoles, "/master/drill-holes"], ["Lithologies", c.lithologies, "/master/lithologies"], ["Seams", c.seams, "/master/seams"]];
  const canRead = can("master.read");
  const used = c.jobOrders + c.drillHoles + c.lithologies + c.seams > 0;
  const contactCols: Array<Col<Contact> | false> = [
    { h: "Name", sort: (k) => k.fullName, render: (k) => <span className="row g8"><b className="t-sm w6">{k.fullName}</b>{k.isDefault && <Tag label="Default" tone="blue" />}</span> },
    !phone && { h: "Position", sort: (k) => k.position, render: (k) => k.position ?? "" }, { h: "Email", sort: (k) => k.email, render: (k) => k.email ?? "" }, !phone && { h: "Phone", sort: (k) => k.phone, render: (k) => k.phone ?? "" },
    // Make default is the last icon, so Edit and Archive line up in every row, with or without it
    write && { h: "Actions", render: (k) => <RowActions items={[{ label: `Edit ${k.fullName}`, icon: "pencil-simple", onClick: () => setCt(k) },
      { label: `Archive ${k.fullName}`, icon: "archive", onClick: () => dropContact.mutate(k) },
      { label: `Make ${k.fullName} the default contact`, icon: "star", onClick: () => makeDefault.mutate(k), show: !k.isDefault }]} /> }];
  return <div className="page">
    <PageHead crumb={[["Clients", "/clients"], [c.name]]} avatar={<Avatar name={c.name} size={64} logo={c.logoUrl} />} title={c.name}
      sub={<span className="row g8"><Tag label={c.code} /><Badge label={STATUS_LABEL[c.status]} tone={STATUS_TONE[c.status]} /></span>}
      actions={write && <>
        <Button icon="pencil-simple" id="edit-client" onClick={() => setForm(true)}>Edit</Button>
        <Button icon={c.status === "archived" ? "arrow-counter-clockwise" : "archive"} id="archive-client" onClick={() => (c.status === "archived" ? archive.mutate(undefined) : setArch(true))}>{c.status === "archived" ? "Restore" : "Archive"}</Button>
        <Button icon="trash" id="delete-client" disabled={used} why="Job orders or master data use this client. Archive it instead." onClick={() => setDel(true)}>Delete</Button></>} />
    <Card title="Master data"><div className="grid" style={{ gridTemplateColumns: phone ? "1fr" : "repeat(3, minmax(0, 1fr))", gap: 12 }}>
      {lists.map(([label, n, to]) => <div key={label} className="mcard" style={{ cursor: "default" }}><span className="t-sm c-sec">{label}</span>
        <div className="row between"><b className="t-h2">{n}</b>{canRead && <Link className="btn ghost md" to={`${to}?company=${c.id}`}>View list<Icon n="arrow-right" /></Link>}</div></div>)}</div></Card>
    <div className="grid" style={{ gridTemplateColumns: phone || window.innerWidth < 1100 ? "1fr" : "440px minmax(0, 1fr)", alignItems: "start" }}>
      <Card title="Properties"><div><KV k="Code"><span className="t-data">{c.code}</span></KV><KV k="Company code"><span className="t-data">{c.companyCode}</span>{c.companyCodeLocked ? " (locked)" : ""}</KV><KV k="Address">{c.address ?? "None"}</KV><KV k="Billing address">{c.billingAddress ?? "Same as address"}</KV>
        <KV k="Status">{STATUS_LABEL[c.status]}</KV><KV k="Created">{fmtDate(c.createdAt)}</KV><KV k="Job orders">{c.jobOrders}</KV><KV k="Total sample">{c.totalSample}</KV></div></Card>
      <Card title="Contacts" actions={write && <Button type="ghost" size="sm" icon="plus" id="add-contact" onClick={() => setCt("new")}>Add contact</Button>}>
        {c.contacts.length ? <Table rows={sortRows(c.contacts, contactCols, sort)} keyOf={(k) => k.id} cols={contactCols} sort={sort} onSort={onSort} />
          : <span className="t-sm c-mut">No contacts yet.</span>}
        <Note>The default contact is pre-filled as Attention on new job orders. The job order form adds and edits the same contacts.</Note></Card></div>
    {form && <ClientForm company={c} onClose={() => setForm(false)} />}
    {ct && <ContactForm companyId={c.id} contact={ct === "new" ? null : ct} first={!c.contacts.length} onClose={() => setCt(null)} />}
    {arch && <Confirm title={`Archive ${c.name}?`} text="It stays on its job orders and reports, but no new job order can pick it. You can restore it later." ok="Archive" busy={archive.isPending} onOk={() => archive.mutate(undefined)} onClose={() => setArch(false)} />}
    {del && <Confirm title={`Delete ${c.name}?`} text="Nothing uses this client, so it can be removed for good." ok="Delete" danger busy={remove.isPending} onOk={() => remove.mutate(undefined)} onClose={() => setDel(false)} />}
  </div>;
}

function ContactForm({ companyId, contact, first, onClose }: { companyId: string; contact: Contact | null; first: boolean; onClose: () => void }) {
  const [f, setF] = useState({ fullName: contact?.fullName ?? "", position: contact?.position ?? "", email: contact?.email ?? "", phone: contact?.phone ?? "", isDefault: contact?.isDefault ?? first });
  const [err, setErr] = useState<Record<string, string>>({});
  const save = useSave(() => contact ? api(`/contacts/${contact.id}`, { method: "PATCH", json: f }) : api(`/companies/${companyId}/contacts`, { method: "POST", json: f }),
    { keys: ["company"], done: contact ? "Contact saved" : `${f.fullName} added`, onDone: onClose, onField: (field, text) => setErr({ [field ?? "form"]: text }) });
  const submit = () => { if (!f.fullName.trim()) return setErr({ fullName: "Enter the contact's name." }); setErr({}); save.mutate(undefined); };
  const set = (p: Partial<typeof f>) => setF({ ...f, ...p });
  return <Dialog title={contact ? "Edit contact" : "Add contact"} onClose={onClose} phone={useIsPhone()}
    footer={<><Button onClick={onClose}>Cancel</Button><Button type="primary" id="ct-save" disabled={save.isPending} onClick={submit}>Save contact</Button></>}>
    <TextField id="ct-name" label="Name" req value={f.fullName} onChange={(v) => set({ fullName: v })} error={err.fullName ?? null} />
    <TextField label="Position" value={f.position} onChange={(v) => set({ position: v })} />
    <TextField label="Email" type="email" value={f.email} onChange={(v) => set({ email: v })} error={err.email ?? null} />
    <TextField label="Phone" value={f.phone} onChange={(v) => set({ phone: v })} />
    <Switch id="ct-def" on={f.isDefault} onChange={(v) => set({ isDefault: v })} label="Default contact (pre-fills Attention on new job orders)" />
    {err.form && <span className="help err">{err.form}</span>}
  </Dialog>;
}
