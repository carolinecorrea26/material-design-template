import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import OfflineBoltIcon from "@mui/icons-material/OfflineBolt";
import PrivacyTipIcon from "@mui/icons-material/PrivacyTip";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Collapse,
  Divider,
  FormControl,
  FormHelperText,
  FormLabel,
  InputLabel,
  MenuItem,
  Radio,
  Select,
  Stack,
  Switch,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import FormRoutePage from "../components/form/FormRoutePage";
import FormPageHelp from "../components/form/FormPageHelp";
import FormHelpDrawer from "../components/form/FormHelpDrawer";
import FormSectionTitle from "../components/form/FormSectionTitle";
import ApplicantSection from "../components/form/ApplicantSection";
import QuickDecisionIndicator from "../components/common/QuickDecisionIndicator";
import QuickDecisionDrawerContent from "../components/common/QuickDecisionDrawerContent";
import { QuickDecisionMark } from "../components/common/QuickDecisionDrawerContent";
import SelectableOptionRow from "../components/form/SelectableOptionRow";
import ApplicationSummaryDrawer from "../components/layout/ApplicationSummaryDrawer";
import { getActiveClient } from "../client/getActiveClient";
import { getActiveClientCoverages } from "../client/getActiveClientCoverages";
import { coverageCategories } from "../config/coverageCategories";
import type { CoverageCategoryId } from "../config/coverages/types";
import type { CoverageApplicantId } from "../config/coverages/types";
import type { EstimatedRateFrequency } from "../config/clients/types";
import { coverageApplicantToSection } from "../config/formSectionTitle";
import { useApplicationForm } from "../state/ApplicationFormContext";
import type { ApplicationFormValues } from "../state/ApplicationFormContext";

import { colors } from "../app/theme";
import { formatUSD } from "../utils/formatUSD";
import { estimateMonthlyPremium } from "../utils/estimateMonthlyPremium";
import { generateAmountChoices as generateAmountChoicesBase } from "../utils/generateAmountChoices";

const RateFrequencySwitch = styled(Switch)(({ theme }) => ({
  width: 48,
  height: 26,
  padding: 5,
  "& .MuiSwitch-switchBase": {
    margin: 1,
    padding: 0,
    transform: "translateX(4px)",
    "&.Mui-checked": {
      color: "#fff",
      transform: "translateX(22px)",
      "& .MuiSwitch-thumb:before": {
        backgroundImage: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" height="14" width="14" viewBox="0 0 24 24"><path fill="${encodeURIComponent(
          "#fff",
        )}" d="M7 2v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-2V2h-2v2H9V2H7Zm12 18H5V10h14v10Z"/></svg>')`,
      },
      "& + .MuiSwitch-track": {
        opacity: 1,
        backgroundColor: theme.palette.primary.main,
      },
    },
  },
  "& .MuiSwitch-thumb": {
    backgroundColor: theme.palette.primary.main,
    width: 24,
    height: 24,
    "&::before": {
      content: "''",
      position: "absolute",
      width: "100%",
      height: "100%",
      left: 0,
      top: 0,
      backgroundRepeat: "no-repeat",
      backgroundPosition: "center",
      backgroundImage: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" height="14" width="14" viewBox="0 0 24 24"><path fill="${encodeURIComponent(
        "#fff",
      )}" d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2Zm0 16H5V8h14v11Z"/></svg>')`,
    },
  },
  "& .MuiSwitch-track": {
    opacity: 1,
    borderRadius: 13,
    backgroundColor: "#cdd9ec",
  },
}));

function generateAmountChoices(
  categoryId: CoverageCategoryId,
  minAmount?: number,
  maxAmount?: number,
): number[] {
  return generateAmountChoicesBase(categoryId, minAmount, maxAmount, {
    includeZero: true,
  });
}

const RATE_CALCULATION_DELAY_MS = 900;

function getDisplayedPremium(
  monthlyPremium: number,
  rateFrequency: EstimatedRateFrequency,
): number {
  return rateFrequency === "annual"
    ? Math.round(monthlyPremium * 12 * 100) / 100
    : monthlyPremium;
}

function getBenefitAmountLabel(categoryId: CoverageCategoryId): string {
  if (categoryId === "DI" || categoryId === "OO") {
    return "Monthly Benefit Amount";
  }
  return "Benefit Amount";
}

type EstimateGender = "male" | "female" | "";
type EstimateYesNo = "yes" | "no" | "";

function formatCurrencyInput(value: string): string {
  const digits = value.replace(/[^0-9]/g, "").slice(0, 12);
  if (!digits) return "";
  return `$${Number(digits).toLocaleString("en-US")}`;
}

const applicantCheckboxLabels: Record<CoverageApplicantId, string> = {
  member: "Select for myself",
  spouse: "Select for my spouse",
  child: "Select for my child",
};

const categoryMaxAggregate: Record<CoverageCategoryId, string | null> = {
  LI: "$2,000,000",
  AD: "$2,000,000",
  DI: "$12,000",
  OO: null,
  SH: null,
};

const categoryFootnotes: Partial<Record<CoverageCategoryId, string>> = {
  LI: "The maximum available through New York Life Insurance Company for any individual is $2,000,000, whether coverage is in one or divided among several group policies.",
  AD: "The maximum available through New York Life Insurance Company for any individual is $2,000,000, whether coverage is in one or divided among several group policies.",
  DI: "The maximum available through all ABE group insurance underwritten by New York Life Insurance Company is $12,000 for a member whether coverage is in one or divided among several group policies.",
};

