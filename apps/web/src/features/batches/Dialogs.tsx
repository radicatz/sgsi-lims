// The dialogs and sheets of the batch page (Batch_Screen_Plan.md 4.5; frames 04-02-02, 03, 05, 06, 09): print labels, photos, hold, confirm with fewer
// samples, edit the batch number, and the batch log. Desktop and tablet: dialogs; phone: bottom sheets.
import { useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api, ApiError } from "../../app/api";
import {
  Alert,
  Button,
  Check,
  Dialog,
  Empty,
  Icon,
  Select,
  TextArea,
  TextField,
  cx,
  fileSize,
  toast,
} from "../../components";
import { useSave } from "../master-data/shared";
import { LABEL_CSS, labelHtml, printLabels, type LabelData } from "./labels";
import {
  dLong,
  dShort,
  dTime,
  type BatchPageData,
  type RecRow,
} from "./shared";

/* ---------- print labels ---------- */
export function PrintLabelsDialog({
  b,
  rows,
  only,
  phone,
  onClose,
}: {
  b: BatchPageData;
  rows: RecRow[];
  only?: string[];
  phone: boolean;
  onClose: () => void;
}) {
  const arrived = rows.filter((r) => r.arrived && r.sampleNo);
  const fresh = arrived.filter((r) => !r.label.printed);
  const [onlyNew, setOnlyNew] = useState(!only && fresh.length > 0);
  const [copies, setCopies] = useState("1"),
    [reason, setReason] = useState(""),
    [err, setErr] = useState<{ f?: string; t: string } | null>(null);
  const chosen = only
    ? arrived.filter((r) => only.includes(r.id))
    : onlyNew
      ? fresh
      : arrived;
  const again = chosen.some((r) => r.label.printed);
  const n = Number(copies);
  const asLabel = (r: RecRow): LabelData => ({
    sampleNo: r.sampleNo!,
    sampleCode: r.sampleCode!,
    orderNo: b.order.orderNo,
    receivedOn: dLong(r.arrivedAt),
    company: b.company.short,
  });
  const first = chosen[0];
  const refs = chosen.map((r) => r.clientRef);
  const save = useSave(
    () =>
      api<{
        labels: Array<{
          id: string;
          sampleNo: string;
          sampleCode: string;
          orderNo: string;
          receivedOn: string;
          company: string;
        }>;
      }>(`/batches/${b.batchNo}/labels`, {
        method: "POST",
        json: { sampleIds: chosen.map((r) => r.id), reason },
      }),
    {
      keys: ["reception", "batch", "batch-log"],
      onDone: (res) => {
        const out = res as { labels: LabelData[] };
        printLabels(out.labels, n);
        toast(
          `${out.labels.length * n} ${out.labels.length * n === 1 ? "label" : "labels"} sent to print`,
        );
        onClose();
      },
      onField: (f, t) => setErr({ ...(f ? { f } : {}), t }),
    },
  );
  const go = () => {
    if (!chosen.length)
      return setErr({ t: "There is no sample to print a label for." });
    if (!Number.isInteger(n) || n < 1 || n > 5)
      return setErr({ f: "copies", t: "Copies per sample: 1 to 5." });
    if (again && reason.trim().length < 3)
      return setErr({ f: "reason", t: "Say why the label is printed again." });
    setErr(null);
    save.mutate(undefined);
  };
  return (
    <Dialog
      title={`Print ${chosen.length} ${chosen.length === 1 ? "label" : "labels"}`}
      size="md"
      phone={phone}
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            type="primary"
            id="pl-print"
            disabled={save.isPending || !chosen.length}
            onClick={go}
          >
            Print {chosen.length} {chosen.length === 1 ? "label" : "labels"}
          </Button>
        </>
      }
    >
      <span className="t-sm c-sec">
        {only
          ? `Label for ${refs.join(", ")}.`
          : onlyNew
            ? `Labels for ${refs.slice(0, 3).join(", ")}${refs.length > 3 ? ` and ${refs.length - 3} more` : ""}, which arrived without one.`
            : `Labels for ${chosen.length} ${chosen.length === 1 ? "sample" : "samples"}.`}
      </span>
      {first ? (
        <div className="lbl-prev" aria-label="Label preview">
          <style>{LABEL_CSS}</style>
          <div
            dangerouslySetInnerHTML={{ __html: labelHtml(asLabel(first)) }}
          />
        </div>
      ) : (
        <Alert
          tone="info"
          title="No sample has arrived yet."
          text="Tick Arrived for a sample first: its Sample ID is given then."
        />
      )}
      <Select
        label="Printer"
        value="browser"
        onChange={() => undefined}
        options={[["browser", "Choose in the print window"]]}
        disabled
        help="The printer model is not set yet, so the browser's print window opens."
      />
      <TextField
        id="pl-copies"
        label="Copies per sample"
        value={copies}
        onChange={setCopies}
        error={err?.f === "copies" ? err.t : null}
      />
      {!only && fresh.length > 0 && arrived.length > fresh.length && (
        <Check
          on={onlyNew}
          onChange={setOnlyNew}
          label={`Only samples without a label (${fresh.length})`}
          id="pl-only"
        />
      )}
      {again && (
        <TextField
          id="pl-reason"
          label="Why print again"
          req
          value={reason}
          onChange={setReason}
          error={err?.f === "reason" ? err.t : null}
          placeholder="For example: the label tore"
        />
      )}
      {err && !err.f && <span className="help err">{err.t}</span>}
    </Dialog>
  );
}

