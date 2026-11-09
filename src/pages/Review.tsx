import { requirementText } from "../domain/requirementContent";
import advisorFixture from "../../requirements/global/prototype-fixtures/advisor.json";
import { getResolvedFormFlow, shouldSkipPage } from '../config/formFlow';
import ReviewSections from "../components/review/ReviewSections";
import { getActiveClient } from "../config/client/getActiveClient";
import { resolveSiteId } from "../data/activeSite";
import { composeReadAndSign, resolveReviewExperience } from "../config/reviewExperience";
import { validateApplicationCoverages } from "../domain/coverageRuntime";
import { buildSelectedCoverageEntries } from "../utils/coverageDecisions";
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import FormRoutePage from "../app/RoutePage";
import { useSinglePageFlow } from "../app/SinglePageFlowContext";
import {
  isApplicantApplying,
  shouldShowApplicantLabel,
} from "../utils/applicantVisibility";
import type { PageId } from "../types";
import { getActiveClientCoverages } from "../config/client/getActiveClientCoverages";
import { fieldCatalog } from "../config/fields";
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
  const isAdvisorApplicantFlow =
    searchParams.get("flow") === "advisor" || advisorApplicantFlow;

  useEffect(() => {
    if (searchParams.get("flow") === "advisor") {
      setAdvisorApplicantFlow(true);
    }
  }, [searchParams, setAdvisorApplicantFlow]);

  // Dummy advisor email used as the send-back target.
  const advisorEmail = advisorFixture.email;

  function printSection() {
    window.print();
  }

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
        const coverageError = validateApplicationCoverages(getActiveClientCoverages(), values);
        if (coverageError) return coverageError;
        const experience = reviewExperience(values);
        if (experience.missingResidency) return "Member residence is required to select the applicable fraud notice.";
        if (experience.consent.status !== "resolved") return "A valid applicant type is required to select the applicable consent.";
        for (const field of experience.blocks.flatMap(block => block.fields)) {
          if (field.required && (field.inputType === "checkbox" ? values[field.id] !== true : !String(values[field.id] ?? "").trim())) return `${field.label} is required.`;
        }
      }}
      runtimeFields={(currentValues) => [
        ...reviewExperience(currentValues).blocks.flatMap(block => block.fields),
        fieldCatalog["review-self-consent"],
        ...(isApplicantApplying("spouse", currentValues)
          ? [fieldCatalog["review-spouse-consent"]]
          : []),
      ]}
    >
      {({ control, errors, watchedValues, allFields }) => {
        const values = watchedValues as ApplicationFormValues;
        const experience = reviewExperience(values);
        const hasSpouse = isApplicantApplying("spouse", values);

        const showHealthQuestionsNote = buildSelectedCoverageEntries(values, getActiveClientCoverages()).some(
          ({ coverage }) => coverage.underwritingType === "FUW",
        );

        function openEdit(pageId: PageId) {
          if (isAdvisorApplicantFlow) {
            setSendBackDialogOpen(true);
            return;
          }

          setEditTargetPageId(pageId);
        }

        return (
          <>
            <ReviewSections control={control} errors={errors} reviewContent={reviewContent}
              documentPreview={<ApplicationDocumentPreview
              values={values}
              signatureName=""
              signedDate=""
              currentDate={new Intl.DateTimeFormat("en-US", {
                month: "2-digit",
                day: "2-digit",
                year: "numeric",
              }).format(new Date())}
              onEditSection={isReviewSubmitted ? undefined : openEdit}
              hideSignature
            />}
              isAdvisorApplicantFlow={isAdvisorApplicantFlow} showHealthQuestionsNote={showHealthQuestionsNote}
              remainingSteps={[...new Set(getResolvedFormFlow().slice(getResolvedFormFlow().indexOf('review') + 1).filter(page => !shouldSkipPage(page, values)).flatMap(page => page.startsWith('health-') ? ['Health questions'] : page === 'payment' ? ['Payment'] : page === 'docusign' ? ['Sign with DocuSign'] : []))]}
              readAndSignText={experience.consent.status === "resolved" ? composeReadAndSign(reviewContent.readAndSignContent, experience.fraudNotice, experience.consent.text, experience.authorizationVisible, experience.medicalAuthorization, experience.premiumContributionStatement) : requirementText("application.ui.select-a-valid-applicant-type-to-display-the-applicable-consent")}
              beforeConsentNotices={experience.consent.status === "resolved" ? experience.blocks.filter(block => block.placement === "before-consent") : []}
              blocks={experience.consent.status === "resolved" ? experience.blocks.filter(block => block.placement !== "before-consent") : []}
              selfConsentField={fieldCatalog["review-self-consent"]} spouseConsentField={hasSpouse ? fieldCatalog["review-spouse-consent"] : undefined}
              additionalFields={allFields.filter(field => !["review-self-consent", "review-spouse-consent", ...experience.blocks.flatMap(block => block.fields.map(field => field.id))].includes(field.id))}
              applicantLabels={client.applicantLabels} showSelfLabel={shouldShowApplicantLabel("self", values)}
              onPrint={printSection} />
            <ConfirmationDialog
              open={!isAdvisorApplicantFlow && editTargetPageId !== null}
              onClose={() => setEditTargetPageId(null)}
              title={editApplicationDialogContent.title}
              message={editApplicationDialogContent.message}
              confirmLabel="Yes"
              cancelLabel="Cancel"
              onConfirm={handleEditConfirm}
            />

            <SendApplicationDialog
              open={isAdvisorApplicantFlow && sendBackDialogOpen}
              onClose={() => setSendBackDialogOpen(false)}
              onConfirm={() => {
                setSendBackDialogOpen(false);
                navigate(getPagePath("application-edit-confirmation"));
              }}
              title={requestEditDialogContent.title}
              introText={requestEditDialogContent.introText}
              showRecipientName={false}
              recipientEmail={advisorEmail}
              recipientLabel="advisor"
            />

          </>
        );
      }}
    </FormRoutePage>
  );
}