export default function CoverageCombined() {
  const pageId = "coverage-combined";
  const theme = useTheme();
  const isMdUp = useMediaQuery(theme.breakpoints.up("md"));
  const activeClient = useMemo(() => getActiveClient(), []);
  const coverages = useMemo(() => getActiveClientCoverages(), []);
  const { values, setPageValues } = useApplicationForm();
  const [calculatingRateKeys, setCalculatingRateKeys] = useState<Set<string>>(
    () => new Set(),
  );
  const [showProducts, setShowProducts] = useState(false);
  const [productsLoading, setProductsLoading] = useState(false);
  const [qdDrawerOpen, setQdDrawerOpen] = useState(false);
  const [summaryDrawerOpen, setSummaryDrawerOpen] = useState(false);
  const rateCalculationTimersRef = useRef<Record<string, number>>({});
  const productsLoadingTimerRef = useRef<number | null>(null);

  const revealProducts = useCallback(() => {
    setShowProducts(true);
    setProductsLoading(true);
    if (productsLoadingTimerRef.current != null) {
      window.clearTimeout(productsLoadingTimerRef.current);
    }
    productsLoadingTimerRef.current = window.setTimeout(() => {
      setProductsLoading(false);
      productsLoadingTimerRef.current = null;
    }, RATE_CALCULATION_DELAY_MS);
  }, []);

  const rateDisplayConfig = activeClient.coverages.estimatedRateDisplay;
  const showRateFrequencyToggle =
    rateDisplayConfig?.showFrequencyToggle === true;
  const defaultRateFrequency: EstimatedRateFrequency =
    rateDisplayConfig?.defaultFrequency ?? "monthly";
  const [rateFrequency, setRateFrequency] =
    useState<EstimatedRateFrequency>(defaultRateFrequency);
  const [frequencyCalculating, setFrequencyCalculating] = useState(false);
  const frequencyTimerRef = useRef<number | null>(null);
  const [selectionCalculating, setSelectionCalculating] = useState(false);
  const selectionTimerRef = useRef<number | null>(null);

  // Category chip selection (multi-select)
  const availableCategories = coverageCategories.filter((category) =>
    coverages.some((coverage) => coverage.categoryId === category.id),
  );

  const [selectedCategories, setSelectedCategories] = useState<
    CoverageCategoryId[]
  >(() => {
    // Restore persisted category chips first
    const storedChips = Array.isArray(values.selectedCategoryChips)
      ? (values.selectedCategoryChips as CoverageCategoryId[])
      : [];
    if (storedChips.length > 0) return storedChips;

    // Fall back to inferring from existing coverage selections
    const existingSelections = Array.isArray(values.coverageSelections)
      ? values.coverageSelections
      : [];
    if (existingSelections.length > 0) {
      const cats = new Set<CoverageCategoryId>();
      for (const covId of existingSelections) {
        const cov = coverages.find((c) => c.id === covId);
        if (cov) cats.add(cov.categoryId);
      }
      return [...cats];
    }
    return [];
  });

  // Category-level question fields state
  const [gender, setGender] = useState<EstimateGender>(
    () => (values.gender as EstimateGender) || "",
  );
  const [smoker, setSmoker] = useState<EstimateYesNo>(
    () => (values.smoker as EstimateYesNo) || "",
  );
  const [avgIncome, setAvgIncome] = useState(
    () => (values["average-monthly-income"] as string) || "",
  );
  const [hoursPerWeek, setHoursPerWeek] = useState(
    () => (values["hours-worked-per-week"] as string) || "",
  );
  const [monthlyExpenses, setMonthlyExpenses] = useState(
    () => (values["monthly-business-expenses"] as string) || "",
  );
  const [responsibilityPct, setResponsibilityPct] = useState(
    () => (values["business-expense-responsibility"] as string) || "",
  );

  // Dependents from eligibility page
  const selectedDependents = useMemo<string[]>(
    () => (Array.isArray(values.dependents) ? values.dependents : []),
    [values.dependents],
  );

  const hasSpouse = selectedDependents.includes("spouse");

  // Product applicants
  const productApplicants = useMemo<
    Record<string, CoverageApplicantId[]>
  >(() => {
    if (
      values.productApplicants != null &&
      typeof values.productApplicants === "object" &&
      !Array.isArray(values.productApplicants)
    ) {
      return values.productApplicants as Record<string, CoverageApplicantId[]>;
    }
    return {};
  }, [values.productApplicants]);

  // Coverage amounts
  const storedAmounts = useMemo<Record<string, number>>(() => {
    if (
      values.coverageAmounts != null &&
      typeof values.coverageAmounts === "object" &&
      !Array.isArray(values.coverageAmounts)
    ) {
      return values.coverageAmounts as Record<string, number>;
    }
    return {};
  }, [values.coverageAmounts]);

  // Riders state
  const storedRiders: Record<string, boolean> =
    values.coverageRiders != null &&
    typeof values.coverageRiders === "object" &&
    !Array.isArray(values.coverageRiders)
      ? (values.coverageRiders as Record<string, boolean>)
      : {};

  const storedRiderAmounts: Record<string, number> =
    values.coverageRiderAmounts != null &&
    typeof values.coverageRiderAmounts === "object" &&
    !Array.isArray(values.coverageRiderAmounts)
      ? (values.coverageRiderAmounts as Record<string, number>)
      : {};

  // Waiting period state
  const storedWaitingPeriods = useMemo<Record<string, string>>(() => {
    if (
      values.coverageWaitingPeriods != null &&
      typeof values.coverageWaitingPeriods === "object" &&
      !Array.isArray(values.coverageWaitingPeriods)
    ) {
      return values.coverageWaitingPeriods as Record<string, string>;
    }
    return {};
  }, [values.coverageWaitingPeriods]);

  // Max benefit period state
  const storedMaxBenefitPeriods = useMemo<Record<string, string>>(() => {
    if (
      values.coverageMaxBenefitPeriods != null &&
      typeof values.coverageMaxBenefitPeriods === "object" &&
      !Array.isArray(values.coverageMaxBenefitPeriods)
    ) {
      return values.coverageMaxBenefitPeriods as Record<string, string>;
    }
    return {};
  }, [values.coverageMaxBenefitPeriods]);

  // Spouse-specific category question state
  const [spouseGender, setSpouseGender] = useState<EstimateGender>(
    () => (values["spouse-gender"] as EstimateGender) || "",
  );
  const [spouseSmoker, setSpouseSmoker] = useState<EstimateYesNo>(
    () => (values["spouse-smoker"] as EstimateYesNo) || "",
  );
  const [spouseAvgIncome, setSpouseAvgIncome] = useState(
    () => (values["spouse-average-monthly-income"] as string) || "",
  );
  const [spouseHoursPerWeek, setSpouseHoursPerWeek] = useState(
    () => (values["spouse-hours-worked-per-week"] as string) || "",
  );

  // Category needs assessment
  const categoryNeedsGender = selectedCategories.some(
    (c) => c === "LI" || c === "DI",
  );
  const categoryNeedsSmoker = selectedCategories.some(
    (c) => c === "LI" || c === "SH",
  );
  const categoryNeedsDi = selectedCategories.includes("DI");
  const categoryNeedsOo = selectedCategories.includes("OO");
  const categoryNeedsHours = categoryNeedsDi || categoryNeedsOo;

  // Whether selected categories require additional questions before showing products
  const needsAdditionalQuestions =
    categoryNeedsGender ||
    categoryNeedsSmoker ||
    categoryNeedsDi ||
    categoryNeedsOo;

  // Products filtered by selected categories
  const categoryProducts = useMemo(
    () =>
      coverages
        .filter((c) => selectedCategories.includes(c.categoryId))
        .sort((a, b) => {
          if (a.featured && !b.featured) return -1;
          if (!a.featured && b.featured) return 1;
          return a.name.localeCompare(b.name);
        }),
    [coverages, selectedCategories],
  );

  // Whether any selected category has a QD product
  const hasQdCategorySelected = categoryProducts.some(
    (c) => c.underwritingType === "QD",
  );

  // Selected coverage IDs
  const selectedCoverageIds = useMemo(
    () =>
      Array.isArray(values.coverageSelections)
        ? (values.coverageSelections as string[])
        : [],
    [values.coverageSelections],
  );

  // Visible applicants for a product
  const getVisibleApplicants = useCallback(
    (
      applicants: CoverageApplicantId[],
      _coverageId?: string,
    ): CoverageApplicantId[] => {
      return applicants.filter((a) => {
        if (a === "member") return true;
        if (a === "spouse") return selectedDependents.includes("spouse");
        if (a === "child") return selectedDependents.includes("child");
        return false;
      });
    },
    [selectedDependents],
  );

  const beginRateCalculation = useCallback((rateKey: string) => {
    window.clearTimeout(rateCalculationTimersRef.current[rateKey]);

    setCalculatingRateKeys((current) => {
      const next = new Set(current);
      next.add(rateKey);
      return next;
    });

    rateCalculationTimersRef.current[rateKey] = window.setTimeout(() => {
      setCalculatingRateKeys((current) => {
        const next = new Set(current);
        next.delete(rateKey);
        return next;
      });
      delete rateCalculationTimersRef.current[rateKey];
    }, RATE_CALCULATION_DELAY_MS);
  }, []);

  useEffect(() => {
    return () => {
      Object.values(rateCalculationTimersRef.current).forEach((timerId) => {
        window.clearTimeout(timerId);
      });
      if (productsLoadingTimerRef.current != null) {
        window.clearTimeout(productsLoadingTimerRef.current);
      }
      if (frequencyTimerRef.current != null) {
        window.clearTimeout(frequencyTimerRef.current);
      }
      if (selectionTimerRef.current != null) {
        window.clearTimeout(selectionTimerRef.current);
      }
    };
  }, []);

  // Persist category question values to form state
  useEffect(() => {
    const patch: ApplicationFormValues = {};
    if (gender) patch["gender"] = gender;
    if (smoker) patch["smoker"] = smoker;
    if (avgIncome) patch["average-monthly-income"] = avgIncome;
    if (hoursPerWeek) patch["hours-worked-per-week"] = hoursPerWeek;
    if (monthlyExpenses) patch["monthly-business-expenses"] = monthlyExpenses;
    if (responsibilityPct)
      patch["business-expense-responsibility"] = responsibilityPct;
    if (spouseGender) patch["spouse-gender"] = spouseGender;
    if (spouseSmoker) patch["spouse-smoker"] = spouseSmoker;
    if (spouseAvgIncome)
      patch["spouse-average-monthly-income"] = spouseAvgIncome;
    if (spouseHoursPerWeek)
      patch["spouse-hours-worked-per-week"] = spouseHoursPerWeek;
    if (Object.keys(patch).length > 0) {
      setPageValues(patch);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    gender,
    smoker,
    avgIncome,
    hoursPerWeek,
    monthlyExpenses,
    responsibilityPct,
    spouseGender,
    spouseSmoker,
    spouseAvgIncome,
    spouseHoursPerWeek,
  ]);

  // Auto-show products when categories don't need additional questions
  useEffect(() => {
    if (
      selectedCategories.length > 0 &&
      !needsAdditionalQuestions &&
      !showProducts
    ) {
      revealProducts();
    }
  }, [
    selectedCategories,
    needsAdditionalQuestions,
    showProducts,
    revealProducts,
  ]);

  // On mount: if categories are restored and there are existing coverage selections, auto-reveal products
  useEffect(() => {
    if (
      selectedCategories.length > 0 &&
      needsAdditionalQuestions &&
      !showProducts &&
      selectedCoverageIds.length > 0
    ) {
      revealProducts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Preset benefit amounts for all visible products to the lowest non-zero amount
  useEffect(() => {
    if (!showProducts || categoryProducts.length === 0) return;

    const nextAmounts = { ...storedAmounts };
    let hasChanges = false;

    for (const coverage of categoryProducts) {
      const visibleApplicants = getVisibleApplicants(
        coverage.applicants,
        coverage.id,
      );
      for (const applicantId of visibleApplicants) {
        const key = `${coverage.id}:${applicantId}`;
        if (nextAmounts[key] == null) {
          const choices = generateAmountChoices(
            coverage.categoryId,
            coverage.minAmount,
            coverage.maxAmount,
          );
          const firstNonZero = choices.find((amt) => amt > 0);
          if (firstNonZero != null) {
            nextAmounts[key] = firstNonZero;
            hasChanges = true;
          }
        }
      }
    }

    if (hasChanges) {
      setPageValues({ coverageAmounts: nextAmounts });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showProducts, categoryProducts]);

  function handleCategoryToggle(categoryId: CoverageCategoryId) {
    const isAdding = !selectedCategories.includes(categoryId);
    const categoryRequiresQuestions =
      categoryId === "LI" ||
      categoryId === "DI" ||
      categoryId === "OO" ||
      categoryId === "SH";

    // If adding a category that needs questions while products are showing, hide products
    if (isAdding && categoryRequiresQuestions && showProducts) {
      setShowProducts(false);
    }

    if (!isAdding) {
      // Deselecting a category: remove products in that category and hide products if none remain
      const productsInCategory = coverages
        .filter((c) => c.categoryId === categoryId)
        .map((c) => c.id);

      const nextSelectedCoverageIds = selectedCoverageIds.filter(
        (id) => !productsInCategory.includes(id),
      );

      const nextProductApplicants = { ...productApplicants };
      const nextAmounts = { ...storedAmounts };
      for (const prodId of productsInCategory) {
        delete nextProductApplicants[prodId];
        // Remove amounts for all applicants of this product
        for (const key of Object.keys(nextAmounts)) {
          if (key.startsWith(`${prodId}:`)) {
            delete nextAmounts[key];
          }
        }
      }

      setPageValues({
        coverageSelections: nextSelectedCoverageIds,
        productApplicants: nextProductApplicants,
        coverageAmounts: nextAmounts,
      });

      const nextCategories = selectedCategories.filter(
        (id) => id !== categoryId,
      );
      // If no categories remain, hide products and show empty state
      if (nextCategories.length === 0) {
        setShowProducts(false);
      }

      setSelectedCategories(nextCategories);
      setPageValues({ selectedCategoryChips: nextCategories });
      return;
    }

    const nextCategories = [...selectedCategories, categoryId];
    setSelectedCategories(nextCategories);
    setPageValues({ selectedCategoryChips: nextCategories });
  }

  function toggleApplicantForProduct(
    coverageId: string,
    applicant: CoverageApplicantId,
  ) {
    const currentApplicants = productApplicants[coverageId] ?? [];
    const isAdding = !currentApplicants.includes(applicant);
    const nextApplicants = isAdding
      ? [...currentApplicants, applicant]
      : currentApplicants.filter((a) => a !== applicant);

    // Update coverage selection
    const currentlySelected = selectedCoverageIds.includes(coverageId);
    let nextSelectedCoverageIds = [...selectedCoverageIds];
    if (nextApplicants.length > 0 && !currentlySelected) {
      nextSelectedCoverageIds = [...selectedCoverageIds, coverageId];
    } else if (nextApplicants.length === 0 && currentlySelected) {
      nextSelectedCoverageIds = selectedCoverageIds.filter(
        (id) => id !== coverageId,
      );
    }

    // Auto-select first non-zero amount when adding an applicant
    let nextAmounts = { ...storedAmounts };
    if (isAdding) {
      const coverage = categoryProducts.find((c) => c.id === coverageId);
      if (coverage) {
        const key = `${coverageId}:${applicant}`;
        if (nextAmounts[key] == null || nextAmounts[key] === 0) {
          const choices = generateAmountChoices(
            coverage.categoryId,
            coverage.minAmount,
            coverage.maxAmount,
          );
          const firstNonZero = choices.find((amt) => amt > 0);
          if (firstNonZero != null) {
            nextAmounts[key] = firstNonZero;
          }
        }
      }
    }

    // Show loader on total panel only (not inline cost)
    setSelectionCalculating(true);
    if (selectionTimerRef.current != null) {
      window.clearTimeout(selectionTimerRef.current);
    }
    selectionTimerRef.current = window.setTimeout(() => {
      setSelectionCalculating(false);
      selectionTimerRef.current = null;
    }, RATE_CALCULATION_DELAY_MS);

    setPageValues({
      coverageSelections: nextSelectedCoverageIds,
      productApplicants: {
        ...productApplicants,
        [coverageId]: nextApplicants,
      },
      coverageAmounts: nextAmounts,
    });

    // Open summary drawer when adding a product
    if (isAdding) {
      setSummaryDrawerOpen(true);
    }
  }

  function handleAmountChange(key: string, amount: number) {
    beginRateCalculation(key);
    setPageValues({
      coverageAmounts: { ...storedAmounts, [key]: amount },
    });
  }

  function handleFrequencyToggle(newFrequency: EstimatedRateFrequency) {
    setRateFrequency(newFrequency);
    setFrequencyCalculating(true);
    if (frequencyTimerRef.current != null) {
      window.clearTimeout(frequencyTimerRef.current);
    }
    frequencyTimerRef.current = window.setTimeout(() => {
      setFrequencyCalculating(false);
      frequencyTimerRef.current = null;
    }, RATE_CALCULATION_DELAY_MS);
  }

  function handleRiderToggle(
    coverageId: string,
    riderId: string,
    applicantId: CoverageApplicantId,
  ) {
    const key = `${coverageId}:${riderId}:${applicantId}`;
    const rateKey = `${coverageId}:${applicantId}`;
    beginRateCalculation(rateKey);
    setPageValues({
      coverageRiders: { ...storedRiders, [key]: !storedRiders[key] },
    });
  }

  function handleRiderAmountChange(
    coverageId: string,
    riderId: string,
    applicantId: CoverageApplicantId,
    amount: number,
  ) {
    const key = `${coverageId}:${riderId}:${applicantId}`;
    const rateKey = `${coverageId}:${applicantId}`;
    beginRateCalculation(rateKey);
    setPageValues({
      coverageRiderAmounts: { ...storedRiderAmounts, [key]: amount },
    });
  }

  function handleWaitingPeriodChange(coverageId: string, value: string) {
    const coverage = categoryProducts.find((c) => c.id === coverageId);
    if (coverage) {
      const applicants = productApplicants[coverageId] ?? [];
      applicants.forEach((applicantId) => {
        beginRateCalculation(`${coverageId}:${applicantId}`);
      });
    }
    setPageValues({
      coverageWaitingPeriods: {
        ...storedWaitingPeriods,
        [coverageId]: value,
      },
    });
  }

  function handleMaxBenefitPeriodChange(coverageId: string, value: string) {
    const coverage = categoryProducts.find((c) => c.id === coverageId);
    if (coverage) {
      const applicants = productApplicants[coverageId] ?? [];
      applicants.forEach((applicantId) => {
        beginRateCalculation(`${coverageId}:${applicantId}`);
      });
    }
    setPageValues({
      coverageMaxBenefitPeriods: {
        ...storedMaxBenefitPeriods,
        [coverageId]: value,
      },
    });
  }

  function calcApplicantPremium(
    coverage: (typeof categoryProducts)[number],
    applicantId: CoverageApplicantId,
  ): number {
    const key = `${coverage.id}:${applicantId}`;
    const amount = storedAmounts[key] ?? 0;
    let premium = estimateMonthlyPremium(coverage.categoryId, amount);

    if (coverage.riders && amount > 0) {
      for (const rider of coverage.riders) {
        const riderKey = `${coverage.id}:${rider.id}:${applicantId}`;
        if (storedRiders[riderKey]) {
          const riderAmount = rider.hasAmount
            ? (storedRiderAmounts[riderKey] ?? 0)
            : amount;
          premium +=
            estimateMonthlyPremium(coverage.categoryId, riderAmount) *
            rider.premiumFactor;
        }
      }
    }

    return Math.round(premium * 100) / 100;
  }

  // Total estimated cost
  const grandTotal = useMemo(() => {
    return categoryProducts
      .filter((c) => selectedCoverageIds.includes(c.id))
      .reduce((total, coverage) => {
        const applicants = productApplicants[coverage.id] ?? [];
        return (
          total +
          applicants.reduce(
            (sum, applicantId) =>
              sum + calcApplicantPremium(coverage, applicantId),
            0,
          )
        );
      }, 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryProducts, selectedCoverageIds, productApplicants, storedAmounts]);

  function validate(nextValues: Record<string, unknown>) {
    const nextSelectedCoverageIds = Array.isArray(nextValues.coverageSelections)
      ? nextValues.coverageSelections
      : [];

    if (nextSelectedCoverageIds.length === 0) {
      return "Please select at least one coverage to continue.";
    }

    const nextProductApplicants =
      nextValues.productApplicants != null &&
      typeof nextValues.productApplicants === "object" &&
      !Array.isArray(nextValues.productApplicants)
        ? (nextValues.productApplicants as Record<
            string,
            CoverageApplicantId[]
          >)
        : {};

    for (const coverageId of nextSelectedCoverageIds) {
      const applicants = nextProductApplicants[coverageId];
      if (!Array.isArray(applicants) || applicants.length === 0) {
        return "Please select at least one applicant for each selected product.";
      }
    }

    // Require at least one amount > 0
    const nextAmounts =
      nextValues.coverageAmounts != null &&
      typeof nextValues.coverageAmounts === "object" &&
      !Array.isArray(nextValues.coverageAmounts)
        ? (nextValues.coverageAmounts as Record<string, number>)
        : {};

    const hasAmount = Object.values(nextAmounts).some((v) => v > 0);
    if (!hasAmount) {
      return "Select at least one coverage amount before continuing.";
    }

    return undefined;
  }

  const helpItems: {
    id: string;
    label: string;
    title: React.ReactNode;
    content: React.ReactNode;
  }[] = [];

  // Render category questions for a given applicant context
  function renderCategoryQuestions(applicantContext: "self" | "spouse") {
    const isSelf = applicantContext === "self";
    const genderVal = isSelf ? gender : spouseGender;
    const setGenderFn = isSelf ? setGender : setSpouseGender;
    const smokerVal = isSelf ? smoker : spouseSmoker;
    const setSmokerFn = isSelf ? setSmoker : setSpouseSmoker;
    const incomeVal = isSelf ? avgIncome : spouseAvgIncome;
    const setIncomeFn = isSelf ? setAvgIncome : setSpouseAvgIncome;
    const hoursVal = isSelf ? hoursPerWeek : spouseHoursPerWeek;
    const setHoursFn = isSelf ? setHoursPerWeek : setSpouseHoursPerWeek;

    const showGender = categoryNeedsGender;
    const showSmoker = categoryNeedsSmoker;
    const showHours = categoryNeedsHours;
    const showDi = categoryNeedsDi;
    // OO business questions only shown for self
    const showOo = isSelf && categoryNeedsOo;

    if (!showGender && !showSmoker && !showHours && !showDi && !showOo) {
      return null;
    }

    return (
      <Stack spacing={2}>
        {/* Gender / Smoker section */}
        {(showGender || showSmoker) && (
          <>
            <Divider />
            <Typography variant="overline">Personal details</Typography>
            {showGender && (
              <FormControl fullWidth>
                <FormLabel sx={{ mb: 1 }}>Gender</FormLabel>
                <ToggleButtonGroup
                  exclusive
                  value={genderVal}
                  onChange={(_, value) => {
                    if (value !== null) setGenderFn(value as EstimateGender);
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
                      checked={genderVal === "male"}
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
                      checked={genderVal === "female"}
                      size="small"
                      sx={{ p: 0 }}
                    />
                    Female
                  </ToggleButton>
                </ToggleButtonGroup>
              </FormControl>
            )}
            {showSmoker && (
              <FormControl fullWidth>
                <FormLabel sx={{ mb: 1 }}>
                  Do you use nicotine products?
                </FormLabel>
                <ToggleButtonGroup
                  exclusive
                  value={smokerVal}
                  onChange={(_, value) => {
                    if (value !== null) setSmokerFn(value as EstimateYesNo);
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
                      checked={smokerVal === "yes"}
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
                      checked={smokerVal === "no"}
                      size="small"
                      sx={{ p: 0 }}
                    />
                    No
                  </ToggleButton>
                </ToggleButtonGroup>
              </FormControl>
            )}
          </>
        )}

        {/* Work hours / Income section */}
        {(showDi || showHours) && (
          <>
            <Divider />
            <Typography variant="overline">Work &amp; income</Typography>
            {showHours && (
              <TextField
                label="# Hours You Work/Week"
                fullWidth
                value={hoursVal}
                onChange={(event) =>
                  setHoursFn(event.target.value.replace(/[^0-9]/g, ""))
                }
                inputProps={{ inputMode: "numeric" }}
              />
            )}
            {showDi && (
              <TextField
                label="Average monthly income"
                fullWidth
                value={incomeVal ? formatCurrencyInput(incomeVal) : ""}
                onChange={(event) => {
                  const digits = event.target.value.replace(/[^0-9]/g, "");
                  setIncomeFn(digits);
                }}
                inputProps={{ inputMode: "numeric" }}
                InputLabelProps={{ shrink: true }}
                placeholder="$0"
                helperText="Enter your average gross monthly income before taxes."
              />
            )}
          </>
        )}

        {/* Business questions section (self only) */}
        {showOo && (
          <>
            <Divider />
            <Typography variant="overline">Business expenses</Typography>
            <TextField
              label="Average monthly business expenses"
              fullWidth
              value={
                monthlyExpenses ? formatCurrencyInput(monthlyExpenses) : ""
              }
              onChange={(event) => {
                const digits = event.target.value.replace(/[^0-9]/g, "");
                setMonthlyExpenses(digits);
              }}
              inputProps={{ inputMode: "numeric" }}
              InputLabelProps={{ shrink: true }}
              placeholder="$0"
            />
            <TextField
              label="% you are responsible for"
              fullWidth
              value={responsibilityPct}
              onChange={(event) => {
                const digits = event.target.value.replace(/[^0-9]/g, "");
                const normalized = digits
                  ? Math.min(parseInt(digits, 10), 100).toString()
                  : "";
                setResponsibilityPct(normalized);
              }}
            />
          </>
        )}
      </Stack>
    );
  }

  // Estimated cost panel content (same design as CoverageOptions expanded flow)
  function EstimatedCostPanelContent() {
    const isAnyRateCalculating =
      calculatingRateKeys.size > 0 ||
      frequencyCalculating ||
      selectionCalculating;

    const displayedGrandTotal = getDisplayedPremium(grandTotal, rateFrequency);
    const rateSuffix = rateFrequency === "annual" ? "/yr" : "/mo";

    return (
      <Box
        sx={{
          p: "16px",
          borderRadius: "8px",
          bgcolor: "#f8fafd",
        }}
      >
        <Stack spacing={1.5}>
          <Typography variant="h6">
            Estimated cost<sup>1</sup>
          </Typography>

          {grandTotal <= 0 ? (
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
                sx={{
                  fontSize: 17,
                  color: "text.disabled",
                }}
              />
              <Typography
                variant="body2"
                sx={{
                  fontSize: "0.8rem",
                  fontWeight: 600,
                }}
              >
                Added coverage will appear here
              </Typography>
            </Box>
          ) : (
            <>
              {categoryProducts
                .filter((c) => selectedCoverageIds.includes(c.id))
                .map((coverage) => {
                  const applicants = productApplicants[coverage.id] ?? [];
                  const coverageTotal = applicants.reduce(
                    (sum, applicantId) =>
                      sum + calcApplicantPremium(coverage, applicantId),
                    0,
                  );
                  const isAnyCalculatingForCoverage =
                    applicants.some((a) =>
                      calculatingRateKeys.has(`${coverage.id}:${a}`),
                    ) || frequencyCalculating;

                  if (coverageTotal <= 0 && !isAnyCalculatingForCoverage)
                    return null;

                  const displayedTotal = getDisplayedPremium(
                    coverageTotal,
                    rateFrequency,
                  );
                  const coverageRateSuffix =
                    rateFrequency === "annual" ? "/yr" : "/mo";

                  return (
                    <Stack
                      key={coverage.id}
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                      spacing={1}
                    >
                      <Typography
                        variant="body2"
                        sx={{
                          fontSize: 12,
                          fontWeight: 500,
                          color: "text.secondary",
                        }}
                      >
                        {coverage.name}
                      </Typography>
                      {isAnyCalculatingForCoverage ? (
                        <CircularProgress
                          size={16}
                          thickness={4}
                          sx={{ color: "primary.main" }}
                        />
                      ) : (
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 700,
                            fontSize: 14,
                            whiteSpace: "nowrap",
                          }}
                        >
                          {formatUSD(displayedTotal)}
                          {coverageRateSuffix}
                        </Typography>
                      )}
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
                  <Typography
                    variant="body2"
                    sx={{ fontWeight: 600, fontSize: 12 }}
                  >
                    Total
                  </Typography>
                  {isAnyRateCalculating ? (
                    <CircularProgress
                      size={16}
                      thickness={4}
                      sx={{ color: "primary.main" }}
                    />
                  ) : (
                    <Typography
                      component="span"
                      variant="body2"
                      sx={{
                        color: "primary.main",
                        fontWeight: 700,
                        fontSize: 14,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {formatUSD(displayedGrandTotal)}
                      <Typography
                        component="span"
                        variant="body2"
                        sx={{
                          color: "primary.main",
                          fontWeight: 700,
                          fontSize: 14,
                        }}
                      >
                        {rateSuffix}
                      </Typography>
                    </Typography>
                  )}
                </Stack>
              </Box>

              {showRateFrequencyToggle && (
                <Stack
                  direction="row"
                  spacing={0.75}
                  alignItems="center"
                  justifyContent="end"
                >
                  <Typography
                    variant="caption"
                    sx={{
                      color:
                        rateFrequency === "monthly"
                          ? "primary.main"
                          : "text.secondary",
                      fontWeight: 700,
                    }}
                  >
                    Monthly
                  </Typography>
                  <RateFrequencySwitch
                    checked={rateFrequency === "annual"}
                    onChange={(event) =>
                      handleFrequencyToggle(
                        event.target.checked ? "annual" : "monthly",
                      )
                    }
                    slotProps={{
                      input: {
                        "aria-label":
                          "Toggle estimated cost between monthly and annual",
                      },
                    }}
                  />
                  <Typography
                    variant="caption"
                    sx={{
                      color:
                        rateFrequency === "annual"
                          ? "primary.main"
                          : "text.secondary",
                      fontWeight: 700,
                    }}
                  >
                    Annual
                  </Typography>
                </Stack>
              )}
            </>
          )}
        </Stack>
      </Box>
    );
  }

  return (
    <FormRoutePage
      pageId={pageId}
      validate={validate}
      help={<FormPageHelp items={helpItems} />}
      hideNextButton={() => {
        // Hide Next until product boxes are revealed and done loading
        return !showProducts || productsLoading;
      }}
    >
      {/* Section 1: Category chips + coverage questions (full width, no sidebar) */}
      <Stack spacing={3}>
        {/* Category chips (multi-select) */}
        <Box>
          <Typography variant="overline" sx={{ mb: 1.5, display: "block" }}>
            Choose category
          </Typography>
          <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mt: 1 }}>
            {availableCategories.map((category) => {
              const Icon = category.icon;
              const isSelected = selectedCategories.includes(category.id);
              return (
                <Chip
                  key={category.id}
                  className="coverageCategoryChip"
                  icon={<Icon sx={{ fontSize: "1.25rem !important" }} />}
                  label={
                    "shortLabel" in category
                      ? category.shortLabel
                      : category.label
                  }
                  variant={isSelected ? "filled" : "outlined"}
                  color={isSelected ? "primary" : "default"}
                  onClick={() => handleCategoryToggle(category.id)}
                />
              );
            })}
          </Stack>
        </Box>

        {/* Category-level question fields with self/spouse sections */}
        {selectedCategories.length > 0 &&
          (categoryNeedsGender ||
            categoryNeedsSmoker ||
            categoryNeedsDi ||
            categoryNeedsOo) && (
            <Box>
              {hasSpouse ? (
                <>
                  <ApplicantSection applicant="self" showLabel>
                    {renderCategoryQuestions("self")}
                  </ApplicantSection>
                  <ApplicantSection applicant="spouse" showLabel>
                    {renderCategoryQuestions("spouse")}
                  </ApplicantSection>
                </>
              ) : (
                renderCategoryQuestions("self")
              )}
            </Box>
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
                Your coverage options will appear here.
              </Typography>
              <Typography variant="body2" sx={{ color: "text.disabled" }}>
                Select a coverage category to see available options.
              </Typography>
            </Stack>
          </Box>
        )}
      </Stack>

      {/* Divider between coverage questions and products */}
      {selectedCategories.length > 0 && showProducts && (
        <Divider sx={{ my: 4 }} />
      )}

      {/* Section 2: Product boxes with estimated cost sidebar */}
      {selectedCategories.length > 0 && showProducts && (
        <Box>
          {productsLoading ? (
            <Stack spacing={2} alignItems="center" sx={{ py: 6 }}>
              <CircularProgress size={32} />
              <Typography variant="body2" color="text.secondary">
                Loading your coverage options…
              </Typography>
            </Stack>
          ) : (
            <>
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
                    backgroundColor: colors.successBg,
                  }}
                >
                  <OfflineBoltIcon
                    color="success"
                    sx={{ mt: 0.25, flexShrink: 0 }}
                  />
                  <Typography variant="body2" color="text.secondary">
                    <Typography
                      component="span"
                      variant="body2"
                      sx={{ fontWeight: 700, color: "success.main" }}
                    >
                      <QuickDecisionMark />
                    </Typography>{" "}
                    helps many applicants receive a decision instantly or within
                    a few days without a medical exam. This starts with health
                    questions you answer online to reduce time needed with phone
                    calls or other follow up.{" "}
                    <Typography
                      component="span"
                      role="button"
                      tabIndex={0}
                      onClick={() => setQdDrawerOpen(true)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          setQdDrawerOpen(true);
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

              <Box
                sx={{
                  display: "flex",
                  flexDirection: { xs: "column", md: "row" },
                  alignItems: { md: "flex-start" },
                  gap: 3,
                }}
              >
                {/* Product boxes column */}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Collapse in={showProducts}>
                    <Stack spacing={3}>
                      {selectedCategories.map((categoryId) => {
                        const category = availableCategories.find(
                          (c) => c.id === categoryId,
                        );
                        if (!category) return null;
                        const productsInCategory = categoryProducts.filter(
                          (c) => c.categoryId === categoryId,
                        );
                        if (productsInCategory.length === 0) return null;
                        return (
                          <Stack spacing={2} key={categoryId}>
                            <Stack>
                              <Typography variant="overline">
                                {category.label}
                              </Typography>
                              {categoryMaxAggregate[categoryId] && (
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                  sx={{ fontSize: "0.75rem" }}
                                >
                                  Max aggregate:{" "}
                                  {categoryMaxAggregate[categoryId]}
                                </Typography>
                              )}
                            </Stack>
                            {productsInCategory.map((coverage) => {
                              const visibleApplicants = getVisibleApplicants(
                                coverage.applicants,
                                coverage.id,
                              );
                              const currentApplicants =
                                productApplicants[coverage.id] ?? [];
                              const hasAnyApplicantSelected =
                                currentApplicants.length > 0;

                              return (
                                <Box
                                  key={coverage.id}
                                  sx={{
                                    border: "1px solid",
                                    borderColor: hasAnyApplicantSelected
                                      ? "primary.main"
                                      : "divider",
                                    borderRadius: "16px",
                                    background:
                                      "linear-gradient(135deg, rgb(244, 248, 255) 0%, rgb(255, 255, 255) 52%, rgb(247, 251, 255) 100%)",
                                    p: 2.5,
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: 1.5,
                                  }}
                                >
                                  {/* Product title / subtitle */}
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
                                        {coverage.name}
                                        {coverage.underwritingType === "QD" && (
                                          <QuickDecisionIndicator />
                                        )}
                                      </Typography>
                                      <Typography
                                        variant="body2"
                                        color="text.secondary"
                                        sx={{ fontSize: "12px" }}
                                      >
                                        {coverage.description ??
                                          coverage.definition}
                                      </Typography>
                                    </Stack>
                                    {coverage.featured && (
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

                                  {/* Per-applicant sections */}
                                  {(() => {
                                    const choices = generateAmountChoices(
                                      coverage.categoryId,
                                      coverage.minAmount,
                                      coverage.maxAmount,
                                    );
                                    const amountLabel = getBenefitAmountLabel(
                                      coverage.categoryId,
                                    );
                                    const rateSuffix =
                                      rateFrequency === "annual"
                                        ? "/yr"
                                        : "/mo";
                                    const isMultiApplicant =
                                      visibleApplicants.length > 1;

                                    return (
                                      <Stack
                                        spacing={isMultiApplicant ? 3 : 2}
                                        sx={{ mt: 1 }}
                                      >
                                        {visibleApplicants.map(
                                          (applicantId, idx) => {
                                            const isSelected =
                                              currentApplicants.includes(
                                                applicantId,
                                              );
                                            const sectionId =
                                              coverageApplicantToSection[
                                                applicantId
                                              ];
                                            const key = `${coverage.id}:${applicantId}`;
                                            const currentAmount =
                                              storedAmounts[key] ?? 0;
                                            const hasAmountSelection =
                                              storedAmounts[key] != null;
                                            const selectValue =
                                              hasAmountSelection
                                                ? currentAmount
                                                : "";
                                            const isCalculatingRate =
                                              calculatingRateKeys.has(key);
                                            const premium = isSelected
                                              ? calcApplicantPremium(
                                                  coverage,
                                                  applicantId,
                                                )
                                              : estimateMonthlyPremium(
                                                  coverage.categoryId,
                                                  currentAmount,
                                                );
                                            const displayedPremium =
                                              getDisplayedPremium(
                                                premium,
                                                rateFrequency,
                                              );

                                            return (
                                              <Box key={applicantId}>
                                                {/* Applicant header (multi-applicant only) */}
                                                {isMultiApplicant && (
                                                  <>
                                                    {idx > 0 && (
                                                      <Divider
                                                        sx={{ mb: 1.5 }}
                                                      />
                                                    )}
                                                    <Box sx={{ mb: 1.5 }}>
                                                      <FormSectionTitle
                                                        applicant={sectionId}
                                                      />
                                                    </Box>
                                                  </>
                                                )}

                                                {/* Select checkbox for this applicant */}
                                                <SelectableOptionRow>
                                                  <Checkbox
                                                    checked={isSelected}
                                                    onChange={() =>
                                                      toggleApplicantForProduct(
                                                        coverage.id,
                                                        applicantId,
                                                      )
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
                                                  <Typography
                                                    variant="body2"
                                                    sx={{
                                                      flex: 1,
                                                      fontWeight: 600,
                                                    }}
                                                  >
                                                    {
                                                      applicantCheckboxLabels[
                                                        applicantId
                                                      ]
                                                    }
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

                                                {/* Benefit amount & cost for this applicant */}
                                                <Stack
                                                  spacing={1.5}
                                                  sx={{ mt: 1.5 }}
                                                >
                                                  {/* Benefit amount select */}
                                                  <FormControl
                                                    fullWidth
                                                    margin="normal"
                                                  >
                                                    <InputLabel>
                                                      {amountLabel}
                                                    </InputLabel>
                                                    <Select
                                                      label={amountLabel}
                                                      value={selectValue}
                                                      displayEmpty={false}
                                                      onChange={(e) =>
                                                        handleAmountChange(
                                                          key,
                                                          Number(
                                                            e.target.value,
                                                          ),
                                                        )
                                                      }
                                                    >
                                                      {choices.map((amt) => (
                                                        <MenuItem
                                                          key={amt}
                                                          value={amt}
                                                        >
                                                          {formatUSD(amt, 0)}
                                                        </MenuItem>
                                                      ))}
                                                    </Select>
                                                  </FormControl>

                                                  {/* Estimated cost */}
                                                  {hasAmountSelection &&
                                                    currentAmount > 0 && (
                                                      <Stack
                                                        direction="row"
                                                        spacing={1}
                                                        justifyContent="flex-end"
                                                        alignItems="center"
                                                        sx={{ minHeight: 21 }}
                                                      >
                                                        {isCalculatingRate ||
                                                        frequencyCalculating ? (
                                                          <CircularProgress
                                                            size={16}
                                                            thickness={4}
                                                            sx={{
                                                              color:
                                                                "primary.main",
                                                            }}
                                                          />
                                                        ) : (
                                                          <Typography
                                                            variant="body2"
                                                            sx={{
                                                              color:
                                                                "text.secondary",
                                                              fontSize: 12,
                                                              lineHeight:
                                                                "21px",
                                                            }}
                                                          >
                                                            Est. cost
                                                            <sup>1</sup>:{" "}
                                                            <Typography
                                                              component="span"
                                                              sx={{
                                                                color:
                                                                  "primary.main",
                                                                fontSize: 14,
                                                                fontWeight: 700,
                                                                lineHeight:
                                                                  "21px",
                                                              }}
                                                            >
                                                              {formatUSD(
                                                                displayedPremium,
                                                              )}
                                                              {rateSuffix}
                                                            </Typography>
                                                          </Typography>
                                                        )}
                                                      </Stack>
                                                    )}

                                                  {/* Additional fields revealed when applicant is selected */}
                                                  {isSelected &&
                                                    currentAmount > 0 && (
                                                      <>
                                                        {/* Waiting Period (DI and OO) */}
                                                        {coverage.waitingPeriodOptions &&
                                                          (coverage.categoryId ===
                                                            "DI" ||
                                                            coverage.categoryId ===
                                                              "OO") && (
                                                            <FormControl
                                                              fullWidth
                                                              margin="normal"
                                                            >
                                                              <InputLabel>
                                                                Waiting Period
                                                              </InputLabel>
                                                              <Select
                                                                label="Waiting Period"
                                                                value={
                                                                  storedWaitingPeriods[
                                                                    coverage.id
                                                                  ] ??
                                                                  coverage
                                                                    .waitingPeriodOptions[0]
                                                                    .value
                                                                }
                                                                onChange={(e) =>
                                                                  handleWaitingPeriodChange(
                                                                    coverage.id,
                                                                    e.target
                                                                      .value as string,
                                                                  )
                                                                }
                                                              >
                                                                {coverage.waitingPeriodOptions.map(
                                                                  (opt) => (
                                                                    <MenuItem
                                                                      key={
                                                                        opt.value
                                                                      }
                                                                      value={
                                                                        opt.value
                                                                      }
                                                                    >
                                                                      {
                                                                        opt.label
                                                                      }
                                                                    </MenuItem>
                                                                  ),
                                                                )}
                                                              </Select>
                                                              <FormHelperText>
                                                                The number of
                                                                consecutive days
                                                                you must be
                                                                totally disabled
                                                                by a covered
                                                                illness or
                                                                injury and not
                                                                gainfully
                                                                employed in any
                                                                occupation
                                                                before benefits
                                                                commence.
                                                                Coverage with a
                                                                longer waiting
                                                                period is less
                                                                expensive.
                                                              </FormHelperText>
                                                            </FormControl>
                                                          )}

                                                        {/* Maximum Benefit Period (OO only) */}
                                                        {coverage.categoryId ===
                                                          "OO" &&
                                                          coverage.maxBenefitPeriodOptions && (
                                                            <FormControl
                                                              fullWidth
                                                              margin="normal"
                                                            >
                                                              <InputLabel>
                                                                Maximum Benefit
                                                                Period
                                                              </InputLabel>
                                                              <Select
                                                                label="Maximum Benefit Period"
                                                                value={
                                                                  storedMaxBenefitPeriods[
                                                                    coverage.id
                                                                  ] ??
                                                                  coverage
                                                                    .maxBenefitPeriodOptions[0]
                                                                    .value
                                                                }
                                                                onChange={(e) =>
                                                                  handleMaxBenefitPeriodChange(
                                                                    coverage.id,
                                                                    e.target
                                                                      .value as string,
                                                                  )
                                                                }
                                                              >
                                                                {coverage.maxBenefitPeriodOptions.map(
                                                                  (opt) => (
                                                                    <MenuItem
                                                                      key={
                                                                        opt.value
                                                                      }
                                                                      value={
                                                                        opt.value
                                                                      }
                                                                    >
                                                                      {
                                                                        opt.label
                                                                      }
                                                                    </MenuItem>
                                                                  ),
                                                                )}
                                                              </Select>
                                                              <FormHelperText>
                                                                The maximum
                                                                length of time
                                                                Office Overhead
                                                                benefits will be
                                                                paid for
                                                                eligible
                                                                business
                                                                expenses while
                                                                disabled.
                                                              </FormHelperText>
                                                            </FormControl>
                                                          )}

                                                        {/* Optional Benefit(s) — riders */}
                                                        {coverage.riders &&
                                                          coverage.riders
                                                            .length > 0 && (
                                                            <Box>
                                                              <Typography
                                                                variant="body2"
                                                                sx={{
                                                                  fontWeight: 700,
                                                                  mb: 1,
                                                                }}
                                                              >
                                                                Optional
                                                                Benefit(s)
                                                              </Typography>
                                                              <Stack
                                                                spacing={1}
                                                              >
                                                                {coverage.riders.map(
                                                                  (rider) => {
                                                                    const riderKey = `${coverage.id}:${rider.id}:${applicantId}`;
                                                                    const isChecked =
                                                                      !!storedRiders[
                                                                        riderKey
                                                                      ];

                                                                    return (
                                                                      <Box
                                                                        key={
                                                                          rider.id
                                                                        }
                                                                      >
                                                                        <SelectableOptionRow>
                                                                          <Checkbox
                                                                            checked={
                                                                              isChecked
                                                                            }
                                                                            onChange={() =>
                                                                              handleRiderToggle(
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
                                                                              pointerEvents:
                                                                                "none",
                                                                              color:
                                                                                "text.primary",
                                                                              "&.Mui-checked":
                                                                                {
                                                                                  color:
                                                                                    "primary.main",
                                                                                },
                                                                            }}
                                                                          />
                                                                          <Stack
                                                                            spacing={
                                                                              0.5
                                                                            }
                                                                            sx={{
                                                                              flex: 1,
                                                                              minWidth: 0,
                                                                            }}
                                                                          >
                                                                            <Typography
                                                                              variant="body2"
                                                                              sx={{
                                                                                fontWeight: 700,
                                                                              }}
                                                                            >
                                                                              {
                                                                                rider.name
                                                                              }
                                                                            </Typography>
                                                                            <Typography
                                                                              variant="body2"
                                                                              color="text.secondary"
                                                                            >
                                                                              {
                                                                                rider.description
                                                                              }
                                                                            </Typography>
                                                                          </Stack>
                                                                        </SelectableOptionRow>

                                                                        {/* Rider with amount selection */}
                                                                        {rider.hasAmount &&
                                                                          isChecked &&
                                                                          rider.minAmount !=
                                                                            null &&
                                                                          rider.maxAmount !=
                                                                            null && (
                                                                            <FormControl
                                                                              margin="normal"
                                                                              sx={{
                                                                                ml: 4,
                                                                                minWidth: 250,
                                                                              }}
                                                                            >
                                                                              <InputLabel>
                                                                                Rider
                                                                                Benefit
                                                                                Amount
                                                                              </InputLabel>
                                                                              <Select
                                                                                label="Rider Benefit Amount"
                                                                                value={
                                                                                  storedRiderAmounts[
                                                                                    riderKey
                                                                                  ] ??
                                                                                  0
                                                                                }
                                                                                onChange={(
                                                                                  e,
                                                                                ) =>
                                                                                  handleRiderAmountChange(
                                                                                    coverage.id,
                                                                                    rider.id,
                                                                                    applicantId,
                                                                                    Number(
                                                                                      e
                                                                                        .target
                                                                                        .value,
                                                                                    ),
                                                                                  )
                                                                                }
                                                                              >
                                                                                {generateAmountChoices(
                                                                                  coverage.categoryId,
                                                                                  rider.minAmount,
                                                                                  rider.maxAmount,
                                                                                ).map(
                                                                                  (
                                                                                    amt,
                                                                                  ) => (
                                                                                    <MenuItem
                                                                                      key={
                                                                                        amt
                                                                                      }
                                                                                      value={
                                                                                        amt
                                                                                      }
                                                                                    >
                                                                                      {formatUSD(
                                                                                        amt,
                                                                                        0,
                                                                                      )}
                                                                                    </MenuItem>
                                                                                  ),
                                                                                )}
                                                                              </Select>
                                                                            </FormControl>
                                                                          )}
                                                                      </Box>
                                                                    );
                                                                  },
                                                                )}
                                                              </Stack>
                                                            </Box>
                                                          )}
                                                      </>
                                                    )}

                                                  {/* Message when amount is $0 */}
                                                  {isSelected &&
                                                    hasAmountSelection &&
                                                    currentAmount === 0 && (
                                                      <Alert
                                                        severity="info"
                                                        icon={false}
                                                        sx={{ mt: 1 }}
                                                      >
                                                        You have selected $0 for
                                                        this coverage. This
                                                        means you are not
                                                        applying for this
                                                        product. Please ensure
                                                        your selections look
                                                        correct.
                                                      </Alert>
                                                    )}
                                                </Stack>
                                              </Box>
                                            );
                                          },
                                        )}
                                      </Stack>
                                    );
                                  })()}
                                </Box>
                              );
                            })}
                            {categoryFootnotes[categoryId] && (
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{
                                  display: "block",
                                  mt: 1,
                                  fontStyle: "italic",
                                  fontSize: "0.7rem",
                                  lineHeight: 1.4,
                                }}
                              >
                                {categoryFootnotes[categoryId]}
                              </Typography>
                            )}
                          </Stack>
                        );
                      })}
                    </Stack>
                  </Collapse>
                </Box>

                {/* Right column: sticky estimated cost panel (md+ only) */}
                {isMdUp && (
                  <Box
                    sx={{
                      position: "sticky",
                      top: 24,
                      alignSelf: "flex-start",
                      width: "40%",
                      minWidth: 240,
                      maxWidth: 290,
                      flexShrink: 0,
                    }}
                  >
                    <EstimatedCostPanelContent />
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ display: "block", mt: 1.5, fontStyle: "italic" }}
                    >
                      <sup>1</sup> Quoted cost is the best rate available. Final
                      cost may vary based on gender, health status, and
                      tobacco/nicotine use.
                    </Typography>
                  </Box>
                )}
              </Box>
            </>
          )}
        </Box>
      )}

      {/* Estimated cost section on mobile (below products) */}
      {!isMdUp && showProducts && !productsLoading && (
        <Box sx={{ mt: 3 }}>
          <EstimatedCostPanelContent />
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: "block", mt: 1.5, fontStyle: "italic" }}
          >
            <sup>1</sup> Quoted cost is the best rate available. Final cost may
            vary based on gender, health status, and tobacco/nicotine use.
          </Typography>
        </Box>
      )}

      {/* "See my coverage options" button - replaces Next button when questions need answering */}
      {selectedCategories.length > 0 &&
        !showProducts &&
        needsAdditionalQuestions && (
          <Box sx={{ mt: "2rem", mb: "1rem" }}>
            <Button
              variant="contained"
              fullWidth
              onClick={() => revealProducts()}
              endIcon={<ArrowForwardRoundedIcon />}
              sx={() => ({
                fontWeight: 700,
                padding: "16px",
                boxShadow: "0 8px 18px #0668ff3d",
                "&:hover": {
                  boxShadow: "0 8px 18px #0668ff3d",
                },
              })}
            >
              See my coverage options
            </Button>
          </Box>
        )}

      <FormHelpDrawer
        open={qdDrawerOpen}
        title={
          <>
            What is <QuickDecisionMark />?
          </>
        }
        onClose={() => setQdDrawerOpen(false)}
      >
        <QuickDecisionDrawerContent />
      </FormHelpDrawer>

      <ApplicationSummaryDrawer
        open={summaryDrawerOpen}
        onClose={() => setSummaryDrawerOpen(false)}
        source="coverage-page"
      />
    </FormRoutePage>
  );
}
