// Mark CoA as sent (FigCraft 07-Reports-02-CoA-05 Mark_sent; phone 03-05-01 Mark_sent_sheet): date, recipient, every channel used, an optional note.
// Shared by the CoA page and the job order's CoA card. The first send of the current revision moves the job order to Delivered.
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api, ApiError } from "../../app/api";
import { Button, Check, Dialog, TextArea, TextField, toast } from "../../components";

interface Page { number: string | null; company: string; channels: { value: string; needsRemark: boolean }[]; contents: { attention: { name: string } } }
const today = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Makassar" }).format(new Date());

export function MarkSentDialog({ id, phone, onClose, onDone }: { id: string; phone: boolean; onClose: () => void; onDone: () => void }) {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["coa", id], queryFn: () => api<Page>(`/reports/coa/${id}`) });
  const [on, setOn] = useState(today()), [who, setWho] = useState<string | null>(null), [ch, setCh] = useState<string[]>([]), [note, setNote] = useState(""), [busy, setBusy] = useState(false);
  const [err, setErr] = useState<{ sentOn?: string; recipient?: string; channels?: string; note?: string }>({});
  const d = q.data;
  if (!d) return null;
  const recipient = who ?? d.contents.attention.name ?? "";
  const needNote = d.channels.some((c) => c.needsRemark && ch.includes(c.value));
  const confirm = async () => {
    const e: typeof err = {};
    if (!on) e.sentOn = "Choose the date it was sent."; else if (on > today()) e.sentOn = "The date can't be in the future.";
    if (!recipient.trim()) e.recipient = "Enter who it was sent to.";
    if (!ch.length) e.channels = "Choose at least one way it was sent.";
    if (needNote && !note.trim()) e.note = "Say how it was sent in the note.";
    setErr(e);
    if (Object.keys(e).length) return;
    setBusy(true);
    try {
      await api(`/reports/coa/${id}/deliveries`, { method: "POST", json: { sentOn: on, channels: ch, recipient: recipient.trim(), note: note.trim() || null } });
      toast("Marked as sent");
      for (const k of ["coa", "order-coa", "order", "orders"]) qc.invalidateQueries({ queryKey: [k] });
      onDone();
    } catch (x) { const a = x as ApiError; if (a.field && a.field in e) setErr({ [a.field]: a.message }); else toast(a.message, "error"); } finally { setBusy(false); }
  };
  return (
    <Dialog title="Mark CoA as sent" size="md" phone={phone} onClose={onClose} footer={<><Button onClick={onClose}>Cancel</Button><Button type="primary" id="ms-confirm" disabled={busy} onClick={confirm}>Confirm</Button></>}>
      <div className="col g16">
        <span className="t-sm c-sec">{d.number} for {d.company}.</span>
        <div className={phone ? "col g12" : "row g16"} style={phone ? undefined : { alignItems: "flex-start" }}>
          <div style={{ flex: 1 }}><TextField id="ms-date" type="date" label="Date sent" req value={on} onChange={(v) => { setOn(v); setErr((x) => ({ ...x, sentOn: undefined })); }} error={err.sentOn ?? null} /></div>
          <div style={{ flex: 1 }}><TextField id="ms-recipient" label="Recipient" req value={recipient} onChange={(v) => { setWho(v); setErr((x) => ({ ...x, recipient: undefined })); }} error={err.recipient ?? null} {...(who === null && recipient ? { help: "Pre-filled from the job order contact." } : {})} /></div>
        </div>
        <div className="col g8">
          <span className="flabel">Channel<span className="req">*</span> (tick every way it was sent)</span>
          <span className="row g16 wrap">{d.channels.map((c) => <Check key={c.value} id={`ms-ch-${c.value}`} label={c.value} on={ch.includes(c.value)} onChange={(v) => { setCh(v ? [...ch, c.value] : ch.filter((x) => x !== c.value)); setErr((x) => ({ ...x, channels: undefined })); }} />)}</span>
          {err.channels && <span className="help err">{err.channels}</span>}
        </div>
        <TextArea id="ms-note" label={needNote ? "Note" : "Note (optional)"} req={needNote} rows={2} placeholder="e.g. courier receipt no." value={note} onChange={(v) => { setNote(v); setErr((x) => ({ ...x, note: undefined })); }} />
        {err.note && <span className="help err">{err.note}</span>}
      </div>
    </Dialog>
  );
}
