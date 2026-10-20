// Shared by the page renderer and the Library inspection inventory.
import type { FieldDefinition } from "./types";

export const RELATIONSHIP_OPTIONS = [
  "Spouse",
  "Child",
  "Parent",
  "Sibling",
  "Other Relative",
  "Other",
];

export const BENEFICIARY_INDIVIDUAL_FIELDS: FieldDefinition[] = [
  {
    id: "firstName",
    label: "First Name",
    inputType: "text",
    required: true,
  },
  {
    id: "lastName",
    label: "Last Name",
    inputType: "text",
    required: true,
  },
  {
    id: "relationship",
    label: "Relationship",
    inputType: "dropdown",
    required: true,
    options: RELATIONSHIP_OPTIONS.map((r) => ({ value: r, label: r })),
  },
  {
    id: "share",
    label: "% Share",
    inputType: "text",
    inputMode: "numeric",
    required: true,
    format: "percent",
  },
];

export const BENEFICIARY_TRUST_FIELDS: FieldDefinition[] = [
  {
    id: "trustName",
    label: "Name of Trust",
    inputType: "text",
    required: true,
  },
  {
    id: "trustDate",
    label: "Date of Trust",
    inputType: "date",
    required: true,
  },
];

export const BENEFICIARY_INFO_OPT_IN_FIELD_ID = "beneficiary-information-opt-in";

export const beneficiaryInfoOptInField: FieldDefinition = {
  id: BENEFICIARY_INFO_OPT_IN_FIELD_ID,
  label: "Do you want to add beneficiary information?",
  inputType: "radio",
  required: true,
  options: [
    { value: "yes", label: "Yes" },
    { value: "no", label: "No" },
  ],
};
