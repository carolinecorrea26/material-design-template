import type { ApplicantSectionId } from "../../config/formSectionTitle";
import { getApplicantsApplying } from "../../utils/applicantsApplying";

export type FormValuesLike = Record<string, unknown>;
export type ApplicantLike = ApplicantSectionId | "member";

export function hasDependentsSelected(values: FormValuesLike): boolean {
  return getApplicantsApplying(values).some(
    (applicant) => applicant !== "member",
  );
}

export function isApplicantApplying(
  applicant: ApplicantLike,
  values: FormValuesLike,
): boolean {
  const applicantId = applicant === "self" ? "member" : applicant;
  return getApplicantsApplying(values).includes(applicantId);
}

export function shouldShowApplicantLabel(
  applicant: ApplicantLike,
  values: FormValuesLike,
): boolean {
  if (applicant === "self" || applicant === "member") {
    return hasDependentsSelected(values);
  }

  return isApplicantApplying(applicant, values);
}
