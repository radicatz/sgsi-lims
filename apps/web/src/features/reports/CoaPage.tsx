// The CoA page (FigCraft module 07 Reports, Reports_Build_Design sections 4 and 5): a draft is filled and sent for signature, the named signatory signs
// with their password, and a published certificate shows its details, deliveries and versions. The preview is the real PDF in a frame (phone: Open PDF).
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api, apiBlob, ApiError } from "../../app/api";
import { useBreakpoint } from "../../app/session";
import { Alert, Badge, Button, Card, Check, Dialog, Empty, Icon, KV, Menu, PageHead, PasswordField, Select, TextArea, TextField, fmtDate, toast } from "../../components";
import { COA_STATUS } from "./status";
import { useSigningImage } from "../common/SigningCards";
import { MarkSentDialog } from "./MarkSentDialog";

interface Coa {
  id: string; number: string | null; revision: number; status: "draft" | "awaiting_signature" | "issued" | "superseded" | "void";
  orderNo: string; company: string; companyId: string; sent: boolean; pages: number | null;
  contents: {
    template: string; bases: string[]; reported: number; left: { notReceived: number; held: number; awaiting: number } | null;
    parameters: { id: string; code: string; label: string; on: boolean }[];
    attention: { id: string | null; name: string }; contacts: { id: string; name: string }[];
    clientReference: string; remarks: string; onBehalfOf: string;
    signatory: { id: string; name: string; title: string } | null; signers: { id: string; name: string; title: string }[];
  };
  details: null | { reference: string; attention: string; bases: string[]; parameters: number; samples: number; publishedAt: string; publishedBy: string; signatory: { name: string; title: string; onBehalfOf: string }; printed: { count: number; last: string | null }; verifyCode: string };
  signing: { assets: { signature: boolean; stamp: boolean } | null; sentBy: string | null; sentAt: string | null; returned: { by: string | null; at: string; comment: string } | null; draftedBy: string | null };
  deliveries: { id: string; sentOn: string; channels: string[]; recipient: string; note: string | null; by: string | null }[];
  versions: { id: string; revision: number; status: string; number: string | null; at: string; reason: string; current: boolean }[];
  clientDefaults: { bases: string[] | null; signatoryId: string | null }; channels: { value: string; needsRemark: boolean }[]; voided: { reason: string; at: string; by: string | null } | null; newer: string | null;
  can: { saveDefaults: boolean; markSent: boolean; revise: boolean; void: boolean; edit: boolean; send: boolean; sendWhy: string | null; withdraw: boolean; remove: boolean; sign: boolean; return: boolean; download: boolean; print: boolean; preview: boolean };
}
const BASES: Array<[string, string]> = [["adb", "ADB"], ["db", "DB"], ["daf", "DAF"], ["ar", "AR"]];
const whenText = (iso: string | null | undefined) => (iso ? fmtDate(iso) : "");

/** The certificate as a PDF, fetched with the session's token; `v` forces a new render after a save. */
function usePdf(id: string, v: string) {
  const [url, setUrl] = useState<string | null>(null), [err, setErr] = useState<string | null>(null);
  useEffect(() => {
    let dead = false, made: string | null = null;
    setErr(null);
    apiBlob(`/reports/coa/${id}/pdf`).then((b) => { if (dead) return; made = URL.createObjectURL(b); setUrl(made); }).catch((e) => { if (!dead) setErr((e as ApiError).message); });
    return () => { dead = true; if (made) URL.revokeObjectURL(made); };
  }, [id, v]);
  return { url, err };
}

