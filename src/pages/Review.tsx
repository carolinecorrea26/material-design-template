import { advanceApplicationWorkflow } from '../services/applicantSaveService';
import { shouldShowApplicantLabel } from '../utils/applicantVisibility';
import { requirementValidationMessage } from "../domain/requirementValidations";
import { requirementText } from "../domain/requirementContent";
import { advisorRecipient } from '../domain/advisorFlow';
import { getResolvedFormFlow, shouldSkipPage } from '../config/formFlow';
import ReviewSections from "../components/review/ReviewSections";
import { getActiveClient } from "../config/client/getActiveClient";
import { resolveSiteId } from "../data/activeSite";
import { composeReadAndSign, isAdvisorReviewQuery, resolveReviewExperience } from "../config/reviewExperience";
import { validateCoverageSubmission } from "../domain/coverageRuntime";
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import FormRoutePage from "../app/RoutePage";
import { useSinglePageFlow } from "../app/SinglePageFlowContext";
import { applicantParticipatesInPage } from "../config/flowGates";
import { getPrototypeLibrary } from "../domain/prototypeLibrary";
import { fieldValidationChecks } from "../utils/fieldValidation";
import type { PageId } from "../types";
import { getActiveClientCoverages } from "../config/client/getActiveClientCoverages";
import ApplicationDocumentPreview from "../app/sections/ConfiguredApplicationDocumentPreview";
import { getContent } from "../content";
import type { ApplicationFormValues } from "../app/ApplicationFormContext";
import ConfirmationDialog from "../components/layout/ConfirmationDialog";
import SendApplicationDialog from "../components/layout/SendApplicationDialog";
import { useApplicationSession } from "../app/ApplicationSessionContext";
import { getPagePath } from "../config/pages";

