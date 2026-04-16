import type { ApplicantSectionId } from "../../config/formSectionTitle";
import type { CoverageApplicantId } from "../../config/coverages/types";
import type { PageId } from "../../types/page";

export type FormValuesLike = Record<string, unknown>;
export type ApplicantLike = ApplicantSectionId | "member";

const validApplicantIds = new Set<CoverageApplicantId>([
  "member",
  "spouse",
  "child",
]);

export function getSelectedDependents(values: FormValuesLike): string[] {
  const dependents = values.dependents;
  return Array.isArray(dependents) ? dependents.map(String) : [];
}

function getSelectedCoverageIds(values: FormValuesLike): string[] {
  const selectedCoverageIds = values.coverageSelections;
  return Array.isArray(selectedCoverageIds)
    ? selectedCoverageIds.map(String)
    : [];
}

function getProductApplicants(
  values: FormValuesLike,
): Record<string, CoverageApplicantId[]> {
  const raw = values.productApplicants;
  if (raw != null && typeof raw === "object" && !Array.isArray(raw)) {
    return raw as Record<string, CoverageApplicantId[]>;
  }
  return {};
}

function normalizeApplicant(applicant: string): CoverageApplicantId | null {
  const normalized = applicant.trim().toLowerCase();
  if (normalized === "self") return "member";
  if (validApplicantIds.has(normalized as CoverageApplicantId)) {
    return normalized as CoverageApplicantId;
  }
  return null;
}

function getCoverageApplicants(
  coverageId: string,
  values: FormValuesLike,
): CoverageApplicantId[] {
  const selectedDependents = getSelectedDependents(values);

  // Member-only flow has no chips; selected product always means member applies.
  if (selectedDependents.length === 0) {
    return ["member"];
  }

  const configuredApplicants = getProductApplicants(values)[coverageId];
  if (!Array.isArray(configuredApplicants)) {
    return [];
  }

  const normalized = configuredApplicants
    .map((applicant) => normalizeApplicant(String(applicant)))
    .filter((applicant): applicant is CoverageApplicantId => applicant != null);

  return normalized;
}

function isDependentApplying(
  dependent: "spouse" | "child",
  values: FormValuesLike,
): boolean {
  const selectedCoverageIds = getSelectedCoverageIds(values);
  if (selectedCoverageIds.length === 0) {
    return false;
  }

  return selectedCoverageIds.some((coverageId) =>
    getCoverageApplicants(coverageId, values).includes(dependent),
  );
}

function isMemberApplying(values: FormValuesLike): boolean {
  const selectedCoverageIds = getSelectedCoverageIds(values);
  if (selectedCoverageIds.length === 0) {
    return false;
  }

  return selectedCoverageIds.some((coverageId) =>
    getCoverageApplicants(coverageId, values).includes("member"),
  );
}

function usesCoverageSelectionApplicantState(pageId?: PageId): boolean {
  return pageId !== undefined;
}

export function hasDependentsSelected(values: FormValuesLike): boolean {
  return (
    isDependentApplying("spouse", values) ||
    isDependentApplying("child", values)
  );
}

export function isApplicantApplying(
  applicant: ApplicantLike,
  values: FormValuesLike,
): boolean {
  if (applicant === "self" || applicant === "member") {
    return isMemberApplying(values);
  }

  if (applicant === "spouse") {
    return isDependentApplying("spouse", values);
  }

  if (applicant === "child") {
    return isDependentApplying("child", values);
  }

  return false;
}

export function shouldShowApplicantLabel(
  applicant: ApplicantLike,
  values: FormValuesLike,
  pageId?: PageId,
): boolean {
  if (!usesCoverageSelectionApplicantState(pageId)) {
    if (applicant === "self" || applicant === "member") {
      return getSelectedDependents(values).length > 0;
    }

    return getSelectedDependents(values).includes(applicant);
  }

  if (applicant === "self" || applicant === "member") {
    return hasDependentsSelected(values);
  }

  return isApplicantApplying(applicant, values);
}