function Preview({ id, v, phone, title, pages }: { id: string; v: string; phone: boolean; title: string; pages?: number | null }) {
  const { url, err } = usePdf(id, v);
  if (err) return <Alert tone="warning" title="The preview is not available" text={err} />;
  if (phone) {
    return (
      <div className="roa-file" id="coa-doc">
        <span aria-hidden style={{ width: 64, height: 90, flex: "none", borderRadius: 4, background: "var(--primary-50)", border: "1px solid var(--surface-border)", display: "grid", alignContent: "start", gap: 5, padding: "10px 8px" }}>
          {[100, 80, 100, 60, 90, 70].map((w, i) => <i key={i} style={{ display: "block", height: 3, width: `${w}%`, background: "var(--surface-border-strong, #d9cfbf)", borderRadius: 2 }} />)}
        </span>
        <span className="col" style={{ gap: 2, minWidth: 0, flex: 1 }}>
          <b className="t-sm c-head ellip">{title}</b>
          <span className="t-cap c-sec">{pages ? `${pages} ${pages === 1 ? "page" : "pages"}` : "PDF, A4"}</span>
          <span><Button size="sm" icon="file-pdf" id="coa-open" disabled={!url} onClick={() => url && window.open(url, "_blank", "noopener")}>Open PDF</Button></span>
        </span>
      </div>
    );
  }
  return url ? <iframe title={title} src={url} id="coa-preview" style={{ width: "100%", height: "78vh", minHeight: 560, border: "1px solid var(--border, #d9dde3)", borderRadius: 8, background: "#fff" }} /> : <Empty icon="file-pdf" title="Preparing the preview" />;
}

