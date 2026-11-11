// Component layer, part of the FigCraft library port (Stack_Decision_Record S-7, S-8): format.


export const fileSize = (b: number) => (b >= 1048576 ? (b / 1048576).toFixed(1) + " MB" : Math.max(1, Math.round(b / 1024)) + " KB");

export const fmtDate = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Makassar" });

/** "Today 08:02", "Yesterday", or "4 Nov 2026", in the lab's time zone. */
export function fmtWhen(iso: string | null | undefined) {
  if (!iso) return "Never";
  const d = new Date(iso), tz = "Asia/Makassar";
  const day = (x: Date) => x.toLocaleDateString("en-CA", { timeZone: tz });
  if (day(d) === day(new Date())) return "Today " + d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: tz });
  return fmtDate(iso);
}
