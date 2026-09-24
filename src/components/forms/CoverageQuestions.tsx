import { Box, Stack } from "@mui/material";
import FieldRenderer from "./FieldRenderer";
import ApplicantSectionDivider from "../layout/ApplicantSectionDivider";
import ConditionalGroup from "./ConditionalGroup";
import SectionDivider from "../layout/SectionDivider";
import type { FormRouteRenderProps } from "../../app/RoutePage";
import type { CoverageCategoryId } from "../../config/coverages/types";
import type {
  PageSectionConfig,
} from "../../config/pageSections/types";
import type { ClientCoverageQuestions } from "../../config/clients/types";
import { resolveVisibilityCondition } from "../../config/conditions";
import { resolveCoverageQuestionSections } from "../../config/resolvers/resolveCoverageQuestionSections";

type CoverageQuestionsProps = Pick<
  FormRouteRenderProps,
  "control" | "errors" | "watchedValues" | "allFields" | "pageSections"
> & {
  selectedCategories: CoverageCategoryId[];
  hasSpouse: boolean;
  onFieldChange?: () => void;
  coverageQuestions?: ClientCoverageQuestions;
};

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
    coverageQuestions,
  } = props;

  const resolvedSections = resolveCoverageQuestionSections({
    sections: pageSections,
    selectedCategories,
    coverageQuestions,
  });

  const selfSections = resolvedSections.filter(
    (s) => s.applicant === "self" || !s.applicant,
  );
  const spouseSections = resolvedSections.filter(
    (s) => s.applicant === "spouse",
  );

  const hasVisibleSelfSections = selfSections.some(
    (s) => resolveVisibilityCondition(s, watchedValues),
  );

  const hasVisibleSpouseSections =
    hasSpouse &&
    spouseSections.some(
      (s) => resolveVisibilityCondition(s, watchedValues),
    );

  if (!hasVisibleSelfSections && !hasVisibleSpouseSections) return null;

  const renderSections = (sections: PageSectionConfig[]) =>
    sections.map((section) => {
      if (!resolveVisibilityCondition(section, watchedValues)) return null;

      const isConditional = section.presentation === "conditional";

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
