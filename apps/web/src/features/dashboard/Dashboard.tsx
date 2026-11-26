// Dashboard, Operations tab (FigCraft module 02 Dashboard; Dashboard_v2_Screen_Plan.md sections 4, 5 and 7): what is in the lab, what is due or late, and how fast the lab works.
// Charts are drawn with CSS and SVG in the token colours (no chart library, Phase 5 decision 3). The Quality & reports tab arrives in slice C.
// Owner, Nov 24: the layout follows the "Operations-01-Lab_admin ref" frames. Bars take the colour of the status pill they count; every number is JetBrains Mono,
// a display number (KPI, donut total, queue count) is Newsreader.
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../app/api";
import { useBreakpoint, useSession } from "../../app/session";
import {
  Badge,
  Button,
  Card,
  Chips,
  Dialog,
  Empty,
  Icon,
  PageHead,
  Pager,
  Select,
  Table,
  Tabs,
  cx,
  type Col,
  type Tone, todayLabel
} from "../../components";
import { useCompanyOptions } from "../master-data/shared";
import { STATUS_LABEL, STATUS_TONE } from "../batches/shared";
import {
  STATUS_LABEL as ORDER_LABEL,
  STATUS_TONE as ORDER_TONE,
} from "../orders/shared";
import { useWork } from "../work/Work";
import { Kpi, fmt } from "./Kpi";
import { QualityTab } from "./Quality";

interface Ops {
  period: {
    from: string;
    to: string;
    days: number;
    today: string;
    monday: string;
    sunday: string;
  };
  kpis: {
    inProgress: number;
    completed: number;
    created: number;
    dueWeek: number;
    pastDue: number;
    received: number;
    receivedBatches: number;
    receivedPrev: number;
    turnaround: {
      days: number | null;
      target: number | null;
      band: string | null;
      n: number;
    };
  };
  workflow: Array<{ id: string; n: number }>;
  orders: Array<{ id: string; n: number }>;
  mix: Array<{ label: string; n: number }>;
  perDay: Array<{ d: string; n: number }>;
  turnaround: Array<{
    id: string;
    company: string;
    n: number;
    days: number;
    target: number;
    band: string;
  }>;
  active: Array<{
    batchNo: string;
    orderNo: string;
    company: string;
    status: string;
    deadline: string | null;
    arrived: number;
    total: number;
    late: boolean;
    band: string | null;
  }>;
  alert: { count: number; first: { batchNo: string; status: string } } | null;
  week: Array<{
    batchNo: string;
    deadline: string;
    status: string;
    company: string;
  }>;
}
const PERIODS: Array<[string, string]> = [
  ["7", "Last 7 days"],
  ["30", "Last 30 days"],
  ["this_month", "This month"],
  ["last_month", "Last month"],
  ["this_year", "This year"],
];
/** The pill colours (badges.css .tn-*) as one colour, for a bar that counts that status. */
const TONE_COLOR: Partial<Record<Tone, string>> = {
  grey: "var(--status-st-created)",
  navy: "var(--primary-deep)",
  amber: "var(--status-st-prep)",
  blue: "var(--status-st-analysis)",
  purple: "var(--status-st-finished)",
  green: "var(--status-st-completed)",
  red: "var(--feedback-error)",
};
/** Mean turnaround against its target: on target green, up to 150% amber, beyond red (frame: Turnaround by company). */
const bandColor = (band: string | null) =>
  !band
    ? "var(--primary)"
    : band === "achieved"
      ? "var(--feedback-success)"
      : ["100-110%", "110-125%", "125-150%"].includes(band)
        ? "var(--accent)"
        : "var(--feedback-error)";
const PIE = [
  "var(--action)",
  "var(--accent)",
  "var(--rust)",
  "var(--status-st-finished)",
  "var(--feedback-success)",
  "var(--primary-400)",
  "var(--status-st-created)",
];
const at = (d: string) => new Date(`${d}T00:00:00`);
const dShort = (d: string) =>
  at(d).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
const dWeek = (d: string) =>
  at(d).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
const addDays = (d: string, n: number) =>
  new Date(at(d).getTime() + n * 86_400_000 + 12 * 3_600_000)
    .toISOString()
    .slice(0, 10);

