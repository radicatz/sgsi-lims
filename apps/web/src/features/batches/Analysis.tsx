// The Analysis tab (FigCraft 04-Batches-02-Batch_detail 12 Analysis_entering_values, 13, 14; spec S-18, F-RES-07): one row per sample, one column per
// ordered parameter, grouped under their category. FC and Net CV are worked out. Desktop and tablet: a grid whose # and Sample code columns stay while
// it scrolls sideways; phone: a card per sample. Save all, then Finish Analysis when the checklist allows.
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useBlocker } from "react-router";
import {
  fixedCarbon,
  hydrogenSeyler,
  netCalorific,
  outOfRange,
  type Standard,
} from "@sgsi/shared";
import { api, ApiError } from "../../app/api";
import { useSession } from "../../app/session";
import {
  Avatar,
  Button,
  Card,
  Confirm,
  Empty,
  Icon,
  cx,
  toast,
} from "../../components";
import {
  CalcValue,
  Checklist,
  LockedValue,
  ValueField,
  type CellState,
} from "./Cells";
import { dShort, type BatchPageData } from "./shared";

interface Col {
  key: string;
  parameterId: string;
  itemId: string | null;
  code: string;
  label: string;
  group: string;
  unit: string | null;
  basis: string | null;
  decimals: number;
  kind: "number" | "text" | "calc";
  qualifier: boolean;
  range: { low: number | null; high: number | null; severity: string } | null;
}
interface Cell {
  value: string | null;
  qualifier: string | null;
  text: string | null;
  calc: boolean;
  by: string | null;
  at: string | null;
}
interface Row {
  id: string;
  rowNo: number;
  clientRef: string;
  sampleCode: string | null;
  sampleNo: string | null;
  held: string | null;
  cells: Record<string, Cell>;
}
interface Grid {
  hidden: boolean;
  status: string;
  standard: string;
  open: boolean;
  ready: boolean;
  saved: number;
  total: number;
  startedAt: string | null;
  startedBy: string | null;
  canFinish?: boolean;
  cols?: Col[];
  rows?: Row[];
  checks?: Array<{ ok: boolean; text: string; warn: boolean }>;
}

const ek = (sampleId: string, key: string) => `${sampleId}|${key}`;

