// Shared parts of the master data screens: types, data hooks, the list layout and the form dialog helpers.
import { useMemo, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, ApiError } from "../../app/api";
import { useBreakpoint, useSession } from "../../app/session";
import { toast } from "../../components";
import type { Tone } from "../../components";

export interface Company { id: string; code: string; companyCode: string; companyCodeLocked: boolean; name: string; address: string | null; billingAddress: string | null; status: "active" | "inactive" | "archived"; archivedAt: string | null; createdAt: string;
  logoUrl: string | null; logoName: string | null; totalSample: number; jobOrders: number; drillHoles: number; lithologies: number; seams: number }
export interface Contact { id: string; fullName: string; position: string | null; email: string | null; phone: string | null; isDefault: boolean }
export interface CoaRef { id: string; fileName: string; sizeBytes: number; uploadedAt: string }
export interface DrillHole { id: string; code: string; description: string | null; archived: boolean; companyId: string; companyName: string; totalSample: number; coa: CoaRef | null }
export interface Lithology { id: string; name: string; kind: "coal" | "parting" | "no_lithology"; archived: boolean; companyId: string; companyName: string; totalSample: number }
export interface Seam { id: string; code: string; description: string | null; sortOrder: number | null; archived: boolean; companyId: string; companyName: string; totalSample: number }

export const STATUS_LABEL = { active: "Active", inactive: "Inactive", archived: "Archived" } as const;
export const STATUS_TONE: Record<Company["status"], Tone> = { active: "green", inactive: "grey", archived: "outline" };
export const KIND_LABEL = { coal: "Coal", parting: "Parting", no_lithology: "No lithology" } as const;
export const KIND_TONE: Record<Lithology["kind"], Tone> = { coal: "blue", parting: "amber", no_lithology: "muted" };

export const useCan = () => { const { me } = useSession(); return (p: string) => !!me?.permissions.includes(p); };
export const useIsPhone = () => useBreakpoint() === "phone";
export const useCompanies = () => useQuery({ queryKey: ["companies"], queryFn: () => api<{ items: Company[] }>("/companies").then((r) => r.items) });
export const useList = <T,>(key: string) => useQuery({ queryKey: [key], queryFn: () => api<{ items: T[] }>(`/${key}`).then((r) => r.items) });
/** Active clients as [id, name] options for Company selects (own endpoint, so roles without Clients access can still filter). */
export const useCompanyOptions = (all?: string) => {
  const q = useQuery({ queryKey: ["company-options"], queryFn: () => api<{ items: Array<{ id: string; name: string }> }>("/company-options").then((r) => r.items), staleTime: 60_000 });
  return useMemo(() => ({ loading: q.isLoading, options: [...(all ? [["", all] as [string, string]] : []), ...(q.data ?? []).map((c) => [c.id, c.name] as [string, string])] }), [q.data, all]);
};

/** A mutation that refreshes the listed queries, toasts on success, and hands a field error back to the form. */
export function useSave<V>(fn: (v: V) => Promise<unknown>, opts: { keys: string[]; done?: string; onDone?: (r: unknown) => void; onField?: (field: string | undefined, text: string) => void }) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: (r) => { opts.keys.forEach((k) => qc.invalidateQueries({ queryKey: [k] })); if (opts.done) toast(opts.done); opts.onDone?.(r); },
    onError: (e) => { const err = e as ApiError; if (opts.onField) opts.onField(err.field, err.message); else toast(err.message, "error"); },
  });
}
export const post = (path: string, json?: unknown) => api(path, { method: "POST", ...(json !== undefined ? { json } : {}) });

/** The list page frame: title, add actions, toolbar, chips, content, and the sticky bar on the phone. */
export function MasterList({ title, actions, toolbar, chips, children }: { title: string; actions?: ReactNode; toolbar: ReactNode; chips: ReactNode; children: ReactNode }) {
  const phone = useIsPhone();
  return <div className="page">
    <div className="page-head"><div className="tt"><span className="t-over">Master data</span><h1 className="t-display">{title}</h1></div>{!phone && actions && <div className="row g10 wrap">{actions}</div>}</div>
    <div className="row g12 wrap" style={{ alignItems: "flex-end" }}>{toolbar}</div>{chips}{children}
    {phone && actions && <div className="sticky-bar">{actions}</div>}</div>;
}
