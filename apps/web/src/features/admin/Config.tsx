// Configuration hub and its slice A sections (Admin screen plan section 6; Configuration_Build_Design.md): Parameters, Validation rules,
// Lookups, Laboratory (with branch offices and numbering), Security and Formulas (view). Services, Methods and standards and
// Report templates are in ConfigB.tsx (slice B). Every screen follows the FigCraft frames *-14-Configuration-SS-*. The phone edits
// too (the frames draw chevrons and -02-Edit pages): list rows open the form as a bottom sheet; Laboratory and Security show a read
// view whose rows open an edit page. Formulas stay view only.
import { useMemo, useState, type ReactNode } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router";
import { useQueries, useQuery } from "@tanstack/react-query";
import { api } from "../../app/api";
import { useBreakpoint } from "../../app/session";
import {
  Alert,
  Button,
  Card,
  Dialog,
  Empty,
  Icon,
  Seg,
  TextField,
  cx,
} from "../../components";
import {
  Badge,
  Check,
  Chips,
  Pager,
  Search,
  Select,
  Switch,
  Table,
  Tabs,
  Tag,
  TextArea,
  fmtDate,
  usePaged,
} from "../../components";
import { useSave } from "../master-data/shared";
import { Methods, Services, Templates } from "./ConfigB";

/* ---------- sections ---------- */
type SectionId =
  | "parameters"
  | "services"
  | "methods"
  | "rules"
  | "lookups"
  | "templates"
  | "laboratory"
  | "security"
  | "formulas";
interface Section {
  id: SectionId;
  group: "LAB DATA" | "DOCUMENTS" | "SYSTEM";
  title: string;
  text: string;
  count?: keyof Counts;
}
interface Counts {
  parameters: number;
  services: number;
  methods: number;
  rules: number;
  lookups: number;
  templates: number;
  formulas: number;
}
const SECTIONS: Section[] = [
  {
    id: "parameters",
    group: "LAB DATA",
    title: "Parameters",
    text: "Codes, units, groups, bases, decimals",
    count: "parameters",
  },
  {
    id: "services",
    group: "LAB DATA",
    title: "Services",
    text: "Quick-select templates for job orders",
    count: "services",
  },
  {
    id: "methods",
    group: "LAB DATA",
    title: "Methods and standards",
    text: "ASTM, ISO and GB/T methods with editions",
    count: "methods",
  },
  {
    id: "rules",
    group: "LAB DATA",
    title: "Validation rules",
    text: "Ranges and severity of the checks",
    count: "rules",
  },
  {
    id: "lookups",
    group: "LAB DATA",
    title: "Lookups",
    text: "Conditions, hold reasons, tags, channels",
    count: "lookups",
  },
  {
    id: "templates",
    group: "DOCUMENTS",
    title: "Report templates",
    text: "The CoA template and its versions",
    count: "templates",
  },
  {
    id: "laboratory",
    group: "DOCUMENTS",
    title: "Laboratory",
    text: "Name, address, branch offices, numbering",
  },
  {
    id: "security",
    group: "SYSTEM",
    title: "Security",
    text: "Lockout, sign-out, passwords, links",
  },
  {
    id: "formulas",
    group: "SYSTEM",
    title: "Formulas",
    text: "Bases and calculated values (view only)",
    count: "formulas",
  },
];
const NEXT_GOAL = ["Result tabs and fields", "Field definitions"];
const LIST_LABEL: Record<string, string> = {
  sample_condition: "Sample conditions",
  hold_reason: "Hold reasons",
  photo_tag: "Photo tags",
  lithology_kind: "Lithology kinds",
  send_channel: "Send channels",
  not_received_reason: "Not received reasons",
  sample_type: "Sample types",
};
const BASIS: Record<string, string> = {
  ar: "AR",
  adb: "ADB",
  db: "DB",
  daf: "DAF",
  ash: "Ash",
};

interface Summary {
  counts: Counts;
  lastChanged: Record<string, { at: string; by: string | null }>;
}
interface Lookup {
  id: string;
  listKey: string;
  value: string;
  needsRemark: boolean;
  sortOrder: number;
  active: boolean;
}
interface Param {
  id: string;
  code: string;
  name: string;
  label: string;
  category: string;
  unit: string | null;
  kind: string;
  measuredBasis: string | null;
  decimals: number;
  allowsQualifier: boolean;
  typicalLow: number | null;
  typicalHigh: number | null;
  isGroup: boolean;
  active: boolean;
  inUse: boolean;
  families: string[];
}
interface Rule {
  code: string;
  description: string;
  severity: "warn" | "block";
  active: boolean;
  fixed: boolean;
  tolerance: number | null;
  parameter: string | null;
  unit: string | null;
  low: number | null;
  high: number | null;
}
interface Formula {
  id: string;
  parameter: string;
  name: string;
  basis: string;
  version: number;
  expression: string;
  inputs: string[];
  validFrom: string;
  status: string;
}

const useSummary = () =>
  useQuery({
    queryKey: ["config-summary"],
    queryFn: () => api<Summary>("/config/summary"),
  });
const useConfigList = <T,>(key: string, enabled = true) =>
  useQuery({
    queryKey: ["config", key],
    queryFn: () => api<{ items: T[] }>(`/config/${key}`).then((r) => r.items),
    enabled,
  });
const KEYS = ["config", "config-summary"];
const num = (v: string) => (v.trim() === "" ? null : Number(v));
const range = (lo: number | null, hi: number | null, unit?: string | null) =>
  lo == null && hi == null
    ? "None"
    : `${lo ?? "…"} to ${hi ?? "…"}${unit ? ` ${unit}` : ""}`;

