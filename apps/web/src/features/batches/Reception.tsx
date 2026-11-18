// The Reception tab (FigCraft 04-Batches-02-Batch_detail 01 to 09; spec S-18): the samples of a batch as the lab receives them. Ticking Arrived gives the
// Sample ID and the sample code; mass, condition and remark save as they are typed; photos, labels, hold; Confirm reception when the checklist is done.
// Desktop: a table; tablet: the same without the Remarks and Sample code columns; phone: a card per sample with a sticky action bar.
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api, ApiError } from "../../app/api";
import { useSession } from "../../app/session";
import { Button, Card, Empty, Icon, Menu, Select, Table, Tag, cx, toast, type Col } from "../../components";
import { FewerDialog, HoldDialog, PhotosDialog, PrintLabelsDialog, type Fewer } from "./Dialogs";
import { dShort, dTime, type BatchPageData, type Reception, type RecRow } from "./shared";

/** A text or number field that saves when it loses focus; it follows the saved value when that changes. */
function Field({ id, value, onSave, label, mono, className }: { id?: string; value: string; onSave: (v: string) => Promise<unknown>; label: string; mono?: boolean; className?: string }) {
  const [v, setV] = useState(value), [bad, setBad] = useState(false);
  useEffect(() => setV(value), [value]);
  const commit = () => { if (v.trim() === value.trim()) return; onSave(v.trim()).then(() => setBad(false), () => { setBad(true); setV(value); }); };
  return <input id={id} className={cx("cell", !mono && "l", bad && "err", className)} value={v} aria-label={label} inputMode={mono ? "decimal" : "text"}
    onChange={(e) => { setV(e.target.value); setBad(false); }} onBlur={commit} onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }} />;
}

/** The checkbox of the Arrived column and cards: the library's Check without a text of its own. */
function ArrivedBox({ on, onChange, name, disabled }: { on: boolean; onChange: (v: boolean) => void; name: string; disabled?: boolean }) {
  const flip = () => !disabled && onChange(!on);
  return (
    <label className={cx("cb", on && "on", disabled && "dis")} onClick={(e) => { e.preventDefault(); flip(); }}>
      <span className="box" role="checkbox" aria-checked={on} aria-label={`Arrived, ${name}`} aria-disabled={disabled} tabIndex={0} onKeyDown={(e) => { if (e.key === " ") { e.preventDefault(); flip(); } }}>{on && <Icon n="check" />}</span>
    </label>
  );
}

const massWarn = (m: string | null) => m != null && (Number(m) < 0.1 || Number(m) > 50);

