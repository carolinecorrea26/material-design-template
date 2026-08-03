import {
  Alert,
  Box,
  Checkbox,
  Chip,
  CircularProgress,
  Collapse,
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Typography,
} from "@mui/material";
import FeaturedBadge from "../ui/FeaturedBadge";
import type { SvgIconComponent } from "@mui/icons-material";
import CategoryCard from "../layout/CategoryCard";
import CategoryHeader from "../layout/CategoryHeader";
import { ApplicantSectionLabel } from "../layout/ApplicantSectionDivider";
import SelectionGroup from "./SelectionGroup";
import ProductCardSurface from "../layout/ProductCard";
import QuickDecisionIndicator from "../ui/QuickDecisionIndicator";
import QuickDecisionInfoBox from "../content/QuickDecisionInfoBox";
import { getCoverageCategorySectionLabel } from "../../config/coverageCategories";
import {
  getResolvedApplicantSectionTitles,
  applicantIcons,
  coverageApplicantToSection,
} from "../../config/formSectionTitle";
import type {
  CoverageCategoryId,
  CoverageApplicantId,
} from "../../config/coverages/types";
import type {
  ClientAmountByFrequency,
  ClientProductEstimatedCostBreakdown,
  EstimatedRateFrequency,
} from "../../config/clients/types";
import { getActiveClientCoverages } from "../../config/client/getActiveClientCoverages";
import { getActiveClient } from "../../config/client/getActiveClient";
import { getContent } from "../../content";
import { formatUSD } from "../../utils/formatUSD";
import TotalCostCart from "../ui/TotalCostCart";
import ProductCostBreakdown, {
  type ProductCostBreakdownItem,
} from "../ui/ProductCostBreakdown";
import {
  getDisplayedPremium,
  getBenefitAmountLabel,
} from "../../app/useCoverageState";
import { estimateMonthlyPremium } from "../../utils/estimateMonthlyPremium";

type ResolvedCoverage = ReturnType<typeof getActiveClientCoverages>[number];
import { getMaxAggregateNotes } from "../../config/coverageConstants";
import { resolveClientId } from "../../config/client/resolveClientId";

function toMonthlyAmount(config?: ClientAmountByFrequency): number {
  if (!config) return 0;
  if (typeof config.monthly === "number") return config.monthly;
  if (typeof config.annual === "number") return config.annual / 12;
  return 0;
}

function collectBreakdownRiderItems({
  coverage,
  currentApplicants,
  storedAmounts,
  storedRiders,
  storedRiderAmounts,
  isMultiApplicant,
  breakdownConfig,
}: {
  coverage: ProductCardProps["coverage"];
  currentApplicants: CoverageApplicantId[];
  storedAmounts: ProductCardProps["storedAmounts"];
  storedRiders: ProductCardProps["storedRiders"];
  storedRiderAmounts: ProductCardProps["storedRiderAmounts"];
  isMultiApplicant: boolean;
  breakdownConfig?: ClientProductEstimatedCostBreakdown;
}): ProductCostBreakdownItem[] {
  const riderTotals = new Map<string, number>();

  for (const applicantId of currentApplicants) {
    const key = `${coverage.id}:${applicantId}`;
    const amount = storedAmounts[key] ?? 0;
    if (amount <= 0) continue;

    if (
      applicantId === "child" &&
      breakdownConfig?.childApplicantRider?.enabled !== false
    ) {
      const childLabel =
        breakdownConfig?.childApplicantRider?.label ??
        "Child applicant coverage";
      const childAmount = toMonthlyAmount(
        breakdownConfig?.childApplicantRider?.amount,
      );
      if (childAmount > 0) {
        riderTotals.set(
          childLabel,
          (riderTotals.get(childLabel) ?? 0) + childAmount,
        );
      }
    }

    for (const rider of coverage.riders ?? []) {
      const riderKey = `${coverage.id}:${rider.id}:${applicantId}`;
      if (!storedRiders[riderKey]) continue;

      const riderAmount = rider.hasAmount
        ? (storedRiderAmounts[riderKey] ?? 0)
        : amount;
      if (riderAmount <= 0) continue;

      const riderPremium =
        estimateMonthlyPremium(coverage.categoryId, riderAmount) *
        rider.premiumFactor;
      if (riderPremium <= 0) continue;

      const riderLabel = isMultiApplicant
        ? `${rider.name} (${applicantCheckboxLabels[applicantId]})`
        : rider.name;
      riderTotals.set(
        riderLabel,
        (riderTotals.get(riderLabel) ?? 0) + riderPremium,
      );
    }
  }

  return Array.from(riderTotals.entries()).map(([label, amount]) => ({
    label,
    amount,
  }));
}

