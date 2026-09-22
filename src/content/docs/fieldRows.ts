// ---------------------------------------------------------------------------
// Page field rows + active-client field diff
//
// Extracted from src/pages/InformationArchitecture.tsx (Fields section).
//
// Deviation from a pure copy/paste: in the original source, applyClientFieldDiff
// and applyMembershipClientFieldDiff closed over a module-level
// `const activeClient = getActiveClient()` singleton. Here both functions take
// the client explicitly as a parameter instead, so this module has no
// module-level active-client singleton of its own. getCustomPageFieldRows and
// getPageFieldRows did not reference activeClient in the original source, so
// they are unchanged (still client-agnostic, building the base row set).
// ---------------------------------------------------------------------------

import { fieldCatalog } from "../../config/fields";
import { pageSections, sectionLabels } from "../../config/pageSections";
import { applicantSectionTitles } from "../../config/formSectionTitle";
import type { SectionVisibilityRule } from "../../config/pageSections/types";
import type { FieldDefinition } from "../../config/fields/types";
import { membershipClientFields } from "../../config/clientFields/membership";
import type { ClientConfig } from "../../config/clients/types";
import type { PageId } from "../../types";

// ---------------------------------------------------------------------------
// Helpers (local to this module — mirror the identically named helpers in
// InformationArchitecture.tsx's "Helpers" section, needed here because
// getPageFieldRows/getFieldValidation depend on them).
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
export const clientSpecificPrefixes = ["waepa-", "avma-"];
export function isClientSpecificField(fieldId: string) {
  return clientSpecificPrefixes.some((prefix) => fieldId.startsWith(prefix));
}

// Fields that are client-configured visibility
export const clientConfiguredFields = new Set(["title"]);

// Pages with no user-interactive fields (exclude from fields section)
export const pagesWithNoFields = new Set<PageId>([
  "receipt",
  "docusign",
  "health-qd",
  "health-cir",
]);

// ---------------------------------------------------------------------------
// Page field rows
// ---------------------------------------------------------------------------

export type FieldRow = {
  sectionId: string;
  sectionLabel: string;
  applicant: string;
  fieldId: string;
  label: string;
  inputType: string;
  required: string;
  options: string;
  visibleWhen: string;
  /** Set when this row differs from (or was added by) the active client's field config. */
  clientNote?: string;
  /** Validation applied to this field, derived from its format/required metadata. */
  validation?: string;
};

/** Generic validation messages for format-constrained fields (src/config/fields/types.ts FieldDefinition.format), matched against the global "Field" entries in errorMessages below. */
export const FORMAT_VALIDATION_MESSAGE: Partial<Record<string, string>> = {
  email: "Enter a valid email address.",
  phone: "Enter a valid 10-digit phone number.",
  ssn: "Enter a valid 9-digit SSN.",
  percent: "Enter a percent value with up to 3 digits.",
  "month-year": "Enter a valid month and year (MM/YYYY).",
};

function getFieldValidation(field?: {
  required?: boolean;
  format?: string;
}): string | undefined {
  if (!field) return undefined;
  const formatMessage = field.format
    ? FORMAT_VALIDATION_MESSAGE[field.format]
    : undefined;
  if (formatMessage && field.required)
    return `Required. ${formatMessage}`;
  if (formatMessage) return formatMessage;
  if (field.required) return "Required.";
  return undefined;
}

