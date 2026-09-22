import type { FlowDefinition } from "./types";

export const consumerFlow: FlowDefinition = {
  id: "consumer",
  title: "Consumer Application Flow",
  intro:
    "Shows the stable consumer application backbone. Page inclusion and page contents are resolved by client configuration, applicant data, selected coverage, underwriting requirements, and enabled riders. Conditional coverage behavior, field/section variations, and health-page routing are documented in their configuration/routing sections rather than selectively expanded in this backbone flow.",
  nodes: [
    {
      id: "consumer-landing",
      kind: "page",
      pageId: "home",
      label: "Landing Page",
      description: "Starts a new application, opens Quote, or resumes an application.",
    },
    {
      id: "consumer-membership",
      kind: "page",
      pageId: "membership",
      label: "Membership",
      description:
        "Collects membership and applicant contact information. Establishes application record and starts autosave.",
    },
    {
      id: "consumer-eligibility",
      kind: "page",
      pageId: "eligibility",
      label: "Eligibility",
      description:
        "Collects ZIP/postal code, state, date of birth, dependent selection, and configured eligibility responses.",
    },
    {
      id: "consumer-coverage",
      kind: "page",
      pageId: "coverage",
      label: "Coverage",
      description:
        "Collects eligible applicants, products, amounts, riders, and estimated premiums. Available choices and downstream requirements vary by selected coverage and client configuration.",
    },
    {
      id: "consumer-beneficiary",
      kind: "page",
      pageId: "beneficiary",
      label: "Beneficiary",
      description:
        "Included when selected coverage is configured for beneficiary designation (Required/Optional/None mode).",
    },
    {
      id: "consumer-contact",
      kind: "page",
      pageId: "contact",
      label: "Contact",
      description: "Collects configured applicant, mailing, business, and spouse contact information.",
    },
    {
      id: "consumer-profile",
      kind: "page",
      pageId: "profile",
      label: "Profile",
      description:
        "Collects configured personal, employment, financial, existing-coverage, travel, residence, and spouse information.",
    },
    {
      id: "consumer-review",
      kind: "page",
      pageId: "review",
      label: "Review",
      description: "Presents application summary and required consent/acknowledgement sections.",
    },
    {
      id: "consumer-health-summary",
      kind: "summary",
      label: "Health Routing",
      description:
        "Applicable health forms are resolved independently from selected coverage and underwriting type. See Health Routing below for the condition-to-page mapping.",
    },
    {
      id: "consumer-payment",
      kind: "page",
      pageId: "payment",
      label: "Payment",
      description: "Collects payment information when included by Required or Optional page mode.",
    },
    {
      id: "consumer-esign",
      kind: "page",
      pageId: "docusign",
      label: "E-Sign",
      description: "Completes the configured electronic-signature process (DocuSign).",
    },
    {
      id: "consumer-receipt",
      kind: "page",
      pageId: "receipt",
      label: "Receipt",
      description: "Displays submission confirmation, decision information, and configured next steps.",
    },
  ],
  edges: [
    { id: "consumer-e1", source: "consumer-landing", target: "consumer-membership" },
    { id: "consumer-e2", source: "consumer-membership", target: "consumer-eligibility" },
    { id: "consumer-e3", source: "consumer-eligibility", target: "consumer-coverage" },
    { id: "consumer-e4", source: "consumer-coverage", target: "consumer-beneficiary" },
    { id: "consumer-e5", source: "consumer-beneficiary", target: "consumer-contact" },
    { id: "consumer-e6", source: "consumer-contact", target: "consumer-profile" },
    { id: "consumer-e7", source: "consumer-profile", target: "consumer-review" },
    { id: "consumer-e8", source: "consumer-review", target: "consumer-health-summary" },
    { id: "consumer-e9", source: "consumer-health-summary", target: "consumer-payment" },
    { id: "consumer-e10", source: "consumer-payment", target: "consumer-esign" },
    { id: "consumer-e11", source: "consumer-esign", target: "consumer-receipt" },
  ],
};
