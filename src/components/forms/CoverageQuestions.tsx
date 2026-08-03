import { Box, Stack } from "@mui/material";
import FieldRenderer from "./FieldRenderer";
import ApplicantSectionDivider from "../layout/ApplicantSectionDivider";
import ConditionalGroup from "./ConditionalGroup";
import SectionDivider from "../layout/SectionDivider";
import type { FormRouteRenderProps } from "../../app/RoutePage";
import type { CoverageCategoryId } from "../../config/coverages/types";
import type {
  PageSectionConfig,
  PageSectionId,
  SectionVisibilityRule,
} from "../../config/pageSections/types";
import type { ClientCoverageQuestions } from "../../config/clients/types";

/**
 * Check visibleWhen rules only (skip the applicant coverage gate
 * that isSectionVisible applies — on the coverage page, applicant
 * selections haven't been made yet so that gate would hide everything).
 */
function isSectionRulesVisible(
  section: PageSectionConfig,
  values: Record<string, unknown>,
): boolean {
  if (!section.visibleWhen) return true;

  return section.visibleWhen.every((rule: SectionVisibilityRule) => {
    const value = values[rule.fieldId];
    if ("equals" in rule) return value === rule.equals;
    if ("notEquals" in rule) return value !== rule.notEquals;
    if ("includes" in rule) {
      return Array.isArray(value) && value.includes(rule.includes);
    }
    return true;
  });
}

/** Default section-to-category mapping (used as base; clients can add/remove via coverageQuestions config) */
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

type CoverageQuestionsProps = Pick<
  FormRouteRenderProps,
  "control" | "errors" | "watchedValues" | "allFields" | "pageSections"
> & {
  selectedCategories: CoverageCategoryId[];
  categoryNeedsGender: boolean;
  categoryNeedsSmoker: boolean;
  categoryNeedsDi: boolean;
  categoryNeedsOo: boolean;
  categoryNeedsHours: boolean;
  hasSpouse: boolean;
  onFieldChange?: () => void;
  coverageQuestions?: ClientCoverageQuestions;
};

function isCategorySectionVisible(
  section: PageSectionConfig,
  props: CoverageQuestionsProps,
): boolean {
  const {
    selectedCategories,
    coverageQuestions,
    categoryNeedsGender,
    categoryNeedsSmoker,
    categoryNeedsDi,
    categoryNeedsOo,
    categoryNeedsHours,
  } = props;

  // Build the effective default sets, minus any client removals
  const removed = new Set(coverageQuestions?.removeDefaults ?? []);

  const personalSections = new Set(
    [...defaultPersonalSections].filter((s) => !removed.has(s)),
  );
  const workIncomeSections = new Set(
    [...defaultWorkIncomeSections].filter((s) => !removed.has(s)),
  );
  const businessSections = new Set(
    [...defaultBusinessSections].filter((s) => !removed.has(s)),
  );

  // "always" sections: shown when any category is selected
  if (coverageQuestions?.always?.includes(section.id)) {
    return selectedCategories.length > 0;
  }

  // Per-category client additions: shown when the matching category is selected
  if (coverageQuestions) {
    const isClientAddition = selectedCategories.some((catId) =>
      coverageQuestions[catId]?.includes(section.id),
    );
    if (isClientAddition) return true;
  }

  // Default section-to-category mapping
  if (personalSections.has(section.id)) {
    return categoryNeedsGender || categoryNeedsSmoker;
  }
  if (workIncomeSections.has(section.id)) {
    return categoryNeedsHours || categoryNeedsDi;
  }
  if (businessSections.has(section.id)) {
    return categoryNeedsOo;
  }
  return true;
}

export default function CoverageQuestions(props: CoverageQuestionsProps) {
  const {
    control,
    errors,
    watchedValues,
    allFields,
    pageSections,
    selectedCategories,
    hasSpouse,
    onFieldChange,
  } = props;

  if (selectedCategories.length === 0) return null;

  const selfSections = pageSections.filter(
    (s) => s.applicant === "self" || !s.applicant,
  );
  const spouseSections = pageSections.filter((s) => s.applicant === "spouse");

  const hasVisibleSelfSections = selfSections.some(
    (s) =>
      isCategorySectionVisible(s, props) &&
      isSectionRulesVisible(s, watchedValues),
  );

  const hasVisibleSpouseSections =
    hasSpouse &&
    spouseSections.some(
      (s) =>
        isCategorySectionVisible(s, props) &&
        isSectionRulesVisible(s, watchedValues),
    );

  if (!hasVisibleSelfSections && !hasVisibleSpouseSections) return null;

  const renderSections = (sections: PageSectionConfig[]) =>
    sections.map((section) => {
      if (!isCategorySectionVisible(section, props)) return null;
      if (!isSectionRulesVisible(section, watchedValues)) return null;

      // A section is "conditional" (gets blue left border) only if its
      // visibleWhen contains rules beyond just the dependents-includes check
      // (which is a structural visibility gate, not a follow-up indicator).
      const isConditional =
        !!section.visibleWhen &&
        section.visibleWhen.some(
          (rule: SectionVisibilityRule) =>
            !("includes" in rule && rule.fieldId === "dependents"),
        );

      const content = (
        <Stack spacing={2}>
          {section.fieldIds.map((fieldId) => {
            const field = allFields.find((f) => f.id === fieldId);
            if (!field) return null;
            return (
              <FieldRenderer
                key={field.id}
                field={field}
                control={control}
                errors={errors}
                onValueChange={onFieldChange}
              />
            );
          })}
        </Stack>
      );

      return (
        <Box key={section.id}>
          {section.description && (
            <SectionDivider
              label={section.description}
              variant="subsection"
              sx={{ mb: 2 }}
            />
          )}
          {isConditional ? (
            <ConditionalGroup>{content}</ConditionalGroup>
          ) : (
            content
          )}
        </Box>
      );
    });

  return (
    <Box>
      {hasSpouse ? (
        <Stack spacing={2}>
          <ApplicantSectionDivider applicant="self" showLabel>
            <Stack spacing={2}>{renderSections(selfSections)}</Stack>
          </ApplicantSectionDivider>
          {hasVisibleSpouseSections && (
            <ApplicantSectionDivider applicant="spouse" showLabel>
              <Stack spacing={2}>{renderSections(spouseSections)}</Stack>
            </ApplicantSectionDivider>
          )}
        </Stack>
      ) : (
        <Stack spacing={2}>{renderSections(selfSections)}</Stack>
      )}
    </Box>
  );
}
