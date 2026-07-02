import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getActiveClient } from "../../config/client/getActiveClient";
import { getActiveClientCoverages } from "../../config/client/getActiveClientCoverages";
import { coverageCategories } from "../../config/coverageCategories";
import type { CoverageCategoryId } from "../../config/coverages/types";
import type { CoverageApplicantId } from "../../config/coverages/types";
import type { EstimatedRateFrequency } from "../../config/clients/types";
import { useApplicationForm } from "../../app/ApplicationFormContext";
import { estimateMonthlyPremium } from "../../utils/estimateMonthlyPremium";
import { generateAmountChoices as generateAmountChoicesBase } from "../../utils/generateAmountChoices";
import { RATE_CALCULATION_DELAY_MS } from "../../config/coverageConstants";

function generateAmountChoices(
  categoryId: CoverageCategoryId,
  minAmount?: number,
  maxAmount?: number,
): number[] {
  return generateAmountChoicesBase(categoryId, minAmount, maxAmount, {
    includeZero: true,
  });
}

export function getDisplayedPremium(
  monthlyPremium: number,
  rateFrequency: EstimatedRateFrequency,
): number {
  return rateFrequency === "annual"
    ? Math.round(monthlyPremium * 12 * 100) / 100
    : monthlyPremium;
}

export function getBenefitAmountLabel(categoryId: CoverageCategoryId): string {
  if (categoryId === "DI" || categoryId === "OO") {
    return "Monthly Benefit Amount";
  }
  return "Benefit Amount";
}

