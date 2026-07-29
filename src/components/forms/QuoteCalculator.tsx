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
import AppDrawer from "../ui/AppDrawer";
import SelectionGroup from "./SelectionGroup";
import SectionHeader from "./SectionHeader";
import CategoryHeader from "../CategoryHeader";
import FeaturedBadge from "../ui/FeaturedBadge";
import ProductCardSurface from "../ui/ProductCard";
import QuickDecisionIndicator from "../ui/QuickDecisionIndicator";
import RateFrequencyToggle from "../ui/RateFrequencyToggle";
import { coverageCategories } from "../../config/coverageCategories";
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
import { STORAGE_KEY } from "../../app/ApplicationFormContext";
import { formatUSD } from "../../utils/formatUSD";
import { estimateMonthlyPremium } from "../../utils/estimateMonthlyPremium";
import { getCoverageAmountRange } from "../../utils/coverageAmounts";
import { generateAmountChoices } from "../../utils/generateAmountChoices";
import { formatCurrencyInput } from "../../utils/formatting/currency";
import {
  deriveStateProvinceFromZipOrPostalCode,
  formatZipOrPostalCode,
} from "../../utils/zipToStateProvince";
import {
  parseStoredDate,
  formatDateForStorage,
  formatDateDisplay,
} from "../../utils/dateFormatting";
import { fieldCatalog } from "../../config/fields";

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

function calculateAge(birthdayStr: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(birthdayStr)) return null;
  const [y, m, d] = birthdayStr.split("-").map(Number);
  const birth = new Date(y, m - 1, d);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

