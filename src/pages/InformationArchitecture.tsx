import { type ReactNode, isValidElement, useState, useMemo } from "react";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  InputAdornment,
  Link,
  Paper,
  Stack,
  Step,
  StepContent,
  StepLabel,
  Stepper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { fieldCatalog } from "../config/fields";
import { formFlow } from "../config/formFlow";
import { pages, getPageTitle } from "../config/pages";
import { pageSections } from "../config/pageSections";
import type { SectionVisibilityRule } from "../config/pageSections/types";
import type { PageId } from "../types";
import DocsSidebarNav from "../components/docs/DocsSidebarNav";
import { getContent, type SiteContent } from "../content";

const tableOfContents = [
  { id: "changelog-table", label: "Change Log" },
  { id: "pages-table", label: "Pages" },
  { id: "flows-table", label: "Flows" },
  { id: "components-table", label: "Components" },
  { id: "fields-table", label: "Fields" },
  { id: "error-messages-table", label: "Error Messages" },
  { id: "configurations-table", label: "Configurations" },
  { id: "content-table", label: "Content" },
  { id: "site-rules-table", label: "Site Rules" },
  { id: "template-changes-table", label: "Template Changes" },
  { id: "url-parameters-table", label: "URL Parameters" },
];

// ---------------------------------------------------------------------------
// Change log data
// ---------------------------------------------------------------------------

type ChangeLogEntry = {
  id: string;
  date: string;
  area: string;
  summary: string;
  details: string;
};

const changeLog: ChangeLogEntry[] = [
  {
    id: "CL-016",
    date: "2026-08-31",
    area: "Information Architecture",
    summary:
      "Added URL Parameters section documenting the current-to-new-template URL parameter migration spec",
    details:
      "New URL Parameters table added to this document (after Template Changes), transcribed from the " +
      "New Site Template URL Parameter Specification doc. Covers the full current-template parameter " +
      "inventory (form, apply, applicant, category, categories, prods, dprods, featured_prod, preselect, " +
      "qt, pmt, amt, mrate, association, campaign, ctg, nc, URLClickedFrom, app) with each parameter's " +
      "Migrated / Modified / Removed / TBD status, current vs. new value formats, current vs. new " +
      "behavior, and migration notes/rules. Also includes the additional parameters identified in the " +
      "new-template source that were not part of the current-template inventory (variant, flow, client, " +
      "inputChecks, dev, reset), each flagged New and annotated with production-requirement status and " +
      "source file references, plus the source review summary table classifying each as user-facing, " +
      "prototype/configuration, or development-only.",
  },
  {
    id: "CL-015",
    date: "2026-08-31",
    area: "Information Architecture",
    summary:
      "Added Error Messages section cataloging all page-level and field-level error copy, triggers, and validation logic",
    details:
      "New Error Messages table added to this document (between Fields and Configurations), grouped by area: " +
      "Fields (generic FieldRenderer validation — required, email/phone/SSN/ZIP/percent/month-year format checks, " +
      "numbers-only, phone-type selector), Application Flow (the shared 'Please correct the errors below before " +
      "continuing.' banner shown by FormRoutePage whenever Next/submit is clicked with field errors present), " +
      "Eligibility (DOB/ZIP/state required and date-completeness messages from EligibilityFields.validateEligibility, " +
      "the age-80-or-older ineligibility alert shared with Home's quick-quote tool, missing-child and missing-spouse " +
      "dependent messages, and the silent TPA-verification navigation block), Membership (member-ineligible warning " +
      "and WAEPA/AMA associate-membership info alerts), Home / Quick quote (QuoteCalculator's gender/tobacco/income/" +
      "hours/expenses/responsibility required messages), Coverage (select-a-category, select-a-coverage, " +
      "select-an-applicant, select-a-benefit-amount messages from useCoverageState.validate, the category-question " +
      "correct-errors message, the dependent-only confirmation dialog, the all-categories-ineligible alert, and the " +
      "$0-selection notice), Beneficiary (missing-beneficiary page error; the add/edit modal's max-10-per-designation, " +
      "invalid-share, and share-exceeds-remaining save-time errors; and the maxed-designation/trust-exclusivity " +
      "modal warnings), Payment (missing payment method/frequency message), and Resume flow (blank email/code " +
      "inline errors and the expired secure-link / expired verification-code alerts). Each row lists the level " +
      "(page-level alert vs. field-level), the triggering condition, the exact message copy, and an implementation " +
      "reference.",
  },
  {
    id: "CL-014",
    date: "2026-08-29",
    area: "Site Rules",
    summary:
      "Expanded Site Rules with UI interaction mechanics; added Drawers, DynamicList, and Advisor flow rule areas",
    details:
      "Folded interaction pattern detail into Site Rules rather than maintaining a separate section. " +
      "Existing rules expanded: Intermediate-step Next interception (named Coverage/Profile usages), " +
      "Progress-saved feedback (named AppSnackbar + positioning), Coverage category selection " +
      "(two-step questions → 'See my coverage options' → catalog), Per-applicant product selection " +
      "(checkboxes, amount dropdowns, riders, waiting/benefit period), Dependent-only confirmation " +
      "(clarified onBeforeNext hook), Beneficiary Add/edit/remove (modal mechanics, tabs, quick-fill " +
      "buttons, live allocation display, maxed state), Beneficiary Apply to other coverages (separate " +
      "record with new ID, Skip action), Profile conditional follow-up fields (named ConditionalGroup), " +
      "Health Yes/No (merged with DynamicList inline expand/collapse), Review edit confirmation (consumer " +
      "and advisor branches), Menu tools (named nested AppDrawers), Payment bank account (listed all fields). " +
      "New rule areas: Drawers (help/reference drawer mechanics, swipeable variant), DynamicList " +
      "(Add/Edit/Remove modal pattern), Advisor flow (send-to-applicant dialog, advisor-mode review edit). " +
      "New rules in existing areas: Profile repeatable insurance company records, Coverage per-applicant " +
      "product selection.",
  },
  {
    id: "CL-013",
    date: "2026-08-29",
    area: "Home / Components",
    summary:
      "Extracted HowApplyingWorksPanel and CoverageOptionsPanel from Home page into standalone reusable components",
    details:
      "The How Applying Works step list and Coverage Options tabbed browser were previously implemented " +
      "inline in Home.tsx. Both are now standalone components in src/components/ui/: HowApplyingWorksPanel " +
      "(supports 'page' and 'drawer' variants; drawer variant manages sub-drawers for Application Review " +
      "and QuickDecision℠) and CoverageOptionsPanel (tabbed category browser with product list, amount " +
      "range, eligible applicants, and QD indicator; 'page' and 'drawer' variants; featured products sort " +
      "first). Home.tsx imports these components in 'page' variant; AppMenu now renders both in 'drawer' " +
      "variant for its 'How Applying Works' and 'About Coverage' tools, replacing the former inline " +
      "CoverageOptionsDrawerContent for the coverage-options drawer. " +
      "Two new component entries added to the IA components table.",
  },
  {
    id: "CL-012",
    date: "2026-08-28",
    area: "Feedback / Snackbar",
    summary:
      "Added base AppSnackbar component; updated ProgressSavedSnackbar to use it; snackbar now appears at bottom on small screens",
    details:
      "Created src/components/feedback/AppSnackbar.tsx as a generic snackbar base component. Accepts severity (success, warning, error, info), message string, autoHideDuration, and open/onClose props. Uses MUI useMediaQuery to place the snackbar at the bottom-center on small screens (xs) and top-center on large screens (sm+), replacing the previous hard-coded top position. ProgressSavedSnackbar (src/components/feedback/ProgressSavedSnackbar.tsx) was refactored to delegate entirely to AppSnackbar with severity='success' and message='Progress saved'. The Coverage page 'Added' snackbar also uses AppSnackbar.",
  },
  {
    id: "CL-011",
    date: "2026-08-28",
    area: "Coverage",
    summary:
      "Coverage added drawer shown only for first product; subsequent adds show 'Added' snackbar",
    details:
      "Changed the Coverage page product-add feedback behavior. The 'Coverage added' AppDrawer (CoverageCart variant='drawer' source='coverage-page') is now opened only when the very first product/applicant is toggled on from a state of zero selected coverages. All subsequent product or applicant additions — including adding a second applicant to an existing product or adding a second product — show a compact 'Added' success snackbar (AppSnackbar) instead of re-opening the drawer. State tracked via a per-render ref (initialDrawerShownRef) in useCoverageState.ts. The new addedSnackbarOpen / setAddedSnackbarOpen state pair is exposed from useCoverageState and consumed in Coverage.tsx.",
  },
  {
    id: "CL-010",
    date: "2026-08-28",
    area: "Applicant section titles",
    summary:
      "Audited all ApplicantSectionDivider usages; confirmed consistent icon+label+background styling with no legacy variants",
    details:
      "Full audit of ApplicantSectionDivider (src/components/layout/ApplicantSectionDivider.tsx) usage across Coverage, Contact, Profile, Beneficiary, Review, HealthLi, HealthDi, and Eligibility pages. All usages correctly pass showLabel={shouldShowApplicantLabel(...)} for the member/self applicant so the section title is hidden when only one applicant is applying (member-only flow). The ApplicantSectionLabel sub-component already implements the standard icon + label + rounded background styling. No page retains old-style uppercase text, raw 'Member' string labels, applicantSectionBannerSx, or sectionTitleIconSx styling — those exports remain in formSectionTitle.ts marked @deprecated for reference only. The CoverageCart drawer already suppresses per-applicant labels inside product cards when only member is selected (isMemberOnly check).",
  },
  {
    id: "CL-009",
    date: "2026-08-28",
    area: "Eligibility / ZIP-to-state",
    summary:
      "ZIP auto-sets state but user can now manually override state without being reverted; new ZIP change re-derives state",
    details:
      "Updated EligibilityFields (src/components/forms/EligibilityFields.tsx) to decouple the ZIP→state derivation from the state field's manual override. Previously, a useEffect watched both zipCode and state, causing the state value to revert if the user manually changed it. Now a ref (lastDerivedZipRef) tracks the last ZIP that triggered a state derivation. The effect only fires and updates state when the ZIP value has actually changed relative to that ref. When the user manually changes state, the ref is updated to the current ZIP so the effect does not override the user's selection. If the user subsequently changes ZIP again, state is re-derived from the new ZIP. ZIP field value is never affected by state changes.",
  },
  {
    id: "CL-008",
    date: "2026-08-28",
    area: "Content system",
    summary:
      "Centralized remaining hardcoded UI display text into the content system",
    details:
      "Extended src/content/types.ts and src/content/defaults/ to cover display text that previously lived inline in .tsx files. Added three new top-level SiteContent keys: dialogs (ConfirmationDialog variants for Review's edit-application confirm and Coverage's dependent-coverage confirm; SendApplicationDialog variants for Profile's send-to-applicant and Review's request-edit; Beneficiary's add/edit/apply-to-others modal copy; AppHeader's coverage-details dialog labels), statusMessages (DocuSign, Health QD, and Health CIR waiting/placeholder page copy), and beneficiary (Beneficiary page inline alert/validation copy). Extended existing content types: home (instant-quote section, review-process link label, QuickDecision availability suffix, no-categories message, 'Available for:' label), coverage (category-selection and form-correction error messages), receipt (documents note, summary bar labels, Coverage decisions heading/description, What happens next items, support/contact card copy), and help (drawer titles for Application review and Coverage portfolio, nested sub-drawer titles used inside the How Applying Works drawer, and a new QuickDecision drawer content section). All affected pages/components (Home, Coverage, Beneficiary, Receipt, Review, Profile, AppHeader, DocuSign, HealthQd, HealthCir, QuickDecisionExplainer, CoveragePortfolioDrawer, helpContent.tsx) now read these strings from getContent() instead of hardcoding them. Button labels, form field labels, aria-labels, and the DesignSystem/InformationArchitecture/MockEmailPreview dev pages were intentionally left out of scope. Added the Content section (this table) documenting the top-level content model.",
  },
  {
    id: "CL-007",
    date: "2026-08-27",
    area: "Email templates",
    summary:
      "Reorganized Email Templates page into Consumer/Advisor sections and overhauled mock email content",
    details:
      "The Email Templates (mock email) page is now split into two always-visible sections — 'Consumer Flow Emails' and 'Advisor Flow Emails' — replacing the previous tab switcher. Shared decision-status logic (buildSelectedCoverageEntries, getOrderedDecisionEntries, getQdDecisionResult, getDecisionStatus, formatCurrencyAmount, APPLICANT_LABELS) was extracted from Receipt.tsx into src/utils/coverageDecisions.ts so the receipt page and receipt email stay in sync. Email content changes: removed the 'New York Life Insurance Company is licensed/authorized...NAIC ID #66915' sentence from the shared NYL footer on all emails; all 'Dear' salutations now use a single consistent test applicant name (Caroline Correa, first + last) instead of a mix of full names and first-name-only; 'Continue my application' buttons in the autosave and pending-reminder emails are now preceded by an identity-verification notice ('To access your application information, you will be asked to verify your identity using the email and phone number provided in your application.'); the 'Your application will be saved for 10 days.' warning box was removed from the purge-reminder ('Your insurance application progress') email; the magic-link button was renamed from 'Confirm my email' to 'Verify my email'. Resume links: any email/button linking to the resume flow (autosave, pending-reminder 'Continue my application', and the new advisor portal line) now actually navigates to the internal /resume?client={activeClientId} route, while the URL shown in the email body is a fake production-style '{clientAcronym}.nylinsure.com/resume' string for demo purposes only. The receipt email ('Thank you! We've received your insurance request') body text was rewritten to 'Your insurance application through {Association Name} has been received and we've begun processing your application.' and now renders simplified, inline-styled HTML decision boxes mirroring the Receipt page's 'Coverage decisions' section (coverage name, status badge, applicant/amount subtitle, decision description) for each selected coverage. All advisor emails now include an 'Association: {active association name}' row at the top of the details table and a line below the table linking to the '{clientAcronym} Advisor Portal' (same fake-URL/real-link resume pattern).",
  },
  {
    id: "CL-006",
    date: "2026-08-24",
    area: "Eligibility",
    summary:
      "Added child-section eligibility notice for unmarried-children coverage rule",
    details:
      "On the Eligibility page, the Child dependent section now displays an info alert directly under the section header: 'Only unmarried children are eligible for coverage.' The notice appears at the top of the child section before child entries are added via DynamicList.",
  },
  {
    id: "CL-005",
    date: "2026-08-24",
    area: "Navigation / Coverage",
    summary:
      "Added global intermediate-step Next interception and dependent-only Coverage confirmation",
    details:
      "FormRoutePage now supports a shared onBeforeNext interception hook that can pause forward navigation, present an intermediate step, and then resume the standard transition through a continueNavigation callback. This centralizes pre-next confirmation behavior while preserving transition messages, progress snapshot behavior, and destination routing. Profile advisor send behavior was migrated to this shared pattern. Coverage now uses the same mechanism to intercept Next when selected coverage is for spouse and/or child only (no member selection) and shows a confirmation dialog: 'To apply for dependent coverage, you must have this group insurance coverage.' with Continue and Cancel actions. Continue resumes standard navigation; Cancel keeps the user on Coverage.",
  },
  {
    id: "CL-004",
    date: "2026-08-17",
    area: "Advisor flow",
    summary:
      "Advisor send/edit dialogs finalized on a single Review page path; Application Edit Confirmation updated",
    details:
      "Finalized advisor-assisted behavior: (1) On Profile, when advisor-flow-type is present, Next opens SendApplicationDialog titled 'Send to applicant for review' with intro text 'This application will be sent to the following applicant for review, completion of any remaining steps, and e-signature.' The dialog shows applicant name + email. Send navigates to Advisor Send Confirmation; Cancel stays on Profile. (2) Applicant resume via resume?flow=advisor now lands on the standard Review page in advisor mode (single review page approach). The advisor-mode Review branch shows advisor-specific alerts, keeps legal/consent sections on the same page, and opens a SendApplicationDialog titled 'Request edit to application' when edit icons are clicked. This dialog shows advisor email only (no name) and intro text 'An alert will be sent requesting updates to your application. Your advisor will contact you with additional details and guidance.' Send routes to Application Edit Confirmation; Cancel stays on Review. (3) Earlier advisor-completed steps (Getting Started, Coverage, Profile) remain locked via advisorApplicantFlow session state and stepper/breadcrumb guards. (4) Application Edit Confirmation detail rows were reduced to show only 'Sent to advisor' and 'Request sent' (removed Applicant name and Application expires).",
  },
  {
    id: "CL-003",
    date: "2026-08-17",
    area: "Eligibility / Coverage",
    summary:
      "Added TPA member verification modal and Coverage Portfolio drawer",
    details:
      "When submitted eligibility data matches a TPA member record (dummy trigger: ABE client, first name Caroline, last name Correa, DOB 08/26/1990, state NY), Eligibility intercepts the form submission and opens a MemberVerification modal before navigating to Coverage. The modal has three dot-stepper steps: (1) method selection — send text code, send voice code, answer security questions, or proceed without verification; (2) security questions — three LexisNexis-style questions each with a \'None of the answers apply to me\' option; (3) result screen (success or failure). Selecting \'None of the answers apply to me\' for any question shows the failed verification screen; all other paths show the success screen. On modal close, tpa-verified is stored in ApplicationFormContext and navigation proceeds to Coverage. On Coverage, when tpa-verified is true, a \'View coverage portfolio\' button opens a CoveragePortfolioDrawer listing the member\'s (and, when applicable, spouse\'s) existing in-force coverage: coverage name, amount, and riders. New components: MemberVerification (src/components/layout/MemberVerification.tsx), CoveragePortfolioDrawer (src/components/layout/CoveragePortfolioDrawer.tsx). Modified pages: Eligibility, Coverage. TPA Verification flow added to the Flows section of this document.",
  },
  {
    id: "CL-002",
    date: "2026-08-14",
    area: "Profile page",
    summary:
      "Renamed Financial information chip to \'Other coverage\'; added conditional Financial questionnaire section",
    details:
      "Renamed the Financial information section chip label to \'Other coverage\' (sectionLabels.financialInfo in pageSections.ts). Added a new profileFinancialQuestionnaireSelf page section (\'Financial questionnaire\') below the Other coverage section. The section is only shown when the member has a DI coverage amount greater than $2,000. It contains: total-net-worth, total-annual-unearned-income, is-self-employed, and — when is-self-employed = yes — a ConditionalGroup with is-sole-proprietor, is-professional-corporation, sole-proprietor-gross-income, sole-proprietor-gross-earnings, sole-proprietor-business-expenses, professional-corporation-annual-salary, professional-corporation-s-corp-distribution, professional-corporation-dividends, professional-corporation-bonus, bonus-payment-frequency, professional-corporation-commission, commission-payment-frequency, professional-corporation-benefits-cost, years-self-employed, work-from-home, has-work-location-outside-home, and work-location-details. All field IDs were already present in the field catalog and pageFields. The IA fields table reflects the new section automatically.",
  },
  {
    id: "CL-001",
    date: "2026-08-14",
    area: "Resume flow",
    summary:
      "Added Resume Method page; renamed security code to verification code",
    details:
      "Inserted a new Resume Method step between Resume (email entry) and Resume Code. The page presents a radio button choice — Text or Call — for how the user wants to receive their verification code. The chosen method is passed via location state to Resume Code, which now reads delivery mode from state instead of managing a toggle inline. Removed the 'Get security code with voice call instead' toggle link from Resume Code. Renamed all instances of 'security code' to 'verification code' on the Resume Code page (title, subhead, field label, error copy). Updated the resume flow diagram in this document. Updated the mock email magic link URL to point to /resume-method. Added resume-delivery-method to the field catalog and page fields catalog. Added resume-method to pages, router, and default content.",
  },
];

// ---------------------------------------------------------------------------
// Site rules data
// ---------------------------------------------------------------------------