/* ======================= hub ======================= */
export function Config() {
  const { section } = useParams();
  const nav = useNavigate();
  const bp = useBreakpoint();
  const current = SECTIONS.find((s) => s.id === section) ?? null;
  const [q, setQ] = useState("");
  const [sp] = useSearchParams();
  const summary = useSummary();
  const phoneEdit =
    bp === "phone" &&
    sp.has("edit") &&
    (current?.id === "laboratory" || current?.id === "security");
  const sectionList = (
    <nav className="cfg-list" aria-label="Configuration sections">
      {(["LAB DATA", "DOCUMENTS", "SYSTEM"] as const).map((g) => (
        <div key={g} className="col" style={{ gap: 2 }}>
          <span className="navgroup static-label">{g}</span>
          {SECTIONS.filter((s) => s.group === g).map((s) => (
            <Link
              key={s.id}
              to={`/config/${s.id}`}
              className={cx("mi", current?.id === s.id && "on")}
              onClick={() => setQ("")}
            >
              <span className="grow">{s.title}</span>
              {s.count && summary.data && (
                <span className="t-sm c-mut">{summary.data.counts[s.count]}</span>
              )}
            </Link>
          ))}
        </div>
      ))}
      <div className="col" style={{ gap: 2 }}>
        <span className="navgroup static-label">NEXT GOAL</span>
        {NEXT_GOAL.map((t) => (
          <span key={t} className="mi dis">
            <span className="grow">{t}</span>
            <Tag label="Next goal" tone="muted" />
          </span>
        ))}
      </div>
    </nav>
  );
  const body = q ? (
    <SearchResults
      q={q}
      onOpen={(id) => {
        setQ("");
        nav(`/config/${id}`);
      }}
    />
  ) : current ? (
    <SectionBody s={current} />
  ) : (
    <Overview summary={summary.data} />
  );
  if (phoneEdit && current)
    return (
      <div className="page">
        <nav className="crumb" aria-label="Breadcrumb">
          <Link to="/config">Configuration</Link>
          <Icon n="caret-right" />
          <Link to={`/config/${current.id}`}>{current.title}</Link>
          <Icon n="caret-right" />
          <b>Edit</b>
        </nav>
        <h1 className="t-display">{current.title}</h1>
        {body}
      </div>
    );
  return (
    <div className="page">
      <div className="page-head">
        <div className="tt">
          <span className="t-over">Admin</span>
          <h1 className="t-display">Configuration</h1>
        </div>
        {bp !== "phone" && (
          <Search
            id="cfg-q"
            value={q}
            onChange={setQ}
            placeholder="Search settings"
            width={340}
          />
        )}
      </div>
      {bp === "phone" ? (
        current ? (
          <>
            <nav className="crumb" aria-label="Breadcrumb">
              <Link to="/config">Configuration</Link>
              <Icon n="caret-right" />
              <b>{current.title}</b>
            </nav>
            {body}
          </>
        ) : (
          <>
            {body}
            <NextGoal />
          </>
        )
      ) : bp === "tablet" ? (
        <>
          {current && (
            <Select
              label="Section"
              value={current.id}
              onChange={(v) => nav(v ? `/config/${v}` : "/config")}
              width="100%"
              options={[
                ["", "Overview"],
                ...SECTIONS.map((s) => [s.id, s.title] as [string, string]),
              ]}
            />
          )}
          {body}
          {!current && !q && <NextGoal />}
        </>
      ) : (
        <div className="cfg-grid">
          <Card className="cfg-side" title="Sections">
            {sectionList}
          </Card>
          <div className="col g16" style={{ minWidth: 0 }}>
            {body}
          </div>
        </div>
      )}
    </div>
  );
}

function Overview({ summary }: { summary: Summary | undefined }) {
  const last = (id: SectionId) => {
    const l =
      id === "laboratory"
        ? [summary?.lastChanged.laboratory, summary?.lastChanged.numbering]
            .filter(Boolean)
            .sort((a, b) => (a!.at < b!.at ? 1 : -1))[0]
        : summary?.lastChanged[id];
    return l ? (
      <span className="row g6 wrap t-cap">
        <span className="c-mut">Last changed {fmtDate(l.at)}</span>
        {l.by && <span className="c-brand w6">{l.by}</span>}
      </span>
    ) : (
      <span className="t-cap c-mut">Not changed yet</span>
    );
  };
  return (
    <div className="cfg-overview">
      {SECTIONS.map((s) => (
        <Link key={s.id} to={`/config/${s.id}`} className="mcard ov-card">
          <div className="row between g8">
            <h2 className="t-h3" style={{ margin: 0 }}>
              {s.title}
            </h2>
            {s.count && summary ? (
              <span className="cpill">{summary.counts[s.count]}</span>
            ) : null}
          </div>
          <span className="t-sm c-sec">{s.text}</span>
          {last(s.id)}
        </Link>
      ))}
    </div>
  );
}

/** Tablet and phone overview: what comes next, under the cards. */
function NextGoal() {
  return (
    <div className="cfg-next">
      <b className="t-sm w6">Next goal</b>
      <span className="t-sm c-sec">{NEXT_GOAL.join(", ")}</span>
    </div>
  );
}

function SectionBody({ s }: { s: Section }) {
  const phone = useBreakpoint() === "phone",
    editable = !phone;
  switch (s.id) {
    case "parameters":
      return <Parameters editable={editable} />;
    case "services":
      return <Services editable={editable} />;
    case "methods":
      return <Methods editable={editable} />;
    case "templates":
      return <Templates editable={editable} />;
    case "rules":
      return <Rules editable={editable} phone={phone} />;
    case "lookups":
      return <Lookups editable={editable} phone={phone} />;
    case "laboratory":
      return <LaboratorySettings phone={phone} />;
    case "security":
      return <SecuritySettings phone={phone} />;
    case "formulas":
      return <Formulas phone={phone} />;
    default:
      return null;
  }
}

/* search across sections, parameters, lookup values and rules */
interface MethodHit {
  id: string;
  parameterCode: string;
  parameterLabel: string;
  family: "ASTM" | "ISO" | "GBT";
  methodCode: string;
  edition: string;
}
const FAMILY_TEXT = { ASTM: "ASTM", ISO: "ISO", GBT: "GB/T" } as const;
function SearchResults({
  q,
  onOpen,
}: {
  q: string;
  onOpen: (id: SectionId) => void;
}) {
  const params = useConfigList<Param>("parameters"),
    lookups = useConfigList<Lookup>("lookups"),
    rules = useConfigList<Rule>("rules"),
    methods = useConfigList<MethodHit>("methods");
  const t = q.toLowerCase(),
    hit = (...v: Array<string | null | undefined>) =>
      v.some((x) => x?.toLowerCase().includes(t));
  const groups: Array<[SectionId, string, Array<[string, string]>]> = [
    [
      "parameters",
      "Parameters",
      (params.data ?? [])
        .filter((p) => hit(p.code, p.name, p.label))
        .map((p) => [
          p.name,
          [p.category, p.unit, p.measuredBasis ? BASIS[p.measuredBasis] : null]
            .filter(Boolean)
            .join(", "),
        ]),
    ],
    [
      "rules",
      "Validation rules",
      (rules.data ?? [])
        .filter((r) => hit(r.code, r.description, r.parameter))
        .map((r) => [
          `${r.code} ${r.description}`,
          `${r.severity === "block" ? "Block" : "Warn"}${r.fixed ? ", fixed" : ""}`,
        ]),
    ],
    [
      "methods",
      "Methods and standards",
      (methods.data ?? [])
        .filter((m) => hit(m.parameterCode, m.parameterLabel, m.methodCode))
        .map((m) => [
          `${FAMILY_TEXT[m.family]} ${m.methodCode}-${m.edition} ${m.parameterLabel}`,
          FAMILY_TEXT[m.family],
        ]),
    ],
    [
      "lookups",
      "Lookups",
      (lookups.data ?? [])
        .filter((l) => hit(l.value, LIST_LABEL[l.listKey]))
        .map((l) => [l.value, LIST_LABEL[l.listKey] ?? l.listKey]),
    ],
  ];
  const sections = SECTIONS.filter((s) => hit(s.title, s.text));
  const shown = groups.filter((g) => g[2].length);
  const found =
    sections.length + shown.reduce((n, g) => n + g[2].length, 0);
  const n = shown.length + (sections.length ? 1 : 0);
  const row = (key: string, name: string, detail: string, id: SectionId) => (
    <button key={key} type="button" className="lrow" style={{ alignItems: "center" }} onClick={() => onOpen(id)}>
      <span className="t-sm w6 grow" style={{ minWidth: 0 }}>
        {name}
      </span>
      <span className="t-sm c-sec">{detail}</span>
    </button>
  );
  return (
    <div className="col g12">
      <span className="t-sm c-sec">
        {found
          ? `${found} ${found === 1 ? "result" : "results"} for "${q}" in ${n} ${n === 1 ? "section" : "sections"}`
          : `Nothing matches "${q}". Try a code such as Ash or TM.`}
      </span>
      {sections.length > 0 && (
        <Card title="Sections" count={sections.length}>
          <div className="col">
            {sections.map((s) => row(s.id, s.title, s.text, s.id))}
          </div>
        </Card>
      )}
      {shown.map(([id, title, items]) => (
        <Card key={id} title={title} count={items.length}>
          <div className="col">
            {items.slice(0, 8).map(([name, detail], i) => row(`${i}`, name, detail, id))}
          </div>
          {items.length > 8 && (
            <span className="t-cap c-mut">and {items.length - 8} more</span>
          )}
        </Card>
      ))}
    </div>
  );
}

