// My work (FigCraft module 01 My_work; My_Work_Screen_Plan.md sections 4 to 7): the landing page of the staff roles that act in the system. The overview shows what the person
// started and left, the queues in flow order with their oldest waiting item, and the lab's recent hand-offs. Opening a queue lists its items; CoAs to send can be ticked for a zip.
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { api, ApiError } from "../../app/api";
import { useBreakpoint } from "../../app/session";
import { Avatar, Badge, Button, Card, Check, Dialog, Empty, Icon, PageHead, Search, Select, Table, Tabs, cx, toast, type Col } from "../../components";
import { STATUS_LABEL, STATUS_TONE } from "../batches/shared";

export interface WorkData {
  total: number; today: string;
  queues: Array<{ id: string; label: string; count: number; overdue: number; oldestSince: string | null }>;
  wip: Array<{ id: string; kind: string; number: string; state: string; startedAt: string | null; company: string; link: string }>;
  recent: Array<{ action: string; at: string | null; number: string; by: string | null; link: string }>;
}
interface QueueRow {
  id: string; since: string | null; number: string; numberSub: string | null; orderNo: string; company: string; samples: string | null;
  status: string | null; deadline: string | null; note: string | null; link: string;
}
interface QueueData { id: string; label: string; action: string; today: string; total: number; bulk: boolean; rows: QueueRow[] }