const siteRules: {
  area: string;
  rule: string;
  behavior: string;
  ref: string;
}[] = [
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
    ref: "src/config/formFlow.ts; getClientPageRequirement",
  },
  {
    area: "Application flow",
    rule: "Beneficiary routing",
    behavior:
      "Beneficiary is shown only when selected coverage includes Life (LI) or Accidental Death (AD), unless the page is configured as none.",
    ref: "src/config/formFlow.ts",
  },
  {
    area: "Application flow",
    rule: "Health SI routing",
    behavior: "Shown when LI (SI) or DI (SI) underwriting is selected.",
    ref: "src/config/formFlow.ts",
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
      "Shown when LI (UW), DI (UW), or OO (UW) underwriting is selected.",
    ref: "src/config/formFlow.ts",
  },
  {
    area: "Application flow",
    rule: "Health CI routing",
    behavior:
      "Shown when a Critical Illness product is selected. (Page not yet implemented in prototype.)",
    ref: "src/config/formFlow.ts",
  },
  {
    area: "Application flow",
    rule: "Health UW CIR routing",
    behavior:
      "Shown when LI (UW) is selected with a CIR rider, or when a CIR rider is selected standalone.",
    ref: "src/config/formFlow.ts",
  },
  {
    area: "Application flow",
    rule: "Health QD routing",
    behavior:
      "Shown when LI (QD) and/or DI (QD) is selected. Renders as QD LI, QD DI, or a combined QD LI+DI page depending on which products are selected.",
    ref: "src/config/formFlow.ts",
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
      "The PageHeader/PageTitle back arrow is rendered only when getPreviousFormPageId resolves a previous page for the current values and the page is not after a submitted review; otherwise no back control is shown at all (distinct from it being disabled post-review).",
    ref: "src/app/RoutePage.tsx; src/components/layout/PageHeader.tsx; src/components/layout/PageTitle.tsx",
  },
  {
    area: "Validation",
    rule: "Page advance",
    behavior:
      "The user cannot advance when field validation or page-level validation fails; the page shows an error and moves focus/scroll toward the first error.",
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
      "When Child is selected as a dependent, children are added through the DynamicList pattern: existing records show as bordered cards with Edit and Remove buttons; Add Child opens an AppModal with fields for first name, last name, date of birth, and gender; Remove prompts a confirmation modal. At least one child record must exist before the user can continue.",
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
    ref: "src/pages/Coverage.tsx; src/app/useCoverageState.ts; src/components/forms/CoverageCategorySelector.tsx",
  },
  {
    area: "Coverage",
    rule: "Per-applicant product selection",
    behavior:
      "Each product card lists eligible applicants (member, spouse, child) as checkboxes. Checking an applicant reveals a benefit amount dropdown. DI/OO products also show waiting period and max benefit period dropdowns. Optional riders appear as checkboxes; selecting a rider with an amount range reveals a rider amount dropdown. Coverage selections and amounts are stored per product/applicant key.",
    ref: "src/components/forms/ProductCatalog.tsx; src/app/useCoverageState.ts",
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
    ref: "src/components/forms/ProductCatalog.tsx",
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
      "The Contact page conditionally hides/reuses business-address inputs when the business address is marked the same as the home address; DI/OO-related contact fields drive additional display rules.",
    ref: "src/pages/Contact.tsx",
  },
  {
    area: "Profile",
    rule: "Conditional follow-up fields",
    behavior:
      "Answers to controlling fields reveal follow-up fields inline within a left-bordered ConditionalGroup container. Changing the controlling answer back collapses the group. Examples: driver license Yes reveals license number/state; is-self-employed Yes reveals self-employment sub-questions; existing life insurance Yes reveals amount and replacement fields. Some follow-ups are themselves controls for deeper nested groups.",
    ref: "src/pages/Profile.tsx; src/components/forms/ConditionalGroup.tsx",
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
      "Spouse outside-U.S. residence/travel questions reveal country/month follow-ups only for affirmative responses.",
    ref: "src/pages/Profile.tsx",
  },
  {
    area: "Profile",
    rule: "Financial questionnaire visibility",
    behavior:
      "The Financial questionnaire section (total net worth, unearned income, self-employment details) is shown only when the member has a DI coverage amount greater than $2,000. The self-employment detail fields are revealed only when is-self-employed = Yes.",
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
    ref: "src/components/layout/AppDrawer.tsx; src/components/ui/CoveragePortfolioDrawer.tsx; src/components/layout/AppMenu.tsx",
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
      "When the advisor clicks Next on Profile, the onBeforeNext hook opens a SendApplicationDialog titled 'Send to applicant for review' showing the applicant name and email. Clicking Send navigates to Advisor Send Confirmation; Cancel stays on Profile.",
    ref: "src/pages/Profile.tsx; src/components/layout/SendApplicationDialog.tsx",
  },
  {
    area: "Advisor flow",
    rule: "Advisor-mode Review edit dialog",
    behavior:
      "In advisor-applicant flow, clicking an edit icon on Review opens a SendApplicationDialog titled 'Request edit to application' showing the advisor email only. Clicking Send navigates to Application Edit Confirmation; Cancel stays on Review.",
    ref: "src/pages/Review.tsx; src/components/layout/SendApplicationDialog.tsx",
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
      "The Chat and Coverage Cart header actions are hidden once sessionStorage.reviewSubmitted is 'true', in addition to being hidden on the Home and Receipt pages.",
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
      "When sessionStorage.advisorApplicantFlow is 'true' (applicant entered via resume?flow=advisor), the stepper/breadcrumb progress UI locks navigation to all steps except application-review and esign-submit, regardless of completed state.",
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
      "Phone-format fields render an inline Mobile/Home/Business type selector tied to a sibling field (field.phoneTypeFieldId, default '<field.id>-type'), unless field.showPhoneTypeSelector is false.",
    ref: "src/components/forms/FieldRenderer.tsx",
  },
  {
    area: "Drawers",
    rule: "Panel page/drawer variant with nested sub-drawers",
    behavior:
      "HowApplyingWorksPanel and CoverageOptionsPanel accept a variant: 'page' | 'drawer' prop rendering the same content as a full page section or a compact drawer layout. In 'drawer' variant, HowApplyingWorksPanel manages its own nested sub-drawer state (Application Review / QuickDecision℠) stacked above the parent drawer; in 'page' variant those links call parent-supplied handlers instead.",
    ref: "src/components/ui/HowApplyingWorksPanel.tsx; src/components/ui/CoverageOptionsPanel.tsx",
  },
  {
    area: "Coverage",
    rule: "Coverage Options featured-first sort and category fallback",
    behavior:
      "Within each category tab, CoverageOptionsPanel sorts products featured-first, then alphabetically by name. If the active category has no products for the current client (e.g. after a client config change), the panel falls back to the 'LI' category if present, otherwise the first available category.",
    ref: "src/components/ui/CoverageOptionsPanel.tsx",
  },
  {
    area: "Application menu",
    rule: "Menu tools",
    behavior:
      "Menu provides Continue Saved Application, How Applying Works, About Coverage, Needs Calculator, About QuickDecision and client Contact information. Each tool closes the main menu drawer and opens a standalone AppDrawer (How Applying Works and About Coverage render HowApplyingWorksPanel / CoverageOptionsPanel in 'drawer' variant).",
    ref: "src/components/layout/AppMenu.tsx; src/components/ui/HowApplyingWorksPanel.tsx; src/components/ui/CoverageOptionsPanel.tsx",
  },
];

// ---------------------------------------------------------------------------
// Error messages data
// ---------------------------------------------------------------------------

// Grouping key for each error message, ordered to match how pages are
// actually encountered while moving through the app: pre-application
// (global rules, Home, Resume) followed by the application form flow order.
type ErrorMessagePageKey =
  | "global"
  | "home"
  | "resume"
  | "membership"
  | "eligibility"
  | "coverage"
  | "beneficiary"
  | "payment";

const errorMessagePageOrder: { key: ErrorMessagePageKey; label: string }[] = [
  { key: "global", label: "Global (all pages)" },
  { key: "home", label: "Home / Quick Quote" },
  { key: "resume", label: "Resume Flow" },
  { key: "membership", label: "Membership" },
  { key: "eligibility", label: "Eligibility" },
  { key: "coverage", label: "Coverage" },
  { key: "beneficiary", label: "Beneficiary" },
  { key: "payment", label: "Payment" },
];

type ErrorMessageEntry = {
  page: ErrorMessagePageKey;
  level: "Page" | "Field";
  trigger: string;
  message: string;
};

const errorMessages: ErrorMessageEntry[] = [
  {
    page: "global",
    level: "Field",
    trigger:
      "A required text/select/dropdown/radio/date field is left blank on submit.",
    message: "{Field label} is required.",
  },
  {
    page: "global",
    level: "Field",
    trigger: "A required checkbox is left unchecked on submit.",
    message: "{Field label} is required.",
  },
  {
    page: "global",
    level: "Field",
    trigger:
      "A required checkbox-group or multi-select field has no options selected on submit.",
    message: "Select at least one option.",
  },
  {
    page: "global",
    level: "Field",
    trigger:
      "A ZIP/postal-code field (id includes 'zip' or autoComplete='postal-code') has fewer than 5 characters entered.",
    message: "Enter a valid ZIP / Postal Code.",
  },
  {
    page: "global",
    level: "Field",
    trigger: "A field with format='email' fails the email pattern check.",
    message: "Enter a valid email address.",
  },
  {
    page: "global",
    level: "Field",
    trigger:
      "A field with format='phone' does not resolve to exactly 10 digits.",
    message: "Enter a valid 10-digit phone number.",
  },
  {
    page: "global",
    level: "Field",
    trigger: "A field with format='ssn' does not resolve to exactly 9 digits.",
    message: "Enter a valid 9-digit SSN.",
  },
  {
    page: "global",
    level: "Field",
    trigger: "A field with format='percent' has more than 3 digits entered.",
    message: "Enter a percent value with up to 3 digits.",
  },
  {
    page: "global",
    level: "Field",
    trigger:
      "A field with format='month-year' does not resolve to exactly 6 digits (MM/YYYY).",
    message: "Enter a valid month and year (MM/YYYY).",
  },
  {
    page: "global",
    level: "Field",
    trigger:
      "A field with inputType='number' contains non-digit characters.",
    message: "Enter numbers only.",
  },
  {
    page: "global",
    level: "Field",
    trigger:
      "A phone-format field's paired Mobile/Home/Business type selector is left unselected on submit.",
    message: "Phone Type is required",
  },
  {
    page: "global",
    level: "Page",
    trigger:
      "Next/submit is clicked on any FormRoutePage-driven page while one or more field-level validation errors remain; focus/scroll moves to the first invalid field.",
    message: "Please correct the errors below before continuing.",
  },
  {
    page: "home",
    level: "Field",
    trigger:
      "Inline quote tool on Home: selected category requires gender and it is left blank.",
    message: "Gender is required.",
  },
  {
    page: "home",
    level: "Field",
    trigger:
      "Inline quote tool on Home: selected category requires a tobacco-use answer and it is left blank.",
    message: "Do you use nicotine products? is required.",
  },
  {
    page: "home",
    level: "Field",
    trigger:
      "Inline quote tool on Home: DI/OO category requires average monthly income and it is left blank.",
    message: "Average monthly income is required.",
  },
  {
    page: "home",
    level: "Field",
    trigger:
      "Inline quote tool on Home: selected category requires hours worked per week and it is left blank.",
    message: "Hours worked per week is required.",
  },
  {
    page: "home",
    level: "Field",
    trigger:
      "Inline quote tool on Home: OO category requires monthly business expenses and it is left blank.",
    message: "Monthly business expenses is required.",
  },
  {
    page: "home",
    level: "Field",
    trigger:
      "Inline quote tool on Home: OO category requires a business-expense responsibility percentage and it is left blank.",
    message: "Responsibility percentage is required.",
  },
  {
    page: "home",
    level: "Field",
    trigger: "Inline quote tool on Home: date of birth is left blank.",
    message: "Date of birth is required.",
  },
  {
    page: "home",
    level: "Field",
    trigger:
      "Inline quote tool on Home: date of birth is entered but is not a complete MM/DD/YYYY date.",
    message: "Enter a complete date (MM/DD/YYYY).",
  },
  {
    page: "home",
    level: "Field",
    trigger: "Inline quote tool on Home: ZIP/postal code is left blank.",
    message: "ZIP / postal code is required.",
  },
  {
    page: "home",
    level: "Field",
    trigger: "Inline quote tool on Home: state is left blank.",
    message: "State is required.",
  },
  {
    page: "home",
    level: "Page",
    trigger:
      "Inline quote tool on Home: the age calculated from date of birth is 80 or older.",
    message:
      "We're sorry, but coverage is not available for applicants age 80 or older.",
  },
  {
    page: "resume",
    level: "Field",
    trigger: "The Resume (email entry) form is submitted with a blank email field.",
    message: "Enter your email address.",
  },
  {
    page: "resume",
    level: "Page",
    trigger:
      "The magic-link countdown reaches zero before the emailed secure link is used. Shown with a resend-link action.",
    message: "Your secure link has expired.",
  },
  {
    page: "resume",
    level: "Field",
    trigger: "The Resume Code form is submitted with a blank verification-code field.",
    message: "Enter your verification code.",
  },
  {
    page: "resume",
    level: "Page",
    trigger:
      "The verification-code countdown reaches zero before the code is entered. Shown with a resend-code action.",
    message: "Your verification code has expired.",
  },
  {
    page: "membership",
    level: "Page",
    trigger:
      "Client is not AMA or WAEPA and the member answers 'No' to the membership question; Next is also disabled for this state.",
    message:
      "We're sorry, but only members are eligible to apply for this coverage.",
  },
  {
    page: "membership",
    level: "Page",
    trigger:
      "WAEPA client, membership qualification answered as 'Spouse of an Associate Member'.",
    message:
      "To apply as an Associate Member, please include your spouse's current WAEPA membership information.",
  },
  {
    page: "membership",
    level: "Page",
    trigger:
      "WAEPA client, membership qualification answered as 'Child of an Associate Member'.",
    message:
      "To apply as an Associate Member, please include your parent's current WAEPA membership information.",
  },
  {
    page: "membership",
    level: "Page",
    trigger: "AMA client, membership answered as 'Spouse of a physician'.",
    message:
      "To apply as a spouse of a physician, please include the physician's information below.",
  },
  {
    page: "eligibility",
    level: "Page",
    trigger:
      "Next is clicked with Child selected as a dependent but zero child records have been added via the DynamicList modal.",
    message: "Please add at least one child or remove child from dependents.",
  },
  {
    page: "eligibility",
    level: "Page",
    trigger:
      "Next is clicked with Spouse selected as a dependent but no spouse first or last name has been entered.",
    message:
      "Please add spouse details or remove spouse from dependents.",
  },
  {
    page: "eligibility",
    level: "Page",
    trigger:
      "Submitted eligibility values match a configured TPA member record and identity verification has not yet completed. No visible message is shown — navigation is silently blocked (a zero-width space is returned as the validation error) while the MemberVerification modal opens; submission auto-resumes when the modal closes.",
    message: "​ (invisible — blocks navigation without displaying text)",
  },
  {
    page: "coverage",
    level: "Page",
    trigger:
      "'See my coverage options' or Next is clicked with zero coverage categories selected.",
    message: "Please select at least one coverage category.",
  },
  {
    page: "coverage",
    level: "Page",
    trigger:
      "'See my coverage options' is clicked while a category-level question (tobacco use, income, hours) fails validation.",
    message: "Please correct the errors below before continuing.",
  },
  {
    page: "coverage",
    level: "Page",
    trigger:
      "Next is clicked with one or more categories selected but no product/coverage chosen.",
    message: "Please select at least one coverage to continue.",
  },
  {
    page: "coverage",
    level: "Page",
    trigger:
      "Next is clicked and a selected product has no applicant (member/spouse/child) checked.",
    message: "Please select at least one applicant for each selected product.",
  },
  {
    page: "coverage",
    level: "Page",
    trigger:
      "Next is clicked and no benefit amount greater than $0 is set for any selected product/applicant.",
    message: "Select at least one benefit amount before continuing.",
  },
  {
    page: "coverage",
    level: "Page",
    trigger:
      "Next is clicked with selected coverage applying only to spouse and/or child, no member selection. A confirmation dialog is shown (not a blocking validation error); Continue proceeds, Cancel stays on Coverage.",
    message:
      "To apply for dependent coverage, the member must be insured with this group coverage.",
  },
  {
    page: "coverage",
    level: "Page",
    trigger:
      "Based on the answered category questions, the applicant is ineligible for every available coverage option in the catalog.",
    message:
      "You are not eligible for any coverage options — Based on your answers, you are not currently eligible for any available coverage. Please contact us for assistance.",
  },
  {
    page: "coverage",
    level: "Field",
    trigger:
      "A selected product's benefit amount dropdown is set to $0 for an applicant.",
    message:
      "You have selected $0 for this coverage. This means you are not applying for this product. Please ensure your selections look correct.",
  },
  {
    page: "beneficiary",
    level: "Page",
    trigger:
      "Next is clicked and an applicable member/spouse Life or AD product has zero beneficiary records.",
    message: "Please add beneficiary information before continuing.",
  },
  {
    page: "beneficiary",
    level: "Field",
    trigger:
      "Save is clicked in the Add/Edit Beneficiary modal when the target designation (Primary or Contingent) already has 10 records for that product.",
    message:
      "You have reached the maximum of 10 {designation} beneficiaries for this product.",
  },
  {
    page: "beneficiary",
    level: "Field",
    trigger:
      "Save is clicked for an Individual beneficiary with a blank, zero, or negative % share.",
    message: "Enter a valid share percentage greater than 0.",
  },
  {
    page: "beneficiary",
    level: "Field",
    trigger:
      "Save is clicked for an Individual beneficiary whose % share exceeds the unassigned percentage remaining for that designation.",
    message: "Share exceeds available unassigned percentage ({unassigned}%).",
  },
  {
    page: "beneficiary",
    level: "Field",
    trigger:
      "The Add/Edit modal is opened for a designation (Primary/Contingent) that has already reached 10 records.",
    message:
      "No more {designation} beneficiaries can be added online.",
  },
  {
    page: "beneficiary",
    level: "Field",
    trigger:
      "Individual type is selected in the modal but 0% unassigned share remains for that designation (and no Trust is already designated).",
    message: "No more individuals can be added — 0% unassigned share remaining.",
  },
  {
    page: "beneficiary",
    level: "Field",
    trigger:
      "Individual type is selected in the modal but a Trust already occupies that designation.",
    message:
      "A trust has already been designated as {designation} beneficiary. Individuals cannot be added for this designation.",
  },
  {
    page: "beneficiary",
    level: "Field",
    trigger: "Trust type is selected in the modal but a Trust already exists for that designation.",
    message: "Only one trust can be designated per {designation} beneficiary.",
  },
  {
    page: "beneficiary",
    level: "Field",
    trigger:
      "Trust type is selected in the modal but an Individual already occupies that designation.",
    message:
      "An individual has already been designated as {designation} beneficiary. A trust cannot be added for this designation.",
  },
  {
    page: "payment",
    level: "Page",
    trigger:
      "Next is clicked and an applicable product is missing a payment method or payment frequency.",
    message:
      "Please add payment information for all applicable products before continuing.",
  },
];

// ---------------------------------------------------------------------------
// Template changes data
// ---------------------------------------------------------------------------

const templateChanges: { area: string; current: string; next: string }[] = [
  {
    area: "Design system",
    current: "Bootstrap-based UI.",
    next: "Google Material Design-based UI.",
  },
  {
    area: "Add-item interactions",
    current:
      "Beneficiaries, children, companies, and similar repeatable entries are added inline on the page.",
    next: "Repeatable entries are added and edited within a modal/dialog.",
  },
  {
    area: "Beneficiary allocation guidance",
    current: "No real-time indication of remaining beneficiary allocation.",
    next: "Displays assigned and remaining beneficiary allocation in real time.",
  },
  {
    area: "Autosave initiation",
    current: "Autosave begins after the third application page.",
    next: "Autosave begins after the first application page.",
  },
  {
    area: "Resume process",
    current: "Three-step resume process.",
    next: "Three-step resume process: email link, delivery method selection (Text or Call), then phone verification code.",
  },
  {
    area: "Quote tool product support",
    current:
      "Quote functionality limited to approximately three Life products or one Disability product.",
    next: "Quote tool supports all applicable products.",
  },
  {
    area: "Standardized client flow",
    current:
      "Page flow can vary significantly by client; some clients have unique pages such as Membership.",
    next: "All client sites use a standardized page structure and flow, with client differences handled through configuration rather than unique client pages.",
  },
  {
    area: "Page length / field distribution",
    current:
      "Large pages such as Eligibility and Profile contain many fields and require significant scrolling.",
    next: "Large pages are broken into smaller, task-focused pages with fewer fields per page.",
  },
  {
    area: "Review and signature flow",
    current: "Preview and Read & Sign are separate pages.",
    next: "Review/Preview and Read & Sign functionality is consolidated where appropriate into a single stage/page experience.",
  },
  {
    area: "Decision and confirmation flow",
    current: "Decision and Receipt are separate pages.",
    next: "Decision and Receipt are consolidated into a single final confirmation/Receipt experience.",
  },
  {
    area: "Responsive design",
    current: "Desktop-oriented layouts adapted for smaller screens.",
    next: "Mobile-first responsive layouts and components.",
  },
  {
    area: "Contextual help",
    current: "Help content is limited or presented separately from the task.",
    next: "Pages provide contextual helper chips and progressive-disclosure help relevant to the current task.",
  },
  {
    area: "Loading feedback",
    current: "Primarily spinner-based loading states.",
    next: "Uses skeleton loaders, progress indicators, and other contextual loading feedback.",
  },
  {
    area: "Applicant-first flow",
    current:
      "Applicants may need to explicitly identify/select themselves as an applicant.",
    next: "Common member-only scenario is assumed first, with dependents added only when needed.",
  },
  {
    area: "Page content density",
    current:
      "Pages contain more instructional text and content competing with form tasks.",
    next: "Content is reduced and structured for faster scanning and lower cognitive load.",
  },
  {
    area: "Application navigation",
    current:
      "Navigation and progress patterns vary with the existing page structure.",
    next: "Standardized navigation and progress pattern across client implementations.",
  },
];

// ---------------------------------------------------------------------------
// URL parameters data
// ---------------------------------------------------------------------------

type UrlParamStatus = "Migrated" | "Modified" | "Removed" | "New" | "TBD";

const urlParamStatusColor: Record<
  UrlParamStatus,
  "success" | "info" | "default" | "primary" | "warning"
> = {
  Migrated: "success",
  Modified: "info",
  Removed: "default",
  New: "primary",
  TBD: "warning",
};

type UrlParameterEntry = {
  parameter: string;
  currentValues: string[];
  currentBehavior: string[];
  status: UrlParamStatus;
  newValues: string[];
  newBehavior: string[];
  notes: string;
};

