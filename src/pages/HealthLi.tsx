import HealthInformationHelp from "../components/health/HealthInformationHelp";
import { getHealthDetailSurface, getHealthDetailSurfaceName, surfaceSemanticValues } from '../config/fields/storedSurfaces';
import { createQuestionFields } from "../config/fields/healthLiFields";
import { validateHealthPage } from '../config/healthFollowUps';
import { applicantParticipatesInPage } from "../config/flowGates";
import { Stack } from "@mui/material";
import FormRoutePage, { type FormRouteRenderProps } from "../app/RoutePage";
import HealthQuestionList from "../app/sections/ConfiguredHealthQuestionList";
import type { HealthQuestionEntry } from "../components/forms/HealthQuestionList";
import { YesNoDetailQuestionFields,
  type YesNoDetailQuestion,
} from "../components/forms/YesNoDetailList";
import type { FieldDefinition } from "../config/fields/types";
import { getPrototypeLibrary } from "../domain/prototypeLibrary";
import { configuredHealthQuestionnaire } from "../domain/configuredHealthQuestionnaire";
import { configuredHealthQuestionEntries } from "../app/sections/ConfiguredHealthQuestions";

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

function questionEntries({
  applicant,
  control,
  errors,
  watchedValues,
  allFields,
}: QuestionSetProps): HealthQuestionEntry[] {
  const library = getPrototypeLibrary();
  const questionnaire = library ? configuredHealthQuestionnaire(library.site, "health-li", applicant, watchedValues) : null;
  if (questionnaire && questionnaire.status !== "unassigned") return configuredHealthQuestionEntries({ questionnaire, applicant, control, errors });
  const questions: YesNoDetailQuestion[] = allFields.filter(field => field.id.startsWith("health-li-q") && field.id.endsWith("-spouse") === (applicant === "spouse")).map(field => {
    const answerId = field.id;
    const surface = getHealthDetailSurface("health-li", answerId);
    return { field, listName: `${answerId}-details`, mapping: surface.mapping, maxItems: surface.maxItems, label: surface.label,
      renderItem: item => renderDetailsItem(surfaceSemanticValues(getHealthDetailSurfaceName("health-li", answerId), item) as Record<string, string>) };
  });

  return questions.map((question, order) => ({
    key: question.field.id.replace(/-spouse$/, ""), order, applicant,
    content: <YesNoDetailQuestionFields question={question} control={control} errors={errors} watchedValues={watchedValues} />,
  }));
}

export default function HealthLi() {
  return (
    <FormRoutePage
      pageId="health-li" help={<HealthInformationHelp />}
      validate={values => validateHealthPage('health-li', values)}
      devFillFields={(currentValues) => {
        const library = getPrototypeLibrary();
        const configured = library ? (["self", "spouse"] as const).map(applicant => ({ applicant, result: configuredHealthQuestionnaire(library.site, "health-li", applicant, currentValues) })) : [];
        if (configured.some(({ result }) => result.status !== "unassigned")) return configured.flatMap(({ applicant, result }) => applicantParticipatesInPage("health-li", applicant, currentValues) ? result.fields : []);
        return [
        ...(applicantParticipatesInPage("health-li", "self", currentValues)
          ? createQuestionFields("self")
          : []),
        ...(applicantParticipatesInPage("health-li", "spouse", currentValues)
          ? createQuestionFields("spouse")
          : []),
        ];
      }}
    >
      {({ control, errors, watchedValues, allFields }) => {
        const hasSelf = applicantParticipatesInPage("health-li", "self", watchedValues);
        const hasSpouse = applicantParticipatesInPage("health-li", "spouse", watchedValues);

        return <HealthQuestionList values={watchedValues} entries={[
          ...(hasSelf ? questionEntries({ applicant: "self", control, errors, watchedValues, allFields }) : []),
          ...(hasSpouse ? questionEntries({ applicant: "spouse", control, errors, watchedValues, allFields }) : []),
        ]} />;
      }}
    </FormRoutePage>
  );
}