/* ======================= settings pages ======================= */
/* FigCraft *-14-Configuration-08-Laboratory and -09-Security: cards of fields with one Restore defaults and Save under them.
   The phone shows a read view (label, value, chevron per row); a tapped row opens the edit page (…-02-Edit): breadcrumb
   "Configuration > Section > Edit", one card with the groups, Restore defaults, then Cancel and Save in the bottom bar. */
interface SettingsData<T> {
  value: T;
  defaults: T;
  updatedAt: string | null;
}
type Vals = Record<string, Record<string, unknown>>;
function useSettingsForm(keys: string[], title: string, onSaved?: () => void) {
  const qs = useQueries({
    queries: keys.map((k) => ({
      queryKey: ["config", "settings", k],
      queryFn: () =>
        api<SettingsData<Record<string, unknown>>>(`/config/settings/${k}`),
    })),
  });
  const [draft, setDraft] = useState<Vals>({}),
    [err, setErr] = useState<Record<string, string>>({});
  const ready = qs.every((q) => q.data);
  const saved: Vals = Object.fromEntries(
    keys.map((k, i) => [k, qs[i]!.data?.value ?? {}]),
  );
  const v: Vals = Object.fromEntries(
    keys.map((k) => [k, draft[k] ?? saved[k]!]),
  );
  const dirty = keys.filter(
    (k) => draft[k] && JSON.stringify(draft[k]) !== JSON.stringify(saved[k]),
  );
  const save = useSave(
    async () => {
      for (const k of dirty)
        await api(`/config/settings/${k}`, { method: "PUT", json: v[k] });
    },
    {
      keys: KEYS,
      done: `${title} saved`,
      onDone: () => {
        setDraft({});
        setErr({});
        onSaved?.();
      },
      onField: (f, text) => setErr({ [f ?? "form"]: text }),
    },
  );
  return {
    ready,
    v,
    err,
    dirty: dirty.length > 0,
    set: (k: string, p: Record<string, unknown>) =>
      setDraft((d) => ({ ...d, [k]: { ...(d[k] ?? saved[k]), ...p } })),
    restore: () =>
      setDraft(
        Object.fromEntries(keys.map((k, i) => [k, qs[i]!.data!.defaults])),
      ),
    cancel: () => {
      setDraft({});
      setErr({});
    },
    save,
  };
}
type SettingsForm = ReturnType<typeof useSettingsForm>;

/** Phone edit mode of a settings page lives in the URL (?edit), so the breadcrumb and Back work. */
function useEditMode() {
  const [sp, setSp] = useSearchParams();
  return {
    editing: sp.has("edit"),
    open: () => setSp({ edit: "" }),
    close: () => setSp({}),
  };
}

const Group = ({
  title,
  phone,
  children,
}: {
  title: string;
  phone: boolean;
  children: ReactNode;
}) =>
  phone ? (
    <div className="col g16">
      <h2 className="t-h3">{title}</h2>
      {children}
    </div>
  ) : (
    <Card title={title}>{children}</Card>
  );

/** The form part: cards on desktop and tablet, one card with dividers on the phone edit page. */
function SettingsEdit({
  f,
  id,
  phone,
  groups,
  onCancel,
}: {
  f: SettingsForm;
  id: string;
  phone: boolean;
  groups: Array<[string, ReactNode]>;
  onCancel: () => void;
}) {
  const restore = (
    <Button type="ghost" size="lg" onClick={f.restore}>
      Restore defaults
    </Button>
  );
  const save = (
    <Button
      type="primary"
      size={phone ? "touch" : "lg"}
      id={`save-${id}`}
      disabled={!f.dirty || f.save.isPending}
      why="Nothing changed"
      onClick={() => f.save.mutate(undefined)}
    >
      Save
    </Button>
  );
  const alert = f.err.form && <Alert tone="error" title={f.err.form} />;
  if (!phone)
    return (
      <>
        {groups.map(([t, body]) => (
          <Group key={t} title={t} phone={false}>
            {body}
          </Group>
        ))}
        {alert}
        <div className="row g10 end">
          {restore}
          {save}
        </div>
      </>
    );
  return (
    <>
      <Card>
        {groups.map(([t, body], i) => (
          <div key={t} className="col g16">
            {i > 0 && <div className="mdiv" />}
            <Group title={t} phone>
              {body}
            </Group>
          </div>
        ))}
        {alert}
        <div className="row" style={{ justifyContent: "center" }}>
          {restore}
        </div>
      </Card>
      <div className="sticky-bar">
        <Button
          size="touch"
          onClick={() => {
            f.cancel();
            onCancel();
          }}
        >
          Cancel
        </Button>
        {save}
      </div>
    </>
  );
}

/** Phone read view: one card per group, a row per setting (label, value, chevron) that opens the edit page. */
function SettingsRead({
  groups,
  onEdit,
}: {
  groups: Array<[string, Array<[string, ReactNode]>, ReactNode?]>;
  onEdit: () => void;
}) {
  return (
    <>
      {groups.map(([t, rows, foot]) => (
        <Card key={t} title={t}>
          <div className="col">
            {rows.map(([k, val]) => (
              <button
                key={k}
                type="button"
                className="lrow plain"
                style={{ alignItems: "center" }}
                onClick={onEdit}
              >
                <span className="col grow" style={{ gap: 2, minWidth: 0 }}>
                  <span className="t-sm c-mut">{k}</span>
                  <span className="t-sm">{val}</span>
                </span>
                <span className="c-mut" style={{ display: "inline-flex" }}>
                  <Icon n="caret-right" />
                </span>
              </button>
            ))}
          </div>
          {foot}
        </Card>
      ))}
    </>
  );
}

