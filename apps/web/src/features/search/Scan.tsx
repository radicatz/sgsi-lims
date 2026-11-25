// Scan a label with the phone's camera (Phase 5, slice B; decision B-1): shown only where the browser can read barcodes (BarcodeDetector, Android Chrome). A read Sample ID opens
// that sample's history; any other code opens the results for it. A USB scanner needs none of this: it types into the search field.
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { api } from "../../app/api";
import { useSession } from "../../app/session";
import { Alert, Button, Dialog } from "../../components";
import { rememberRecord, type Hit } from "./shared";

type Detector = {
  detect: (v: HTMLVideoElement) => Promise<Array<{ rawValue: string }>>;
};
export const canScan = () =>
  typeof window !== "undefined" &&
  "BarcodeDetector" in window &&
  !!navigator.mediaDevices?.getUserMedia;

export function ScanDialog({ onClose }: { onClose: () => void }) {
  const video = useRef<HTMLVideoElement>(null),
    nav = useNavigate(),
    { me } = useSession();
  const [err, setErr] = useState("");
  useEffect(() => {
    let stop = false,
      stream: MediaStream | null = null;
    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });
        if (!video.current) return;
        video.current.srcObject = stream;
        await video.current.play();
        const Ctor = (
          window as unknown as {
            BarcodeDetector: new (o: { formats: string[] }) => Detector;
          }
        ).BarcodeDetector;
        const det = new Ctor({ formats: ["code_128", "qr_code"] });
        const tick = async () => {
          if (stop || !video.current) return;
          try {
            const [c] = await det.detect(video.current);
            if (c) {
              const res = await api<{ go: Hit | null }>(
                `/search/quick?q=${encodeURIComponent(c.rawValue)}`,
              );
              stop = true;
              if (res.go) {
                if (me) rememberRecord(me.id, res.go);
                nav(res.go.link);
              } else nav(`/search?q=${encodeURIComponent(c.rawValue)}`);
              onClose();
              return;
            }
          } catch {
            /* keep scanning */
          }
          setTimeout(tick, 250);
        };
        tick();
      } catch {
        setErr(
          "The camera could not be opened. Allow camera access, or type the ID.",
        );
      }
    })();
    return () => {
      stop = true;
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <Dialog
      title="Scan a label"
      phone
      size="sm"
      onClose={onClose}
      footer={<Button onClick={onClose}>Cancel</Button>}
    >
      {err ? (
        <Alert tone="error" title={err} />
      ) : (
        <video
          ref={video}
          playsInline
          muted
          style={{ width: "100%", borderRadius: 12, background: "#000" }}
        />
      )}
    </Dialog>
  );
}
