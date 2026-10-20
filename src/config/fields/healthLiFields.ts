// Shared by the page renderer and the Library inspection inventory.
import type { FieldDefinition } from "./types";
import { YES_NO_OPTIONS } from "../constants";
export const HEALTH_QUESTIONS = [
  "Are you currently confined to a hospital, nursing home, psychiatric facility, incarcerated in a prison/correctional facility, currently on parole or currently receiving home health care/assisted living care?",
  "During the last five years, have you ever been declined, postponed, or offered rated life or health insurance or been denied a reinstatement, reissue or renewal for life or health insurance, or are you currently receiving disability benefits?",
  "Are you currently undergoing a medical evaluation for any condition not yet given a diagnosis?",
  "In the last five years, have you been convicted of a felony; been charged or convicted with assault; been charged with operating a vehicle while under the influence of alcohol or drugs; been charged three or more times with a moving violation; currently have a revoked or suspended license; or currently on parole or incarcerated in a correctional institution?",
  "During the last five years, has any person to be insured been medically diagnosed by a licensed member of the medical profession with HIV or AIDS, or tested positive for Human Immunodeficiency Virus (HIV)?",
  "During the last five years have you been medically diagnosed by a licensed member of the medical profession as having or been treated for heart disease, a heart attack, chest pains, irregular heartbeat, arrhythmia, open heart surgery, defibrillator or a pacemaker?",
  "During the last five years have you been medically diagnosed by a licensed member of the medical profession as having or been treated for diabetes, a stroke (CVA), a transient ischemic attack (TIA), aneurysm or kidney disease?",
  "During the last five years have you been medically diagnosed by a licensed member of the medical profession as having or been treated for depression, anxiety, mental disorder, suicide attempt(s), drug use or treatment, or alcohol abuse or treatment?",
  "During the last five years have you been medically diagnosed by a licensed member of the medical profession as having or been treated for cirrhosis, hepatitis, Lou Gehrig\u2019s Disease/ALS or other neuro-muscular, paralysis or seizure disorder?",
  "During the last five years have you been medically diagnosed by a licensed member of the medical profession as having or been treated for cancer (except basal cell or squamous cell skin cancer), tumors, cysts, masses or growths of any type, lymphoma, any blood disorder, except HIV, or connective tissue disorder?",
  "During the last five years have you been medically diagnosed by a licensed member of the medical profession as having or been treated for Crohn\u2019s disease, disorder of pancreas, disorder of the immune system, except HIV?",
  "During the last five years have you been medically diagnosed by a licensed member of the medical profession as having or been treated for hypertension, elevated cholesterol, respiratory disease or disorder, or sleep apnea?",
  "During the last five years have you been medically diagnosed by a licensed member of the medical profession as having or been treated for anemia, colitis or arthritis?",
  "During the past five years, have you flown an airplane (other than scheduled commercial or corporate aviation); engaged in any of the following: sky sports, underwater sports, climbing sports, motor sports, in any type vehicle, or any extreme sport (bungee jumping, cave exploration, heliskiing, rodeo riding, etc)?",
  "Have any of your siblings or either of your parents been diagnosed with or died from cancer or cardiovascular disease prior to age 60?",
];

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
      "Condition/Medication & Details (Medical Advice Given, Treatment, Results, Date Recovered)",
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
    required: false,
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

export function createQuestionFields(applicant: "self" | "spouse"): FieldDefinition[] {
  const suffix = applicant === "spouse" ? "-spouse" : "";
  return HEALTH_QUESTIONS.map((question, index) => ({
    id: `health-li-q${index + 1}${suffix}`,
    label: question,
    inputType: "radio" as const,
    required: true,
    options: YES_NO_OPTIONS,
    labelVariant: "standard" as const,
  }));
}
