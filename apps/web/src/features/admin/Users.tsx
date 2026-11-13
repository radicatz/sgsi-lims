// Users list with its Roles tab, the user page, and the add, edit, deactivate and link dialogs (Admin screen plan, module 13).
import { useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { ROLE_LABEL, type RoleCode } from "@sgsi/shared";
import { api } from "../../app/api";
import { useBreakpoint } from "../../app/session";
import {
  Alert,
  Avatar,
  Button,
  Card,
  Dialog,
  Empty,
  Icon,
  PageHead,
  TextField,
  toast,
} from "../../components";
import {
  Badge,
  Check,
  Chips,
  Confirm,
  KV,
  Menu,
  Note,
  Pager,
  Search,
  Select,
  Table,
  Tabs,
  Tag,
  fmtDate,
  fmtWhen,
  usePaged,
  type Tone,
} from "../../components";
import { post, useIsPhone, useSave } from "../master-data/shared";

interface User {
  id: string;
  email: string;
  fullName: string;
  title: string | null;
  phone: string | null;
  roles: RoleCode[];
  status: "active" | "invited" | "inactive" | "locked";
  lockedUntil: string | null;
  failedAttempts: number;
  invitedAt: string | null;
  inviteExpiresAt: string | null;
  lastSignInAt: string | null;
  createdAt: string;
}
interface UserPage extends User {
  permissions: string[];
  activity: Array<{
    action: string;
    table: string;
    label: string | null;
    screen: string | null;
    at: string;
  }>;
}
interface RolesGrid {
  roles: Array<{ code: RoleCode; name: string; description: string }>;
  permissions: Array<{ code: string; description: string }>;
  grid: string[];
}

const STATUS_LABEL = {
  active: "Active",
  invited: "Invited",
  inactive: "Inactive",
  locked: "Locked",
} as const;
const STATUS_TONE: Record<User["status"], Tone> = {
  active: "green",
  invited: "amber",
  inactive: "grey",
  locked: "red",
};
const RoleBadges = ({ roles }: { roles: RoleCode[] }) => (
  <span className="row g4 wrap">
    {roles.map((r) => (
      <span key={r} className="role">
        {ROLE_LABEL[r] ?? r}
      </span>
    ))}
  </span>
);
const useUsers = () =>
  useQuery({
    queryKey: ["users"],
    queryFn: () => api<{ items: User[] }>("/users").then((r) => r.items),
  });
const useRolesGrid = () =>
  useQuery({
    queryKey: ["roles-grid"],
    queryFn: () => api<RolesGrid>("/roles"),
    staleTime: 300_000,
  });
/** A short sentence for a permission code: the database holds the description. */
const permText = (g: RolesGrid | undefined, code: string) =>
  g?.permissions.find((p) => p.code === code)?.description ?? code;

type Tab = "users" | "roles";
type Chip = "all" | User["status"];

export function Users() {
  const nav = useNavigate(),
    phone = useIsPhone(),
    tablet = useBreakpoint() === "tablet";
  const [sp, setSp] = useSearchParams();
  const tab: Tab = sp.get("tab") === "roles" ? "roles" : "users";
  const { data = [], isLoading } = useUsers();
  const [q, setQ] = useState(""),
    [role, setRole] = useState(""),
    [chip, setChip] = useState<Chip>("all");
  const [form, setForm] = useState<User | "new" | null>(null),
    [deact, setDeact] = useState<User | null>(null),
    [linkOf, setLinkOf] = useState<{
      title: string;
      link: string | null;
    } | null>(null);
  const base = data.filter(
    (u) =>
      (!q ||
        `${u.fullName} ${u.email}`.toLowerCase().includes(q.toLowerCase())) &&
      (!role || u.roles.includes(role as RoleCode)),
  );
  const rows = base.filter((u) => chip === "all" || u.status === chip);
  const pg = usePaged(rows, 25, q + role + chip);
  const actions = useUserActions(setLinkOf, () => setDeact(null));
  const count = (s: User["status"]) =>
    base.filter((u) => u.status === s).length;
  const menu = (u: User, vertical?: boolean) => (
    <Menu
      label={`More for ${u.fullName}`}
      vertical={vertical}
      items={userMenu(
        u,
        actions,
        () => setForm(u),
        () => setDeact(u),
      )}
    />
  );
  return (
    <div className="page">
      <div className="page-head">
        <div className="tt">
          <span className="t-over">Admin</span>
          <h1 className="t-display">Users</h1>
        </div>
        {!phone && (
          <div className="row g10">
            <Button
              type="primary"
              size="lg"
              icon="plus"
              id="add-user"
              onClick={() => setForm("new")}
            >
              Add user
            </Button>
          </div>
        )}
      </div>
      <Tabs
        value={tab}
        onChange={(t) =>
          setSp(t === "roles" ? { tab: "roles" } : {}, { replace: true })
        }
        items={[
          { id: "users", label: "Users", count: data.length },
          { id: "roles", label: "Roles" },
        ]}
      />
      {tab === "roles" ? (
        <RolesTab />
      ) : (
        <>
          <div className="row g12 wrap" style={{ alignItems: "flex-end" }}>
            <Search
              label="Search"
              id="us-q"
              value={q}
              onChange={setQ}
              placeholder="Search name or email"
              width={phone ? "100%" : 320}
            />
            <Select
              label="Role"
              value={role}
              onChange={setRole}
              width={phone ? "100%" : 220}
              options={[
                ["", "All roles"],
                ...(Object.keys(ROLE_LABEL) as RoleCode[]).map(
                  (r) => [r, ROLE_LABEL[r]] as [string, string],
                ),
              ]}
            />
          </div>
          <Chips
            scroll
            value={chip}
            onChange={setChip}
            items={[
              { id: "all", label: "All", count: base.length },
              { id: "active", label: "Active", count: count("active") },
              { id: "invited", label: "Invited", count: count("invited") },
              { id: "inactive", label: "Inactive", count: count("inactive") },
              { id: "locked", label: "Locked", count: count("locked") },
            ]}
          />
          {isLoading ? (
            <Card>
              <Empty icon="users" title="Loading users" />
            </Card>
          ) : phone ? (
            <div className="col g10">
              {pg.rows.map((u) => (
                <div
                  key={u.id}
                  className="mcard"
                  onClick={() => nav(`/users/${u.id}`)}
                >
                  <div className="row g10">
                    <Avatar name={u.fullName} size={40} />
                    <div className="col grow" style={{ gap: 0 }}>
                      <b className="t-sm w6">{u.fullName}</b>
                      <span className="t-cap c-sec">{u.email}</span>
                    </div>
                    <span className="row g8">
                      <Badge
                        label={STATUS_LABEL[u.status]}
                        tone={STATUS_TONE[u.status]}
                        sm
                      />
                      {menu(u, true)}
                    </span>
                  </div>
                  <RoleBadges roles={u.roles} />
                </div>
              ))}
              <Pager {...pg.pager} />
            </div>
          ) : tablet ? (
            <Card>
              <Table
                rows={pg.rows}
                keyOf={(u) => u.id}
                onRow={(u) => nav(`/users/${u.id}`)}
                cols={[
                  {
                    h: "Name",
                    render: (u) => (
                      <span className="row g10">
                        <Avatar name={u.fullName} size={40} />
                        <span className="col" style={{ gap: 0 }}>
                          <b className="t-sm w6">{u.fullName}</b>
                          <span className="t-cap c-sec">{u.email}</span>
                        </span>
                      </span>
                    ),
                  },
                  { h: "Roles", render: (u) => <RoleBadges roles={u.roles} /> },
                  {
                    h: "Status",
                    render: (u) => (
                      <Badge
                        label={STATUS_LABEL[u.status]}
                        tone={STATUS_TONE[u.status]}
                        sm
                      />
                    ),
                  },
                  { h: "", cls: "r", render: (u) => menu(u) },
                ]}
                empty={
                  <Empty
                    icon="users"
                    title="No users match"
                    text="Clear the search or pick another filter."
                  />
                }
              />
              <Pager {...pg.pager} />
            </Card>
          ) : (
            <Card>
              <Table
                rows={pg.rows}
                keyOf={(u) => u.id}
                onRow={(u) => nav(`/users/${u.id}`)}
                cols={[
                  {
                    h: "Name",
                    render: (u) => (
                      <span className="row g10">
                        <Avatar name={u.fullName} size={40} />
                        <b className="t-sm w6">{u.fullName}</b>
                      </span>
                    ),
                  },
                  {
                    h: "Email",
                    render: (u) => (
                      <span className="t-sm c-sec">{u.email}</span>
                    ),
                  },
                  { h: "Roles", render: (u) => <RoleBadges roles={u.roles} /> },
                  {
                    h: "Status",
                    render: (u) => (
                      <Badge
                        label={STATUS_LABEL[u.status]}
                        tone={STATUS_TONE[u.status]}
                        sm
                      />
                    ),
                  },
                  {
                    h: "Last sign-in",
                    render: (u) => (
                      <span className="t-sm">
                        {u.lastSignInAt ? fmtWhen(u.lastSignInAt) : "Never"}
                      </span>
                    ),
                  },
                  { h: "Created", render: (u) => fmtDate(u.createdAt) },
                  { h: "", cls: "r", render: (u) => menu(u) },
                ]}
                empty={
                  <Empty
                    icon="users"
                    title="No users match"
                    text="Clear the search or pick another filter."
                  />
                }
              />
              <Pager {...pg.pager} />
            </Card>
          )}
          {phone && (
            <div className="sticky-bar">
              <Button
                type="primary"
                size="touch"
                icon="plus"
                id="add-user"
                block
                onClick={() => setForm("new")}
              >
                Add user
              </Button>
            </div>
          )}
        </>
      )}
      {form && (
        <UserForm
          user={form === "new" ? null : form}
          onClose={() => setForm(null)}
          onInvite={(l) => setLinkOf({ title: "Invite created", link: l })}
        />
      )}
      {deact && (
        <DeactivateConfirm
          user={deact}
          busy={actions.deactivate.isPending}
          onOk={() => actions.deactivate.mutate(deact)}
          onClose={() => setDeact(null)}
          error={actions.error}
        />
      )}
      {linkOf && <LinkDialog {...linkOf} onClose={() => setLinkOf(null)} />}
    </div>
  );
}

/** The row and page actions, one place. */
function useUserActions(
  showLink: (l: { title: string; link: string | null }) => void,
  closeDeactivate: () => void,
) {
  const [error, setError] = useState<string | null>(null);
  const keys = ["users", "user"];
  const deactivate = useSave((u: User) => post(`/users/${u.id}/deactivate`), {
    keys,
    done: "User deactivated",
    onDone: () => {
      setError(null);
      closeDeactivate();
    },
    onField: (_f, t) => setError(t),
  });
  const reactivate = useSave((u: User) => post(`/users/${u.id}/reactivate`), {
    keys,
    done: "User reactivated",
  });
  const unlock = useSave((u: User) => post(`/users/${u.id}/unlock`), {
    keys,
    done: "User unlocked",
  });
  const reset = useSave((u: User) => post(`/users/${u.id}/reset`), {
    keys,
    onDone: (r) =>
      showLink({
        title: "Password reset link",
        link: (r as { link: string | null }).link,
      }),
  });
  const resend = useSave((u: User) => post(`/users/${u.id}/resend-invite`), {
    keys,
    onDone: (r) =>
      showLink({
        title: "New invite link",
        link: (r as { link: string | null }).link,
      }),
  });
  return { deactivate, reactivate, unlock, reset, resend, error };
}
type Actions = ReturnType<typeof useUserActions>;
function userMenu(
  u: User,
  a: Actions,
  edit: () => void,
  deactivate: () => void,
) {
  return [
    { label: "Edit", icon: "pencil-simple", onClick: edit },
    u.status === "invited"
      ? {
          label: "Resend invite",
          icon: "arrow-right",
          onClick: () => a.resend.mutate(u),
        }
      : u.status !== "inactive" && {
          label: "Send password reset",
          icon: "lock-simple",
          onClick: () => a.reset.mutate(u),
        },
    u.status === "locked" && {
      label: "Unlock",
      icon: "check",
      onClick: () => a.unlock.mutate(u),
    },
    u.status === "inactive"
      ? {
          label: "Reactivate",
          icon: "check",
          onClick: () => a.reactivate.mutate(u),
        }
      : {
          label: "Deactivate",
          icon: "archive",
          danger: true,
          onClick: deactivate,
        },
  ];
}

function DeactivateConfirm({
  user,
  busy,
  onOk,
  onClose,
  error,
}: {
  user: User;
  busy: boolean;
  onOk: () => void;
  onClose: () => void;
  error: string | null;
}) {
  return (
    <Dialog
      title={`Deactivate ${user.fullName}?`}
      size="sm"
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            type="primary"
            tone="danger"
            id="deact-ok"
            disabled={busy || !!error}
            onClick={onOk}
          >
            Deactivate
          </Button>
        </>
      }
    >
      <p className="t-sm c-sec" style={{ margin: 0 }}>
        They can no longer sign in. Their work and history stay.
      </p>
      {error && <Alert tone="warning" title={error} />}
    </Dialog>
  );
}

