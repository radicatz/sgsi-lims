// Audit log rows as readable text (Phase 5 slice C2; Phase5_Build_Design.md 12.5; Admin_Screen_Plan.md section 5): table to record type, column to field label (a fixed dictionary),
// ids to names where known, and the before and after of one row as a list of changes. Pure functions: the route reads the rows and the names, these turn them into text.
export type Json = Record<string, unknown> | null;

/** The record type (the Record type filter) of each audited table; the sign-in rows of profiles and the exports are told apart by the route. */
export const TYPE_OF_TABLE: Record<string, string> = {
  job_orders: "Job order", job_order_parameters: "Job order", job_order_group_items: "Job order", job_order_files: "Job order",
  batches: "Batch", batch_parameters: "Batch", batch_documents: "Batch",
  samples: "Sample", sample_attachments: "Sample", sample_intervals: "Sample",
  analyses: "Result", analysis_values: "Result",
  reports: "Report", report_sources: "Report", report_deliveries: "Report",
  companies: "Master data", company_contacts: "Master data", drill_holes: "Master data", seams: "Master data", lithologies: "Master data", coa_files: "Master data",
  profiles: "User", user_roles: "User", role_permissions: "User",
  app_settings: "Configuration", parameters: "Configuration", parameter_group_items: "Configuration", standards: "Configuration", methods: "Configuration", formulas: "Configuration",
  services: "Configuration", service_parameters: "Configuration", validation_rules: "Configuration", report_templates: "Configuration", lookups: "Configuration", signatory_rules: "Configuration",
  saved_queries: "Saved query",
};
export const RECORD_TYPES = ["Job order", "Batch", "Sample", "Result", "Report", "Master data", "User", "Configuration", "Sign-in", "Saved query", "Export"] as const;
export const ACTIONS: Array<[string, string]> = [
  ["created", "Created"], ["updated", "Updated"], ["deleted", "Deleted"], ["status", "Status changed"], ["published", "Published"],
  ["signed_in", "Signed in"], ["signin_failed", "Sign-in failed"], ["locked", "Account locked"], ["exported", "Exported"], ["setting", "Changed setting"],
];
export const ACTION_LABEL = Object.fromEntries(ACTIONS) as Record<string, string>;

/** The table that holds the parent record of a child table, and the column that points to it (a result or a photo is shown under its sample). */
export const PARENT: Record<string, [col: string, kind: string]> = {
  analyses: ["sample_id", "sample"], sample_attachments: ["sample_id", "sample"], sample_intervals: ["sample_id", "sample"], analysis_values: ["analysis_id", "analysis"],
  batch_parameters: ["batch_id", "batch"], batch_documents: ["batch_id", "batch"],
  job_order_parameters: ["job_order_id", "order"], job_order_group_items: ["job_order_id", "order"], job_order_files: ["job_order_id", "order"],
  report_sources: ["report_id", "report"], report_deliveries: ["report_id", "report"], user_roles: ["user_id", "user"],
  company_contacts: ["company_id", "company"], coa_files: ["drill_hole_id", "drill"],
};
/** What the record's own id means, for tables that are a record of their own. */
export const OWN_KIND: Record<string, string> = { job_orders: "order", batches: "batch", samples: "sample", reports: "report", profiles: "user", companies: "company", drill_holes: "drill" };
/** Columns that name another record, and which kind of record it is (shown as its name, not its id). */
export const REF_COLUMN: Record<string, string> = {
  company_id: "company", batch_id: "batch", released_from_batch_id: "batch", job_order_id: "order", drill_hole_id: "drill", seam_id: "seam", lithology_id: "lithology",
  parameter_id: "parameter", service_id: "service", sample_id: "sample", report_id: "report", user_id: "user", contact_id: "contact",
};

