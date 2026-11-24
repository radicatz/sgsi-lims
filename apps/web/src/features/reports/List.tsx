// Reports list (FigCraft 07-Reports-01 Reports_list; spec S-28): CoAs and signed RoAs, tabs only for the roles that see both, search, period, company, status chips,
// sortable columns, 10 rows a page from the server, several files as one zip, cards on the phone. The CSO sees CoAs only and has no Draft chip; the Analyst sees RoAs only.
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { api, apiBlob, ApiError } from "../../app/api";
import { useBreakpoint } from "../../app/session";
import {
  Avatar,
  Badge,
  Button,
  Card,
  Check,
  Dialog,
  Empty,
  Icon,
  Pager,
  Search,
  Select,
  Table,
  Tabs,
  cx,
  fmtDate,
  toast,
  useSort,
  type Col,
  type Tone,
} from "../../components";
import { useCompanyOptions } from "../master-data/shared";

type Kind = "coa" | "roa";
interface CoaRow {
  id: string;
  number: string | null;
  revision: number;
  orderNo: string;
  company: string;
  status: string;
  publishedAt: string | null;
  signatory: string | null;
  lastSent: string | null;
  lastChannels: string[];
}
interface RoaRow {
  id: string;
  roaNo: string;
  batchNo: string;
  orderNo: string;
  company: string;
  uploadedAt: string;
  uploadedBy: string | null;
}
interface Data {
  kind: Kind;
  size: number;
  page: number;
  total: number;
  rows: Array<CoaRow & RoaRow>;
  counts: Record<string, number>;
  tabs: { coa: boolean; roa: boolean };
  canDraft: boolean;
}

const STATUS: Record<string, [string, Tone]> = {
  draft: ["Draft", "grey"],
  awaiting_signature: ["Awaiting signature", "amber"],
  published: ["Published", "purple"],
  sent: ["Sent", "green"],
  superseded: ["Superseded", "red"],
  void: ["Void", "muted"],
};
const PERIOD: Array<[string, string]> = [
  ["30", "Last 30 days"],
  ["90", "Last 90 days"],
  ["365", "Last year"],
  ["all", "All time"],
];
const CHANNEL_ICON: Record<string, string> = {
  "Hard copy": "printer",
  Email: "envelope-simple",
  WhatsApp: "whatsapp-logo",
  Other: "dots-three",
};
const SORT_KEY: Record<string, string> = {
  Number: "number",
  "Job order": "order",
  Client: "client",
  Status: "status",
  Published: "published",
  Signatory: "signatory",
  Sent: "sent",
  "RoA number": "roa",
  Batch: "batch",
  Uploaded: "uploaded",
  "Uploaded by": "by",
};
/** "Ir. Bambang Sutrisno, M.T." becomes "Bambang S." */
export const shortName = (n: string | null) => {
  if (!n) return "";
  const w = n
    .split(",")[0]!
    .replace(/^(Ir|Dr|Drs|Prof|H|Hj)\.?\s+/i, "")
    .trim()
    .split(/\s+/);
  return w.length > 1 ? `${w[0]} ${w[1]![0]}.` : (w[0] ?? "");
};

async function saveBlob(path: string, name: string) {
  const b = await apiBlob(path),
    u = URL.createObjectURL(b),
    a = document.createElement("a");
  a.href = u;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(u), 2000);
}

