// Job orders list (FigCraft 03-Job_orders-01-Job_orders_list): status chips with counts, search, company, CSO and due date filters, 25 rows a
// page from the server; cards on the phone. The row menu opens, edits and cancels. New job order opens the form over the list.
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
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
  Menu,
  Pager,
  Search,
  Select,
  Table,
  Tag,
  useSort,
  type Col,
} from "../../components";
import { useCompanyOptions } from "../master-data/shared";
import { CancelDialog } from "./Detail";
import { OrderForm } from "./OrderForm";
import {
  STD_LABEL,
  useCatalogue,
  STATUSES,
  STATUS_LABEL,
  STATUS_TONE,
  coaLabel,
  pastDue,
  shortDay,
  shortDate,
  todayIso,
  type OrderList,
  type OrderRow,
  type OrderStatus,
} from "./shared";

type Chip = "all" | OrderStatus;
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
  "No.": "no",
  Client: "client",
  Company: "client",
  Service: "service",
  Samples: "samples",
  Batches: "batches",
  Due: "due",
  Status: "status",
  CoA: "coa",
};
const LONG_DAY = () =>
  new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Makassar",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  })
    .format(new Date())
    .toUpperCase();

export function Orders() {
  const { me } = useSession(),
    bp = useBreakpoint(),
    phone = bp === "phone",
    nav = useNavigate();
  const can = (p: string) => !!me?.permissions.includes(p);
  useCatalogue(can("order.create")); // load the form data now, so New job order opens at once
  const [sp, setSp] = useSearchParams();
  const creating = sp.has("new");
  const [q, setQ] = useState(""),
    [dq, setDq] = useState(""),
    [chip, setChip] = useState<Chip>("all"),
    [company, setCompany] = useState(""),
    [cso, setCso] = useState(""),
    [due, setDue] = useState(""),
    [page, setPage] = useState(1);
  const { sort, onSort } = useSort(); // a sortable head sorts the whole list on the server
  const [cancel, setCancel] = useState<OrderRow | null>(null),
    [sheet, setSheet] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setDq(q), 250);
    return () => clearTimeout(t);
  }, [q]);
  useEffect(() => setPage(1), [dq, chip, company, cso, due, sort]);
  const companies = useCompanyOptions("All companies");
  const params = new URLSearchParams({
    page: String(page),
    size: "25",
    ...(dq ? { q: dq } : {}),
    ...(chip !== "all" ? { status: chip } : {}),
    ...(company ? { company } : {}),
    ...(cso ? { cso } : {}),
    ...dueRange(due),
    ...(sort ? { sort: SORT_KEY[sort.h] ?? "no", dir: sort.dir } : {}),
  });
  const list = useQuery({
    queryKey: ["orders", params.toString()],
    queryFn: () =>
      api<OrderList & { csos: Array<{ id: string; name: string }> }>(
        `/orders?${params}`,
      ),
    placeholderData: (prev) => prev,
  });
  const data = list.data,
    csos = [
      ["", "All CSOs"] as [string, string],
      ...(data?.csos ?? []).map((c) => [c.id, c.name] as [string, string]),
    ];
  const pages = data ? Math.max(1, Math.ceil(data.total / data.size)) : 1;
  const pager = {
    page,
    pages,
    total: data?.total ?? 0,
    from: data?.total ? (page - 1) * 25 + 1 : 0,
    to: Math.min(page * 25, data?.total ?? 0),
    onPage: setPage,
  };
  const reset = q || chip !== "all" || company || cso || due;
  const open = (o: OrderRow) => nav(`/orders/${o.orderNo}`);
  const menu = (o: OrderRow) => (
    <Menu
      quiet
      label={`More for ${o.orderNo}`}
      vertical
      items={[
        { label: "Open", icon: "arrow-square-out", onClick: () => open(o) },
        can("order.edit") &&
          !["cancelled", "closed"].includes(o.status) && {
            label: "Edit",
            icon: "pencil-simple",
            onClick: () => nav(`/orders/${o.orderNo}?edit`),
          },
        can("order.cancel") &&
          !["cancelled", "closed"].includes(o.status) && {
            label: "Cancel",
            icon: "x-circle",
            danger: true,
            disabled: o.received > 0,
            why: "A sample has been received, so it can't be cancelled.",
            onClick: () => setCancel(o),
          },
      ]}
    />
  );
  const desk = bp === "desktop";
  // Desktop-03 (01 Default): No., Client, Service, Samples, Batches, Due, Status, CoA, menu. Tablet-03: No., Company with samples and service under it, Due, Status, CoA.
  const cols: Array<Col<OrderRow> | false> = [
    {
      h: "No.",
      sort: () => 0,
      w: desk ? 140 : 120,
      render: (o) => <b className="t-data-b c-brand">{o.orderNo}</b>,
    },
    {
      h: desk ? "Client" : "Company",
      sort: () => 0,
      render: (o) => (
        <span className="col" style={{ gap: 0, minWidth: 0 }}>
          <b className="t-sm w6 ellip">{o.company}</b>
          {!desk && (
            <span className="row g8 t-cap c-sec" style={{ minWidth: 0 }}>
              <span className="nowrap">
                {o.expected} {o.expected === 1 ? "sample" : "samples"}
              </span>
              <span className="ellip">{o.service ?? "Custom"}</span>
            </span>
          )}
        </span>
      ),
    },
    desk && {
      h: "Service",
      sort: () => 0,
      render: (o) => (
        <span className="t-sm c-sec">{o.service ?? "Custom"}</span>
      ),
    },
    desk && {
      h: "Samples",
      sort: () => 0,
      cls: "r",
      fit: true,
      render: (o) => (
        <span className="t-data-sm c-mut">
          {o.received} / {o.expected}
        </span>
      ),
    },
    desk && {
      h: "Batches",
      sort: () => 0,
      cls: "r",
      fit: true,
      render: (o) => (
        <span className="t-data-sm c-mut">
          {o.batchesDone} / {o.batches}
        </span>
      ),
    },
    desk && {
      h: "Due",
      sort: () => 0,
      fit: true,
      render: (o) => (
        <span className={pastDue(o) ? "c-err t-sm" : "t-sm"}>
          {shortDate(o.dueOn)}
        </span>
      ),
    },
    {
      h: "Status",
      sort: () => 0,
      fit: true,
      render: (o) => (
        <Badge label={STATUS_LABEL[o.status]} tone={STATUS_TONE[o.status]} sm />
      ),
    },
    {
      h: "CoA",
      sort: () => 0,
      fit: true,
      render: (o) => (
        <Tag
          label={coaLabel(o.coa)}
          tone={o.coa === "issued" ? "green" : "grey"}
          icon={o.coa ? "check-circle" : "file"}
        />
      ),
    },
    desk && { h: "", cls: "r", w: 48, render: menu },
  ];
  const filters = (
    <>
      <Search
        id="jo-q"
        label="Search"
        value={q}
        onChange={setQ}
        placeholder="Search no., company, PO…"
        width={phone ? "100%" : 320}
      />
      {!phone && (
        <>
          <Select
            id="jo-f-company"
            label="Company"
            value={company}
            onChange={setCompany}
            options={companies.options}
            width={220}
          />
          <Select
            id="jo-f-cso"
            label="CSO"
            value={cso}
            onChange={setCso}
            options={csos}
            width={200}
          />
          <Select
            id="jo-f-due"
            label="Due date"
            value={due}
            onChange={setDue}
            options={DUE}
            width={180}
          />
        </>
      )}
    </>
  );
  return (
    <div className="page">
      <div className="page-head">
        <div className="tt">
          <span className="t-over">
            {bp === "desktop" ? LONG_DAY() : "JOB ORDERS"}
          </span>
          <h1 className="t-display">Job orders</h1>
        </div>
        {!phone && can("order.create") && (
          <div className="row g10">
            <Button
              type="primary"
              size="lg"
              icon="plus"
              id="new-order"
              onClick={() => setSp({ new: "" })}
            >
              New job order
            </Button>
          </div>
        )}
      </div>
      <Chips
        scroll
        value={chip}
        onChange={setChip}
        items={[
          { id: "all" as Chip, label: "All", count: data?.counts.all },
          ...STATUSES.map((s) => ({
            id: s as Chip,
            label: STATUS_LABEL[s],
            count: data?.counts[s],
          })),
        ]}
      />
      <div
        className="row g12 wrap"
        style={{ alignItems: "flex-end", flexWrap: phone ? "nowrap" : "wrap" }}
      >
        {filters}
        {phone && (
          // the same labelled lg Filters button as Batches, level with the 40 px search (owner, Nov 24)
          <Button
            icon="funnel"
            size="lg"
            id="jo-filters"
            onClick={() => setSheet(true)}
          >
            Filters
          </Button>
        )}
        {reset && !phone ? (
          <Button
            type="ghost"
            onClick={() => {
              setQ("");
              setChip("all");
              setCompany("");
              setCso("");
              setDue("");
            }}
          >
            Reset
          </Button>
        ) : null}
      </div>
      {list.isLoading ? (
        <Card>
          <Empty icon="clipboard-text" title="Loading job orders" />
        </Card>
      ) : phone ? (
        <div className="col g10">
          {data?.items.map((o) => (
            <div
              key={o.id}
              className="icard orders-card"
              role="link"
              tabIndex={0}
              onClick={() => open(o)}
              onKeyDown={(e) => e.key === "Enter" && open(o)}
            >
              <div className="row between">
                <b className="t-data-b c-brand">{o.orderNo}</b>
                <Badge
                  label={STATUS_LABEL[o.status]}
                  tone={STATUS_TONE[o.status]}
                  sm
                />
              </div>
              <b className="t-sm w6">{o.company}</b>
              <span className="row g8" style={{ flexWrap: "wrap" }}>
                <span className="t-cap c-sec">{o.service ?? "Custom"}</span>
                <span className="row g4" style={{ flexWrap: "nowrap" }}>
                  {o.standards.map((s) => (
                    <Tag key={s} label={STD_LABEL[s]} />
                  ))}
                </span>
              </span>
              <div className="row between t-cap">
                <span className="c-sec">
                  Batches {o.batchesDone} / {o.batches}
                </span>
                <span className={pastDue(o) ? "c-err" : "c-sec"}>
                  Due {shortDay(o.dueOn)}
                </span>
              </div>
              <div className="row g8" style={{ alignItems: "center" }}>
                <span className="progress grow">
                  <i
                    style={{
                      width: `${o.expected ? Math.min(100, (o.received / o.expected) * 100) : 0}%`,
                    }}
                  />
                </span>
                <span className="t-data-sm c-sec">
                  {o.received}/{o.expected}
                </span>
              </div>
              <div className="row between c-mut">
                <span>
                  RoA {o.batchesDone} / {o.batches}
                </span>
                <span>CoA {o.coa === "issued" ? "Published" : "—"}</span>
              </div>
            </div>
          ))}
          {!data?.items.length && (
            <Card>
              <Empty
                icon="clipboard-text"
                title={reset ? "No job orders match" : "No job orders yet"}
                text={
                  reset
                    ? "Clear the search or pick another filter."
                    : "Create the first job order to start."
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
            keyOf={(o) => o.id}
            onRow={open}
            cols={cols}
            sort={sort}
            onSort={onSort}
            empty={
              <Empty
                icon="clipboard-text"
                title={reset ? "No job orders match" : "No job orders yet"}
                text={
                  reset
                    ? "Clear the search or pick another filter."
                    : "Create the first job order, and the lab starts from it."
                }
                action={
                  !reset && can("order.create") ? (
                    <Button
                      type="primary"
                      icon="plus"
                      onClick={() => setSp({ new: "" })}
                    >
                      New job order
                    </Button>
                  ) : undefined
                }
              />
            }
          />
          {data && <Pager {...pager} />}
        </Card>
      )}
      {phone && can("order.create") && (
        <div className="sticky-bar">
          <Button
            type="primary"
            size="touch"
            icon="plus"
            block
            id="new-order"
            onClick={() => setSp({ new: "" })}
          >
            New job order
          </Button>
        </div>
      )}
      {sheet && (
        <Dialog
          title="Filters"
          phone
          onClose={() => setSheet(false)}
          footer={
            <>
              <Button
                onClick={() => {
                  setCompany("");
                  setCso("");
                  setDue("");
                }}
              >
                Clear
              </Button>
              <Button type="primary" onClick={() => setSheet(false)}>
                Show results
              </Button>
            </>
          }
        >
          <Select
            label="Company"
            value={company}
            onChange={setCompany}
            options={companies.options}
          />
          <Select label="CSO" value={cso} onChange={setCso} options={csos} />
          <Select
            label="Due date"
            value={due}
            onChange={setDue}
            options={DUE}
          />
        </Dialog>
      )}
      {creating && can("order.create") && (
        <OrderForm detail={null} phone={phone} onClose={() => setSp({})} />
      )}
      {cancel && (
        <CancelDialog
          orderNo={cancel.orderNo}
          onClose={() => setCancel(null)}
        />
      )}
    </div>
  );
}
