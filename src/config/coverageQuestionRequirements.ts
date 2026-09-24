import type { CoverageCategoryId } from "./coverages/types";
import type { FieldId } from "./fields/types";

export type CoverageQuestionApplicant = "self" | "spouse";

type ApplicantQuestionFields = Partial<
  Record<CoverageQuestionApplicant, readonly FieldId[]>
>;

/** Canonical coverage-category → application-question relationship. */
export const coverageQuestionRequirements: Record<
  CoverageCategoryId,
  ApplicantQuestionFields
> = {
  LI: {
    self: ["gender", "smoker", "tobacco-last-used", "tobacco-products"],
    spouse: [
      "spouse-gender",
      "spouse-smoker",
      "spouse-tobacco-last-used",
      "spouse-tobacco-products",
    ],
  },
  AD: {},
  DI: {
    self: ["gender", "average-monthly-income", "hours-worked-per-week"],
    spouse: [
      "spouse-gender",
      "spouse-average-monthly-income",
      "spouse-hours-worked-per-week",
    ],
  },
  OO: {
    self: [
      "hours-worked-per-week",
      "monthly-business-expenses",
      "business-expense-responsibility",
    ],
  },
  SH: {
    self: ["smoker", "tobacco-last-used", "tobacco-products"],
    spouse: [
      "spouse-smoker",
      "spouse-tobacco-last-used",
      "spouse-tobacco-products",
    ],
  },
};

const smokerQuestionIds = new Set<FieldId>([
  "smoker",
  "tobacco-last-used",
  "tobacco-products",
  "spouse-smoker",
  "spouse-tobacco-last-used",
  "spouse-tobacco-products",
]);

export function getCategoryQuestionFieldIds(
  selectedCategories: CoverageCategoryId[],
  applicant: CoverageQuestionApplicant = "self",
  options?: { hideSmokerQuestion?: boolean },
): FieldId[] {
  const fields = new Set<FieldId>();
  for (const categoryId of selectedCategories) {
    for (const fieldId of coverageQuestionRequirements[categoryId][applicant] ?? []) {
      if (options?.hideSmokerQuestion && smokerQuestionIds.has(fieldId)) continue;
      fields.add(fieldId);
    }
  }
  return [...fields];
}

export function getCategoryRequirements(
  selectedCategories: CoverageCategoryId[],
  options?: { hideSmokerQuestion?: boolean },
) {
  const fields = new Set(
    getCategoryQuestionFieldIds(selectedCategories, "self", options),
  );
  const needsGender = fields.has("gender");
  const needsSmoker = fields.has("smoker");
  const needsDi = fields.has("average-monthly-income");
  const needsOo = fields.has("monthly-business-expenses");
  const needsHours = fields.has("hours-worked-per-week");
  return {
    fieldIds: [...fields],
    needsGender,
    needsSmoker,
    needsDi,
    needsOo,
    needsHours,
    needsAdditionalFields: fields.size > 0,
  };
}

export type CategoryRequirements = ReturnType<typeof getCategoryRequirements>;
