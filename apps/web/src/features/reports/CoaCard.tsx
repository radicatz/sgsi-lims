// The CoA card of the job order (FigCraft 03-Job_orders-03-Job_order_detail, Revision 17): five states fed by GET /orders/:no/coa.
// Not ready, Ready (Generate CoA), Draft (Continue), Awaiting signature, Published or Sent (Open in Reports). Also shows the signatory control.
import { useState } from "react";
import { useNavigate } from "react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api, ApiError } from "../../app/api";
import { Alert, Badge, Button, Card, Confirm, Empty, KV, Select, fmtDate, toast, type Tone } from "../../components";
import { COA_STATUS } from "./status";

interface Slot { id: string; number: string | null; revision: number; status: string; signatory: { name: string; title: string } | null; signedBy: string | null; signedAt: string | null; publishedAt: string | null; sentForSignatureAt: string | null; sentBy: string | null; draftedBy: string | null; pages: number | null }
export interface OrderCoa {
  state: "not_ready" | "ready" | "preparing" | "draft" | "awaiting_signature" | "published" | "sent"; orderNo: string; orderStatus: string;
  batches: { total: number; done: number }; current: Slot | null; open: Slot | null; sends: number; can: { generate: boolean; download: boolean; open: boolean };
}
export const useOrderCoa = (no: string, enabled = true) => useQuery({ queryKey: ["order-coa", no], queryFn: () => api<OrderCoa>(`/orders/${no}/coa`), enabled });

/** The Overview and the CoA tab show the same card; `signers` fills the signatory control for those who may edit the job order. */
export function CoaCard({ no, signatory, signers, canEdit, phone }: { no: string; signatory: { id: string | null; name: string } | null; signers: Array<{ id: string; name: string; title: string }>; canEdit: boolean; phone: boolean }) {
  const q = useOrderCoa(no), nav = useNavigate(), qc = useQueryClient();
  const [busy, setBusy] = useState(false), [pick, setPick] = useState<string | null>(null);
  const d = q.data;
  if (!d) return <Card title="Certificate of Analysis"><Empty icon="certificate" title="Loading" /></Card>;
  const slot = d.open ?? d.current;
  const label: [string, Tone] = d.state === "not_ready" ? ["Pending", "grey"] : d.state === "ready" ? ["Ready", "blue"] : d.state === "preparing" ? ["In preparation", "amber"] : d.state === "draft" ? ["Draft", "grey"]
    : d.state === "awaiting_signature" ? ["Awaiting signature", "amber"] : d.state === "sent" ? ["Sent", "green"] : ["Published", "green"];
  const refresh = () => { for (const k of ["order-coa", "order", "orders", "coa"]) qc.invalidateQueries({ queryKey: [k] }); };
  const generate = async () => {
    setBusy(true);
    try { const r = await api<{ id: string }>(`/orders/${no}/coa`, { method: "POST" }); refresh(); nav(`/reports/coa/${r.id}`); }
    catch (e) { const a = e as ApiError; const id = (a.data as { id?: string } | undefined)?.id; if (id) nav(`/reports/coa/${id}`); else toast(a.message, "error"); } finally { setBusy(false); }
  };
  const changeSignatory = async (id: string, force = false) => {
    if (!force && d.state === "awaiting_signature") return setPick(id);
    setBusy(true);
    try { await api(`/orders/${no}/signatory`, { method: "PUT", json: { signatoryId: id } }); toast("Signatory changed"); setPick(null); refresh(); }
    catch (e) { toast((e as ApiError).message, "error"); setPick(null); } finally { setBusy(false); }
  };
  const nextName = signers.find((s) => s.id === pick)?.name ?? "the new signatory";

  const body = (() => {
    switch (d.state) {
      case "not_ready":
        return <Empty icon="certificate" title="The CoA is not ready" text={d.batches.total ? `Every batch needs its signed RoA and to be completed first (${d.batches.done} of ${d.batches.total} done).` : "The lab has not created a batch for this job order yet."} />;
      case "ready":
        return <Empty icon="certificate" title="Ready for the CoA" text="Every batch is completed. The draft takes its values from the verified analyses." action={d.can.generate ? <Button type="primary" icon="plus" id="coa-generate" disabled={busy} onClick={generate}>Generate CoA</Button> : undefined} />;
      case "preparing":
        return <Empty icon="clock" title="The lab is preparing the CoA" text="You will be asked to sign it when it is ready." />;
      default:
        return slot && (
          <div className="col g12">
            <div className="row between wrap"><b className="t-data-b c-head" id="coa-no">{slot.number ?? `Draft, revision ${slot.revision}`}</b><Badge sm label={COA_STATUS[slot.status]?.[0] ?? slot.status} tone={COA_STATUS[slot.status]?.[1] ?? "grey"} /></div>
            {d.state === "awaiting_signature" && <Alert tone="info" title={`Waiting for ${slot.signatory?.name ?? "the signatory"}`} {...(slot.sentForSignatureAt ? { text: `Sent ${fmtDate(slot.sentForSignatureAt)}${slot.sentBy ? ` by ${slot.sentBy}` : ""}.` } : {})} />}
            {(d.state === "published" || d.state === "sent") && (
              <div className="col g8">
                <KV k="Published">{slot.publishedAt ? fmtDate(slot.publishedAt) : "—"}</KV>
                <KV k="Signed by">{slot.signedBy ?? slot.signatory?.name ?? "—"}</KV>
                <KV k="Delivery">{d.sends ? `Sent ${d.sends} ${d.sends === 1 ? "time" : "times"}` : "Not sent to the client yet"}</KV>
              </div>
            )}
            {d.state === "draft" && <span className="t-sm c-sec">The draft is not sent for signature yet.</span>}
            {d.can.open && <span className="row g8"><Button type={d.state === "draft" ? "primary" : undefined} icon="arrow-square-out" id="coa-open" onClick={() => nav(`/reports/coa/${slot.id}`)}>{d.state === "draft" ? "Continue draft" : d.state === "awaiting_signature" ? "Open" : "Open in Reports"}</Button></span>}
          </div>
        );
    }
  })();
  const edit = canEdit && !["published", "sent"].includes(d.state) && !["cancelled", "closed"].includes(d.orderStatus);
  return (
    <Card title="Certificate of Analysis" actions={<Badge sm label={label[0]} tone={label[1]} />}>
      <div className="col g16">
        {body}
        {edit && (
          <Select id="coa-order-signatory" label="Signatory" value={signatory?.id ?? ""} onChange={(v) => v && changeSignatory(v)} {...(phone ? {} : { width: 320 })}
            options={[["", signatory?.id ? "Choose who signs" : "No signatory yet"], ...signers.map((s): [string, string] => [s.id, s.title ? `${s.name}, ${s.title}` : s.name])]}
            help="Only this person can sign, signed in as themselves." />
        )}
      </div>
      {pick && (
        <Confirm title="Move the signature request?" text={`The certificate waits for ${slot?.signatory?.name ?? "the current signatory"}. It will wait for ${nextName} instead, and both are notified.`} ok="Move request" busy={busy} onOk={() => changeSignatory(pick, true)} onClose={() => setPick(null)} />
      )}
    </Card>
  );
}
