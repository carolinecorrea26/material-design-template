import { groupReceiptDecisions } from "../domain/receiptGroups";
import ApplicantSectionDivider from "../components/layout/ApplicantSectionDivider";
import { useEffect, useMemo, useState } from "react";
import ProductCard from "../components/layout/ProductCard";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import CircleOutlinedIcon from "@mui/icons-material/CircleOutlined";
import FileDownloadRoundedIcon from "@mui/icons-material/FileDownloadRounded";
import HeadsetMicIcon from "@mui/icons-material/HeadsetMic";
import RadioButtonCheckedIcon from "@mui/icons-material/RadioButtonChecked";
import {
  Alert,
  Box,
  Button,
  Link,
  Stack,
  Step,
  StepLabel,
  Stepper,
  Typography,
} from "@mui/material";
import type { StepIconProps } from "@mui/material/StepIcon";
import { getActiveClient } from "../config/client/getActiveClient";
import { getActiveClientCoverages } from "../config/client/getActiveClientCoverages";
import { getPageTitle } from "../config/pages";
import {
  useApplicationForm,
  type ApplicationFormValues,
} from "../app/ApplicationFormContext";
import { sendReceiptMockEmail } from "../utils/mockEmail";
import theme from "../app/theme";
import {
  APPLICANT_LABELS,
  DECISION_STEPS,
  getCoverageAmountRequested,
  getDecisionStatus,
  getOrderedDecisionEntries,
  getQdDecisionResult,
  isQuickDecisionUnderwritingType,
  formatCurrencyAmount,
} from "../utils/coverageDecisions";
import { getContent, resolveTemplate } from "../content";

import { downloadApplicationPdf } from '../utils/applicationPdf';

const receiptContent = getContent().receipt;
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

function getTelHref(phone: string): string {
  return phone.replace(/\D/g, "");
}

