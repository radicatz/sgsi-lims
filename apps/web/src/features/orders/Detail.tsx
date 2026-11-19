// Job order detail (FigCraft 03-Job_orders-03-Job_order_detail): the header with the status, the stepper, the tabs and the Overview with its
// Properties, Batches and CoA cards. Samples, Files and History are slice B; Batches and CoA fill in with phases 3 and 4.
import { useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../app/api";
import { useBreakpoint, useSession } from "../../app/session";
import {
  Alert,
  Badge,
  Button,
  Card,
  Confirm,
  Dialog,
  Empty,
  Icon,
  KV,
  Menu,
  PageHead,
  Stepper,
  Tabs,
  Tag,
  TextArea,
  fmtDate,
  toast,
} from "../../components";
import { useSave } from "../master-data/shared";
import { OrderForm } from "./OrderForm";
import { SamplesTab } from "./Samples";
import { FilesTab } from "./Files";
import { HistoryTab } from "./History";
import { BatchesTab } from "./Batches";
import {
  useCatalogue,
  STATUS_LABEL,
  STATUS_TONE,
  STD_LABEL,
  coaLabel,
  pastDue,
  shortDate,
  type OrderDetail,
} from "./shared";

type Tab = "overview" | "samples" | "batches" | "files" | "coa" | "history";
const KEYS = ["orders", "order"];

/** Cancel with the reason the lab keeps (frame 05-03 Cancel_job_order). Shared by the list and the detail. */
export function CancelDialog({
  orderNo,
  onClose,
}: {
  orderNo: string;
  onClose: () => void;
}) {
  const [reason, setReason] = useState(""),
    [err, setErr] = useState("");
  const save = useSave(
    () =>
      api(`/orders/${orderNo}/cancel`, { method: "POST", json: { reason } }),
    {
      keys: KEYS,
      done: `${orderNo} cancelled`,
      onDone: onClose,
      onField: (_f, t) => setErr(t),
    },
  );
  return (
    <Dialog
      title={`Cancel ${orderNo}?`}
      size="sm"
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose}>Keep job order</Button>
          <Button
            type="primary"
            tone="danger"
            id="cancel-confirm"
            disabled={save.isPending}
            onClick={() => {
              if (reason.trim().length < 3)
                return setErr("Say why it is cancelled.");
              setErr("");
              save.mutate(undefined);
            }}
          >
            Cancel job order
          </Button>
        </>
      }
    >
      <span className="t-sm c-sec">
        Only a job order with no sample received can be cancelled. The reason
        stays on its history.
      </span>
      <TextArea
        id="cancel-reason"
        label="Reason"
        value={reason}
        onChange={setReason}
        placeholder="For example: the client postponed the drilling"
      />
      {err && <span className="help err">{err}</span>}
    </Dialog>
  );
}

