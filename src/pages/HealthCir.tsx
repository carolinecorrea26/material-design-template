import { requirementText } from "../domain/requirementContent";
import PageAlert from "../components/feedback/PageAlert";
import FormRoutePage from "../app/RoutePage";
import HealthQuestionList from "../app/sections/ConfiguredHealthQuestionList";
import { configuredHealthQuestionEntries } from "../app/sections/ConfiguredHealthQuestions";
import { applicantParticipatesInPage } from "../config/flowGates";
import { validateHealthPage } from "../config/healthFollowUps";
import { configuredHealthQuestionnaire } from "../domain/configuredHealthQuestionnaire";
import { getPrototypeLibrary } from "../domain/prototypeLibrary";

export default function HealthCir() {
  return <FormRoutePage pageId="health-cir" validate={values => validateHealthPage("health-cir", values)} devFillFields={values => {
    const library = getPrototypeLibrary();
    return library ? (["self", "spouse"] as const).flatMap(applicant => applicantParticipatesInPage("health-cir", applicant, values) ? configuredHealthQuestionnaire(library.site, "health-cir", applicant, values).fields : []) : [];
  }}>{({ control, errors, watchedValues }) => {
    const library = getPrototypeLibrary();
    const entries = library ? (["self", "spouse"] as const)
      .filter(applicant => applicantParticipatesInPage("health-cir", applicant, watchedValues))
      .flatMap(applicant => configuredHealthQuestionEntries({ questionnaire: configuredHealthQuestionnaire(library.site, "health-cir", applicant, watchedValues), applicant, control, errors })) : [];
    return entries.length ? <HealthQuestionList values={watchedValues} entries={entries} /> : <PageAlert message={requirementText("application.ui.unable-to-load-health-questions-please-try-again")} />;
  }}</FormRoutePage>;
}