export default function Receipt() {
  const { values } = useApplicationForm();

  const client = useMemo(() => getActiveClient(), []);
  const coverages = useMemo(() => getActiveClientCoverages(), []);

  const [confirmationNumber, setConfirmationNumber] = useState("");

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

  const shouldShowQuickDecisionDownload = orderedDecisionEntries.some((entry) =>
    isQuickDecisionUnderwritingType(entry.coverage.underwritingType),
  );

  const supportPhone = client.support.phoneDisplay || client.support.phone;
  const supportEmail = client.support.email;
  const supportHours = client.support.phoneHours;
  const hasSupportInfo = Boolean(supportPhone || supportEmail || supportHours);

  const uniqueApplicants = useMemo(() => {
    const applicants = new Set([...orderedDecisionEntries.map((e) => e.applicant), ...groupReceiptDecisions(orderedDecisionEntries, values).flatMap(g => g.attachedBenefits.map(b => b.applicant))]);
    return Array.from(applicants)
      .map((a) => APPLICANT_LABELS[a])
      .join(", ");
  }, [orderedDecisionEntries, values]);

  const cardSx = {
    backgroundColor: "background.paper",
    border: "1px solid",
    borderColor: "divider",
    borderRadius: "16px",
    p: 3,
  };

  return (
    <Box
      sx={{
        flex: 1,
        backgroundColor: "background.paper",
        borderRadius: "16px",
        boxShadow: "rgba(52, 59, 72, 0.06) 0px 8px 16px",
        p: { xs: 3, md: 4 },
      }}
    >
      <Stack spacing={3}>
        {/* Header section */}
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          alignItems={{ xs: "flex-start", sm: "flex-start" }}
        >
          <Box
            alignSelf={{ xs: "center", sm: "flex-start" }}
            sx={{
              width: 56,
              height: 56,
              borderRadius: "50%",
              display: "grid",
              placeItems: "center",
              backgroundColor: "rgba(0, 148, 101, 0.10)",
              flexShrink: 0,
              animation: "receipt-ring 750ms ease-out",
              "@keyframes receipt-ring": {
                from: { transform: "scale(0.82)", opacity: 0.2 },
                to: { transform: "scale(1)", opacity: 1 },
              },
              "& svg": {
                animation: "receipt-pop 580ms ease-out",
              },
              "@keyframes receipt-pop": {
                from: { transform: "scale(0.3)", opacity: 0 },
                to: { transform: "scale(1)", opacity: 1 },
              },
            }}
          >
            <CheckCircleRoundedIcon
              sx={{ color: "success.main", fontSize: 36 }}
            />
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="h4" component="h1" sx={{ mb: 1 }}>
              {getPageTitle("receipt")}
            </Typography>

            <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
              <span color="text.secondary">{receiptContent.confirmationNumberLabel}</span>{" "}
              <strong>{confirmationNumber || "-"}</strong>
            </Typography>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {import.meta.env.VITE_MOCK_PLATFORM_ENABLED ? "Your application has been saved. Download a copy of your application data below." : receiptContent.documentsNote}
            </Typography>

            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={1}
              useFlexGap
              sx={{ width: { xs: "100%", sm: "auto" } }}
            >
              <Button
                variant="contained"
                startIcon={<FileDownloadRoundedIcon />}
                disableElevation
                onClick={() => downloadApplicationPdf(values)}
              >
                {receiptContent.documentDownloadLabels.application}
              </Button>

              <Button
                variant="outlined"
                startIcon={<FileDownloadRoundedIcon />}
                onClick={() => downloadApplicationPdf(values, true)}
              >
                {receiptContent.documentDownloadLabels.payment}
              </Button>

              {shouldShowQuickDecisionDownload && (
                <Button
                  variant="outlined"
                  startIcon={<FileDownloadRoundedIcon />}
                  disabled
                >
                  {receiptContent.documentDownloadLabels.quickDecision}
                </Button>
              )}
            </Stack>
          </Box>
        </Stack>

        {/* Summary bar */}
        <Box
          sx={(theme) => ({
            display: "flex",
            flexWrap: "wrap",
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: 2,
            backgroundColor: "background.subtle",
            "& > *": {
              flex: 1,
              minWidth: { xs: 0, sm: 140 },
              px: { xs: 1.5, sm: 3 },
              py: 1.5,
              borderRight: `1px solid ${theme.palette.divider}`,
              "&:last-child": { borderRight: "none" },
            },
          })}
        >
          <Box>
            <Typography variant="caption" color="text.secondary" noWrap>
              {receiptContent.summaryLabels.status}
            </Typography>
            <Typography
              sx={{
                fontWeight: 600,
                fontSize: { xs: "0.8rem", sm: "0.95rem" },
              }}
              noWrap
            >
              {receiptContent.summaryLabels.submittedStatus}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary" noWrap>
              {receiptContent.summaryLabels.applying}
            </Typography>
            <Typography
              sx={{
                fontWeight: 600,
                fontSize: { xs: "0.8rem", sm: "0.95rem" },
              }}
              noWrap
            >
              {uniqueApplicants || receiptContent.summaryLabels.defaultApplicant}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary" noWrap>
              {receiptContent.summaryLabels.requested}
            </Typography>
            <Typography
              sx={{
                fontWeight: 600,
                fontSize: { xs: "0.8rem", sm: "0.95rem" },
              }}
              noWrap
            >
              {orderedDecisionEntries.length}
              {import.meta.env.VITE_MOCK_PLATFORM_ENABLED ? (orderedDecisionEntries.length === 1 ? " election" : " elections") : orderedDecisionEntries.length === 1
                ? ` ${receiptContent.summaryLabels.productSingular}`
                : ` ${receiptContent.summaryLabels.productPlural}`}
            </Typography>
          </Box>
        </Box>

        {/* Two-column layout: main content + sidebar */}
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={3}
          alignItems="flex-start"
        >
          {/* Main column - Coverage decisions */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="h5" component="h2" sx={{ mb: 0.5 }}>
              {import.meta.env.VITE_MOCK_PLATFORM_ENABLED ? "Simulated coverage decisions" : receiptContent.coverageDecisions.title}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
              {receiptContent.coverageDecisions.description}
            </Typography>

            {hasApplicantSelections ? (
              <Stack spacing={2}>
                {decisionGroups.map(group => <ProductCard key={group.coverage.id} sx={{ p: 3 }}>
                  <Typography variant="h6" sx={{ mb: 2 }}>{group.coverage.name}</Typography>
                  <Stack spacing={3}>
                  {group.entries.map((entry) => {
                  const index = orderedDecisionEntries.indexOf(entry);
                  const decisionResult = getQdDecisionResult(
                    values,
                    entry.coverageId,
                    entry.applicant,
                    index,
                  );

                  const status = getDecisionStatus({
                    underwritingType: entry.coverage.underwritingType,
                    decisionResult,
                  });

                  const applicantLabel = APPLICANT_LABELS[entry.applicant];

                  const coverageAmountRequested = getCoverageAmountRequested(
                    values,
                    entry.coverageId,
                    entry.applicant,
                  );

                  const isApproved = status.label === "Conditionally approved";
                  const isSentForReview = status.label === "Sent for review";

                  return (
                    <ApplicantSectionDivider key={`${entry.coverageId}-${entry.applicant}`} applicant={entry.applicant === "member" ? "self" : entry.applicant} showLabel={group.entries.length > 1 || group.attachedBenefits.some(b => b.applicant !== "member")}>
                    <Box>
                      {/* Header row: name + badge */}
                      <Stack
                        direction="row"
                        justifyContent="space-between"
                        alignItems="flex-start"
                        sx={{ mb: 0.5 }}
                      >

                        <Box
                          sx={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 0.5,
                            px: 1.5,
                            py: 0.25,
                            borderRadius: 1,
                            backgroundColor: isApproved
                              ? "rgba(0, 148, 101, 0.08)"
                              : isSentForReview
                                ? "rgba(6, 104, 255, 0.08)"
                                : "rgba(255, 152, 0, 0.08)",
                            whiteSpace: "nowrap",
                          }}
                        >
                          <Box
                            sx={{
                              width: 8,
                              height: 8,
                              borderRadius: "50%",
                              backgroundColor: isApproved
                                ? "success.main"
                                : isSentForReview
                                  ? "primary.main"
                                  : "warning.main",
                            }}
                          />
                          <Typography
                            variant="caption"
                            sx={{
                              fontWeight: 600,
                              color: isApproved
                                ? "success.main"
                                : isSentForReview
                                  ? "primary.main"
                                  : "warning.main",
                            }}
                          >
                            {status.label}
                          </Typography>
                        </Box>
                      </Stack>

                      {/* Subtitle */}
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mb: 2 }}
                      >
                        {applicantLabel} {receiptContent.coverageCardLabels.coverageSuffix}
                        {coverageAmountRequested
                          ? ` · ${receiptContent.coverageCardLabels.requested} ${formatCurrencyAmount(coverageAmountRequested)}`
                          : ""}
                      </Typography>

                      {/* Horizontal stepper */}
                      <Stepper
                        activeStep={status.activeStep}
                        alternativeLabel
                        sx={{
                          mb: 2,
                          "& .MuiStepConnector-root": { marginLeft: 0 },
                          "& .MuiStepConnector-root.Mui-active .MuiStepConnector-line, & .MuiStepConnector-root.Mui-completed .MuiStepConnector-line":
                            {
                              borderColor: "primary.main",
                              borderTopWidth: 3,
                            },
                          "& .MuiStepConnector-line": {
                            borderTopWidth: 3,
                          },
                        }}
                      >
                        {DECISION_STEPS.map((stepLabel, stepIndex) => {
                          const isCompleted = stepIndex < status.activeStep;
                          const isActive = stepIndex === status.activeStep;
                          const isReached = isCompleted || isActive;
                          const isLastStep =
                            stepIndex === DECISION_STEPS.length - 1;

                          return (
                            <Step
                              key={stepLabel}
                              completed={
                                isCompleted || (isLastStep && isActive)
                              }
                            >
                              <StepLabel
                                StepIconComponent={({
                                  completed,
                                  active,
                                }: StepIconProps) =>
                                  completed ? (
                                    <CheckCircleRoundedIcon
                                      sx={{
                                        fontSize: 22,
                                        color: "primary.main",
                                      }}
                                    />
                                  ) : active ? (
                                    <RadioButtonCheckedIcon
                                      sx={{
                                        fontSize: 22,
                                        color: "primary.main",
                                      }}
                                    />
                                  ) : (
                                    <CircleOutlinedIcon
                                      sx={{
                                        fontSize: 22,
                                        color: "text.disabled",
                                      }}
                                    />
                                  )
                                }
                                sx={{
                                  "& .MuiStepLabel-label": {
                                    fontSize: "0.75rem",
                                    fontWeight: isReached ? 600 : 400,
                                    color: isReached
                                      ? "text.primary"
                                      : "text.secondary",
                                  },
                                }}
                              >
                                {stepLabel}
                              </StepLabel>
                            </Step>
                          );
                        })}
                      </Stepper>

                      {/* Decision description */}
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ lineHeight: 1.55 }}
                      >
                        {status.description}
                      </Typography>
                    </Box>
                    </ApplicantSectionDivider>
                  );
                })}
                {group.attachedBenefits.map(benefit => <ApplicantSectionDivider key={`${benefit.rider.id}-${benefit.owner}`} applicant={benefit.applicant === "member" ? "self" : benefit.applicant} showLabel={benefit.applicant !== "member"}>
                  <Typography variant="subtitle1">{benefit.rider.name}</Typography>
                  {benefit.amount !== undefined && <Typography variant="body2">Requested: {formatCurrencyAmount(benefit.amount)}</Typography>}
                  <Typography variant="body2" color="text.secondary">{benefit.rider.description}</Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}>Included in {benefit.owner === "member" ? "member" : benefit.owner} coverage; shares its application decision.</Typography>
                </ApplicantSectionDivider>)}
                </Stack>
                </ProductCard>)}
              </Stack>
            ) : (
              <ProductCard sx={{ p: 3 }}>
                <Alert severity="info" variant="outlined">
                  {receiptContent.coverageDecisions.noSelectionsMessage}
                </Alert>
              </ProductCard>
            )}
          </Box>

          {/* Sidebar */}
          <Box
            sx={{
              width: { xs: "100%", md: 300 },
              flexShrink: 0,
            }}
          >
            <Stack spacing={2.5}>
              {/* What happens next */}
              <Box
                sx={{
                  ...cardSx,
                  backgroundColor: theme.palette.notice.main,
                  border: `1px solid ${theme.palette.notice.border}`,
                }}
              >
                <Typography variant="h6" sx={{ mb: 2 }}>
                  {receiptContent.whatHappensNext.title}
                </Typography>
                <Stack spacing={2}>
                  {receiptContent.whatHappensNext.items.map((item, index) => {
                    const IconComponent =
                      [FileDownloadRoundedIcon, HeadsetMicIcon][index] ??
                      HeadsetMicIcon;
                    return (
                      <Stack
                        key={import.meta.env.VITE_MOCK_PLATFORM_ENABLED && index === 0 ? "Application saved" : item.title}
                        direction="row"
                        spacing={1.5}
                        alignItems="flex-start"
                      >
                        <IconComponent
                          sx={{ color: "primary.main", fontSize: 20, mt: 0.25 }}
                        />
                        <Box>
                          <Typography
                            variant="body2"
                            sx={{ fontWeight: 600, lineHeight: 1.4 }}
                          >
                            {import.meta.env.VITE_MOCK_PLATFORM_ENABLED && index === 0 ? "Application saved" : item.title}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {import.meta.env.VITE_MOCK_PLATFORM_ENABLED && index === 0 ? "Your confirmation is saved in this browser session. Your documents are being prepared." : item.description}
                          </Typography>
                        </Box>
                      </Stack>
                    );
                  })}
                </Stack>
              </Box>

              {/* Questions / Support */}
              {hasSupportInfo && (
                <Box
                  sx={{
                    ...cardSx,
                    backgroundColor: theme.palette.support.main,
                    border: `1px solid ${theme.palette.support.border}`,
                  }}
                >
                  <Typography variant="h6" sx={{ mb: 1 }}>
                    {receiptContent.support.title}
                  </Typography>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 1.5 }}
                  >
                    {resolveTemplate(receiptContent.support.administratorLabel)}
                  </Typography>

                  {supportPhone && (
                    <Typography
                      variant="body2"
                      sx={{ fontWeight: 600, mb: 0.5 }}
                    >
                      {receiptContent.support.callLabel}{" "}
                      <Link
                        href={`tel:${getTelHref(supportPhone)}`}
                        underline="none"
                        sx={{ color: "primary.main", fontWeight: 700 }}
                      >
                        {supportPhone}
                      </Link>
                    </Typography>
                  )}

                  {supportEmail && (
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {receiptContent.support.emailLabel}{" "}
                      <Link
                        href={`mailto:${supportEmail}`}
                        underline="none"
                        sx={{ color: "primary.main", fontWeight: 700 }}
                      >
                        {supportEmail}
                      </Link>
                    </Typography>
                  )}
                </Box>
              )}
            </Stack>
          </Box>
        </Stack>
      </Stack>
    </Box>
  );
}
