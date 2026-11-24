import ApplicationErrorState from '../components/feedback/ApplicationErrorState';
import { applicationPaymentAnswers, hasPaymentDocument } from '../domain/paymentAnswers';
import { receiptHasTechnicalIssue, receiptNeedsUnderwritingNote, receiptDecisionPresentation } from '../domain/receiptPresentation';
import AppSnackbar from '../components/feedback/AppSnackbar';
import { getPrototypeLibrary } from '../domain/prototypeLibrary';
import { getPageSections } from '../config/pageSections/getPageSections';
import { receiptConfirmationNumber } from '../domain/receiptConfirmation';
import { readSavedApplication } from '../services/applicantSaveService';
import { riderDescription } from '../domain/riderDescription';
import { requirementText } from "../domain/requirementContent";
import { getActiveClient } from '../config/client/getActiveClient';
import { getSurfaceField } from '../config/fields/storedSurfaces';
import ReceiptDecisions from '../components/receipt/ReceiptDecisions';
import { paymentPeriodSuffix, useApplicationEstimates } from '../app/estimates/useApplicationEstimates';
import EstimatedRate from '../components/coverage/EstimatedRate';
import { groupReceiptDecisions } from "../domain/receiptGroups";
import ApplicantSectionDivider from "../app/sections/ConfiguredApplicantSectionDivider";
import { useEffect, useMemo, useState } from "react";
import ProductCard from "../components/layout/ProductCard";
import { Alert, Divider, Stack, Typography } from "@mui/material";
import PageShell from "../components/layout/PageShell";
import FormShell from "../components/layout/FormShell";
import ReceiptConfirmation from "../components/receipt/ReceiptConfirmation";
import ReceiptCoverageDecision from "../components/receipt/ReceiptCoverageDecision";
import { getActiveClientCoverages } from "../config/client/getActiveClientCoverages";
import { getPageTitle, getPageSubhead } from "../config/pages";
import {
  useApplicationForm,
} from "../app/ApplicationFormContext";
import {
  getOrderedDecisionEntries,
  formatCurrencyAmount,
} from "../utils/coverageDecisions";
import { getContent } from "../content";
import SiteSupport from "../components/layout/SiteSupport";


