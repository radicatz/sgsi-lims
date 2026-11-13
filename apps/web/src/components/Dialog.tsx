// Component layer, part of the FigCraft library port (Stack_Decision_Record S-7, S-8): Dialog.
import { type ReactNode } from "react";
import { Button, ButtonSizeContext, IconBtn } from "./Button";
import { cx, toFrame, useEsc } from "./utils";

/* ---------- overlays ---------- */
export function Dialog({
  title,
  sub,
  size = "md",
  onClose,
  children,
  footer,
  phone,
}: {
  title: string;
  sub?: ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  onClose: () => void;
  children?: ReactNode;
  footer?: ReactNode;
  phone?: boolean;
}) {
  useEsc(onClose, true);
  return toFrame(
    <div
      className={cx("scrim", phone && "sheet")}
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className={cx("dialog", size)}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="dh">
          <div className="tt">
            <h2 className="t-h3">{title}</h2>
            {sub && (
              <p className="t-sm c-sec" style={{ margin: 0 }}>
                {sub}
              </p>
            )}
          </div>
          <IconBtn n="x" label="Close" onClick={onClose} />
        </div>
        {children && <div className="db">{children}</div>}
        {footer && (
          <div className="df">
            <ButtonSizeContext.Provider value="lg">
              {footer}
            </ButtonSizeContext.Provider>
          </div>
        )}
      </div>
    </div>,
  );
}

export function Confirm({
  title,
  text,
  ok = "Confirm",
  danger,
  busy,
  onOk,
  onClose,
}: {
  title: string;
  text?: string;
  ok?: string;
  danger?: boolean;
  busy?: boolean;
  onOk: () => void;
  onClose: () => void;
}) {
  return (
    <Dialog
      title={title}
      size="sm"
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            type="primary"
            tone={danger ? "danger" : undefined}
            disabled={!!busy}
            onClick={onOk}
          >
            {ok}
          </Button>
        </>
      }
    >
      {text && (
        <p className="t-sm c-sec" style={{ margin: 0 }}>
          {text}
        </p>
      )}
    </Dialog>
  );
}
