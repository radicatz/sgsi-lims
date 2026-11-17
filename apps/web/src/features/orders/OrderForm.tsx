// New and Edit job order (Job_Order_Screen_Plan Revisions 7 to 12; FigCraft 03-Job_orders-02-New_job_order): a dialog on desktop and tablet,
// two full-screen steps on the phone. Company and contact, the standards, the parameter pills with their coverage, expected samples, due
// date, the default signatory and notes. Save as draft needs only the client; Submit needs the fields marked with a star.
import { useMemo, useRef, useState, type ReactNode } from "react";
import { useNavigate } from "react-router";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "../../app/api";
import {
  Alert,
  Button,
  Check,
  Confirm,
  Dialog,
  Icon,
  Search,
  Select,
  TextArea,
  TextField,
  cx,
  toast,
  toFrame,
  useEsc,
  useOutside,
} from "../../components";
import { useSave } from "../master-data/shared";
import { PendingFiles, sendPending } from "./Files";
import {
  CATALOGUE_KEY,
  STD_LABEL,
  todayIso,
  useCatalogue,
  type CatCompany,
  type CatContact,
  type CatItem,
  type CatParam,
  type Catalogue,
  type OrderDetail,
  type Std,
} from "./shared";

interface Form {
  companyId: string;
  address: string;
  contactId: string;
  clientReference: string;
  standards: Std[];
  serviceId: string | null;
  paramIds: string[];
  groupItemIds: string[];
  expected: string;
  sampleType: string;
  dueOn: string;
  priority: string;
  signatoryId: string | null;
  signatoryName: string;
  signatoryTitle: string;
  notes: string;
}
const ERROR_FIELDS = [
  "companyId",
  "contactId",
  "parameterIds",
  "expectedSamples",
  "dueOn",
  "standards",
] as const;
type Errors = Partial<Record<(typeof ERROR_FIELDS)[number], string>>;

function initial(cat: Catalogue, d: OrderDetail | null): Form {
  if (d)
    return {
      companyId: d.company.id,
      address: d.company.address,
      contactId: d.contact?.id ?? "",
      clientReference: d.clientReference ?? "",
      standards: d.standards,
      serviceId: d.service?.id ?? null,
      paramIds: d.parameters.map((p) => p.id),
      groupItemIds: d.groupItems.map((i) => i.id),
      expected: d.expectedSamples ? String(d.expectedSamples) : "",
      sampleType: d.sampleType ?? "",
      dueOn: d.dueOn ?? "",
      priority: d.priority,
      signatoryId: d.signatory?.id ?? null,
      signatoryName: d.signatory?.name ?? "",
      signatoryTitle: d.signatory?.title ?? "",
      notes: d.notes ?? "",
    };
  const svc = cat.services.find((s) => s.isDefault) ?? cat.services[0];
  const prep = cat.parameters.find((p) => p.code === "PREP");
  const mgr = cat.signatories.find((s) => s.isManager) ?? cat.signatories[0];
  return {
    companyId: "",
    address: "",
    contactId: "",
    clientReference: "",
    standards: ["ASTM"],
    serviceId: svc?.id ?? null,
    paramIds: [
      ...new Set([...(prep ? [prep.id] : []), ...(svc?.parameterIds ?? [])]),
    ],
    groupItemIds: [],
    expected: "",
    sampleType: cat.sampleTypes[0] ?? "",
    dueOn: todayIso(svc?.turnaroundDays ?? 5),
    priority: "Standard",
    signatoryId: mgr?.id ?? null,
    signatoryName: mgr?.name ?? "",
    signatoryTitle: mgr?.title ?? "",
    notes: "",
  };
}

