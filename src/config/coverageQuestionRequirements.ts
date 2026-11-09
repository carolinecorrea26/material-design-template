import authoredCoverageQuestions from "../../requirements/global/coverage-questions.json";
import { getPrototypeLibrary, type PrototypeLibrary } from "../domain/prototypeLibrary";
import type { CoverageCategoryId } from "./coverages/types";
import type { FieldId } from "./fields/types";

export type CoverageQuestionApplicant = "self" | "spouse";

type ApplicantQuestionFields = Partial<
  Record<CoverageQuestionApplicant, readonly FieldId[]>
>;

/** Canonical coverage-category → application-question relationship. */
export const coverageQuestionRequirements: Record<CoverageCategoryId, ApplicantQuestionFields> = { OO: {}, SH: {}, ...authoredCoverageQuestions } as Record<CoverageCategoryId, ApplicantQuestionFields>;

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
  library: PrototypeLibrary | null = getPrototypeLibrary(),
): FieldId[] {
  const policy = library?.settings.coveragePolicy as { questionRequirements: typeof coverageQuestionRequirements; questionOverrides?: Partial<typeof coverageQuestionRequirements> } | undefined;
  const catalog = policy?.questionRequirements ?? coverageQuestionRequirements;
  const fields = new Set<FieldId>();
  for (const categoryId of selectedCategories) {
    for (const fieldId of policy?.questionOverrides?.[categoryId]?.[applicant] ?? catalog[categoryId]?.[applicant] ?? []) {
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
