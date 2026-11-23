// The phone's file block in the Certificate (CoA) and Signed RoA cards (frames Phone-07-Reports-02-CoA-10-Awaiting_signature, -04-Published, 03-RoA-01):
// a page thumbnail with the file name and page count beside it, then the buttons. It sits straight in the card, with no border or padding of its own (owner, Nov 23).
import type { ReactNode } from "react";

export function DocThumb({
  id,
  title,
  meta,
  children,
}: {
  id?: string;
  title: string;
  meta: string;
  /** Open PDF, and Download when there is a file; touch size, since Download is the page's main action (owner, Nov 23). */
  children?: ReactNode;
}) {
  return (
    <div className="doc-thumb" id={id}>
      <span className="pg" aria-hidden>
        {[100, 80, 100, 60, 90, 70, 85].map((w, i) => (
          <i key={i} style={{ width: `${w}%` }} />
        ))}
      </span>
      <span className="col g4" style={{ minWidth: 0, flex: 1 }}>
        <b className="t-sm c-head ellip" style={{ fontWeight: 600 }}>
          {title}
        </b>
        <span className="t-cap c-mut">{meta}</span>
        {children && <span className="acts">{children}</span>}
      </span>
    </div>
  );
}