/* ---------- photos (D-48) ---------- */
interface Photos {
  open: boolean;
  clientRef: string;
  sampleCode: string | null;
  tags: string[];
  items: Array<{
    id: string;
    tag: string;
    fileName: string;
    sizeBytes: number;
    takenAt: string;
    takenBy: string | null;
    url: string | null;
  }>;
}

/** Scale a big photo down before it is sent (at most 2,000 px on its long side). */
async function shrink(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) return file;
  try {
    const bmp = await createImageBitmap(file),
      k = Math.min(1, 2000 / Math.max(bmp.width, bmp.height));
    if (k === 1 && file.size < 2_000_000) return file;
    const c = document.createElement("canvas");
    c.width = Math.round(bmp.width * k);
    c.height = Math.round(bmp.height * k);
    c.getContext("2d")!.drawImage(bmp, 0, 0, c.width, c.height);
    const blob = await new Promise<Blob | null>((res) =>
      c.toBlob(res, "image/jpeg", 0.85),
    );
    return blob
      ? new File([blob], file.name.replace(/\.\w+$/, "") + ".jpg", {
          type: "image/jpeg",
        })
      : file;
  } catch {
    return file;
  }
}

export function PhotosDialog({
  batchNo,
  row,
  canAdd,
  phone,
  touch,
  onClose,
}: {
  batchNo: string;
  row: RecRow;
  canAdd: boolean;
  phone: boolean;
  touch: boolean;
  onClose: () => void;
}) {
  const key = ["reception-photos", batchNo, row.id];
  const q = useQuery({
    queryKey: key,
    queryFn: () => api<Photos>(`/batches/${batchNo}/samples/${row.id}/photos`),
    staleTime: 0,
  });
  const [tag, setTag] = useState(""),
    [busy, setBusy] = useState(false),
    [ask, setAsk] = useState<string | null>(null),
    [look, setLook] = useState<string | null>(null);
  const pick = useRef<HTMLInputElement>(null);
  const d = q.data,
    open = !!d?.open && canAdd,
    cur = tag || d?.tags[0] || "Other";
  const refresh = useSave(
    (x: { f?: File; del?: string }) =>
      x.del
        ? api(`/batches/${batchNo}/samples/${row.id}/photos/${x.del}`, {
            method: "DELETE",
          })
        : Promise.resolve(),
    { keys: ["reception", "reception-photos"], onDone: () => setAsk(null) },
  );
  const add = async (f: File) => {
    setBusy(true);
    try {
      const small = await shrink(f),
        fd = new FormData();
      fd.append("tag", cur);
      fd.append("file", small);
      await api(`/batches/${batchNo}/samples/${row.id}/photos`, {
        method: "POST",
        body: fd,
      });
      toast("Photo added");
    } catch (e) {
      toast((e as ApiError).message, "error");
    } finally {
      setBusy(false);
      refresh.mutate({});
    }
  };
  return (
    <Dialog
      title={`Photos of ${row.clientRef}`}
      size="lg"
      phone={phone}
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose}>Close</Button>
          {open && (
            <Button
              type="primary"
              id="ph-add"
              disabled={busy}
              onClick={() => pick.current?.click()}
            >
              {busy ? "Adding…" : "Add photo"}
            </Button>
          )}
        </>
      }
    >
      {d && (
        <span className="t-sm c-sec">
          {open
            ? "Tag each photo. Photos lock when reception is confirmed."
            : d.open
              ? "You can look at the photos here."
              : "Photos are locked: reception is confirmed."}
        </span>
      )}
      {open && (
        <span
          className="row g8 wrap"
          role="group"
          aria-label="Tag of the next photo"
        >
          {(d?.tags ?? []).map((t) => (
            <button
              key={t}
              type="button"
              className={cx("chip", cur === t && "on")}
              aria-pressed={cur === t}
              onClick={() => setTag(t)}
            >
              {t}
            </button>
          ))}
        </span>
      )}
      <input
        ref={pick}
        id="ph-file"
        type="file"
        accept="image/png,image/jpeg,image/webp"
        hidden
        {...(touch ? { capture: "environment" as const } : {})}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) add(f);
          e.target.value = "";
        }}
      />
      {q.isLoading ? (
        <span className="t-sm c-mut">Loading photos…</span>
      ) : (
        <div className="pho-grid">
          {d?.items.map((p) => (
            <figure key={p.id} className="pho">
              <div className="pho-img">
                {p.url ? (
                  <button
                    type="button"
                    className="pho-open"
                    aria-label={`Open the ${p.tag} photo of ${row.clientRef}`}
                    onClick={() => setLook(p.id)}
                  >
                    <img
                      src={p.url}
                      alt={`${p.tag} photo of ${row.clientRef}`}
                      loading="lazy"
                    />
                  </button>
                ) : (
                  <Icon n="image" s={24} />
                )}
                {open && (
                  <span className="pho-x">
                    <Button
                      iconOnly
                      icon="trash"
                      label={`Remove photo ${p.fileName}`}
                      size="md"
                      onClick={() => setAsk(p.id)}
                    />
                  </span>
                )}
              </div>
              <figcaption>
                <b className="t-sm w6">{p.tag}</b>
                <span className="t-cap c-sec">{p.takenBy ?? "Unknown"}</span>
                <span className="t-cap c-mut">
                  {dShort(p.takenAt)} {dTime(p.takenAt)}
                </span>
                <span className="t-cap c-mut">{fileSize(p.sizeBytes)}</span>
              </figcaption>
            </figure>
          ))}
          {open && (
            <button
              type="button"
              className="pho-new"
              onClick={() => pick.current?.click()}
              disabled={busy}
            >
              <Icon n="plus" s={20} />
              <span className="t-sm">Add photo</span>
            </button>
          )}
          {!d?.items.length && !open && (
            <Empty
              icon="image"
              title="No photos"
              text="No photo was added at reception."
            />
          )}
        </div>
      )}
      {look &&
        (() => {
          const p = d?.items.find((x) => x.id === look);
          return p?.url ? (
            <Dialog
              title={`${p.tag} photo of ${row.clientRef}`}
              size="xl"
              phone={phone}
              onClose={() => setLook(null)}
              footer={<Button onClick={() => setLook(null)}>Close</Button>}
            >
              <div className="pho-big">
                <img src={p.url} alt={`${p.tag} photo of ${row.clientRef}, large`} />
              </div>
              <span className="t-cap c-sec">
                {p.takenBy ?? "Unknown"}, {dShort(p.takenAt)} {dTime(p.takenAt)}
              </span>
            </Dialog>
          ) : null;
        })()}
      {ask && (
        <Dialog
          title="Remove this photo?"
          size="sm"
          onClose={() => setAsk(null)}
          footer={
            <>
              <Button onClick={() => setAsk(null)}>Cancel</Button>
              <Button
                type="primary"
                tone="danger"
                id="ph-remove"
                disabled={refresh.isPending}
                onClick={() => refresh.mutate({ del: ask })}
              >
                Remove
              </Button>
            </>
          }
        >
          <span className="t-sm c-sec">
            The photo is taken off {row.clientRef}.
          </span>
        </Dialog>
      )}
    </Dialog>
  );
}

