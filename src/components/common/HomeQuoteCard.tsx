import { useEffect, useMemo, useState } from "react";
import ArrowRightAltRoundedIcon from "@mui/icons-material/ArrowRightAltRounded";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import CloseIcon from "@mui/icons-material/Close";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  FormControl,
  FormHelperText,
  FormLabel,
  IconButton,
  InputLabel,
  ListSubheader,
  MenuItem,
  Radio,
  Select,
  Skeleton,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { useNavigate, useSearchParams } from "react-router-dom";
import ComparisonQuoteModal from "./ComparisonQuoteModal";
import QuickDecisionIndicator from "./QuickDecisionIndicator";
import { STORAGE_KEY } from "../../state/ApplicationFormContext";
import { getActiveClientCoverages } from "../../client/getActiveClientCoverages";
import { coverageCategories } from "../../config/coverageCategories";
import type {
  CoverageCategoryId,
  CoverageDefinition,
} from "../../config/coverages/types";
import { fieldCatalog } from "../../config/fields";
import { getPagePath } from "../../config/pages";
import {
  deriveStateProvinceFromZipOrPostalCode,
  formatZipOrPostalCode,
} from "../../utils/zipToStateProvince";
import { formatUSD } from "../../utils/formatUSD";
import { estimateMonthlyPremium } from "../../utils/estimateMonthlyPremium";
import { generateAmountChoices } from "../../utils/generateAmountChoices";
import {
  parseStoredDate,
  formatDateForStorage,
  formatDateDisplay,
} from "../../utils/dateFormatting";

type EstimateGender = "male" | "female" | "";
type EstimateYesNo = "yes" | "no" | "";

type EstimateState = {
  birthday: string;
  zipCode: string;
  state: string;
  productId: string;
  gender: EstimateGender;
  smoker: EstimateYesNo;
  tobaccoLastUsed: string;
  tobaccoProducts: string[];
  avgIncome: string;
  hoursPerWeek: string;
  monthlyExpenses: string;
  responsibilityPct: string;
};

const SURFACE_SX = {
  border: "1px solid rgba(52, 59, 72, 0.10)",
  borderRadius: 4,
  backgroundColor: "#ffffff",
  boxShadow: "0 18px 40px rgba(52, 59, 72, 0.06)",
};

const ESTIMATE_STORAGE_KEY = "homeEstimateValues";

function loadStoredEstimateValues(): Partial<EstimateState> {
  try {
    const stored = window.localStorage.getItem(ESTIMATE_STORAGE_KEY);
    if (!stored) return {};
    return JSON.parse(stored) as Partial<EstimateState>;
  } catch {
    return {};
  }
}

function saveEstimateValues(
  values: Pick<EstimateState, "birthday" | "zipCode" | "state">,
) {
  window.localStorage.setItem(ESTIMATE_STORAGE_KEY, JSON.stringify(values));
}

function getEstimateAmountLabel(categoryId: CoverageCategoryId): string {
  return categoryId === "DI" || categoryId === "OO"
    ? "Monthly benefit amount"
    : "Coverage amount";
}

function getStateOptions() {
  return fieldCatalog["state-province"].options ?? [];
}

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

function formatCurrencyInput(value: string): string {
  const digits = value.replace(/[^0-9]/g, "").slice(0, 12);
  if (!digits) return "";
  return `$${Number(digits).toLocaleString("en-US")}`;
}

