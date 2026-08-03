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
import { coverageCategories } from "../config/coverageCategories";
import { getContent } from "../content";
import type {
  CoverageApplicantId,
  CoverageDefinition,
  CoverageUnderwritingType,
} from "../config/coverages/types";
import {
  useApplicationForm,
  type ApplicationFormValues,
} from "../app/ApplicationFormContext";
import { sendReceiptMockEmail } from "../utils/mockEmail";
import theme from "../app/theme";

const RECEIPT_CONFIRMATION_KEY = "receiptConfirmationNumber";
const QUICK_DECISION_UNDERWRITING_TYPES = new Set(["SI", "GI", "NA", "QD"]);

type QdDecisionResult =
  | "conditionally-approved"
  | "referred"
  | "soft-declined"
  | "database-unavailable";

type SelectedCoverageEntry = {
  coverageId: string;
  applicant: CoverageApplicantId;
  coverage: CoverageDefinition;
};

type DecisionStatus = {
  label: string;
  color: string;
  description: string;
  /** Which step the stepper should highlight (0=Submitted, 1=Reviewing, 2=Decision) */
  activeStep: number;
};

const receiptContent = getContent().receipt;

const APPLICANT_LABELS: Record<CoverageApplicantId, string> =
  getContent().shared.applicantLabels;

const APPLICANT_SORT_ORDER: Record<CoverageApplicantId, number> = {
  member: 0,
  spouse: 1,
  child: 2,
};

const DEMO_QD_DECISION_RESULTS: QdDecisionResult[] = [
  "conditionally-approved",
  "referred",
  "soft-declined",
  "database-unavailable",
];

function toPositiveAmount(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value.replace(/[^\d.-]/g, ""));
    if (Number.isFinite(parsed) && parsed > 0) {
      return parsed;
    }
  }

  return null;
}