export default function Review() {
const reviewContent = getContent().review;
const editApplicationDialogContent = getContent().dialogs.confirmation.editApplication;
const requestEditDialogContent =
  getContent().dialogs.sendApplication.requestEditToApplication;


  const client = getActiveClient();
  const library = getPrototypeLibrary();
  if (!library) throw new Error('Missing fresh-start Review configuration');
  const acknowledgement = (name: 'reviewAcknowledgements' | 'reviewSpouseAcknowledgement') => {
    const field = library.fieldSurfaces[name].mapping.fields[0];
    if (!field) throw new Error(`Missing fresh-start Review acknowledgement: ${name}`);
    return field;
  };
  const selfConsentField = acknowledgement('reviewAcknowledgements');
  const spouseConsentField = acknowledgement('reviewSpouseAcknowledgement');
  const reviewExperience = (values: Record<string, unknown>) => resolveReviewExperience(client, resolveSiteId(), getActiveClientCoverages(), values);
  const navigate = useNavigate();
  const singlePageFlow = useSinglePageFlow();
  const [searchParams] = useSearchParams();
  const {
    reviewSubmitted: isReviewSubmitted,
    advisorApplicantFlow,
    setAdvisorApplicantFlow,
  } = useApplicationSession();
  const [editTargetPageId, setEditTargetPageId] = useState<PageId | null>(null);
  const [sendBackDialogOpen, setSendBackDialogOpen] = useState(false);
  const advisorQuery = isAdvisorReviewQuery(searchParams);
  const isAdvisorApplicantFlow = advisorQuery || advisorApplicantFlow;

  useEffect(() => {
    if (advisorQuery) {
      setAdvisorApplicantFlow(true);
    }
  }, [advisorQuery, setAdvisorApplicantFlow]);


  function handleEditConfirm() {
    if (editTargetPageId) {
      if (singlePageFlow) singlePageFlow.goToSection(editTargetPageId);
      else navigate(getPagePath(editTargetPageId));
    }
    setEditTargetPageId(null);
  }

  return (
    <FormRoutePage
      pageId="review"
      validate={values => {
        const coverageError = validateCoverageSubmission(getActiveClientCoverages(), values);
        if (coverageError) return coverageError;
        const experience = reviewExperience(values);
        if (experience.missingResidency) return requirementValidationMessage("review-residency");
        if (experience.consent.status !== "resolved") return requirementValidationMessage("review-applicant-type");
        for (const field of experience.blocks.flatMap(block => block.fields)) {
          const invalid = fieldValidationChecks(field).find(check => !check.validate(values[field.id]));
          if (invalid) return invalid.message;
        }
      }}
      runtimeFields={(currentValues) => [
        ...reviewExperience(currentValues).blocks.flatMap(block => block.fields),
        selfConsentField,
        ...(applicantParticipatesInPage("review", "spouse", currentValues)
          ? [spouseConsentField]
          : []),
      ]}
    >
      {({ control, errors, watchedValues, allFields }) => {
        const values = watchedValues as ApplicationFormValues;
        const experience = reviewExperience(values);
        const hasSpouse = applicantParticipatesInPage("review", "spouse", values);


        function openEdit(pageId: PageId) {
          if (isAdvisorApplicantFlow) {
            setSendBackDialogOpen(true);
            return;
          }

          setEditTargetPageId(pageId);
        }

        return (
          <>
            <ReviewSections control={control} errors={errors} reviewContent={reviewContent} legalSections={experience.legalSections}
              documentPreview={<ApplicationDocumentPreview
              values={values}
              signatureName=""
              signedDate=""
              onEditSection={isReviewSubmitted ? undefined : openEdit}
              hideSignature
            />}
              isAdvisorApplicantFlow={isAdvisorApplicantFlow} legalDocuments={experience.legalDocuments}
              remainingSteps={[...new Set(getResolvedFormFlow().slice(getResolvedFormFlow().indexOf('review') + 1).filter(page => !shouldSkipPage(page, values)).flatMap(page => page.startsWith('health-') ? [requirementText('review.remaining-steps.health')] : page === 'payment' ? [requirementText('review.remaining-steps.payment')] : page === 'docusign' ? [requirementText('review.remaining-steps.docusign')] : []))]}
              readAndSignText={experience.consent.status === "resolved" ? composeReadAndSign(reviewContent.readAndSignContent, experience.fraudNotice, experience.consent.text, experience.authorizationVisible, experience.medicalAuthorization, experience.premiumContributionStatement) : requirementText("application.ui.select-a-valid-applicant-type-to-display-the-applicable-consent")}
              beforeConsentNotices={experience.consent.status === "resolved" ? experience.blocks.filter(block => block.placement === "before-consent") : []}
              blocks={experience.consent.status === "resolved" ? experience.blocks.filter(block => block.placement !== "before-consent") : []}
              selfConsentField={selfConsentField} spouseConsentField={hasSpouse ? spouseConsentField : undefined}
              additionalFields={allFields.filter(field => !["review-self-consent", "review-spouse-consent", ...experience.blocks.flatMap(block => block.fields.map(field => field.id))].includes(field.id))}
              applicantLabels={client.applicantLabels} showSelfLabel={shouldShowApplicantLabel('self', values)}
               />
            <ConfirmationDialog
              open={!isAdvisorApplicantFlow && editTargetPageId !== null}
              onClose={() => setEditTargetPageId(null)}
              title={editApplicationDialogContent.title}
              message={editApplicationDialogContent.message}
              confirmLabel={requirementText("review.edit.confirm")}
              cancelLabel={requirementText("review.edit.cancel")}
              onConfirm={handleEditConfirm}
            />

            <SendApplicationDialog
              open={isAdvisorApplicantFlow && sendBackDialogOpen}
              onClose={() => setSendBackDialogOpen(false)}
              onConfirm={async () => {
                await advanceApplicationWorkflow(resolveSiteId(), 'request-edit');
                setSendBackDialogOpen(false);
                navigate(getPagePath("application-edit-confirmation"));
              }}
              title={requestEditDialogContent.title}
              introText={requestEditDialogContent.introText}
              showRecipientName={false}
              recipientEmail={advisorRecipient(values)}
              recipientLabel="advisor"
            />

          </>
        );
      }}
    </FormRoutePage>
  );
}
