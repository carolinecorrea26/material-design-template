import { useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import CloseIcon from "@mui/icons-material/Close";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import ShoppingCartOutlinedIcon from "@mui/icons-material/ShoppingCartOutlined";
import TaskAltIcon from "@mui/icons-material/TaskAlt";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  DialogContentText,
  Divider,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import { useApplicationForm } from "../../app/ApplicationFormContext";
import { CARD_RADIUS } from "../../app/theme";
import AppModal from "../layout/AppModal";
import { getActiveClient } from "../../config/client/getActiveClient";
import { getActiveClientCoverages } from "../../config/client/getActiveClientCoverages";
import { coverageCategories } from "../../config/coverageCategories";
import { getResolvedApplicantLabels } from "../../config/formSectionTitle";
import type {
  CoverageApplicantId,
  CoverageDefinition,
} from "../../config/coverages/types";
import type { EstimatedRateFrequency } from "../../config/clients/types";
import QuickDecisionIndicator from "./QuickDecisionIndicator";
import RateFrequencyToggle from "./RateFrequencyToggle";
import TotalCostSummary, {
  type TotalCostSummaryItem,
} from "./TotalCostSummary";
import EmptyState from "../feedback/EmptyState";
import { formatUSD } from "../../utils/formatUSD";
import { estimateMonthlyPremium } from "../../utils/estimateMonthlyPremium";
import { getDisplayedPremium } from "../../app/useCoverageState";
import { getResolvedFormFlow } from "../../config/formFlow";
import { pages } from "../../config/pages";
import type { PageId } from "../../types";

// ─── Types ──────────────────────────────────────────────────────────────────

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

/**
 * "drawer" — used inside AppDrawer (AppHeader cart icon, Coverage page summary).
 *   Shows header with close button, empty state, product cards, and total.
 *
 * "inline" — used inline on the Coverage page below ProductCatalog.
 *   Shows cart panel directly, no close button. Supports rate frequency toggle,
 *   edit/delete actions.
 */
export type CoverageCartVariant = "drawer" | "inline";

type DrawerProps = {
  variant: "drawer";
  /** "cart-icon" = opened from AppHeader; "coverage-page" = opened from Coverage page */
  source?: "cart-icon" | "coverage-page";
  onClose: () => void;
  // inline-only props not applicable
  rateFrequency?: never;
  showRateFrequencyToggle?: never;
  grandTotal?: never;
  categoryProducts?: never;
  selectedCoverageIds?: never;
  productApplicants?: never;
  calculatingRateKeys?: never;
  frequencyCalculating?: never;
  selectionCalculating?: never;
  onFrequencyToggle?: never;
  calcCoveragePremium?: never;
  isCoverageCalculating?: never;
  onEditCoverage?: never;
  onDeleteCoverage?: never;
};

type InlineProps = {
  variant: "inline";
  rateFrequency: EstimatedRateFrequency;
  showRateFrequencyToggle: boolean;
  grandTotal: number;
  categoryProducts: Array<{ id: string; name: string }>;
  selectedCoverageIds: string[];
  productApplicants: Record<string, CoverageApplicantId[]>;
  calculatingRateKeys: Set<string>;
  frequencyCalculating: boolean;
  selectionCalculating: boolean;
  onFrequencyToggle: (freq: EstimatedRateFrequency) => void;
  calcCoveragePremium: (coverageId: string) => number;
  isCoverageCalculating: (coverageId: string) => boolean;
  onEditCoverage?: () => void;
  onDeleteCoverage?: (coverageId: string) => void;
  // drawer-only props not applicable
  source?: never;
  onClose?: never;
};

export type CoverageCartProps = DrawerProps | InlineProps;

// ─── Shared hook (drawer variant reads form state directly) ──────────────────

function getClientApplicantLabels() {
  return getResolvedApplicantLabels(getActiveClient().applicantLabels);
}

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

          let monthlyEstimate: number | undefined;
          if (amount != null && amount > 0) {
            let base = estimateMonthlyPremium(coverage.categoryId, amount);
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

          return { applicantId, amount, riders: selectedRiders, monthlyEstimate };
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

/** Returns the badge count for the cart icon in AppHeader. */
export function useCoverageCartBadge(): number {
  return useSummaryData().badgeCount;
}

// ─── Drawer variant ──────────────────────────────────────────────────────────

function CoverageCartDrawer({
  source = "cart-icon",
  onClose,
}: {
  source?: "cart-icon" | "coverage-page";
  onClose: () => void;
}) {
  const { entries, totalMonthly } = useSummaryData();
  const applicantLabels = getClientApplicantLabels();
  const { values, setPageValues } = useApplicationForm();
  const navigate = useNavigate();
  const location = useLocation();
  const isEmpty = entries.length === 0;
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
    const { [coverageId]: _, ...nextProductApplicants } = currentProductApplicants;
    setPageValues({
      coverageSelections: nextSelections,
      productApplicants: nextProductApplicants as Record<string, string[]>,
    });
    setConfirmRemoveId(null);

    if (nextSelections.length === 0) {
      const flow = getResolvedFormFlow();
      const coverageIndex = flow.indexOf("coverage");
      const currentPath = location.pathname.replace(/\/$/, "");
      const currentPage = pages.find((p) => p.path === currentPath);
      const currentPageId = currentPage?.id as PageId | undefined;
      const currentIndex = currentPageId ? flow.indexOf(currentPageId) : -1;
      if (currentIndex > coverageIndex) {
        onClose();
        navigate("/coverage");
      }
    }
  }

  const ineligibleProducts: string[] = [];
  if (entries.length > 1) {
    const hoursWorked = Number(values["hours-worked-per-week"]);
    const monthlyIncome = Number(values["average-monthly-income"]);
    const hasDisability = entries.some((e) => e.coverage.categoryId === "DI");
    const hasOO = entries.some((e) => e.coverage.categoryId === "OO");
    if (hasDisability && hoursWorked > 0 && hoursWorked < 20)
      ineligibleProducts.push("Disability");
    if (hasDisability && monthlyIncome > 0 && monthlyIncome < 500)
      if (!ineligibleProducts.includes("Disability"))
        ineligibleProducts.push("Disability");
    if (hasOO) {
      const expenses = Number(values["monthly-business-expenses"]);
      if (expenses === 0 && values["monthly-business-expenses"] != null)
        ineligibleProducts.push("Office Overhead");
    }
  }

  const groupedByCategory = useMemo(() => {
    const groups: {
      category: (typeof coverageCategories)[number];
      items: CoverageSummaryEntry[];
    }[] = [];
    for (const cat of coverageCategories) {
      const items = entries.filter((e) => e.coverage.categoryId === cat.id);
      if (items.length > 0) groups.push({ category: cat, items });
    }
    return groups;
  }, [entries]);

  const confirmCoverageName =
    confirmRemoveId != null
      ? entries.find((e) => e.coverage.id === confirmRemoveId)?.coverage.name
      : null;

  return (
    <>
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
                  sx={{ color: isEmpty ? "text.primary" : "success.main" }}
                >
                  Coverage added
                </Typography>
              </>
            ) : (
              <>
                <ShoppingCartOutlinedIcon sx={{ color: "primary.main" }} />
                <Typography variant="h6" color="text.primary">
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
            }}
          >
            <EmptyState
              title="No coverage selected yet."
              body="Your application summary will appear here once you select coverage."
            />
          </Box>
        ) : (
          <Box sx={{ flex: 1, overflowY: "auto" }}>
            <Stack spacing={1}>
              {groupedByCategory.map(({ items }) =>
                items.map(({ coverage, applicants }) => {
                  const isMemberOnly =
                    applicants.length === 1 &&
                    applicants[0].applicantId === "member";
                  return (
                    <Box
                      key={coverage.id}
                      sx={{
                        border: "1px solid",
                        borderColor: "divider",
                        borderRadius: CARD_RADIUS,
                        backgroundColor: "background.paper",
                        px: 2,
                        pb: 2,
                        pt: 1.5,
                      }}
                    >
                      <Stack spacing={1}>
                        <Stack
                          direction="row"
                          justifyContent="space-between"
                          alignItems="flex-start"
                        >
                          <Typography variant="productNameLabel">
                            {coverage.name}
                            {coverage.underwritingType === "QD" && (
                              <QuickDecisionIndicator />
                            )}
                          </Typography>
                          <Stack direction="row" alignItems="center" spacing={0.5}>
                            {(() => {
                              const productTotal = applicants.reduce(
                                (s, a) => s + (a.monthlyEstimate ?? 0),
                                0,
                              );
                              return productTotal > 0 ? (
                                <Typography
                                  variant="body2"
                                  sx={{ fontWeight: 700, whiteSpace: "nowrap" }}
                                >
                                  {formatUSD(productTotal)}/mo
                                </Typography>
                              ) : null;
                            })()}
                            <IconButton
                              size="small"
                              aria-label={`Remove ${coverage.name}`}
                              onClick={() => setConfirmRemoveId(coverage.id)}
                              sx={{
                                color: "text.secondary",
                                "&:hover": { color: "error.main" },
                              }}
                            >
                              <DeleteOutlineIcon sx={{ fontSize: "1.1rem" }} />
                            </IconButton>
                          </Stack>
                        </Stack>

                        {applicants.map(
                          ({ applicantId, amount, riders: selectedRiders, monthlyEstimate }) => {
                            const hasSelectedAmount = amount != null && amount > 0;
                            return (
                              <Box key={applicantId} sx={{ pl: 1 }}>
                                <Stack spacing={0.5}>
                                  {!isMemberOnly && (
                                    <Typography variant="caption" fontWeight={700}>
                                      {applicantLabels[applicantId]}
                                    </Typography>
                                  )}
                                  {hasSelectedAmount ? (
                                    <>
                                      <Typography variant="caption" color="text.secondary">
                                        Requested: {formatUSD(amount, 0)}
                                      </Typography>
                                      {selectedRiders.length > 0 && (
                                        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
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
                                        <Typography variant="caption" color="text.secondary">
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
                                        bgcolor: "background.subtle",
                                        border: "1px dashed",
                                        borderColor: "divider",
                                        color: "text.secondary",
                                      }}
                                    >
                                      <InfoOutlinedIcon
                                        sx={{ fontSize: 17, color: "text.disabled" }}
                                      />
                                      <Typography variant="caption" fontWeight={700}>
                                        Cost calculated after amount selection
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
                  );
                }),
              )}

              {ineligibleProducts.length > 0 && (
                <Alert
                  severity="warning"
                  variant="outlined"
                  sx={{ backgroundColor: "rgba(255, 152, 0, 0.04)" }}
                >
                  <Typography variant="subtitle2">Eligibility concern</Typography>
                  <Typography variant="body2" sx={{ mt: 0.5 }}>
                    Based on your answers, you may not be eligible for:{" "}
                    {ineligibleProducts.join(", ")}. You may still continue with
                    your other selected coverage.
                  </Typography>
                </Alert>
              )}

              {totalMonthly > 0 && (
                <TotalCostSummary
                  items={groupedByCategory.flatMap(({ items }) =>
                    items
                      .map(({ coverage, applicants }) => ({
                        id: coverage.id,
                        name: coverage.name,
                        amount: applicants.reduce(
                          (s, a) => s + (a.monthlyEstimate ?? 0),
                          0,
                        ),
                      }))
                      .filter((item) => item.amount > 0),
                  )}
                  total={totalMonthly}
                  totalSuffix="/mo"
                  disclaimer={
                    <>
                      <sup>1</sup> Quoted cost is the best rate available. Final
                      cost may vary based on health status, gender, and
                      tobacco/nicotine use.
                    </>
                  }
                />
              )}
            </Stack>
          </Box>
        )}
      </Stack>

      <AppModal
        open={confirmRemoveId != null}
        onClose={() => setConfirmRemoveId(null)}
        maxWidth={400}
        title="Remove coverage"
        role="alertdialog"
        actions={[
          {
            label: "Remove",
            onClick: () => handleRemoveCoverage(confirmRemoveId!),
            variant: "contained",
            color: "error",
          },
          {
            label: "Cancel",
            onClick: () => setConfirmRemoveId(null),
            variant: "text",
          },
        ]}
      >
        <DialogContentText>
          Are you sure you want to remove <strong>{confirmCoverageName}</strong>{" "}
          from your selections?
        </DialogContentText>
      </AppModal>
    </>
  );
}

// ─── Inline variant (replaces TotalCostCart) ─────────────────────────────────

function CoverageCartInline({
  categoryProducts,
  selectedCoverageIds,
  calculatingRateKeys,
  frequencyCalculating,
  selectionCalculating,
  rateFrequency,
  showRateFrequencyToggle,
  grandTotal,
  onFrequencyToggle,
  calcCoveragePremium,
  isCoverageCalculating,
  onEditCoverage,
  onDeleteCoverage,
}: Omit<InlineProps, "variant">) {
  const isAnyCalculating =
    calculatingRateKeys.size > 0 || frequencyCalculating || selectionCalculating;
  const displayedTotal = getDisplayedPremium(grandTotal, rateFrequency);
  const rateSuffix = rateFrequency === "annual" ? "/yr" : "/mo";
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const deleteTargetName =
    deleteTargetId != null
      ? (categoryProducts.find((c) => c.id === deleteTargetId)?.name ?? "")
      : "";

  const items: TotalCostSummaryItem[] = categoryProducts
    .filter((c) => selectedCoverageIds.includes(c.id))
    .map((coverage) => {
      const coverageTotal = calcCoveragePremium(coverage.id);
      const isCalculating = isCoverageCalculating(coverage.id);
      if (coverageTotal <= 0 && !isCalculating) return null;
      return {
        id: coverage.id,
        name: coverage.name,
        amount: getDisplayedPremium(coverageTotal, rateFrequency),
        isCalculating,
        suffix: rateSuffix,
      };
    })
    .filter(Boolean) as TotalCostSummaryItem[];

  return (
    <Stack spacing={1.5}>
      <Stack direction="row" spacing={1} alignItems="center">
        <ShoppingCartOutlinedIcon sx={{ color: "primary.main" }} />
        <Typography variant="subtitle1" fontWeight={700}>
          Your requested coverage
        </Typography>
      </Stack>

      {grandTotal <= 0 ? (
        <EmptyState title="No coverage selected yet." />
      ) : (
        <>
          {(onEditCoverage || onDeleteCoverage) && (
            <Stack spacing={0.5}>
              {items.map((item) => (
                <Stack
                  key={item.id}
                  direction="row"
                  alignItems="center"
                  justifyContent="space-between"
                >
                  <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>
                    {item.name}
                  </Typography>
                  <Stack direction="row" spacing={0.25}>
                    {onEditCoverage && (
                      <IconButton
                        size="small"
                        aria-label={`Edit ${item.name}`}
                        onClick={() => setEditDialogOpen(true)}
                        sx={{ color: "primary.main" }}
                      >
                        <EditOutlinedIcon sx={{ fontSize: "1.1rem" }} />
                      </IconButton>
                    )}
                    {onDeleteCoverage && (
                      <IconButton
                        size="small"
                        aria-label={`Remove ${item.name}`}
                        onClick={() => setDeleteTargetId(item.id)}
                        sx={{
                          color: "text.secondary",
                          "&:hover": { color: "error.main" },
                        }}
                      >
                        <DeleteOutlineIcon sx={{ fontSize: "1.1rem" }} />
                      </IconButton>
                    )}
                  </Stack>
                </Stack>
              ))}
            </Stack>
          )}

          <TotalCostSummary
            items={items}
            total={displayedTotal}
            totalSuffix={rateSuffix}
            isCalculating={isAnyCalculating}
            disclaimer={
              <>
                <sup>1</sup> Quoted cost is the best rate available. Final cost
                may vary based on gender, health status, and tobacco/nicotine
                use.
              </>
            }
          />

          {showRateFrequencyToggle && (
            <Stack
              direction="row"
              spacing={0.75}
              alignItems="center"
              justifyContent="end"
            >
              <Typography
                variant="caption"
                fontWeight={700}
                color={rateFrequency === "monthly" ? "primary.main" : "text.secondary"}
              >
                Monthly
              </Typography>
              <RateFrequencyToggle
                checked={rateFrequency === "annual"}
                onChange={(e) =>
                  onFrequencyToggle(e.target.checked ? "annual" : "monthly")
                }
                slotProps={{
                  input: {
                    "aria-label": "Toggle estimated cost between monthly and annual",
                  },
                }}
              />
              <Typography
                variant="caption"
                fontWeight={700}
                color={rateFrequency === "annual" ? "primary.main" : "text.secondary"}
              >
                Annual
              </Typography>
            </Stack>
          )}

          <Divider />

          <Stack direction="row" justifyContent="space-between" alignItems="baseline">
            <Typography variant="subtitle2" fontWeight={700}>
              Total estimated cost
            </Typography>
            {isAnyCalculating ? (
              <CircularProgress size={16} thickness={4} sx={{ color: "success.main" }} />
            ) : (
              <Typography
                variant="subtitle1"
                sx={{ fontWeight: 900, color: "success.main", whiteSpace: "nowrap" }}
              >
                {formatUSD(displayedTotal)}
                {rateSuffix}
              </Typography>
            )}
          </Stack>
        </>
      )}

      {onEditCoverage && (
        <AppModal
          open={editDialogOpen}
          onClose={() => setEditDialogOpen(false)}
          maxWidth={480}
          minHeight="auto"
          title="Edit coverage"
          role="alertdialog"
          actions={[
            {
              label: "Yes",
              onClick: () => {
                setEditDialogOpen(false);
                onEditCoverage();
              },
              variant: "contained",
            },
            {
              label: "Cancel",
              onClick: () => setEditDialogOpen(false),
              variant: "text",
            },
          ]}
        >
          <DialogContentText>
            To edit your coverage, you will be sent back to the coverage page. Do
            you want to go to the coverage page to make edits?
          </DialogContentText>
        </AppModal>
      )}

      {onDeleteCoverage && (
        <AppModal
          open={deleteTargetId !== null}
          onClose={() => setDeleteTargetId(null)}
          maxWidth={480}
          minHeight="auto"
          title="Remove coverage"
          role="alertdialog"
          actions={[
            {
              label: "Remove",
              onClick: () => {
                if (deleteTargetId) onDeleteCoverage(deleteTargetId);
                setDeleteTargetId(null);
              },
              variant: "contained",
              color: "error",
            },
            {
              label: "Cancel",
              onClick: () => setDeleteTargetId(null),
              variant: "text",
            },
          ]}
        >
          <DialogContentText>
            Are you sure you want to remove{" "}
            <strong>{deleteTargetName}</strong> from your selections?
          </DialogContentText>
        </AppModal>
      )}
    </Stack>
  );
}

// ─── Public component ────────────────────────────────────────────────────────

/**
 * CoverageCart renders the user's selected coverage summary.
 *
 * variant="drawer"  — full drawer content with header and close button.
 *                     Reads coverage state from ApplicationFormContext directly.
 *                     Used inside AppDrawer in AppHeader and Coverage page.
 *
 * variant="inline"  — inline cost panel below ProductCatalog on Coverage page.
 *                     Receives computed state as props (from useCoverageState).
 *                     Replaces the former TotalCostCart.
 */
export default function CoverageCart(props: CoverageCartProps) {
  if (props.variant === "drawer") {
    return (
      <CoverageCartDrawer source={props.source} onClose={props.onClose} />
    );
  }

  return (
    <CoverageCartInline
      rateFrequency={props.rateFrequency}
      showRateFrequencyToggle={props.showRateFrequencyToggle}
      grandTotal={props.grandTotal}
      categoryProducts={props.categoryProducts}
      selectedCoverageIds={props.selectedCoverageIds}
      productApplicants={props.productApplicants}
      calculatingRateKeys={props.calculatingRateKeys}
      frequencyCalculating={props.frequencyCalculating}
      selectionCalculating={props.selectionCalculating}
      onFrequencyToggle={props.onFrequencyToggle}
      calcCoveragePremium={props.calcCoveragePremium}
      isCoverageCalculating={props.isCoverageCalculating}
      onEditCoverage={props.onEditCoverage}
      onDeleteCoverage={props.onDeleteCoverage}
    />
  );
}
