// The RoA page (FigCraft 07-Reports-03 RoA; phone 07-03-01): the signed paper RoA the lab uploaded when the batch was completed (D-49), read only. The file is shown in a
// frame (phone: Open PDF), with its details and the CoAs built from it.
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { api, ApiError } from "../../app/api";
import { useBreakpoint } from "../../app/session";
import { Alert, Badge, Button, Card, Empty, Icon, KV, PageHead, fileSize, fmtDate, toast } from "../../components";
import { COA_STATUS } from "./status";

interface Roa { id: string; roaNo: string; fileName: string; sizeBytes: number; uploadedAt: string; uploadedBy: string | null; batch: { batchNo: string; status: string; standard: string; samples: number; completedAt: string | null; completedBy: string | null }; orderNo: string; company: string; usedIn: Array<{ id: string; number: string; revision: number; status: string }> | null }

export function RoaPage() {
  const { no = "" } = useParams(), nav = useNavigate(), phone = useBreakpoint() === "phone";
  const q = useQuery({ queryKey: ["roa-page", no], queryFn: () => api<Roa>(`/reports/roa/${no}`), retry: false });
  const file = useQuery({ queryKey: ["roa-file", no], queryFn: () => api<{ url: string }>(`/batches/${no}/roa/file`), enabled: !!q.data, staleTime: 30 * 60_000 });
  const [busy, setBusy] = useState(false);
  if (q.isLoading) return <div className="page"><Card><Empty icon="file-pdf" title="Loading RoA" /></Card></div>;
  if (q.error || !q.data) return <div className="page"><Card><Empty icon="file-pdf" title="RoA not found" text="No signed RoA is attached to this batch, or you may not have access." action={<Button onClick={() => nav("/reports")}>Back to reports</Button>} /></Card></div>;
  const d = q.data, url = file.data?.url ?? null;
  const download = async () => { setBusy(true); try { const x = await api<{ url: string }>(`/batches/${no}/roa/file`); window.open(x.url, "_blank", "noopener"); } catch (e) { toast((e as ApiError).message, "error"); } finally { setBusy(false); } };
  const print = () => { if (url) window.open(url.replace(/([?&])download=[^&]*&?/, "$1"), "_blank", "noopener"); };
  const actions = <><Button icon="printer" id="roa-print" disabled={!url} onClick={print}>Print</Button><Button {...(phone ? { type: "primary" as const } : {})} icon="download-simple" id="roa-download" disabled={busy} onClick={download}>Download</Button></>;
  const preview = phone ? (
    <div className="roa-file" id="roa-doc">
      <span aria-hidden style={{ width: 64, height: 90, flex: "none", borderRadius: 4, background: "var(--primary-50)", border: "1px solid var(--surface-border)", display: "grid", alignContent: "start", gap: 5, padding: "10px 8px" }}>
        {[100, 80, 100, 60, 90, 70].map((w, i) => <i key={i} style={{ display: "block", height: 3, width: `${w}%`, background: "var(--surface-border-strong, #d9cfbf)", borderRadius: 2 }} />)}
      </span>
      <span className="col" style={{ gap: 2, minWidth: 0, flex: 1 }}>
        <b className="t-sm c-head ellip">{d.fileName}</b><span className="t-cap c-sec">{fileSize(d.sizeBytes)}</span>
        <span><Button size="sm" icon="file-pdf" id="roa-open" disabled={!url} onClick={() => url && window.open(url, "_blank", "noopener")}>Open PDF</Button></span>
      </span>
    </div>
  ) : url ? <iframe title={d.roaNo} src={url.replace(/([?&])download=[^&]*&?/, "$1")} id="roa-preview" style={{ width: "100%", height: "78vh", minHeight: 560, border: "1px solid var(--surface-border)", borderRadius: 8, background: "#fff" }} /> : <Empty icon="file-pdf" title="Preparing the preview" />;
  return (
    <div className="page">
      <PageHead crumb={[["Reports", "/reports"], [d.roaNo]]} title={d.roaNo} badge={<Badge label="Signed copy" tone="blue" />} {...(phone ? {} : { actions })}
        sub={<span className="row g16 wrap t-sm c-sec"><Link to={`/orders/${d.orderNo}`} className="c-act t-data">{d.orderNo}</Link><span>{d.company}</span><Link to={`/batches/${d.batch.batchNo}`} className="c-act t-data">{d.batch.batchNo}</Link></span>} />
      <Alert tone="info" title="Internal, not for distribution" text="This is the lab's signed paper RoA, uploaded when the batch was completed." />
      <div className={phone ? "col g16" : undefined} style={phone ? undefined : { display: "grid", gridTemplateColumns: "minmax(0, 1fr) 380px", gap: 16, alignItems: "start" }}>
        <Card title={phone ? "Signed RoA" : "Preview"}>{preview}</Card>
        <div className="col g16">
          <Card title="Details">
            <div className="col g4">
              <KV k="Batch"><Link to={`/batches/${d.batch.batchNo}`} className="c-act t-data">{d.batch.batchNo}</Link></KV>
              <KV k="Job order"><Link to={`/orders/${d.orderNo}`} className="c-act t-data">{d.orderNo}</Link></KV>
              <KV k="Client">{d.company}</KV>
              <KV k="Samples">{d.batch.samples} samples</KV>
              <KV k="Standard">{d.batch.standard === "GBT" ? "GB/T" : d.batch.standard}</KV>
              <KV k="Uploaded"><span className="row g8 wrap"><span>{fmtDate(d.uploadedAt)}</span>{d.uploadedBy && <span className="c-act">{d.uploadedBy}</span>}</span></KV>
              {d.batch.completedAt && <KV k="Batch completed"><span className="row g8 wrap"><span>{fmtDate(d.batch.completedAt)}</span>{d.batch.completedBy && <span className="c-act">{d.batch.completedBy}</span>}</span></KV>}
              <KV k="File"><span className="row g8 wrap"><span>{d.fileName}</span><span className="c-act">{fileSize(d.sizeBytes)}</span></span></KV>
            </div>
          </Card>
          {d.usedIn && (
          <Card title="Used in">
            {d.usedIn.length ? <div className="col g8">{d.usedIn.map((u) => (
              <div key={u.id} className="row g8 wrap" style={{ alignItems: "center" }}><Link to={`/reports/coa/${u.id}`} className="t-data-b c-act">{u.number}</Link><Badge sm label={u.status === "issued" ? "Published" : (COA_STATUS[u.status]?.[0] ?? u.status)} tone={u.status === "issued" ? "purple" : (COA_STATUS[u.status]?.[1] ?? "grey")} /></div>))}</div>
              : <span className="t-sm c-mut">No CoA is built from this batch yet.</span>}
          </Card>
          )}
        </div>
      </div>
      {phone && <div className="sticky-bar">{actions}</div>}
    </div>
  );
}
