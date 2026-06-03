import { useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import CloseIcon from "@mui/icons-material/Close";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import ShoppingCartOutlinedIcon from "@mui/icons-material/ShoppingCartOutlined";
import TaskAltIcon from "@mui/icons-material/TaskAlt";
import AdminPanelSettingsRoundedIcon from "@mui/icons-material/AdminPanelSettingsRounded";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  Drawer,
  IconButton,
  Stack,
  SwipeableDrawer,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { useApplicationForm } from "../../state/ApplicationFormContext";
import { getActiveClientCoverages } from "../../client/getActiveClientCoverages";
import { coverageCategories } from "../../config/coverageCategories";
import type {
  CoverageApplicantId,
  CoverageDefinition,
} from "../../config/coverages/types";
import QuickDecisionIndicator from "../common/QuickDecisionIndicator";
import { formatUSD } from "../../utils/formatUSD";
import { estimateMonthlyPremium } from "../../utils/estimateMonthlyPremium";
import { formFlow } from "../../config/formFlow";
import { pages } from "../../config/pages";
import type { PageId } from "../../types/page";

type ApplicationSummaryDrawerProps = {
  open: boolean;
  onClose: () => void;
  source?: "cart-icon" | "coverage-page";
};

const applicantLabels: Record<CoverageApplicantId, string> = {
  member: "Member",
  spouse: "Spouse",
  child: "Child",
};

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
  source = "cart-icon",
}: ApplicationSummaryDrawerProps) {
  const { entries, totalMonthly } = useSummaryData();
  const { values, setPageValues } = useApplicationForm();
  const navigate = useNavigate();
  const location = useLocation();
  const isEmpty = entries.length === 0;
  const theme = useTheme();
  const isSmall = useMediaQuery(theme.breakpoints.down("sm"));
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);

  function handleRemoveCoverage(coverageId: string) {
    const currentSelections: string[] = Array.isArray(values.coverageSelections)
      ? values.coverageSelections
      : [];
    const nextSelections = currentSelections.filter((id) => id !== coverageId);

    const currentProductApplicants: Record<string, unknown> =
      values.productApplicants != null &&
      typeof values.productApplicants === "object" &&
      !Array.isArray(values.productApplicants)
        ? (values.productApplicants as Record<string, unknown>)
        : {};
    const { [coverageId]: _, ...nextProductApplicants } =
      currentProductApplicants;

    setPageValues({
      coverageSelections: nextSelections,
      productApplicants: nextProductApplicants as Record<string, string[]>,
    });
    setConfirmRemoveId(null);

    if (nextSelections.length === 0) {
      const coverageIndex = formFlow.indexOf("coverage");
      const currentPath = location.pathname.replace(/\/$/, "");
      const currentPage = pages.find((p) => p.path === currentPath);
      const currentPageId = currentPage?.id as PageId | undefined;
      const currentIndex = currentPageId ? formFlow.indexOf(currentPageId) : -1;

      if (currentIndex > coverageIndex) {
        onClose();
        navigate("/coverage");
      }
    }
  }

  // Check for ineligibility warnings
  const ineligibleProducts: string[] = [];
  if (entries.length > 1) {
    const hoursWorked = Number(values["hours-worked-per-week"]);
    const monthlyIncome = Number(values["average-monthly-income"]);
    const hasDisability = entries.some((e) => e.coverage.categoryId === "DI");
    const hasOO = entries.some((e) => e.coverage.categoryId === "OO");

    if (hasDisability && hoursWorked > 0 && hoursWorked < 20) {
      ineligibleProducts.push("Disability");
    }
    if (hasDisability && monthlyIncome > 0 && monthlyIncome < 500) {
      if (!ineligibleProducts.includes("Disability"))
        ineligibleProducts.push("Disability");
    }
    if (hasOO) {
      const expenses = Number(values["monthly-business-expenses"]);
      if (expenses === 0 && values["monthly-business-expenses"] != null) {
        ineligibleProducts.push("Office Overhead");
      }
    }
  }

  // Group entries by category in standard order
  const groupedByCategory = useMemo(() => {
    const groups: {
      category: (typeof coverageCategories)[number];
      items: CoverageSummaryEntry[];
    }[] = [];

    for (const cat of coverageCategories) {
      const items = entries.filter((e) => e.coverage.categoryId === cat.id);
      if (items.length > 0) {
        groups.push({ category: cat, items });
      }
    }
    return groups;
  }, [entries]);

  const drawerContent = (
    <Stack spacing={2} sx={{ height: "100%", p: 2 }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 1,
        }}
      >
        <Stack direction="row" spacing={1} alignItems="center">
          {source === "coverage-page" ? (
            <>
              {isEmpty ? (
                <ShoppingCartOutlinedIcon sx={{ color: "primary.main" }} />
              ) : (
                <TaskAltIcon sx={{ color: "success.main" }} />
              )}
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 600,
                  color: isEmpty ? "text.primary" : "success.main",
                }}
              >
                Coverage added
              </Typography>
            </>
          ) : (
            <>
              <ShoppingCartOutlinedIcon sx={{ color: "primary.main" }} />
              <Typography
                variant="h6"
                sx={{ fontWeight: 600, color: "text.primary" }}
              >
                Your requested coverage
              </Typography>
            </>
          )}
        </Stack>
        <IconButton aria-label="Close coverage requested" onClick={onClose}>
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
            <AdminPanelSettingsRoundedIcon
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
            {/* Single outlined box for all coverages */}
            <Box
              sx={{
                bgcolor: "white",
                border: "1px solid #e6e6e6",
                borderRadius: 2,
                overflow: "hidden",
              }}
            >
              {groupedByCategory.map(({ category, items }, groupIdx) => {
                let globalItemIndex = 0;
                for (let i = 0; i < groupIdx; i++) {
                  globalItemIndex += groupedByCategory[i].items.length;
                }
                return (
                  <Box key={category.id}>
                    {/* Coverage items in this category */}
                    {items.map(({ coverage, applicants }, itemIdx) => {
                      const currentGlobalIdx = globalItemIndex + itemIdx;
                      const isMemberOnly =
                        applicants.length === 1 &&
                        applicants[0].applicantId === "member";

                      return (
                        <Box key={coverage.id}>
                          {currentGlobalIdx > 0 && (
                            <Divider sx={{ borderColor: "#e6e6e6" }} />
                          )}
                          <Box sx={{ px: 2, pb: 2, pt: 1.5 }}>
                            <Stack spacing={1}>
                              <Stack
                                direction="row"
                                justifyContent="space-between"
                                alignItems="flex-start"
                              >
                                <Typography
                                  variant="body2"
                                  sx={{ fontWeight: 600, fontSize: "1rem" }}
                                >
                                  {coverage.name}
                                  {coverage.underwritingType === "QD" && (
                                    <QuickDecisionIndicator />
                                  )}
                                </Typography>
                                <Stack
                                  direction="row"
                                  alignItems="center"
                                  spacing={0.5}
                                >
                                  {(() => {
                                    const productTotal = applicants.reduce(
                                      (s, a) => s + (a.monthlyEstimate ?? 0),
                                      0,
                                    );
                                    return productTotal > 0 ? (
                                      <Typography
                                        variant="body2"
                                        sx={{
                                          fontWeight: 700,
                                          whiteSpace: "nowrap",
                                        }}
                                      >
                                        {formatUSD(productTotal)}/mo
                                      </Typography>
                                    ) : null;
                                  })()}
                                  <IconButton
                                    size="small"
                                    aria-label={`Remove ${coverage.name}`}
                                    onClick={() =>
                                      setConfirmRemoveId(coverage.id)
                                    }
                                    sx={{
                                      color: "text.secondary",
                                      "&:hover": { color: "error.main" },
                                    }}
                                  >
                                    <DeleteOutlineIcon
                                      sx={{ fontSize: "1.1rem" }}
                                    />
                                  </IconButton>
                                </Stack>
                              </Stack>

                              {applicants.map(
                                ({
                                  applicantId,
                                  amount,
                                  riders: selectedRiders,
                                  monthlyEstimate,
                                }) => {
                                  const hasSelectedAmount =
                                    amount != null && amount > 0;

                                  return (
                                    <Box key={applicantId} sx={{ pl: 1 }}>
                                      <Stack spacing={0.5}>
                                        {!isMemberOnly && (
                                          <Typography
                                            variant="body2"
                                            sx={{
                                              fontWeight: 600,
                                              fontSize: "0.8rem",
                                            }}
                                          >
                                            {applicantLabels[applicantId]}
                                          </Typography>
                                        )}

                                        {hasSelectedAmount ? (
                                          <>
                                            <Typography
                                              variant="body2"
                                              sx={{
                                                color: "text.secondary",
                                                fontSize: "0.8rem",
                                              }}
                                            >
                                              Requested: {formatUSD(amount, 0)}
                                            </Typography>

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
                                                sx={{
                                                  color: "text.secondary",
                                                  fontSize: "0.8rem",
                                                }}
                                              >
                                                Est. cost<sup>1</sup>:{" "}
                                                {formatUSD(monthlyEstimate)}
                                              </Typography>
                                            )}
                                          </>
                                        ) : (
                                          <Box
                                            sx={{
                                              display: "flex",
                                              alignItems: "center",
                                              gap: 0.75,
                                              mt: 0.5,
                                              px: 1.25,
                                              py: 1,
                                              borderRadius: 2,
                                              bgcolor: "#f8fafc",
                                              border: "1px dashed",
                                              borderColor: "divider",
                                              color: "text.secondary",
                                            }}
                                          >
                                            <InfoOutlinedIcon
                                              sx={{
                                                fontSize: 17,
                                                color: "text.disabled",
                                              }}
                                            />
                                            <Typography
                                              variant="body2"
                                              sx={{
                                                fontSize: "0.8rem",
                                                fontWeight: 600,
                                              }}
                                            >
                                              Cost calculated after amount
                                              selection
                                            </Typography>
                                          </Box>
                                        )}
                                      </Stack>
                                    </Box>
                                  );
                                },
                              )}
                            </Stack>
                          </Box>
                        </Box>
                      );
                    })}
                  </Box>
                );
              })}
            </Box>

            {ineligibleProducts.length > 0 && (
              <Alert
                severity="warning"
                variant="outlined"
                sx={{ backgroundColor: "rgba(255, 152, 0, 0.04)" }}
              >
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  Eligibility concern
                </Typography>
                <Typography variant="body2" sx={{ mt: 0.5 }}>
                  Based on your answers, you may not be eligible for:{" "}
                  {ineligibleProducts.join(", ")}. You may still continue with
                  your other selected coverage.
                </Typography>
              </Alert>
            )}

            {/* Estimated monthly total — styled like CoverageOptions */}
            {totalMonthly > 0 && (
              <Box
                sx={{
                  p: "16px",
                  borderRadius: "8px",
                  bgcolor: "#f5f8fd",
                }}
              >
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                  sx={{ mb: 2 }}
                >
                  <Stack direction="column" spacing={0.5}>
                    <Typography
                      variant="body2"
                      sx={{
                        color: "text.primary",
                        fontWeight: 600,
                        fontSize: 12,
                      }}
                    >
                      Total estimated cost<sup>1</sup>
                    </Typography>
                  </Stack>

                  <Typography
                    component="span"
                    variant="body2"
                    sx={{
                      color: "primary.main",
                      fontWeight: 800,
                      fontSize: "1.25rem",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {formatUSD(totalMonthly)}
                    <Typography
                      component="span"
                      variant="body2"
                      sx={{
                        color: "primary.main",
                        fontWeight: 800,
                        fontSize: "1rem",
                      }}
                    >
                      /mo
                    </Typography>
                  </Typography>
                </Stack>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ fontStyle: "italic" }}
                >
                  <sup>1</sup>Quoted cost is the best rate available. Final cost
                  may vary based on health status, gender, and tobacco/nicotine
                  use.
                </Typography>
              </Box>
            )}
          </Stack>
        </Box>
      )}
    </Stack>
  );

  const confirmCoverageName =
    confirmRemoveId != null
      ? entries.find((e) => e.coverage.id === confirmRemoveId)?.coverage.name
      : null;

  // On small screens, use bottom SwipeableDrawer (not full screen)
  if (isSmall) {
    return (
      <>
        <SwipeableDrawer
          anchor="bottom"
          open={open}
          onClose={onClose}
          onOpen={() => {}}
          disableSwipeToOpen
          sx={{
            "& .MuiDrawer-paper": {
              minHeight: "75vh",
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
            },
          }}
        >
          {drawerContent}
        </SwipeableDrawer>
        <Dialog
          open={confirmRemoveId != null}
          onClose={() => setConfirmRemoveId(null)}
        >
          <DialogTitle>Remove coverage</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Are you sure you want to remove{" "}
              <strong>{confirmCoverageName}</strong> from your selections?
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setConfirmRemoveId(null)}>Cancel</Button>
            <Button
              color="error"
              variant="contained"
              onClick={() => handleRemoveCoverage(confirmRemoveId!)}
            >
              Remove
            </Button>
          </DialogActions>
        </Dialog>
      </>
    );
  }

  return (
    <>
      <Drawer
        anchor="right"
        open={open}
        onClose={onClose}
        sx={{
          "& .MuiDrawer-paper": {
            width: 420,
            maxWidth: "100%",
          },
        }}
      >
        {drawerContent}
      </Drawer>
      <Dialog
        open={confirmRemoveId != null}
        onClose={() => setConfirmRemoveId(null)}
      >
        <DialogTitle>Remove coverage</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to remove{" "}
            <strong>{confirmCoverageName}</strong> from your selections?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmRemoveId(null)}>Cancel</Button>
          <Button
            color="error"
            variant="contained"
            onClick={() => handleRemoveCoverage(confirmRemoveId!)}
          >
            Remove
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
