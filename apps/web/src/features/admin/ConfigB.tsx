// Configuration slice B (Configuration_Slice_B_Plan.md): Services (versioned), Methods and standards (editions) and Report templates
// (versioned, text fields with a live preview). Every screen follows the FigCraft frames *-14-Configuration-03/04/06-*; the phone
// edits too: a tapped row opens the form as a bottom sheet, a template version opens the editor.
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../app/api";
import { useBreakpoint } from "../../app/session";
import {
  Button,
  Card,
  Dialog,
  Empty,
  Icon,
  TextField,
  TextArea,
  cx,
} from "../../components";
import {
  Badge,
  Chips,
  Confirm,
  Menu,
  Note,
  Pager,
  Select,
  Switch,
  Table,
  Tag,
  fmtDate,
  usePaged,
} from "../../components";
import { useSave } from "../master-data/shared";

const KEYS = ["config", "config-summary"];
const useConfigList = <T,>(key: string) =>
  useQuery({
    queryKey: ["config", key],
    queryFn: () => api<{ items: T[] }>(`/config/${key}`).then((r) => r.items),
  });
const Loading = () => (
  <Card>
    <span className="t-sm c-mut">Loading…</span>
  </Card>
);
const plural = (n: number, one: string, many = `${one}s`) =>
  `${n} ${n === 1 ? one : many}`;
const num = (v: string) => (v.trim() === "" ? null : Number(v));

interface Param {
  id: string;
  code: string;
  label: string;
  name: string;
  category: string;
  isGroup: boolean;
  active: boolean;
}
const useParams2 = () => useConfigList<Param>("parameters");

/* ======================= services ======================= */
type SvcStatus = "draft" | "active" | "archived";
interface Service {
  id: string;
  code: string;
  name: string;
  version: number;
  status: SvcStatus;
  isDefault: boolean;
  turnaroundDays: number;
  parameterIds: string[];
  parameterCount: number;
  usedBy: number;
  changedBy: string | null;
  at: string;
}
const SVC_TONE: Record<SvcStatus, "green" | "grey"> = {
  active: "green",
  draft: "grey",
  archived: "grey",
};
const SVC_LABEL: Record<SvcStatus, string> = {
  active: "Active",
  draft: "Draft",
  archived: "Archived",
};

/* FigCraft Desktop-, Tablet- and Phone-14-Configuration-03-Services-01-List: title with the count and Add service on one
   line, the description under it, then the table (phone: tappable rows with a chevron, "7 parameters, 5 days, v3"). */
