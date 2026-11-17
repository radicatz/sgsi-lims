// The job order's History tab (FigCraft 03-03-13 History and 14 History_row_expanded; plan Revision 13): every change to the job order,
// its parameters, samples and files, newest first. Desktop: When, User, Action, Record, Changes; a row opens a tinted block with each
// field before and after. Tablet: When, Record, Action and a caret; the user moves into the open block. Phone: one card per entry.
import { Fragment, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../app/api";
import { Avatar, Button, Card, Empty, Icon, Pager, cx, usePaged } from "../../components";

interface Change { field: string; before: string | null; after: string | null }
interface Entry { id: string; at: string; actor: string | null; action: string; recordType: string; record: string; summary: string; changes: Change[]; note: string | null }

/** "Today, 10:42", "Yesterday, 16:05" or "28 Oct 2026, 15:02" in the lab's time zone. `short` drops the year, as the tablet and phone frames do. */
export function whenText(iso: string, short = false) {
  const tz = "Asia/Makassar", d = new Date(iso);
  const day = (x: Date) => x.toLocaleDateString("en-CA", { timeZone: tz });
  const time = d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: tz });
  if (day(d) === day(new Date())) return `Today, ${time}`;
  if (day(d) === day(new Date(Date.now() - 86_400_000))) return `Yesterday, ${time}`;
  const thisYear = day(d).slice(0, 4) === day(new Date()).slice(0, 4);
  return `${d.toLocaleDateString("en-GB", { day: "numeric", month: "short", ...(short && thisYear ? {} : { year: "numeric" }), timeZone: tz })}, ${time}`;
}

/** Numbers and codes in the data font, words in the body font; Before in muted text, After in the heading colour (frame 14). */
const isData = (v: string) => /^[<>]?[\d.,:\- ]+$/.test(v) || /^[A-Z0-9][A-Z0-9.\-_/]*$/.test(v);
const Val = ({ v, after }: { v: string | null; after?: boolean }) =>
  v === null ? <span className="t-sm c-mut">—</span>
    : <span className={cx(isData(v) ? (after ? "t-data-b" : "t-data") : after ? "t-sm w6" : "t-sm", after ? "c-head" : "c-mut")}>{v}</span>;
const isCount = (r: string) => /^\d+ samples?$/.test(r);
const Rec = ({ r }: { r: string }) => <span className={cx(isCount(r) ? "t-sm c-for" : "t-data c-act", "ellip")}>{r}</span>;
const closing = (e: Entry) => `${e.action} by ${e.actor ?? "the system"} on the Job orders screen.`;

/** The open block: a Field, Before, After grid (desktop, tablet) or Field over Before → After (phone), the note, the closing line. */
function Changes({ e, phone, user }: { e: Entry; phone?: boolean; user?: boolean }) {
  return (
    <div className="hist-x">
      {user && <span className="row g8"><Who e={e} /></span>}
      {e.changes.length > 0 && (phone ? (
        e.changes.map((c, i) => (
          <div key={i} className="col" style={{ gap: 2 }}>
            <span className="t-cap w5 c-sec">{c.field}</span>
            <span className="row g6 wrap">{c.before !== null && <><Val v={c.before} /><Icon n="arrow-right" /></>}<Val v={c.after} after /></span>
          </div>
        ))
      ) : (
        <div className="hist-grid">
          <span className="t-cap w6 c-sec">Field</span><span className="t-cap w6 c-sec">Before</span><span className="t-cap w6 c-sec">After</span>
          {e.changes.map((c, i) => (
            <Fragment key={i}>
              <span className="t-sm w5 c-head">{c.field}</span>
              <Val v={c.before} />
              <Val v={c.after} after />
            </Fragment>
          ))}
        </div>
      ))}
      {e.note && <span className="t-cap c-sec">{e.note}</span>}
      <span className="t-cap c-mut">{closing(e)}</span>
    </div>
  );
}
const Who = ({ e, cap }: { e: Entry; cap?: boolean }) => (
  <span className="row g8" style={{ flexWrap: "nowrap", minWidth: 0 }}>
    {e.actor && <Avatar name={e.actor} size={24} />}
    <span className={cx(cap ? "t-cap c-sec" : "t-sm c-for", "ellip")}>{e.actor ?? "System"}</span>
  </span>
);

