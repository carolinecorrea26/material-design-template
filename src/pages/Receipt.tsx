import { requirementText } from "../domain/requirementContent";
import { getActiveClient } from '../config/client/getActiveClient';
import { getSurfaceField } from '../config/fields/storedSurfaces';
import ReceiptApplicationSummary from '../components/receipt/ReceiptApplicationSummary';
import ReceiptDecisions from '../components/receipt/ReceiptDecisions';
import { paymentPeriodSuffix, useApplicationEstimates } from '../app/estimates/useApplicationEstimates';
import EstimatedRate from '../components/coverage/EstimatedRate';
import { groupReceiptDecisions } from "../domain/receiptGroups";
import ApplicantSectionDivider from "../app/sections/ConfiguredApplicantSectionDivider";
import { useEffect, useMemo, useState } from "react";
import ProductCard from "../components/layout/ProductCard";
import { Alert, Snackbar, Stack, Typography } from "@mui/material";
import PageShell from "../components/layout/PageShell";
import FormShell from "../components/layout/FormShell";
import ReceiptConfirmation from "../components/receipt/ReceiptConfirmation";
import ReceiptCoverageDecision from "../components/receipt/ReceiptCoverageDecision";
import { getActiveClientCoverages } from "../config/client/getActiveClientCoverages";
import { getPageTitle } from "../config/pages";
import {
  useApplicationForm,
  type ApplicationFormValues,
} from "../app/ApplicationFormContext";
import { sendReceiptMockEmail } from "../utils/mockEmail";
import {
  getCoverageAmountRequested,
  getDecisionStatus,
  getOrderedDecisionEntries,
  getQdDecisionResult,
  isQuickDecisionUnderwritingType,
  formatCurrencyAmount,
} from "../utils/coverageDecisions";
import { getContent } from "../content";
import SiteSupport from "../components/layout/SiteSupport";


const RECEIPT_CONFIRMATION_KEY = "receiptConfirmationNumber";

function hashStringToDigits(input: string): string {
  let hash = 0;

  for (let i = 0; i < input.length; i += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }

  return Math.abs(hash).toString().padStart(8, "0").slice(0, 8);
}

function getOrCreateConfirmationNumber(values: ApplicationFormValues): string {
  if (typeof values["mock-submission-id"] === "string") return values["mock-submission-id"];
  const stored = window.sessionStorage.getItem(RECEIPT_CONFIRMATION_KEY);
  if (stored) return stored;

  const source = JSON.stringify({
    firstName: values["first-name"],
    lastName: values["last-name"],
    memberId: values["member-id"],
    coverageSelections: values.coverageSelections,
    productApplicants: values.productApplicants,
    coverageAmounts: values.coverageAmounts,
  });

  const confirmationNumber = `APP-${hashStringToDigits(source)}`;
  window.sessionStorage.setItem(RECEIPT_CONFIRMATION_KEY, confirmationNumber);
  return confirmationNumber;
}