// Current-template parameter inventory: migrated / modified / removed / TBD
// status in the new template. Transcribed from
// New_Template_URL_Parameters_Spec_Full.md ("Parameter Requirements").
const urlParameters: UrlParameterEntry[] = [
  {
    parameter: "form",
    currentValues: ["advisor", "pageName"],
    currentBehavior: [
      "Directs to advisor login page.",
      "Directs to specified page (e.g. launchScreen, membershipForm, eligibility, resumeEmailConfirmation, advisor)",
    ],
    status: "Migrated",
    newValues: ["advisor", "pageName"],
    newBehavior: [
      "advisor: Directs to advisor login page.",
      "pageName: Directs to the specified page.",
    ],
    notes:
      "Same parameter format as current template. Page names supported by pageName may differ from the current template and must use valid new-template page names.",
  },
  {
    parameter: "apply",
    currentValues: ["form"],
    currentBehavior: [
      "Directs to first page of application (skips landing page).",
    ],
    status: "Migrated",
    newValues: ["form"],
    newBehavior: [
      "Directs to the first page of the application and skips the Landing Page.",
    ],
    notes: "Same format and behavior as current template.",
  },
  {
    parameter: "applicant",
    currentValues: ["member", "member,spouse"],
    currentBehavior: [
      "Site only allows for member to apply. Hides question \"This insurance is for\" on eligibility page.",
    ],
    status: "Modified",
    newValues: ["member", "member,spouse"],
    newBehavior: [
      "member: Only the member can apply. The Eligibility Page question “Would you like to add dependent coverage?” is hidden. Content that communicates dependent availability is also hidden, including the “Available for: You, Your Spouse, Your Child(ren)” sentence in the About Coverage component.",
      "member,spouse: Only the member and/or spouse can apply. On the Eligibility Page, the “Child” option is hidden from the “Would you like to add dependent coverage?” question. Content that communicates child availability is also hidden, including the “Available for: You, Your Spouse, Your Child(ren)” sentence in the About Coverage component.",
    ],
    notes:
      "Same parameter values as current template; behavior is updated for the new-template dependent coverage UI/content.",
  },
  {
    parameter: "category",
    currentValues: ["li", "di", "oo", "sh", "ad (TBD)"],
    currentBehavior: [
      "Isolates life coverage category to be only option shown throughout site.",
      "Isolates disability coverage category to be only option shown throughout site.",
      "Isolates office overhead coverage category to be only option shown throughout site.",
      "Isolates supplemental health coverage category to be only option shown throughout site.",
      "Isolates AD&D coverage category to be only option shown throughout site (hides quote tool on landing page, smoker question on eligibility page, needs calculators on coverage page).",
    ],
    status: "Modified",
    newValues: [
      "li",
      "di",
      "oo",
      "sh",
      "ad",
      "Comma-separated values supported, e.g. li,di",
    ],
    newBehavior: [
      "Restricts the site to the listed coverage category or categories. Only the specified category/categories are displayed throughout the site and Quote Tool. Supports either a single category or multiple comma-separated categories. AD is supported as a separate coverage category.",
    ],
    notes: "Replaces the current categories parameter for multi-category use.",
  },
  {
    parameter: "categories",
    currentValues: ["li,di,oo,sh"],
    currentBehavior: [
      "Isolates 2 to 3 coverage categories to be only options shown throughout site. List categories in URL parameter with comma-separated list.",
    ],
    status: "Removed",
    newValues: ["—"],
    newBehavior: [
      "Not supported in the new template. Multi-category restriction is handled by the category parameter using comma-separated values.",
    ],
    notes: "Combined into category parameter.",
  },
  {
    parameter: "prods",
    currentValues: ["G-0000-0,G-1111-1"],
    currentBehavior: [
      "Isolates identified product(s) to be only options shown. List products (G-numbers) in parameter with comma-separated list. Note: Must be used with category or categories parameter.",
    ],
    status: "Migrated",
    newValues: ["G-0000-0", "Multiple products: comma-separated G-numbers"],
    newBehavior: [
      "Restricts product display to the listed product(s) throughout the site on pages/components that display products, including the Landing Page, Coverage Page, and application menu.",
    ],
    notes:
      "Must be used with the category parameter. The categories parameter is not supported in the new template.",
  },
  {
    parameter: "dprods",
    currentValues: ["G-0000-0,G-1111-1"],
    currentBehavior: [
      "Disables selected product(s) coverage amount dropdown; should be used in combination with prods and amt",
    ],
    status: "Migrated",
    newValues: ["G-0000-0", "Multiple products: comma-separated G-numbers"],
    newBehavior: [
      "Disables the coverage amount dropdown for the listed product(s) on the Coverage Page.",
    ],
    notes: "Should be used in combination with prods and amt.",
  },
  {
    parameter: "featured_prod",
    currentValues: ["G-0000-0"],
    currentBehavior: [
      "Product is displayed in featured product section on coverage page.",
      "The featured product section displays the coverage category section (which the featured product is in) at the top of the coverage page. The featured product is positioned first within the coverage category section.",
    ],
    status: "Modified",
    newValues: ["G-0000-0"],
    newBehavior: [
      "Displays a “Featured” chip on the listed product on the Coverage Page. The featured product’s coverage category section is displayed first among the category sections, and the listed product is prioritized within that section.",
    ],
    notes:
      "Same parameter format; featured presentation is updated for the new Coverage Page design.",
  },
  {
    parameter: "preselect (TBD)",
    currentValues: ["TRUE"],
    currentBehavior: [
      "All products / all applicants will have \"Coverage for my ___\" preselected on the coverage page. (HOLD - can discuss in future, but no known client request for this functionality. Use of Category and Prods could be useful solution.)",
    ],
    status: "TBD",
    newValues: ["TBD"],
    newBehavior: ["TBD"],
    notes: "Current template scope: all",
  },
  {
    parameter: "qt",
    currentValues: ["none"],
    currentBehavior: ["Hides quote section on landing page."],
    status: "Removed",
    newValues: ["—"],
    newBehavior: ["Not supported in the new template."],
    notes: "Landing/Home Page variants replace this behavior.",
  },
  {
    parameter: "pmt",
    currentValues: ["opt"],
    currentBehavior: [
      "Sets required payment section to optional on application details page.",
    ],
    status: "Removed",
    newValues: ["—"],
    newBehavior: ["Not supported in the new template."],
    notes:
      "Payment Page configuration controls whether payment is required/optional.",
  },
  {
    parameter: "amt",
    currentValues: ["G-1111-1_2000000,", "G-0000-0_2500000"],
    currentBehavior: [
      "Presets coverage page benefit amount dropdown to specified amount(s) for specified product(s). List product(s) (G-numbers) and amount(s) (no commas) in parameter with comma-separated list, as follows: G-number_amount",
    ],
    status: "Migrated",
    newValues: [
      "G-0000-0_2000000",
      "Multiple product/amount pairs: comma-separated",
    ],
    newBehavior: [
      "Sets the Coverage Page amount dropdown for the listed product(s) to the specified amount(s).",
    ],
    notes: "Same product_amount format as current template.",
  },
  {
    parameter: "mrate",
    currentValues: ["—"],
    currentBehavior: [
      "If present, shows monthly rates on Coverage page (AMA only uses this for now)",
    ],
    status: "TBD",
    newValues: ["TBD"],
    newBehavior: ["TBD"],
    notes: "New-template support and behavior are TBD.",
  },
  {
    parameter: "association (TBD)",
    currentValues: ["xyz"],
    currentBehavior: [
      "Expansion of existing functionality under discussion: Preselects association dropdown on eligibility page (for use with specific cases only). (Current functionality example is CAT to preset association and logo. New functionality to preset dropdown, like with TIE.)",
    ],
    status: "TBD",
    newValues: ["TBD"],
    newBehavior: ["TBD"],
    notes: "New-template support and behavior are TBD.",
  },
  {
    parameter: "campaign",
    currentValues: ["campaignName"],
    currentBehavior: [
      "Sends campaign code data to analytics & XML. Prints campaign code on PDF. Note: Maximum of 30 characters. Can include alphanumeric characters, dash and underscore.",
    ],
    status: "Migrated",
    newValues: ["abc"],
    newBehavior: [
      "Same behavior as current template: sends the campaign code to analytics and XML and prints the campaign code on the PDF.",
    ],
    notes: "Same format and behavior as current template.",
  },
  {
    parameter: "ctg",
    currentValues: ["di", "oo", "sh"],
    currentBehavior: [
      "Displays disability coverage category section first on the coverage page",
      "Displays office overhead coverage category section first on the coverage page",
      "Displays supplemental health coverage category section first on the coverage page",
    ],
    status: "Modified",
    newValues: [
      "firstCategory=ad",
      "firstCategory=di",
      "firstCategory=oo",
      "firstCategory=sh",
    ],
    newBehavior: [
      "The listed category is displayed first throughout the site wherever coverage categories are presented, including the Landing Page and Coverage Page.",
    ],
    notes: "Parameter name changes from ctg to firstCategory. AD is supported.",
  },
  {
    parameter: "nc",
    currentValues: ["none"],
    currentBehavior: [
      "Hides need calculators links on Coverage Page (when case has needs calculators enabled in core configuration)",
    ],
    status: "Removed",
    newValues: ["—"],
    newBehavior: ["Not supported in the new template."],
    notes: "—",
  },
  {
    parameter: "URLClickedFrom",
    currentValues: ["email"],
    currentBehavior: [
      "Used in Auto Save automatic emails to track/identify those returning to the site through these emails.",
    ],
    status: "Migrated",
    newValues: ["email"],
    newBehavior: [
      "Same behavior as current template: identifies/tracks users returning to the site through Auto Save automatic emails.",
    ],
    notes: "Same format and behavior as current template.",
  },
  {
    parameter: "app",
    currentValues: ["CIR", "ABI"],
    currentBehavior: ["Shows CIR/ABI only flow (WAEPA only uses this for now)"],
    status: "Migrated",
    newValues: ["CIR", "ABI"],
    newBehavior: ["TBD"],
    notes:
      "Parameter exists in the new template with the same format; new-template behavior is TBD.",
  },
];

type UrlParameterAdditionalEntry = {
  parameter: string;
  currentTemplate: string;
  status: string;
  newValues: string[];
  newBehavior: string[];
  notes: string;
  sourceRefs: string[];
};

// Parameters identified in the new-template source that were not present in
// the current-template inventory above. Documents existing prototype/source
// behavior; inclusion does not by itself designate prototype/development-only
// parameters as production requirements.
const urlParametersAdditional: UrlParameterAdditionalEntry[] = [
  {
    parameter: "variant",
    currentTemplate: "Not listed in current parameter inventory.",
    status: "New",
    newValues: ["default", "hero-image", "welcome-back"],
    newBehavior: [
      "Selects the Landing Page variant for the current session.",
      "default: Displays the standard Landing Page experience, including the Quote Tool.",
      "hero-image: Displays the hero-image Landing Page variant.",
      "welcome-back: Displays the welcome-back Landing Page variant.",
    ],
    notes:
      "If the URL value is absent or is not one of the supported values, the template falls back to the Landing Page variant defined in client configuration, or default when no client variant is configured. This parameter is the source-level mechanism currently supporting the Landing/Home Page variants that replace the legacy qt=none behavior.",
    sourceRefs: ["src/pages/Home.tsx"],
  },
  {
    parameter: "flow",
    currentTemplate: "Not listed in current parameter inventory.",
    status: "New",
    newValues: ["advisor"],
    newBehavior: [
      "Identifies the advisor-applicant resume/review flow. When flow=advisor is present on the Resume flow, the applicant email-entry step is bypassed and the flow proceeds in advisor-applicant mode. The Review Page also uses this state to apply advisor-flow edit behavior.",
    ],
    notes:
      "Current source usage is specific to advisor-flow Resume, Resume Code, and Review behavior. This is distinct from form=advisor, which directs initial entry to the Advisor Login Page.",
    sourceRefs: [
      "src/pages/Resume.tsx",
      "src/pages/ResumeCode.tsx",
      "src/pages/Review.tsx",
    ],
  },
  {
    parameter: "client",
    currentTemplate: "Not listed in current parameter inventory.",
    status: "New — Prototype/Configuration Utility",
    newValues: [
      "demo",
      "abe",
      "ama",
      "avma",
      "csea",
      "isitrust",
      "nso",
      "waepa",
    ],
    newBehavior: [
      "Overrides the active client configuration used by the prototype. A valid URL client ID is stored in session storage and remains the active client for subsequent navigation during the session.",
    ],
    notes:
      "If the URL value is not a valid configured client ID, it is not used. If no valid URL override exists, the prototype uses the previously stored client ID when available, otherwise the default client is demo. Production use/status is TBD; this currently functions as a prototype/configuration-selection mechanism.",
    sourceRefs: [
      "src/config/client/resolveClientId.ts",
      "src/config/clients/index.ts",
      "src/dev/DevTools.tsx",
    ],
  },
  {
    parameter: "inputChecks",
    currentTemplate: "Not listed in current parameter inventory.",
    status: "New — Prototype/Development Utility",
    newValues: ["Presence-based parameter; no specific value is required."],
    newBehavior: [
      "Enables field-level completion/error visual indicators used by the prototype. When present, completed fields can display completion status and fields with validation errors can display the corresponding error-status treatment.",
    ],
    notes:
      "This parameter currently affects prototype UI validation/status visualization and should not be treated as a production URL requirement unless explicitly approved.",
    sourceRefs: [
      "src/components/forms/FieldRenderer.tsx",
      "src/pages/Eligibility.tsx",
    ],
  },
  {
    parameter: "dev",
    currentTemplate: "Not listed in current parameter inventory.",
    status: "New — Development Only",
    newValues: [
      "true",
      "false",
      "Presence without false is treated as enabled by the current prototype logic.",
    ],
    newBehavior: [
      "Enables or disables the prototype DevTools mode. The selected state is stored in session storage.",
    ],
    notes:
      "Development-only parameter. It is not a consumer/advisor functional URL parameter and should not be included as a production site-template requirement.",
    sourceRefs: ["src/dev/DevTools.tsx"],
  },
  {
    parameter: "reset",
    currentTemplate: "Not listed in current parameter inventory.",
    status: "New — Development Only",
    newValues: [
      "Timestamp value generated by the prototype DevTools reset action.",
    ],
    newBehavior: [
      "Added to the URL when the DevTools “Reset App” action redirects back to the root route. The current source does not read this parameter to drive application behavior; it functions as a unique redirect/query value during the reset operation.",
    ],
    notes:
      "Development-only implementation detail. It should not be included as a production site-template URL requirement unless a separate production use case is defined.",
    sourceRefs: ["src/dev/DevTools.tsx"],
  },
];

