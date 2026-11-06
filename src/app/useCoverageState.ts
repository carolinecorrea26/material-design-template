import { getDisplayedPremium } from "../utils/coverageDisplay";
import { rateDisplayForAmount, type RateDisplayState } from '../domain/rateDisplay';
import { resolveSiteId } from "../data/activeSite";
import { activeFeaturedProduct } from "../config/client/coverageProductScope";
import { orderCoveragePresentation } from "../domain/coveragePresentation";
import { reconcileApplicationRiders } from "../domain/applicationRiders";
import { selectedRidersMonthlyPremium } from "../domain/coverageRiderPricing";
import { getPrototypeLibrary } from "../domain/prototypeLibrary";
import { categoryEligibility as evaluateCategoryEligibility, readCategoryEligibilityPolicy, reconcileCategoryElections } from "../domain/categoryEligibilityPolicy";
import { changeCoverageAmount, selectedRiderOnly } from "../domain/coverageRiderOnly";
import { usePrototypeRates } from "./usePrototypeRates";
import { initialCoverageCategories } from "../config/client/coverageCategoryScope";
import { resolveApplicationCoverage, validateApplicationCoverages } from "../domain/coverageRuntime";
import type { CoverageDefinition } from "../domain/coverage";
import { coverageRelationshipErrors } from "../domain/coverageRequirements";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getActiveClient } from "../config/client/getActiveClient";
import { getActiveClientCoverages } from "../config/client/getActiveClientCoverages";
import { coverageCategories } from "../config/coverageCategories";
import { getCategoryRequirements } from "../config/coverageQuestionRequirements";
import type { CoverageCategoryId } from "../config/coverages/types";
import type { CoverageApplicantId } from "../config/coverages/types";
import type { EstimatedRateFrequency } from "../config/clients/types";
import { useApplicationForm } from "./ApplicationFormContext";
import { estimateMonthlyPremium } from "../utils/estimateMonthlyPremium";
import { RATE_CALCULATION_DELAY_MS } from "../config/coverageConstants";