const NumField = ({
  id,
  label,
  value,
  onChange,
  err,
  help,
  unit,
}: {
  id: string;
  label: string;
  value: number;
  onChange: (n: number) => void;
  err?: string | undefined;
  help?: string;
  unit?: string;
}) => (
  <TextField
    id={id}
    label={unit ? `${label} (${unit})` : label}
    type="number"
    value={String(value)}
    onChange={(t) => onChange(t === "" ? NaN : Number(t))}
    error={err ?? null}
    {...(help ? { help } : {})}
  />
);
const Loading = () => (
  <Card>
    <span className="t-sm c-mut">Loading…</span>
  </Card>
);

interface SecurityV extends Record<string, unknown> {
  lock_after_attempts: number;
  lock_minutes: number;
  idle_sign_out_minutes: number;
  warn_before_seconds: number;
  min_password_length: number;
  require_letter_and_number: boolean;
  require_special_character: boolean;
  forbid_email_in_password: boolean;
  reset_link_minutes: number;
  invite_days: number;
}
function SecuritySettings({ phone }: { phone: boolean }) {
  const mode = useEditMode();
  const f = useSettingsForm(["security"], "Security", mode.close);
  if (!f.ready) return <Loading />;
  const v = f.v.security as SecurityV,
    e = f.err,
    set = (p: Partial<SecurityV>) => f.set("security", p);
  const req = (b: boolean) => (b ? "Required" : "Not required");
  if (phone && !mode.editing)
    return (
      <SettingsRead
        onEdit={mode.open}
        groups={[
          [
            "Sign-in",
            [
              ["Lock after failed attempts", v.lock_after_attempts],
              ["Lock for", `${v.lock_minutes} minutes`],
            ],
          ],
          [
            "Session",
            [
              ["Sign out after inactivity", `${v.idle_sign_out_minutes} minutes`],
              ["Warn before", `${v.warn_before_seconds} seconds`],
            ],
          ],
          [
            "Passwords",
            [
              ["Minimum length", `${v.min_password_length} characters`],
              ["A letter and a number", req(v.require_letter_and_number)],
              ["Not the email", req(v.forbid_email_in_password)],
              ["A special character", req(v.require_special_character)],
            ],
          ],
          [
            "Links",
            [
              ["Reset link valid", `${v.reset_link_minutes} minutes`],
              ["Invite valid", `${v.invite_days} days`],
            ],
          ],
        ]}
      />
    );
  return (
    <SettingsEdit
      f={f}
      id="security"
      phone={phone}
      onCancel={mode.close}
      groups={[
        [
          "Sign-in",
          <div className="cfg-form">
            <NumField
              id="sec-lock"
              label="Lock after failed attempts"
              value={v.lock_after_attempts}
              onChange={(n) => set({ lock_after_attempts: n })}
              err={e.lock_after_attempts}
              help="3 to 10"
            />
            <NumField
              id="sec-lockmin"
              label="Lock for"
              unit="minutes"
              value={v.lock_minutes}
              onChange={(n) => set({ lock_minutes: n })}
              err={e.lock_minutes}
            />
          </div>,
        ],
        [
          "Session",
          <div className="cfg-form">
            <NumField
              id="sec-idle"
              label="Sign out after inactivity"
              unit="minutes"
              value={v.idle_sign_out_minutes}
              onChange={(n) => set({ idle_sign_out_minutes: n })}
              err={e.idle_sign_out_minutes}
            />
            <NumField
              id="sec-warn"
              label="Warn before"
              unit="seconds"
              value={v.warn_before_seconds}
              onChange={(n) => set({ warn_before_seconds: n })}
              err={e.warn_before_seconds}
            />
          </div>,
        ],
        [
          "Passwords",
          <>
            <div className="cfg-form">
              <NumField
                id="sec-pwlen"
                label="Minimum length"
                value={v.min_password_length}
                onChange={(n) => set({ min_password_length: n })}
                err={e.min_password_length}
                help="8 to 64 characters"
              />
            </div>
            <div className="col g10">
              <Check
                id="sec-letnum"
                on={v.require_letter_and_number}
                onChange={(b) => set({ require_letter_and_number: b })}
                label="A letter and a number"
              />
              <Check
                id="sec-noemail"
                on={v.forbid_email_in_password}
                onChange={(b) => set({ forbid_email_in_password: b })}
                label="Not the email"
              />
              <Check
                id="sec-special"
                on={v.require_special_character}
                onChange={(b) => set({ require_special_character: b })}
                label="A special character"
              />
            </div>
          </>,
        ],
        [
          "Links",
          <div className="cfg-form">
            <fieldset disabled className="bare">
              <TextField
                label="Reset link valid (minutes)"
                value={String(v.reset_link_minutes)}
                onChange={() => {}}
                help="Set in Supabase Auth"
              />
            </fieldset>
            <NumField
              id="sec-invite"
              label="Invite valid"
              unit="days"
              value={v.invite_days}
              onChange={(n) => set({ invite_days: n })}
              err={e.invite_days}
            />
          </div>,
        ],
      ]}
    />
  );
}