const urlParameterSourceSummary: {
  parameter: string;
  classification: string;
  productionStatus: string;
}[] = [
  {
    parameter: "variant",
    classification: "User-facing Landing Page behavior",
    productionStatus: "New; behavior documented above",
  },
  {
    parameter: "flow",
    classification: "User-facing advisor-flow behavior",
    productionStatus: "New; behavior documented above",
  },
  {
    parameter: "client",
    classification: "Prototype/client configuration override",
    productionStatus: "TBD for production",
  },
  {
    parameter: "inputChecks",
    classification: "Prototype UI/status utility",
    productionStatus: "Not currently a production requirement",
  },
  {
    parameter: "dev",
    classification: "Development utility",
    productionStatus: "Development only",
  },
  {
    parameter: "reset",
    classification: "Development reset implementation detail",
    productionStatus: "Development only",
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatValue(value: unknown) {
  if (Array.isArray(value)) return value.join(", ");
  if (value === true) return "Yes";
  if (value === false) return "No";
  if (value == null || value === "") return "—";
  return String(value);
}

function formatVisibleWhen(rules?: SectionVisibilityRule[]) {
  if (!rules || rules.length === 0) return "Always visible";
  return rules
    .map((rule) => {
      if ("equals" in rule)
        return `${rule.fieldId} = ${formatValue(rule.equals)}`;
      if ("notEquals" in rule)
        return `${rule.fieldId} ≠ ${formatValue(rule.notEquals)}`;
      if ("includes" in rule)
        return `${rule.fieldId} includes ${formatValue(rule.includes)}`;
      return "Conditional";
    })
    .join(" AND ");
}

function formatOptions(fieldId: string) {
  const field = fieldCatalog[fieldId as keyof typeof fieldCatalog];
  if (!field?.options || field.options.length === 0) return "—";
  return field.options.map((option) => option.label).join(", ");
}

// ---------------------------------------------------------------------------
// Client-specific field prefixes to exclude (demo client doesn't use these)
// ---------------------------------------------------------------------------
const clientSpecificPrefixes = ["waepa-", "avma-"];
function isClientSpecificField(fieldId: string) {
  return clientSpecificPrefixes.some((prefix) => fieldId.startsWith(prefix));
}

// Fields that are client-configured visibility
const clientConfiguredFields = new Set(["title"]);

// Pages with no user-interactive fields (exclude from fields section)
const pagesWithNoFields = new Set<PageId>([
  "receipt",
  "docusign",
  "health-qd",
  "health-cir",
]);

// ---------------------------------------------------------------------------
// Page field rows
// ---------------------------------------------------------------------------

type FieldRow = {
  sectionId: string;
  sectionLabel: string;
  applicant: string;
  fieldId: string;
  label: string;
  inputType: string;
  required: string;
  options: string;
  visibleWhen: string;
};

function getCustomPageFieldRows(pageId: PageId): FieldRow[] | null {
  switch (pageId) {
    case "review":
      return [
        {
          sectionId: "consent",
          sectionLabel: "Consent",
          applicant: "member",
          fieldId: "review-self-consent",
          label:
            "I confirm that I have reviewed and understand the above material. I consent to the use of electronic signature and delivery of electronic records.",
          inputType: "checkbox",
          required: "Yes",
          options: "—",
          visibleWhen: "Always visible",
        },
        {
          sectionId: "consent",
          sectionLabel: "Consent",
          applicant: "spouse",
          fieldId: "review-spouse-consent",
          label:
            "I confirm that I have reviewed and understand the above material. I consent to the use of electronic signature and delivery of electronic records.",
          inputType: "checkbox",
          required: "Yes",
          options: "—",
          visibleWhen: "dependents includes spouse",
        },
      ];
    case "beneficiary":
      return [
        {
          sectionId: "opt-in",
          sectionLabel: "Opt-in",
          applicant: "—",
          fieldId: "beneficiary-information-opt-in",
          label: "Do you want to add beneficiary information?",
          inputType: "radio",
          required: "Yes",
          options: "Yes, No",
          visibleWhen: "Only when page requirement = optional",
        },
        {
          sectionId: "beneficiary-modal",
          sectionLabel: "Beneficiary modal",
          applicant: "—",
          fieldId: "beneficiary-type",
          label: "Beneficiary type toggle",
          inputType: "toggle-button",
          required: "Yes",
          options: "Individual, Trust",
          visibleWhen: "Always visible",
        },
        {
          sectionId: "beneficiary-modal",
          sectionLabel: "Beneficiary modal",
          applicant: "—",
          fieldId: "beneficiary-designation",
          label: "Designation",
          inputType: "tabs",
          required: "Yes",
          options: "Primary, Contingent",
          visibleWhen: "Always visible",
        },
        {
          sectionId: "beneficiary-modal",
          sectionLabel: "Beneficiary modal (Individual)",
          applicant: "—",
          fieldId: "beneficiary-firstName",
          label: "First Name",
          inputType: "text",
          required: "Yes",
          options: "—",
          visibleWhen: "beneficiary-type = Individual",
        },
        {
          sectionId: "beneficiary-modal",
          sectionLabel: "Beneficiary modal (Individual)",
          applicant: "—",
          fieldId: "beneficiary-lastName",
          label: "Last Name",
          inputType: "text",
          required: "Yes",
          options: "—",
          visibleWhen: "beneficiary-type = Individual",
        },
        {
          sectionId: "beneficiary-modal",
          sectionLabel: "Beneficiary modal (Individual)",
          applicant: "—",
          fieldId: "beneficiary-relationship",
          label: "Relationship",
          inputType: "dropdown",
          required: "Yes",
          options: "Spouse, Child, Parent, Sibling, Other Relative, Other",
          visibleWhen: "beneficiary-type = Individual",
        },
        {
          sectionId: "beneficiary-modal",
          sectionLabel: "Beneficiary modal (Individual)",
          applicant: "—",
          fieldId: "beneficiary-share",
          label: "% Share",
          inputType: "number",
          required: "Yes",
          options: "—",
          visibleWhen: "beneficiary-type = Individual",
        },
        {
          sectionId: "beneficiary-modal",
          sectionLabel: "Beneficiary modal (Trust)",
          applicant: "—",
          fieldId: "beneficiary-trustName",
          label: "Name of Trust",
          inputType: "text",
          required: "Yes",
          options: "—",
          visibleWhen: "beneficiary-type = Trust",
        },
        {
          sectionId: "beneficiary-modal",
          sectionLabel: "Beneficiary modal (Trust)",
          applicant: "—",
          fieldId: "beneficiary-trustDate",
          label: "Date of Trust",
          inputType: "date",
          required: "Yes",
          options: "—",
          visibleWhen: "beneficiary-type = Trust",
        },
      ];
    case "health-si":
      return [
        {
          sectionId: "health-questions",
          sectionLabel: "Health questions (SI)",
          applicant: "member",
          fieldId: "health-si-q1",
          label:
            "Currently taking prescribed medication or receiving/contemplating medical attention?",
          inputType: "radio",
          required: "Yes",
          options: "Yes, No",
          visibleWhen: "Always visible",
        },
        {
          sectionId: "health-questions",
          sectionLabel: "Health questions (SI)",
          applicant: "member",
          fieldId: "health-si-q2",
          label:
            "Past 5 years: diagnosed/treated for heart, circulatory, cancer, diabetes, mental, respiratory, kidney, liver, etc.?",
          inputType: "radio",
          required: "Yes",
          options: "Yes, No",
          visibleWhen: "Always visible",
        },
        {
          sectionId: "health-questions",
          sectionLabel: "Health questions (SI)",
          applicant: "member",
          fieldId: "health-si-q3",
          label:
            "Past 5 years: counseled/treated/hospitalized for alcohol or drug use?",
          inputType: "radio",
          required: "Yes",
          options: "Yes, No",
          visibleWhen: "Always visible",
        },
        {
          sectionId: "health-questions",
          sectionLabel: "Health questions (SI)",
          applicant: "member",
          fieldId: "health-si-q4",
          label: "Currently pregnant?",
          inputType: "radio",
          required: "Yes",
          options: "Yes, No",
          visibleWhen: "Always visible",
        },
        {
          sectionId: "health-questions",
          sectionLabel: "Health questions (SI)",
          applicant: "member",
          fieldId: "health-si-q5",
          label:
            "Currently disabled or receiving disability/Workers' Compensation benefits?",
          inputType: "radio",
          required: "Yes",
          options: "Yes, No",
          visibleWhen: "Always visible",
        },
        {
          sectionId: "health-detail",
          sectionLabel: "Detail (if Yes)",
          applicant: "member",
          fieldId: "health-si-onset",
          label: "Month/Year of Onset",
          inputType: "text",
          required: "Yes",
          options: "—",
          visibleWhen: "Any health-si question = Yes",
        },
        {
          sectionId: "health-detail",
          sectionLabel: "Detail (if Yes)",
          applicant: "member",
          fieldId: "health-si-conditionsDetails",
          label: "Condition/Medication & Details",
          inputType: "text (multiline)",
          required: "Yes",
          options: "—",
          visibleWhen: "Any health-si question = Yes",
        },
        {
          sectionId: "health-detail",
          sectionLabel: "Detail (if Yes)",
          applicant: "member",
          fieldId: "health-si-physicianAddress",
          label: "Name and Address of Physician/Hospital",
          inputType: "text (multiline)",
          required: "Yes",
          options: "—",
          visibleWhen: "Any health-si question = Yes",
        },
      ];
    case "health-li":
      return [
        {
          sectionId: "health-questions",
          sectionLabel: "Health questions (LI)",
          applicant: "member",
          fieldId: "health-li-q1",
          label:
            "Currently confined to hospital/nursing home/psychiatric facility/incarcerated?",
          inputType: "radio",
          required: "Yes",
          options: "Yes, No",
          visibleWhen: "Always visible",
        },
        {
          sectionId: "health-questions",
          sectionLabel: "Health questions (LI)",
          applicant: "member",
          fieldId: "health-li-q2",
          label:
            "Past 5 years: declined/postponed/rated life or health insurance?",
          inputType: "radio",
          required: "Yes",
          options: "Yes, No",
          visibleWhen: "Always visible",
        },
        {
          sectionId: "health-questions",
          sectionLabel: "Health questions (LI)",
          applicant: "member",
          fieldId: "health-li-q3",
          label:
            "Currently undergoing medical evaluation for undiagnosed condition?",
          inputType: "radio",
          required: "Yes",
          options: "Yes, No",
          visibleWhen: "Always visible",
        },
        {
          sectionId: "health-questions",
          sectionLabel: "Health questions (LI)",
          applicant: "member",
          fieldId: "health-li-q4",
          label:
            "Past 5 years: convicted of felony, DUI charges, 3+ moving violations?",
          inputType: "radio",
          required: "Yes",
          options: "Yes, No",
          visibleWhen: "Always visible",
        },
        {
          sectionId: "health-questions",
          sectionLabel: "Health questions (LI)",
          applicant: "member",
          fieldId: "health-li-q5",
          label:
            "Past 5 years: diagnosed with HIV/AIDS or tested positive for HIV?",
          inputType: "radio",
          required: "Yes",
          options: "Yes, No",
          visibleWhen: "Always visible",
        },
        {
          sectionId: "health-questions",
          sectionLabel: "Health questions (LI)",
          applicant: "member",
          fieldId: "health-li-q6",
          label:
            "Past 5 years: heart disease, heart attack, chest pains, irregular heartbeat?",
          inputType: "radio",
          required: "Yes",
          options: "Yes, No",
          visibleWhen: "Always visible",
        },
        {
          sectionId: "health-questions",
          sectionLabel: "Health questions (LI)",
          applicant: "member",
          fieldId: "health-li-q7",
          label: "Past 5 years: diabetes, stroke, aneurysm, or kidney disease?",
          inputType: "radio",
          required: "Yes",
          options: "Yes, No",
          visibleWhen: "Always visible",
        },
        {
          sectionId: "health-questions",
          sectionLabel: "Health questions (LI)",
          applicant: "member",
          fieldId: "health-li-q8",
          label:
            "Past 5 years: depression, anxiety, mental disorder, drug/alcohol treatment?",
          inputType: "radio",
          required: "Yes",
          options: "Yes, No",
          visibleWhen: "Always visible",
        },
        {
          sectionId: "health-questions",
          sectionLabel: "Health questions (LI)",
          applicant: "member",
          fieldId: "health-li-q9",
          label:
            "Past 5 years: cirrhosis, hepatitis, ALS, neuro-muscular, paralysis?",
          inputType: "radio",
          required: "Yes",
          options: "Yes, No",
          visibleWhen: "Always visible",
        },
        {
          sectionId: "health-questions",
          sectionLabel: "Health questions (LI)",
          applicant: "member",
          fieldId: "health-li-q10",
          label:
            "Past 5 years: cancer, tumors, lymphoma, blood/connective tissue disorder?",
          inputType: "radio",
          required: "Yes",
          options: "Yes, No",
          visibleWhen: "Always visible",
        },
        {
          sectionId: "health-questions",
          sectionLabel: "Health questions (LI)",
          applicant: "member",
          fieldId: "health-li-q11",
          label:
            "Past 5 years: Crohn's disease, pancreas/immune system disorder?",
          inputType: "radio",
          required: "Yes",
          options: "Yes, No",
          visibleWhen: "Always visible",
        },
        {
          sectionId: "health-questions",
          sectionLabel: "Health questions (LI)",
          applicant: "member",
          fieldId: "health-li-q12",
          label:
            "Past 5 years: hypertension, elevated cholesterol, respiratory, sleep apnea?",
          inputType: "radio",
          required: "Yes",
          options: "Yes, No",
          visibleWhen: "Always visible",
        },
        {
          sectionId: "health-questions",
          sectionLabel: "Health questions (LI)",
          applicant: "member",
          fieldId: "health-li-q13",
          label: "Past 5 years: anemia, colitis, or arthritis?",
          inputType: "radio",
          required: "Yes",
          options: "Yes, No",
          visibleWhen: "Always visible",
        },
        {
          sectionId: "health-questions",
          sectionLabel: "Health questions (LI)",
          applicant: "member",
          fieldId: "health-li-q14",
          label:
            "Past 5 years: flown airplane (non-commercial), sky/underwater/climbing/motor sports?",
          inputType: "radio",
          required: "Yes",
          options: "Yes, No",
          visibleWhen: "Always visible",
        },
        {
          sectionId: "health-questions",
          sectionLabel: "Health questions (LI)",
          applicant: "member",
          fieldId: "health-li-q15",
          label:
            "Parents/siblings diagnosed with or died from cancer/cardiovascular disease before age 60?",
          inputType: "radio",
          required: "Yes",
          options: "Yes, No",
          visibleWhen: "Always visible",
        },
        {
          sectionId: "health-detail",
          sectionLabel: "Detail (if Yes)",
          applicant: "member",
          fieldId: "health-li-onset",
          label: "Month/Year of Onset",
          inputType: "text",
          required: "Yes",
          options: "—",
          visibleWhen: "Any health-li question = Yes",
        },
        {
          sectionId: "health-detail",
          sectionLabel: "Detail (if Yes)",
          applicant: "member",
          fieldId: "health-li-conditionsDetails",
          label: "Condition/Medication & Details",
          inputType: "text (multiline)",
          required: "Yes",
          options: "—",
          visibleWhen: "Any health-li question = Yes",
        },
        {
          sectionId: "health-detail",
          sectionLabel: "Detail (if Yes)",
          applicant: "member",
          fieldId: "health-li-physicianAddress",
          label: "Name and Address of Physician/Hospital",
          inputType: "text (multiline)",
          required: "Yes",
          options: "—",
          visibleWhen: "Any health-li question = Yes",
        },
      ];
    case "health-di":
      return [
        {
          sectionId: "health-questions",
          sectionLabel: "Health questions (DI)",
          applicant: "member",
          fieldId: "health-di-q1",
          label:
            "Need assistance with bathing, dressing, eating, walking, transferring, toileting?",
          inputType: "radio",
          required: "Yes",
          options: "Yes, No",
          visibleWhen: "Always visible",
        },
        {
          sectionId: "health-questions",
          sectionLabel: "Health questions (DI)",
          applicant: "member",
          fieldId: "health-di-q2",
          label:
            "Past 5 years: fall, fracture, paralysis, numbness, balance problems, skin ulcers?",
          inputType: "radio",
          required: "Yes",
          options: "Yes, No",
          visibleWhen: "Always visible",
        },
        {
          sectionId: "health-questions",
          sectionLabel: "Health questions (DI)",
          applicant: "member",
          fieldId: "health-di-q3",
          label:
            "Wheelchair-dependent or use braces, crutches, walker, cane, back support?",
          inputType: "radio",
          required: "Yes",
          options: "Yes, No",
          visibleWhen: "Always visible",
        },
        {
          sectionId: "health-questions",
          sectionLabel: "Health questions (DI)",
          applicant: "member",
          fieldId: "health-di-q4",
          label: "Past 6 months: had or recommended physical therapy?",
          inputType: "radio",
          required: "Yes",
          options: "Yes, No",
          visibleWhen: "Always visible",
        },
        {
          sectionId: "health-questions",
          sectionLabel: "Health questions (DI)",
          applicant: "member",
          fieldId: "health-di-q5",
          label:
            "Past 5 years: evaluated for memory or ability to think/reason?",
          inputType: "radio",
          required: "Yes",
          options: "Yes, No",
          visibleWhen: "Always visible",
        },
        {
          sectionId: "health-questions",
          sectionLabel: "Health questions (DI)",
          applicant: "member",
          fieldId: "health-di-q6",
          label:
            "Past 5 years: confined to hospital, nursing home, rehab, assisted living?",
          inputType: "radio",
          required: "Yes",
          options: "Yes, No",
          visibleWhen: "Always visible",
        },
        {
          sectionId: "health-questions",
          sectionLabel: "Health questions (DI)",
          applicant: "member",
          fieldId: "health-di-q7",
          label: "Past 5 years: declined for long-term care insurance?",
          inputType: "radio",
          required: "Yes",
          options: "Yes, No",
          visibleWhen: "Always visible",
        },
        {
          sectionId: "health-detail",
          sectionLabel: "Detail (if Yes)",
          applicant: "member",
          fieldId: "health-di-onset",
          label: "Month/Year of Onset",
          inputType: "text",
          required: "Yes",
          options: "—",
          visibleWhen: "Any health-di question = Yes",
        },
        {
          sectionId: "health-detail",
          sectionLabel: "Detail (if Yes)",
          applicant: "member",
          fieldId: "health-di-conditionsDetails",
          label: "Condition/Medication & Details",
          inputType: "text (multiline)",
          required: "Yes",
          options: "—",
          visibleWhen: "Any health-di question = Yes",
        },
        {
          sectionId: "health-detail",
          sectionLabel: "Detail (if Yes)",
          applicant: "member",
          fieldId: "health-di-physicianAddress",
          label: "Name and Address of Physician/Hospital",
          inputType: "text (multiline)",
          required: "Yes",
          options: "—",
          visibleWhen: "Any health-di question = Yes",
        },
      ];
    case "payment":
      return [
        {
          sectionId: "opt-in",
          sectionLabel: "Opt-in",
          applicant: "—",
          fieldId: "payment-information-opt-in",
          label: "Do you want to add payment information?",
          inputType: "radio",
          required: "Yes",
          options: "Yes, No",
          visibleWhen: "Only when page requirement = optional",
        },
        {
          sectionId: "payment-per-product",
          sectionLabel: "Per-product payment",
          applicant: "—",
          fieldId: "payment-method",
          label: "Payment method (per product)",
          inputType: "radio",
          required: "Yes",
          options: "Bill me, Bank account",
          visibleWhen: "Always visible (repeated per selected coverage)",
        },
        {
          sectionId: "payment-per-product",
          sectionLabel: "Per-product payment",
          applicant: "—",
          fieldId: "payment-frequency",
          label: "Payment frequency (per product)",
          inputType: "dropdown",
          required: "Yes",
          options: "Monthly, Quarterly, Semiannually, Annually",
          visibleWhen: "Always visible (repeated per selected coverage)",
        },
        {
          sectionId: "bank-details",
          sectionLabel: "Bank account details",
          applicant: "—",
          fieldId: "bank-name-on-account",
          label: "Name on Account",
          inputType: "text",
          required: "Yes",
          options: "—",
          visibleWhen: "Any product payment-method = Bank account",
        },
        {
          sectionId: "bank-details",
          sectionLabel: "Bank account details",
          applicant: "—",
          fieldId: "bank-institution",
          label: "Bank Institution",
          inputType: "text",
          required: "Yes",
          options: "—",
          visibleWhen: "Any product payment-method = Bank account",
        },
        {
          sectionId: "bank-details",
          sectionLabel: "Bank account details",
          applicant: "—",
          fieldId: "bank-routing-number",
          label: "Routing Number",
          inputType: "number",
          required: "Yes",
          options: "—",
          visibleWhen: "Any product payment-method = Bank account",
        },
        {
          sectionId: "bank-details",
          sectionLabel: "Bank account details",
          applicant: "—",
          fieldId: "bank-account-number",
          label: "Account Number",
          inputType: "number",
          required: "Yes",
          options: "—",
          visibleWhen: "Any product payment-method = Bank account",
        },
        {
          sectionId: "bank-details",
          sectionLabel: "Bank account details",
          applicant: "—",
          fieldId: "bank-authorization",
          label: "I authorize recurring payments from this bank account.",
          inputType: "checkbox",
          required: "Yes",
          options: "—",
          visibleWhen: "Any product payment-method = Bank account",
        },
      ];
    default:
      return null;
  }
}

/** Extra fields for eligibility child section (DynamicList) */
const eligibilityChildFields: FieldRow[] = [
  {
    sectionId: "childSection",
    sectionLabel: "Child applicants (DynamicList)",
    applicant: "child",
    fieldId: "child-first-name",
    label: "First Name",
    inputType: "text",
    required: "Yes",
    options: "—",
    visibleWhen: "dependents includes child",
  },
  {
    sectionId: "childSection",
    sectionLabel: "Child applicants (DynamicList)",
    applicant: "child",
    fieldId: "child-last-name",
    label: "Last Name",
    inputType: "text",
    required: "Yes",
    options: "—",
    visibleWhen: "dependents includes child",
  },
  {
    sectionId: "childSection",
    sectionLabel: "Child applicants (DynamicList)",
    applicant: "child",
    fieldId: "child-birth-date",
    label: "Date of Birth",
    inputType: "date",
    required: "Yes",
    options: "—",
    visibleWhen: "dependents includes child",
  },
  {
    sectionId: "childSection",
    sectionLabel: "Child applicants (DynamicList)",
    applicant: "child",
    fieldId: "child-gender",
    label: "Gender",
    inputType: "radio",
    required: "Yes",
    options: "Male, Female",
    visibleWhen: "dependents includes child",
  },
];

/** Coverage product card fields (rendered in ProductCatalog per product) */
const coverageProductFields: FieldRow[] = [
  {
    sectionId: "product-card",
    sectionLabel: "Product selection (per product)",
    applicant: "per-applicant",
    fieldId: "coverage-add-checkbox",
    label: "Add coverage (select this product)",
    inputType: "checkbox",
    required: "No",
    options: "—",
    visibleWhen: "Always visible (per product per applicant)",
  },
  {
    sectionId: "product-card",
    sectionLabel: "Product selection (per product)",
    applicant: "per-applicant",
    fieldId: "coverage-benefit-amount",
    label: "Benefit Amount",
    inputType: "dropdown",
    required: "Yes (if selected)",
    options: "Dynamic: product min–max by amountStep",
    visibleWhen: "coverage-add-checkbox = checked",
  },
  {
    sectionId: "product-card",
    sectionLabel: "Product selection (per product)",
    applicant: "—",
    fieldId: "coverage-waiting-period",
    label: "Waiting Period",
    inputType: "dropdown",
    required: "Yes (if shown)",
    options: "Dynamic (per DI/OO product waitingPeriodOptions)",
    visibleWhen: "DI or OO category product selected",
  },
  {
    sectionId: "product-card",
    sectionLabel: "Product selection (per product)",
    applicant: "—",
    fieldId: "coverage-max-benefit-period",
    label: "Maximum Benefit Period",
    inputType: "dropdown",
    required: "Yes (if shown)",
    options: "Dynamic (per OO product maxBenefitPeriodOptions)",
    visibleWhen: "OO category product selected",
  },
  {
    sectionId: "product-card",
    sectionLabel: "Product selection (per product)",
    applicant: "—",
    fieldId: "coverage-rider-checkbox",
    label: "Optional Benefit / Rider",
    inputType: "checkbox",
    required: "No",
    options: "Dynamic (per product riders array)",
    visibleWhen: "Product has riders defined",
  },
  {
    sectionId: "product-card",
    sectionLabel: "Product selection (per product)",
    applicant: "—",
    fieldId: "coverage-rider-benefit-amount",
    label: "Rider Benefit Amount",
    inputType: "dropdown",
    required: "Yes (if rider selected)",
    options: "Dynamic (rider min/max amount)",
    visibleWhen: "coverage-rider-checkbox = checked AND rider has amount range",
  },
];

function getPageFieldRows(pageId: PageId): FieldRow[] {
  const customRows = getCustomPageFieldRows(pageId);
  if (customRows) return customRows;

  const sections = pageSections[pageId] ?? [];
  if (sections.length === 0) return [];
  const rows = sections.flatMap((section) => {
    if (section.fieldIds.length === 0) {
      return [
        {
          sectionId: section.id,
          sectionLabel: section.title ?? section.description ?? section.id,
          applicant: section.applicant ?? "—",
          fieldId: "—",
          label: "Dynamic/repeating content",
          inputType: "—",
          required: "—",
          options: "—",
          visibleWhen: formatVisibleWhen(section.visibleWhen),
        },
      ];
    }
    return section.fieldIds.map((fieldId) => {
      const field = fieldCatalog[fieldId];
      const isClientConfigured = clientConfiguredFields.has(fieldId);
      let visibleWhen = formatVisibleWhen(section.visibleWhen);
      if (isClientConfigured) {
        visibleWhen =
          visibleWhen === "Always visible"
            ? "Client-configured (shown if client enables it)"
            : `${visibleWhen} + Client-configured`;
      }
      return {
        sectionId: section.id,
        sectionLabel: section.title ?? section.description ?? section.id,
        applicant: section.applicant ?? "—",
        fieldId,
        label: field?.label ?? fieldId,
        inputType: field?.inputType ?? "—",
        required: field?.required ? "Yes" : "No",
        options: formatOptions(fieldId),
        visibleWhen,
      };
    });
  });

  if (pageId === "eligibility") return [...rows, ...eligibilityChildFields];
  if (pageId === "coverage") return [...rows, ...coverageProductFields];
  return rows;
}

// ---------------------------------------------------------------------------
// Flow data (from Page Flows document)
// ---------------------------------------------------------------------------

type FlowStep = { label: string; description: string };

const consumerFlow: FlowStep[] = [
  {
    label: "Landing Page",
    description:
      "Starts a new application, opens Quote, or resumes an application.",
  },
  {
    label: "Membership",
    description:
      "Collects membership and applicant contact information. Establishes application record and starts autosave.",
  },
  {
    label: "Eligibility",
    description:
      "Collects ZIP/postal code, state, date of birth, dependent selection, and configured eligibility responses. When the Child dependent section is shown, an info alert indicates only unmarried children are eligible for coverage.",
  },
  {
    label: "Coverage",
    description:
      "Collects coverage interests and selections: eligible applicants, products, amounts, riders, estimated premiums. If only spouse and/or child coverage is selected (no member selection), Next requires an intermediate confirmation before advancing.",
  },
  {
    label: "Beneficiary",
    description:
      "Included when selected coverage is configured for beneficiary designation (Required/Optional/None mode).",
  },
  {
    label: "Contact",
    description:
      "Collects configured applicant, mailing, business, and spouse contact information.",
  },
  {
    label: "Profile",
    description:
      "Collects configured personal, employment, financial, existing-coverage, travel, residence, and spouse information.",
  },
  {
    label: "Review",
    description:
      "Presents application summary and required consent/acknowledgement sections.",
  },
  {
    label: "Health (SI → LI → QD → CIR → DI)",
    description:
      "Applicable health forms as separate routes grouped under one Health progress stage.",
  },
  {
    label: "Payment",
    description:
      "Collects payment information when included by Required or Optional page mode.",
  },
  {
    label: "E-Sign",
    description:
      "Completes the configured electronic-signature process (DocuSign).",
  },
  {
    label: "Receipt",
    description:
      "Displays submission confirmation, decision information, and configured next steps.",
  },
];

const advisorFlow: FlowStep[] = [
  {
    label: "Advisor Login",
    description:
      "Advisor starts a new application or resumes a saved application.",
  },
  { label: "Membership", description: "Advisor begins application." },
  {
    label: "Eligibility",
    description: "Advisor completes eligibility information.",
  },
  { label: "Coverage", description: "Advisor completes coverage selections." },
  {
    label: "Beneficiary (if applicable)",
    description:
      "Advisor completes beneficiary information when included in resolved flow.",
  },
  { label: "Contact", description: "Advisor completes contact information." },
  {
    label: "Profile",
    description: "Advisor completes the final advisor page.",
  },
  {
    label: "Send Application Dialog",
    description:
      "After clicking Next on Profile, advisor sees SendApplicationDialog titled 'Send to applicant for review' with applicant name + email and send-confirmation copy. Send navigates to Advisor Send Confirmation; Cancel stays on Profile.",
  },
  {
    label: "Advisor Send Confirmation",
    description:
      "Confirmation page showing the applicant email, send timestamp, and purge date. Advisor can start a new application.",
  },
  {
    label: "Resume & Verification (Applicant)",
    description:
      "Applicant enters via resume?flow=advisor. Verification step may be skipped in the advisor flow.",
  },
  {
    label: "Review (advisor mode)",
    description:
      "Applicant reviews advisor-entered application data on the standard Review page (flow=advisor). Earlier stepper steps are locked. Edit icon opens SendApplicationDialog titled 'Request edit to application' with advisor email only and alert copy. Send -> Application Edit Confirmation; Cancel -> stay.",
  },
  {
    label: "Application Edit Confirmation (if edits requested)",
    description:
      "Confirms the edit request was sent to the advisor dummy email. Application lock transfers back to the advisor.",
  },
  {
    label: "Continue → Review and Remaining Steps",
    description:
      "If no edits are needed, applicant continues through the same Review page to complete legal consent and then Health / Payment / E-Sign / Receipt.",
  },
];

const resumeFlow: FlowStep[] = [
  {
    label: "Resume Request",
    description:
      "User enters application email address; reminder-email links prefill it.",
  },
  {
    label: "Request Confirmation",
    description:
      "System shows same confirmation whether or not a matching application is found.",
  },
  {
    label: "Resume Link",
    description: "User opens the time-limited email link.",
  },
  {
    label: "Resume Method",
    description:
      "User selects how to receive their verification code: Text or Call.",
  },
  {
    label: "Resume Code",
    description:
      "User enters the security code sent via the chosen delivery method.",
  },
  {
    label: "Verification Result",
    description:
      "Successful verification restores access; unsuccessful remains in verification flow.",
  },
  {
    label: "Restored Destination",
    description: "User is routed to the next incomplete page.",
  },
];

const autosaveFlow: FlowStep[] = [
  {
    label: "Membership submission",
    description:
      "Autosave begins after successful Membership submission for both consumer and advisor applications.",
  },
  {
    label: "Page submission",
    description:
      "Portal form data is saved when a page is successfully submitted.",
  },
  {
    label: "Save confirmed",
    description: "Saved indicator appears only after the save is confirmed.",
  },
  {
    label: "Save failure",
    description:
      "Recovery behaviors for: network failure, server error, session expiration, validation failure, browser interruption, partial save.",
  },
];

const quoteFlow: FlowStep[] = [
  {
    label: "Entry point",
    description:
      "Available from Landing Page and Membership page (drawer/modal, not standalone page).",
  },
  {
    label: "Collect inputs",
    description:
      "Collects minimum information required: DOB, gender, tobacco status, category-specific inputs.",
  },
  {
    label: "Calculate estimates",
    description:
      "Calculates estimated premiums for supported categories (LI, AD, DI, OO, SH).",
  },
  {
    label: "Product selection",
    description:
      "At least one product must be selected before continuing into application.",
  },
  {
    label: "Carry into application",
    description:
      "Applicable quote inputs and selected products carry into the application fields.",
  },
];

// ---------------------------------------------------------------------------
// TPA Verification flow
// ---------------------------------------------------------------------------

const tpaVerificationFlow: FlowStep[] = [
  {
    label: "Eligibility",
    description:
      "On successful submission, the system checks whether the applicant matches a TPA member record. If no match, flow continues normally.",
  },
  {
    label: "Member Verification — Method",
    description:
      "A modal opens. Applicant chooses how to verify: send text code, send voice code, answer security questions, or proceed without verification.",
  },
  {
    label: "Member Verification — Security Questions",
    description:
      "Shown when the applicant selects security questions. Three identity questions are presented, each including a none-of-the-above option.",
  },
  {
    label: "Member Verification — Result",
    description:
      "Displays success or failure. The applicant may continue either way.",
  },
  {
    label: "Coverage",
    description:
      "When verification was completed, a button is available to open a drawer showing the applicant's existing in-force coverage.",
  },
];

// ---------------------------------------------------------------------------
// Static component/config data
// ---------------------------------------------------------------------------

type ComponentRow = {
  name: string;
  category: string;
  description: string;
  sourcePath: string;
  usedIn: string;
  storybookLink: string;
};
const componentsData: ComponentRow[] = [
  {
    name: "ApplicationDocumentPreview",
    category: "content",
    description:
      "Full review/preview of application data grouped by page sections with edit buttons.",
    sourcePath: "src/components/content/ApplicationDocumentPreview.tsx",
    usedIn: "Review page",
    storybookLink: "/?path=/story/content-applicationdocumentpreview",
  },
  {
    name: "HelpChips",
    category: "content",
    description: "Horizontally scrollable row of clickable help topic chips.",
    sourcePath: "src/components/content/HelpChips.tsx",
    usedIn: "PageHeader help section",
    storybookLink: "/?path=/story/content-helpchips",
  },
  {
    name: "LegalDocList",
    category: "content",
    description: "Renders structured legal documents from content data.",
    sourcePath: "src/components/content/LegalDocList.tsx",
    usedIn: "AppFooter legal modals",
    storybookLink: "/?path=/story/content-legaldoclist",
  },
  {
    name: "QuickDecisionExplainer",
    category: "content",
    description:
      "Explainer content for QuickDecision℠ with styled marks and drawer.",
    sourcePath: "src/components/content/QuickDecisionExplainer.tsx",
    usedIn: "AppMenu, Coverage page",
    storybookLink: "/?path=/story/content-quickdecisionexplainer",
  },
  {
    name: "QuickDecisionInfoBox",
    category: "content",
    description: "Green info panel promoting QuickDecision℠ eligibility.",
    sourcePath: "src/components/content/QuickDecisionInfoBox.tsx",
    usedIn: "Coverage page",
    storybookLink: "/?path=/story/content-quickdecisioninfobox",
  },
  {
    name: "EmptyState",
    category: "feedback",
    description:
      "Icon + title + body placeholder for empty or unavailable content.",
    sourcePath: "src/components/feedback/EmptyState.tsx",
    usedIn: "CoverageCart, QuoteCalculator, error states",
    storybookLink: "/?path=/story/feedback-emptystate",
  },
  {
    name: "LoadingOverlay",
    category: "feedback",
    description: "Multi-size loading spinner with optional status message.",
    sourcePath: "src/components/feedback/LoadingOverlay.tsx",
    usedIn: "Page transitions, async actions",
    storybookLink: "/?path=/story/feedback-loadingoverlay",
  },
  {
    name: "PageAlert",
    category: "feedback",
    description:
      "Full-width contextual alert above form content. PageErrorAlert is a deprecated re-export of this component.",
    sourcePath: "src/components/feedback/PageAlert.tsx",
    usedIn: "PageShell error/info display",
    storybookLink: "/?path=/story/feedback-pagealert",
  },
  {
    name: "PageTransitionSkeleton",
    category: "feedback",
    description: "Skeleton placeholder during page transitions.",
    sourcePath: "src/components/feedback/PageTransitionSkeleton.tsx",
    usedIn: "RoutePage transition state",
    storybookLink: "/?path=/story/feedback-pagetransitionskeleton",
  },
  {
    name: "AppSnackbar",
    category: "feedback",
    description:
      "Base snackbar component with severity, message, and responsive positioning (bottom on small screens, top-center on large screens). Used by ProgressSavedSnackbar and the Coverage page Added feedback.",
    sourcePath: "src/components/feedback/AppSnackbar.tsx",
    usedIn: "ProgressSavedSnackbar, Coverage page",
    storybookLink: "/?path=/story/feedback-appsnackbar",
  },
  {
    name: "ProgressSavedSnackbar",
    category: "feedback",
    description:
      "Success snackbar confirming form progress saved. Delegates to AppSnackbar.",
    sourcePath: "src/components/feedback/ProgressSavedSnackbar.tsx",
    usedIn: "RoutePage (global)",
    storybookLink: "/?path=/story/feedback-progresssavedsnackbar",
  },
  {
    name: "ConditionalGroup",
    category: "forms",
    description:
      "Left-bordered indented container for conditional follow-up questions.",
    sourcePath: "src/components/forms/ConditionalGroup.tsx",
    usedIn: "Coverage, Profile, Eligibility pages",
    storybookLink: "/?path=/story/forms-conditionalgroup",
  },
  {
    name: "EligibilityFields",
    category: "forms",
    description:
      "Shared eligibility input fields (DOB, gender, tobacco, state, ZIP) used by the Quote Calculator and Home page quote entry.",
    sourcePath: "src/components/forms/EligibilityFields.tsx",
    usedIn: "QuoteCalculator, Home page",
    storybookLink: "/?path=/story/forms-eligibilityfields",
  },
  {
    name: "EstimatorProductCard",
    category: "forms",
    description:
      "Product card with amount selector and QD indicator used inside the Quote Calculator and Quote Modal estimator views.",
    sourcePath: "src/components/forms/EstimatorProductCard.tsx",
    usedIn: "QuoteCalculator, QuoteModal",
    storybookLink: "/?path=/story/forms-estimatorproductcard",
  },
  {
    name: "CoverageCategorySelector",
    category: "forms",
    description: "Multi-select toggle list for choosing coverage categories.",
    sourcePath: "src/components/forms/CoverageCategorySelector.tsx",
    usedIn: "Coverage page",
    storybookLink: "/?path=/story/forms-coveragecategoryselector",
  },
  {
    name: "CoverageNeedsCalculator",
    category: "forms",
    description: "Interactive calculator estimating recommended life coverage.",
    sourcePath: "src/components/forms/CoverageNeedsCalculator.tsx",
    usedIn: "AppMenu drawer",
    storybookLink: "/?path=/story/forms-coverageneedscalculator",
  },
  {
    name: "CoverageQuestions",
    category: "forms",
    description:
      "Category-level coverage questions (tobacco, income) with section visibility.",
    sourcePath: "src/components/forms/CoverageQuestions.tsx",
    usedIn: "Coverage page",
    storybookLink: "/?path=/story/forms-coveragequestions",
  },
  {
    name: "DynamicList",
    category: "forms",
    description: "Add/edit/remove list with modal-based form for items.",
    sourcePath: "src/components/forms/DynamicList.tsx",
    usedIn: "Beneficiary, Profile, Eligibility pages",
    storybookLink: "/?path=/story/forms-dynamiclist",
  },
  {
    name: "DynamicListItem",
    category: "forms",
    description: "Single bordered card item in a DynamicList.",
    sourcePath: "src/components/forms/DynamicListItem.tsx",
    usedIn: "DynamicList children",
    storybookLink: "/?path=/story/forms-dynamiclistitem",
  },
  {
    name: "FieldRenderer",
    category: "forms",
    description:
      "Universal form field renderer: text, date, radio, dropdown, checkbox, multi-select, searchable-select.",
    sourcePath: "src/components/forms/FieldRenderer.tsx",
    usedIn: "All form pages (field rendering)",
    storybookLink: "/?path=/story/forms-fieldrenderer",
  },
  {
    name: "PhysicianInformation",
    category: "forms",
    description: "Physician info section with name/address/phone fields.",
    sourcePath: "src/components/forms/PhysicianInformation.tsx",
    usedIn: "Profile page",
    storybookLink: "/?path=/story/forms-physicianinformation",
  },
  {
    name: "ProductCatalog",
    category: "forms",
    description:
      "Full product catalog with applicant checkboxes, amounts, riders, rates.",
    sourcePath: "src/components/forms/ProductCatalog.tsx",
    usedIn: "Coverage page",
    storybookLink: "/?path=/story/forms-productcatalog",
  },
  {
    name: "QuoteCalculator",
    category: "forms",
    description: "Quote/rate calculator drawer with category selection.",
    sourcePath: "src/components/forms/QuoteCalculator.tsx",
    usedIn: "AppMenu drawer",
    storybookLink: "/?path=/story/forms-quotecalculator",
  },

  {
    name: "SelectionGroup",
    category: "forms",
    description:
      "Full-width bordered clickable row for checkbox/radio/icon-toggle options.",
    sourcePath: "src/components/forms/SelectionGroup.tsx",
    usedIn: "FieldRenderer (radio/checkbox)",
    storybookLink: "/?path=/story/forms-selectiongroup",
  },
  {
    name: "AppBody",
    category: "layout",
    description: "Main content area wrapper with scroll-to-top on navigation.",
    sourcePath: "src/components/layout/AppBody.tsx",
    usedIn: "AppShell",
    storybookLink: "/?path=/story/layout-appbody",
  },
  {
    name: "AppDrawer",
    category: "layout",
    description: "Slide-in drawer (swipeable on mobile) with title and close.",
    sourcePath: "src/components/layout/AppDrawer.tsx",
    usedIn: "CoverageCart, QuoteModal, AppMenu",
    storybookLink: "/?path=/story/layout-appdrawer",
  },
  {
    name: "AppFooter",
    category: "layout",
    description: "Footer with client support info and legal doc modals.",
    sourcePath: "src/components/layout/AppFooter.tsx",
    usedIn: "AppShell",
    storybookLink: "/?path=/story/layout-appfooter",
  },
  {
    name: "AppHeader",
    category: "layout",
    description:
      "Top app bar with logo, menu, cart badge, progress bar, save/help.",
    sourcePath: "src/components/layout/AppHeader.tsx",
    usedIn: "AppShell",
    storybookLink: "/?path=/story/layout-appheader",
  },
  {
    name: "AppMenu",
    category: "layout",
    description:
      "Full-screen side drawer with coverage options, calculator, support. Uses HowApplyingWorksPanel and CoverageOptionsPanel internally for the coverage-options and how-applying-works sub-drawers.",
    sourcePath: "src/components/layout/AppMenu.tsx",
    usedIn: "AppHeader hamburger menu",
    storybookLink: "/?path=/story/layout-appmenu",
  },
  {
    name: "AppModal",
    category: "layout",
    description: "Reusable responsive dialog/modal with title, close, actions.",
    sourcePath: "src/components/layout/AppModal.tsx",
    usedIn: "Legal docs, confirmations, quote modal",
    storybookLink: "/?path=/story/layout-appmodal",
  },
  {
    name: "AppShell",
    category: "layout",
    description: "Top-level layout shell selecting chrome variant.",
    sourcePath: "src/components/layout/AppShell.tsx",
    usedIn: "Router (wraps all pages)",
    storybookLink: "/?path=/story/layout-appshell",
  },
  {
    name: "ApplicantSectionDivider",
    category: "layout",
    description: "Section header with icon/label for applicant sections.",
    sourcePath: "src/components/layout/ApplicantSectionDivider.tsx",
    usedIn: "Coverage, Profile pages",
    storybookLink: "/?path=/story/layout-applicantsectiondivider",
  },

  {
    name: "CategoryCard",
    category: "layout",
    description: "Surface card wrapping a category header + content stack.",
    sourcePath: "src/components/layout/CategoryCard.tsx",
    usedIn: "ProductCatalog",
    storybookLink: "/?path=/story/layout-categorycard",
  },
  {
    name: "CategoryHeader",
    category: "layout",
    description: "h6 heading with optional icon for coverage category.",
    sourcePath: "src/components/layout/CategoryHeader.tsx",
    usedIn: "CategoryCard",
    storybookLink: "/?path=/story/layout-categoryheader",
  },
  {
    name: "ClientHelpBanner",
    category: "layout",
    description: "Support banner with phone, chat, and schedule actions.",
    sourcePath: "src/components/layout/ClientHelpBanner.tsx",
    usedIn: "Home page, AppMenu",
    storybookLink: "/?path=/story/layout-clienthelpbanner",
  },
  {
    name: "ConfirmationDialog",
    category: "layout",
    description: "Yes/Cancel confirmation modal built on AppModal.",
    sourcePath: "src/components/layout/ConfirmationDialog.tsx",
    usedIn: "Destructive actions",
    storybookLink: "/?path=/story/layout-confirmationdialog",
  },
  {
    name: "CookieDialog",
    category: "layout",
    description: "Fixed-position cookie consent banner.",
    sourcePath: "src/components/layout/CookieDialog.tsx",
    usedIn: "AppShell (global)",
    storybookLink: "/?path=/story/layout-cookiedialog",
  },
  {
    name: "FormShell",
    category: "layout",
    description: "Rounded elevated Paper container wrapping form content.",
    sourcePath: "src/components/layout/FormShell.tsx",
    usedIn: "All form pages",
    storybookLink: "/?path=/story/layout-formshell",
  },
  {
    name: "PageHeader",
    category: "layout",
    description: "Page title + subtitle + optional help.",
    sourcePath: "src/components/layout/PageHeader.tsx",
    usedIn: "All form pages",
    storybookLink: "/?path=/story/layout-pageheader",
  },
  {
    name: "PageShell",
    category: "layout",
    description: "Full page layout with title, error display, max-width.",
    sourcePath: "src/components/layout/PageShell.tsx",
    usedIn: "All page wrappers",
    storybookLink: "/?path=/story/layout-pageshell",
  },
  {
    name: "PageTitle",
    category: "layout",
    description: "Page title Typography with optional back arrow.",
    sourcePath: "src/components/layout/PageTitle.tsx",
    usedIn: "Non-form pages",
    storybookLink: "/?path=/story/layout-pagetitle",
  },
  {
    name: "ProductCard",
    category: "layout",
    description: "Bordered card for products with selected/unselected states.",
    sourcePath: "src/components/layout/ProductCard.tsx",
    usedIn: "ProductCatalog, QuoteEstimator",
    storybookLink: "/?path=/story/layout-productcard",
  },
  {
    name: "QuoteModal",
    category: "layout",
    description:
      "Quote/rate comparison modal containing EstimatorProductCard entries per product.",
    sourcePath: "src/components/layout/QuoteModal.tsx",
    usedIn: "Coverage page, AppHeader",
    storybookLink: "/?path=/story/layout-quotemodal",
  },
  {
    name: "SectionDivider",
    category: "layout",
    description: "Chip-based or text section header divider.",
    sourcePath: "src/components/layout/SectionDivider.tsx",
    usedIn: "Form pages (visual separators)",
    storybookLink: "/?path=/story/layout-sectiondivider",
  },
  {
    name: "PageNav",
    category: "navigation",
    description: "Bottom-of-page Next button with loading spinner.",
    sourcePath: "src/components/navigation/PageNav.tsx",
    usedIn: "All form pages",
    storybookLink: "/?path=/story/navigation-pagenav",
  },
  {
    name: "ProgressStep",
    category: "navigation",
    description: "Breadcrumb/stepper progress indicator.",
    sourcePath: "src/components/navigation/ProgressStep.tsx",
    usedIn: "AppHeader progress bar",
    storybookLink: "/?path=/story/navigation-progressstep",
  },
  {
    name: "FeaturedBadge",
    category: "ui",
    description: "Small Featured chip badge with star icon.",
    sourcePath: "src/components/ui/FeaturedBadge.tsx",
    usedIn: "ProductCard (featured)",
    storybookLink: "/?path=/story/ui-featuredbadge",
  },
  {
    name: "ProductCostBreakdown",
    category: "ui",
    description: "Itemized premium + rider + policy fee breakdown.",
    sourcePath: "src/components/ui/ProductCostBreakdown.tsx",
    usedIn: "CoverageCart",
    storybookLink: "/?path=/story/ui-productcostbreakdown",
  },
  {
    name: "QuickDecisionIndicator",
    category: "ui",
    description: "Green lightning bolt icon for QuickDecision℠.",
    sourcePath: "src/components/ui/QuickDecisionIndicator.tsx",
    usedIn: "ProductCard, ProductCatalog",
    storybookLink: "/?path=/story/ui-quickdecisionindicator",
  },
  {
    name: "RateFrequencyToggle",
    category: "ui",
    description: "Switch toggle for monthly/annual rate display.",
    sourcePath: "src/components/ui/RateFrequencyToggle.tsx",
    usedIn: "CoverageCart",
    storybookLink: "/?path=/story/ui-ratefrequencytoggle",
  },
  {
    name: "CoverageCart",
    category: "ui",
    description:
      "Selected coverage summary with drawer and inline variants. Renders per-product cost breakdown and total. Replaces the former CartDrawer + TotalCostCart split.",
    sourcePath: "src/components/ui/CoverageCart.tsx",
    usedIn: "AppHeader (drawer), ProductCatalog (inline)",
    storybookLink: "/?path=/story/ui-coveragecart",
  },
  {
    name: "TotalCostSummary",
    category: "ui",
    description: "Total Estimated Cost summary panel.",
    sourcePath: "src/components/ui/TotalCostSummary.tsx",
    usedIn: "Coverage page, Review page",
    storybookLink: "/?path=/story/ui-totalcostsummary",
  },
  {
    name: "HowApplyingWorksPanel",
    category: "ui",
    description:
      "Renders the How Applying Works step list in either 'page' or 'drawer' variant. " +
      "In drawer variant manages its own sub-drawers for Application Review and QuickDecision℠ content.",
    sourcePath: "src/components/ui/HowApplyingWorksPanel.tsx",
    usedIn: "Home page, AppMenu drawer",
    storybookLink: "/?path=/story/ui-howapplyingworkspanel",
  },
  {
    name: "CoverageOptionsPanel",
    category: "ui",
    description:
      "Tabbed coverage category browser showing products, amounts, eligible applicants, " +
      "and QD indicator. Supports 'page' and 'drawer' variants. Featured products sort first.",
    sourcePath: "src/components/ui/CoverageOptionsPanel.tsx",
    usedIn: "Home page, AppMenu drawer",
    storybookLink: "/?path=/story/ui-coverageoptionspanel",
  },
];

type ConfigRow = {
  group: string;
  label: string;
  name: string; // code-style key shown as secondary identifier
  description: string;
  sourcePath: string;
  configurable: string;
  usedIn: string;
};
const configurationsData: ConfigRow[] = [
  // ── A. Client identity & branding ─────────────────────────────────────────
  {
    group: "Client identity & branding",
    label: "Client branding",
    name: "ClientConfig.branding",
    description:
      "Client name, short acronym, logo asset, and logo alt text. If the logo fails to load, the client name is displayed instead.",
    sourcePath: "src/config/clients/*.ts",
    configurable: "Client Configurable",
    usedIn: "AppHeader, AppShell, email templates",
  },
  {
    group: "Client identity & branding",
    label: "Site theme",
    name: "ClientConfig.themeColor",
    description:
      "Selects an approved MUI theme token set. Supported values: default, teal, purple, dark-blue.",
    sourcePath: "src/config/clients/*.ts / src/app/theme.ts",
    configurable: "Client Configurable (approved palette only)",
    usedIn: "ThemeProvider (global)",
  },
  {
    group: "Client identity & branding",
    label: "Applicant labels",
    name: "ClientConfig.applicantLabels",
    description:
      "Overrides the default Member/Spouse/Child headings across Coverage and applicant sections. Max 20 characters. Does not affect applicant IDs or business logic.",
    sourcePath: "src/config/clients/*.ts",
    configurable: "Client Configurable",
    usedIn: "ApplicantSectionDivider, CoverageQuestions",
  },
  // ── B. Support & contact ──────────────────────────────────────────────────
  {
    group: "Support & contact",
    label: "Support phone & hours",
    name: "ClientConfig.support.phone / phoneDisplay / phoneHours",
    description:
      "Machine-readable support phone, human-readable display version, and optional support hours. When configured, the help banner renders 'Call for help' with optional hours.",
    sourcePath: "src/config/clients/*.ts",
    configurable: "Client Configurable",
    usedIn: "ClientHelpBanner, AppFooter, AppMenu",
  },
  {
    group: "Support & contact",
    label: "Support email, website & address",
    name: "ClientConfig.support.email / website / address",
    description:
      "Support email, client website (full URL or bare domain), and structured mailing address. Each is hidden when absent.",
    sourcePath: "src/config/clients/*.ts",
    configurable: "Client Configurable",
    usedIn: "ClientHelpBanner, AppFooter",
  },
  {
    group: "Support & contact",
    label: "License disclosures",
    name: "ClientConfig.licenseInfo[]",
    description:
      "Array of client licensing disclosure strings shown in the footer or legal area. Rendered in configured order.",
    sourcePath: "src/config/clients/*.ts",
    configurable: "Client Configurable",
    usedIn: "AppFooter",
  },
  // ── C. Landing Page behavior ──────────────────────────────────────────────
  {
    group: "Landing Page",
    label: "Landing Page variant",
    name: "ClientConfig.features.homePageVariant",
    description:
      "Selects the Landing Page composition. Three variants: default (inline quote tool + How Applying Works + Coverage Options), hero-image (hero + How Applying Works + Coverage Options, no inline quote), welcome-back (hero image only; How Applying Works and Coverage Options hidden).",
    sourcePath: "src/config/clients/*.ts / src/pages/Home.tsx",
    configurable: "Client Configurable",
    usedIn: "Home page",
  },
  {
    group: "Landing Page",
    label: "Chat support",
    name: "ClientConfig.features.chat / chatUrl",
    description:
      "Enables a chat action in the help banner and optionally in the app header. Hidden when false or when no valid URL is configured.",
    sourcePath: "src/config/clients/*.ts",
    configurable: "Client Configurable",
    usedIn: "ClientHelpBanner, AppHeader",
  },
  {
    group: "Landing Page",
    label: "Schedule-a-call support",
    name: "ClientConfig.features.scheduleUrl",
    description:
      "Displays a 'Schedule a call' action in the help banner, opening a scheduling page in a modal.",
    sourcePath: "src/config/clients/*.ts",
    configurable: "Client Configurable",
    usedIn: "ClientHelpBanner",
  },
  {
    group: "Landing Page",
    label: "Custom help/action link",
    name: "ClientConfig.features.linkUrl / linkLabel",
    description:
      "Optional client-defined action link (URL + label) in the help banner. Not displayed when absent or without a valid destination.",
    sourcePath: "src/config/clients/*.ts",
    configurable: "Client Configurable",
    usedIn: "ClientHelpBanner",
  },
  {
    group: "Landing Page",
    label: "Hero copy",
    name: "content.home.hero.*",
    description:
      "Landing Page hero copy: tagline, title, description, CTA label, secondary CTA label, resume prompt/link label, welcome-back title and description. Supports {{clientName}} interpolation.",
    sourcePath: "src/content/clients/*.ts",
    configurable: "Client Configurable (content)",
    usedIn: "Home page hero section",
  },
  {
    group: "Landing Page",
    label: "Client-specific homepage section",
    name: "content.home.clientSection",
    description:
      "Optional client informational block on the Landing Page with a tagline and paragraphs array. Rendered only when configured.",
    sourcePath: "src/content/clients/*.ts",
    configurable: "Client Configurable (content)",
    usedIn: "Home page",
  },
  {
    group: "Landing Page",
    label: "How Applying Works content",
    name: "content.home.howApplyingWorks / applyingSteps",
    description:
      "Title, description, and step array (title, body, imageSrc, imageAlt) for the How Applying Works section. Present on default and hero-image variants; hidden on welcome-back.",
    sourcePath: "src/content/defaults/home.ts / src/content/clients/*.ts",
    configurable: "Globally Configurable / Client content override",
    usedIn: "Home page, How Applying Works modal",
  },
  {
    group: "Landing Page",
    label: "Coverage options introduction",
    name: "content.home.coverageOptions",
    description:
      "Title and description for the Coverage Options section on the Landing Page. Present on default and hero-image variants; hidden on welcome-back.",
    sourcePath: "src/content/defaults/home.ts / src/content/clients/*.ts",
    configurable: "Globally Configurable / Client content override",
    usedIn: "Home page",
  },
  {
    group: "Landing Page",
    label: "NYL credentials",
    name: "content.home.nylCredentials",
    description:
      "NYL name, tagline, description, ratings note, and ratings array. Centrally governed — ratings and effective dates are updated globally, not per client.",
    sourcePath: "src/content/defaults/home.ts",
    configurable: "Globally Controlled",
    usedIn: "Home page footer",
  },
  // ── D. Page inclusion & workflow ──────────────────────────────────────────
  {
    group: "Page inclusion & workflow",
    label: "Beneficiary & Payment page mode",
    name: "ClientConfig.pages.requirements.beneficiary / payment",
    description:
      "Controls whether Beneficiary and Payment pages are required, optional, or excluded (none). 'none' removes the page from routing, stepper, breadcrumbs, and Review. 'optional' shows a preliminary Yes/No prompt. The older pages.excluded and pages.optional arrays are deprecated.",
    sourcePath: "src/config/clients/*.ts",
    configurable: "Client Configurable",
    usedIn: "Router, formFlow, ProgressStep, Review",
  },
  {
    group: "Page inclusion & workflow",
    label: "Form flow",
    name: "formFlow",
    description:
      "Ordered page sequence with skip/visibility logic. Determines which pages appear in the resolved flow for a given client and coverage selection.",
    sourcePath: "src/config/formFlow.ts",
    configurable: "Globally defined; skip rules based on coverage selections",
    usedIn: "PageNav next/prev, progress calculation",
  },
  {
    group: "Page inclusion & workflow",
    label: "Page registry & progress steps",
    name: "pages / pageGroups / progressSteps",
    description:
      "Page registry (IDs, paths, types, group assignments), logical page groupings for the progress bar, and breadcrumb step definitions mapping stages to page IDs.",
    sourcePath:
      "src/config/pages.ts / src/config/pageGroups.ts / src/config/progressSteps.ts",
    configurable: "Static / dynamic based on active flow",
    usedIn: "Router, ProgressStep, PageNav",
  },
  // ── E. Coverage categories ────────────────────────────────────────────────
  {
    group: "Coverage categories",
    label: "Enabled categories",
    name: "ClientConfig.coverages.categories",
    description:
      "Array of enabled coverage category IDs (LI, AD, DI, OO, SH) for the client. Display order follows array order. Eligibility may further reduce visible categories.",
    sourcePath: "src/config/clients/*.ts / src/config/coverageCategories.ts",
    configurable: "Client Configurable",
    usedIn: "CoverageCategorySelector, ProductCatalog, form flow",
  },
  {
    group: "Coverage categories",
    label: "Category label overrides & expand behavior",
    name: "ClientConfig.coverages.categorySectionLabels / allCategoriesExpanded",
    description:
      "Per-category display label overrides and a boolean controlling whether category accordions start expanded on load.",
    sourcePath: "src/config/clients/*.ts",
    configurable: "Client Configurable",
    usedIn: "ProductCatalog, CoverageCategorySelector",
  },
  {
    group: "Coverage categories",
    label: "Coverage amount basis",
    name: "ClientConfig.coverages.additionalCoverageWarning",
    description:
      "Controls whether applicants enter an additional amount or a total coverage amount. Values: applyForAdditional (default) or applyForTotal.",
    sourcePath: "src/config/clients/*.ts",
    configurable: "Client Configurable",
    usedIn: "ProductCatalog, coverage amount logic",
  },
  {
    group: "Coverage categories",
    label: "Category descriptions",
    name: "content.coverage.categoryDescriptions",
    description:
      "Explanatory copy displayed per coverage category. Shared defaults apply unless overridden per client.",
    sourcePath: "src/content/defaults/coverage.ts / src/content/clients/*.ts",
    configurable: "Client Configurable (content)",
    usedIn: "ProductCatalog, CoverageCategorySelector",
  },
  // ── F. Products & coverage options ───────────────────────────────────────
  {
    group: "Products & coverage options",
    label: "Enabled products & overrides",
    name: "ClientConfig.coverages.enabled / overrides",
    description:
      "Array of enabled product IDs and per-product overrides: display name, category, description, featured flag, underwriting type (FUW / GI / NA / QD / SI), eligible applicant types, coverage note, product warning, structured content, and per-applicant notes.",
    sourcePath: "src/config/clients/*.ts / src/config/coverages/index.ts",
    configurable: "Client / Product Configurable",
    usedIn: "ProductCatalog, QuoteModal, health routing",
  },
  {
    group: "Products & coverage options",
    label: "Coverage amount ranges",
    name: "ranges[productId] (min / max / amountStep / spouse* / child*)",
    description:
      "Per-product coverage amount ranges and step increments for member, spouse, and child applicants. Generated options must not exceed the configured maximum.",
    sourcePath: "src/config/coverages/index.ts → ranges",
    configurable: "Client / Product Configurable",
    usedIn: "ProductCatalog, CoverageCart, QuoteModal",
  },
  {
    group: "Products & coverage options",
    label: "Waiting period & benefit period options",
    name: "overrides[].waitingPeriodOptions / maxBenefitPeriodOptions",
    description:
      "Available elimination/waiting periods (label, value, days) and maximum benefit periods for applicable DI/OO products.",
    sourcePath: "src/config/coverages/index.ts → overrides",
    configurable: "Client / Product Configurable",
    usedIn: "ProductCatalog",
  },
  {
    group: "Products & coverage options",
    label: "Rider definitions",
    name: "overrides[].riders",
    description:
      "Per-product rider definitions: name, description, hasAmount, min/max amount, premiumFactor, and health-routing rules. Rider IDs must be stable across config changes.",
    sourcePath: "src/config/coverages/index.ts → overrides[].riders",
    configurable: "Client / Product Configurable",
    usedIn: "ProductCatalog, form flow health routing",
  },
  // ── I. Premium & estimated cost display ───────────────────────────────────
  {
    group: "Premium & estimated cost",
    label: "Frequency toggle",
    name: "ClientConfig.estimatedRateDisplay",
    description:
      "Controls the monthly/annual frequency toggle and default frequency for estimated cost display.",
    sourcePath: "src/config/clients/*.ts",
    configurable: "Client Configurable",
    usedIn: "CoverageCart, QuoteModal, TotalCostSummary",
  },
  {
    group: "Premium & estimated cost",
    label: "Cost breakdown & supplemental fees",
    name: "productEstimatedCostBreakdown / policyFee / childApplicantRider",
    description:
      "Enables supplemental cost line items beneath product estimates: policy fee (label + monthly/annual amount) and child applicant rider fee.",
    sourcePath: "src/config/clients/*.ts",
    configurable: "Client Configurable",
    usedIn: "ProductCostBreakdown, CoverageCart",
  },
  // ── J. Coverage-question sections ─────────────────────────────────────────
  {
    group: "Coverage question sections",
    label: "Coverage question section rules",
    name: "ClientConfig.coverageQuestions",
    description:
      "Controls which Coverage page question sections appear: always-shown sections, removed default sections, and per-category additional sections. References stable section IDs from the shared pageSections catalog.",
    sourcePath:
      "src/config/clients/*.ts / src/config/pageSections/pageSections.ts",
    configurable: "Client Configurable",
    usedIn: "CoverageQuestions",
  },
  // ── K. Field configuration ────────────────────────────────────────────────
  {
    group: "Field configuration",
    label: "Field catalog",
    name: "fieldCatalog",
    description:
      "Master field definitions: labels, input types, options, validation rules, format, placeholder, helper text, autoComplete. All field rendering flows through FieldRenderer using these definitions.",
    sourcePath: "src/config/fields/index.ts",
    configurable: "Globally defined; client overrides via ClientConfig.fields",
    usedIn: "FieldRenderer, pageSections, form state",
  },
  {
    group: "Field configuration",
    label: "Per-page field overrides",
    name: "ClientConfig.fields[pageId].extra / hidden / required / overrides",
    description:
      "Per-client, per-page field configuration: add supported fields, hide fields, make fields required, or override supported field properties (label, placeholder, helperText, options). Hidden fields must not be required. Field IDs must exist in the catalog.",
    sourcePath: "src/config/clients/*.ts",
    configurable: "Client Configurable",
    usedIn: "FieldRenderer, pageSections",
  },
  {
    group: "Field configuration",
    label: "Client eligibility fields",
    name: "ClientConfig.fields.eligibility.extra",
    description:
      "Client-specific eligibility questions inserted into the Eligibility page. New fields must be created as reusable supported field definitions, not client-only JSX.",
    sourcePath: "src/config/clients/*.ts → clientFields/",
    configurable: "Client Configurable",
    usedIn: "Eligibility page, EligibilityFields",
  },
  // ── L. Page, section & help content ──────────────────────────────────────
  {
    group: "Page & help content",
    label: "Page title, subtitle & info note",
    name: "content.pages[pageId].title / subhead / navTitle / infoNote",
    description:
      "Per-page content: main H1 heading, subtitle, navigation label, and an optional informational note displayed below the title.",
    sourcePath: "src/content/defaults/pages.ts / src/content/clients/*.ts",
    configurable: "Client Configurable (content)",
    usedIn: "PageHeader, AppHeader progress, ProgressStep",
  },
  {
    group: "Page & help content",
    label: "Section notes",
    name: "content.pages[pageId].sectionNotes",
    description:
      "Informational notes keyed by section ID, displayed below specific section headings.",
    sourcePath: "src/content/clients/*.ts",
    configurable: "Client Configurable (content)",
    usedIn: "Form pages (section rendering)",
  },
  {
    group: "Page & help content",
    label: "Help panel content",
    name: "content.help",
    description:
      "Structured help content for How Applying Works, application review, group insurance, Coverage, beneficiary allocation, field rationale, and payment handling. Client overrides merge at the property level.",
    sourcePath: "src/content/defaults/help.ts / src/content/clients/*.ts",
    configurable: "Globally / Client Configurable (content)",
    usedIn: "HelpChips, AppMenu, helpContent.tsx",
  },
  {
    group: "Page & help content",
    label: "Navigation & transition messages",
    name: "content.navigation",
    description:
      "Route transition messages (by destination page), progress step labels (by stage ID), and the shared Back navigation message. Pages excluded from the flow must not appear in step labels.",
    sourcePath:
      "src/content/defaults/navigation.ts / src/config/transitionMessages.ts",
    configurable: "Globally Configurable (content)",
    usedIn: "LoadingOverlay, ProgressStep",
  },
  // ── M. Footer, legal & compliance ─────────────────────────────────────────
  {
    group: "Footer, legal & compliance",
    label: "Footer content & ratings",
    name: "content.footer",
    description:
      "Administrator label, underwriter name and address, financial strength ratings with 'as of' date, additional legal lines, and Terms of Use / Privacy Notice links. Ratings and effective date are centrally governed. Terms of Use and Privacy Notice content are fixed and not client-configurable.",
    sourcePath: "src/content/defaults/footer.ts / src/content/clients/*.ts",
    configurable: "Globally Controlled / Client Configurable where approved",
    usedIn: "AppFooter, LegalDocList",
  },
  // ── Shared infrastructure ─────────────────────────────────────────────────
  {
    group: "Shared infrastructure",
    label: "Page sections catalog",
    name: "pageSections",
    description:
      "Section-to-field mappings per page with visibleWhen rules and applicant scoping. Client configuration should reference section IDs only; structural definitions belong here.",
    sourcePath: "src/config/pageSections/pageSections.ts",
    configurable:
      "Globally defined; extended via coverageQuestions client config",
    usedIn: "FieldRenderer, CoverageQuestions, ApplicationDocumentPreview",
  },
  {
    group: "Shared infrastructure",
    label: "Shared constants",
    name: "constants / coverageConstants",
    description:
      "Shared UI constants (YES_NO_OPTIONS, SURFACE_SX, CARD_RADIUS) and coverage-specific constants for amount calculations.",
    sourcePath: "src/config/constants.ts / src/config/coverageConstants.ts",
    configurable: "Static",
    usedIn: "FieldRenderer options, layout styles, coverage amount logic",
  },
  {
    group: "Shared infrastructure",
    label: "Client site configs",
    name: "src/config/clients/ (8 configs)",
    description:
      "Full per-client configuration objects combining branding, support, features, pages, coverages, fields, estimatedRateDisplay, and content overrides. Resolved at runtime by getActiveClient().",
    sourcePath: "src/config/clients/",
    configurable: "Client Configurable (full scope)",
    usedIn: "getActiveClient(), all page rendering, theme, routing",
  },
  {
    group: "Shared infrastructure",
    label: "Default content",
    name: "src/content/defaults/",
    description:
      "Shared default content used when a client does not override it: page titles, helper copy, Landing Page content, footer content, navigation messages, receipt/review content.",
    sourcePath: "src/content/defaults/",
    configurable: "Globally defined fallback",
    usedIn: "All content-consuming components",
  },
];

// ---------------------------------------------------------------------------
// Content model data (src/content/types.ts → SiteContent)
// ---------------------------------------------------------------------------

const content = getContent();

const contentKeys: Array<{ key: keyof SiteContent; defaultsFile: string }> = [
  { key: "home", defaultsFile: "src/content/defaults/home.ts" },
  { key: "coverage", defaultsFile: "src/content/defaults/coverage.ts" },
  { key: "navigation", defaultsFile: "src/content/defaults/navigation.ts" },
  { key: "pages", defaultsFile: "src/content/defaults/pages.ts" },
  { key: "footer", defaultsFile: "src/content/defaults/footer.ts" },
  { key: "review", defaultsFile: "src/content/defaults/review.ts" },
  { key: "receipt", defaultsFile: "src/content/defaults/receipt.ts" },
  { key: "help", defaultsFile: "src/content/defaults/help.ts" },
  { key: "shared", defaultsFile: "src/content/defaults/shared.ts" },
  { key: "beneficiary", defaultsFile: "src/content/defaults/beneficiary.ts" },
  { key: "dialogs", defaultsFile: "src/content/defaults/dialogs.ts" },
  {
    key: "statusMessages",
    defaultsFile: "src/content/defaults/statusMessages.ts",
  },
];

type FlatContentRow = {
  path: string;
  /** null indicates a non-string leaf (number, boolean, React node, etc.). */
  value: string | null;
  defaultsFile: string;
};

function flattenContent(
  value: unknown,
  path: string,
  defaultsFile: string,
  rows: FlatContentRow[],
): void {
  if (typeof value === "string") {
    rows.push({ path, value, defaultsFile });
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((item, i) =>
      flattenContent(item, `${path}[${i}]`, defaultsFile, rows),
    );
    return;
  }

  if (value !== null && typeof value === "object" && !isValidElement(value)) {
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      flattenContent(val, path ? `${path}.${key}` : key, defaultsFile, rows);
    }
    return;
  }

  // Non-string leaf: number, boolean, null, undefined, React node, function, etc.
  rows.push({ path, value: null, defaultsFile });
}

const flatContentRows: FlatContentRow[] = (() => {
  const rows: FlatContentRow[] = [];
  for (const { key, defaultsFile } of contentKeys) {
    // Terms of Use / Privacy Notice are large legal document trees already
    // rendered elsewhere in this page — exclude them from the flat table.
    const value =
      key === "footer"
        ? Object.fromEntries(
            Object.entries(content[key] as Record<string, unknown>).filter(
              ([k]) =>
                k !== "termsOfUseContent" && k !== "privacyNoticeContent",
            ),
          )
        : content[key];
    flattenContent(value, key, defaultsFile, rows);
  }
  return rows;
})();

// ---------------------------------------------------------------------------
// Reusable UI pieces
// ---------------------------------------------------------------------------

function SearchField({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <TextField
      size="small"
      placeholder={placeholder ?? "Filter…"}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      slotProps={{
        input: {
          startAdornment: (
            <InputAdornment position="start">
              <SearchRoundedIcon fontSize="small" />
            </InputAdornment>
          ),
        },
      }}
      sx={{ minWidth: 220, maxWidth: 360 }}
    />
  );
}

function ResponsiveTableContainer({ children }: { children: ReactNode }) {
  return (
    <TableContainer
      component={Paper}
      variant="outlined"
      sx={{
        overflowX: "auto",
        width: "100%",
        "& td, & th": { fontSize: { xs: "0.75rem", md: "0.8125rem" } },
        "& td": { whiteSpace: "nowrap" },
        "& th": { whiteSpace: "nowrap", fontWeight: 700 },
      }}
    >
      {children}
    </TableContainer>
  );
}

function SectionAccordion({
  id,
  title,
  description,
  count,
  children,
}: {
  id: string;
  title: string;
  description?: string;
  count?: number;
  children: ReactNode;
}) {
  return (
    <Accordion
      id={id}
      defaultExpanded
      disableGutters
      sx={{
        border: "1px solid",
        borderColor: "divider",
        borderRadius: "24px !important",
        boxShadow: "0 12px 28px rgba(15, 23, 42, 0.06)",
        overflow: "hidden",
        "&:before": { display: "none" },
      }}
    >
      <AccordionSummary
        expandIcon={<ExpandMoreRoundedIcon />}
        sx={{
          px: { xs: 2, md: 3 },
          py: 1,
          backgroundColor: "background.subtle",
          borderBottom: "1px solid",
          borderColor: "divider",
        }}
      >
        <Box>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="h5" component="h2" sx={{ fontWeight: 800 }}>
              {title}
            </Typography>
            {count != null && <Chip label={count} size="small" />}
          </Stack>
          {description && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {description}
            </Typography>
          )}
        </Box>
      </AccordionSummary>
      <AccordionDetails sx={{ p: { xs: 2, md: 3 } }}>
        {children}
      </AccordionDetails>
    </Accordion>
  );
}