const FIELD: Record<string, string> = {
  client_ref: "Client reference", client_description: "Client description", drill_hole_text: "Drill hole or lot", depth_from: "Depth from (m)", depth_to: "Depth to (m)", remarks: "Remarks",
  sample_type: "Sample type", ply_comp: "Ply or composite", sample_no: "Sample ID", sample_code: "Sample code", lot: "Lot", received_at: "Received", arrived_at: "Arrived", on_hold: "On hold",
  hold_reason: "Hold reason", mass_received_kg: "Mass received (kg)", condition: "Condition", condition_remark: "Condition remark", not_received_reason: "Not received reason", not_received_note: "Not received note",
  state: "State", status: "Status", batch_no: "Batch number", batch_date: "Batch date", deadline_on: "Deadline", standard: "Standard", coc_no: "Chain of custody no.", priority: "Priority", notes: "Notes",
  order_no: "Job order number", due_on: "Due date", expected_samples: "Expected samples", client_reference: "Client reference", signatory_name: "Signatory", signatory_title: "Signatory title",
  roa_no: "RoA number", report_no: "Report number", revision: "Revision", revision_reason: "Revision reason", void_reason: "Void reason", issued_at: "Issued", voided_at: "Voided", sent_on: "Sent on",
  channels: "Channels", recipient: "Recipient", full_name: "Name", email: "Email", title: "Title", phone: "Phone", failed_attempts: "Failed attempts", locked_until: "Locked until",
  last_sign_in_at: "Last sign-in", invited_at: "Invited", invite_expires_at: "Invite expires", password_changed_at: "Password changed", failed_since: "First failed attempt",
  name: "Name", code: "Code", description: "Description", active: "Active", archived_at: "Archived", value: "Value", key: "Setting", label: "Label", unit: "Unit", decimals: "Decimals",
  sort_order: "Order", kind: "Kind", severity: "Severity", turnaround_days: "Turnaround (days)", version: "Version", is_default: "Default", prefs: "Preferences", shared: "Shared with staff",
  company_id: "Company", batch_id: "Batch", released_from_batch_id: "Released from batch", job_order_id: "Job order", drill_hole_id: "Drill hole", seam_id: "Seam", lithology_id: "Lithology",
  parameter_id: "Parameter", service_id: "Service", sample_id: "Sample", report_id: "Report", user_id: "User", contact_id: "Contact", file_name: "File name", is_current: "Current",
  qualifier: "Qualifier", value_num: "Value", value_text: "Value", basis: "Basis", round: "Round", entered_at: "Entered", verify_code: "Verify code", print_count: "Prints",
};
/** Columns that are plumbing or private: never listed under Changes. */
const HIDDEN = new Set(["id", "updated_at", "created_at", "storage_path", "sha256", "size_bytes", "request_id", "row_no", "created_by", "updated_by", "uploaded_by", "entered_by", "received_by", "arrived_by",
  "released_by", "not_received_by", "issued_by", "voided_by", "completed_by", "owner", "owner_id", "attributes", "last_printed_at", "reception_confirmed_by", "expected_at_confirm", "hash", "token"]);

const humanize = (k: string) => { const s = k.replace(/_/g, " "); return s[0]!.toUpperCase() + s.slice(1); };
export const fieldLabel = (k: string) => FIELD[k] ?? humanize(k);
const TZ = "Asia/Makassar";

/** One value as the person reads it. `names` resolves the ids of other records: key `kind:id`. */
export function showValue(k: string, v: unknown, names: Map<string, string>): string | null {
  if (v === null || v === undefined || v === "") return null;
  if (typeof v === "boolean") return v ? "Yes" : "No";
  if (REF_COLUMN[k] && typeof v === "string") return names.get(`${REF_COLUMN[k]}:${v}`) ?? "Removed record";
  if (k === "status" || k === "state") return humanize(String(v).replace(/_/g, " ")).replace(/^(.)/, (c) => c.toUpperCase());
  if (k.startsWith("depth_")) return Number(v).toFixed(2);
  if (/_at$/.test(k) && typeof v === "string" && !Number.isNaN(Date.parse(v)))
    return new Date(v).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: TZ });
  if (Array.isArray(v)) return v.length ? v.map(String).join(", ") : null;
  if (typeof v === "object") { const t = JSON.stringify(v); return t.length > 90 ? `${t.slice(0, 87)}...` : t; }
  return String(v);
}

export interface Change { field: string; before: string | null; after: string | null }

/**
 * The changes of one row. An update lists the columns whose value differs; an insert lists what was set (after only); a delete lists what was there (before only).
 * A result value is one change named by its parameter and basis ("Ash (ADB)"), which `valueName` gives.
 */
export function changesOf(row: { table_name: string; action: string; before: Json; after: Json }, names: Map<string, string>, valueName?: string | null, hide?: string): Change[] {
  const b = row.before ?? {}, a = row.after ?? {};
  if (row.table_name === "analysis_values") {
    const pick = (o: Record<string, unknown>) => (o.value_text ?? (o.value_num != null ? `${o.qualifier ?? ""}${o.value_num}` : null)) as string | null;
    const x = row.action === "insert" ? null : pick(b), y = row.action === "delete" ? null : pick(a);
    return x === y ? [] : [{ field: valueName ?? "Value", before: x == null ? null : String(x), after: y == null ? null : String(y) }];
  }
  const keys = [...new Set([...Object.keys(b), ...Object.keys(a)])].filter((k) => !HIDDEN.has(k) && k !== hide);   // `hide`: the column that points to the parent record, which is the record itself
  const out: Change[] = [];
  for (const k of keys) {
    if (row.action === "update" && JSON.stringify(b[k] ?? null) === JSON.stringify(a[k] ?? null)) continue;
    const before = row.action === "insert" ? null : showValue(k, b[k], names), after = row.action === "delete" ? null : showValue(k, a[k], names);
    if (row.action !== "update" && before === null && after === null) continue;
    out.push({ field: fieldLabel(k), before, after });
  }
  return out;
}

/** The "Changes" cell: the field name for one change, "N fields" for several, nothing for none. */
export const changeSummary = (c: Change[]) => (c.length === 0 ? "" : c.length === 1 ? c[0]!.field : `${c.length} fields`);

/** The id of the person a sign-in row is about, and whether it is a sign-in row at all (the screen "Sign in" changes the profile). */
export const isSignIn = (row: { table_name: string; screen: string | null }) => row.table_name === "profiles" && row.screen === "Sign in";
