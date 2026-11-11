// Component layer, part of the FigCraft library port (Stack_Decision_Record S-7, S-8): forms.
import { useId, useRef, useState, type ReactNode } from "react";
import { IconBtn } from "./Button";
import { Icon } from "./Icon";
import { cx } from "./utils";

/* ---------- forms ---------- */
export function TextField({ label, value, onChange, error, help, type = "text", placeholder, autoComplete, id, req }: {
  label: string; value: string; onChange: (v: string) => void; error?: string | null; help?: string; type?: string; placeholder?: string; autoComplete?: string; id?: string; req?: boolean }) {
  const auto = useId(); const fid = id ?? auto;
  return <div className="field"><label className="flabel" htmlFor={fid}>{label}{req && <span className="req">*</span>}</label>
    <div className={cx("input", error && "err")}><input id={fid} type={type} value={value} placeholder={placeholder} autoComplete={autoComplete} aria-invalid={!!error} onChange={(e) => onChange(e.target.value)} /></div>
    {error ? <span className="help err">{error}</span> : help ? <span className="help">{help}</span> : null}</div>;
}

export function PasswordField({ label, value, onChange, error, help, placeholder, autoComplete = "current-password", id }: {
  label: string; value: string; onChange: (v: string) => void; error?: string | null; help?: string; placeholder?: string; autoComplete?: string; id?: string }) {
  const [show, setShow] = useState(false); const auto = useId(); const fid = id ?? auto;
  return <div className="field"><label className="flabel" htmlFor={fid}>{label}</label>
    <div className={cx("input", error && "err")} style={{ paddingRight: 4 }}><input id={fid} type={show ? "text" : "password"} value={value} placeholder={placeholder} autoComplete={autoComplete} aria-invalid={!!error} onChange={(e) => onChange(e.target.value)} />
      <IconBtn n={show ? "eye-slash" : "eye"} label={show ? "Hide password" : "Show password"} onClick={() => setShow(!show)} /></div>
    {error ? <span className="help err">{error}</span> : help ? <span className="help">{help}</span> : null}</div>;
}

export function Seg<T extends string>({ items, value, onChange, label }: { items: Array<[T, string]>; value: T; onChange: (v: T) => void; label: string }) {
  return <div className="seg" role="group" aria-label={label}>{items.map(([v, l]) => <button key={v} type="button" aria-pressed={value === v} onClick={() => onChange(v)}>{l}</button>)}</div>;
}

/* ---------- form controls ---------- */
const Field = ({ label, req, help, error, id, children }: { label?: string | undefined; req?: boolean | undefined; help?: string | undefined; error?: string | null | undefined; id: string; children: ReactNode }) =>
  <div className="field">{label && <label className="flabel" htmlFor={id}>{label}{req && <span className="req">*</span>}</label>}{children}
    {error ? <span className="help err">{error}</span> : help ? <span className="help">{help}</span> : null}</div>;

export function TextArea({ label, value, onChange, placeholder, id }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; id?: string }) {
  const auto = useId(); const fid = id ?? auto;
  return <Field label={label} id={fid}><textarea className="input" id={fid} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} /></Field>;
}

export function Select({ label, req, help, error, value, onChange, options, id, disabled, width }: { label?: string; req?: boolean; help?: string; error?: string | null; value: string; onChange: (v: string) => void;
  options: Array<[string, string]>; id?: string; disabled?: boolean; width?: number | string }) {
  const auto = useId(); const fid = id ?? auto;
  return <div style={width ? { width, maxWidth: "100%" } : undefined}><Field label={label} req={req} help={help} error={error} id={fid}>
    <div className={cx("input", error && "err", disabled && "dis")}><select id={fid} value={value} disabled={disabled} onChange={(e) => onChange(e.target.value)}>
      {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select><Icon n="caret-down" /></div></Field></div>;
}

export function Search({ value, onChange, placeholder, id, width, label }: { value: string; onChange: (v: string) => void; placeholder: string; id?: string; width?: number | string; label?: string }) {
  const auto = useId(); const fid = id ?? auto;
  const box = <label className="search" style={width && !label ? { width, maxWidth: "100%" } : undefined}><Icon n="magnifying-glass" /><input id={fid} value={value} placeholder={placeholder} aria-label={label ? undefined : placeholder} onChange={(e) => onChange(e.target.value)} />
    {value && <button type="button" aria-label="Clear search" onClick={() => onChange("")}><Icon n="x" /></button>}</label>;
  if (!label) return box;
  return <div className="field" style={width ? { width, maxWidth: "100%" } : undefined}><label className="flabel" htmlFor={fid}>{label}</label>{box}</div>;
}

export function Check({ on, onChange, label, id }: { on: boolean; onChange: (v: boolean) => void; label: string; id?: string }) {
  return <label className={cx("cb", on && "on")} id={id} onClick={(e) => { e.preventDefault(); onChange(!on); }}>
    <span className="box" role="checkbox" aria-checked={on} tabIndex={0} onKeyDown={(e) => { if (e.key === " ") { e.preventDefault(); onChange(!on); } }}>{on && <Icon n="check" />}</span>{label}</label>;
}

export function Radio({ on, onChange, label }: { on: boolean; onChange: () => void; label: string }) {
  return <label className={cx("rd", on && "on")} onClick={(e) => { e.preventDefault(); onChange(); }}><span className="circ" role="radio" aria-checked={on} tabIndex={0} onKeyDown={(e) => { if (e.key === " ") { e.preventDefault(); onChange(); } }} />{label}</label>;
}

export function Switch({ on, onChange, label, id }: { on: boolean; onChange: (v: boolean) => void; label: string; id?: string }) {
  return <label className={cx("sw", on && "on")} id={id} onClick={(e) => { e.preventDefault(); onChange(!on); }}><span className="tr" role="switch" aria-checked={on} tabIndex={0} onKeyDown={(e) => { if (e.key === " ") { e.preventDefault(); onChange(!on); } }} />{label}</label>;
}

export function DropZone({ text = "Drop the file here, or click to browse", hint = "PDF, up to 10 MB", accept, onFile, id }: { text?: string; hint?: string; accept?: string; onFile: (f: File) => void; id?: string }) {
  const ref = useRef<HTMLInputElement>(null); const [over, setOver] = useState(false);
  return <div className={cx("dz", over && "over")} onClick={() => ref.current?.click()} onDragOver={(e) => { e.preventDefault(); setOver(true); }} onDragLeave={() => setOver(false)}
    onDrop={(e) => { e.preventDefault(); setOver(false); const f = e.dataTransfer.files[0]; if (f) onFile(f); }}>
    <Icon n="upload-simple" s={20} /><b>{text}</b><span className="t-cap">{hint}</span>
    <input ref={ref} id={id} type="file" accept={accept} hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = ""; }} /></div>;
}
