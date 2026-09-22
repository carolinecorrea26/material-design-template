import type { FlowDefinition } from "./types";

export const advisorFlow: FlowDefinition = {
  id: "advisor",
  title: "Advisor-Assisted Flow",
  intro:
    "The advisor completes the application through Profile and transfers it to the applicant for review and final completion. Only one actor may access the application at a time.",
  nodes: [
    {
      id: "advisor-login",
      kind: "page",
      pageId: "advisor-login",
      label: "Advisor Login",
      description: "Advisor starts a new application or resumes a saved application.",
    },
    {
      id: "advisor-membership",
      kind: "page",
      pageId: "membership",
      label: "Membership",
      description: "Advisor begins application.",
    },
    {
      id: "advisor-eligibility",
      kind: "page",
      pageId: "eligibility",
      label: "Eligibility",
      description: "Advisor completes eligibility information.",
    },
    {
      id: "advisor-coverage",
      kind: "page",
      pageId: "coverage",
      label: "Coverage",
      description: "Advisor completes coverage selections.",
    },
    {
      id: "advisor-beneficiary",
      kind: "page",
      pageId: "beneficiary",
      label: "Beneficiary (if applicable)",
      description: "Advisor completes beneficiary information when included in resolved flow.",
    },
    {
      id: "advisor-contact",
      kind: "page",
      pageId: "contact",
      label: "Contact",
      description: "Advisor completes contact information.",
    },
    {
      id: "advisor-profile",
      kind: "page",
      pageId: "profile",
      label: "Profile",
      description: "Advisor completes the final advisor page.",
    },
    {
      id: "advisor-send-dialog",
      kind: "action",
      label: "Send Application Dialog",
      description:
        "After clicking Next on Profile, advisor sees SendApplicationDialog titled 'Send to applicant for review' with applicant name + email and send-confirmation copy.",
    },
    {
      id: "advisor-send-confirmation",
      kind: "page",
      pageId: "advisor-send-confirmation",
      label: "Advisor Send Confirmation",
      description:
        "Confirmation page showing the applicant email, send timestamp, and purge date. Advisor can start a new application.",
    },
    {
      id: "advisor-resume-verification",
      kind: "page",
      pageId: "resume",
      label: "Resume & Verification (Applicant)",
      description:
        "Applicant enters via resume?flow=advisor. Verification step may be skipped in the advisor flow.",
    },
    {
      id: "advisor-review",
      kind: "page",
      pageId: "review",
      label: "Review (advisor mode)",
      description:
        "Applicant reviews advisor-entered application data on the standard Review page (flow=advisor). Earlier stepper steps are locked.",
    },
    {
      id: "advisor-edit-decision",
      kind: "decision",
      label: "Applicant requests edit?",
      description: "Edit icon on Review (advisor mode) opens the edit-request dialog.",
    },
    {
      id: "advisor-edit-dialog",
      kind: "action",
      label: "Request Edit Dialog",
      description:
        "SendApplicationDialog titled 'Request edit to application' with advisor email only and alert copy.",
    },
    {
      id: "advisor-edit-confirmation",
      kind: "page",
      pageId: "application-edit-confirmation",
      label: "Application Edit Confirmation",
      description:
        "Confirms the edit request was sent to the advisor dummy email. Application lock transfers back to the advisor; applicant access ends here.",
    },
    {
      id: "advisor-health-summary",
      kind: "summary",
      label: "Health (SI → LI → QD → CIR → DI)",
      description:
        "Applicable health forms as separate routes grouped under one Health progress stage — see Health Routing below for per-condition detail.",
    },
    {
      id: "advisor-payment",
      kind: "page",
      pageId: "payment",
      label: "Payment",
      description: "Collects payment information when included by Required or Optional page mode.",
    },
    {
      id: "advisor-esign",
      kind: "page",
      pageId: "docusign",
      label: "E-Sign",
      description: "Completes the configured electronic-signature process (DocuSign).",
    },
    {
      id: "advisor-receipt",
      kind: "page",
      pageId: "receipt",
      label: "Receipt",
      description: "Displays submission confirmation, decision information, and configured next steps.",
    },
  ],
  edges: [
    { id: "advisor-e1", source: "advisor-login", target: "advisor-membership" },
    { id: "advisor-e2", source: "advisor-membership", target: "advisor-eligibility" },
    { id: "advisor-e3", source: "advisor-eligibility", target: "advisor-coverage" },
    { id: "advisor-e4", source: "advisor-coverage", target: "advisor-beneficiary" },
    { id: "advisor-e5", source: "advisor-beneficiary", target: "advisor-contact" },
    { id: "advisor-e6", source: "advisor-contact", target: "advisor-profile" },
    { id: "advisor-e7", source: "advisor-profile", target: "advisor-send-dialog" },
    {
      id: "advisor-e8",
      source: "advisor-send-dialog",
      target: "advisor-send-confirmation",
      condition: "Send",
    },
    {
      id: "advisor-e9",
      source: "advisor-send-dialog",
      target: "advisor-profile",
      condition: "Cancel",
      styleHint: "loop-back",
    },
    { id: "advisor-e10", source: "advisor-send-confirmation", target: "advisor-resume-verification" },
    { id: "advisor-e11", source: "advisor-resume-verification", target: "advisor-review" },
    { id: "advisor-e12", source: "advisor-review", target: "advisor-edit-decision" },
    {
      id: "advisor-e13",
      source: "advisor-edit-decision",
      target: "advisor-edit-dialog",
      condition: "Request edit",
    },
    {
      id: "advisor-e14",
      source: "advisor-edit-decision",
      target: "advisor-health-summary",
      condition: "Continue (no edits)",
    },
    {
      id: "advisor-e15",
      source: "advisor-edit-dialog",
      target: "advisor-edit-confirmation",
      condition: "Send",
      styleHint: "dialog-return",
    },
    {
      id: "advisor-e16",
      source: "advisor-edit-dialog",
      target: "advisor-review",
      condition: "Cancel",
      styleHint: "loop-back",
    },
    { id: "advisor-e17", source: "advisor-health-summary", target: "advisor-payment" },
    { id: "advisor-e18", source: "advisor-payment", target: "advisor-esign" },
    { id: "advisor-e19", source: "advisor-esign", target: "advisor-receipt" },
  ],
};
