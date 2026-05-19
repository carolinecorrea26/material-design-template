import { useEffect, useMemo, useState } from "react";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import DownloadForOfflineRoundedIcon from "@mui/icons-material/DownloadForOfflineRounded";
import ScheduleSendRoundedIcon from "@mui/icons-material/ScheduleSendRounded";
import {
  Alert,
  Box,
  Button,
  Divider,
  Stack,
  Step,
  StepConnector,
  StepLabel,
  Stepper,
  Typography,
} from "@mui/material";
import FileDownloadRoundedIcon from "@mui/icons-material/FileDownloadRounded";
import QuickDecisionIndicator from "../components/common/QuickDecisionIndicator";
import {
  shouldShowApplicantLabel,
  isApplicantApplying,
} from "../components/form/applicantVisibility";
import { getActiveClient } from "../client/getActiveClient";
import { getActiveClientCoverages } from "../client/getActiveClientCoverages";
import { coverageCategories } from "../config/coverageCategories";
import type {
  CoverageDefinition,
  CoverageCategoryId,
  CoverageUnderwritingType,
} from "../config/coverages/types";
import {
  useApplicationForm,
  type ApplicationFormValues,
} from "../state/ApplicationFormContext";

const RECEIPT_CONFIRMATION_KEY = "receiptConfirmationNumber";
const QUICK_DECISION_UNDERWRITING_TYPES = new Set(["SI", "GI", "NA", "QD"]);

type QdDecisionResult =
  | "conditionally-approved"
  | "referred"
  | "soft-declined"
  | "database-unavailable";

type ReceiptApplicant = "member" | "spouse";

type SelectedCoverageEntry = {
  coverageId: string;
  applicant: ReceiptApplicant;
  amount: number;
  coverage: CoverageDefinition;
};

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
    coverageAmounts: values.coverageAmounts,
  });

  const confirmationNumber = `APP-${hashStringToDigits(source)}`;
  window.sessionStorage.setItem(RECEIPT_CONFIRMATION_KEY, confirmationNumber);
  return confirmationNumber;
}

function getQdDecisionResult(
  values: ApplicationFormValues,
  coverageId: string,
  applicant: string,
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
  return "conditionally-approved";
}

function hasImpairmentRider(
  values: ApplicationFormValues,
  coverageId: string,
  applicant: string,
): boolean {
  const riders = values.qdImpairmentRiders;
  if (riders && typeof riders === "object" && !Array.isArray(riders)) {
    const key = `${coverageId}:${applicant}`;
    return Boolean((riders as Record<string, boolean>)[key]);
  }
  return false;
}