const applicantCheckboxLabels: Record<CoverageApplicantId, string> =
  getContent().coverage.applicantCheckboxLabels;

type ProductCatalogProps = {
  availableCategories: Array<{
    id: CoverageCategoryId;
    label: string;
    icon: React.ElementType;
    shortLabel?: string;
  }>;
  selectedCategories: CoverageCategoryId[];
  categoryProducts: ResolvedCoverage[];
  categoryEligibility: Partial<Record<CoverageCategoryId, boolean>>;
  allCategoriesIneligible: boolean;
  hasQdCategorySelected: boolean;
  selectedCoverageIds: string[];
  productApplicants: Record<string, CoverageApplicantId[]>;
  storedAmounts: Record<string, number>;
  storedRiders: Record<string, boolean>;
  storedRiderAmounts: Record<string, number>;
  storedWaitingPeriods: Record<string, string>;
  storedMaxBenefitPeriods: Record<string, string>;
  calculatingRateKeys: Set<string>;
  rateFrequency: EstimatedRateFrequency;
  frequencyCalculating: boolean;
  selectionCalculating: boolean;
  showRateFrequencyToggle: boolean;
  showProducts: boolean;
  productsLoading: boolean;
  grandTotal: number;
  activeClient: { support: { phoneDisplay?: string; email?: string } };
  onToggleApplicant: (
    coverageId: string,
    applicant: CoverageApplicantId,
  ) => void;
  onAmountChange: (key: string, amount: number) => void;
  onFrequencyToggle: (freq: EstimatedRateFrequency) => void;
  onRiderToggle: (
    coverageId: string,
    riderId: string,
    applicantId: CoverageApplicantId,
  ) => void;
  onRiderAmountChange: (
    coverageId: string,
    riderId: string,
    applicantId: CoverageApplicantId,
    amount: number,
  ) => void;
  onWaitingPeriodChange: (coverageId: string, value: string) => void;
  onMaxBenefitPeriodChange: (coverageId: string, value: string) => void;
  onQdDrawerOpen: () => void;
  getVisibleApplicants: (
    applicants: CoverageApplicantId[],
    coverageId?: string,
  ) => CoverageApplicantId[];
  calcApplicantPremium: (
    coverage: ResolvedCoverage,
    applicantId: CoverageApplicantId,
  ) => number;
  generateAmountChoices: (
    coverage: ProductCatalogProps["categoryProducts"][number],
    applicantId?: CoverageApplicantId,
  ) => number[];
  hasSpouse: boolean;
};