export function OrderPage() {
  const { no = "", tab: t } = useParams(),
    nav = useNavigate(),
    bp = useBreakpoint(),
    phone = bp === "phone",
    { me } = useSession();
  const [sp, setSp] = useSearchParams();
  const [cancel, setCancel] = useState(false),
    [close, setClose] = useState(false);
  const can = (p: string) => !!me?.permissions.includes(p);
  useCatalogue(can("order.edit"));
  const q = useQuery({
    queryKey: ["order", no],
    queryFn: () => api<OrderDetail>(`/orders/${no}`),
  });
  const closeOrder = useSave(
    () => api(`/orders/${no}/close`, { method: "POST" }),
    { keys: KEYS, done: `${no} closed`, onDone: () => setClose(false) },
  );
  const submit = useSave(
    () => api(`/orders/${no}/submit`, { method: "POST" }),
    {
      keys: KEYS,
      done: `${no} submitted. Add the sample IDs next.`,
      onDone: () => nav(`/orders/${no}/samples`),
      onField: (_f, text) => toast(text, "error"),
    },
  );
  if (q.isLoading)
    return (
      <div className="page">
        <Card>
          <Empty icon="clipboard-text" title="Loading job order" />
        </Card>
      </div>
    );
  if (q.error || !q.data)
    return (
      <div className="page">
        <Card>
          <Empty
            icon="clipboard-text"
            title="Job order not found"
            text="It may have been removed, or the number is wrong."
            action={
              <Button onClick={() => nav("/orders")}>Back to job orders</Button>
            }
          />
        </Card>
      </div>
    );
  const d = q.data,
    tab = (t as Tab) || "overview";
  const live = d.status !== "cancelled" && d.status !== "closed";
  const editing = sp.has("edit") && can("order.edit") && d.can.edit.ok;
  const menu = (can("order.edit") || can("order.cancel")) && (
    <Menu
      label="More actions"
      vertical
      size={36}
      items={[
        can("order.edit") && {
          label: "Edit",
          icon: "pencil-simple",
          disabled: !d.can.edit.ok,
          why: d.can.edit.why ?? "",
          onClick: () => setSp({ edit: "" }),
        },
        can("order.edit") &&
          d.status === "draft" && {
            label: "Submit",
            icon: "paper-plane-tilt",
            onClick: () => submit.mutate(undefined),
          },
        can("order.cancel") &&
          live && {
            label: "Cancel",
            icon: "x-circle",
            danger: true,
            disabled: !d.can.cancel.ok,
            why: d.can.cancel.why ?? "",
            onClick: () => setCancel(true),
          },
        can("order.cancel") &&
          live && {
            label: "Close",
            icon: "archive",
            disabled: !d.can.close.ok,
            why: d.can.close.why ?? "",
            onClick: () => setClose(true),
          },
      ]}
    />
  );
  const late = pastDue({ dueOn: d.dueOn, status: d.status });
  const sub = (
    <div className="col g6 order-sub">
      <b className="t-sm w6" style={{ fontWeight: 500 }}>
        {d.company.name}
      </b>
      <span className="row g16 wrap t-sm c-sec">
        {d.contact && (
          <span className="row g6">
            <Icon n="user" />
            {d.contact.fullName}
          </span>
        )}
        {d.clientReference && (
          <span className="row g6">
            <Icon n="receipt" />
            {d.clientReference}
          </span>
        )}
        {d.dueOn && (
          <span className={late ? "row g6 c-err" : "row g6"}>
            <Icon n="calendar-blank" />
            {shortDate(d.dueOn)}
            {late && <b className="w6">Past due</b>}
          </span>
        )}
      </span>
    </div>
  );
  const tabs = [
    { id: "overview" as Tab, label: "Overview" },
    { id: "samples" as Tab, label: "Samples", count: d.counts.samples },
    { id: "batches" as Tab, label: "Batches", count: d.counts.batches },
    { id: "files" as Tab, label: "Files", count: d.counts.files },
    { id: "coa" as Tab, label: "CoA" },
    { id: "history" as Tab, label: "History" },
  ];
  return (
    <div className="page">
      <PageHead
        crumb={[["Job orders", "/orders"], [d.orderNo]]}
        title={d.orderNo}
        badge={<Badge
              label={STATUS_LABEL[d.status]}
              tone={STATUS_TONE[d.status]}
            />}
        trailing={phone ? menu : undefined}
        sub={sub}
        actions={phone ? undefined : menu}
      />
      {d.status === "cancelled" ? (
        <Alert
          tone="warning"
          title={`Cancelled${d.cancelledAt ? ` on ${fmtDate(d.cancelledAt)}` : ""}`}
          text={d.cancelReason ?? undefined}
        />
      ) : (
        <Card>
          <Stepper steps={steps(d)} />
        </Card>
      )}
      <Tabs
        items={tabs}
        value={tab}
        onChange={(v) =>
          nav(v === "overview" ? `/orders/${no}` : `/orders/${no}/${v}`)
        }
      />
      {tab === "overview" && (
        <Overview
          d={d}
          canEdit={can("order.edit")}
          onEdit={() => setSp({ edit: "" })}
        />
      )}
      {tab === "samples" && (
        <SamplesTab
          no={no}
          live={live}
          phone={phone}
          tablet={bp === "tablet"}
        />
      )}
      {tab === "batches" && (
        <BatchesTab no={no} live={live} phone={phone} tablet={bp === "tablet"} />
      )}
      {tab === "files" && <FilesTab no={no} live={live} phone={phone} />}
      {tab === "coa" && (
        <Card title="Certificate of Analysis">
          <Empty
            icon="certificate"
            title="The CoA is not ready"
            text="It can be generated once every batch has an approved RoA."
          />
        </Card>
      )}
      {tab === "history" && (
        <HistoryTab no={no} phone={phone} tablet={bp === "tablet"} />
      )}
      {editing && (
        <OrderForm detail={d} phone={phone} onClose={() => setSp({})} />
      )}
      {cancel && <CancelDialog orderNo={no} onClose={() => setCancel(false)} />}
      {close && (
        <Confirm
          title={`Close ${no}?`}
          text="A closed job order is finished: billing is done and nothing more is expected."
          ok="Close job order"
          busy={closeOrder.isPending}
          onOk={() => closeOrder.mutate(undefined)}
          onClose={() => setClose(false)}
        />
      )}
    </div>
  );
}