/* ---------- hold ---------- */
export function HoldDialog({
  batchNo,
  row,
  reasons,
  phone,
  onClose,
}: {
  batchNo: string;
  row: RecRow;
  reasons: Array<{ value: string; needsNote: boolean }>;
  phone: boolean;
  onClose: () => void;
}) {
  const [reason, setReason] = useState(reasons[0]?.value ?? ""),
    [note, setNote] = useState(""),
    [err, setErr] = useState<{ f?: string; t: string } | null>(null);
  const needs = !!reasons.find((r) => r.value === reason)?.needsNote;
  const save = useSave(
    () =>
      api(`/batches/${batchNo}/samples/${row.id}/hold`, {
        method: "POST",
        json: { reason, note },
      }),
    {
      keys: ["reception", "batch", "batch-log"],
      done: `${row.clientRef} is on hold`,
      onDone: onClose,
      onField: (f, t) => setErr({ ...(f ? { f } : {}), t }),
    },
  );
  return (
    <Dialog
      title={`Hold ${row.clientRef}?`}
      size="sm"
      phone={phone}
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            type="primary"
            id="hold-confirm"
            disabled={save.isPending}
            onClick={() => {
              if (needs && note.trim().length < 3)
                return setErr({ f: "note", t: "Add a note for this reason." });
              setErr(null);
              save.mutate(undefined);
            }}
          >
            Hold sample
          </Button>
        </>
      }
    >
      <span className="t-sm c-sec">
        A held sample stays in the batch and prints as not analysed on the RoA.
      </span>
      <Select
        id="hold-reason"
        label="Reason"
        req
        value={reason}
        onChange={(v) => {
          setReason(v);
          setErr(null);
        }}
        options={reasons.map((r) => [r.value, r.value] as [string, string])}
        error={err?.f === "reason" ? err.t : null}
      />
      <TextArea
        id="hold-note"
        label={needs ? "Note" : "Note (optional)"}
        value={note}
        onChange={(t) => {
          setNote(t);
          setErr(null);
        }}
        placeholder="Add a note…"
        rows={3}
      />
      {err && err.f !== "reason" && <span className="help err">{err.t}</span>}
    </Dialog>
  );
}

