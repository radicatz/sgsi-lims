import type { Tone } from "../../components";

/** CoA status words and tones (App plan 18; the Reports list reuses them). */
export const COA_STATUS: Record<string, [string, Tone]> = {
  draft: ["Draft", "grey"], awaiting_signature: ["Awaiting signature", "amber"], issued: ["Published", "purple"], superseded: ["Superseded", "red"], void: ["Void", "muted"],
};