export function CoaPage() {
  const { id = "" } = useParams(), nav = useNavigate(), qc = useQueryClient(), phone = useBreakpoint() === "phone";
  const q = useQuery({ queryKey: ["coa", id], queryFn: () => api<Coa>(`/reports/coa/${id}`) });
  const [ver, setVer] = useState(0), [busy, setBusy] = useState(false);
  const [dlg, setDlg] = useState<null | "sign" | "return" | "delete" | "withdraw" | "send" | "sent" | "revise" | "void">(null);
  const [reason, setReason] = useState(""), [rErr, setRErr] = useState("");
  const [skipDefaults, setSkipDefaults] = useState(() => { try { return !!localStorage.getItem(`sgsi.skipDefaults.${id}`); } catch { return false; } });
  const [pw, setPw] = useState(""), [pwErr, setPwErr] = useState(""), [comment, setComment] = useState(""), [cErr, setCErr] = useState("");
  // the draft's form; `saved` is what the server has, so typing is never overwritten by a refresh
  type Form = { bases: string[]; params: string[]; attention: string; ref: string; remarks: string; onBehalf: string; signatory: string };
  const [f, setF] = useState<Form | null>(null), [saved, setSaved] = useState<Form | null>(null);
  const c = q.data;
  useEffect(() => {
    if (!c) return;
    const form: Form = { bases: c.contents.bases, params: c.contents.parameters.filter((p) => p.on).map((p) => p.id), attention: c.contents.attention.id ?? "", ref: c.contents.clientReference, remarks: c.contents.remarks, onBehalf: c.contents.onBehalfOf, signatory: c.contents.signatory?.id ?? "" };
    setF(form); setSaved(form);
  }, [c]);
  const sigImg = useSigningImage("signature", dlg === "sign" && !!c?.signing.assets?.signature), stampImg = useSigningImage("stamp", dlg === "sign" && !!c?.signing.assets?.stamp);
  const key = (x: Form | null) => (x ? JSON.stringify([x.bases, x.params.slice().sort(), x.attention, x.ref, x.remarks, x.onBehalf, x.signatory]) : "");
  const dirty = !!c && c.status === "draft" && key(f) !== key(saved);
  const write = async (x: Form) => {
    await api(`/reports/coa/${id}`, { method: "PATCH", json: { bases: x.bases, parameterIds: x.params, attentionContactId: x.attention || null, clientReference: x.ref.trim() || null, remarks: x.remarks.trim() || null, signatoryId: x.signatory || null, onBehalfOf: x.onBehalf.trim() || null } });
    setSaved(x); setVer((n) => n + 1);
  };
  // saved as you go (Build Design 6.4): a short pause after the last change
  useEffect(() => {
    if (!dirty || !f) return;
    const t = setTimeout(() => { write(f).catch((e) => toast((e as ApiError).message, "error")); }, 800);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dirty, key(f)]);

  if (q.isLoading) return <div className="page"><Card><Empty icon="certificate" title="Loading certificate" /></Card></div>;
  if (q.error || !c || !f) {
    return <div className="page"><Card><Empty icon="certificate" title="Certificate not found" text="It may have been removed, or you may not have access." action={<Button onClick={() => nav("/reports")}>Back to reports</Button>} /></Card></div>;
  }
  const open = c.status === "draft" || c.status === "awaiting_signature", [stText, stTone] = c.status === "issued" && c.sent ? (["Sent", "green"] as const) : COA_STATUS[c.status]!;
  const refresh = () => { for (const k of ["coa", "order-coa", "order", "orders"]) qc.invalidateQueries({ queryKey: [k] }); };
  const run = async (fn: () => Promise<unknown>, done?: string) => {
    setBusy(true);
    try { await fn(); if (done) toast(done); refresh(); setVer((n) => n + 1); return true; }
    catch (e) { toast((e as ApiError).message, "error"); return false; } finally { setBusy(false); }
  };
  const send = async () => { if (dirty && f) { try { await write(f); } catch (e) { return toast((e as ApiError).message, "error"); } } if (await run(() => api(`/reports/coa/${c.id}/send`, { method: "POST" }), "Sent for signature")) setDlg(null); };
  const sign = async () => {
    if (!pw) return setPwErr("Enter your password.");
    setBusy(true); setPwErr("");
    try { await api(`/reports/coa/${c.id}/sign`, { method: "POST", json: { password: pw } }); toast("Certificate signed and published"); setDlg(null); setPw(""); refresh(); setVer((n) => n + 1); }
    catch (e) { const a = e as ApiError; if (a.field === "password") setPwErr(a.message); else { toast(a.message, "error"); setDlg(null); refresh(); } } finally { setBusy(false); }
  };
  const giveBack = async () => {
    if (!comment.trim()) return setCErr("Write what to change.");
    setBusy(true);
    try { await api(`/reports/coa/${c.id}/return`, { method: "POST", json: { comment } }); toast("Returned to the lab"); setDlg(null); setComment(""); refresh(); }
    catch (e) { setCErr((e as ApiError).message); } finally { setBusy(false); }
  };
  const download = async () => {
    try { const b = await apiBlob(`/reports/coa/${c.id}/pdf`), u = URL.createObjectURL(b), a = document.createElement("a"); a.href = u; a.download = `${c.number ?? "CoA"}.pdf`; a.click(); setTimeout(() => URL.revokeObjectURL(u), 2000); }
    catch (e) { toast((e as ApiError).message, "error"); }
  };
  const print = async () => {
    try { const b = await apiBlob(`/reports/coa/${c.id}/pdf`), u = URL.createObjectURL(b); window.open(u, "_blank", "noopener"); await api(`/reports/coa/${c.id}/print`, { method: "POST" }); refresh(); }
    catch (e) { toast((e as ApiError).message, "error"); }
  };
  const revise = async () => {
    if (!reason.trim()) return setRErr("Write the reason.");
    setBusy(true);
    try { const r = await api<{ id: string }>(`/reports/coa/${c.id}/revise`, { method: "POST", json: { reason } }); toast(`Revision ${c.revision + 1} started as a draft`); setDlg(null); setReason(""); refresh(); nav(`/reports/coa/${r.id}`); }
    catch (e) { const a = e as ApiError, id2 = (a.data as { id?: string } | undefined)?.id; if (id2) { setDlg(null); nav(`/reports/coa/${id2}`); } else setRErr(a.message); } finally { setBusy(false); }
  };
  const voidIt = async () => {
    if (!reason.trim()) return setRErr("Write the reason.");
    setBusy(true);
    try { await api(`/reports/coa/${c.id}/void`, { method: "POST", json: { reason } }); toast("Certificate voided"); setDlg(null); setReason(""); refresh(); }
    catch (e) { setRErr((e as ApiError).message); } finally { setBusy(false); }
  };
  const saveDefaults = async () => {
    try { await api(`/companies/${c.companyId}/coa-defaults`, { method: "PUT", json: { bases: (c.details?.bases ?? c.contents.bases).map((b) => b.toLowerCase()), signatoryId: c.contents.signatory?.id ?? null } }); toast(`Saved as ${c.company}'s default`); refresh(); }
    catch (e) { toast((e as ApiError).message, "error"); }
  };
  const previewPdf = async () => { try { const b = await apiBlob(`/reports/coa/${c.id}/pdf`); window.open(URL.createObjectURL(b), "_blank", "noopener"); } catch (e) { toast((e as ApiError).message, "error"); } };
  const toggle = (list: string[], v: string) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
  const draft = c.status === "draft" && c.can.edit, waitingNow = c.status === "awaiting_signature";
  const titleText = c.number ?? "Draft CoA";

  const actions = (
    <>
      {c.can.download && <Button icon="download-simple" id="coa-download" onClick={download}>Download</Button>}
      {c.can.print && <Button icon="printer" id="coa-print" onClick={print}>Print</Button>}
      {c.can.withdraw && <Button id="coa-withdraw" onClick={() => setDlg("withdraw")}>Withdraw</Button>}
      {c.can.return && <Button icon="arrow-u-up-left" id="coa-return" onClick={() => { setCErr(""); setDlg("return"); }}>Return</Button>}
      {c.can.sign && <Button type="primary" icon="pencil-simple-line" id="coa-sign" onClick={() => { setPw(""); setPwErr(""); setDlg("sign"); }}>Sign and publish</Button>}
      {c.can.markSent && <Button type="primary" icon="paper-plane-tilt" id="coa-marksent" onClick={() => setDlg("sent")}>{c.sent ? "Add another send" : "Mark sent"}</Button>}
      {c.can.send && <Button type="primary" icon="check" id="coa-send" disabled={busy || !!c.can.sendWhy} why={c.can.sendWhy ?? undefined} onClick={() => setDlg("send")}>Send for signature</Button>}
    </>
  );
  const menuItems = [
    draft && c.can.remove && { label: "Delete draft", icon: "trash", onClick: () => setDlg("delete") },
    c.can.revise && { label: "Revise", icon: "arrows-clockwise", onClick: () => { setReason(""); setRErr(""); setDlg("revise"); } },
    c.can.void && { label: "Void", icon: "prohibit", onClick: () => { setReason(""); setRErr(""); setDlg("void"); } },
  ];
  const menu = menuItems.some(Boolean) ? <Menu label="More actions" size={36} items={menuItems} /> : null;
  const sub = (
    <span className="row g16 wrap t-sm c-sec">
      <Link to={`/orders/${c.orderNo}`} className="c-act t-data" id="coa-order">{c.orderNo}</Link>
      <span>{c.company}</span>
      <span>Revision {c.revision}</span>
      {c.pages != null && <span>{c.pages} {c.pages === 1 ? "page" : "pages"}</span>}
    </span>
  );
  const sentOn = whenText(c.signing.sentAt);
  const banner = waitingNow ? (
    c.can.sign
      ? <Alert tone="info" title={`${c.signing.sentBy ?? "The lab"} asks you to sign this certificate`} text={`Sent on ${sentOn}. Check every page, then sign or return it with a comment.`} />
      : <Alert tone="info" title={`Waiting for ${c.contents.signatory?.name ?? "the signatory"} to sign`} text={`Sent by ${c.signing.sentBy ?? "the lab"} on ${sentOn}.${c.can.withdraw ? " Withdraw it to change the contents." : ""}`} />
  ) : c.signing.returned && c.status === "draft" ? (
    <Alert tone="warning" title={`Returned by ${c.signing.returned.by ?? "the signatory"} on ${whenText(c.signing.returned.at)}`} text={c.signing.returned.comment} />
  ) : c.status === "issued" && c.can.saveDefaults && c.details && !skipDefaults && (c.clientDefaults.bases?.join() !== c.details.bases.map((b) => b.toLowerCase()).join() || (c.contents.signatory && c.clientDefaults.signatoryId !== c.contents.signatory.id)) ? (
    <Alert tone="info" title={`Save these bases and signatory as ${c.company}'s default?`} text="The next CoA for this client starts with them."
      action={<span className="row g8"><Button size="sm" onClick={() => { try { localStorage.setItem(`sgsi.skipDefaults.${c.id}`, "1"); } catch { /* storage blocked */ } setSkipDefaults(true); }}>Not now</Button><Button size="sm" type="primary" id="coa-save-defaults" onClick={saveDefaults}>Save as default</Button></span>} />
  ) : c.status === "superseded" ? (
    <Alert tone="warning" title={`Superseded by revision ${(c.versions.find((v) => v.id === c.newer)?.revision) ?? c.revision + 1}${c.versions.find((v) => v.id === c.newer)?.at ? ` on ${whenText(c.versions.find((v) => v.id === c.newer)!.at)}` : ""}`}
      text={<>This version is kept for the record. You can only download it.{c.newer && <> <Link to={`/reports/coa/${c.newer}`} className="c-act" id="coa-newer">Open the newer revision</Link>.</>}</>} />
  ) : c.status === "void" && c.voided ? (
    <Alert tone="error" title={`Void since ${whenText(c.voided.at)}${c.voided.by ? ` by ${c.voided.by}` : ""}`} text={`${c.voided.reason}. The number is not reused.`} />
  ) : null;

  const ct = c.contents, left = ct.left && ct.left.notReceived + ct.left.held + ct.left.awaiting > 0 ? [ct.left.notReceived ? `${ct.left.notReceived} not received` : "", ct.left.held ? `${ct.left.held} on hold` : "", ct.left.awaiting ? `${ct.left.awaiting} not in a batch yet` : ""].filter(Boolean).join(", ") : "";
  const samples = <span>{ct.reported} {ct.reported === 1 ? "sample" : "samples"}{left && <span className="c-mut">{`. ${left} left out`}</span>}</span>;
  const contents = draft && f ? (
    <Card title="Contents">
      <div className="col g16">
        <div className="kv"><span>Template</span><span>{ct.template}</span></div>
        <div className="col g8"><span className="t-sm c-sec">Bases</span>
          <span className="row g16 wrap">{BASES.map(([v, l]) => <Check key={v} id={`coa-basis-${v}`} label={l} on={f.bases.includes(v)} onChange={() => setF({ ...f, bases: toggle(f.bases, v) })} />)}</span></div>
        <div className="col g8"><span className="t-sm c-sec">Parameters</span>
          <span className="row g8 wrap">{ct.parameters.map((p) => {
            const on = f.params.includes(p.id);
            return <button key={p.id} type="button" className="chip sm" aria-pressed={on} title={on ? "Printed. Click to leave it out." : "Left out. Click to print it."} onClick={() => setF({ ...f, params: toggle(f.params, p.id) })}
              style={on ? { background: "var(--primary-50)" } : { color: "var(--text-muted)", borderStyle: "dashed", background: "transparent" }}>{p.label}</button>;
          })}</span></div>
        <div className="col g4"><span className="t-sm c-sec">Samples</span><span className="t-sm">{samples}</span></div>
        <Select id="coa-attention" label="Attention" value={f.attention} onChange={(v) => setF({ ...f, attention: v })} options={[["", "No attention line"], ...ct.contacts.map((x): [string, string] => [x.id, x.name])]} />
        <TextField id="coa-ref" label="Client reference or PO" value={f.ref} onChange={(v) => setF({ ...f, ref: v })} />
        <TextArea id="coa-remarks" label="Remarks" rows={3} placeholder="Printed under the results" value={f.remarks} onChange={(v) => setF({ ...f, remarks: v })} />
        <Select id="coa-signatory" label="Signatory" req value={f.signatory} onChange={(v) => setF({ ...f, signatory: v })} help="People with signing rights. They sign with their own login."
          options={[["", "Choose who signs"], ...ct.signers.map((s): [string, string] => [s.id, s.title ? `${s.name}, ${s.title}` : s.name])]} />
        <TextField id="coa-behalf" label="On behalf of (optional)" value={f.onBehalf} onChange={(v) => setF({ ...f, onBehalf: v })} placeholder="e.g. Laboratory Manager" />
      </div>
    </Card>
  ) : open ? (
    <Card title="Contents">
      <div className="col g4">
        <KV k="Template">{ct.template}</KV>
        <KV k="Bases">{ct.bases.map((b) => b.toUpperCase()).join(", ")}</KV>
        <KV k="Parameters">{ct.parameters.filter((p) => p.on).length} parameters</KV>
        <KV k="Samples">{samples}</KV>
        <KV k="Attention">{ct.attention.name || "None"}</KV>
        <KV k="Client reference">{ct.clientReference || "None"}</KV>
        <KV k="Remarks">{ct.remarks || "None"}</KV>
        <KV k="Signatory">{ct.signatory ? ct.signatory.name : "None"}</KV>
        <KV k="On behalf of">{ct.onBehalfOf || "None"}</KV>
      </div>
    </Card>
  ) : null;
  const dt = c.details;
  const details = dt && (
    <Card title="Details">
      <div className="col g4">
        <KV k="Job order"><Link to={`/orders/${c.orderNo}`} className="c-act t-data">{c.orderNo}</Link></KV>
        <KV k="Client">{c.company}</KV>
        <KV k="Attention">{dt.attention || "—"}</KV>
        <KV k="Reference">{dt.reference || "—"}</KV>
        <KV k="Bases">{dt.bases.join(", ")}</KV>
        <KV k="Parameters">{dt.parameters} parameters</KV>
        <KV k="Samples">{dt.samples}</KV>
        <KV k="Published"><span className="row g8 wrap"><span>{whenText(dt.publishedAt)}</span>{dt.publishedBy && <span className="c-act">{dt.publishedBy}</span>}</span></KV>
        <KV k="Signatory">{dt.signatory.name}</KV>
        <KV k="Title">{dt.signatory.title || "—"}</KV>
        {dt.signatory.onBehalfOf && <KV k="On behalf of">{dt.signatory.onBehalfOf}</KV>}
        <KV k="Printed">{dt.printed.count ? <span className="row g8 wrap"><span>{dt.printed.count} {dt.printed.count === 1 ? "time" : "times"}</span>{dt.printed.last && <span className="c-act">last {whenText(dt.printed.last)}</span>}</span> : "Not yet"}</KV>
        <KV k="Verify code"><b className="t-data-b">{dt.verifyCode}</b></KV>
      </div>
    </Card>
  );
  const deliveries = !open && (
    <Card title="Delivery">
      {c.deliveries.length ? <div className="col g8">{c.deliveries.map((d) => (
        <div key={d.id} className="row g8 wrap" style={{ background: "var(--status-success-bg, #e8f3ec)", borderRadius: 8, padding: "8px 12px", alignItems: "center" }}>
          <b className="t-sm c-head">{d.channels.join(", ")}</b><span className="t-sm">{d.recipient}</span><span className="t-sm c-sec">{whenText(d.sentOn)}</span>{d.by && <span className="t-sm c-act">{d.by}</span>}
          {d.note && <span className="t-cap c-sec" style={{ flexBasis: "100%" }}>{d.note}</span>}
        </div>))}</div>
        : <span className="t-sm c-mut">Not sent yet.</span>}
    </Card>
  );
  const versions = c.versions.length > 0 && !open && (
    <Card title="Versions">
      <div className="col g8">{c.versions.map((v) => (
        <div key={v.id} className="row g8 wrap" style={{ alignItems: "center" }}>
          {v.current ? <b className="t-sm c-head">Rev {v.revision}</b> : <Link to={`/reports/coa/${v.id}`} className="t-sm c-act">Rev {v.revision}</Link>}
          <Badge sm label={v.current ? "Current" : (COA_STATUS[v.status]?.[0] ?? v.status)} tone={v.current ? "green" : (COA_STATUS[v.status]?.[1] ?? "grey")} />
          <span className="t-cap c-sec">{[whenText(v.at), v.reason].filter(Boolean).join(", ")}</span></div>))}</div>
    </Card>
  );
  const previewCard = <Card title={phone ? "Certificate" : "Preview"}><Preview id={c.id} v={`${c.status}-${ver}`} phone={phone} title={open ? "Draft preview" : titleText} pages={c.pages} /></Card>;

  return (
    <div className="page">
      <PageHead crumb={[["Reports", "/reports"], [titleText]]} title={titleText} badge={<Badge label={stText} tone={stTone} />} sub={sub}
        {...(phone ? {} : { actions: <>{actions}{menu}</> })} {...(phone && menu ? { trailing: menu } : {})} />
      {banner}
      <div className={phone ? "col g16" : undefined} style={phone ? undefined : { display: "grid", gridTemplateColumns: "minmax(0, 1fr) 380px", gap: 16, alignItems: "start" }}>
        {previewCard}
        <div className="col g16">{contents}{details}{deliveries}{versions}</div>
      </div>
      {phone && <div className="sticky-bar">{open && <Button id="coa-preview-pdf" onClick={previewPdf}>Preview PDF</Button>}{actions}</div>}

      {dlg === "send" && (
        <Dialog title="Send CoA for signature?" size="sm" phone={phone} onClose={() => setDlg(null)} footer={<><Button onClick={() => setDlg(null)}>Cancel</Button><Button type="primary" id="coa-send-ok" disabled={busy} onClick={send}>Send for signature</Button></>}>
          <p className="t-sm c-sec" style={{ margin: 0 }}>{ct.signatory?.name ?? "The signatory"} is asked to sign it. You can't change the contents until it is signed, returned or withdrawn.</p>
        </Dialog>
      )}
      {dlg === "sign" && (
        <Dialog title={`Sign and publish CoA for ${c.orderNo}?`} size="md" phone={phone} onClose={() => setDlg(null)} footer={<><Button onClick={() => setDlg(null)}>Cancel</Button><Button type="primary" id="coa-sign-ok" disabled={busy} onClick={sign}>Sign and publish</Button></>}>
          <div className="col g16">
            <span className="t-sm c-sec">It gets the number CoA-{c.orderNo}-{c.revision}, your signature and the lab stamp, and can no longer be edited.</span>
            <div className="row g12" style={{ background: "var(--primary-50)", borderRadius: 12, padding: 16, alignItems: "center" }}>
              {(sigImg || stampImg) && <span className="row g8" style={{ flex: "none", alignItems: "center" }}>
                {sigImg && <img src={sigImg} alt="Your signature" style={{ height: 48, maxWidth: 140, objectFit: "contain" }} />}
                {stampImg && <img src={stampImg} alt="Lab stamp" style={{ height: 48, width: 48, objectFit: "contain" }} />}
              </span>}
              <span className="col g4" style={{ minWidth: 0 }}>
                <b className="t-sm c-head">{ct.signatory?.name}</b>
                {ct.signatory?.title && <span className="t-sm c-sec">{ct.signatory.title}</span>}
                <span className="t-sm c-mut">Printed on the certificate with the lab stamp.</span>
              </span>
            </div>
            {c.signing.assets && !c.signing.assets.signature && <Alert tone="warning" title="You have no signature yet" text={<>The certificate prints your name over a line. <Link to="/profile" className="c-act">Add your signature on your Profile</Link>.</>} />}
            {c.signing.assets && !c.signing.assets.stamp && <Alert tone="warning" title="The lab has no stamp yet" text="The certificate prints without the stamp. The Manager adds it on their Profile." />}
            <PasswordField id="coa-password" label="Password" value={pw} onChange={(v) => { setPw(v); setPwErr(""); }} error={pwErr} help="Signing needs your own password." placeholder="Enter your password" />
          </div>
        </Dialog>
      )}
      {dlg === "return" && (
        <Dialog title={`Return the draft to ${c.signing.sentBy ?? "the lab"}?`} size="sm" phone={phone} onClose={() => setDlg(null)} footer={<><Button onClick={() => setDlg(null)}>Cancel</Button><Button type="primary" id="coa-return-ok" disabled={busy} onClick={giveBack}>Return draft</Button></>}>
          <div className="col g12">
            <span className="t-sm c-sec">{c.signing.sentBy ?? "The lab"} can change it and send it again.</span>
            <TextArea id="coa-comment" label="Comment" req rows={3} placeholder="e.g. Remarks missing for sample 3" value={comment} onChange={(v) => { setComment(v); setCErr(""); }} />
            {cErr && <span className="help err">{cErr}</span>}
          </div>
        </Dialog>
      )}
      {dlg === "withdraw" && (
        <Dialog title="Withdraw from signature?" size="sm" phone={phone} onClose={() => setDlg(null)} footer={<><Button onClick={() => setDlg(null)}>Cancel</Button><Button type="primary" id="coa-withdraw-ok" disabled={busy} onClick={async () => { if (await run(() => api(`/reports/coa/${c.id}/withdraw`, { method: "POST" }), "Back to draft")) setDlg(null); }}>Withdraw</Button></>}>
          <p className="t-sm c-sec" style={{ margin: 0 }}>The certificate goes back to draft and can be edited again.</p>
        </Dialog>
      )}
      {dlg === "delete" && (
        <Dialog title="Delete this draft?" size="sm" phone={phone} onClose={() => setDlg(null)} footer={<><Button onClick={() => setDlg(null)}>Cancel</Button><Button type="primary" tone="danger" id="coa-delete-ok" disabled={busy} onClick={async () => { setBusy(true); try { await api(`/reports/coa/${c.id}`, { method: "DELETE" }); toast("Draft deleted"); refresh(); nav(`/orders/${c.orderNo}/coa`); } catch (e) { toast((e as ApiError).message, "error"); } finally { setBusy(false); } }}>Delete draft</Button></>}>
          <p className="t-sm c-sec" style={{ margin: 0 }}>The draft is removed. The job order can generate a new one.</p>
        </Dialog>
      )}
      {dlg === "sent" && <MarkSentDialog id={c.id} phone={phone} onClose={() => setDlg(null)} onDone={() => { setDlg(null); refresh(); }} />}
      {dlg === "revise" && (
        <Dialog title={`Revise ${c.number}?`} size="sm" phone={phone} onClose={() => setDlg(null)} footer={<><Button onClick={() => setDlg(null)}>Cancel</Button><Button type="primary" id="coa-revise-ok" disabled={busy} onClick={revise}>Create revision</Button></>}>
          <div className="col g12">
            <span className="t-sm c-sec">Revision {c.revision} stays current until revision {c.revision + 1} is published. Revision {c.revision + 1} starts as a draft with the same contents.</span>
            <TextArea id="coa-reason" label="Reason" req rows={3} placeholder="e.g. Wrong client reference" value={reason} onChange={(v) => { setReason(v); setRErr(""); }} />
            {rErr && <span className="help err">{rErr}</span>}
          </div>
        </Dialog>
      )}
      {dlg === "void" && (
        <Dialog title={`Void ${c.number}?`} size="sm" phone={phone} onClose={() => setDlg(null)} footer={<><Button onClick={() => setDlg(null)}>Keep CoA</Button><Button type="primary" tone="danger" id="coa-void-ok" disabled={busy} onClick={voidIt}>Void CoA</Button></>}>
          <div className="col g12">
            <span className="t-sm c-sec">The number is never reused. Anyone who downloaded this certificate should be told it is void.</span>
            <TextArea id="coa-reason" label="Reason" req rows={3} placeholder="e.g. Issued for the wrong job order" value={reason} onChange={(v) => { setReason(v); setRErr(""); }} />
            {rErr && <span className="help err">{rErr}</span>}
          </div>
        </Dialog>
      )}
    </div>
  );
}