interface LabV extends Record<string, unknown> {
  name: string;
  address: string;
  accreditation: string;
  place_of_issue: string;
  branches: Array<{ code: string; name: string }>;
}
interface NumberingV extends Record<string, unknown> {
  job_order: string;
  batch: string;
  sample_id: string;
  sample_code: string;
  coa: string;
  sample_no_width: number;
}
const PATTERNS: Array<[string, string, keyof NumberingV, string]> = [
  ["num-jo", "Job order", "job_order", "JO-2026-0142"],
  ["num-batch", "Batch", "batch", "B-2026-0318"],
  ["num-sid", "Sample ID", "sample_id", "SG.260901.001.RI.001"],
  ["num-scode", "Sample code", "sample_code", "001.RI.001.Lot01"],
  ["num-coa", "CoA", "coa", "CoA-JO-2026-0142-1"],
];
const NUM_HELP = "New numbers follow the pattern; existing numbers never change.";
const TOKENS = (
  <span className="t-cap c-mut">
    Tokens: {"{YYYY} {YY} {MM} {DD} {YYMMDD}"} date; {"{NNNN} {NNN} {NN}"}{" "}
    running number; {"{CCC}"} company code; {"{BB}"} branch office;{" "}
    {"{LOT}"} lot; {"{job_order} {revision}"} for the CoA.
  </span>
);
/* Laboratory, Numbering and Branch offices: two settings (laboratory, numbering) saved together. The logo is not built yet. */
function LaboratorySettings({ phone }: { phone: boolean }) {
  const mode = useEditMode();
  const f = useSettingsForm(["laboratory", "numbering"], "Laboratory", mode.close);
  if (!f.ready) return <Loading />;
  const lab = f.v.laboratory as LabV,
    nb = f.v.numbering as NumberingV,
    e = f.err,
    setLab = (p: Partial<LabV>) => f.set("laboratory", p),
    setNb = (p: Partial<NumberingV>) => f.set("numbering", p);
  if (phone && !mode.editing)
    return (
      <SettingsRead
        onEdit={mode.open}
        groups={[
          [
            "Laboratory",
            [
              ["Laboratory name", lab.name],
              ["Address", lab.address || "Not set"],
              ["Accreditation number", lab.accreditation || "Not set"],
              ["Place of issue", lab.place_of_issue],
            ],
          ],
          [
            "Numbering",
            [
              ...PATTERNS.map(
                ([, label, k]) => [label, String(nb[k])] as [string, ReactNode],
              ),
              ["Sample ID running number", `${nb.sample_no_width} digits`],
            ],
            <span className="t-sm c-sec">{NUM_HELP}</span>,
          ],
          [
            "Branch offices",
            lab.branches.map((b) => [b.code, b.name] as [string, ReactNode]),
          ],
        ]}
      />
    );
  const branches = (
    <>
      <div className="col g8">
        {lab.branches.map((b, i) => (
          <div key={i} className="row top g8">
            <div style={{ width: 90 }}>
              <TextField
                label={`Code ${i + 1}`}
                value={b.code}
                onChange={(t) =>
                  setLab({
                    branches: lab.branches.map((x, j) =>
                      j === i ? { ...x, code: t.toUpperCase().slice(0, 2) } : x,
                    ),
                  })
                }
              />
            </div>
            <div className="grow">
              <TextField
                label={`Office ${i + 1}`}
                value={b.name}
                onChange={(t) =>
                  setLab({
                    branches: lab.branches.map((x, j) =>
                      j === i ? { ...x, name: t } : x,
                    ),
                  })
                }
              />
            </div>
            {lab.branches.length > 1 && (
              <div style={{ paddingTop: 24 }}>
                <Button
                  icon="trash"
                  onClick={() =>
                    setLab({ branches: lab.branches.filter((_, j) => j !== i) })
                  }
                >
                  Remove
                </Button>
              </div>
            )}
          </div>
        ))}
        <div className="row">
          <Button
            icon="plus"
            onClick={() =>
              setLab({ branches: [...lab.branches, { code: "", name: "" }] })
            }
          >
            Add branch office
          </Button>
        </div>
      </div>
      {e.branches && <span className="help err">{e.branches}</span>}
      <span className="t-sm c-sec">
        The two-letter code goes into the Sample ID, for example RI for Rapak
        Indah. A batch belongs to one branch.
      </span>
    </>
  );
  return (
    <SettingsEdit
      f={f}
      id="laboratory"
      phone={phone}
      onCancel={mode.close}
      groups={[
        [
          "Laboratory",
          <>
            <TextField
              id="lab-name"
              label="Laboratory name"
              req
              value={lab.name}
              onChange={(t) => setLab({ name: t })}
              error={e.name ?? null}
            />
            <TextArea
              id="lab-address"
              label="Address"
              value={lab.address}
              onChange={(t) => setLab({ address: t })}
            />
            <div className="cfg-form">
              <TextField
                id="lab-accr"
                label="Accreditation number"
                value={lab.accreditation}
                onChange={(t) => setLab({ accreditation: t })}
              />
              <TextField
                id="lab-place"
                label="Place of issue"
                req
                value={lab.place_of_issue}
                onChange={(t) => setLab({ place_of_issue: t })}
                error={e.place_of_issue ?? null}
                help={`Printed as "Issued at ${lab.place_of_issue || "…"}"`}
              />
            </div>
          </>,
        ],
        [
          "Numbering",
          <>
            <div className="cfg-form">
              {PATTERNS.map(([id, label, k, example]) => (
                <TextField
                  key={id}
                  id={id}
                  label={label}
                  value={String(nb[k])}
                  onChange={(t) => setNb({ [k]: t } as Partial<NumberingV>)}
                  error={e[k as string] ?? null}
                  help={`For example ${example}`}
                />
              ))}
              <NumField
                id="num-width"
                label="Sample ID running number"
                unit="digits"
                value={nb.sample_no_width}
                onChange={(n) => setNb({ sample_no_width: n })}
                err={e.sample_no_width}
                help="3 allows 999 samples per client and day"
              />
            </div>
            <span className="t-sm c-sec">{NUM_HELP}</span>
            {TOKENS}
          </>,
        ],
        ["Branch offices", branches],
      ]}
    />
  );
}

/* ======================= lists ======================= */
/* FigCraft *-14-Configuration-07-Lookups-01-List: one card, a tab per list with its count, then Order, Value,
   Needs a remark, Status and Edit; the phone lists the values ("Order 1, needs a remark: No") and a tapped row opens the form. */
