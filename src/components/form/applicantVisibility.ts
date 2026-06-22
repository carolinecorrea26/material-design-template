import type { ApplicantSectionId } from "../../config/formSectionTitle";
import type { CoverageApplicantId } from "../../config/coverages/types";

export type FormValuesLike = Record<string, unknown>;
export type ApplicantLike = ApplicantSectionId | "member";

function getProductApplicantsFromValues(
  values: FormValuesLike,
): Record<string, CoverageApplicantId[]> {
  const raw = values.productApplicants;
  if (raw != null && typeof raw === "object" && !Array.isArray(raw)) {
    return raw as Record<string, CoverageApplicantId[]>;
  }
  return {};
}

function hasNonMemberApplicantSelected(values: FormValuesLike): boolean {
  const selectedDependents = getSelectedDependents(values);
  const productApplicants = getProductApplicantsFromValues(values);
  for (const applicants of Object.values(productApplicants)) {
    if (
      Array.isArray(applicants) &&
      applicants.some((a) => a !== "member" && selectedDependents.includes(a))
    ) {
      return true;
    }
  }
  return false;
}

function getSelectedDependents(values: FormValuesLike): string[] {
  const dependents = values.dependents;
  return Array.isArray(dependents) ? dependents : [];
}

function isApplicantInProductSelections(
  applicant: CoverageApplicantId,
  values: FormValuesLike,
): boolean {
  // If the dependent type is no longer selected on eligibility, it's not applying
  if (
    applicant === "spouse" &&
    !getSelectedDependents(values).includes("spouse")
  )
    return false;
  if (applicant === "child" && !getSelectedDependents(values).includes("child"))
    return false;

  const productApplicants = getProductApplicantsFromValues(values);
  for (const applicants of Object.values(productApplicants)) {
    if (Array.isArray(applicants) && applicants.includes(applicant)) {
      return true;
    }
  }
  return false;
}

export function hasDependentsSelected(values: FormValuesLike): boolean {
  return hasNonMemberApplicantSelected(values);
}

export function isApplicantApplying(
  applicant: ApplicantLike,
  values: FormValuesLike,
): boolean {
  const applicantId: CoverageApplicantId =
    applicant === "self" ? "member" : applicant;
  return isApplicantInProductSelections(applicantId, values);
}

export function shouldShowApplicantLabel(
  applicant: ApplicantLike,
  values: FormValuesLike,
): boolean {
  if (applicant === "self" || applicant === "member") {
    return hasNonMemberApplicantSelected(values);
  }

  return isApplicantInProductSelections(applicant, values);
}
