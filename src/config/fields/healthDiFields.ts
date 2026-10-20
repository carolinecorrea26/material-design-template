// Shared by the page renderer and the Library inspection inventory.
import type { FieldDefinition } from "./types";
import { YES_NO_OPTIONS } from "../constants";
export const generalFields: FieldDefinition[] = [
  {
    id: "details",
    label: "Details",
    inputType: "text",
    required: true,
    multiline: true,
    minRows: 3,
    labelVariant: "standard",
  },
];

export const specificFields: FieldDefinition[] = [
  {
    id: "onset",
    label: "Month/Year of Onset",
    inputType: "text",
    format: "month-year",
    required: true,
    helperText: "mm/yyyy",
    labelVariant: "standard",
  },
  {
    id: "conditionsDetails",
    label: "Conditions & Details",
    inputType: "text",
    required: true,
    multiline: true,
    minRows: 3,
    labelVariant: "standard",
  },
  {
    id: "physicianAddress",
    label: "Name and address of each physician, practitioner, and hospital",
    inputType: "text",
    required: false,
    multiline: true,
    minRows: 3,
    labelVariant: "standard",
  },
];

export const assistanceFields: FieldDefinition[] = [
  {
    id: "assistanceType",
    label: "Assistance Type",
    inputType: "dropdown",
    required: true,
    placeholder: "Select",
    options: [
      { value: "bathing", label: "Bathing" },
      { value: "dressing", label: "Dressing" },
      { value: "eating", label: "Eating" },
      { value: "walking", label: "Walking" },
      {
        value: "moving",
        label: "Moving in/out of a bed or chair or wheel chair",
      },
      { value: "toileting", label: "Toileting" },
      { value: "bowel-bladder", label: "Bowel or bladder control" },
    ],
  },
  {
    id: "onset",
    label: "Month/Year of Onset",
    inputType: "text",
    format: "month-year",
    required: true,
    helperText: "mm/yyyy",
    labelVariant: "standard",
  },
  {
    id: "conditionsDetails",
    label: "Conditions & Details",
    inputType: "text",
    required: true,
    multiline: true,
    minRows: 3,
    labelVariant: "standard",
  },
  {
    id: "physicianAddress",
    label: "Name and address of each physician, practitioner, and hospital",
    inputType: "text",
    required: false,
    multiline: true,
    minRows: 3,
    labelVariant: "standard",
  },
];

export const fallDiagnosisFields: FieldDefinition[] = [
  {
    id: "fallType",
    label: "Fall Type/Diagnosis",
    inputType: "text",
    required: true,
    labelVariant: "standard",
  },
  {
    id: "onset",
    label: "Month/Year of Onset",
    inputType: "text",
    format: "month-year",
    required: true,
    helperText: "mm/yyyy",
    labelVariant: "standard",
  },
  {
    id: "conditionsDetails",
    label: "Conditions & Details",
    inputType: "text",
    required: true,
    multiline: true,
    minRows: 3,
    labelVariant: "standard",
  },
  {
    id: "physicianAddress",
    label: "Name and address of each physician, practitioner, and hospital",
    inputType: "text",
    required: false,
    multiline: true,
    minRows: 3,
    labelVariant: "standard",
  },
];

export const generalMapping = {
  fields: generalFields,
  fieldToKey: { details: "details" } as const,
};

export const specificMapping = {
  fields: specificFields,
  fieldToKey: {
    onset: "onset",
    conditionsDetails: "conditionsDetails",
    physicianAddress: "physicianAddress",
  } as const,
};

export const assistanceMapping = {
  fields: assistanceFields,
  fieldToKey: {
    assistanceType: "assistanceType",
    onset: "onset",
    conditionsDetails: "conditionsDetails",
    physicianAddress: "physicianAddress",
  } as const,
};

export const fallDiagnosisMapping = {
  fields: fallDiagnosisFields,
  fieldToKey: {
    fallType: "fallType",
    onset: "onset",
    conditionsDetails: "conditionsDetails",
    physicianAddress: "physicianAddress",
  } as const,
};

export const QUESTIONS = [
  {
    key: "q1",
    label:
      "Do you currently need or in the past 5 years have you needed human assistance or supervision to perform any of the following activities? Bathing, dressing, eating, walking, moving in/out of a bed or chair or wheel chair, toileting, bowel or bladder control. If \u201cYes,\u201d please check all that apply.",
    mapping: assistanceMapping,
    renderKind: "renderAssistanceItem" as const,
  },
  {
    key: "q2",
    label:
      "Within the past 5 years, have you had a fall or been diagnosed or treated by a member of the medical profession for a fracture, paralysis, numbness, balance problems or skin ulcers?",
    mapping: fallDiagnosisMapping,
    renderKind: "renderFallItem" as const,
  },
  {
    key: "q3",
    label:
      "Do you currently or in the past 5 years, have you been wheelchair-dependent or required supportive equipment such as braces, crutches, walker, cane, back support, or splint?",
    mapping: specificMapping,
    renderKind: "renderSpecificItem" as const,
  },
  {
    key: "q4",
    label:
      "Within the past 6 months, have you had or been recommended by a member of the medical profession to have physical therapy?",
    mapping: specificMapping,
    renderKind: "renderSpecificItem" as const,
  },
  {
    key: "q5",
    label:
      "Within the past 5 years, have you been evaluated, counseled, treated by a member of the medical profession or hospitalized for any problems with memory or ability to think or reason?",
    mapping: specificMapping,
    renderKind: "renderSpecificItem" as const,
  },
  {
    key: "q6",
    label:
      "Within the past 5 years, have you been confined or had confinement been recommended by a member of the medical profession to a hospital, nursing home, rehabilitation facility, assisted living unit or extended care facility?",
    mapping: specificMapping,
    renderKind: "renderSpecificItem" as const,
  },
  {
    key: "q7",
    label:
      "Within the past 5 years, have you been declined for issue, reinstatement or renewal of any type of long-term care insurance?",
    mapping: generalMapping,
    renderKind: "renderGeneralItem" as const,
  },
];

export function createAnswerFields(applicant: "self" | "spouse"): FieldDefinition[] {
  const suffix = applicant === "spouse" ? "-spouse" : "";
  return QUESTIONS.map((q) => ({
    id: `health-di-${q.key}${suffix}`,
    label: q.label,
    inputType: "radio" as const,
    required: true,
    options: YES_NO_OPTIONS,
    labelVariant: "standard" as const,
  }));
}
