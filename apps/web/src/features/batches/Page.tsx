// The batch page (FigCraft 04-Batches-02-Batch_detail; spec S-08, S-18): breadcrumb Batches > number, the header with the job order link, the six-step
// stepper and the tabs Reception, Preparation and Analysis. The page opens on the tab that matches the batch's status.
import { useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../app/api";
import { useBreakpoint, useSession } from "../../app/session";
import {
  Badge,
  Button,
  Card,
  Empty,
  Icon,
  Menu,
  PageHead,
  Stepper,
  Tabs,
} from "../../components";
import { LogDialog, NumberDialog } from "./Dialogs";
import { PreparationTab } from "./Preparation";
import { AnalysisTab } from "./Analysis";
import { RoaCard } from "./Roa";
import { ReceptionTab } from "./Reception";
import {
  STATUS_LABEL,
  STATUS_TONE,
  STD_LABEL,
  dLong,
  dShort,
  tabFor,
  todayIso,
  type BatchPageData,
} from "./shared";

type Tab = "reception" | "preparation" | "analysis";

/** The six steps of the batch page (spec 9.2.1): Receiving is derived from the first arrival. */
function steps(b: BatchPageData) {
  const at =
    (
      {
        created: 0,
        receiving: 1,
        preparation: 2,
        prep_finished: 3,
        analysis: 4,
        analysis_finished: 5,
        completed: 6,
      } as Record<string, number>
    )[b.status] ?? 0;
  const d = b.dates;
  const note = [
    dShort(d.createdAt),
    d.firstArrivedAt ? dShort(d.firstArrivedAt) : "",
    dShort(d.receptionConfirmedAt),
    dShort(d.prepFinishedAt),
    d.analysisStartedAt ? `Started ${dShort(d.analysisStartedAt)}` : "",
    dShort(d.completedAt),
  ];
  return [
    "Created",
    "Receiving",
    "Preparation",
    "Prep finished",
    "Analysis",
    "Completed",
  ].map((n, i) => ({
    name: n,
    note: note[i] || (i === at ? "Current" : "—"),
    state: (i < at ? "done" : i === at ? "cur" : "up") as "done" | "cur" | "up",
  }));
}

export function BatchPage() {
  const { no = "", tab: t } = useParams(),
    nav = useNavigate(),
    bp = useBreakpoint(),
    phone = bp === "phone",
    tablet = bp === "tablet";
  const { me } = useSession();
  const can = (p: string) => !!me?.permissions.includes(p);
  const [num, setNum] = useState(false),
    [log, setLog] = useState(false);
  const q = useQuery({
    queryKey: ["batch", no],
    queryFn: () => api<BatchPageData>(`/batches/${no}`),
  });
  if (q.isLoading)
    return (
      <div className="page">
        <Card>
          <Empty icon="files" title="Loading batch" />
        </Card>
      </div>
    );
  if (q.error || !q.data)
    return (
      <div className="page">
        <Card>
          <Empty
            icon="files"
            title="Batch not found"
            text="It may have been removed, or the number is wrong."
            action={
              <Button onClick={() => nav("/batches")}>Back to batches</Button>
            }
          />
        </Card>
      </div>
    );
  const b = q.data;
  if (!t || !["reception", "preparation", "analysis"].includes(t))
    return (
      <Navigate to={`/batches/${b.batchNo}/${tabFor(b.status)}`} replace />
    );
  const tab = t as Tab,
    created = b.stored === "created";
  const late =
    !!b.deadlineOn && b.deadlineOn < todayIso() && b.stored !== "completed";
  const arrivedText = created
    ? `${b.counts.arrived} of ${b.counts.expected} arrived`
    : `${b.counts.received} ${b.counts.received === 1 ? "sample" : "samples"}`;
  const menu = (
    <Menu
      label="More actions"
      vertical
      size={36}
      items={[
        can("batch.number.edit") &&
          created && {
            label: "Edit batch number",
            icon: "pencil-simple",
            onClick: () => setNum(true),
          },
        {
          label: "View batch log",
          icon: "clock-counter-clockwise",
          onClick: () => setLog(true),
        },
      ]}
    />
  );
  const sub = (
    <div className="col g6 order-sub">
      <b className="t-sm w6" style={{ fontWeight: 500 }}>
        {b.company.name}
      </b>
      <span className="row g16 wrap t-sm c-sec bp-meta">
        <Link
          to={`/orders/${b.order.orderNo}`}
          className="row g6 c-act"
          id="bp-order"
        >
          <Icon n="clipboard-text" />
          {b.order.orderNo}
        </Link>
        <span className="row g6">
          <Icon n="flask" />
          {STD_LABEL[b.standard]}
        </span>
        {b.deadlineOn && (
          <span className={late ? "row g6 c-err" : "row g6"}>
            <Icon n="calendar-blank" />
            {dLong(b.deadlineOn)}
            {late && <b className="w6">Past due</b>}
          </span>
        )}
        <span className="row g6">
          <Icon n="cylinder" />
          {arrivedText}
        </span>
      </span>
    </div>
  );
  const title = (
    <span className="row g8" style={{ flexWrap: "nowrap" }}>
      {b.batchNo}
      {can("batch.number.edit") && created && (
        <Button
          iconOnly
          size="sm"
          icon="pencil-simple"
          label="Edit batch number"
          id="edit-number"
          onClick={() => setNum(true)}
        />
      )}
    </span>
  );
  return (
    <div className="page">
      <PageHead
        crumb={[["Batches", "/batches"], [b.batchNo]]}
        title={title}
        badge={
          <span className="row g8">
            <Badge
              label={STATUS_LABEL(b.status)}
              tone={STATUS_TONE(b.status)}
            />
            {phone && menu}
          </span>
        }
        sub={sub}
        actions={phone ? undefined : menu}
      />
      <Card>
        <Stepper steps={steps(b)} vertical={phone} />
      </Card>
      <Tabs
        items={[
          {
            id: "reception" as Tab,
            label: "Reception",
            count: b.counts.inBatch,
          },
          { id: "preparation" as Tab, label: "Preparation" },
          { id: "analysis" as Tab, label: "Analysis" },
        ]}
        value={tab}
        onChange={(v) => nav(`/batches/${b.batchNo}/${v}`)}
      />
      {tab === "reception" && (
        <ReceptionTab b={b} phone={phone} tablet={tablet} />
      )}
      {tab === "preparation" && (
        <PreparationTab b={b} phone={phone} tablet={tablet} />
      )}
      {tab === "analysis" && <RoaCard b={b} phone={phone} />}
      {tab === "analysis" && <AnalysisTab b={b} phone={phone} tablet={tablet} />}
      {num && (
        <NumberDialog
          b={b}
          phone={phone}
          onClose={() => setNum(false)}
          onSaved={(n) => {
            setNum(false);
            nav(`/batches/${n}/reception`, { replace: true });
          }}
        />
      )}
      {log && (
        <LogDialog
          batchNo={b.batchNo}
          phone={phone}
          onClose={() => setLog(false)}
        />
      )}
    </div>
  );
}
