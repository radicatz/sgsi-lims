// Add batch (FigCraft 03-04-01 Dialog, 02 Late_samples; phone 03 Step_1, 04 Step_2): a batch is made from one job order, with the samples that go in it,
// the standard (one per batch), the parameters and the dates. Samples awaiting arrival come first and are ticked, with the settings of the batch they
// came back from as the starting point. Desktop and tablet: one dialog; phone: two full-screen steps.
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api, ApiError } from "../../app/api";
import { Alert, Button, Check, Dialog, Empty, Icon, Select, TextArea, TextField, cx, toFrame, toast } from "../../components";
import { useSave } from "../master-data/shared";
import { STD_LABEL, type Std } from "./shared";

interface Form {
  canAdd: boolean;
  why: string | null;
  orderNo: string;
  company: string;
  standards: Std[];
  nextBatchNo: string;
  batchDate: string;
  deadlineOn: string | null;
  priority: string;
  copyFrom: { batchNo: string; standard: Std; priority: string; parameterIds: string[]; text: string } | null;
  samples: Array<{ id: string; clientRef: string; awaiting: boolean; releasedFrom: string | null }>;
  parameters: Array<{ id: string; code: string; label: string; inOrder: boolean }>;
}

export function AddBatch({ orderNo, phone, onClose, onDone }: { orderNo: string; phone: boolean; onClose: () => void; onDone?: (batchNo: string) => void }) {
  const q = useQuery({ queryKey: ["batch-form", orderNo], queryFn: () => api<Form>(`/orders/${orderNo}/batch-form`), staleTime: 0, gcTime: 0 });
  const title = "Add batch";
  if (q.isLoading || !q.data)
    return q.error ? (
      <Dialog title={title} size="sm" onClose={onClose} footer={<Button onClick={onClose}>Close</Button>}>
        <Alert tone="error" title="The form could not be loaded." text={(q.error as ApiError).message} />
      </Dialog>
    ) : null;
  if (!q.data.canAdd)
    return (
      <Dialog title={title} size="sm" onClose={onClose} footer={<Button onClick={onClose}>Close</Button>}>
        <Empty icon="lock-simple" title="No batch can be added" text={q.data.why ?? undefined} />
      </Dialog>
    );
  return <Body f={q.data} phone={phone} onClose={onClose} {...(onDone ? { onDone } : {})} />;
}

