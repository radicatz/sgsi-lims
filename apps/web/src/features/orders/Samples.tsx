// The job order's Samples tab (FigCraft 03-03-06 to 12): the samples the client sent, by the client's own reference (spec 6.1). The CSO
// types or pastes rows; changes stay local (orange dot) until Save, which sends adds, edits and removals at once. A row in a batch,
// received or marked not received is locked (lock with its reason). Mark as not received and Restore act at once. Phone: cards, Add sample.
import { useEffect, useMemo, useRef, useState } from "react";
import { useBlocker, useLocation, useNavigate } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { api, ApiError } from "../../app/api";
import { useSession } from "../../app/session";
import {
  Alert,
  Badge,
  Button,
  Card,
  Confirm,
  Dialog,
  Empty,
  Icon,
  IconBtn,
  Select,
  Tag,
  TextArea,
  TextField,
  cx,
  toFrame,
  toast,
  type Tone,
} from "../../components";
import { useSave } from "../master-data/shared";

export type SampleState = "expected" | "in_batch" | "received" | "awaiting_arrival" | "not_received" | "held";
export interface SampleRow {
  id: string; rowNo: number; clientRef: string; description: string | null; remarks: string | null; drillHole: string | null; depthFrom: string | null; depthTo: string | null;
  state: SampleState; batchNo: string | null; sampleNo: string | null; sampleCode: string | null; receivedAt: string | null; receivedBy: string | null; releasedFrom: string | null;
  notReceived: { reason: string; note: string | null; at: string; by: string | null } | null;
  matched: boolean; locked: boolean; lockWhy: string | null; canRemove: boolean; canMarkNotReceived: boolean;
}
interface SampleList { canEdit: boolean; why: string | null; reasons: Array<{ value: string; needsNote: boolean }>; items: SampleRow[] }

export const SAMPLE_STATE: Record<SampleState, [string, Tone]> = {
  expected: ["Expected", "outline"], in_batch: ["In batch", "blue"], received: ["Received", "green"], awaiting_arrival: ["Awaiting arrival", "amber"],
  not_received: ["Not received", "red"], held: ["Held", "orange"],
};

/* ---------- the "Depth / lot reference" text: a drill hole and its depths ("DH-BNM-021 14.20-14.55"), or a lot reference ---------- */
const num = (t: string) => Number(t.replace(",", "."));
export function parseDepth(text: string): { drillHole: string | null; depthFrom: number | null; depthTo: number | null; error: string | null } {
  const s = text.trim().replace(/\s*m$/i, "").trim();
  if (!s) return { drillHole: null, depthFrom: null, depthTo: null, error: null };
  const m = s.match(/^(?:(.*?\S)[\s,;]+)?(\d+(?:[.,]\d+)?)\s*(?:-|–|to)\s*(\d+(?:[.,]\d+)?)$/i);
  if (!m) return { drillHole: s.slice(0, 60), depthFrom: null, depthTo: null, error: null };
  const from = num(m[2]!), to = num(m[3]!);
  return { drillHole: m[1]?.replace(/[,;]$/, "").trim().slice(0, 60) || null, depthFrom: from, depthTo: to, error: to > from ? null : "The depth to must be more than the depth from." };
}
export const depthText = (hole: string | null, from: string | number | null, to: string | number | null, sep = " ") =>
  [hole, from != null && to != null ? `${from}-${to}` : null].filter(Boolean).join(sep);
/** The cell text of a hole and its depths, as the frames show it: "DH-BNM-021 14.20-14.55 m". */
const depthCell = (hole: string | null, from: string | number | null, to: string | number | null) => depthText(hole, from, to) + (from != null && to != null ? " m" : "");
const tidyDepth = (t: string) => { const p = parseDepth(t); return p.error || p.depthFrom == null ? t : depthCell(p.drillHole, p.depthFrom.toFixed(2), p.depthTo!.toFixed(2)); };