export default function ProductCatalog(props: ProductCatalogProps) {
  const {
    availableCategories,
    selectedCategories,
    categoryProducts,
    categoryEligibility,
    allCategoriesIneligible,
    hasQdCategorySelected,
    selectedCoverageIds,
    productApplicants,
    storedAmounts,
    storedRiders,
    storedRiderAmounts,
    storedWaitingPeriods,
    storedMaxBenefitPeriods,
    calculatingRateKeys,
    rateFrequency,
    frequencyCalculating,
    selectionCalculating,
    showRateFrequencyToggle,
    showProducts,
    productsLoading,
    grandTotal,
    activeClient,
    onToggleApplicant,
    onAmountChange,
    onFrequencyToggle,
    onRiderToggle,
    onRiderAmountChange,
    onWaitingPeriodChange,
    onMaxBenefitPeriodChange,
    onQdDrawerOpen,
    getVisibleApplicants,
    calcApplicantPremium,
    generateAmountChoices,
    hasSpouse,
  } = props;

  const clientId = resolveClientId();
  const client = getActiveClient();

  const categorySectionLabelOverrides = client.coverages.categorySectionLabels;

  const additionalCoverageWarningMode =
    client.coverages.additionalCoverageWarning ?? "applyForAdditional";

  const additionalCoverageWarningText =
    additionalCoverageWarningMode === "applyForTotal"
      ? "If you already have any of the following Insurance and wish to increase your current level of coverage, apply for the total amount of coverage you want (amount you currently have + amount you're requesting)."
      : "If you already have any of the following Insurance and wish to increase your current level of coverage, apply only for the additional coverage you want.";

  // Canonical display order for coverage sections
  const categoryDisplayOrder: CoverageCategoryId[] = [
    "LI",
    "AD",
    "DI",
    "OO",
    "SH",
  ];
  const orderedCategories = [...selectedCategories].sort(
    (a, b) => categoryDisplayOrder.indexOf(a) - categoryDisplayOrder.indexOf(b),
  );

  if (selectedCategories.length === 0 || !showProducts) return null;

  if (productsLoading) {
    return (
      <Stack spacing={2} alignItems="center" sx={{ py: 6 }}>
        <CircularProgress size={32} />
        <Typography variant="body2" color="text.secondary">
          Loading your coverage options…
        </Typography>
      </Stack>
    );
  }

  const calcCoveragePremium = (coverageId: string) => {
    const coverage = categoryProducts.find((c) => c.id === coverageId);
    if (!coverage) return 0;
    const applicants = productApplicants[coverageId] ?? [];
    return applicants.reduce(
      (sum, applicantId) => sum + calcApplicantPremium(coverage, applicantId),
      0,
    );
  };

  const isCoverageCalculating = (coverageId: string) => {
    const applicants = productApplicants[coverageId] ?? [];
    return (
      applicants.some((a) => calculatingRateKeys.has(`${coverageId}:${a}`)) ||
      frequencyCalculating
    );
  };

  return (
    <>
      {/* Section header */}
      <Typography variant="h5" sx={{ mb: 2 }}>
        Here are your eligible coverage options
      </Typography>

      {/* QuickDecision note */}
      {hasQdCategorySelected && (
        <QuickDecisionInfoBox onLearnMore={onQdDrawerOpen} />
      )}

      {/* Coverage increase warning */}
      <Alert severity="warning" sx={{ borderRadius: 2, mb: 2 }}>
        {additionalCoverageWarningText}
      </Alert>

      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 3,
        }}
      >
        {/* Product boxes column */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Collapse in={showProducts}>
            <Stack spacing={3}>
              {orderedCategories.map((categoryId) => {
                const category = availableCategories.find(
                  (c) => c.id === categoryId,
                );
                if (!category) return null;

                const CategoryIcon = category.icon;

                if (categoryEligibility[categoryId] === false) {
                  return (
                    <Stack spacing={2} key={categoryId}>
                      <CategoryHeader
                        label={getCoverageCategorySectionLabel(
                          categoryId,
                          categorySectionLabelOverrides,
                        )}
                        icon={CategoryIcon as any}
                      />
                      <Alert severity="warning" sx={{ borderRadius: 2 }}>
                        Based on your answers, you are not eligible for{" "}
                        {category.label} coverage at this time.
                      </Alert>
                    </Stack>
                  );
                }

                const productsInCategory = categoryProducts.filter(
                  (c) => c.categoryId === categoryId,
                );
                if (productsInCategory.length === 0) return null;

                const notes = getMaxAggregateNotes(categoryId, clientId);

                return (
                  <Stack spacing={2} key={categoryId}>
                    <CategoryCard
                      label={getCoverageCategorySectionLabel(
                        categoryId,
                        categorySectionLabelOverrides,
                      )}
                      icon={CategoryIcon as SvgIconComponent}
                    >
                      {notes && (
                        <Alert severity="info" sx={{ borderRadius: 2 }}>
                          <Typography
                            variant="body2"
                            sx={{ mb: hasSpouse || notes.child ? 1 : 0 }}
                          >
                            {notes.member}
                          </Typography>
                          {hasSpouse && (
                            <Typography
                              variant="body2"
                              sx={{ mb: notes.child ? 1 : 0 }}
                            >
                              {notes.spouse}
                            </Typography>
                          )}
                          {notes.child && (
                            <Typography variant="body2">
                              {notes.child}
                            </Typography>
                          )}
                        </Alert>
                      )}
                      {productsInCategory.map((coverage) => (
                        <ProductCard
                          key={coverage.id}
                          coverage={coverage}
                          productApplicants={productApplicants}
                          storedAmounts={storedAmounts}
                          storedRiders={storedRiders}
                          storedRiderAmounts={storedRiderAmounts}
                          storedWaitingPeriods={storedWaitingPeriods}
                          storedMaxBenefitPeriods={storedMaxBenefitPeriods}
                          calculatingRateKeys={calculatingRateKeys}
                          rateFrequency={rateFrequency}
                          frequencyCalculating={frequencyCalculating}
                          onToggleApplicant={onToggleApplicant}
                          onAmountChange={onAmountChange}
                          onRiderToggle={onRiderToggle}
                          onRiderAmountChange={onRiderAmountChange}
                          onWaitingPeriodChange={onWaitingPeriodChange}
                          onMaxBenefitPeriodChange={onMaxBenefitPeriodChange}
                          getVisibleApplicants={getVisibleApplicants}
                          calcApplicantPremium={calcApplicantPremium}
                          generateAmountChoices={generateAmountChoices}
                        />
                      ))}
                    </CategoryCard>
                  </Stack>
                );
              })}
              {allCategoriesIneligible && (
                <Alert
                  severity="error"
                  sx={{
                    borderRadius: 2,
                    "& .MuiAlert-message": { width: "100%" },
                  }}
                >
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    You are not eligible for any coverage options
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    Based on your answers, you are not currently eligible for
                    any available coverage. Please contact us for assistance.
                  </Typography>
                  {activeClient.support.phoneDisplay && (
                    <Typography variant="body2">
                      Phone: {activeClient.support.phoneDisplay}
                    </Typography>
                  )}
                  {activeClient.support.email && (
                    <Typography variant="body2">
                      Email: {activeClient.support.email}
                    </Typography>
                  )}
                </Alert>
              )}
            </Stack>
          </Collapse>
        </Box>
      </Box>

      {/* Estimated cost section (always below products) */}
      <Box sx={{ mt: 3 }}>
        <TotalCostCart
          categoryProducts={categoryProducts}
          selectedCoverageIds={selectedCoverageIds}
          productApplicants={productApplicants}
          calculatingRateKeys={calculatingRateKeys}
          frequencyCalculating={frequencyCalculating}
          selectionCalculating={selectionCalculating}
          rateFrequency={rateFrequency}
          showRateFrequencyToggle={showRateFrequencyToggle}
          grandTotal={grandTotal}
          onFrequencyToggle={onFrequencyToggle}
          calcCoveragePremium={calcCoveragePremium}
          isCoverageCalculating={isCoverageCalculating}
        />
      </Box>
    </>
  );
}