const LONG_STRING_THRESHOLD = 200;

function TruncatedString({ value }: { value: string }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = value.length > LONG_STRING_THRESHOLD;
  const display =
    isLong && !expanded ? `${value.slice(0, LONG_STRING_THRESHOLD)}…` : value;

  return (
    <Box>
      <Typography
        component="span"
        sx={{
          // fontFamily: "monospace",
          fontSize: "0.8125rem",
          whiteSpace: "pre-wrap",
        }}
      >
        {display}
      </Typography>
      {isLong && (
        <Link
          component="button"
          type="button"
          underline="hover"
          onClick={() => setExpanded((v) => !v)}
          sx={{ ml: 1, fontSize: "0.75rem", verticalAlign: "baseline" }}
        >
          {expanded ? "Show less" : "Show more"}
        </Link>
      )}
    </Box>
  );
}

function DetailModal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          {title}
        </Typography>
        <IconButton onClick={onClose} size="small">
          <CloseRoundedIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>{children}</DialogContent>
    </Dialog>
  );
}

function FlowStepper({ steps }: { steps: FlowStep[] }) {
  return (
    <Stepper
      orientation="vertical"
      sx={{ "& .MuiStepConnector-line": { minHeight: 16 } }}
    >
      {steps.map((step, idx) => (
        <Step key={idx} active>
          <StepLabel>
            <Typography variant="body2" sx={{ fontWeight: 700 }}>
              {step.label}
            </Typography>
          </StepLabel>
          <StepContent>
            <Typography variant="caption" color="text.secondary">
              {step.description}
            </Typography>
          </StepContent>
        </Step>
      ))}
    </Stepper>
  );
}