/** One horizontal bar row: label, a clipping container holding the bar at its value width, the value in one column at the right. */
function BarRow({
  label,
  value,
  shown,
  max,
  color,
  onClick,
  id,
}: {
  label: string;
  value: number;
  shown?: string;
  max: number;
  color: string;
  onClick?: () => void;
  id?: string;
}) {
  const body = (
    <>
      <span className="t-cap c-sec ellip">{label}</span>
      <span className="bar-box">
        <i
          style={{
            width: `${max ? Math.max(value ? 3 : 0, (value / max) * 100) : 0}%`,
            background: color,
          }}
        />
      </span>
      <span className="t-data c-for bar-n">{shown ?? value}</span>
    </>
  );
  return onClick ? (
    <button type="button" id={id} className="bar-row" onClick={onClick}>
      {body}
    </button>
  ) : (
    <div className="bar-row" id={id}>
      {body}
    </div>
  );
}

function Donut({
  rows,
  size,
}: {
  rows: Array<{ label: string; n: number }>;
  size: number;
}) {
  const total = rows.reduce((a, x) => a + x.n, 0),
    R = 80,
    W = 40,
    C = 2 * Math.PI * R;
  let off = 0;
  return (
    <div className="donut-wrap">
      <span className="donut" style={{ width: size, height: size }}>
        <svg
          viewBox="0 0 200 200"
          width={size}
          height={size}
          role="img"
          aria-label="Sample type mix"
        >
          <circle
            cx="100"
            cy="100"
            r={R}
            fill="none"
            stroke="var(--surface-sand)"
            strokeWidth={W}
          />
          {total > 0 &&
            rows.map((x, i) => {
              const len = (x.n / total) * C,
                el = (
                  <circle
                    key={x.label}
                    cx="100"
                    cy="100"
                    r={R}
                    fill="none"
                    stroke={PIE[i % PIE.length]}
                    strokeWidth={W}
                    strokeDasharray={`${len} ${C - len}`}
                    strokeDashoffset={-off}
                    transform="rotate(-90 100 100)"
                  />
                );
              off += len;
              return el;
            })}
        </svg>
        <span className="donut-c">
          <b className="t-h1">{fmt(total)}</b>
          <span className="t-cap c-sec">samples</span>
        </span>
      </span>
      <div className="legend-list" id="db-mix-legend">
        {rows.map((x, i) => (
          <span
            key={x.label}
            className="row g6 t-cap"
            style={{ flexWrap: "nowrap" }}
          >
            <i className="sw" style={{ background: PIE[i % PIE.length] }} />
            <span className="c-sec w5">{x.label}</span>
            <b className="mono-sb c-for">
              {total ? Math.round((x.n / total) * 100) : 0}%
            </b>
          </span>
        ))}
      </div>
    </div>
  );
}

