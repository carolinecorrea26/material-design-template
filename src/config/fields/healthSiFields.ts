// Shared by the page renderer and the Library inspection inventory.
import type { FieldDefinition } from "./types";
import { YES_NO_OPTIONS } from "../constants";
export const detailsFields: FieldDefinition[] = [
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
    label:
      "Condition/Medication & Details (e.g. Medical Advice Given, Treatment, Results, Date Recovered)",
    inputType: "text",
    required: true,
    multiline: true,
    minRows: 3,
    labelVariant: "standard",
  },
  {
    id: "physicianAddress",
    label: "Name and Address of Each Physician, Practitioner, and Hospital",
    inputType: "text",
    required: true,
    multiline: true,
    minRows: 3,
    labelVariant: "standard",
  },
];

export const detailsMapping = {
  fields: detailsFields,
  fieldToKey: {
    onset: "onset",
    conditionsDetails: "conditionsDetails",
    physicianAddress: "physicianAddress",
  } as const,
};

export const QUESTIONS = [
  {
    key: "q1",
    label:
      "Are you now taking any prescribed medication or receiving or contemplating any medical attention or surgical treatment?",
  },
  {
    key: "q2",
    label:
      "During the past five years, have you ever been medically diagnosed by a physician as having or been treated for: heart or circulatory trouble, elevated blood pressure, chest pain or pressure, gynecological or genitourinary disorders, ulcers, cancer, diabetes, mental or nervous disorder or psychotherapeutic treatment, epilepsy, respiratory disorder, kidney or liver disorder, including hepatitis, enlarged lymph nodes or immunodeficiency disorder, thyroid disorder, blood disorder, albumin, blood, pus or sugar in urine, back trouble/disorder, bone or joint disorder, arthritis, varicose veins, or unexplained weight loss?",
  },
  {
    key: "q3",
    label:
      "During the past five years have you ever been counseled, treated or hospitalized for the use of alcohol or drugs?",
  },
  {
    key: "q4",
    label: "Are you now pregnant?",
  },
  {
    key: "q5",
    label:
      "Are you now disabled, or applied or applying for, or receiving any disability or Workers\u2019 Compensation benefits or a waiver of premium for life or health insurance?",
  },
];

export function createAnswerFields(applicant: "self" | "spouse"): FieldDefinition[] {
  const suffix = applicant === "spouse" ? "-spouse" : "";
  return QUESTIONS.map((q) => ({
    id: `health-si-${q.key}${suffix}`,
    label: q.label,
    inputType: "radio" as const,
    required: true,
    options: YES_NO_OPTIONS,
    labelVariant: "standard" as const,
  }));
}