// ---------------------------------------------------------------------------
// Page category helpers (for single pages table)
// ---------------------------------------------------------------------------

const categoryOrder = ["application", "resume", "advisor", "internal"];

function getPageCategory(page: { type: string; id: string }): string {
  if (page.type === "internal") return "internal";
  if (page.id === "mock-email-preview") return "internal";
  if (
    page.id.startsWith("advisor") ||
    page.id === "application-edit-confirmation"
  )
    return "advisor";
  if (page.id.startsWith("resume") || page.type === "resume") return "resume";
  return "application";
}

// ---------------------------------------------------------------------------
// Page step / breadcrumb metadata for the pages table
// ---------------------------------------------------------------------------

/** Maps each page ID to its progress step group. */
const pageStepLabel: Partial<Record<string, string>> = {
  home: "N/A",
  membership: "Getting Started",
  eligibility: "Getting Started",
  coverage: "Coverage",
  beneficiary: "Profile",
  contact: "Profile",
  profile: "Profile",
  review: "Review & Sign",
  "health-si": "Review & Sign",
  "health-li": "Review & Sign",
  "health-qd": "Review & Sign",
  "health-di": "Review & Sign",
  "health-cir": "Review & Sign",
  payment: "Review & Sign",
  docusign: "E-sign",
  receipt: "N/A",
  resume: "N/A",
  "resume-method": "N/A",
  "resume-code": "N/A",
  "advisor-login": "N/A",
  "advisor-send-confirmation": "N/A",
  "application-edit-confirmation": "N/A",
  "mock-email-preview": "N/A",
  "information-architecture": "N/A",
  "design-system": "N/A",
};

/** Maps each page ID to its individual breadcrumb label (the page's own nav label in the stepper). */
const pageBreadcrumbLabel: Partial<Record<string, string>> = {
  home: "N/A",
  membership: "Membership",
  eligibility: "Eligibility",
  coverage: "Coverage",
  beneficiary: "Beneficiary",
  contact: "Contact",
  profile: "Profile",
  review: "Review",
  "health-si": "Health",
  "health-li": "Health",
  "health-qd": "Health",
  "health-di": "Health",
  "health-cir": "Health",
  payment: "Payment",
  docusign: "E-sign",
  receipt: "N/A",
  resume: "N/A",
  "resume-method": "N/A",
  "resume-code": "N/A",
  "advisor-login": "N/A",
  "advisor-send-confirmation": "N/A",
  "application-edit-confirmation": "N/A",
  "mock-email-preview": "N/A",
  "information-architecture": "N/A",
  "design-system": "N/A",
};

/**
 * Application flow order for sorting application pages correctly.
 * Non-application pages (resume, advisor, internal) are sorted by category after.
 */
const applicationPageOrder: string[] = [
  "home",
  "membership",
  "eligibility",
  "coverage",
  "beneficiary",
  "contact",
  "profile",
  "review",
  "health-si",
  "health-li",
  "health-qd",
  "health-di",
  "health-cir",
  "payment",
  "docusign",
  "receipt",
];

// ---------------------------------------------------------------------------
// Main page component
// ---------------------------------------------------------------------------

