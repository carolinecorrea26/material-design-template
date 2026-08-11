import { type ReactNode, useState, useMemo } from "react";
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
import { pages, getPageTitle, getPageNavTitle } from "../config/pages";
import { pageSections } from "../config/pageSections";
import type { SectionVisibilityRule } from "../config/pageSections/types";
import type { PageId } from "../types";
import DocsSidebarNav from "../components/docs/DocsSidebarNav";

const tableOfContents = [
  { id: "pages-table", label: "Pages" },
  { id: "flows-table", label: "Flows" },
  { id: "components-table", label: "Components" },
  { id: "fields-table", label: "Fields" },
  { id: "configurations-table", label: "Configurations" },
  { id: "site-rules-table", label: "Site Rules" },
  { id: "template-changes-table", label: "Template Changes" },
];

// ---------------------------------------------------------------------------
// Site rules data
// ---------------------------------------------------------------------------

const siteRules: { area: string; rule: string; behavior: string; ref: string }[] = [
  { area: "Application flow", rule: "Resolved next/back navigation", behavior: "Next and Back use the form-flow resolver and skip pages whose display conditions evaluate to false.", ref: "src/config/formFlow.ts; src/app/RoutePage.tsx" },
  { area: "Application flow", rule: "Client page mode = none", behavior: "If Beneficiary or Payment is configured as none, the page is skipped from the active form flow.", ref: "src/config/formFlow.ts; getClientPageRequirement" },
  { area: "Application flow", rule: "Beneficiary routing", behavior: "Beneficiary is shown only when selected coverage includes Life (LI) or Accidental Death (AD), unless the page is configured as none.", ref: "src/config/formFlow.ts" },
  { area: "Application flow", rule: "Health SI routing", behavior: "Health SI is shown when at least one selected product uses SI underwriting.", ref: "src/config/formFlow.ts" },
  { area: "Application flow", rule: "Health LI routing", behavior: "Health LI is shown when selected Life coverage uses TELE underwriting.", ref: "src/config/formFlow.ts" },
  { area: "Application flow", rule: "Health QD routing", behavior: "Health QD is shown when at least one selected product uses QD underwriting.", ref: "src/config/formFlow.ts" },
  { area: "Application flow", rule: "Health DI routing", behavior: "Health DI is shown when selected Disability coverage uses TELE underwriting.", ref: "src/config/formFlow.ts" },
  { area: "Application flow", rule: "Health CIR routing", behavior: "Health CIR is shown when an enabled selected rider key contains :cir:.", ref: "src/config/formFlow.ts" },
  { area: "Progress/navigation", rule: "Health grouped in progress", behavior: "Multiple routed health pages are presented within the consolidated application-review/progress experience rather than as separate major progress stages.", ref: "src/config/progressSteps.ts" },
  { area: "Progress/navigation", rule: "Skipped stages removed", behavior: "If every page in a progress stage is skipped, the stage is removed from the active progress steps.", ref: "src/config/progressSteps.ts" },
  { area: "Progress/navigation", rule: "Post-review Back disabled", behavior: "After Review is submitted, Back navigation is disabled on pages after Review.", ref: "src/app/RoutePage.tsx" },
  { area: "Validation", rule: "Page advance", behavior: "The user cannot advance when field validation or page-level validation fails; the page shows an error and moves focus/scroll toward the first error.", ref: "src/app/RoutePage.tsx" },
  { area: "Persistence", rule: "Values preserved during navigation", behavior: "Current page values are written to shared application state on submit, Back, and unmount when the page was not explicitly saved.", ref: "src/app/RoutePage.tsx; ApplicationFormContext.tsx" },
  { area: "Persistence", rule: "Progress-saved feedback", behavior: "After forward navigation, the destination page displays a Progress Saved snackbar.", ref: "src/app/RoutePage.tsx" },
  { area: "Persistence", rule: "Membership starts autosave mock communication", behavior: "Submitting Membership triggers the current prototype autosave mock-email behavior.", ref: "src/app/RoutePage.tsx" },
  { area: "Applicant display", rule: "Member section title hidden for member-only flow", behavior: "The Member/Self applicant section label is hidden when no spouse/child is actually selected for any product. It is shown when another applicant is applying.", ref: "src/utils/applicantVisibility.ts" },
  { area: "Applicant display", rule: "Dependent section shown only when applying", behavior: "Spouse/child applicant labels and post-Coverage applicant sections are shown only when that applicant is actually selected for an applicable product.", ref: "src/utils/applicantVisibility.ts; src/app/RoutePage.tsx" },
  { area: "Applicant display", rule: "Eligibility selection alone is not enough after Coverage", behavior: "A spouse/child selected on Eligibility does not count as applying if that dependent is not selected for any product on Coverage.", ref: "src/utils/applicantVisibility.ts" },
  { area: "Applicant display", rule: "Member-only fallback", behavior: "When no dependents are selected, the member is treated as the applicant by default.", ref: "src/utils/applicantsApplying.ts" },
  { area: "Eligibility", rule: "Child dependent requires child record", behavior: "If Child is selected as a dependent, at least one child record must be added before continuing.", ref: "src/pages/Eligibility.tsx" },
  { area: "Eligibility", rule: "Spouse dependent requires spouse details", behavior: "If Spouse is selected, spouse name details must be provided before continuing.", ref: "src/pages/Eligibility.tsx" },
  { area: "Eligibility", rule: "ZIP can derive state/province", behavior: "When a recognizable ZIP/postal code is entered, the state/province field is automatically derived when a matching configured option exists.", ref: "src/pages/Eligibility.tsx; src/utils/zipToStateProvince.ts" },
  { area: "Eligibility", rule: "Membership-conditional dependent options", behavior: "Dependent options on Eligibility can be suppressed based on membership attestation. When a membership type implies a specific relationship (e.g. the member is a spouse/dependent of the primary member), the corresponding dependent option is removed to prevent duplicate applicant entry. Section visibility, labels, and suppression rules are client-configurable.", ref: "src/pages/Eligibility.tsx" },
  { area: "Coverage", rule: "Coverage categories reflect selected products", behavior: "Coverage behavior and downstream routing are driven by the products selected on Coverage and their effective categories/underwriting types.", ref: "src/pages/Coverage.tsx; src/components/forms/ProductCatalog.tsx; src/config/formFlow.ts" },
  { area: "Coverage", rule: "Coverage amount note", behavior: "The site can present either 'additional coverage' or 'total coverage' guidance based on the active client configuration.", ref: "src/components/forms/ProductCatalog.tsx" },
  { area: "Coverage", rule: "Category initial expansion", behavior: "Coverage categories may start expanded for clients configured with allCategoriesExpanded.", ref: "src/config/clients/types.ts; client configs" },
  { area: "Coverage", rule: "Applicant coverage selection", behavior: "Coverage is selected separately by eligible applicant/product; selected applicant and amount data are stored by product/applicant key.", ref: "src/components/forms/ProductCatalog.tsx" },
  { area: "Coverage cart", rule: "Cart availability", behavior: "The application header shows the coverage cart on application pages except Home and Receipt, and hides it after Review has been submitted.", ref: "src/components/layout/AppHeader.tsx" },
  { area: "Coverage cart", rule: "Cart badge", behavior: "The cart icon displays a badge count derived from current coverage selections.", ref: "src/components/layout/AppHeader.tsx; CoverageCart.tsx" },
  { area: "Beneficiary", rule: "Applicable applicants/products", behavior: "Beneficiary records are created only for selected member/spouse LI/AD products with a positive coverage amount and selected applicant.", ref: "src/pages/Beneficiary.tsx" },
  { area: "Beneficiary", rule: "Optional page opt-in", behavior: "When Beneficiary mode is optional, the page first asks whether the user wants to add beneficiary information. No skips the beneficiary questions and permits continuation.", ref: "src/pages/Beneficiary.tsx" },
  { area: "Beneficiary", rule: "Required beneficiary per applicable product", behavior: "When beneficiary questions are active, each applicable product must have at least one beneficiary before continuing.", ref: "src/pages/Beneficiary.tsx" },
  { area: "Beneficiary", rule: "Primary/contingent designation", behavior: "Each beneficiary is designated as Primary or Contingent.", ref: "src/pages/Beneficiary.tsx" },
  { area: "Beneficiary", rule: "Individual vs. trust", behavior: "A beneficiary can be an Individual or Trust. Within the same Primary/Contingent designation, trust and individual beneficiary types cannot be mixed.", ref: "src/pages/Beneficiary.tsx" },
  { area: "Beneficiary", rule: "Maximum beneficiaries", behavior: "Up to 10 Primary and 10 Contingent beneficiaries may be added per product; reaching 10 prevents additional entries for that designation.", ref: "src/pages/Beneficiary.tsx" },
  { area: "Beneficiary", rule: "Individual allocation", behavior: "Individual beneficiary share must be greater than 0 and cannot exceed the unassigned percentage remaining for that designation.", ref: "src/pages/Beneficiary.tsx" },
  { area: "Beneficiary", rule: "Allocation reaches 100%", behavior: "Once the assigned individual share reaches 100% for a designation, no more individual beneficiaries can be added for that designation.", ref: "src/pages/Beneficiary.tsx" },
  { area: "Beneficiary", rule: "Trust exclusivity", behavior: "Only one Trust may be added per Primary/Contingent designation; if a Trust exists, additional individuals or trusts are blocked for that designation.", ref: "src/pages/Beneficiary.tsx" },
  { area: "Beneficiary", rule: "Add/edit/remove", behavior: "Beneficiaries are maintained through a modal supporting Add, Edit and Remove actions.", ref: "src/pages/Beneficiary.tsx" },
  { area: "Beneficiary", rule: "Apply to other coverages", behavior: "After adding a beneficiary, if the same applicant has other eligible products, the user is offered the option to apply that beneficiary to other coverages.", ref: "src/pages/Beneficiary.tsx" },
  { area: "Contact", rule: "Business address same as home", behavior: "The Contact page conditionally hides/reuses business-address inputs when the business address is marked the same as the home address; DI/OO-related contact fields drive additional display rules.", ref: "src/pages/Contact.tsx" },
  { area: "Profile", rule: "Driver license follow-up", behavior: "Driver license number/state fields appear only when the user answers Yes to having a driver license, where those fields are present for the client.", ref: "src/pages/Profile.tsx" },
  { area: "Profile", rule: "Outside-U.S. follow-up", behavior: "Spouse outside-U.S. residence/travel questions reveal country/month follow-ups only for affirmative responses.", ref: "src/pages/Profile.tsx" },
  { area: "Profile", rule: "Existing/pending coverage follow-ups", behavior: "Financial/insurance follow-up fields and repeatable insurance-company records display only when the controlling answer and applicable coverage context require them.", ref: "src/pages/Profile.tsx" },
  { area: "Health", rule: "Applicant health sections", behavior: "Member/spouse health sections follow applicant-applying visibility; the member label is hidden for member-only flow.", ref: "src/pages/HealthSi.tsx; HealthLi.tsx; HealthDi.tsx; applicantVisibility.ts" },
  { area: "Health", rule: "Yes/No progressive disclosure", behavior: "Health questions are required Yes/No. A Yes response displays question-specific repeatable detail records; No displays no detail list.", ref: "src/pages/HealthSi.tsx; HealthLi.tsx; HealthDi.tsx" },
  { area: "Health", rule: "Dynamic List records", behavior: "Repeatable health/insurance records are added and edited through the shared DynamicList pattern.", ref: "src/components/forms/DynamicList.tsx" },
  { area: "Payment", rule: "Optional payment opt-in", behavior: "When Payment mode is optional, the page first asks whether the user wants to add payment information; No permits continuation without payment questions.", ref: "src/pages/Payment.tsx" },
  { area: "Payment", rule: "Payment per applicable product", behavior: "When payment questions are active, each applicable product requires a payment method and payment frequency before continuing.", ref: "src/pages/Payment.tsx" },
  { area: "Payment", rule: "Bank account detail display", behavior: "Bank-account details are displayed when Bank account is selected as the payment method.", ref: "src/pages/Payment.tsx" },
  { area: "Review", rule: "Edit confirmation", behavior: "Selecting an edit action prompts the user before routing back to the page that owns the information.", ref: "src/pages/Review.tsx" },
  { area: "Landing Page", rule: "Variant behavior", behavior: "default = inline Quote Tool and no hero image; hero-image = hero image, no inline Quote Tool; welcome-back = hero image, Continue/New Application actions, and hides How Applying Works and Coverage Options.", ref: "src/pages/Home.tsx" },
  { area: "Landing Page", rule: "Resume link", behavior: "Default and hero-image variants display the saved-application resume prompt/link; welcome-back uses Continue Application as the primary action instead.", ref: "src/pages/Home.tsx" },
  { area: "Header", rule: "Header actions", behavior: "Application header supports Chat (when enabled and eligible), Coverage Cart and Menu. It does not contain a Quote action in the latest source.", ref: "src/components/layout/AppHeader.tsx" },
  { area: "Application menu", rule: "Menu tools", behavior: "Menu provides Continue Saved Application, About Coverage, Needs Calculator, About QuickDecision and client Contact information.", ref: "src/components/layout/AppMenu.tsx" },
];

