// Sample history (Phase 5, slice B4; frames 08-Search-04-Sample_history-01 to 04, Search_Screen_Plan.md section 7): one sample's card and the timeline of the events the lab
// records in v1. Pending steps are grey dots without a person or date. Values show only to roles with result.read; a link to a page the role cannot open is plain text.
import { useState } from "react";
import { Link, useParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { api, apiBlob, ApiError } from "../../app/api";
import { useBreakpoint, useSession } from "../../app/session";
import {
  Avatar,
  Badge,
  Button,
  Card,
  Empty,
  KV,
  PageHead,
  cx,
  toast,
  type Tone,
} from "../../components";
import { whenText } from "../orders/History";

export interface HistoryEvent {
  key: string;
  at: string | null;
  by: string | null;
  title: string;
  detail: string | null;
  tone: "done" | "warn" | "pending";
  values?: Array<{
    code: string;
    value: string;
    basis: string;
    unit: string | null;
  }>;
  link?: {
    label: string;
    kind: "batch" | "coa" | "roa" | "analysis";
    to: string;
  };
}
interface Data {
  sample: {
    id: string;
    title: string;
    sampleNo: string | null;
    sampleCode: string | null;
    clientRef: string;
    status: string;
    statusTone: Tone;
    orderNo: string;
    batchNo: string | null;
    companyId: string;
    company: string;
    drillHole: string | null;
    depthFrom: number | null;
    depthTo: number | null;
    description: string | null;
    sampleType: string | null;
    mass: number | null;
    condition: string | null;
    held: { reason: string | null; note: string | null } | null;
  };
  events: HistoryEvent[];
  values: boolean;
}

const dateTime = (iso: string) => whenText(iso, true);

export function SampleHistoryPage() {
  const { id = "" } = useParams(),
    bp = useBreakpoint(),
    phone = bp === "phone",
    tablet = bp === "tablet",
    { me } = useSession();
  const [making, setMaking] = useState(false);
  const can = (p: string) => !!me?.permissions.includes(p);
  const q = useQuery({
    queryKey: ["sample-history", id],
    queryFn: () => api<Data>(`/samples/${id}/history`),
    retry: false,
  });
  if (q.error && (q.error as ApiError).status === 404)
    return (
      <div className="page">
        <Card>
          <Empty
            icon="test-tube"
            title="This sample was not found"
            text="It may have been removed from its job order."
            action={
              <Link to="/search">
                <Button>Back to Search</Button>
              </Link>
            }
          />
        </Card>
      </div>
    );
  const d = q.data;
  if (!d)
    return (
      <div className="page">
        <Card>
          <Empty icon="clock-counter-clockwise" title="Loading the history" />
        </Card>
      </div>
    );
  const s = d.sample;
  const linkOk = (k: NonNullable<HistoryEvent["link"]>["kind"]) =>
    k === "coa"
      ? can("coa.download") || can("report.sign")
      : k === "analysis"
        ? can("batch.read")
        : k === "roa"
          ? can("roa.download")
          : can("batch.read");
  // Export PDF (frames Desktop- and Tablet-08-Search-04-Sample_history-01-Default; the phone frame has none): the API renders the page's card and timeline
  const exportPdf = async () => {
    setMaking(true);
    try {
      const u = URL.createObjectURL(await apiBlob(`/samples/${id}/history/pdf`)),
        a = document.createElement("a");
      a.href = u;
      a.download = `History-${s.title}.pdf`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(u), 2000);
    } catch (x) {
      toast((x as ApiError).text ?? "The PDF could not be made.", "error");
    } finally {
      setMaking(false);
    }
  };
  const depth =
    s.depthFrom != null && s.depthTo != null
      ? `${s.depthFrom.toFixed(2)} to ${s.depthTo.toFixed(2)} m`
      : null;
  const card = (
    <Card title="Sample">
      <div className={tablet ? "sh-kv2" : "col"} id="sh-card">
        <KV k="Drill hole">{s.drillHole ?? "-"}</KV>
        <KV k="Depth">{depth ?? "-"}</KV>
        <KV k="Description">{s.description ?? "-"}</KV>
        <KV k="Sample type">{s.sampleType ?? "-"}</KV>
        <KV k="Mass received">
          {s.mass != null ? `${s.mass.toFixed(2)} kg` : "-"}
        </KV>
        <KV k="Condition">{s.condition ?? "-"}</KV>
        <KV k="Status">
          <Badge sm label={s.status} tone={s.statusTone} />
        </KV>
        {s.held && (
          <KV k="Held reason">
            {[s.held.reason, s.held.note].filter(Boolean).join(", ") || "-"}
          </KV>
        )}
      </div>
    </Card>
  );
  const history = (
    <Card title="History">
      <div className="sh-list" id="sh-list">
        {d.events.map((e, i) => (
          <div
            key={e.key}
            className={cx("sh-entry", e.tone === "pending" && "pending")}
            data-tone={e.tone}
            {...(e.tone === "pending" ? { "data-pending": "" } : {})}
          >
            {i > 0 && <div className="sh-divider" />}
            <div
              className="row g10"
              style={{ flexWrap: "nowrap", alignItems: "flex-start" }}
            >
              <span className="sh-dot">
                <i className={e.tone} />
              </span>
              <div className="col grow" style={{ gap: 6, minWidth: 0 }}>
                <span
                  className={cx(
                    "t-sm",
                    e.tone === "pending" ? "c-mut" : "c-for w5",
                  )}
                >
                  {e.title}
                </span>
                {e.detail && (
                  <span className="row g12 t-cap c-sec wrap">
                    {e.detail.split("	").map((x) => (
                      <span key={x}>{x}</span>
                    ))}
                  </span>
                )}
                {e.values && e.values.length > 0 && (
                  <span className="sh-values">
                    {e.values.map((v) => (
                      <span key={v.code + v.basis} className="t-data-sm">
                        <b className="w6">{v.code}</b> {v.value}
                        <span className="c-mut"> {v.basis}</span>
                      </span>
                    ))}
                  </span>
                )}
                {e.link &&
                  (linkOk(e.link.kind) ? (
                    <Link
                      to={e.link.to}
                      className={cx(
                        "t-cap",
                        e.link.kind === "analysis" ? "c-act w6" : "c-act",
                      )}
                    >
                      {e.link.label}
                    </Link>
                  ) : (
                    <span className="t-cap c-sec">{e.link.label}</span>
                  ))}
                {e.at && (
                  <span
                    className="row g8 t-cap c-sec"
                    style={{ flexWrap: "wrap" }}
                  >
                    {e.by && (
                      <span className="row g6" style={{ flexWrap: "nowrap" }}>
                        <Avatar name={e.by} size={24} />
                        <span>{e.by}</span>
                      </span>
                    )}
                    <span>{dateTime(e.at)}</span>
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
  return (
    <div className="page">
      <PageHead
        crumb={[
          ["Job orders", "/orders"],
          [s.orderNo, `/orders/${s.orderNo}`],
          [s.title],
        ]}
        title={s.title}
        badge={<Badge label={s.status} tone={s.statusTone} />}
        actions={
          phone ? undefined : (
            <Button
              size="lg"
              icon="file-pdf"
              id="sh-export"
              disabled={making}
              onClick={exportPdf}
            >
              {making ? "Preparing" : "Export PDF"}
            </Button>
          )
        }
        sub={
          <span className="row g12 t-sm c-sec wrap" id="sh-sub">
            {s.sampleCode && <span className="t-data">{s.sampleCode}</span>}
            <span>{s.clientRef}</span>
            <Link to={`/orders/${s.orderNo}`} className="t-data c-act">
              {s.orderNo}
            </Link>
            {s.batchNo &&
              (can("batch.read") ? (
                <Link to={`/batches/${s.batchNo}`} className="t-data c-act">
                  {s.batchNo}
                </Link>
              ) : (
                <span className="t-data">{s.batchNo}</span>
              ))}
            <span>{s.company}</span>
          </span>
        }
      />
      <div className={bp === "desktop" ? "sh-cols" : "col g16"}>
        {card}
        {history}
      </div>
    </div>
  );
}
