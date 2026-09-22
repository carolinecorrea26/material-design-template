// ---------------------------------------------------------------------------
// Capabilities data
//
// High-level, cross-referencing summaries of what the application can do —
// the orientation/navigation layer described in
// src/docs/GlobalOverrideEffectiveArchitecture.md §9. Each capability groups
// one or more of the finer-grained rows in features.tsx (kept there,
// unmodified, as the detail layer) and links out to the relevant Flows,
// Configuration, or Behavior documentation rather than repeating it.
// ---------------------------------------------------------------------------

export type Capability = {
  id: string;
  name: string;
  /** 1-3 sentences — orientation, not a re-statement of every related feature's detail. */
  summary: string;
  /** FeatureEntry.id values from features.tsx — detail stays there, this is just a pointer. */
  relatedFeatureIds: string[];
  /** In-page anchors into Application/Configuration/Behavior. */
  seeAlso: { label: string; href: string }[];
};

export const capabilitiesData: Capability[] = [
  {
    id: "capability-quote",
    name: "Instant Quote & Coverage Shopping",
    summary:
      "Lets a prospective or in-progress applicant estimate premium and coverage amount from a few basic details, compare monthly/annual cost, browse product/category details, and track selections in a running cart — all without committing to a full application.",
    relatedFeatureIds: [
      "feature-instant-quote",
      "feature-rate-toggle",
      "feature-coverage-brochure",
      "feature-ecart",
    ],
    seeAlso: [
      { label: "Quote Flow", href: "#flows-subsection" },
      { label: "Premium & estimated cost configuration", href: "#configuration-options-subsection" },
    ],
  },
  {
    id: "capability-advisor",
    name: "Advisor-Assisted Application",
    summary:
      "Lets a licensed advisor start or continue an application on behalf of an applicant, then hand it off for the applicant to review, complete sensitive fields, and sign.",
    relatedFeatureIds: ["feature-advisor-flow"],
    seeAlso: [{ label: "Advisor-Assisted Flow", href: "#flows-subsection" }],
  },
  {
    id: "capability-resume",
    name: "Resume Application",
    summary:
      "Lets an applicant return to and continue a previously started application after verifying their identity by email and phone.",
    relatedFeatureIds: ["feature-resume"],
    seeAlso: [{ label: "Resume & Verification Flow", href: "#flows-subsection" }],
  },
  {
    id: "capability-autosave",
    name: "Autosaved Application",
    summary:
      "Saves an applicant's progress automatically after the first page is submitted, so work isn't lost between sessions.",
    relatedFeatureIds: ["feature-autosave"],
    seeAlso: [{ label: "Autosave & Persistence Flow", href: "#flows-subsection" }],
  },
  {
    id: "capability-abandoned-leads",
    name: "Abandoned Lead Follow-up",
    summary:
      "Identifies applicants who start but don't finish an application, and re-engages them with milestone/incomplete-application reminder emails.",
    relatedFeatureIds: ["feature-abandoned-leads", "feature-reminder-emails"],
    seeAlso: [{ label: "Behavioral rules", href: "#behavioral-rules-subsection" }],
  },
  {
    id: "capability-tpa",
    name: "TPA Member Verification",
    summary:
      "Matches an applicant against their organization's member roster to verify eligibility, streamlining the application and unlocking their existing coverage portfolio.",
    relatedFeatureIds: ["feature-tpa-integration", "feature-coverage-portfolio"],
    seeAlso: [{ label: "TPA Member Verification Flow", href: "#flows-subsection" }],
  },
  {
    id: "capability-health-underwriting",
    name: "Health Underwriting",
    summary:
      "Presents health and financial questions based on selected coverage and underwriting type, and returns an instant decision (or routes to review) immediately after.",
    relatedFeatureIds: ["feature-health-flows", "feature-financial-questionnaire"],
    seeAlso: [
      { label: "Health Routing", href: "#flows-subsection" },
      { label: "Health pages", href: "#pages-subsection" },
    ],
  },
  {
    id: "capability-esign",
    name: "E-sign",
    summary:
      "Lets an applicant review and electronically sign their completed application before submission, as the final step of the consumer and advisor-assisted flows.",
    relatedFeatureIds: [],
    seeAlso: [
      { label: "Consumer Application Flow", href: "#flows-subsection" },
      { label: "docusign page", href: "#pages-subsection" },
    ],
  },
  {
    id: "capability-url-entry",
    name: "URL-Driven Entry",
    summary:
      "Query-string parameters let a link into the application pre-select a client, template, variant, or starting flow — used for client-specific entry points and marketing/testing links.",
    relatedFeatureIds: [],
    seeAlso: [{ label: "URL Parameters", href: "#url-parameters-subsection" }],
  },
  {
    id: "capability-page-helpers",
    name: "Contextual Help",
    summary:
      "Gives applicants quick access to contextual help — cost estimates, coverage explanations, process questions — directly from the page they're on, without losing progress.",
    relatedFeatureIds: ["feature-page-helpers"],
    seeAlso: [],
  },
  {
    id: "capability-online-payment",
    name: "Online Payment",
    summary:
      "Lets an applicant provide payment information as part of the application, or skip it, depending on what's configured for their organization.",
    relatedFeatureIds: ["feature-online-payment"],
    seeAlso: [{ label: "Page inclusion & workflow configuration", href: "#configuration-options-subsection" }],
  },
  {
    id: "capability-online-beneficiary",
    name: "Online Beneficiary Designation",
    summary:
      "Lets an applicant designate who should receive benefits for applicable Life/Accidental Death coverage, or skip it, depending on what's configured for their organization.",
    relatedFeatureIds: ["feature-online-beneficiary"],
    seeAlso: [{ label: "Page inclusion & workflow configuration", href: "#configuration-options-subsection" }],
  },
];
