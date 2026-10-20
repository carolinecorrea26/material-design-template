import { orderCoveragePresentation } from "../../domain/coveragePresentation";
import EstimatedRate from "../ui/EstimatedRate";
import { useApplicationForm } from "../../app/ApplicationFormContext";
import { getPrototypeLibrary } from "../../domain/prototypeLibrary";
import { resolveRatePresentation } from "../../domain/ratePresentation";
import ReferenceRateTableLink from "../ui/ReferenceRateTableLink";
import { getCoverageAmountChoices } from "../../utils/coverageAmounts";
import { getRiderOnlyOptions, selectedRiderOnly } from "../../domain/coverageRiderOnly";
import type { resolveApplicationCoverage } from "../../domain/coverageRuntime";
import { residencyExclusionDiagnostic } from "../../domain/residencyPolicy";
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
  Link,
  MenuItem,
  Select,
  Stack,
  Typography,
} from "@mui/material";
import FeaturedBadge from "../ui/FeaturedBadge";
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
import CoverageCart from "../ui/CoverageCart";
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
import { getActiveSite } from "../../data";

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
      if (rider.applicants && !rider.applicants.includes(applicantId)) continue;
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
  getCoverageBehavior?: (product: ResolvedCoverage, applicant: CoverageApplicantId) => ReturnType<typeof resolveApplicationCoverage>;
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
  onAmountChange: (key: string, amount: number, riderOnlyId?: string) => void;
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
  onWaitingPeriodChange: (
    coverageId: string,
    value: string,
    applicantId?: CoverageApplicantId,
  ) => void;
  onMaxBenefitPeriodChange: (
    coverageId: string,
    value: string,
    applicantId?: CoverageApplicantId,
  ) => void;
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
    getCoverageBehavior,
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
    getVisibleApplicants,
    calcApplicantPremium,
    generateAmountChoices,
    hasSpouse,
  } = props;

  const siteId = getActiveSite().id;
  const client = getActiveClient();

  const categorySectionLabelOverrides = client.coverages.categorySectionLabels;

  const additionalCoverageWarningMode =
    client.coverages.additionalCoverageWarning ?? "applyForAdditional";

  const additionalCoverageWarningText =
    additionalCoverageWarningMode === "applyForTotal"
      ? "If you're increasing your current coverage, enter the total amount of coverage you want, including the coverage you already have."
      : "If you already have coverage and want to increase it, apply for only the additional coverage amount you want.";

  const categoryDisplayOrder = orderCoveragePresentation(categoryProducts, client.coverages, new URLSearchParams(window.location.search).get("featured_prod")).categories;
  const orderedCategories = [...selectedCategories].sort((a, b) => categoryDisplayOrder.indexOf(a) - categoryDisplayOrder.indexOf(b));

  if (selectedCategories.length === 0 || !showProducts) return null;

  if (productsLoading) {
    return (
      <Stack
        spacing={2}
        alignItems="center"
        sx={{ py: 6 }}
        role="status"
        aria-live="polite"
      >
        <CircularProgress size={32} aria-hidden />
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
        Your eligible coverage options:
      </Typography>

      {/* QuickDecision note */}
      {hasQdCategorySelected && <QuickDecisionInfoBox />}

      {/* Coverage increase warning */}
      <Alert severity="warning" sx={{ mb: 2 }}>
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
                      <Alert severity="warning">
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

                const notes = getMaxAggregateNotes(categoryId, siteId);

                return (
                  <Stack spacing={2} key={categoryId}>
                    <CategoryCard
                      label={getCoverageCategorySectionLabel(
                        categoryId,
                        categorySectionLabelOverrides,
                      )}
                      icon={category.icon}
                    >
                      {notes && (
                        <Alert severity="info">
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
                          getCoverageBehavior={getCoverageBehavior}
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
        <CoverageCart
          variant="inline"
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
  getCoverageBehavior?: ProductCatalogProps["getCoverageBehavior"];
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

export function ProductCard({
  getCoverageBehavior,
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
  const { values: applicationValues } = useApplicationForm();
  const library = getPrototypeLibrary();
  const ratePresentation = library ? resolveRatePresentation(library.site, coverage.id) : null;
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
  const amountLabel = coverage.options.find(option => option.id === "amount")?.label ?? getBenefitAmountLabel(coverage.categoryId);
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
    !currentApplicants.some(applicant => selectedRiderOnly(coverage, applicant, applicationValues)) &&
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
            {coverage.brochureUrl ? (
              <Link
                href={coverage.brochureUrl}
                target="_blank"
                rel="noopener noreferrer"
                color="inherit"
                underline="hover"
              >
                {coverage.name}
              </Link>
            ) : (
              coverage.name
            )}
            {!coverage.underwritingBands?.length && coverage.underwritingType === "QD" && <QuickDecisionIndicator />}
          </Typography>
          {coverage.featured && <FeaturedBadge />}
        </Stack>
        <Typography variant="body2" color="text.secondary">
          {coverage.description ?? coverage.definition}
        </Typography>
      </Stack>

      {/* Product-level warning alert */}
      {coverage.productWarning && (
        <Alert severity={coverage.productWarning.severity}>
          {coverage.productWarning.title && (
            <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>
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
            backgroundColor: "background.paper",
            border: "1px solid",
            borderColor: "divider",
            borderRadius: "16px",
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
                    fontWeight={700}
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
                      fontWeight={700}
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
          const behavior = getCoverageBehavior?.(coverage, applicantId);
          const isSelected = currentApplicants.includes(applicantId);
          const sectionId = coverageApplicantToSection[applicantId];
          const key = `${coverage.id}:${applicantId}`;
          const choices = generateAmountChoices(coverage, applicantId);
          const standaloneOptions = getRiderOnlyOptions(coverage, applicantId);
          const standalone = selectedRiderOnly(coverage, applicantId, applicationValues);
          const isRiderOnly = !!standalone;
          const currentAmount = storedAmounts[key] ?? 0;
          const hasAmountSelection = storedAmounts[key] != null;
          const selectValue = standalone ? `rider-only:${standalone.id}` : hasAmountSelection && choices.includes(currentAmount) && (currentAmount !== 0 || !standaloneOptions.length) ? currentAmount : "";
          const isCalculatingRate = calculatingRateKeys.has(key);
          const premium = calcApplicantPremium(coverage, applicantId);
          const displayedPremium = getDisplayedPremium(premium, rateFrequency);
          const applicantNote = coverage.applicantNotes?.[applicantId];
          const waitingPeriodOptions = behavior?.waitingPeriod.options ??
            coverage.waitingPeriodOptionsByApplicant?.[applicantId] ??
            coverage.waitingPeriodOptions;
          const maxBenefitPeriodOptions = behavior?.benefitPeriod.options ??
            coverage.maxBenefitPeriodOptionsByApplicant?.[applicantId] ??
            coverage.maxBenefitPeriodOptions;
          const applicantOptionKey = `${coverage.id}:${applicantId}`;

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
                <Alert severity="info" sx={{ mb: 1.5 }}>
                  {applicantNote}
                </Alert>
              )}

              {behavior?.unresolvedRequirements.map(item => <Alert key={item.id} severity="warning" sx={{ mb: 1 }}>{item.description}</Alert>)}
              {behavior?.messages.filter(message => message !== residencyExclusionDiagnostic).map(message => <Alert key={message} severity="warning" sx={{ mb: 1 }}>{message}</Alert>)}
              {behavior?.underwriting.status === "unresolved" && <Alert severity="warning">Underwriting requirements for this selection are unresolved. Contact support before continuing.</Alert>}
              {behavior?.underwriting.underwritingType && <Typography variant="body2">Underwriting: {behavior.underwriting.underwritingType}</Typography>}
              {/* Benefit amount & cost */}
              <Stack spacing={1.5} sx={{ mt: 1.5 }}>
                <FormControl fullWidth margin="normal">
                  <InputLabel id={`${key}-amount-label`}>
                    {amountLabel}
                  </InputLabel>
                  <Select
                    labelId={`${key}-amount-label`}
                    label={amountLabel}
                    value={selectValue}
                    displayEmpty={false}
                    onChange={(e) => {
                      const value = String(e.target.value);
                      if (value.startsWith("rider-only:")) onAmountChange(key, 0, value.slice("rider-only:".length));
                      else onAmountChange(key, Number(value));
                    }}
                  >
                    {standaloneOptions.map(rider => (
                      <MenuItem key={`rider-only:${rider.id}`} value={`rider-only:${rider.id}`}>
                        $0 - Applying for {rider.name} only
                      </MenuItem>
                    ))}
                    {choices.filter(amt => amt !== 0 || !standaloneOptions.length).map((amt) => (
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
                {((isSelected && currentAmount > 0) || isRiderOnly) && (
                  <>
                    {/* Waiting Period (DI and OO) */}
                    {waitingPeriodOptions && waitingPeriodOptions.length > 0 &&
                      (coverage.categoryId === "DI" ||
                        coverage.categoryId === "OO") && (
                        <FormControl fullWidth margin="normal">
                          <InputLabel id={`${coverage.id}-waiting-period-label`}>
                            Waiting Period
                          </InputLabel>
                          <Select
                            labelId={`${coverage.id}-waiting-period-label`}
                            label="Waiting Period"
                            disabled={isRiderOnly || !!behavior?.waitingPeriod.requiredValue}
                            value={
                              behavior?.waitingPeriod.requiredValue ??
                              storedWaitingPeriods[applicantOptionKey] ??
                              storedWaitingPeriods[coverage.id] ??
                              waitingPeriodOptions[0].value
                            }
                            onChange={(e) =>
                              onWaitingPeriodChange(
                                coverage.id,
                                e.target.value as string,
                                applicantId,
                              )
                            }
                            aria-describedby={`${coverage.id}-waiting-period-helper`}
                          >
                            {waitingPeriodOptions.map((opt) => (
                              <MenuItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </MenuItem>
                            ))}
                          </Select>
                          <FormHelperText id={`${coverage.id}-waiting-period-helper`}>
                            The number of consecutive days you must be totally
                            disabled by a covered illness or injury and not
                            gainfully employed in any occupation before benefits
                            commence. Coverage with a longer waiting period is
                            less expensive.
                          </FormHelperText>
                        </FormControl>
                      )}

                    {/* Maximum Benefit Period (OO only) */}
                    {(coverage.categoryId === "OO" ||
                      coverage.categoryId === "DI") &&
                      maxBenefitPeriodOptions && maxBenefitPeriodOptions.length > 0 && (
                        <FormControl fullWidth margin="normal">
                          <InputLabel id={`${coverage.id}-max-benefit-period-label`}>
                            {coverage.categoryId === "DI"
                              ? "Benefit Option"
                              : "Maximum Benefit Period"}
                          </InputLabel>
                          <Select
                            disabled={isRiderOnly || !!behavior?.benefitPeriod.requiredValue}
                            labelId={`${coverage.id}-max-benefit-period-label`}
                            label={
                              coverage.categoryId === "DI"
                                ? "Benefit Option"
                                : "Maximum Benefit Period"
                            }
                            value={
                              behavior?.benefitPeriod.requiredValue ??
                              storedMaxBenefitPeriods[applicantOptionKey] ??
                              storedMaxBenefitPeriods[coverage.id] ??
                              maxBenefitPeriodOptions[0].value
                            }
                            onChange={(e) =>
                              onMaxBenefitPeriodChange(
                                coverage.id,
                                e.target.value as string,
                                applicantId,
                              )
                            }
                            aria-describedby={`${coverage.id}-max-benefit-period-helper`}
                          >
                            {maxBenefitPeriodOptions.map((opt) => (
                              <MenuItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </MenuItem>
                            ))}
                          </Select>
                          {coverage.categoryId === "OO" && (
                            <FormHelperText id={`${coverage.id}-max-benefit-period-helper`}>
                              The maximum length of time Office Overhead benefits
                              will be paid for eligible business expenses while
                              disabled.
                            </FormHelperText>
                          )}
                        </FormControl>
                      )}
                  </>
                )}

                {/* Offered riders remain visible before Add coverage. */}
                {coverage.riders && coverage.riders.length > 0 && (
                  <Box>
                    <Typography
                      variant="body2"
                      sx={{ fontWeight: 700, mb: 1 }}
                    >
                      Optional Benefit(s)
                    </Typography>
                    <Stack spacing={1}>
                      {coverage.riders
                        .filter(
                          (rider) =>
                            (!rider.applicants || rider.applicants.includes(applicantId)) && (!rider.dependentApplicant || Array.isArray(applicationValues.dependents) && applicationValues.dependents.includes(rider.dependentApplicant)),
                        )
                        .map((rider) => {
                        const riderKey = `${coverage.id}:${rider.id}:${applicantId}`;
                        const isChecked = !!storedRiders[riderKey];

                        return (
                          <Box key={rider.id} sx={rider.displayAsProduct ? { border: "1px solid", borderColor: "divider", borderRadius: 1, p: 2 } : undefined}>
                            {rider.dependentApplicant && <ApplicantSectionLabel label={resolvedSectionTitles[coverageApplicantToSection[rider.dependentApplicant]]} sx={{ mb: 1 }} />}
                            <SelectionGroup disabled={isRiderOnly || rider.included}>
                              <Checkbox
                                checked={isChecked}
                                disabled={isRiderOnly || rider.included}
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
                              rider.coverageAmounts && (
                                <FormControl
                                  margin="normal"
                                  sx={{ ml: 4, minWidth: 250 }}
                                >
                                  <InputLabel
                                    id={`${riderKey}-amount-label`}
                                  >
                                    {rider.amountLabel ?? "Rider Benefit Amount"}
                                  </InputLabel>
                                  <Select
                                    disabled={isRiderOnly && standalone?.id !== rider.id}
                                    labelId={`${riderKey}-amount-label`}
                                    label={rider.amountLabel ?? "Rider Benefit Amount"}
                                    value={storedRiderAmounts[riderKey] ?? rider.defaultAmount ?? 0}
                                    onChange={(e) =>
                                      onRiderAmountChange(
                                        coverage.id,
                                        rider.id,
                                        applicantId,
                                        Number(e.target.value),
                                      )
                                    }
                                  >
                                    {[...(rider.included || rider.dependentApplicant || isRiderOnly ? [] : [0]), ...getCoverageAmountChoices({ coverageAmounts: rider.coverageAmounts }, applicantId)].map((amt) => (
                                      <MenuItem key={amt} value={amt}>
                                        {formatUSD(amt, 0)}
                                      </MenuItem>
                                    ))}
                                  </Select>
                                </FormControl>
                              )}
                            {rider.referenceRateTable && <ReferenceRateTableLink table={rider.referenceRateTable} />}
                          </Box>
                        );
                      })}
                    </Stack>
                  </Box>
                )}

                {/* Message when amount is $0 */}
                {isSelected && hasAmountSelection && currentAmount === 0 && !isRiderOnly && (
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
                    {ratePresentation?.referenceTable ? <ReferenceRateTableLink table={ratePresentation.referenceTable} /> : isCalculatingRate || frequencyCalculating ? (
                      <CircularProgress
                        size={16}
                        thickness={4}
                        aria-label="Recalculating estimated cost"
                        sx={{ color: "primary.main" }}
                      />
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        Est. cost<sup>1</sup>:{" "}
                        <EstimatedRate amount={displayedPremium} suffix={rateSuffix} variant="body2" sx={{ color: "primary.main", fontWeight: 700, fontSize: "1.25rem" }} />
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
          helpPhone={client.support.helpPhone}
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
