import { requirementText } from "../../domain/requirementContent";
import { combineRateDisplays, type RateDisplayState } from '../../domain/rateDisplay';
import EstimatedRate from "./EstimatedRate";
import { useMemo, useState } from "react";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import ShoppingCartRoundedIcon from "@mui/icons-material/ShoppingCartRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import InfoRoundedIcon from "@mui/icons-material/InfoRounded";
import {
  Alert,
  Box,
  Chip,
  DialogContentText,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import AppModal from "../layout/AppModal";
import { coverageCategories } from "../../config/coverageCategories";
import { getResolvedApplicantLabels } from "../../config/formSectionTitle";
import type {
  CoverageApplicantId,
  CoverageDefinition,
} from "../../config/coverages/types";
import type { EstimatedRateFrequency } from "../../config/clients/types";
import ProductCard from "../layout/ProductCard";
import RateFrequencyControl from "./RateFrequencyControl";
import TotalCostSummary, {
  type TotalCostSummaryItem,
} from "./TotalCostSummary";
import EmptyState from "../feedback/EmptyState";
import { formatUSD } from "../../utils/formatUSD";
import { getDisplayedPremium } from "../../utils/coverageDisplay";

// ─── Types ──────────────────────────────────────────────────────────────────

export type ApplicantSummary = {
  applicantId: CoverageApplicantId;
  amount: number | undefined;
  riders: { name: string; amount?: number }[];
  monthlyEstimate: number | undefined;
  display: RateDisplayState;
  quickDecision?: boolean;
  riderOnly?: { name: string };
};

export type CoverageSummaryEntry = {
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
  entries: CoverageSummaryEntry[];
  totalMonthly: number;
  applicantLabels?: Record<CoverageApplicantId, string>;
  ineligibleProducts?: string[];
  onRemoveCoverage: (coverageId: string) => void;
  ratesSuppressed?: boolean;
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
  getCoverageRateDisplay?: (coverageId: string) => RateDisplayState;
  isCoverageCalculating: (coverageId: string) => boolean;
  onEditCoverage?: () => void;
  onDeleteCoverage?: (coverageId: string) => void;
  // drawer-only props not applicable
  source?: never;
  onClose?: never;
};

export type CoverageCartProps = DrawerProps | InlineProps;

// ─── Drawer variant ──────────────────────────────────────────────────────────

function CoverageCartDrawer({
  source = "cart-icon", onClose, entries, totalMonthly,
  applicantLabels = getResolvedApplicantLabels(), ineligibleProducts = [], onRemoveCoverage, ratesSuppressed = false,
}: Omit<DrawerProps, "variant">) {
  const isEmpty = entries.length === 0;
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);
  const handleRemoveCoverage = (id: string) => { onRemoveCoverage(id); setConfirmRemoveId(null); };
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
      <Stack spacing={1.5} sx={{ height: "100%" }}>
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
                  <ShoppingCartRoundedIcon sx={{ color: "primary.main" }} />
                ) : (
                  <CheckCircleRoundedIcon sx={{ color: "success.main" }} />
                )}
                <Typography
                  variant="h6"
                  sx={{ color: isEmpty ? "text.primary" : "success.main" }}
                >{requirementText("coverage.coverage-cart.coverage-added")}</Typography>
              </>
            ) : (
              <>
                <ShoppingCartRoundedIcon sx={{ color: "primary.main" }} />
                <Typography variant="h6" color="text.primary">{requirementText("coverage.coverage-cart.your-requested-coverage")}</Typography>
              </>
            )}
          </Stack>
          <IconButton aria-label={requirementText("coverage.coverage-cart.close-coverage-requested")} onClick={onClose}>
            <CloseRoundedIcon />
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
              title={requirementText("coverage.coverage-cart.no-coverage-selected-yet")}
              body={requirementText("coverage.coverage-cart.your-application-summary-will-appear-here-once-you")}
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
                    <ProductCard
                      key={coverage.id}
                      productName={coverage.name}
                      quickDecision={applicants.length > 0 && applicants.every(applicant => applicant.quickDecision)}
                      sx={{ p: 1.5, gap: 1 }}
                      headerAction={
                            <IconButton
                              size="small"
                              aria-label={requirementText("list.remove-label", { label: coverage.name })}
                              onClick={() => setConfirmRemoveId(coverage.id)}
                              sx={{
                                color: "text.secondary",
                                "&:hover": { color: "error.main" },
                              }}
                            >
                              <DeleteOutlineRoundedIcon sx={{ fontSize: "1.1rem" }} />
                            </IconButton>
                      }
                    >
                      <Stack spacing={1}>
                        {applicants.map(
                          ({ applicantId, amount, riders: selectedRiders, monthlyEstimate, display, riderOnly: standalone }) => {
                            const hasSelectedAmount = amount != null && (amount > 0 || !!standalone);
                            return (
                              <Box key={applicantId}>
                                <Stack spacing={0.5}>
                                  {!isMemberOnly && (
                                    <Typography variant="caption" fontWeight={700}>
                                      {applicantLabels[applicantId]}
                                    </Typography>
                                  )}
                                  {hasSelectedAmount ? (
                                    <>
                                      <Stack direction="row" justifyContent="space-between" alignItems="baseline" spacing={1} useFlexGap flexWrap="wrap">
                                        <Typography variant="caption" color="text.secondary">{requirementText("coverage.coverage-cart.requested-coverage")}</Typography>
                                        <Typography variant="body2" color="primary" fontWeight={700} sx={{ fontVariantNumeric: 'tabular-nums' }}>{formatUSD(amount, 0)}</Typography>
                                      </Stack>
                                      {standalone && <Typography variant="caption" color="text.secondary">{requirementText("coverage.coverage-cart.applying-for")}{standalone.name}{requirementText("coverage.coverage-cart.only")}</Typography>}
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
                                      {!ratesSuppressed && display.status !== 'hidden' && (display.status === 'reference-table'
                                        ? <EstimatedRate display={display} />
                                        : <Stack direction="row" justifyContent="space-between" alignItems="baseline" spacing={1} useFlexGap flexWrap="wrap">
                                            <Typography variant="caption" color="text.secondary">{requirementText("coverage.estimated-cost")}<sup>1</sup></Typography>
                                            <EstimatedRate appearance="summary" display={display} amount={monthlyEstimate} suffix="/mo" />
                                          </Stack>)}
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
                                        bgcolor: "background.default",
                                        border: "1px dashed",
                                        borderColor: "divider",
                                        color: "text.secondary",
                                      }}
                                    >
                                      <InfoRoundedIcon
                                        sx={{ fontSize: 17, color: "text.disabled" }}
                                      />
                                      <Typography variant="caption" fontWeight={700}>{requirementText("coverage.coverage-cart.cost-calculated-after-amount-selection")}</Typography>
                                    </Box>
                                  )}
                                </Stack>
                              </Box>
                            );
                          },
                        )}
                      </Stack>
                    </ProductCard>
                  );
                }),
              )}

              {ineligibleProducts.length > 0 && (
                <Alert
                  severity="warning"
                  variant="outlined"
                  sx={{ backgroundColor: "rgba(255, 152, 0, 0.04)" }}
                >
                  <Typography variant="subtitle2">{requirementText("coverage.coverage-cart.eligibility-concern")}</Typography>
                  <Typography variant="body2" sx={{ mt: 0.5 }}>{requirementText("coverage.coverage-cart.based-on-your-answers-you-may-not-be")}{" "}
                    {ineligibleProducts.join(", ")}{requirementText("coverage.coverage-cart.you-may-still-continue-with-your-other-selected")}</Typography>
                </Alert>
              )}

              {entries.length > 0 && (
                <TotalCostSummary display={ratesSuppressed ? { status: "hidden" } : undefined} rateAppearance="summary"
                  items={groupedByCategory.flatMap(({ items }) =>
                    items
                      .map(({ coverage, applicants }) => ({
                        id: coverage.id,
                        name: coverage.name,
                        display: combineRateDisplays(applicants.map(applicant => applicant.display)),
                        amount: applicants.reduce(
                          (s, a) => s + (a.monthlyEstimate ?? 0),
                          0,
                        ),
                      })),
                  )}
                  total={totalMonthly}
                  totalSuffix="/mo"
                  disclaimer={
                    <>
                      <sup>1</sup>{requirementText("coverage.coverage-cart.quoted-cost-is-the-best-rate-available-final")}</>
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
        title={requirementText("coverage.coverage-cart.remove-coverage")}
        role="alertdialog"
        actions={[
          {
            label: requirementText("coverage.coverage-cart.remove"),
            onClick: () => handleRemoveCoverage(confirmRemoveId!),
            variant: "contained",
            color: "error",
          },
          {
            label: requirementText("coverage.dialog.dependent.cancel"),
            onClick: () => setConfirmRemoveId(null),
            variant: "text",
          },
        ]}
      >
        <DialogContentText>{requirementText("coverage.coverage-cart.are-you-sure-you-want-to-remove")}<strong>{confirmCoverageName}</strong>{" "}{requirementText("coverage.coverage-cart.from-your-selections")}</DialogContentText>
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
  getCoverageRateDisplay,
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
      if (coverageTotal < 0 && !isCalculating) return null;
      return {
        id: coverage.id,
        name: coverage.name,
        amount: getDisplayedPremium(coverageTotal, rateFrequency),
        display: getCoverageRateDisplay?.(coverage.id),
        isCalculating,
        suffix: rateSuffix,
      };
    })
    .filter(Boolean) as TotalCostSummaryItem[];

  return (
    <Stack spacing={1.5}>
      {selectedCoverageIds.length > 0 && (
        <>
          <Stack direction="row" spacing={1} alignItems="center">
            <ShoppingCartRoundedIcon sx={{ color: "primary.main" }} />
            <Typography variant="subtitle1" fontWeight={700}>{requirementText("coverage.coverage-cart.your-requested-coverage")}</Typography>
          </Stack>

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
                        aria-label={requirementText("list.edit", { label: item.name })}
                        onClick={() => setEditDialogOpen(true)}
                        sx={{ color: "primary.main" }}
                      >
                        <EditRoundedIcon sx={{ fontSize: "1.1rem" }} />
                      </IconButton>
                    )}
                    {onDeleteCoverage && (
                      <IconButton
                        size="small"
                        aria-label={requirementText("list.remove-label", { label: item.name })}
                        onClick={() => setDeleteTargetId(item.id)}
                        sx={{
                          color: "text.secondary",
                          "&:hover": { color: "error.main" },
                        }}
                      >
                        <DeleteOutlineRoundedIcon sx={{ fontSize: "1.1rem" }} />
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
                <sup>1</sup>{requirementText("coverage.coverage-cart.quoted-cost-is-the-best-rate-available-final-2")}</>
            }
          />

          {showRateFrequencyToggle && (
            <RateFrequencyControl
              value={rateFrequency}
              onChange={onFrequencyToggle}
              justifyContent="end"
            />
          )}
        </>
      )}

      {onEditCoverage && (
        <AppModal
          open={editDialogOpen}
          onClose={() => setEditDialogOpen(false)}
          maxWidth={480}
          minHeight="auto"
          title={requirementText("coverage.coverage-cart.edit-coverage")}
          role="alertdialog"
          actions={[
            {
              label: requirementText("coverage.coverage-cart.yes"),
              onClick: () => {
                setEditDialogOpen(false);
                onEditCoverage();
              },
              variant: "contained",
            },
            {
              label: requirementText("coverage.dialog.dependent.cancel"),
              onClick: () => setEditDialogOpen(false),
              variant: "text",
            },
          ]}
        >
          <DialogContentText>{requirementText("coverage.coverage-cart.to-edit-your-coverage-you-will-be-sent")}</DialogContentText>
        </AppModal>
      )}

      {onDeleteCoverage && (
        <AppModal
          open={deleteTargetId !== null}
          onClose={() => setDeleteTargetId(null)}
          maxWidth={480}
          minHeight="auto"
          title={requirementText("coverage.coverage-cart.remove-coverage")}
          role="alertdialog"
          actions={[
            {
              label: requirementText("coverage.coverage-cart.remove"),
              onClick: () => {
                if (deleteTargetId) onDeleteCoverage(deleteTargetId);
                setDeleteTargetId(null);
              },
              variant: "contained",
              color: "error",
            },
            {
              label: requirementText("coverage.dialog.dependent.cancel"),
              onClick: () => setDeleteTargetId(null),
              variant: "text",
            },
          ]}
        >
          <DialogContentText>{requirementText("coverage.coverage-cart.are-you-sure-you-want-to-remove")}{" "}
            <strong>{deleteTargetName}</strong>{requirementText("coverage.coverage-cart.from-your-selections")}</DialogContentText>
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
      <CoverageCartDrawer {...props} />
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
      getCoverageRateDisplay={props.getCoverageRateDisplay}
      isCoverageCalculating={props.isCoverageCalculating}
      onEditCoverage={props.onEditCoverage}
      onDeleteCoverage={props.onDeleteCoverage}
    />
  );
}
