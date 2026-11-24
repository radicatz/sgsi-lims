// The Signed RoA card (FigCraft 04-Batches-02-Batch_detail 13 Signed_RoA_upload, 14 Batch_completed; spec F-RES-07, D-49): above the Analysis card once the
// analysis is finished. The Lab admin uploads the signed PDF with its RoA number, then completes the batch, which freezes the values (C-10).
import { useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api, apiBlob, ApiError } from "../../app/api";
import { useSession } from "../../app/session";
import { Button, Card, Confirm, Icon, TextField, cx, fileSize, toast } from "../../components";
import { dShort, dTime, type BatchPageData } from "./shared";

interface Roa { status: string; canDownload: boolean; roa: { roaNo: string; fileName: string | null; sizeBytes: number | null; uploadedBy: string | null; uploadedAt: string } | null }
const MAX = 10 * 1024 * 1024;

export function RoaCard({ b, phone }: { b: BatchPageData; phone: boolean }) {
  const { me } = useSession(), qc = useQueryClient();
  const can = (p: string) => !!me?.permissions.includes(p);
  const q = useQuery({ queryKey: ["roa", b.batchNo], queryFn: () => api<Roa>(`/batches/${b.batchNo}/roa`), enabled: b.stored === "analysis_finished" || b.stored === "completed" });
  const [no, setNo] = useState(""), [file, setFile] = useState<File | null>(null), [busy, setBusy] = useState(false), [ask, setAsk] = useState(false), [replace, setReplace] = useState(false);
  const [err, setErr] = useState<{ roaNo?: string; file?: string }>({}), pick = useRef<HTMLInputElement>(null), [making, setMaking] = useState(false);
  const d = q.data;
  if (!d) return null;
  const refresh = () => { for (const k of ["roa", "batch", "batches", "analysis", "adl", "order-batches"]) qc.invalidateQueries({ queryKey: [k] }); };
  const done = b.stored === "completed", r = d.roa;
  const canUpload = !done && can("batch.document.upload"), canComplete = !done && can("batch.complete");
  const form = canUpload && (!r || replace);

  const choose = (f: File | undefined) => {
    if (!f) return;
    setErr({});
    if (!/\.pdf$/i.test(f.name) && f.type !== "application/pdf") return setErr({ file: "Use a PDF file." });
    if (f.size > MAX) return setErr({ file: "The file is larger than 10 MB." });
    setFile(f);
  };
  const send = async () => {
    const e: typeof err = {};
    if (!no.trim()) e.roaNo = "Enter the RoA number.";
    if (!file) e.file = "Choose the signed RoA (PDF).";
    setErr(e);
    if (e.roaNo || e.file) return;
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("roaNo", no.trim());
      fd.append("file", file!);
      await api(`/batches/${b.batchNo}/roa`, { method: "POST", body: fd });
      toast(r ? "RoA replaced" : "RoA uploaded");
      setFile(null); setNo(""); setReplace(false); refresh();
    } catch (x) {
      const a = x as ApiError;
      if (a.field === "roaNo") setErr({ roaNo: a.message }); else if (a.field === "file") setErr({ file: a.message }); else toast(a.message, "error");
    } finally { setBusy(false); }
  };
  const remove = async () => {
    setBusy(true);
    try { await api(`/batches/${b.batchNo}/roa`, { method: "DELETE" }); toast("RoA removed"); refresh(); }
    catch (x) { toast((x as ApiError).message, "error"); } finally { setBusy(false); }
  };
  const complete = async () => {
    setBusy(true);
    try { await api(`/batches/${b.batchNo}/complete`, { method: "POST" }); toast("Batch completed"); setAsk(false); refresh(); }
    catch (x) { toast((x as ApiError).message, "error"); setAsk(false); refresh(); } finally { setBusy(false); }
  };
  const download = async () => {
    try { const { url } = await api<{ url: string }>(`/batches/${b.batchNo}/roa/file`); window.open(url, "_blank", "noopener"); }
    catch (x) { toast((x as ApiError).message, "error"); }
  };
  // the RoA the app drafts from this batch's values (SGSI template, owner Nov 24): printed, signed by the Supervisor, then uploaded below
  const canDraft = can("batch.document.upload") || can("report.sign");
  const draftRoa = async () => {
    setMaking(true);
    try { const blob = await apiBlob(`/batches/${b.batchNo}/roa/draft`); window.open(URL.createObjectURL(blob), "_blank", "noopener"); }
    catch (x) { toast((x as ApiError).message, "error"); } finally { setMaking(false); }
  };
  const draftRow = canDraft && (
    <div className="row g12" style={{ alignItems: "center", flexWrap: phone ? "wrap" : "nowrap" }}>
      <span className="t-sm c-sec grow" style={{ minWidth: 0 }}>{done ? "The RoA as drafted from this batch's values." : "Print the RoA drafted from this batch's values, have the Supervisor sign it, then upload the signed copy."}</span>
      <Button size={phone ? "lg" : "md"} icon="file-pdf" id="roa-draft" disabled={making} onClick={draftRoa}>{making ? "Preparing" : "Download RoA"}</Button>
    </div>
  );

  const fileRow = r && (
    <div className="roa-file">
      <span className="roa-ico"><Icon n="file-pdf" s={20} /></span>
      <span className="col" style={{ gap: 0, minWidth: 0, flex: 1 }}>
        <b className="t-sm c-head ellip">{r.fileName ?? r.roaNo}</b>
        <span className="t-cap c-sec">{[r.sizeBytes != null ? fileSize(r.sizeBytes) : "", r.uploadedBy ? `Uploaded by ${r.uploadedBy}` : "", `${dShort(r.uploadedAt)} ${dTime(r.uploadedAt)}`].filter(Boolean).join(", ")}</span>
      </span>
      {d.canDownload && <Button size="sm" icon="download-simple" id="roa-download" onClick={download}>Download</Button>}
    </div>
  );

  return (
    <Card title="Signed RoA" actions={!done && canComplete ? (
      <Button icon="check-circle" type="primary" id="batch-complete" disabled={!r || busy || replace} why={r ? "Finish the replacement first" : "Upload the signed RoA first"} onClick={() => setAsk(true)}>Complete batch</Button>
    ) : done ? <span className="row g6 c-ok t-sm"><Icon n="check-circle" />Completed</span> : undefined}>
      <div className="col g12">
        {done && <span className="t-sm c-sec" id="roa-done">The batch is complete. Every tab is read-only.</span>}
        {draftRow}
        {!done && !form && <span className="t-sm c-sec">{canComplete ? "Complete the batch when the signed RoA is right." : "Waiting for the Lab admin to complete the batch."}</span>}
        {r && <span className="row g8 t-sm"><span className="c-sec">RoA number</span><b className="t-data-b c-head" id="roa-no">{r.roaNo}</b></span>}
        {!form && fileRow}
        {!form && r && canUpload && (
          <span className="row g8"><Button size="sm" onClick={() => setReplace(true)}>Replace file</Button><Button size="sm" disabled={busy} onClick={remove}>Remove</Button></span>
        )}
        {form && (
          <div className="col g12">
            <span className="t-sm c-sec">Upload the RoA signed by the supervisor, then complete the batch.</span>
            <TextField id="roa-number" label="RoA number" req value={no} onChange={(v) => { setNo(v); setErr((e) => ({ ...e, roaNo: undefined })); }} error={err.roaNo} placeholder="RoA-0418" />
            <div className="col g4">
              <button type="button" className={cx("dropzone", err.file && "err")} id="roa-drop" onClick={() => pick.current?.click()}
                onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); choose(e.dataTransfer.files[0]); }}>
                <Icon n="upload-simple" s={24} />
                {file ? <b className="t-sm c-head ellip">{file.name}</b> : <span className="t-sm c-head">{phone ? "Choose a PDF" : "Drop the PDF here or choose a file"}</span>}
                <span className="t-cap c-sec">{file ? fileSize(file.size) : "PDF, up to 10 MB"}</span>
              </button>
              <input ref={pick} type="file" accept="application/pdf,.pdf" hidden id="roa-file" onChange={(e) => { choose(e.target.files?.[0]); e.target.value = ""; }} />
              {err.file && <span className="help err">{err.file}</span>}
            </div>
            <span className="row g8" style={{ justifyContent: "flex-end" }}>
              {replace && <Button onClick={() => { setReplace(false); setFile(null); setErr({}); }}>Cancel</Button>}
              <Button type="primary" icon="upload-simple" id="roa-upload" disabled={busy} onClick={send}>{r ? "Replace RoA" : "Upload RoA"}</Button>
            </span>
          </div>
        )}
      </div>
      {ask && r && <Confirm title={`Complete ${b.batchNo}?`} text={`${r.roaNo} is attached. The values lock for good and every tab becomes read-only.`} ok="Complete batch" busy={busy} onOk={complete} onClose={() => setAsk(false)} />}
    </Card>
  );
}
