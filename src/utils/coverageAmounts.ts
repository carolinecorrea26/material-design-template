import type {
  CoverageAmountAssignment,
  CoverageApplicantId,
  CoverageDefinition,
  CoverageScope,
} from "../config/coverages/types";

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

function scopeScore(candidate: CoverageScope | undefined, requested: CoverageScope) {
  if (!candidate) return 0;
  if (candidate.applicantType && candidate.applicantType !== requested.applicantType) return -1;
  if (candidate.applicantClassId && candidate.applicantClassId !== requested.applicantClassId) return -1;
  return (candidate.applicantType ? 1 : 0) + (candidate.applicantClassId ? 2 : 0);
}

/** Resolves the most-specific default/applicant/class amount assignment. */
export function getCoverageAmountAssignment(
  coverage: Pick<CoverageDefinition, "coverageAmounts">,
  applicantType: CoverageApplicantId = "member",
  applicantClassId?: string,
): CoverageAmountAssignment | undefined {
  const requested = { applicantType, applicantClassId };
  return coverage.coverageAmounts
    ?.map((assignment) => ({ assignment, score: scopeScore(assignment.scope, requested) }))
    .filter(({ score }) => score >= 0)
    .sort((a, b) => b.score - a.score)[0]?.assignment;
}

/** Numeric bounds used by existing slider-based prototype surfaces. */
export function getCoverageAmountRange(
  coverage: Pick<CoverageDefinition, "coverageAmounts">,
  applicantId: CoverageApplicantId = "member",
  applicantClassId?: string,
) {
  const assignment = getCoverageAmountAssignment(coverage, applicantId, applicantClassId);
  const numeric = (assignment?.selections ?? []).flatMap((selection) =>
    selection.type === "range"
      ? [selection.min, selection.max]
      : selection.type === "amountList"
        ? selection.values
        : [],
  );
  const singleSelection = assignment?.selections?.length === 1
    ? assignment.selections[0]
    : undefined;
  return {
    minAmount: numeric.length > 0 ? Math.min(...numeric) : undefined,
    maxAmount: numeric.length > 0 ? Math.max(...numeric) : undefined,
    step: singleSelection?.type === "range" ? singleSelection.increment : undefined,
  };
}

/** Exact numeric choices, preserving explicit lists and gaps between ranges. */
export function getCoverageAmountChoices(
  coverage: Pick<CoverageDefinition, "coverageAmounts">,
  applicantId: CoverageApplicantId = "member",
  applicantClassId?: string,
): number[] {
  const assignment = getCoverageAmountAssignment(coverage, applicantId, applicantClassId);
  const values = (assignment?.selections ?? []).flatMap((selection) => {
    if (selection.type === "amountList") return selection.values;
    if (selection.type === "optionList") return [];
    const result: number[] = [];
    for (let value = selection.min; value <= selection.max; value += selection.increment) {
      result.push(value);
    }
    return result;
  });
  return [...new Set(values)].sort((a, b) => a - b);
}

export function formatCoverageAmountAssignment(assignment: CoverageAmountAssignment): string {
  const selections = (assignment.selections ?? []).map((selection) => {
    if (selection.type === "amountList") {
      return selection.values.map((value) => currency.format(value)).join(", ");
    }
    if (selection.type === "optionList") {
      return selection.options.map((option) => option.label).join(", ");
    }
    if (selection.min === selection.max) return currency.format(selection.min);
    return `${currency.format(selection.min)}–${currency.format(selection.max)} · ${currency.format(selection.increment)} increments`;
  });
  if (assignment.derivedFrom) {
    const { calculation } = assignment.derivedFrom;
    selections.push(
      calculation.type === "percentage"
        ? `${calculation.value}% of ${assignment.derivedFrom.applicantType}`
        : `${currency.format(calculation.value)} from ${assignment.derivedFrom.applicantType}`,
    );
  }
  return selections.join("; ") || "—";
}

export function formatCoverageAmounts(
  coverage: Pick<CoverageDefinition, "coverageAmounts">,
  classLabels: Record<string, string> = {},
): string {
  const applicantLabels: Record<CoverageApplicantId, string> = {
    member: "Member",
    spouse: "Spouse",
    child: "Child",
  };
  return coverage.coverageAmounts
    ?.map((assignment) => {
      const scope = assignment.scope;
      const label = scope?.applicantClassId
        ? classLabels[scope.applicantClassId] ?? scope.applicantClassId
        : scope?.applicantType
          ? applicantLabels[scope.applicantType]
          : "Default";
      return `${label}: ${formatCoverageAmountAssignment(assignment)}`;
    })
    .join("\n") || "—";
}
