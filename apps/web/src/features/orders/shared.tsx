// Shared parts of the job order screens (Job_Order_Build_Design.md): types, status words and tones, the form catalogue hook.
import { useQuery } from "@tanstack/react-query";
import { api } from "../../app/api";
import type { Tone } from "../../components";

export type OrderStatus =
  | "draft"
  | "awaiting_samples"
  | "in_progress"
  | "reported"
  | "delivered"
  | "closed"
  | "cancelled";
export type Std = "ASTM" | "ISO" | "GBT";
export const STD_LABEL: Record<Std, string> = {
  ASTM: "ASTM",
  ISO: "ISO",
  GBT: "GB/T",
};
export const STATUS_LABEL: Record<OrderStatus, string> = {
  draft: "Draft",
  awaiting_samples: "Awaiting samples",
  in_progress: "In progress",
  reported: "Reported",
  delivered: "Delivered",
  closed: "Closed",
  cancelled: "Cancelled",
};
export const STATUS_TONE: Record<OrderStatus, Tone> = {
  draft: "grey",
  awaiting_samples: "amber",
  in_progress: "blue",
  reported: "purple",
  delivered: "green",
  closed: "grey",
  cancelled: "red",
};
export const STATUSES = Object.keys(STATUS_LABEL) as OrderStatus[];

export interface OrderRow {
  id: string;
  orderNo: string;
  status: OrderStatus;
  dueOn: string | null;
  clientReference: string | null;
  companyId: string;
  company: string;
  contact: string | null;
  service: string | null;
  standards: Std[];
  expected: number;
  registered: number;
  received: number;
  batches: number;
  batchesDone: number;
  coa: string | null;
  cso: string | null;
  createdAt: string;
}
export interface OrderList {
  total: number;
  page: number;
  size: number;
  counts: Record<"all" | OrderStatus, number>;
  items: OrderRow[];
}
export interface Gate {
  ok: boolean;
  why: string | null;
}
export interface OrderDetail {
  id: string;
  orderNo: string;
  status: OrderStatus;
  createdAt: string;
  submittedAt: string | null;
  closedAt: string | null;
  cancelledAt: string | null;
  cancelReason: string | null;
  company: { id: string; name: string; address: string };
  contact: {
    id: string;
    fullName: string;
    phone: string | null;
    email: string | null;
    position: string | null;
  } | null;
  clientReference: string | null;
  standards: Std[];
  service: {
    id: string;
    name: string;
    version: number;
    parameterIds: string[];
  } | null;
  parameters: Array<{
    id: string;
    code: string;
    label: string;
    category: string;
  }>;
  groupItems: Array<{
    id: string;
    section: string;
    code: string;
    parameterId: string;
  }>;
  preparation: boolean;
  expectedSamples: number | null;
  sampleType: string | null;
  dueOn: string | null;
  priority: string;
  signatory: { id: string | null; name: string; title: string | null } | null;
  notes: string | null;
  cso: string | null;
  createdBy: string | null;
  counts: {
    samples: number;
    received: number;
    notReceived: number;
    batches: number;
    files: number;
  };
  batches: Array<{
    id: string;
    batchNo: string;
    status: string;
    standard: Std;
    batchDate: string;
    samples: number;
    completedAt: string | null;
  }>;
  can: { edit: Gate; cancel: Gate; close: Gate };
}

export interface CatParam {
  id: string;
  code: string;
  label: string;
  name: string;
  category: string;
  isGroup: boolean;
  subcontracted: boolean;
  kind: string;
  families: Std[];
}
export interface CatItem {
  id: string;
  parameterId: string;
  section: string;
  code: string;
  preset: boolean;
}
export interface CatService {
  id: string;
  code: string;
  name: string;
  version: number;
  isDefault: boolean;
  turnaroundDays: number;
  parameterIds: string[];
}
export interface CatContact {
  id: string;
  fullName: string;
  position: string | null;
  email: string | null;
  phone: string | null;
  isDefault: boolean;
}
export interface CatCompany {
  id: string;
  code: string;
  name: string;
  address: string;
  contacts: CatContact[];
}
export interface CatSignatory {
  id: string;
  name: string;
  title: string;
  isManager: boolean;
}
export interface Catalogue {
  nextOrderNo: string;
  parameters: CatParam[];
  groupItems: CatItem[];
  services: CatService[];
  companies: CatCompany[];
  sampleTypes: string[];
  priorities: string[];
  signatories: CatSignatory[];
}

export const CATALOGUE_KEY = "order-catalogue";
/** What the form needs; only people who may create or edit job orders can read it. */
export const useCatalogue = (enabled = true) =>
  useQuery({
    queryKey: [CATALOGUE_KEY],
    queryFn: () => api<Catalogue>("/orders/catalogue"),
    enabled,
    staleTime: 30_000,
  });

/** Today in the lab's time zone (Asia/Makassar) as yyyy-mm-dd, and a date n days on. */
export const todayIso = (plus = 0) => {
  const d = new Date(Date.now() + plus * 86_400_000);
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Makassar" }).format(
    d,
  );
};
export const pastDue = (o: { dueOn: string | null; status: OrderStatus }) =>
  !!o.dueOn &&
  o.dueOn < todayIso() &&
  (o.status === "awaiting_samples" || o.status === "in_progress");
export const shortDate = (iso: string | null) =>
  iso
    ? new Date(iso + (iso.length === 10 ? "T00:00:00" : "")).toLocaleDateString(
        "en-GB",
        { day: "numeric", month: "short", year: "numeric" },
      )
    : "";
export const shortDay = (iso: string | null) =>
  iso
    ? new Date(iso + (iso.length === 10 ? "T00:00:00" : "")).toLocaleDateString(
        "en-GB",
        { day: "numeric", month: "short" },
      )
    : "";
export const coaLabel = (c: string | null) =>
  c === "issued"
    ? "Published"
    : c === "draft"
      ? "Draft"
      : c === "superseded"
        ? "Revised"
        : "No CoA";
