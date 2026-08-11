import { useEffect, useMemo, useRef, useState } from "react";
import ArrowRightAltRoundedIcon from "@mui/icons-material/ArrowRightAltRounded";
import PrivacyTipIcon from "@mui/icons-material/PrivacyTip";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
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
  Typography,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import AppDrawer from "../layout/AppDrawer";
import CoverageCategorySelector from "./CoverageCategorySelector";
import SelectionGroup from "./SelectionGroup";
import SectionDivider from "../layout/SectionDivider";
import CategoryHeader from "../layout/CategoryHeader";
import FeaturedBadge from "../ui/FeaturedBadge";
import ProductCardSurface from "../layout/ProductCard";
import QuickDecisionIndicator from "../ui/QuickDecisionIndicator";
import RateFrequencyToggle from "../ui/RateFrequencyToggle";
import EligibilityFields, {
  type EligibilityValues,
  validateEligibility,
} from "./EligibilityFields";
import EstimatorProductCard from "./EstimatorProductCard";
import EmptyState from "../feedback/EmptyState";
import {
  coverageCategories,
  getCoverageCategorySectionLabel,
} from "../../config/coverageCategories";
import type {
  CoverageApplicantId,
  CoverageCategoryId,
  CoverageDefinition,
} from "../../config/coverages/types";
import {
  getCategoryRequirements,
  getBenefitAmountLabel,
} from "../../config/coverageConstants";
import { getActiveClient } from "../../config/client/getActiveClient";
import { getActiveClientCoverages } from "../../config/client/getActiveClientCoverages";
import type { EstimatedRateFrequency } from "../../config/clients/types";
import { getPagePath } from "../../config/pages";
import { sectionLabels } from "../../config/pageSections";
import { STORAGE_KEY } from "../../app/ApplicationFormContext";
import { formatUSD } from "../../utils/formatUSD";
import { estimateMonthlyPremium } from "../../utils/estimateMonthlyPremium";
import { getCoverageAmountRange } from "../../utils/coverageAmounts";
import { generateAmountChoices } from "../../utils/generateAmountChoices";
import { formatCurrencyInput } from "../../utils/formatting/currency";


type EstimateGender = "male" | "female" | "";
type EstimateYesNo = "yes" | "no" | "";

export type QuoteCalculatorInitialValues = {
  birthday: string;
  zipCode: string;
  state: string;
};

type QuoteCalculatorProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  /**
   * When provided, DOB/ZIP/State fields are shown inside the calculator
   * (Membership page trigger). When omitted, those fields are not shown
   * (Homepage trigger — they were collected on the card already and passed
   * via initialEligibility).
   */
  collectEligibility?: boolean;
  /**
   * Pre-filled eligibility values from the homepage card. Only used when
   * collectEligibility is false (i.e. values already collected externally).
   */
  initialEligibility?: QuoteCalculatorInitialValues;
};



