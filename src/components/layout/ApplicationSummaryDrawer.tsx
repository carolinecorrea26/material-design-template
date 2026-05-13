import { useMemo } from "react";
import CloseIcon from "@mui/icons-material/Close";
import PersonOutlineRoundedIcon from "@mui/icons-material/PersonOutlineRounded";
import {
  Box,
  Chip,
  Divider,
  Drawer,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import { useApplicationForm } from "../../state/ApplicationFormContext";
import { getActiveClientCoverages } from "../../client/getActiveClientCoverages";
import { coverageCategories } from "../../config/coverageCategories";
import type {
  CoverageApplicantId,
  CoverageCategoryId,
  CoverageDefinition,
} from "../../config/coverages/types";
import QuickDecisionIndicator from "../common/QuickDecisionIndicator";

type ApplicationSummaryDrawerProps = {
  open: boolean;
  onClose: () => void;
};

const applicantLabels: Record<CoverageApplicantId, string> = {
  member: "Member",
  spouse: "Spouse",
  child: "Child",
};

function formatUSD(value: number, decimals = 2): string {
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function estimateMonthlyPremium(
  categoryId: CoverageCategoryId,
  amount: number,
): number {
  let raw: number;
  switch (categoryId) {
    case "LI":
      raw = (amount / 1000) * 0.12;
      break;
    case "AD":
      raw = (amount / 1000) * 0.05;
      break;
    case "DI":
      raw = amount * 0.02;
      break;
    case "OO":
      raw = amount * 0.018;
      break;
    case "SH":
      raw = amount * 0.01;
      break;
    default:
      raw = 0;
  }
  return Math.round(raw * 100) / 100;
}

type ApplicantSummary = {
  applicantId: CoverageApplicantId;
  amount: number | undefined;
  riders: { name: string; amount?: number }[];
  monthlyEstimate: number | undefined;
};

type CoverageSummaryEntry = {
  coverage: CoverageDefinition;
  applicants: ApplicantSummary[];
};

function useSummaryData() {
  const { values } = useApplicationForm();
  const allCoverages = useMemo(() => getActiveClientCoverages(), []);

  return useMemo(() => {
    const selectedIds: string[] = Array.isArray(values.coverageSelections)
      ? values.coverageSelections
      : [];

    if (selectedIds.length === 0) {
      return {
        entries: [] as CoverageSummaryEntry[],
        totalMonthly: 0,
        badgeCount: 0,
      };
    }

    const selectedDependents: string[] = Array.isArray(values.dependents)
      ? values.dependents
      : [];

    const productApplicants: Record<string, CoverageApplicantId[]> =
      values.productApplicants != null &&
      typeof values.productApplicants === "object" &&
      !Array.isArray(values.productApplicants)
        ? (values.productApplicants as Record<string, CoverageApplicantId[]>)
        : {};

    const amounts: Record<string, number> =
      values.coverageAmounts != null &&
      typeof values.coverageAmounts === "object" &&
      !Array.isArray(values.coverageAmounts)
        ? (values.coverageAmounts as Record<string, number>)
        : {};

    const riders: Record<string, boolean> =
      values.coverageRiders != null &&
      typeof values.coverageRiders === "object" &&
      !Array.isArray(values.coverageRiders)
        ? (values.coverageRiders as Record<string, boolean>)
        : {};

    const riderAmounts: Record<string, number> =
      values.coverageRiderAmounts != null &&
      typeof values.coverageRiderAmounts === "object" &&
      !Array.isArray(values.coverageRiderAmounts)
        ? (values.coverageRiderAmounts as Record<string, number>)
        : {};

    const coverageMap = new Map(allCoverages.map((c) => [c.id, c]));

    let totalMonthly = 0;
    let badgeCount = 0;
    const entries: CoverageSummaryEntry[] = [];

    for (const covId of selectedIds) {
      const coverage = coverageMap.get(covId);
      if (!coverage) continue;

      // Determine visible applicants for this coverage
      let visibleApplicants: CoverageApplicantId[];

      if (Object.prototype.hasOwnProperty.call(productApplicants, covId)) {
        const selected = Array.isArray(productApplicants[covId])
          ? productApplicants[covId]
          : [];
        visibleApplicants = coverage.applicants.filter((a) =>
          selected.includes(a),
        );
      } else if (selectedDependents.length > 0) {
        visibleApplicants = coverage.applicants.filter((a) => {
          if (a === "member") return true;
          return selectedDependents.includes(a);
        });
      } else {
        // Member-only mode
        visibleApplicants = coverage.applicants.includes("member")
          ? ["member"]
          : [];
      }

      if (visibleApplicants.length === 0) continue;

      badgeCount += visibleApplicants.length;

      const applicantSummaries: ApplicantSummary[] = visibleApplicants.map(
        (applicantId) => {
          const amountKey = `${covId}:${applicantId}`;
          const amount = amounts[amountKey];

          // Collect selected riders for this applicant
          const selectedRiders: { name: string; amount?: number }[] = [];
          if (coverage.riders) {
            for (const rider of coverage.riders) {
              const riderKey = `${covId}:${rider.id}:${applicantId}`;
              if (riders[riderKey]) {
                const riderAmount = rider.hasAmount
                  ? riderAmounts[riderKey]
                  : undefined;
                selectedRiders.push({ name: rider.name, amount: riderAmount });
              }
            }
          }

          // Estimate monthly premium
          let monthlyEstimate: number | undefined;
          if (amount != null && amount > 0) {
            let base = estimateMonthlyPremium(coverage.categoryId, amount);

            // Add rider premium factors
            if (coverage.riders) {
              for (const rider of coverage.riders) {
                const riderKey = `${covId}:${rider.id}:${applicantId}`;
                if (riders[riderKey]) {
                  base += base * rider.premiumFactor;
                }
              }
            }

            monthlyEstimate = base;
            totalMonthly += base;
          }

          return {
            applicantId,
            amount,
            riders: selectedRiders,
            monthlyEstimate,
          };
        },
      );

      entries.push({ coverage, applicants: applicantSummaries });
    }

    return {
      entries,
      totalMonthly: Math.round(totalMonthly * 100) / 100,
      badgeCount,
    };
  }, [values, allCoverages]);
}

/** Returns the badge count for the summary icon. */
export function useApplicationSummaryBadge(): number {
  return useSummaryData().badgeCount;
}

export default function ApplicationSummaryDrawer({
  open,
  onClose,
}: ApplicationSummaryDrawerProps) {
  const { entries, totalMonthly } = useSummaryData();
  const isEmpty = entries.length === 0;

  const categoryLabel = useMemo(() => {
    const map = new Map(coverageCategories.map((c) => [c.id, c.label]));
    return (id: CoverageCategoryId) => map.get(id) ?? id;
  }, []);

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      sx={{
        "& .MuiDrawer-paper": {
          width: { xs: "100%", sm: 420 },
          maxWidth: "100%",
          p: 2,
        },
      }}
    >
      <Stack spacing={2} sx={{ height: "100%" }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 1,
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Application Summary
          </Typography>
          <IconButton aria-label="Close application summary" onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>

        {isEmpty ? (
          <Box
            sx={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              px: 4,
            }}
          >
            <Stack spacing={1} alignItems="center">
              <PersonOutlineRoundedIcon
                sx={{ fontSize: 48, color: "text.disabled" }}
              />
              <Typography variant="body1" sx={{ color: "text.secondary" }}>
                No coverage selected yet.
              </Typography>
              <Typography variant="body2" sx={{ color: "text.disabled" }}>
                Your application summary will appear here once you select
                coverage.
              </Typography>
            </Stack>
          </Box>
        ) : (
          <Box sx={{ flex: 1, overflowY: "auto" }}>
            <Stack spacing={2}>
              {entries.map(({ coverage, applicants }) => (
                <Box
                  key={coverage.id}
                  sx={{
                    p: 2,
                    borderRadius: 1,
                    bgcolor: "grey.100",
                  }}
                >
                  <Stack spacing={1.5}>
                    <Box>
                      <Typography
                        variant="subtitle1"
                        sx={{ fontWeight: 600, lineHeight: 1.3 }}
                      >
                        {coverage.name}
                        {coverage.underwritingType === "QD" && (
                          <QuickDecisionIndicator />
                        )}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{ color: "text.secondary" }}
                      >
                        {categoryLabel(coverage.categoryId)}
                      </Typography>
                    </Box>

                    {applicants.map(
                      ({
                        applicantId,
                        amount,
                        riders: selectedRiders,
                        monthlyEstimate,
                      }) => (
                        <Box key={applicantId}>
                          <Stack spacing={0.5}>
                            <Typography
                              variant="body2"
                              sx={{ fontWeight: 600 }}
                            >
                              {applicantLabels[applicantId]}
                            </Typography>

                            {amount != null && amount > 0 && (
                              <Typography
                                variant="body2"
                                sx={{ color: "text.secondary" }}
                              >
                                Coverage amount: {formatUSD(amount, 0)}
                              </Typography>
                            )}

                            {selectedRiders.length > 0 && (
                              <Box
                                sx={{
                                  display: "flex",
                                  flexWrap: "wrap",
                                  gap: 0.5,
                                }}
                              >
                                {selectedRiders.map((rider) => (
                                  <Chip
                                    key={rider.name}
                                    label={
                                      rider.amount != null
                                        ? `${rider.name}: ${formatUSD(rider.amount, 0)}`
                                        : rider.name
                                    }
                                    size="small"
                                    variant="outlined"
                                  />
                                ))}
                              </Box>
                            )}

                            {monthlyEstimate != null && (
                              <Typography
                                variant="body2"
                                sx={{ color: "text.secondary" }}
                              >
                                Est. monthly: {formatUSD(monthlyEstimate)}
                              </Typography>
                            )}
                          </Stack>
                        </Box>
                      ),
                    )}
                  </Stack>
                </Box>
              ))}

              {totalMonthly > 0 && (
                <>
                  <Divider />
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: 1,
                      bgcolor: "primary.50",
                      border: "1px solid",
                      borderColor: "primary.200",
                    }}
                  >
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                    >
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        Estimated Monthly Total
                      </Typography>
                      <Typography
                        variant="subtitle1"
                        sx={{ fontWeight: 700, color: "primary.main" }}
                      >
                        {formatUSD(totalMonthly)}
                      </Typography>
                    </Stack>
                  </Box>
                </>
              )}
            </Stack>
          </Box>
        )}
      </Stack>
    </Drawer>
  );
}