export default function HomeQuoteCard() {
  const theme = useTheme();
  const isMdUp = useMediaQuery(theme.breakpoints.up("md"));
  const coverages = useMemo(() => getActiveClientCoverages(), []);
  const stateOptions = useMemo(() => getStateOptions(), []);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // testQuote=comparison (default) or testQuote=single (alternative)
  const quoteMode =
    searchParams.get("testQuote") === "single" ? "single" : "comparison";

  const storedEstimate = useMemo(() => loadStoredEstimateValues(), []);

  const [estimateValues, setEstimateValues] = useState<EstimateState>({
    birthday: storedEstimate.birthday ?? "",
    zipCode: storedEstimate.zipCode ?? "",
    state: storedEstimate.state ?? "",
    productId: "",
    gender: "",
    smoker: "",
    tobaccoLastUsed: "",
    tobaccoProducts: [],
    avgIncome: "",
    hoursPerWeek: "",
    monthlyExpenses: "",
    responsibilityPct: "",
  });
  const [initialAttempted, setInitialAttempted] = useState(false);
  const [quoteModalOpen, setQuoteModalOpen] = useState(false);
  const [isEstimateLoading, setIsEstimateLoading] = useState(false);
  const [isQuoteLoading, setIsQuoteLoading] = useState(false);
  const [quoteLoadingMessage, setQuoteLoadingMessage] = useState("");
  const [dobFocused, setDobFocused] = useState(false);
  const [estimateAmountsByProductId, setEstimateAmountsByProductId] = useState<
    Record<string, number>
  >({});
  const [estimateRatesByProductId, setEstimateRatesByProductId] = useState<
    Record<string, number>
  >({});
  const [quoteRevealed, setQuoteRevealed] = useState(false);
  const [ageError, setAgeError] = useState("");
  const [modalAttempted, setModalAttempted] = useState(false);

  const productsByCategory = useMemo(
    () =>
      coverageCategories
        .map((category) => ({
          category,
          products: coverages
            .filter((coverage) => coverage.categoryId === category.id)
            .slice()
            .sort((a, b) => {
              if (a.featured && !b.featured) return -1;
              if (!a.featured && b.featured) return 1;
              return a.name.localeCompare(b.name);
            }),
        }))
        .filter((group) => group.products.length > 0),
    [coverages],
  );

  // Auto-derive state from zip code
  useEffect(() => {
    const derived = deriveStateProvinceFromZipOrPostalCode(
      estimateValues.zipCode,
      stateOptions,
    );
    if (derived && derived !== estimateValues.state) {
      setEstimateValues((current) => ({ ...current, state: derived }));
    }
  }, [estimateValues.zipCode, stateOptions, estimateValues.state]);

  const selectedProduct = useMemo(
    () =>
      coverages.find((coverage) => coverage.id === estimateValues.productId),
    [coverages, estimateValues.productId],
  );

  const selectedCategoryId = selectedProduct?.categoryId ?? null;

  const estimateCategoryNeedsGender =
    selectedCategoryId === "LI" || selectedCategoryId === "DI";
  const estimateCategoryNeedsSmoker =
    selectedCategoryId === "LI" || selectedCategoryId === "SH";
  const estimateCategoryNeedsDi = selectedCategoryId === "DI";
  const estimateCategoryNeedsOo = selectedCategoryId === "OO";
  const estimateCategoryNeedsHours =
    estimateCategoryNeedsDi || estimateCategoryNeedsOo;

  const initialValidationErrors = useMemo(() => {
    const errors: Record<string, string> = {};
    if (!estimateValues.birthday) {
      errors.birthday = "Date of birth is required.";
    } else if (!/^\d{4}-\d{2}-\d{2}$/.test(estimateValues.birthday)) {
      errors.birthday = "Enter a complete date (MM/DD/YYYY).";
    }
    if (!estimateValues.zipCode)
      errors.zipCode = "ZIP / postal code is required.";
    if (!estimateValues.state) errors.state = "State is required.";
    return errors;
  }, [estimateValues.birthday, estimateValues.zipCode, estimateValues.state]);

  const modalValidationErrors = useMemo(() => {
    const errors: Record<string, string> = {};
    if (!estimateValues.productId) {
      errors.productId = "Please select a product.";
    }
    if (estimateCategoryNeedsGender && !estimateValues.gender) {
      errors.gender = "Gender is required.";
    }
    if (estimateCategoryNeedsSmoker && !estimateValues.smoker) {
      errors.smoker = "This field is required.";
    }
    if (estimateCategoryNeedsDi && !estimateValues.avgIncome) {
      errors.avgIncome = "Average monthly income is required.";
    }
    if (estimateCategoryNeedsHours && !estimateValues.hoursPerWeek) {
      errors.hoursPerWeek = "Hours worked per week is required.";
    }
    if (estimateCategoryNeedsOo && !estimateValues.monthlyExpenses) {
      errors.monthlyExpenses = "Monthly business expenses is required.";
    }
    if (estimateCategoryNeedsOo && !estimateValues.responsibilityPct) {
      errors.responsibilityPct = "Responsibility percentage is required.";
    }
    return errors;
  }, [
    estimateValues.productId,
    estimateValues.gender,
    estimateValues.smoker,
    estimateValues.avgIncome,
    estimateValues.hoursPerWeek,
    estimateValues.monthlyExpenses,
    estimateValues.responsibilityPct,
    estimateCategoryNeedsGender,
    estimateCategoryNeedsSmoker,
    estimateCategoryNeedsDi,
    estimateCategoryNeedsHours,
    estimateCategoryNeedsOo,
  ]);

  function updateEstimateValues(nextValues: Partial<EstimateState>) {
    setEstimateValues((current) => ({ ...current, ...nextValues }));
  }

  function handleEstimateProductChange(nextProductId: string) {
    const nextProduct = coverages.find((c) => c.id === nextProductId);
    const nextCategoryId = nextProduct?.categoryId ?? null;

    // Determine if the new product needs additional fields
    const needsGender = nextCategoryId === "LI" || nextCategoryId === "DI";
    const needsSmoker = nextCategoryId === "LI" || nextCategoryId === "SH";
    const needsDi = nextCategoryId === "DI";
    const needsOo = nextCategoryId === "OO";
    const needsHours = needsDi || needsOo;

    // Check if all required additional fields are already filled
    const hasGender = !needsGender || !!estimateValues.gender;
    const hasSmoker = !needsSmoker || !!estimateValues.smoker;
    const hasIncome = !needsDi || !!estimateValues.avgIncome;
    const hasHours = !needsHours || !!estimateValues.hoursPerWeek;
    const hasExpenses = !needsOo || !!estimateValues.monthlyExpenses;
    const hasResponsibility = !needsOo || !!estimateValues.responsibilityPct;

    const allAdditionalFieldsFilled =
      hasGender &&
      hasSmoker &&
      hasIncome &&
      hasHours &&
      hasExpenses &&
      hasResponsibility;

    // No additional fields required at all for this product
    const noAdditionalFieldsNeeded =
      !needsGender && !needsSmoker && !needsDi && !needsOo && !needsHours;

    setEstimateValues((current) => ({
      ...current,
      productId: nextProductId,
    }));
    setModalAttempted(false);

    if (noAdditionalFieldsNeeded || allAdditionalFieldsFilled) {
      // Auto-compute quote
      if (nextProduct) {
        // Check hours ineligibility
        if (needsHours) {
          const hours = parseInt(estimateValues.hoursPerWeek, 10);
          if (!isNaN(hours) && hours < 40) {
            setQuoteRevealed(true);
            return;
          }
        }
        const choices = generateAmountChoices(
          nextProduct.categoryId,
          nextProduct.minAmount,
          nextProduct.maxAmount,
        );

        // If switching within the same category, try to keep the previous amount
        const prevProduct = coverages.find(
          (c) => c.id === estimateValues.productId,
        );
        const prevAmount = prevProduct
          ? estimateAmountsByProductId[prevProduct.id]
          : undefined;
        const keepAmount =
          prevProduct &&
          prevProduct.categoryId === nextProduct.categoryId &&
          prevAmount != null &&
          choices.includes(prevAmount);

        const selectedAmount = keepAmount ? prevAmount : (choices[0] ?? 0);
        const selectedRate = estimateMonthlyPremium(
          nextProduct.categoryId,
          selectedAmount,
        );
        setEstimateAmountsByProductId((current) => ({
          ...current,
          [nextProduct.id]: selectedAmount,
        }));
        setEstimateRatesByProductId((current) => ({
          ...current,
          [nextProduct.id]: selectedRate,
        }));
        setQuoteRevealed(true);
      }
    } else {
      setQuoteRevealed(false);
    }
  }

  function handleGetEstimate() {
    setInitialAttempted(true);
    setAgeError("");

    if (Object.keys(initialValidationErrors).length > 0) {
      return;
    }

    // Check age eligibility (80+)
    const age = calculateAge(estimateValues.birthday);
    if (age !== null && age >= 80) {
      setAgeError(
        "We're sorry, but coverage is not available for applicants age 80 or older.",
      );
      return;
    }

    // Persist DOB/zip/state to localStorage
    saveEstimateValues({
      birthday: estimateValues.birthday,
      zipCode: estimateValues.zipCode,
      state: estimateValues.state,
    });

    // Show loading state on button
    setIsEstimateLoading(true);
    setTimeout(() => {
      setIsEstimateLoading(false);
      openQuoteModal();
    }, 1000);
  }

  function openQuoteModal() {
    // Pre-select first product if none selected
    const firstProduct =
      productsByCategory.length > 0
        ? productsByCategory[0].products[0]
        : undefined;
    const preselectedId = estimateValues.productId || firstProduct?.id || "";
    const preselectedProduct =
      coverages.find((c) => c.id === preselectedId) ?? firstProduct;

    if (preselectedProduct && !estimateValues.productId) {
      setEstimateValues((current) => ({
        ...current,
        productId: preselectedProduct.id,
      }));
    }

    // Determine if the preselected product needs additional fields
    const catId = preselectedProduct?.categoryId ?? null;
    const needsGender = catId === "LI" || catId === "DI";
    const needsSmoker = catId === "LI" || catId === "SH";
    const needsDi = catId === "DI";
    const needsOo = catId === "OO";
    const needsHours = needsDi || needsOo;
    const noAdditionalFieldsNeeded =
      !needsGender && !needsSmoker && !needsDi && !needsOo && !needsHours;

    if (noAdditionalFieldsNeeded && preselectedProduct) {
      // Show loading skeleton then reveal quote
      setQuoteRevealed(false);
      setIsQuoteLoading(true);
      setQuoteLoadingMessage("Checking for latest rates...");
      setModalAttempted(false);
      setQuoteModalOpen(true);

      setTimeout(() => {
        setQuoteLoadingMessage("Calculating your estimated cost...");
      }, 500);

      setTimeout(() => {
        const choices = generateAmountChoices(
          preselectedProduct.categoryId,
          preselectedProduct.minAmount,
          preselectedProduct.maxAmount,
        );
        const initialAmount = choices[0] ?? 0;
        const initialRate = estimateMonthlyPremium(
          preselectedProduct.categoryId,
          initialAmount,
        );
        setEstimateAmountsByProductId((current) => ({
          ...current,
          [preselectedProduct.id]: initialAmount,
        }));
        setEstimateRatesByProductId((current) => ({
          ...current,
          [preselectedProduct.id]: initialRate,
        }));
        setIsQuoteLoading(false);
        setQuoteLoadingMessage("");
        setQuoteRevealed(true);
      }, 1000);
    } else {
      setQuoteRevealed(false);
      setModalAttempted(false);
      setQuoteModalOpen(true);
    }
  }

  function handleEstimateAmountChange(
    product: CoverageDefinition,
    amount: number,
  ) {
    setEstimateAmountsByProductId((current) => ({
      ...current,
      [product.id]: amount,
    }));

    setEstimateRatesByProductId((current) => ({
      ...current,
      [product.id]: estimateMonthlyPremium(product.categoryId, amount),
    }));
  }

  function handleModalGetEstimate() {
    setModalAttempted(true);

    if (Object.keys(modalValidationErrors).length > 0) {
      return;
    }

    const product = selectedProduct;
    if (!product) return;

    // Check hours eligibility for DI/OO
    if (estimateCategoryNeedsHours) {
      const hours = parseInt(estimateValues.hoursPerWeek, 10);
      if (!isNaN(hours) && hours < 40) {
        // Reveal in error state
        setQuoteRevealed(true);
        return;
      }
    }

    // Show loading skeleton then reveal
    setQuoteRevealed(false);
    setIsQuoteLoading(true);
    setQuoteLoadingMessage("Checking for latest rates...");

    setTimeout(() => {
      setQuoteLoadingMessage("Calculating your estimated cost...");
    }, 500);

    setTimeout(() => {
      const choices = generateAmountChoices(
        product.categoryId,
        product.minAmount,
        product.maxAmount,
      );
      const initialAmount = choices[0] ?? 0;
      const initialRate = estimateMonthlyPremium(
        product.categoryId,
        initialAmount,
      );

      setEstimateAmountsByProductId((current) => ({
        ...current,
        [product.id]: initialAmount,
      }));
      setEstimateRatesByProductId((current) => ({
        ...current,
        [product.id]: initialRate,
      }));
      setIsQuoteLoading(false);
      setQuoteLoadingMessage("");
      setQuoteRevealed(true);
    }, 1000);
  }

  const isHoursIneligible =
    quoteRevealed &&
    estimateCategoryNeedsHours &&
    (() => {
      const hours = parseInt(estimateValues.hoursPerWeek, 10);
      return !isNaN(hours) && hours < 40;
    })();

  // The product currently showing a quote in the modal
  const modalProduct = selectedProduct ?? null;
  const modalAmountChoices = modalProduct
    ? generateAmountChoices(
        modalProduct.categoryId,
        modalProduct.minAmount,
        modalProduct.maxAmount,
      )
    : [];
  const modalSelectedAmount = modalProduct
    ? (estimateAmountsByProductId[modalProduct.id] ??
      modalAmountChoices[0] ??
      0)
    : 0;
  const modalEstimatedRate = modalProduct
    ? (estimateRatesByProductId[modalProduct.id] ?? 0)
    : 0;

  function handleSingleModalApply() {
    if (!modalProduct) return;

    const formValues: Record<string, unknown> = {};

    // Preset basic info
    if (estimateValues.birthday)
      formValues["birth-date"] = estimateValues.birthday;
    if (estimateValues.zipCode)
      formValues["zip-postal-code"] = estimateValues.zipCode;
    if (estimateValues.state)
      formValues["state-province"] = estimateValues.state;

    // Preset category-specific fields
    const catId = modalProduct.categoryId;
    if ((catId === "LI" || catId === "DI") && estimateValues.gender) {
      formValues["gender"] = estimateValues.gender;
    }
    if ((catId === "LI" || catId === "SH") && estimateValues.smoker) {
      formValues["smoker"] = estimateValues.smoker;
    }
    if (catId === "DI") {
      if (estimateValues.avgIncome)
        formValues["average-monthly-income"] = estimateValues.avgIncome;
      if (estimateValues.hoursPerWeek)
        formValues["hours-worked-per-week"] = estimateValues.hoursPerWeek;
    }
    if (catId === "OO") {
      if (estimateValues.hoursPerWeek)
        formValues["hours-worked-per-week"] = estimateValues.hoursPerWeek;
      if (estimateValues.monthlyExpenses)
        formValues["monthly-business-expenses"] =
          estimateValues.monthlyExpenses;
      if (estimateValues.responsibilityPct)
        formValues["business-expense-responsibility"] =
          estimateValues.responsibilityPct;
    }

    // Preset coverage selection
    formValues["selectedCoverageIds"] = [modalProduct.id];
    formValues["coverageAmounts"] = {
      [`${modalProduct.id}:member`]: modalSelectedAmount,
    };

    // Store into sessionStorage
    const existing = window.sessionStorage.getItem(STORAGE_KEY);
    let existingValues: Record<string, unknown> = {};
    if (existing) {
      try {
        existingValues = JSON.parse(existing);
      } catch {
        /* ignore */
      }
    }
    const merged = { ...existingValues, ...formValues };
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(merged));

    setQuoteModalOpen(false);
    navigate(getPagePath("eligibility"));
  }

  return (
    <>
      <Box
        sx={{
          ...SURFACE_SX,
          width: "100%",
          borderColor: "rgba(7, 104, 255, 0.14)",
          background:
            "linear-gradient(135deg, #f4f8ff 0%, #ffffff 52%, #f7fbff 100%)",
        }}
      >
        <Stack spacing={2.25} sx={{ p: { xs: 2.5, sm: 3 } }}>
          <Box>
            <Typography
              variant="h4"
              paddingBottom={0.5}
              //   sx={{ xs: "1.5rem", sm: "1.5rem", md: "1.75rem", lg: "2rem" }}
              fontWeight={600}
            >
              Get an estimate in seconds
            </Typography>
            <Typography
              variant="body2"
              //   paddingBottom={1}
              //   sx={{ xs: "1.5rem", sm: "1.5rem", md: "1.75rem", lg: "2rem" }}
              //   fontWeight={600}
            >
              Find a premium and coverage amount that's a good fit for you.
            </Typography>
          </Box>

          <Stack spacing={2.5}>
            <TextField
              label="Date of Birth"
              fullWidth
              required
              placeholder="MM/DD/YYYY"
              value={parseStoredDate(estimateValues.birthday)}
              onChange={(event) => {
                const formatted = formatDateDisplay(event.target.value);
                const digits = formatted.replace(/\D/g, "");
                if (digits.length === 8) {
                  updateEstimateValues({
                    birthday: formatDateForStorage(formatted),
                  });
                } else {
                  updateEstimateValues({ birthday: formatted });
                }
              }}
              onFocus={() => setDobFocused(true)}
              onBlur={() => setDobFocused(false)}
              inputProps={{ inputMode: "numeric" }}
              InputLabelProps={{
                shrink: dobFocused || !!estimateValues.birthday,
              }}
              error={initialAttempted && !!initialValidationErrors.birthday}
              helperText={
                initialAttempted && initialValidationErrors.birthday
                  ? initialValidationErrors.birthday
                  : undefined
              }
            />

            <TextField
              label="ZIP / Postal Code"
              fullWidth
              required
              value={estimateValues.zipCode}
              onChange={(event) =>
                updateEstimateValues({
                  zipCode: formatZipOrPostalCode(event.target.value),
                })
              }
              inputProps={{ inputMode: "text", maxLength: 7 }}
              error={initialAttempted && !!initialValidationErrors.zipCode}
              helperText={
                initialAttempted
                  ? initialValidationErrors.zipCode || undefined
                  : undefined
              }
            />

            <FormControl
              fullWidth
              required
              error={initialAttempted && !!initialValidationErrors.state}
            >
              <InputLabel id="home-estimate-state-label">State</InputLabel>
              <Select
                labelId="home-estimate-state-label"
                label="State"
                value={estimateValues.state}
                onChange={(event) =>
                  updateEstimateValues({ state: event.target.value })
                }
              >
                {stateOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
              {initialAttempted && initialValidationErrors.state ? (
                <FormHelperText>{initialValidationErrors.state}</FormHelperText>
              ) : null}
            </FormControl>
          </Stack>

          <Stack spacing={1}>
            <Button
              variant="outlined"
              size="large"
              onClick={handleGetEstimate}
              disabled={isEstimateLoading}
            >
              {isEstimateLoading ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                "Get estimate"
              )}
            </Button>
            {ageError ? (
              <Alert severity="error" sx={{ mt: 0.5 }}>
                {ageError}
              </Alert>
            ) : null}
          </Stack>
        </Stack>
      </Box>

      {/* Quote Modal (single mode) */}
      <Dialog
        open={quoteMode === "single" && quoteModalOpen}
        onClose={() => setQuoteModalOpen(false)}
        maxWidth="md"
        fullWidth
        fullScreen={!isMdUp}
      >
        <DialogTitle
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            pb: 1,
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Your coverage estimate
          </Typography>
          <IconButton
            onClick={() => setQuoteModalOpen(false)}
            aria-label="Close"
            size="small"
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={{ xs: 3, md: 4 }}
          >
            {/* Questions - left on desktop, top on mobile */}
            <Box
              sx={{
                flex: 1,
                order: { xs: 1, md: 1 },
                minWidth: 0,
              }}
            >
              <Stack spacing={2}>
                <FormControl
                  fullWidth
                  required
                  error={modalAttempted && !!modalValidationErrors.productId}
                >
                  <FormLabel
                    required
                    sx={{
                      mb: 1,
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      lineHeight: 1.66,
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      color: "rgba(0, 0, 0, 0.6)",
                    }}
                  >
                    Choose coverage
                  </FormLabel>
                  <Select
                    displayEmpty
                    value={estimateValues.productId}
                    onChange={(event) => {
                      handleEstimateProductChange(event.target.value);
                    }}
                    renderValue={(value) => {
                      if (!value) return <em>Select a product</em>;
                      const product = coverages.find((c) => c.id === value);
                      return product?.name ?? value;
                    }}
                  >
                    {productsByCategory.flatMap((group) => [
                      <ListSubheader
                        key={`${group.category.id}-header`}
                        disableSticky
                        sx={{
                          color: "text.primary",
                          fontWeight: 700,
                          lineHeight: 1.6,
                          backgroundColor: "#ffffff",
                        }}
                      >
                        {group.category.label}
                      </ListSubheader>,
                      ...group.products.map((product) => (
                        <MenuItem key={product.id} value={product.id}>
                          {product.name}
                        </MenuItem>
                      )),
                    ])}
                  </Select>
                  {modalAttempted && modalValidationErrors.productId ? (
                    <FormHelperText>
                      {modalValidationErrors.productId}
                    </FormHelperText>
                  ) : null}
                </FormControl>

                {estimateCategoryNeedsGender ? (
                  <FormControl
                    fullWidth
                    required
                    error={modalAttempted && !!modalValidationErrors.gender}
                  >
                    <FormLabel required sx={{ mb: 1 }}>
                      Gender
                    </FormLabel>
                    <ToggleButtonGroup
                      exclusive
                      value={estimateValues.gender}
                      onChange={(_, value) => {
                        if (value !== null) {
                          updateEstimateValues({
                            gender: value as EstimateGender,
                          });
                        }
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
                          checked={estimateValues.gender === "male"}
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
                          checked={estimateValues.gender === "female"}
                          size="small"
                          sx={{ p: 0 }}
                        />
                        Female
                      </ToggleButton>
                    </ToggleButtonGroup>
                    {modalAttempted && modalValidationErrors.gender ? (
                      <FormHelperText>
                        {modalValidationErrors.gender}
                      </FormHelperText>
                    ) : null}
                  </FormControl>
                ) : null}

                {estimateCategoryNeedsSmoker ? (
                  <FormControl
                    fullWidth
                    required
                    error={modalAttempted && !!modalValidationErrors.smoker}
                  >
                    <FormLabel required sx={{ mb: 1 }}>
                      Do you use nicotine products?
                    </FormLabel>
                    <ToggleButtonGroup
                      exclusive
                      value={estimateValues.smoker}
                      onChange={(_, value) => {
                        if (value !== null) {
                          updateEstimateValues({
                            smoker: value as EstimateYesNo,
                          });
                        }
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
                          checked={estimateValues.smoker === "yes"}
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
                          checked={estimateValues.smoker === "no"}
                          size="small"
                          sx={{ p: 0 }}
                        />
                        No
                      </ToggleButton>
                    </ToggleButtonGroup>
                    {modalAttempted && modalValidationErrors.smoker ? (
                      <FormHelperText>
                        {modalValidationErrors.smoker}
                      </FormHelperText>
                    ) : null}
                  </FormControl>
                ) : null}

                {estimateCategoryNeedsDi ? (
                  <TextField
                    label="Average monthly income"
                    fullWidth
                    required
                    value={
                      estimateValues.avgIncome
                        ? formatCurrencyInput(estimateValues.avgIncome)
                        : ""
                    }
                    onChange={(event) => {
                      const digits = event.target.value.replace(/[^0-9]/g, "");
                      updateEstimateValues({ avgIncome: digits });
                    }}
                    inputProps={{ inputMode: "numeric" }}
                    InputLabelProps={{ shrink: true }}
                    placeholder="$0"
                    helperText={
                      modalAttempted && modalValidationErrors.avgIncome
                        ? modalValidationErrors.avgIncome
                        : "Enter your average gross monthly income before taxes."
                    }
                    error={modalAttempted && !!modalValidationErrors.avgIncome}
                  />
                ) : null}

                {estimateCategoryNeedsHours ? (
                  <TextField
                    label="# Hours You Work/Week"
                    fullWidth
                    required
                    value={estimateValues.hoursPerWeek}
                    onChange={(event) =>
                      updateEstimateValues({
                        hoursPerWeek: event.target.value.replace(/[^0-9]/g, ""),
                      })
                    }
                    inputProps={{ inputMode: "numeric" }}
                    helperText={
                      modalAttempted && modalValidationErrors.hoursPerWeek
                        ? modalValidationErrors.hoursPerWeek
                        : undefined
                    }
                    error={
                      modalAttempted && !!modalValidationErrors.hoursPerWeek
                    }
                  />
                ) : null}

                {estimateCategoryNeedsOo ? (
                  <>
                    <TextField
                      label="Average monthly business expenses"
                      fullWidth
                      required
                      value={
                        estimateValues.monthlyExpenses
                          ? formatCurrencyInput(estimateValues.monthlyExpenses)
                          : ""
                      }
                      onChange={(event) => {
                        const digits = event.target.value.replace(
                          /[^0-9]/g,
                          "",
                        );
                        updateEstimateValues({ monthlyExpenses: digits });
                      }}
                      inputProps={{ inputMode: "numeric" }}
                      InputLabelProps={{ shrink: true }}
                      placeholder="$0"
                      helperText={
                        modalAttempted && modalValidationErrors.monthlyExpenses
                          ? modalValidationErrors.monthlyExpenses
                          : undefined
                      }
                      error={
                        modalAttempted &&
                        !!modalValidationErrors.monthlyExpenses
                      }
                    />
                    <TextField
                      label="% you are responsible for"
                      fullWidth
                      required
                      value={estimateValues.responsibilityPct}
                      onChange={(event) => {
                        const digits = event.target.value.replace(
                          /[^0-9]/g,
                          "",
                        );
                        const normalized = digits
                          ? Math.min(parseInt(digits, 10), 100).toString()
                          : "";
                        updateEstimateValues({
                          responsibilityPct: normalized,
                        });
                      }}
                      helperText={
                        modalAttempted &&
                        modalValidationErrors.responsibilityPct
                          ? modalValidationErrors.responsibilityPct
                          : undefined
                      }
                      error={
                        modalAttempted &&
                        !!modalValidationErrors.responsibilityPct
                      }
                    />
                  </>
                ) : null}

                {estimateCategoryNeedsGender ||
                estimateCategoryNeedsSmoker ||
                estimateCategoryNeedsDi ||
                estimateCategoryNeedsOo ||
                estimateCategoryNeedsHours ? (
                  <Button
                    variant="contained"
                    size="large"
                    onClick={handleModalGetEstimate}
                    disabled={isQuoteLoading}
                    sx={{ mt: 1 }}
                  >
                    {isQuoteLoading ? (
                      <CircularProgress size={20} color="inherit" />
                    ) : (
                      "Get estimate"
                    )}
                  </Button>
                ) : null}
              </Stack>
            </Box>

            {/* Quote result - right on desktop, bottom on mobile */}
            <Box
              sx={{
                flex: 1,
                order: { xs: 2, md: 2 },
                minWidth: 0,
              }}
            >
              {modalProduct ? (
                <Box
                  sx={{
                    border: "1px solid",
                    borderColor: "divider",
                    borderRadius: "16px",
                    bgcolor: "background.paper",
                    p: 2.5,
                    display: "flex",
                    flexDirection: "column",
                    gap: 1,
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
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 700,
                          fontSize: "1rem",
                          letterSpacing: "-0.25px",
                        }}
                      >
                        {modalProduct.name}
                        {modalProduct.underwritingType === "QD" && (
                          <QuickDecisionIndicator />
                        )}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ fontSize: "12px" }}
                      >
                        {modalProduct.description ?? modalProduct.definition}
                      </Typography>
                    </Stack>

                    {modalProduct.featured && (
                      <Chip
                        icon={<AutoAwesomeIcon />}
                        label="Featured"
                        size="small"
                        color="primary"
                        sx={{
                          flexShrink: 0,
                          "& .MuiChip-label": {
                            fontSize: "0.675rem",
                            fontWeight: 700,
                          },
                          "& .MuiChip-icon": {
                            fontSize: "0.875rem",
                          },
                        }}
                      />
                    )}
                  </Stack>

                  {isQuoteLoading ? (
                    <Box sx={{ py: 2 }}>
                      <Skeleton
                        variant="rounded"
                        height={42}
                        sx={{ borderRadius: 1, mb: 2 }}
                      />
                      <Skeleton
                        variant="rounded"
                        height={20}
                        sx={{ borderRadius: 1, mb: 1, width: "60%" }}
                      />
                      <Skeleton
                        variant="rounded"
                        height={32}
                        sx={{ borderRadius: 1, mb: 2, width: "40%" }}
                      />
                      <Typography
                        variant="caption"
                        sx={{
                          color: "text.secondary",
                          display: "block",
                          mt: 1,
                        }}
                      >
                        {quoteLoadingMessage}
                      </Typography>
                    </Box>
                  ) : quoteRevealed && !isHoursIneligible ? (
                    <>
                      {/* Estimated cost - blue section */}
                      <Box
                        sx={{
                          fontWeight: 800,
                          p: "16px",
                          borderRadius: "8px",
                          bgcolor: "#f5f8fd",
                          color: "primary.main",
                          display: "flex",
                          flexDirection: "column",
                          gap: 0.75,
                        }}
                      >
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                          }}
                        >
                          <Typography
                            variant="body2"
                            sx={{
                              color: "text.secondary",
                              fontWeight: 500,
                              fontSize: "12px",
                            }}
                          >
                            Estimated cost<sup>1</sup>
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{
                              color: "primary.main",
                              fontWeight: 700,
                              fontSize: "0.75rem",
                            }}
                          >
                            {formatUSD(modalEstimatedRate)}/mo
                          </Typography>
                        </Box>
                      </Box>

                      {/* Coverage amount dropdown */}
                      <Stack spacing={1} sx={{ mt: 0.5 }}>
                        <FormControl fullWidth size="small">
                          <InputLabel
                            id={`${modalProduct.id}-modal-amount-label`}
                          >
                            {getEstimateAmountLabel(modalProduct.categoryId)}
                          </InputLabel>
                          <Select
                            labelId={`${modalProduct.id}-modal-amount-label`}
                            label={getEstimateAmountLabel(
                              modalProduct.categoryId,
                            )}
                            value={modalSelectedAmount}
                            onChange={(event) =>
                              handleEstimateAmountChange(
                                modalProduct,
                                Number(event.target.value),
                              )
                            }
                          >
                            {modalAmountChoices.map((amount) => (
                              <MenuItem key={amount} value={amount}>
                                {formatUSD(amount, 0)}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Stack>

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

                      <Button
                        variant="outlined"
                        color="primary"
                        size="medium"
                        fullWidth
                        endIcon={<ArrowRightAltRoundedIcon />}
                        onClick={handleSingleModalApply}
                        sx={{ mt: 0.5 }}
                      >
                        Apply for coverage
                      </Button>
                    </>
                  ) : quoteRevealed && isHoursIneligible ? (
                    <Alert severity="error">
                      We're sorry, but this product requires working at least 40
                      hours per week to be eligible for coverage.
                    </Alert>
                  ) : (
                    <Box
                      sx={{
                        textAlign: "center",
                        py: 4,
                        color: "text.secondary",
                      }}
                    >
                      <Typography variant="body2" color="text.secondary">
                        Your estimated cost will appear here once you click
                        &ldquo;Get estimate&rdquo;.
                      </Typography>
                    </Box>
                  )}
                </Box>
              ) : (
                <Box
                  sx={{
                    border: "1px solid",
                    borderColor: "divider",
                    borderRadius: "16px",
                    bgcolor: "background.paper",
                    p: 2.5,
                    textAlign: "center",
                    py: 4,
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    Your estimated cost will appear here once you click
                    &ldquo;Get estimate&rdquo;.
                  </Typography>
                </Box>
              )}
            </Box>
          </Stack>
        </DialogContent>
      </Dialog>

      {/* Alternative comparison quote modal */}
      <ComparisonQuoteModal
        open={quoteMode === "comparison" && quoteModalOpen}
        onClose={() => setQuoteModalOpen(false)}
        coverages={coverages}
        birthday={estimateValues.birthday}
        zipCode={estimateValues.zipCode}
        state={estimateValues.state}
      />
    </>
  );
}