export function Reports() {
  const bp = useBreakpoint(),
    phone = bp === "phone",
    nav = useNavigate();
  const [kind, setKind] = useState<Kind>("coa"),
    [q, setQ] = useState(""),
    [dq, setDq] = useState(""),
    [period, setPeriod] = useState("90"),
    [company, setCompany] = useState(""),
    [status, setStatus] = useState<string[]>([]);
  const [page, setPage] = useState(1),
    [picked, setPicked] = useState<string[]>([]),
    [filters, setFilters] = useState(false),
    [busy, setBusy] = useState(false);
  const { sort, onSort } = useSort();
  useEffect(() => {
    const t = setTimeout(() => setDq(q), 250);
    return () => clearTimeout(t);
  }, [q]);
  useEffect(() => {
    setPage(1);
    setPicked([]);
  }, [kind, dq, period, company, status, sort]);
  const companies = useCompanyOptions("All companies");
  const params = new URLSearchParams({
    kind,
    period,
    page: String(page),
    ...(dq ? { q: dq } : {}),
    ...(company ? { company } : {}),
    ...(status.length && kind === "coa" ? { status: status.join(",") } : {}),
    ...(sort ? { sort: SORT_KEY[sort.h] ?? "published", dir: sort.dir } : {}),
  });
  const list = useQuery({
    queryKey: ["reports", params.toString()],
    queryFn: () => api<Data>(`/reports?${params}`),
    placeholderData: (p) => p,
    retry: false,
  });
  const d = list.data;
  // a role that sees only one kind opens on it
  useEffect(() => {
    if (d && !d.tabs[kind] && d.tabs[kind === "coa" ? "roa" : "coa"])
      setKind(kind === "coa" ? "roa" : "coa");
  }, [d, kind]);
  useEffect(() => {
    if (list.error && (list.error as ApiError).status === 403)
      setKind((k) => (k === "coa" ? "roa" : "coa"));
  }, [list.error]);
  const both = !!d?.tabs.coa && !!d?.tabs.roa,
    rows = d?.rows ?? [];
  const pages = d ? Math.max(1, Math.ceil(d.total / d.size)) : 1;
  const pager = {
    page,
    pages,
    total: d?.total ?? 0,
    from: d?.total ? (page - 1) * 10 + 1 : 0,
    to: Math.min(page * 10, d?.total ?? 0),
    onPage: setPage,
  };
  const reset = !!(q || company || status.length || period !== "90");
  const clear = () => {
    setQ("");
    setCompany("");
    setStatus([]);
    setPeriod("90");
  };
  const open = (r: CoaRow & RoaRow) =>
    nav(kind === "coa" ? `/reports/coa/${r.id}` : `/reports/roa/${r.batchNo}`);
  const toggle = (id: string) =>
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  const downloadable = (r: CoaRow & RoaRow) =>
    kind === "roa" ||
    ["published", "sent", "superseded", "void"].includes(r.status);
  const one = async (r: CoaRow & RoaRow) => {
    try {
      if (kind === "coa")
        await saveBlob(`/reports/coa/${r.id}/pdf`, `${r.number}.pdf`);
      else {
        const x = await api<{ url: string }>(`/batches/${r.batchNo}/roa/file`);
        window.open(x.url, "_blank", "noopener");
      }
    } catch (e) {
      toast((e as ApiError).message, "error");
    }
  };
  const zip = async () => {
    setBusy(true);
    try {
      const token = (
        JSON.parse(localStorage.getItem("sgsi.session") ?? "null") as {
          accessToken?: string;
        } | null
      )?.accessToken;
      const res = await fetch("/api/reports/download", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...(token ? { authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ kind, ids: picked }),
      });
      if (!res.ok)
        throw new ApiError(
          res.status,
          "error",
          undefined,
          ((await res.json().catch(() => ({}))) as { text?: string }).text ??
            "The files could not be downloaded.",
        );
      const b = await res.blob(),
        u = URL.createObjectURL(b),
        a = document.createElement("a");
      a.href = u;
      a.download = `${kind === "coa" ? "CoAs" : "RoAs"}.zip`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(u), 2000);
      toast(
        `${picked.length} ${picked.length === 1 ? "file" : "files"} downloaded`,
      );
      setPicked([]);
    } catch (e) {
      toast((e as ApiError).message, "error");
    } finally {
      setBusy(false);
    }
  };

  const pickCol = (rs: Array<CoaRow & RoaRow>): Col<CoaRow & RoaRow> => ({
    h: "",
    w: 40,
    // a draft or a CoA awaiting signature has no file yet, so it can't be picked for the zip (owner, Nov 23)
    render: (r) => (
      <span onClick={(e) => e.stopPropagation()}>
        <Check
          on={picked.includes(r.id)}
          onChange={() => toggle(r.id)}
          label=""
          id={`rp-pick-${r.id}`}
          disabled={!downloadable(r)}
          title={downloadable(r) ? "Select" : "No PDF until it is signed"}
        />
      </span>
    ),
    ...(rs.length ? {} : {}),
  });
  const actionCol: Col<CoaRow & RoaRow> = {
    h: "",
    w: 48,
    cls: "r",
    render: (r) =>
      downloadable(r) ? (
        <span onClick={(e) => e.stopPropagation()}>
          <Button
            iconOnly
            size="sm"
            icon="download-simple"
            label="Download"
            onClick={() => one(r)}
          />
        </span>
      ) : null,
  };
  const client = (r: CoaRow & RoaRow) => (
    <span className="row g8" style={{ flexWrap: "nowrap", minWidth: 0 }}>
      <Avatar name={r.company} size={32} />
      <span className="t-sm">{r.company}</span>
    </span>
  );
  const desk = bp === "desktop";
  const numberCell = (r: CoaRow & RoaRow) => (
    <span className="col" style={{ gap: 0, minWidth: 0 }}>
      {r.number ? (
        <b className="t-data-b c-head">{r.number}</b>
      ) : (
        <span className="t-data c-mut">Draft, no number</span>
      )}
      <span className="t-cap c-sec ellip">{r.company}</span>
    </span>
  );
  const coaCols: Array<Col<CoaRow & RoaRow> | false> = [
    pickCol(rows),
    desk
      ? {
          h: "Number",
          sort: () => 0,
          w: 190,
          render: (r) =>
            r.number ? (
              <b className="t-data-b c-head">{r.number}</b>
            ) : (
              <span className="c-mut">Draft, no number</span>
            ),
        }
      : { h: "Number", sort: () => 0, fill: true, render: numberCell },
    desk && {
      h: "Job order",
      sort: () => 0,
      w: 130,
      render: (r) => <span className="t-data c-act">{r.orderNo}</span>,
    },
    desk && { h: "Client", sort: () => 0, fill: true, render: client },
    {
      h: "Status",
      sort: () => 0,
      fit: true,
      render: (r) => (
        <Badge
          sm
          label={STATUS[r.status]?.[0] ?? r.status}
          tone={STATUS[r.status]?.[1] ?? "grey"}
        />
      ),
    },
    {
      h: "Published",
      sort: () => 0,
      fit: true,
      render: (r) =>
        r.publishedAt ? (
          <span className="t-sm">{fmtDate(r.publishedAt)}</span>
        ) : (
          <span className="c-mut">—</span>
        ),
    },
    desk && {
      h: "Signatory",
      sort: () => 0,
      fit: true,
      render: (r) =>
        r.signatory ? (
          <span className="t-sm">{shortName(r.signatory)}</span>
        ) : (
          <span className="c-mut">—</span>
        ),
    },
    desk && {
      h: "Sent",
      sort: () => 0,
      fit: true,
      render: (r) =>
        r.lastSent ? (
          <span className="row g6 t-sm" style={{ flexWrap: "nowrap" }}>
            <Icon
              n={CHANNEL_ICON[r.lastChannels[0] ?? ""] ?? "paper-plane-tilt"}
            />
            {fmtDate(r.lastSent)}
          </span>
        ) : (
          <span className="c-mut">—</span>
        ),
    },
    actionCol,
  ];
  const roaNumberCell = (r: CoaRow & RoaRow) => (
    <span className="col" style={{ gap: 0, minWidth: 0 }}>
      <b className="t-data-b c-head">{r.roaNo}</b>
      <span className="t-cap c-sec ellip">{r.company}</span>
    </span>
  );
  const roaCols: Array<Col<CoaRow & RoaRow> | false> = [
    pickCol(rows),
    desk
      ? {
          h: "RoA number",
          sort: () => 0,
          w: 150,
          render: (r) => <b className="t-data-b c-head">{r.roaNo}</b>,
        }
      : { h: "RoA number", sort: () => 0, fill: true, render: roaNumberCell },
    {
      h: "Batch",
      sort: () => 0,
      w: 140,
      render: (r) => <span className="t-data c-act">{r.batchNo}</span>,
    },
    desk && {
      h: "Job order",
      w: 140,
      render: (r) => <span className="t-data c-act">{r.orderNo}</span>,
    },
    desk && { h: "Client", sort: () => 0, fill: true, render: client },
    {
      h: "Uploaded",
      sort: () => 0,
      fit: true,
      render: (r) => <span className="t-sm">{fmtDate(r.uploadedAt)}</span>,
    },
    desk && {
      h: "Uploaded by",
      sort: () => 0,
      fit: true,
      render: (r) => <span className="t-sm">{r.uploadedBy ?? "—"}</span>,
    },
    actionCol,
  ];
  const chips: Array<[string, string]> = [
    ["draft", "Draft"],
    ["awaiting_signature", "Awaiting signature"],
    ["published", "Published"],
    ["sent", "Sent"],
    ["superseded", "Superseded"],
    ["void", "Void"],
  ];
  const shown = chips.filter(([s]) =>
    s === "draft"
      ? d?.canDraft
      : s === "awaiting_signature"
        ? d?.canDraft || (d?.counts[s] ?? 0) > 0
        : s === "void"
          ? (d?.counts[s] ?? 0) > 0
          : true,
  );
  const empty = !d ? (
    <Empty icon="certificate" title="Loading reports" />
  ) : (
    <Empty
      icon="certificate"
      title={
        reset
          ? "No reports match"
          : kind === "coa"
            ? "No CoAs yet"
            : "No signed RoAs yet"
      }
      text={
        reset
          ? "Try other words or clear the filters."
          : kind === "coa"
            ? "A CoA appears here once a job order's batches are completed and the lab starts one."
            : "A signed RoA appears here when a batch is completed."
      }
      action={
        reset ? <Button onClick={clear}>Clear filters</Button> : undefined
      }
    />
  );
  const chipRow = kind === "coa" && (
    <div className="chips scroll" role="group" aria-label="Status">
      <button
        type="button"
        className={cx("chip", !status.length && "on")}
        aria-pressed={!status.length}
        onClick={() => setStatus([])}
      >
        All{d && <span className="n">{d.counts.all ?? 0}</span>}
      </button>
      {shown.map(([s, l]) => (
        <button
          key={s}
          type="button"
          id={`rp-chip-${s}`}
          className={cx("chip", status.includes(s) && "on")}
          aria-pressed={status.includes(s)}
          onClick={() =>
            setStatus((x) =>
              x.includes(s) ? x.filter((y) => y !== s) : [...x, s],
            )
          }
        >
          {l}
          {d && <span className="n">{d.counts[s] ?? 0}</span>}
        </button>
      ))}
    </div>
  );
  const filtersBtn = (
    <Button
      icon="funnel"
      size="lg"
      id="rp-filters"
      onClick={() => setFilters(true)}
    >
      Filters
    </Button>
  );

  return (
    <div className="page">
      <div className="page-head">
        <div className="tt">
          <span className="t-over">REPORTS</span>
          <h1 className="t-display">Reports</h1>
        </div>
      </div>
      {both && (
        <Tabs
          items={[
            {
              id: "coa" as Kind,
              label: "CoA",
              ...(d ? { count: d.counts.all ?? 0 } : {}),
            },
            {
              id: "roa" as Kind,
              label: "RoA",
              ...(d ? { count: d.counts.roa ?? 0 } : {}),
            },
          ]}
          value={kind}
          onChange={setKind}
        />
      )}
      {phone ? (
        /* phone (frame Phone-07-Reports-01-Reports_list-01-CoA_tab): no card around the list; the search and the status chips sit on the page (owner, Nov 23) */
        <>
          {/* the Filters button beside the search, lg like Batches and Job orders (owner, Nov 24) */}
          <div className="row g12" style={{ alignItems: "flex-end", flexWrap: "nowrap" }}>
            <Search
              id="rp-q"
              label="Search"
              value={q}
              onChange={setQ}
              placeholder="Search reports"
              width="100%"
            />
            {filtersBtn}
          </div>
          {chipRow}
          <div className="col g12" id="rp-cards">
            {rows.map((r) => (
              <button
                key={r.id}
                type="button"
                className="card-row"
                id={`rp-card-${r.id}`}
                onClick={() => open(r)}
                style={{
                  textAlign: "left",
                  border: "1px solid var(--surface-border)",
                  borderRadius: 16,
                  padding: 16,
                  background: "var(--surface-card)",
                }}
              >
                <span className="col g8">
                  <span className="row between" style={{ flexWrap: "nowrap" }}>
                    {kind === "coa" ? (
                      r.number ? (
                        <b className="t-data-b c-head">{r.number}</b>
                      ) : (
                        <span className="t-data c-mut">Draft, no number</span>
                      )
                    ) : (
                      <b className="t-data-b c-head">{r.roaNo}</b>
                    )}
                    {kind === "coa" && (
                      <Badge
                        sm
                        label={STATUS[r.status]?.[0] ?? r.status}
                        tone={STATUS[r.status]?.[1] ?? "grey"}
                      />
                    )}
                  </span>
                  {client(r)}
                  <span
                    className="row between t-sm"
                    style={{ flexWrap: "nowrap" }}
                  >
                    <span className="t-data c-act">
                      {kind === "coa" ? r.orderNo : r.batchNo}
                    </span>
                    {kind === "coa" ? (
                      <span className="row g12" style={{ flexWrap: "nowrap" }}>
                        {r.publishedAt && (
                          <span className="c-sec">
                            {fmtDate(r.publishedAt)}
                          </span>
                        )}
                        {r.lastSent && (
                          <span className="row g6 c-sec">
                            <Icon
                              n={
                                CHANNEL_ICON[r.lastChannels[0] ?? ""] ??
                                "paper-plane-tilt"
                              }
                            />
                            {fmtDate(r.lastSent)}
                          </span>
                        )}
                      </span>
                    ) : (
                      <span className="c-sec">{fmtDate(r.uploadedAt)}</span>
                    )}
                  </span>
                </span>
              </button>
            ))}
            {!rows.length && <Card>{empty}</Card>}
          </div>
          {d && d.total > 0 && <Pager {...pager} />}
        </>
      ) : (
        /* desktop and tablet (frame Desktop-07-Reports-01-Reports_list-01-CoA_tab_ref, owner Nov 24): Search, Period and Company and the status
           chips sit on the page; the card holds the table and the pager only */
        <>
          <div className="row g12 wrap" style={{ alignItems: "flex-end" }}>
              <Search
                id="rp-q"
                label="Search"
                value={q}
                onChange={setQ}
                placeholder={
                  kind === "coa"
                    ? "Search number, job order, client"
                    : "Search RoA number, batch, job order, client"
                }
                width={360}
              />
              <Select
                id="rp-period"
                label="Period"
                value={period}
                onChange={setPeriod}
                options={PERIOD}
                width={190}
              />
              <Select
                id="rp-company"
                label="Company"
                value={company}
                onChange={setCompany}
                options={companies.options}
                width={220}
              />
          </div>
          {chipRow}
          <Card>
            <Table
              cols={kind === "coa" ? coaCols : roaCols}
              rows={rows}
              keyOf={(r) => r.id}
              onRow={open}
              empty={empty}
              sort={sort}
              onSort={onSort}
            />
            {d && d.total > 0 && <Pager {...pager} />}
          </Card>
        </>
      )}
      {picked.length > 0 && !phone && (
        <div
          className="sticky-bar"
          id="rp-bar"
          style={{
            position: "sticky",
            bottom: 0,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span className="t-sm c-sec">{picked.length} selected</span>
          <span className="row g8">
            <Button onClick={() => setPicked([])}>Clear</Button>
            <Button type="primary" id="rp-zip" disabled={busy} onClick={zip}>
              Download PDFs
            </Button>
          </span>
        </div>
      )}
      {filters && (
        <Dialog
          title="Filters"
          size="sm"
          phone
          onClose={() => setFilters(false)}
          footer={
            <>
              <Button
                onClick={() => {
                  clear();
                  setFilters(false);
                }}
              >
                Clear all
              </Button>
              <Button type="primary" onClick={() => setFilters(false)}>
                Apply
              </Button>
            </>
          }
        >
          <div className="col g12">
            <Select
              label="Period"
              value={period}
              onChange={setPeriod}
              options={PERIOD}
            />
            <Select
              label="Company"
              value={company}
              onChange={setCompany}
              options={companies.options}
            />
            {/* status is filtered with the chips on the page (owner, Nov 23), so the sheet has no Status field */}
          </div>
        </Dialog>
      )}
    </div>
  );
}