export { getDisplayedPremium, getBenefitAmountLabel } from "../utils/coverageDisplay";
export function useCoverageState() {
  const activeClient = useMemo(() => getActiveClient(), []);
  const coverages = useMemo(() => getActiveClientCoverages(), []);
  const { values, setPageValues } = useApplicationForm();
  const categoryPolicy = readCategoryEligibilityPolicy(getPrototypeLibrary()?.site.configuration.categoryEligibilityPolicies ?? []);

  function generateAmountChoices(coverage: CoverageDefinition, applicantId: CoverageApplicantId = "member"): number[] {
    return [0, ...resolveApplicationCoverage(coverage, applicantId, values, coverages).amounts];
  }

  // ── Rate calculation state ──────────────────────────────────────────────
  const [calculatingRateKeys, setCalculatingRateKeys] = useState<Set<string>>(
    () => new Set(),
  );
  const [showProducts, setShowProducts] = useState(false);
  const [productsLoading, setProductsLoading] = useState(false);
  const [summaryDrawerOpen, setSummaryDrawerOpen] = useState(false);
  // Existing selections count as an established cart. Only the first addition
  // to a previously empty cart opens the drawer; later additions use a snackbar.
  const initialDrawerShownRef = useRef(Array.isArray(values.coverageSelections) && values.coverageSelections.length > 0);
  const [addedSnackbarOpen, setAddedSnackbarOpen] = useState(false);
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
  const availableCategories = orderCoveragePresentation(coverages, activeClient.coverages, activeFeaturedProduct(resolveSiteId())).categories.map(id => coverageCategories.find(category => category.id === id)!).filter((category) =>
    coverages.some((coverage) => coverage.categoryId === category.id) && evaluateCategoryEligibility(categoryPolicy, categoryPolicy ? values[categoryPolicy.fieldId] : undefined, category.id, true) === "eligible",
  );

  const [selectedCategories, setSelectedCategories] = useState<
    CoverageCategoryId[]
  >(() => {
    const storedChips = Array.isArray(values.selectedCategoryChips)
      ? (values.selectedCategoryChips as CoverageCategoryId[])
      : [];
    const existingSelections = Array.isArray(values.coverageSelections) ? values.coverageSelections : [];
    return initialCoverageCategories(availableCategories.map(category => category.id), storedChips, coverages.filter(coverage => existingSelections.includes(coverage.id)).map(coverage => coverage.categoryId));
  });

  useEffect(() => {
    const stored = Array.isArray(values.selectedCategoryChips) ? values.selectedCategoryChips : [];
    if (stored.join(",") !== selectedCategories.join(",")) setPageValues({ selectedCategoryChips: selectedCategories });
  }, [selectedCategories, values.selectedCategoryChips, setPageValues]);

  const availableCategoryKey = availableCategories.map(category => category.id).join(",");
  useEffect(() => {
    const allowed = new Set(availableCategoryKey.split(","));
    setSelectedCategories(previous => previous.some(category => !allowed.has(category)) ? previous.filter(category => allowed.has(category)) : previous);
    const patch = reconcileCategoryElections(categoryPolicy, values, coverages);
    if (patch) setPageValues(patch);
  }, [availableCategoryKey, categoryPolicy, values, coverages, setPageValues]);

  // ── Category needs ─────────────────────────────────────────────────────
  const {
    needsGender: categoryNeedsGender,
    needsSmoker: categoryNeedsSmoker,
    needsDi: categoryNeedsDi,
    needsOo: categoryNeedsOo,
    needsHours: categoryNeedsHours,
    needsAdditionalFields: hasCanonicalCategoryQuestions,
  } = getCategoryRequirements(selectedCategories);

  const clientCoverageQuestions = activeClient.coverageQuestions;

  const needsAdditionalQuestions = clientCoverageQuestions
    ? selectedCategories.some(
        (catId) =>
          (clientCoverageQuestions[catId]?.length ?? 0) > 0 ||
          (clientCoverageQuestions.always?.length ?? 0) > 0,
      )
    : hasCanonicalCategoryQuestions;

  // ── Dependents ─────────────────────────────────────────────────────────
  const selectedDependents = useMemo<string[]>(
    () => (Array.isArray(values.dependents) ? values.dependents : []),
    [values.dependents],
  );
  const hasSpouse = selectedDependents.includes("spouse") && coverages.some(product => selectedCategories.includes(product.categoryId) && product.applicants.includes("spouse"));

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

  const reconciledRiders = JSON.stringify(reconcileApplicationRiders(coverages, values));
  useEffect(() => {
    const next = JSON.parse(reconciledRiders);
    if (JSON.stringify(values.coverageRiders ?? {}) !== JSON.stringify(next.coverageRiders) || JSON.stringify(values.coverageRiderAmounts ?? {}) !== JSON.stringify(next.coverageRiderAmounts)) setPageValues(next);
  }, [reconciledRiders, values.coverageRiders, values.coverageRiderAmounts, setPageValues]);

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
        .filter((c) => selectedCategories.includes(c.categoryId)),
    [coverages, selectedCategories],
  );

  const categoryEligibility = useMemo(() => {
    const result: Partial<Record<CoverageCategoryId, boolean>> = {};
    for (const catId of selectedCategories) {
      result[catId] = coverages.filter(p => p.categoryId === catId).some(product =>
        product.applicants.some(applicant => (applicant === "member" || selectedDependents.includes(applicant)) &&
          resolveApplicationCoverage(product, applicant, values, coverages).eligibility !== "ineligible"));
    }
    return result;
  }, [selectedCategories, values, coverages, selectedDependents]);

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
    (applicants: CoverageApplicantId[]): CoverageApplicantId[] => {
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
    const rateCalculationTimers = rateCalculationTimersRef.current;
    return () => {
      Object.values(rateCalculationTimers).forEach((timerId) => {
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
      const visibleApplicants = getVisibleApplicants(coverage.applicants);
      for (const applicantId of visibleApplicants) {
        const key = `${coverage.id}:${applicantId}`;
        if (nextAmounts[key] == null) {
          const choices = generateAmountChoices(coverage, applicantId);
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

  useEffect(() => {
    const amounts = { ...storedAmounts };
    const waiting = { ...storedWaitingPeriods };
    const benefits = { ...storedMaxBenefitPeriods };
    let changed = false;
    for (const product of coverages) for (const applicant of productApplicants[product.id] ?? []) {
      const result = resolveApplicationCoverage(product, applicant, values, coverages);
      const key = `${product.id}:${applicant}`;
      // No available choices can be a temporary conflict or missing information.
      // Preserve the saved amount until a valid replacement is actually known.
      if (result.amounts.length > 0 && amounts[key] !== 0 && !result.amounts.includes(amounts[key])) {
        const next = result.amounts[0];
        if (amounts[key] !== next) { amounts[key] = next; changed = true; }
      }
      for (const [target, constraint] of [[waiting, result.waitingPeriod], [benefits, result.benefitPeriod]] as const) {
        const current = target[key] ?? target[product.id];
        const required = constraint.requiredValue ?? (current && constraint.options?.length && !constraint.options.some(o => o.value === current) ? constraint.options[0].value : undefined);
        const next = required ?? target[key] ?? target[product.id] ?? constraint.options?.[0]?.value;
        if (next !== undefined && target[key] !== next) { target[key] = next; changed = true; }
      }
    }
    if (changed) setPageValues({ coverageAmounts: amounts, coverageWaitingPeriods: waiting, coverageMaxBenefitPeriods: benefits });
  }, [values, coverages, productApplicants, storedAmounts, storedWaitingPeriods, storedMaxBenefitPeriods, setPageValues]);

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
    const product = coverages.find(product => product.id === coverageId);
    if (!product || !product.applicants.includes(applicant)) return;
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

    const nextAmounts = { ...storedAmounts };
    if (isAdding) {
      const coverage = categoryProducts.find((c) => c.id === coverageId);
      if (coverage) {
        const key = `${coverageId}:${applicant}`;
        if (nextAmounts[key] == null || nextAmounts[key] === 0 && !selectedRiderOnly(coverage, applicant, values)) {
          const choices = generateAmountChoices(coverage, applicant);
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
      // Show the "Coverage added" drawer only on the very first product added
      // from a state of zero selections. For all subsequent adds, show a snackbar.
      const wasEmpty = selectedCoverageIds.length === 0 && !currentlySelected;
      if (wasEmpty && !initialDrawerShownRef.current) {
        initialDrawerShownRef.current = true;
        setSummaryDrawerOpen(true);
      } else {
        setAddedSnackbarOpen(true);
      }
    }
  }

  function handleAmountChange(key: string, amount: number, riderOnlyId?: string) {
    const [productId, applicant] = key.split(":");
    const product = coverages.find(product => product.id === productId);
    if (!product || !generateAmountChoices(product, applicant as CoverageApplicantId).includes(amount)) return;
    beginRateCalculation(key);
    setPageValues(changeCoverageAmount(product, applicant as CoverageApplicantId, values, amount, riderOnlyId));
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
    const product = coverages.find(product => product.id === coverageId);
    if (product && selectedRiderOnly(product, applicantId, values)) return;
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
    const product = coverages.find(product => product.id === coverageId);
    const standalone = product && selectedRiderOnly(product, applicantId, values);
    if (standalone && standalone.id !== riderId) return;
    const key = `${coverageId}:${riderId}:${applicantId}`;
    const rateKey = `${coverageId}:${applicantId}`;
    beginRateCalculation(rateKey);
    setPageValues({
      coverageRiderAmounts: { ...storedRiderAmounts, [key]: amount },
    });
  }

  function handleWaitingPeriodChange(
    coverageId: string,
    value: string,
    applicantId?: CoverageApplicantId,
  ) {
    const coverage = categoryProducts.find((c) => c.id === coverageId);
    if (coverage) {
      const applicants = applicantId
        ? [applicantId]
        : (productApplicants[coverageId] ?? []);
      applicants.forEach((applicantId) => {
        beginRateCalculation(`${coverageId}:${applicantId}`);
      });
    }
    setPageValues({
      coverageWaitingPeriods: {
        ...storedWaitingPeriods,
        [applicantId ? `${coverageId}:${applicantId}` : coverageId]: value,
      },
    });
  }

  function handleMaxBenefitPeriodChange(
    coverageId: string,
    value: string,
    applicantId?: CoverageApplicantId,
  ) {
    const coverage = categoryProducts.find((c) => c.id === coverageId);
    if (coverage) {
      const applicants = applicantId
        ? [applicantId]
        : (productApplicants[coverageId] ?? []);
      applicants.forEach((applicantId) => {
        beginRateCalculation(`${coverageId}:${applicantId}`);
      });
    }
    setPageValues({
      coverageMaxBenefitPeriods: {
        ...storedMaxBenefitPeriods,
        [applicantId ? `${coverageId}:${applicantId}` : coverageId]: value,
      },
    });
  }

  const prototypeRates = usePrototypeRates((showProducts ? categoryProducts : []).flatMap(p => getVisibleApplicants(p.applicants).filter(applicant => resolveApplicationCoverage(p, applicant, values, coverages).eligibility !== "ineligible").map(applicant => ({ productKey: p.id, applicant, amount: storedAmounts[`${p.id}:${applicant}`] ?? 0 }))), values, rateFrequency, 'coverage');

  // ── Premium calculation ────────────────────────────────────────────────

  function calcApplicantPremium(
    coverage: (typeof categoryProducts)[number],
    applicantId: CoverageApplicantId,
  ): number {
    const key = `${coverage.id}:${applicantId}`;
    if (productApplicants[coverage.id]?.includes(applicantId) && storedAmounts[key] == null) return NaN;
    // Zero new base coverage is not a quoted zero premium for the rider.
    if (selectedRiderOnly(coverage, applicantId, values)) return NaN;
    if (prototypeRates.enabled) { const price = prototypeRates.premium(key); return rateFrequency === "annual" ? price / 12 : price; }
    const amount = storedAmounts[key] ?? 0;
    const premium = estimateMonthlyPremium(coverage.categoryId, amount) + selectedRidersMonthlyPremium(coverage, applicantId, amount, storedRiders, storedRiderAmounts);
    return Math.round(premium * 100) / 100;
  }

  function getRateDisplay(productId: string, applicant: CoverageApplicantId): RateDisplayState {
    const product = coverages.find(product => product.id === productId);
    if (!product) return { status: 'hidden' };
    if (selectedRiderOnly(product, applicant, values)) return { status: 'provided-separately' };
    if (prototypeRates.enabled) return prototypeRates.display(`${productId}:${applicant}`);
    return rateDisplayForAmount(getDisplayedPremium(calcApplicantPremium(product, applicant), rateFrequency));
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
  }, [categoryProducts, selectedCoverageIds, productApplicants, storedAmounts, prototypeRates]);

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

    const hasAmount = Object.values(nextAmounts).some((v) => v > 0) || coverages.some(product =>
      nextSelectedCoverageIds.includes(product.id) && (nextProductApplicants[product.id] ?? []).some(applicant => selectedRiderOnly(product, applicant, nextValues)),
    );
    if (!hasAmount) {
      return "Select at least one benefit amount before continuing.";
    }

    const activeSelections = Object.fromEntries(Object.entries(nextProductApplicants).filter(([id]) => nextSelectedCoverageIds.includes(id)));
    return validateApplicationCoverages(coverages, nextValues, { deferProfileUnderwriting: true }) ?? coverageRelationshipErrors(coverages, activeSelections)[0];
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

    // Drawer / snackbar state
    summaryDrawerOpen,
    setSummaryDrawerOpen,
    addedSnackbarOpen,
    setAddedSnackbarOpen,

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
    getRateDisplay,
    validate,

    // Computed
    grandTotal,
    generateAmountChoices,
  };
}