// ── Product Card ──────────────────────────────────────────────────────────────

type ProductCardProps = {
  coverage: ProductCatalogProps["categoryProducts"][number];
  productApplicants: Record<string, CoverageApplicantId[]>;
  storedAmounts: Record<string, number>;
  storedRiders: Record<string, boolean>;
  storedRiderAmounts: Record<string, number>;
  storedWaitingPeriods: Record<string, string>;
  storedMaxBenefitPeriods: Record<string, string>;
  calculatingRateKeys: Set<string>;
  rateFrequency: EstimatedRateFrequency;
  frequencyCalculating: boolean;
  onToggleApplicant: ProductCatalogProps["onToggleApplicant"];
  onAmountChange: ProductCatalogProps["onAmountChange"];
  onRiderToggle: ProductCatalogProps["onRiderToggle"];
  onRiderAmountChange: ProductCatalogProps["onRiderAmountChange"];
  onWaitingPeriodChange: ProductCatalogProps["onWaitingPeriodChange"];
  onMaxBenefitPeriodChange: ProductCatalogProps["onMaxBenefitPeriodChange"];
  getVisibleApplicants: ProductCatalogProps["getVisibleApplicants"];
  calcApplicantPremium: ProductCatalogProps["calcApplicantPremium"];
  generateAmountChoices: ProductCatalogProps["generateAmountChoices"];
};