function Lookups({ editable, phone }: { editable: boolean; phone: boolean }) {
  const { data = [], isLoading } = useConfigList<Lookup>("lookups");
  const [form, setForm] = useState<Lookup | { listKey: string } | null>(null);
  const [tab, setTab] = useState("sample_condition");
  if (isLoading) return <Loading />;
  const keys = Object.keys(LIST_LABEL).filter(
    (k) =>
      data.some((l) => l.listKey === k) ||
      k === "not_received_reason" ||
      k === "sample_type",
  );
  const rows = data.filter((l) => l.listKey === tab);
  const yes = (b: boolean) => (b ? "Yes" : "No");
  const status = (l: Lookup) => (
    <Badge
      label={l.active ? "Active" : "Inactive"}
      tone={l.active ? "green" : "grey"}
      sm
    />
  );
  return (
    <>
      <Card
        title="Lookups"
        count={keys.length}
        actions={
          (editable || phone) && (
            <Button
              icon="plus"
              id={`add-${tab}`}
              onClick={() => setForm({ listKey: tab })}
            >
              Add value
            </Button>
          )
        }
      >
        <Tabs
          items={keys.map((k) => ({
            id: k,
            label: LIST_LABEL[k]!,
            count: data.filter((l) => l.listKey === k).length,
          }))}
          value={tab}
          onChange={setTab}
        />
        {!rows.length ? (
          <span className="t-sm c-mut">No values yet.</span>
        ) : phone ? (
          <div className="col">
            {rows.map((l) => (
              <button
                key={l.id}
                type="button"
                className="lrow"
                style={{ alignItems: "center" }}
                onClick={() => setForm(l)}
              >
                <span className="col grow" style={{ gap: 2, minWidth: 0 }}>
                  <b className="t-sm w6">{l.value}</b>
                  <span className="t-sm c-sec">
                    Order {l.sortOrder}, needs a remark: {yes(l.needsRemark)}
                  </span>
                </span>
                {status(l)}
                <span className="c-mut" style={{ display: "inline-flex" }}>
                  <Icon n="caret-right" />
                </span>
              </button>
            ))}
          </div>
        ) : (
          <Table
            rows={rows}
            keyOf={(l) => l.id}
            cols={[
              { h: "Order", render: (l) => <span className="c-mut">{l.sortOrder}</span> },
              { h: "Value", render: (l) => <b className="t-sm w6">{l.value}</b> },
              { h: "Needs a remark", render: (l) => yes(l.needsRemark) },
              { h: "Status", render: status },
              editable && {
                h: "",
                cls: "r",
                render: (l) => (
                  <Button type="ghost" size="sm" onClick={() => setForm(l)}>
                    Edit
                  </Button>
                ),
              },
            ]}
          />
        )}
      </Card>
      {form && (
        <LookupForm item={form} phone={phone} onClose={() => setForm(null)} />
      )}
    </>
  );
}
function LookupForm({
  item,
  phone,
  onClose,
}: {
  item: Lookup | { listKey: string };
  phone?: boolean;
  onClose: () => void;
}) {
  const existing = "id" in item ? item : null;
  const [f, setF] = useState({
    value: existing?.value ?? "",
    needsRemark: existing?.needsRemark ?? false,
    sortOrder: String(existing?.sortOrder ?? 0),
    active: existing?.active ?? true,
  });
  const [err, setErr] = useState<Record<string, string>>({});
  const save = useSave(
    () =>
      api(existing ? `/config/lookups/${existing.id}` : "/config/lookups", {
        method: existing ? "PATCH" : "POST",
        json: {
          listKey: item.listKey,
          value: f.value,
          needsRemark: f.needsRemark,
          sortOrder: Number(f.sortOrder) || 0,
          active: f.active,
        },
      }),
    {
      keys: KEYS,
      done: `${f.value} saved`,
      onDone: onClose,
      onField: (k, t) => setErr({ [k ?? "form"]: t }),
    },
  );
  const submit = () => {
    if (!f.value.trim()) return setErr({ value: "Enter the value." });
    setErr({});
    save.mutate(undefined);
  };
  return (
    <Dialog
      title={existing ? "Edit value" : "Add value"}
      sub={LIST_LABEL[item.listKey]}
      phone={phone}
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            type="primary"
            id="lk-save"
            disabled={save.isPending}
            onClick={submit}
          >
            Save
          </Button>
        </>
      }
    >
      <TextField
        id="lk-value"
        label="Value"
        req
        value={f.value}
        onChange={(t) => setF({ ...f, value: t })}
        error={err.value ?? null}
      />
      <TextField
        label="Order"
        type="number"
        value={f.sortOrder}
        onChange={(t) => setF({ ...f, sortOrder: t })}
        help="Lists sort by this number, then by name."
      />
      <Switch
        on={f.needsRemark}
        onChange={(b) => setF({ ...f, needsRemark: b })}
        label="Needs a remark when chosen"
      />
      <Switch
        id="lk-active"
        on={f.active}
        onChange={(b) => setF({ ...f, active: b })}
        label="Active (inactive values stay on old records but cannot be picked)"
      />
      {err.form && <span className="help err">{err.form}</span>}
    </Dialog>
  );
}

/* one card: title with the count and Add parameter, search, group chips, then 10 rows a page (FigCraft
   Desktop-, Tablet- and Phone-14-Configuration-02-Parameters-01-List). Tablet shows Code, Name, Group and Methods;
   the phone lists code and name with group, unit and basis, and a tapped row opens the edit form. The phone also has
   the search, Add parameter and the group chips, on one line that scrolls sideways (owner, Nov 13 2026). */