export function HistoryTab({ no, phone, tablet }: { no: string; phone: boolean; tablet: boolean }) {
  const q = useQuery({ queryKey: ["order-history", no], queryFn: () => api<{ items: Entry[] }>(`/orders/${no}/history`).then((r) => r.items) });
  const { rows, pager } = usePaged(q.data ?? [], phone ? 6 : 10, no);   // the phone frame shows 6 cards a page (pager 1 / 2)
  const [open, setOpen] = useState<string | null>(null);
  const more = (e: Entry) => e.changes.length > 0 || !!e.note;
  const toggle = (e: Entry) => more(e) && setOpen(open === e.id ? null : e.id);
  if (q.isLoading) return <Card title="History"><span className="t-sm c-mut">Loading history…</span></Card>;
  if (!q.data?.length) return <Card title="History"><Empty icon="clock-counter-clockwise" title="No changes yet" text="Every change to this job order, its samples and files is listed here." /></Card>;
  const caret = (e: Entry) => <Icon n={open === e.id ? "caret-up" : "caret-down"} />;
  return (
    <Card title="History" count={q.data.length}>
      {phone ? (
        <div className="col g10">
          {rows.map((e) => (
            <button key={e.id} type="button" className="hcard" aria-expanded={more(e) ? open === e.id : undefined} onClick={() => toggle(e)}>
              <span className="row between g8" style={{ flexWrap: "nowrap" }}><b className="t-sm w6 c-head">{e.action}</b><span className="t-cap c-mut nowrap">{whenText(e.at, true)}</span></span>
              <span className="row g6" style={{ flexWrap: "nowrap", minWidth: 0 }}><span className="t-cap c-sec">{e.recordType}</span><Rec r={e.record} /></span>
              <Who e={e} cap />
              {open === e.id && <Changes e={e} phone />}
            </button>
          ))}
        </div>
      ) : (
        <div className="tblwrap">
          <table className="tbl htbl">
            <thead>
              {tablet
                ? <tr><th style={{ width: 130 }}>When</th><th>Record</th><th style={{ width: 170 }}>Action</th><th style={{ width: 56 }} aria-label="Changes" /></tr>
                : <tr><th style={{ width: 160 }}>When</th><th style={{ width: 190 }}>User</th><th style={{ width: 170 }}>Action</th><th>Record</th><th style={{ width: 180 }}>Changes</th></tr>}
            </thead>
            <tbody>
              {rows.map((e) => (
                <Fragment key={e.id}>
                  <tr className={cx(more(e) && "click")} onClick={() => toggle(e)}>
                    <td className="t-sm c-sec nowrap">{whenText(e.at, tablet)}</td>
                    {!tablet && <td><Who e={e} /></td>}
                    {tablet && <td style={{ maxWidth: 0 }}><span className="col" style={{ gap: 0 }}><span className="t-cap c-mut">{e.recordType}</span><Rec r={e.record} /></span></td>}
                    <td className="t-sm w5 c-head">{e.action}</td>
                    {!tablet && <td style={{ maxWidth: 0 }}><span className="col" style={{ gap: 0 }}><span className="t-cap c-mut">{e.recordType}</span><Rec r={e.record} /></span></td>}
                    {tablet ? (
                      <td>{more(e) && <Button iconOnly size="touch" type="ghost" icon={open === e.id ? "caret-up" : "caret-down"} label={`${open === e.id ? "Hide" : "Show"} the changes of ${e.action}`} onClick={(x) => { x.stopPropagation(); toggle(e); }} />}</td>
                    ) : (
                      <td>{more(e)
                        ? <span className="row g6 t-sm c-sec" aria-expanded={open === e.id}>{e.summary || "Details"}<span className="c-mut">{caret(e)}</span></span>
                        : <span className="t-sm c-mut">{e.summary || "—"}</span>}</td>
                    )}
                  </tr>
                  {open === e.id && <tr className="xrow"><td colSpan={tablet ? 4 : 5}><Changes e={e} user={tablet} /></td></tr>}
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