export function AnalysisTab({
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
    queryKey: ["analysis", b.batchNo],
    queryFn: () => api<Grid>(`/batches/${b.batchNo}/analysis`),
  });
  const [edits, setEdits] = useState<Record<string, string>>({}),
    [busy, setBusy] = useState(false),
    [ask, setAsk] = useState(false),
    [bad, setBad] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false),
    wrap = useRef<HTMLDivElement>(null);
  const d = q.data,
    cols = d?.cols ?? [],
    rows = d?.rows ?? [];
  const dirty = Object.keys(edits).length;
  const refresh = () => {
    for (const k of ["analysis", "batch", "batches", "order-batches"])
      qc.invalidateQueries({ queryKey: [k] });
  };
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      dirty > 0 && currentLocation.pathname !== nextLocation.pathname,
  );
  useEffect(() => {
    if (!dirty) return;
    const f = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", f);
    return () => window.removeEventListener("beforeunload", f);
  }, [dirty]);

  const live = rows.filter((r) => !r.held),
    entry = cols.filter((c) => c.kind !== "calc");
  const saved = (r: Row, c: Col) => r.cells[c.key];
  const savedText = (c: Col, x?: Cell) =>
    !x
      ? ""
      : (x.text ??
        (x.value != null
          ? `${x.qualifier ?? ""}${Number(x.value).toFixed(c.decimals)}`
          : ""));
  const shown = (r: Row, c: Col) =>
    edits[ek(r.id, c.key)] ?? savedText(c, saved(r, c));
  const warnOf = (c: Col, t: string) => {
    const n = Number(t.replace(",", ".").replace("<", ""));
    return (
      c.kind === "number" &&
      !!c.range &&
      t.trim() !== "" &&
      Number.isFinite(n) &&
      outOfRange(n, c.range)
    );
  };
  const stateOf = (r: Row, c: Col): CellState => {
    const k = ek(r.id, c.key),
      e = edits[k];
    if (bad === k) return "err";
    if (e !== undefined) return warnOf(c, e) ? "warn" : "dirty";
    return warnOf(c, savedText(c, saved(r, c))) ? "warn" : "saved";
  };
  const setEdit = (r: Row, c: Col, v: string) => {
    setBad(null);
    setEdits((e) => {
      const n = { ...e },
        k = ek(r.id, c.key);
      if (v.trim() === savedText(c, saved(r, c))) delete n[k];
      else n[k] = v;
      return n;
    });
  };
  /** FC and Net CV as the saved values will come out: from what is typed, else what is saved. */
  const calcOf = (r: Row, c: Col): string => {
    const byCode = (code: string) => {
      const k = cols.find((x) => x.code === code && !x.itemId);
      return k ? (shown(r, k) || "").replace(",", ".") : "";
    };
    const [im, ash, vm, gcv, tm] = ["IM", "ASH", "VM", "GCV", "TM"].map(
      byCode,
    ) as [string, string, string, string, string];
    const touched = cols.some(
      (x) =>
        ["IM", "ASH", "VM", "GCV", "TM"].includes(x.code) &&
        edits[ek(r.id, x.key)] !== undefined,
    );
    if (!touched) return savedText(c, saved(r, c));
    const v =
      c.code === "FC"
        ? fixedCarbon(im, ash, vm)
        : netCalorific(
            gcv,
            tm,
            im,
            hydrogenSeyler(gcv, vm, im, ash),
            (d?.standard ?? "ISO") as Standard,
          );
    return v == null ? "" : Number(v).toFixed(c.decimals);
  };

  const saveAll = async () => {
    if (!dirty) return true;
    setBusy(true);
    const list = Object.entries(edits).map(([k, value]) => {
      const [sampleId, key] = k.split("|");
      return {
        k,
        sampleId: sampleId!,
        key: key!,
        value: value.trim() === "" ? null : value,
      };
    });
    try {
      await api(`/batches/${b.batchNo}/analysis`, {
        method: "PUT",
        json: { values: list.map(({ k: _k, ...x }) => x) },
      });
      setEdits({});
      refresh();
      toast("Values saved");
      return true;
    } catch (e) {
      const err = e as ApiError,
        i = Number(err.field?.split(".")[1]);
      if (list[i]) setBad(list[i]!.k);
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
      await api(`/batches/${b.batchNo}/finish-analysis`, { method: "POST" });
      toast("Analysis finished");
      setAsk(false);
      refresh();
    } catch (e) {
      toast((e as ApiError).message, "error");
      refresh();
      setAsk(false);
    } finally {
      setBusy(false);
    }
  };

  // the count follows what is typed, as the Preparation tab does
  const counted = useMemo(() => {
    if (!d) return 0;
    if (!dirty) return d.saved;
    let n = 0;
    for (const r of live)
      for (const c of entry) if (shown(r, c).trim() !== "") n++;
    return n;
  }, [d, edits]);
  const total = d?.total ?? 0;

  if (q.isLoading)
    return (
      <Card title="Analysis">
        <span className="t-sm c-mut">Loading values…</span>
      </Card>
    );
  if (q.error || !d)
    return (
      <Card title="Analysis">
        <Empty
          icon="warning-circle"
          title="The values could not be loaded."
          text={(q.error as ApiError | null)?.message}
        />
      </Card>
    );
  if (b.stored === "created" || b.stored === "preparation")
    return (
      <Card title="Analysis">
        <Empty
          icon="test-tube"
          title="Analysis starts after preparation"
          text="The analyst enters one final value for each sample and parameter once preparation is finished."
        />
      </Card>
    );
  const head = (
    <span className="row g12 t-sm" style={{ flexWrap: "wrap" }}>
      <span aria-live="polite" id="an-progress" className="c-for">
        {counted} of {total} values saved
      </span>
      {d.startedAt && (
        <span className="c-mut">Started {dShort(d.startedAt)}</span>
      )}
      {d.startedBy && (
        <span className="row g6 c-sec">
          <Avatar name={d.startedBy} size={24} />
          {d.startedBy}
        </span>
      )}
    </span>
  );
  if (d.hidden)
    return (
      <Card title="Analysis">
        {head}
        <Empty
          icon="lock-simple"
          title="The values are for the lab"
          text="The values are shown to the analysis and laboratory roles."
        />
      </Card>
    );

  const canEnter = d.open && can("result.write"),
    canFinish = d.open && can("batch.transition.analysis");
  const finished = d.ready;
  const blockers = (d.checks ?? []).filter((c) => !c.warn && !c.ok);
  const missing = total - counted;
  const checks = (d.checks ?? []).map((c, i) =>
    i === 0 && !c.warn
      ? {
          ...c,
          ok: missing === 0 && total > 0,
          text: `A value for every ordered parameter of every sample: ${counted} of ${total}`,
        }
      : c,
  );
  const finishWhy =
    missing > 0
      ? `Before you can finish analysis: a value for every ordered parameter (${counted} of ${total}).`
      : blockers.length > 1
        ? blockers[1]!.text
        : "";
  const finishOff =
    busy || missing > 0 || (!dirty && !d.canFinish && d.status !== "analysis");
  const actions = finished ? (
    <span className="row g6 c-ok t-sm">
      <Icon n="check-circle" />
      <span>Analysis finished</span>
    </span>
  ) : (
    <>
      {canEnter && (
        <Button
          icon="floppy-disk"
          id="an-save"
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
          id="an-finish"
          disabled={finishOff}
          why={finishWhy || "Save a first value to start the analysis"}
          onClick={() => setAsk(true)}
        >
          Finish Analysis
        </Button>
      )}
    </>
  );

  const field = (r: Row, c: Col) => {
    const label =
      `${c.label} in ${c.unit ?? "value"} ${c.basis ?? ""}, ${r.clientRef}`.replace(
        "  ",
        " ",
      );
    if (r.held) return <span className="c-mut">On hold</span>;
    if (c.kind === "calc")
      return (
        <CalcValue value={calcOf(r, c)} label={`${c.label}, ${r.clientRef}`} />
      );
    if (!canEnter)
      return (
        <LockedValue value={savedText(c, saved(r, c)) || "—"} label={label} />
      );
    return (
      <ValueField
        id={`an-${r.id}-${c.key}`}
        value={shown(r, c)}
        state={stateOf(r, c)}
        label={label}
        onChange={(v) => setEdit(r, c, v)}
      />
    );
  };
  const unitOf = (c: Col) => [c.unit, c.basis].filter(Boolean).join(" ");
  const dialogs = (
    <>
      {ask && (
        <Confirm
          title={`Finish analysis of ${b.batchNo}?`}
          text="The values lock and the Lab admin is told. Upload the signed RoA next."
          ok="Finish Analysis"
          busy={busy}
          onOk={finish}
          onClose={() => setAsk(false)}
        />
      )}
      {blocker.state === "blocked" && (
        <Confirm
          title="Leave without saving?"
          text={`${dirty} unsaved value${dirty === 1 ? "" : "s"} will be lost.`}
          ok="Leave"
          danger
          onOk={() => blocker.proceed()}
          onClose={() => blocker.reset()}
        />
      )}
    </>
  );
  const list = (
    <Checklist title="Before you can finish analysis" items={checks} />
  );
  const cats: Array<{ name: string; cols: Col[] }> = [];
  for (const c of cols) {
    const g = cats[cats.length - 1];
    if (g && g.name === c.group) g.cols.push(c);
    else cats.push({ name: c.group, cols: [c] });
  }

  if (phone)
    return (
      <div className="col g12">
        <Card title="Analysis" actions={finished ? actions : undefined}>
          <div className="col g12">
            {head}
            <div className="col">
              {rows.map((r) => (
                <div key={r.id} className="prow">
                  <span className="row g8" style={{ flexWrap: "nowrap" }}>
                    <b className="t-data-b c-head">
                      {r.sampleCode ?? r.clientRef}
                    </b>
                    {r.sampleNo && (
                      <span className="t-data-sm c-sec ellip">
                        {r.sampleNo}
                      </span>
                    )}
                  </span>
                  {r.held ? (
                    <span className="c-mut">On hold</span>
                  ) : (
                    cats.map((g) => (
                      <div key={g.name} className="col g8">
                        <span className="grp">{g.name}</span>
                        <div className="rc-grid">
                          {g.cols.map((c) => (
                            <span key={c.key} className="col g4">
                              <span className="flabel">
                                {c.label}{" "}
                                <span className="c-mut">
                                  (
                                  {[c.unit, c.basis].filter(Boolean).join(", ")}
                                  )
                                </span>
                              </span>
                              {field(r, c)}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              ))}
            </div>
          </div>
          {list}
        </Card>
        {!finished && (canEnter || canFinish) && (
          <div className="sticky-bar">
            {canEnter && (
              <Button
                size="touch"
                id="an-save"
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
                id="an-finish"
                disabled={finishOff}
                why={finishWhy || "Save a first value to start the analysis"}
                onClick={() => setAsk(true)}
              >
                Finish Analysis
              </Button>
            )}
          </div>
        )}
        {dialogs}
      </div>
    );

  // group headers: consecutive columns of one group
  const groups: Array<{ name: string; n: number }> = [];
  for (const c of cols) {
    const g = groups[groups.length - 1];
    if (g && g.name === c.group) g.n++;
    else groups.push({ name: c.group, n: 1 });
  }
  return (
    <Card title="Analysis" actions={actions}>
      {head}
      <div
        ref={wrap}
        className={cx("agrid-wrap", scrolled && "scrolled")}
        onScroll={(e) => setScrolled(e.currentTarget.scrollLeft > 2)}
      >
        <table className="agrid">
          <thead>
            <tr>
              <th className="stk1" />
              <th className="stk2" />
              {groups.map((g) => (
                <th key={g.name + g.n} colSpan={g.n} className="gh">
                  {g.name}
                </th>
              ))}
            </tr>
            <tr>
              <th className="stk1">#</th>
              <th className="stk2">{tablet ? "Sample" : "Sample code"}</th>
              {cols.map((c) => (
                <th key={c.key} className="ch">
                  <span>{c.label}</span>
                  <span className="un">{unitOf(c)}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="stk1">{r.rowNo}</td>
                <td className="stk2">
                  <b
                    className="t-data-b c-head"
                    title={r.sampleNo ?? undefined}
                  >
                    {r.sampleCode ?? r.clientRef}
                  </b>
                </td>
                {cols.map((c) => (
                  <td key={c.key} className="vc">
                    {field(r, c)}
                  </td>
                ))}
              </tr>
            ))}
            {!rows.length && (
              <tr>
                <td colSpan={cols.length + 2}>
                  <Empty icon="test-tube" title="No sample was received" />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {list}
      {dialogs}
    </Card>
  );
}