/* ---------- Excel paste: tab-separated rows (client reference, description, depth or hole + from + to, remarks) ---------- */
interface Draft { key: string; id?: string; clientRef: string; description: string; depth: string; remarks: string }
const isNum = (t: string | undefined) => !!t && /^\d+(?:[.,]\d+)?$/.test(t.trim());
export function parsePaste(text: string): Array<Omit<Draft, "key">> {
  const rows = text.replace(/\r/g, "").split("\n").filter((l) => l.trim()).map((l) => l.split("\t").map((c) => c.trim()));
  if (rows[0] && /^(sample|client|ref|id\b|no\b|#)/i.test(rows[0][0] ?? "") && !/\d/.test(rows[0][0] ?? "")) rows.shift();   // a header row
  return rows.filter((r) => r[0]).map((c) => {
    if (isNum(c[2]) && isNum(c[3])) return { clientRef: c[0]!.slice(0, 60), description: c[1] ?? "", depth: `${c[2]}-${c[3]}`, remarks: c[4] ?? "" };
    if (isNum(c[3]) && isNum(c[4])) return { clientRef: c[0]!.slice(0, 60), description: c[1] ?? "", depth: `${c[2] ?? ""} ${c[3]}-${c[4]}`.trim(), remarks: c[5] ?? "" };
    return { clientRef: c[0]!.slice(0, 60), description: c[1] ?? "", depth: c[2] ?? "", remarks: c[3] ?? "" };
  });
}

const draftOf = (s: SampleRow): Draft => ({ key: s.id, id: s.id, clientRef: s.clientRef, description: s.description ?? "", depth: depthCell(s.drillHole, s.depthFrom, s.depthTo), remarks: s.remarks ?? "" });
const same = (a: Draft, b: Draft) => a.clientRef.trim() === b.clientRef.trim() && a.description.trim() === b.description.trim() && a.depth.trim() === b.depth.trim() && a.remarks.trim() === b.remarks.trim();
const blank = (d: Draft) => !d.clientRef.trim() && !d.description.trim() && !d.depth.trim() && !d.remarks.trim();
let seq = 0;
const newDraft = (p: Partial<Draft> = {}): Draft => ({ key: `n${++seq}`, clientRef: "", description: "", depth: "", remarks: "", ...p });

/** One displayed row: a saved sample (maybe edited) or a new draft. */
interface View { key: string; s: SampleRow | null; d: Draft; dirty: boolean }

export function SamplesTab({ no, live, phone, tablet }: { no: string; live: boolean; phone: boolean; tablet: boolean }) {
  const { me } = useSession(), loc = useLocation(), nav = useNavigate();
  const mayEdit = !!me?.permissions.includes("order.edit");
  const q = useQuery({ queryKey: ["order-samples", no], queryFn: () => api<SampleList>(`/orders/${no}/samples`) });
  const [edits, setEdits] = useState<Record<string, Draft>>({}),
    [added, setAdded] = useState<Draft[]>([]),
    [removed, setRemoved] = useState<Set<string>>(new Set()),
    [serverErr, setServerErr] = useState(""),
    [paste, setPaste] = useState<string | null>(null),
    [notReceived, setNotReceived] = useState<SampleRow | null>(null),
    [sheet, setSheet] = useState<Draft | null>(null);
  const focusKey = useRef<string | null>(null);
  const canEdit = mayEdit && live && !!q.data?.canEdit;

  // "Add samples" in the page head opens the paste preview (desktop, tablet) or the add sheet (phone)
  useEffect(() => {
    if (!(loc.state as { add?: boolean } | null)?.add || !q.data) return;
    nav(".", { replace: true, state: null });
    if (phone) setSheet(newDraft()); else setPaste("");
  }, [loc.state, q.data, phone, nav]);

  const items = q.data?.items ?? [];
  const views: View[] = useMemo(() => [
    ...items.filter((s) => !removed.has(s.id)).map((s) => ({ key: s.id, s, d: edits[s.id] ?? draftOf(s), dirty: !!edits[s.id] })),
    ...added.map((d) => ({ key: d.key, s: null, d, dirty: true })),
  ], [items, edits, added, removed]);
  const changes = Object.keys(edits).length + added.filter((d) => !blank(d)).length + removed.size;

  // problems that block Save: duplicates (ignoring case), a row without its reference, a bad depth
  const problems = useMemo(() => {
    const first = new Map<string, number>(), dup = new Set<string>(), out: string[] = [];
    let dups = 0;
    views.forEach((v, i) => {
      if (blank(v.d) && !v.s) return;
      const ref = v.d.clientRef.trim(), k = ref.toLowerCase();
      if (!ref) out.push(`Row ${i + 1} needs its client reference.`);
      else if (first.has(k)) { dups++; dup.add(v.key); out.push(`${ref} is already in row ${first.get(k)! + 1}.`); }
      else first.set(k, i);
      const p = parseDepth(v.d.depth); if (p.error) out.push(`Row ${i + 1}: ${p.error.toLowerCase()}`);
    });
    return { list: out, dup, title: out.length === dups && dups ? `Fix ${dups} duplicate ID${dups === 1 ? "" : "s"} before saving` : `Fix ${out.length} row${out.length === 1 ? "" : "s"} before saving` };
  }, [views]);

  const setDraft = (v: View, p: Partial<Draft>) => {
    setServerErr("");
    const d = { ...v.d, ...p };
    if (v.s) setEdits((e) => { const n = { ...e }; if (same(d, draftOf(v.s!))) delete n[v.key]; else n[v.key] = d; return n; });
    else setAdded((a) => a.map((x) => (x.key === v.key ? d : x)));
  };
  const remove = (v: View) => {
    setServerErr("");
    if (v.s) { setRemoved((r) => new Set(r).add(v.key)); setEdits((e) => { const n = { ...e }; delete n[v.key]; return n; }); }
    else setAdded((a) => a.filter((x) => x.key !== v.key));
  };
  const addRow = () => { const d = newDraft(); focusKey.current = d.key; setAdded((a) => [...a, d]); };
  useEffect(() => { if (focusKey.current) { document.getElementById(`ref-${focusKey.current}`)?.focus(); focusKey.current = null; } });
  const reset = () => { setEdits({}); setAdded([]); setRemoved(new Set()); setServerErr(""); };

  const pack = (d: Draft) => { const p = parseDepth(d.depth); return { ...(d.id ? { id: d.id } : {}), clientRef: d.clientRef.trim(), description: d.description.trim() || null, drillHole: p.drillHole, depthFrom: p.depthFrom, depthTo: p.depthTo, remarks: d.remarks.trim() || null }; };
  const save = useSave(
    (body: { rows: ReturnType<typeof pack>[]; removed: string[] }) => api<{ added: number; updated: number; removed: number }>(`/orders/${no}/samples`, { method: "PUT", json: body }),
    {
      keys: ["order-samples", "order", "orders"],
      onDone: () => { reset(); setSheet(null); toast("Samples saved"); },
      onField: (_f, text) => setServerErr(text),
    },
  );
  const saveAll = () => {
    // frame 11: Save stays primary while the alert lists the problems; pressing it takes the CSO to the first one
    if (problems.list.length) {
      const first = views.find((v) => problems.dup.has(v.key) || (!blank(v.d) && !v.d.clientRef.trim()) || !!parseDepth(v.d.depth).error);
      if (first) document.getElementById(`ref-${first.key}`)?.focus();
      return;
    }
    save.mutate({ rows: [...Object.values(edits), ...added.filter((d) => !blank(d))].map(pack), removed: [...removed] });
  };
  const restore = useSave((s: SampleRow) => api<{ clientRef: string }>(`/orders/${no}/samples/${s.id}/restore`, { method: "POST" }), {
    keys: ["order-samples", "order"], onDone: (r) => toast(`${(r as { clientRef: string }).clientRef} restored`),
  });

  // unsaved rows: ask before leaving the tab or the page
  const blocker = useBlocker(({ currentLocation, nextLocation }) => changes > 0 && currentLocation.pathname !== nextLocation.pathname);
  useEffect(() => {
    if (!changes) return;
    const h = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener("beforeunload", h); return () => window.removeEventListener("beforeunload", h);
  }, [changes]);

  // Ctrl+V of several rows anywhere in the list opens the paste preview
  const onPaste = (e: React.ClipboardEvent) => {
    if (!canEdit || phone) return;
    const t = e.clipboardData.getData("text/plain");
    if (/[\t\n]/.test(t.trim())) { e.preventDefault(); setPaste(t); }
  };

  if (q.isLoading) return <Card title="Registered Samples"><span className="t-sm c-mut">Loading samples…</span></Card>;
  if (q.error || !q.data) return <Card title="Registered Samples"><Alert tone="error" title="The samples could not be loaded." text={(q.error as ApiError | null)?.message} /></Card>;

  const refs = views.filter((v) => !blank(v.d)).map((v) => v.d.clientRef.trim().toLowerCase());
  const dialogs = (
    <>
      {paste !== null && (
        <PasteDialog initial={paste} taken={refs} onClose={() => setPaste(null)}
          onAdd={(rows) => { setAdded((a) => [...a.filter((d) => !blank(d)), ...rows.map((r) => newDraft({ ...r, depth: tidyDepth(r.depth) }))]); setPaste(null); }} />
      )}
      {notReceived && <NotReceivedDialog no={no} s={notReceived} reasons={q.data.reasons} phone={phone} onClose={() => setNotReceived(null)} />}
      {sheet && (
        <SampleSheet d={sheet} taken={refs.filter((r) => r !== sheet.clientRef.trim().toLowerCase())} busy={save.isPending} err={serverErr}
          canRemove={!sheet.id || !!items.find((s) => s.id === sheet.id)?.canRemove}
          {...(sheet.id && items.find((s) => s.id === sheet.id)?.canMarkNotReceived ? { onNotReceived: () => { const s = items.find((x) => x.id === sheet.id)!; setSheet(null); setNotReceived(s); } } : {})}
          onClose={() => { setSheet(null); setServerErr(""); }}
          onSave={(d) => save.mutate({ rows: [pack(d)], removed: [] })}
          onRemove={() => save.mutate({ rows: [], removed: [sheet.id!] })} />
      )}
      {blocker.state === "blocked" && (
        <Confirm title="Leave without saving?" text={`${changes} unsaved change${changes === 1 ? "" : "s"} to the samples will be lost.`} ok="Leave" danger
          onOk={() => blocker.proceed()} onClose={() => blocker.reset()} />
      )}
    </>
  );

  // frames: an editable Expected row has no action at rest; its icons show while the row is hovered or being typed in
  const action = (v: View, size: 32 | 44 = 32) => {
    const s = v.s;
    if (!s) return canEdit ? <span className="acts hov"><IconBtn n="trash" label={`Remove row ${v.d.clientRef || "without a reference"}`} size={size} onClick={() => remove(v)} /></span> : null;
    if (s.state === "not_received")
      return canEdit ? <IconBtn n="arrow-counter-clockwise" label={`Restore ${s.clientRef}`} title={`Restore. Not received: ${s.notReceived?.reason ?? ""}`} size={size} disabled={restore.isPending} onClick={() => restore.mutate(s)} />
        : <LockTip why={`Not received: ${s.notReceived?.reason ?? ""}`} size={size} />;
    if (s.locked) return <LockTip why={s.lockWhy ?? "This sample can't be edited."} size={size} />;
    if (!canEdit) return null;
    return <span className={cx("acts", s.state === "expected" && "hov")}>
      {s.canMarkNotReceived && <IconBtn n="file-x" label={`Mark ${s.clientRef} as not received`} size={size} onClick={() => setNotReceived(s)} />}
      {!phone && s.canRemove && <IconBtn n="trash" label={`Remove ${s.clientRef}`} size={size} onClick={() => remove(v)} />}
    </span>;
  };
  const badge = (v: View) => { const [l, t] = SAMPLE_STATE[v.s?.state ?? "expected"]; return <Badge label={l} tone={t} />; };

  /* ---------- phone: cards (frames P 06, 07) ---------- */
  if (phone)
    return (
      <Card title="Registered Samples">
        {views.length === 0 ? (
          <Empty icon="tray" title="No samples yet" text="Add the sample IDs the company sent, so the lab can receive and label them." />
        ) : (
          <div className="scards">
            {views.map((v) => {
              const open = canEdit && v.s && !v.s.locked && v.s.state !== "not_received";
              return (
                <div key={v.key} className={cx("scard", open && "tap")} onClick={open ? () => setSheet(draftOf(v.s!)) : undefined}>
                  <div className="row g8"><b className="t-data-b grow ellip">{v.d.clientRef}</b>{badge(v)}{action(v, 44)}</div>
                  <div className="row g8 between"><span className="t-sm c-sec ellip">{v.d.description || "No description"}</span>
                    {v.s?.batchNo ? <span className="t-data-sm c-act">{v.s.batchNo}</span> : <span className="t-data-sm c-mut">No batch</span>}</div>
                </div>
              );
            })}
          </div>
        )}
        {canEdit && <Button block size="lg" icon="plus" id="add-sample" onClick={() => setSheet(newDraft())}>Add sample</Button>}
        {dialogs}
      </Card>
    );

  /* ---------- desktop and tablet: the grid (frames D 06, 07, 11, 12; T 06, 07) ---------- */
  const head = canEdit && (
    <>
      <Button size="sm" icon="plus" id="add-row" onClick={addRow}>Add row</Button>
      {!tablet && <Button size="sm" icon="copy" id="paste-excel" onClick={() => setPaste("")}>Paste from Excel</Button>}
      <Button size="sm" icon="floppy-disk" id="save-samples" type={changes ? "primary" : "secondary"} disabled={!changes || save.isPending}
        why="Nothing to save yet" onClick={saveAll}>
        {changes ? `Save (${changes})` : "Save"}
      </Button>
    </>
  );
  const ed = (v: View) => canEdit && (!v.s || !v.s.locked) && v.s?.state !== "not_received";
  return (
    <div onPaste={onPaste}>
      <Card title="Registered Samples" actions={views.length ? head : undefined}>
        {canEdit && views.length > 0 && <span className="t-sm c-sec" style={{ marginTop: -8 }}>Paste IDs from Excel, or type them. The Preparation team receives samples by these IDs.</span>}
        {(problems.list.length > 0 || serverErr) && (
          <Alert tone="error" title={serverErr ? "The samples were not saved" : problems.title} text={serverErr || problems.list.slice(0, 3).join(" ") + (problems.list.length > 3 ? ` And ${problems.list.length - 3} more.` : "")} />
        )}
        {views.length === 0 ? (
          <div className="empty-well">
            <Empty icon="tray" title="No samples yet" text="Add the sample IDs the company sent, so the lab can receive and label them."
              action={canEdit ? <span className="row g8 wrap" style={{ justifyContent: "center" }}>
                {!tablet && <Button type="primary" id="empty-paste" onClick={() => setPaste("")}>Paste from Excel</Button>}
                <Button type={tablet ? "primary" : "secondary"} id="empty-add" onClick={addRow}>Add row</Button></span> : undefined} />
          </div>
        ) : (
          <div className="tblwrap">
            <table className="tbl sgrid">
              <thead><tr>
                <th style={{ width: 44 }}>#</th><th style={{ width: 124 }}>Client reference</th><th style={{ width: 140 }}>Sample ID</th><th>Client description</th>
                <th style={{ width: 228 }}>Depth / lot reference</th><th style={{ width: 110 }}>Remarks</th><th style={{ width: 108 }}>Batch</th><th style={{ width: 136 }}>Status</th>
                {(canEdit || views.some((v) => v.s?.locked)) && <th style={{ width: 72 }}>Action</th>}
              </tr></thead>
              <tbody>
                {views.map((v, i) => {
                  const e = ed(v), dup = problems.dup.has(v.key), p = parseDepth(v.d.depth);
                  return (
                    <tr key={v.key} className={cx(v.s?.state === "not_received" && "dimrow")}>
                      <td><span className={cx("rn", v.dirty && "on")}>{v.dirty && <i className="dirty" />}{i + 1}</span></td>
                      <td>{e ? <input id={`ref-${v.key}`} className={cx("gc ref", dup && "err")} value={v.d.clientRef} placeholder="Client ID" aria-label={`Client reference, row ${i + 1}`} maxLength={60}
                          onChange={(x) => setDraft(v, { clientRef: x.target.value })} />
                        : <b className={cx("t-data-b", dup && "c-err")}>{v.d.clientRef}</b>}</td>
                      <td>{v.s?.sampleCode ? <span className="col" style={{ gap: 0 }}><b className="t-data-b">{v.s.sampleCode}</b><span className="t-data-sm c-sec">{v.s.sampleNo}</span></span>
                        : <span className="t-cap c-mut">Given at reception</span>}</td>
                      <td>{e ? <input className="gc" value={v.d.description} placeholder="Description" aria-label={`Client description, row ${i + 1}`} maxLength={200} onChange={(x) => setDraft(v, { description: x.target.value })} />
                        : <span className="t-sm">{v.d.description}</span>}</td>
                      <td>{e ? <span className="row g4"><input className={cx("gc", p.error && "err")} value={v.d.depth} placeholder="DH-001 10.00-10.35" aria-label={`Depth or lot reference, row ${i + 1}`} maxLength={90}
                            onChange={(x) => setDraft(v, { depth: x.target.value })} />{v.s && !v.dirty && !v.s.matched && v.s.depthFrom && <Unmatched hole={v.s.drillHole} />}</span>
                        : <span className="row g8 t-sm" style={{ flexWrap: "nowrap" }}>{v.s?.drillHole && <span>{v.s.drillHole}</span>}{v.s?.depthFrom && <span>{v.s.depthFrom}-{v.s.depthTo} m</span>}</span>}</td>
                      <td>{e ? <input className="gc" value={v.d.remarks} placeholder="Remarks" aria-label={`Remarks, row ${i + 1}`} maxLength={300} onChange={(x) => setDraft(v, { remarks: x.target.value })} />
                        : <span className="t-sm">{v.d.remarks}</span>}</td>
                      <td>{v.s?.batchNo ? <span className="t-data c-act">{v.s.batchNo}</span> : <span className="c-mut">—</span>}</td>
                      <td>{badge(v)}</td>
                      {(canEdit || views.some((x) => x.s?.locked)) && <td>{action(v)}</td>}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      {dialogs}
    </div>
  );
}

function Unmatched({ hole }: { hole: string | null }) {
  return <span className="c-mut" title={`${hole ?? "This drill hole"} is not one of the client's drill holes, so it stays as typed. Add it under Master data to link the sample.`} aria-label="Drill hole not found"><Icon n="info" /></span>;
}

/** The lock of a row that can't change, with its reason in a tooltip (frame P5); on a phone a tap shows the reason. */
function LockTip({ why, size = 32 }: { why: string; size?: 32 | 44 }) {
  const [at, setAt] = useState<{ top: number; right: number } | null>(null);
  const show = (e: React.SyntheticEvent<HTMLSpanElement>) => {
    const fr = document.querySelector(".frame")!.getBoundingClientRect(), r = e.currentTarget.getBoundingClientRect();
    setAt({ top: r.top - fr.top + r.height / 2, right: fr.right - r.left + 6 });
  };
  return (
    <span className={cx("ib lockic", size === 44 && "s44")} tabIndex={0} role="img" aria-label={why} onMouseEnter={show} onFocus={show} onMouseLeave={() => setAt(null)} onBlur={() => setAt(null)}
      onClick={(e) => { e.stopPropagation(); if (size === 44) toast(why); }}>
      <Icon n="lock-simple" s={size === 44 ? 20 : 14} />
      {at && size === 32 && toFrame(<div className="tip left" role="tooltip" style={{ top: at.top, right: at.right }}>{why}</div>)}
    </span>
  );
}

/** Paste from Excel (frame D 10): read the rows, mark the duplicates, add the new ones as unsaved rows. */
function PasteDialog({ initial, taken, onClose, onAdd }: { initial: string; taken: string[]; onClose: () => void; onAdd: (rows: Array<Omit<Draft, "key">>) => void }) {
  const [text, setText] = useState(initial);
  useEffect(() => {
    if (initial) return;
    navigator.clipboard?.readText?.().then((t) => { if (t && /\S/.test(t) && parsePaste(t).length) setText(t); }).catch(() => undefined);
  }, [initial]);
  const rows = useMemo(() => {
    const seen = new Set(taken);
    return parsePaste(text).map((r) => { const k = r.clientRef.toLowerCase(), dup = seen.has(k); seen.add(k); return { ...r, dup }; });
  }, [text, taken]);
  const fresh = rows.filter((r) => !r.dup), dups = rows.length - fresh.length;
  return (
    <Dialog title="Paste from Excel" size="lg" onClose={onClose}
      footer={<><Button onClick={onClose}>Cancel</Button>
        <Button type="primary" id="paste-add" disabled={!fresh.length} why="Paste rows with a client reference first" onClick={() => onAdd(fresh.map(({ dup: _d, ...r }) => r))}>
          {fresh.length ? `Add ${fresh.length} row${fresh.length === 1 ? "" : "s"}` : "Add rows"}</Button></>}>
      {rows.length === 0 ? (
        <>
          <span className="t-sm c-sec">Copy the rows in Excel (client reference, description, drill hole and depth, remarks), then paste them here.</span>
          <TextArea id="paste-text" label="Rows" value={text} onChange={setText} placeholder="BNM-3601	Ply A1 upper	DH-BNM-031	5.10	5.45	Composite" rows={6} />
        </>
      ) : (
        <>
          <span className="t-sm c-sec">{rows.length} row{rows.length === 1 ? "" : "s"} found: {fresh.length} new{dups ? `, ${dups} duplicate${dups === 1 ? "" : "s"}. Duplicates are skipped and marked in the list.` : "."}</span>
          <span className="row g8 wrap">
            <Tag label={`${rows.length} row${rows.length === 1 ? "" : "s"} found`} />
            <Tag label={`${fresh.length} new`} tone="blue" />
            {dups > 0 && <Tag label={`${dups} duplicate${dups === 1 ? "" : "s"}`} tone="red" />}
            <span className="grow" />
            <Button type="ghost" size="sm" icon="arrow-counter-clockwise" onClick={() => setText("")}>Paste other rows</Button>
          </span>
          <div className="tblwrap" style={{ maxHeight: 420, overflowY: "auto" }}>
            <table className="tbl">
              <thead><tr><th style={{ width: 40 }}>#</th><th>Client reference</th><th>Client description</th><th>Depth / lot reference</th><th style={{ width: 110 }}>Status</th></tr></thead>
              <tbody>{rows.map((r, i) => { const p = parseDepth(r.depth); return (
                <tr key={i}><td className="c-mut">{i + 1}</td><td><b className={cx("t-data-b", r.dup && "c-err")}>{r.clientRef}</b></td><td className="t-sm">{r.description}</td>
                  <td className="t-sm">{depthText(p.drillHole, p.depthFrom?.toFixed(2) ?? null, p.depthTo?.toFixed(2) ?? null, ", ")}{p.depthFrom != null && " m"}</td>
                  <td>{r.dup ? <Tag label="Duplicate" tone="red" /> : <Tag label="New" tone="blue" />}</td></tr>); })}</tbody>
            </table>
          </div>
        </>
      )}
    </Dialog>
  );
}

/** Mark as not received (frame 08): the reason from the lookup, a note when the reason needs one. Phone: a bottom sheet. */
function NotReceivedDialog({ no, s, reasons, phone, onClose }: { no: string; s: SampleRow; reasons: SampleList["reasons"]; phone: boolean; onClose: () => void }) {
  const [reason, setReason] = useState(reasons[0]?.value ?? ""), [note, setNote] = useState(""), [err, setErr] = useState<{ f?: string; t: string } | null>(null);
  const needs = !!reasons.find((r) => r.value === reason)?.needsNote;
  const save = useSave(() => api(`/orders/${no}/samples/${s.id}/not-received`, { method: "POST", json: { reason, note } }), {
    keys: ["order-samples", "order"], done: `${s.clientRef} marked not received`, onDone: onClose, onField: (f, t) => setErr({ ...(f ? { f } : {}), t }),
  });
  return (
    <Dialog title={`Mark ${s.clientRef} as not received?`} phone={phone} onClose={onClose}
      footer={<><Button onClick={onClose}>Cancel</Button>
        <Button type="primary" id="nr-confirm" disabled={save.isPending} onClick={() => { if (needs && note.trim().length < 3) return setErr({ f: "note", t: "Add a note for this reason." }); setErr(null); save.mutate(undefined); }}>Mark as not received</Button></>}>
      <span className="t-sm c-sec">The sample stays on the job order with this reason. The job order can be completed without it. You can restore it if it arrives later.</span>
      <Select id="nr-reason" label="Reason" req value={reason} onChange={(v) => { setReason(v); setErr(null); }} options={reasons.map((r) => [r.value, r.value] as [string, string])} error={err?.f === "reason" ? err.t : null} />
      <TextArea id="nr-note" label={needs ? "Note" : "Note (optional)"} value={note} onChange={(t) => { setNote(t); setErr(null); }} placeholder="Add a note…" rows={3} />
      {err && err.f !== "reason" && <span className="help err">{err.t}</span>}
    </Dialog>
  );
}

/** Phone: add or edit one sample in a bottom sheet; it is saved at once. */
function SampleSheet({ d, taken, busy, err, canRemove, onClose, onSave, onRemove, onNotReceived }: { d: Draft; taken: string[]; busy: boolean; err: string; canRemove: boolean; onClose: () => void; onSave: (d: Draft) => void; onRemove: () => void; onNotReceived?: () => void }) {
  const [f, setF] = useState(d), [e, setE] = useState<Record<string, string>>({}), [ask, setAsk] = useState(false);
  const set = (p: Partial<Draft>) => { setF((x) => ({ ...x, ...p })); setE({}); };
  const go = () => {
    const x: Record<string, string> = {};
    if (!f.clientRef.trim()) x.ref = "Enter the client reference.";
    else if (taken.includes(f.clientRef.trim().toLowerCase())) x.ref = `${f.clientRef.trim()} is already on this job order.`;
    const p = parseDepth(f.depth); if (p.error) x.depth = p.error;
    if (Object.keys(x).length) return setE(x);
    onSave(f);
  };
  return (
    <Dialog title={d.id ? `Edit ${d.clientRef}` : "Add sample"} phone onClose={onClose}
      footer={<><Button onClick={onClose}>Cancel</Button><Button type="primary" id="sheet-save" disabled={busy} onClick={go}>{d.id ? "Save" : "Add sample"}</Button></>}>
      {err && <Alert tone="error" title={err} />}
      <TextField id="sheet-ref" label="Client reference" req value={f.clientRef} onChange={(t) => set({ clientRef: t })} error={e.ref ?? null} placeholder="BNM-3601" />
      <TextField id="sheet-desc" label="Client description" value={f.description} onChange={(t) => set({ description: t })} placeholder="Ply A1 upper" />
      <TextField id="sheet-depth" label="Depth / lot reference" value={f.depth} onChange={(t) => set({ depth: t })} error={e.depth ?? null} placeholder="DH-BNM-031 5.10-5.45"
        help="The drill hole and its depths in metres, or a lot reference." />
      <TextField id="sheet-remarks" label="Remarks" value={f.remarks} onChange={(t) => set({ remarks: t })} placeholder="Composite" />
      {d.id && (onNotReceived || canRemove) && (
        <span className="row g8 wrap">
          {onNotReceived && <Button type="ghost" icon="file-x" id="sheet-nr" onClick={onNotReceived}>Mark as not received</Button>}
          {canRemove && <Button type="ghost" tone="danger" icon="trash" onClick={() => setAsk(true)}>Remove sample</Button>}
        </span>
      )}
      {ask && <Confirm title={`Remove ${d.clientRef}?`} text="The sample is taken off the job order. Its history stays in the audit log." ok="Remove" danger busy={busy} onOk={onRemove} onClose={() => setAsk(false)} />}
    </Dialog>
  );
}