export default function InformationArchitecture() {
  const [pageFilter, setPageFilter] = useState("");
  const [componentFilter, setComponentFilter] = useState("");
  const [fieldFilter, setFieldFilter] = useState("");
  const [configFilter, setConfigFilter] = useState("");
  const [fieldModalId, setFieldModalId] = useState<string | null>(null);
  const [componentModalName, setComponentModalName] = useState<string | null>(
    null,
  );

  const allPagesFlat = useMemo(
    () =>
      pages.map((page) => {
        const id = page.id as PageId;
        // Home uses the hero title from content rather than the generic page title
        const title =
          id === "home" ? "Safeguard your financial future" : getPageTitle(id);
        return {
          id,
          title,
          path: page.path,
          category: getPageCategory(page),
          step: pageStepLabel[id] ?? "N/A",
          breadcrumb: pageBreadcrumbLabel[id] ?? "N/A",
        };
      }),
    [],
  );

  const filteredPages = useMemo(() => {
    const lc = pageFilter.toLowerCase();
    const filtered = lc
      ? allPagesFlat.filter((p) =>
          `${p.id} ${p.title} ${p.category} ${p.path} ${p.step} ${p.breadcrumb}`
            .toLowerCase()
            .includes(lc),
        )
      : allPagesFlat;

    return [...filtered].sort((a, b) => {
      const catA = categoryOrder.indexOf(a.category);
      const catB = categoryOrder.indexOf(b.category);
      if (catA !== catB) return catA - catB;
      // Within application pages, preserve flow order
      if (a.category === "application") {
        const ia = applicationPageOrder.indexOf(a.id);
        const ib = applicationPageOrder.indexOf(b.id);
        return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
      }
      return 0;
    });
  }, [pageFilter, allPagesFlat]);

  const totalPageCount = filteredPages.length;
  const filteredComponents = useMemo(() => {
    if (!componentFilter) return componentsData;
    const lc = componentFilter.toLowerCase();
    return componentsData.filter((c) =>
      `${c.name} ${c.category} ${c.description} ${c.usedIn}`
        .toLowerCase()
        .includes(lc),
    );
  }, [componentFilter]);

  const fieldsByPage = useMemo(() => {
    const result: { pageId: PageId; pageTitle: string; rows: FieldRow[] }[] =
      [];
    for (const pageId of formFlow) {
      if (pagesWithNoFields.has(pageId)) continue;
      const rows = getPageFieldRows(pageId).filter(
        (r) => !isClientSpecificField(r.fieldId),
      );
      if (rows.length > 0)
        result.push({ pageId, pageTitle: getPageTitle(pageId), rows });
    }
    return result;
  }, []);

  const filteredFieldsByPage = useMemo(() => {
    if (!fieldFilter) return fieldsByPage;
    const lc = fieldFilter.toLowerCase();
    return fieldsByPage
      .map((page) => ({
        ...page,
        rows: page.rows.filter((r) =>
          `${r.fieldId} ${r.label} ${r.inputType} ${r.sectionLabel}`
            .toLowerCase()
            .includes(lc),
        ),
      }))
      .filter((page) => page.rows.length > 0);
  }, [fieldFilter, fieldsByPage]);
  const totalFieldCount = useMemo(
    () => filteredFieldsByPage.reduce((sum, p) => sum + p.rows.length, 0),
    [filteredFieldsByPage],
  );
  const filteredConfigs = useMemo(() => {
    if (!configFilter) return configurationsData;
    const lc = configFilter.toLowerCase();
    return configurationsData.filter((c) =>
      `${c.group} ${c.label} ${c.name} ${c.description} ${c.configurable} ${c.usedIn}`
        .toLowerCase()
        .includes(lc),
    );
  }, [configFilter]);

  const selectedField = useMemo(() => {
    if (!fieldModalId) return null;
    const catalogField =
      fieldCatalog[fieldModalId as keyof typeof fieldCatalog];
    if (catalogField) return { ...catalogField, id: fieldModalId };
    for (const page of fieldsByPage) {
      const row = page.rows.find((r) => r.fieldId === fieldModalId);
      if (row)
        return {
          id: fieldModalId,
          label: row.label,
          inputType: row.inputType,
          required: row.required === "Yes",
          options:
            row.options !== "—"
              ? row.options
                  .split(", ")
                  .map((l) => ({ value: l.toLowerCase(), label: l }))
              : undefined,
        };
    }
    return null;
  }, [fieldModalId, fieldsByPage]);

  const selectedComponent = useMemo(() => {
    if (!componentModalName) return null;
    return componentsData.find((c) => c.name === componentModalName) ?? null;
  }, [componentModalName]);

  return (
    <Box
      sx={{
        py: { xs: 3, md: 5 },
        px: { xs: 2, md: 4 },
        width: "100vw",
        maxWidth: "100vw",
        ml: "calc(-50vw + 50%)",
        boxSizing: "border-box",
      }}
    >
      <Stack spacing={3}>
        <Box>
          <Chip
            label="Internal prototype documentation"
            color="error"
            variant="outlined"
            sx={{ mb: 2 }}
          />
          <Typography variant="h3" component="h1" sx={{ fontWeight: 800 }}>
            Application Architecture
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ mt: 1, maxWidth: 920 }}
          >
            A comprehensive map of the application prototype: pages, flow logic,
            reusable components, field catalog, and configuration sources.
            Derived from the active implementation (demo client).
          </Typography>
        </Box>

        <Card
          id="table-of-contents"
          sx={{
            border: "1px solid",
            borderColor: "divider",
            borderRadius: "24px",
            boxShadow: "0 12px 28px rgba(15, 23, 42, 0.06)",
            display: { xs: "block", md: "none" },
          }}
        >
          <CardContent>
            <Typography variant="h6" component="h2" sx={{ fontWeight: 800 }}>
              Table of contents
            </Typography>
            <Stack
              direction="row"
              useFlexGap
              flexWrap="wrap"
              spacing={1}
              sx={{ mt: 2 }}
            >
              {tableOfContents.map((item) => (
                <Chip
                  key={item.id}
                  component="a"
                  href={`#${item.id}`}
                  clickable
                  label={item.label}
                  variant="outlined"
                />
              ))}
            </Stack>
          </CardContent>
        </Card>

        <Box sx={{ display: "flex", gap: 4, alignItems: "flex-start" }}>
          <DocsSidebarNav items={tableOfContents} />
          <Stack spacing={3} sx={{ flex: 1, minWidth: 0 }}>
            {/* 0. CHANGE LOG */}
            <SectionAccordion
              id="changelog-table"
              title="Change Log"
              description="Chronological log of documented changes to the prototype and this document."
              count={changeLog.length}
            >
              <ResponsiveTableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ whiteSpace: "nowrap" }}>ID</TableCell>
                      <TableCell sx={{ whiteSpace: "nowrap" }}>Date</TableCell>
                      <TableCell sx={{ whiteSpace: "nowrap" }}>Area</TableCell>
                      <TableCell>Summary</TableCell>
                      <TableCell sx={{ minWidth: 340 }}>Details</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {changeLog.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell
                          sx={{
                            verticalAlign: "top",
                            fontWeight: 700,
                            whiteSpace: "nowrap",
                          }}
                        >
                          {entry.id}
                        </TableCell>
                        <TableCell
                          sx={{
                            verticalAlign: "top",
                            whiteSpace: "nowrap",
                            color: "text.secondary",
                          }}
                        >
                          {entry.date}
                        </TableCell>
                        <TableCell
                          sx={{ verticalAlign: "top", whiteSpace: "nowrap" }}
                        >
                          {entry.area}
                        </TableCell>
                        <TableCell
                          sx={{
                            verticalAlign: "top",
                            whiteSpace: "normal !important",
                            fontWeight: 600,
                            fontSize: "0.8125rem",
                            minWidth: 220,
                          }}
                        >
                          {entry.summary}
                        </TableCell>
                        <TableCell
                          sx={{
                            verticalAlign: "top",
                            whiteSpace: "normal !important",
                            fontSize: "0.8125rem",
                            color: "text.secondary",
                          }}
                        >
                          {entry.details}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ResponsiveTableContainer>
            </SectionAccordion>

            {/* 1. PAGES */}
            <SectionAccordion
              id="pages-table"
              title="Pages"
              description="All registered pages ordered by category: application, resume, advisor, internal."
              count={totalPageCount}
            >
              <Stack spacing={2}>
                <SearchField
                  value={pageFilter}
                  onChange={setPageFilter}
                  placeholder="Filter pages…"
                />
                <ResponsiveTableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Category</TableCell>
                        <TableCell>Page</TableCell>
                        <TableCell>Title</TableCell>
                        <TableCell>Step</TableCell>
                        <TableCell>Breadcrumb</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredPages.map((page, i) => {
                        const showCategory =
                          i === 0 ||
                          filteredPages[i - 1].category !== page.category;
                        return (
                          <TableRow key={page.id}>
                            <TableCell
                              sx={{
                                verticalAlign: "top",
                                fontWeight: 600,
                                fontSize: "0.8125rem",
                                color: showCategory
                                  ? "text.primary"
                                  : "transparent",
                                borderTop:
                                  showCategory && i !== 0
                                    ? "2px solid"
                                    : undefined,
                                borderTopColor:
                                  showCategory && i !== 0
                                    ? "divider"
                                    : undefined,
                                whiteSpace: "nowrap",
                                textTransform: "capitalize",
                              }}
                            >
                              {page.category}
                            </TableCell>
                            <TableCell
                              sx={{
                                borderTop:
                                  showCategory && i !== 0
                                    ? "2px solid"
                                    : undefined,
                                borderTopColor:
                                  showCategory && i !== 0
                                    ? "divider"
                                    : undefined,
                                whiteSpace: "nowrap",
                              }}
                            >
                              <Link href={page.path} sx={{ fontWeight: 700 }}>
                                {page.id}
                              </Link>
                            </TableCell>
                            <TableCell
                              sx={{
                                whiteSpace: "normal !important",
                                maxWidth: 260,
                              }}
                            >
                              {page.title}
                            </TableCell>
                            <TableCell sx={{ whiteSpace: "nowrap" }}>
                              {page.step}
                            </TableCell>
                            <TableCell sx={{ whiteSpace: "nowrap" }}>
                              {page.breadcrumb}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </ResponsiveTableContainer>
              </Stack>
            </SectionAccordion>

            {/* 2. FLOWS */}
            <SectionAccordion
              id="flows-table"
              title="Flows"
              description="Application flow sequences for different user journeys and system behaviors."
            >
              <Stack spacing={3}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>
                    Consumer Application Flow
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 2 }}
                  >
                    The consumer flow begins at the Landing Page and follows the
                    resolved sequence. Page inclusion is determined by client
                    configuration, applicant data, selected coverage,
                    underwriting requirements, and enabled riders.
                  </Typography>
                  <FlowStepper steps={consumerFlow} />
                </Box>
                <Divider />
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>
                    Advisor-Assisted Flow
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 2 }}
                  >
                    The advisor completes the application through Profile and
                    transfers it to the applicant for review and final
                    completion. Only one actor may access the application at a
                    time.
                  </Typography>
                  <FlowStepper steps={advisorFlow} />
                </Box>
                <Divider />
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>
                    Resume &amp; Verification Flow
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 2 }}
                  >
                    Restores an incomplete application through an email-based
                    secure link and phone verification code.
                  </Typography>
                  <FlowStepper steps={resumeFlow} />
                </Box>
                <Divider />
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>
                    Autosave &amp; Persistence Flow
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 2 }}
                  >
                    Autosave begins after successful Membership submission.
                    Field-level saving by external underwriting experiences is
                    outside Portal autosave scope.
                  </Typography>
                  <FlowStepper steps={autosaveFlow} />
                </Box>
                <Divider />
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>
                    Quote Flow
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 2 }}
                  >
                    Available through configured entry points (drawer/modal, not
                    a standalone page). Collects minimum information to
                    determine available products and estimated premiums.
                  </Typography>
                  <FlowStepper steps={quoteFlow} />
                </Box>
                <Divider />
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>
                    TPA Member Verification Flow
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 2 }}
                  >
                    Triggered when eligibility data matches a TPA member record.
                    The applicant completes identity verification before
                    proceeding to Coverage, where their existing coverage
                    portfolio is available.
                  </Typography>
                  <FlowStepper steps={tpaVerificationFlow} />
                </Box>
                <Divider />
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>
                    Health Routing
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 2 }}
                  >
                    Health pages are displayed conditionally based on selected
                    products and underwriting types. Multiple health pages may
                    apply in a single application flow. Pages marked ⚠️ are not
                    yet implemented in the prototype.
                  </Typography>
                  <Stack spacing={1}>
                    {[
                      {
                        condition: "LI (SI) or DI (SI) selected",
                        page: "SI",
                        purpose: "Simplified Issue health questions",
                        implemented: true,
                      },
                      {
                        condition: "WL (SI + UW) selected",
                        page: "WAEPAWL",
                        purpose: "Whole Life health questions",
                        implemented: false,
                      },
                      {
                        condition: "LI (UW), DI (UW), or OO (UW) selected",
                        page: "TELE SUPP",
                        purpose: "Tele-Supplemental health questions",
                        implemented: true,
                      },
                      {
                        condition: "CI product selected",
                        page: "CI",
                        purpose: "Critical Illness health questions",
                        implemented: false,
                      },
                      {
                        condition: "LI (UW) + CIR, or CIR standalone",
                        page: "UW CIR",
                        purpose: "Chronic Illness Rider health questions",
                        implemented: true,
                      },
                      {
                        condition: "LI (QD) and/or DI (QD) selected",
                        page: "QD LI / QD DI / QD LI+DI",
                        purpose:
                          "Magnum QuickDecision (LI/DI/LI+DI) health questions",
                        implemented: true,
                      },
                      {
                        condition: "LI (QD) + CIR selected",
                        page: "QD CIR",
                        purpose:
                          "Magnum Chronic Illness Rider health questions",
                        implemented: false,
                      },
                      {
                        condition: "LI (QD) + DI (UW) selected",
                        page: "DI SUPP",
                        purpose: "Supplemental Disability health questions",
                        implemented: false,
                      },
                    ].map((item) => (
                      <Paper
                        key={item.page}
                        variant="outlined"
                        sx={{
                          px: 2,
                          py: 1.5,
                          display: "grid",
                          gridTemplateColumns: "180px 24px 1fr",
                          alignItems: "center",
                          gap: 1,
                        }}
                      >
                        <Box>
                          <Chip
                            label={item.page}
                            size="small"
                            sx={{ fontWeight: 700, whiteSpace: "nowrap" }}
                          />
                        </Box>
                        <ArrowForwardRoundedIcon
                          fontSize="small"
                          color="action"
                        />
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {item.condition}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {item.purpose}
                            {!item.implemented && " ⚠️ Not yet implemented"}
                          </Typography>
                        </Box>
                      </Paper>
                    ))}
                  </Stack>
                </Box>
              </Stack>
            </SectionAccordion>

            {/* 3. COMPONENTS */}
            <SectionAccordion
              id="components-table"
              title="Components"
              description="Reusable UI components with their category, usage locations, and source paths."
              count={filteredComponents.length}
            >
              <Stack spacing={2}>
                <SearchField
                  value={componentFilter}
                  onChange={setComponentFilter}
                  placeholder="Filter components…"
                />
                <ResponsiveTableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Component</TableCell>
                        <TableCell>Category</TableCell>
                        <TableCell>Description</TableCell>
                        <TableCell>Used in</TableCell>
                        <TableCell>Source</TableCell>
                        <TableCell>Storybook</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredComponents.map((comp) => (
                        <TableRow key={comp.name}>
                          <TableCell>
                            <Link
                              component="button"
                              variant="body2"
                              sx={{ fontWeight: 700, textAlign: "left" }}
                              onClick={() => setComponentModalName(comp.name)}
                            >
                              {comp.name}
                            </Link>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={comp.category}
                              size="small"
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell
                            sx={{
                              whiteSpace: "normal !important",
                              maxWidth: 300,
                            }}
                          >
                            {comp.description}
                          </TableCell>
                          <TableCell
                            sx={{
                              whiteSpace: "normal !important",
                              maxWidth: 200,
                            }}
                          >
                            {comp.usedIn}
                          </TableCell>
                          <TableCell>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {comp.sourcePath}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Link
                              href={comp.storybookLink}
                              target="_blank"
                              rel="noopener"
                            >
                              Story
                            </Link>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ResponsiveTableContainer>
              </Stack>
            </SectionAccordion>

            {/* 4. FIELDS */}
            <SectionAccordion
              id="fields-table"
              title="Fields"
              description="Field inventory grouped by page/section (demo client). Excludes client-specific fields and pages with no interactive fields."
              count={totalFieldCount}
            >
              <Stack spacing={2}>
                <SearchField
                  value={fieldFilter}
                  onChange={setFieldFilter}
                  placeholder="Filter fields…"
                />
                {filteredFieldsByPage.map((page) => (
                  <Accordion
                    key={page.pageId}
                    defaultExpanded
                    disableGutters
                    variant="outlined"
                    sx={{
                      borderRadius: "16px !important",
                      overflow: "hidden",
                      "&:before": { display: "none" },
                    }}
                  >
                    <AccordionSummary expandIcon={<ExpandMoreRoundedIcon />}>
                      <Box>
                        <Typography sx={{ fontWeight: 700 }}>
                          {page.pageTitle}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {page.pageId} · {page.rows.length} fields
                        </Typography>
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails sx={{ pt: 0 }}>
                      <ResponsiveTableContainer>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>Section</TableCell>
                              <TableCell>Applicant</TableCell>
                              <TableCell>Field ID</TableCell>
                              <TableCell>Label</TableCell>
                              <TableCell>Type</TableCell>
                              <TableCell>Required</TableCell>
                              <TableCell sx={{ minWidth: 300 }}>
                                Options
                              </TableCell>
                              <TableCell>Visible when</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {page.rows.map((row, index) => (
                              <TableRow
                                key={`${page.pageId}-${row.sectionId}-${row.fieldId}-${index}`}
                              >
                                <TableCell>{row.sectionLabel}</TableCell>
                                <TableCell>{row.applicant}</TableCell>
                                <TableCell>
                                  {row.fieldId !== "—" ? (
                                    <Link
                                      component="button"
                                      variant="body2"
                                      sx={{
                                        fontWeight: 700,
                                        textAlign: "left",
                                      }}
                                      onClick={() =>
                                        setFieldModalId(row.fieldId)
                                      }
                                    >
                                      {row.fieldId}
                                    </Link>
                                  ) : (
                                    "—"
                                  )}
                                </TableCell>
                                <TableCell
                                  sx={{
                                    whiteSpace: "normal !important",
                                    maxWidth: 300,
                                  }}
                                >
                                  {row.label}
                                </TableCell>
                                <TableCell>{row.inputType}</TableCell>
                                <TableCell>{row.required}</TableCell>
                                <TableCell
                                  sx={{
                                    whiteSpace: "normal !important",
                                    minWidth: 300,
                                  }}
                                >
                                  {row.options}
                                </TableCell>
                                <TableCell
                                  sx={{
                                    whiteSpace: "normal !important",
                                    maxWidth: 260,
                                  }}
                                >
                                  {row.visibleWhen}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </ResponsiveTableContainer>
                    </AccordionDetails>
                  </Accordion>
                ))}
              </Stack>
            </SectionAccordion>

            {/* 5. ERROR MESSAGES */}
            <SectionAccordion
              id="error-messages-table"
              title="Error Messages"
              description="All error copy in the app, split into a Page-level table (banners/alerts/dialogs) and a Field-level table (inline field errors). Rows in each table are ordered by the page they belong to, in the order that page is encountered in the app."
              count={errorMessages.length}
            >
              {(() => {
                const pageOrderIndex: Record<string, number> = {};
                errorMessagePageOrder.forEach((p, i) => {
                  pageOrderIndex[p.key] = i;
                });
                const pageLabel: Record<string, string> = {};
                errorMessagePageOrder.forEach((p) => {
                  pageLabel[p.key] = p.label;
                });

                const orderedRowsForLevel = (level: "Page" | "Field") =>
                  errorMessages
                    .map((e, originalIndex) => ({ ...e, originalIndex }))
                    .filter((e) => e.level === level)
                    .sort(
                      (a, b) =>
                        pageOrderIndex[a.page] - pageOrderIndex[b.page] ||
                        a.originalIndex - b.originalIndex,
                    );

                const renderTable = (
                  title: string,
                  level: "Page" | "Field",
                ) => {
                  const rows = orderedRowsForLevel(level);
                  return (
                    <Box>
                      <Stack
                        direction="row"
                        spacing={1}
                        alignItems="center"
                        sx={{ mb: 1.5 }}
                      >
                        <Typography variant="h6" sx={{ fontWeight: 800 }}>
                          {title}
                        </Typography>
                        <Chip label={rows.length} size="small" />
                      </Stack>
                      <ResponsiveTableContainer>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell sx={{ whiteSpace: "nowrap" }}>
                                Page
                              </TableCell>
                              <TableCell sx={{ minWidth: 300 }}>
                                Trigger
                              </TableCell>
                              <TableCell sx={{ minWidth: 240 }}>
                                Message
                              </TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {rows.map((row, i) => {
                              const showPage =
                                i === 0 || rows[i - 1].page !== row.page;
                              return (
                                <TableRow key={i}>
                                  <TableCell
                                    sx={{
                                      verticalAlign: "top",
                                      fontWeight: 700,
                                      fontSize: "0.8125rem",
                                      whiteSpace: "nowrap",
                                      color: showPage
                                        ? "text.primary"
                                        : "transparent",
                                      borderTop:
                                        showPage && i !== 0
                                          ? "2px solid"
                                          : undefined,
                                      borderTopColor:
                                        showPage && i !== 0
                                          ? "divider"
                                          : undefined,
                                    }}
                                  >
                                    {pageLabel[row.page]}
                                  </TableCell>
                                  <TableCell
                                    sx={{
                                      verticalAlign: "top",
                                      fontSize: "0.8125rem",
                                      whiteSpace: "normal !important",
                                      borderTop:
                                        showPage && i !== 0
                                          ? "2px solid"
                                          : undefined,
                                      borderTopColor:
                                        showPage && i !== 0
                                          ? "divider"
                                          : undefined,
                                    }}
                                  >
                                    {row.trigger}
                                  </TableCell>
                                  <TableCell
                                    sx={{
                                      verticalAlign: "top",
                                      fontWeight: 600,
                                      fontSize: "0.8125rem",
                                      whiteSpace: "normal !important",
                                      borderTop:
                                        showPage && i !== 0
                                          ? "2px solid"
                                          : undefined,
                                      borderTopColor:
                                        showPage && i !== 0
                                          ? "divider"
                                          : undefined,
                                    }}
                                  >
                                    {row.message}
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </ResponsiveTableContainer>
                    </Box>
                  );
                };

                return (
                  <Stack spacing={3}>
                    {renderTable("Page-level errors", "Page")}
                    {renderTable("Field-level errors", "Field")}
                  </Stack>
                );
              })()}
            </SectionAccordion>

            {/* 6. CONFIGURATIONS */}
            <SectionAccordion
              id="configurations-table"
              title="Configurations"
              description="Client and global configuration options organized by area."
              count={filteredConfigs.length}
            >
              <Stack spacing={2}>
                <SearchField
                  value={configFilter}
                  onChange={setConfigFilter}
                  placeholder="Filter configurations…"
                />
                {filteredConfigs.length === 0 ? (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ py: 2 }}
                  >
                    No configurations match the current filter.
                  </Typography>
                ) : (
                  <ResponsiveTableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ minWidth: 160 }}>Group</TableCell>
                          <TableCell sx={{ minWidth: 180 }}>
                            Configuration
                          </TableCell>
                          <TableCell sx={{ minWidth: 260 }}>
                            Description
                          </TableCell>
                          <TableCell sx={{ minWidth: 200 }}>Source</TableCell>
                          <TableCell sx={{ minWidth: 160 }}>
                            Configurability
                          </TableCell>
                          <TableCell sx={{ minWidth: 160 }}>Used in</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {filteredConfigs.map((config, i) => {
                          const showGroup =
                            i === 0 ||
                            filteredConfigs[i - 1].group !== config.group;
                          return (
                            <TableRow key={config.label + config.name}>
                              <TableCell
                                sx={{
                                  verticalAlign: "top",
                                  color: showGroup
                                    ? "text.primary"
                                    : "transparent",
                                  fontWeight: 600,
                                  fontSize: "0.8125rem",
                                  whiteSpace: "normal",
                                  borderTop:
                                    showGroup && i !== 0
                                      ? "2px solid"
                                      : undefined,
                                  borderTopColor:
                                    showGroup && i !== 0
                                      ? "divider"
                                      : undefined,
                                }}
                              >
                                {config.group}
                              </TableCell>
                              <TableCell
                                sx={{
                                  verticalAlign: "top",
                                  borderTop:
                                    showGroup && i !== 0
                                      ? "2px solid"
                                      : undefined,
                                  borderTopColor:
                                    showGroup && i !== 0
                                      ? "divider"
                                      : undefined,
                                }}
                              >
                                <Typography
                                  variant="body2"
                                  sx={{ fontWeight: 700, lineHeight: 1.4 }}
                                >
                                  {config.label}
                                </Typography>
                                <Typography
                                  variant="caption"
                                  color="text.disabled"
                                  sx={{
                                    fontFamily: "monospace",
                                    display: "block",
                                    mt: 0.25,
                                    lineHeight: 1.4,
                                    whiteSpace: "normal",
                                  }}
                                >
                                  {config.name}
                                </Typography>
                              </TableCell>
                              <TableCell
                                sx={{
                                  whiteSpace: "normal !important",
                                  verticalAlign: "top",
                                  borderTop:
                                    showGroup && i !== 0
                                      ? "2px solid"
                                      : undefined,
                                  borderTopColor:
                                    showGroup && i !== 0
                                      ? "divider"
                                      : undefined,
                                }}
                              >
                                {config.description}
                              </TableCell>
                              <TableCell
                                sx={{
                                  verticalAlign: "top",
                                  borderTop:
                                    showGroup && i !== 0
                                      ? "2px solid"
                                      : undefined,
                                  borderTopColor:
                                    showGroup && i !== 0
                                      ? "divider"
                                      : undefined,
                                }}
                              >
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                  sx={{
                                    fontFamily: "monospace",
                                    whiteSpace: "normal",
                                    display: "block",
                                  }}
                                >
                                  {config.sourcePath}
                                </Typography>
                              </TableCell>
                              <TableCell
                                sx={{
                                  whiteSpace: "normal !important",
                                  verticalAlign: "top",
                                  borderTop:
                                    showGroup && i !== 0
                                      ? "2px solid"
                                      : undefined,
                                  borderTopColor:
                                    showGroup && i !== 0
                                      ? "divider"
                                      : undefined,
                                }}
                              >
                                {config.configurable}
                              </TableCell>
                              <TableCell
                                sx={{
                                  whiteSpace: "normal !important",
                                  verticalAlign: "top",
                                  borderTop:
                                    showGroup && i !== 0
                                      ? "2px solid"
                                      : undefined,
                                  borderTopColor:
                                    showGroup && i !== 0
                                      ? "divider"
                                      : undefined,
                                }}
                              >
                                {config.usedIn}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </ResponsiveTableContainer>
                )}
              </Stack>
            </SectionAccordion>

            {/* ---------------------------------------------------------------- */}
            {/* Content model                                                     */}
            {/* ---------------------------------------------------------------- */}
            <SectionAccordion
              id="content-table"
              title="Content"
              description="Flattened entries from the site content model (src/content/types.ts → SiteContent), resolved by getContent() as client overrides merged over shared defaults. Each row is one leaf value, addressed by its full dot-notation key path."
              count={flatContentRows.length}
            >
              <ResponsiveTableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ minWidth: 260, fontWeight: 600 }}>
                        Key path
                      </TableCell>
                      <TableCell sx={{ minWidth: 360, fontWeight: 600 }}>
                        Value
                      </TableCell>
                      <TableCell sx={{ minWidth: 220, fontWeight: 600 }}>
                        Defaults file
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {flatContentRows.map((row) => (
                      <TableRow key={row.path}>
                        <TableCell
                          sx={{
                            verticalAlign: "top",
                            fontFamily: "monospace",
                            fontSize: "0.75rem",
                            // fontWeight: 700,
                            whiteSpace: "normal !important",
                          }}
                        >
                          {row.path}
                        </TableCell>
                        <TableCell
                          sx={{
                            verticalAlign: "top",
                            fontSize: "0.8125rem",
                            whiteSpace: "normal !important",
                          }}
                        >
                          {row.value !== null ? (
                            <TruncatedString value={row.value} />
                          ) : (
                            <Typography
                              variant="caption"
                              color="text.disabled"
                              sx={{ fontStyle: "italic" }}
                            >
                              [non-text]
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell
                          sx={{
                            verticalAlign: "top",
                            fontFamily: "monospace",
                            fontSize: "0.75rem",
                            color: "text.secondary",
                            whiteSpace: "normal !important",
                          }}
                        >
                          {row.defaultsFile}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ResponsiveTableContainer>
            </SectionAccordion>

            {/* ---------------------------------------------------------------- */}
            {/* Site Rules & Functionality                                        */}
            {/* ---------------------------------------------------------------- */}
            <SectionAccordion
              id="site-rules-table"
              title="Site Rules"
              description="Functional rules derived from the prototype implementation, describing how the new template works. These are not product eligibility or underwriting rules."
              count={siteRules.length}
            >
              {(() => {
                const ruleGroupOrder: string[] = [];
                const ruleGrouped: Record<string, typeof siteRules> = {};
                for (const r of siteRules) {
                  if (!ruleGrouped[r.area]) {
                    ruleGroupOrder.push(r.area);
                    ruleGrouped[r.area] = [];
                  }
                  ruleGrouped[r.area].push(r);
                }
                return (
                  <Stack spacing={1.5}>
                    {ruleGroupOrder.map((area) => (
                      <Accordion
                        key={area}
                        defaultExpanded
                        disableGutters
                        sx={{
                          border: "1px solid",
                          borderColor: "divider",
                          borderRadius: "12px !important",
                          overflow: "hidden",
                          boxShadow: "none",
                          "&:before": { display: "none" },
                        }}
                      >
                        <AccordionSummary
                          expandIcon={<ExpandMoreRoundedIcon />}
                          sx={{
                            px: 2,
                            py: 0.75,
                            minHeight: 44,
                            backgroundColor: "background.subtle",
                            borderBottom: "1px solid",
                            borderColor: "divider",
                          }}
                        >
                          <Stack
                            direction="row"
                            spacing={1}
                            alignItems="center"
                          >
                            <Typography
                              variant="subtitle2"
                              sx={{ fontWeight: 700 }}
                            >
                              {area}
                            </Typography>
                            <Chip
                              label={ruleGrouped[area].length}
                              size="small"
                              sx={{ height: 18, fontSize: "0.7rem" }}
                            />
                          </Stack>
                        </AccordionSummary>
                        <AccordionDetails sx={{ p: 0 }}>
                          <ResponsiveTableContainer>
                            <Table size="small">
                              <TableHead>
                                <TableRow>
                                  <TableCell sx={{ minWidth: 180 }}>
                                    Rule
                                  </TableCell>
                                  <TableCell sx={{ minWidth: 300 }}>
                                    Behavior
                                  </TableCell>
                                  <TableCell sx={{ minWidth: 220 }}>
                                    Implementation Reference
                                  </TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {ruleGrouped[area].map((row, i) => (
                                  <TableRow key={i}>
                                    <TableCell
                                      sx={{
                                        verticalAlign: "top",
                                        fontWeight: 600,
                                        fontSize: "0.8125rem",
                                      }}
                                    >
                                      {row.rule}
                                    </TableCell>
                                    <TableCell
                                      sx={{
                                        verticalAlign: "top",
                                        fontSize: "0.8125rem",
                                        whiteSpace: "normal !important",
                                      }}
                                    >
                                      {row.behavior}
                                    </TableCell>
                                    <TableCell sx={{ verticalAlign: "top" }}>
                                      <Typography
                                        variant="caption"
                                        color="text.secondary"
                                        sx={{
                                          fontFamily: "monospace",
                                          whiteSpace: "pre-wrap",
                                          display: "block",
                                        }}
                                      >
                                        {row.ref}
                                      </Typography>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </ResponsiveTableContainer>
                        </AccordionDetails>
                      </Accordion>
                    ))}
                  </Stack>
                );
              })()}
            </SectionAccordion>

            {/* ---------------------------------------------------------------- */}
            {/* Current → New Template Changes                                   */}
            {/* ---------------------------------------------------------------- */}
            <SectionAccordion
              id="template-changes-table"
              title="Template Changes"
              description="User-facing and functional changes from the existing Portal template to the redesigned template. Client-specific differences still need to be preserved during migration unless explicitly retired or converted to supported configuration."
              count={templateChanges.length}
            >
              <ResponsiveTableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600, whiteSpace: "nowrap" }}>
                        Change
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>
                        Current Template
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>
                        New Template
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {templateChanges.map((row, i) => (
                      <TableRow key={i}>
                        <TableCell
                          sx={{
                            verticalAlign: "top",
                            whiteSpace: "nowrap",
                            color: "text.secondary",
                            fontSize: "0.8125rem",
                          }}
                        >
                          {row.area}
                        </TableCell>
                        <TableCell
                          sx={{
                            verticalAlign: "top",
                            fontSize: "0.8125rem",
                            whiteSpace: "normal !important",
                          }}
                        >
                          {row.current}
                        </TableCell>
                        <TableCell
                          sx={{
                            verticalAlign: "top",
                            fontSize: "0.8125rem",
                            whiteSpace: "normal !important",
                          }}
                        >
                          {row.next}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ResponsiveTableContainer>
            </SectionAccordion>

            {/* ---------------------------------------------------------------- */}
            {/* URL Parameters                                                    */}
            {/* ---------------------------------------------------------------- */}
            <SectionAccordion
              id="url-parameters-table"
              title="URL Parameters"
              description="Tracks URL parameters from the current Portal site template and whether each is migrated, modified, removed, or still TBD in the new site template, along with the expected new-template behavior and implementation rules. Source: New Site Template URL Parameter Specification."
              count={urlParameters.length + urlParametersAdditional.length}
            >
              <Stack spacing={3}>
                <Stack
                  direction="row"
                  useFlexGap
                  flexWrap="wrap"
                  spacing={1}
                  alignItems="center"
                >
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ fontWeight: 600, mr: 0.5 }}
                  >
                    Status:
                  </Typography>
                  {(
                    Object.keys(urlParamStatusColor) as UrlParamStatus[]
                  ).map((status) => (
                    <Chip
                      key={status}
                      label={status}
                      size="small"
                      color={urlParamStatusColor[status]}
                      variant="outlined"
                    />
                  ))}
                </Stack>

                <Box>
                  <Stack
                    direction="row"
                    spacing={1}
                    alignItems="center"
                    sx={{ mb: 1.5 }}
                  >
                    <Typography variant="h6" sx={{ fontWeight: 800 }}>
                      Parameter Requirements
                    </Typography>
                    <Chip label={urlParameters.length} size="small" />
                  </Stack>
                  <ResponsiveTableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ minWidth: 140 }}>
                            Parameter
                          </TableCell>
                          <TableCell sx={{ minWidth: 100 }}>Status</TableCell>
                          <TableCell sx={{ minWidth: 280 }}>
                            Current Template
                          </TableCell>
                          <TableCell sx={{ minWidth: 300 }}>
                            New Template
                          </TableCell>
                          <TableCell sx={{ minWidth: 220 }}>
                            Notes / Rules
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {urlParameters.map((row) => (
                          <TableRow key={row.parameter}>
                            <TableCell
                              sx={{
                                verticalAlign: "top",
                                fontFamily: "monospace",
                                fontWeight: 700,
                                fontSize: "0.8125rem",
                                whiteSpace: "normal !important",
                              }}
                            >
                              {row.parameter}
                            </TableCell>
                            <TableCell sx={{ verticalAlign: "top" }}>
                              <Chip
                                label={row.status}
                                size="small"
                                color={urlParamStatusColor[row.status]}
                                sx={{ height: 20, fontSize: "0.7rem" }}
                              />
                            </TableCell>
                            <TableCell
                              sx={{
                                verticalAlign: "top",
                                fontSize: "0.8125rem",
                                whiteSpace: "normal !important",
                              }}
                            >
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{
                                  fontFamily: "monospace",
                                  display: "block",
                                  mb: 0.5,
                                }}
                              >
                                {row.currentValues.join(", ")}
                              </Typography>
                              {row.currentBehavior.map((line, i) => (
                                <Typography
                                  key={i}
                                  variant="body2"
                                  sx={{ fontSize: "0.8125rem", mb: 0.5 }}
                                >
                                  {line}
                                </Typography>
                              ))}
                            </TableCell>
                            <TableCell
                              sx={{
                                verticalAlign: "top",
                                fontSize: "0.8125rem",
                                whiteSpace: "normal !important",
                              }}
                            >
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{
                                  fontFamily: "monospace",
                                  display: "block",
                                  mb: 0.5,
                                }}
                              >
                                {row.newValues.join(", ")}
                              </Typography>
                              {row.newBehavior.map((line, i) => (
                                <Typography
                                  key={i}
                                  variant="body2"
                                  sx={{ fontSize: "0.8125rem", mb: 0.5 }}
                                >
                                  {line}
                                </Typography>
                              ))}
                            </TableCell>
                            <TableCell
                              sx={{
                                verticalAlign: "top",
                                fontSize: "0.8125rem",
                                whiteSpace: "normal !important",
                                color: "text.secondary",
                              }}
                            >
                              {row.notes}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ResponsiveTableContainer>
                </Box>

                <Box>
                  <Stack
                    direction="row"
                    spacing={1}
                    alignItems="center"
                    sx={{ mb: 1.5 }}
                  >
                    <Typography variant="h6" sx={{ fontWeight: 800 }}>
                      Additional Parameters Identified in New Template Source
                    </Typography>
                    <Chip label={urlParametersAdditional.length} size="small" />
                  </Stack>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 1.5 }}
                  >
                    These parameters were identified during review of the
                    new-template source and were not present in the
                    current-template parameter inventory above. Their
                    inclusion documents existing prototype/source behavior; it
                    does not by itself designate prototype/development-only
                    parameters as production requirements.
                  </Typography>
                  <ResponsiveTableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ minWidth: 120 }}>
                            Parameter
                          </TableCell>
                          <TableCell sx={{ minWidth: 160 }}>Status</TableCell>
                          <TableCell sx={{ minWidth: 300 }}>
                            New Value(s) / Format &amp; Behavior
                          </TableCell>
                          <TableCell sx={{ minWidth: 200 }}>
                            Notes / Rules
                          </TableCell>
                          <TableCell sx={{ minWidth: 200 }}>
                            Source Reference
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {urlParametersAdditional.map((row) => (
                          <TableRow key={row.parameter}>
                            <TableCell
                              sx={{
                                verticalAlign: "top",
                                fontFamily: "monospace",
                                fontWeight: 700,
                                fontSize: "0.8125rem",
                                whiteSpace: "normal !important",
                              }}
                            >
                              {row.parameter}
                            </TableCell>
                            <TableCell
                              sx={{
                                verticalAlign: "top",
                                fontSize: "0.75rem",
                                whiteSpace: "normal !important",
                              }}
                            >
                              <Chip
                                label={row.status}
                                size="small"
                                color={
                                  urlParamStatusColor[
                                    row.status.split(" —")[0] as UrlParamStatus
                                  ] ?? "primary"
                                }
                                sx={{ height: 20, fontSize: "0.7rem", mb: 0.5 }}
                              />
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{ display: "block" }}
                              >
                                {row.currentTemplate}
                              </Typography>
                            </TableCell>
                            <TableCell
                              sx={{
                                verticalAlign: "top",
                                fontSize: "0.8125rem",
                                whiteSpace: "normal !important",
                              }}
                            >
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{
                                  fontFamily: "monospace",
                                  display: "block",
                                  mb: 0.5,
                                }}
                              >
                                {row.newValues.join(", ")}
                              </Typography>
                              {row.newBehavior.map((line, i) => (
                                <Typography
                                  key={i}
                                  variant="body2"
                                  sx={{ fontSize: "0.8125rem", mb: 0.5 }}
                                >
                                  {line}
                                </Typography>
                              ))}
                            </TableCell>
                            <TableCell
                              sx={{
                                verticalAlign: "top",
                                fontSize: "0.8125rem",
                                whiteSpace: "normal !important",
                                color: "text.secondary",
                              }}
                            >
                              {row.notes}
                            </TableCell>
                            <TableCell sx={{ verticalAlign: "top" }}>
                              {row.sourceRefs.map((ref) => (
                                <Typography
                                  key={ref}
                                  variant="caption"
                                  color="text.secondary"
                                  sx={{
                                    fontFamily: "monospace",
                                    whiteSpace: "pre-wrap",
                                    display: "block",
                                  }}
                                >
                                  {ref}
                                </Typography>
                              ))}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ResponsiveTableContainer>
                </Box>

                <Box>
                  <Stack
                    direction="row"
                    spacing={1}
                    alignItems="center"
                    sx={{ mb: 1.5 }}
                  >
                    <Typography variant="h6" sx={{ fontWeight: 800 }}>
                      Source Review Summary
                    </Typography>
                    <Chip
                      label={urlParameterSourceSummary.length}
                      size="small"
                    />
                  </Stack>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 1.5 }}
                  >
                    The new-template source currently contains the following
                    additional query parameters beyond the migrated/current-template
                    inventory.
                  </Typography>
                  <ResponsiveTableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ minWidth: 120 }}>
                            Parameter
                          </TableCell>
                          <TableCell sx={{ minWidth: 260 }}>
                            Source Classification
                          </TableCell>
                          <TableCell sx={{ minWidth: 260 }}>
                            Production Requirement Status
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {urlParameterSourceSummary.map((row) => (
                          <TableRow key={row.parameter}>
                            <TableCell
                              sx={{
                                verticalAlign: "top",
                                fontFamily: "monospace",
                                fontWeight: 700,
                                fontSize: "0.8125rem",
                              }}
                            >
                              {row.parameter}
                            </TableCell>
                            <TableCell
                              sx={{
                                verticalAlign: "top",
                                fontSize: "0.8125rem",
                                whiteSpace: "normal !important",
                              }}
                            >
                              {row.classification}
                            </TableCell>
                            <TableCell
                              sx={{
                                verticalAlign: "top",
                                fontSize: "0.8125rem",
                                whiteSpace: "normal !important",
                              }}
                            >
                              {row.productionStatus}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ResponsiveTableContainer>
                </Box>
              </Stack>
            </SectionAccordion>
          </Stack>
        </Box>
      </Stack>

      {/* Field detail modal */}
      <DetailModal
        open={!!fieldModalId}
        onClose={() => setFieldModalId(null)}
        title={fieldModalId ?? ""}
      >
        {selectedField ? (
          <Stack spacing={2}>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Label
              </Typography>
              <Typography>{selectedField.label}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Input type
              </Typography>
              <Typography>{selectedField.inputType}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Required
              </Typography>
              <Typography>{selectedField.required ? "Yes" : "No"}</Typography>
            </Box>
            {selectedField.options &&
              (Array.isArray(selectedField.options)
                ? selectedField.options
                : []
              ).length > 0 && (
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Options
                  </Typography>
                  <Stack
                    direction="row"
                    flexWrap="wrap"
                    gap={0.5}
                    sx={{ mt: 0.5 }}
                  >
                    {(Array.isArray(selectedField.options)
                      ? selectedField.options
                      : []
                    ).map((opt: { label: string; value: string }) => (
                      <Chip
                        key={opt.value}
                        label={opt.label}
                        size="small"
                        variant="outlined"
                      />
                    ))}
                  </Stack>
                </Box>
              )}
            {fieldModalId && clientConfiguredFields.has(fieldModalId) && (
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Visibility
                </Typography>
                <Typography color="warning.main">
                  Client-configured — only shown if client enables this field
                </Typography>
              </Box>
            )}
            <Box>
              <Typography variant="caption" color="text.secondary">
                Source
              </Typography>
              <Typography variant="body2">
                src/config/fields/index.ts
              </Typography>
            </Box>
          </Stack>
        ) : (
          <Typography color="text.secondary">
            Field not found in catalog (page-level custom field).
          </Typography>
        )}
      </DetailModal>

      {/* Component detail modal */}
      <DetailModal
        open={!!componentModalName}
        onClose={() => setComponentModalName(null)}
        title={componentModalName ?? ""}
      >
        {selectedComponent ? (
          <Stack spacing={2}>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Category
              </Typography>
              <Typography>{selectedComponent.category}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Description
              </Typography>
              <Typography>{selectedComponent.description}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Used in
              </Typography>
              <Typography>{selectedComponent.usedIn}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Source
              </Typography>
              <Typography variant="body2">
                {selectedComponent.sourcePath}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Storybook
              </Typography>
              <Link
                href={selectedComponent.storybookLink}
                target="_blank"
                rel="noopener"
              >
                {selectedComponent.storybookLink}
              </Link>
            </Box>
          </Stack>
        ) : (
          <Typography color="text.secondary">Component not found.</Typography>
        )}
      </DetailModal>
    </Box>
  );
}