export default function Receipt() {
  const { values } = useApplicationForm();
  const estimates = useApplicationEstimates(values);
  const { receipt: receiptContent, shared: { applicantLabels } } = getContent();

  const coverages = getActiveClientCoverages();

  const [confirmationNumber, setConfirmationNumber] = useState("");
  const [documentPlaceholderOpen, setDocumentPlaceholderOpen] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });

    const nextConfirmationNumber = getOrCreateConfirmationNumber(values);
    setConfirmationNumber(nextConfirmationNumber);

    void sendReceiptMockEmail(values, nextConfirmationNumber).catch((error) => {
      console.warn("Receipt mock email failed", error);
    });
  }, [values]);

  const orderedDecisionEntries = useMemo(
    () => getOrderedDecisionEntries(values, coverages),
    [values, coverages],
  );

  const decisionGroups = groupReceiptDecisions(orderedDecisionEntries, values);
  const hasApplicantSelections = orderedDecisionEntries.length > 0;
  const showApplicantHeadings = orderedDecisionEntries.some(entry => entry.applicant !== 'member') || decisionGroups.some(group => group.attachedBenefits.some(benefit => benefit.applicant !== 'member'));
  const sectionLabels = getActiveClient().applicantLabels;
  const receiptItems = orderedDecisionEntries.map(entry => {
    const estimate = estimates.items.find(item => item.id === `${entry.coverageId}:${entry.applicant}`);
    return {
      id: `${entry.coverageId}:${entry.applicant}`,
      productName: entry.coverage.name,
      applicantLabel: applicantLabels[entry.applicant],
      applicant: entry.applicant,
      requestedAmount: getCoverageAmountRequested(values, entry.coverageId, entry.applicant),
      estimatedPayment: estimate?.display.status === 'hidden' ? undefined : <EstimatedRate display={estimate?.display ?? { status: 'needs-information' }} appearance="summary" suffix={paymentPeriodSuffix(estimate?.period)} />,
      paymentMethod: getSurfaceField('paymentControls', 'payment-method')?.options?.find(option => option.value === values[`payment-method:${entry.coverageId}`])?.label,
    };
  });


  return (
    <PageShell title={getPageTitle("receipt")} maxWidth="lg" noTitle>
      <Snackbar open={documentPlaceholderOpen} autoHideDuration={4000} onClose={() => setDocumentPlaceholderOpen(false)}>
        <Alert severity="info" onClose={() => setDocumentPlaceholderOpen(false)}>{requirementText("application.ui.document-downloads-are-placeholders-in-this-prototype")}</Alert>
      </Snackbar>
      <FormShell sx={{ p: { xs: 3, md: 5 } }}>
        <Stack spacing={4}>
          <ReceiptConfirmation
            title={getPageTitle("receipt")}
            content={receiptContent}
            confirmationNumber={confirmationNumber}
            onDownloadApplication={() => setDocumentPlaceholderOpen(true)}
            onDownloadPayment={() => setDocumentPlaceholderOpen(true)}
          />

          <ReceiptDecisions title={receiptContent.coverageDecisions.title} description={receiptContent.coverageDecisions.description}
            receipt={<ReceiptApplicationSummary items={receiptItems} showApplicant={showApplicantHeadings} applicantLabels={sectionLabels} />}
            support={<SiteSupport confirmationId={confirmationNumber} />}>
              {hasApplicantSelections ? (
                <Stack spacing={2}>
                  {decisionGroups.map(group => <Stack key={group.coverage.id} spacing={3}>
                    {group.entries.map((entry) => {
                    const index = orderedDecisionEntries.indexOf(entry);
                    const decisionResult = getQdDecisionResult(
                      values,
                      entry.coverageId,
                      entry.applicant,
                      index,
                    );

                    const underwritingType = entry.underwriting ? (entry.underwriting.status === 'resolved' ? entry.underwriting.underwritingType ?? 'UNRESOLVED' : 'UNRESOLVED') : entry.coverage.underwritingType;
                    const status = getDecisionStatus({
                      underwritingType,
                      decisionResult,
                    });

                    const applicantLabel = applicantLabels[entry.applicant];

                    return (
                      <ReceiptCoverageDecision key={`${entry.coverageId}-${entry.applicant}`}
                        productName={group.coverage.name}
                        quickDecision={!group.coverage.underwritingBands?.length && group.coverage.underwritingType === "QD"}
                        status={status}
                        tone={isQuickDecisionUnderwritingType(underwritingType)
                          ? decisionResult === "conditionally-approved" ? "success" : decisionResult === "soft-declined" ? "warning" : "primary"
                          : underwritingType === "UNRESOLVED" ? "warning" : "primary"}
                        applicantLabel={applicantLabel}
                        applicant={entry.applicant}
                        showApplicant={showApplicantHeadings}
                        applicantLabels={sectionLabels}
                      >
                        {group.attachedBenefits.filter(benefit => benefit.owner === entry.applicant).map(benefit => <ApplicantSectionDivider key={`${benefit.rider.id}-${benefit.owner}`} applicant={benefit.applicant === "member" ? "self" : benefit.applicant} showLabel={benefit.applicant !== "member"}>
                          <Typography variant="subtitle1">{benefit.rider.name}</Typography>
                          {benefit.amount !== undefined && <Typography variant="body2">{requirementText("application.ui.requested")}{formatCurrencyAmount(benefit.amount)}</Typography>}
                          <Typography variant="body2" color="text.secondary">{benefit.rider.description}</Typography>
                          <Typography variant="body2" sx={{ mt: 1 }}>{requirementText("application.ui.included-in")}{benefit.owner === "member" ? "member" : benefit.owner}{requirementText("application.ui.coverage-shares-its-application-decision")}</Typography>
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
          </ReceiptDecisions>
        </Stack>
      </FormShell>
    </PageShell>
  );
}
