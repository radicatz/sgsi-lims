// Advanced search (Phase 5, slice B3; frames 08-Search-03-Advanced_search-01 to 06, Search_Screen_Plan.md section 6 with the owner edits S-1, S-4, S-5): "Searching for" Samples, Batches,
// Job orders or Results, Match all or any, condition rows, a Columns menu, CSV export, a notice above 500 rows, and Saved queries (mine and shared with me).
import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, ApiError } from "../../app/api";
import { useBreakpoint, useSession } from "../../app/session";
import { Alert, Badge, Button, Card, Check, Confirm, Dialog, Empty, Icon, Menu, PageHead, Pager, Select, Seg, Switch, Table, TextField, cx, sortRows, toast, useSort, type Col, todayLabel } from "../../components";
import { rememberRecord } from "./shared";

type FieldType = "text" | "number" | "date" | "choice";
interface FieldDef { id: string; label: string; type: FieldType; options: Array<[string, string]> | null; ops: Array<[string, string]>; show: boolean }
interface Fields { targets: Array<{ id: string; label: string; fields: FieldDef[] }>; resultField: boolean; bases: Array<[string, string]> }
interface Cond { key: number; field: string; op: string; value: string; value2: string; many: string[]; param: string; basis: string }
interface Def { target: string; match: "all" | "any"; conditions: Array<{ field: string; op: string; value?: string | string[]; param?: string; basis?: string }>; columns?: string[]; sort?: { col: string; dir: "asc" | "desc" } }
interface Saved { id: string; name: string; target: string; definition: Def; shared: boolean; owner: string }
interface Out { columns: Array<{ id: string; label: string; type: FieldType }>; rows: Array<{ link: string; cells: Record<string, string> }>; total: number; capped: boolean; limit: number }

