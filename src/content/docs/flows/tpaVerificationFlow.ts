import type { FlowDefinition } from "./types";

export const tpaVerificationFlow: FlowDefinition = {
  id: "tpaVerification",
  title: "TPA Member Verification Flow",
  intro: "After membership attestation, use the configured prototype TPA lookup. Existing members with active coverage proceed to simulated identity verification. AMA uses First Name, Last Name and DOB. ASCE also requires Membership ID and state; when matched, an alert collects the full residential address before the member verification modal opens. A pass enables the coverage portfolio; failure or skipping continues without a portfolio. No real verification provider is required for the prototype.",
  nodes: [
    { id: "tpa-membership", kind: "page", pageId: "membership", label: "Membership attestation", description: "Applicant claims membership eligibility before the TPA lookup." },
    {
      id: "tpa-eligibility-lookup",
      kind: "external",
      label: "TPA Eligibility Lookup",
      description: "Look up First Name, Last Name and DOB, plus any configured additional fields. Return existing-member and active-coverage status.",
    },
    {
      id: "tpa-match-decision",
      kind: "decision",
      label: "Existing member + active coverage?",
      description: "Both conditions must be true to offer LexisNexis identity verification.",
    },
    {
      id: "tpa-no-match",
      kind: "end",
      label: "Regular Application — No Portfolio",
      description:
        "No existing member or no active coverage. Continue without a coverage portfolio; submission goes to the TPA admin for manual review.",
    },
    {
      id: "tpa-method-decision",
      kind: "decision",
      label: "Choose Verification Method",
      description:
        "Where configured, collect the full residential address with an alert first. Then offer simulated text code, voice code or security questions, or proceed without verification.",
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
        "LexisNexis failed or was skipped. Continue without a coverage portfolio; submission goes to the TPA admin for manual review.",
    },
  ],
  edges: [
    { id: "tpa-attestation-lookup", source: "tpa-membership", target: "tpa-eligibility-lookup" },
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