export function getCustomPageFieldRows(pageId: PageId): FieldRow[] | null {
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
export const eligibilityChildFields: FieldRow[] = [
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
export const coverageProductFields: FieldRow[] = [
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

/**
 * Some pageSections entries have neither `title` nor `description` because,
 * in the real app, they render with no header of their own: either they're a
 * silent continuation of the previous section's header (Coverage's tobacco
 * follow-up questions — CoverageQuestions.tsx only renders a divider `if
 * (section.description)`), a hardcoded label supplied by the page component
 * itself (Profile.tsx's per-section-id fallbacks; PhysicianInformation.tsx's
 * own "Physician information" divider), or a tab rather than a text header
 * (AdvisorLogin.tsx). Without this map, the doc table falls back to the raw
 * section id (e.g. "selfCoverageTobacco"). These values mirror what a user
 * actually sees above each field — verified against each page's source.
 */
export const sectionLabelOverrides: Record<string, string> = {
  selfCoverageTobacco: sectionLabels.personalDetails,
  spouseCoverageTobacco: sectionLabels.personalDetails,
  default: "—",
  dependentSelection: applicantSectionTitles.self,
  advisorLoginNew: "Start (new advisor login)",
  advisorLoginSaved: "Continue (saved application)",
  profilePersonalSelfDriversLicense: sectionLabels.personalInfo,
  profilePersonalSelfOutsideUs: sectionLabels.personalInfo,
  profilePersonalSelfTravelOutsideUs: sectionLabels.personalInfo,
  profilePersonalSelfPhysician: "Physician information",
  profilePersonalSpouse: sectionLabels.personalInfo,
  profilePersonalSpouseDriversLicense: sectionLabels.personalInfo,
  profilePersonalSpouseOutsideUs: sectionLabels.personalInfo,
  profilePersonalSpouseTravelOutsideUs: sectionLabels.personalInfo,
  profilePersonalSpousePhysician: "Physician information",
  profileFinancialSpouse: sectionLabels.financialInfo,
};

function resolveSectionLabel(section: {
  id: string;
  title?: string;
  description?: string;
}): string {
  return (
    section.title ??
    section.description ??
    sectionLabelOverrides[section.id] ??
    section.id
  );
}

export function getPageFieldRows(pageId: PageId): FieldRow[] {
  const customRows = getCustomPageFieldRows(pageId);
  if (customRows) return customRows;

  const sections = pageSections[pageId] ?? [];
  if (sections.length === 0) return [];
  const rows = sections.flatMap((section) => {
    if (section.fieldIds.length === 0) {
      return [
        {
          sectionId: section.id,
          sectionLabel: resolveSectionLabel(section),
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
        sectionLabel: resolveSectionLabel(section),
        applicant: section.applicant ?? "—",
        fieldId,
        label: field?.label ?? fieldId,
        inputType: field?.inputType ?? "—",
        required: field?.required ? "Yes" : "No",
        options: formatOptions(fieldId),
        visibleWhen,
        validation: getFieldValidation(field),
      };
    });
  });

  if (pageId === "eligibility") return [...rows, ...eligibilityChildFields];
  if (pageId === "coverage") return [...rows, ...coverageProductFields];
  return rows;
}

// ---------------------------------------------------------------------------
// Active-client field diff (extra / hidden / required / overridden fields)
// ---------------------------------------------------------------------------

/** Merges an override's label/inputType/required/options onto a doc table row so the row shows what the client actually sees. */
export function mergeFieldOverrideIntoRow(
  row: FieldRow,
  override: Partial<FieldDefinition>,
): FieldRow {
  return {
    ...row,
    label: override.label ?? row.label,
    inputType: override.inputType ?? row.inputType,
    required:
      override.required !== undefined
        ? override.required
          ? "Yes"
          : "No"
        : row.required,
    options:
      override.options !== undefined
        ? override.options.length > 0
          ? override.options.map((o) => o.label).join(", ")
          : "—"
        : row.options,
  };
}

export type ClientFieldDiffResult = {
  /** Rows actually shown to this client, in table order. */
  rows: FieldRow[];
  /** Rows hidden for this client — excluded from `rows`, reported separately. */
  hiddenRows: FieldRow[];
};

/**
 * Annotates the generic pageSections/fieldCatalog-driven rows for a page with
 * the given client's real ClientFields config (extra/hidden/required/overrides):
 * merges override values into the displayed label/type/required/options,
 * excludes fields hidden for this client (returned separately in `hiddenRows`),
 * and appends rows for client-only fields. Pages with hand-authored rows
 * (see getCustomPageFieldRows) aren't backed by ClientFields and are left as-is.
 */
export function applyClientFieldDiff(
  pageId: PageId,
  rows: FieldRow[],
  client: ClientConfig,
): ClientFieldDiffResult {
  if (getCustomPageFieldRows(pageId)) return { rows, hiddenRows: [] };
  if (pageId === "membership") return applyMembershipClientFieldDiff(rows, client);

  const clientPageConfig = client.fields[pageId];
  if (!clientPageConfig) return { rows, hiddenRows: [] };

  const hidden = new Set(clientPageConfig.hidden ?? []);
  const required = new Set(clientPageConfig.required ?? []);
  const overrides = clientPageConfig.overrides ?? {};
  const extra = new Set(clientPageConfig.extra ?? []);

  const visibleRows: FieldRow[] = [];
  const hiddenRows: FieldRow[] = [];

  for (const row of rows) {
    if (row.fieldId === "—") {
      visibleRows.push(row);
      continue;
    }
    if (hidden.has(row.fieldId)) {
      hiddenRows.push({ ...row, clientNote: "Hidden for this client" });
      continue;
    }
    const notes: string[] = [];
    let nextRow = row;
    if (extra.has(row.fieldId)) notes.push("Added for this client");
    if (required.has(row.fieldId) && row.required !== "Yes")
      notes.push("Required for this client");
    const override = overrides[row.fieldId];
    if (override) {
      notes.push(`Overridden: ${Object.keys(override).join(", ")}`);
      nextRow = mergeFieldOverrideIntoRow(nextRow, override);
    }
    visibleRows.push(
      notes.length > 0 ? { ...nextRow, clientNote: notes.join(" · ") } : row,
    );
  }

  const presentIds = new Set(rows.map((r) => r.fieldId));
  const extraRows: FieldRow[] = [...extra]
    .filter((id) => !presentIds.has(id))
    .map((id) => {
      const base = fieldCatalog[id as keyof typeof fieldCatalog];
      const override = overrides[id];
      const merged = override ? { ...base, ...override } : base;
      return {
        sectionId: "client-extra",
        sectionLabel: "Client-added fields",
        applicant: "—",
        fieldId: id,
        label: merged?.label ?? id,
        inputType: merged?.inputType ?? "—",
        required: merged?.required ? "Yes" : "No",
        options:
          merged?.options && merged.options.length > 0
            ? merged.options.map((o) => o.label).join(", ")
            : "—",
        visibleWhen: "Always visible",
        clientNote: "Added for this client",
      };
    });

  return { rows: [...visibleRows, ...extraRows], hiddenRows };
}

/** Membership uses its own client-field mechanism (membershipClientFields), separate from ClientFields. */
export function applyMembershipClientFieldDiff(
  rows: FieldRow[],
  client: ClientConfig,
): ClientFieldDiffResult {
  const config = membershipClientFields[client.id];
  const overrides = config?.overrides ?? {};
  const extraFields = config?.extraFields ?? [];

  const visibleRows: FieldRow[] = [];
  const hiddenRows: FieldRow[] = [];

  for (const row of rows) {
    if (row.fieldId === "—") {
      visibleRows.push(row);
      continue;
    }
    const override = overrides[row.fieldId];
    if (override?.hidden) {
      hiddenRows.push({ ...row, clientNote: "Hidden for this client" });
      continue;
    }
    if (override) {
      const keys = Object.keys(override).filter((k) => k !== "hidden");
      if (keys.length > 0) {
        const merged = mergeFieldOverrideIntoRow(row, override);
        visibleRows.push({ ...merged, clientNote: `Overridden: ${keys.join(", ")}` });
        continue;
      }
    }
    visibleRows.push(row);
  }

  const presentIds = new Set(rows.map((r) => r.fieldId));
  const extraRows: FieldRow[] = extraFields
    .filter((f) => !presentIds.has(f.id))
    .map((f) => ({
      sectionId: "client-extra",
      sectionLabel: "Client-added fields",
      applicant: "—",
      fieldId: f.id,
      label: f.label,
      inputType: f.inputType,
      required: f.required ? "Yes" : "No",
      options:
        f.options && f.options.length > 0
          ? f.options.map((o) => o.label).join(", ")
          : "—",
      visibleWhen: formatVisibleWhen(f.visibleWhen),
      clientNote: "Added for this client",
    }));

  return { rows: [...visibleRows, ...extraRows], hiddenRows };
}