/** "4 h" under a day, "3 d" after; calendar time (My work plan open point 4). */
export function waiting(since: string | null, now = Date.now()): string {
  if (!since) return "";
  const h = Math.max(0, (now - new Date(since).getTime()) / 3_600_000);
  return h < 1 ? "Just now" : h < 24 ? `${Math.floor(h)} h` : `${Math.floor(h / 24)} d`;
}
const longDate = () => new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Makassar" }).toUpperCase();
const dShort = (d: string | null) => (d ? new Date(`${d.slice(0, 10)}T00:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "");
const dDayMonth = (d: string | null) => (d ? new Date(`${d.slice(0, 10)}T00:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : "");

/** The work counts, shared with the sidebar's count pill on My work. */
export const useWork = (enabled = true) =>
  useQuery({ queryKey: ["work"], queryFn: () => api<WorkData>("/work"), enabled, staleTime: 30_000, refetchInterval: 120_000 });

/** The glyph of each queue (frames 01-My_work-01, Queue card). */
export const QUEUE_ICON: Record<string, string> = {
  receive: "package", awaiting: "hourglass", preparation: "flask", entry: "pencil-simple-line", roa: "upload-simple", "coa-generate": "certificate", "coa-send": "paper-plane-tilt",
};
const WIP_ICON: Record<string, string> = { reception: "package", preparation: "flask", analysis: "pencil-simple-line", coa: "file-text" };
/** A batch hand-off as a sentence: "Dedi Kurniawan confirmed reception of B-2026-0421". */
const VERB: Record<string, string> = {
  "Batch created": "added batch", "Reception confirmed": "confirmed reception of", "Preparation finished": "finished preparation of", "Analysis started": "started analysis of",
  "Analysis finished": "finished analysis of", "Batch completed": "completed", "Labels printed": "printed labels for", "Arrival undone": "undid an arrival in",
};
const shortName = (n: string | null) => (n ?? "Someone").split(",")[0]!.trim();
/** "35 min ago", "2 h ago", "Yesterday", "3 d ago". */
export function agoText(iso: string | null, now = Date.now()): string {
  if (!iso) return "";
  const m = Math.max(0, (now - new Date(iso).getTime()) / 60_000);
  return m < 1 ? "Just now" : m < 60 ? `${Math.floor(m)} min ago` : m < 1440 ? `${Math.floor(m / 60)} h ago` : m < 2880 ? "Yesterday" : `${Math.floor(m / 1440)} d ago`;
}

function Activity({ rows }: { rows: WorkData["recent"] }) {
  return (
    <div className="act-list" id="work-activity">
      {rows.map((r, i) => (
        <Link key={i} to={r.link} className="act-item">
          <Avatar name={shortName(r.by)} size={28} />
          <span className="col" style={{ gap: 0, minWidth: 0 }}>
            <span className="t-sm c-for">{shortName(r.by)} {VERB[r.action] ?? r.action.toLowerCase()} {r.number}</span>
            <span className="t-cap c-mut">{agoText(r.at)}</span>
          </span>
        </Link>
      ))}
      {rows.length === 0 && <span className="t-sm c-mut">Nothing yet.</span>}
    </div>
  );
}

/* ---------- overview ---------- */
export function WorkPage() {
  const q = useWork(), bp = useBreakpoint(), phone = bp === "phone", nav = useNavigate();
  const [all, setAll] = useState(false), [sheet, setSheet] = useState(false);
  const d = q.data;
  const open = d?.queues.filter((x) => x.count > 0) ?? [];
  const recent = d ? (all ? d.recent : d.recent.slice(0, 8)) : [];
  const wip = d && d.wip.length > 0 && (
    <section className="col g8" id="work-wip">
      {phone ? null : <h2 className="t-h3">Work in progress</h2>}
      {d.wip.map((w) => (
        <div key={`${w.kind}-${w.id}`} className="wip-row">
          {!phone && <span className="wip-ic"><Icon n={WIP_ICON[w.kind] ?? "file-text"} s={16} /></span>}
          <span className="col grow" style={{ gap: 0, minWidth: 0 }}>
            <span className="row g6" style={{ flexWrap: "nowrap", minWidth: 0 }}><b className="t-sm w6 c-for nowrap">{w.number}</b><span className="t-sm w5 c-sec ellip">{w.state}</span></span>
            <span className="row g6 t-cap c-sec" style={{ flexWrap: phone ? "wrap" : "nowrap", minWidth: 0 }}><span className="nowrap">Started {agoText(w.startedAt)}</span>{!phone && <span className="ellip">{w.company}</span>}</span>
          </span>
          <Button type={phone ? "primary" : "secondary"} size={phone ? "lg" : "md"} id={`wip-${w.number}`} onClick={() => nav(w.link)}>Continue</Button>
        </div>
      ))}
    </section>
  );
  const queues = open.length === 0 ? (
    <Card><Empty icon="check-circle" title="All caught up" text="New work appears here as soon as it reaches you." action={<Button type="primary" onClick={() => nav("/")}>Open the Dashboard</Button>} /></Card>
  ) : (
    <section className="col g12">
      <h2 className="t-h3">My queues</h2>
      <div className={phone ? "col g8" : "queue-grid"} id="work-queues">
        {open.map((x) => phone ? (
          <Link key={x.id} to={`/work/${x.id}`} id={`queue-${x.id}`} className="queue-row">
            <Icon n={QUEUE_ICON[x.id] ?? "tray"} s={16} />
            <span className="col grow" style={{ gap: 0, minWidth: 0 }}>
              <span className="t-sm w5 c-for">{x.label}</span>
              <span className="row g6 t-cap c-mut" style={{ flexWrap: "nowrap" }}>Oldest {waiting(x.oldestSince)}{x.overdue > 0 && <span className="row g4 c-err t-cap w5"><Icon n="warning" />{x.overdue} past due</span>}</span>
            </span>
            <b className="qn">{x.count}</b>
            <Icon n="caret-right" />
          </Link>
        ) : (
          <Link key={x.id} to={`/work/${x.id}`} id={`queue-${x.id}`} className={cx("queue-card", x.overdue > 0 && "late")}>
            <span className="row g10" style={{ flexWrap: "nowrap" }}>
              <span className="q-ic"><Icon n={QUEUE_ICON[x.id] ?? "tray"} s={20} /></span>
              <b className="t-body w6 c-head grow">{x.label}</b>
              <Icon n="caret-right" className="c-mut" />
            </span>
            <span className="qn">{x.count}</span>
            <span className="t-cap c-sec">Oldest waiting {waiting(x.oldestSince)}</span>
            {x.overdue > 0 && <span className="row g4 t-cap w5 c-err"><Icon n="warning" />{x.overdue} past due</span>}
          </Link>
        ))}
        {phone && (
          <button type="button" className="queue-row" id="work-activity-open" style={{ marginTop: 8 }} onClick={() => setSheet(true)}>
            <Icon n="clock-counter-clockwise" s={16} /><span className="t-sm w5 c-for grow">Recent activity</span><Icon n="caret-right" />
          </button>
        )}
      </div>
    </section>
  );
  return (
    <div className="page fill">
      <PageHead overline={phone ? "MY WORK" : longDate()} title="My work" />
      {!d ? (
        <Card><Empty icon="check-square-offset" title="Loading your work" /></Card>
      ) : d.queues.length === 0 ? (
        <Card><Empty icon="check-square-offset" title="No queues for your role" text="Your role has no work queues. The Dashboard shows the lab." action={<Button onClick={() => nav("/")}>Go to Dashboard</Button>} /></Card>
      ) : phone ? (
        <div className="col g16">
          {wip && <Card title="Work in progress">{wip}</Card>}
          {queues}
          {sheet && <Dialog title="Recent activity" phone size="sm" onClose={() => setSheet(false)}><Activity rows={d.recent} /></Dialog>}
        </div>
      ) : (
        <div className="work-cols">
          <div className="col g20" style={{ minWidth: 0 }}>
            {wip}
            {queues}
          </div>
          <section className="card act-card" id="work-recent">
            <div className="card-head"><h2 className="t-h3">Recent activity</h2></div>
            <Activity rows={recent} />
            {d.recent.length > 8 && <div className="row"><Button type="ghost" id="work-activity-all" onClick={() => setAll(!all)}>{all ? "Show fewer" : "View all"}</Button></div>}
          </section>
        </div>
      )}
    </div>
  );
}

/* ---------- one queue ---------- */
export function QueuePage() {
  const { queue = "" } = useParams(), nav = useNavigate(), bp = useBreakpoint(), phone = bp === "phone", desk = bp === "desktop";
  const [text, setText] = useState(""), [dq, setDq] = useState(""), [late, setLate] = useState(false), [company, setCompany] = useState(""), [picked, setPicked] = useState<string[]>([]), [busy, setBusy] = useState(false);
  useEffect(() => { const t = setTimeout(() => setDq(text), 250); return () => clearTimeout(t); }, [text]);
  useEffect(() => setPicked([]), [queue, dq, late, company]);
  useEffect(() => setCompany(""), [queue]);
  const work = useWork();
  const p = new URLSearchParams({ ...(dq ? { q: dq } : {}), ...(late ? { overdue: "1" } : {}) });
  const q = useQuery({ queryKey: ["work", queue, p.toString()], queryFn: () => api<QueueData>(`/work/${queue}?${p}`), placeholderData: (x) => x, retry: false });
  const d = q.data;
  if (q.error && (q.error as ApiError).status === 403)
    return <div className="page"><Card><Empty icon="lock-simple" title="This queue is not part of your work" action={<Button onClick={() => nav("/work")}>Back to My work</Button>} /></Card></div>;
  const all = d?.rows ?? [], today = d?.today ?? "";
  const rows = company ? all.filter((r) => r.company === company) : all;
  const companies: Array<[string, string]> = [["", "All companies"], ...[...new Set(all.map((r) => r.company))].sort().map((c) => [c, c] as [string, string])];
  const isLate = (r: QueueRow) => !!r.deadline && r.deadline < today;
  const statusBadge = (r: QueueRow) => r.status === "published"
    ? <Badge sm label="Published" tone="purple" />
    : r.status ? <Badge sm label={STATUS_LABEL(r.status)} tone={STATUS_TONE(r.status)} /> : null;
  const go = (r: QueueRow) => nav(r.link);
  const toggle = (id: string) => setPicked((x) => (x.includes(id) ? x.filter((y) => y !== id) : [...x, id]));
  const zip = async () => {
    setBusy(true);
    try {
      const token = (JSON.parse(localStorage.getItem("sgsi.session") ?? "null") as { accessToken?: string } | null)?.accessToken;
      const res = await fetch("/api/reports/download", { method: "POST", headers: { "content-type": "application/json", ...(token ? { authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify({ kind: "coa", ids: picked }) });
      if (!res.ok) throw new Error(((await res.json().catch(() => ({}))) as { text?: string }).text ?? "The files could not be downloaded.");
      const u = URL.createObjectURL(await res.blob()), a = document.createElement("a");
      a.href = u; a.download = "CoAs.zip"; a.click(); setTimeout(() => URL.revokeObjectURL(u), 2000);
      toast(`${picked.length} ${picked.length === 1 ? "file" : "files"} downloaded`); setPicked([]);
    } catch (e) { toast((e as Error).message, "error"); } finally { setBusy(false); }
  };
  const cols: Array<Col<QueueRow> | false> = [
    !!d?.bulk && { h: "", w: 40, render: (r) => <span onClick={(e) => e.stopPropagation()}><Check on={picked.includes(r.id)} onChange={() => toggle(r.id)} label="" id={`wk-pick-${r.id}`} /></span> },
    { h: "Waiting", fit: true, render: (r) => <span className={cx("row g6 t-sm", isLate(r) && "c-err")}>{isLate(r) && <Icon n="warning" />}{waiting(r.since)}</span> },
    { h: d?.id === "awaiting" || d?.id === "coa-generate" ? "Job order" : d?.id === "coa-send" ? "CoA" : "Batch", fit: true, render: (r) => <span className="col" style={{ gap: 0 }}><b className="t-data-b c-head">{r.number}</b>{r.numberSub && <span className="t-cap c-sec">{dShort(r.numberSub)}</span>}</span> },
    desk && d?.id !== "awaiting" && d?.id !== "coa-generate" && { h: "Job order", fit: true, render: (r) => <span className="t-data c-act">{r.orderNo}</span> },
    { h: "Client", fill: true, render: (r) => <span className="t-sm">{r.company}</span> },
    desk && d?.id !== "coa-send" && { h: d?.id === "coa-generate" ? "Batches" : "Samples", fit: true, render: (r) => <span className="t-sm">{r.samples ?? ""}</span> },
    { h: "Status", fit: true, render: (r) => statusBadge(r) },
    desk && { h: "Deadline", fit: true, render: (r) => r.deadline ? <span className="col" style={{ gap: 0 }}><span className={cx("t-sm", isLate(r) && "c-err")}>{dShort(r.deadline)}</span>{isLate(r) && <span className="t-cap c-err">Past due</span>}</span> : <span className="c-mut">-</span> },
    desk && { h: "Note", fit: true, render: (r) => r.note ? <span className="t-sm c-sec">{r.note}</span> : null },
    desk && { h: "", fit: true, cls: "r", render: (r) => <span onClick={(e) => e.stopPropagation()}><Button size="sm" onClick={() => go(r)}>{d?.action}</Button></span> },
  ];
  const tabs = (work.data?.queues ?? []).map((x) => ({ id: x.id, label: x.label, count: x.count }));
  return (
    <div className="page">
      <PageHead crumb={[["My work", "/work"], [d?.label ?? ""]]} title={d?.label ?? "Queue"} />
      {tabs.length > 1 && <Tabs items={tabs} value={queue} onChange={(id) => nav(`/work/${id}`)} />}
      {phone ? (
        <div className="col g12">
          <Search id="wk-q" label="Search" value={text} onChange={setText} placeholder="Search batch, job order or company" width="100%" />
          <Check on={late} onChange={setLate} label="Past due only" id="wk-late" />
        </div>
      ) : (
        <div className="row g12 wrap" style={{ alignItems: "flex-end" }}>
          <Search id="wk-q" label="Search" value={text} onChange={setText} placeholder="Search batch, job order or company" width={360} />
          <Select id="wk-company" label="Company" value={company} onChange={setCompany} options={companies} width={220} />
          <span className="row" style={{ height: 40, alignItems: "center" }}><Check on={late} onChange={setLate} label="Past due only" id="wk-late" /></span>
        </div>
      )}
      {phone ? (
        <div className="col g12" id="wk-cards">
          {rows.map((r) => (
            <div key={r.id} className={cx("wk-card", picked.includes(r.id) && "on")} onClick={() => go(r)} role="link" tabIndex={0} onKeyDown={(e) => e.key === "Enter" && go(r)}>
              <span className="row g10" style={{ flexWrap: "nowrap", alignItems: "flex-start" }}>
                {d?.bulk && <span onClick={(e) => e.stopPropagation()} style={{ paddingTop: 2 }}><Check on={picked.includes(r.id)} onChange={() => toggle(r.id)} label="" id={`wk-pick-${r.id}`} /></span>}
                <span className="col grow" style={{ gap: 0, minWidth: 0 }}>
                  <b className="t-data-b c-head">{r.number}</b>
                  <span className="t-cap c-mut">{d?.id === "coa-send" ? `Published ${dDayMonth(r.since)}` : r.numberSub ? dDayMonth(r.numberSub) : ""}</span>
                </span>
                {d?.id !== "coa-send" && statusBadge(r)}
              </span>
              <span className="row g8" style={{ flexWrap: "nowrap", minWidth: 0 }}>
                {r.orderNo !== r.number && <span className="t-data c-act nowrap">{r.orderNo}</span>}
                <span className="t-cap c-for ellip">{r.company}</span>
              </span>
              <span className="row g12 t-cap c-sec" style={{ flexWrap: "wrap" }}>
                <span className={cx("row g4", isLate(r) && "c-err")}><Icon n={isLate(r) ? "warning" : "clock"} />Waiting {waiting(r.since)}</span>
                {r.deadline && <span className={cx("row g4", isLate(r) && "c-err")}><Icon n="calendar-blank" />{dShort(r.deadline)}{isLate(r) && <b className="w6">Past due</b>}</span>}
              </span>
              {r.note && <span className="t-cap c-sec">{r.note.charAt(0).toUpperCase() + r.note.slice(1)}</span>}
              <span onClick={(e) => e.stopPropagation()}><Button block size="lg" onClick={() => go(r)}>{d?.action}</Button></span>
            </div>
          ))}
          {!rows.length && <Card><Empty icon="check-circle" title={dq || late ? "Nothing matches" : "Queue is empty"} text={dq || late ? "Try other words or clear the filters." : "New work appears here as soon as it reaches you."} /></Card>}
        </div>
      ) : (
        <Card>
          <Table cols={cols} rows={rows} keyOf={(r) => r.id} onRow={go} empty={<Empty icon="check-circle" title={dq || late ? "Nothing matches" : "Queue is empty"} text={dq || late ? "Try other words or clear the filters." : "New work appears here as soon as it reaches you."} />} />
        </Card>
      )}
      {picked.length > 0 && (
        <div className="sticky-bar" id="wk-bar" style={{ justifyContent: "space-between" }}>
          <span className="t-sm c-sec">{picked.length} selected</span>
          <span className="row g8"><Button onClick={() => setPicked([])}>Clear</Button><Button type="primary" id="wk-zip" disabled={busy} onClick={zip}>Download PDFs</Button></span>
        </div>
      )}
    </div>
  );
}
