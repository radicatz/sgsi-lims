// Shared parts of the batch screens (Batch_Build_Design.md): types, status words and tones, dates, and where a batch opens.
import { BATCH_STATUS, type BatchStatus } from "@sgsi/shared";
import type { Tone } from "../../components";

export type { BatchStatus };
export type Std = "ASTM" | "ISO" | "GBT";
export const STD_LABEL: Record<Std, string> = { ASTM: "ASTM", ISO: "ISO", GBT: "GB/T" };
export const STATUS_LABEL = (s: string) => BATCH_STATUS[s as BatchStatus]?.[0] ?? s;
export const STATUS_TONE = (s: string) => (BATCH_STATUS[s as BatchStatus]?.[1] ?? "grey") as Tone;
/** The chips of the list (spec S-07): Receiving is a badge of the Created chip. */
export const STAGES = ["created", "preparation", "prep_finished", "analysis", "analysis_finished", "completed"] as const;
export type Stage = (typeof STAGES)[number];

/** The tab a batch opens on (plan 13.1 L2): the one that matches its status. */
export const tabFor = (status: string) =>
  status === "created" || status === "receiving" ? "reception" : status === "preparation" || status === "prep_finished" ? "preparation" : "analysis";

export interface BatchRow {
  id: string;
  batchNo: string;
  batchDate: string;
  deadlineOn: string | null;
  standard: Std;
  status: string;
  orderNo: string;
  company: string;
  arrived: number;
  expected: number;
  roaNo: string | null;
  pastDue: boolean;
}
export interface BatchList {
  total: number;
  page: number;
  size: number;
  counts: Record<"all" | Stage, number>;
  orders: Array<{ orderNo: string; company: string }>;
  items: BatchRow[];
}
export interface BatchPageData {
  id: string;
  batchNo: string;
  status: string;
  stored: string;
  batchDate: string;
  deadlineOn: string | null;
  standard: Std;
  cocNo: string | null;
  priority: string;
  notes: string | null;
  branch: string;
  order: { id: string; orderNo: string; status: string };
  company: { id: string; name: string; short: string };
  counts: { inBatch: number; arrived: number; received: number; held: number; expected: number };
  returned: string[];
  parameters: Array<{ code: string; label: string }>;
  dates: {
    createdAt: string;
    createdBy: string | null;
    firstArrivedAt: string | null;
    receptionConfirmedAt: string | null;
    prepFinishedAt: string | null;
    analysisStartedAt: string | null;
    analysisFinishedAt: string | null;
    completedAt: string | null;
  };
  roa: { roaNo: string; fileName: string; sizeBytes: number; uploadedAt: string; uploadedBy: string | null } | null;
}
export interface RecRow {
  id: string;
  rowNo: number;
  clientRef: string;
  description: string | null;
  sampleNo: string | null;
  sampleCode: string | null;
  lot: string;
  arrived: boolean;
  arrivedAt: string | null;
  mass: string | null;
  condition: string | null;
  conditionRemark: string | null;
  label: { printed: boolean; count: number; at: string | null };
  hold: { reason: string | null; note: string | null } | null;
  received: boolean;
  photos: { count: number; thumb: string | null };
}
export interface Reception {
  open: boolean;
  status: string;
  conditions: Array<{ value: string; needsRemark: boolean }>;
  holdReasons: Array<{ value: string; needsNote: boolean }>;
  photoTags: string[];
  checks: Array<{ text: string; ok: boolean }>;
  items: RecRow[];
}

/** "27 Oct", "27 Oct 2026" and "27 Oct 10:42" in the lab's time zone (Asia/Makassar). */
const TZ = "Asia/Makassar";
const mk = (iso: string) => new Date(iso.length === 10 ? `${iso}T00:00:00` : iso);
export const dShort = (iso: string | null | undefined) => (iso ? mk(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", ...(iso.length > 10 ? { timeZone: TZ } : {}) }) : "");
export const dLong = (iso: string | null | undefined) => (iso ? mk(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", ...(iso.length > 10 ? { timeZone: TZ } : {}) }) : "");
export const dTime = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: TZ }) : "";
export const todayIso = (plus = 0) => new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(new Date(Date.now() + plus * 86_400_000));
