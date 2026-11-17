// The job order's History tab (not drawn: built from the Audit log rows, frames 15-01-01 to 03): every change to the job order, its
// parameters, samples and files, newest first. A row opens to show each field before and after. Phone: the Audit log cards.
import { Fragment, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../app/api";
import { Avatar, Card, Empty, Icon, Pager, cx, usePaged } from "../../components";

interface Change { field: string; before: string | null; after: string | null }
interface Entry { id: string; at: string; actor: string | null; action: string; recordType: string; record: string; summary: string; changes: Change[]; note: string | null }

/** "Today, 10:42", "Yesterday, 16:05" or "28 Oct 2026, 15:02" in the lab's time zone (Audit log frames). */
export function whenText(iso: string) {
  const tz = "Asia/Makassar", d = new Date(iso);
  const day = (x: Date) => x.toLocaleDateString("en-CA", { timeZone: tz });
  const time = d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: tz });
  if (day(d) === day(new Date())) return `Today, ${time}`;
  if (day(d) === day(new Date(Date.now() - 86_400_000))) return `Yesterday, ${time}`;
  return `${d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: tz })}, ${time}`;
}

/** Numbers and codes in the data font, as the Audit log frame shows "5.40" and "5.42"; words in the body font. */
const isData = (v: string) => /^[<>]?[\d.,:\- ]+$/.test(v) || /^[A-Z0-9][A-Z0-9.\-_/]*$/.test(v);
const Val = ({ v, after }: { v: string | null; after?: boolean }) =>
  v === null ? <span className="c-mut">—</span> : <span className={cx(isData(v) ? (after ? "t-data-b" : "t-data-sm") : after ? "t-sm w6" : "t-sm", !after && "c-mut")}>{v}</span>;

function Changes({ e, phone }: { e: Entry; phone?: boolean }) {
  return (
    <div className="hist-x">
      {e.changes.length > 0 && (phone ? (
        <div className="col g8">
          {e.changes.map((c, i) => (
            <div key={i} className="col" style={{ gap: 2 }}>
              <span className="t-cap c-sec">{c.field}</span>
              <span className="row g6 wrap">{c.before !== null && <><Val v={c.before} /><Icon n="arrow-right" /></>}<Val v={c.after} after /></span>
            </div>
          ))}
        </div>
      ) : (
        <div className="hist-grid">
          <span className="t-sm w6 c-sec">Field</span><span className="t-sm w6 c-sec">Before</span><span className="t-sm w6 c-sec">After</span>
          {e.changes.map((c, i) => (
            <Fragment key={i}>
              <span className="t-sm">{c.field}</span>
              <Val v={c.before} />
              <Val v={c.after} after />
            </Fragment>
          ))}
        </div>
      ))}
      {e.note && <span className="t-cap c-sec">{e.note}</span>}
      <span className="t-cap c-sec">{e.action} by {e.actor ?? "the system"} on the Job orders screen.</span>
    </div>
  );
}

export function HistoryTab({ no, phone }: { no: string; phone: boolean }) {
  const q = useQuery({ queryKey: ["order-history", no], queryFn: () => api<{ items: Entry[] }>(`/orders/${no}/history`).then((r) => r.items) });
  const { rows, pager } = usePaged(q.data ?? [], 10, no);
  const [open, setOpen] = useState<string | null>(null);
  const user = (e: Entry) => <span className="row g8" style={{ flexWrap: "nowrap" }}>{e.actor && <Avatar name={e.actor} size={24} />}<span className="t-sm">{e.actor ?? "System"}</span></span>;
  const record = (e: Entry) => <span className="col" style={{ gap: 0 }}><span className="t-cap c-mut">{e.recordType}</span><span className={cx(/^\d+ samples$/.test(e.record) ? "t-sm" : "t-data", "c-act ellip")}>{e.record}</span></span>;
  const more = (e: Entry) => e.changes.length > 0 || !!e.note;
  if (q.isLoading) return <Card title="History"><span className="t-sm c-mut">Loading history…</span></Card>;
  if (!q.data?.length) return <Card title="History"><Empty icon="clock-counter-clockwise" title="No changes yet" text="Every change to this job order, its samples and files is listed here." /></Card>;
  return (
    <Card title="History" count={q.data.length}>
      {phone ? (
        <div className="col g12">
          {rows.map((e) => (
            <button key={e.id} type="button" className="hcard" aria-expanded={open === e.id} onClick={() => more(e) && setOpen(open === e.id ? null : e.id)}>
              <span className="row between"><b className="t-sm w6">{e.action}</b><span className="t-cap c-mut">{whenText(e.at)}</span></span>
              <span className="row g6"><span className="t-sm c-sec">{e.recordType}</span><span className={cx(/^\d+ samples$/.test(e.record) ? "t-sm" : "t-data", "c-act ellip")}>{e.record}</span></span>
              {user(e)}
              {open === e.id && <Changes e={e} phone />}
            </button>
          ))}
        </div>
      ) : (
        <div className="tblwrap">
          <table className="tbl">
            <thead><tr><th style={{ width: 160 }}>When</th><th style={{ width: 190 }}>User</th><th style={{ width: 170 }}>Action</th><th>Record</th><th style={{ width: 160 }}>Changes</th></tr></thead>
            <tbody>
              {rows.map((e) => (
                <Fragment key={e.id}>
                  <tr className={cx(more(e) && "click", open === e.id && "sel")} onClick={() => more(e) && setOpen(open === e.id ? null : e.id)}>
                    <td className="t-sm c-sec" style={{ whiteSpace: "nowrap" }}>{whenText(e.at)}</td>
                    <td>{user(e)}</td>
                    <td className="t-sm w5">{e.action}</td>
                    <td style={{ maxWidth: 0 }}>{record(e)}</td>
                    <td>{more(e) ? <span className="row g6 t-sm c-sec" aria-expanded={open === e.id}>{e.summary || "Details"}<Icon n={open === e.id ? "caret-up" : "caret-down"} /></span> : <span className="c-mut">—</span>}</td>
                  </tr>
                  {open === e.id && <tr className="xrow"><td colSpan={5}><Changes e={e} /></td></tr>}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pager {...pager} compact={phone} />
    </Card>
  );
}
