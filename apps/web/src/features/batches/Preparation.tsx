// The Preparation tab (FigCraft 04-Batches-02-Batch_detail 10 Preparation_entering_ADL, 11 Preparation_finished; spec S-18): the air-dried loss (ADL) of
// each received sample. Save all, then Finish Preparation when the checklist allows. Desktop: a table; tablet: fewer columns; phone: a card per sample.
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useBlocker } from "react-router";
import { api, ApiError } from "../../app/api";
import { useSession } from "../../app/session";
import {
  Avatar,
  Badge,
  Button,
  Card,
  Confirm,
  Empty,
  Icon,
  Table,
  Tag,
  toast,
  type Col,
} from "../../components";
import { Checklist, LockedValue, ValueField, type CellState } from "./Cells";
import { dShort, dTime, type BatchPageData } from "./shared";

interface Item {
  id: string;
  rowNo: number;
  clientRef: string;
  sampleCode: string | null;
  sampleNo: string | null;
  held: string | null;
  value: string | null;
  enteredBy: string | null;
  enteredAt: string | null;
}
interface Prep {
  hidden: boolean;
  open: boolean;
  status: string;
  tmOrdered: boolean;
  saved: number;
  total: number;
  decimals?: number;
  unit?: string;
  range?: { low: number | null; high: number | null; severity: string } | null;
  ready?: boolean;
  canFinish?: boolean;
  checks?: Array<{ ok: boolean; text: string; warn: boolean }>;
  items?: Item[];
}

