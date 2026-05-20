import { useEffect, useMemo, useState } from "react";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import FileDownloadRoundedIcon from "@mui/icons-material/FileDownloadRounded";
import {
  Alert,
  Box,
  Button,
  Divider,
  Link,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
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
  CoverageUnderwritingType,
} from "../config/coverages/types";
import {
  useApplicationForm,
  type ApplicationFormValues,
} from "../state/ApplicationFormContext";
import { sendReceiptMockEmail } from "../utils/mockEmail";

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

function getDecisionStatus(opts: {
  underwritingType: CoverageUnderwritingType;
  decisionResult: QdDecisionResult;
}): {
  label: string;
  color: string;
} {
  const { underwritingType, decisionResult } = opts;
  const type = underwritingType.toUpperCase();

  if (!QUICK_DECISION_UNDERWRITING_TYPES.has(type)) {
    return {
      label: "Sent for review",
      color: "#0668ff",
    };
  }

  switch (decisionResult) {
    case "conditionally-approved":
      return {
        label: "Conditionally approved",
        color: "#00a344",
      };

    case "referred":
      return {
        label: "Needs review",
        color: "#b26a00",
      };

    case "soft-declined":
      return {
        label: "Unable to offer coverage",
        color: "#7b61a6",
      };

    case "database-unavailable":
      return {
        label: "Review pending",
        color: "#d32f2f",
      };
  }
}

function isQuickDecisionUnderwritingType(underwritingType: string): boolean {
  return QUICK_DECISION_UNDERWRITING_TYPES.has(underwritingType.toUpperCase());
}

