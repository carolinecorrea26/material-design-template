import { useEffect, useMemo, useState } from "react";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import {
  // Alert,
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  Stack,
  Typography,
} from "@mui/material";
import FileDownloadRoundedIcon from "@mui/icons-material/FileDownloadRounded";
import { shouldShowApplicantLabel } from "../components/form/applicantVisibility";
import { getActiveClient } from "../client/getActiveClient";
import { getActiveClientCoverages } from "../client/getActiveClientCoverages";
import { coverageCategories } from "../config/coverageCategories";
import type {
  CoverageDefinition,
  CoverageUnderwritingType,
} from "../config/coverages/types";
import {
  useApplicationForm,
  type ApplicationFormValues,
} from "../state/ApplicationFormContext";

const RECEIPT_CONFIRMATION_KEY = "receiptConfirmationNumber";
const QUICK_DECISION_UNDERWRITING_TYPES = new Set(["SI", "GI", "NA", "QD"]);

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

function getDecisionMessage(
  underwritingType: CoverageUnderwritingType,
  applicantLabel?: string,
): string {
  const subject = applicantLabel
    ? `${applicantLabel}'s request`
    : "Your request";

  const type = underwritingType.toUpperCase();

  if (QUICK_DECISION_UNDERWRITING_TYPES.has(type)) {
    return `${subject} has been approved. Your coverage selection has been confirmed and will be processed.`;
  }

  if (type === "FUW") {
    return `${subject} has been submitted. Additional health or medical underwriting information may be needed before a final decision is made, and you may be contacted with next steps.`;
  }

  return `${subject} has been securely submitted and will be reviewed and processed by the plan administrator and carrier. You will be contacted if anything else is needed.`;
}

function getDecisionStatus(underwritingType: CoverageUnderwritingType): {
  label: string;
  dotColor: string;
  dotBgColor: string;
} {
  const type = underwritingType.toUpperCase();

  if (QUICK_DECISION_UNDERWRITING_TYPES.has(type)) {
    return {
      label: "Approved",
      dotColor: "#00b24b",
      dotBgColor: "rgba(0, 178, 75, 0.18)",
    };
  }

  if (type === "FUW") {
    return {
      label: "Additional review may be needed",
      dotColor: "#0668ff",
      dotBgColor: "rgba(6, 104, 255, 0.18)",
    };
  }

  return {
    label: "Submitted",
    dotColor: "#1E854A",
    dotBgColor: "rgba(33, 150, 83, 0.14)",
  };
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
  const spouseEntries = selectedEntries.filter(
    (entry) => entry.applicant === "spouse",
  );

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
              backgroundColor: "#d9dde7",
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
          const status = getDecisionStatus(entry.coverage.underwritingType);

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
                  <Stack
                    direction="row"
                    spacing={1}
                    alignItems="center"
                    sx={{ minWidth: 0 }}
                  >
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
                    <Typography fontWeight={700}>
                      {entry.coverage.name}
                    </Typography>
                  </Stack>

                  <Typography
                    variant="caption"
                    sx={{
                      fontWeight: 700,
                      color: status.dotColor,
                      letterSpacing: 0.2,
                    }}
                  >
                    {status.label}
                  </Typography>
                </Stack>

                <Typography variant="body2" color="text.secondary">
                  {getDecisionMessage(
                    entry.coverage.underwritingType,
                    applicantLabel,
                  )}
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

            <Typography variant="h2" fontWeight={700}>
              Your application has been submitted!
            </Typography>

            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={1}
              useFlexGap
              flexWrap="wrap"
              justifyContent="center"
            >
              <Button
                variant="contained"
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
                  Download QuickDecision
                </Button>
              )}
            </Stack>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ fontWeight: 500 }}
            >
              Confirmation number: {confirmationNumber || "-"}
            </Typography>
          </Stack>

          <Card
            sx={{
              backgroundColor: "#f5f6fa",
              boxShadow: "none",
              borderRadius: 1.5,
            }}
          >
            <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
              <Stack spacing={1.25}>
                {hasApplicantSelections && (
                  <Box>
                    <Stack spacing={2} sx={{ mt: 2 }}>
                      <Box sx={{ px: 1.5, pb: 2 }}>
                        <Stack spacing={2}>
                          <Typography variant="h4" fontWeight={700}>
                            Here's what to expect next.
                          </Typography>
                          <Typography variant="body1">
                            Your application request has been securely received.{" "}
                            <strong>
                              For your records, please save a copy of your
                              application by clicking the download buttons.{" "}
                            </strong>
                            A digital copy cannot be emailed for security
                            reasons.
                          </Typography>
                          {/* <Typography variant="h5" fontWeight={700} color="primary.main">
                            Your application decision:
                          </Typography> */}
                          <Typography variant="body1">
                            Details about the decision on the coverage you
                            applied for and next steps are listed below.
                          </Typography>
                        </Stack>
                      </Box>

                      {selfEntries.length > 0 &&
                        renderApplicantProducts(
                          selfEntries,
                          "MEMBER",
                          shouldShowApplicantLabel("self", values, "receipt"),
                        )}

                      {spouseEntries.length > 0 &&
                        renderApplicantProducts(spouseEntries, "SPOUSE", true)}
                    </Stack>
                  </Box>
                )}

                {hasSupportInfo && (
                  <Box>
                    <Divider sx={{ my: 1.25 }} />
                    <Stack spacing={0.5}>
                      <Typography variant="subtitle2" fontWeight={700}>
                        Need help?
                      </Typography>
                      {supportPhone && (
                        <Typography variant="body2" color="text.secondary">
                          Phone: {supportPhone}
                          {supportHours ? ` (${supportHours})` : ""}
                        </Typography>
                      )}
                      {supportEmail && (
                        <Typography variant="body2" color="text.secondary">
                          Email: {supportEmail}
                        </Typography>
                      )}
                    </Stack>
                  </Box>
                )}
              </Stack>
            </CardContent>
          </Card>

          {hasSupportInfo && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ textAlign: "center" }}
            >
              {client.branding.name} support is available to help with your
              submission and next steps.
            </Typography>
          )}
        </Stack>
      </Box>
    </Stack>
  );
}
