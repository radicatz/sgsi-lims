// Batch list (FigCraft 04-Batches-01-Batch_list; spec S-07): status chips with counts (several can be on), search, company and deadline, a Filters dialog,
// 25 rows a page from the server, cards on the phone. The list opens filtered to the person's own queue (plan 13.1 L3). A row opens the batch page on the
// tab that matches its status. Add batch asks for the job order first.
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../app/api";
import { useBreakpoint, useSession } from "../../app/session";
import {
  Badge,
  Button,
  Card,
  Dialog,
  Empty,
  Icon,
  Pager,
  Search,
  Select,
  Table,
  Tag,
  TextField,
  cx,
  useSort,
  type Col, todayLabel
} from "../../components";
import { useCompanyOptions } from "../master-data/shared";
import { AddBatch, ChooseOrder } from "./AddBatch";
import {
  STAGES,
  STATUS_LABEL,
  STATUS_TONE,
  STD_LABEL,
  dLong,
  dShort,
  tabFor,
  todayIso,
  type BatchList,
  type BatchRow,
  type Stage,
} from "./shared";

const DUE: Array<[string, string]> = [
  ["", "Any date"],
  ["past", "Before today"],
  ["today", "Today"],
  ["week", "Next 7 days"],
  ["month", "Next 30 days"],
];
const dueRange = (k: string): { dueFrom?: string; dueTo?: string } =>
  k === "past"
    ? { dueTo: todayIso(-1) }
    : k === "today"
      ? { dueFrom: todayIso(), dueTo: todayIso() }
      : k === "week"
        ? { dueFrom: todayIso(), dueTo: todayIso(7) }
        : k === "month"
          ? { dueFrom: todayIso(), dueTo: todayIso(30) }
          : {};
const SORT_KEY: Record<string, string> = {
  "Batch no.": "batch",
  "Job order": "order",
  Standard: "standard",
  Samples: "samples",
  Status: "status",
  Deadline: "deadline",
  RoA: "roa",
};

