import { requirementText } from "../../domain/requirementContent";
import { requirementCoverageControl } from "../../domain/requirementFields";
import { combineRateDisplays, rateDisplayForAmount, type RateDisplayState } from '../../domain/rateDisplay';
import { orderCoveragePresentation } from "../../domain/coveragePresentation";
import EstimatedRate from "./EstimatedRate";
import { getRiderOnlyOptions, selectedRiderOnly } from "../../domain/coverageRiderOnly";
import { applicationRiderOptions } from "../../domain/applicationRiders";
import type { resolveApplicationCoverage } from "../../domain/coverageRuntime";
import { residencyExclusionDiagnostic } from "../../domain/residencyPolicy";
import {
  Alert,
  Box,
  CircularProgress,
  Collapse,
  Stack,
  Typography,
} from "@mui/material";
import FeaturedBadge from "./FeaturedBadge";
import CategoryCard from "../layout/CategoryCard";
import CategoryHeader from "../layout/CategoryHeader";
import { ApplicantSectionLabel } from "../layout/ApplicantSectionDivider";
import ControlledFieldRenderer from "../forms/ControlledFieldRenderer";
import ProductCardSurface from "../layout/ProductCard";
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
import { formatUSD } from "../../utils/formatUSD";
import CoverageCart from "./CoverageCart";
import ProductCostBreakdown, {
  type ProductCostBreakdownItem,
} from "./ProductCostBreakdown";
import {
  getDisplayedPremium,
  } from "../../utils/coverageDisplay";
import { baseMonthlyPremium, riderMonthlyPremium } from "../../domain/pricing";

type ResolvedCoverage = import("../../domain/coverage").CoverageDefinition & { featured: boolean };

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
        requirementText("coverage.rider.child-fallback");
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

      const riderPremium = riderMonthlyPremium(coverage.categoryId, { amount: riderAmount, premiumFactor: rider.premiumFactor });
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

const applicantCheckboxLabels = { member: requirementText("people.self"), spouse: requirementText("people.spouse"), child: requirementText("people.child") };

export type ProductPresentation = {
  productNames?: Record<string, string>;
  coverageConfig: import("../../config/clients/types").ClientCoverages;
  applicantLabels?: import("../../config/clients/types").ClientApplicantLabels;
  helpPhone?: import("../../config/clients/types").ClientConfig["support"]["helpPhone"];
  featuredProduct?: string | null;
  aggregateNotes?: Partial<Record<CoverageCategoryId, import("../../config/coverageConstants").MaxAggregateNote | null>>;
  ratesSuppressed?: boolean;
  ratePresentations?: Record<string, ReturnType<typeof import("../../domain/ratePresentation").resolveRatePresentation>>;
};
const defaultPresentation: ProductPresentation = { coverageConfig: { categories: [], enabled: [] } };
type ProductCatalogProps = {
  presentation?: ProductPresentation;
  applicationValues?: import("../../app/ApplicationFormContext").ApplicationFormValues;
  getRateDisplay?: (productId: string, applicant: CoverageApplicantId) => RateDisplayState;
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
    getRateDisplay,
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

  const presentation = props.presentation ?? defaultPresentation;
  const { coverageConfig } = presentation;

  const categorySectionLabelOverrides = coverageConfig.categorySectionLabels;

  const additionalCoverageWarningMode =
    coverageConfig.additionalCoverageWarning ?? "applyForAdditional";

  const additionalCoverageWarningText =
    additionalCoverageWarningMode === "applyForTotal"
      ? requirementText("coverage.increase.total-note")
      : requirementText("coverage.increase.additional-note");

  const orderedPresentation = orderCoveragePresentation(categoryProducts, coverageConfig, presentation.featuredProduct ?? null);
  const categoryDisplayOrder = orderedPresentation.categories;
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
        <Typography variant="body2" color="text.secondary">{requirementText("coverage.product-catalog.loading-your-coverage-options")}</Typography>
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
      <Typography variant="h5" sx={{ mb: 2 }}>{requirementText("coverage.product-catalog.your-eligible-coverage-options")}</Typography>

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
                      <Alert severity="warning">{requirementText("coverage.product-catalog.based-on-your-answers-you-are-not-eligible")}{" "}
                        {category.label}{requirementText("coverage.product-catalog.coverage-at-this-time")}</Alert>
                    </Stack>
                  );
                }

                const productsInCategory = orderedPresentation.products.filter(
                  (c) => c.categoryId === categoryId && getVisibleApplicants(c.applicants, c.id).some(applicant => getCoverageBehavior?.(c, applicant).eligibility !== "ineligible"),
                );
                if (productsInCategory.length === 0) return null;

                const notes = presentation.aggregateNotes?.[categoryId];

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
                          presentation={presentation}
                          applicationValues={props.applicationValues}
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
                          getRateDisplay={getRateDisplay}
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
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>{requirementText("coverage.product-catalog.you-are-not-eligible-for-any-coverage-options")}</Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>{requirementText("coverage.product-catalog.based-on-your-answers-you-are-not-currently")}</Typography>
                  {activeClient.support.phoneDisplay && (
                    <Typography variant="body2">{requirementText("coverage.product-catalog.phone")}{activeClient.support.phoneDisplay}
                    </Typography>
                  )}
                  {activeClient.support.email && (
                    <Typography variant="body2">{requirementText("coverage.product-catalog.email")}{activeClient.support.email}
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
        {!presentation.ratesSuppressed && <CoverageCart
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
          getCoverageRateDisplay={getRateDisplay ? id => combineRateDisplays((productApplicants[id] ?? []).map(applicant => getRateDisplay(id, applicant))) : undefined}
          isCoverageCalculating={isCoverageCalculating}
        />}
      </Box>
    </>
  );
}

