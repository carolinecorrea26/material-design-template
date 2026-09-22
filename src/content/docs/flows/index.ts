import type { FlowDefinition } from "./types";

export * from "./types";
export { consumerFlow } from "./consumerFlow";
export { advisorFlow } from "./advisorFlow";
export { resumeFlow } from "./resumeFlow";
export { autosaveFlow } from "./autosaveFlow";
export { quoteFlow } from "./quoteFlow";
export { tpaVerificationFlow } from "./tpaVerificationFlow";
export { healthRoutingRows } from "./healthRouting";
export type { HealthRoutingRow } from "./healthRouting";

import { consumerFlow } from "./consumerFlow";
import { advisorFlow } from "./advisorFlow";
import { resumeFlow } from "./resumeFlow";
import { autosaveFlow } from "./autosaveFlow";
import { quoteFlow } from "./quoteFlow";
import { tpaVerificationFlow } from "./tpaVerificationFlow";

export const allFlows: FlowDefinition[] = [
  consumerFlow,
  advisorFlow,
  resumeFlow,
  autosaveFlow,
  quoteFlow,
  tpaVerificationFlow,
];
