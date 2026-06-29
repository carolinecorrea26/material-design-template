import { Box, Divider, Stack, Typography } from "@mui/material";
import FieldRenderer from "../../components/fields/FieldRenderer";
import ApplicantSection from "../../components/fields/ApplicantSection";
import SubQuestionContainer from "../../components/fields/ConditionalGroup";
import type { FormRouteRenderProps } from "../../components/page/RoutePage";
import type { CoverageCategoryId } from "../../config/coverages/types";
import type { PageSectionConfig } from "../../config/pageSections/types";
import type { SectionVisibilityRule } from "../../config/pageSections/types";

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

/** Section IDs that require specific category selections to be visible */
const personalSections = new Set([
  "selfCoverageQuestions",
  "selfCoverageTobacco",
  "spouseCoverageQuestions",
  "spouseCoverageTobacco",
]);
const workIncomeSections = new Set([
  "selfCoverageWorkIncome",
  "spouseCoverageWorkIncome",
]);
const businessSections = new Set(["selfCoverageBusinessExpenses"]);

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
};

function isCategorySectionVisible(
  section: PageSectionConfig,
  props: CoverageQuestionsProps,
): boolean {
  const {
    categoryNeedsGender,
    categoryNeedsSmoker,
    categoryNeedsDi,
    categoryNeedsOo,
    categoryNeedsHours,
  } = props;

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

      const isConditional = !!section.visibleWhen;

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
            <>
              <Divider sx={{ mb: 2 }} />
              <Typography variant="overline" sx={{ mb: 1.5, display: "block" }}>
                {section.description}
              </Typography>
            </>
          )}
          {isConditional ? (
            <SubQuestionContainer>{content}</SubQuestionContainer>
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
          <ApplicantSection applicant="self" showLabel>
            <Stack spacing={2}>{renderSections(selfSections)}</Stack>
          </ApplicantSection>
          {hasVisibleSpouseSections && (
            <ApplicantSection applicant="spouse" showLabel>
              <Stack spacing={2}>{renderSections(spouseSections)}</Stack>
            </ApplicantSection>
          )}
        </Stack>
      ) : (
        <Stack spacing={2}>{renderSections(selfSections)}</Stack>
      )}
    </Box>
  );
}