/* ---------- a picker: a field that opens a list under it (a bottom sheet on the phone) ---------- */
function Picker({
  id,
  label,
  req,
  error,
  shown,
  placeholder,
  disabled,
  phone,
  children,
}: {
  id: string;
  label: string;
  req?: boolean;
  error?: string | undefined;
  shown: ReactNode;
  placeholder: string;
  disabled?: boolean;
  phone: boolean;
  children: (close: () => void) => ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  useOutside(box, () => setOpen(false), open && !phone);
  useEsc(() => setOpen(false), open && !phone);
  const close = () => setOpen(false);
  return (
    <div className="field" ref={box} style={{ position: "relative" }}>
      <label className="flabel" htmlFor={id}>
        {label}
        {req && <span className="req">*</span>}
      </label>
      <button
        type="button"
        id={id}
        className={cx(
          "input selbtn picker-btn",
          error && "err",
          disabled && "dis",
        )}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        <span className="v">
          {shown || <span className="c-mut">{placeholder}</span>}
        </span>
        <Icon n="caret-down" />
      </button>
      {error ? <span className="help err">{error}</span> : null}
      {open && !phone && (
        <div className="picker-panel" role="listbox">
          {children(close)}
        </div>
      )}
      {open && phone && (
        <Dialog title={label} phone onClose={close}>
          {children(close)}
        </Dialog>
      )}
    </div>
  );
}

/* ---------- contact person: choose, add, edit and remove the client's contacts ---------- */
function ContactPicker({
  company,
  value,
  onChange,
  error,
  phone,
}: {
  company: CatCompany | undefined;
  value: string;
  onChange: (id: string) => void;
  error?: string | undefined;
  phone: boolean;
}) {
  const qc = useQueryClient();
  const closePanel = useRef<() => void>(() => {});
  const [edit, setEdit] = useState<string | null>(null),
    [draft, setDraft] = useState({ fullName: "", phone: "", email: "" }),
    [err, setErr] = useState(""),
    [remove, setRemove] = useState<CatContact | null>(null);
  const refresh = () => qc.invalidateQueries({ queryKey: [CATALOGUE_KEY] });
  const save = useSave(
    (): Promise<unknown> =>
      edit === "new"
        ? api<{ id: string }>(`/companies/${company!.id}/contacts`, {
            method: "POST",
            json: {
              fullName: draft.fullName,
              phone: draft.phone || undefined,
              email: draft.email || undefined,
            },
          })
        : api(`/contacts/${edit}`, {
            method: "PATCH",
            json: {
              fullName: draft.fullName,
              phone: draft.phone || undefined,
              email: draft.email || undefined,
            },
          }),
    {
      keys: [CATALOGUE_KEY],
      done: edit === "new" ? "Contact added" : "Contact saved",
      onField: (_f, t) => setErr(t),
      onDone: (r) => {
        const id = (r as { id?: string } | undefined)?.id;
        setEdit(null);
        setErr("");
        if (id) {
          onChange(id);
          closePanel.current();
        }
        void refresh();
      },
    },
  );
  const del = useSave(
    (k: CatContact) => api(`/contacts/${k.id}`, { method: "DELETE" }),
    {
      keys: [CATALOGUE_KEY],
      done: "Contact removed",
      onDone: () => setRemove(null),
      onField: (_f, t) => {
        toast(t, "error");
        setRemove(null);
      },
    },
  );
  const cur = company?.contacts.find((k) => k.id === value);
  const start = (k: CatContact | null) => {
    setEdit(k ? k.id : "new");
    setDraft({
      fullName: k?.fullName ?? "",
      phone: k?.phone ?? "",
      email: k?.email ?? "",
    });
    setErr("");
  };
  const shown = cur && (
    <span className="row g12 wrap">
      <b className="t-sm w6">{cur.fullName}</b>
      {cur.phone && <span className="t-sm c-sec">{cur.phone}</span>}
      {cur.email && !phone && <span className="t-sm c-sec">{cur.email}</span>}
    </span>
  );
  return (
    <>
      <Picker
        id="jo-contact"
        label="Contact person"
        req
        error={error}
        shown={shown}
        placeholder={company ? "Choose a contact" : "Choose a client first"}
        disabled={!company}
        phone={phone}
      >
        {(close) => {
          closePanel.current = close;
          return (
            <div className="col" style={{ gap: 2 }}>
              {company?.contacts.map((k) =>
                edit === k.id ? (
                  <ContactEdit
                    key={k.id}
                    draft={draft}
                    setDraft={setDraft}
                    err={err}
                    busy={save.isPending}
                    onSave={() => save.mutate(undefined)}
                    onCancel={() => setEdit(null)}
                  />
                ) : (
                  <div
                    key={k.id}
                    className={cx("prow", edit && "dim")}
                    role="option"
                    aria-selected={k.id === value}
                  >
                    <button
                      type="button"
                      className="pmain"
                      onClick={() => {
                        onChange(k.id);
                        close();
                      }}
                    >
                      <span className="pck">
                        {k.id === value && <Icon n="check" />}
                      </span>
                      <span className="col" style={{ gap: 0, minWidth: 0 }}>
                        <b className="t-sm w6">{k.fullName}</b>
                        <span className="t-cap c-sec ellip">
                          {[k.phone, k.email].filter(Boolean).join("   ")}
                        </span>
                      </span>
                    </button>
                    <Button
                      iconOnly
                      icon="pencil-simple"
                      label={`Edit ${k.fullName}`}
                      onClick={() => start(k)}
                    />
                    <Button
                      iconOnly
                      icon="trash"
                      label={`Remove ${k.fullName}`}
                      onClick={() => setRemove(k)}
                    />
                  </div>
                ),
              )}
              {edit === "new" ? (
                <ContactEdit
                  draft={draft}
                  setDraft={setDraft}
                  err={err}
                  busy={save.isPending}
                  onSave={() => save.mutate(undefined)}
                  onCancel={() => setEdit(null)}
                />
              ) : (
                <button
                  type="button"
                  className="prow add"
                  onClick={() => start(null)}
                >
                  <Icon n="plus" />
                  <span className="t-sm w6">Add contact</span>
                </button>
              )}
            </div>
          );
        }}
      </Picker>
      {remove &&
        toFrame(
          <Confirm
            title={`Remove ${remove.fullName} from contacts?`}
            text="Submitted job orders keep this contact's name on their documents."
            ok="Remove"
            danger
            busy={del.isPending}
            onOk={() => del.mutate(remove)}
            onClose={() => setRemove(null)}
          />,
        )}
    </>
  );
}
function ContactEdit({
  draft,
  setDraft,
  err,
  busy,
  onSave,
  onCancel,
}: {
  draft: { fullName: string; phone: string; email: string };
  setDraft: (d: { fullName: string; phone: string; email: string }) => void;
  err: string;
  busy: boolean;
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="prow editing">
      <div className="col g8" style={{ flex: 1, minWidth: 0 }}>
        <TextField
          id="ct-name"
          label="Name"
          req
          value={draft.fullName}
          onChange={(t) => setDraft({ ...draft, fullName: t })}
          error={err || null}
        />
        <div className="row g8">
          <div style={{ flex: 1 }}>
            <TextField
              id="ct-phone"
              label="Phone"
              value={draft.phone}
              onChange={(t) => setDraft({ ...draft, phone: t })}
            />
          </div>
          <div style={{ flex: 1.4 }}>
            <TextField
              id="ct-email"
              label="Email"
              value={draft.email}
              onChange={(t) => setDraft({ ...draft, email: t })}
            />
          </div>
        </div>
      </div>
      <div className="col g8">
        <Button
          iconOnly
          icon="floppy-disk"
          label="Save contact"
          disabled={busy || !draft.fullName.trim()}
          onClick={onSave}
        />
        <Button iconOnly icon="x" label="Cancel" onClick={onCancel} />
      </div>
    </div>
  );
}

/* ---------- default signatory: the people who may sign (the Manager first), or a name typed in ---------- */
function SignatoryPicker({
  cat,
  form,
  set,
  phone,
}: {
  cat: Catalogue;
  form: Form;
  set: (p: Partial<Form>) => void;
  phone: boolean;
}) {
  const [adding, setAdding] = useState(false),
    [draft, setDraft] = useState({ name: "", title: "" });
  const shown = form.signatoryName && (
    <span className="row g12 wrap">
      <b className="t-sm w6">{form.signatoryName}</b>
      {form.signatoryTitle && (
        <span className="t-sm c-sec">{form.signatoryTitle}</span>
      )}
    </span>
  );
  return (
    <Picker
      id="jo-signatory"
      label="Default signatory (optional)"
      shown={shown}
      placeholder="Choose who signs the CoA"
      phone={phone}
    >
      {(close) => (
        <div className="col" style={{ gap: 2 }}>
          {cat.signatories.map((s) => (
            <div
              key={s.id}
              className="prow"
              role="option"
              aria-selected={s.id === form.signatoryId}
            >
              <button
                type="button"
                className="pmain"
                onClick={() => {
                  set({
                    signatoryId: s.id,
                    signatoryName: s.name,
                    signatoryTitle: s.title,
                  });
                  close();
                }}
              >
                <span className="pck">
                  {s.id === form.signatoryId && <Icon n="check" />}
                </span>
                <span className="col" style={{ gap: 0 }}>
                  <b className="t-sm w6">{s.name}</b>
                  <span className="t-cap c-sec">{s.title}</span>
                </span>
              </button>
            </div>
          ))}
          {adding ? (
            <div className="prow editing">
              <div className="col g8" style={{ flex: 1 }}>
                <TextField
                  id="sg-name"
                  label="Name"
                  req
                  value={draft.name}
                  onChange={(t) => setDraft({ ...draft, name: t })}
                />
                <TextField
                  id="sg-title"
                  label="Title"
                  value={draft.title}
                  onChange={(t) => setDraft({ ...draft, title: t })}
                />
              </div>
              <div className="col g8">
                <Button
                  iconOnly
                  icon="check"
                  label="Use this signatory"
                  disabled={!draft.name.trim()}
                  onClick={() => {
                    set({
                      signatoryId: null,
                      signatoryName: draft.name.trim(),
                      signatoryTitle: draft.title.trim(),
                    });
                    setAdding(false);
                    close();
                  }}
                />
                <Button
                  iconOnly
                  icon="x"
                  label="Cancel"
                  onClick={() => setAdding(false)}
                />
              </div>
            </div>
          ) : (
            <button
              type="button"
              className="prow add"
              onClick={() => setAdding(true)}
            >
              <Icon n="plus" />
              <span className="t-sm w6">Add signatory</span>
            </button>
          )}
          {form.signatoryName && (
            <button
              type="button"
              className="prow add"
              onClick={() => {
                set({
                  signatoryId: null,
                  signatoryName: "",
                  signatoryTitle: "",
                });
                close();
              }}
            >
              <Icon n="x" />
              <span className="t-sm w6">No default signatory</span>
            </button>
          )}
        </div>
      )}
    </Picker>
  );
}

/* ---------- the Ash analysis and Trace elements checklists ---------- */
function GroupChecklist({
  param,
  items,
  picked,
  onChange,
  onClose,
  phone,
}: {
  param: CatParam;
  items: CatItem[];
  picked: string[];
  onChange: (ids: string[]) => void;
  onClose: () => void;
  phone: boolean;
}) {
  const [q, setQ] = useState("");
  const sections = useMemo(() => {
    const m = new Map<string, CatItem[]>();
    items
      .filter((i) => !q || i.code.toLowerCase().includes(q.toLowerCase()))
      .forEach((i) => m.set(i.section, [...(m.get(i.section) ?? []), i]));
    return [...m.entries()];
  }, [items, q]);
  const toggle = (id: string) =>
    onChange(
      picked.includes(id) ? picked.filter((x) => x !== id) : [...picked, id],
    );
  return (
    <Dialog
      title={param.label}
      sub={`${picked.length} of ${items.length} selected`}
      size="md"
      phone={phone}
      onClose={onClose}
      footer={
        <>
          <Button
            onClick={() =>
              onChange(items.filter((i) => i.preset).map((i) => i.id))
            }
          >
            Presets
          </Button>
          <Button type="primary" id="grp-done" onClick={onClose}>
            Done
          </Button>
        </>
      }
    >
      <Search
        id="grp-q"
        label="Search"
        value={q}
        onChange={setQ}
        placeholder={`Search ${param.label.toLowerCase()}…`}
      />
      {sections.map(([sec, list]) => (
        <div key={sec} className="col g8">
          <span className="flabel">{sec}</span>
          <div className="grp-grid">
            {list.map((i) => (
              <Check
                key={i.id}
                on={picked.includes(i.id)}
                onChange={() => toggle(i.id)}
                label={i.code}
              />
            ))}
          </div>
        </div>
      ))}
      {!sections.length && <span className="t-sm c-mut">Nothing matches.</span>}
    </Dialog>
  );
}

/* ---------- the parameter pills ---------- */
function Pills({
  cat,
  form,
  set,
  phone,
  error,
}: {
  cat: Catalogue;
  form: Form;
  set: (p: Partial<Form>) => void;
  phone: boolean;
  error?: string | undefined;
}) {
  const [q, setQ] = useState(""),
    [open, setOpen] = useState<CatParam | null>(null);
  const prep = cat.parameters.find((p) => p.code === "PREP");
  const unavailable = (p: CatParam) =>
    p.families.length > 0 &&
    !p.families.some((f) => form.standards.includes(f));
  const groups = useMemo(() => {
    const m = new Map<string, CatParam[]>();
    cat.parameters
      .filter(
        (p) =>
          !q ||
          `${p.label} ${p.code} ${p.name}`
            .toLowerCase()
            .includes(q.toLowerCase()),
      )
      .forEach((p) => m.set(p.category, [...(m.get(p.category) ?? []), p]));
    return [...m.entries()];
  }, [cat, q]);
  const itemsOf = (p: CatParam) =>
    cat.groupItems.filter((i) => i.parameterId === p.id);
  const pick = (ids: string[]) => ({
    paramIds: ids,
    groupItemIds: form.groupItemIds.filter((g) =>
      cat.groupItems.find((i) => i.id === g && ids.includes(i.parameterId)),
    ),
  });
  const toggle = (p: CatParam) => {
    if (p.isGroup) {
      setOpen(p);
      return;
    }
    set(
      pick(
        form.paramIds.includes(p.id)
          ? form.paramIds.filter((x) => x !== p.id)
          : [...form.paramIds, p.id],
      ),
    );
  };
  const quick = (ids: string[], serviceId: string | null) => {
    const all = [
      // a service always carries the preparation, so "Preparation only" (no parameters of its own) picks just PREP; Clear picks nothing
      ...new Set([...(prep && serviceId ? [prep.id] : []), ...ids]),
    ].filter((id) => {
      const p = cat.parameters.find((x) => x.id === id);
      return p && !unavailable(p);
    });
    set({
      paramIds: all,
      serviceId,
      groupItemIds: cat.groupItems
        .filter((i) => i.preset && all.includes(i.parameterId))
        .map((i) => i.id),
    });
  };
  return (
    <div className="field" id="jo-params">
      <div className="row between">
        <span className="flabel">
          Parameters<span className="req">*</span>
        </span>
        <span className={cx("t-sm", error ? "c-err" : "c-mut")}>
          {form.paramIds.length} selected
        </span>
      </div>
      <div className="row g4 wrap" style={{ alignItems: "center" }}>
        <span className="t-sm c-mut" style={{ marginRight: 4 }}>
          Quick select
        </span>
        {cat.services.map((s) => (
          <Button
            key={s.id}
            type="ghost"
            size="sm"
            onClick={() => quick(s.parameterIds, s.id)}
          >
            {s.name}
          </Button>
        ))}
        <Button type="ghost" size="sm" onClick={() => quick([], null)}>
          Clear
        </Button>
      </div>
      <Search
        id="jo-pq"
        label="Search"
        value={q}
        onChange={setQ}
        placeholder="Search parameters…"
      />
      <div className="col g8">
        {groups.map(([cat2, list]) => (
          <div key={cat2} className={cx("prow-pills", phone && "stack")}>
            <span className="t-sm c-sec plabel">{cat2}</span>
            <div className="row g8 wrap">
              {list.map((p) => {
                const on = form.paramIds.includes(p.id),
                  na = unavailable(p);
                const sel = p.isGroup
                  ? itemsOf(p).filter((i) => form.groupItemIds.includes(i.id))
                      .length
                  : 0;
                const cover =
                  p.families.length > 0 && p.families.length < 3
                    ? p.families
                    : [];
                const tip = na
                  ? `No ${form.standards.map((s) => STD_LABEL[s]).join(" or ")} method. Add ${p.families.map((f) => STD_LABEL[f]).join(" or ")} under Standard.`
                  : undefined;
                return (
                  <button
                    key={p.id}
                    type="button"
                    className={cx("ppill", (on || sel > 0) && "on", na && "na")}
                    aria-pressed={on || sel > 0}
                    disabled={na}
                    title={tip}
                    onClick={() => toggle(p)}
                  >
                    {p.label}
                    {p.isGroup && sel > 0 && (
                      <span className="t-cap">{sel}</span>
                    )}
                    {p.isGroup && <Icon n="caret-right" s={14} />}
                    {cover.map((f) => (
                      <span key={f} className="ptag">
                        {STD_LABEL[f]}
                      </span>
                    ))}
                    {p.subcontracted && <span className="ptag sub">SUB</span>}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
        {!groups.length && (
          <span className="t-sm c-mut">No parameter matches.</span>
        )}
      </div>
      {error && <span className="help err">{error}</span>}
      {open && (
        <GroupChecklist
          param={open}
          items={itemsOf(open)}
          picked={form.groupItemIds.filter((g) =>
            itemsOf(open).some((i) => i.id === g),
          )}
          phone={phone}
          onChange={(ids) => {
            const others = form.groupItemIds.filter(
              (g) => !itemsOf(open).some((i) => i.id === g),
            );
            const all = [...others, ...ids];
            const hasParam = form.paramIds.includes(open.id);
            const wants = ids.length > 0;
            set({
              groupItemIds: all,
              paramIds:
                wants && !hasParam
                  ? [...form.paramIds, open.id]
                  : !wants && hasParam
                    ? form.paramIds.filter((x) => x !== open.id)
                    : form.paramIds,
            });
          }}
          onClose={() => setOpen(null)}
        />
      )}
    </div>
  );
}

/* ---------- the form ---------- */
export function OrderForm({
  detail,
  phone,
  onClose,
}: {
  detail: OrderDetail | null;
  phone: boolean;
  onClose: () => void;
}) {
  const cat = useCatalogue();
  if (!cat.data)
    return phone ? (
      toFrame(
        <div className="fullscreen">
          <div className="fb">
            <span className="t-sm c-mut">Loading…</span>
          </div>
        </div>,
      )
    ) : (
      <Dialog
        title={detail ? `Edit ${detail.orderNo}` : "New job order"}
        size="xl"
        onClose={onClose}
      >
        <span className="t-sm c-mut">Loading…</span>
      </Dialog>
    );
  return (
    <FormBody cat={cat.data} detail={detail} phone={phone} onClose={onClose} />
  );
}
function FormBody({
  cat,
  detail,
  phone,
  onClose,
}: {
  cat: Catalogue;
  detail: OrderDetail | null;
  phone: boolean;
  onClose: () => void;
}) {
  const nav = useNavigate();
  const [f, setF] = useState<Form>(() => initial(cat, detail)),
    [errs, setErrs] = useState<Errors>({}),
    [summary, setSummary] = useState(""),
    [step, setStep] = useState<1 | 2>(1),
    [files, setFiles] = useState<File[]>([]);
  const set = (p: Partial<Form>) => {
    setF((x) => ({ ...x, ...p }));
    setErrs({});
    setSummary("");
  };
  const company = cat.companies.find((c) => c.id === f.companyId);
  const edit = !!detail;
  const title = edit ? `Edit ${detail!.orderNo}` : "New job order";
  const validate = (submit: boolean): Errors => {
    const e: Errors = {};
    if (!f.companyId) e.companyId = "Choose the client.";
    if (!f.standards.length) e.standards = "Choose at least one standard.";
    if (submit) {
      if (!f.contactId) e.contactId = "Choose the contact person.";
      if (!f.paramIds.length) e.parameterIds = "Choose at least one parameter.";
      const n = Number(f.expected);
      if (!f.expected.trim() || !Number.isInteger(n) || n < 1)
        e.expectedSamples = "Enter how many samples to expect.";
      if (!f.dueOn) e.dueOn = "Pick the due date.";
    }
    return e;
  };
  const save = useSave(
    async (submit: boolean) => {
      const r = await api<{ orderNo?: string }>(
        edit ? `/orders/${detail!.orderNo}` : "/orders",
        {
          method: edit ? "PUT" : "POST",
          json: {
            companyId: f.companyId,
            companyAddress: f.address || null,
            contactId: f.contactId || null,
            clientReference: f.clientReference || null,
            standards: f.standards,
            serviceId: f.serviceId,
            parameterIds: f.paramIds,
            groupItemIds: f.groupItemIds,
            expectedSamples: f.expected.trim() ? Number(f.expected) : null,
            sampleType: f.sampleType || null,
            dueOn: f.dueOn || null,
            priority: f.priority,
            signatoryId: f.signatoryId,
            signatoryName: f.signatoryName || null,
            signatoryTitle: f.signatoryTitle || null,
            notes: f.notes || null,
            submit,
          },
        },
      );
      // the form's files go up once the job order exists (frame 02-01, "Notes and files")
      if (!edit && r.orderNo && files.length) await sendPending(r.orderNo, files);
      return r;
    },
    {
      keys: ["orders", "order", CATALOGUE_KEY, "companies", "order-files"],
      onField: (field, text) => {
        if (
          field &&
          (ERROR_FIELDS as readonly string[]).includes(
            field === "parameterIds" ? "parameterIds" : field,
          )
        )
          setErrs({ [field]: text } as Errors);
        setSummary(text);
      },
      onDone: (r) => {
        const no =
          (r as { orderNo?: string } | undefined)?.orderNo ?? detail?.orderNo;
        if (!edit && no) {
          toast(
            lastSubmit.current
              ? `${no} submitted. Add the sample IDs next.`
              : `${no} saved as a draft`,
          );
          onClose();
          nav(lastSubmit.current ? `/orders/${no}/samples` : `/orders/${no}`);
        } else {
          toast(lastSubmit.current ? `${detail!.orderNo} submitted` : "Saved");
          onClose();
        }
      },
    },
  );
  const lastSubmit = useRef(false);
  const go = (submit: boolean) => {
    const e = validate(submit);
    if (Object.keys(e).length) {
      setErrs(e);
      setSummary(
        submit
          ? `Fix ${Object.keys(e).length} field${Object.keys(e).length === 1 ? "" : "s"} to submit.`
          : "Choose the client first.",
      );
      setStep(1);
      document.getElementById("jo-body")?.scrollTo({ top: 0 });
      return;
    }
    lastSubmit.current = submit;
    save.mutate(submit);
  };
  const chooseCompany = (id: string) => {
    const c = cat.companies.find((x) => x.id === id);
    set({
      companyId: id,
      address: c?.address ?? "",
      contactId:
        c?.contacts.find((k) => k.isDefault)?.id ?? c?.contacts[0]?.id ?? "",
    });
  };
  const toggleStd = (s: Std) => {
    const next = f.standards.includes(s)
      ? f.standards.filter((x) => x !== s)
      : [...f.standards, s];
    const keep = f.paramIds.filter((id) => {
      const p = cat.parameters.find((x) => x.id === id);
      return (
        !p ||
        p.families.length === 0 ||
        p.families.some((fam) => next.includes(fam))
      );
    });
    set({
      standards: next,
      paramIds: keep,
      groupItemIds: f.groupItemIds.filter((g) =>
        cat.groupItems.some((i) => i.id === g && keep.includes(i.parameterId)),
      ),
    });
  };
  const draftOk = !edit || detail!.status === "draft";

  const company1 = (
    <>
      <span className="t-over">Company</span>
      <div className="cfg-form">
        <Select
          id="jo-company"
          label="Company name"
          req
          value={f.companyId}
          onChange={chooseCompany}
          error={errs.companyId ?? null}
          options={[
            ["", "Choose a client"],
            ...cat.companies.map((c) => [c.id, c.name] as [string, string]),
          ]}
        />
        <TextField
          id="jo-ref"
          label="Client reference / PO"
          value={f.clientReference}
          onChange={(t) => set({ clientReference: t })}
          placeholder="PO 4500-2241"
        />
      </div>
      <TextField
        id="jo-address"
        label="Company address (optional)"
        value={f.address}
        onChange={(t) => set({ address: t })}
        help="Editing the address here updates the company record."
      />
      <ContactPicker
        company={company}
        value={f.contactId}
        onChange={(id) => set({ contactId: id })}
        error={errs.contactId}
        phone={phone}
      />
    </>
  );
  const work = (
    <>
      <span className="t-over sec">Work</span>
      <div className="field">
        <span className="flabel">
          Standard<span className="req">*</span>
        </span>
        <div className="row g8 wrap">
          {(["ASTM", "ISO", "GBT"] as Std[]).map((s) => (
            <button
              key={s}
              type="button"
              className={cx("chip", f.standards.includes(s) && "on")}
              aria-pressed={f.standards.includes(s)}
              onClick={() => toggleStd(s)}
            >
              {STD_LABEL[s]}
            </button>
          ))}
        </div>
        {errs.standards && <span className="help err">{errs.standards}</span>}
      </div>
      <Pills
        cat={cat}
        form={f}
        set={set}
        phone={phone}
        error={errs.parameterIds}
      />
      <div className="cfg-form">
        <Select
          id="jo-type"
          label="Sample type"
          value={f.sampleType}
          onChange={(v) => set({ sampleType: v })}
          options={[
            ["", "Not set"],
            ...cat.sampleTypes.map((t) => [t, t] as [string, string]),
          ]}
        />
        <TextField
          id="jo-expected"
          label="Expected samples"
          req
          type="number"
          value={f.expected}
          onChange={(t) => set({ expected: t })}
          error={errs.expectedSamples ?? null}
          placeholder="e.g. 12"
        />
        <TextField
          id="jo-due"
          label="Due date"
          req
          type="date"
          value={f.dueOn}
          onChange={(t) => set({ dueOn: t })}
          error={errs.dueOn ?? null}
          help={
            !errs.dueOn
              ? "Suggested from the template turnaround."
              : (undefined as never)
          }
        />
        <Select
          id="jo-priority"
          label="Priority"
          value={f.priority}
          onChange={(v) => set({ priority: v })}
          options={cat.priorities.map((p) => [p, p] as [string, string])}
        />
      </div>
    </>
  );
  const report = (
    <>
      <span className="t-over sec">Report</span>
      <SignatoryPicker cat={cat} form={f} set={set} phone={phone} />
      <span className="t-over sec">{edit ? "Notes" : "Notes and files"}</span>
      <TextArea
        id="jo-notes"
        label="Notes"
        value={f.notes}
        onChange={(t) => set({ notes: t })}
        placeholder="Add a note for the lab…"
        rows={3}
      />
      {!edit && <PendingFiles files={files} onChange={setFiles} phone={phone} />}
    </>
  );
  const alert = summary ? <Alert tone="error" title={summary} /> : null;

  if (!phone)
    return (
      <Dialog
        title={title}
        sub={
          edit
            ? undefined
            : "Enter the company's request. Sample IDs come next."
        }
        size="xl"
        onClose={onClose}
        footer={
          <>
            <Button onClick={onClose}>Cancel</Button>
            {draftOk && (
              <Button
                id="jo-draft"
                disabled={save.isPending}
                onClick={() => go(false)}
              >
                {edit ? "Save changes" : "Save as draft"}
              </Button>
            )}
            {(!edit || detail!.status === "draft") && (
              <Button
                type="primary"
                id="jo-submit"
                disabled={save.isPending}
                onClick={() => go(true)}
              >
                Submit
              </Button>
            )}
            {edit && detail!.status !== "draft" && (
              <Button
                type="primary"
                id="jo-save"
                disabled={save.isPending}
                onClick={() => go(false)}
              >
                Save
              </Button>
            )}
          </>
        }
      >
        <div className="col g16" id="jo-body">
          {alert}
          {company1}
          {work}
          {report}
        </div>
      </Dialog>
    );

  // phone: two full-screen steps, sticky actions
  return toFrame(
    <div className="fullscreen" role="dialog" aria-label={title}>
      <div className="fh">
        <Button
          iconOnly
          icon={step === 2 ? "caret-left" : "x"}
          label={step === 2 ? "Back" : "Close"}
          size="touch"
          onClick={() => (step === 2 ? setStep(1) : onClose())}
        />
        <b className="t-sm w6 grow">{title}</b>
        <span className="t-cap c-mut">Step {step} of 2</span>
      </div>
      <div className="fb" id="jo-body">
        <div className="col g16">
          {alert}
          {step === 1 ? (
            <>
              {company1}
              {work}
            </>
          ) : (
            report
          )}
        </div>
      </div>
      <div className="sticky-bar fixed">
        {step === 1 ? (
          <>
            {draftOk ? (
              <Button
                size="touch"
                id="jo-draft"
                disabled={save.isPending}
                onClick={() => go(false)}
              >
                {edit ? "Save changes" : "Save as draft"}
              </Button>
            ) : (
              <Button size="touch" onClick={onClose}>
                Cancel
              </Button>
            )}
            <Button
              type="primary"
              size="touch"
              id="jo-next"
              onClick={() => {
                const e = validate(false);
                if (Object.keys(e).length) {
                  setErrs(e);
                  setSummary("Choose the client first.");
                  return;
                }
                setStep(2);
              }}
            >
              Next
            </Button>
          </>
        ) : (
          <>
            <Button size="touch" onClick={() => setStep(1)}>
              Back
            </Button>
            {edit && detail!.status !== "draft" ? (
              <Button
                type="primary"
                size="touch"
                id="jo-save"
                disabled={save.isPending}
                onClick={() => go(false)}
              >
                Save
              </Button>
            ) : (
              <Button
                type="primary"
                size="touch"
                id="jo-submit"
                disabled={save.isPending}
                onClick={() => go(true)}
              >
                Submit
              </Button>
            )}
          </>
        )}
      </div>
    </div>,
  );
}