function formatCurrencyAmount(amount: number): string {
  return amount.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

function getDecisionMessage(opts: {
  underwritingType: CoverageUnderwritingType;
  categoryId: CoverageCategoryId;
  decisionResult: QdDecisionResult;
  amount: number;
  impairmentRider: boolean;
}): string {
  const {
    underwritingType,
    categoryId,
    decisionResult,
    amount,
    impairmentRider,
  } = opts;
  const type = underwritingType.toUpperCase();

  // Non-QD products (FUW)
  if (!QUICK_DECISION_UNDERWRITING_TYPES.has(type)) {
    return "QuickDecision processing is helping to speed some of your insurance product decisions. However it is not currently available for the product referenced above. You'll be contacted if we need further information or to share a decision on your application.";
  }

  // QD products — determine decision result message
  const isDisability = categoryId === "DI";
  const formattedAmount = formatCurrencyAmount(amount);

  let message: string;

  switch (decisionResult) {
    case "conditionally-approved":
      if (isDisability) {
        message = `Your QuickDecision application has been processed. Congratulations! Based on the information you provided and data securely reviewed, you've been conditionally approved for a monthly benefit of ${formattedAmount} in disability insurance coverage. Your group plan administrator now needs to confirm your eligibility for this product. Once that review is complete—typically within just a few days—you'll receive full details about your new coverage.`;
      } else {
        message = `Your QuickDecision application has been processed. Congratulations! Based on the information you provided and data securely reviewed, you've been conditionally approved for ${formattedAmount} in life insurance coverage. Your group plan administrator now needs to confirm your eligibility for this product. Once that review is complete—typically within just a few days—you'll receive full details about your new coverage.`;
      }
      break;

    case "referred":
      message =
        "Before we can make a decision on your application we need a bit more information. A representative from New York Life or our medical service provider will contact you with details. This may include confirming information you've provided, requesting medical records, or scheduling a medical exam and lab tests. If an exam is needed, it will be arranged at no cost to you and at a time and place that's convenient for you. To help move things along, please respond promptly to any phone calls or emails. Our team is here to answer your questions and will work to provide a decision as quickly as possible.";
      break;

    case "soft-declined":
      message =
        "Based on the health or other information you provided, along with data reviewed from secure sources, we're unable to offer coverage for this insurance product at this time. Please continue to the final page to download a copy of your completed application for your records. If you have any questions about this decision, you may contact your Plan Administrator.";
      break;

    case "database-unavailable":
      message =
        "One of the databases we use to verify information about you did not respond to our request in time. This is typically a result of scheduled maintenance. Our team will contact the vendor within the next business day to complete your application processing. If additional information is needed from you, a representative will contact you. Otherwise, you will be sent details about your coverage request once our confirmation is complete.";
      break;
  }

  // Append impairment rider text for disability products
  if (
    isDisability &&
    impairmentRider &&
    decisionResult === "conditionally-approved"
  ) {
    message +=
      "\n\nPlease note: An impairment rider(s) / Specific named exclusion(s) is applicable to your coverage. This policy will not cover any related loss to this impairment rider(s) / specific named exclusion(s). You will be provided complete details shortly under separate cover.";
  }

  return message;
}

function getDecisionStatus(opts: {
  underwritingType: CoverageUnderwritingType;
  decisionResult: QdDecisionResult;
}): {
  label: string;
  dotColor: string;
  dotBgColor: string;
} {
  const { underwritingType, decisionResult } = opts;
  const type = underwritingType.toUpperCase();

  // Non-QD products
  if (!QUICK_DECISION_UNDERWRITING_TYPES.has(type)) {
    return {
      label: "Standard underwriting",
      dotColor: "#0668ff",
      dotBgColor: "rgba(6, 104, 255, 0.18)",
    };
  }

  // QD products — status based on decision result
  switch (decisionResult) {
    case "conditionally-approved":
      return {
        label: "Conditionally approved!",
        dotColor: "#00b24b",
        dotBgColor: "rgba(0, 178, 75, 0.18)",
      };

    case "referred":
      return {
        label: "Need more information",
        dotColor: "#f5a623",
        dotBgColor: "rgba(245, 166, 35, 0.18)",
      };

    case "soft-declined":
      return {
        label: "Unable to offer coverage",
        dotColor: "#7b61a6",
        dotBgColor: "rgba(123, 97, 166, 0.18)",
      };

    case "database-unavailable":
      return {
        label: "Connection timed out",
        dotColor: "#d32f2f",
        dotBgColor: "rgba(211, 47, 47, 0.18)",
      };
  }
}

function isQuickDecisionUnderwritingType(underwritingType: string): boolean {
  return QUICK_DECISION_UNDERWRITING_TYPES.has(underwritingType.toUpperCase());
}

function buildSelectedCoverageEntries(
  values: ApplicationFormValues,
  coverages: CoverageDefinition[],
): SelectedCoverageEntry[] {
  const selectedCoverageIds = Array.isArray(values.coverageSelections)
    ? new Set(values.coverageSelections.map(String))
    : new Set<string>();

  const coverageAmounts = values.coverageAmounts;
  if (!coverageAmounts || typeof coverageAmounts !== "object") {
    return [];
  }

  const coverageById = new Map(
    coverages.map((coverage) => [coverage.id, coverage]),
  );

  return Object.entries(coverageAmounts as Record<string, unknown>)
    .flatMap(([compoundKey, rawAmount]) => {
      const amount = toPositiveAmount(rawAmount);
      if (!amount) return [];

      const [coverageId, applicant] = compoundKey.split(":");
      if (!coverageId || (applicant !== "member" && applicant !== "spouse")) {
        return [];
      }

      if (
        selectedCoverageIds.size > 0 &&
        !selectedCoverageIds.has(coverageId)
      ) {
        return [];
      }

      const coverage = coverageById.get(coverageId);
      if (!coverage) return [];

      return [
        {
          coverageId,
          applicant,
          amount,
          coverage,
        } satisfies SelectedCoverageEntry,
      ];
    })
    .sort((a, b) => a.coverage.name.localeCompare(b.coverage.name));
}

export default function Receipt() {
  const { values } = useApplicationForm();

  const client = useMemo(() => getActiveClient(), []);
  const coverages = useMemo(() => getActiveClientCoverages(), []);

  const [confirmationNumber, setConfirmationNumber] = useState("");

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    setConfirmationNumber(getOrCreateConfirmationNumber(values));
  }, [values]);

  const selectedEntries = useMemo(
    () => buildSelectedCoverageEntries(values, coverages),
    [values, coverages],
  );

  const selfEntries = selectedEntries.filter(
    (entry) => entry.applicant === "member",
  );
  const spouseApplying = isApplicantApplying("spouse", values);
  const spouseEntries = spouseApplying
    ? selectedEntries.filter((entry) => entry.applicant === "spouse")
    : [];

  const hasApplicantSelections =
    selfEntries.length > 0 || spouseEntries.length > 0;

  const shouldShowQuickDecisionDownload = selectedEntries.some((entry) =>
    isQuickDecisionUnderwritingType(entry.coverage.underwritingType),
  );

  const supportPhone = client.support.phoneDisplay || client.support.phone;
  const supportEmail = client.support.email;
  const supportHours = client.support.phoneHours;
  const hasSupportInfo = Boolean(supportPhone || supportEmail || supportHours);

  function renderApplicantProducts(
    entries: SelectedCoverageEntry[],
    applicantLabel: string,
    showApplicantHeader: boolean,
  ) {
    const orderedEntries = coverageCategories.flatMap((category) =>
      entries.filter((entry) => entry.coverage.categoryId === category.id),
    );

    if (orderedEntries.length === 0) return null;

    return (
      <Stack
        sx={{
          border: "1px solid rgba(0, 22, 57, 0.08)",
          borderRadius: 1.5,
          backgroundColor: "#fff",
          overflow: "hidden",
        }}
        divider={
          <Divider flexItem sx={{ borderColor: "rgba(0, 22, 57, 0.08)" }} />
        }
      >
        {showApplicantHeader && (
          <Box
            sx={{
              px: 2,
              py: 0.5,
              backgroundColor: "#eef0f4",
            }}
          >
            <Typography
              variant="overline"
              sx={{
                display: "block",
                fontWeight: 800,
                letterSpacing: 1.5,
                color: "#4f678d",
              }}
            >
              {applicantLabel}
            </Typography>
          </Box>
        )}

        {orderedEntries.map((entry) => {
          const decisionResult = getQdDecisionResult(
            values,
            entry.coverageId,
            entry.applicant,
          );
          const status = getDecisionStatus({
            underwritingType: entry.coverage.underwritingType,
            decisionResult,
          });
          const impairmentRider = hasImpairmentRider(
            values,
            entry.coverageId,
            entry.applicant,
          );
          const message = getDecisionMessage({
            underwritingType: entry.coverage.underwritingType,
            categoryId: entry.coverage.categoryId,
            decisionResult,
            amount: entry.amount,
            impairmentRider,
          });

          return (
            <Box
              key={`${entry.coverageId}-${entry.applicant}`}
              sx={{ px: 2, py: 1.75 }}
            >
              <Stack spacing={0.75}>
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={1}
                  justifyContent="space-between"
                  alignItems={{ xs: "flex-start", sm: "center" }}
                >
                  <Stack direction="row" spacing={0.25} alignItems="center">
                    <Typography variant="body2" fontWeight={600}>
                      {entry.coverage.name}
                    </Typography>
                    {isQuickDecisionUnderwritingType(
                      entry.coverage.underwritingType,
                    ) && <QuickDecisionIndicator />}
                  </Stack>

                  <Stack direction="row" spacing={0.75} alignItems="center">
                    <Box
                      sx={{
                        width: 10,
                        height: 10,
                        borderRadius: "50%",
                        flexShrink: 0,
                        backgroundColor: status.dotColor,
                        boxShadow: `0 0 0 4px ${status.dotBgColor}`,
                      }}
                    />
                    <Typography
                      variant="caption"
                      sx={{
                        fontWeight: 700,
                        color: status.dotColor,
                        letterSpacing: 0,
                      }}
                    >
                      {status.label}
                    </Typography>
                  </Stack>
                </Stack>

                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ whiteSpace: "pre-line" }}
                >
                  {message}
                </Typography>
              </Stack>
            </Box>
          );
        })}
      </Stack>
    );
  }

  return (
    <Stack spacing={2.5} sx={{ flex: 1, alignItems: "center", pb: 2 }}>
      <Box sx={{ width: "100%", maxWidth: 760 }}>
        <Stack spacing={2.5}>
          {/* Thank you header + confirmation number */}
          <Stack
            alignItems="center"
            spacing={1.5}
            sx={{ textAlign: "center", mt: 1 }}
          >
            <Box
              sx={{
                width: 84,
                height: 84,
                borderRadius: "50%",
                display: "grid",
                placeItems: "center",
                backgroundColor: "rgba(33, 150, 83, 0.12)",
                border: "2px solid rgba(33, 150, 83, 0.25)",
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
              <CheckCircleRoundedIcon sx={{ color: "#1E854A", fontSize: 54 }} />
            </Box>

            <Typography
              component="h1"
              sx={{
                fontWeight: 700,
                fontSize: { xs: "1.25rem", md: "1.75rem" },
                lineHeight: 1.35,
              }}
              fontWeight={700}
            >
              Your application has been submitted!
            </Typography>

            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ fontWeight: 500 }}
            >
              Confirmation number: {confirmationNumber || "-"}
            </Typography>
          </Stack>

          {/* Section: Download a copy of your application */}
          <Box
            sx={{
              border: "1px solid rgba(0, 22, 57, 0.08)",
              borderRadius: 3,
              p: { xs: 2.5, sm: 3 },
              backgroundColor: "#fff",
            }}
          >
            <Stack spacing={2}>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: "rgba(7, 104, 255, 0.1)",
                    color: "primary.main",
                  }}
                >
                  <DownloadForOfflineRoundedIcon />
                </Box>
                <Typography variant="h6" fontWeight={700}>
                  Download a copy of your application
                </Typography>
              </Stack>
              <Typography variant="body2" color="text.secondary">
                Please save a copy of your application now by using the download
                buttons below. For security purposes, a digital copy will not be
                sent via email — this is the only opportunity to download your
                records.
              </Typography>
              <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                <Button
                  variant="outlined"
                  startIcon={<FileDownloadRoundedIcon />}
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
            </Stack>
          </Box>

          {/* Section: Track your application status */}
          <Box
            sx={{
              border: "1px solid rgba(0, 22, 57, 0.08)",
              borderRadius: 3,
              p: { xs: 2.5, sm: 3 },
              backgroundColor: "#fff",
            }}
          >
            <Stack spacing={2.5}>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: "rgba(7, 104, 255, 0.1)",
                    color: "primary.main",
                  }}
                >
                  <ScheduleSendRoundedIcon />
                </Box>
                <Typography variant="h6" fontWeight={700}>
                  Track your application status
                </Typography>
              </Stack>

              <Stepper
                activeStep={1}
                orientation="vertical"
                connector={<StepConnector />}
              >
                <Step completed>
                  <StepLabel>
                    <Typography fontWeight={600}>Submit application</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Your application has been successfully submitted.
                    </Typography>
                  </StepLabel>
                </Step>

                <Step active>
                  <StepLabel>
                    <Typography fontWeight={600}>Application review</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Your application is being sent for review by the plan
                      administrator and carrier. You will be contacted if any
                      additional information is needed.
                    </Typography>
                  </StepLabel>

                  {hasApplicantSelections && (
                    <Box sx={{ mt: 2 }}>
                      {selfEntries.length > 0 &&
                        renderApplicantProducts(
                          selfEntries,
                          "Member",
                          shouldShowApplicantLabel("self", values),
                        )}

                      {spouseEntries.length > 0 &&
                        renderApplicantProducts(spouseEntries, "Spouse", true)}
                    </Box>
                  )}
                </Step>

                <Step>
                  <StepLabel>
                    <Typography fontWeight={600}>
                      Receive your certificate
                    </Typography>
                  </StepLabel>
                </Step>
              </Stepper>

              {hasSupportInfo && (
                <>
                  <Divider />
                  <Alert severity="warning" variant="filled">
                    If you have any questions about your application status,
                    please contact us
                    {supportEmail ? (
                      <>
                        {" "}
                        via email at <strong>{supportEmail}</strong>
                      </>
                    ) : null}
                    {supportEmail && supportPhone ? " or" : ""}
                    {supportPhone ? (
                      <>
                        {" "}
                        by phone at <strong>{supportPhone}</strong>
                        {supportHours ? ` (${supportHours})` : ""}
                      </>
                    ) : null}
                    .
                  </Alert>
                </>
              )}
            </Stack>
          </Box>
        </Stack>
      </Box>
    </Stack>
  );
}