function getStateOptions() {
  return fieldCatalog["state-province"].options ?? [];
}

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
  const stateOptions = useMemo(() => getStateOptions(), []);

  const rateDisplayConfig = activeClient.coverages.estimatedRateDisplay;
  const showRateFrequencyToggle = rateDisplayConfig?.showFrequencyToggle === true;
  const defaultRateFrequency: EstimatedRateFrequency =
    rateDisplayConfig?.defaultFrequency ?? "monthly";
  const [rateFrequency, setRateFrequency] =
    useState<EstimatedRateFrequency>(defaultRateFrequency);

  // ── Eligibility fields (only shown when collectEligibility=true) ──────────
  const [birthday, setBirthday] = useState(initialEligibility?.birthday ?? "");
  const [zipCode, setZipCode] = useState(initialEligibility?.zipCode ?? "");
  const [state, setState] = useState(initialEligibility?.state ?? "");
  const [dobFocused, setDobFocused] = useState(false);
  const [eligibilityAttempted, setEligibilityAttempted] = useState(false);
  const [ageError, setAgeError] = useState("");

  // Auto-derive state from zip
  useEffect(() => {
    if (!collectEligibility) return;
    const derived = deriveStateProvinceFromZipOrPostalCode(zipCode, stateOptions);
    if (derived && derived !== state) setState(derived);
  }, [zipCode, stateOptions, state, collectEligibility]);

  const eligibilityErrors = useMemo(() => {
    if (!collectEligibility) return {};
    const errors: Record<string, string> = {};
    if (!birthday) errors.birthday = "Date of birth is required.";
    else if (!/^\d{4}-\d{2}-\d{2}$/.test(birthday))
      errors.birthday = "Enter a complete date (MM/DD/YYYY).";
    if (!zipCode) errors.zipCode = "ZIP / postal code is required.";
    if (!state) errors.state = "State is required.";
    return errors;
  }, [birthday, zipCode, state, collectEligibility]);

  const eligibilityValid =
    !collectEligibility || Object.keys(eligibilityErrors).length === 0;

  // ── Coverage category selection ───────────────────────────────────────────
  const [selectedCategories, setSelectedCategories] = useState<CoverageCategoryId[]>([]);

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
    if (categoryNeedsSmoker && !smoker) errors.smoker = "This field is required.";
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
    gender, smoker, avgIncome, hoursPerWeek, monthlyExpenses, responsibilityPct,
    categoryNeedsGender, categoryNeedsSmoker, categoryNeedsDi,
    categoryNeedsHours, categoryNeedsOo,
  ]);
  const isFieldsValid = Object.keys(fieldErrors).length === 0;

  // ── Products ──────────────────────────────────────────────────────────────
  const [amountsByKey, setAmountsByKey] = useState<Record<string, number>>({});
  const [productApplicants, setProductApplicants] = useState<Record<string, CoverageApplicantId[]>>({});
  const [showProducts, setShowProducts] = useState(false);
  const [productsLoading, setProductsLoading] = useState(false);
  const [calculatingRates, setCalculatingRates] = useState<Set<string>>(new Set());
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
    () => categoryProducts.filter((p) => (productApplicants[p.id] ?? []).length > 0),
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
        const { minAmount, maxAmount, step } = getCoverageAmountRange(product, "member");
        const choices = generateAmountChoices(product.categoryId, minAmount, maxAmount, { step });
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
    if (selectedCategories.length > 0 && !needsAdditionalFields && !showProducts) {
      setShowProducts(true);
      setProductsLoading(true);
      const prods = coverages.filter((c) => selectedCategories.includes(c.categoryId));
      initAmountsForProducts(prods);
      setTimeout(() => setProductsLoading(false), 800);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategories, needsAdditionalFields]);

  function handleAmountChange(key: string, amount: number) {
    setAmountsByKey((current) => ({ ...current, [key]: amount }));
    setCalculatingRates((current) => new Set(current).add(key));
    if (rateTimersRef.current[key]) window.clearTimeout(rateTimersRef.current[key]);
    rateTimersRef.current[key] = window.setTimeout(() => {
      setCalculatingRates((current) => {
        const next = new Set(current);
        next.delete(key);
        return next;
      });
    }, 600);
  }

  function toggleApplicantForProduct(product: CoverageDefinition, applicant: CoverageApplicantId) {
    const current = productApplicants[product.id] ?? [];
    const isAdding = !current.includes(applicant);
    const next = isAdding ? [...current, applicant] : current.filter((a) => a !== applicant);
    setProductApplicants((prev) => ({ ...prev, [product.id]: next }));
    if (isAdding) {
      const key = `${product.id}:${applicant}`;
      if (amountsByKey[key] == null) {
        const { minAmount, maxAmount, step } = getCoverageAmountRange(product, applicant);
        const choices = generateAmountChoices(product.categoryId, minAmount, maxAmount, { step });
        setAmountsByKey((prev) => ({ ...prev, [key]: choices[0] ?? 0 }));
      }
    }
  }

  function getApplicantPremium(product: CoverageDefinition, applicant: CoverageApplicantId): number {
    const key = `${product.id}:${applicant}`;
    const amount = amountsByKey[key] ?? 0;
    return estimateMonthlyPremium(product.categoryId, amount);
  }

  const grandTotal = useMemo(() => {
    return selectedProducts.reduce((total, product) => {
      const applicants = productApplicants[product.id] ?? [];
      return total + applicants.reduce((sum, applicant) => sum + getApplicantPremium(product, applicant), 0);
    }, 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProducts, productApplicants, amountsByKey]);

  function handleApply() {
    // Validate eligibility fields if collecting them here
    if (collectEligibility) {
      setEligibilityAttempted(true);
      setAgeError("");
      if (!eligibilityValid) return;
      const age = calculateAge(birthday);
      if (age !== null && age >= 80) {
        setAgeError("We're sorry, but coverage is not available for applicants age 80 or older.");
        return;
      }
    }

    const effectiveBirthday = collectEligibility ? birthday : (initialEligibility?.birthday ?? "");
    const effectiveZip = collectEligibility ? zipCode : (initialEligibility?.zipCode ?? "");
    const effectiveState = collectEligibility ? state : (initialEligibility?.state ?? "");

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
      if (monthlyExpenses) formValues["monthly-business-expenses"] = monthlyExpenses;
      if (responsibilityPct) formValues["business-expense-responsibility"] = responsibilityPct;
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
      try { existingValues = JSON.parse(existing); } catch { /* ignore */ }
    }
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ ...existingValues, ...formValues }));

    onClose();
    navigate(getPagePath("membership"));
  }

  const rateSuffix = rateFrequency === "annual" ? "/yr" : "/mo";
  const displayedGrandTotal =
    rateFrequency === "annual" ? Math.round(grandTotal * 12 * 100) / 100 : grandTotal;

  return (
    <AppDrawer open={open} onClose={onClose} title={title}>
      <Stack spacing={3}>

        {/* ── Eligibility fields (Membership page trigger only) ── */}
        {collectEligibility && (
          <Stack spacing={2}>
            <TextField
              label="Date of Birth"
              fullWidth
              required
              placeholder="MM/DD/YYYY"
              value={parseStoredDate(birthday)}
              onChange={(event) => {
                const formatted = formatDateDisplay(event.target.value);
                const digits = formatted.replace(/\D/g, "");
                if (digits.length === 8) {
                  setBirthday(formatDateForStorage(formatted));
                } else {
                  setBirthday(formatted);
                }
              }}
              onFocus={() => setDobFocused(true)}
              onBlur={() => setDobFocused(false)}
              inputProps={{ inputMode: "numeric" }}
              InputLabelProps={{ shrink: dobFocused || !!birthday }}
              error={eligibilityAttempted && !!eligibilityErrors.birthday}
              helperText={
                eligibilityAttempted && eligibilityErrors.birthday
                  ? eligibilityErrors.birthday
                  : undefined
              }
            />
            <TextField
              label="ZIP / Postal Code"
              fullWidth
              required
              value={zipCode}
              onChange={(event) => setZipCode(formatZipOrPostalCode(event.target.value))}
              inputProps={{ inputMode: "text", maxLength: 7 }}
              error={eligibilityAttempted && !!eligibilityErrors.zipCode}
              helperText={eligibilityAttempted ? eligibilityErrors.zipCode || undefined : undefined}
            />
            <FormControl fullWidth required error={eligibilityAttempted && !!eligibilityErrors.state}>
              <InputLabel id="qc-state-label">State</InputLabel>
              <Select
                labelId="qc-state-label"
                label="State"
                value={state}
                onChange={(event) => setState(event.target.value)}
              >
                {stateOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
              {eligibilityAttempted && eligibilityErrors.state && (
                <FormHelperText>{eligibilityErrors.state}</FormHelperText>
              )}
            </FormControl>
            {ageError && <Alert severity="error">{ageError}</Alert>}
          </Stack>
        )}

        {/* ── Category selection ── */}
        <FormControl component="fieldset">
          <FormLabel component="legend" required sx={{ mb: 1.5 }}>
            Choose a coverage category
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
                    component="div"
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

        {/* ── Additional fields grouped by section (gender/smoker=Personal, income/hours=Work, expenses=Business) ── */}
        {needsAdditionalFields && selectedCategories.length > 0 && (
          <Stack spacing={2}>
            {/* Personal details section */}
            {(categoryNeedsGender || categoryNeedsSmoker) && (
              <>
                <SectionHeader label="Personal details" chipVariant="filled" chipColor="default" size="small" />
                {categoryNeedsGender && (
                  <FormControl fullWidth required error={fieldsAttempted && !!fieldErrors.gender}>
                    <FormLabel required sx={{ mb: 1 }}>Gender</FormLabel>
                    <Stack spacing={1.5}>
                      {(["male", "female"] as const).map((val) => (
                        <SelectionGroup
                          key={val}
                          onClick={() => setGender(val)}
                          onKeyDown={(e) => { if (e.key === " " || e.key === "Enter") { e.preventDefault(); setGender(val); } }}
                        >
                          <Radio checked={gender === val} size="small" sx={{ p: 0, pointerEvents: "none" }} />
                          <Box component="span" className="SelectionGroup-label" sx={{ flex: 1, fontSize: "0.875rem", textTransform: "capitalize" }}>{val}</Box>
                        </SelectionGroup>
                      ))}
                    </Stack>
                    {fieldsAttempted && fieldErrors.gender && <FormHelperText>{fieldErrors.gender}</FormHelperText>}
                  </FormControl>
                )}
                {categoryNeedsSmoker && (
                  <FormControl fullWidth required error={fieldsAttempted && !!fieldErrors.smoker}>
                    <FormLabel required sx={{ mb: 1 }}>Do you use nicotine products?</FormLabel>
                    <Stack spacing={1.5}>
                      {(["yes", "no"] as const).map((val) => (
                        <SelectionGroup
                          key={val}
                          onClick={() => setSmoker(val)}
                          onKeyDown={(e) => { if (e.key === " " || e.key === "Enter") { e.preventDefault(); setSmoker(val); } }}
                        >
                          <Radio checked={smoker === val} size="small" sx={{ p: 0, pointerEvents: "none" }} />
                          <Box component="span" className="SelectionGroup-label" sx={{ flex: 1, fontSize: "0.875rem", textTransform: "capitalize" }}>{val}</Box>
                        </SelectionGroup>
                      ))}
                    </Stack>
                    {fieldsAttempted && fieldErrors.smoker && <FormHelperText>{fieldErrors.smoker}</FormHelperText>}
                  </FormControl>
                )}
              </>
            )}

            {/* Work & income section */}
            {(categoryNeedsDi || categoryNeedsHours) && (
              <>
                <SectionHeader label="Work & income" chipVariant="filled" chipColor="default" size="small" />
                {categoryNeedsDi && (
                  <TextField
                    label="Average monthly income"
                    fullWidth
                    required
                    value={avgIncome ? formatCurrencyInput(avgIncome) : ""}
                    onChange={(e) => setAvgIncome(e.target.value.replace(/[^0-9]/g, ""))}
                    inputProps={{ inputMode: "numeric" }}
                    InputLabelProps={{ shrink: true }}
                    placeholder="$0"
                    helperText={fieldsAttempted && fieldErrors.avgIncome ? fieldErrors.avgIncome : "Enter your average gross monthly income before taxes."}
                    error={fieldsAttempted && !!fieldErrors.avgIncome}
                  />
                )}
                {categoryNeedsHours && (
                  <TextField
                    label="# Hours You Work/Week"
                    fullWidth
                    required
                    value={hoursPerWeek}
                    onChange={(e) => setHoursPerWeek(e.target.value.replace(/[^0-9]/g, ""))}
                    inputProps={{ inputMode: "numeric" }}
                    helperText={fieldsAttempted && fieldErrors.hoursPerWeek ? fieldErrors.hoursPerWeek : undefined}
                    error={fieldsAttempted && !!fieldErrors.hoursPerWeek}
                  />
                )}
              </>
            )}

            {/* Business Details section */}
            {categoryNeedsOo && (
              <>
                <SectionHeader label="Business Details" chipVariant="filled" chipColor="default" size="small" />
                <TextField
                  label="Average monthly business expenses"
                  fullWidth
                  required
                  value={monthlyExpenses ? formatCurrencyInput(monthlyExpenses) : ""}
                  onChange={(e) => setMonthlyExpenses(e.target.value.replace(/[^0-9]/g, ""))}
                  inputProps={{ inputMode: "numeric" }}
                  InputLabelProps={{ shrink: true }}
                  placeholder="$0"
                  helperText={fieldsAttempted && fieldErrors.monthlyExpenses ? fieldErrors.monthlyExpenses : undefined}
                  error={fieldsAttempted && !!fieldErrors.monthlyExpenses}
                />
                <TextField
                  label="% you are responsible for"
                  fullWidth
                  required
                  value={responsibilityPct}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/[^0-9]/g, "");
                    setResponsibilityPct(digits ? Math.min(parseInt(digits, 10), 100).toString() : "");
                  }}
                  helperText={fieldsAttempted && fieldErrors.responsibilityPct ? fieldErrors.responsibilityPct : undefined}
                  error={fieldsAttempted && !!fieldErrors.responsibilityPct}
                />
              </>
            )}

            <Button variant="contained" size="large" onClick={handleGetEstimates}>
              See my quote
            </Button>
          </Stack>
        )}

        {/* ── Empty state ── */}
        {selectedCategories.length === 0 && (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
              py: 6,
              px: 4,
            }}
          >
            <Stack spacing={1} alignItems="center">
              <PrivacyTipIcon sx={{ fontSize: 40, color: "text.disabled" }} />
              <Typography variant="body1" color="text.secondary">
                Your estimated cost will appear here
              </Typography>
              <Typography variant="body2" color="text.disabled">
                Select a coverage category to see your estimated cost.
              </Typography>
            </Stack>
          </Box>
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
                We're sorry, but products in this category require working at least 40 hours per week.
              </Alert>
            ) : (
              <>
                {/* Group products by category */}
                {coverageCategories
                  .filter((cat) => selectedCategories.includes(cat.id))
                  .map((cat) => {
                    const products = categoryProducts.filter((p) => p.categoryId === cat.id);
                    if (products.length === 0) return null;
                    const CatIcon = cat.icon;
                    return (
                      <Stack spacing={2} key={cat.id}>
                        <CategoryHeader
                          label={cat.label}
                          icon={CatIcon}
                        />
                        {products.map((product) => {
                          const choices = generateAmountChoices(
                            product.categoryId,
                            ...(() => {
                              const { minAmount, maxAmount, step } = getCoverageAmountRange(product, "member");
                              return [minAmount, maxAmount, { step }] as const;
                            })(),
                          );
                          const currentApplicants = productApplicants[product.id] ?? [];
                          const hasAnyApplicantSelected = currentApplicants.length > 0;
                          const key = `${product.id}:member`;
                          const currentAmount = amountsByKey[key] ?? choices[0] ?? 0;
                          const isCalculating = calculatingRates.has(key);
                          const premium = getApplicantPremium(product, "member");
                          const displayedPremium =
                            rateFrequency === "annual" ? Math.round(premium * 12 * 100) / 100 : premium;

                          return (
                            <ProductCardSurface
                              key={product.id}
                              selected={hasAnyApplicantSelected}
                              sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}
                            >
                              <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
                                <Stack spacing={0.25} sx={{ minWidth: 0 }}>
                                  <Typography variant="subtitle1" fontWeight="bold">
                                    {product.name}
                                    {product.underwritingType === "QD" && <QuickDecisionIndicator />}
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary">
                                    {product.description ?? product.definition}
                                  </Typography>
                                </Stack>
                                {product.featured && <FeaturedBadge />}
                              </Stack>

                              <SelectionGroup>
                                <Checkbox
                                  checked={hasAnyApplicantSelected}
                                  onChange={() => toggleApplicantForProduct(product, "member")}
                                  size="small"
                                  sx={{ p: 0, color: "text.primary", "&.Mui-checked": { color: "primary.main" } }}
                                />
                                <Typography variant="subtitle2" sx={{ flex: 1 }}>
                                  Select for myself
                                </Typography>
                                {hasAnyApplicantSelected ? (
                                  <Chip label="Added" size="small" color="success" sx={{ height: 22, "& .MuiChip-label": { fontSize: "0.7rem", fontWeight: 600, px: 1 } }} />
                                ) : (
                                  <Chip label="Add" size="small" variant="outlined" sx={{ height: 22, borderColor: "grey.300", color: "text.secondary", "& .MuiChip-label": { fontSize: "0.7rem", fontWeight: 600, px: 1 } }} />
                                )}
                              </SelectionGroup>

                              <Box>
                                <FormControl fullWidth>
                                  <InputLabel id={`${key}-amount-label`}>
                                    {getBenefitAmountLabel(product.categoryId)}
                                  </InputLabel>
                                  <Select
                                    labelId={`${key}-amount-label`}
                                    label={getBenefitAmountLabel(product.categoryId)}
                                    value={currentAmount}
                                    onChange={(event) => handleAmountChange(key, Number(event.target.value))}
                                  >
                                    {choices.map((amount) => (
                                      <MenuItem key={amount} value={amount}>{formatUSD(amount, 0)}</MenuItem>
                                    ))}
                                  </Select>
                                </FormControl>
                                {currentAmount > 0 && (
                                  <Stack direction="row" justifyContent="flex-end" alignItems="center" sx={{ mt: 0.5, minHeight: 20 }}>
                                    {isCalculating ? (
                                      <CircularProgress size={14} thickness={4} />
                                    ) : (
                                      <Typography variant="caption" color="text.secondary">
                                        Est. cost:{" "}
                                        <Typography component="span" variant="caption" fontWeight="bold" sx={{ color: "primary.main" }}>
                                          {formatUSD(displayedPremium)}{rateSuffix}
                                        </Typography>
                                      </Typography>
                                    )}
                                  </Stack>
                                )}
                              </Box>
                            </ProductCardSurface>
                          );
                        })}
                      </Stack>
                    );
                  })}

                <Typography variant="caption" color="text.secondary">
                  <Box component="sup" sx={{ fontSize: "0.85em", lineHeight: 1 }}>1</Box>
                  Quoted cost is the best rate available. Final cost may vary based on gender, health status, and tobacco/nicotine use.
                </Typography>
              </>
            )}
          </Stack>
        )}

        {/* ── Estimated cost total + Apply ── */}
        {showProducts && !productsLoading && selectedCategories.length > 0 && !isHoursIneligible && (
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
              <Typography variant="h6">Estimated cost<sup>1</sup></Typography>

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
                  <PrivacyTipIcon sx={{ fontSize: 17, color: "text.disabled" }} />
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
                      <Stack key={product.id} direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
                        <Typography variant="caption" color="text.secondary">{product.name}</Typography>
                        <Typography variant="caption" fontWeight="bold" sx={{ whiteSpace: "nowrap" }}>
                          {formatUSD(displayedProductTotal)}{rateSuffix}
                        </Typography>
                      </Stack>
                    );
                  })}

                  <Box sx={{ borderTop: "1px solid", borderColor: "divider", pt: 1.5 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="baseline">
                      <Typography variant="caption" fontWeight="bold">Total</Typography>
                      <Typography variant="body2" fontWeight="bold" sx={{ color: "primary.main", whiteSpace: "nowrap" }}>
                        {formatUSD(displayedGrandTotal)}{rateSuffix}
                      </Typography>
                    </Stack>
                  </Box>
                </>
              )}

              {showRateFrequencyToggle && (
                <Stack direction="row" spacing={0.75} alignItems="center" justifyContent="center">
                  <Typography variant="caption" fontWeight="bold" color={rateFrequency === "monthly" ? "primary.main" : "text.secondary"}>
                    Monthly
                  </Typography>
                  <RateFrequencyToggle
                    checked={rateFrequency === "annual"}
                    onChange={(e) => setRateFrequency(e.target.checked ? "annual" : "monthly")}
                    slotProps={{ input: { "aria-label": "Toggle between monthly and annual" } }}
                  />
                  <Typography variant="caption" fontWeight="bold" color={rateFrequency === "annual" ? "primary.main" : "text.secondary"}>
                    Annual
                  </Typography>
                </Stack>
              )}

              <Button
                variant="contained"
                color="primary"
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