export function ReceptionTab({ b, phone, tablet }: { b: BatchPageData; phone: boolean; tablet: boolean }) {
  const { me } = useSession(), nav = useNavigate(), qc = useQueryClient();
  const can = (p: string) => !!me?.permissions.includes(p);
  const q = useQuery({ queryKey: ["reception", b.batchNo], queryFn: () => api<Reception>(`/batches/${b.batchNo}/reception`) });
  const rec = q.data, rows = rec?.items ?? [];
  const open = !!rec?.open, canReceive = can("sample.receive") && open, canLabel = can("label.print"), canPhoto = can("sample.photo") && open;
  const [labels, setLabels] = useState<{ only?: string[] } | null>(null), [photos, setPhotos] = useState<RecRow | null>(null), [hold, setHold] = useState<RecRow | null>(null),
    [fewer, setFewer] = useState<Fewer | null>(null), [busy, setBusy] = useState(false);
  const focusAfter = useRef<string | null>(null);

  const refresh = () => { for (const k of ["reception", "batch", "batches", "order-samples", "order-batches"]) qc.invalidateQueries({ queryKey: [k] }); };
  /** One change to one row. On a refusal the field goes back to the saved value and the reason is shown. */
  const patch = async (id: string, body: Record<string, unknown>) => {
    try { await api(`/batches/${b.batchNo}/samples/${id}`, { method: "PATCH", json: body }); refresh(); }
    catch (e) { toast((e as ApiError).message, "error"); refresh(); throw e; }
  };
  const release = async (r: RecRow) => { try { await api(`/batches/${b.batchNo}/samples/${r.id}/release`, { method: "POST" }); toast(`${r.clientRef} released from hold`); refresh(); } catch (e) { toast((e as ApiError).message, "error"); } };
  const arriveAll = async () => { try { await api(`/batches/${b.batchNo}/arrive-all`, { method: "POST" }); refresh(); } catch (e) { toast((e as ApiError).message, "error"); } };
  const confirm = async (fewerOk: boolean) => {
    setBusy(true);
    try {
      await api(`/batches/${b.batchNo}/confirm`, { method: "POST", json: { fewer: fewerOk } });
      toast("Reception confirmed");
      setFewer(null); refresh();
      nav(`/batches/${b.batchNo}/preparation`);
    } catch (e) {
      const err = e as ApiError;
      // fewer samples arrived than were in the batch: the server sends the counts and the dialog asks first
      if (err.code === "fewer") setFewer(err.data as Fewer);
      else { toast(err.message, "error"); refresh(); }
    } finally { setBusy(false); }
  };

  // scan or type a label: the sample is found by its client reference, Sample ID or sample code, ticked Arrived, and its mass takes the cursor
  const scan = async (text: string) => {
    const t = text.trim().toLowerCase();
    if (!t) return;
    const r = rows.find((x) => [x.clientRef, x.sampleNo, x.sampleCode].some((c) => c && c.toLowerCase() === t));
    if (!r) return toast(`No sample of this batch matches "${text.trim()}".`, "error");
    if (!canReceive) return toast(`${r.clientRef} is in this batch.`);
    focusAfter.current = r.id;
    if (!r.arrived) { try { await patch(r.id, { arrived: true }); } catch { return; } }
    toast(`${r.clientRef} found`);
  };
  useEffect(() => {
    if (!focusAfter.current) return;
    const el = document.getElementById(`mass-${focusAfter.current}`);
    if (el) { el.scrollIntoView({ block: "center" }); (el as HTMLInputElement).focus(); focusAfter.current = null; }
  });

  if (q.isLoading) return <Card title="Reception"><span className="t-sm c-mut">Loading the samples…</span></Card>;
  if (q.error || !rec) return <Card title="Reception"><Empty icon="warning-circle" title="The samples could not be loaded." text={(q.error as ApiError | null)?.message} /></Card>;

  const arrivedRows = rows.filter((r) => r.arrived);
  const toPrint = arrivedRows.filter((r) => !r.label.printed).length;
  const allOk = rec.checks.length > 0 && rec.checks.every((c) => c.ok);
  const firstBad = rec.checks.find((c) => !c.ok)?.text;
  const needsRemark = (r: RecRow) => !!r.condition && !!rec.conditions.find((c) => c.value === r.condition)?.needsRemark;
  const condOk = (r: RecRow) => !!r.condition && !needsRemark(r);
  const sz = (size?: "touch") => (size ? { size } : {});
  const confirmBtn = (size?: "touch") => canReceive && (
    <Button type="primary" icon="check-circle" id="confirm-reception" {...sz(size)} disabled={!allOk || busy} why={firstBad ? `Before you can confirm reception: ${firstBad.toLowerCase()}.` : "Nothing to confirm yet."} onClick={() => confirm(false)}>Confirm reception</Button>
  );
  const markAll = canReceive && <Button icon="check" id="mark-all" disabled={rows.every((r) => r.arrived)} onClick={arriveAll}>Mark all arrived</Button>;
  const printBtn = (size?: "touch") => canLabel && arrivedRows.length > 0 && <Button icon="printer" id="print-labels" {...sz(size)} onClick={() => setLabels({})}>{toPrint ? `Print labels (${toPrint})` : "Print labels"}</Button>;
  const scanField = (
    <ScanField onScan={scan} />
  );

  /* ----- cells ----- */
  const rowMenu = (r: RecRow) => {
    const items = [
      canReceive && r.arrived && !r.hold && { label: "Hold sample", icon: "pause-circle", onClick: () => setHold(r) },
      canReceive && r.hold && { label: "Release from hold", icon: "play-circle", onClick: () => release(r) },
      canLabel && r.arrived && { label: r.label.printed ? "Reprint label" : "Print label", icon: "printer", onClick: () => setLabels({ only: [r.id] }) },
    ];
    return (
      <span className="row g4" style={{ flexWrap: "nowrap", justifyContent: "flex-end" }}>
        {!open && <span className="c-mut" title="Reception is confirmed, so the rows can't change."><Icon n="lock-simple" /></span>}
        <Menu label={`More for ${r.clientRef}`} items={items} quiet />
      </span>
    );
  };
  const arrivedCell = (r: RecRow) => <ArrivedBox on={r.arrived} name={r.clientRef} disabled={!canReceive || !!r.hold} onChange={(v) => patch(r.id, { arrived: v }).catch(() => undefined)} />;
  const massCell = (r: RecRow) => !r.arrived ? <span className="c-mut">—</span> : canReceive
    ? <Field id={`mass-${r.id}`} mono value={r.mass ?? ""} label={`Mass in kg, ${r.clientRef}`} className={cx(massWarn(r.mass) && "warn")} onSave={(v) => patch(r.id, { mass: v || null })} />
    : <span className="t-data-sm">{r.mass ?? "—"}</span>;
  const condCell = (r: RecRow, inlineRemark: boolean) => !r.arrived ? <span className="c-mut">—</span> : (
    <span className="col g4">
      <span className="row g6" style={{ flexWrap: "nowrap" }}>
        {canReceive ? <Select value={r.condition ?? ""} onChange={(v) => patch(r.id, { condition: v || null }).catch(() => undefined)} options={[["", "Choose"], ...rec.conditions.map((c) => [c.value, c.value] as [string, string])]} width={tablet ? 84 : 128} />
          : <span className="t-sm">{r.condition ?? "—"}</span>}
        {r.condition && <span className={condOk(r) ? "c-ok" : "c-warn"} title={condOk(r) ? "Good" : "Needs a remark"}><Icon n={condOk(r) ? "check-circle" : "warning"} /></span>}
      </span>
      {inlineRemark && (needsRemark(r) || r.conditionRemark) && (canReceive ? <Field value={r.conditionRemark ?? ""} label={`Remark, ${r.clientRef}`} onSave={(v) => patch(r.id, { conditionRemark: v || null })} /> : <span className="t-cap c-sec">{r.conditionRemark}</span>)}
    </span>
  );
  const remarkCell = (r: RecRow) => !r.arrived ? <span className="c-mut">—</span> : canReceive && (needsRemark(r) || r.conditionRemark)
    ? <Field value={r.conditionRemark ?? ""} label={`Remark, ${r.clientRef}`} onSave={(v) => patch(r.id, { conditionRemark: v || null })} />
    : <span className={cx("t-sm", r.conditionRemark ? "c-for" : "c-mut")}>{r.conditionRemark || "—"}</span>;
  const photoCell = (r: RecRow) => !r.arrived ? <span className="c-mut">—</span> : r.photos.count > 0 ? (
    <button type="button" className="pho-cell" aria-label={`Photos of ${r.clientRef}, ${r.photos.count}`} onClick={() => setPhotos(r)}>
      <span className="pho-thumb">{r.photos.thumb ? <img src={r.photos.thumb} alt="" /> : <Icon n="image" />}</span>
      {r.photos.count > 1 && <span className="t-cap c-sec">+{r.photos.count - 1}</span>}
    </button>
  ) : canPhoto ? <Button type="ghost" size="sm" icon="plus" label={`Add a photo of ${r.clientRef}`} onClick={() => setPhotos(r)}>Add</Button> : <span className="c-mut">—</span>;
  const labelCell = (r: RecRow, withDate: boolean) => !r.arrived ? <span className="c-mut">—</span> : (
    <span className="col" style={{ gap: 2, alignItems: "flex-start" }}>
      <Tag label={r.label.printed ? "Printed" : "Not printed"} tone={r.label.printed ? "green" : "amber"} icon="printer" />
      {withDate && r.label.printed && r.label.at && <span className="t-cap c-mut">{dShort(r.label.at)} {dTime(r.label.at)}</span>}
    </span>
  );
  const idCell = (r: RecRow, stack: boolean) => (
    <span className="col" style={{ gap: 0, minWidth: 0 }}>
      <b className="t-data-b c-head">{r.clientRef}</b>
      {stack && (r.sampleCode ? <span className="t-data-sm c-sec ellip" title={r.sampleNo ?? undefined}>{r.sampleCode}</span> : null)}
      {r.hold && <span className="t-cap" style={{ color: "var(--feedback-error)" }}>Held: {r.hold.reason}</span>}
    </span>
  );
  const codeCell = (r: RecRow) => r.sampleCode ? <span className="col" style={{ gap: 0 }}><b className="t-data-b">{r.sampleCode}</b><span className="t-data-sm c-sec">{r.sampleNo}</span></span> : <span className="t-cap c-mut">Given on arrival</span>;

  const cols: Array<Col<RecRow> | false> = tablet ? [
    { h: "#", w: 24, render: (r) => <span className="c-mut">{r.rowNo}</span> },
    { h: "Sample", render: (r) => idCell(r, true) },
    { h: "Arrived", w: 52, render: arrivedCell },
    { h: "Mass (kg)", w: 84, render: massCell },
    { h: "Condition", w: 120, render: (r) => condCell(r, true) },
    { h: "Photos", w: 60, render: photoCell },
    { h: "Label", w: 100, render: (r) => labelCell(r, false) },
    { h: "", w: 40, cls: "r", render: rowMenu },
  ] : [
    { h: "#", w: 40, render: (r) => <span className="c-mut">{r.rowNo}</span> },
    { h: "Client reference", w: 124, render: (r) => idCell(r, false) },
    { h: "Sample code", w: 164, render: codeCell },
    { h: "Arrived", w: 76, render: arrivedCell },
    { h: "Mass (kg)", w: 104, render: massCell },
    { h: "Condition", w: 168, render: (r) => condCell(r, false) },
    { h: "Remarks", fill: true, render: remarkCell },
    { h: "Photos", w: 84, render: photoCell },
    { h: "Label", w: 116, render: (r) => labelCell(r, true) },
    { h: "", w: 64, cls: "r", render: rowMenu },
  ];

  const checklist = open && rec.checks.length > 0 && (
    <div className="col g6" aria-label="Before you can confirm reception">
      <b className="t-sm w6 c-head">Before you can confirm reception</b>
      {rec.checks.map((c) => (
        <span key={c.text} className={cx("row g8 t-sm", c.ok ? "c-for" : "c-sec")} style={{ flexWrap: "nowrap", alignItems: "flex-start" }}>
          <span className={c.ok ? "c-ok" : "c-mut"}><Icon n={c.ok ? "check-circle" : "circle"} /></span>{c.text}
        </span>
      ))}
    </div>
  );
  const returned = !open && b.returned.length > 0 && (
    <div className="note"><Icon n="info" /><span>{b.returned.length} {b.returned.length === 1 ? "sample" : "samples"} returned to {b.order.orderNo}: {b.returned.join(", ")}. <Link to={`/orders/${b.order.orderNo}/samples`}>Open the job order's samples</Link></span></div>
  );
  const dialogs = (
    <>
      {labels && <PrintLabelsDialog b={b} rows={rows} {...(labels.only ? { only: labels.only } : {})} phone={phone} onClose={() => setLabels(null)} />}
      {photos && <PhotosDialog batchNo={b.batchNo} row={rows.find((r) => r.id === photos.id) ?? photos} canAdd={canPhoto} phone={phone} touch={phone || tablet} onClose={() => setPhotos(null)} />}
      {hold && <HoldDialog batchNo={b.batchNo} row={hold} reasons={rec.holdReasons} phone={phone} onClose={() => setHold(null)} />}
      {fewer && <FewerDialog f={fewer} orderNo={b.order.orderNo} busy={busy} phone={phone} onClose={() => setFewer(null)} onOk={() => confirm(true)} />}
    </>
  );
  /* ----- phone: a card per sample ----- */
  if (phone)
    return (
      <div className="col g12">
        {scanField}
        {!rows.length ? <Card><Empty icon="stack" title="No samples" /></Card> : rows.map((r) => (
          <div key={r.id} className="rc" id={`rc-${r.id}`}>
            <div className="row between" style={{ flexWrap: "nowrap", alignItems: "center" }}>
              <span className="row g8" style={{ flexWrap: "nowrap", minWidth: 0 }}><b className="t-data-b c-head">{r.clientRef}</b>{r.sampleCode && <span className="t-data-sm c-sec ellip">{r.sampleCode}</span>}</span>
              <span className="row g8" style={{ flexWrap: "nowrap" }}><ArrivedBox on={r.arrived} name={r.clientRef} disabled={!canReceive || !!r.hold} onChange={(v) => patch(r.id, { arrived: v }).catch(() => undefined)} /><span className="t-sm">Arrived</span></span>
            </div>
            {r.hold && <span className="t-cap" style={{ color: "var(--feedback-error)" }}>Held: {r.hold.reason}</span>}
            {r.arrived && (
              <>
                <div className="rc-grid">
                  <label className="col g4"><span className="flabel">Mass (kg)</span>{canReceive ? <Field id={`mass-${r.id}`} mono value={r.mass ?? ""} label={`Mass in kg, ${r.clientRef}`} className={cx("rc-in", massWarn(r.mass) && "warn")} onSave={(v) => patch(r.id, { mass: v || null })} /> : <span className="t-data-sm">{r.mass ?? "—"}</span>}</label>
                  <div className="col g4"><span className="flabel">Condition</span>{canReceive ? <Select value={r.condition ?? ""} onChange={(v) => patch(r.id, { condition: v || null }).catch(() => undefined)} options={[["", "Choose"], ...rec.conditions.map((c) => [c.value, c.value] as [string, string])]} /> : <span className="t-sm">{r.condition ?? "—"}</span>}</div>
                </div>
                {(needsRemark(r) || r.conditionRemark) && (canReceive ? <Field value={r.conditionRemark ?? ""} label={`Remark, ${r.clientRef}`} className="rc-in" onSave={(v) => patch(r.id, { conditionRemark: v || null })} /> : <span className="t-cap c-sec">{r.conditionRemark}</span>)}
                <div className="rc-photos">
                  {r.photos.count > 0 && <button type="button" className="pho-cell big" aria-label={`Photos of ${r.clientRef}, ${r.photos.count}`} onClick={() => setPhotos(r)}><span className="pho-thumb">{r.photos.thumb ? <img src={r.photos.thumb} alt="" /> : <Icon n="image" />}</span>{r.photos.count > 1 && <span className="t-cap c-sec">+{r.photos.count - 1}</span>}</button>}
                  {canPhoto && <button type="button" className="pho-new sm" onClick={() => setPhotos(r)}><Icon n="plus" s={20} /><span className="t-cap">Add photo</span></button>}
                </div>
                <div className="row between" style={{ flexWrap: "nowrap", alignItems: "center" }}>
                  <span className="row g8" style={{ flexWrap: "nowrap" }}>{labelCell(r, false)}{r.label.printed && r.label.at && <span className="t-cap c-mut">{dShort(r.label.at)} {dTime(r.label.at)}</span>}</span>
                  {rowMenu(r)}
                </div>
              </>
            )}
          </div>
        ))}
        {checklist && <Card>{checklist}</Card>}
        {returned}
        {(canLabel || canReceive) && (
          <div className="sticky-bar">
            {printBtn("touch")}
            {confirmBtn("touch")}
          </div>
        )}
        {dialogs}
      </div>
    );

  /* ----- desktop and tablet ----- */
  return (
    <Card title="Reception" actions={tablet ? confirmBtn() || undefined : open ? <>{scanField}{markAll}{printBtn()}{confirmBtn()}</> : <>{printBtn()}</>} className="rec-card">
      {tablet && open && <div className="row g8 wrap">{scanField}{markAll}{printBtn()}</div>}
      {tablet && !open && printBtn() && <div className="row g8">{printBtn()}</div>}
      <Table rows={rows} keyOf={(r) => r.id} cols={cols} empty={<Empty icon="stack" title="No samples in this batch" />} />
      {checklist}
      {returned}
      {dialogs}
    </Card>
  );
}

/** "Scan or type a label": a scanner gun types like a keyboard and ends with Enter. */
function ScanField({ onScan }: { onScan: (t: string) => void }) {
  const [v, setV] = useState("");
  const ref = useRef<HTMLInputElement>(null);
  return (
    <label className="search sm scan">
      <Icon n="magnifying-glass" />
      <input ref={ref} id="scan" value={v} placeholder="Scan or type a label" aria-label="Scan or type a label" onChange={(e) => setV(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); onScan(v); setV(""); } }} />
      <span className="scanbtn" aria-hidden="true"><Icon n="barcode" s={14} /></span>
    </label>
  );
}