/** The invite or reset link: mail delivery is not set up yet, so the admin sends it. */
function LinkDialog({
  title,
  link,
  onClose,
}: {
  title: string;
  link: string | null;
  onClose: () => void;
}) {
  return (
    <Dialog
      title={title}
      onClose={onClose}
      footer={
        <Button type="primary" onClick={onClose}>
          Done
        </Button>
      }
    >
      <p className="t-sm c-sec" style={{ margin: 0 }}>
        Email delivery is not set up yet. Send this link to the user yourself.
        It works once, for 7 days.
      </p>
      <div className="field">
        <label className="flabel" htmlFor="lk">
          Link
        </label>
        <div className="input">
          <input
            id="lk"
            readOnly
            value={link ?? ""}
            onFocus={(e) => e.currentTarget.select()}
          />
        </div>
      </div>
      <div className="row">
        <Button
          icon="check"
          onClick={() => {
            void navigator.clipboard?.writeText(link ?? "");
            toast("Link copied");
          }}
        >
          Copy link
        </Button>
      </div>
    </Dialog>
  );
}

/* ---------- add and edit ---------- */
function UserForm({
  user,
  onClose,
  onInvite,
}: {
  user: User | null;
  onClose: () => void;
  onInvite: (link: string | null) => void;
}) {
  const grid = useRolesGrid();
  const [f, setF] = useState({
    fullName: user?.fullName ?? "",
    email: user?.email ?? "",
    title: user?.title ?? "",
    phone: user?.phone ?? "",
    roles: user?.roles ?? ([] as RoleCode[]),
  });
  const [err, setErr] = useState<Record<string, string>>({});
  const save = useSave(
    () =>
      user
        ? api(`/users/${user.id}`, {
            method: "PATCH",
            json: {
              fullName: f.fullName,
              title: f.title,
              phone: f.phone,
              roles: f.roles,
            },
          })
        : api<{ inviteLink: string | null }>("/users", {
            method: "POST",
            json: f,
          }),
    {
      keys: ["users", "user"],
      done: user ? "User saved" : undefined,
      onDone: (r) => {
        onClose();
        if (!user) onInvite((r as { inviteLink: string | null }).inviteLink);
      },
      onField: (field, text) => setErr({ [field ?? "form"]: text }),
    },
  );
  const submit = () => {
    const e: Record<string, string> = {};
    if (f.fullName.trim().length < 2) e.fullName = "Enter the name.";
    if (!user && !/^\S+@\S+\.\S+$/.test(f.email))
      e.email = "Enter a valid email.";
    if (!f.roles.length) e.roles = "Pick at least one role.";
    setErr(e);
    if (!Object.keys(e).length) save.mutate(undefined);
  };
  const toggle = (r: RoleCode) =>
    setF({
      ...f,
      roles: f.roles.includes(r)
        ? f.roles.filter((x) => x !== r)
        : [...f.roles, r],
    });
  return (
    <Dialog
      title={user ? "Edit user" : "Add user"}
      size="lg"
      phone={useIsPhone()}
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            type="primary"
            id="us-save"
            disabled={save.isPending}
            onClick={submit}
          >
            {user ? "Save" : "Send invite"}
          </Button>
        </>
      }
    >
      <div
        className="grid"
        style={{
          gridTemplateColumns: useIsPhone() ? "1fr" : "1fr 1fr",
          gap: 16,
        }}
      >
        <TextField
          id="us-name"
          label="Name"
          req
          value={f.fullName}
          onChange={(v) => setF({ ...f, fullName: v })}
          error={err.fullName ?? null}
        />
        <TextField
          id="us-email"
          label="Email"
          req
          type="email"
          value={f.email}
          onChange={(v) => setF({ ...f, email: v })}
          error={err.email ?? null}
          {...(user ? { help: "The email cannot be changed here." } : {})}
        />
        <TextField
          label="Title"
          value={f.title}
          onChange={(v) => setF({ ...f, title: v })}
          help="Printed on reports when this person signs."
        />
        <TextField
          label="Phone"
          value={f.phone}
          onChange={(v) => setF({ ...f, phone: v })}
        />
      </div>
      {user && (
        <style>{`#us-email { pointer-events: none; opacity: .6 }`}</style>
      )}
      <div className="field">
        <span className="flabel">
          Roles<span className="req">*</span>
        </span>
        <div className="col g10">
          {(grid.data?.roles ?? []).map((r) => (
            <div key={r.code}>
              <Check
                on={f.roles.includes(r.code)}
                onChange={() => toggle(r.code)}
                label={r.name}
              />
              <span className="t-cap c-sec" style={{ marginLeft: 30 }}>
                {r.description}
              </span>
            </div>
          ))}
        </div>
        {err.roles && <span className="help err">{err.roles}</span>}
      </div>
      {!user && (
        <Note>
          We email an invite when mail is set up; for now you get a link to
          send. It works for 7 days.
        </Note>
      )}
      {err.form && <span className="help err">{err.form}</span>}
    </Dialog>
  );
}