export function Services({ editable: wide }: { editable: boolean }) {
  const { data = [], isLoading } = useConfigList<Service>("services");
  const bp = useBreakpoint();
  const phone = bp === "phone";
  const editable = wide || phone;
  const [chip, setChip] = useState<"live" | "archived">("live");
  const [form, setForm] = useState<Service | "new" | null>(null),
    [del, setDel] = useState<Service | null>(null);
  const act = useSave(
    (p: { id: string; verb: "activate" | "default" | "archive" }) =>
      api(`/config/services/${p.id}/${p.verb}`, { method: "POST" }),
    { keys: KEYS, done: "Saved" },
  );
  const remove = useSave(
    (s: Service) => api(`/config/services/${s.id}`, { method: "DELETE" }),
    { keys: KEYS, done: "Draft deleted", onDone: () => setDel(null) },
  );
  if (isLoading) return <Loading />;
  const live = data.filter((s) => s.status !== "archived"),
    arch = data.filter((s) => s.status === "archived");
  const rows = chip === "live" ? live : arch;
  const menu = (s: Service) => {
    if (!wide || s.status === "archived") return null;
    return (
      <Menu
        vertical
        label={`More for ${s.name} v${s.version}`}
        items={[
          { label: "Edit", icon: "pencil-simple", onClick: () => setForm(s) },
          s.status === "draft" && {
            label: "Activate",
            icon: "check-circle",
            onClick: () => act.mutate({ id: s.id, verb: "activate" }),
          },
          s.status === "active" &&
            !s.isDefault && {
              label: "Set as default",
              icon: "star",
              onClick: () => act.mutate({ id: s.id, verb: "default" }),
            },
          s.status === "active" && {
            label: "Archive",
            icon: "archive",
            disabled: s.isDefault,
            why: "This is the default for new job orders",
            onClick: () => act.mutate({ id: s.id, verb: "archive" }),
          },
          s.status === "draft" && {
            label: "Delete",
            icon: "trash",
            danger: true,
            disabled: s.usedBy > 0,
            why: "A job order used this version",
            onClick: () => setDel(s),
          },
        ]}
      />
    );
  };
  const head = (
    <span className="t-sm c-sec">
      Quick-select templates on the job order form. A change makes a new
      version; job orders keep the version they used.
    </span>
  );
  const empty = (
    <Empty
      icon="stack"
      title={chip === "live" ? "No services yet" : "No archived versions"}
    />
  );
  return (
    <>
      <Card
        title="Services"
        count={data.filter((s) => s.status === "active").length}
        actions={
          editable && (
            <Button icon="plus" id="add-service" onClick={() => setForm("new")}>
              Add service
            </Button>
          )
        }
      >
        {head}
        <Chips
          scroll
          value={chip}
          onChange={setChip}
          items={[
            { id: "live", label: "Active and draft", count: live.length },
            { id: "archived", label: "Archived", count: arch.length },
          ]}
        />
        {phone ? (
          <div className="col">
            {rows.map((s) => (
              <button
                key={s.id}
                type="button"
                className="lrow"
                style={{ alignItems: "center" }}
                disabled={s.status === "archived"}
                onClick={() => setForm(s)}
              >
                <span className="col grow" style={{ gap: 2, minWidth: 0 }}>
                  <b className="t-sm w6">{s.name}</b>
                  <span className="t-sm c-sec">
                    {plural(s.parameterCount, "parameter")},{" "}
                    {plural(s.turnaroundDays, "day")}, v{s.version}
                  </span>
                </span>
                <span className="row g8">
                  {s.isDefault && <Tag label="Default" tone="amber" />}
                  <Badge
                    label={SVC_LABEL[s.status]}
                    tone={SVC_TONE[s.status]}
                    sm
                  />
                </span>
                {s.status !== "archived" && (
                  <span className="c-mut" style={{ display: "inline-flex" }}>
                    <Icon n="caret-right" />
                  </span>
                )}
              </button>
            ))}
            {!rows.length && empty}
          </div>
        ) : (
          <Table
            rows={rows}
            keyOf={(s) => s.id}
            empty={empty}
            cols={[
              { h: "Name", render: (s) => <b className="t-sm w6">{s.name}</b> },
              {
                h: "Parameters",
                render: (s) => (
                  <span className="t-sm c-sec">
                    {plural(s.parameterCount, "parameter")}
                  </span>
                ),
              },
              bp !== "tablet" && {
                h: "Turnaround",
                render: (s) => (
                  <span className="t-sm c-sec">
                    {plural(s.turnaroundDays, "day")}
                  </span>
                ),
              },
              bp !== "tablet" && {
                h: "Version",
                render: (s) => <span className="t-data">v{s.version}</span>,
              },
              {
                h: "Status",
                render: (s) => (
                  <span className="row g8">
                    <Badge
                      label={SVC_LABEL[s.status]}
                      tone={SVC_TONE[s.status]}
                      sm
                    />
                    {s.isDefault && <Tag label="Default" tone="amber" />}
                  </span>
                ),
              },
              wide && { h: "", cls: "r", render: menu },
            ]}
          />
        )}
      </Card>
      {form && (
        <ServiceForm
          item={form === "new" ? null : form}
          phone={phone}
          onClose={() => setForm(null)}
        />
      )}
      {del && (
        <Confirm
          title={`Delete ${del.name} v${del.version}?`}
          text="This draft was never used, so it can be removed for good."
          ok="Delete"
          danger
          busy={remove.isPending}
          onOk={() => remove.mutate(del)}
          onClose={() => setDel(null)}
        />
      )}
    </>
  );
}