// ── Product Card ──────────────────────────────────────────────────────────────

type ProductCardProps = {
  presentation?: ProductPresentation;
  applicationValues?: ProductCatalogProps["applicationValues"];
  getCoverageBehavior?: ProductCatalogProps["getCoverageBehavior"];
  getRateDisplay?: ProductCatalogProps["getRateDisplay"];
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
  presentation = defaultPresentation, applicationValues = {},
  getCoverageBehavior,
  getRateDisplay,
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
  const ratePresentation = presentation.ratePresentations?.[coverage.id];
  const ratesSuppressed = presentation.ratesSuppressed;
  const breakdownConfig = presentation.coverageConfig.productEstimatedCostBreakdown;
  const resolvedSectionTitles = getResolvedApplicantSectionTitles(presentation.applicantLabels);
  const visibleApplicants = getVisibleApplicants(
    coverage.applicants,
    coverage.id,
  ).filter(applicant => getCoverageBehavior?.(coverage, applicant).eligibility !== "ineligible");
  const currentApplicants = productApplicants[coverage.id] ?? [];
  const hasAnyApplicantSelected = currentApplicants.length > 0;
  const amountLabel = requirementCoverageControl("coverage-amount").label;
  const rateSuffix = rateFrequency === "annual" ? "/yr" : "/mo";
  const isMultiApplicant = visibleApplicants.length > 1;

  const premiumCost = currentApplicants.reduce((sum, applicantId) => {
    const key = `${coverage.id}:${applicantId}`;
    const amount = storedAmounts[key] ?? 0;
    if (amount <= 0) return sum;
    return sum + baseMonthlyPremium(coverage.categoryId, amount);
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
    breakdownConfig?.policyFee?.label ?? requirementText("coverage.policy-fee");
  const policyFeeAmount = toMonthlyAmount(breakdownConfig?.policyFee?.amount);
  const shouldShowBreakdown =
    hasAnyApplicantSelected &&
    !currentApplicants.some(applicant => selectedRiderOnly(coverage, applicant, applicationValues)) &&
    breakdownConfig?.enabled === true &&
    (premiumCost > 0 || riderItems.length > 0 || policyFeeAmount > 0);

  if (!visibleApplicants.length) return null;

  return (
    <ProductCardSurface
      selected={hasAnyApplicantSelected}
      productName={presentation.productNames?.[coverage.id] ?? coverage.name}
      brochureUrl={coverage.brochureUrl}
      description={coverage.description ?? coverage.definition}
      quickDecision={!coverage.underwritingBands?.length && coverage.underwritingType === "QD"}
      headerAction={coverage.featured && <FeaturedBadge />}
    >
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

              {behavior?.messages.filter(message => message !== residencyExclusionDiagnostic).map(message => <Alert key={message} severity="warning" sx={{ mb: 1 }}>{message}</Alert>)}
              {behavior?.notices.map(notice => <Alert key={notice} severity="info" sx={{ mb: 1 }}>{notice}</Alert>)}
              {behavior?.underwriting.status === "unresolved" && <Alert severity="warning">{requirementText("coverage.product-catalog.underwriting-requirements-for-this-selection-are-unresolved-contact")}</Alert>}
              {/* Benefit amount & cost */}
              <Stack spacing={1.5} sx={{ mt: 1.5 }}>
                <ControlledFieldRenderer
                  field={{ ...requirementCoverageControl("coverage-amount", applicantId), id: `${key}-amount`, label: amountLabel, disabled: behavior?.amountControl?.locked, options: [
                    ...standaloneOptions.map(rider => ({ value: `rider-only:${rider.id}`, label: requirementText("coverage.rider.only-label", { rider: rider.name }) })),
                    ...choices.filter(amount => amount !== 0 || !standaloneOptions.length).map(amount => ({ value: String(amount), label: formatUSD(amount, 0) })),
                  ] }}
                  value={String(selectValue)}
                  onChange={next => {
                    const value = String(next);
                    if (value.startsWith("rider-only:")) onAmountChange(key, 0, value.slice("rider-only:".length));
                    else onAmountChange(key, Number(value));
                  }}
                />
                <Box sx={{ pt: 1.5 }}>
                  <ControlledFieldRenderer
                    field={{ ...requirementCoverageControl("add-coverage", applicantId), id: `${key}-selected`, disabled: !isSelected && applicantId === "child" && behavior?.selectable === false }}
                    value={isSelected}
                    onChange={() => onToggleApplicant(coverage.id, applicantId)}
                  />
                </Box>

                {/* Additional fields when applicant is selected */}
                {((isSelected && currentAmount > 0) || isRiderOnly) && (
                  <>
                    {/* Waiting Period (DI and OO) */}
                    {waitingPeriodOptions && waitingPeriodOptions.length > 0 &&
                      (coverage.categoryId === "DI" ||
                        coverage.categoryId === "OO") && (
                        <ControlledFieldRenderer
                          field={{
                            ...requirementCoverageControl("waiting-period", applicantId === "child" ? "member" : applicantId), id: `${applicantOptionKey}-waiting-period`,
                            disabled: isRiderOnly || !!behavior?.waitingPeriod.requiredValue, options: waitingPeriodOptions,
                            helperText: requirementCoverageControl("waiting-period").helperText,
                          }}
                          value={behavior?.waitingPeriod.requiredValue ?? storedWaitingPeriods[applicantOptionKey] ?? storedWaitingPeriods[coverage.id] ?? waitingPeriodOptions[0].value}
                          onChange={value => onWaitingPeriodChange(coverage.id, String(value), applicantId)}
                        />
                      )}

                    {/* Maximum Benefit Period (OO only) */}
                    {(coverage.categoryId === "OO" ||
                      coverage.categoryId === "DI") &&
                      maxBenefitPeriodOptions && maxBenefitPeriodOptions.length > 0 && (
                        <ControlledFieldRenderer
                          field={{
                            ...requirementCoverageControl("benefit-option", applicantId === "child" ? "member" : applicantId),
                            id: `${applicantOptionKey}-max-benefit-period`,
                            disabled: isRiderOnly || !!behavior?.benefitPeriod.requiredValue, options: maxBenefitPeriodOptions,
                            helperText: coverage.categoryId === "OO" ? requirementText("coverage.product-catalog.the-maximum-length-of-time-office-overhead-benefits") : undefined,
                          }}
                          value={behavior?.benefitPeriod.requiredValue ?? storedMaxBenefitPeriods[applicantOptionKey] ?? storedMaxBenefitPeriods[coverage.id] ?? maxBenefitPeriodOptions[0].value}
                          onChange={value => onMaxBenefitPeriodChange(coverage.id, String(value), applicantId)}
                        />
                      )}
                  </>
                )}

                {/* Offered riders remain visible before Add coverage. */}
                {coverage.riders && coverage.riders.length > 0 && (
                  <Box>
                    <Typography
                      variant="body2"
                      sx={{ fontWeight: 700, mb: 1 }}
                    >{requirementText("coverage.product-catalog.optional-benefit-s")}</Typography>
                    <Stack spacing={1}>
                      {coverage.riders
                        .filter(
                          (rider) =>
                            (!rider.applicants || rider.applicants.includes(applicantId)) && (!rider.dependentApplicant || Array.isArray(applicationValues.dependents) && applicationValues.dependents.includes(rider.dependentApplicant)),
                        )
                        .map((rider) => {
                        const riderKey = `${coverage.id}:${rider.id}:${applicantId}`;
                        const isChecked = !!storedRiders[riderKey];
                        const options = applicationRiderOptions(coverage, rider, applicantId, applicationValues);

                        return (
                          <Box key={rider.id} sx={rider.displayAsProduct ? { border: "1px solid", borderColor: "divider", borderRadius: 1, p: 2 } : undefined}>
                            {rider.dependentApplicant && <ApplicantSectionLabel label={resolvedSectionTitles[coverageApplicantToSection[rider.dependentApplicant]]} sx={{ mb: 1 }} />}
                            <ControlledFieldRenderer
                              field={{ id: `${riderKey}-selected`, label: rider.name, inputType: "checkbox", helperText: rider.description, disabled: isRiderOnly || rider.included || !options.available }}
                              value={isChecked}
                              onChange={() => onRiderToggle(coverage.id, rider.id, applicantId)}
                            />

                            {rider.hasAmount &&
                              isChecked &&
                              rider.coverageAmounts && (
                                <ControlledFieldRenderer
                                  field={{
                                    ...requirementCoverageControl("rider-amount"), id: `${riderKey}-amount`, label: rider.amountLabel ?? requirementCoverageControl("rider-amount").label,
                                    disabled: isRiderOnly && standalone?.id !== rider.id,
                                    options: [...(rider.included || rider.dependentApplicant || isRiderOnly || options.configured ? [] : [0]), ...options.choices].map(amount => ({ value: String(amount), label: formatUSD(amount, 0) })),
                                  }}
                                  value={String(storedRiderAmounts[riderKey] ?? rider.defaultAmount ?? 0)}
                                  onChange={value => onRiderAmountChange(coverage.id, rider.id, applicantId, Number(value))}
                                />
                              )}
                            {!ratesSuppressed && rider.referenceRateTable && <EstimatedRate display={{ status: 'reference-table', table: rider.referenceRateTable }} />}
                          </Box>
                        );
                      })}
                    </Stack>
                  </Box>
                )}

                {/* Message when amount is $0 */}
                {isSelected && hasAmountSelection && currentAmount === 0 && !isRiderOnly && (
                  <Alert severity="info" icon={false} sx={{ mt: 1 }}>{requirementText("coverage.product-catalog.you-have-selected-0-for-this-coverage-this")}</Alert>
                )}

                {/* Estimated cost */}
                {hasAmountSelection && currentAmount > 0 && !ratesSuppressed && (
                  <Stack
                    direction="row"
                    spacing={1}
                    justifyContent="flex-end"
                    alignItems="center"
                    sx={{ minHeight: 21 }}
                  >
                    <EstimatedRate
                      display={getRateDisplay?.(coverage.id, applicantId) ?? (ratePresentation?.referenceTable ? { status: 'reference-table', table: ratePresentation.referenceTable } : ratePresentation?.rateArea === 'hidden' ? { status: 'hidden' } : rateDisplayForAmount(displayedPremium))}
                      amount={displayedPremium} suffix={rateSuffix} isCalculating={isCalculatingRate || frequencyCalculating}
                      label={<>{requirementText("coverage.estimated-cost")}<sup>1</sup>:</>} appearance="product"
                    />
                  </Stack>
                )}
              </Stack>
            </Box>
          );
        })}
      </Stack>

      {shouldShowBreakdown && !ratesSuppressed && (
        <ProductCostBreakdown
          helpPhone={presentation.helpPhone}
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
