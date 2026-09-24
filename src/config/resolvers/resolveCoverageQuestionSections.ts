import type { ClientCoverageQuestions } from "../clients/types";
import type { CoverageCategoryId } from "../coverages/types";
import { getCategoryQuestionFieldIds } from "../coverageQuestionRequirements";
import type {
  PageSectionConfig,
  PageSectionId,
} from "../pageSections/types";

const defaultPersonalSections = new Set<PageSectionId>([
  "selfCoverageQuestions",
  "selfCoverageTobacco",
  "spouseCoverageQuestions",
  "spouseCoverageTobacco",
]);
const defaultWorkIncomeSections = new Set<PageSectionId>([
  "selfCoverageWorkIncome",
  "spouseCoverageWorkIncome",
]);
const defaultBusinessSections = new Set<PageSectionId>([
  "selfCoverageBusinessExpenses",
]);
const defaultCoverageQuestionSections = new Set<PageSectionId>([
  ...defaultPersonalSections,
  ...defaultWorkIncomeSections,
  ...defaultBusinessSections,
]);

export type ResolveCoverageQuestionSectionsOptions = {
  sections: PageSectionConfig[];
  selectedCategories: CoverageCategoryId[];
  coverageQuestions?: ClientCoverageQuestions;
};

/**
 * Resolves category and client configuration into render-ready sections.
 * UI consumers do not need to know which section IDs belong to each group.
 */
export function resolveCoverageQuestionSections({
  sections,
  selectedCategories,
  coverageQuestions,
}: ResolveCoverageQuestionSectionsOptions): PageSectionConfig[] {
  if (selectedCategories.length === 0) return [];

  const removedDefaults = new Set(coverageQuestions?.removeDefaults ?? []);

  return sections.flatMap((section) => {
    if (coverageQuestions?.always?.includes(section.id)) {
      return [{ ...section, fieldIds: [...section.fieldIds] }];
    }

    const isClientAddition = selectedCategories.some((categoryId) =>
      coverageQuestions?.[categoryId]?.includes(section.id),
    );
    if (isClientAddition) {
      return [{ ...section, fieldIds: [...section.fieldIds] }];
    }

    if (!defaultCoverageQuestionSections.has(section.id)) {
      return [{ ...section, fieldIds: [...section.fieldIds] }];
    }

    if (removedDefaults.has(section.id)) return [];

    const applicant = section.applicant === "spouse" ? "spouse" : "self";
    const requiredFieldIds = new Set(
      getCategoryQuestionFieldIds(selectedCategories, applicant),
    );
    const fieldIds = section.fieldIds.filter((fieldId) =>
      requiredFieldIds.has(fieldId),
    );

    return fieldIds.length > 0 ? [{ ...section, fieldIds }] : [];
  });
}
