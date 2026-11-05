import { waepaQualifications } from "../../domain/membershipQualifications";
import { applicationRecoveryRules } from './applicationRecoveryRules';
import type { RuleDefinition, SiteId } from "../../data";
import {
  contactCarryForwardTransition,
  describeApplicationTransition,
  quoteApplyTransition,
} from "../../config/applicationTransitions";

// ---------------------------------------------------------------------------
// Site rules data
//
// Extracted from src/pages/InformationArchitecture.tsx (Site Rules section).
// ---------------------------------------------------------------------------

const siteRuleInventory: (Omit<RuleDefinition, "id"> & { id?: RuleDefinition["id"] })[] = [
  ...applicationRecoveryRules,
  {
    area: "Application flow",
    rule: "Resolved next/back navigation",
    behavior:
      "Next and Back use the form-flow resolver and skip pages whose display conditions evaluate to false.",
    ref: "src/config/formFlow.ts; src/app/RoutePage.tsx",
  },
  {
    area: "Application flow",
    rule: "Intermediate-step Next interception",
    behavior:
      "Pages can register an onBeforeNext hook that pauses forward navigation, shows an intermediate step (e.g. a confirmation dialog or send dialog), and resumes navigation only when the page calls the provided continueNavigation callback. Used by Coverage (dependent-only confirmation) and Profile (advisor send dialog).",
    ref: "src/app/RoutePage.tsx; src/pages/Profile.tsx; src/pages/Coverage.tsx",
  },
  {
    area: "Application flow",
    rule: "Client page mode = none",
    behavior:
      "If Beneficiary or Payment is configured as none, the page is skipped from the active form flow.",
    ref: "src/config/flowGates.ts; src/config/client/getClientPageRequirement.ts",
  },
  {
    area: "Application flow",
    rule: "Beneficiary routing",
    behavior:
      "Beneficiary requires a requested amount and an applicant/product allowed by the captured beneficiary participation policy, unless the page is configured as none. The shared fallback gate selects Life (LI) or Accidental Death (AD); explicit Site, Association and applicant exceptions remain authoritative.",
    ref: "src/config/flowGates.ts",
  },
  {
    area: "Application flow",
    rule: "Health SI routing",
    behavior: "Shown for an active applicant whose resolved health page is health-si, falling back to the captured SI gate when no health-page override exists. Assigned source questionnaires may supersede this page.",
    ref: "src/config/flowGates.ts",
  },
  {
    area: "Application flow",
    rule: "Health WAEPAWL routing",
    behavior:
      "Shown when a Whole Life product with SI and UW flow is selected. (Page not yet implemented in prototype.)",
    ref: "src/config/formFlow.ts",
  },
  {
    area: "Application flow",
    rule: "Health TELE SUPP routing",
    behavior:
      "health-li and health-di use each active applicant's resolved health-page outcome. Without a health-page override, their captured gates require LI + TELE and DI + TELE respectively; assigned source questionnaires can supersede health-di.",
    ref: "src/config/flowGates.ts",
  },
  {
    area: "Application flow",
    rule: "Health CI routing",
    behavior:
      "Shown when a Critical Illness product is selected. (Page not yet implemented in prototype.)",
    ref: "src/content/docs/siteRules.ts (documented future rule; page not implemented)",
  },
  {
    area: "Application flow",
    rule: "Health UW CIR routing",
    behavior:
      "Shown when the captured CIR rider gate matches an enabled rider selection and the page participates in the Site flow. WAEPA's dedicated CIR questionnaire retains its separately approved provisional deferral.",
    ref: "src/config/flowGates.ts",
  },
  {
    area: "Application flow",
    rule: "Health QD routing",
    behavior:
      "Shown for an active applicant whose resolved health page is health-qd, falling back to the captured QD gate when no health-page override exists. Assigned source questionnaires may supersede this page; the external GMA-JI-L questionnaire shows only the approved prototype loading state.",
    ref: "src/config/flowGates.ts",
  },
  {
    area: "Application flow",
    rule: "Health QD CIR routing",
    behavior:
      "Shown when LI (QD) is selected with a CIR rider. (Page not yet implemented in prototype.)",
    ref: "src/config/formFlow.ts",
  },
  {
    area: "Application flow",
    rule: "Health DI SUPP routing",
    behavior:
      "Shown when LI (QD) and DI (UW) are both selected. (Page not yet implemented in prototype.)",
    ref: "src/config/formFlow.ts",
  },
  {
    area: "Progress/navigation",
    rule: "Health grouped in progress",
    behavior:
      "Multiple routed health pages are presented within the consolidated application-review/progress experience rather than as separate major progress stages.",
    ref: "src/config/progressSteps.ts",
  },
  {
    area: "Progress/navigation",
    rule: "Skipped stages removed",
    behavior:
      "If every page in a progress stage is skipped, the stage is removed from the active progress steps.",
    ref: "src/config/progressSteps.ts",
  },
  {
    area: "Progress/navigation",
    rule: "Post-review Back disabled",
    behavior:
      "After Review is submitted, Back navigation is disabled on pages after Review.",
    ref: "src/app/RoutePage.tsx",
  },
  {
    area: "Progress/navigation",
    rule: "Back button hidden with no previous page",
    behavior:
      "The PageHeader/PageTitle back arrow is rendered only when getPreviousFormPageId resolves a previous page for the current values and the page is not after a submitted review; otherwise the back control is hidden, including on post-review pages after submission.",
    ref: "src/app/RoutePage.tsx; src/components/layout/PageHeader.tsx; src/components/layout/PageTitle.tsx",
  },
  {
    area: "Form Template",
    id: "rule-form-template-single-template-forces-the-narrow-screen-layout-not-a-separate-one-page-form",
    rule: "Single template embeds the application in landing-page sections",
    behavior:
      "template=single embeds SinglePageApplication below the landing content. SinglePageSections renders the active applicant page within a vertical progress layout; completing a page advances to the next applicable section, and permitted edits reopen earlier sections. Shared page participation, validation and routing rules still apply. The theme also forces narrow-screen layout for md/lg/xl responsive styles.",
    ref: "src/app/SinglePageApplication.tsx; src/components/layout/SinglePageSections.tsx; src/app/RoutePage.tsx; src/app/theme.ts",
  },
  {
    area: "Form Template",
    rule: "sm breakpoint stays real so sm-level padding isn't lost",
    behavior:
      "forceMobileLayout only overrides md/lg/xl — sm (600px) is left at its default. Components that only bump padding/spacing at sm (e.g. FormRoutePage's FormShell, which uses px: { xs: 2, sm: \"48px\" }) still receive that breathing room once the real browser viewport is 600px or wider, instead of staying pinned to their tightest xs padding on an actual desktop screen.",
    ref: "src/app/theme.ts",
  },
  {
    area: "Form Template",
    id: "rule-form-template-home-hero-membership-share-one-column-at-different-max-widths",
    rule: "Single template places the application below the landing content",
    behavior:
      "In single template, Home renders the configured landing content followed by SinglePageApplication. The application reuses the existing applicant page components within one vertical section layout. Artwork follows the configured single-page artwork setting; a fixed hero/form width is not an independent business rule.",
    ref: "src/pages/Home.tsx; src/app/SinglePageApplication.tsx; src/components/layout/SinglePageSections.tsx; src/config/homepagePresentation.ts",
  },
  {
    area: "Validation",
    rule: "Page advance",
    behavior:
      "Field validation failure blocks advancement, shows an error and scrolls toward the first invalid field. Page-level validation failure blocks advancement, shows its message and scrolls to the top.",
    ref: "src/app/RoutePage.tsx",
  },
  {
    area: "Persistence",
    rule: "Values preserved during navigation",
    behavior:
      "Current page values are written to shared application state on submit, Back, and unmount when the page was not explicitly saved.",
    ref: "src/app/RoutePage.tsx; ApplicationFormContext.tsx",
  },
  {
    area: "Persistence",
    rule: "Progress-saved feedback",
    behavior:
      "After forward navigation, the destination page displays a Progress Saved snackbar (AppSnackbar, severity=success). The snackbar appears at top-center on large screens and bottom-center on small screens.",
    ref: "src/app/RoutePage.tsx; src/components/feedback/AppSnackbar.tsx",
  },
  {
    area: "Persistence",
    rule: "Membership starts autosave mock communication",
    behavior:
      "Submitting Membership triggers the current prototype autosave mock-email behavior.",
    ref: "src/app/RoutePage.tsx",
  },
  {
    area: "Applicant display",
    rule: "Member section title hidden for member-only flow",
    behavior:
      "The Member/Self applicant section label is hidden when no spouse/child is actually selected for any product. It is shown when another applicant is applying.",
    ref: "src/utils/applicantVisibility.ts",
  },
  {
    area: "Applicant display",
    rule: "Dependent section shown only when applying",
    behavior:
      "Spouse/child applicant labels and post-Coverage applicant sections are shown only when that applicant is actually selected for an applicable product.",
    ref: "src/utils/applicantVisibility.ts; src/app/RoutePage.tsx",
  },
  {
    area: "Applicant display",
    rule: "Eligibility selection alone is not enough after Coverage",
    behavior:
      "A spouse/child selected on Eligibility does not count as applying if that dependent is not selected for any product on Coverage.",
    ref: "src/utils/applicantVisibility.ts",
  },
  {
    area: "Applicant display",
    rule: "Member-only fallback",
    behavior:
      "When no dependents are selected, the member is treated as the applicant by default.",
    ref: "src/utils/applicantsApplying.ts",
  },
  {
    area: "Eligibility",
    rule: "Child records via DynamicList",
    behavior:
      "When Child is selected and applicantExperience.childEligibility.mode is details (the default), DynamicList collects children[].firstName, lastName, birthDate and gender using the effective field definitions. Unmarried and full-time-student questions are added when applicable product eligibility rules require them. Records support Add, Edit and Remove; at least one child is required to continue. Client or Site configuration can choose notice-only instead, showing the configured note without collecting or requiring records. CSEA uses notice-only.",
    ref: "src/pages/Eligibility.tsx; src/components/forms/DynamicList.tsx",
  },
  {
    area: "Eligibility",
    rule: "Spouse dependent requires spouse details",
    behavior:
      "If Spouse is selected, spouse name details must be provided before continuing.",
    ref: "src/pages/Eligibility.tsx",
  },
  {
    area: "Eligibility",
    rule: "Child section displays unmarried-children notice",
    behavior:
      "When the Child dependent section is visible, an info alert under the section header states that only unmarried children are eligible for coverage.",
    ref: "src/pages/Eligibility.tsx",
    type: "conditional",
    conditionIds: ["condition-child-selected"],
  },
  {
    area: "Eligibility",
    rule: "ZIP can derive state/province",
    behavior:
      "When a recognizable ZIP/postal code is entered, the state/province field is automatically derived when a matching configured option exists. The user may manually override the derived state at any time; a subsequent ZIP change will re-derive state from the new ZIP.",
    ref: "src/components/forms/EligibilityFields.tsx; src/utils/zipToStateProvince.ts",
  },
  {
    area: "Eligibility",
    rule: "Membership-conditional dependent options",
    behavior:
      "Dependent options on Eligibility can be suppressed based on membership attestation. When a membership type implies a specific relationship (e.g. the member is a spouse/dependent of the primary member), the corresponding dependent option is removed to prevent duplicate applicant entry. Section visibility, labels, and suppression rules are client-configurable.",
    ref: "src/pages/Eligibility.tsx",
  },
  {
    area: "Coverage",
    rule: "Category selection and two-step product reveal",
    behavior:
      "The user first selects one or more coverage categories via a multi-select chip list. Selecting a category may surface additional required questions (tobacco use, income, hours). When all required questions are answered, a 'See my coverage options' button appears. Clicking it validates the form and, if valid, reveals the product catalog. Changing a category selection or question answer after products are shown collapses the catalog and requires another click.",
    ref: "src/pages/Coverage.tsx; src/app/useCoverageState.ts; src/components/coverage/CoverageCategorySelector.tsx",
    type: "conditional",
    conditionIds: ["condition-member-smoker", "condition-spouse-smoker"],
  },
  {
    area: "Coverage",
    rule: "Per-applicant product selection",
    behavior:
      "Each product card lists eligible applicants (member, spouse, child) as checkboxes. Checking an applicant reveals a benefit amount dropdown. DI/OO products also show waiting period and max benefit period dropdowns. Optional riders appear as checkboxes; selecting a rider with an amount range reveals a rider amount dropdown. Coverage selections and amounts are stored per product/applicant key.",
    ref: "src/components/coverage/ProductCatalog.tsx; src/app/useCoverageState.ts",
  },
  {
    area: "Coverage",
    rule: "Dependent-only selection confirmation",
    behavior:
      "If only spouse and/or child are selected for all chosen products (no member selection), clicking Next triggers the onBeforeNext hook and opens a ConfirmationDialog. The user must click Continue to proceed or Cancel to stay on Coverage.",
    ref: "src/pages/Coverage.tsx; src/components/layout/ConfirmationDialog.tsx",
  },
  {
    area: "Coverage",
    rule: "Coverage amount note",
    behavior:
      "The site can present either 'additional coverage' or 'total coverage' guidance based on the active client configuration.",
    ref: "src/components/coverage/ProductCatalog.tsx",
  },
  {
    area: "Coverage",
    rule: "Category initial expansion",
    behavior:
      "Coverage categories may start expanded for clients configured with allCategoriesExpanded.",
    ref: "src/config/clients/types.ts; client configs",
  },
  {
    area: "Coverage cart",
    rule: "First-add drawer vs. subsequent-add snackbar",
    behavior:
      "When the user selects their very first product from a state of no selections, the Coverage added AppDrawer opens to show the full cart. For all subsequent product or applicant additions, a compact 'Added' success AppSnackbar appears instead of re-opening the drawer.",
    ref: "src/app/useCoverageState.ts; src/pages/Coverage.tsx; src/components/feedback/AppSnackbar.tsx",
  },
  {
    area: "Coverage cart",
    rule: "Cart availability",
    behavior:
      "The application header shows the coverage cart on application pages except Home and Receipt, and hides it after Review has been submitted.",
    ref: "src/components/layout/AppHeader.tsx",
  },
  {
    area: "Coverage cart",
    rule: "Cart badge",
    behavior:
      "The cart icon displays a badge count derived from current coverage selections.",
    ref: "src/components/layout/AppHeader.tsx; CoverageCart.tsx",
  },
  {
    area: "Coverage cart",
    rule: "Inline cart hidden until a product is selected",
    behavior:
      "The 'Your requested coverage' inline panel below the Coverage page product catalog shows nothing at all — no section title and no empty-state placeholder — until at least one applicant has an amount selected for a product (grandTotal > 0). The full-drawer cart variant (opened from the header cart icon or the Coverage page's own summary drawer) is unaffected and still shows its 'No coverage selected yet.' empty state.",
    ref: "src/components/coverage/CoverageCart.tsx (CoverageCartInline)",
  },
  {
    area: "Home / Quote tool",
    rule: "Quote reveal mirrors Coverage page's category reveal",
    behavior:
      "Clicking 'See my quote' validates the category-level fields, reveals the matching product cards, and scrolls the drawer so the revealed products land at the top. The 'See my quote' button then hides and reappears only if the user edits a coverage question (gender, tobacco use, income, hours, business expenses/responsibility) or toggles a coverage category selection — the same show/hide contract as the Coverage page's 'See my coverage options' button.",
    ref: "src/app/workflows/QuoteCalculator.tsx (handleGetEstimates, handleQuoteFieldChange, handleCategoryToggle)",
  },
  {
    area: "Home / Quote tool",
    rule: "Estimated cost panel uses the shared TotalCostSummary component",
    behavior:
      "The quote drawer's estimated cost panel now renders via the same TotalCostSummary component used on the Coverage page and in the coverage cart drawer, instead of a bespoke box. Like the Coverage page's inline cart, the panel is hidden entirely until at least one product/applicant has been added (no 'Added coverage will appear here' placeholder); the rate-frequency toggle and Apply button remain visible whenever products are shown.",
    ref: "src/app/workflows/QuoteCalculator.tsx; src/components/coverage/TotalCostSummary.tsx",
  },
  {
    area: "Home / Quote tool",
    rule: "Apply initializes the application",
    behavior: `When a user applies from a quote, collected quote information and selected coverage initialize the application through the canonical quote.apply transition. Targets: ${describeApplicationTransition(quoteApplyTransition)}.`,
    ref: "src/config/applicationTransitions/applicationTransitions.ts (quoteApplyTransition)",
  },
  {
    area: "Contact",
    rule: "Eligibility address carry-forward",
    behavior: `When Contact is entered, existing Eligibility location values preset empty Contact location fields without overwriting user-entered Contact values. Targets: ${describeApplicationTransition(contactCarryForwardTransition)}.`,
    ref: "src/config/applicationTransitions/applicationTransitions.ts (contactCarryForwardTransition)",
  },
  {
    area: "Feedback",
    rule: "Snackbar positioning",
    behavior:
      "AppSnackbar appears at top-center on large screens and bottom-center on small screens. Used for Progress Saved and Coverage Added feedback.",
    ref: "src/components/feedback/AppSnackbar.tsx",
  },
  {
    area: "Beneficiary",
    rule: "Applicable applicants/products",
    behavior:
      "Beneficiary records are created only for selected member/spouse LI/AD products with a positive coverage amount and selected applicant.",
    ref: "src/pages/Beneficiary.tsx",
  },
  {
    area: "Beneficiary",
    rule: "Optional page opt-in",
    behavior:
      "When Beneficiary mode is optional, the page first asks whether the user wants to add beneficiary information. No skips the beneficiary questions and permits continuation.",
    ref: "src/pages/Beneficiary.tsx",
  },
  {
    area: "Beneficiary",
    rule: "Required beneficiary per applicable product",
    behavior:
      "When beneficiary questions are active, each applicable product must have at least one beneficiary before continuing.",
    ref: "src/pages/Beneficiary.tsx",
  },
  {
    area: "Beneficiary",
    rule: "Add/edit/remove modal",
    behavior:
      "Clicking 'Add Beneficiary' on a product card opens an AppModal. The modal shows: designation tabs (Primary / Contingent) with a remaining-slot counter; beneficiary type selector (Individual or Trust); and type-specific fields. Individual fields: First Name, Last Name, Relationship, % Share with 25/50/75/100% quick-fill buttons and a live 'X% unassigned remaining' display. Trust fields: Name of Trust and Date of Trust. Clicking Edit pre-populates the modal with the existing record. The 'Add Beneficiary' button is replaced by an info alert when both designations are fully maxed.",
    ref: "src/pages/Beneficiary.tsx; src/components/layout/AppModal.tsx",
  },
  {
    area: "Beneficiary",
    rule: "Primary/contingent designation",
    behavior:
      "Each beneficiary is designated as Primary or Contingent, selected via tabs in the add/edit modal.",
    ref: "src/pages/Beneficiary.tsx",
  },
  {
    area: "Beneficiary",
    rule: "Individual vs. trust",
    behavior:
      "A beneficiary can be an Individual or Trust. Within the same Primary/Contingent designation, trust and individual beneficiary types cannot be mixed.",
    ref: "src/pages/Beneficiary.tsx",
  },
  {
    area: "Beneficiary",
    rule: "Maximum beneficiaries",
    behavior:
      "Up to 10 Primary and 10 Contingent beneficiaries may be added per product; reaching 10 prevents additional entries for that designation.",
    ref: "src/pages/Beneficiary.tsx",
  },
  {
    area: "Beneficiary",
    rule: "Individual allocation",
    behavior:
      "Individual beneficiary share must be greater than 0 and cannot exceed the unassigned percentage remaining for that designation.",
    ref: "src/pages/Beneficiary.tsx",
  },
  {
    area: "Beneficiary",
    rule: "Allocation reaches 100%",
    behavior:
      "Once the assigned individual share reaches 100% for a designation, no more individual beneficiaries can be added for that designation.",
    ref: "src/pages/Beneficiary.tsx",
  },
  {
    area: "Beneficiary",
    rule: "Trust exclusivity",
    behavior:
      "Only one Trust may be added per Primary/Contingent designation; if a Trust exists, additional individuals or trusts are blocked for that designation.",
    ref: "src/pages/Beneficiary.tsx",
  },
  {
    area: "Beneficiary",
    rule: "Apply to other coverages",
    behavior:
      "After saving a new (not edited) beneficiary, if the same applicant has other eligible products, a second AppModal opens listing those products as checkboxes. The user can select one or more and click 'Apply to Selected', or click Skip. When applied, each target product receives a separate beneficiary record with a new unique ID — not a shared reference.",
    ref: "src/pages/Beneficiary.tsx",
  },
  {
    area: "Contact",
    rule: "Business address same as home",
    behavior:
      "The captured Contact configuration scopes business fields to selected products when a product list is assigned. Standard WAEPA shows the Business/Employer section with STD and hides it for Life-only; GI retains its separate hiding policy. For visible business addresses, marking the address the same as home reuses the home address. Other DI/OO and correspondence rules retain their configured behavior.",
    ref: "src/pages/Contact.tsx",
  },
  {
    area: "Profile",
    rule: "Conditional follow-up fields",
    behavior:
      "Answers to controlling fields reveal follow-up fields inline within a left-bordered ConditionalGroup container. Changing the controlling answer back collapses the group. Examples: driver license Yes reveals license number/state; is-self-employed Yes reveals self-employment sub-questions; existing life insurance Yes reveals amount and replacement fields. Some follow-ups are themselves controls for deeper nested groups.",
    ref: "src/pages/Profile.tsx; src/components/forms/ConditionalGroup.tsx",
    type: "conditional",
    conditionIds: [
      "condition-member-has-drivers-license",
      "condition-spouse-has-drivers-license",
    ],
  },
  {
    area: "Profile",
    rule: "Repeatable insurance company records",
    behavior:
      "When the user indicates existing disability coverage, insurance company records are added through the DynamicList pattern: existing records show as bordered cards; Add opens an AppModal with company name, monthly benefit amount, benefit period, and waiting period fields; Edit pre-populates the modal; Remove requires a confirmation modal.",
    ref: "src/pages/Profile.tsx; src/components/forms/DynamicList.tsx",
  },
  {
    area: "Profile",
    rule: "Outside-U.S. follow-up",
    behavior:
      "Member and spouse outside-U.S. residence/travel questions reveal country/month follow-ups only for affirmative responses.",
    ref: "src/pages/Profile.tsx",
    type: "conditional",
    conditionIds: [
      "condition-member-lives-outside-us",
      "condition-member-travels-outside-us",
      "condition-spouse-lives-outside-us",
      "condition-spouse-travels-outside-us",
    ],
  },
  {
    area: "Profile",
    rule: "Financial questionnaire visibility",
    behavior:
      "Financial questionnaire visibility follows the active site’s MCR product-question-set assignments (Main column Y), for a selected member product with a positive amount. Sites without an assigned financial questionnaire omit this section. The former DI amount greater than $2,000 trigger was prototype demo behavior, not a general rule. Self-employment details appear when is-self-employed = Yes.",
    ref: "src/pages/Profile.tsx; src/config/pageSections/pageSections.ts",
  },
  {
    area: "Health",
    rule: "Applicant health sections",
    behavior:
      "Member/spouse health sections follow applicant-applying visibility; the member section label is hidden for member-only flow.",
    ref: "src/pages/Health*.tsx; src/utils/applicantVisibility.ts",
  },
  {
    area: "Health",
    rule: "Yes/No with inline DynamicList",
    behavior:
      "Each health question is a required Yes/No radio. Selecting Yes reveals a DynamicList inline below that question where the user can add one or more detail records (onset date, condition/medication details, physician/hospital address) via the standard Add/Edit/Remove modal pattern. Selecting No collapses and clears the list for that question.",
    ref: "src/pages/HealthLi.tsx; src/pages/HealthDi.tsx; src/pages/HealthSi.tsx; src/components/forms/DynamicList.tsx",
  },
  {
    area: "Payment",
    rule: "Optional payment opt-in",
    behavior:
      "When Payment mode is optional, the page first asks whether the user wants to add payment information; No permits continuation without payment questions.",
    ref: "src/pages/Payment.tsx",
  },
  {
    area: "Payment",
    rule: "Payment per applicable product",
    behavior:
      "When payment questions are active, each applicable product requires a payment method and payment frequency before continuing.",
    ref: "src/pages/Payment.tsx",
  },
  {
    area: "Payment",
    rule: "Bank account detail display",
    behavior:
      "Bank-account details (name on account, institution, routing number, account number, authorization checkbox) are displayed when Bank account is selected as the payment method for any product.",
    ref: "src/pages/Payment.tsx",
  },
  {
    area: "Review",
    rule: "Edit confirmation (consumer flow)",
    behavior:
      "Clicking an edit icon opens a ConfirmationDialog. Confirming navigates back to the page that owns that information. In advisor-applicant flow the same action instead opens a SendApplicationDialog ('Request edit to application') showing the advisor email; sending navigates to Application Edit Confirmation.",
    ref: "src/pages/Review.tsx; src/components/layout/ConfirmationDialog.tsx; src/components/layout/SendApplicationDialog.tsx",
  },
  {
    area: "Drawers",
    rule: "Help and reference drawers",
    behavior:
      "AppDrawer slides in from the right on desktop (420–480px wide) or up from the bottom on mobile (75vh). Used for contextual help topics (HelpChips → AppDrawer), the QuickDecision℠ explainer, the Coverage Portfolio (TPA-verified users on Coverage), and the application menu sub-drawers (coverage options, needs calculator, QD explainer). Drawers are read-only and do not block page submission.",
    ref: "src/components/layout/AppDrawer.tsx; src/components/coverage/CoveragePortfolioDrawer.tsx; src/components/layout/AppMenu.tsx",
  },
  {
    area: "Drawers",
    rule: "Swipeable drawer variant",
    behavior:
      "The swipeable prop enables SwipeableDrawer on mobile for user-initiated drawers (e.g. the Coverage cart drawer). Non-swipeable drawers use a standard Drawer.",
    ref: "src/components/layout/AppDrawer.tsx",
  },
  {
    area: "DynamicList",
    rule: "Add/Edit/Remove modal pattern",
    behavior:
      "DynamicList is the shared component for any repeatable record set (children, insurance companies, health detail records). Existing records render as bordered DynamicListItem cards with Edit and Remove buttons. Add opens an AppModal titled 'Add [Label]' with a blank form. Edit opens the same modal pre-filled with the selected record. Save appends or updates the record. Remove shows a confirmation AppModal ('Remove [Label]?') and deletes on confirm. Fields inside the modal are defined per record type via a mapping prop and rendered by FieldRenderer. The Add button is hidden once maxItems is reached (default 10).",
    ref: "src/components/forms/DynamicList.tsx; src/components/forms/DynamicListItem.tsx",
  },
  {
    area: "Advisor flow",
    rule: "Send-to-applicant dialog",
    behavior:
      "New Application mode displays advisor credential fields on Advisor Login. When the advisor later clicks Next on Profile, the onBeforeNext hook opens a SendApplicationDialog titled 'Send to applicant for review' showing the applicant name and email. Clicking Send navigates to Advisor Send Confirmation; Cancel stays on Profile.",
    ref: "src/pages/AdvisorLogin.tsx; src/pages/Profile.tsx; src/components/layout/SendApplicationDialog.tsx",
    type: "conditional",
    conditionIds: ["condition-advisor-new-application"],
  },
  {
    area: "Advisor flow",
    rule: "Advisor-mode Review edit dialog",
    behavior:
      "Saved Application mode displays applicant email on Advisor Login. In advisor-applicant flow, clicking an edit icon on Review opens a SendApplicationDialog titled 'Request edit to application' showing the advisor email only. Clicking Send navigates to Application Edit Confirmation; Cancel stays on Review.",
    ref: "src/pages/AdvisorLogin.tsx; src/pages/Review.tsx; src/components/layout/SendApplicationDialog.tsx",
    type: "conditional",
    conditionIds: ["condition-advisor-saved-application"],
  },
  {
    area: "Landing Page",
    rule: "Variant behavior",
    behavior:
      "default = inline Quote Tool and no hero image; hero-image = hero image, no inline Quote Tool; welcome-back = hero image, Continue/New Application actions, and hides How Applying Works and Coverage Options.",
    ref: "src/pages/Home.tsx",
  },
  {
    area: "Landing Page",
    rule: "Resume link",
    behavior:
      "Default and hero-image variants display the saved-application resume prompt/link; welcome-back uses Continue Application as the primary action instead.",
    ref: "src/pages/Home.tsx",
  },
  {
    area: "Header",
    rule: "Hide-on-scroll",
    behavior:
      "The app header hides when the user scrolls down (threshold: 8px) and reappears immediately on any upward scroll. Implemented via MUI useScrollTrigger + Slide direction='down'. The header uses position='sticky' so it participates in document layout rather than overlapping content.",
    ref: "src/components/layout/AppHeader.tsx",
  },
  {
    area: "Header",
    rule: "Header actions",
    behavior:
      "Application header supports Chat (when enabled and eligible), Coverage Cart and Menu. It does not contain a Quote action in the latest source.",
    ref: "src/components/layout/AppHeader.tsx",
  },
  {
    area: "Header",
    rule: "Chat/cart suppression after review submitted",
    behavior:
      "The Chat and Coverage Cart header actions are hidden once ApplicationSessionContext reports that review was submitted, in addition to being hidden on the Home and Receipt pages.",
    ref: "src/components/layout/AppHeader.tsx",
  },
  {
    area: "Header",
    rule: "Cookie consent banner",
    behavior:
      "CookieDialog is shown as a fixed bottom banner on first visit. AppShell checks localStorage.cookieConsent !== 'accepted' to decide whether to render it; dismissing sets localStorage.cookieConsent = 'accepted' so it never reappears.",
    ref: "src/components/layout/AppShell.tsx; src/components/layout/CookieDialog.tsx",
  },
  {
    area: "Application flow",
    rule: "Scroll reset on route change",
    behavior:
      "AppBody patches window.history.pushState/replaceState and listens for popstate to track the current pathname, then scrolls the window to top on every route change.",
    ref: "src/components/layout/AppBody.tsx",
  },
  {
    area: "Progress/navigation",
    rule: "Advisor-applicant steps locked",
    behavior:
      "When ApplicationSessionContext is in advisor-applicant mode (the applicant entered via resume?flow=advisor), the stepper/breadcrumb progress UI locks navigation to all steps except application-review and esign-submit, regardless of completed state.",
    ref: "src/components/navigation/ProgressStep.tsx",
  },
  {
    area: "Fields",
    rule: "Format-driven auto-formatting",
    behavior:
      "FieldRenderer live-formats input as the user types based on field.format: currency ('$1,234'), percent, phone (parenthesized area code), ssn (dashes, with all but the most-recently-typed digit masked for ~800ms), and month-year. The date input type is also formatted inline.",
    ref: "src/components/forms/FieldRenderer.tsx",
  },
  {
    area: "Fields",
    rule: "Auto label variant for long labels",
    behavior:
      "FieldRenderer auto-selects a 'standard' (external) label instead of the default 'floating' label when field.label is 40+ characters, to avoid clipping, unless field.labelVariant is explicitly set.",
    ref: "src/components/forms/FieldRenderer.tsx",
  },
  {
    area: "Fields",
    rule: "Phone type selector",
    behavior:
      "FieldRenderer composes PhoneField for the number and optional inline Mobile/Home/Business selector. Each contact owns a distinct sibling field (field.phoneTypeFieldId, default '<field.id>-type'), unless field.showPhoneTypeSelector is false.",
    ref: "src/components/forms/FieldRenderer.tsx",
  },
  {
    area: "Fields",
    rule: "Auto search-select for long option lists",
    behavior:
      "FieldRenderer renders a field configured as inputType: 'dropdown' using the searchable-select (MUI Autocomplete) component instead of a plain Select once field.options has 10 or more entries, so long lists (e.g. US states) are searchable rather than requiring a long scroll. Fields already explicitly set to 'searchable-select' are unaffected.",
    ref: "src/components/forms/FieldRenderer.tsx",
  },
  {
    area: "Drawers",
    rule: "Panel page/drawer variant with nested sub-drawers",
    behavior:
      "HowApplyingWorksPanel and CoverageOptionsPanel accept a variant: 'page' | 'drawer' prop rendering the same content as a full page section or a compact drawer layout. In 'drawer' variant, HowApplyingWorksPanel manages its own nested sub-drawer state (Application Review / QuickDecision℠) stacked above the parent drawer; in 'page' variant those links call parent-supplied handlers instead.",
    ref: "src/components/home/HowApplyingWorksPanel.tsx; src/components/coverage/CoverageOptionsPanel.tsx",
  },
  {
    area: "Coverage",
    rule: "Coverage Options featured-first sort and category fallback",
    behavior:
      "Default category order is LI, AD, DI, OO, SH. A client coverages.categoryOrder (or categories array) configuration overrides it. A client coverages.productOrder optionally overrides product order within categories; omitted products retain the default order. AMA uses its source 20/15/10-year, Pure Term, Preferred Term, Premier Accident order; URL parameter featured_prod moves the identified product’s category first and that product first within it. Default products are Term Life, ascending level-term durations; Long-Term, Long-Term Plus, Mid-Term, Short-Term Disability; Critical Illness, Hospital Indemnity. Remaining products retain catalog order. An unavailable active category falls back to the first available category in the resolved order.",
    ref: "src/domain/coveragePresentation.ts; src/config/client/getActiveClientCoverages.ts; src/components/coverage/CoverageOptionsPanel.tsx; src/app/workflows/QuoteCalculator.tsx",
  },
  {
    area: "Application menu",
    rule: "Menu tools",
    behavior:
      "Menu provides Continue Saved Application, How Applying Works, About Coverage, Needs Calculator, About QuickDecision and client Contact information. Each tool closes the main menu drawer and opens a standalone AppDrawer (How Applying Works and About Coverage render HowApplyingWorksPanel / CoverageOptionsPanel in 'drawer' variant).",
    ref: "src/components/layout/AppMenu.tsx; src/components/home/HowApplyingWorksPanel.tsx; src/components/coverage/CoverageOptionsPanel.tsx",
  },
  {
    area: "Eligibility",
    rule: "Spouse selection displays spouse information",
    behavior:
      "When Spouse is selected as a dependent, display the applicant-specific spouse sections and fields; post-Coverage applicant selection gates still apply separately.",
    ref: "src/config/pageSections/pageSections.ts; src/config/conditions/conditions.ts",
    type: "conditional",
    scope: "global",
    conditionIds: ["condition-spouse-selected"],
  },
  {
    area: "Membership",
    rule: "AMA spouse displays physician information",
    behavior:
      "When AMA membership is Spouse of Physician, display the physician information section.",
    ref: "src/config/conditions/conditions.ts; src/config/fields/fieldOverrides.ts; src/config/pageSections/pageSections.ts",
    type: "conditional",
    scope: "site",
    siteIds: ["ama"],
    conditionIds: ["condition-membership-ama-spouse"],
  },
  {
    area: "Membership",
    rule: "WAEPA new member displays member information",
    behavior:
      `When WAEPA membership is New Member, display the required declaration and qualification dropdown. Approved choices: ${waepaQualifications.map(option => option.label).join("; ")}. Former federal employee has no employer/date follow-ups. Adult Child/Step-Child Associate Member entry is allowed; the old MCR entry block is superseded by the October 20 decision. Product-specific eligibility remains separate.`,
    ref: "fields/waepa-attestation; conditions/condition-membership-waepa-new; src/domain/membershipQualifications.ts; src/pages/Membership.tsx; src/config/fields/fieldOverrides.ts",
    type: "conditional",
    scope: "site",
    siteIds: ["waepa"],
    conditionIds: ["condition-membership-waepa-new"],
  },
  {
    area: "Membership",
    rule: "WAEPA active duty prevents application",
    behavior:
      "New and current WAEPA members answer the global Armed Forces active-duty question in Additional Membership Information. On Next, Yes displays a page error and prevents continuation for every product. Selecting Yes alone does not display the error or disable Next; No clears this restriction. The installed Site membership disqualification configuration owns the blocking value and message.",
    ref: "src/domain/applicantExperience.ts; src/pages/Membership.tsx; src/data/waepa.ts",
    type: "conditional",
    scope: "site",
    siteIds: ["waepa", "waepa-gi"],
    conditionIds: ["condition-active-military"],
  },
  {
    area: "Membership",
    rule: "WAEPA active federal employee fields",
    behavior:
      "When the WAEPA qualification is active federal employee, display employer and start-date fields.",
    ref: "src/config/conditions/conditions.ts; src/config/fields/fieldOverrides.ts; src/config/pageSections/pageSections.ts",
    type: "conditional",
    scope: "site",
    siteIds: ["waepa"],
    conditionIds: ["condition-waepa-federal-active"],
  },
  {
    area: "Membership",
    rule: "WAEPA federal annuitant fields",
    behavior:
      "Retained historical qualification condition: captured revisions with federal-annuitant may display retired-employer and retirement-date fields. The October 20 approved six-choice dropdown omits this separate option; current applicants choose Former Federal Employee, with no such follow-ups.",
    ref: "src/config/conditions/conditions.ts; src/config/fields/fieldOverrides.ts; src/config/pageSections/pageSections.ts",
    type: "conditional",
    scope: "site",
    siteIds: ["waepa"],
    conditionIds: ["condition-waepa-federal-annuitant"],
  },
  {
    area: "Membership",
    rule: "WAEPA associate member information",
    behavior:
      "For spouse, Adult Child/Step-Child, parent/parent-in-law and sibling Associate Member qualifications, display the reusable associated-member information fields. First and last name are required; membership number is optional. The global qualification definition and condition are explicitly placed on Standard WAEPA; GI retains its accepted separate entry. This does not confer blanket product eligibility.",
    ref: "conditions/condition-waepa-associated-member; fields/waepa-member-first-name; fields/waepa-member-last-name; fields/waepa-member-id; src/domain/membershipQualifications.ts; src/pages/Membership.tsx; src/config/conditions/conditions.ts; src/config/fields/fieldOverrides.ts",
    type: "conditional",
    scope: "site",
    siteIds: ["waepa"],
    conditionIds: ["condition-waepa-associated-member"],
  },
];

function ruleId(area: string, rule: string): RuleDefinition["id"] {
  return `rule-${`${area}-${rule}`
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase()}`;
}

export const siteRules: RuleDefinition[] = siteRuleInventory.map((entry) => ({
  ...entry,
  id: entry.id ?? ruleId(entry.area, entry.rule),
  type: entry.type ?? "behavioral",
  scope: entry.scope ?? "global",
}));

export function getApplicableSiteRules({
  clientId,
  siteId,
}: {
  clientId: string;
  siteId: SiteId;
}): RuleDefinition[] {
  return siteRules.filter((rule) => {
    if ((rule.scope ?? "global") === "global") return true;
    if (rule.scope === "client") return rule.clientIds?.includes(clientId) ?? false;
    return rule.siteIds?.includes(siteId) ?? false;
  });
}
