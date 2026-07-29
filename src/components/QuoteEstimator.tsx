import { useEffect, useMemo, useRef, useState } from "react";
import FeaturedBadge from "./ui/FeaturedBadge";
import ProductCardSurface from "./ui/ProductCard";
import PrivacyTipIcon from "@mui/icons-material/PrivacyTip";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Divider,
  FormControl,
  FormHelperText,
  FormLabel,
  InputLabel,
  MenuItem,
  Radio,
  Select,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import SelectionGroup from "./forms/SelectionGroup";
import { coverageCategories } from "../config/coverageCategories";
import type {
  CoverageCategoryId,
  CoverageApplicantId,
  CoverageDefinition,
} from "../config/coverages/types";
import {
  getCategoryRequirements,
  getBenefitAmountLabel,
} from "../config/coverageConstants";
import { formatUSD } from "../utils/formatUSD";
import { estimateMonthlyPremium } from "../utils/estimateMonthlyPremium";
import { getCoverageAmountRange } from "../utils/coverageAmounts";
import { generateAmountChoices } from "../utils/generateAmountChoices";
import { getActiveClient } from "../config/client/getActiveClient";
import { getActiveClientCoverages } from "../config/client/getActiveClientCoverages";
import type { EstimatedRateFrequency } from "../config/clients/types";
import QuickDecisionIndicator from "./ui/QuickDecisionIndicator";

import { formatCurrencyInput } from "../utils/formatting/currency";

type EstimateGender = "male" | "female" | "";
type EstimateYesNo = "yes" | "no" | "";

