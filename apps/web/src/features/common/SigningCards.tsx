// The Signature and Lab stamp cards of the Profile and their upload dialog (FigCraft 00-App-09-Profile-04 Signing, -05 Signature_upload; Reports_Build_Design.md 16.2 step 1).
// The images come from the API only (never from a public link): a signature is shown to its owner, the stamp to the Manager and to people who sign.
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api, apiBlob, ApiError } from "../../app/api";
import { useSession } from "../../app/session";
import { Button, Card, Dialog, DropZone, fileSize, fmtDate, toast } from "../../components";

type Kind = "signature" | "stamp";
interface Info { has: boolean; setAt: string | null; setBy: string | null; sizeBytes: number }
const URLS: Record<Kind, { info: string; image: string; put: string; noun: string; title: string }> = {
  signature: { info: "/me/signature", image: "/me/signature/image", put: "/me/signature", noun: "signature", title: "your signature" },
  stamp: { info: "/laboratory/stamp", image: "/laboratory/stamp/image", put: "/laboratory/stamp", noun: "stamp", title: "the lab stamp" },
};

/** An image fetched with the session token and shown through an object URL. */
export function useSigningImage(kind: Kind, on: boolean, v?: unknown) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!on) { setUrl(null); return; }
    let dead = false, made: string | null = null;
    apiBlob(URLS[kind].image).then((b) => { if (!dead) { made = URL.createObjectURL(b); setUrl(made); } }).catch(() => { if (!dead) setUrl(null); });
    return () => { dead = true; if (made) URL.revokeObjectURL(made); };
  }, [kind, on, v]);
  return url;
}

/** The checkered background shows what is transparent in the image. */
export const checkered: React.CSSProperties = {
  background: "repeating-conic-gradient(var(--surface-muted, #f4efe6) 0% 25%, var(--surface-card, #fff) 0% 50%) 50% / 16px 16px",
};

function UploadDialog({ kind, replacing, phone, onClose, onDone }: { kind: Kind; replacing: boolean; phone: boolean; onClose: () => void; onDone: () => void }) {
  const u = URLS[kind];
  const [file, setFile] = useState<File | null>(null), [preview, setPreview] = useState<string | null>(null), [dims, setDims] = useState(""), [err, setErr] = useState(""), [busy, setBusy] = useState(false);
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);
  const choose = (f: File) => {
    setErr("");
    if (f.type !== "image/png" && !/\.png$/i.test(f.name)) return setErr("Use a PNG file.");
    if (f.size > 1024 * 1024) return setErr("The file is larger than 1 MB.");
    const url = URL.createObjectURL(f), img = new Image();
    img.onload = () => { if (img.naturalWidth < 300) { setErr("The image is too small. Use at least 300 pixels wide."); URL.revokeObjectURL(url); return; } setDims(`${img.naturalWidth} by ${img.naturalHeight} px`); setFile(f); setPreview(url); };
    img.onerror = () => { setErr("This file is not a readable PNG."); URL.revokeObjectURL(url); };
    img.src = url;
  };
  const save = async () => {
    if (!file) return setErr(`Choose the ${u.noun} first.`);
    setBusy(true);
    try {
      const fd = new FormData(); fd.append("file", file);
      const r = await api<{ changed: boolean; transparent: boolean }>(u.put, { method: "PUT", body: fd });
      toast(!r.changed ? `That is already the current ${u.noun}` : r.transparent ? `${u.noun[0]!.toUpperCase()}${u.noun.slice(1)} saved` : `Saved. The image has no transparent background, so it prints as a white box.`);
      onDone();
    } catch (e) { setErr((e as ApiError).message); } finally { setBusy(false); }
  };
  return (
    <Dialog title={`${replacing ? "Replace" : "Add"} ${u.title}`} size="md" phone={phone} onClose={onClose}
      footer={<><Button onClick={onClose}>Cancel</Button><Button type="primary" id="sg-save" disabled={busy || !file} onClick={save}>Save {u.noun}</Button></>}>
      <div className="col g12">
        <span className="t-sm c-sec">{kind === "signature" ? "Use a PNG with a transparent background, at most 1 MB. " : "Use a PNG of the stamp with a transparent background, at most 1 MB. "}{replacing ? "It replaces the old one on new certificates only." : "It is placed on the certificates you sign."}</span>
        <DropZone id="sg-file" accept="image/png,.png" text="Drop the PNG here, or click to browse" hint="PNG with a transparent background, up to 1 MB" onFile={choose} />
        {file && preview && (
          <div className="row g12" style={{ background: "var(--surface-muted, var(--primary-50))", borderRadius: 12, padding: 12 }}>
            <img src={preview} alt="" style={{ height: 56, maxWidth: 140, objectFit: "contain", borderRadius: 4, ...checkered }} />
            <span className="col" style={{ gap: 0, minWidth: 0 }}><b className="t-sm c-head ellip">{file.name}</b><span className="t-cap c-sec">{fileSize(file.size)}, {dims}</span></span>
          </div>
        )}
        {err && <span className="help err" id="sg-err">{err}</span>}
        <span className="t-cap c-mut">Older certificates keep the {u.noun} they were signed with.</span>
      </div>
    </Dialog>
  );
}

export function SigningCard({ kind, phone }: { kind: Kind; phone: boolean }) {
  const u = URLS[kind], qc = useQueryClient();
  const q = useQuery({ queryKey: ["signing", kind], queryFn: () => api<Info>(u.info) });
  const [open, setOpen] = useState(false), [v, setV] = useState(0);
  const has = !!q.data?.has, img = useSigningImage(kind, has, v);
  const label = kind === "signature" ? "Signature" : "Lab stamp";
  return (
    <Card title={label}>
      <div className="col g12">
        <div id={`sg-${kind}-box`} style={{ height: 100, borderRadius: 12, background: "var(--primary-50)", display: "grid", placeItems: "center", overflow: "hidden" }}>
          {has && img ? <img src={img} alt={`Your ${u.noun}`} style={{ maxHeight: 84, maxWidth: "90%", objectFit: "contain" }} />
            : <span className="t-sm c-mut">{q.isLoading ? "Loading" : `No ${u.noun} yet`}</span>}
        </div>
        {has && q.data?.setAt && <span className="t-sm c-sec">Set on {fmtDate(q.data.setAt)}</span>}
        <span className="row g8"><Button icon="upload-simple" id={`sg-${kind}-open`} onClick={() => setOpen(true)}>{has ? `Replace ${u.noun}` : `Add ${u.noun}`}</Button></span>
        <span className="t-sm c-mut">{kind === "signature" ? "Only you can change your signature. It is placed on the certificates you sign." : "Printed only beside an authorised signature."}</span>
      </div>
      {open && <UploadDialog kind={kind} replacing={has} phone={phone} onClose={() => setOpen(false)} onDone={() => { setOpen(false); setV((n) => n + 1); qc.invalidateQueries({ queryKey: ["signing", kind] }); qc.invalidateQueries({ queryKey: ["coa"] }); }} />}
    </Card>
  );
}

/** The cards a person may see: their own signature if they can be a signatory, the stamp if they may upload it. */
export function SigningCards({ phone }: { phone: boolean }) {
  const { me } = useSession();
  const can = (p: string) => !!me?.permissions.includes(p);
  return <>{can("report.sign") && <SigningCard kind="signature" phone={phone} />}{can("signing.stamp") && <SigningCard kind="stamp" phone={phone} />}</>;
}
