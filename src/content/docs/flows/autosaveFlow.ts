import type { FlowDefinition } from "./types";

export const autosaveFlow: FlowDefinition = {
  id: "autosave",
  title: "Autosave & Persistence Flow",
  intro:
    "Autosave begins after successful Membership submission. Field-level saving by external underwriting experiences is outside Portal autosave scope.",
  nodes: [
    {
      id: "autosave-start",
      kind: "start",
      label: "Membership Submission",
      description:
        "Autosave begins after successful Membership submission for both consumer and advisor applications.",
    },
    {
      id: "autosave-page-submission",
      kind: "action",
      label: "Page Submission",
      description: "Portal form data is saved when a page is successfully submitted.",
    },
    {
      id: "autosave-outcome-decision",
      kind: "decision",
      label: "Save outcome?",
      description: "Whether the autosave request for the submitted page completed successfully.",
    },
    {
      id: "autosave-confirmed",
      kind: "end",
      label: "Save Confirmed",
      description: "Saved indicator appears only after the save is confirmed.",
    },
    {
      id: "autosave-failure-summary",
      kind: "summary",
      label: "Save Failure — Recovery Scenarios (10)",
      description:
        "Network connectivity failure; server/application error; API or service unavailability; session expiration; validation failure; database persistence failure; concurrent update conflict; browser interruption; storage limit exceeded; partial save failure. The source documentation gives no distinct downstream destination per scenario, so these are summarized here rather than modeled as separate branches.",
    },
  ],
  edges: [
    { id: "autosave-e1", source: "autosave-start", target: "autosave-page-submission" },
    { id: "autosave-e2", source: "autosave-page-submission", target: "autosave-outcome-decision" },
    {
      id: "autosave-e3",
      source: "autosave-outcome-decision",
      target: "autosave-confirmed",
      condition: "Confirmed",
    },
    {
      id: "autosave-e4",
      source: "autosave-outcome-decision",
      target: "autosave-failure-summary",
      condition: "Failure",
    },
  ],
};
