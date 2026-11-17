// The job order's Files tab (not drawn: built from the CoA history file rows and the drop zone, design section 2), and the drop zone of the
// New job order form ("Notes and files", frame 02-01), whose files are uploaded once the job order exists.
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api, ApiError } from "../../app/api";
import { useSession } from "../../app/session";
import { Button, Card, Confirm, DropZone, Empty, Icon, fileSize, toast } from "../../components";
import { useSave } from "../master-data/shared";

export const FILE_HINT = "PDF, image, Excel, Word or CSV, up to 20 MB";
export const FILE_ACCEPT = ".pdf,.png,.jpg,.jpeg,.webp,.xlsx,.xlsm,.xls,.docx,.doc,.csv";
const EXTS = FILE_ACCEPT.split(",").map((x) => x.slice(1));
const ICON: Record<string, string> = { pdf: "file-pdf", image: "file-image", sheet: "file-xls", doc: "file-doc", csv: "file-csv", other: "file" };
export const kindOf = (name: string) => {
  const e = (name.match(/\.([a-z0-9]+)$/i)?.[1] ?? "").toLowerCase();
  return e === "pdf" ? "pdf" : ["png", "jpg", "jpeg", "webp"].includes(e) ? "image" : ["xlsx", "xlsm", "xls"].includes(e) ? "sheet" : ["docx", "doc"].includes(e) ? "doc" : e === "csv" ? "csv" : "other";
};
/** The same checks as the server, so a wrong file is refused before it is sent. */
export const fileProblem = (f: File) => (f.size > 20 * 1048576 ? "The file is larger than 20 MB." : !EXTS.includes((f.name.match(/\.([a-z0-9]+)$/i)?.[1] ?? "").toLowerCase()) ? "Use a PDF, image, Excel, Word or CSV file." : f.size === 0 ? "The file is empty." : null);
export const uploadFile = (no: string, f: File) => { const fd = new FormData(); fd.append("file", f); return api<{ id: string; fileName: string }>(`/orders/${no}/files`, { method: "POST", body: fd }); };

interface OrderFile { id: string; fileName: string; sizeBytes: number; kind: string; uploadedAt: string; uploadedBy: string | null; url: string | null }
const when = (iso: string) => new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Makassar" });

function FileRow({ name, size, by, at, kind, url, phone, onRemove }: { name: string; size: number; by?: string | null; at?: string; kind: string; url?: string | null; phone: boolean; onRemove?: () => void }) {
  const dl = url ? <a className="btn ghost md icon" href={url} target="_blank" rel="noreferrer" aria-label={`Download ${name}`} title={`Download ${name}`}><Icon n="download-simple" /></a> : null;
  return (
    <div className="filerow">
      <Icon n={ICON[kind] ?? "file"} s={20} />
      <div className="col" style={{ gap: 0, flex: phone ? "1 1 0" : "1 1 200px", minWidth: phone ? 0 : 140 }}>
        <b className="t-sm w6 ellip">{name}</b>
        <span className="t-cap c-mut">{fileSize(size)}</span>
      </div>
      {at && (
        <div className="col" style={{ gap: 0, flex: phone ? "1 1 100%" : "0 0 240px", order: phone ? 5 : undefined }}>
          <span className="t-cap c-sec">Uploaded by {by ?? "Unknown"}</span>
          <span className="t-cap c-sec">{when(at)}</span>
        </div>
      )}
      <span className="acts">{dl}{onRemove && <Button iconOnly icon="trash" label={`Remove ${name}`} onClick={onRemove} />}</span>
    </div>
  );
}

export function FilesTab({ no, live, phone }: { no: string; live: boolean; phone: boolean }) {
  const { me } = useSession(), qc = useQueryClient();
  const q = useQuery({ queryKey: ["order-files", no], queryFn: () => api<{ canEdit: boolean; why: string | null; items: OrderFile[] }>(`/orders/${no}/files`) });
  const [busy, setBusy] = useState<File | null>(null), [ask, setAsk] = useState<OrderFile | null>(null);
  const canEdit = !!me?.permissions.includes("order.edit") && live && !!q.data?.canEdit;
  const add = async (f: File) => {
    const bad = fileProblem(f); if (bad) return toast(bad, "error");
    setBusy(f);
    try { await uploadFile(no, f); toast(`${f.name} added`); }
    catch (e) { toast((e as ApiError).message, "error"); }
    finally { setBusy(null); qc.invalidateQueries({ queryKey: ["order-files", no] }); qc.invalidateQueries({ queryKey: ["order", no] }); }
  };
  const remove = useSave((f: OrderFile) => api(`/orders/${no}/files/${f.id}`, { method: "DELETE" }), {
    keys: ["order-files", "order"], onDone: () => { toast(`${ask?.fileName ?? "File"} removed`); setAsk(null); },
  });
  const items = q.data?.items ?? [];
  return (
    <Card title="Files" count={items.length}>
      {canEdit && (busy ? (
        <div className="filerow"><Icon n={ICON[kindOf(busy.name)] ?? "file"} s={20} /><div className="col grow" style={{ gap: 0, minWidth: 0 }}><b className="t-sm w6 ellip">{busy.name}</b><span className="t-cap c-mut">Uploading…</span></div></div>
      ) : (
        <DropZone id="jo-file" text="Drop a file here, or click to browse" hint={FILE_HINT} accept={FILE_ACCEPT} onFile={add} />
      ))}
      {q.isLoading ? <span className="t-sm c-mut">Loading files…</span>
        : !items.length ? (!canEdit && <Empty icon="paperclip" title="No files yet" text="The quote, the PO and the client's letters are kept here." />)
        : items.map((f) => <FileRow key={f.id} name={f.fileName} size={f.sizeBytes} by={f.uploadedBy} at={f.uploadedAt} kind={f.kind} url={f.url} phone={phone} {...(canEdit ? { onRemove: () => setAsk(f) } : {})} />)}
      {ask && <Confirm title={`Remove ${ask.fileName}?`} text="The file is taken off the job order. The History tab keeps a line about it." ok="Remove" danger busy={remove.isPending}
        onOk={() => remove.mutate(ask)} onClose={() => setAsk(null)} />}
    </Card>
  );
}

/** The New job order form's drop zone: the files wait here and are sent after the job order is saved. */
export function PendingFiles({ files, onChange, phone }: { files: File[]; onChange: (f: File[]) => void; phone: boolean }) {
  return (
    <div className="col g8">
      {files.map((f, i) => <FileRow key={`${f.name}-${i}`} name={f.name} size={f.size} kind={kindOf(f.name)} phone={phone} onRemove={() => onChange(files.filter((_, j) => j !== i))} />)}
      <DropZone id="jo-form-file" text="Drop the file here, or click to browse" hint={FILE_HINT} accept={FILE_ACCEPT}
        onFile={(f) => { const bad = fileProblem(f); if (bad) toast(bad, "error"); else onChange([...files, f]); }} />
    </div>
  );
}

/** After a new job order is saved: send its waiting files, one by one, and say which ones failed. */
export async function sendPending(no: string, files: File[]) {
  const failed: string[] = [];
  for (const f of files) { try { await uploadFile(no, f); } catch { failed.push(f.name); } }
  if (failed.length) toast(`${failed.join(", ")} could not be uploaded. Add ${failed.length === 1 ? "it" : "them"} on the Files tab.`, "error");
}