export function Batches() {
  const { me } = useSession(),
    bp = useBreakpoint(),
    phone = bp === "phone",
    desk = bp === "desktop",
    nav = useNavigate();
  const can = (p: string) => !!me?.permissions.includes(p);
  // the person's own queue: Preparation starts on Created and Preparation, the Analyst on Prep finished and Analysis
  const [sel, setSel] = useState<Stage[]>(() =>
    me?.roles.includes("prep")
      ? ["created", "preparation"]
      : me?.roles.includes("analyst")
        ? ["prep_finished", "analysis"]
        : [],
  );
  const [q, setQ] = useState(""),
    [dq, setDq] = useState(""),
    [company, setCompany] = useState(""),
    [due, setDue] = useState(""),
    [page, setPage] = useState(1);
  const [std, setStd] = useState(""),
    [order, setOrder] = useState(""),
    [from, setFrom] = useState(""),
    [to, setTo] = useState(""),
    [dFrom, setDFrom] = useState(""),
    [dTo, setDTo] = useState("");
  const { sort, onSort } = useSort(); // a sortable head sorts the whole list on the server
  const [filters, setFilters] = useState(false),
    [choose, setChoose] = useState(false),
    [adding, setAdding] = useState<string | null>(null);
  useEffect(() => {
    const t = setTimeout(() => setDq(q), 250);
    return () => clearTimeout(t);
  }, [q]);
  useEffect(
    () => setPage(1),
    [dq, sel, company, due, std, order, from, to, dFrom, dTo, sort],
  );
  const companies = useCompanyOptions("All companies");
  const range = dueRange(due);
  const params = new URLSearchParams({
    page: String(page),
    size: "25",
    ...(dq ? { q: dq } : {}),
    ...(sel.length ? { status: sel.join(",") } : {}),
    ...(company ? { company } : {}),
    ...(std ? { standard: std } : {}),
    ...(order ? { order } : {}),
    ...(from ? { from } : {}),
    ...(to ? { to } : {}),
    ...(dFrom || range.dueFrom ? { dueFrom: dFrom || range.dueFrom! } : {}),
    ...(dTo || range.dueTo ? { dueTo: dTo || range.dueTo! } : {}),
    ...(sort ? { sort: SORT_KEY[sort.h] ?? "batch", dir: sort.dir } : {}),
  });
  const list = useQuery({
    queryKey: ["batches", params.toString()],
    queryFn: () => api<BatchList>(`/batches?${params}`),
    placeholderData: (prev) => prev,
  });
  const data = list.data;
  const pages = data ? Math.max(1, Math.ceil(data.total / data.size)) : 1;
  const pager = {
    page,
    pages,
    total: data?.total ?? 0,
    from: data?.total ? (page - 1) * 25 + 1 : 0,
    to: Math.min(page * 25, data?.total ?? 0),
    onPage: setPage,
  };
  const reset = !!(
    q ||
    sel.length ||
    company ||
    due ||
    std ||
    order ||
    from ||
    to ||
    dFrom ||
    dTo
  );
  const clear = () => {
    setQ("");
    setSel([]);
    setCompany("");
    setDue("");
    setStd("");
    setOrder("");
    setFrom("");
    setTo("");
    setDFrom("");
    setDTo("");
  };
  const open = (b: BatchRow) =>
    nav(`/batches/${b.batchNo}/${tabFor(b.status)}`);
  const toggle = (s: Stage) =>
    setSel((x) => (x.includes(s) ? x.filter((y) => y !== s) : [...x, s]));

  const cols: Array<Col<BatchRow> | false> = [
    {
      h: "Batch no.",
      sort: () => 0,
      w: desk ? 150 : 130,
      render: (b) => (
        <span className="col" style={{ gap: 0 }}>
          <b className="t-data-b c-head">{b.batchNo}</b>
          <span className="t-cap c-mut">{dShort(b.batchDate)}</span>
        </span>
      ),
    },
    {
      h: "Job order",
      sort: () => 0,
      render: (b) => (
        <span className="col" style={{ gap: 0, minWidth: 0 }}>
          <span className="t-data c-act">{b.orderNo}</span>
          <span className="t-cap c-sec ellip">{b.company}</span>
        </span>
      ),
    },
    desk && {
      h: "Standard",
      sort: () => 0,
      fit: true,
      render: (b) => <Tag label={STD_LABEL[b.standard]} />,
    },
    desk && {
      h: "Samples",
      sort: () => 0,
      fit: true,
      cls: "r",
      render: (b) => (
        <span className="t-data-sm c-mut">
          {b.arrived} / {b.expected}
        </span>
      ),
    },
    {
      h: "Status",
      sort: () => 0,
      fit: true,
      render: (b) => (
        <Badge label={STATUS_LABEL(b.status)} tone={STATUS_TONE(b.status)} sm />
      ),
    },
    {
      h: "Deadline",
      sort: () => 0,
      fit: true,
      render: (b) =>
        b.deadlineOn ? (
          <span className="row g8 t-sm" style={{ flexWrap: "nowrap" }}>
            <span className={b.pastDue ? "c-err" : undefined}>
              {desk ? dLong(b.deadlineOn) : dLong(b.deadlineOn)}
            </span>
            {b.pastDue && <b className="w6 c-err">Past due</b>}
          </span>
        ) : (
          <span className="c-mut">—</span>
        ),
    },
    desk && {
      h: "RoA",
      sort: () => 0,
      w: 130,
      render: (b) =>
        b.roaNo ? (
          <span className="row g6 t-data c-act" style={{ flexWrap: "nowrap" }}>
            <Icon n="file-pdf" />
            {b.roaNo}
          </span>
        ) : (
          <span className="c-mut">—</span>
        ),
    },
    {
      h: "",
      w: 32,
      cls: "r",
      render: () => (
        <span className="c-mut">
          <Icon n="caret-right" />
        </span>
      ),
    },
  ];
  const addBtn = can("batch.create") && (
    <Button
      type="primary"
      size={phone ? "touch" : "lg"}
      icon="plus"
      id="add-batch"
      {...(phone ? { block: true } : {})}
      onClick={() => setChoose(true)}
    >
      Add batch
    </Button>
  );
  return (
    <div className="page">
      <div className="page-head">
        <div className="tt">
          <span className="t-over">{todayLabel()}</span>
          <h1 className="t-display">Batches</h1>
        </div>
        {!phone && addBtn && <div className="row g10">{addBtn}</div>}
      </div>
      <div className="chips scroll" role="group" aria-label="Status">
        <button
          type="button"
          className={cx("chip", !sel.length && "on")}
          aria-pressed={!sel.length}
          onClick={() => setSel([])}
        >
          All{data && <span className="n">{data.counts.all}</span>}
        </button>
        {STAGES.map((s) => (
          <button
            key={s}
            type="button"
            className={cx("chip", sel.includes(s) && "on")}
            aria-pressed={sel.includes(s)}
            id={`bl-chip-${s}`}
            onClick={() => toggle(s)}
          >
            {STATUS_LABEL(s)}
            {data && <span className="n">{data.counts[s]}</span>}
          </button>
        ))}
      </div>
      <div
        className="row g12"
        style={{ alignItems: "flex-end", flexWrap: phone ? "nowrap" : "wrap" }}
      >
        <Search
          id="bl-q"
          label="Search"
          value={q}
          onChange={setQ}
          placeholder={
            phone ? "Search batches" : "Search batch, sample or job order"
          }
          width={phone ? "100%" : 320}
        />
        {desk && (
          <Select
            id="bl-company"
            label="Company"
            value={company}
            onChange={setCompany}
            options={companies.options}
            width={220}
          />
        )}
        {desk && (
          <Select
            id="bl-due"
            label="Deadline"
            value={due}
            onChange={setDue}
            options={DUE}
            width={180}
          />
        )}
        <span className="grow" />
        <Button
          icon="funnel"
          size="lg"
          id="bl-filters"
          onClick={() => setFilters(true)}
        >
          Filters
        </Button>
        {reset && !phone && (
          <Button type="ghost" onClick={clear}>
            Reset
          </Button>
        )}
      </div>
      {list.isLoading ? (
        <Card>
          <Empty icon="files" title="Loading batches" />
        </Card>
      ) : phone ? (
        <div className="col g10">
          {data?.items.map((b) => (
            <div
              key={b.id}
              className="icard bl-card"
              role="link"
              tabIndex={0}
              onClick={() => open(b)}
              onKeyDown={(e) => e.key === "Enter" && open(b)}
            >
              <div className="row between" style={{ alignItems: "flex-start" }}>
                <span className="col" style={{ gap: 0 }}>
                  <b className="t-data-b c-head">{b.batchNo}</b>
                  <span className="t-cap c-mut">{dShort(b.batchDate)}</span>
                </span>
                <Badge
                  label={STATUS_LABEL(b.status)}
                  tone={STATUS_TONE(b.status)}
                  sm
                />
              </div>
              <span
                className="row g8"
                style={{ flexWrap: "nowrap", minWidth: 0 }}
              >
                <span className="t-data c-act nowrap">{b.orderNo}</span>
                <span className="t-cap c-sec ellip">{b.company}</span>
              </span>
              <span className="row g16 t-cap c-sec">
                <span className="row g6">
                  <Icon n="cylinder" />
                  <span className="t-data-sm c-head">
                    {b.arrived} / {b.expected}
                  </span>
                </span>
                <span className={cx("row g6", b.pastDue && "c-err")}>
                  <Icon n="calendar-blank" />
                  {dLong(b.deadlineOn)}
                  {b.pastDue && <b className="w6">Past due</b>}
                </span>
              </span>
            </div>
          ))}
          {!data?.items.length && (
            <Card>
              <Empty
                icon="files"
                title={reset ? "No batches match" : "No batches yet"}
                text={
                  reset
                    ? "Clear the search or pick another filter."
                    : "Batches are added from a job order."
                }
              />
            </Card>
          )}
          {data && <Pager {...pager} compact />}
        </div>
      ) : (
        <Card>
          <Table
            rows={data?.items ?? []}
            keyOf={(b) => b.id}
            onRow={open}
            cols={cols}
            sort={sort}
            onSort={onSort}
            empty={
              <Empty
                icon="files"
                title={reset ? "No batches match" : "No batches yet"}
                text={
                  reset
                    ? "Clear the search or pick another filter."
                    : "Batches are added from a job order."
                }
                action={
                  reset ? (
                    <Button onClick={clear}>Clear filters</Button>
                  ) : (
                    addBtn || undefined
                  )
                }
              />
            }
          />
          {data && <Pager {...pager} />}
        </Card>
      )}
      {phone && addBtn && <div className="sticky-bar">{addBtn}</div>}
      {filters && (
        <Dialog
          title="Filters"
          sub="Narrow the batch list."
          size="lg"
          phone={phone}
          onClose={() => setFilters(false)}
          footer={
            <>
              <Button onClick={clear}>Clear all</Button>
              <Button
                type="primary"
                id="bl-show"
                onClick={() => setFilters(false)}
              >
                Show {data?.total ?? 0}{" "}
                {data?.total === 1 ? "batch" : "batches"}
              </Button>
            </>
          }
        >
          <div className={cx("bl-filters", phone && "stack")}>
            <Select
              label="Company"
              value={company}
              onChange={setCompany}
              options={companies.options}
            />
            <Select
              label="Status"
              value={sel.length === 1 ? sel[0]! : ""}
              onChange={(v) => setSel(v ? [v as Stage] : [])}
              options={[
                ["", "All statuses"],
                ...STAGES.map((s) => [s, STATUS_LABEL(s)] as [string, string]),
              ]}
            />
            <Select
              label="Standard"
              value={std}
              onChange={setStd}
              options={[
                ["", "All standards"],
                ["ASTM", "ASTM"],
                ["ISO", "ISO"],
                ["GBT", "GB/T"],
              ]}
            />
            <Select
              label="Job order"
              value={order}
              onChange={setOrder}
              options={[
                ["", "Any job order"],
                ...(data?.orders ?? []).map(
                  (o) =>
                    [o.orderNo, `${o.orderNo}, ${o.company}`] as [
                      string,
                      string,
                    ],
                ),
              ]}
            />
            <TextField
              label="Batch date from"
              type="date"
              value={from}
              onChange={setFrom}
            />
            <TextField
              label="Batch date to"
              type="date"
              value={to}
              onChange={setTo}
            />
            <TextField
              label="Deadline from"
              type="date"
              value={dFrom}
              onChange={setDFrom}
            />
            <TextField
              label="Deadline to"
              type="date"
              value={dTo}
              onChange={setDTo}
            />
          </div>
        </Dialog>
      )}
      {choose && (
        <ChooseOrder
          phone={phone}
          onClose={() => setChoose(false)}
          onChosen={(no) => {
            setChoose(false);
            setAdding(no);
          }}
        />
      )}
      {adding && (
        <AddBatch
          orderNo={adding}
          phone={phone}
          onClose={() => setAdding(null)}
          onDone={(no) => nav(`/batches/${no}/reception`)}
        />
      )}
    </div>
  );
}