/* ---------- confirm reception with fewer samples ---------- */
export interface Fewer {
  expected: number;
  arrived: number;
  held: number;
  leaving: string[];
}
export function FewerDialog({
  f,
  orderNo,
  busy,
  phone,
  onOk,
  onClose,
}: {
  f: Fewer;
  orderNo: string;
  busy: boolean;
  phone: boolean;
  onOk: () => void;
  onClose: () => void;
}) {
  const names =
    f.leaving.length > 2
      ? `${f.leaving.slice(0, 2).join(", ")} and ${f.leaving.length - 2} more`
      : f.leaving.join(" and ");
  return (
    <Dialog
      title={`Confirm reception with ${f.arrived} of ${f.expected} samples?`}
      size="md"
      phone={phone}
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            type="primary"
            id="fewer-confirm"
            disabled={busy}
            onClick={onOk}
          >
            Confirm reception
          </Button>
        </>
      }
    >
      <span className="t-sm c-sec">
        {names} {f.leaving.length === 1 ? "has" : "have"} not arrived.{" "}
        {f.leaving.length === 1 ? "It leaves" : "They leave"} this batch and go
        back to {orderNo} as Awaiting arrival. Confirming locks the sample
        information of the {f.arrived} that arrived.
      </span>
      <div className="fw-tiles">
        {(
          [
            [f.arrived, "Arrived"],
            [f.held, "On hold"],
            [f.leaving.length, "Leave the batch"],
          ] as Array<[number, string]>
        ).map(([n, l]) => (
          <div key={l} className="fw-tile">
            <b className="t-h3">{n}</b>
            <span className="t-cap c-sec">{l}</span>
          </div>
        ))}
      </div>
    </Dialog>
  );
}