function ProductCard({
  coverage,
  productApplicants,
  storedAmounts,
  storedRiders,
  storedRiderAmounts,
  storedWaitingPeriods,
  storedMaxBenefitPeriods,
  calculatingRateKeys,
  rateFrequency,
  frequencyCalculating,
  onToggleApplicant,
  onAmountChange,
  onRiderToggle,
  onRiderAmountChange,
  onWaitingPeriodChange,
  onMaxBenefitPeriodChange,
  getVisibleApplicants,
  calcApplicantPremium,
  generateAmountChoices,
}: ProductCardProps) {
  const client = getActiveClient();
  const breakdownConfig = client.coverages.productEstimatedCostBreakdown;
  const resolvedSectionTitles = getResolvedApplicantSectionTitles(
    client.applicantLabels,
  );
  const visibleApplicants = getVisibleApplicants(
    coverage.applicants,
    coverage.id,
  );
  const currentApplicants = productApplicants[coverage.id] ?? [];
  const hasAnyApplicantSelected = currentApplicants.length > 0;
  const amountLabel = getBenefitAmountLabel(coverage.categoryId);
  const rateSuffix = rateFrequency === "annual" ? "/yr" : "/mo";
  const isMultiApplicant = visibleApplicants.length > 1;

  const premiumCost = currentApplicants.reduce((sum, applicantId) => {
    const key = `${coverage.id}:${applicantId}`;
    const amount = storedAmounts[key] ?? 0;
    if (amount <= 0) return sum;
    return sum + estimateMonthlyPremium(coverage.categoryId, amount);
  }, 0);

  const riderItems = collectBreakdownRiderItems({
    coverage,
    currentApplicants,
    storedAmounts,
    storedRiders,
    storedRiderAmounts,
    isMultiApplicant,
    breakdownConfig,
  });

  const policyFeeLabel =
    breakdownConfig?.policyFee?.label ?? "Non-member policy fee";
  const policyFeeAmount = toMonthlyAmount(breakdownConfig?.policyFee?.amount);
  const shouldShowBreakdown =
    hasAnyApplicantSelected &&
    breakdownConfig?.enabled === true &&
    (premiumCost > 0 || riderItems.length > 0 || policyFeeAmount > 0);

  return (
    <ProductCardSurface
      selected={hasAnyApplicantSelected}
      sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}
    >
      {/* Product title / subtitle */}
      <Stack spacing={0.25}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          spacing={1}
        >
          <Typography variant="productNameLabel">
            {coverage.name}
            {coverage.underwritingType === "QD" && <QuickDecisionIndicator />}
          </Typography>
          {coverage.featured && <FeaturedBadge />}
        </Stack>
        <Typography variant="body2" color="text.secondary">
          {coverage.description ?? coverage.definition}
        </Typography>
      </Stack>

      {/* Product-level warning alert */}
      {coverage.productWarning && (
        <Alert
          severity={coverage.productWarning.severity}
          sx={{ borderRadius: 2 }}
        >
          {coverage.productWarning.title && (
            <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
              {coverage.productWarning.title}
            </Typography>
          )}
          {coverage.productWarning.message}
        </Alert>
      )}

      {/* Product-level additional content */}
      {coverage.productContent && coverage.productContent.length > 0 && (
        <Box
          sx={{
            backgroundColor: "#fff",
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 2,
            p: 2,
          }}
        >
          {coverage.productContent.map((block, i) => {
            if (typeof block === "string") {
              return (
                <Typography key={i} variant="caption" sx={{ mb: 1 }}>
                  {block}
                </Typography>
              );
            }
            switch (block.type) {
              case "heading":
                return (
                  <Typography
                    key={i}
                    variant="subtitle1"
                    fontWeight="bold"
                    sx={{ textAlign: "center", mb: 0.5 }}
                  >
                    {block.text}
                  </Typography>
                );
              case "paragraph":
                return (
                  <Typography key={i} variant="body1" sx={{ mb: 1.5 }}>
                    {block.text}
                  </Typography>
                );
              case "list":
                return (
                  <Box key={i} component="ul" sx={{ pl: 2.5, mb: 1.5, mt: 0 }}>
                    {block.items.map((item, j) => (
                      <Typography
                        key={j}
                        component="li"
                        variant="body1"
                        sx={{ mb: 0.5 }}
                      >
                        {item}
                      </Typography>
                    ))}
                  </Box>
                );
              case "section":
                return (
                  <Box key={i} sx={{ mb: 1.5 }}>
                    <Typography
                      variant="subtitle1"
                      fontWeight="bold"
                      sx={{ mb: 0.5 }}
                    >
                      {block.heading}
                    </Typography>
                    {block.body.map((line, j) => (
                      <Typography key={j} variant="body1" sx={{ mb: 0.5 }}>
                        {line}
                      </Typography>
                    ))}
                  </Box>
                );
              default:
                return null;
            }
          })}
        </Box>
      )}

      {/* Per-applicant sections */}
      <Stack spacing={isMultiApplicant ? 3 : 2} sx={{ mt: 1 }}>
        {visibleApplicants.map((applicantId) => {
          const isSelected = currentApplicants.includes(applicantId);
          const sectionId = coverageApplicantToSection[applicantId];
          const key = `${coverage.id}:${applicantId}`;
          const choices = generateAmountChoices(coverage, applicantId);
          const currentAmount = storedAmounts[key] ?? 0;
          const hasAmountSelection = storedAmounts[key] != null;
          const selectValue = hasAmountSelection ? currentAmount : "";
          const isCalculatingRate = calculatingRateKeys.has(key);
          const premium = calcApplicantPremium(coverage, applicantId);
          const displayedPremium = getDisplayedPremium(premium, rateFrequency);
          const applicantNote = coverage.applicantNotes?.[applicantId];

          return (
            <Box key={applicantId}>
              {isMultiApplicant && (
                <ApplicantSectionLabel
                  label={resolvedSectionTitles[sectionId]}
                  icon={applicantIcons[sectionId]}
                  sx={{ mb: 1.5 }}
                />
              )}

              {/* Applicant-level info note */}
              {applicantNote && (
                <Alert severity="info" sx={{ borderRadius: 2, mb: 1.5 }}>
                  {applicantNote}
                </Alert>
              )}

              {/* Benefit amount & cost */}
              <Stack spacing={1.5} sx={{ mt: 1.5 }}>
                <FormControl fullWidth margin="normal">
                  <InputLabel>{amountLabel}</InputLabel>
                  <Select
                    label={amountLabel}
                    value={selectValue}
                    displayEmpty={false}
                    onChange={(e) =>
                      onAmountChange(key, Number(e.target.value))
                    }
                  >
                    {choices.map((amt) => (
                      <MenuItem key={amt} value={amt}>
                        {formatUSD(amt, 0)}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {/* Add coverage button */}
                <SelectionGroup>
                  <Checkbox
                    checked={isSelected}
                    onChange={() => onToggleApplicant(coverage.id, applicantId)}
                    size="small"
                    sx={{
                      p: 0,
                      pointerEvents: "none",
                      color: "text.primary",
                      "&.Mui-checked": { color: "primary.main" },
                    }}
                  />
                  <Typography variant="subtitle2" sx={{ flex: 1 }}>
                    Add coverage
                  </Typography>
                  {isSelected ? (
                    <Chip
                      label="Added"
                      size="small"
                      color="success"
                      variant="outlined"
                      sx={{
                        height: 22,
                        "& .MuiChip-label": {
                          fontSize: "0.7rem",
                          fontWeight: 600,
                          px: 1,
                        },
                      }}
                    />
                  ) : (
                    <Chip
                      label="Add"
                      size="small"
                      color="success"
                      sx={{
                        height: 22,
                        "& .MuiChip-label": {
                          fontSize: "0.7rem",
                          fontWeight: 600,
                          px: 1,
                        },
                      }}
                    />
                  )}
                </SelectionGroup>

                {/* Additional fields when applicant is selected */}
                {isSelected && currentAmount > 0 && (
                  <>
                    {/* Waiting Period (DI and OO) */}
                    {coverage.waitingPeriodOptions &&
                      (coverage.categoryId === "DI" ||
                        coverage.categoryId === "OO") && (
                        <FormControl fullWidth margin="normal">
                          <InputLabel>Waiting Period</InputLabel>
                          <Select
                            label="Waiting Period"
                            value={
                              storedWaitingPeriods[coverage.id] ??
                              coverage.waitingPeriodOptions[0].value
                            }
                            onChange={(e) =>
                              onWaitingPeriodChange(
                                coverage.id,
                                e.target.value as string,
                              )
                            }
                          >
                            {coverage.waitingPeriodOptions.map((opt) => (
                              <MenuItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </MenuItem>
                            ))}
                          </Select>
                          <FormHelperText>
                            The number of consecutive days you must be totally
                            disabled by a covered illness or injury and not
                            gainfully employed in any occupation before benefits
                            commence. Coverage with a longer waiting period is
                            less expensive.
                          </FormHelperText>
                        </FormControl>
                      )}

                    {/* Maximum Benefit Period (OO only) */}
                    {coverage.categoryId === "OO" &&
                      coverage.maxBenefitPeriodOptions && (
                        <FormControl fullWidth margin="normal">
                          <InputLabel>Maximum Benefit Period</InputLabel>
                          <Select
                            label="Maximum Benefit Period"
                            value={
                              storedMaxBenefitPeriods[coverage.id] ??
                              coverage.maxBenefitPeriodOptions[0].value
                            }
                            onChange={(e) =>
                              onMaxBenefitPeriodChange(
                                coverage.id,
                                e.target.value as string,
                              )
                            }
                          >
                            {coverage.maxBenefitPeriodOptions.map((opt) => (
                              <MenuItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </MenuItem>
                            ))}
                          </Select>
                          <FormHelperText>
                            The maximum length of time Office Overhead benefits
                            will be paid for eligible business expenses while
                            disabled.
                          </FormHelperText>
                        </FormControl>
                      )}

                    {/* Optional Benefit(s) — riders */}
                    {coverage.riders && coverage.riders.length > 0 && (
                      <Box>
                        <Typography
                          variant="body2"
                          sx={{ fontWeight: 700, mb: 1 }}
                        >
                          Optional Benefit(s)
                        </Typography>
                        <Stack spacing={1}>
                          {coverage.riders.map((rider) => {
                            const riderKey = `${coverage.id}:${rider.id}:${applicantId}`;
                            const isChecked = !!storedRiders[riderKey];

                            return (
                              <Box key={rider.id}>
                                <SelectionGroup>
                                  <Checkbox
                                    checked={isChecked}
                                    onChange={() =>
                                      onRiderToggle(
                                        coverage.id,
                                        rider.id,
                                        applicantId,
                                      )
                                    }
                                    inputProps={{
                                      "aria-label": `${rider.name} selection`,
                                    }}
                                    size="small"
                                    sx={{
                                      p: 0,
                                      pointerEvents: "none",
                                      color: "text.primary",
                                      "&.Mui-checked": {
                                        color: "primary.main",
                                      },
                                    }}
                                  />
                                  <Stack
                                    spacing={0.5}
                                    sx={{ flex: 1, minWidth: 0 }}
                                  >
                                    <Typography
                                      variant="body2"
                                      sx={{ fontWeight: 700 }}
                                    >
                                      {rider.name}
                                    </Typography>
                                    <Typography
                                      variant="body2"
                                      color="text.secondary"
                                    >
                                      {rider.description}
                                    </Typography>
                                  </Stack>
                                </SelectionGroup>

                                {rider.hasAmount &&
                                  isChecked &&
                                  rider.minAmount != null &&
                                  rider.maxAmount != null && (
                                    <FormControl
                                      margin="normal"
                                      sx={{ ml: 4, minWidth: 250 }}
                                    >
                                      <InputLabel>
                                        Rider Benefit Amount
                                      </InputLabel>
                                      <Select
                                        label="Rider Benefit Amount"
                                        value={
                                          storedRiderAmounts[riderKey] ?? 0
                                        }
                                        onChange={(e) =>
                                          onRiderAmountChange(
                                            coverage.id,
                                            rider.id,
                                            applicantId,
                                            Number(e.target.value),
                                          )
                                        }
                                      >
                                        {generateAmountChoices(
                                          {
                                            ...coverage,
                                            minAmount: rider.minAmount,
                                            maxAmount: rider.maxAmount,
                                            amountStep: coverage.amountStep,
                                          },
                                          applicantId,
                                        ).map((amt) => (
                                          <MenuItem key={amt} value={amt}>
                                            {formatUSD(amt, 0)}
                                          </MenuItem>
                                        ))}
                                      </Select>
                                    </FormControl>
                                  )}
                              </Box>
                            );
                          })}
                        </Stack>
                      </Box>
                    )}
                  </>
                )}

                {/* Message when amount is $0 */}
                {isSelected && hasAmountSelection && currentAmount === 0 && (
                  <Alert severity="info" icon={false} sx={{ mt: 1 }}>
                    You have selected $0 for this coverage. This means you are
                    not applying for this product. Please ensure your selections
                    look correct.
                  </Alert>
                )}

                {/* Estimated cost */}
                {hasAmountSelection && currentAmount > 0 && (
                  <Stack
                    direction="row"
                    spacing={1}
                    justifyContent="flex-end"
                    alignItems="center"
                    sx={{ minHeight: 21 }}
                  >
                    {isCalculatingRate || frequencyCalculating ? (
                      <CircularProgress
                        size={16}
                        thickness={4}
                        sx={{ color: "primary.main" }}
                      />
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        Est. cost<sup>1</sup>:{" "}
                        <Typography
                          component="span"
                          variant="subtitle2"
                          fontWeight="bold"
                          sx={{ color: "primary.main" }}
                        >
                          {formatUSD(displayedPremium)}
                          {rateSuffix}
                        </Typography>
                      </Typography>
                    )}
                  </Stack>
                )}
              </Stack>
            </Box>
          );
        })}
      </Stack>

      {shouldShowBreakdown && (
        <ProductCostBreakdown
          premiumCost={premiumCost}
          riderItems={riderItems}
          policyFee={
            policyFeeAmount > 0
              ? { label: policyFeeLabel, amount: policyFeeAmount }
              : undefined
          }
          rateFrequency={rateFrequency}
        />
      )}
    </ProductCardSurface>
  );
}
