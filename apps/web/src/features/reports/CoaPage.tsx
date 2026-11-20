// The CoA page (FigCraft module 07 Reports, Reports_Build_Design sections 4 and 5): a draft is filled and sent for signature, the named signatory signs
// with their password, and a published certificate shows its details, deliveries and versions. The preview is the real PDF in a frame (phone: Open PDF).
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api, apiBlob, ApiError } from "../../app/api";
import { useBreakpoint } from "../../app/session";
import { Alert, Badge, Button, Card, Check, Dialog, Empty, Icon, KV, PageHead, PasswordField, Select, TextArea, TextField, fmtDate, toast } from "../../components";
import { COA_STATUS } from "./status";

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
  signing: { sentBy: string | null; sentAt: string | null; returned: { by: string | null; at: string; comment: string } | null; draftedBy: string | null };
  deliveries: { id: string; sentOn: string; channels: string[]; recipient: string; note: string | null; by: string | null }[];
  versions: { id: string; revision: number; status: string; number: string | null; at: string; reason: string; current: boolean }[];
  can: { edit: boolean; send: boolean; sendWhy: string | null; withdraw: boolean; remove: boolean; sign: boolean; return: boolean; download: boolean; print: boolean; preview: boolean };
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

function Preview({ id, v, phone, title }: { id: string; v: string; phone: boolean; title: string }) {
  const { url, err } = usePdf(id, v);
  if (err) return <Alert tone="warning" title="The preview is not available" text={err} />;
  if (phone) {
    return (
      <div className="roa-file" id="coa-doc">
        <span className="roa-ico"><Icon n="file-pdf" s={20} /></span>
        <span className="col" style={{ gap: 0, minWidth: 0, flex: 1 }}><b className="t-sm c-head ellip">{title}</b><span className="t-cap c-sec">PDF, A4</span></span>
        <Button size="sm" icon="arrow-square-out" id="coa-open" disabled={!url} onClick={() => url && window.open(url, "_blank", "noopener")}>Open PDF</Button>
      </div>
    );
  }
  return url ? <iframe title={title} src={url} id="coa-preview" style={{ width: "100%", height: "78vh", minHeight: 560, border: "1px solid var(--border, #d9dde3)", borderRadius: 8, background: "#fff" }} /> : <Empty icon="file-pdf" title="Preparing the preview" />;
}

