import HealthInformationHelp from "../components/health/HealthInformationHelp";
import { getPrototypeLibrary } from "../domain/prototypeLibrary";
import { configuredHealthQuestionnaire } from "../domain/configuredHealthQuestionnaire";
import { configuredHealthQuestionEntries } from "../app/sections/ConfiguredHealthQuestions";
import { getHealthDetailSurface, getHealthDetailSurfaceName, surfaceSemanticValues } from '../config/fields/storedSurfaces';
import { QUESTIONS as questionDefinitions, createAnswerFields } from "../config/fields/healthDiFields";
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

// ─── DynamicList field definitions ───────────────────────────────────────────

// ─── Mappings ─────────────────────────────────────────────────────────────────

// ─── Item renderers ───────────────────────────────────────────────────────────

function renderGeneralItem(item: Record<string, string>) {
  return (
    <span style={{ fontSize: "0.875rem", wordBreak: "break-word" }}>
      {item.details || "No details provided"}
    </span>
  );
}

function renderSpecificItem(item: Record<string, string>) {
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

function renderAssistanceItem(item: Record<string, string>) {
  return (
    <Stack spacing={0.25}>
      {item.assistanceType && (
        <span style={{ fontSize: "0.75rem", color: "#49596f" }}>
          {item.assistanceType}
        </span>
      )}
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

function renderFallItem(item: Record<string, string>) {
  return (
    <Stack spacing={0.25}>
      {item.fallType && (
        <span style={{ fontSize: "0.75rem", color: "#49596f" }}>
          {item.fallType}
        </span>
      )}
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

// ─── Question definitions ─────────────────────────────────────────────────────

const renderers = { renderGeneralItem, renderSpecificItem, renderAssistanceItem, renderFallItem };
const QUESTIONS = questionDefinitions.map(question => ({ ...question, renderItem: renderers[question.renderKind] }));

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
  const library = getPrototypeLibrary();
  const questionnaire = library ? configuredHealthQuestionnaire(library.site, "health-di", applicant, watchedValues) : null;
  if (questionnaire && questionnaire.status !== "unassigned") return configuredHealthQuestionEntries({ questionnaire, applicant, control, errors });
  const suffix = applicant === "spouse" ? "-spouse" : "";
  const questions: YesNoDetailQuestion[] = allFields.filter(field => field.id.startsWith("health-di-q") && field.id.endsWith("-spouse") === (applicant === "spouse")).map(field => {
    const answerId = field.id;
    const question = QUESTIONS.find(question => `health-di-${question.key}${suffix}` === answerId);
    if (!question) throw new Error(`Missing health summary renderer: ${answerId}`);
    const surface = getHealthDetailSurface("health-di", answerId);
    return { field, listName: `${answerId}-details`, mapping: surface.mapping, maxItems: surface.maxItems, label: surface.label,
      renderItem: item => question.renderItem(surfaceSemanticValues(getHealthDetailSurfaceName("health-di", answerId), item) as Record<string, string>) };
  });

  return questions.map((question, order) => ({
    key: question.field.id.replace(/-spouse$/, ""), order, applicant,
    content: <YesNoDetailQuestionFields question={question} control={control} errors={errors} watchedValues={watchedValues} />,
  }));
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HealthDi() {
  return (
    <FormRoutePage
      pageId="health-di"
      validate={values => validateHealthPage('health-di', values)}
      help={<HealthInformationHelp />}
      devFillFields={(currentValues) => {
        const library = getPrototypeLibrary();
        const configured = library ? (["self", "spouse"] as const).map(applicant => ({ applicant, result: configuredHealthQuestionnaire(library.site, "health-di", applicant, currentValues) })) : [];
        if (configured.some(({ result }) => result.status !== "unassigned")) return configured.flatMap(({ applicant, result }) => applicantParticipatesInPage("health-di", applicant, currentValues) ? result.fields : []);
        return [
        ...(applicantParticipatesInPage("health-di", "self", currentValues)
          ? createAnswerFields("self")
          : []),
        ...(applicantParticipatesInPage("health-di", "spouse", currentValues)
          ? createAnswerFields("spouse")
          : []),
      ]; }}
    >
      {({ control, errors, watchedValues, allFields }) => {
        const hasSelf = applicantParticipatesInPage("health-di", "self", watchedValues);
        const hasSpouse = applicantParticipatesInPage("health-di", "spouse", watchedValues);

        return <HealthQuestionList values={watchedValues} entries={[
          ...(hasSelf ? questionEntries({ applicant: "self", control, errors, watchedValues, allFields }) : []),
          ...(hasSpouse ? questionEntries({ applicant: "spouse", control, errors, watchedValues, allFields }) : []),
        ]} />;
      }}
    </FormRoutePage>
  );
}