function Parameters({ editable }: { editable: boolean }) {
  const bp = useBreakpoint();
  const phone = bp === "phone",
    tablet = bp === "tablet";
  const { data = [], isLoading } = useConfigList<Param>("parameters");
  const [q, setQ] = useState(""),
    [cat, setCat] = useState("all"),
    [form, setForm] = useState<Param | "new" | null>(null);
  const items = useMemo(() => data.filter((p) => !p.isGroup), [data]);
  const cats = useMemo(() => [...new Set(items.map((p) => p.category))], [items]);
  const base = items.filter(
    (p) =>
      !q ||
      `${p.code} ${p.name} ${p.label}`.toLowerCase().includes(q.toLowerCase()),
  );
  const rows = base.filter((p) => cat === "all" || p.category === cat);
  const pg = usePaged(rows, 10, q + cat);
  if (isLoading)
    return (
      <Card>
        <span className="t-sm c-mut">Loading…</span>
      </Card>
    );
  const status = (p: Param) => (
    <Badge
      label={p.active ? "Active" : "Inactive"}
      tone={p.active ? "green" : "grey"}
      sm
    />
  );
  const methods = (p: Param) => (
    <span className="row g4" style={{ flexWrap: "nowrap" }}>
      {p.families.map((f) => (
        <Tag key={f} label={f} />
      ))}
    </span>
  );
  const edit = editable && {
    h: "",
    cls: "r",
    render: (p: Param) => (
      <Button type="ghost" size="sm" onClick={() => setForm(p)}>
        Edit
      </Button>
    ),
  };
  const code = { h: "Code", render: (p: Param) => <b className="t-data-b">{p.code}</b> };
  const name = { h: "Name", render: (p: Param) => <span className="t-sm">{p.name}</span> };
  const group = { h: "Group", render: (p: Param) => p.category };
  const cols = tablet
    ? [code, name, group, { h: "Methods", render: methods }, edit]
    : [
        code,
        name,
        { h: "Unit", render: (p: Param) => p.unit ?? "" },
        group,
        {
          h: "Basis",
          render: (p: Param) => (p.measuredBasis ? BASIS[p.measuredBasis] : ""),
        },
        { h: "Decimals", cls: "r", render: (p: Param) => p.decimals },
        { h: "Methods", render: methods },
        {
          h: "Typical range",
          render: (p: Param) => (
            <span className="t-sm">{range(p.typicalLow, p.typicalHigh)}</span>
          ),
        },
        { h: "Status", render: status },
        edit,
      ];
  return (
    <>
      <Card
        title="Parameters"
        count={items.length}
        actions={
          (editable || phone) && (
            <Button icon="plus" id="add-param" onClick={() => setForm("new")}>
              Add parameter
            </Button>
          )
        }
      >
        <Search
          id="pa-q"
          value={q}
          onChange={setQ}
          placeholder="Search code or name"
          width={phone ? "100%" : 300}
        />
        <Chips
          scroll={phone}
          value={cat}
          onChange={setCat}
          items={[
            { id: "all", label: "All", count: base.length },
            ...cats.map((c) => ({
              id: c,
              label: c,
              count: base.filter((p) => p.category === c).length,
            })),
          ]}
        />
        {phone ? (
          <>
            <div className="col">
              {pg.rows.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className="lrow"
                  onClick={() => setForm(p)}
                >
                  <span className="col grow" style={{ gap: 2, minWidth: 0 }}>
                    <span className="row g8 t-sm w6">
                      <span className="t-data-b">{p.code}</span>
                      <span>{p.name}</span>
                    </span>
                    <span className="t-sm c-sec">
                      {[
                        p.category,
                        p.unit || "—",
                        p.measuredBasis ? BASIS[p.measuredBasis] : "—",
                      ].join(", ")}
                    </span>
                  </span>
                  {status(p)}
                </button>
              ))}
            </div>
            {!rows.length && <Empty icon="flask" title="No parameters match" />}
            <Pager {...pg.pager} compact />
          </>
        ) : (
          <>
            <Table
              rows={pg.rows}
              keyOf={(p) => p.id}
              cols={cols}
              empty={<Empty icon="flask" title="No parameters match" />}
            />
            <Pager {...pg.pager} />
          </>
        )}
      </Card>
      {form && (
        <ParamForm
          p={form === "new" ? null : form}
          cats={cats}
          defaultCategory={cat !== "all" ? cat : (cats[0] ?? "")}
          onClose={() => setForm(null)}
        />
      )}
    </>
  );
}
/** Edit a parameter, or add one when `p` is null (a sheet on the phone). */
function ParamForm({
  p,
  cats,
  defaultCategory,
  onClose,
}: {
  p: Param | null;
  cats: string[];
  defaultCategory: string;
  onClose: () => void;
}) {
  const phone = useBreakpoint() === "phone";
  const [f, setF] = useState({
    code: p?.code ?? "",
    name: p?.name ?? "",
    label: p?.label ?? "",
    category: p?.category ?? defaultCategory,
    unit: p?.unit ?? "",
    measuredBasis: p?.measuredBasis ?? "",
    decimals: String(p?.decimals ?? 2),
    allowsQualifier: p?.allowsQualifier ?? false,
    typicalLow: p?.typicalLow?.toString() ?? "",
    typicalHigh: p?.typicalHigh?.toString() ?? "",
    active: p?.active ?? true,
  });
  const [err, setErr] = useState<Record<string, string>>({});
  const set = (x: Partial<typeof f>) => setF({ ...f, ...x });
  const save = useSave(
    () =>
      api(p ? `/config/parameters/${p.id}` : "/config/parameters", {
        method: p ? "PATCH" : "POST",
        json: {
          code: f.code,
          name: f.name,
          label: f.label,
          category: f.category,
          unit: f.unit || null,
          measuredBasis: f.measuredBasis || null,
          decimals: Number(f.decimals),
          allowsQualifier: f.allowsQualifier,
          typicalLow: num(f.typicalLow),
          typicalHigh: num(f.typicalHigh),
          active: f.active,
        },
      }),
    {
      keys: KEYS,
      done: p ? `${f.code} saved` : `${f.code} added`,
      onDone: onClose,
      onField: (k, t) => setErr({ [k ?? "form"]: t }),
    },
  );
  const submit = () => {
    const e: Record<string, string> = {};
    if (!f.code.trim()) e.code = "Enter the code.";
    if (!f.label.trim()) e.label = "Enter the label.";
    if (!f.name.trim()) e.name = "Enter the name.";
    if (!/^\d$/.test(f.decimals)) e.decimals = "0 to 6.";
    const lo = num(f.typicalLow),
      hi = num(f.typicalHigh);
    if (
      (f.typicalLow && Number.isNaN(lo)) ||
      (f.typicalHigh && Number.isNaN(hi))
    )
      e.typicalHigh = "Use numbers.";
    else if (lo != null && hi != null && lo >= hi)
      e.typicalHigh = "The low end must be below the high end.";
    setErr(e);
    if (!Object.keys(e).length) save.mutate(undefined);
  };
  return (
    <Dialog
      title={p ? `Edit ${p.code}` : "Add parameter"}
      sub={p?.name}
      phone={phone}
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            type="primary"
            id="pa-save"
            disabled={save.isPending}
            onClick={submit}
          >
            Save
          </Button>
        </>
      }
    >
      <div className="cfg-form">
        <TextField
          id="pa-code"
          label="Code"
          req
          value={f.code}
          onChange={(t) => set({ code: t })}
          error={err.code ?? null}
          {...(p?.inUse ? { help: "In use, so the code is locked." } : {})}
        />
        <TextField
          id="pa-label"
          label="Label"
          req
          value={f.label}
          onChange={(t) => set({ label: t })}
          error={err.label ?? null}
          help="Shown on pills and column heads."
        />
        <TextField
          id="pa-name"
          label="Name"
          req
          value={f.name}
          onChange={(t) => set({ name: t })}
          error={err.name ?? null}
        />
        <Select
          label="Group"
          value={f.category}
          onChange={(v) => set({ category: v })}
          options={cats.map((c) => [c, c] as [string, string])}
        />
        <TextField
          label="Unit"
          value={f.unit}
          onChange={(t) => set({ unit: t })}
        />
        <Select
          label="Measured basis"
          value={f.measuredBasis}
          onChange={(v) => set({ measuredBasis: v })}
          options={[["", "None"], ...Object.entries(BASIS)]}
        />
        <TextField
          id="pa-dec"
          label="Decimals"
          type="number"
          value={f.decimals}
          onChange={(t) => set({ decimals: t })}
          error={err.decimals ?? null}
        />
        <div />
        <TextField
          id="pa-lo"
          label="Typical range, low"
          type="number"
          value={f.typicalLow}
          onChange={(t) => set({ typicalLow: t })}
        />
        <TextField
          id="pa-hi"
          label="Typical range, high"
          type="number"
          value={f.typicalHigh}
          onChange={(t) => set({ typicalHigh: t })}
          error={err.typicalHigh ?? null}
          help="Values outside get a warning (V-31)."
        />
      </div>
      {p?.inUse && (
        <style>{`#pa-code { pointer-events: none; opacity: .6 }`}</style>
      )}
      <Switch
        on={f.allowsQualifier}
        onChange={(b) => set({ allowsQualifier: b })}
        label="Allows qualified values such as <0.01"
      />
      <Switch
        id="pa-active"
        on={f.active}
        onChange={(b) => set({ active: b })}
        label="Active (an inactive parameter cannot be picked on new job orders)"
      />
      {err.form && <span className="help err">{err.form}</span>}
    </Dialog>
  );
}

/* FigCraft *-14-Configuration-05-Validation_rules-01-List: one card with the count and the note; Rule, Applies to, Severity,
   Bounds, then Edit (a lock for fixed rules). The phone lists the code, what it applies to and the severity with the bounds
   under; a tapped row opens the form. */