export function CoaPage() {
  const { id = "" } = useParams(), nav = useNavigate(), qc = useQueryClient(), phone = useBreakpoint() === "phone";
  const q = useQuery({ queryKey: ["coa", id], queryFn: () => api<Coa>(`/reports/coa/${id}`) });
  const [ver, setVer] = useState(0), [busy, setBusy] = useState(false);
  const [dlg, setDlg] = useState<null | "sign" | "return" | "delete" | "withdraw">(null);
  const [pw, setPw] = useState(""), [pwErr, setPwErr] = useState(""), [comment, setComment] = useState(""), [cErr, setCErr] = useState("");
  // the draft's form
  const [f, setF] = useState<{ bases: string[]; params: string[]; attention: string; ref: string; remarks: string; onBehalf: string; signatory: string } | null>(null);
  const c = q.data;
  useEffect(() => {
    if (!c) return;
    setF({ bases: c.contents.bases, params: c.contents.parameters.filter((p) => p.on).map((p) => p.id), attention: c.contents.attention.id ?? "", ref: c.contents.clientReference, remarks: c.contents.remarks, onBehalf: c.contents.onBehalfOf, signatory: c.contents.signatory?.id ?? "" });
  }, [c]);

  if (q.isLoading) return <div className="page"><Card><Empty icon="certificate" title="Loading certificate" /></Card></div>;
  if (q.error || !c || !f) {
    return <div className="page"><Card><Empty icon="certificate" title="Certificate not found" text="It may have been removed, or you may not have access." action={<Button onClick={() => nav("/reports")}>Back to reports</Button>} /></Card></div>;
  }
  const open = c.status === "draft" || c.status === "awaiting_signature", [stText, stTone] = COA_STATUS[c.status]!;
  const dirty = c.status === "draft" && (f.bases.join() !== c.contents.bases.join() || f.params.slice().sort().join() !== c.contents.parameters.filter((p) => p.on).map((p) => p.id).sort().join()
    || f.attention !== (c.contents.attention.id ?? "") || f.ref !== c.contents.clientReference || f.remarks !== c.contents.remarks || f.onBehalf !== c.contents.onBehalfOf || f.signatory !== (c.contents.signatory?.id ?? ""));
  const refresh = () => { for (const k of ["coa", "order-coa", "order", "orders"]) qc.invalidateQueries({ queryKey: [k] }); };
  const run = async (fn: () => Promise<unknown>, done?: string) => {
    setBusy(true);
    try { await fn(); if (done) toast(done); refresh(); setVer((n) => n + 1); return true; }
    catch (e) { toast((e as ApiError).message, "error"); return false; } finally { setBusy(false); }
  };
  const save = () => run(() => api(`/reports/coa/${c.id}`, { method: "PATCH", json: { bases: f.bases, parameterIds: f.params, attentionContactId: f.attention || null, clientReference: f.ref.trim() || null, remarks: f.remarks.trim() || null, signatoryId: f.signatory || null, onBehalfOf: f.onBehalf.trim() || null } }), "Draft saved");
  const send = async () => { if (dirty && !(await save())) return; await run(() => api(`/reports/coa/${c.id}/send`, { method: "POST" }), "Sent for signature"); };
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
  const toggle = (list: string[], v: string) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  const actions = (
    <>
      {c.can.download && <Button icon="download-simple" id="coa-download" onClick={download}>Download</Button>}
      {c.can.print && <Button icon="printer" id="coa-print" onClick={print}>Print</Button>}
      {c.can.withdraw && <Button id="coa-withdraw" onClick={() => setDlg("withdraw")}>Withdraw</Button>}
      {c.can.return && <Button icon="arrow-u-up-left" id="coa-return" onClick={() => { setCErr(""); setDlg("return"); }}>Return to lab</Button>}
      {c.can.sign && <Button type="primary" icon="pencil-simple-line" id="coa-sign" onClick={() => { setPw(""); setPwErr(""); setDlg("sign"); }}>Sign and publish</Button>}
      {c.can.send && <Button type="primary" icon="paper-plane-tilt" id="coa-send" disabled={busy || !!c.can.sendWhy} why={c.can.sendWhy ?? undefined} onClick={send}>Send for signature</Button>}
    </>
  );
  const sub = (
    <span className="row g16 wrap t-sm c-sec">
      <b className="t-sm c-head" style={{ fontWeight: 500 }}>{c.company}</b>
      <Link to={`/orders/${c.orderNo}`} className="row g6 c-act" id="coa-order"><Icon n="clipboard-text" />{c.orderNo}</Link>
      <span className="row g6"><Icon n="certificate" />Revision {c.revision}</span>
      {c.pages != null && <span className="row g6"><Icon n="file-pdf" />{c.pages} {c.pages === 1 ? "page" : "pages"}</span>}
    </span>
  );

  /* ---------- the cards beside the preview ---------- */
  const draft = c.status === "draft" && c.can.edit;
  const contents = (
    <Card title="Contents" actions={draft ? <Button size="sm" id="coa-save" disabled={!dirty || busy} onClick={save}>Save changes</Button> : undefined}>
      <div className="col g16">
        {c.signing.returned && c.status === "draft" && <Alert tone="warning" title={`Returned by ${c.signing.returned.by ?? "the signatory"}`} text={c.signing.returned.comment} />}
        <span className="t-sm c-sec">{c.contents.template}. {c.contents.reported} {c.contents.reported === 1 ? "sample" : "samples"} reported.</span>
        {!!c.contents.left && c.contents.left.notReceived + c.contents.left.held + c.contents.left.awaiting > 0 && (
          <Alert tone="info" title="Some samples are not on the certificate" text={[c.contents.left.notReceived ? `${c.contents.left.notReceived} not received` : "", c.contents.left.held ? `${c.contents.left.held} on hold` : "", c.contents.left.awaiting ? `${c.contents.left.awaiting} not in a batch yet` : ""].filter(Boolean).join(", ") + "."} />
        )}
        <div className="col g8"><b className="t-sm w6">Basis</b>
          <span className="row g16 wrap">{BASES.map(([v, l]) => <Check key={v} id={`coa-basis-${v}`} label={l} on={f.bases.includes(v)} onChange={() => draft && setF({ ...f, bases: toggle(f.bases, v) })} />)}</span></div>
        <div className="col g8"><b className="t-sm w6">Parameters</b>
          <div className="col g8">{c.contents.parameters.map((p) => <Check key={p.id} label={p.label} on={f.params.includes(p.id)} onChange={() => draft && setF({ ...f, params: toggle(f.params, p.id) })} />)}</div></div>
        {draft ? (
          <>
            <Select id="coa-attention" label="Attention" value={f.attention} onChange={(v) => setF({ ...f, attention: v })} options={[["", "No attention line"], ...c.contents.contacts.map((x): [string, string] => [x.id, x.name])]} />
            <TextField id="coa-ref" label="Client reference" value={f.ref} onChange={(v) => setF({ ...f, ref: v })} />
            <TextArea id="coa-remarks" label="Remarks" rows={3} value={f.remarks} onChange={(v) => setF({ ...f, remarks: v })} />
            <Select id="coa-signatory" label="Signatory" req value={f.signatory} onChange={(v) => setF({ ...f, signatory: v })} help="Only this person can sign, signed in as themselves."
              options={[["", "Choose who signs"], ...c.contents.signers.map((s): [string, string] => [s.id, s.title ? `${s.name}, ${s.title}` : s.name])]} />
            <TextField id="coa-behalf" label="On behalf of (optional)" value={f.onBehalf} onChange={(v) => setF({ ...f, onBehalf: v })} placeholder="Laboratory Manager" />
          </>
        ) : (
          <>
            <KV k="Attention">{c.contents.attention.name || "—"}</KV>
            <KV k="Client reference">{c.contents.clientReference || "—"}</KV>
            <KV k="Remarks">{c.contents.remarks || "—"}</KV>
            <KV k="Signatory">{c.contents.signatory ? c.contents.signatory.name : "—"}</KV>
            {c.contents.onBehalfOf && <KV k="On behalf of">{c.contents.onBehalfOf}</KV>}
          </>
        )}
        {draft && c.can.remove && <span><Button size="sm" tone="danger" id="coa-delete" onClick={() => setDlg("delete")}>Delete draft</Button></span>}
      </div>
    </Card>
  );
  const waiting = c.status === "awaiting_signature" && (
    <Card title="Signature">
      <div className="col g8">
        <Alert tone={c.can.sign ? "info" : "warning"} title={c.can.sign ? "Waiting for your signature" : `Waiting for ${c.contents.signatory?.name ?? "the signatory"}`}
          text={c.can.sign ? "Check the certificate, then sign with your password." : "Only the named signatory can sign. To hand it over, change the signatory on the job order."} />
        <KV k="Signatory">{c.contents.signatory ? `${c.contents.signatory.name}${c.contents.signatory.title ? `, ${c.contents.signatory.title}` : ""}` : "—"}</KV>
        <KV k="Sent by">{c.signing.sentBy ?? "—"}</KV>
        <KV k="Sent on">{whenText(c.signing.sentAt) || "—"}</KV>
      </div>
    </Card>
  );
  const dt = c.details;
  const details = dt && (
    <Card title="Details">
      <div className="col g8">
        <KV k="Number"><b className="t-data-b">{c.number}</b></KV>
        <KV k="Published">{whenText(dt.publishedAt)}{dt.publishedBy ? `, ${dt.publishedBy}` : ""}</KV>
        <KV k="Signatory">{dt.signatory.name}{dt.signatory.title ? `, ${dt.signatory.title}` : ""}</KV>
        {dt.signatory.onBehalfOf && <KV k="On behalf of">{dt.signatory.onBehalfOf}</KV>}
        <KV k="Attention">{dt.attention || "—"}</KV>
        <KV k="Client reference">{dt.reference || "—"}</KV>
        <KV k="Basis">{dt.bases.join(", ")}</KV>
        <KV k="Samples">{dt.samples}</KV>
        <KV k="Printed">{dt.printed.count ? `${dt.printed.count} ${dt.printed.count === 1 ? "time" : "times"}` : "Not yet"}</KV>
        <KV k="Verify code"><b className="t-data-b">{dt.verifyCode}</b></KV>
      </div>
    </Card>
  );
  const deliveries = !open && (
    <Card title="Delivery">
      {c.deliveries.length ? <div className="col g8">{c.deliveries.map((d) => <div key={d.id} className="col" style={{ gap: 0 }}><b className="t-sm c-head">{d.recipient}</b><span className="t-cap c-sec">{[whenText(d.sentOn), d.channels.join(", "), d.by ? `by ${d.by}` : ""].filter(Boolean).join(", ")}</span></div>)}</div>
        : <span className="t-sm c-mut">Not sent to the client yet.</span>}
    </Card>
  );
  const versions = c.versions.length > 1 && (
    <Card title="Versions">
      <div className="col g8">{c.versions.map((v) => (
        <div key={v.id} className="row between"><span className="col" style={{ gap: 0 }}>
          {v.current ? <b className="t-sm c-head">Revision {v.revision}</b> : <Link to={`/reports/coa/${v.id}`} className="t-sm c-act">Revision {v.revision}</Link>}
          <span className="t-cap c-sec">{[v.number ?? "", whenText(v.at), v.reason].filter(Boolean).join(", ")}</span></span>
          <Badge sm label={COA_STATUS[v.status]?.[0] ?? v.status} tone={COA_STATUS[v.status]?.[1] ?? "grey"} /></div>))}</div>
    </Card>
  );

  return (
    <div className="page">
      <PageHead crumb={[["Reports", "/reports"], [c.number ?? `Draft for ${c.orderNo}`]]} title={c.number ?? `CoA for ${c.orderNo}`} badge={<Badge label={stText} tone={stTone} />} sub={sub} actions={phone ? undefined : actions} />
      {c.status === "superseded" && <Alert tone="info" title="A newer revision replaced this certificate" text="Open the latest revision under Versions." />}
      <div className={phone ? "col g16" : "grid"} style={phone ? undefined : { display: "grid", gridTemplateColumns: "minmax(0, 1fr) 380px", gap: 16, alignItems: "start" }}>
        <Card title="Certificate"><Preview id={c.id} v={`${c.status}-${ver}`} phone={phone} title={c.number ?? `Draft CoA ${c.orderNo}`} /></Card>
        <div className="col g16">{waiting}{open ? contents : details}{deliveries}{versions}</div>
      </div>
      {phone && <div className="sticky-bar">{actions}</div>}

      {dlg === "sign" && (
        <Dialog title="Sign and publish" size="sm" phone={phone} onClose={() => setDlg(null)} footer={<><Button onClick={() => setDlg(null)}>Cancel</Button><Button type="primary" id="coa-sign-ok" disabled={busy} onClick={sign}>Sign and publish</Button></>}>
          <div className="col g12">
            <span className="t-sm c-sec">You sign as {c.contents.signatory?.name}. The certificate is published with your signature and cannot change afterwards. Enter your password to confirm.</span>
            <PasswordField id="coa-password" label="Password" value={pw} onChange={(v) => { setPw(v); setPwErr(""); }} error={pwErr} />
          </div>
        </Dialog>
      )}
      {dlg === "return" && (
        <Dialog title="Return to the lab" size="sm" phone={phone} onClose={() => setDlg(null)} footer={<><Button onClick={() => setDlg(null)}>Cancel</Button><Button type="primary" id="coa-return-ok" disabled={busy} onClick={giveBack}>Return</Button></>}>
          <div className="col g12">
            <span className="t-sm c-sec">The Lab admin gets your comment and the certificate goes back to draft.</span>
            <TextArea id="coa-comment" label="What should change?" rows={4} value={comment} onChange={(v) => { setComment(v); setCErr(""); }} />
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
    </div>
  );
}
