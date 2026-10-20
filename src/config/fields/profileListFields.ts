// Shared by the page renderer and the Library inspection inventory.
import type { FieldDefinition } from "./types";

export const disabilityCompanyFields: FieldDefinition[] = [
  {
    id: "di-company-name",
    label: "Company",
    inputType: "text",
    labelVariant: "floating",
    required: true,
  },
  {
    id: "di-company-monthly-benefit",
    label: "Monthly Benefit Amount",
    inputType: "text",
    format: "currency",
    inputMode: "numeric",
    labelVariant: "floating",
    required: true,
    helperText:
      "You can find your current coverage amount in your recent statement from your carrier.",
  },
  {
    id: "di-company-benefit-period",
    label: "Benefit Period",
    inputType: "text",
    placeholder: "Age 65 or older, 1-5 year, etc.",
    labelVariant: "floating",
    required: true,
  },
  {
    id: "di-company-waiting-period",
    label: "Waiting Period",
    inputType: "text",
    placeholder: "30 days, 60 days, etc",
    labelVariant: "floating",
    required: true,
  },
];

export const disabilityCompanyMapping = {
  fields: disabilityCompanyFields,
  fieldToKey: {
    "di-company-name": "company",
    "di-company-monthly-benefit": "monthlyBenefitAmount",
    "di-company-benefit-period": "benefitPeriod",
    "di-company-waiting-period": "waitingPeriod",
  } as const,
};
