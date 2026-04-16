import { useEffect, useMemo, useState } from "react";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import {
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  Stack,
  Typography,
} from "@mui/material";
import ApplicantSection from "../components/form/ApplicantSection";
import FormSectionTitle from "../components/form/FormSectionTitle";
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

  if (underwritingType === "FUW") {
    return `${subject} has been submitted. Additional health or medical underwriting information may be needed before a final decision is made, and you may be contacted with next steps.`;
  }

  return `${subject} has been securely submitted and will be reviewed and processed by the plan administrator and carrier. You will be contacted if anything else is needed.`;
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
  ) {
    return coverageCategories
      .map((category) => {
        const categoryEntries = entries.filter(
          (entry) => entry.coverage.categoryId === category.id,
        );

        if (categoryEntries.length === 0) return null;
        return (
          <Stack spacing={1.25} key={`${applicantLabel}-${category.id}`}>
            <Box sx={{ mb: 0.5 }}>
              <FormSectionTitle icon={category.icon} label={category.label} />
            </Box>

            {categoryEntries.map((entry) => (
              <Card
                key={`${entry.coverageId}-${entry.applicant}`}
                variant="outlined"
                sx={{ borderColor: "rgba(0, 22, 57, 0.12)", boxShadow: "none" }}
              >
                <CardContent sx={{ p: 2 }}>
                  <Stack spacing={1}>
                    <Typography fontWeight={700}>
                      {entry.coverage.name}
                    </Typography>

                    <Typography variant="body2" color="text.secondary">
                      {getDecisionMessage(
                        entry.coverage.underwritingType,
                        applicantLabel,
                      )}
                    </Typography>
                  </Stack>
                </CardContent>
              </Card>
            ))}
          </Stack>
        );
      })
      .filter(Boolean);
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

            <Typography variant="h4" fontWeight={700}>
              Thank you! Your application has been submitted.
            </Typography>

            <Typography color="text.secondary" sx={{ fontWeight: 500 }}>
              Confirmation number: {confirmationNumber || "-"}
            </Typography>

            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={1}
              useFlexGap
              flexWrap="wrap"
              justifyContent="center"
            >
              <Button variant="contained">Download Application PDF</Button>
              <Button variant="outlined">Download Payment PDF</Button>
              {shouldShowQuickDecisionDownload && (
                <Button variant="outlined">Download QuickDecision PDF</Button>
              )}
            </Stack>
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
                <Typography variant="h6" fontWeight={700}>
                  Next Steps
                </Typography>

                <Typography color="text.secondary">
                  Thank you for submitting your application. Your request has
                  been securely received, and product decisions or follow-up
                  requirements will depend on the selected coverage.
                </Typography>

                <Typography color="text.secondary">
                  Please keep your confirmation number for your records. If any
                  additional information is needed to continue processing, you
                  will be contacted with the next steps.
                </Typography>

                {hasApplicantSelections && (
                  <Box>
                    <Divider sx={{ my: 1.25 }} />
                    <Stack spacing={2}>
                      <Typography variant="h6" fontWeight={700}>
                        Your Insurance Decision
                      </Typography>

                      {selfEntries.length > 0 && (
                        <ApplicantSection
                          applicant="self"
                          showLabel={shouldShowApplicantLabel(
                            "self",
                            values,
                            "receipt",
                          )}
                        >
                          <Stack spacing={2}>
                            {renderApplicantProducts(selfEntries, "Self")}
                          </Stack>
                        </ApplicantSection>
                      )}

                      {spouseEntries.length > 0 && (
                        <ApplicantSection applicant="spouse">
                          <Stack spacing={2}>
                            {renderApplicantProducts(spouseEntries, "Spouse")}
                          </Stack>
                        </ApplicantSection>
                      )}
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