function formatCurrencyAmount(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function normalizeApplicant(value: unknown): CoverageApplicantId | null {
  if (typeof value !== "string") return null;

  const normalized = value.trim().toLowerCase();

  if (normalized === "self") return "member";

  if (
    normalized === "member" ||
    normalized === "spouse" ||
    normalized === "child"
  ) {
    return normalized;
  }

  return null;
}

function getUniqueApplicants(values: unknown[]): CoverageApplicantId[] {
  const applicants: CoverageApplicantId[] = [];

  for (const value of values) {
    const applicant = normalizeApplicant(value);

    if (applicant && !applicants.includes(applicant)) {
      applicants.push(applicant);
    }
  }

  return applicants;
}

function hashStringToDigits(input: string): string {
  let hash = 0;

  for (let i = 0; i < input.length; i += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }

  return Math.abs(hash).toString().padStart(8, "0").slice(0, 8);
}

function getOrCreateConfirmationNumber(values: ApplicationFormValues): string {
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

function getQdDecisionResult(
  values: ApplicationFormValues,
  coverageId: string,
  applicant: CoverageApplicantId,
  fallbackIndex: number,
): QdDecisionResult {
  const decisions = values.qdDecisions;

  if (decisions && typeof decisions === "object" && !Array.isArray(decisions)) {
    const key = `${coverageId}:${applicant}`;
    const result = (decisions as Record<string, string>)[key];

    if (
      result === "conditionally-approved" ||
      result === "referred" ||
      result === "soft-declined" ||
      result === "database-unavailable"
    ) {
      return result;
    }
  }

  return DEMO_QD_DECISION_RESULTS[
    fallbackIndex % DEMO_QD_DECISION_RESULTS.length
  ];
}

function getDecisionStatus(opts: {
  underwritingType: CoverageUnderwritingType;
  decisionResult: QdDecisionResult;
}): DecisionStatus {
  const { underwritingType, decisionResult } = opts;
  const type = underwritingType.toUpperCase();

  if (!QUICK_DECISION_UNDERWRITING_TYPES.has(type)) {
    return {
      label: receiptContent.decisionStatuses.fullyUnderwritten.label,
      color: "primary.main",
      activeStep: 1,
      description:
        receiptContent.decisionStatuses.fullyUnderwritten.description,
    };
  }

  switch (decisionResult) {
    case "conditionally-approved":
      return {
        label: receiptContent.decisionStatuses.conditionallyApproved.label,
        color: "primary.main",
        activeStep: 2,
        description:
          receiptContent.decisionStatuses.conditionallyApproved.description,
      };

    case "referred":
      return {
        label: receiptContent.decisionStatuses.referred.label,
        color: "primary.main",
        activeStep: 1,
        description: receiptContent.decisionStatuses.referred.description,
      };

    case "soft-declined":
      return {
        label: receiptContent.decisionStatuses.softDeclined.label,
        color: "primary.main",
        activeStep: 2,
        description: receiptContent.decisionStatuses.softDeclined.description,
      };

    case "database-unavailable":
      return {
        label: receiptContent.decisionStatuses.databaseUnavailable.label,
        color: "primary.main",
        activeStep: 1,
        description:
          receiptContent.decisionStatuses.databaseUnavailable.description,
      };
  }
}

const DECISION_STEPS = receiptContent.decisionSteps;

function isQuickDecisionUnderwritingType(underwritingType: string): boolean {
  return QUICK_DECISION_UNDERWRITING_TYPES.has(underwritingType.toUpperCase());
}

function getTelHref(phone: string): string {
  return phone.replace(/\D/g, "");
}

function getSelectedCoverageIds(values: ApplicationFormValues): string[] {
  return Array.isArray(values.coverageSelections)
    ? values.coverageSelections.map(String)
    : [];
}

function getSelectedDependents(
  values: ApplicationFormValues,
): CoverageApplicantId[] {
  return Array.isArray(values.dependents)
    ? getUniqueApplicants(values.dependents).filter(
        (applicant) => applicant === "spouse" || applicant === "child",
      )
    : [];
}

function getProductApplicants(
  values: ApplicationFormValues,
): Record<string, CoverageApplicantId[]> {
  if (
    values.productApplicants != null &&
    typeof values.productApplicants === "object" &&
    !Array.isArray(values.productApplicants)
  ) {
    return values.productApplicants as Record<string, CoverageApplicantId[]>;
  }

  return {};
}

function getCoverageAmountRequested(
  values: ApplicationFormValues,
  coverageId: string,
  applicant: CoverageApplicantId,
): number | null {
  const coverageAmounts = values.coverageAmounts;

  if (
    !coverageAmounts ||
    typeof coverageAmounts !== "object" ||
    Array.isArray(coverageAmounts)
  ) {
    return null;
  }

  return toPositiveAmount(
    (coverageAmounts as Record<string, unknown>)[`${coverageId}:${applicant}`],
  );
}

function buildSelectedCoverageEntries(
  values: ApplicationFormValues,
  coverages: CoverageDefinition[],
): SelectedCoverageEntry[] {
  const selectedCoverageIds = getSelectedCoverageIds(values);
  const selectedDependents = getSelectedDependents(values);
  const productApplicants = getProductApplicants(values);

  const coverageById = new Map(
    coverages.map((coverage) => [coverage.id, coverage]),
  );

  return selectedCoverageIds.flatMap((coverageId) => {
    const coverage = coverageById.get(coverageId);
    if (!coverage) return [];

    let applicants: CoverageApplicantId[];

    if (Object.prototype.hasOwnProperty.call(productApplicants, coverageId)) {
      const selectedApplicants = Array.isArray(productApplicants[coverageId])
        ? productApplicants[coverageId]
        : [];

      applicants = coverage.applicants.filter((applicant) =>
        selectedApplicants.includes(applicant),
      );
    } else if (selectedDependents.length > 0) {
      applicants = coverage.applicants.filter((applicant) => {
        if (applicant === "member") return true;
        return selectedDependents.includes(applicant);
      });
    } else {
      applicants = coverage.applicants.includes("member") ? ["member"] : [];
    }

    return applicants.map(
      (applicant) =>
        ({
          coverageId,
          applicant,
          coverage,
        }) satisfies SelectedCoverageEntry,
    );
  });
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

  const selectedEntries = useMemo(
    () => buildSelectedCoverageEntries(values, coverages),
    [values, coverages],
  );

  const orderedDecisionEntries = useMemo(
    () =>
      coverageCategories.flatMap((category) =>
        selectedEntries
          .filter((entry) => entry.coverage.categoryId === category.id)
          .sort((a, b) => {
            const coverageCompare = a.coverage.name.localeCompare(
              b.coverage.name,
            );

            if (coverageCompare !== 0) return coverageCompare;

            return (
              APPLICANT_SORT_ORDER[a.applicant] -
              APPLICANT_SORT_ORDER[b.applicant]
            );
          }),
      ),
    [selectedEntries],
  );

  const hasApplicantSelections = orderedDecisionEntries.length > 0;

  const shouldShowQuickDecisionDownload = orderedDecisionEntries.some((entry) =>
    isQuickDecisionUnderwritingType(entry.coverage.underwritingType),
  );

  const supportPhone = client.support.phoneDisplay || client.support.phone;
  const supportEmail = client.support.email;
  const supportHours = client.support.phoneHours;
  const hasSupportInfo = Boolean(supportPhone || supportEmail || supportHours);

  const uniqueApplicants = useMemo(() => {
    const applicants = new Set(orderedDecisionEntries.map((e) => e.applicant));
    return Array.from(applicants)
      .map((a) => APPLICANT_LABELS[a])
      .join(", ");
  }, [orderedDecisionEntries]);

  const cardSx = {
    backgroundColor: "background.paper",
    border: "1px solid #e0e4ea",
    borderRadius: 2,
    p: 3,
  };

  return (
    <Box
      sx={{
        flex: 1,
        backgroundColor: "background.paper",
        borderRadius: 3,
        // border: "1px solid #e0e4ea",
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
              Your application has been submitted
            </Typography>

            <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
              <span color="text.secondary">Confirmation number:</span>{" "}
              <strong>{confirmationNumber || "-"}</strong>
            </Typography>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Please save a copy of your application documents before leaving
              this page. For security purposes, a digital copy will not be sent
              by email.
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
              >
                Application PDF
              </Button>

              <Button
                variant="outlined"
                startIcon={<FileDownloadRoundedIcon />}
              >
                Payment PDF
              </Button>

              {shouldShowQuickDecisionDownload && (
                <Button
                  variant="outlined"
                  startIcon={<FileDownloadRoundedIcon />}
                >
                  QuickDecision PDF
                </Button>
              )}
            </Stack>
          </Box>
        </Stack>

        {/* Summary bar */}
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            border: "1px solid #e0e4ea",
            borderRadius: 2,
            backgroundColor: "#f5f6f9",
            "& > *": {
              flex: 1,
              minWidth: { xs: 0, sm: 140 },
              px: { xs: 1.5, sm: 3 },
              py: 1.5,
              borderRight: "1px solid #e0e4ea",
              "&:last-child": { borderRight: "none" },
            },
          }}
        >
          <Box>
            <Typography variant="caption" color="text.secondary" noWrap>
              Status
            </Typography>
            <Typography
              sx={{
                fontWeight: 600,
                fontSize: { xs: "0.8rem", sm: "0.95rem" },
              }}
              noWrap
            >
              Submitted
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary" noWrap>
              Applying
            </Typography>
            <Typography
              sx={{
                fontWeight: 600,
                fontSize: { xs: "0.8rem", sm: "0.95rem" },
              }}
              noWrap
            >
              {uniqueApplicants || "Member"}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary" noWrap>
              Requested
            </Typography>
            <Typography
              sx={{
                fontWeight: 600,
                fontSize: { xs: "0.8rem", sm: "0.95rem" },
              }}
              noWrap
            >
              {orderedDecisionEntries.length} product
              {orderedDecisionEntries.length !== 1 ? "s" : ""}
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
              Coverage decisions
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
              Review the current status for each coverage you applied for.
            </Typography>

            {hasApplicantSelections ? (
              <Stack spacing={2}>
                {orderedDecisionEntries.map((entry, index) => {
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
                    <ProductCard
                      key={`${entry.coverageId}-${entry.applicant}`}
                      sx={{ p: 3 }}
                    >
                      {/* Header row: name + badge */}
                      <Stack
                        direction="row"
                        justifyContent="space-between"
                        alignItems="flex-start"
                        sx={{ mb: 0.5 }}
                      >
                        <Typography variant="h6">
                          {entry.coverage.name}
                        </Typography>
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
                            sx={{
                              fontSize: "0.78rem",
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
                        {applicantLabel} coverage
                        {coverageAmountRequested
                          ? ` · Requested: ${formatCurrencyAmount(coverageAmountRequested)}`
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
                    </ProductCard>
                  );
                })}
              </Stack>
            ) : (
              <ProductCard sx={{ p: 3 }}>
                <Alert severity="info" variant="outlined">
                  No selected coverage details are available for this
                  application.
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
                  What happens next?
                </Typography>
                <Stack spacing={2}>
                  <Stack direction="row" spacing={1.5} alignItems="flex-start">
                    <FileDownloadRoundedIcon
                      sx={{ color: "primary.main", fontSize: 20, mt: 0.25 }}
                    />
                    <Box>
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: 600, lineHeight: 1.4 }}
                      >
                        Save your documents
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Download your PDFs before leaving this page.
                      </Typography>
                    </Box>
                  </Stack>
                  <Stack direction="row" spacing={1.5} alignItems="flex-start">
                    <CheckCircleRoundedIcon
                      sx={{ color: "primary.main", fontSize: 20, mt: 0.25 }}
                    />
                    <Box>
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: 600, lineHeight: 1.4 }}
                      >
                        Eligibility is confirmed
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Your group plan administrator completes final
                        eligibility review.
                      </Typography>
                    </Box>
                  </Stack>
                  <Stack direction="row" spacing={1.5} alignItems="flex-start">
                    <HeadsetMicIcon
                      sx={{ color: "primary.main", fontSize: 20, mt: 0.25 }}
                    />
                    <Box>
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: 600, lineHeight: 1.4 }}
                      >
                        You&rsquo;ll be contacted if needed
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Additional information may be requested for coverage
                        sent for review.
                      </Typography>
                    </Box>
                  </Stack>
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
                    Questions? We&rsquo;re here to help.
                  </Typography>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 1.5 }}
                  >
                    {client.branding.name} Insurance Administrator
                  </Typography>

                  {supportPhone && (
                    <Typography
                      variant="body2"
                      sx={{ fontWeight: 600, mb: 0.5 }}
                    >
                      Call:{" "}
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
                      Email:{" "}
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
