import { advanceApplicationWorkflow } from '../services/applicantSaveService';
import { resolveSiteId } from '../data/activeSite';
import { shouldShowApplicantLabel } from '../utils/applicantVisibility';
import { validateProfile } from '../domain/profileValidation';
import ProfileSections from "../components/profile/ProfileSections";
import { getActiveClient } from "../config/client/getActiveClient";
import { buildSelectedCoverageEntries } from "../utils/coverageDecisions";
import { financialQuestionnaireForApplication } from "../domain/financialQuestionnaire";
import { getPrototypeLibrary } from "../domain/prototypeLibrary";
import { useRef, useState } from "react";
import FormRoutePage, {
  isSectionVisible,
  type BeforeNextContext,
} from "../app/RoutePage";
import { getActiveClientCoverages } from "../config/client/getActiveClientCoverages";
import { useApplicationForm } from "../app/ApplicationFormContext";
import SendApplicationDialog from "../components/layout/SendApplicationDialog";
import {
  getApplicantEmail,
  getApplicantName,
} from "../utils/applicantIdentity";
import { getContent } from "../content";
import { getPageSectionNote } from '../config/pages';
import { applicantHasSelectedCategory, applicantParticipatesInPage } from '../config/flowGates';

export default function Profile() {
  const { values } = useApplicationForm();
  const coverages = getActiveClientCoverages();
  const sendToApplicantContent = getContent().dialogs.sendApplication.sendToApplicant;

  // Advisor flow: show send-application dialog before navigating after Profile.
  // advisor-flow-type is set in ApplicationFormContext when an advisor logs in.
  const isAdvisorFlow = Boolean(values["advisor-flow-type"]);
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const pendingContinueRef = useRef<(() => void) | null>(null);

  const applicantName = getApplicantName(values);
  const applicantEmail = getApplicantEmail(values);

  async function handleSendConfirm() {
    await advanceApplicationWorkflow(resolveSiteId(), 'send-to-applicant');
    setSendDialogOpen(false);
    const continueNavigation = pendingContinueRef.current;
    pendingContinueRef.current = null;
    continueNavigation?.();
  }

  function handleSendCancel() {
    setSendDialogOpen(false);
    pendingContinueRef.current = null;
  }

  function handleBeforeNext({ continueNavigation }: BeforeNextContext) {
    if (!isAdvisorFlow) {
      return true;
    }

    pendingContinueRef.current = continueNavigation;
    setSendDialogOpen(true);
    return false;
  }

  return (
    <>
      <FormRoutePage pageId="profile" validate={current => validateProfile(current, getPrototypeLibrary()!)} onBeforeNext={handleBeforeNext}
        resolveNextPageId={isAdvisorFlow ? () => "advisor-send-confirmation" : undefined}>
        {({ control, errors, watchedValues, allFields, pageSections }) => {
          const selfHasLife = applicantHasSelectedCategory(watchedValues, 'member', ['LI'], coverages);
          const selfHasDisability = applicantHasSelectedCategory(watchedValues, 'member', ['DI'], coverages);
          const spouseHasLife = applicantHasSelectedCategory(watchedValues, 'spouse', ['LI'], coverages);
          const spouseHasDisability = applicantHasSelectedCategory(watchedValues, 'spouse', ['DI'], coverages);
          const financialQuestionnaireRequired = financialQuestionnaireForApplication(getPrototypeLibrary()?.site.configuration, buildSelectedCoverageEntries(watchedValues, coverages), watchedValues);

          const library = getPrototypeLibrary();
          return <ProfileSections control={control} errors={errors} watchedValues={watchedValues} allFields={allFields}
            pageSections={pageSections.filter(section => section.fieldIds.some(id => allFields.some(field => field.id === id)) && isSectionVisible(section, watchedValues) && (!section.applicant || applicantParticipatesInPage('profile', section.applicant, watchedValues, coverages)) && (section.id !== "profileFinancialQuestionnaireSelf" || financialQuestionnaireRequired))}
            selfHasLife={selfHasLife} selfHasDisability={selfHasDisability} spouseHasLife={spouseHasLife} spouseHasDisability={spouseHasDisability}
            applicantLabels={getActiveClient().applicantLabels}
            sectionNotes={Object.fromEntries(pageSections.map(section => [section.id, getPageSectionNote('profile', section.id)]))}
            showApplicantLabels={{ self: shouldShowApplicantLabel('self', watchedValues, coverages), spouse: true }}
            financialCalculations={library?.client.applicantExperience?.profile?.financialCalculations}
            lifeReplacementNotice={library?.client.applicantExperience?.profile?.lifeReplacementNotice}
            disabilityCollections={{ self: library?.fieldCollections.selfDisabilityCompanies, spouse: library?.fieldCollections.spouseDisabilityCompanies }} />;

        }}
      </FormRoutePage>

      {isAdvisorFlow && (
        <SendApplicationDialog
          open={sendDialogOpen}
          onClose={handleSendCancel}
          onConfirm={handleSendConfirm}
          title={sendToApplicantContent.title}
          introText={sendToApplicantContent.introText}
          recipientName={applicantName}
          recipientEmail={applicantEmail}
          recipientLabel="applicant"
        />
      )}
    </>
  );
}