export default function QuoteEstimator() {
  const activeClient = useMemo(() => getActiveClient(), []);
  const coverages = useMemo(() => getActiveClientCoverages(), []);
  const rateDisplayConfig = activeClient.coverages.estimatedRateDisplay;
  const defaultRateFrequency: EstimatedRateFrequency =
    rateDisplayConfig?.defaultFrequency ?? "monthly";
  const rateFrequency = defaultRateFrequency;

  const [selectedCategories, setSelectedCategories] = useState<
    CoverageCategoryId[]
  >([]);

  const requirements = getCategoryRequirements(selectedCategories);

  const [gender, setGender] = useState<EstimateGender>("");
  const [smoker, setSmoker] = useState<EstimateYesNo>("");
  const [avgIncome, setAvgIncome] = useState("");
  const [hoursPerWeek, setHoursPerWeek] = useState("");
  const [monthlyExpenses, setMonthlyExpenses] = useState("");
  const [responsibilityPct, setResponsibilityPct] = useState("");
  const [fieldsAttempted, setFieldsAttempted] = useState(false);

  const [amountsByKey, setAmountsByKey] = useState<Record<string, number>>({});
  const [productApplicants] = useState<Record<string, CoverageApplicantId[]>>(
    {},
  );

  const [showProducts, setShowProducts] = useState(false);
  const [productsLoading, setProductsLoading] = useState(false);

  const [calculatingRates, setCalculatingRates] = useState<Set<string>>(
    new Set(),
  );
  const rateTimersRef = useRef<Record<string, number>>({});

  const {
    needsGender: categoryNeedsGender,
    needsSmoker: categoryNeedsSmoker,
    needsDi: categoryNeedsDi,
    needsOo: categoryNeedsOo,
    needsHours: categoryNeedsHours,
    needsAdditionalFields,
  } = requirements;

  const fieldErrors = useMemo(() => {
    const errors: Record<string, string> = {};
    if (categoryNeedsGender && !gender) errors.gender = "Gender is required.";
    if (categoryNeedsSmoker && !smoker)
      errors.smoker = "This field is required.";
    if (categoryNeedsDi && !avgIncome)
      errors.avgIncome = "Average monthly income is required.";
    if (categoryNeedsHours && !hoursPerWeek)
      errors.hoursPerWeek = "Hours worked per week is required.";
    if (categoryNeedsOo && !monthlyExpenses)
      errors.monthlyExpenses = "Monthly business expenses is required.";
    if (categoryNeedsOo && !responsibilityPct)
      errors.responsibilityPct = "Responsibility percentage is required.";
    return errors;
  }, [
    gender,
    smoker,
    avgIncome,
    hoursPerWeek,
    monthlyExpenses,
    responsibilityPct,
    categoryNeedsGender,
    categoryNeedsSmoker,
    categoryNeedsDi,
    categoryNeedsHours,
    categoryNeedsOo,
  ]);

  const isFieldsValid = Object.keys(fieldErrors).length === 0;

  const categoryProducts = useMemo(
    () =>
      coverages
        .filter((c) => selectedCategories.includes(c.categoryId))
        .slice()
        .sort((a, b) => {
          if (a.featured && !b.featured) return -1;
          if (!a.featured && b.featured) return 1;
          return a.name.localeCompare(b.name);
        }),
    [coverages, selectedCategories],
  );

  const isHoursIneligible =
    categoryNeedsHours &&
    (() => {
      const hours = parseInt(hoursPerWeek, 10);
      return !isNaN(hours) && hours < 40;
    })();

  function handleCategoryToggle(categoryId: CoverageCategoryId) {
    setSelectedCategories((current) =>
      current.includes(categoryId)
        ? current.filter((id) => id !== categoryId)
        : [...current, categoryId],
    );
  }

  function handleGetEstimates() {
    setFieldsAttempted(true);
    if (!isFieldsValid) return;

    setProductsLoading(true);
    setShowProducts(true);

    const newAmounts = { ...amountsByKey };
    categoryProducts.forEach((product) => {
      const key = `${product.id}:member`;
      if (newAmounts[key] == null) {
        const { minAmount, maxAmount, step } = getCoverageAmountRange(
          product,
          "member",
        );
        const choices = generateAmountChoices(
          product.categoryId,
          minAmount,
          maxAmount,
          { step },
        );
        newAmounts[key] = choices[0] ?? 0;
      }
    });
    setAmountsByKey(newAmounts);

    setTimeout(() => {
      setProductsLoading(false);
    }, 1000);
  }

  // Auto-reveal for categories that don't need additional fields
  useEffect(() => {
    if (
      selectedCategories.length > 0 &&
      !needsAdditionalFields &&
      !showProducts
    ) {
      setShowProducts(true);
      setProductsLoading(true);
      const newAmounts = { ...amountsByKey };
      const prods = coverages.filter((c) =>
        selectedCategories.includes(c.categoryId),
      );
      prods.forEach((product) => {
        const key = `${product.id}:member`;
        if (newAmounts[key] == null) {
          const { minAmount, maxAmount, step } = getCoverageAmountRange(
            product,
            "member",
          );
          const choices = generateAmountChoices(
            product.categoryId,
            minAmount,
            maxAmount,
            { step },
          );
          newAmounts[key] = choices[0] ?? 0;
        }
      });
      setAmountsByKey(newAmounts);
      setTimeout(() => setProductsLoading(false), 800);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategories, needsAdditionalFields]);

  function handleAmountChange(key: string, amount: number) {
    setAmountsByKey((current) => ({
      ...current,
      [key]: amount,
    }));

    setCalculatingRates((current) => new Set(current).add(key));
    if (rateTimersRef.current[key]) {
      window.clearTimeout(rateTimersRef.current[key]);
    }
    rateTimersRef.current[key] = window.setTimeout(() => {
      setCalculatingRates((current) => {
        const next = new Set(current);
        next.delete(key);
        return next;
      });
    }, 600);
  }

  function getApplicantPremium(
    product: CoverageDefinition,
    applicant: CoverageApplicantId,
  ): number {
    const key = `${product.id}:${applicant}`;
    const amount = amountsByKey[key] ?? 0;
    return estimateMonthlyPremium(product.categoryId, amount);
  }

  const rateSuffix = rateFrequency === "annual" ? "/yr" : "/mo";

  return (
    <Stack direction="column" spacing={3}>
      {/* Category chips + questions + products */}
      <Box>
        <Stack spacing={3}>
          {/* Category selection (multi-select) */}
          <FormControl component="fieldset">
            <FormLabel component="legend" required sx={{ mb: 1.5 }}>
              Choose category
            </FormLabel>
            <Stack spacing={1.5}>
              {coverageCategories
                .filter((cat) => coverages.some((c) => c.categoryId === cat.id))
                .map((category) => {
                  const Icon = category.icon;
                  const isSelected = selectedCategories.includes(category.id);
                  const productNames = coverages
                    .filter((c) => c.categoryId === category.id)
                    .map((c) => c.name)
                    .join(", ");
                  return (
                    <SelectionGroup
                      key={category.id}
                      role="checkbox"
                      aria-checked={isSelected}
                      checked={isSelected}
                      tabIndex={0}
                      onClick={() => handleCategoryToggle(category.id)}
                      onKeyDown={(e) => {
                        if (e.key === " " || e.key === "Enter") {
                          e.preventDefault();
                          handleCategoryToggle(category.id);
                        }
                      }}
                    >
                      <Box
                        className="SelectionGroup-icon"
                        sx={{ display: "flex", alignItems: "center", flexShrink: 0 }}
                      >
                        <Icon sx={{ fontSize: "1.25rem" }} />
                      </Box>
                      <Stack spacing={0.25} sx={{ flex: 1, minWidth: 0 }}>
                        <Box component="span" className="SelectionGroup-label" sx={{ fontSize: "0.875rem" }}>
                          {category.label}
                        </Box>
                        {productNames && (
                          <Typography variant="body2" color="text.secondary" sx={{ fontSize: "0.75rem" }}>
                            {productNames}
                          </Typography>
                        )}
                      </Stack>
                    </SelectionGroup>
                  );
                })}
            </Stack>
          </FormControl>

          {/* Category-level additional fields */}
          {needsAdditionalFields && selectedCategories.length > 0 && (
            <Stack spacing={2}>
              <Divider />
              <Typography variant="body2" color="text.secondary">
                We need a few more details to calculate your estimate
              </Typography>

              {categoryNeedsGender && (
                <FormControl
                  fullWidth
                  required
                  error={fieldsAttempted && !!fieldErrors.gender}
                >
                  <FormLabel required sx={{ mb: 1 }}>
                    Gender
                  </FormLabel>
                  <ToggleButtonGroup
                    exclusive
                    value={gender}
                    onChange={(_, value) => {
                      if (value !== null) setGender(value as EstimateGender);
                    }}
                    sx={{ display: "flex", gap: 1 }}
                  >
                    <ToggleButton
                      value="male"
                      sx={{
                        flex: 1,
                        textTransform: "none",
                        gap: 1,
                        justifyContent: "flex-start",
                      }}
                    >
                      <Radio
                        checked={gender === "male"}
                        size="small"
                        sx={{ p: 0 }}
                      />
                      Male
                    </ToggleButton>
                    <ToggleButton
                      value="female"
                      sx={{
                        flex: 1,
                        textTransform: "none",
                        gap: 1,
                        justifyContent: "flex-start",
                      }}
                    >
                      <Radio
                        checked={gender === "female"}
                        size="small"
                        sx={{ p: 0 }}
                      />
                      Female
                    </ToggleButton>
                  </ToggleButtonGroup>
                  {fieldsAttempted && fieldErrors.gender && (
                    <FormHelperText>{fieldErrors.gender}</FormHelperText>
                  )}
                </FormControl>
              )}

              {categoryNeedsSmoker && (
                <FormControl
                  fullWidth
                  required
                  error={fieldsAttempted && !!fieldErrors.smoker}
                >
                  <FormLabel required sx={{ mb: 1 }}>
                    Do you use nicotine products?
                  </FormLabel>
                  <ToggleButtonGroup
                    exclusive
                    value={smoker}
                    onChange={(_, value) => {
                      if (value !== null) setSmoker(value as EstimateYesNo);
                    }}
                    sx={{ display: "flex", gap: 1 }}
                  >
                    <ToggleButton
                      value="yes"
                      sx={{
                        flex: 1,
                        textTransform: "none",
                        gap: 1,
                        justifyContent: "flex-start",
                      }}
                    >
                      <Radio
                        checked={smoker === "yes"}
                        size="small"
                        sx={{ p: 0 }}
                      />
                      Yes
                    </ToggleButton>
                    <ToggleButton
                      value="no"
                      sx={{
                        flex: 1,
                        textTransform: "none",
                        gap: 1,
                        justifyContent: "flex-start",
                      }}
                    >
                      <Radio
                        checked={smoker === "no"}
                        size="small"
                        sx={{ p: 0 }}
                      />
                      No
                    </ToggleButton>
                  </ToggleButtonGroup>
                  {fieldsAttempted && fieldErrors.smoker && (
                    <FormHelperText>{fieldErrors.smoker}</FormHelperText>
                  )}
                </FormControl>
              )}

              {categoryNeedsDi && (
                <TextField
                  label="Average monthly income"
                  fullWidth
                  required
                  value={avgIncome ? formatCurrencyInput(avgIncome) : ""}
                  onChange={(event) => {
                    const digits = event.target.value.replace(/[^0-9]/g, "");
                    setAvgIncome(digits);
                  }}
                  inputProps={{ inputMode: "numeric" }}
                  InputLabelProps={{ shrink: true }}
                  placeholder="$0"
                  helperText={
                    fieldsAttempted && fieldErrors.avgIncome
                      ? fieldErrors.avgIncome
                      : "Enter your average gross monthly income before taxes."
                  }
                  error={fieldsAttempted && !!fieldErrors.avgIncome}
                />
              )}

              {categoryNeedsHours && (
                <TextField
                  label="# Hours You Work/Week"
                  fullWidth
                  required
                  value={hoursPerWeek}
                  onChange={(event) =>
                    setHoursPerWeek(event.target.value.replace(/[^0-9]/g, ""))
                  }
                  inputProps={{ inputMode: "numeric" }}
                  helperText={
                    fieldsAttempted && fieldErrors.hoursPerWeek
                      ? fieldErrors.hoursPerWeek
                      : undefined
                  }
                  error={fieldsAttempted && !!fieldErrors.hoursPerWeek}
                />
              )}

              {categoryNeedsOo && (
                <>
                  <TextField
                    label="Average monthly business expenses"
                    fullWidth
                    required
                    value={
                      monthlyExpenses
                        ? formatCurrencyInput(monthlyExpenses)
                        : ""
                    }
                    onChange={(event) => {
                      const digits = event.target.value.replace(/[^0-9]/g, "");
                      setMonthlyExpenses(digits);
                    }}
                    inputProps={{ inputMode: "numeric" }}
                    InputLabelProps={{ shrink: true }}
                    placeholder="$0"
                    helperText={
                      fieldsAttempted && fieldErrors.monthlyExpenses
                        ? fieldErrors.monthlyExpenses
                        : undefined
                    }
                    error={fieldsAttempted && !!fieldErrors.monthlyExpenses}
                  />
                  <TextField
                    label="% you are responsible for"
                    fullWidth
                    required
                    value={responsibilityPct}
                    onChange={(event) => {
                      const digits = event.target.value.replace(/[^0-9]/g, "");
                      const normalized = digits
                        ? Math.min(parseInt(digits, 10), 100).toString()
                        : "";
                      setResponsibilityPct(normalized);
                    }}
                    helperText={
                      fieldsAttempted && fieldErrors.responsibilityPct
                        ? fieldErrors.responsibilityPct
                        : undefined
                    }
                    error={fieldsAttempted && !!fieldErrors.responsibilityPct}
                  />
                </>
              )}

              <Button
                variant="contained"
                size="large"
                onClick={handleGetEstimates}
              >
                See my quote
              </Button>
            </Stack>
          )}

          {/* Products section (revealed below category questions) */}
          {showProducts && selectedCategories.length > 0 && (
            <>
              <Divider />
              {productsLoading ? (
                <Stack spacing={2} alignItems="center" sx={{ py: 4 }}>
                  <CircularProgress size={28} />
                  <Typography variant="body2" color="text.secondary">
                    Loading your coverage options…
                  </Typography>
                </Stack>
              ) : isHoursIneligible ? (
                <Alert severity="error">
                  We're sorry, but products in this category require working at
                  least 40 hours per week to be eligible for coverage.
                </Alert>
              ) : (
                <Stack spacing={2}>
                  {categoryProducts.map((product) => {
                    const choices = generateAmountChoices(
                      product.categoryId,
                      ...(() => {
                        const { minAmount, maxAmount, step } =
                          getCoverageAmountRange(product, "member");
                        return [minAmount, maxAmount, { step }] as const;
                      })(),
                    );
                    const currentApplicants =
                      productApplicants[product.id] ?? [];
                    const hasAnyApplicantSelected =
                      currentApplicants.length > 0;

                    return (
                      <ProductCardSurface
                        key={product.id}
                        selected={hasAnyApplicantSelected}
                        sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}
                      >
                        {/* Title row */}
                        <Stack
                          direction="row"
                          justifyContent="space-between"
                          alignItems="flex-start"
                          spacing={1}
                        >
                          <Stack spacing={0.25} sx={{ minWidth: 0 }}>
                            <Typography variant="subtitle1" fontWeight="bold">
                              {product.name}
                              {product.underwritingType === "QD" && (
                                <QuickDecisionIndicator />
                              )}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {product.description ?? product.definition}
                            </Typography>
                          </Stack>

                          {product.featured && <FeaturedBadge />}
                        </Stack>

                        {/* Benefit amount & estimated cost (always visible) */}
                        {(() => {
                          const key = `${product.id}:member`;
                          const currentAmount =
                            amountsByKey[key] ?? choices[0] ?? 0;
                          const isCalculating = calculatingRates.has(key);
                          const premium = getApplicantPremium(
                            product,
                            "member",
                          );
                          const displayedPremium =
                            rateFrequency === "annual"
                              ? Math.round(premium * 12 * 100) / 100
                              : premium;

                          return (
                            <Box>
                              <FormControl fullWidth>
                                <InputLabel id={`${key}-amount-label`}>
                                  {getBenefitAmountLabel(product.categoryId)}
                                </InputLabel>
                                <Select
                                  labelId={`${key}-amount-label`}
                                  label={getBenefitAmountLabel(
                                    product.categoryId,
                                  )}
                                  value={currentAmount}
                                  onChange={(event) =>
                                    handleAmountChange(
                                      key,
                                      Number(event.target.value),
                                    )
                                  }
                                >
                                  {choices.map((amount) => (
                                    <MenuItem key={amount} value={amount}>
                                      {formatUSD(amount, 0)}
                                    </MenuItem>
                                  ))}
                                </Select>
                              </FormControl>
                              {currentAmount > 0 && (
                                <Stack
                                  direction="row"
                                  justifyContent="flex-end"
                                  alignItems="center"
                                  sx={{ mt: 0.5, minHeight: 20 }}
                                >
                                  {isCalculating ? (
                                    <CircularProgress size={14} thickness={4} />
                                  ) : (
                                    <Typography
                                      variant="caption"
                                      color="text.secondary"
                                    >
                                      Est. cost:{" "}
                                      <Typography
                                        component="span"
                                        variant="caption"
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
                            </Box>
                          );
                        })()}
                      </ProductCardSurface>
                    );
                  })}

                  {/* Footnote */}
                  <Typography variant="caption" color="text.secondary">
                    <Box
                      component="sup"
                      sx={{ fontSize: "0.85em", lineHeight: 1 }}
                    >
                      1
                    </Box>
                    Quoted cost is the best rate available based on the
                    information you provided. Final cost may be based upon
                    factors such as gender, health status, and use of
                    tobacco/nicotine. Rates current as of 2026.
                  </Typography>
                </Stack>
              )}
            </>
          )}

          {/* Empty state when no categories selected */}
          {selectedCategories.length === 0 && (
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "start",
                textAlign: "center",
                minHeight: 200,
                py: 6,
                px: 4,
              }}
            >
              <Stack spacing={1} alignItems="center">
                <PrivacyTipIcon sx={{ fontSize: 40, color: "text.disabled" }} />
                <Typography variant="body1" sx={{ color: "text.secondary" }}>
                  Your estimated cost will appear here
                </Typography>
                <Typography variant="body2" sx={{ color: "text.disabled" }}>
                  Select a coverage category to see your estimated cost.
                </Typography>
              </Stack>
            </Box>
          )}
        </Stack>
      </Box>
    </Stack>
  );
}