export default function QuoteCalculator({
  open,
  onClose,
  title = "How much does it cost?",
  collectEligibility = false,
  initialEligibility,
}: QuoteCalculatorProps) {
  const navigate = useNavigate();
  const activeClient = useMemo(() => getActiveClient(), []);
  const coverages = useMemo(() => getActiveClientCoverages(), []);
  const rateDisplayConfig = activeClient.coverages.estimatedRateDisplay;
  const showRateFrequencyToggle =
    rateDisplayConfig?.showFrequencyToggle === true;
  const defaultRateFrequency: EstimatedRateFrequency =
    rateDisplayConfig?.defaultFrequency ?? "monthly";
  const [rateFrequency, setRateFrequency] =
    useState<EstimatedRateFrequency>(defaultRateFrequency);

  // ── Eligibility fields (only shown when collectEligibility=true) ──────────
  const [eligibilityValues, setEligibilityValues] = useState<EligibilityValues>({
    birthday: initialEligibility?.birthday ?? "",
    zipCode: initialEligibility?.zipCode ?? "",
    state: initialEligibility?.state ?? "",
  });
  const [eligibilityAttempted, setEligibilityAttempted] = useState(false);
  const [ageError, setAgeError] = useState("");

  // ── Coverage category selection ───────────────────────────────────────────
  const [selectedCategories, setSelectedCategories] = useState<
    CoverageCategoryId[]
  >([]);

  const {
    needsGender: categoryNeedsGender,
    needsSmoker: categoryNeedsSmoker,
    needsDi: categoryNeedsDi,
    needsOo: categoryNeedsOo,
    needsHours: categoryNeedsHours,
    needsAdditionalFields,
  } = getCategoryRequirements(selectedCategories);

  // ── Category-level additional fields ─────────────────────────────────────
  const [gender, setGender] = useState<EstimateGender>("");
  const [smoker, setSmoker] = useState<EstimateYesNo>("");
  const [avgIncome, setAvgIncome] = useState("");
  const [hoursPerWeek, setHoursPerWeek] = useState("");
  const [monthlyExpenses, setMonthlyExpenses] = useState("");
  const [responsibilityPct, setResponsibilityPct] = useState("");
  const [fieldsAttempted, setFieldsAttempted] = useState(false);

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

  // ── Products ──────────────────────────────────────────────────────────────
  const [amountsByKey, setAmountsByKey] = useState<Record<string, number>>({});
  const [productApplicants, setProductApplicants] = useState<
    Record<string, CoverageApplicantId[]>
  >({});
  const [showProducts, setShowProducts] = useState(false);
  const [productsLoading, setProductsLoading] = useState(false);
  const [calculatingRates, setCalculatingRates] = useState<Set<string>>(
    new Set(),
  );
  const rateTimersRef = useRef<Record<string, number>>({});

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

  const selectedProducts = useMemo(
    () =>
      categoryProducts.filter(
        (p) => (productApplicants[p.id] ?? []).length > 0,
      ),
    [categoryProducts, productApplicants],
  );

  // ── Handlers ──────────────────────────────────────────────────────────────
  function handleCategoryToggle(categoryId: CoverageCategoryId) {
    const isAdding = !selectedCategories.includes(categoryId);
    const nextCategories = isAdding
      ? [...selectedCategories, categoryId]
      : selectedCategories.filter((id) => id !== categoryId);

    setSelectedCategories(nextCategories);

    if (isAdding && showProducts) {
      const next = getCategoryRequirements(nextCategories);
      if (next.needsAdditionalFields) {
        setShowProducts(false);
        setFieldsAttempted(false);
      }
    }
  }

  function initAmountsForProducts(products: CoverageDefinition[]) {
    const newAmounts = { ...amountsByKey };
    products.forEach((product) => {
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
  }

  function handleGetEstimates() {
    setFieldsAttempted(true);
    if (!isFieldsValid) return;
    setProductsLoading(true);
    setShowProducts(true);
    initAmountsForProducts(categoryProducts);
    setTimeout(() => setProductsLoading(false), 1000);
  }

  // Auto-reveal when no additional fields needed
  useEffect(() => {
    if (
      selectedCategories.length > 0 &&
      !needsAdditionalFields &&
      !showProducts
    ) {
      setShowProducts(true);
      setProductsLoading(true);
      const prods = coverages.filter((c) =>
        selectedCategories.includes(c.categoryId),
      );
      initAmountsForProducts(prods);
      setTimeout(() => setProductsLoading(false), 800);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategories, needsAdditionalFields]);

  function handleAmountChange(key: string, amount: number) {
    setAmountsByKey((current) => ({ ...current, [key]: amount }));
    setCalculatingRates((current) => new Set(current).add(key));
    if (rateTimersRef.current[key])
      window.clearTimeout(rateTimersRef.current[key]);
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
        setAmountsByKey((prev) => ({ ...prev, [key]: choices[0] ?? 0 }));
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

  function handleApply() {
    // Validate eligibility fields if collecting them here
    if (collectEligibility) {
      setEligibilityAttempted(true);
      const { ageError: newAgeError, isValid } = validateEligibility(eligibilityValues);
      setAgeError(newAgeError);
      if (!isValid) return;
    }

    const effectiveBirthday = collectEligibility
      ? eligibilityValues.birthday
      : (initialEligibility?.birthday ?? "");
    const effectiveZip = collectEligibility
      ? eligibilityValues.zipCode
      : (initialEligibility?.zipCode ?? "");
    const effectiveState = collectEligibility
      ? eligibilityValues.state
      : (initialEligibility?.state ?? "");

    const formValues: Record<string, unknown> = {};
    if (effectiveBirthday) formValues["birth-date"] = effectiveBirthday;
    if (effectiveZip) formValues["zip-postal-code"] = effectiveZip;
    if (effectiveState) formValues["state-province"] = effectiveState;

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

    formValues["coverageSelections"] = selectedProducts.map((p) => p.id);
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

    const existing = window.sessionStorage.getItem(STORAGE_KEY);
    let existingValues: Record<string, unknown> = {};
    if (existing) {
      try {
        existingValues = JSON.parse(existing);
      } catch {
        /* ignore */
      }
    }
    window.sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...existingValues, ...formValues }),
    );

    onClose();
    navigate(getPagePath("membership"));
  }

  const rateSuffix = rateFrequency === "annual" ? "/yr" : "/mo";
  const displayedGrandTotal =
    rateFrequency === "annual"
      ? Math.round(grandTotal * 12 * 100) / 100
      : grandTotal;

  return (
    <AppDrawer open={open} onClose={onClose} title={title}>
      <Stack spacing={3}>
        {/* ── Eligibility fields (Membership page trigger only) ── */}
        {collectEligibility && (
          <EligibilityFields
            values={eligibilityValues}
            onChange={(next) =>
              setEligibilityValues((prev) => ({ ...prev, ...next }))
            }
            attempted={eligibilityAttempted}
            ageError={ageError}
            idPrefix="qc"
          />
        )}

        {/* ── Category selection ── */}
        <CoverageCategorySelector
          categories={coverageCategories.filter((cat) =>
            coverages.some((c) => c.categoryId === cat.id),
          )}
          selectedIds={selectedCategories}
          onToggle={handleCategoryToggle}
        />

        {/* ── Additional fields grouped by section (gender/smoker=Personal, income/hours=Work, expenses=Business) ── */}
        {needsAdditionalFields && selectedCategories.length > 0 && (
          <Stack spacing={2}>
            {/* Personal details section */}
            {(categoryNeedsGender || categoryNeedsSmoker) && (
              <>
                <SectionDivider
                  label={sectionLabels.personalDetails}
                  variant="subsection"
                />
                {categoryNeedsGender && (
                  <FormControl
                    fullWidth
                    required
                    error={fieldsAttempted && !!fieldErrors.gender}
                  >
                    <FormLabel required sx={{ mb: 1 }}>
                      Gender
                    </FormLabel>
                    <Stack spacing={1.5}>
                      {(["male", "female"] as const).map((val) => (
                        <SelectionGroup
                          key={val}
                          onClick={() => setGender(val)}
                          onKeyDown={(e) => {
                            if (e.key === " " || e.key === "Enter") {
                              e.preventDefault();
                              setGender(val);
                            }
                          }}
                        >
                          <Radio
                            checked={gender === val}
                            size="small"
                            sx={{ p: 0, pointerEvents: "none" }}
                          />
                          <Box
                            component="span"
                            className="SelectionGroup-label"
                            sx={{
                              flex: 1,
                              fontSize: "0.875rem",
                              textTransform: "capitalize",
                            }}
                          >
                            {val}
                          </Box>
                        </SelectionGroup>
                      ))}
                    </Stack>
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
                    <Stack spacing={1.5}>
                      {(["yes", "no"] as const).map((val) => (
                        <SelectionGroup
                          key={val}
                          onClick={() => setSmoker(val)}
                          onKeyDown={(e) => {
                            if (e.key === " " || e.key === "Enter") {
                              e.preventDefault();
                              setSmoker(val);
                            }
                          }}
                        >
                          <Radio
                            checked={smoker === val}
                            size="small"
                            sx={{ p: 0, pointerEvents: "none" }}
                          />
                          <Box
                            component="span"
                            className="SelectionGroup-label"
                            sx={{
                              flex: 1,
                              fontSize: "0.875rem",
                              textTransform: "capitalize",
                            }}
                          >
                            {val}
                          </Box>
                        </SelectionGroup>
                      ))}
                    </Stack>
                    {fieldsAttempted && fieldErrors.smoker && (
                      <FormHelperText>{fieldErrors.smoker}</FormHelperText>
                    )}
                  </FormControl>
                )}
              </>
            )}

            {/* Work & income section */}
            {(categoryNeedsDi || categoryNeedsHours) && (
              <>
                <SectionDivider
                  label={sectionLabels.workAndIncome}
                  variant="subsection"
                />
                {categoryNeedsDi && (
                  <TextField
                    label="Average monthly income"
                    fullWidth
                    required
                    value={avgIncome ? formatCurrencyInput(avgIncome) : ""}
                    onChange={(e) =>
                      setAvgIncome(e.target.value.replace(/[^0-9]/g, ""))
                    }
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
                    onChange={(e) =>
                      setHoursPerWeek(e.target.value.replace(/[^0-9]/g, ""))
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
              </>
            )}

            {/* Business Details section */}
            {categoryNeedsOo && (
              <>
                <SectionDivider
                  label={sectionLabels.businessDetails}
                  variant="subsection"
                />
                <TextField
                  label="Average monthly business expenses"
                  fullWidth
                  required
                  value={
                    monthlyExpenses ? formatCurrencyInput(monthlyExpenses) : ""
                  }
                  onChange={(e) =>
                    setMonthlyExpenses(e.target.value.replace(/[^0-9]/g, ""))
                  }
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
                  onChange={(e) => {
                    const digits = e.target.value.replace(/[^0-9]/g, "");
                    setResponsibilityPct(
                      digits
                        ? Math.min(parseInt(digits, 10), 100).toString()
                        : "",
                    );
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

        {/* ── Empty state ── */}
        {selectedCategories.length === 0 && (
          <EmptyState
            title="Your estimated cost will appear here"
            body="Select a coverage category to see your estimated cost."
          />
        )}

        {/* ── Products ── */}
        {showProducts && selectedCategories.length > 0 && (
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
                least 40 hours per week.
              </Alert>
            ) : (
              <>
                {/* Group products by category */}
                {coverageCategories
                  .filter((cat) => selectedCategories.includes(cat.id))
                  .map((cat) => {
                    const products = categoryProducts.filter(
                      (p) => p.categoryId === cat.id,
                    );
                    if (products.length === 0) return null;
                    const CatIcon = cat.icon;
                    return (
                      <Stack spacing={2} key={cat.id}>
                        <CategoryHeader
                          label={getCoverageCategorySectionLabel(
                            cat.id,
                            getActiveClient().coverages.categorySectionLabels,
                          )}
                          icon={CatIcon}
                        />
                        {products.map((product) => {
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
                          const key = `${product.id}:member`;
                          const currentAmount =
                            amountsByKey[key] ?? choices[0] ?? 0;
                          const isCalculating = calculatingRates.has(key);
                          const premium = getApplicantPremium(product, "member");
                          const displayedPremium =
                            rateFrequency === "annual"
                              ? Math.round(premium * 12 * 100) / 100
                              : premium;

                          return (
                            <EstimatorProductCard
                              key={product.id}
                              product={product}
                              currentAmount={currentAmount}
                              amountChoices={choices}
                              selected={hasAnyApplicantSelected}
                              isCalculating={isCalculating}
                              displayedPremium={displayedPremium}
                              rateSuffix={rateSuffix}
                              onToggleSelected={() =>
                                toggleApplicantForProduct(product, "member")
                              }
                              onAmountChange={(amount) =>
                                handleAmountChange(key, amount)
                              }
                            />
                          );
                        })}
                      </Stack>
                    );
                  })}

                <Typography variant="caption" color="text.secondary">
                  <Box
                    component="sup"
                    sx={{ fontSize: "0.85em", lineHeight: 1 }}
                  >
                    1
                  </Box>
                  Quoted cost is the best rate available. Final cost may vary
                  based on gender, health status, and tobacco/nicotine use.
                </Typography>
              </>
            )}
          </Stack>
        )}

        {/* ── Estimated cost total + Apply ── */}
        {showProducts &&
          !productsLoading &&
          selectedCategories.length > 0 &&
          !isHoursIneligible && (
            <Box
              sx={{
                p: 2,
                borderRadius: "12px",
                bgcolor: "background.subtle",
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
                      bgcolor: "background.subtle",
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
                          <Typography variant="caption" color="text.secondary">
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
                          sx={{ color: "primary.main", whiteSpace: "nowrap" }}
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
                      onChange={(e) =>
                        setRateFrequency(
                          e.target.checked ? "annual" : "monthly",
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

                <Button
                  variant="contained"
                  color="primary"
                  size="large"
                  fullWidth
                  endIcon={<ArrowRightAltRoundedIcon />}
                  onClick={handleApply}
                  sx={{ mt: 1 }}
                >
                  Apply for coverage
                </Button>
              </Stack>
            </Box>
          )}
      </Stack>
    </AppDrawer>
  );
}
