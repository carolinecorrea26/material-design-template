export type PageCoverageDisposition =
  | "Covered"
  | "Partial — examples missing"
  | "Internal docs — explicitly excluded";

export type PageCoverageRow = {
  page: string;
  route: string;
  composition: string;
  storyCoverage: string;
  pageSpecific: string;
  disposition: PageCoverageDisposition;
};

/**
 * Phase 6 audit of every route registered in app/router.tsx. Reusable
 * component coverage is linked by Storybook title rather than duplicating
 * the component inventory. The pageSpecific column is the explicit record
 * required for behavior that is intentionally page-shaped, not a missing
 * reusable component story.
 */
export const pageCoverageRows: PageCoverageRow[] = [
  {
    page: "Home",
    route: "/",
    composition: "Standalone marketing/quote page",
    storyCoverage:
      "QuoteCalculator, EligibilityFields, CoverageOptionsPanel, HowApplyingWorksPanel, AppDrawer, QuickDecision",
    pageSpecific: "Hero/CTA composition, quote-entry loading handoff and query-selected variants. Missing examples: HeroClouds and embedded SinglePageSections/StepEditButton.",
    disposition: "Partial — examples missing",
  },
  {
    page: "Membership",
    route: "/membership",
    composition: "FormRoutePage",
    storyCoverage:
      "Application Page Template, FieldRenderer, HelpChips, AppDrawer, QuoteCalculator, SectionDivider",
    pageSpecific: "Client-specific membership, member information and conditional additional-information sections. Applicant-facing AMA lookup dialog removed after review.",
    disposition: "Partial — examples missing",
  },
  {
    page: "Eligibility",
    route: "/eligibility",
    composition: "FormRoutePage",
    storyCoverage:
      "Pages / Eligibility sections, Application Page Template, FieldRenderer, DynamicList, ApplicantSectionDivider, MemberVerification",
    pageSpecific:
      "Section examples cover ZIP-to-state feedback and dependent/spouse/child rendering. Resume-loaded feedback and the continuation bridge remain page-level behavior.",
    disposition: "Covered",
  },
  {
    page: "Coverage",
    route: "/coverage",
    composition: "FormRoutePage",
    storyCoverage:
      "CoverageCategorySelector, CoverageQuestions, ProductCatalog, CoverageCart, CoveragePortfolioDrawer, dialogs/snackbar",
    pageSpecific:
      "Dependent-coverage confirmation and page-level selection validation orchestration.",
    disposition: "Covered",
  },
  {
    page: "Beneficiary",
    route: "/beneficiary",
    composition: "FormRoutePage",
    storyCoverage:
      "ProductCard, CategoryCard, DynamicListItem, SelectionGroup, AppModal, AppDrawer, FieldRenderer",
    pageSpecific:
      "Per-product add/edit/apply-to-others workflow and share-total validation.",
    disposition: "Covered",
  },
  {
    page: "Contact",
    route: "/contact",
    composition: "FormRoutePage",
    storyCoverage:
      "Application Page Template, FieldRenderer, ApplicantSectionDivider, SectionDivider",
    pageSpecific:
      "Home/business/correspondence address visibility and wide+narrow field-row layouts.",
    disposition: "Covered",
  },
  {
    page: "Profile",
    route: "/profile",
    composition: "FormRoutePage",
    storyCoverage:
      "FieldRenderer, ConditionalGroup, DynamicList, PhysicianInformation, SendApplicationDialog, section dividers",
    pageSpecific:
      "Coverage-dependent profile sections and advisor handoff interception.",
    disposition: "Covered",
  },
  {
    page: "Review",
    route: "/review",
    composition: "FormRoutePage",
    storyCoverage:
      "ApplicationDocumentPreview, FieldRenderer, ConfirmationDialog, SendApplicationDialog, ApplicantSectionDivider",
    pageSpecific: "Print actions and advisor/applicant edit-request branching. Missing example: ReviewStatement and its before-consent notice placement.",
    disposition: "Partial — examples missing",
  },
  {
    page: "DocuSign",
    route: "/docusign",
    composition: "FormRoutePage",
    storyCoverage: "Application Page Template and loading/status primitives",
    pageSpecific: "Timed signing-service redirect simulation.",
    disposition: "Covered",
  },
  {
    page: "Health — Simplified Issue",
    route: "/health-si",
    composition: "FormRoutePage",
    storyCoverage:
      "Whole-page Health scenarios; HealthQuestion, HealthQuestionList, FieldRenderer, DynamicList, help and drawer",
    pageSpecific: "Applicant-scoped SI questions, separate adult records, help and validation; standalone HealthQuestionList and HealthQuestion examples cover shared behavior.",
    disposition: "Covered",
  },
  {
    page: "Health — Life",
    route: "/health-li",
    composition: "FormRoutePage",
    storyCoverage: "Whole-page Life scenarios; HealthQuestion, HealthQuestionList, FieldRenderer and DynamicList",
    pageSpecific: "Default and configured source Life question sets, direct/repeated follow-ups and restored adult records. Shared HealthQuestion and HealthQuestionList have standalone examples.",
    disposition: "Covered",
  },
  {
    page: "Health — QuickDecision",
    route: "/health-qd",
    composition: "FormRoutePage",
    storyCoverage: "QuickDecision and loading/status primitives",
    pageSpecific: "Loader while externally hosted QD questions load. Storybook remains pending; no external questions or Next action are simulated.",
    disposition: "Covered",
  },
  {
    page: "Health — Disability",
    route: "/health-di",
    composition: "FormRoutePage",
    storyCoverage:
      "Whole-page Health scenarios; HealthQuestion, HealthQuestionList, FieldRenderer, DynamicList, help and drawer",
    pageSpecific: "Default and configured supplemental DI questions with independent applicant records and required detail validation.",
    disposition: "Covered",
  },
  {
    page: "Health — CIR",
    route: "/health-cir",
    composition: "FormRoutePage",
    storyCoverage: "Whole-page Health scenarios; HealthQuestion, HealthQuestionList and shared field/layout primitives",
    pageSpecific: "The shared CHR/CIR form and direct follow-ups, with rider and Site enablement gates; ABE disables this separate page. An explicitly enabled detached fixture supplies the page example.",
    disposition: "Covered",
  },
  {
    page: "Health — Critical Illness",
    route: "/health-ci",
    composition: "FormRoutePage",
    storyCoverage: "Whole-page Health scenarios; HealthQuestion, HealthQuestionList and shared field/layout primitives",
    pageSpecific: "CI-only/combined source forms, independent adult answers and California wording; application tobacco collection remains on Coverage.",
    disposition: "Covered",
  },
  {
    page: "Error pages",
    route: "/404, /500 and unmatched paths",
    composition: "AppShell / PageShell / FormShell",
    storyCoverage: "Shared page, form, typography and action primitives",
    pageSpecific: "The real ErrorPage owns the 404/500 composition and recovery links. These two states have no dedicated page example.",
    disposition: "Partial — examples missing",
  },
  {
    page: "Payment",
    route: "/payment",
    composition: "FormRoutePage",
    storyCoverage:
      "Payment whole-page scenarios, PaymentSections, SharedPaymentControls and canonical product/field/help/cost surfaces",
    pageSpecific: "Required/optional collection, restored bank and Bill me, member/spouse, multiple products, shared choices and no-products guidance.",
    disposition: "Covered",
  },
  {
    page: "Receipt",
    route: "/receipt",
    composition: "Standalone completion page",
    storyCoverage: "ProductCard, feedback, typography, and layout foundations",
    pageSpecific:
      "Confirmation number, application-status stepper, document download, and email side effect.",
    disposition: "Covered",
  },
  {
    page: "Resume",
    route: "/resume",
    composition: "Standalone resume form",
    storyCoverage: "FormShell, PageTitle, field and feedback primitives",
    pageSpecific: "Magic-link send/resend/expiry flow. The Demo-only ApplicantMockOutbox has no example.",
    disposition: "Partial — examples missing",
  },
  {
    page: "Resume Method",
    route: "/resume-method",
    composition: "Standalone resume form",
    storyCoverage: "FormShell, PageTitle, SelectionGroup",
    pageSpecific: "Delivery-method routing decision.",
    disposition: "Covered",
  },
  {
    page: "Resume Code",
    route: "/resume-code",
    composition: "Standalone resume form",
    storyCoverage: "FormShell, PageTitle, field and feedback primitives",
    pageSpecific: "Security-code verify/resend/expiry and advisor restoration. The Demo-only ApplicantMockOutbox has no example.",
    disposition: "Partial — examples missing",
  },
  {
    page: "Advisor Login",
    route: "/advisor-login",
    composition: "FormRoutePage standalone variant",
    storyCoverage: "Application Page Template and FieldRenderer",
    pageSpecific: "Start/continue tabs and destination resolution.",
    disposition: "Covered",
  },
  {
    page: "Advisor Send Confirmation",
    route: "/advisor-send-confirmation",
    composition: "FormRoutePage standalone variant",
    storyCoverage: "Application Page Template, feedback, buttons, and table foundations",
    pageSpecific: "Sent/purge dates and application handoff detail table.",
    disposition: "Covered",
  },
  {
    page: "Application Edit Confirmation",
    route: "/application-edit-confirmation",
    composition: "FormRoutePage standalone variant",
    storyCoverage: "Application Page Template, feedback, buttons, and table foundations",
    pageSpecific: "Edit-request detail table and delayed focus placement.",
    disposition: "Covered",
  },
  {
    page: "Mock Email Preview",
    route: "/mock-email-preview",
    composition: "InternalPageShell",
    storyCoverage: "Not part of the applicant UI catalog",
    pageSpecific: "Internal global/client email-template preview tabs.",
    disposition: "Internal docs — explicitly excluded",
  },
  {
    page: "Site Features",
    route: "/portal-admin/site-features",
    composition: "InternalPageShell",
    storyCoverage: "Not part of the applicant UI catalog",
    pageSpecific: "Internal capability and parked-idea documentation cards.",
    disposition: "Internal docs — explicitly excluded",
  },
  {
    page: "Site Details",
    route: "/site-details",
    composition: "InternalPageShell",
    storyCoverage: "Not part of the applicant UI catalog",
    pageSpecific: "Internal global/client configuration tabs.",
    disposition: "Internal docs — explicitly excluded",
  },
  {
    page: "Design System",
    route: "/design-system",
    composition: "InternalPageShell",
    storyCoverage: "Superseded by the Storybook catalog itself",
    pageSpecific: "Legacy in-app design/reference surface retained for comparison.",
    disposition: "Internal docs — explicitly excluded",
  },
  {
    page: "Portal Admin",
    route: "/portal-admin",
    composition: "InternalPageShell",
    storyCoverage: "Not part of the applicant UI catalog",
    pageSpecific: "Internal information/project navigation tabs and cards.",
    disposition: "Internal docs — explicitly excluded",
  },
  {
    page: "CMS",
    route: "/portal-admin/cms",
    composition: "InternalPageShell",
    storyCoverage: "Not part of the applicant UI catalog",
    pageSpecific: "Internal global/client CMS reference tabs.",
    disposition: "Internal docs — explicitly excluded",
  },
  {
    page: "Portal Template Project",
    route: "/portal-template-project",
    composition: "InternalPageShell",
    storyCoverage: "Not part of the applicant UI catalog",
    pageSpecific: "Internal project milestones, requirements, and change-log views.",
    disposition: "Internal docs — explicitly excluded",
  },
  {
    page: "Portal Requirements Project",
    route: "/portal-requirements-project",
    composition: "InternalPageShell",
    storyCoverage: "Not part of the applicant UI catalog",
    pageSpecific: "Internal requirements-project placeholder views.",
    disposition: "Internal docs — explicitly excluded",
  },
];