/** The six steps of a job order's life, with what is known so far (spec 9.3). Later steps fill in with batches and reports. */
function steps(d: OrderDetail) {
  const at =
    d.status === "draft"
      ? 0
      : d.status === "awaiting_samples"
        ? 1
        : d.status === "in_progress"
          ? 2
          : d.status === "reported"
            ? 5
            : 6;
  const names = [
    "Registered",
    "Samples received",
    "Analysis",
    "RoA approved",
    "CoA published",
    "Sent to client",
  ];
  const note = [
    d.status === "draft"
      ? "Draft"
      : d.submittedAt
        ? fmtDate(d.submittedAt)
        : "",
    `${d.counts.received} of ${d.expectedSamples ?? 0} arrived`,
    d.counts.batches
      ? `${d.counts.batches} batch${d.counts.batches === 1 ? "" : "es"}`
      : "No batch yet",
    `${d.batches.filter((b) => b.status === "completed").length} of ${d.counts.batches}`,
    d.status === "reported" || at > 5 ? "Published" : "Not yet",
    at > 5 ? "Sent" : "Not yet",
  ];
  return names.map((n, i) => ({
    name: n,
    note: note[i]!,
    state: (i < at ? "done" : i === at ? "cur" : "up") as "done" | "cur" | "up",
  }));
}

function Overview({
  d,
  canEdit,
  onEdit,
}: {
  d: OrderDetail;
  canEdit: boolean;
  onEdit: () => void;
}) {
  const same =
    d.service &&
    d.service.parameterIds.length > 0 &&
    d.service.parameterIds.every((id) =>
      d.parameters.some((p) => p.id === id),
    ) &&
    d.parameters.filter((p) => p.code !== "PREP").length ===
      d.service.parameterIds.length;
  return (
    <div className="orders-overview">
      <Card
        title="Properties"
        actions={
          canEdit &&
          d.can.edit.ok && (
            <Button
              type="ghost"
              size="sm"
              icon="pencil-simple"
              id="edit-order"
              onClick={onEdit}
            >
              Edit
            </Button>
          )
        }
      >
        <KV k="Company">{d.company.name}</KV>
        <KV k="Address">{d.company.address || "—"}</KV>
        <KV k="Contact">
          {d.contact ? (
            <span className="row g12 wrap">
              <span>{d.contact.fullName}</span>
              {d.contact.phone && (
                <span className="c-sec">{d.contact.phone}</span>
              )}
              {d.contact.email && (
                <span className="c-sec">{d.contact.email}</span>
              )}
            </span>
          ) : (
            "—"
          )}
        </KV>
        <KV k="Client reference">{d.clientReference || "—"}</KV>
        <KV k="Parameters">
          <span className="col g8">
            <span className="row g12 wrap">
              <span>{d.service?.name ?? "Custom set"}</span>
              {d.service && !same && <span className="c-mut">customized</span>}
              <span className="c-sec grow" style={{ textAlign: "right" }}>
                {d.parameters.length} parameters
              </span>
            </span>
            <span className="row g6 wrap">
              {d.parameters.map((p) => (
                <span key={p.id} className="parpill">
                  {p.label}
                </span>
              ))}
            </span>
          </span>
        </KV>
        <KV k="Standard">
          {d.standards.map((s) => STD_LABEL[s]).join(", ") || "—"}
        </KV>
        <KV k="Expected samples">
          <span className="row g12">
            <span>{d.expectedSamples ?? "—"}</span>
            {d.sampleType && <span className="c-sec">{d.sampleType}</span>}
          </span>
        </KV>
        <KV k="Priority">{d.priority}</KV>
        <KV k="Due date">{d.dueOn ? shortDate(d.dueOn) : "—"}</KV>
        <KV k="Default signatory">
          {d.signatory ? (
            <span className="row g12 wrap">
              <span>{d.signatory.name}</span>
              {d.signatory.title && (
                <span className="c-sec">{d.signatory.title}</span>
              )}
            </span>
          ) : (
            "—"
          )}
        </KV>
        <KV k="Created by">
          <span className="row g12">
            <span>{d.createdBy ?? "—"}</span>
            <span className="c-sec">{shortDate(d.createdAt.slice(0, 10))}</span>
          </span>
        </KV>
        <KV k="Notes">{d.notes || "—"}</KV>
      </Card>
      <div className="col g16">
        <Card title="Batches">
          {d.batches.length ? (
            <div className="col g8">
              {d.batches.map((b) => (
                <div key={b.id} className="row between">
                  <b className="t-data-b">{b.batchNo}</b>
                  <span className="row g8">
                    <Tag label={b.standard === "GBT" ? "GB/T" : b.standard} />
                    <span className="t-sm c-sec">{b.samples} samples</span>
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <span className="t-sm c-mut">
              No batches yet. The lab creates a batch from the samples it
              receives.
            </span>
          )}
        </Card>
        <Card
          title="Certificate of Analysis"
          actions={
            <Tag
              label={coaLabel(null) === "No CoA" ? "Pending" : coaLabel(null)}
              icon="clock"
            />
          }
        >
          <span className="t-sm c-mut">
            The CoA can be generated once every batch has an approved RoA.
          </span>
        </Card>
      </div>
    </div>
  );
}
