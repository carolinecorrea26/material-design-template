import HealthInformationHelp from "../components/health/HealthInformationHelp";
import FormRoutePage from "../app/RoutePage";
import HealthQuestionList from "../app/sections/ConfiguredHealthQuestionList";
import { configuredHealthQuestionEntries } from "../app/sections/ConfiguredHealthQuestions";
import { applicantParticipatesInPage } from "../config/flowGates";
import { validateHealthPage } from "../config/healthFollowUps";
import { configuredHealthQuestionnaire } from "../domain/configuredHealthQuestionnaire";
import { getPrototypeLibrary } from "../domain/prototypeLibrary";

export default function HealthCi() {
  return <FormRoutePage pageId="health-ci" help={<HealthInformationHelp />} validate={values => validateHealthPage("health-ci", values)} devFillFields={values => {
    const library = getPrototypeLibrary();
    return library ? (["self", "spouse"] as const).flatMap(applicant => applicantParticipatesInPage("health-ci", applicant, values) ? configuredHealthQuestionnaire(library.site, "health-ci", applicant, values).fields : []) : [];
  }}>{({ control, errors, watchedValues }) => {
    const library = getPrototypeLibrary();
    return <HealthQuestionList values={watchedValues} entries={library ? (["self", "spouse"] as const)
      .filter(applicant => applicantParticipatesInPage("health-ci", applicant, watchedValues))
      .flatMap(applicant => configuredHealthQuestionEntries({ questionnaire: configuredHealthQuestionnaire(library.site, "health-ci", applicant, watchedValues), applicant, control, errors })) : []} />;
  }}</FormRoutePage>;
}
