import type { FlowDefinition } from "./types";

export const tpaVerificationFlow: FlowDefinition = {
  id: "tpaVerification",
  title: "TPA Member Verification Flow",
  intro:
    "Base TPA integration behavior. A matching current member may attempt identity verification, but the application continues through the regular consumer flow whether verification succeeds, fails, or is skipped. Successful verification sets tpa-verified=true, enables the existing Coverage Portfolio on Coverage, and marks the submitted application for auto-approval in the TPA Admin Portal. Client overrides may change how tpa-verified is established or how downstream portfolio and approval behavior resolves.",
  nodes: [
    {
      id: "tpa-eligibility-lookup",
      kind: "external",
      label: "TPA Eligibility Lookup",
      description: "The system checks submitted applicant data for a matching TPA member record.",
    },
    {
      id: "tpa-match-decision",
      kind: "decision",
      label: "Current member match found?",
      description: "Determines whether member identity verification is offered.",
    },
    {
      id: "tpa-no-match",
      kind: "end",
      label: "Regular Application — No Portfolio",
      description:
        "No matching member record. Continue the regular consumer application flow without a Coverage Portfolio and without TPA verification-based auto-approval.",
    },
    {
      id: "tpa-method-decision",
      kind: "decision",
      label: "Choose Verification Method",
      description:
        "Applicant may verify by text code, voice code, or security questions, or proceed without verification.",
    },
    {
      id: "tpa-security-questions",
      kind: "action",
      label: "LexisNexis Security Questions",
      description:
        "Three identity questions are presented. Selecting a none-of-the-above response causes verification failure.",
    },
    {
      id: "tpa-result-decision",
      kind: "decision",
      label: "Verification successful?",
      description: "A completed verification attempt resolves to success or failure.",
    },
    {
      id: "tpa-verified-outcome",
      kind: "end",
      label: "Regular Application — Portfolio Enabled",
      description:
        "tpa-verified=true. Continue the regular consumer application flow. Coverage shows the existing Coverage Portfolio, and submission is marked for auto-approval in the TPA Admin Portal.",
    },
    {
      id: "tpa-unverified-outcome",
      kind: "end",
      label: "Regular Application — No Portfolio",
      description:
        "Verification failed or was not completed. Continue the regular consumer application flow without the Coverage Portfolio and without TPA verification-based auto-approval.",
    },
  ],
  edges: [
    { id: "tpa-e1", source: "tpa-eligibility-lookup", target: "tpa-match-decision" },
    { id: "tpa-e2", source: "tpa-match-decision", target: "tpa-no-match", condition: "No" },
    { id: "tpa-e3", source: "tpa-match-decision", target: "tpa-method-decision", condition: "Yes" },
    { id: "tpa-e4", source: "tpa-method-decision", target: "tpa-result-decision", condition: "Text code" },
    { id: "tpa-e5", source: "tpa-method-decision", target: "tpa-result-decision", condition: "Voice code" },
    {
      id: "tpa-e6",
      source: "tpa-method-decision",
      target: "tpa-security-questions",
      condition: "Security questions",
    },
    {
      id: "tpa-e7",
      source: "tpa-method-decision",
      target: "tpa-unverified-outcome",
      condition: "Proceed without verification",
    },
    { id: "tpa-e8", source: "tpa-security-questions", target: "tpa-result-decision" },
    { id: "tpa-e9", source: "tpa-result-decision", target: "tpa-verified-outcome", condition: "Yes" },
    { id: "tpa-e10", source: "tpa-result-decision", target: "tpa-unverified-outcome", condition: "No" },
  ],
};
