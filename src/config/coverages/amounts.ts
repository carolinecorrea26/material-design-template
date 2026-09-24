import type {
  CoverageAmountAssignment,
  CoverageApplicantId,
} from "./types";

export type RangeTuple = [min: number, max: number, increment?: number];

/** Concise data-authoring helper; the stored model remains scoped assignments. */
export function rangeAssignments(
  ranges: Partial<Record<CoverageApplicantId, RangeTuple>>,
): CoverageAmountAssignment[] {
  return (Object.entries(ranges) as Array<[CoverageApplicantId, RangeTuple]>).map(
    ([applicantType, [min, max, increment]]) => ({
      scope: { applicantType },
      selections: [
        {
          type: "range",
          min,
          max,
          increment: increment ?? defaultIncrement(min, max),
        },
      ],
    }),
  );
}

/** Client assignments replace global assignments with the same exact scope. */
export function mergeCoverageAmountAssignments(
  globalAssignments: CoverageAmountAssignment[] | undefined,
  clientAssignments: CoverageAmountAssignment[] | undefined,
): CoverageAmountAssignment[] | undefined {
  if (!clientAssignments) return globalAssignments;
  const scopeKey = (assignment: CoverageAmountAssignment) =>
    `${assignment.scope?.applicantType ?? "*"}:${assignment.scope?.applicantClassId ?? "*"}`;
  const clientKeys = new Set(clientAssignments.map(scopeKey));
  return [
    ...(globalAssignments ?? []).filter((assignment) => !clientKeys.has(scopeKey(assignment))),
    ...clientAssignments,
  ];
}

function defaultIncrement(min: number, max: number): number {
  if (min === max) return 1;
  if (max <= 1000) return 50;
  if (max <= 20000) return 100;
  return 10000;
}
