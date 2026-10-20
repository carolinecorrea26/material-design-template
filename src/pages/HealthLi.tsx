import { getHealthDetailSurface, getHealthDetailSurfaceName, surfaceSemanticValues } from '../config/fields/storedSurfaces';
import { createQuestionFields } from "../config/fields/healthLiFields";
import { validateHealthPage } from '../config/healthFollowUps';
import { applicantParticipatesInPage } from "../config/flowGates";
import { Stack } from "@mui/material";
import FormRoutePage, { type FormRouteRenderProps } from "../app/RoutePage";
import ApplicantSectionDivider from "../components/layout/ApplicantSectionDivider";
import {
  shouldShowApplicantLabel,
} from "../utils/applicantVisibility";
import YesNoDetailList, {
  type YesNoDetailQuestion,
} from "../components/forms/YesNoDetailList";
import type { FieldDefinition } from "../config/fields/types";

function renderDetailsItem(item: Record<string, string>) {
  return (
    <Stack spacing={0.25}>
      {item.onset && (
        <span style={{ fontSize: "0.75rem", color: "#49596f" }}>
          Onset: {item.onset}
        </span>
      )}
      <span style={{ fontSize: "0.875rem", wordBreak: "break-word" }}>
        {item.conditionsDetails || "No details provided"}
      </span>
    </Stack>
  );
}

interface QuestionSetProps {
  applicant: "self" | "spouse";
  control: FormRouteRenderProps["control"];
  errors: FormRouteRenderProps["errors"];
  watchedValues: FormRouteRenderProps["watchedValues"];
  allFields: FieldDefinition[];
}

function QuestionSet({
  applicant,
  control,
  errors,
  watchedValues,
  allFields,
}: QuestionSetProps) {
  const questions: YesNoDetailQuestion[] = allFields.filter(field => field.id.startsWith("health-li-q") && field.id.endsWith("-spouse") === (applicant === "spouse")).map(field => {
    const answerId = field.id;
    const surface = getHealthDetailSurface("health-li", answerId);
    return { field, listName: `${answerId}-details`, mapping: surface.mapping, maxItems: surface.maxItems, label: surface.label,
      renderItem: item => renderDetailsItem(surfaceSemanticValues(getHealthDetailSurfaceName("health-li", answerId), item) as Record<string, string>) };
  });

  return (
    <YesNoDetailList
      questions={questions}
      control={control}
      errors={errors}
      watchedValues={watchedValues}
    />
  );
}

export default function HealthLi() {
  return (
    <FormRoutePage
      pageId="health-li"
      validate={values => validateHealthPage('health-li', values)}
      devFillFields={(currentValues) => [
        ...(applicantParticipatesInPage("health-li", "self", currentValues)
          ? createQuestionFields("self")
          : []),
        ...(applicantParticipatesInPage("health-li", "spouse", currentValues)
          ? createQuestionFields("spouse")
          : []),
      ]}
    >
      {({ control, errors, watchedValues, allFields }) => {
        const hasSelf = applicantParticipatesInPage("health-li", "self", watchedValues);
        const hasSpouse = applicantParticipatesInPage("health-li", "spouse", watchedValues);

        return (
          <Stack spacing={3}>
            {hasSelf && (
              <ApplicantSectionDivider
                applicant="self"
                showLabel={shouldShowApplicantLabel("self", watchedValues)}
              >
                <QuestionSet
                  applicant="self"
                  control={control}
                  errors={errors}
                  watchedValues={watchedValues}
                  allFields={allFields}
                />
              </ApplicantSectionDivider>
            )}
            {hasSpouse && (
              <ApplicantSectionDivider
                applicant="spouse"
                showLabel={shouldShowApplicantLabel("spouse", watchedValues)}
              >
                <QuestionSet
                  applicant="spouse"
                  control={control}
                  errors={errors}
                  watchedValues={watchedValues}
                  allFields={allFields}
                />
              </ApplicantSectionDivider>
            )}
          </Stack>
        );
      }}
    </FormRoutePage>
  );
}