function Body({ f, phone, onClose, onDone }: { f: Form; phone: boolean; onClose: () => void; onDone?: (batchNo: string) => void }) {
  const title = "Add batch";
  const awaiting = f.samples.filter((s) => s.awaiting);
  // samples awaiting arrival come first and are ticked for the CSO; a first batch starts with every expected sample ticked
  const ordered = useMemo(() => [...awaiting, ...f.samples.filter((s) => !s.awaiting)], [f]);
  const [picked, setPicked] = useState<Set<string>>(new Set((awaiting.length ? awaiting : f.samples).map((s) => s.id)));
  const [params, setParams] = useState<Set<string>>(new Set(f.copyFrom ? f.copyFrom.parameterIds : f.parameters.filter((p) => p.inOrder).map((p) => p.id)));
  const [no, setNo] = useState(f.nextBatchNo),
    [date, setDate] = useState(f.batchDate),
    [due, setDue] = useState(f.deadlineOn ?? ""),
    [std, setStd] = useState<Std>(f.copyFrom && f.standards.includes(f.copyFrom.standard) ? f.copyFrom.standard : f.standards[0]!),
    [priority, setPriority] = useState(f.copyFrom?.priority ?? f.priority),
    [coc, setCoc] = useState(""),
    [notes, setNotes] = useState(""),
    [err, setErr] = useState<Record<string, string>>({}),
    [step, setStep] = useState<1 | 2>(1);
  const save = useSave(
    () => api<{ batchNo: string }>("/batches", { method: "POST", json: { orderNo: f.orderNo, batchNo: no.trim(), batchDate: date, deadlineOn: due || null, standard: std, sampleIds: [...picked], parameterIds: [...params], priority, cocNo: coc, notes } }),
    {
      keys: ["batches", "order", "orders", "order-batches", "order-samples", "batch-form"],
      onDone: (r) => { toast(`${(r as { batchNo: string }).batchNo} created`); onDone?.((r as { batchNo: string }).batchNo); onClose(); },
      onField: (field, text) => { if (field === "sampleIds") setStep(1); setErr({ [field ?? "form"]: text }); },
    },
  );
  const tick = (id: string) => setPicked((p) => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const orderCodes = f.parameters.filter((p) => p.inOrder).map((p) => p.code), mine = f.parameters.filter((p) => params.has(p.id)).map((p) => p.code);
  const added = mine.filter((c) => !orderCodes.includes(c)), dropped = orderCodes.filter((c) => !mine.includes(c));
  const paramHint = added.length || dropped.length
    ? [added.length ? `+ ${added.join(", ")}` : "", dropped.length ? `− ${dropped.join(", ")}` : ""].filter(Boolean).join(" ") + " compared with the job order"
    : "Same parameters as the job order";
  const go = () => {
    const e: Record<string, string> = {};
    if (!/^B-\d{4}-\d{4}$/.test(no.trim())) e.batchNo = "Pattern B-YYYY-NNNN. The number must be unique.";
    if (!picked.size) e.sampleIds = "Tick at least one sample.";
    if (!params.size) e.parameterIds = "Choose at least one parameter.";
    if (due && due < date) e.deadlineOn = "The deadline can't be before the batch date.";
    setErr(e);
    if (Object.keys(e).length) { if (e.sampleIds) setStep(1); return; }
    save.mutate(undefined);
  };

  const job = (
    <span className="row g8 wrap">
      <b className="t-data-b">{f.orderNo}</b>
      <span className="t-sm c-sec">{f.company}</span>
    </span>
  );
  const samples = (
    <div className="col g8">
      <div className="row between">
        <span className="flabel">Samples<span className="req">*</span></span>
        <span className="t-cap c-mut" aria-live="polite">{picked.size} of {f.samples.length} selected</span>
      </div>
      {awaiting.length > 0 && <span className="t-sm c-sec">Awaiting arrival comes first and is ticked for you.</span>}
      <span className="row g8">
        <Button type="ghost" size="sm" id="ab-all" onClick={() => setPicked(new Set(f.samples.map((s) => s.id)))}>Select all ({f.samples.length})</Button>
        <Button type="ghost" size="sm" id="ab-clear" onClick={() => setPicked(new Set())}>Clear</Button>
      </span>
      <div className="ab-samples">
        {ordered.map((s) => (
          <span key={s.id} className="ab-s">
            <Check on={picked.has(s.id)} onChange={() => tick(s.id)} label={s.clientRef} />
            {s.awaiting && <span className="t-cap" style={{ color: "var(--status-st-prep)" }}>Awaiting arrival</span>}
            {s.awaiting && s.releasedFrom && <span className="t-cap c-mut">from {s.releasedFrom}</span>}
          </span>
        ))}
      </div>
      {err.sampleIds && <span className="help err">{err.sampleIds}</span>}
    </div>
  );
  const details = (
    <>
      <div className={cx("ab-row", phone && "stack")}>
        <TextField id="ab-no" label="Batch no." req value={no} onChange={setNo} error={err.batchNo ?? null} help="Pattern B-YYYY-NNNN. The number must be unique." />
        <TextField id="ab-date" label="Batch date" type="date" value={date} onChange={setDate} />
        <TextField id="ab-due" label="Deadline" type="date" value={due} onChange={setDue} error={err.deadlineOn ?? null} />
      </div>
      {f.copyFrom && (
        <div className="note ab-copy"><Icon n="copy" /><span>Settings copied from {f.copyFrom.batchNo}: {STD_LABEL[f.copyFrom.standard]}, {f.copyFrom.text} and {f.copyFrom.priority} priority.</span></div>
      )}
      <div className="col g8">
        <span className="flabel">Standard<span className="req">*</span></span>
        <span className="row g8 wrap">
          {f.standards.map((s) => (
            <button key={s} type="button" className={cx("chip", std === s && "on")} aria-pressed={std === s} id={`ab-std-${s}`} onClick={() => setStd(s)}>{STD_LABEL[s]}</button>
          ))}
        </span>
        <span className="help">One standard per batch. This job order {f.standards.length === 1 ? `uses ${STD_LABEL[f.standards[0]!]} only` : `has ${f.standards.map((s) => STD_LABEL[s]).join(" and ")}`}.</span>
        {err.standard && <span className="help err">{err.standard}</span>}
      </div>
      {!phone && samples}
      <div className="col g8">
        <span className="flabel">Parameters</span>
        <span className="row g8 wrap">
          {f.parameters.map((p) => (
            <button key={p.id} type="button" className={cx("ppill", params.has(p.id) && "on")} aria-pressed={params.has(p.id)} id={`ab-p-${p.code}`}
              onClick={() => setParams((s) => { const n = new Set(s); n.has(p.id) ? n.delete(p.id) : n.add(p.id); return n; })}>{p.label}</button>
          ))}
        </span>
        <span className="help">{paramHint}</span>
        {err.parameterIds && <span className="help err">{err.parameterIds}</span>}
      </div>
      <div className={cx("ab-row two", phone && "stack")}>
        <Select id="ab-priority" label="Priority" value={priority} onChange={setPriority} options={[["Standard", "Standard"], ["Urgent", "Urgent"]]} />
        <TextField id="ab-coc" label="CoC no. (optional)" value={coc} onChange={setCoc} placeholder="Chain of custody form" />
      </div>
      <TextArea id="ab-notes" label="Notes" value={notes} onChange={setNotes} placeholder="Add a note for the lab…" rows={3} />
      {err.form && <Alert tone="error" title={err.form} />}
    </>
  );

  if (!phone)
    return (
      <Dialog title={title} size="xl" onClose={onClose} sub={job}
        footer={<><Button onClick={onClose}>Cancel</Button><Button type="primary" id="ab-create" disabled={save.isPending} onClick={go}>Create batch</Button></>}>
        {details}
      </Dialog>
    );
  return toFrame(
    <div className="fullscreen" role="dialog" aria-label={title}>
      <div className="fh">
        <Button iconOnly icon={step === 2 ? "caret-left" : "x"} label={step === 2 ? "Back" : "Close"} size="touch" onClick={() => (step === 2 ? setStep(1) : onClose())} />
        <b className="t-sm w6 grow">{title}</b>
      </div>
      <div className="fb">
        <div className="col g16">
          <div className="col g6">
            <span className="t-cap w6 c-sec">Step {step} of 2</span>
            <span className="steps2"><i className="on" /><i className={cx(step === 2 && "on")} /></span>
            <b className="t-cap w6">{step === 1 ? "Samples" : "Details"}</b>
          </div>
          {job}
          {step === 1 ? samples : details}
        </div>
      </div>
      <div className="sticky-bar fixed">
        {step === 1 ? (
          <Button type="primary" size="touch" block id="ab-next" onClick={() => (picked.size ? (setErr({}), setStep(2)) : setErr({ sampleIds: "Tick at least one sample." }))}>Next ({picked.size} selected)</Button>
        ) : (
          <>
            <Button size="touch" onClick={() => setStep(1)}>Back</Button>
            <Button type="primary" size="touch" id="ab-create" disabled={save.isPending} onClick={go}>Create batch</Button>
          </>
        )}
      </div>
    </div>,
  );
}

/** Add batch from the batch list: first the job order (frame 04-01-06), then the form for it. */
export function ChooseOrder({ phone, onClose, onChosen }: { phone: boolean; onClose: () => void; onChosen: (orderNo: string) => void }) {
  const q = useQuery({ queryKey: ["batch-open-orders"], queryFn: () => api<{ items: Array<{ orderNo: string; company: string; free: number }> }>("/batches/open-orders").then((r) => r.items), staleTime: 0 });
  const [pick, setPick] = useState("");
  const [find, setFind] = useState("");
  const list = (q.data ?? []).filter((o) => !find || `${o.orderNo} ${o.company}`.toLowerCase().includes(find.toLowerCase()));
  return (
    <Dialog title="Add batch" size="sm" phone={phone} onClose={onClose}
      footer={<><Button onClick={onClose}>Cancel</Button><Button type="primary" id="ab-next-order" disabled={!pick} why="Choose the job order first" onClick={() => onChosen(pick)}>Next</Button></>}>
      <span className="t-sm c-sec">A batch is created from a job order. Choose the job order first.</span>
      <TextField id="ab-find" label="Job order" req value={find} onChange={setFind} placeholder="Search job order or company" />
      <div className="col g8 ab-orders">
        {q.isLoading ? <span className="t-sm c-mut">Loading job orders…</span> : !list.length ? <span className="t-sm c-mut">No job order is open for a new batch.</span> : list.map((o) => (
          <button key={o.orderNo} type="button" className={cx("ab-o", pick === o.orderNo && "on")} aria-pressed={pick === o.orderNo} disabled={o.free === 0}
            title={o.free === 0 ? "Every sample of this job order is in a batch, received or marked not received." : undefined} onClick={() => setPick(o.orderNo)}>
            <b className="t-data-b">{o.orderNo}</b>
            <span className="t-cap c-sec">{o.company}</span>
            <span className="t-cap c-mut">{o.free === 0 ? "No sample is free for a batch" : `${o.free} ${o.free === 1 ? "sample" : "samples"} to add`}</span>
            {pick === o.orderNo && <Icon n="check" />}
          </button>
        ))}
      </div>
    </Dialog>
  );
}
