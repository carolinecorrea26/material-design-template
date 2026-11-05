import HealthInformationHelp from "../components/health/HealthInformationHelp";
import { getHealthDetailSurface, getHealthDetailSurfaceName, surfaceSemanticValues } from '../config/fields/storedSurfaces';
import { createAnswerFields } from "../config/fields/healthSiFields";
import { applicantParticipatesInPage } from "../config/flowGates";
import { validateHealthPage } from '../config/healthFollowUps';
import { Stack } from "@mui/material";
import FormRoutePage, { type FormRouteRenderProps } from "../app/RoutePage";
import HealthQuestionList from "../app/sections/ConfiguredHealthQuestionList";
import type { HealthQuestionEntry } from "../components/forms/HealthQuestionList";
import { YesNoDetailQuestionFields,
  type YesNoDetailQuestion,
} from "../components/forms/YesNoDetailList";
import type { FieldDefinition } from "../config/fields/types";

// ─── DynamicList: health-details-specific ────────────────────────────────────

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

// ─── Questions ────────────────────────────────────────────────────────────────

// ─── Field builders ───────────────────────────────────────────────────────────

// ─── Per-applicant question set ───────────────────────────────────────────────

interface QuestionSetProps {
  applicant: "self" | "spouse";
  control: FormRouteRenderProps["control"];
  errors: FormRouteRenderProps["errors"];
  watchedValues: FormRouteRenderProps["watchedValues"];
  allFields: FieldDefinition[];
}

function questionEntries({
  applicant,
  control,
  errors,
  watchedValues,
  allFields,
}: QuestionSetProps): HealthQuestionEntry[] {
  const questions: YesNoDetailQuestion[] = allFields.filter(field => field.id.startsWith("health-si-q") && field.id.endsWith("-spouse") === (applicant === "spouse")).map(field => {
    const answerId = field.id;
    const surface = getHealthDetailSurface("health-si", answerId);
    return { field, listName: `${answerId}-details`, mapping: surface.mapping, maxItems: surface.maxItems, label: surface.label,
      renderItem: item => renderDetailsItem(surfaceSemanticValues(getHealthDetailSurfaceName("health-si", answerId), item) as Record<string, string>) };
  });

  return questions.map((question, order) => ({
    key: question.field.id.replace(/-spouse$/, ""), order, applicant,
    content: <YesNoDetailQuestionFields question={question} control={control} errors={errors} watchedValues={watchedValues} />,
  }));
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HealthSi() {
  return (
    <FormRoutePage
      pageId="health-si"
      validate={values => validateHealthPage('health-si', values)}
      help={<HealthInformationHelp />}
      devFillFields={(currentValues) => [
        ...(applicantParticipatesInPage("health-si", "self", currentValues)
          ? createAnswerFields("self")
          : []),
        ...(applicantParticipatesInPage("health-si", "spouse", currentValues)
          ? createAnswerFields("spouse")
          : []),
      ]}
    >
      {({ control, errors, watchedValues, allFields }) => {
        const hasSelf = applicantParticipatesInPage("health-si", "self", watchedValues);
        const hasSpouse = applicantParticipatesInPage("health-si", "spouse", watchedValues);

        return <HealthQuestionList values={watchedValues} entries={[
          ...(hasSelf ? questionEntries({ applicant: "self", control, errors, watchedValues, allFields }) : []),
          ...(hasSpouse ? questionEntries({ applicant: "spouse", control, errors, watchedValues, allFields }) : []),
        ]} />;
      }}
    </FormRoutePage>
  );
}
