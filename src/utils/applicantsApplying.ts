import type { CoverageApplicantId } from "../config/coverages/types";

export type ApplicantsApplyingValues = Record<string, unknown>;

const validApplicantIds = new Set<CoverageApplicantId>([
  "member",
  "spouse",
  "child",
]);

function normalizeApplicant(applicant: unknown): CoverageApplicantId | null {
  if (typeof applicant !== "string") {
    return null;
  }

  const normalized = applicant.trim().toLowerCase();

  if (normalized === "self") {
    return "member";
  }

  if (validApplicantIds.has(normalized as CoverageApplicantId)) {
    return normalized as CoverageApplicantId;
  }

  return null;
}

function uniqueApplicants(applicants: unknown[]): CoverageApplicantId[] {
  const normalizedApplicants: CoverageApplicantId[] = [];

  for (const applicant of applicants) {
    const normalized = normalizeApplicant(applicant);

    if (normalized && !normalizedApplicants.includes(normalized)) {
      normalizedApplicants.push(normalized);
    }
  }

  return normalizedApplicants;
}

function getSelectedDependents(
  values: ApplicantsApplyingValues,
): CoverageApplicantId[] {
  const dependents = values.dependents;

  if (!Array.isArray(dependents)) {
    return [];
  }

  return uniqueApplicants(dependents).filter(
    (applicant): applicant is Exclude<CoverageApplicantId, "member"> =>
      applicant === "spouse" || applicant === "child",
  );
}

function getSelectedCoverageIds(values: ApplicantsApplyingValues): string[] {
  const selectedCoverageIds = values.coverageSelections;

  if (!Array.isArray(selectedCoverageIds)) {
    return [];
  }

  return selectedCoverageIds.map(String);
}

function getProductApplicants(
  values: ApplicantsApplyingValues,
): Record<string, CoverageApplicantId[]> {
  const rawProductApplicants = values.productApplicants;

  if (
    rawProductApplicants != null &&
    typeof rawProductApplicants === "object" &&
    !Array.isArray(rawProductApplicants)
  ) {
    return rawProductApplicants as Record<string, CoverageApplicantId[]>;
  }

  return {};
}

function getCoverageAmounts(
  values: ApplicantsApplyingValues,
): Record<string, unknown> {
  const rawCoverageAmounts = values.coverageAmounts;

  if (
    rawCoverageAmounts != null &&
    typeof rawCoverageAmounts === "object" &&
    !Array.isArray(rawCoverageAmounts)
  ) {
    return rawCoverageAmounts as Record<string, unknown>;
  }

  return {};
}

function toPositiveAmount(value: unknown): number {
  if (typeof value === "number") {
    return Number.isFinite(value) && value > 0 ? value : 0;
  }

  if (typeof value === "string") {
    const parsed = Number(value.replace(/[^\d.-]/g, ""));
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
  }

  return 0;
}

function getApplicantsFromPositiveCoverageAmounts(
  values: ApplicantsApplyingValues,
): CoverageApplicantId[] {
  const selectedCoverageIds = getSelectedCoverageIds(values);

  if (selectedCoverageIds.length === 0) {
    return [];
  }

  const selectedCoverageIdSet = new Set(selectedCoverageIds);
  const applicantsApplying: CoverageApplicantId[] = [];

  Object.entries(getCoverageAmounts(values)).forEach(([key, rawAmount]) => {
    if (toPositiveAmount(rawAmount) <= 0) {
      return;
    }

    const [coverageId, applicantId] = key.split(":");

    if (!coverageId || !selectedCoverageIdSet.has(coverageId)) {
      return;
    }

    const normalizedApplicant = normalizeApplicant(applicantId);

    if (
      normalizedApplicant &&
      !applicantsApplying.includes(normalizedApplicant)
    ) {
      applicantsApplying.push(normalizedApplicant);
    }
  });

  return applicantsApplying;
}

function getApplicantsFromCoverageSelections(
  values: ApplicantsApplyingValues,
): CoverageApplicantId[] {
  const selectedCoverageIds = getSelectedCoverageIds(values);

  if (selectedCoverageIds.length === 0) {
    return [];
  }

  const selectedDependents = getSelectedDependents(values);

  // Member-only flow: self applies by default.
  if (selectedDependents.length === 0) {
    return ["member"];
  }

  const productApplicants = getProductApplicants(values);

  return uniqueApplicants(
    selectedCoverageIds.flatMap((coverageId) => {
      const applicantsForProduct = productApplicants[coverageId];

      if (!Array.isArray(applicantsForProduct)) {
        return [];
      }

      return applicantsForProduct;
    }),
  );
}

export function deriveApplicantsApplying(
  values: ApplicantsApplyingValues,
): CoverageApplicantId[] {
  const applicantsFromAmounts =
    getApplicantsFromPositiveCoverageAmounts(values);

  if (applicantsFromAmounts.length > 0) {
    return applicantsFromAmounts;
  }

  const applicantsFromCoverage = getApplicantsFromCoverageSelections(values);

  if (applicantsFromCoverage.length > 0) {
    return applicantsFromCoverage;
  }

  return uniqueApplicants(["member", ...getSelectedDependents(values)]);
}

export function getApplicantsApplying(
  values: ApplicantsApplyingValues,
): CoverageApplicantId[] {
  return deriveApplicantsApplying(values);
}

export function withApplicantsApplying<T extends ApplicantsApplyingValues>(
  values: T,
): T & { applicantsApplying: CoverageApplicantId[] } {
  return {
    ...values,
    applicantsApplying: deriveApplicantsApplying(values),
  };
}
