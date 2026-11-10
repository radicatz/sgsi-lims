// Status labels and badge tones, shared by every screen (FigCraft Status badge set).
export type Tone = "grey" | "navy" | "amber" | "blue" | "purple" | "green" | "red" | "outline";

export const ORDER_STATUS = {
  draft: ["Draft", "grey"], awaiting_samples: ["Awaiting samples", "amber"], in_progress: ["In progress", "blue"],
  reported: ["Reported", "purple"], delivered: ["Delivered", "green"], closed: ["Closed", "grey"], cancelled: ["Cancelled", "red"],
} as const satisfies Record<string, readonly [string, Tone]>;

export const BATCH_STATUS = {
  created: ["Created", "grey"], receiving: ["Receiving", "navy"], preparation: ["Preparation", "amber"],
  prep_finished: ["Prep finished", "amber"], analysis: ["Analysis", "blue"], analysis_finished: ["Analysis finished", "purple"],
  completed: ["Completed", "green"],
} as const satisfies Record<string, readonly [string, Tone]>;

export const SAMPLE_STATE = {
  expected: ["Expected", "outline"], in_batch: ["In batch", "blue"], received: ["Received", "green"],
  awaiting_arrival: ["Awaiting arrival", "amber"], not_received: ["Not received", "red"], held: ["Held", "red"],
} as const satisfies Record<string, readonly [string, Tone]>;

export type OrderStatus = keyof typeof ORDER_STATUS;
export type BatchStatus = keyof typeof BATCH_STATUS;
export type SampleState = keyof typeof SAMPLE_STATE;
