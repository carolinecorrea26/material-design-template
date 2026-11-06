import { Box, Stack } from "@mui/material";
import FieldRenderer from "../forms/FieldRenderer";
import CoverageCategorySelector from "./CoverageCategorySelector";
import type { CoverageCategory } from "../../config/coverageCategories";
import type { CoverageDefinition } from "../../domain/coverage";
import ApplicantSectionDivider from "../layout/ApplicantSectionDivider";
import ConditionalGroup from "../forms/ConditionalGroup";
import SectionDivider, { FieldGroup } from "../layout/SectionDivider";
import type { FormRouteRenderProps } from "../../app/RoutePage";
import type { CoverageCategoryId } from "../../config/coverages/types";
import type {
  PageSectionConfig,
} from "../../config/pageSections/types";
import type { ClientCoverageQuestions } from "../../config/clients/types";

type CoverageQuestionsProps = Pick<
  FormRouteRenderProps,
  "control" | "errors" | "watchedValues" | "allFields" | "pageSections"
> & {
  selectedCategories: CoverageCategoryId[];
  hasSpouse: boolean;
  onFieldChange?: () => void;
  coverageQuestions?: ClientCoverageQuestions;
  factFields?: import("../../config/fields/types").FieldDefinition[];
  applicantLabels?: import("../../config/clients/types").ClientApplicantLabels;
};

type CoverageQuestionSectionProps = CoverageQuestionsProps & {
  availableCategories: readonly CoverageCategory[];
  categoryProducts: CoverageDefinition[];
  onCategoryToggle: (id: CoverageCategoryId) => void;
  categoryError?: boolean;
  categoryErrorMessage?: string;
};

/** The page's question section: category question, category follow-ups and product facts. */
export default function CoverageQuestions(props: CoverageQuestionSectionProps) {
  return <Stack spacing={3}>
    {props.availableCategories.length > 1 && <CoverageCategorySelector
      categories={props.availableCategories}
      selectedIds={props.selectedCategories}
      onToggle={props.onCategoryToggle}
      error={props.categoryError}
      errorMessage={props.categoryErrorMessage}
    />}
    <CoverageFollowupQuestions {...props} />
    {!!props.factFields?.length && <FieldGroup className="FieldGroup-root">{props.factFields.map(field => {
      return <FieldRenderer key={field.id} field={field} control={props.control} errors={props.errors} onValueChange={props.onFieldChange} />;
    })}</FieldGroup>}
  </Stack>;
}

function CoverageFollowupQuestions(props: CoverageQuestionsProps) {
  const {
    control,
    errors,
    allFields,
    pageSections,
    hasSpouse,
    onFieldChange,
  } = props;

  const resolvedSections = pageSections;
  const selfSections = resolvedSections.filter(
    (s) => s.applicant === "self" || !s.applicant,
  );
  const spouseSections = resolvedSections.filter(
    (s) => s.applicant === "spouse",
  );

  const hasVisibleSelfSections = selfSections.length > 0;

  const hasVisibleSpouseSections =
    hasSpouse &&
    spouseSections.length > 0;

  if (!hasVisibleSelfSections && !hasVisibleSpouseSections) return null;

  const renderSections = (sections: PageSectionConfig[]) =>
    sections.map((section) => {

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

      const fields = isConditional ? <ConditionalGroup>{content}</ConditionalGroup> : content;
      return (
        <Box key={section.id}>
          {section.description ? (
            <SectionDivider
              label={section.description}
              variant="subsection"
              sx={{ mb: 2 }}
            >
              {fields}
            </SectionDivider>
          ) : <FieldGroup className="FieldGroup-root">{fields}</FieldGroup>}
        </Box>
      );
    });

  return (
    <Box>
      {hasSpouse ? (
        <Stack spacing={2}>
          <ApplicantSectionDivider applicant="self" labels={props.applicantLabels} showLabel>
            <Stack spacing={2}>{renderSections(selfSections)}</Stack>
          </ApplicantSectionDivider>
          {hasVisibleSpouseSections && (
            <ApplicantSectionDivider applicant="spouse" labels={props.applicantLabels} showLabel>
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
