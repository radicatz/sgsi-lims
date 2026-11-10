// Permission codes and the sidebar (Navigation plan section 2, spec 8.2). The grid itself lives in the database
// (role_permissions); this file only names the codes and says which code opens which page.

export const PERMISSIONS = [
  "user.manage", "role.manage", "company.read", "company.manage", "master.read", "master.write",
  "order.read", "order.create", "order.edit", "order.cancel", "batch.read", "batch.create", "batch.number.edit",
  "sample.receive", "sample.photo", "label.print", "batch.transition.prep", "result.write.prep",
  "batch.transition.analysis", "result.write", "result.read", "batch.document.upload", "batch.complete",
  "report.publish", "report.revise", "report.void", "report.sign", "coa.download", "coa.mark_sent", "roa.download",
  "coa.upload", "dashboard.operations", "dashboard.quality", "search.use", "work.use", "config.write", "audit.read",
] as const;
export type Permission = (typeof PERMISSIONS)[number];

export const ROLES = ["superadmin", "lab_admin", "supervisor", "manager", "cso", "prep", "analyst"] as const;
export type RoleCode = (typeof ROLES)[number];
export const ROLE_LABEL: Record<RoleCode, string> = {
  superadmin: "Superadmin", lab_admin: "Lab admin", supervisor: "Supervisor", manager: "Manager",
  cso: "CSO", prep: "Preparation", analyst: "Analyst",
};

/** A page in the sidebar and what opens it: any one of `anyOf`. */
export interface NavItem { id: string; label: string; icon: string; path: string; anyOf: Permission[] }
export interface NavGroup { group: "WORK" | "MASTER DATA" | "ADMIN"; items: NavItem[] }

export const NAV: NavGroup[] = [
  { group: "WORK", items: [
    { id: "work", label: "My work", icon: "check-square-offset", path: "/work", anyOf: ["work.use"] },
    { id: "dashboard", label: "Dashboard", icon: "squares-four", path: "/", anyOf: ["dashboard.operations"] },
    { id: "orders", label: "Job orders", icon: "clipboard-text", path: "/orders", anyOf: ["order.read"] },
    { id: "batches", label: "Batches", icon: "stack", path: "/batches", anyOf: ["batch.read"] },
    { id: "reports", label: "Reports", icon: "file-text", path: "/reports", anyOf: ["coa.download", "roa.download"] },
    { id: "search", label: "Search", icon: "magnifying-glass", path: "/search", anyOf: ["search.use"] },
  ] },
  { group: "MASTER DATA", items: [
    { id: "clients", label: "Clients", icon: "buildings", path: "/clients", anyOf: ["company.read"] },
    { id: "drill-holes", label: "Drill hole", icon: "cylinder", path: "/master/drill-holes", anyOf: ["master.read"] },
    { id: "lithologies", label: "Lithology", icon: "package", path: "/master/lithologies", anyOf: ["master.read"] },
    { id: "seams", label: "Seam", icon: "rows", path: "/master/seams", anyOf: ["master.read"] },
  ] },
  { group: "ADMIN", items: [
    { id: "users", label: "Users", icon: "users", path: "/users", anyOf: ["user.manage"] },
    { id: "config", label: "Configuration", icon: "gear-six", path: "/config", anyOf: ["config.write"] },
    { id: "audit", label: "Audit log", icon: "clock-counter-clockwise", path: "/audit", anyOf: ["audit.read"] },
  ] },
];

export const canAny = (have: readonly string[], need: readonly string[]): boolean => need.some((p) => have.includes(p));

/** The sidebar a user sees: groups with at least one item they can open. */
export function navFor(perms: readonly string[]): NavGroup[] {
  return NAV.map((g) => ({ ...g, items: g.items.filter((i) => canAny(perms, i.anyOf)) })).filter((g) => g.items.length > 0);
}

/** Start page: My work for roles with queues, Dashboard for the rest (Navigation plan section 2). */
export function startPath(perms: readonly string[], pref?: string | null): string {
  const pages = navFor(perms).flatMap((g) => g.items);
  if (pref && pages.some((p) => p.path === pref)) return pref;
  return perms.includes("work.use") ? "/work" : "/";
}
