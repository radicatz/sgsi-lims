// The job order's Batches tab (FigCraft 03-03-03 Batches, 05 Batches_samples_awaiting_arrival): its batches with who prepared and analysed them,
// Add batch, and a note when samples came back from a reception and wait to arrive. A row opens the batch page. Phone: cards, no Add batch (as drawn).
import { useState } from "react";
import { useNavigate } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../app/api";
import { useSession } from "../../app/session";
import { Avatar, Badge, Button, Card, Empty, Icon, Table, Tag, type Col } from "../../components";
import { AddBatch } from "../batches/AddBatch";
import { STATUS_LABEL, STATUS_TONE, STD_LABEL, dShort, tabFor, type Std } from "../batches/shared";

interface Person { by: string | null; at: string; started: boolean }
interface Row { id: string; batchNo: string; batchDate: string; deadlineOn: string | null; standard: Std; status: string; samples: number; roaNo: string | null; parameters: string; parametersNote: string; prep: Person | null; analysis: Person | null }

export function BatchesTab({ no, live, phone, tablet }: { no: string; live: boolean; phone: boolean; tablet: boolean }) {
  const { me } = useSession(), nav = useNavigate();
  const q = useQuery({ queryKey: ["order-batches", no], queryFn: () => api<{ awaitingArrival: number; awaitingFrom: string[]; items: Row[] }>(`/orders/${no}/batches`) });
  const [adding, setAdding] = useState(false);
  const canAdd = !!me?.permissions.includes("batch.create") && live;
  const items = q.data?.items ?? [];
  const open = (b: Row) => nav(`/batches/${b.batchNo}/${tabFor(b.status)}`);
  const who = (p: Person | null) => p ? (
    <span className="row g8" style={{ flexWrap: "nowrap" }}>{p.by && <Avatar name={p.by} size={24} />}<span className="col" style={{ gap: 0 }}><span className="t-sm">{p.by ?? "System"}</span><span className="t-cap c-sec">{p.started ? "Started " : ""}{dShort(p.at)}</span></span></span>
  ) : <span className="c-mut">—</span>;
  const cols: Array<Col<Row> | false> = [
    { h: "Batch no.", w: 130, render: (b) => <span className="col" style={{ gap: 0 }}><b className="t-data-b c-head">{b.batchNo}</b><span className="t-cap c-mut">{dShort(b.batchDate)}</span></span> },
    { h: "Standard", fit: true, render: (b) => <Tag label={STD_LABEL[b.standard]} /> },
    { h: "Samples", fit: true, render: (b) => <span className="t-sm">{b.samples}</span> },
    !tablet && { h: "Parameters", render: (b) => <span className="col" style={{ gap: 0 }}><span className="t-sm">{b.parameters}</span><span className="t-cap c-mut">{b.parametersNote}</span></span> },
    { h: "Status", fit: true, render: (b) => <Badge label={STATUS_LABEL(b.status)} tone={STATUS_TONE(b.status)} sm /> },
    !tablet && { h: "Preparation", render: (b) => who(b.prep) },
    !tablet && { h: "Analysis", render: (b) => who(b.analysis) },
    !tablet && { h: "RoA", fit: true, render: (b) => b.roaNo ? <span className="t-data c-act">{b.roaNo}</span> : <span className="c-mut">—</span> },
    { h: "Deadline", fit: true, render: (b) => <span className="t-sm">{dShort(b.deadlineOn) || "—"}</span> },
    { h: "", w: 32, cls: "r", render: () => <span className="c-mut"><Icon n="caret-right" /></span> },
  ];
  const addBtn = canAdd && !phone && <Button icon="plus" id="add-batch-tab" onClick={() => setAdding(true)}>Add batch</Button>;
  const n = q.data?.awaitingArrival ?? 0;
  return (
    <Card title="Batches" actions={addBtn || undefined}>
      {n > 0 && (
        <div className="note warn" id="awaiting-note"><Icon n="hourglass" /><span>{n} {n === 1 ? "sample is" : "samples are"} awaiting arrival (returned from {q.data!.awaitingFrom.join(", ")}). When {n === 1 ? "it arrives" : "they arrive"}, add {n === 1 ? "it" : "them"} with Add batch.</span></div>
      )}
      {q.isLoading ? <span className="t-sm c-mut">Loading batches…</span> : !items.length ? (
        <Empty icon="stack" title="No batches yet" text="The lab creates a batch from the samples it receives." />
      ) : phone ? (
        <div className="col g10">
          {items.map((b) => (
            <div key={b.id} className="icard bl-card" role="link" tabIndex={0} onClick={() => open(b)} onKeyDown={(e) => e.key === "Enter" && open(b)}>
              <div className="row between"><b className="t-data-b c-head">{b.batchNo}</b><Badge label={STATUS_LABEL(b.status)} tone={STATUS_TONE(b.status)} sm /></div>
              <div className="row between"><span className="row g8"><Tag label={STD_LABEL[b.standard]} /><span className="t-sm c-sec">{b.samples} {b.samples === 1 ? "sample" : "samples"}</span></span><span className="t-sm c-sec">Due {dShort(b.deadlineOn)}</span></div>
            </div>
          ))}
        </div>
      ) : (
        <Table rows={items} keyOf={(b) => b.id} onRow={open} cols={cols} />
      )}
      {adding && <AddBatch orderNo={no} phone={phone} onClose={() => setAdding(false)} />}
    </Card>
  );
}