export function useCoverageState() {
  const activeClient = useMemo(() => getActiveClient(), []);
  const coverages = useMemo(() => getActiveClientCoverages(), []);
  const { values, setPageValues } = useApplicationForm();

  // ── Rate calculation state ──────────────────────────────────────────────
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

  // ── Rate frequency ──────────────────────────────────────────────────────
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

  // ── Category selection ──────────────────────────────────────────────────
  const availableCategories = coverageCategories.filter((category) =>
    coverages.some((coverage) => coverage.categoryId === category.id),
  );

  const [selectedCategories, setSelectedCategories] = useState<
    CoverageCategoryId[]
  >(() => {
    const storedChips = Array.isArray(values.selectedCategoryChips)
      ? (values.selectedCategoryChips as CoverageCategoryId[])
      : [];
    if (storedChips.length > 0) return storedChips;

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

  // ── Category needs ─────────────────────────────────────────────────────
  const categoryNeedsGender = selectedCategories.some(
    (c) => c === "LI" || c === "DI",
  );
  const categoryNeedsSmoker = selectedCategories.some(
    (c) => c === "LI" || c === "SH",
  );
  const categoryNeedsDi = selectedCategories.includes("DI");
  const categoryNeedsOo = selectedCategories.includes("OO");
  const categoryNeedsHours = categoryNeedsDi || categoryNeedsOo;

  const clientCoverageQuestions = activeClient.coverageQuestions;

  const needsAdditionalQuestions = clientCoverageQuestions
    ? selectedCategories.some(
        (catId) =>
          (clientCoverageQuestions[catId]?.length ?? 0) > 0 ||
          (clientCoverageQuestions.always?.length ?? 0) > 0,
      )
    : categoryNeedsGender ||
      categoryNeedsSmoker ||
      categoryNeedsDi ||
      categoryNeedsOo;

  // ── Dependents ─────────────────────────────────────────────────────────
  const selectedDependents = useMemo<string[]>(
    () => (Array.isArray(values.dependents) ? values.dependents : []),
    [values.dependents],
  );
  const hasSpouse = selectedDependents.includes("spouse");

  // ── Product applicants ─────────────────────────────────────────────────
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

  // ── Coverage amounts ───────────────────────────────────────────────────
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

  // ── Riders ─────────────────────────────────────────────────────────────
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

  // ── Waiting / max benefit periods ──────────────────────────────────────
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

  // ── Products ───────────────────────────────────────────────────────────
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

  const categoryEligibility = useMemo(() => {
    const result: Partial<Record<CoverageCategoryId, boolean>> = {};
    const hoursPerWeek = (values["hours-worked-per-week"] as string) || "";
    for (const catId of selectedCategories) {
      if (catId === "DI" || catId === "OO") {
        const hours = parseInt(hoursPerWeek, 10);
        if (!isNaN(hours) && hours > 0 && hours < 40) {
          result[catId] = false;
        } else {
          result[catId] = true;
        }
      } else {
        result[catId] = true;
      }
    }
    return result;
  }, [selectedCategories, values]);

  const allCategoriesIneligible = useMemo(
    () =>
      selectedCategories.length > 0 &&
      selectedCategories.every((catId) => categoryEligibility[catId] === false),
    [selectedCategories, categoryEligibility],
  );

  const hasQdCategorySelected = categoryProducts.some(
    (c) => c.underwritingType === "QD",
  );

  const selectedCoverageIds = useMemo(
    () =>
      Array.isArray(values.coverageSelections)
        ? (values.coverageSelections as string[])
        : [],
    [values.coverageSelections],
  );

  // ── Applicant helpers ──────────────────────────────────────────────────
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

  // ── Rate calculation helpers ───────────────────────────────────────────
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

  // Cleanup timers on unmount
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

  // ── Handlers ───────────────────────────────────────────────────────────

  function handleCategoryToggle(categoryId: CoverageCategoryId) {
    const isAdding = !selectedCategories.includes(categoryId);
    const categoryRequiresQuestions = clientCoverageQuestions
      ? (clientCoverageQuestions[categoryId]?.length ?? 0) > 0 ||
        (clientCoverageQuestions.always?.length ?? 0) > 0
      : categoryId === "LI" ||
        categoryId === "DI" ||
        categoryId === "OO" ||
        categoryId === "SH";

    if (isAdding && categoryRequiresQuestions && showProducts) {
      setShowProducts(false);
    }

    if (!isAdding) {
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

    let nextSelectedCoverageIds = [...selectedCoverageIds];
    const currentlySelected = selectedCoverageIds.includes(coverageId);
    if (nextApplicants.length > 0 && !currentlySelected) {
      nextSelectedCoverageIds = [...selectedCoverageIds, coverageId];
    } else if (nextApplicants.length === 0 && currentlySelected) {
      nextSelectedCoverageIds = selectedCoverageIds.filter(
        (id) => id !== coverageId,
      );
    }

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

  // ── Premium calculation ────────────────────────────────────────────────

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

  // ── Validation ─────────────────────────────────────────────────────────

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

  return {
    // Client / coverages
    activeClient,
    coverages,
    values,
    setPageValues,

    // Category state
    availableCategories,
    selectedCategories,
    categoryNeedsGender,
    categoryNeedsSmoker,
    categoryNeedsDi,
    categoryNeedsOo,
    categoryNeedsHours,
    needsAdditionalQuestions,
    clientCoverageQuestions,
    hasSpouse,

    // Product state
    showProducts,
    setShowProducts,
    productsLoading,
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

    // Rate state
    calculatingRateKeys,
    rateFrequency,
    frequencyCalculating,
    selectionCalculating,
    showRateFrequencyToggle,

    // Drawer state
    qdDrawerOpen,
    setQdDrawerOpen,
    summaryDrawerOpen,
    setSummaryDrawerOpen,

    // Handlers
    handleCategoryToggle,
    toggleApplicantForProduct,
    handleAmountChange,
    handleFrequencyToggle,
    handleRiderToggle,
    handleRiderAmountChange,
    handleWaitingPeriodChange,
    handleMaxBenefitPeriodChange,
    revealProducts,
    getVisibleApplicants,
    calcApplicantPremium,
    validate,

    // Computed
    grandTotal,
    generateAmountChoices,
  };
}