/* ---------- roles tab ---------- */
function RolesTab() {
  const { data, isLoading } = useRolesGrid();
  if (isLoading || !data)
    return (
      <Card>
        <Empty icon="users" title="Loading roles" />
      </Card>
    );
  return (
    <Card>
      <div className="tblwrap">
        <table className="tbl">
          <thead>
            <tr>
              <th>Permission</th>
              {data.roles.map((r) => (
                <th key={r.code} className="c">
                  {r.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.permissions.map((p) => (
              <tr key={p.code}>
                <td>
                  <b className="t-sm w6">{p.description}</b>
                  <span
                    className="t-cap c-mut t-data"
                    style={{ display: "block" }}
                  >
                    {p.code}
                  </span>
                </td>
                {data.roles.map((r) => (
                  <td key={r.code} className="c">
                    {data.grid.includes(`${r.code}:${p.code}`) ? (
                      <span aria-label="Allowed">
                        <Icon n="check" />
                      </span>
                    ) : (
                      <span className="c-mut" aria-label="Not allowed">
                        –
                      </span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Note>
        Roles are fixed in v1. Ask for a change through the product owner.
      </Note>
    </Card>
  );
}

/* ---------- user page ---------- */
export function UserPage() {
  const { id } = useParams();
  const nav = useNavigate(),
    phone = useIsPhone();
  const {
    data: u,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["user", id],
    queryFn: () => api<UserPage>(`/users/${id}`),
  });
  const grid = useRolesGrid();
  const [form, setForm] = useState(false),
    [deact, setDeact] = useState(false),
    [linkOf, setLinkOf] = useState<{
      title: string;
      link: string | null;
    } | null>(null);
  const actions = useUserActions(setLinkOf, () => setDeact(false));
  if (isLoading)
    return (
      <div className="page">
        <Card>
          <Empty icon="users" title="Loading user" />
        </Card>
      </div>
    );
  if (isError || !u)
    return (
      <div className="page">
        <Card>
          <Empty
            icon="question"
            title="This user was not found"
            action={
              <Button onClick={() => nav("/users")}>Back to users</Button>
            }
          />
        </Card>
      </div>
    );
  const roleInfo = (grid.data?.roles ?? []).filter((r) =>
    u.roles.includes(r.code),
  );
  return (
    <div className="page">
      <PageHead
        crumb={[["Users", "/users"], [u.fullName]]}
        avatar={<Avatar name={u.fullName} size={64} />}
        title={u.fullName}
        sub={
          <span className="row g8">
            <RoleBadges roles={u.roles} />
            <Badge
              label={STATUS_LABEL[u.status]}
              tone={STATUS_TONE[u.status]}
            />
          </span>
        }
        actions={
          <>
            <Button
              size="lg"
              icon="pencil-simple"
              id="edit-user"
              onClick={() => setForm(true)}
            >
              Edit
            </Button>
            <Menu
              size={36}
              label="More for this user"
              items={userMenu(
                u,
                actions,
                () => setForm(true),
                () => setDeact(true),
              ).filter((i) => i && (i as { label: string }).label !== "Edit")}
            />
          </>
        }
      />
      <div
        className="grid"
        style={{
          gridTemplateColumns:
            phone || window.innerWidth < 1100
              ? "1fr"
              : "minmax(0,1fr) minmax(0,1fr)",
          alignItems: "start",
        }}
      >
        <div className="col g16" style={{ minWidth: 0 }}>
          <Card title="Details">
            <div>
              <KV k="Email">{u.email}</KV>
              <KV k="Title">{u.title ?? "None"}</KV>
              <KV k="Phone">{u.phone ?? "None"}</KV>
              <KV k="Created">{fmtDate(u.createdAt)}</KV>
            </div>
          </Card>
          <Card
            title="Security"
            actions={
              u.status === "active" && (
                <Button
                  icon="envelope-simple"
                  onClick={() => actions.reset.mutate(u)}
                >
                  Send password reset
                </Button>
              )
            }
          >
            <div>
              <KV k="Status">{STATUS_LABEL[u.status]}</KV>
              <KV k="Last sign-in">
                {u.lastSignInAt ? fmtWhen(u.lastSignInAt) : "Never"}
              </KV>
              <KV k="Failed tries">{u.failedAttempts}</KV>
            </div>
            {u.status === "locked" && (
              <Alert
                tone="warning"
                title={`Locked after too many failed attempts${u.lockedUntil ? ` until ${new Date(u.lockedUntil).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Makassar" })}` : ""}`}
                action={
                  <Button size="sm" onClick={() => actions.unlock.mutate(u)}>
                    Unlock
                  </Button>
                }
              />
            )}
            {u.status === "invited" && (
              <Alert
                tone="info"
                title={`Invite sent ${u.invitedAt ? fmtDate(u.invitedAt) : ""}${u.inviteExpiresAt ? `, expires ${fmtDate(u.inviteExpiresAt)}` : ""}`}
                action={
                  <Button size="sm" onClick={() => actions.resend.mutate(u)}>
                    Resend invite
                  </Button>
                }
              />
            )}
          </Card>
        </div>
        <div className="col g16" style={{ minWidth: 0 }}>
          <Card title="Roles and permissions">
            {roleInfo.map((r) => (
              <div key={r.code} className="col g4">
                <span className="role" style={{ alignSelf: "flex-start" }}>
                  {r.name}
                </span>
                <span className="t-sm c-sec">{r.description}</span>
              </div>
            ))}
            <div className="col g8">
              {u.permissions.map((p) => (
                <div key={p} className="row g8 t-sm">
                  <span
                    style={{
                      color: "var(--status-st-completed)",
                      display: "inline-flex",
                    }}
                  >
                    <Icon n="check" />
                  </span>
                  {permText(grid.data, p)}
                </div>
              ))}
            </div>
            <KV k="Signatory">
              <Tag
                label={u.permissions.includes("report.sign") ? "Yes" : "No"}
                tone={
                  u.permissions.includes("report.sign") ? "green" : "outline"
                }
              />
            </KV>
          </Card>
          <Card
            title="Recent activity"
            actions={
              <Button type="ghost" onClick={() => nav(`/audit?user=${u.id}`)}>
                Open in audit log
              </Button>
            }
          >
            {u.activity.length ? (
              u.activity.map((a, i) => (
                <div
                  key={i}
                  className="row between"
                  style={{
                    borderBottom: "1px solid var(--surface-divider)",
                    paddingBottom: 8,
                  }}
                >
                  <span className="t-sm">
                    {a.screen === "Sign in"
                      ? "Signed in"
                      : `${a.action} ${a.table.replace(/_/g, " ")}${a.label ? `, ${a.label}` : ""}`}
                  </span>
                  <span className="t-cap c-mut">{fmtWhen(a.at)}</span>
                </div>
              ))
            ) : (
              <span className="t-sm c-mut">No activity yet.</span>
            )}
          </Card>
        </div>
      </div>
      {form && (
        <UserForm
          user={u}
          onClose={() => setForm(false)}
          onInvite={() => undefined}
        />
      )}
      {deact && (
        <DeactivateConfirm
          user={u}
          busy={actions.deactivate.isPending}
          onOk={() => actions.deactivate.mutate(u)}
          onClose={() => setDeact(false)}
          error={actions.error}
        />
      )}
      {linkOf && <LinkDialog {...linkOf} onClose={() => setLinkOf(null)} />}
    </div>
  );
}