function getTelHref(phone: string): string {
  return phone.replace(/\D/g, "");
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

  const spouseApplying = isApplicantApplying("spouse", values);
  const shouldShowMemberLabel =
    spouseApplying || shouldShowApplicantLabel("self", values);

  const orderedDecisionEntries = useMemo(
    () =>
      coverageCategories.flatMap((category) =>
        selectedEntries.filter(
          (entry) => entry.coverage.categoryId === category.id,
        ),
      ),
    [selectedEntries],
  );

  const hasApplicantSelections = orderedDecisionEntries.length > 0;

  const shouldShowQuickDecisionDownload = selectedEntries.some((entry) =>
    isQuickDecisionUnderwritingType(entry.coverage.underwritingType),
  );

  const supportPhone = client.support.phoneDisplay || client.support.phone;
  const supportEmail = client.support.email;
  const supportHours = client.support.phoneHours;
  const hasSupportInfo = Boolean(supportPhone || supportEmail || supportHours);

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

            <Typography
              component="h1"
              sx={{
                fontWeight: 700,
                fontSize: { xs: "1.25rem", md: "1.75rem" },
                lineHeight: 1.35,
              }}
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

          <Box
            sx={{
              border: "1px solid rgba(0, 22, 57, 0.08)",
              borderRadius: 3,
              p: { xs: 2.5, sm: 3 },
              backgroundColor: "#fff",
            }}
          >
            <Stack spacing={2.5}>
              <Stack spacing={0.75}>
                <Typography variant="h6" fontWeight={700}>
                  Decision status
                </Typography>

                {hasApplicantSelections ? (
                  <TableContainer
                    sx={{
                      border: "1px solid rgba(0, 22, 57, 0.08)",
                      borderRadius: 2,
                      overflow: "hidden",
                    }}
                  >
                    <Table size="small" aria-label="Decision status table">
                      <TableHead>
                        <TableRow
                          sx={{
                            backgroundColor: "#f6f8fb",
                            "& th": {
                              color: "#4f678d",
                              fontWeight: 800,
                              fontSize: "0.75rem",
                              letterSpacing: 0.6,
                              textTransform: "uppercase",
                            },
                          }}
                        >
                          <TableCell>Coverage</TableCell>
                          <TableCell>Status</TableCell>
                        </TableRow>
                      </TableHead>

                      <TableBody>
                        {orderedDecisionEntries.map((entry) => {
                          const decisionResult = getQdDecisionResult(
                            values,
                            entry.coverageId,
                            entry.applicant,
                          );

                          const status = getDecisionStatus({
                            underwritingType: entry.coverage.underwritingType,
                            decisionResult,
                          });

                          const applicantLabel =
                            entry.applicant === "member" ? "Member" : "Spouse";

                          const shouldShowApplicant =
                            entry.applicant === "spouse" ||
                            shouldShowMemberLabel;

                          return (
                            <TableRow
                              key={`${entry.coverageId}-${entry.applicant}`}
                              sx={{
                                "&:last-child td": {
                                  borderBottom: 0,
                                },
                              }}
                            >
                              <TableCell>
                                <Stack spacing={0.35}>
                                  <Stack
                                    direction="row"
                                    spacing={0.25}
                                    alignItems="center"
                                  >
                                    <Typography
                                      variant="body2"
                                      fontWeight={600}
                                    >
                                      {entry.coverage.name}
                                    </Typography>

                                    {isQuickDecisionUnderwritingType(
                                      entry.coverage.underwritingType,
                                    ) && <QuickDecisionIndicator />}
                                  </Stack>

                                  {shouldShowApplicant && (
                                    <Typography
                                      variant="caption"
                                      color="text.secondary"
                                      sx={{ fontWeight: 600 }}
                                    >
                                      {applicantLabel}
                                    </Typography>
                                  )}
                                </Stack>
                              </TableCell>

                              <TableCell>
                                <Typography
                                  variant="body2"
                                  sx={{
                                    fontWeight: 700,
                                    color: status.color,
                                  }}
                                >
                                  {status.label}
                                </Typography>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Alert severity="info" variant="outlined">
                    No selected coverage details are available for this
                    application.
                  </Alert>
                )}
              </Stack>

              <Divider />

              <Stack spacing={1.5}>
                <Typography variant="h6" fontWeight={700}>
                  Next steps
                </Typography>

                <Typography variant="body2" color="text.secondary">
                  Your application is being sent for review by the plan
                  administrator and carrier. You will be contacted if any
                  additional information is needed.
                </Typography>

                <Typography variant="body2" color="text.secondary">
                  Please save a copy of your application now by using the
                  download buttons below. For security purposes, a digital copy
                  will not be sent via email — this is the only opportunity to
                  download your records.
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

              {hasSupportInfo && (
                <>
                  <Divider />

                  <Box
                    sx={{
                      backgroundColor: "#eef5ff",
                      border: "1px solid #006fff",
                      borderRadius: 2,
                      p: { xs: 2.25, sm: 2.75 },
                      color: "#12233d",
                    }}
                  >
                    <Stack spacing={1.5}>
                      <Typography
                        sx={{
                          color: "#071b3a",
                          fontSize: "1.125rem",
                          lineHeight: 1.25,
                          fontWeight: 700,
                        }}
                      >
                        Questions? We&rsquo;re here to help.
                      </Typography>

                      <Typography
                        sx={{
                          color: "#12233d",
                          fontSize: "1rem",
                          lineHeight: 1.45,
                          fontWeight: 400,
                        }}
                      >
                        {client.branding.name} Insurance Administrator
                      </Typography>

                      {supportPhone && (
                        <Typography
                          sx={{
                            color: "#12233d",
                            fontSize: "1rem",
                            lineHeight: 1.45,
                            fontWeight: 700,
                          }}
                        >
                          Call:{" "}
                          <Link
                            href={`tel:${getTelHref(supportPhone)}`}
                            underline="none"
                            sx={{
                              color: "#006fff",
                              fontWeight: 700,
                            }}
                          >
                            {supportPhone}
                          </Link>
                          {supportHours ? (
                            <Box component="span" sx={{ fontWeight: 400 }}>
                              {" "}
                              ({supportHours})
                            </Box>
                          ) : null}
                        </Typography>
                      )}

                      {supportEmail && (
                        <Typography
                          sx={{
                            color: "#12233d",
                            fontSize: "1rem",
                            lineHeight: 1.45,
                            fontWeight: 700,
                          }}
                        >
                          Email:{" "}
                          <Link
                            href={`mailto:${supportEmail}`}
                            underline="none"
                            sx={{
                              color: "#006fff",
                              fontWeight: 700,
                            }}
                          >
                            {supportEmail}
                          </Link>
                        </Typography>
                      )}
                    </Stack>
                  </Box>
                </>
              )}
            </Stack>
          </Box>
        </Stack>
      </Box>
    </Stack>
  );
}
