import { useEffect, useMemo, useRef, useState } from "react";
import ArrowRightAltRoundedIcon from "@mui/icons-material/ArrowRightAltRounded";
import PrivacyTipIcon from "@mui/icons-material/PrivacyTip";
import ProductCardSurface from "./ui/ProductCard";
import {
  Box,
  Button,
  Checkbox,
  Chip,
  Divider,
  FormControl,
  FormHelperText,
  FormLabel,
  // IconButton,
  InputLabel,
  MenuItem,
  Radio,
  Select,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  Alert,
  CircularProgress,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
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
import { getCoverageAmountRange } from "../utils/coverageAmounts";
import { estimateMonthlyPremium } from "../utils/estimateMonthlyPremium";
import { generateAmountChoices } from "../utils/generateAmountChoices";
import { getPagePath } from "../config/pages";
import { STORAGE_KEY } from "../app/ApplicationFormContext";
import { getActiveClient } from "../config/client/getActiveClient";
import type { EstimatedRateFrequency } from "../config/clients/types";
import SelectionGroup from "./forms/SelectionGroup";
import QuickDecisionIndicator from "./ui/QuickDecisionIndicator";
import CoverageCategoryChips from "./ui/CoverageCategoryChips";
import RateFrequencyToggle from "./ui/RateFrequencyToggle";
import FeaturedBadge from "./ui/FeaturedBadge";

type EstimateGender = "male" | "female" | "";
type EstimateYesNo = "yes" | "no" | "";

type QuoteModalProps = {
  onClose: () => void;
  coverages: CoverageDefinition[];
  birthday: string;
  zipCode: string;
  state: string;
};

import { formatCurrencyInput } from "../utils/formatting/currency";

export default function QuoteModal({
  onClose,
  coverages,
  birthday,
  zipCode,
  state,
}: QuoteModalProps) {
  const navigate = useNavigate();
  const activeClient = useMemo(() => getActiveClient(), []);
  const rateDisplayConfig = activeClient.coverages.estimatedRateDisplay;
  const showRateFrequencyToggle =
    rateDisplayConfig?.showFrequencyToggle === true;
  const defaultRateFrequency: EstimatedRateFrequency =
    rateDisplayConfig?.defaultFrequency ?? "monthly";
  const [rateFrequency, setRateFrequency] =
    useState<EstimatedRateFrequency>(defaultRateFrequency);

  const [selectedCategories, setSelectedCategories] = useState<
    CoverageCategoryId[]
  >([]);

  // Category-level additional info fields
  const [gender, setGender] = useState<EstimateGender>("");
  const [smoker, setSmoker] = useState<EstimateYesNo>("");
  const [avgIncome, setAvgIncome] = useState("");
  const [hoursPerWeek, setHoursPerWeek] = useState("");
  const [monthlyExpenses, setMonthlyExpenses] = useState("");
  const [responsibilityPct, setResponsibilityPct] = useState("");
  const [fieldsAttempted, setFieldsAttempted] = useState(false);

  // Per-product amounts (keyed by "productId:applicantId")
  const [amountsByKey, setAmountsByKey] = useState<Record<string, number>>({});

  // Per-product applicant selections
  const [productApplicants, setProductApplicants] = useState<
    Record<string, CoverageApplicantId[]>
  >({});

  // Products revealed (after "See my quote")
  const [showProducts, setShowProducts] = useState(false);
  const [productsLoading, setProductsLoading] = useState(false);

  // Rate calculating states (per key, triggered on amount change)
  const [calculatingRates, setCalculatingRates] = useState<Set<string>>(
    new Set(),
  );
  const rateTimersRef = useRef<Record<string, number>>({});

  // Category needs assessment
  const {
    needsGender: categoryNeedsGender,
    needsSmoker: categoryNeedsSmoker,
    needsDi: categoryNeedsDi,
    needsOo: categoryNeedsOo,
    needsHours: categoryNeedsHours,
    needsAdditionalFields,
  } = getCategoryRequirements(selectedCategories);

  // Validation for category fields
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

  // Products filtered by selected categories
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

  // Hours ineligibility check
  const isHoursIneligible =
    categoryNeedsHours &&
    (() => {
      const hours = parseInt(hoursPerWeek, 10);
      return !isNaN(hours) && hours < 40;
    })();

  // Selected products (those with at least one applicant checked)
  const selectedProducts = useMemo(
    () =>
      categoryProducts.filter(
        (p) => (productApplicants[p.id] ?? []).length > 0,
      ),
    [categoryProducts, productApplicants],
  );

  function handleCategoryToggle(categoryId: CoverageCategoryId) {
    const isAdding = !selectedCategories.includes(categoryId);
    const nextCategories = isAdding
      ? [...selectedCategories, categoryId]
      : selectedCategories.filter((id) => id !== categoryId);

    setSelectedCategories(nextCategories);

    // If adding a new category after products are revealed, check if the new
    // combined set needs additional fields. If so, hide products so the user
    // must answer the new questions before seeing the updated product list.
    if (isAdding && showProducts) {
      const nextNeedsGender = nextCategories.some(
        (c) => c === "LI" || c === "DI",
      );
      const nextNeedsSmoker = nextCategories.some(
        (c) => c === "LI" || c === "SH",
      );
      const nextNeedsDi = nextCategories.includes("DI");
      const nextNeedsOo = nextCategories.includes("OO");
      const nextNeedsHours = nextNeedsDi || nextNeedsOo;
      const nextNeedsAdditionalFields =
        nextNeedsGender ||
        nextNeedsSmoker ||
        nextNeedsDi ||
        nextNeedsOo ||
        nextNeedsHours;

      if (nextNeedsAdditionalFields) {
        setShowProducts(false);
        setFieldsAttempted(false);
      }
    }
  }

  function handleGetEstimates() {
    setFieldsAttempted(true);
    if (!isFieldsValid) return;

    setProductsLoading(true);
    setShowProducts(true);

    // Initialize amounts for products that don't have one yet
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

    // Simulate loading
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

    // Show rate calculating spinner briefly
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

  function toggleApplicantForProduct(
    product: CoverageDefinition,
    applicant: CoverageApplicantId,
  ) {
    const current = productApplicants[product.id] ?? [];
    const isAdding = !current.includes(applicant);
    const next = isAdding
      ? [...current, applicant]
      : current.filter((a) => a !== applicant);

    setProductApplicants((prev) => ({ ...prev, [product.id]: next }));

    // Auto-set amount for newly added applicant
    if (isAdding) {
      const key = `${product.id}:${applicant}`;
      if (amountsByKey[key] == null) {
        const { minAmount, maxAmount, step } = getCoverageAmountRange(
          product,
          applicant,
        );
        const choices = generateAmountChoices(
          product.categoryId,
          minAmount,
          maxAmount,
          { step },
        );
        setAmountsByKey((prev) => ({
          ...prev,
          [key]: choices[0] ?? 0,
        }));
      }
    }
  }

  function getApplicantPremium(
    product: CoverageDefinition,
    applicant: CoverageApplicantId,
  ): number {
    const key = `${product.id}:${applicant}`;
    const amount = amountsByKey[key] ?? 0;
    return estimateMonthlyPremium(product.categoryId, amount);
  }

  // Grand total of all selected products and applicants
  const grandTotal = useMemo(() => {
    return selectedProducts.reduce((total, product) => {
      const applicants = productApplicants[product.id] ?? [];
      return (
        total +
        applicants.reduce(
          (sum, applicant) => sum + getApplicantPremium(product, applicant),
          0,
        )
      );
    }, 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProducts, productApplicants, amountsByKey]);

  function handleApplyForCoverage() {
    // Build preset form values from all selected products
    const formValues: Record<string, unknown> = {};

    if (birthday) formValues["birth-date"] = birthday;
    if (zipCode) formValues["zip-postal-code"] = zipCode;
    if (state) formValues["state-province"] = state;

    // Preset category-specific fields
    if (categoryNeedsGender && gender) formValues["gender"] = gender;
    if (categoryNeedsSmoker && smoker) formValues["smoker"] = smoker;
    if (categoryNeedsDi) {
      if (avgIncome) formValues["average-monthly-income"] = avgIncome;
      if (hoursPerWeek) formValues["hours-worked-per-week"] = hoursPerWeek;
    }
    if (categoryNeedsOo) {
      if (hoursPerWeek) formValues["hours-worked-per-week"] = hoursPerWeek;
      if (monthlyExpenses)
        formValues["monthly-business-expenses"] = monthlyExpenses;
      if (responsibilityPct)
        formValues["business-expense-responsibility"] = responsibilityPct;
    }

    // Preset coverage selections, applicants, amounts, and category chips
    const coverageSelections = selectedProducts.map((p) => p.id);
    formValues["coverageSelections"] = coverageSelections;
    formValues["selectedCategoryChips"] = selectedCategories;

    const applicantsMap: Record<string, CoverageApplicantId[]> = {};
    const amountsMap: Record<string, number> = {};
    for (const product of selectedProducts) {
      const applicants = productApplicants[product.id] ?? [];
      applicantsMap[product.id] = applicants;
      for (const applicant of applicants) {
        const key = `${product.id}:${applicant}`;
        amountsMap[key] = amountsByKey[key] ?? 0;
      }
    }
    formValues["productApplicants"] = applicantsMap;
    formValues["coverageAmounts"] = amountsMap;

    // Store into sessionStorage so ApplicationFormContext picks it up
    const existing = window.sessionStorage.getItem(STORAGE_KEY);
    let existingValues: Record<string, unknown> = {};
    if (existing) {
      try {
        existingValues = JSON.parse(existing);
      } catch {
        // ignore
      }
    }

    const merged = { ...existingValues, ...formValues };
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(merged));

    onClose();
    navigate(getPagePath("eligibility"));
  }

  const displayedGrandTotal =
    rateFrequency === "annual"
      ? Math.round(grandTotal * 12 * 100) / 100
      : grandTotal;
  const rateSuffix = rateFrequency === "annual" ? "/yr" : "/mo";

  return (
    <Stack spacing={3}>
      {/* Category chips + questions (full width) */}
      <Box>
        <Stack spacing={3}>
          {/* Category chips (multi-select) */}
          <CoverageCategoryChips
            coverages={coverages}
            selectedCategories={selectedCategories}
            onToggle={handleCategoryToggle}
          />

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
                    sx={{ display: "flex", flexDirection: "column", gap: 1 }}
                  >
                    <ToggleButton
                      value="male"
                      sx={{ textTransform: "none", gap: 1, justifyContent: "flex-start" }}
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
                      sx={{ textTransform: "none", gap: 1, justifyContent: "flex-start" }}
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
                    sx={{ display: "flex", flexDirection: "column", gap: 1 }}
                  >
                    <ToggleButton
                      value="yes"
                      sx={{ textTransform: "none", gap: 1, justifyContent: "flex-start" }}
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
                      sx={{ textTransform: "none", gap: 1, justifyContent: "flex-start" }}
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
        </Stack>
      </Box>

      {/* Products + estimated cost side by side */}
      {showProducts && selectedCategories.length > 0 && (
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={{ xs: 3, md: 4 }}
          alignItems="flex-start"
        >
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Stack spacing={2}>
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
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 1.5,
                        }}
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

                        {/* Select for myself */}
                        <SelectionGroup>
                          <Checkbox
                            checked={hasAnyApplicantSelected}
                            onChange={() =>
                              toggleApplicantForProduct(product, "member")
                            }
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
                          <Typography variant="subtitle2" sx={{ flex: 1 }}>
                            Select for myself
                          </Typography>
                          {hasAnyApplicantSelected ? (
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
                        </SelectionGroup>

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
            </Stack>
          </Box>

          {/* Sticky estimated cost total section */}
          {!productsLoading && (
            <Box
              sx={{
                position: { md: "sticky" },
                top: { md: 24 },
                alignSelf: { md: "flex-start" },
                width: { xs: "100%", md: 280 },
                minWidth: { md: 240 },
                flexShrink: 0,
              }}
            >
              <Box
                sx={{
                  p: 2,
                  borderRadius: "12px",
                  bgcolor: "#f8fafd",
                  border: "1px solid",
                  borderColor: "divider",
                }}
              >
                <Stack spacing={1.5}>
                  <Typography variant="h6">
                    Estimated cost<sup>1</sup>
                  </Typography>

                  {selectedProducts.length === 0 ? (
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 0.75,
                        px: 1.25,
                        py: 1,
                        borderRadius: 2,
                        bgcolor: "#f8fafc",
                        border: "1px dashed",
                        borderColor: "divider",
                        color: "text.secondary",
                      }}
                    >
                      <PrivacyTipIcon
                        sx={{ fontSize: 17, color: "text.disabled" }}
                      />
                      <Typography variant="caption" fontWeight="bold">
                        Added coverage will appear here
                      </Typography>
                    </Box>
                  ) : (
                    <>
                      {selectedProducts.map((product) => {
                        const applicants = productApplicants[product.id] ?? [];
                        const productTotal = applicants.reduce(
                          (sum, a) => sum + getApplicantPremium(product, a),
                          0,
                        );
                        const displayedProductTotal =
                          rateFrequency === "annual"
                            ? Math.round(productTotal * 12 * 100) / 100
                            : productTotal;

                        return (
                          <Stack
                            key={product.id}
                            direction="row"
                            justifyContent="space-between"
                            alignItems="center"
                            spacing={1}
                          >
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {product.name}
                            </Typography>
                            <Typography
                              variant="caption"
                              fontWeight="bold"
                              sx={{ whiteSpace: "nowrap" }}
                            >
                              {formatUSD(displayedProductTotal)}
                              {rateSuffix}
                            </Typography>
                          </Stack>
                        );
                      })}

                      <Box
                        sx={{
                          borderTop: "1px solid",
                          borderColor: "divider",
                          pt: 1.5,
                        }}
                      >
                        <Stack
                          direction="row"
                          justifyContent="space-between"
                          alignItems="baseline"
                        >
                          <Typography variant="caption" fontWeight="bold">
                            Total
                          </Typography>
                          <Typography
                            variant="body2"
                            fontWeight="bold"
                            sx={{
                              color: "primary.main",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {formatUSD(displayedGrandTotal)}
                            {rateSuffix}
                          </Typography>
                        </Stack>
                      </Box>
                    </>
                  )}

                  {showRateFrequencyToggle && (
                    <Stack
                      direction="row"
                      spacing={0.75}
                      alignItems="center"
                      justifyContent="center"
                    >
                      <Typography
                        variant="caption"
                        fontWeight="bold"
                        color={
                          rateFrequency === "monthly"
                            ? "primary.main"
                            : "text.secondary"
                        }
                      >
                        Monthly
                      </Typography>
                      <RateFrequencyToggle
                        checked={rateFrequency === "annual"}
                        onChange={(event) =>
                          setRateFrequency(
                            event.target.checked ? "annual" : "monthly",
                          )
                        }
                        slotProps={{
                          input: {
                            "aria-label": "Toggle between monthly and annual",
                          },
                        }}
                      />
                      <Typography
                        variant="caption"
                        fontWeight="bold"
                        color={
                          rateFrequency === "annual"
                            ? "primary.main"
                            : "text.secondary"
                        }
                      >
                        Annual
                      </Typography>
                    </Stack>
                  )}

                  {/* Apply for coverage button */}
                  <Button
                    variant="contained"
                    color="primary"
                    fullWidth
                    endIcon={<ArrowRightAltRoundedIcon />}
                    onClick={handleApplyForCoverage}
                    disabled={selectedProducts.length === 0}
                    sx={{ mt: 1 }}
                  >
                    Apply for coverage
                  </Button>
                </Stack>
              </Box>

              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: "block", mt: 1.5, fontStyle: "italic" }}
              >
                <sup>1</sup> Quoted cost is the best rate available. Final cost
                may vary based on gender, health status, and tobacco/nicotine
                use.
              </Typography>
            </Box>
          )}
        </Stack>
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
  );
}