export default function Receipt() {
  const { values } = useApplicationForm();
  const library = getPrototypeLibrary();
  if (!library) throw new Error('Missing fresh-start Receipt projection');
  const siteKey = library.site.siteKey;
  const sections = getPageSections('receipt');
  const estimates = useApplicationEstimates(values);
  const { receipt: receiptContent, shared: { applicantLabels } } = getContent();

  const coverages = getActiveClientCoverages();

  const [confirmationNumber, setConfirmationNumber] = useState("");
  const [documentPlaceholderOpen, setDocumentPlaceholderOpen] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });

    const nextConfirmationNumber = receiptConfirmationNumber(siteKey, values, readSavedApplication(siteKey)?.applicationId);
    setConfirmationNumber(nextConfirmationNumber);
  }, [values, siteKey]);

  const orderedDecisionEntries = useMemo(
    () => getOrderedDecisionEntries(values, coverages),
    [values, coverages],
  );

  const paymentAnswers = applicationPaymentAnswers(library, values, coverages);
  const paymentDocumentAvailable = hasPaymentDocument(paymentAnswers);
  const policy = library.client.reviewPolicy;
  if (!policy) throw new Error('Missing fresh-start Review policy');
  const underwritingNote = receiptContent.underwritingNote.text.trim() && receiptNeedsUnderwritingNote(orderedDecisionEntries, values, policy) ? receiptContent.underwritingNote : undefined;
  const decisionGroups = groupReceiptDecisions(orderedDecisionEntries, values);
  const hasApplicantSelections = orderedDecisionEntries.length > 0;
  const showApplicantHeadings = orderedDecisionEntries.some(entry => entry.applicant !== 'member') || decisionGroups.some(group => group.attachedBenefits.some(benefit => benefit.applicant !== 'member'));
  const sectionLabels = getActiveClient().applicantLabels;


  if (receiptHasTechnicalIssue(orderedDecisionEntries, values)) return <ApplicationErrorState status="technical-error" />;

  return (
    <PageShell title={getPageTitle("receipt")} maxWidth="lg" noTitle>
      <AppSnackbar open={documentPlaceholderOpen} autoHideDuration={4000} onClose={() => setDocumentPlaceholderOpen(false)} severity="info" message={requirementText("application.ui.document-downloads-are-placeholders-in-this-prototype")} />
      <FormShell sx={{ p: { xs: 3, md: 5 } }}>
        <Stack spacing={4}>
          {sections.map(section => {
            if (section.id === "receiptConfirmation") return <ReceiptConfirmation key={section.id}
            title={getPageTitle("receipt")}
            description={getPageSubhead("receipt")}
            content={receiptContent}
            confirmationNumber={confirmationNumber}
            hasActivePaymentInformation={paymentDocumentAvailable}
            onDownloadApplication={() => setDocumentPlaceholderOpen(true)}
            onDownloadPayment={paymentDocumentAvailable ? () => setDocumentPlaceholderOpen(true) : undefined}
            underwritingNote={underwritingNote}
          />;

          if (section.id !== "receiptDecisions") throw new Error(`Unsupported Receipt section: ${section.id}`);
          return <ReceiptDecisions key={section.id} title={receiptContent.coverageDecisions.title} description={receiptContent.coverageDecisions.description}
            support={<SiteSupport confirmationId={confirmationNumber} />}>
              {hasApplicantSelections ? (
                <Stack spacing={3} divider={<Divider />}>
                  {decisionGroups.map(group => <Stack key={group.coverage.id} spacing={3}>
                    {group.entries.map((entry) => {
                    const decision = receiptDecisionPresentation(entry, values);

                    const applicantLabel = applicantLabels[entry.applicant];
                    const estimate = estimates.items.find(item => item.id === `${entry.coverageId}:${entry.applicant}`);

                    return (
                      <ReceiptCoverageDecision key={`${entry.coverageId}-${entry.applicant}`}
                        productName={group.coverage.name}
                        {...decision}
                        applicantLabel={applicantLabel}
                        applicant={entry.applicant}
                        showApplicant={showApplicantHeadings}
                        applicantLabels={sectionLabels}
                        estimatedPayment={estimate?.display.status === 'hidden' ? undefined : <EstimatedRate display={estimate?.display ?? { status: 'needs-information' }} appearance="summary" suffix={paymentPeriodSuffix(estimate?.period)} />}
                        paymentMethod={getSurfaceField('paymentControls', 'payment-method')?.options?.find(option => option.value === paymentAnswers[`payment-method:${entry.coverageId}`])?.label}
                      >
                        {group.attachedBenefits.filter(benefit => benefit.owner === entry.applicant).map(benefit => <ApplicantSectionDivider key={`${benefit.rider.id}-${benefit.owner}`} applicant={benefit.applicant === "member" ? "self" : benefit.applicant} showLabel={benefit.applicant !== "member"}>
                          <Typography variant="subtitle1">{benefit.rider.name}</Typography>
                          {benefit.amount !== undefined && <Typography variant="body2">{requirementText("application.ui.requested")}{formatCurrencyAmount(benefit.amount)}</Typography>}
                          <Typography variant="body2" color="text.secondary">{riderDescription(benefit.rider, benefit.applicant)}</Typography>
                          <Typography variant="body2" sx={{ mt: 1 }}>{requirementText("receipt.attached-benefit.decision-note")}</Typography>
                        </ApplicantSectionDivider>)}
                      </ReceiptCoverageDecision>
                    );
                  })}
                  </Stack>)}
                </Stack>
              ) : (
                <ProductCard sx={{ p: 3 }}>
                  <Alert severity="info" variant="outlined">
                    {receiptContent.coverageDecisions.noSelectionsMessage}
                  </Alert>
                </ProductCard>
              )}
          </ReceiptDecisions>;
          })}
        </Stack>
      </FormShell>
    </PageShell>
  );
}
