import HealthInformationHelp from "../components/health/HealthInformationHelp";
import { Alert } from "@mui/material";
import FormRoutePage from "../app/RoutePage";
import HealthQuestionList from "../app/sections/ConfiguredHealthQuestionList";
import { configuredHealthQuestionEntries } from "../app/sections/ConfiguredHealthQuestions";
import { applicantParticipatesInPage } from "../config/flowGates";
import { validateHealthPage } from "../config/healthFollowUps";
import { configuredHealthQuestionnaire } from "../domain/configuredHealthQuestionnaire";
import { getPrototypeLibrary } from "../domain/prototypeLibrary";

export default function HealthCir() {
  return <FormRoutePage pageId="health-cir" help={<HealthInformationHelp />} validate={values => validateHealthPage("health-cir", values)} devFillFields={values => {
    const library = getPrototypeLibrary();
    return library ? (["self", "spouse"] as const).flatMap(applicant => applicantParticipatesInPage("health-cir", applicant, values) ? configuredHealthQuestionnaire(library.site, "health-cir", applicant, values).fields : []) : [];
  }}>{({ control, errors, watchedValues }) => {
    const library = getPrototypeLibrary();
    const entries = library ? (["self", "spouse"] as const)
      .filter(applicant => applicantParticipatesInPage("health-cir", applicant, watchedValues))
      .flatMap(applicant => configuredHealthQuestionEntries({ questionnaire: configuredHealthQuestionnaire(library.site, "health-cir", applicant, watchedValues), applicant, control, errors })) : [];
    return entries.length ? <HealthQuestionList values={watchedValues} entries={entries} /> : <Alert severity="error">Unable to load health questions. Please try again.</Alert>;
  }}</FormRoutePage>;
}