const RESULT_OPS: Array<[string, string]> = [["gt", "greater than"], ["lt", "less than"], ["eq", "equals"], ["between", "between"]];
const dLong = (iso: string) => (iso ? new Date(`${iso.slice(0, 10)}T00:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "");
let seq = 1;
const blank = (field = ""): Cond => ({ key: seq++, field, op: "", value: "", value2: "", many: [], param: "", basis: "" });

export function AdvancedPage() {
  const bp = useBreakpoint(), phone = bp === "phone", desk = bp === "desktop", nav = useNavigate(), qc = useQueryClient(), { me } = useSession();
  const [sp] = useSearchParams(), loc = useLocation();
  // Close returns to where Advanced search was opened from (the results for a word, or the page the quick search was used on); opened directly, it returns to Search
  const back = (loc.state as { from?: string } | null)?.from ?? "/search";
  const fq = useQuery({ queryKey: ["adv-fields"], queryFn: () => api<Fields>("/search/advanced/fields"), staleTime: 300_000 });
  const sq = useQuery({ queryKey: ["saved-queries"], queryFn: () => api<{ mine: Saved[]; shared: Saved[] }>("/saved-queries") });
  const [target, setTarget] = useState("samples"), [match, setMatch] = useState<"all" | "any">("all"), [conds, setConds] = useState<Cond[]>([blank()]);
  const [out, setOut] = useState<Out | null>(null), [stale, setStale] = useState(false), [err, setErr] = useState(""), [cols, setCols] = useState<string[] | null>(null);
  const [page, setPage] = useState(1), [saveFor, setSaveFor] = useState<null | { id?: string; name: string; shared: boolean }>(null), [del, setDel] = useState<Saved | null>(null), [active, setActive] = useState<string | null>(null);
  const { sort, onSort } = useSort();
  const T = fq.data?.targets.find((t) => t.id === target);
  const fieldOf = (id: string): FieldDef | undefined => T?.fields.find((f) => f.id === id);
  const fieldOptions: Array<[string, string]> = [["", "Choose a field"], ...(T?.fields.map((f) => [f.id, f.label] as [string, string]) ?? []), ...(target === "samples" && fq.data?.resultField ? [["result", "Result"] as [string, string]] : [])];
  const opsOf = (c: Cond): Array<[string, string]> => (c.field === "result" ? RESULT_OPS : fieldOf(c.field)?.ops ?? []);
  const touch = () => setStale(true);

  const toDef = (): Def => ({
    target, match, ...(cols ? { columns: cols } : {}),
    conditions: conds.filter((c) => c.field && c.op).map((c) => ({
      field: c.field, op: c.op, ...(c.field === "result" ? { param: c.param, basis: c.basis || undefined } : {}),
      ...(c.op === "empty" ? {} : { value: c.op === "between" ? [c.value, c.value2] : c.op === "any" ? c.many : c.value }),
    })),
  });
  const fromDef = (d: Def) => {
    setTarget(d.target); setMatch(d.match); setCols(d.columns ?? null);
    setConds(d.conditions.length ? d.conditions.map((c) => ({ ...blank(c.field), op: c.op, param: c.param ?? "", basis: c.basis ?? "",
      value: Array.isArray(c.value) ? (c.value[0] ?? "") : c.value ?? "", value2: Array.isArray(c.value) ? (c.value[1] ?? "") : "", many: Array.isArray(c.value) ? c.value : [] })) : [blank()]);
  };
  const run = useMutation({
    mutationFn: (d: Def) => api<Out>("/search/advanced", { method: "POST", json: d }),
    onSuccess: (o) => { setOut(o); setStale(false); setErr(""); setPage(1); },
    onError: (e) => { setErr((e as ApiError).text ?? "The search could not run."); setOut(null); },
  });
  const doSearch = (d: Def = toDef()) => run.mutate(d);
  // a saved query from the address (?query=): fill and run
  const loaded = useRef<string | null>(null);
  useEffect(() => {
    const id = sp.get("query"); if (!id || !sq.data || loaded.current === id) return;
    const s = [...sq.data.mine, ...sq.data.shared].find((x) => x.id === id); if (!s) return;
    loaded.current = id; fromDef(s.definition); setActive(id); doSearch(s.definition);
  }, [sp, sq.data]); // eslint-disable-line react-hooks/exhaustive-deps

  const setCond = (k: number, p: Partial<Cond>) => { setConds((x) => x.map((c) => (c.key === k ? { ...c, ...p } : c))); touch(); };
  const onField = (c: Cond, field: string) => {
    const f = fieldOf(field), op = field === "result" ? "gt" : f?.ops[0]?.[0] ?? "";
    setCond(c.key, { field, op, value: "", value2: "", many: [], param: "", basis: "" });
  };
  const changeTarget = (t: string) => { setTarget(t); setConds([blank()]); setCols(null); setOut(null); setStale(false); setErr(""); setActive(null); };
  const clear = () => { setConds([blank()]); setOut(null); setStale(false); setErr(""); setActive(null); };

  const exp = async () => {
    try {
      const token = (JSON.parse(localStorage.getItem("sgsi.session") ?? "null") as { accessToken?: string } | null)?.accessToken;
      const res = await fetch("/api/search/advanced/export", { method: "POST", headers: { "content-type": "application/json", ...(token ? { authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify(toDef()) });
      if (!res.ok) throw new Error(((await res.json().catch(() => ({}))) as { text?: string }).text ?? "The file could not be made.");
      const u = URL.createObjectURL(await res.blob()), a = document.createElement("a");
      a.href = u; a.download = `search-${target}.csv`; a.click(); setTimeout(() => URL.revokeObjectURL(u), 2000);
    } catch (e) { toast((e as Error).message, "error"); }
  };

  const saveQ = useMutation({
    mutationFn: async (s: { id?: string; name: string; shared: boolean }) => (s.id ? api(`/saved-queries/${s.id}`, { method: "PATCH", json: { name: s.name, shared: s.shared } }) : api<{ id: string }>("/saved-queries", { method: "POST", json: { name: s.name, shared: s.shared, definition: toDef() } })),
    onSuccess: (r) => { setSaveFor(null); toast("Query saved"); qc.invalidateQueries({ queryKey: ["saved-queries"] }); const id = (r as { id?: string })?.id; if (id) setActive(id); },
    onError: (e) => toast((e as ApiError).text ?? "The query could not be saved.", "error"),
  });
  const delQ = useMutation({ mutationFn: (id: string) => api(`/saved-queries/${id}`, { method: "DELETE" }), onSuccess: () => { setDel(null); toast("Query deleted"); qc.invalidateQueries({ queryKey: ["saved-queries"] }); } });
  const dup = useMutation({ mutationFn: (s: Saved) => api("/saved-queries", { method: "POST", json: { name: `${s.name} (copy)`, shared: false, definition: s.definition } }), onSuccess: () => { toast("Query duplicated"); qc.invalidateQueries({ queryKey: ["saved-queries"] }); } });
  const openSaved = (s: Saved) => { fromDef(s.definition); setActive(s.id); doSearch(s.definition); };

  /* ---------- the query card ---------- */
  const valueInput = (c: Cond) => {
    const f = fieldOf(c.field);
    if (c.op === "empty") return <span className="t-sm c-mut grow">No value</span>;
    const t: FieldType = c.field === "result" ? "number" : f?.type ?? "text";
    const one = (v: string, set: (x: string) => void, ph?: string, id?: string) =>
      t === "choice" ? (
        <Select id={id} value={v} onChange={set} options={[["", "Choose"], ...(f?.options ?? [])]} />
      ) : (
        <div className="input"><input id={id} type={t === "date" ? "date" : "text"} inputMode={t === "number" ? "decimal" : undefined} value={v} placeholder={ph} aria-label={`${f?.label ?? "Result"} value`} onChange={(e) => set(e.target.value)} /></div>
      );
    if (c.op === "any") return (
      <span className="row g8 wrap grow">{(f?.options ?? []).map(([v, l]) => <Check key={v} on={c.many.includes(v)} onChange={(on) => setCond(c.key, { many: on ? [...c.many, v] : c.many.filter((x) => x !== v) })} label={l} />)}</span>
    );
    if (c.op === "between") return <span className="row g8 grow" style={{ flexWrap: "nowrap" }}>{one(c.value, (v) => setCond(c.key, { value: v }), "From")}<span className="c-mut">to</span>{one(c.value2, (v) => setCond(c.key, { value2: v }), "To")}</span>;
    return <span className="grow" style={{ minWidth: 0 }}>{one(c.value, (v) => setCond(c.key, { value: v }), t === "number" ? "10" : "Value", `cv-${c.key}`)}</span>;
  };
  const condRow = (c: Cond, i: number) => (
    <div key={c.key} className="cond-row" data-cond={i + 1}>
      <span className="cond-n">{i + 1}</span>
      <div className="cond-fields">
        <Select id={`cf-${c.key}`} value={c.field} onChange={(v) => onField(c, v)} options={fieldOptions} />
        {c.field === "result" && <div className="input" style={{ maxWidth: 110 }}><input aria-label="Parameter code" placeholder="ASH" value={c.param} onChange={(e) => setCond(c.key, { param: e.target.value.toUpperCase() })} /></div>}
        <Select id={`co-${c.key}`} value={c.op} onChange={(v) => setCond(c.key, { op: v, value: "", value2: "", many: [] })} options={c.field ? opsOf(c) : [["", "Comparison"]]} />
        {valueInput(c)}
        {c.field === "result" && <Select value={c.basis} onChange={(v) => setCond(c.key, { basis: v })} options={[["", "Any basis"], ...(fq.data?.bases ?? [])]} width={110} />}
      </div>
      <Button iconOnly icon="x" label={`Remove condition ${i + 1}`} onClick={() => { setConds((x) => (x.length > 1 ? x.filter((y) => y.key !== c.key) : [blank()])); touch(); }} />
    </div>
  );
  const queryCard = (
    <Card>
      <div className="row g12 wrap" style={{ alignItems: "flex-end" }}>
        <Select id="adv-target" label="Searching for" value={target} onChange={changeTarget} options={(fq.data?.targets ?? []).map((t) => [t.id, t.label] as [string, string])} width={200} />
        <div className="col g6"><span className="flabel">Match</span><Seg label="Match" items={[["all", "All"], ["any", "Any"]]} value={match} onChange={(v) => { setMatch(v); touch(); }} /></div>
      </div>
      <div className="col g12" id="adv-conds">{conds.map(condRow)}</div>
      <div className="row g8 wrap between">
        <Button type="tertiary" icon="plus" id="adv-add" onClick={() => { setConds((x) => [...x, blank()]); touch(); }}>Add condition</Button>
        <span className="row g8 wrap">
          <Button type="ghost" id="adv-clear" onClick={clear}>Clear all</Button>
          <Button icon="floppy-disk" id="adv-save" onClick={() => setSaveFor({ name: "", shared: false })}>Save query</Button>
          <Button type="primary" icon="magnifying-glass" id="adv-search" disabled={run.isPending} onClick={() => doSearch()}>Search</Button>
        </span>
      </div>
    </Card>
  );

  /* ---------- saved queries ---------- */
  const qrow = (s: Saved, own: boolean) => (
    <div key={s.id} className={cx("sq-row", active === s.id && "on")}>
      <button type="button" className="sq-open" onClick={() => openSaved(s)} data-sq={s.name}><span className="t-sm w5 ellip">{s.name}</span>{!own && <span className="t-cap c-mut ellip">{s.owner}</span>}</button>
      {s.shared && own && <span className="c-mut" title="Shared with staff"><Icon n="users" /></span>}
      <Menu label={`More for ${s.name}`} quiet items={own
        ? [{ label: "Rename", icon: "pencil-simple", onClick: () => setSaveFor({ id: s.id, name: s.name, shared: s.shared }) }, { label: "Duplicate", icon: "copy", onClick: () => dup.mutate(s) },
            { label: s.shared ? "Stop sharing" : "Share with staff", icon: "users", onClick: () => saveQ.mutate({ id: s.id, name: s.name, shared: !s.shared }) }, { label: "Delete", icon: "trash", danger: true, onClick: () => setDel(s) }]
        : [{ label: "Duplicate", icon: "copy", onClick: () => dup.mutate(s) }]} />
    </div>
  );
  const savedList = (
    <Card title="Saved queries" className="sq-card">
      <div className="col g8" id="sq-list">
        <span className="t-over">My queries</span>
        {(sq.data?.mine ?? []).map((s) => qrow(s, true))}
        {sq.data && sq.data.mine.length === 0 && <span className="t-cap c-mut">None yet. Build a query and press Save query.</span>}
        <span className="t-over" style={{ marginTop: 8 }}>Shared with me</span>
        {(sq.data?.shared ?? []).map((s) => qrow(s, false))}
        {sq.data && sq.data.shared.length === 0 && <span className="t-cap c-mut">Nothing shared yet.</span>}
      </div>
    </Card>
  );

  /* ---------- results ---------- */
  const shown = out?.columns ?? [];
  const allFields = T?.fields ?? [];
  const toggleCol = (id: string, on: boolean) => {
    const cur = cols ?? shown.map((c) => c.id); const next = on ? [...cur, id] : cur.filter((x) => x !== id);
    if (next.length === 0) return;
    setCols(next);
    if (out) doSearch({ ...toDef(), columns: next });
  };
  const tcols: Array<Col<Out["rows"][number]>> = useMemo(() => (out?.columns ?? []).map((c, i) => ({
    h: c.label, fit: i > 0 || undefined, fill: i === 0 || undefined,
    sort: (r: Out["rows"][number]) => (c.type === "number" ? (r.cells[c.id] === "" ? null : Number(r.cells[c.id])) : r.cells[c.id] ?? ""),
    render: (r: Out["rows"][number]) => {
      const v = r.cells[c.id] ?? "";
      if (c.type === "date") return <span className="t-sm">{dLong(v)}</span>;
      if (c.type === "choice") { const o = allFields.find((f) => f.id === c.id)?.options?.find((x) => x[0] === v); return <Badge sm label={o?.[1] ?? v} tone="grey" />; }
      return c.type === "number" ? <span className="t-data">{v}</span> : i === 0 ? <b className="t-data-b c-head">{v}</b> : <span className="t-sm">{v}</span>;
    },
  })), [out, allFields]);
  const sorted = useMemo(() => (out ? sortRows(out.rows, tcols, sort) : []), [out, tcols, sort]);
  const per = 25, rows = sorted.slice((page - 1) * per, page * per);
  const open = (r: Out["rows"][number]) => { if (me) rememberRecord(me.id, { title: r.cells[out!.columns[0]!.id] ?? "", link: r.link, type: target === "orders" ? "orders" : target === "batches" ? "batches" : "samples" }); nav(r.link); };
  const resultsCard = out && (
    <Card title={`${out.total.toLocaleString("en-US")} ${out.total === 1 ? (T?.label ?? "").replace(/s$/, "").toLowerCase() : (T?.label ?? "").toLowerCase()}`} actions={
      <>
        <ColumnsMenu fields={allFields} chosen={cols ?? shown.map((c) => c.id)} onToggle={toggleCol} hidden={phone} />
        <Button icon="download-simple" id="adv-export" onClick={exp}>{phone ? "Export" : "Export CSV"}</Button>
      </>}>
      {stale && <Alert tone="info" title="Out of date, search again" text="The conditions changed after this search." />}
      {out.capped && <Alert tone="info" title={`Showing the first ${out.limit} of ${out.total.toLocaleString("en-US")}`} text="Narrow the conditions, or export to get every row." />}
      {out.total === 0 ? <Empty icon="magnifying-glass" title="Nothing matches" text="Change a condition and search again." /> : phone ? (
        <div className="col" id="adv-cards">{rows.map((r, i) => <PhoneRow key={i} r={r} cols={out.columns} fields={allFields} onOpen={open} />)}</div>
      ) : <Table cols={tcols} rows={rows} keyOf={(r) => r.link + (r.cells[out.columns[0]!.id] ?? "") + (r.cells[out.columns[1]?.id ?? ""] ?? "")} onRow={open} sort={sort} onSort={onSort} />}
      {out.rows.length > per && <Pager page={page} pages={Math.ceil(out.rows.length / per)} total={out.rows.length} from={(page - 1) * per + 1} to={Math.min(page * per, out.rows.length)} onPage={setPage} compact={phone} />}
    </Card>
  );

  const savedSelect = !desk && (
    <Select id="sq-select" label="Saved queries" value={active ?? ""} onChange={(v) => { const s = [...(sq.data?.mine ?? []), ...(sq.data?.shared ?? [])].find((x) => x.id === v); if (s) openSaved(s); else clear(); }}
      options={[["", "Choose a saved query"], ...(sq.data?.mine ?? []).map((s) => [s.id, s.name] as [string, string]), ...(sq.data?.shared ?? []).map((s) => [s.id, `${s.name} (${s.owner})`] as [string, string])]} />
  );
  return (
    <div className="page">
      <PageHead overline={todayLabel()} title="Advanced search" actions={<Button size={phone ? "touch" : "lg"} icon="x" id="adv-close" onClick={() => nav(back)}>Close</Button>} />
      {err && <Alert tone="error" title={err} />}
      {desk ? <div className="adv-cols"><div className="sq-col">{savedList}</div><div className="col g16" style={{ minWidth: 0 }}>{queryCard}{resultsCard ?? <span className="t-sm c-mut" id="adv-empty">Build a query, then press Search.</span>}</div></div>
        : <div className="col g16">{savedSelect}{queryCard}{resultsCard ?? <span className="t-sm c-mut" id="adv-empty">Build a query, then press Search.</span>}</div>}
      {saveFor && (
        <Dialog title={saveFor.id ? "Rename query" : "Save query"} sub={saveFor.id ? undefined : desk ? "Saved queries appear on the left and can be run again." : "Saved queries appear in the list above and can be run again."} size="md" phone={phone} onClose={() => setSaveFor(null)} footer={<><Button onClick={() => setSaveFor(null)}>Cancel</Button><Button type="primary" id="sq-save" disabled={!saveFor.name.trim() || saveQ.isPending} onClick={() => saveQ.mutate(saveFor)}>Save</Button></>}>
          <TextField id="sq-name" label="Name" req value={saveFor.name} onChange={(v) => setSaveFor({ ...saveFor, name: v })} placeholder="High-ash samples" />
          <Switch id="sq-share" on={saveFor.shared} onChange={(v) => setSaveFor({ ...saveFor, shared: v })} label="Share with staff (they can run and duplicate it)" />
        </Dialog>
      )}
      {del && <Confirm title={`Delete ${del.name}?`} text="The saved query is removed. Searches already run stay as they are." ok="Delete" danger busy={delQ.isPending} onOk={() => delQ.mutate(del.id)} onClose={() => setDel(null)} />}
    </div>
  );
}

/** The Columns popover (frame 04-Columns_menu): a checkbox per field; the page keeps at least one column. */
function ColumnsMenu({ fields, chosen, onToggle, hidden }: { fields: FieldDef[]; chosen: string[]; onToggle: (id: string, on: boolean) => void; hidden?: boolean }) {
  const [open, setOpen] = useState(false), ref = useRef<HTMLSpanElement>(null);
  useEffect(() => { const f = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); }; document.addEventListener("mousedown", f); return () => document.removeEventListener("mousedown", f); }, []);
  if (hidden) return null;
  return (
    <span ref={ref} style={{ position: "relative" }}>
      <Button icon="columns" trail="caret-down" id="adv-columns" onClick={() => setOpen(!open)}>Columns</Button>
      {open && <div className="col-menu" id="adv-col-menu">{fields.map((f) => <Check key={f.id} on={chosen.includes(f.id)} onChange={(on) => onToggle(f.id, on)} label={f.label} />)}</div>}
    </span>
  );
}

/** A result on the phone (frame Phone-08-Search-03-Advanced_search-02-Sample_query): a list row, not a card. The first column and the status on the top line; the other
 * text columns under it; number and date columns last, each with its label. Every value is its own text (no joined separators). */
function PhoneRow({ r, cols, fields, onOpen }: { r: Out["rows"][number]; cols: Out["columns"]; fields: FieldDef[]; onOpen: (r: Out["rows"][number]) => void }) {
  const [first, ...rest] = cols, status = rest.find((c) => c.type === "choice");
  const texts = rest.filter((c) => c.type === "text" && r.cells[c.id]), facts = rest.filter((c) => (c.type === "number" || c.type === "date") && r.cells[c.id]);
  const st = status && fields.find((f) => f.id === status.id)?.options?.find((x) => x[0] === r.cells[status.id]);
  return (
    <button type="button" className="adv-row" onClick={() => onOpen(r)}>
      <span className="row g8" style={{ flexWrap: "nowrap", alignItems: "center" }}>
        <b className="t-data-b c-head grow ellip">{first ? r.cells[first.id] : ""}</b>
        {status && r.cells[status.id] && <Badge sm label={st?.[1] ?? r.cells[status.id]!} tone="grey" />}
      </span>
      {texts.length > 0 && <span className="row g12 t-cap c-sec wrap">{texts.map((c) => <span key={c.id}>{r.cells[c.id]}</span>)}</span>}
      {facts.length > 0 && <span className="row g12 t-cap c-sec wrap">{facts.map((c) => <span key={c.id}>{c.label} {c.type === "date" ? dLong(r.cells[c.id] ?? "") : r.cells[c.id]}</span>)}</span>}
    </button>
  );
}
