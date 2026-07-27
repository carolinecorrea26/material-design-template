import { useState } from "react";
import {
  Alert,
  Box,
  Checkbox,
  Chip,
  CircularProgress,
  Collapse,
  Divider,
  FormControl,
  FormHelperText,
  InputLabel,
  Link,
  MenuItem,
  Select,
  Stack,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import FeaturedBadge from "../common/FeaturedBadge";
import OfflineBoltIcon from "@mui/icons-material/OfflineBolt";
import FormSectionTitle from "../forms/SectionTitle";
import SelectableOptionRow from "../forms/OptionRow";
import CoverageCard from "../layout/CoverageCard";
import QuickDecisionIndicator from "../common/QuickDecisionIndicator";
import { QuickDecisionMark } from "../content/QuickDecisionExplainer";
import { getCoverageCategorySectionLabel } from "../../config/coverageCategories";
import {
  applicantSectionTitles,
  coverageApplicantToSection,
} from "../../config/formSectionTitle";
import type {
  CoverageCategoryId,
  CoverageApplicantId,
} from "../../config/coverages/types";
import type { EstimatedRateFrequency } from "../../config/clients/types";
import { getActiveClientCoverages } from "../../config/client/getActiveClientCoverages";
import { getContent } from "../../content";
import { formatUSD } from "../../utils/formatUSD";
import EstimatedCostPanel from "../common/CostSummaryPanel";
import {
  getDisplayedPremium,
  getBenefitAmountLabel,
} from "../../app/useCoverageState";

type ResolvedCoverage = ReturnType<typeof getActiveClientCoverages>[number];
import { getMaxAggregateNotes } from "../../config/coverageConstants";
import { resolveClientId } from "../../config/client/resolveClientId";

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

  // Track expanded/collapsed state per category
  const [expandedCategories, setExpandedCategories] = useState<
    Record<CoverageCategoryId, boolean>
  >({} as Record<CoverageCategoryId, boolean>);

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

  const isCategoryExpanded = (categoryId: CoverageCategoryId) =>
    expandedCategories[categoryId] !== false; // default to expanded

  const toggleCategory = (categoryId: CoverageCategoryId) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [categoryId]: prev[categoryId] === false,
    }));
  };

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
        <Box
          sx={{
            display: "flex",
            alignItems: "flex-start",
            gap: 1,
            p: 2,
            mb: 2,
            borderRadius: 2,
            backgroundColor: "#e6f4ee",
          }}
        >
          <OfflineBoltIcon color="success" sx={{ mt: 0.25, flexShrink: 0 }} />
          <Typography variant="body2" color="text.secondary">
            <Typography
              component="span"
              variant="body2"
              sx={{ fontWeight: 700, color: "success.main" }}
            >
              <QuickDecisionMark />
            </Typography>{" "}
            helps many applicants receive a decision instantly or within a few
            days without a medical exam. This starts with health questions you
            answer online to reduce time needed with phone calls or other follow
            up.{" "}
            <Typography
              component="span"
              role="button"
              tabIndex={0}
              onClick={onQdDrawerOpen}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onQdDrawerOpen();
                }
              }}
              sx={{
                color: "primary.main",
                textDecoration: "underline",
                textUnderlineOffset: "0.12em",
                cursor: "pointer",
                font: "inherit",
                lineHeight: "inherit",
              }}
            >
              Learn more about this process.
            </Typography>
          </Typography>
        </Box>
      )}

      {/* Coverage increase warning */}
      <Alert severity="warning" sx={{ borderRadius: 2, mb: 2 }}>
        If you already have any of the following Insurance and wish to increase
        your current level of coverage, apply only for the additional coverage
        you want.
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
            <Stack spacing={3} divider={<Divider />}>
              {orderedCategories.map((categoryId) => {
                const category = availableCategories.find(
                  (c) => c.id === categoryId,
                );
                if (!category) return null;

                if (categoryEligibility[categoryId] === false) {
                  return (
                    <Stack spacing={2} key={categoryId}>
                      <Stack
                        direction="row"
                        justifyContent="space-between"
                        alignItems="center"
                        gap={2}
                      >
                        <Typography variant="overline">
                          {getCoverageCategorySectionLabel(categoryId)}
                        </Typography>
                        <Link
                          component="button"
                          type="button"
                          variant="caption"
                          underline="none"
                          onClick={() => toggleCategory(categoryId)}
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 0.5,
                            fontWeight: 600,
                            flexShrink: 0,
                          }}
                        >
                          {isCategoryExpanded(categoryId) ? (
                            <>
                              <RemoveIcon sx={{ fontSize: "1rem" }} /> Hide
                            </>
                          ) : (
                            <>
                              <AddIcon sx={{ fontSize: "1rem" }} /> Show
                            </>
                          )}
                        </Link>
                      </Stack>
                      <Collapse in={isCategoryExpanded(categoryId)}>
                        <Alert severity="warning" sx={{ borderRadius: 2 }}>
                          Based on your answers, you are not eligible for{" "}
                          {category.label} coverage at this time.
                        </Alert>
                      </Collapse>
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
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                      gap={2}
                    >
                      <Typography variant="overline">
                        {getCoverageCategorySectionLabel(categoryId)}
                      </Typography>
                      <Link
                        component="button"
                        type="button"
                        variant="body2"
                        underline="none"
                        onClick={() => toggleCategory(categoryId)}
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 0.5,
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          flexShrink: 0,
                        }}
                      >
                        {isCategoryExpanded(categoryId) ? (
                          <>
                            <RemoveIcon sx={{ fontSize: "1rem" }} /> Hide all
                          </>
                        ) : (
                          <>
                            <AddIcon sx={{ fontSize: "1rem" }} /> Show all
                          </>
                        )}
                      </Link>
                    </Stack>
                    <Collapse in={isCategoryExpanded(categoryId)}>
                      <Stack spacing={2}>
                        {notes && (
                          <Alert severity="info" sx={{ borderRadius: 2 }}>
                            <Typography
                              variant="body2"
                              sx={{
                                mb: hasSpouse || notes.child ? 1 : 0,
                              }}
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
                      </Stack>
                    </Collapse>
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
        <EstimatedCostPanel
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
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: "block", mt: 1.5 }}
        >
          <sup>1</sup> Quoted cost is the best rate available. Final cost may
          vary based on gender, health status, and tobacco/nicotine use.
        </Typography>
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
  const visibleApplicants = getVisibleApplicants(
    coverage.applicants,
    coverage.id,
  );
  const currentApplicants = productApplicants[coverage.id] ?? [];
  const hasAnyApplicantSelected = currentApplicants.length > 0;
  const amountLabel = getBenefitAmountLabel(coverage.categoryId);
  const rateSuffix = rateFrequency === "annual" ? "/yr" : "/mo";
  const isMultiApplicant = visibleApplicants.length > 1;

  return (
    <CoverageCard
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
          <Typography variant="subtitle1" fontWeight="bold">
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
        {visibleApplicants.map((applicantId, idx) => {
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
                <>
                  {idx > 0 && <Divider sx={{ mb: 1.5 }} />}
                  <Box sx={{ mb: 1.5 }}>
                    <FormSectionTitle
                      label={applicantSectionTitles[sectionId]}
                    />
                  </Box>
                </>
              )}

              {/* Applicant-level info note */}
              {applicantNote && (
                <Alert severity="info" sx={{ borderRadius: 2, mb: 1.5 }}>
                  {applicantNote}
                </Alert>
              )}

              <SelectableOptionRow>
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
                  {applicantCheckboxLabels[applicantId]}
                </Typography>
                {isSelected ? (
                  <Chip
                    label="Added"
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
                ) : (
                  <Chip
                    label="Add"
                    size="small"
                    variant="outlined"
                    sx={{
                      height: 22,
                      borderColor: "grey.300",
                      color: "text.secondary",
                      "& .MuiChip-label": {
                        fontSize: "0.7rem",
                        fontWeight: 600,
                        px: 1,
                      },
                    }}
                  />
                )}
              </SelectableOptionRow>

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
                                <SelectableOptionRow>
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
                                </SelectableOptionRow>

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
              </Stack>
            </Box>
          );
        })}
      </Stack>
    </CoverageCard>
  );
}
