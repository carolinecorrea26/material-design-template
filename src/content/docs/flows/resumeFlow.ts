import type { FlowDefinition } from "./types";

export const resumeFlow: FlowDefinition = {
  id: "resume",
  title: "Resume & Verification Flow",
  intro:
    "Restores an incomplete application through an email-based secure link and phone verification code.",
  nodes: [
    {
      id: "resume-request",
      kind: "page",
      pageId: "resume",
      label: "Resume Request",
      description: "User enters application email address; reminder-email links prefill it.",
    },
    {
      id: "resume-request-confirmation",
      kind: "action",
      label: "Request Confirmation",
      description: "System shows same confirmation whether or not a matching application is found.",
    },
    {
      id: "resume-link",
      kind: "action",
      label: "Resume Link",
      description: "User opens the time-limited email link.",
    },
    {
      id: "resume-method",
      kind: "page",
      pageId: "resume-method",
      label: "Resume Method",
      description: "User selects how to receive their verification code: Text or Call.",
    },
    {
      id: "resume-code",
      kind: "page",
      pageId: "resume-code",
      label: "Resume Code",
      description: "User enters the security code sent via the chosen delivery method.",
    },
    {
      id: "resume-result-decision",
      kind: "decision",
      label: "Verification Result",
      description: "Displays success or failure.",
    },
    {
      id: "resume-restored",
      kind: "end",
      label: "Restored Destination",
      description: "User is routed to the next incomplete page.",
    },
  ],
  edges: [
    { id: "resume-e1", source: "resume-request", target: "resume-request-confirmation" },
    { id: "resume-e2", source: "resume-request-confirmation", target: "resume-link" },
    { id: "resume-e3", source: "resume-link", target: "resume-method" },
    { id: "resume-e4", source: "resume-method", target: "resume-code", condition: "Text" },
    { id: "resume-e5", source: "resume-method", target: "resume-code", condition: "Call" },
    { id: "resume-e6", source: "resume-code", target: "resume-result-decision" },
    {
      id: "resume-e7",
      source: "resume-result-decision",
      target: "resume-restored",
      condition: "Successful",
    },
    {
      id: "resume-e8",
      source: "resume-result-decision",
      target: "resume-code",
      condition: "Unsuccessful",
      styleHint: "loop-back",
    },
  ],
};