/** Your queues (frame "Your queues card", owner redesign Nov 24): the title and Open My work at the left, one cell per queue with work. */
function QueuesCard({
  queues,
  phone,
}: {
  queues: Array<{ id: string; label: string; count: number; overdue: number }>;
  phone: boolean;
}) {
  const nav = useNavigate();
  const open = (
    <Button
      icon="arrow-right"
      size={phone ? "touch" : "lg"}
      id="db-open-work"
      onClick={() => nav("/work")}
    >
      Open My work
    </Button>
  );
  return (
    <section className="card yq" id="db-queues">
      {phone ? (
        <div className="row between" style={{ flexWrap: "nowrap" }}>
          <h2 className="t-h3">Your queues</h2>
          {open}
        </div>
      ) : (
        <div className="col g8" style={{ flex: "none" }}>
          <h2 className="t-h3">Your queues</h2>
          <span>{open}</span>
        </div>
      )}
      <div className="yq-cells">
        {queues.map((x) => (
          <Link
            key={x.id}
            to={`/work/${x.id}`}
            id={`dbq-${x.id}`}
            className="yq-cell"
          >
            <span
              className="row between"
              style={{ flexWrap: "nowrap", gap: 12 }}
            >
              <b className={cx("t-h3", x.overdue > 0 && "c-err")}>{x.count}</b>
              {x.overdue > 0 && (
                <span className="c-err" title={`${x.overdue} past due`}>
                  <Icon n="warning" />
                </span>
              )}
            </span>
            <span className="t-cap c-sec">{x.label}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

/** How many daily columns fit: each needs 32 px plus the 6 px gap; when 14 do not fit the chart shows the latest days that do (owner, Nov 25). */
function useFit(max: number) {
  const ref = useRef<HTMLDivElement>(null), [n, setN] = useState(max);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const f = () => setN(Math.max(1, Math.min(max, Math.floor((el.clientWidth + 6) / 38))));
    f(); const ro = new ResizeObserver(f); ro.observe(el); return () => ro.disconnect();
  });
  return [ref, n] as const;
}

export function DashboardPage() {
  const [chartRef, fit] = useFit(14);
  const bp = useBreakpoint(),
    phone = bp === "phone",
    tablet = bp === "tablet",
    desk = bp === "desktop",
    nav = useNavigate();
  const { me } = useSession();
  // Operations for everyone; Quality & reports only for roles with dashboard.quality (Dashboard plan section 3), kept in the address (?tab=quality)
  const [sp, setSp] = useSearchParams();
  const canQuality = !!me?.permissions.includes("dashboard.quality");
  const tab: "ops" | "quality" = canQuality && sp.get("tab") === "quality" ? "quality" : "ops";
  const [period, setPeriod] = useState("30"),
    [company, setCompany] = useState(""),
    [sheet, setSheet] = useState(false);
  const [filter, setFilter] = useState<"all" | "due" | "late">("all"),
    [page, setPage] = useState(1),
    [day, setDay] = useState<string | null>(null);
  const companies = useCompanyOptions("All companies");
  const hasWork = !!me?.permissions.includes("work.use");
  const work = useWork(hasWork);
  const q = useQuery({
    queryKey: ["dashboard-ops", period, company],
    queryFn: () =>
      api<Ops>(
        `/dashboard/operations?period=${period}${company ? `&company=${company}` : ""}`,
      ),
    placeholderData: (p) => p,
    staleTime: 30_000,
    retry: false,
    enabled: tab === "ops",
  });
  useEffect(() => setPage(1), [filter, period, company]);
  const d = q.data;
  const filters = (
    <>
      <Select
        id="db-period"
        label="Period"
        value={period}
        onChange={setPeriod}
        options={PERIODS}
        width={phone ? undefined : 200}
      />
      <Select
        id="db-company"
        label="Company"
        value={company}
        onChange={setCompany}
        options={companies.options}
        width={phone ? undefined : 220}
      />
    </>
  );
  const today = d?.period.today ?? "";
  const weekDays = d
    ? Array.from({ length: 7 }, (_, i) => addDays(d.period.monday, i))
    : [];
  const soon = (x: Ops["active"][number]) =>
    !!x.deadline && !x.late && x.deadline <= addDays(today, 7);
  const counts = {
    all: d?.active.length ?? 0,
    due: d?.active.filter((x) => x.late || soon(x)).length ?? 0,
    late: d?.active.filter((x) => x.late).length ?? 0,
  };
  const rows = (d?.active ?? []).filter((x) =>
    filter === "all" ? true : filter === "late" ? x.late : x.late || soon(x),
  );
  const pageRows = rows.slice((page - 1) * 8, page * 8);
  const deadline = (x: Ops["active"][number]) =>
    x.deadline ? (
      <span
        className={cx("row g4 t-cap", x.late ? "c-err" : "c-for")}
        style={{ flexWrap: "nowrap" }}
        title={x.late ? "Past due" : undefined}
      >
        {dShort(x.deadline)}
        {x.late && <Icon n="warning" />}
      </span>
    ) : (
      <span className="c-mut">-</span>
    );
  const cols: Array<Col<Ops["active"][number]> | false> = [
    {
      h: "Batch",
      fit: true,
      render: (x) => <b className="t-data-b c-head">{x.batchNo}</b>,
    },
    {
      h: "Company",
      fill: true,
      render: (x) => <span className="t-cap c-for">{x.company}</span>,
    },
    desk && {
      h: "Job order",
      fit: true,
      render: (x) => <span className="t-data c-act">{x.orderNo}</span>,
    },
    { h: "Deadline", fit: true, render: deadline },
    {
      h: "Progress",
      fit: true,
      render: (x) => (
        <span className="t-data-sm c-sec">
          {x.arrived} / {x.total}
        </span>
      ),
    },
    {
      h: "Status",
      fit: true,
      render: (x) => (
        <Badge label={STATUS_LABEL(x.status)} tone={STATUS_TONE(x.status)} />
      ),
    },
  ];
  const queues = work.data?.queues.filter((x) => x.count > 0) ?? [];
  const maxWf = Math.max(1, ...(d?.workflow.map((x) => x.n) ?? [0])),
    maxOd = Math.max(1, ...(d?.orders.map((x) => x.n) ?? [0])),
    maxDay = Math.max(1, ...(d?.perDay.slice(-fit).map((x) => x.n) ?? [0])),
    maxTa = Math.max(
      1,
      ...(d?.turnaround.map((x) => Math.max(x.days, x.target)) ?? [0]),
    );
  const k = d?.kpis;
  const pct =
    k && k.receivedPrev
      ? Math.round(((k.received - k.receivedPrev) / k.receivedPrev) * 100)
      : null;
  const tn = k?.turnaround;
  const tag = (x: string) =>
    x < today
      ? { label: "Past due", tone: "red" as Tone }
      : x === today
        ? { label: "Due today", tone: "amber" as Tone }
        : x === addDays(today, 1)
          ? { label: "Due tomorrow", tone: "amber" as Tone }
          : {
              label: `Due ${at(x).toLocaleDateString("en-GB", { weekday: "short" })}`,
              tone: "grey" as Tone,
            };
  const weekItems = (d?.week ?? []).filter((w) => !day || w.deadline === day);
  const periodLabel = PERIODS.find((p) => p[0] === period)?.[1] ?? "";

  const alert = d?.alert && (
    <section className="callout ga-al" id="db-alert">
      <span className="t-over c-accent-soft">Deadline alert</span>
      <h2 className="t-h3 c-inv">
        {d.alert.count} {d.alert.count === 1 ? "batch is" : "batches are"} due
        within 24 h
      </h2>
      <span className="t-sm c-inv">
        {d.alert.first.batchNo} is still in{" "}
        {STATUS_LABEL(d.alert.first.status).toLowerCase()}.
      </span>
      <Button
        type="primary"
        tone="accent"
        size="lg"
        block
        id="db-alert-open"
        onClick={() => nav(`/batches/${d.alert!.first.batchNo}`)}
      >
        Open batch
      </Button>
    </section>
  );
  return (
    <div className="page">
      <PageHead
        overline={todayLabel()}
        title="Dashboard"
        actions={
          phone ? (
            <Button
              icon="funnel"
              size="lg"
              id="db-filters"
              onClick={() => setSheet(true)}
            >
              Filters
            </Button>
          ) : desk ? (
            <div className="row g12" style={{ alignItems: "flex-end" }}>
              {filters}
            </div>
          ) : undefined
        }
      />
      {canQuality && (
        <div className={phone ? "db-tabs sticky" : "db-tabs"}>
          <Tabs
            items={[
              { id: "ops" as const, label: "Operations" },
              { id: "quality" as const, label: "Quality & reports" },
            ]}
            value={tab}
            onChange={(v) => setSp(v === "quality" ? { tab: "quality" } : {}, { replace: true })}
          />
        </div>
      )}
      {tablet && (
        <div className="row g12" style={{ alignItems: "flex-end" }}>
          {filters}
        </div>
      )}
      {tab === "quality" ? (
        <QualityTab period={period} company={company} phone={phone} tablet={tablet} desk={desk} />
      ) : !d ? (
        <Card>
          <Empty icon="squares-four" title="Loading the dashboard" />
        </Card>
      ) : (
        <>
          {hasWork && queues.length > 0 && (
            <QueuesCard queues={queues} phone={phone} />
          )}
          <div className="kpi-grid">
            <Kpi
              id="kpi-progress"
              label="Batches in progress"
              value={fmt(k!.inProgress)}
              to="/batches"
              captions={[
                { text: `${k!.completed} completed` },
                { text: `${k!.created} created` },
              ]}
            />
            <Kpi
              id="kpi-due"
              label="Due this week"
              value={fmt(k!.dueWeek)}
              to="/batches"
              captions={
                k!.pastDue
                  ? [
                      { text: `${k!.pastDue} past due`, err: true },
                      {
                        text: `${Math.max(0, k!.dueWeek - k!.pastDue)} on time`,
                      },
                    ]
                  : [{ text: "None past due" }]
              }
            />
            <Kpi
              id="kpi-received"
              label="Samples received"
              value={fmt(k!.received)}
              delta={
                pct == null
                  ? undefined
                  : {
                      up: pct >= 0,
                      text: `${pct >= 0 ? "+" : "−"}${fmt(Math.abs(pct))}%`,
                    }
              }
              captions={[
                { text: periodLabel },
                {
                  text: `${k!.receivedBatches} ${k!.receivedBatches === 1 ? "batch" : "batches"}`,
                },
              ]}
            />
            <Kpi
              id="kpi-turnaround"
              label="Mean turnaround"
              value={tn!.days == null ? "-" : `${tn!.days} d`}
              captions={
                tn!.days == null
                  ? [{ text: "No batch completed in the period" }]
                  : [
                      { text: `Target ${tn!.target} d` },
                      {
                        text:
                          tn!.band === "achieved"
                            ? "On target"
                            : `${tn!.band} of target`,
                        err:
                          !!tn!.band &&
                          bandColor(tn!.band) === "var(--feedback-error)",
                      },
                    ]
              }
            />
          </div>
          <div className={cx("dash-grid", !d.alert && "no-alert")}>
            <Card className="ga-wf" title="Batch workflow">
              <div className="col g10" id="db-workflow">
                {d.workflow.map((x) => (
                  <BarRow
                    key={x.id}
                    id={`wf-${x.id}`}
                    label={STATUS_LABEL(x.id)}
                    value={x.n}
                    max={maxWf}
                    color={TONE_COLOR[STATUS_TONE(x.id)] ?? "var(--primary)"}
                    onClick={() => nav(`/batches?status=${x.id}`)}
                  />
                ))}
              </div>
            </Card>
            <Card className="ga-od" title="Job orders by status">
              <div className="col g10" id="db-orders">
                {d.orders.map((x) => (
                  <BarRow
                    key={x.id}
                    id={`od-${x.id}`}
                    label={
                      ORDER_LABEL[x.id as keyof typeof ORDER_LABEL] ?? x.id
                    }
                    value={x.n}
                    max={maxOd}
                    color={
                      TONE_COLOR[ORDER_TONE[x.id as keyof typeof ORDER_TONE]] ??
                      "var(--primary)"
                    }
                    onClick={() => nav(`/orders?status=${x.id}`)}
                  />
                ))}
              </div>
            </Card>
            <Card className="ga-mix" title="Sample type mix">
              {d.mix.length ? (
                <Donut rows={d.mix} size={phone ? 200 : desk ? 180 : 170} />
              ) : (
                <Empty icon="chart-donut" title="No samples in the period" />
              )}
            </Card>
            <Card className="ga-day" title="Samples received per day">
              <div className="cols-chart" id="db-perday" ref={chartRef}>
                {d.perDay.slice(-fit).map((x) => (
                  <span
                    key={x.d}
                    className="col-bar"
                    title={`${dShort(x.d)}: ${x.n}`}
                  >
                    <b className="bar-val">{x.n}</b>
                    <span className="bar-col">
                      <i style={{ height: `${(x.n / maxDay) * 100}%` }} />
                    </span>
                    <small>{Number(x.d.slice(8))}</small>
                  </span>
                ))}
              </div>
            </Card>
            <Card
              className="ga-ta"
              title="Turnaround by company"
              actions={
                tn?.target ? (
                  <span className="t-cap c-mut">Target {tn.target} days</span>
                ) : undefined
              }
            >
              {d.turnaround.length ? (
                <div className="col g10" id="db-turnaround">
                  {d.turnaround.map((x) => (
                    <BarRow
                      key={x.id}
                      label={x.company}
                      value={x.days}
                      shown={`${x.days} d`}
                      max={maxTa}
                      color={bandColor(x.band)}
                    />
                  ))}
                </div>
              ) : (
                <Empty icon="timer" title="No batch completed in the period" />
              )}
            </Card>
            <Card
              className="ga-act"
              title="Active batches"
              actions={
                <Chips
                  scroll={phone}
                  items={[
                    { id: "all", label: "All", count: counts.all },
                    { id: "due", label: "Due", count: counts.due },
                    { id: "late", label: "Late", count: counts.late },
                  ]}
                  value={filter}
                  onChange={(v) => setFilter(v as typeof filter)}
                />
              }
            >
              {phone ? (
                <div className="col g8" id="db-active">
                  {pageRows.map((x) => (
                    <Link
                      key={x.batchNo}
                      to={`/batches/${x.batchNo}`}
                      className="act-batch"
                    >
                      <span
                        className="row between"
                        style={{ flexWrap: "nowrap" }}
                      >
                        <b className="t-data-b c-head">{x.batchNo}</b>
                        <Badge
                          sm
                          label={STATUS_LABEL(x.status)}
                          tone={STATUS_TONE(x.status)}
                        />
                      </span>
                      <span className="t-cap c-for">{x.company}</span>
                      <span
                        className="row g12 t-cap c-sec"
                        style={{ flexWrap: "nowrap" }}
                      >
                        <span
                          className={cx("row g4", x.late && "c-err")}
                          title={x.late ? "Past due" : undefined}
                        >
                          <Icon n="calendar-blank" />
                          {x.deadline ? dShort(x.deadline) : "-"}
                          {x.late && <b className="w6">Past due</b>}
                        </span>
                        <span className="t-data-sm">
                          {x.arrived} / {x.total}
                        </span>
                      </span>
                    </Link>
                  ))}
                  {!pageRows.length && (
                    <Empty icon="files" title="No batches here" />
                  )}
                </div>
              ) : (
                <Table
                  cols={cols}
                  rows={pageRows}
                  keyOf={(x) => x.batchNo}
                  onRow={(x) => nav(`/batches/${x.batchNo}`)}
                  empty={
                    <Empty
                      icon="files"
                      title="No batches here"
                      text="Nothing is waiting in this view."
                    />
                  }
                />
              )}
              {rows.length > 8 && (
                <Pager
                  page={page}
                  pages={Math.ceil(rows.length / 8)}
                  total={rows.length}
                  from={(page - 1) * 8 + 1}
                  to={Math.min(page * 8, rows.length)}
                  onPage={setPage}
                  compact={phone}
                />
              )}
            </Card>
            {alert}
            <Card className="ga-wk" title="This week">
              <div className="week-strip" id="db-week">
                {weekDays.map((x) => {
                  const n = d.week.filter((w) => w.deadline === x).length;
                  return (
                    <button
                      key={x}
                      type="button"
                      id={`wd-${x}`}
                      aria-pressed={day === x}
                      className={cx(
                        "weekday",
                        x === today && "today",
                        day === x && "sel",
                      )}
                      onClick={() => setDay(day === x ? null : x)}
                    >
                      <small>
                        {at(x).toLocaleDateString("en-GB", {
                          weekday: "short",
                        })}
                      </small>
                      <b>{Number(x.slice(8))}</b>
                      {n > 0 ? (
                        <i className="dot" />
                      ) : (
                        <i className="dot none" />
                      )}
                    </button>
                  );
                })}
              </div>
              <div className="col" id="db-week-items">
                {weekItems.map((w) => {
                  const t = tag(w.deadline);
                  return (
                    <Link
                      key={w.batchNo}
                      to={`/batches/${w.batchNo}`}
                      className="due-item"
                    >
                      <span
                        className="row between"
                        style={{ flexWrap: "nowrap" }}
                      >
                        <b className="t-data-b c-head">{w.batchNo}</b>
                        <span className={cx("tag", `tn-${t.tone}`)}>
                          <Icon n="clock" />
                          {t.label}
                        </span>
                      </span>
                      <span
                        className="row g6 t-cap c-sec"
                        style={{ flexWrap: "nowrap", minWidth: 0 }}
                      >
                        <span className="nowrap">{dWeek(w.deadline)}</span>
                        <span className="ellip">{w.company}</span>
                      </span>
                    </Link>
                  );
                })}
                {!weekItems.length && (
                  <span className="t-sm c-mut" style={{ paddingTop: 8 }}>
                    {day
                      ? `No deadline on ${dWeek(day)}.`
                      : "No deadline this week."}
                  </span>
                )}
              </div>
            </Card>
          </div>
        </>
      )}
      {sheet && (
        <Dialog
          title="Filters"
          size="sm"
          phone
          onClose={() => setSheet(false)}
          footer={
            <>
              <Button
                onClick={() => {
                  setPeriod("30");
                  setCompany("");
                  setSheet(false);
                }}
              >
                Clear all
              </Button>
              <Button type="primary" onClick={() => setSheet(false)}>
                Apply
              </Button>
            </>
          }
        >
          <div className="col g12">{filters}</div>
        </Dialog>
      )}
    </div>
  );
}