function Rules({ editable, phone }: { editable: boolean; phone: boolean }) {
  const { data = [], isLoading } = useConfigList<Rule>("rules");
  const [form, setForm] = useState<Rule | null>(null);
  if (isLoading) return <Loading />;
  const bounds = (r: Rule) =>
    r.parameter
      ? range(r.low, r.high, r.unit)
      : r.tolerance != null
        ? `± ${r.tolerance}`
        : "Fixed check";
  const sev = (r: Rule) => (
    <Badge
      label={r.severity === "block" ? "Block" : "Warn"}
      tone={r.severity === "block" ? "red" : "amber"}
      sm
    />
  );
  const off = (r: Rule) => !r.active && <Tag label="Off" tone="muted" />;
  const lock = (
    <span
      className="c-mut"
      title="Fixed by the specification"
      aria-label="Fixed"
      style={{ display: "inline-flex", padding: "0 8px" }}
    >
      <Icon n="lock-simple" />
    </span>
  );
  return (
    <>
      <Card title="Validation rules" count={data.length}>
        <span className="t-sm c-sec">
          Fixed rules come from the specification and can't be changed here.
        </span>
        {phone ? (
          <div className="col">
            {data.map((r) => (
              <button
                key={r.code}
                type="button"
                className="lrow"
                style={{ alignItems: "center" }}
                disabled={r.fixed}
                onClick={() => setForm(r)}
              >
                <span className="col grow" style={{ gap: 2, minWidth: 0 }}>
                  <span className="row g8" style={{ minWidth: 0 }}>
                    <b className="t-data-b" style={{ flex: "none", whiteSpace: "nowrap" }}>
                      {r.code}
                    </b>
                    <span className="t-sm ellip">{r.description}</span>
                    {off(r)}
                  </span>
                  <span className="t-sm c-sec">{bounds(r)}</span>
                </span>
                {sev(r)}
                {r.fixed ? (
                  lock
                ) : (
                  <span className="c-mut" style={{ display: "inline-flex" }}>
                    <Icon n="caret-right" />
                  </span>
                )}
              </button>
            ))}
          </div>
        ) : (
          <Table
            rows={data}
            keyOf={(r) => r.code}
            cols={[
              { h: "Rule", render: (r) => <b className="t-data-b">{r.code}</b> },
              {
                h: "Applies to",
                render: (r) => (
                  <span className="row g8">
                    <span className="t-sm">{r.description}</span>
                    {off(r)}
                  </span>
                ),
              },
              { h: "Severity", render: sev },
              {
                h: "Bounds",
                render: (r) => <span className="t-sm">{bounds(r)}</span>,
              },
              editable && {
                h: "",
                cls: "r",
                render: (r) =>
                  r.fixed ? (
                    lock
                  ) : (
                    <Button type="ghost" size="sm" onClick={() => setForm(r)}>
                      Edit
                    </Button>
                  ),
              },
            ]}
          />
        )}
      </Card>
      {form && (
        <RuleForm r={form} phone={phone} onClose={() => setForm(null)} />
      )}
    </>
  );
}
function RuleForm({
  r,
  phone,
  onClose,
}: {
  r: Rule;
  phone?: boolean;
  onClose: () => void;
}) {
  const [f, setF] = useState({
    severity: r.severity,
    active: r.active,
    tolerance: r.tolerance?.toString() ?? "",
    low: r.low?.toString() ?? "",
    high: r.high?.toString() ?? "",
  });
  const [err, setErr] = useState<Record<string, string>>({});
  const save = useSave(
    () =>
      api(`/config/rules/${r.code}`, {
        method: "PATCH",
        json: {
          severity: f.severity,
          active: f.active,
          ...(r.tolerance != null ? { tolerance: Number(f.tolerance) } : {}),
          ...(r.parameter ? { low: num(f.low), high: num(f.high) } : {}),
        },
      }),
    {
      keys: KEYS,
      done: `${r.code} saved`,
      onDone: onClose,
      onField: (k, t) => setErr({ [k ?? "form"]: t }),
    },
  );
  const submit = () => {
    const lo = num(f.low),
      hi = num(f.high);
    if (r.parameter && lo != null && hi != null && lo >= hi)
      return setErr({ high: "The low end must be below the high end." });
    setErr({});
    save.mutate(undefined);
  };
  return (
    <Dialog
      title={`Edit ${r.code}`}
      sub={r.description}
      phone={phone}
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            type="primary"
            id="ru-save"
            disabled={save.isPending}
            onClick={submit}
          >
            Save
          </Button>
        </>
      }
    >
      <div className="field">
        <span className="flabel">Severity</span>
        <Seg
          label="Severity"
          items={[
            ["warn", "Warn"],
            ["block", "Block"],
          ]}
          value={f.severity}
          onChange={(v) => setF({ ...f, severity: v })}
        />
      </div>
      {r.tolerance != null && (
        <TextField
          id="ru-tol"
          label="Tolerance (%)"
          type="number"
          value={f.tolerance}
          onChange={(t) => setF({ ...f, tolerance: t })}
        />
      )}
      {r.parameter && (
        <div className="cfg-form">
          <TextField
            id="ru-lo"
            label={`Low${r.unit ? ` (${r.unit})` : ""}`}
            type="number"
            value={f.low}
            onChange={(t) => setF({ ...f, low: t })}
          />
          <TextField
            id="ru-hi"
            label={`High${r.unit ? ` (${r.unit})` : ""}`}
            type="number"
            value={f.high}
            onChange={(t) => setF({ ...f, high: t })}
            error={err.high ?? null}
          />
        </div>
      )}
      <Switch
        id="ru-active"
        on={f.active}
        onChange={(b) => setF({ ...f, active: b })}
        label="Active"
      />
      <span className="help">
        Block stops the value from being saved; Warn saves it with a flag.
      </span>
      {err.form && <span className="help err">{err.form}</span>}
    </Dialog>
  );
}

/* FigCraft *-14-Configuration-10-Formulas-01-View: one card with the count and the note; Name ("FC (ADB)"), Expression, Version,
   Used since. The phone shows each formula as a block. View only. */
function Formulas({ phone }: { phone: boolean }) {
  const { data = [], isLoading } = useConfigList<Formula>("formulas");
  if (isLoading) return <Loading />;
  const name = (f: Formula) => `${f.parameter} (${BASIS[f.basis] ?? f.basis})`;
  return (
    <Card title="Formulas" count={data.length}>
      <span className="t-sm c-sec">
        Formulas can't be edited in v1. A change comes as a new version with the
        release notes.
      </span>
      {phone ? (
        <div className="col">
          {data.map((f) => (
            <div key={f.id} className="lrow plain-cursor" style={{ flexDirection: "column", gap: 4 }}>
              <span className="row between g8" style={{ width: "100%" }}>
                <b className="t-sm w6">{name(f)}</b>
                <span className="t-sm c-sec">v{f.version}</span>
              </span>
              <code className="t-data">{f.expression}</code>
              <span className="t-cap c-mut">Used since {fmtDate(f.validFrom)}</span>
            </div>
          ))}
        </div>
      ) : (
        <Table
          rows={data}
          keyOf={(f) => f.id}
          cols={[
            { h: "Name", render: (f) => <b className="t-sm w6">{name(f)}</b> },
            {
              h: "Expression",
              render: (f) => <code className="t-data">{f.expression}</code>,
            },
            { h: "Version", render: (f) => `v${f.version}` },
            { h: "Used since", render: (f) => fmtDate(f.validFrom) },
          ]}
        />
      )}
    </Card>
  );
}