/* ---------- edit the batch number ---------- */
export function NumberDialog({
  b,
  phone,
  onClose,
  onSaved,
}: {
  b: BatchPageData;
  phone: boolean;
  onClose: () => void;
  onSaved: (no: string) => void;
}) {
  const [no, setNo] = useState(b.batchNo),
    [err, setErr] = useState("");
  const save = useSave(
    () =>
      api<{ batchNo: string }>(`/batches/${b.batchNo}/number`, {
        method: "PUT",
        json: { batchNo: no.trim() },
      }),
    {
      keys: ["batches", "batch", "reception", "order-batches"],
      onDone: (r) => {
        toast("Batch number changed");
        onSaved((r as { batchNo: string }).batchNo);
      },
      onField: (_f, t) => setErr(t),
    },
  );
  const go = () => {
    if (!/^B-\d{4}-\d{4}$/.test(no.trim()))
      return setErr("Pattern B-YYYY-NNNN. The number must be unique.");
    setErr("");
    save.mutate(undefined);
  };
  return (
    <Dialog
      title="Edit batch number"
      size="sm"
      phone={phone}
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            type="primary"
            id="bn-save"
            disabled={save.isPending}
            onClick={go}
          >
            Save
          </Button>
        </>
      }
    >
      <span className="t-sm c-sec">
        The number can change until reception is confirmed. The change goes into
        the batch log.
      </span>
      <TextField
        id="bn-no"
        label="Batch no."
        req
        value={no}
        onChange={(v) => {
          setNo(v);
          setErr("");
        }}
        error={err || null}
        help="Pattern B-YYYY-NNNN. The number must be unique."
      />
    </Dialog>
  );
}

/* ---------- the batch log ---------- */
export function LogDialog({
  batchNo,
  phone,
  onClose,
}: {
  batchNo: string;
  phone: boolean;
  onClose: () => void;
}) {
  const q = useQuery({
    queryKey: ["batch-log", batchNo],
    queryFn: () =>
      api<{
        items: Array<{
          id: string;
          action: string;
          note: string | null;
          at: string;
          by: string | null;
        }>;
      }>(`/batches/${batchNo}/log`),
    staleTime: 0,
  });
  return (
    <Dialog
      title={`Log of ${batchNo}`}
      size="md"
      phone={phone}
      onClose={onClose}
      footer={<Button onClick={onClose}>Close</Button>}
    >
      {q.isLoading ? (
        <span className="t-sm c-mut">Loading the log…</span>
      ) : (
        <ol className="blog">
          {q.data?.items.map((l) => (
            <li key={l.id}>
              <b className="t-sm w6">{l.action}</b>
              {l.note && <span className="t-sm c-sec">{l.note}</span>}
              <span className="t-cap c-mut">
                {l.by ?? "System"}, {dShort(l.at)} {dTime(l.at)}
              </span>
            </li>
          ))}
        </ol>
      )}
    </Dialog>
  );
}