function ServiceForm({
  item,
  phone,
  onClose,
}: {
  item: Service | null;
  phone?: boolean;
  onClose: () => void;
}) {
  const params = useParams2();
  const [f, setF] = useState({
    name: item?.name ?? "",
    days: String(item?.turnaroundDays ?? 5),
    status: (item
      ? item.status === "draft"
        ? "draft"
        : "active"
      : "active") as "draft" | "active",
    isDefault: item?.isDefault ?? false,
    ids: item?.parameterIds ?? ([] as string[]),
  });
  const [err, setErr] = useState<Record<string, string>>({});
  const nextVersion =
    item && item.status === "active" ? item.version + 1 : (item?.version ?? 1);
  const groups = useMemo(() => {
    const m = new Map<string, Param[]>();
    (params.data ?? [])
      .filter((p) => p.active || f.ids.includes(p.id))
      .forEach((p) => m.set(p.category, [...(m.get(p.category) ?? []), p]));
    return [...m.entries()];
  }, [params.data, f.ids]);
  const save = useSave(
    () =>
      api(item ? `/config/services/${item.id}` : "/config/services", {
        method: item ? "PUT" : "POST",
        json: {
          name: f.name,
          turnaroundDays: Number(f.days),
          status: f.status,
          isDefault: f.isDefault && f.status === "active",
          parameterIds: f.ids,
        },
      }),
    {
      keys: KEYS,
      done: item
        ? `${f.name} saved as version ${nextVersion}`
        : `${f.name} added`,
      onDone: onClose,
      onField: (k, t) => setErr({ [k ?? "form"]: t }),
    },
  );
  const submit = () => {
    const e: Record<string, string> = {};
    if (f.name.trim().length < 2) e.name = "Enter the name.";
    const d = Number(f.days);
    if (!Number.isInteger(d) || d < 1 || d > 90)
      e.turnaroundDays = "1 to 90 days.";
    setErr(e);
    if (!Object.keys(e).length) save.mutate(undefined);
  };
  const toggle = (id: string) =>
    setF({
      ...f,
      ids: f.ids.includes(id) ? f.ids.filter((x) => x !== id) : [...f.ids, id],
    });
  const label = !item
    ? "Add service"
    : item.status === "draft"
      ? "Save draft"
      : `Save as version ${nextVersion}`;
  return (
    <Dialog
      title={item ? "Edit service" : "Add service"}
      sub={item ? `${item.name}, version ${item.version}` : undefined}
      size="lg"
      phone={phone}
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            type="primary"
            id="svc-save"
            disabled={save.isPending}
            onClick={submit}
          >
            {label}
          </Button>
        </>
      }
    >
      <div
        className="cfg-form"
        style={phone ? undefined : { gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}
      >
        <TextField
          id="svc-name"
          label="Name"
          req
          value={f.name}
          onChange={(t) => setF({ ...f, name: t })}
          error={err.name ?? null}
        />
        <TextField
          id="svc-days"
          label="Turnaround target (days)"
          type="number"
          value={f.days}
          onChange={(t) => setF({ ...f, days: t })}
          error={err.turnaroundDays ?? null}
        />
        <Select
          id="svc-status"
          label="Status"
          value={f.status}
          onChange={(v) => setF({ ...f, status: v as "draft" | "active" })}
          options={[
            ["active", "Active"],
            ["draft", "Draft"],
          ]}
        />
      </div>
      <div className="field">
        <span className="flabel">Parameters ({f.ids.length} selected)</span>
        <div className="col g8">
          {groups.map(([cat, list]) => (
            <div
              key={cat}
              className={phone ? "col g6" : "row g12"}
              style={phone ? undefined : { alignItems: "flex-start" }}
            >
              <span
                className="t-sm c-sec"
                style={phone ? undefined : { width: 88, flex: "none", paddingTop: 6 }}
              >
                {cat}
              </span>
              <div className="row g8 wrap">
                {list.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    className={cx("ppill", f.ids.includes(p.id) && "on")}
                    aria-pressed={f.ids.includes(p.id)}
                    onClick={() => toggle(p.id)}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
        {err.parameterIds && (
          <span className="help err">{err.parameterIds}</span>
        )}
      </div>
      <Switch
        id="svc-default"
        on={f.isDefault && f.status === "active"}
        onChange={(b) =>
          setF({ ...f, isDefault: b, status: b ? "active" : f.status })
        }
        label="Default for new job orders"
      />
      <span className="help">
        {item?.status === "active"
          ? `Saving makes version ${nextVersion}. Job orders keep the version they used.`
          : "Job orders keep the version they used."}
      </span>
      {err.form && <span className="help err">{err.form}</span>}
    </Dialog>
  );
}

/* ======================= methods and standards ======================= */
type Family = "ASTM" | "ISO" | "GBT";
const FAMILIES: Family[] = ["ASTM", "ISO", "GBT"];
const FAMILY_LABEL: Record<Family, string> = {
  ASTM: "ASTM",
  ISO: "ISO",
  GBT: "GB/T",
};
interface Method {
  id: string;
  parameterId: string;
  parameterCode: string;
  parameterLabel: string;
  family: Family;
  methodCode: string;
  edition: string;
  title: string;
  repeatability: number | null;
  reproducibility: number | null;
  isDefault: boolean;
}
// the way the standards write their numbers: D3174-23, ISO 1171:2010, GB/T 212-2008
const cite = (m: Method) =>
  m.family === "ASTM"
    ? `${m.methodCode}-${m.edition.slice(2)}`
    : m.family === "ISO"
      ? `ISO ${m.methodCode}:${m.edition}`
      : `GB/T ${m.methodCode}-${m.edition}`;

/* FigCraft *-14-Configuration-04-Methods_and_standards-01-Matrix: one card with the count, Add method and the note, then
   Parameter, ASTM, ISO and GB/T, 10 rows a page (a cell opens its method). The phone shows a block per parameter with the three
   standards, 6 a page; a tapped block opens the form for that parameter. */
export function Methods({ editable: wide }: { editable: boolean }) {
  const { data = [], isLoading } = useConfigList<Method>("methods");
  const phone = useBreakpoint() === "phone";
  const [form, setForm] = useState<{
    parameterId?: string;
    family?: Family;
  } | null>(null);
  const params = useMemo(() => {
    const m = new Map<
      string,
      {
        id: string;
        code: string;
        label: string;
        by: Partial<Record<Family, Method[]>>;
      }
    >();
    data.forEach((x) => {
      const p = m.get(x.parameterId) ?? {
        id: x.parameterId,
        code: x.parameterCode,
        label: x.parameterLabel,
        by: {},
      };
      p.by[x.family] = [...(p.by[x.family] ?? []), x];
      m.set(x.parameterId, p);
    });
    return [...m.values()];
  }, [data]);
  const pg = usePaged(params, phone ? 6 : 10, phone ? "phone" : "wide");
  if (isLoading) return <Loading />;
  const current = (p: { by: Partial<Record<Family, Method[]>> }, f: Family) =>
    p.by[f]?.find((m) => m.isDefault) ?? null;
  const text = (p: (typeof params)[number], f: Family) => {
    const m = current(p, f);
    return m ? (
      <span className="t-data">{cite(m)}</span>
    ) : (
      <span className="t-sm c-mut">No method</span>
    );
  };
  const cell = (p: (typeof params)[number], f: Family) =>
    wide ? (
      <button
        type="button"
        className="linkbtn"
        style={{ textDecoration: "none" }}
        aria-label={`${current(p, f) ? "Edit" : "Add"} ${FAMILY_LABEL[f]} method for ${p.code}`}
        onClick={() => setForm({ parameterId: p.id, family: f })}
      >
        {text(p, f)}
      </button>
    ) : (
      text(p, f)
    );
  const empty = <Empty icon="flask" title="No methods yet" />;
  return (
    <>
      <Card
        title="Methods and standards"
        count={data.length}
        actions={
          <Button icon="plus" id="add-method" onClick={() => setForm({})}>
            {phone ? "Add" : "Add method"}
          </Button>
        }
      >
        <span className="t-sm c-sec">
          An empty cell means the standard has no method for the parameter
          {phone ? "." : "; the job order form then disables that pill for the standard."}
        </span>
        {phone ? (
          <div className="col">
            {pg.rows.map((p) => (
              <button
                key={p.id}
                type="button"
                className="lrow"
                style={{ flexDirection: "column", gap: 6 }}
                onClick={() => setForm({ parameterId: p.id, family: "ASTM" })}
              >
                <span className="row between" style={{ width: "100%" }}>
                  <b className="t-sm w6">{p.label}</b>
                  <span className="c-mut" style={{ display: "inline-flex" }}>
                    <Icon n="caret-right" />
                  </span>
                </span>
                {FAMILIES.map((f) => (
                  <span key={f} className="row g12">
                    <span className="t-sm c-sec" style={{ width: 40 }}>
                      {FAMILY_LABEL[f]}
                    </span>
                    {text(p, f)}
                  </span>
                ))}
              </button>
            ))}
            {!params.length && empty}
            {pg.pager.pages > 1 && (
              <div className="row end">
                <Pager {...pg.pager} compact />
              </div>
            )}
          </div>
        ) : (
          <>
            <Table
              rows={pg.rows}
              keyOf={(p) => p.id}
              empty={empty}
              cols={[
                {
                  h: "Parameter",
                  render: (p) => <b className="t-sm w6">{p.label}</b>,
                },
                ...FAMILIES.map((f) => ({
                  h: FAMILY_LABEL[f],
                  render: (p: (typeof params)[number]) => cell(p, f),
                })),
              ]}
            />
            <Pager {...pg.pager} />
          </>
        )}
      </Card>
      {form && (
        <MethodForm
          all={data}
          start={form}
          phone={phone}
          onClose={() => setForm(null)}
        />
      )}
    </>
  );
}

function MethodForm({
  all,
  start,
  phone,
  onClose,
}: {
  all: Method[];
  start: { parameterId?: string; family?: Family };
  phone?: boolean;
  onClose: () => void;
}) {
  const two = phone
    ? undefined
    : { gridTemplateColumns: "repeat(2, minmax(0, 1fr))" };
  const params = useParams2();
  const [parameterId, setParameterId] = useState(start.parameterId ?? ""),
    [family, setFamily] = useState<Family>(start.family ?? "ASTM");
  const editions = all.filter(
    (m) => m.parameterId === parameterId && m.family === family,
  );
  const cur = editions.find((m) => m.isDefault) ?? null;
  const [mode, setMode] = useState<"new" | "fix">("new");
  const [f, setF] = useState({
    code: cur?.methodCode ?? "",
    edition: "",
    title: cur?.title ?? "",
    r: cur?.repeatability?.toString() ?? "",
    R: cur?.reproducibility?.toString() ?? "",
  });
  const [err, setErr] = useState<Record<string, string>>({});
  const pick = (pid: string, fam: Family) => {
    setParameterId(pid);
    setFamily(fam);
    setMode("new");
    setErr({});
    const c = all.find(
      (m) => m.parameterId === pid && m.family === fam && m.isDefault,
    );
    setF({
      code: c?.methodCode ?? "",
      edition: "",
      title: c?.title ?? "",
      r: c?.repeatability?.toString() ?? "",
      R: c?.reproducibility?.toString() ?? "",
    });
  };
  const fixing = mode === "fix" && !!cur;
  const save = useSave(
    () =>
      fixing
        ? api(`/config/methods/${cur!.id}`, {
            method: "PATCH",
            json: {
              title: f.title,
              repeatability: num(f.r),
              reproducibility: num(f.R),
            },
          })
        : api("/config/methods", {
            method: "POST",
            json: {
              parameterId,
              family,
              methodCode: f.code,
              edition: f.edition,
              title: f.title,
              repeatability: num(f.r),
              reproducibility: num(f.R),
            },
          }),
    {
      keys: KEYS,
      done: fixing ? "Method saved" : cur ? "Edition added" : "Method added",
      onDone: onClose,
      onField: (k, t) => setErr({ [k ?? "form"]: t }),
    },
  );
  const submit = () => {
    const e: Record<string, string> = {};
    if (!parameterId) e.parameterId = "Choose the parameter.";
    if (!fixing && !f.code.trim()) e.methodCode = "Enter the method number.";
    if (!fixing && !/^\d{4}$/.test(f.edition))
      e.edition = "Four digits, for example 2023.";
    const r = num(f.r),
      R = num(f.R);
    if ((f.r && Number.isNaN(r)) || (f.R && Number.isNaN(R)))
      e.reproducibility = "Use numbers.";
    else if (r != null && R != null && r > R)
      e.reproducibility = "R is not below r.";
    setErr(e);
    if (!Object.keys(e).length) save.mutate(undefined);
  };
  const p = (params.data ?? []).find((x) => x.id === parameterId);
  const title = !parameterId
    ? "Add method"
    : cur
      ? fixing
        ? `Fix ${FAMILY_LABEL[family]} edition: ${p?.label ?? ""}`
        : `New edition: ${p?.label ?? ""}, ${FAMILY_LABEL[family]}`
      : `Add method: ${p?.label ?? ""}, ${FAMILY_LABEL[family]}`;
  return (
    <Dialog
      title={title}
      phone={phone}
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            type="primary"
            id="me-save"
            disabled={save.isPending}
            onClick={submit}
          >
            {fixing ? "Save" : cur ? "Add edition" : "Add method"}
          </Button>
        </>
      }
    >
      <div className="cfg-form" style={two}>
        <Select
          id="me-param"
          label="Parameter"
          req
          value={parameterId}
          onChange={(v) => pick(v, family)}
          error={err.parameterId ?? null}
          options={[
            ["", "Choose…"],
            ...(params.data ?? [])
              .filter((x) => !x.isGroup && x.active)
              .map((x) => [x.id, `${x.code}, ${x.label}`] as [string, string]),
          ]}
        />
        <Select
          id="me-family"
          label="Standard"
          value={family}
          onChange={(v) => pick(parameterId, v as Family)}
          options={FAMILIES.map(
            (x) => [x, FAMILY_LABEL[x]] as [string, string],
          )}
        />
      </div>
      {cur && (
        <div className="row g8" role="group" aria-label="What to do">
          <Button
            size="sm"
            type={mode === "new" ? "primary" : "secondary"}
            onClick={() => setMode("new")}
          >
            New edition
          </Button>
          <Button
            size="sm"
            type={mode === "fix" ? "primary" : "secondary"}
            onClick={() => {
              setMode("fix");
              setF({
                ...f,
                title: cur.title,
                r: cur.repeatability?.toString() ?? "",
                R: cur.reproducibility?.toString() ?? "",
              });
            }}
          >
            Fix this edition
          </Button>
        </div>
      )}
      <div className="cfg-form" style={two}>
        <TextField
          id="me-code"
          label="Method"
          req
          value={fixing ? cur!.methodCode : f.code}
          onChange={(t) => setF({ ...f, code: t })}
          error={err.methodCode ?? null}
        />
        <TextField
          id="me-edition"
          label="Edition"
          req
          value={fixing ? cur!.edition : f.edition}
          onChange={(t) => setF({ ...f, edition: t })}
          error={err.edition ?? null}
          placeholder="2023"
        />
      </div>
      <TextArea
        id="me-title"
        label="Title"
        value={f.title}
        onChange={(t) => setF({ ...f, title: t })}
      />
      <div className="cfg-form" style={two}>
        <TextField
          id="me-r"
          label="Repeatability r"
          type="number"
          value={f.r}
          onChange={(t) => setF({ ...f, r: t })}
        />
        <TextField
          id="me-R"
          label="Reproducibility R"
          type="number"
          value={f.R}
          onChange={(t) => setF({ ...f, R: t })}
          error={err.reproducibility ?? null}
        />
      </div>
      {editions.length > 0 && (
        <span className="help">
          Editions on file:{" "}
          {editions
            .map(
              (m) =>
                `${m.methodCode} ${m.edition}${m.isDefault ? " (current)" : ""}`,
            )
            .join(", ")}
          .{" "}
          {fixing
            ? "The title is shared with other parameters that use this standard."
            : "Older editions stay on results entered before."}
        </span>
      )}
      {err.form && <span className="help err">{err.form}</span>}
    </Dialog>
  );
}

/* ======================= report templates ======================= */
type TplStatus = "draft" | "active" | "archived";
interface Template {
  id: string;
  name: string;
  formCode: string;
  revision: number;
  status: TplStatus;
  since: string;
  title: string;
  statement: string;
  terms: string;
  note: string | null;
  changedBy: string | null;
  at: string;
  usedBy: number;
}
const TPL_TONE: Record<TplStatus, "green" | "grey"> = {
  active: "green",
  draft: "grey",
  archived: "grey",
};
const TPL_LABEL: Record<TplStatus, string> = {
  active: "Active",
  draft: "Draft",
  archived: "Archived",
};

/* FigCraft *-14-Configuration-06-Report_templates-01-List: the version table with the dots menu (tablet drops Note); the phone
   lists "v3", the status and a chevron, "Name, date" and the note, and a tapped row opens the editor. */
export function Templates({ editable: wide }: { editable: boolean }) {
  const { data = [], isLoading } = useConfigList<Template>("templates");
  const bp = useBreakpoint();
  const editable = wide || bp === "phone";
  const [openId, setOpenId] = useState<string | null>(null),
    [del, setDel] = useState<Template | null>(null);
  const act = useSave(
    (p: { id: string; verb: "activate" }) =>
      api(`/config/templates/${p.id}/${p.verb}`, { method: "POST" }),
    { keys: KEYS, done: "Version activated" },
  );
  const remove = useSave(
    (t: Template) => api(`/config/templates/${t.id}`, { method: "DELETE" }),
    { keys: KEYS, done: "Draft deleted", onDone: () => setDel(null) },
  );
  const make = useSave(
    () => api<{ id: string }>("/config/templates/draft", { method: "POST" }),
    {
      keys: KEYS,
      done: "Draft created",
      onDone: (r) => setOpenId((r as { id: string }).id),
      onField: () => {
        const d = data.find((t) => t.status === "draft");
        if (d) setOpenId(d.id);
      },
    },
  );
  if (isLoading) return <Loading />;
  const open = data.find((t) => t.id === openId) ?? null;
  if (open)
    return (
      <TemplateEditor
        t={open}
        editable={editable}
        phone={bp === "phone"}
        onBack={() => setOpenId(null)}
      />
    );
  const menu = (t: Template) =>
    editable || t.status !== "draft" ? (
      <Menu
        label={`More for version ${t.revision}`}
        items={[
          {
            label: t.status === "draft" && editable ? "Edit" : "Open",
            icon: t.status === "draft" && editable ? "pencil-simple" : "eye",
            onClick: () => setOpenId(t.id),
          },
          editable &&
            t.status === "draft" && {
              label: "Activate",
              icon: "check-circle",
              onClick: () => act.mutate({ id: t.id, verb: "activate" }),
            },
          editable &&
            t.status === "draft" && {
              label: "Delete",
              icon: "trash",
              danger: true,
              onClick: () => setDel(t),
            },
        ]}
      />
    ) : null;
  return (
    <>
      <Card
        title="House CoA template"
        actions={
          editable && (
            <Button
              icon="plus"
              id="new-version"
              disabled={make.isPending}
              onClick={() => make.mutate(undefined)}
            >
              {data.some((t) => t.status === "draft")
                ? "Open draft"
                : "New version"}
            </Button>
          )
        }
      >
        <span className="t-sm c-sec">
          {bp === "phone"
            ? "One template in v1. Activating a version changes new CoAs only."
            : "One template in v1; templates per client are next goal. Activating a version changes new CoAs only."}
        </span>
        {bp === "phone" ? (
          <div className="col">
            {data.map((t) => (
              <button
                key={t.id}
                type="button"
                className="lrow"
                onClick={() => setOpenId(t.id)}
              >
                <span className="col grow" style={{ gap: 2, minWidth: 0 }}>
                  <b className="t-data-b">v{t.revision}</b>
                  <span className="t-sm c-sec">
                    {t.changedBy ? `${t.changedBy}, ` : ""}
                    {fmtDate(t.at)}
                  </span>
                  {t.note && <span className="t-sm c-mut">{t.note}</span>}
                </span>
                <Badge
                  label={TPL_LABEL[t.status]}
                  tone={TPL_TONE[t.status]}
                  sm
                />
                <span className="c-mut" style={{ display: "inline-flex", paddingTop: 2 }}>
                  <Icon n="caret-right" />
                </span>
              </button>
            ))}
          </div>
        ) : (
          <Table
            rows={data}
            keyOf={(t) => t.id}
            onRow={(t) => setOpenId(t.id)}
            cols={[
              {
                h: "Version",
                render: (t) => <b className="t-data-b">v{t.revision}</b>,
              },
              {
                h: "Status",
                render: (t) => (
                  <Badge
                    label={TPL_LABEL[t.status]}
                    tone={TPL_TONE[t.status]}
                    sm
                  />
                ),
              },
              {
                h: "Changed by",
                render: (t) => (
                  <span className="t-sm">{t.changedBy ?? ""}</span>
                ),
              },
              {
                h: "Date",
                render: (t) => <span className="t-sm">{fmtDate(t.at)}</span>,
              },
              bp !== "tablet" && {
                h: "Note",
                render: (t) => (
                  <span className="t-sm c-sec">{t.note ?? ""}</span>
                ),
              },
              { h: "", cls: "r", render: menu },
            ]}
          />
        )}
      </Card>
      {del && (
        <Confirm
          title={`Delete version ${del.revision}?`}
          text="This draft was never used, so it can be removed for good."
          ok="Delete"
          danger
          busy={remove.isPending}
          onOk={() => remove.mutate(del)}
          onClose={() => setDel(null)}
        />
      )}
    </>
  );
}

function TemplateEditor({
  t,
  editable,
  phone,
  onBack,
}: {
  t: Template;
  editable: boolean;
  phone?: boolean;
  onBack: () => void;
}) {
  const draft = t.status === "draft" && editable;
  const [f, setF] = useState({
    formCode: t.formCode,
    title: t.title,
    statement: t.statement,
    terms: t.terms,
    note: t.note ?? "",
  });
  const [err, setErr] = useState<Record<string, string>>({});
  const dirty =
    f.formCode !== t.formCode ||
    f.title !== t.title ||
    f.statement !== t.statement ||
    f.terms !== t.terms ||
    f.note !== (t.note ?? "");
  const put = useSave(
    () => api(`/config/templates/${t.id}`, { method: "PUT", json: f }),
    {
      keys: KEYS,
      done: "Draft saved",
      onField: (k, x) => setErr({ [k ?? "form"]: x }),
    },
  );
  const activate = useSave(
    async () => {
      await api(`/config/templates/${t.id}`, { method: "PUT", json: f });
      return api(`/config/templates/${t.id}/activate`, { method: "POST" });
    },
    {
      keys: KEYS,
      done: `Version ${t.revision} is active`,
      onDone: onBack,
      onField: (k, x) => setErr({ [k ?? "form"]: x }),
    },
  );
  const check = () => {
    const e: Record<string, string> = {};
    if (f.title.trim().length < 2) e.title = "Enter the title.";
    if (f.statement.trim().length < 2) e.statement = "Enter the statement.";
    if (f.terms.trim().length < 2) e.terms = "Enter the terms line.";
    if (!/^[A-Za-z0-9][A-Za-z0-9 ._-]{2,30}$/.test(f.formCode))
      e.formCode = "Letters, numbers, dashes or dots.";
    setErr(e);
    return !Object.keys(e).length;
  };
  return (
    <>
      <button type="button" className="linkbtn" onClick={onBack}>
        <Icon n="caret-left" />
        All versions
      </button>
      <Card
        title={`Version ${t.revision} (${TPL_LABEL[t.status].toLowerCase()})`}
      >
        <fieldset
          disabled={!draft}
          style={{ border: 0, padding: 0, margin: 0 }}
          className="col g16"
        >
          <div className="cfg-form">
            <TextField
              id="tp-title"
              label="Title"
              req
              value={f.title}
              onChange={(x) => setF({ ...f, title: x })}
              error={err.title ?? null}
            />
            <TextField
              id="tp-code"
              label="Form code"
              req
              value={f.formCode}
              onChange={(x) => setF({ ...f, formCode: x })}
              error={err.formCode ?? null}
            />
          </div>
          <TextArea
            id="tp-statement"
            label="Statement"
            value={f.statement}
            onChange={(x) => setF({ ...f, statement: x })}
          />
          <TextArea
            id="tp-terms"
            label="Terms line"
            value={f.terms}
            onChange={(x) => setF({ ...f, terms: x })}
          />
          <TextField
            id="tp-note"
            label="Note"
            value={f.note}
            onChange={(x) => setF({ ...f, note: x })}
            help="What changed in this version."
          />
          {(err.statement || err.terms || err.form) && (
            <span className="help err">
              {err.statement ?? err.terms ?? err.form}
            </span>
          )}
        </fieldset>
        {draft && phone && (
          <>
            <Button
              id="tp-activate"
              size="touch"
              icon="check-circle"
              block
              disabled={activate.isPending}
              onClick={() => check() && activate.mutate(undefined)}
            >
              Activate version {t.revision}
            </Button>
            <span className="help">
              Activating makes version {t.revision} the template for new CoAs
              only.
            </span>
          </>
        )}
        {draft && !phone && (
          <div className="row g10 end">
            <Button size="lg" onClick={onBack}>
              Cancel
            </Button>
            <Button
              id="tp-save"
              size="lg"
              disabled={!dirty || put.isPending}
              why="Nothing changed"
              onClick={() => check() && put.mutate(undefined)}
            >
              Save draft
            </Button>
            <Button
              type="primary"
              size="lg"
              id="tp-activate"
              disabled={activate.isPending}
              onClick={() => check() && activate.mutate(undefined)}
            >
              Activate
            </Button>
          </div>
        )}
        {!draft && (
          <Note>
            {t.status === "draft"
              ? "Editing is on desktop and tablet."
              : "Only a draft can be changed. Make a new version from the list."}
          </Note>
        )}
      </Card>
      <Card title="Preview">
        <div className="coa-stage">
          <CoaPreview
            f={f}
            revision={t.revision}
            draft={t.status === "draft"}
          />
        </div>
      </Card>
      {draft && phone && (
        <div className="sticky-bar">
          <Button size="touch" onClick={onBack}>
            Cancel
          </Button>
          <Button
            id="tp-save"
            type="primary"
            size="touch"
            disabled={!dirty || put.isPending}
            why="Nothing changed"
            onClick={() => check() && put.mutate(undefined)}
          >
            Save draft
          </Button>
        </div>
      )}
    </>
  );
}

/** A drawing of the certificate with demo results; the text fields above feed it live. */
function CoaPreview({
  f,
  revision,
  draft,
}: {
  f: { title: string; formCode: string; statement: string; terms: string };
  revision: number;
  draft: boolean;
}) {
  const rows: Array<[string, string, string, string]> = [
    ["Total moisture", "%", "—", "14.20"],
    ["Inherent moisture", "%", "8.10", "—"],
    ["Ash", "%", "5.42", "5.06"],
    ["Volatile matter", "%", "39.85", "37.21"],
    ["Total sulphur", "%", "0.42", "0.39"],
    ["Gross calorific value", "kcal/kg", "5,980", "5,584"],
  ];
  return (
    <div className="coa" aria-label="Certificate preview">
      {draft && (
        <span className="coa-mark" aria-hidden="true">
          DRAFT
        </span>
      )}
      <div className="row between">
        <b className="t-sm w6">Sentra Geo Survey Indonesia</b>
        <span className="t-data">CoA-JO-2026-0142-1</span>
      </div>
      <h3 className="t-h2 coa-title">{f.title || "Certificate of Analysis"}</h3>
      <p className="t-cap c-sec" style={{ margin: 0 }}>
        {f.statement}
      </p>
      <table className="coa-t">
        <thead>
          <tr>
            <th>Parameter</th>
            <th>Unit</th>
            <th>ADB</th>
            <th>AR</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r[0]}>
              <td>{r[0]}</td>
              <td>{r[1]}</td>
              <td>{r[2]}</td>
              <td>{r[3]}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="row between coa-foot">
        <span className="t-cap c-sec">{f.terms}</span>
        <span className="t-cap c-mut">
          {f.formCode} rev {revision}
        </span>
      </div>
    </div>
  );
}