// ---------------------------------------------------------------------------
// Template changes data
// ---------------------------------------------------------------------------

const templateChanges: { area: string; current: string; next: string }[] = [
  { area: "Design system", current: "Bootstrap-based UI.", next: "Google Material Design-based UI." },
  { area: "Add-item interactions", current: "Beneficiaries, children, companies, and similar repeatable entries are added inline on the page.", next: "Repeatable entries are added and edited within a modal/dialog." },
  { area: "Beneficiary allocation guidance", current: "No real-time indication of remaining beneficiary allocation.", next: "Displays assigned and remaining beneficiary allocation in real time." },
  { area: "Autosave initiation", current: "Autosave begins after the third application page.", next: "Autosave begins after the first application page." },
  { area: "Resume process", current: "Three-step resume process.", next: "Two-step resume process using email link followed by phone verification code." },
  { area: "Quote tool product support", current: "Quote functionality limited to approximately three Life products or one Disability product.", next: "Quote tool supports all applicable products." },
  { area: "Standardized client flow", current: "Page flow can vary significantly by client; some clients have unique pages such as Membership.", next: "All client sites use a standardized page structure and flow, with client differences handled through configuration rather than unique client pages." },
  { area: "Page length / field distribution", current: "Large pages such as Eligibility and Profile contain many fields and require significant scrolling.", next: "Large pages are broken into smaller, task-focused pages with fewer fields per page." },
  { area: "Review and signature flow", current: "Preview and Read & Sign are separate pages.", next: "Review/Preview and Read & Sign functionality is consolidated where appropriate into a single stage/page experience." },
  { area: "Decision and confirmation flow", current: "Decision and Receipt are separate pages.", next: "Decision and Receipt are consolidated into a single final confirmation/Receipt experience." },
  { area: "Responsive design", current: "Desktop-oriented layouts adapted for smaller screens.", next: "Mobile-first responsive layouts and components." },
  { area: "Contextual help", current: "Help content is limited or presented separately from the task.", next: "Pages provide contextual helper chips and progressive-disclosure help relevant to the current task." },
  { area: "Loading feedback", current: "Primarily spinner-based loading states.", next: "Uses skeleton loaders, progress indicators, and other contextual loading feedback." },
  { area: "Applicant-first flow", current: "Applicants may need to explicitly identify/select themselves as an applicant.", next: "Common member-only scenario is assumed first, with dependents added only when needed." },
  { area: "Page content density", current: "Pages contain more instructional text and content competing with form tasks.", next: "Content is reduced and structured for faster scanning and lower cognitive load." },
  { area: "Application navigation", current: "Navigation and progress patterns vary with the existing page structure.", next: "Standardized navigation and progress pattern across client implementations." },
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
      "Collects ZIP/postal code, state, date of birth, dependent selection, and configured eligibility responses.",
  },
  {
    label: "Coverage",
    description:
      "Collects coverage interests and selections: eligible applicants, products, amounts, riders, estimated premiums.",
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
    label: "Send Application",
    description: "Advisor confirms handoff to the applicant via popup action.",
  },
  {
    label: "Resume & Verification (Applicant)",
    description: "Applicant uses secure resume flow to access the application.",
  },
  {
    label: "Advisor-Applicant Review",
    description: "Applicant reviews advisor-entered information as read-only.",
  },
  {
    label: "Remaining Application",
    description:
      "Applicant completes next incomplete applicant-owned page through Receipt.",
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
    label: "Resume Code",
    description:
      "System sends a text code by default; user may request delivery by voice call.",
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
    description: "Icon + title + body placeholder for empty or unavailable content.",
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
    description: "Full-width contextual alert above form content. PageErrorAlert is a deprecated re-export of this component.",
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
    name: "ProgressSavedSnackbar",
    category: "feedback",
    description: "Success snackbar confirming form progress saved.",
    sourcePath: "src/components/feedback/ProgressSavedSnackbar.tsx",
    usedIn: "AppShell (global)",
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
      "Full-screen side drawer with coverage options, calculator, support.",
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
    description: "Quote/rate comparison modal containing EstimatorProductCard entries per product.",
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
    description: "Selected coverage summary with drawer and inline variants. Renders per-product cost breakdown and total. Replaces the former CartDrawer + TotalCostCart split.",
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
    sourcePath: "src/config/pages.ts / src/config/pageGroups.ts / src/config/progressSteps.ts",
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
    sourcePath: "src/config/clients/*.ts / src/config/pageSections/pageSections.ts",
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
    sourcePath: "src/content/defaults/navigation.ts / src/config/transitionMessages.ts",
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
    configurable: "Globally defined; extended via coverageQuestions client config",
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

const pageGroupOrder = [
  "get-started",
  "coverage",
  "profile",
  "review",
  "health",
  "payment",
];
const pageGroupLabels: Record<string, string> = {
  "get-started": "Get Started",
  coverage: "Coverage",
  profile: "Profile",
  review: "Review & Sign",
  health: "Health",
  payment: "Payment",
};

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

  const groupedPages = useMemo(() => {
    const lc = pageFilter.toLowerCase();
    const grouped: {
      group: string;
      label: string;
      items: {
        id: PageId;
        title: string;
        navTitle: string;
        path: string;
        type: string;
        group: string;
        sourcePath: string;
      }[];
    }[] = [];
    const allPagesFlat = pages.map((page) => ({
      id: page.id as PageId,
      title: getPageTitle(page.id as PageId),
      navTitle: getPageNavTitle(page.id as PageId),
      path: page.path,
      type: page.type,
      group: "groupId" in page ? (page as { groupId: string }).groupId : "—",
      sourcePath: `src/pages/${page.id
        .split("-")
        .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
        .join("")}.tsx`,
    }));
    for (const groupId of pageGroupOrder) {
      const items = allPagesFlat.filter((p) => p.group === groupId);
      if (items.length > 0) {
        const filtered = lc
          ? items.filter((p) =>
              `${p.id} ${p.title} ${p.type} ${p.path}`
                .toLowerCase()
                .includes(lc),
            )
          : items;
        if (filtered.length > 0)
          grouped.push({
            group: groupId,
            label: pageGroupLabels[groupId] ?? groupId,
            items: filtered,
          });
      }
    }
    const ungrouped = allPagesFlat.filter((p) => p.group === "—");
    if (ungrouped.length > 0) {
      const filtered = lc
        ? ungrouped.filter((p) =>
            `${p.id} ${p.title} ${p.type} ${p.path}`.toLowerCase().includes(lc),
          )
        : ungrouped;
      if (filtered.length > 0)
        grouped.push({
          group: "other",
          label: "Other (Resume, Advisor, Internal)",
          items: filtered,
        });
    }
    return grouped;
  }, [pageFilter]);

  const totalPageCount = useMemo(
    () => groupedPages.reduce((sum, g) => sum + g.items.length, 0),
    [groupedPages],
  );
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
        {/* 1. PAGES */}
        <SectionAccordion
          id="pages-table"
          title="Pages"
          description="All registered pages organized by navigation group."
          count={totalPageCount}
        >
          <Stack spacing={2}>
            <SearchField
              value={pageFilter}
              onChange={setPageFilter}
              placeholder="Filter pages…"
            />
            {groupedPages.map((group) => (
              <Box key={group.group}>
                <Typography
                  variant="subtitle2"
                  sx={{
                    fontWeight: 800,
                    mb: 1,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    color: "text.secondary",
                  }}
                >
                  {group.label}
                </Typography>
                <ResponsiveTableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Page ID</TableCell>
                        <TableCell>Title</TableCell>
                        <TableCell>Path</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell>Nav title</TableCell>
                        <TableCell>Source</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {group.items.map((page) => (
                        <TableRow key={page.id}>
                          <TableCell>
                            <Typography
                              variant="body2"
                              sx={{ fontWeight: 700 }}
                            >
                              {page.id}
                            </Typography>
                          </TableCell>
                          <TableCell>{page.title}</TableCell>
                          <TableCell>
                            <Link href={page.path}>{page.path}</Link>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={page.type}
                              size="small"
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell>{page.navTitle}</TableCell>
                          <TableCell>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {page.sourcePath}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ResponsiveTableContainer>
              </Box>
            ))}
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
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                The consumer flow begins at the Landing Page and follows the
                resolved sequence. Page inclusion is determined by client
                configuration, applicant data, selected coverage, underwriting
                requirements, and enabled riders.
              </Typography>
              <FlowStepper steps={consumerFlow} />
            </Box>
            <Divider />
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>
                Advisor-Assisted Flow
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                The advisor completes the application through Profile and
                transfers it to the applicant for review and final completion.
                Only one actor may access the application at a time.
              </Typography>
              <FlowStepper steps={advisorFlow} />
            </Box>
            <Divider />
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>
                Resume &amp; Verification Flow
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Restores an incomplete application through an email-based secure
                link and phone verification code.
              </Typography>
              <FlowStepper steps={resumeFlow} />
            </Box>
            <Divider />
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>
                Autosave &amp; Persistence Flow
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
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
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Available through configured entry points (drawer/modal, not a
                standalone page). Collects minimum information to determine
                available products and estimated premiums.
              </Typography>
              <FlowStepper steps={quoteFlow} />
            </Box>
            <Divider />
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>
                Health Routing
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Health pages are displayed conditionally. When multiple apply,
                the sequence is: SI → LI/TELE → QD → CIR → DI. Each appears at
                most once.
              </Typography>
              <Stack spacing={1}>
                {[
                  {
                    condition: "Coverage has SI underwriting",
                    page: "health-si",
                    purpose:
                      "Standard/simplified health questions (5 yes/no + details)",
                  },
                  {
                    condition: "LI coverage has TELE underwriting",
                    page: "health-li",
                    purpose:
                      "Telephone interview health questions (15 yes/no + details)",
                  },
                  {
                    condition: "Coverage has QD underwriting",
                    page: "health-qd",
                    purpose:
                      "Redirect to external QuickDecision℠ questionnaire",
                  },
                  {
                    condition: "CIR rider is selected",
                    page: "health-cir",
                    purpose: "Critical illness rider health info (placeholder)",
                  },
                  {
                    condition: "DI coverage has TELE underwriting",
                    page: "health-di",
                    purpose:
                      "Disability-specific health questions (7 yes/no + details)",
                  },
                ].map((item) => (
                  <Paper
                    key={item.page}
                    variant="outlined"
                    sx={{
                      px: 2,
                      py: 1.5,
                      display: "flex",
                      alignItems: "center",
                      gap: 2,
                    }}
                  >
                    <Chip
                      label={item.page}
                      size="small"
                      sx={{ fontWeight: 700 }}
                    />
                    <ArrowForwardRoundedIcon fontSize="small" color="action" />
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {item.condition}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {item.purpose}
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
                        sx={{ whiteSpace: "normal !important", maxWidth: 300 }}
                      >
                        {comp.description}
                      </TableCell>
                      <TableCell
                        sx={{ whiteSpace: "normal !important", maxWidth: 200 }}
                      >
                        {comp.usedIn}
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" color="text.secondary">
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
                          <TableCell sx={{ minWidth: 300 }}>Options</TableCell>
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
                                  sx={{ fontWeight: 700, textAlign: "left" }}
                                  onClick={() => setFieldModalId(row.fieldId)}
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

        {/* 5. CONFIGURATIONS */}
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
              <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                No configurations match the current filter.
              </Typography>
            ) : (
              <ResponsiveTableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ minWidth: 160 }}>Group</TableCell>
                      <TableCell sx={{ minWidth: 180 }}>Configuration</TableCell>
                      <TableCell sx={{ minWidth: 260 }}>Description</TableCell>
                      <TableCell sx={{ minWidth: 200 }}>Source</TableCell>
                      <TableCell sx={{ minWidth: 160 }}>Configurability</TableCell>
                      <TableCell sx={{ minWidth: 160 }}>Used in</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredConfigs.map((config, i) => {
                      const showGroup = i === 0 || filteredConfigs[i - 1].group !== config.group;
                      return (
                        <TableRow key={config.label + config.name}>
                          <TableCell
                            sx={{
                              verticalAlign: "top",
                              color: showGroup ? "text.primary" : "transparent",
                              fontWeight: 600,
                              fontSize: "0.8125rem",
                              whiteSpace: "normal",
                              borderTop: showGroup && i !== 0 ? "2px solid" : undefined,
                              borderTopColor: showGroup && i !== 0 ? "divider" : undefined,
                            }}
                          >
                            {config.group}
                          </TableCell>
                          <TableCell
                            sx={{
                              verticalAlign: "top",
                              borderTop: showGroup && i !== 0 ? "2px solid" : undefined,
                              borderTopColor: showGroup && i !== 0 ? "divider" : undefined,
                            }}
                          >
                            <Typography variant="body2" sx={{ fontWeight: 700, lineHeight: 1.4 }}>
                              {config.label}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.disabled"
                              sx={{ fontFamily: "monospace", display: "block", mt: 0.25, lineHeight: 1.4, whiteSpace: "normal" }}
                            >
                              {config.name}
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ whiteSpace: "normal !important", verticalAlign: "top", borderTop: showGroup && i !== 0 ? "2px solid" : undefined, borderTopColor: showGroup && i !== 0 ? "divider" : undefined }}>
                            {config.description}
                          </TableCell>
                          <TableCell sx={{ verticalAlign: "top", borderTop: showGroup && i !== 0 ? "2px solid" : undefined, borderTopColor: showGroup && i !== 0 ? "divider" : undefined }}>
                            <Typography variant="caption" color="text.secondary" sx={{ fontFamily: "monospace", whiteSpace: "normal", display: "block" }}>
                              {config.sourcePath}
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ whiteSpace: "normal !important", verticalAlign: "top", borderTop: showGroup && i !== 0 ? "2px solid" : undefined, borderTopColor: showGroup && i !== 0 ? "divider" : undefined }}>
                            {config.configurable}
                          </TableCell>
                          <TableCell sx={{ whiteSpace: "normal !important", verticalAlign: "top", borderTop: showGroup && i !== 0 ? "2px solid" : undefined, borderTopColor: showGroup && i !== 0 ? "divider" : undefined }}>
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
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
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
                              <TableCell sx={{ minWidth: 180 }}>Rule</TableCell>
                              <TableCell sx={{ minWidth: 300 }}>Behavior</TableCell>
                              <TableCell sx={{ minWidth: 220 }}>Implementation Reference</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {ruleGrouped[area].map((row, i) => (
                              <TableRow key={i}>
                                <TableCell sx={{ verticalAlign: "top", fontWeight: 600, fontSize: "0.8125rem" }}>
                                  {row.rule}
                                </TableCell>
                                <TableCell sx={{ verticalAlign: "top", fontSize: "0.8125rem", whiteSpace: "normal !important" }}>
                                  {row.behavior}
                                </TableCell>
                                <TableCell sx={{ verticalAlign: "top" }}>
                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                    sx={{ fontFamily: "monospace", whiteSpace: "pre-wrap", display: "block" }}
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
                  <TableCell sx={{ fontWeight: 600, whiteSpace: "nowrap" }}>Change</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Current Template</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>New Template</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {templateChanges.map((row, i) => (
                  <TableRow key={i}>
                    <TableCell sx={{ verticalAlign: "top", whiteSpace: "nowrap", color: "text.secondary", fontSize: "0.8125rem" }}>
                      {row.area}
                    </TableCell>
                    <TableCell sx={{ verticalAlign: "top", fontSize: "0.8125rem", whiteSpace: "normal !important" }}>
                      {row.current}
                    </TableCell>
                    <TableCell sx={{ verticalAlign: "top", fontSize: "0.8125rem", whiteSpace: "normal !important" }}>
                      {row.next}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ResponsiveTableContainer>
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
