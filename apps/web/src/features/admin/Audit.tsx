// Audit log (Phase 5, slice C2; frames 15-Audit_log-01 to 04, Admin_Screen_Plan.md section 5, Phase5_Build_Design.md 12.3): every change the lab's tables record, read only.
// Filters above the card (Nov 24 rule) with the Search label; a row opens its before and after; Export CSV; opened from a link with a removable chip for the record or the user.
// Desktop: When, User, Action, Record, Changes. Tablet: When, Record, Action and a caret (the user moves into the open block). Phone: cards, and the filters in a sheet.
import { Fragment, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../app/api";
import { useBreakpoint, useSession } from "../../app/session";
import { Avatar, Button, Card, Dialog, Empty, Icon, PageHead, Pager, Search, Select, cx, toast } from "../../components";
import { Val, whenText } from "../orders/History";

interface Change { field: string; before: string | null; after: string | null }
interface Row {
  id: string; at: string; user: { id: string | null; name: string | null }; action: string; actionCode: string; type: string; record: string; recordSub: string | null;
  link: { to: string; need: string } | null; summary: string; changes: Change[];
}
interface Page { total: number; page: number; pages: number; per: number; items: Row[]; recordLabel?: string | null }
interface Options { users: Array<{ id: string; name: string }>; types: string[]; actions: Array<[string, string]> }

const RANGES: Array<[string, string]> = [["today", "Today"], ["7d", "Last 7 days"], ["30d", "Last 30 days"], ["all", "All time"], ["custom", "Custom range"]];
const TZ = "Asia/Makassar";
const ymd = (d: Date) => d.toLocaleDateString("en-CA", { timeZone: TZ });
const back = (days: number) => ymd(new Date(Date.now() - days * 86_400_000));
function span(range: string, from: string, to: string): { from: string; to: string } {
  if (range === "custom") return { from: from || back(30), to: to || back(0) };
  if (range === "all") return { from: "2020-01-01", to: back(0) };
  return { from: back(range === "today" ? 0 : range === "30d" ? 29 : 6), to: back(0) };
}

/** The log of one person or one record is looked at over all time (frame 03 Filtered_by_record), so a link into the log opens on All time. */
export function AuditPage() {
  const bp = useBreakpoint(), phone = bp === "phone", tablet = bp === "tablet", { can } = useSession();
  const [sp, setSp] = useSearchParams();
  const get = (k: string) => sp.get(k) ?? "";
  const linked = !!(get("record") || get("user"));
  const range = get("range") || (linked ? "all" : "7d"), page = Number(get("page") || "1") || 1;
  const set = (p: Record<string, string>) => { const n = new URLSearchParams(sp); for (const [k, v] of Object.entries(p)) { if (v) n.set(k, v); else n.delete(k); } if (!("page" in p)) n.delete("page"); setSp(n, { replace: true }); };
  const [q, setQ] = useState(get("q")), [sheet, setSheet] = useState(false), [open, setOpen] = useState<string | null>(null);
  const { from, to } = span(range, get("from"), get("to"));
  const params = new URLSearchParams({ from, to, page: String(page) });
  for (const k of ["user", "type", "action", "record", "q"]) if (get(k)) params.set(k, get(k));
  const opts = useQuery({ queryKey: ["audit-options"], queryFn: () => api<Options>("/audit/options"), staleTime: 300_000 });
  const data = useQuery({ queryKey: ["audit", params.toString()], queryFn: () => api<Page>(`/audit?${params}`), placeholderData: (p) => p });
  const userName = opts.data?.users.find((u) => u.id === get("user"))?.name;
  const chips: Array<[string, string, string]> = [];
  if (get("record")) chips.push(["record", "Record", data.data?.recordLabel ?? "this record"]);
  if (get("user")) chips.push(["user", "User", userName ?? "this user"]);

  const exp = async () => {
    try {
      const token = (JSON.parse(localStorage.getItem("sgsi.session") ?? "null") as { accessToken?: string } | null)?.accessToken;
      const p = new URLSearchParams(params); p.delete("page");
      const res = await fetch(`/api/audit/export?${p}`, { headers: token ? { authorization: `Bearer ${token}` } : {} });
      if (!res.ok) throw new Error("The file could not be made.");
      const u = URL.createObjectURL(await res.blob()), a = document.createElement("a");
      a.href = u; a.download = "audit-log.csv"; a.click(); setTimeout(() => URL.revokeObjectURL(u), 2000);
      toast("Audit log exported");
    } catch (e) { toast((e as Error).message, "error"); }
  };

  const typeOpts: Array<[string, string]> = [["", "All types"], ...(opts.data?.types ?? []).map((t) => [t, t] as [string, string])];
  const actOpts: Array<[string, string]> = [["", "All actions"], ...(opts.data?.actions ?? [])];
  const userOpts: Array<[string, string]> = [["", "All users"], ...(opts.data?.users ?? []).map((u) => [u.id, u.name] as [string, string])];
  const dateField = <Select id="au-range" label="Date" value={range} onChange={(v) => set({ range: v === "7d" && !linked ? "" : v })} options={RANGES} width={phone ? "100%" : 170} />;
  const customDates = range === "custom" && (
    <span className="row g8" style={{ alignItems: "flex-end" }}>
      <label className="col g6"><span className="flabel">From</span><span className="input"><input id="au-from" type="date" value={get("from")} max={to} onChange={(e) => set({ from: e.target.value })} /></span></label>
      <label className="col g6"><span className="flabel">To</span><span className="input"><input id="au-to" type="date" value={get("to")} min={from} onChange={(e) => set({ to: e.target.value })} /></span></label>
    </span>
  );
  const filters = (
    <>
      {dateField}
      {customDates}
      <Select id="au-user" label="User" value={get("user")} onChange={(v) => set({ user: v })} options={userOpts} width={phone ? "100%" : 190} />
      <Select id="au-type" label="Record type" value={get("type")} onChange={(v) => set({ type: v })} options={typeOpts} width={phone ? "100%" : 170} />
      <Select id="au-action" label="Action" value={get("action")} onChange={(v) => set({ action: v })} options={actOpts} width={phone ? "100%" : 170} />
    </>
  );
  const active = ["user", "type", "action"].filter((k) => get(k)).length + (range !== (linked ? "all" : "7d") ? 1 : 0);
  const search = <Search id="au-q" label="Search" value={q} onChange={(v) => { setQ(v); set({ q: v }); }} placeholder="Search record ID" width={phone ? "100%" : 260} />;

  const d = data.data, rows = d?.items ?? [];
  const more = (r: Row) => r.changes.length > 0;
  const toggle = (r: Row) => more(r) && setOpen(open === r.id ? null : r.id);
  const who = (r: Row, cap?: boolean) => (
    <span className="row g8" style={{ flexWrap: "nowrap", minWidth: 0 }}>
      {r.user.name && <Avatar name={r.user.name} size={24} />}
      <span className={cx(cap ? "t-cap c-sec" : "t-sm c-for", "ellip")}>{r.user.name ?? "System"}</span>
    </span>
  );
  const rec = (r: Row) => {
    const text = <span className={cx("t-data", r.link && can(r.link.need) ? "c-act" : "c-for", "ellip")}>{r.record}</span>;
    return (
      <span className="col" style={{ gap: 0, minWidth: 0 }}>
        <span className="t-cap c-mut">{r.type}</span>
        {r.link && can(r.link.need) ? <Link to={r.link.to} onClick={(e) => e.stopPropagation()} className="ellip">{text}</Link> : text}
        {r.recordSub && <span className="t-cap c-mut ellip">{r.recordSub}</span>}
      </span>
    );
  };
  const diff = (r: Row, withUser?: boolean) => (
    <div className="hist-x">
      {withUser && who(r)}
      {phone ? r.changes.map((c, i) => (
        <div key={i} className="col" style={{ gap: 2 }}>
          <span className="t-cap w5 c-sec">{c.field}</span>
          <span className="row g6 wrap">{c.before !== null && <><Val v={c.before} /><Icon n="arrow-right" /></>}<Val v={c.after} after /></span>
        </div>
      )) : (
        <div className="hist-grid">
          <span className="t-cap w6 c-sec">Field</span><span className="t-cap w6 c-sec">Before</span><span className="t-cap w6 c-sec">After</span>
          {r.changes.map((c, i) => (
            <Fragment key={i}>
              <span className="t-sm w5 c-head">{c.field}</span>
              <span className={c.before !== null ? "au-before" : undefined}><Val v={c.before} /></span>
              <Val v={c.after} after />
            </Fragment>
          ))}
        </div>
      )}
      <span className="t-cap c-mut">{r.action} by {r.user.name ?? "the system"}.</span>
    </div>
  );
  const caret = (r: Row) => <Icon n={open === r.id ? "caret-up" : "caret-down"} />;

  const body = !d ? <span className="t-sm c-mut">Loading the log…</span> : rows.length === 0 ? (
    <Empty icon="clock-counter-clockwise" title="Nothing in this log" text="Change the dates or the filters. The log is never emptied." />
  ) : phone ? (
    <div className="col g10" id="au-cards">
      {rows.map((r) => (
        <button key={r.id} type="button" className="hcard" aria-expanded={more(r) ? open === r.id : undefined} onClick={() => toggle(r)}>
          <span className="row between g8" style={{ flexWrap: "nowrap" }}><b className="t-sm w6 c-head">{r.action}</b><span className="t-cap c-mut nowrap">{whenText(r.at, true)}</span></span>
          {rec(r)}
          {who(r, true)}
          {open === r.id && diff(r)}
        </button>
      ))}
    </div>
  ) : (
    <div className="tblwrap">
      <table className="tbl htbl" id="au-table">
        <thead>
          {tablet ? (
            <tr><th style={{ width: 130 }}>When</th><th>Record</th><th style={{ width: 150 }}>Action</th><th style={{ width: 56 }} aria-label="Changes" /></tr>
          ) : (
            <tr><th style={{ width: 150 }}>When</th><th style={{ width: 200 }}>User</th><th style={{ width: 150 }}>Action</th><th>Record</th><th style={{ width: 170 }}>Changes</th></tr>
          )}
        </thead>
        <tbody>
          {rows.map((r) => (
            <Fragment key={r.id}>
              <tr className={cx(more(r) && "click")} onClick={() => toggle(r)} data-action={r.actionCode}>
                <td className="t-sm c-sec nowrap">{whenText(r.at, tablet)}</td>
                {!tablet && <td>{who(r)}</td>}
                {tablet && <td style={{ maxWidth: 0 }}>{rec(r)}</td>}
                <td className="t-sm w5 c-head">{r.action}</td>
                {!tablet && <td style={{ maxWidth: 0 }}>{rec(r)}</td>}
                {tablet ? (
                  <td>{more(r) && <Button iconOnly size="touch" type="ghost" icon={open === r.id ? "caret-up" : "caret-down"} label={`${open === r.id ? "Hide" : "Show"} the changes`} onClick={(e) => { e.stopPropagation(); toggle(r); }} />}</td>
                ) : (
                  <td>{more(r) ? <span className="row g6 t-sm c-sec" aria-expanded={open === r.id}>{r.summary}<span className="c-mut">{caret(r)}</span></span> : <span className="t-sm c-mut">{r.summary || "—"}</span>}</td>
                )}
              </tr>
              {open === r.id && <tr className="xrow"><td colSpan={tablet ? 4 : 5}>{diff(r, tablet)}</td></tr>}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
  return (
    <div className="page">
      <PageHead overline="ADMIN" title="Audit log" actions={<Button size={phone ? "touch" : "lg"} icon="download-simple" id="au-export" onClick={exp}>Export CSV</Button>} />
      {phone ? (
        <div className="row g8" style={{ alignItems: "flex-end", flexWrap: "nowrap" }}>
          {search}
          <Button size="lg" icon="funnel" id="au-filters" onClick={() => setSheet(true)}>{active ? `Filters ${active}` : "Filters"}</Button>
        </div>
      ) : (
        <div className="row g12 wrap" style={{ alignItems: "flex-end" }}>{search}{filters}</div>
      )}
      {chips.length > 0 && (
        <div className="row g8 wrap" id="au-chips" style={{ alignItems: "center" }}>
          {chips.map(([k, label, text]) => (
            <span key={k} className="chip on" data-chip={k}>{label}: {text}<span className="n">{d?.total ?? ""}</span></span>
          ))}
          <button type="button" className="linkbtn" id="au-clear" onClick={() => set({ record: "", user: "" })}>Clear</button>
        </div>
      )}
      <Card>
        {body}
        {d && d.pages > 1 && <Pager page={d.page} pages={d.pages} total={d.total} from={(d.page - 1) * d.per + 1} to={Math.min(d.page * d.per, d.total)} onPage={(p) => set({ page: String(p) })} compact={phone} />}
        {d && d.pages <= 1 && d.total > 0 && <span className="t-cap c-mut">Showing {d.total} of {d.total}</span>}
      </Card>
      {sheet && (
        <Dialog title="Filters" phone onClose={() => setSheet(false)} footer={<><Button onClick={() => { set({ range: "", user: "", type: "", action: "", from: "", to: "" }); setSheet(false); }}>Clear all</Button><Button type="primary" onClick={() => setSheet(false)}>Done</Button></>}>
          {filters}
        </Dialog>
      )}
    </div>
  );
}
