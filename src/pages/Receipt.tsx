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
  Typography,
} from "@mui/material";
import { getActiveClient } from "../client/getActiveClient";
import { getActiveClientCoverages } from "../client/getActiveClientCoverages";
import { coverageCategories } from "../config/coverageCategories";
import type {
  CoverageApplicantId,
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

type SelectedCoverageEntry = {
  coverageId: string;
  applicant: CoverageApplicantId;
  coverage: CoverageDefinition;
};

type DecisionStatus = {
  label: string;
  color: string;
  description: string;
};

const APPLICANT_LABELS: Record<CoverageApplicantId, string> = {
  member: "Member",
  spouse: "Spouse",
  child: "Child",
};

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
      label: "Sent for review",
      color: "#0668ff",
      description:
        "QuickDecision is not currently available for this product. Your application will continue through the standard review process, and you’ll be contacted if additional information is needed or when a decision is available.",
    };
  }

  switch (decisionResult) {
    case "conditionally-approved":
      return {
        label: "Approved",
        color: "#00a344",
        description:
          "Congratulations! Your application has been conditionally approved. Once your group plan administrator confirms your eligibility, you’ll receive details about your new coverage.",
      };

    case "referred":
      return {
        label: "Sent for review",
        color: "#0668ff",
        description:
          "We need a bit more information before we can make a decision. Your application will continue through the standard review process, and you’ll be contacted if additional information is needed or when a decision is available.",
      };

    case "soft-declined":
      return {
        label: "Unable to offer",
        // color: "#ab0b0b",
        // color: "#55575b",
        color: "#213967",
        description:
          "Based on the information provided and the data securely reviewed, we’re unable to offer this coverage through QuickDecision at this time. Your application will still be reviewed by the plan administrator and carrier, and you’ll be contacted if additional information is needed.",
      };

    case "database-unavailable":
      return {
        label: "Sent for review",
        color: "#0668ff",
        description:
          "We couldn’t complete QuickDecision processing for this coverage in real time. Your application will continue through the standard review process, and you’ll be contacted if additional information is needed or when a decision is available.",
      };
  }
}

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
            sx={
              {
                // border: "1px solid rgba(0, 22, 57, 0.08)",
                // borderRadius: 3,
                // p: { xs: 2.5, sm: 3 },
                // backgroundColor: "#fff",
              }
            }
          >
            <Stack spacing={2.5}>
              <Stack spacing={1.5}>
                <Typography variant="h6" fontWeight={700}>
                  Your application status
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Below is your decision for your request for coverage based on
                  the information you provided and the data we securely
                  reviewed. If you have multiple coverage selections, some may
                  be conditionally approved while others are sent for review.
                </Typography>

                {hasApplicantSelections ? (
                  <Box
                    sx={{
                      border: "1px solid rgba(0, 22, 57, 0.08)",
                      borderRadius: 2,
                      overflow: "hidden",
                    }}
                  >
                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns: {
                          xs: "1fr",
                          sm: "minmax(0, 1fr) minmax(260px, 1.15fr)",
                        },
                        columnGap: 2,
                        px: { xs: 1.5, sm: 2 },
                        py: 1,
                        backgroundColor: "#f6f8fb",
                        borderBottom: "1px solid rgba(0, 22, 57, 0.08)",
                      }}
                    >
                      <Typography
                        variant="body2"
                        sx={{
                          color: "#4f678d",
                          fontWeight: 800,
                          fontSize: "0.75rem",
                          letterSpacing: 0.6,
                          textTransform: "uppercase",
                        }}
                      >
                        Coverage
                      </Typography>

                      <Typography
                        variant="body2"
                        sx={{
                          color: "#4f678d",
                          fontWeight: 800,
                          fontSize: "0.75rem",
                          letterSpacing: 0.6,
                          textTransform: "uppercase",
                          display: { xs: "none", sm: "block" },
                        }}
                      >
                        Status
                      </Typography>
                    </Box>

                    <Stack
                      spacing={0}
                      divider={
                        <Divider
                          sx={{ borderColor: "rgba(0, 22, 57, 0.08)" }}
                        />
                      }
                    >
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

                        const applicantLabel =
                          APPLICANT_LABELS[entry.applicant];

                        const coverageAmountRequested =
                          getCoverageAmountRequested(
                            values,
                            entry.coverageId,
                            entry.applicant,
                          );

                        return (
                          <Box
                            key={`${entry.coverageId}-${entry.applicant}`}
                            sx={{
                              display: "grid",
                              gridTemplateColumns: {
                                xs: "1fr",
                                sm: "minmax(0, 1fr) minmax(260px, 1.15fr)",
                              },
                              columnGap: 2,
                              rowGap: 1,
                              px: { xs: 1.5, sm: 2 },
                              py: 1.75,
                              backgroundColor: "#fff",
                            }}
                          >
                            <Stack spacing={0.35}>
                              <Typography
                                variant="body2"
                                sx={{
                                  fontWeight: 700,
                                  color: "text.primary",
                                }}
                              >
                                {entry.coverage.name} ({applicantLabel})
                              </Typography>

                              {coverageAmountRequested ? (
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                  sx={{ fontWeight: 600 }}
                                >
                                  Requested:{" "}
                                  {formatCurrencyAmount(
                                    coverageAmountRequested,
                                  )}
                                </Typography>
                              ) : null}
                            </Stack>

                            <Stack spacing={0.75} alignItems="flex-start">
                              <Stack
                                direction="row"
                                spacing={0.75}
                                alignItems="center"
                              >
                                <Box
                                  aria-hidden="true"
                                  sx={{
                                    width: 10,
                                    height: 10,
                                    borderRadius: "50%",
                                    backgroundColor: status.color,
                                    boxShadow: `0 0 0 3px ${status.color}22`,
                                    flexShrink: 0,
                                  }}
                                />

                                <Typography
                                  variant="body2"
                                  sx={{
                                    fontWeight: 800,
                                    color: status.color,
                                  }}
                                >
                                  {status.label}
                                </Typography>
                              </Stack>

                              <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{ lineHeight: 1.45 }}
                              >
                                {status.description}
                              </Typography>
                            </Stack>
                          </Box>
                        );
                      })}
                    </Stack>
                  </Box>
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
