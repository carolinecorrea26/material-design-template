import { type ReactNode, useState, useMemo } from "react";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
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
  IconButton,
  InputAdornment,
  Link,
  Paper,
  Stack,
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
import {
  pages,
  getPageTitle,
  getPageSubhead,
  getPageNavTitle,
} from "../config/pages";
import { pageSections } from "../config/pageSections";
import type { SectionVisibilityRule } from "../config/pageSections/types";
import type { PageId } from "../types";

const tableOfContents = [
  { id: "pages-table", label: "Pages" },
  { id: "flows-table", label: "Flows" },
  { id: "components-table", label: "Components" },
  { id: "fields-table", label: "Fields" },
  { id: "configurations-table", label: "Configurations" },
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

function getPage(pageId: PageId) {
  return pages.find((page) => page.id === pageId);
}

function getPagePathLocal(pageId: PageId) {
  return getPage(pageId)?.path ?? "—";
}

function getPageGroup(pageId: PageId) {
  const page = getPage(pageId);
  if (!page || !("groupId" in page)) return "—";
  return (page as { groupId?: string }).groupId ?? "—";
}

function getRoutingRule(pageId: PageId) {
  const rules: Partial<Record<PageId, string>> = {
    beneficiary: "Shown when coverage includes LI or AD category.",
    "health-si": "Shown when coverage has SI underwriting type.",
    "health-li": "Shown when LI coverage has TELE underwriting.",
    "health-qd": "Shown when coverage has QD underwriting type.",
    "health-di": "Shown when DI coverage has TELE underwriting.",
    "health-cir": "Shown when a CIR rider is selected.",
    receipt: "Final confirmation page.",
  };
  return rules[pageId] ?? "Standard flow page.";
}

// ---------------------------------------------------------------------------
// Client-specific field prefixes to exclude (demo client doesn't use these)
// ---------------------------------------------------------------------------
const clientSpecificPrefixes = ["waepa-", "avma-"];
function isClientSpecificField(fieldId: string) {
  return clientSpecificPrefixes.some((prefix) => fieldId.startsWith(prefix));
}

// ---------------------------------------------------------------------------
// Fields that are client-configured visibility (not always visible)
// ---------------------------------------------------------------------------
const clientConfiguredFields = new Set(["title"]);

// ---------------------------------------------------------------------------
// Page field rows - resolves pages that have custom/non-catalog fields
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
    case "health-qd":
      return [
        {
          sectionId: "redirect",
          sectionLabel: "Redirect page",
          applicant: "—",
          fieldId: "—",
          label:
            "No fields — redirects to external QuickDecision℠ health questionnaire",
          inputType: "—",
          required: "—",
          options: "—",
          visibleWhen: "Always visible",
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
    case "health-cir":
      return [
        {
          sectionId: "placeholder",
          sectionLabel: "Placeholder",
          applicant: "—",
          fieldId: "—",
          label: "Placeholder — CIR health questions not yet implemented",
          inputType: "—",
          required: "—",
          options: "—",
          visibleWhen: "Always visible",
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
          label: "Payment method",
          inputType: "radio",
          required: "Yes",
          options: "Bill me, Bank account",
          visibleWhen: "Always visible (per selected coverage)",
        },
        {
          sectionId: "payment-per-product",
          sectionLabel: "Per-product payment",
          applicant: "—",
          fieldId: "payment-frequency",
          label: "Payment frequency",
          inputType: "radio",
          required: "Yes",
          options: "Monthly, Quarterly, Semiannually, Annually",
          visibleWhen: "Always visible (per selected coverage)",
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
          visibleWhen: "payment-method = Bank account",
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
          visibleWhen: "payment-method = Bank account",
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
          visibleWhen: "payment-method = Bank account",
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
          visibleWhen: "payment-method = Bank account",
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
          visibleWhen: "payment-method = Bank account",
        },
      ];
    case "docusign":
      return [
        {
          sectionId: "redirect",
          sectionLabel: "Redirect page",
          applicant: "—",
          fieldId: "—",
          label: "No fields — redirects to DocuSign for e-signature",
          inputType: "—",
          required: "—",
          options: "—",
          visibleWhen: "Always visible",
        },
      ];
    case "receipt":
      return [
        {
          sectionId: "confirmation",
          sectionLabel: "Confirmation display",
          applicant: "—",
          fieldId: "—",
          label: "No fields — read-only confirmation page",
          inputType: "—",
          required: "—",
          options: "—",
          visibleWhen: "Always visible",
        },
      ];
    default:
      return null;
  }
}

/** Coverage product card fields (rendered in ProductCatalog) */
const coverageProductFields: FieldRow[] = [
  {
    sectionId: "product-card",
    sectionLabel: "Coverage product card",
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
    sectionLabel: "Coverage product card",
    applicant: "per-applicant",
    fieldId: "coverage-benefit-amount",
    label: "Benefit Amount",
    inputType: "dropdown",
    required: "Yes (if selected)",
    options: "Dynamic: $25K–$500K+ (varies per product/applicant)",
    visibleWhen: "coverage-add-checkbox = checked",
  },
  {
    sectionId: "product-card",
    sectionLabel: "Coverage product card",
    applicant: "—",
    fieldId: "coverage-waiting-period",
    label: "Waiting Period",
    inputType: "dropdown",
    required: "Yes (if shown)",
    options: "Dynamic (per DI/OO product definition)",
    visibleWhen: "DI or OO category product selected",
  },
  {
    sectionId: "product-card",
    sectionLabel: "Coverage product card",
    applicant: "—",
    fieldId: "coverage-max-benefit-period",
    label: "Maximum Benefit Period",
    inputType: "dropdown",
    required: "Yes (if shown)",
    options: "Dynamic (per OO product definition)",
    visibleWhen: "OO category product selected",
  },
  {
    sectionId: "product-card",
    sectionLabel: "Coverage product card",
    applicant: "—",
    fieldId: "coverage-rider-checkbox",
    label: "Optional Benefit / Rider",
    inputType: "checkbox",
    required: "No",
    options: "Dynamic (per product rider definitions)",
    visibleWhen: "Product has riders defined",
  },
  {
    sectionId: "product-card",
    sectionLabel: "Coverage product card",
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
  // Check for custom page fields first
  const customRows = getCustomPageFieldRows(pageId);
  if (customRows) return customRows;

  const sections = pageSections[pageId] ?? [];
  if (sections.length === 0) {
    return [
      {
        sectionId: "custom",
        sectionLabel: "Custom page content",
        applicant: "—",
        fieldId: "—",
        label: "No catalog-driven fields",
        inputType: "—",
        required: "—",
        options: "—",
        visibleWhen: "—",
      },
    ];
  }
  return sections.flatMap((section) => {
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
}

// ---------------------------------------------------------------------------
// Static data for tables
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
    description:
      "Renders structured legal documents (headings, paragraphs, lists) from content data.",
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
    name: "LoadingOverlay",
    category: "feedback",
    description:
      "Multi-size loading spinner (sm/md/lg/fullscreen) with optional status message.",
    sourcePath: "src/components/feedback/LoadingOverlay.tsx",
    usedIn: "Page transitions, async actions",
    storybookLink: "/?path=/story/feedback-loadingoverlay",
  },
  {
    name: "PageAlert",
    category: "feedback",
    description:
      "Full-width contextual alert (error/success/warning/info) above form content.",
    sourcePath: "src/components/feedback/PageAlert.tsx",
    usedIn: "PageShell error/info display",
    storybookLink: "/?path=/story/feedback-pagealert",
  },
  {
    name: "PageTransitionSkeleton",
    category: "feedback",
    description:
      "Skeleton placeholder with animated shapes during page transitions.",
    sourcePath: "src/components/feedback/PageTransitionSkeleton.tsx",
    usedIn: "RoutePage transition state",
    storybookLink: "/?path=/story/feedback-pagetransitionskeleton",
  },
  {
    name: "ProgressSavedSnackbar",
    category: "feedback",
    description: "Success snackbar confirming form progress has been saved.",
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
    description:
      "Add/edit/remove list with modal-based form for items (beneficiaries, physicians).",
    sourcePath: "src/components/forms/DynamicList.tsx",
    usedIn: "Beneficiary, Profile pages",
    storybookLink: "/?path=/story/forms-dynamiclist",
  },
  {
    name: "DynamicListItem",
    category: "forms",
    description:
      "Single bordered card item in a DynamicList with Edit/Remove buttons.",
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
    description: "Physician info section with name/address/phone field layout.",
    sourcePath: "src/components/forms/PhysicianInformation.tsx",
    usedIn: "Profile page",
    storybookLink: "/?path=/story/forms-physicianinformation",
  },
  {
    name: "ProductCatalog",
    category: "forms",
    description:
      "Full product catalog grouped by category with applicant checkboxes, amounts, riders, rates.",
    sourcePath: "src/components/forms/ProductCatalog.tsx",
    usedIn: "Coverage page",
    storybookLink: "/?path=/story/forms-productcatalog",
  },
  {
    name: "QuoteCalculator",
    category: "forms",
    description:
      "Quote/rate calculator drawer with category selection and rate display.",
    sourcePath: "src/components/forms/QuoteCalculator.tsx",
    usedIn: "AppMenu drawer",
    storybookLink: "/?path=/story/forms-quotecalculator",
  },
  {
    name: "QuoteCard",
    category: "forms",
    description:
      "Individual coverage quote card with applicant amount controls.",
    sourcePath: "src/components/forms/QuoteCard.tsx",
    usedIn: "QuoteEstimator",
    storybookLink: "/?path=/story/forms-quotecard",
  },
  {
    name: "QuoteEstimator",
    category: "forms",
    description:
      "Coverage quote estimator with category filter and product cards.",
    sourcePath: "src/components/forms/QuoteEstimator.tsx",
    usedIn: "Coverage page drawer",
    storybookLink: "/?path=/story/forms-quoteestimator",
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
    description:
      "Slide-in drawer (swipeable on mobile) with title and close button.",
    sourcePath: "src/components/layout/AppDrawer.tsx",
    usedIn: "CartDrawer, QuoteEstimator, AppMenu",
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
      "Top app bar with logo, menu, cart badge, progress bar, save/help actions.",
    sourcePath: "src/components/layout/AppHeader.tsx",
    usedIn: "AppShell",
    storybookLink: "/?path=/story/layout-appheader",
  },
  {
    name: "AppMenu",
    category: "layout",
    description:
      "Full-screen side drawer with coverage options, calculator, support links.",
    sourcePath: "src/components/layout/AppMenu.tsx",
    usedIn: "AppHeader hamburger menu",
    storybookLink: "/?path=/story/layout-appmenu",
  },
  {
    name: "AppModal",
    category: "layout",
    description:
      "Reusable responsive dialog/modal with title, close, and action buttons.",
    sourcePath: "src/components/layout/AppModal.tsx",
    usedIn: "Legal docs, confirmations, quote modal",
    storybookLink: "/?path=/story/layout-appmodal",
  },
  {
    name: "AppShell",
    category: "layout",
    description:
      "Top-level layout shell selecting chrome variant (applicationForm, homepage, etc.).",
    sourcePath: "src/components/layout/AppShell.tsx",
    usedIn: "Router (wraps all pages)",
    storybookLink: "/?path=/story/layout-appshell",
  },
  {
    name: "ApplicantSectionDivider",
    category: "layout",
    description:
      "Section header with icon/label for member/spouse/child applicant sections.",
    sourcePath: "src/components/layout/ApplicantSectionDivider.tsx",
    usedIn: "Coverage, Profile pages",
    storybookLink: "/?path=/story/layout-applicantsectiondivider",
  },
  {
    name: "CartDrawer",
    category: "layout",
    description:
      "Shopping cart drawer showing selected coverages and per-product costs.",
    sourcePath: "src/components/layout/CartDrawer.tsx",
    usedIn: "AppHeader cart icon",
    storybookLink: "/?path=/story/layout-cartdrawer",
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
    description: "h6 heading with optional icon for coverage category headers.",
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
    usedIn: "Destructive actions (remove beneficiary, etc.)",
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
    description:
      "Page title + subtitle + optional help at the top of a form page.",
    sourcePath: "src/components/layout/PageHeader.tsx",
    usedIn: "All form pages",
    storybookLink: "/?path=/story/layout-pageheader",
  },
  {
    name: "PageShell",
    category: "layout",
    description:
      "Full page layout with title, error display, max-width, action buttons.",
    sourcePath: "src/components/layout/PageShell.tsx",
    usedIn: "All page wrappers",
    storybookLink: "/?path=/story/layout-pageshell",
  },
  {
    name: "PageTitle",
    category: "layout",
    description: "Page title Typography with optional back arrow button.",
    sourcePath: "src/components/layout/PageTitle.tsx",
    usedIn: "Non-form pages (Resume, Advisor)",
    storybookLink: "/?path=/story/layout-pagetitle",
  },
  {
    name: "ProductCard",
    category: "layout",
    description:
      "Bordered card for individual products with selected/unselected states.",
    sourcePath: "src/components/layout/ProductCard.tsx",
    usedIn: "ProductCatalog, QuoteEstimator",
    storybookLink: "/?path=/story/layout-productcard",
  },
  {
    name: "QuoteModal",
    category: "layout",
    description:
      "Quote/rate comparison modal with product cards and category filter.",
    sourcePath: "src/components/layout/QuoteModal.tsx",
    usedIn: "Coverage page",
    storybookLink: "/?path=/story/layout-quotemodal",
  },
  {
    name: "SectionDivider",
    category: "layout",
    description:
      "Chip-based or text section header divider with optional icon.",
    sourcePath: "src/components/layout/SectionDivider.tsx",
    usedIn: "Form pages (visual separators)",
    storybookLink: "/?path=/story/layout-sectiondivider",
  },
  {
    name: "PageNav",
    category: "navigation",
    description:
      "Bottom-of-page Next button with loading spinner for form navigation.",
    sourcePath: "src/components/navigation/PageNav.tsx",
    usedIn: "All form pages",
    storybookLink: "/?path=/story/navigation-pagenav",
  },
  {
    name: "ProgressStep",
    category: "navigation",
    description:
      "Breadcrumb/stepper progress indicator (Stepper on mobile, Breadcrumbs on desktop).",
    sourcePath: "src/components/navigation/ProgressStep.tsx",
    usedIn: "AppHeader progress bar",
    storybookLink: "/?path=/story/navigation-progressstep",
  },
  {
    name: "FeaturedBadge",
    category: "ui",
    description:
      "Small Featured chip badge with star icon for coverage products.",
    sourcePath: "src/components/ui/FeaturedBadge.tsx",
    usedIn: "ProductCard (featured products)",
    storybookLink: "/?path=/story/ui-featuredbadge",
  },
  {
    name: "ProductCostBreakdown",
    category: "ui",
    description:
      "Itemized premium + rider + policy fee breakdown for a single product.",
    sourcePath: "src/components/ui/ProductCostBreakdown.tsx",
    usedIn: "CartDrawer, TotalCostCart",
    storybookLink: "/?path=/story/ui-productcostbreakdown",
  },
  {
    name: "QuickDecisionIndicator",
    category: "ui",
    description:
      "Small green lightning bolt icon indicating QuickDecision℠ eligibility.",
    sourcePath: "src/components/ui/QuickDecisionIndicator.tsx",
    usedIn: "ProductCard, ProductCatalog",
    storybookLink: "/?path=/story/ui-quickdecisionindicator",
  },
  {
    name: "RateFrequencyToggle",
    category: "ui",
    description:
      "Custom Switch toggle for monthly/annual rate frequency display.",
    sourcePath: "src/components/ui/RateFrequencyToggle.tsx",
    usedIn: "TotalCostCart, CartDrawer",
    storybookLink: "/?path=/story/ui-ratefrequencytoggle",
  },
  {
    name: "TotalCostCart",
    category: "ui",
    description:
      "Full cart cost panel with products, frequency toggle, grand total, edit/delete.",
    sourcePath: "src/components/ui/TotalCostCart.tsx",
    usedIn: "CartDrawer",
    storybookLink: "/?path=/story/ui-totalcostcart",
  },
  {
    name: "TotalCostSummary",
    category: "ui",
    description:
      "Shared Total Estimated Cost summary panel with line items and total.",
    sourcePath: "src/components/ui/TotalCostSummary.tsx",
    usedIn: "Coverage page, Review page",
    storybookLink: "/?path=/story/ui-totalcostsummary",
  },
];

type ConfigRow = {
  name: string;
  description: string;
  sourcePath: string;
  configurable: string;
  usedIn: string;
};

const configurationsData: ConfigRow[] = [
  {
    name: "pages",
    description: "Page registry: IDs, paths, types, and group assignments.",
    sourcePath: "src/config/pages.ts",
    configurable: "Per-client page requirement overrides",
    usedIn: "Router, navigation, form flow",
  },
  {
    name: "formFlow",
    description: "Ordered page sequence and skip/visibility logic per page.",
    sourcePath: "src/config/formFlow.ts",
    configurable: "Skip rules based on coverage selections",
    usedIn: "PageNav next/prev, progress calculation",
  },
  {
    name: "pageSections",
    description: "Section-to-field mappings per page with visibility rules.",
    sourcePath: "src/config/pageSections/pageSections.ts",
    configurable: "visibleWhen rules, applicant scoping",
    usedIn: "FieldRenderer, ApplicationDocumentPreview",
  },
  {
    name: "fieldCatalog",
    description:
      "Master field definitions: labels, input types, options, validation.",
    sourcePath: "src/config/fields/index.ts",
    configurable: "Per-client field overrides (extra/hidden/required)",
    usedIn: "FieldRenderer, pageSections, form state",
  },
  {
    name: "coverages",
    description:
      "Coverage product definitions: amounts, riders, underwriting type.",
    sourcePath: "src/config/coverages/index.ts",
    configurable: "Per-client enabled list, range overrides",
    usedIn: "ProductCatalog, CartDrawer, form flow skip logic",
  },
  {
    name: "coverageCategories",
    description: "Category ID definitions (LI, AD, DI, OO, SH) and labels.",
    sourcePath: "src/config/coverageCategories.ts",
    configurable: "Per-client category filtering",
    usedIn: "CoverageCategorySelector, ProductCatalog",
  },
  {
    name: "pageGroups",
    description: "Logical page groupings for navigation structure.",
    sourcePath: "src/config/pageGroups.ts",
    configurable: "Static",
    usedIn: "Progress bar grouping",
  },
  {
    name: "progressSteps",
    description: "Breadcrumb step definitions mapping steps to page IDs.",
    sourcePath: "src/config/progressSteps.ts",
    configurable: "Dynamic based on active flow",
    usedIn: "ProgressStep component",
  },
  {
    name: "clients (8 configs)",
    description:
      "Per-client branding, support info, coverage overrides, field customizations, features.",
    sourcePath: "src/config/clients/",
    configurable: "Full client-level customization",
    usedIn: "getActiveClient, theme, all page rendering",
  },
  {
    name: "constants",
    description:
      "Shared UI constants: YES_NO_OPTIONS, SURFACE_SX, CARD_RADIUS.",
    sourcePath: "src/config/constants.ts",
    configurable: "Static",
    usedIn: "FieldRenderer options, layout styles",
  },
  {
    name: "coverageConstants",
    description: "Coverage-specific constants for amount calculations.",
    sourcePath: "src/config/coverageConstants.ts",
    configurable: "Static",
    usedIn: "Coverage amount logic",
  },
  {
    name: "transitionMessages",
    description: "Loading/transition messages between page navigations.",
    sourcePath: "src/config/transitionMessages.ts",
    configurable: "Static per page",
    usedIn: "LoadingOverlay",
  },
  {
    name: "theme",
    description:
      "MUI theme overrides: palette, typography, component defaults.",
    sourcePath: "src/app/theme.ts",
    configurable: "Per-client themeColor",
    usedIn: "ThemeProvider (global)",
  },
  {
    name: "content (per-client)",
    description: "Page titles, subtitles, help content, legal docs per client.",
    sourcePath: "src/content/clients/",
    configurable: "Full per-client content overrides",
    usedIn: "getPageTitle, PageHeader, HelpChips, LegalDocList",
  },
];

// Page groups for organizing pages table
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
        "& td, & th": {
          fontSize: { xs: "0.75rem", md: "0.8125rem" },
        },
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

// ---------------------------------------------------------------------------
// Main page component
// ---------------------------------------------------------------------------

export default function InformationArchitecture() {
  const [pageFilter, setPageFilter] = useState("");
  const [flowFilter, setFlowFilter] = useState("");
  const [componentFilter, setComponentFilter] = useState("");
  const [fieldFilter, setFieldFilter] = useState("");
  const [configFilter, setConfigFilter] = useState("");
  const [fieldModalId, setFieldModalId] = useState<string | null>(null);
  const [componentModalName, setComponentModalName] = useState<string | null>(
    null,
  );

  // --- Pages data (organized by group) ---
  const groupedPages = useMemo(() => {
    const lc = pageFilter.toLowerCase();
    const grouped: {
      group: string;
      label: string;
      items: typeof allPagesFlat;
    }[] = [];
    const allPagesFlat = pages.map((page) => ({
      id: page.id as PageId,
      title: getPageTitle(page.id as PageId),
      subhead: getPageSubhead(page.id as PageId) ?? "—",
      navTitle: getPageNavTitle(page.id as PageId),
      path: page.path,
      type: page.type,
      group: "groupId" in page ? (page as { groupId: string }).groupId : "—",
      sourcePath: `src/pages/${page.id
        .split("-")
        .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
        .join("")}.tsx`,
    }));

    // Group pages by pageGroup order
    for (const groupId of pageGroupOrder) {
      const items = allPagesFlat.filter((p) => p.group === groupId);
      if (items.length > 0) {
        const filtered = lc
          ? items.filter((p) =>
              `${p.id} ${p.title} ${p.type} ${p.group} ${p.path}`
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
    // Ungrouped pages (resume, advisor, internal, etc.)
    const ungrouped = allPagesFlat.filter((p) => p.group === "—");
    if (ungrouped.length > 0) {
      const filtered = lc
        ? ungrouped.filter((p) =>
            `${p.id} ${p.title} ${p.type} ${p.group} ${p.path}`
              .toLowerCase()
              .includes(lc),
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

  // --- Flows data ---
  const flowPages = formFlow.map((pageId, idx) => ({
    step: idx + 1,
    id: pageId,
    title: getPageTitle(pageId),
    path: getPagePathLocal(pageId),
    group: getPageGroup(pageId),
    routingRule: getRoutingRule(pageId),
  }));

  const filteredFlows = useMemo(() => {
    if (!flowFilter) return flowPages;
    const lc = flowFilter.toLowerCase();
    return flowPages.filter((f) =>
      `${f.id} ${f.title} ${f.group} ${f.routingRule}`
        .toLowerCase()
        .includes(lc),
    );
  }, [flowFilter, flowPages]);

  // --- Components data ---
  const filteredComponents = useMemo(() => {
    if (!componentFilter) return componentsData;
    const lc = componentFilter.toLowerCase();
    return componentsData.filter((c) =>
      `${c.name} ${c.category} ${c.description} ${c.usedIn}`
        .toLowerCase()
        .includes(lc),
    );
  }, [componentFilter]);

  // --- Fields data (grouped by page/section, demo client only) ---
  const fieldsByPage = useMemo(() => {
    const result: { pageId: PageId; pageTitle: string; rows: FieldRow[] }[] =
      [];
    for (const pageId of formFlow) {
      const rows = getPageFieldRows(pageId).filter(
        (r) => !isClientSpecificField(r.fieldId),
      );
      result.push({ pageId, pageTitle: getPageTitle(pageId), rows });
    }
    // Add coverage product fields as a virtual section
    result.push({
      pageId: "coverage" as PageId,
      pageTitle: "Coverage — Product card fields",
      rows: coverageProductFields,
    });
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

  // --- Configurations data ---
  const filteredConfigs = useMemo(() => {
    if (!configFilter) return configurationsData;
    const lc = configFilter.toLowerCase();
    return configurationsData.filter((c) =>
      `${c.name} ${c.description} ${c.configurable} ${c.usedIn}`
        .toLowerCase()
        .includes(lc),
    );
  }, [configFilter]);

  // --- Modal data ---
  const selectedField = useMemo(() => {
    if (!fieldModalId) return null;
    const catalogField =
      fieldCatalog[fieldModalId as keyof typeof fieldCatalog];
    if (catalogField) return { ...catalogField, id: fieldModalId };
    // Check custom fields
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
    <Box sx={{ py: { xs: 3, md: 5 }, px: { xs: 2, md: 3 } }}>
      <Stack spacing={3} sx={{ maxWidth: "100%" }}>
        {/* Header */}
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

        {/* Table of Contents */}
        <Card
          id="table-of-contents"
          sx={{
            border: "1px solid",
            borderColor: "divider",
            borderRadius: "24px",
            boxShadow: "0 12px 28px rgba(15, 23, 42, 0.06)",
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

        {/* ================================================================
            1. PAGES TABLE (grouped by page group)
        ================================================================ */}
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

        {/* ================================================================
            2. FLOWS TABLE
        ================================================================ */}
        <SectionAccordion
          id="flows-table"
          title="Flows"
          description="Form page sequence, navigation order, and conditional routing/skip rules."
          count={filteredFlows.length}
        >
          <Stack spacing={2}>
            <SearchField
              value={flowFilter}
              onChange={setFlowFilter}
              placeholder="Filter flows…"
            />
            <ResponsiveTableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Step</TableCell>
                    <TableCell>Page ID</TableCell>
                    <TableCell>Title</TableCell>
                    <TableCell>Path</TableCell>
                    <TableCell>Group</TableCell>
                    <TableCell>Routing / skip rule</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredFlows.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>{row.step}</TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                          {row.id}
                        </Typography>
                      </TableCell>
                      <TableCell>{row.title}</TableCell>
                      <TableCell>
                        <Link href={row.path}>{row.path}</Link>
                      </TableCell>
                      <TableCell>{row.group}</TableCell>
                      <TableCell
                        sx={{ whiteSpace: "normal !important", maxWidth: 340 }}
                      >
                        {row.routingRule}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ResponsiveTableContainer>

            {/* Health routing detail */}
            <Accordion
              disableGutters
              variant="outlined"
              sx={{
                borderRadius: "16px !important",
                overflow: "hidden",
                "&:before": { display: "none" },
              }}
            >
              <AccordionSummary expandIcon={<ExpandMoreRoundedIcon />}>
                <Typography sx={{ fontWeight: 700 }}>
                  Health page routing detail
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <ResponsiveTableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Condition</TableCell>
                        <TableCell>Page shown</TableCell>
                        <TableCell>Purpose</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      <TableRow>
                        <TableCell>Coverage has SI underwriting</TableCell>
                        <TableCell>health-si</TableCell>
                        <TableCell>
                          Standard/simplified health questions
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>LI coverage has TELE underwriting</TableCell>
                        <TableCell>health-li</TableCell>
                        <TableCell>
                          Telephone interview health questions
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Coverage has QD underwriting</TableCell>
                        <TableCell>health-qd</TableCell>
                        <TableCell>QuickDecision health questions</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>DI coverage has TELE underwriting</TableCell>
                        <TableCell>health-di</TableCell>
                        <TableCell>Disability-specific health info</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>CIR rider is selected</TableCell>
                        <TableCell>health-cir</TableCell>
                        <TableCell>
                          Critical illness rider health info
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </ResponsiveTableContainer>
              </AccordionDetails>
            </Accordion>
          </Stack>
        </SectionAccordion>

        {/* ================================================================
            3. COMPONENTS TABLE
        ================================================================ */}
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

        {/* ================================================================
            4. FIELDS TABLE (grouped by page, demo client only)
        ================================================================ */}
        <SectionAccordion
          id="fields-table"
          title="Fields"
          description="Field inventory grouped by page/section (demo client). Excludes client-specific fields."
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
                key={`${page.pageId}-${page.pageTitle}`}
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
                          <TableCell sx={{ minWidth: 280 }}>Options</TableCell>
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
                                maxWidth: 280,
                              }}
                            >
                              {row.label}
                            </TableCell>
                            <TableCell>{row.inputType}</TableCell>
                            <TableCell>{row.required}</TableCell>
                            <TableCell
                              sx={{
                                whiteSpace: "normal !important",
                                minWidth: 280,
                              }}
                            >
                              {row.options}
                            </TableCell>
                            <TableCell
                              sx={{
                                whiteSpace: "normal !important",
                                maxWidth: 240,
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

        {/* ================================================================
            5. CONFIGURATIONS TABLE
        ================================================================ */}
        <SectionAccordion
          id="configurations-table"
          title="Configurations"
          description="Configuration sources defining application behavior, routing, and client customization."
          count={filteredConfigs.length}
        >
          <Stack spacing={2}>
            <SearchField
              value={configFilter}
              onChange={setConfigFilter}
              placeholder="Filter configurations…"
            />
            <ResponsiveTableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Config</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell>Source path</TableCell>
                    <TableCell>Configurability</TableCell>
                    <TableCell>Used in</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredConfigs.map((config) => (
                    <TableRow key={config.name}>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                          {config.name}
                        </Typography>
                      </TableCell>
                      <TableCell
                        sx={{ whiteSpace: "normal !important", maxWidth: 300 }}
                      >
                        {config.description}
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" color="text.secondary">
                          {config.sourcePath}
                        </Typography>
                      </TableCell>
                      <TableCell
                        sx={{ whiteSpace: "normal !important", maxWidth: 220 }}
                      >
                        {config.configurable}
                      </TableCell>
                      <TableCell
                        sx={{ whiteSpace: "normal !important", maxWidth: 220 }}
                      >
                        {config.usedIn}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ResponsiveTableContainer>
          </Stack>
        </SectionAccordion>
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
            {selectedField.options && selectedField.options.length > 0 && (
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
            {clientConfiguredFields.has(fieldModalId!) && (
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
            Field not found in catalog (may be a page-level custom field).
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