export function PreparationTab({
  b,
  phone,
  tablet,
}: {
  b: BatchPageData;
  phone: boolean;
  tablet: boolean;
}) {
  const { me } = useSession(),
    qc = useQueryClient();
  const can = (p: string) => !!me?.permissions.includes(p);
  const q = useQuery({
    queryKey: ["adl", b.batchNo],
    queryFn: () => api<Prep>(`/batches/${b.batchNo}/adl`),
  });
  const [edits, setEdits] = useState<Record<string, string>>({}),
    [busy, setBusy] = useState(false),
    [ask, setAsk] = useState(false),
    [bad, setBad] = useState<string | null>(null);
  const d = q.data,
    items = d?.items ?? [];
  const dirty = Object.keys(edits).length;
  // resolves when the refetches are back (see Analysis.tsx: a save keeps the typed values until the saved ones replace them)
  const refresh = () =>
    Promise.all(
      ["adl", "batch", "batches", "order-batches"].map((k) =>
        qc.invalidateQueries({ queryKey: [k] }),
      ),
    );
  // unsaved values: ask before leaving the tab or the page
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      dirty > 0 && currentLocation.pathname !== nextLocation.pathname,
  );

  const warnOf = (v: string) => {
    const n = Number(v.replace(",", "."));
    return (
      !!d?.range &&
      v.trim() !== "" &&
      Number.isFinite(n) &&
      ((d.range.high != null && n > d.range.high) ||
        (d.range.low != null && n < d.range.low))
    );
  };
  const stateOf = (it: Item): CellState => {
    const e = edits[it.id];
    if (bad === it.id) return "err";
    if (e !== undefined) return warnOf(e) ? "warn" : "dirty";
    return it.value != null && warnOf(it.value) ? "warn" : "saved";
  };
  const shown = (it: Item) =>
    edits[it.id] ??
    (it.value != null ? Number(it.value).toFixed(d?.decimals ?? 2) : "");
  const setEdit = (it: Item, v: string) => {
    setBad(null);
    setEdits((e) => {
      const n = { ...e },
        base =
          it.value != null ? Number(it.value).toFixed(d?.decimals ?? 2) : "";
      if (v.trim() === base) delete n[it.id];
      else n[it.id] = v;
      return n;
    });
  };
  const live = items.filter((x) => !x.held);
  const saveAll = async () => {
    if (!dirty) return true;
    setBusy(true);
    try {
      await api(`/batches/${b.batchNo}/adl`, {
        method: "PUT",
        json: {
          values: Object.entries(edits).map(([sampleId, value]) => ({
            sampleId,
            value: value.trim() === "" ? null : value,
          })),
        },
      });
      await refresh().catch(() => undefined);
      setEdits({});
      toast("ADL saved");
      return true;
    } catch (e) {
      const err = e as ApiError,
        i = Number(err.field?.split(".")[1]),
        id = Object.keys(edits)[i];
      if (id) setBad(id);
      toast(err.message, "error");
      return false;
    } finally {
      setBusy(false);
    }
  };
  const finish = async () => {
    setBusy(true);
    try {
      if (dirty && !(await saveAll())) return;
      await api(`/batches/${b.batchNo}/finish-prep`, { method: "POST" });
      toast("Preparation finished");
      setAsk(false);
      refresh();
    } catch (e) {
      toast((e as ApiError).message, "error");
      refresh();
    } finally {
      setBusy(false);
    }
  };

  const counted = useMemo(
    () =>
      d
        ? dirty
          ? live.filter(
              (x) => (edits[x.id] ?? x.value ?? "").toString().trim() !== "",
            ).length
          : d.saved
        : 0,
    [d, edits, items],
  );
  if (q.isLoading)
    return (
      <Card title="Preparation">
        <span className="t-sm c-mut">Loading ADL…</span>
      </Card>
    );
  if (q.error || !d)
    return (
      <Card title="Preparation">
        <Empty
          icon="warning-circle"
          title="The ADL values could not be loaded."
          text={(q.error as ApiError | null)?.message}
        />
      </Card>
    );
  if (b.stored === "created")
    return (
      <Card title="Preparation">
        <Empty
          icon="flask"
          title="Preparation starts after reception"
          text="Confirm reception first. Then the Preparation team enters the air-dried loss (ADL) of each sample."
        />
      </Card>
    );
  if (d.hidden)
    return (
      <Card title="Preparation">
        <span className="t-sm c-sec" id="adl-progress">
          {d.saved} of {d.total} ADL saved
        </span>
        <Empty
          icon="lock-simple"
          title="The values are for the lab"
          text="The air-dried loss is shown to the Preparation, analysis and laboratory roles."
        />
      </Card>
    );

  const canEnter = d.open && can("result.write.prep"),
    canFinish = d.open && can("batch.transition.prep");
  const finished = !!d.ready;
  const checks =
    canFinish || canEnter
      ? (d.checks ?? []).map((c) =>
          c.warn
            ? c
            : {
                ...c,
                ok: !d.tmOrdered || counted === live.length,
                text: d.tmOrdered
                  ? `ADL saved for every sample (TM is ordered): ${counted} of ${live.length}`
                  : c.text,
              },
        )
      : [];
  const finishWhy =
    d.tmOrdered && counted < live.length
      ? `Before you can finish preparation: ADL saved for every sample (${counted} of ${live.length}).`
      : "";
  const actions = finished ? (
    <span className="row g6 c-ok t-sm">
      <Icon n="check-circle" />
      <span id="ready-analysis">Ready for analysis</span>
    </span>
  ) : (
    <>
      <span className="t-sm c-sec" aria-live="polite">
        {counted} of {live.length} saved
      </span>
      {canEnter && (
        <Button
          icon="floppy-disk"
          id="adl-save"
          disabled={!dirty || busy}
          why="Nothing to save yet"
          onClick={() => saveAll()}
        >
          Save all
        </Button>
      )}
      {canFinish && (
        <Button
          icon="check-circle"
          type="primary"
          id="adl-finish"
          disabled={
            busy || (!!finishWhy && !(dirty && counted === live.length))
          }
          why={finishWhy || "Nothing to finish yet"}
          onClick={() => setAsk(true)}
        >
          Finish Preparation
        </Button>
      )}
    </>
  );

  const field = (it: Item, label = `ADL in %, ${it.clientRef}`) =>
    it.held ? (
      <span className="c-mut">On hold</span>
    ) : canEnter ? (
      <ValueField
        id={`adl-${it.id}`}
        value={shown(it)}
        state={stateOf(it)}
        label={label}
        onChange={(v) => setEdit(it, v)}
      />
    ) : (
      <LockedValue
        value={
          it.value != null ? Number(it.value).toFixed(d.decimals ?? 2) : "—"
        }
        label={label}
      />
    );
  const who = (it: Item, avatarOnly = false) =>
    it.enteredBy && !edits[it.id] ? (
      <span className="row g8" style={{ flexWrap: "nowrap" }}>
        <Avatar name={it.enteredBy} size={24} />
        {!avatarOnly && (
          <span className="col" style={{ gap: 0 }}>
            <span className="t-sm">{it.enteredBy}</span>
            <span className="t-cap c-sec">
              {dShort(it.enteredAt)} {dTime(it.enteredAt)}
            </span>
          </span>
        )}
      </span>
    ) : (
      <span className="c-mut">—</span>
    );
  const savedTag = (it: Item) =>
    it.held ? (
      <span className="c-mut">—</span>
    ) : edits[it.id] !== undefined || it.value == null ? (
      <Tag label="Pending" icon="clock" />
    ) : (
      <Tag label="Saved" tone="green" icon="check-circle" />
    );
  const codeCell = (it: Item, stack: boolean) => (
    <span className="col" style={{ gap: 0, minWidth: 0 }}>
      <b className="t-data-b c-head" title={it.sampleNo ?? undefined}>
        {it.sampleCode ?? it.clientRef}
      </b>
      {stack && it.sampleNo && (
        <span className="t-data-sm c-sec ellip">{it.sampleNo}</span>
      )}
    </span>
  );

  const cols: Array<Col<Item> | false> = tablet
    ? [
        {
          h: "#",
          w: 28,
          render: (it) => <span className="c-mut">{it.rowNo}</span>,
        },
        { h: "Sample", render: (it) => codeCell(it, false) },
        { h: "ADL (%)", w: 128, render: (it) => field(it) },
        { h: "Entered by", w: 80, render: (it) => who(it, true) },
        { h: "Saved", w: 100, render: savedTag },
      ]
    : [
        {
          h: "#",
          w: 40,
          render: (it) => <span className="c-mut">{it.rowNo}</span>,
        },
        { h: "Sample code", w: 170, render: (it) => codeCell(it, false) },
        {
          h: "Sample ID",
          w: 210,
          render: (it) => (
            <span className="t-data-sm c-sec">{it.sampleNo}</span>
          ),
        },
        { h: "ADL (%)", w: 130, render: (it) => field(it) },
        { h: "Entered by", fill: true, render: (it) => who(it) },
        { h: "Saved", w: 110, render: savedTag },
        {
          h: "Status",
          w: 110,
          render: (it) =>
            it.held ? (
              <Badge label="Held" tone="red" sm />
            ) : (
              <Badge label="Received" tone="green" sm />
            ),
        },
      ];
  const dialogs = (
    <>
      {ask && (
        <Confirm
          title={`Finish preparation of ${b.batchNo}?`}
          text="The ADL values lock and the batch goes to the analysts."
          ok="Finish Preparation"
          busy={busy}
          onOk={finish}
          onClose={() => setAsk(false)}
        />
      )}
      {blocker.state === "blocked" && (
        <Confirm
          title="Leave without saving?"
          text={`${dirty} unsaved ADL value${dirty === 1 ? "" : "s"} will be lost.`}
          ok="Leave"
          danger
          onOk={() => blocker.proceed()}
          onClose={() => blocker.reset()}
        />
      )}
    </>
  );
  const list = (
    <Checklist title="Before you can finish preparation" items={checks} />
  );

  if (phone)
    return (
      <div className="col g12">
        <Card
          title="Preparation"
          actions={
            finished ? (
              actions
            ) : (
              <span className="t-sm c-sec">
                {counted} of {live.length} saved
              </span>
            )
          }
        >
          <div className="col">
            {items.map((it) => (
              <div key={it.id} className="prow">
                <span className="row g8" style={{ flexWrap: "nowrap" }}>
                  <b className="t-data-b c-head">
                    {it.sampleCode ?? it.clientRef}
                  </b>
                  {it.sampleNo && (
                    <span className="t-data-sm c-sec ellip">{it.sampleNo}</span>
                  )}
                </span>
                <span className="col g4">
                  <span className="flabel">ADL (%)</span>
                  {field(it)}
                </span>
                {state(it)}
                {it.held ? <Badge label="Held" tone="red" sm /> : who(it)}
              </div>
            ))}
          </div>
          {list}
        </Card>
        {!finished && (canEnter || canFinish) && (
          <div className="sticky-bar">
            {canEnter && (
              <Button
                size="touch"
                id="adl-save"
                disabled={!dirty || busy}
                why="Nothing to save yet"
                onClick={() => saveAll()}
              >
                Save all
              </Button>
            )}
            {canFinish && (
              <Button
                size="touch"
                type="primary"
                id="adl-finish"
                disabled={
                  busy || (!!finishWhy && !(dirty && counted === live.length))
                }
                why={finishWhy || "Nothing to finish yet"}
                onClick={() => setAsk(true)}
              >
                Finish Preparation
              </Button>
            )}
          </div>
        )}
        {dialogs}
      </div>
    );
  function state(it: Item) {
    if (stateOf(it) !== "warn" || it.held) return null;
    const n = Number((shown(it) || "").replace(",", ".")),
      r = d?.range;
    return (
      <span className="t-cap c-warn">
        {r?.low != null && n < r.low
          ? `Below ${r.low} %`
          : `Above ${r?.high ?? ""} %`}
        : check the value.
      </span>
    );
  }
  return (
    <Card title="Preparation" actions={actions}>
      <Table
        rows={items}
        keyOf={(it) => it.id}
        cols={cols}
        empty={<Empty icon="flask" title="No sample was received" />}
      />
      {list}
      {dialogs}
    </Card>
  );
}
