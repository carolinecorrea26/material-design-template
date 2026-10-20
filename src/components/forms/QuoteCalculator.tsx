import { fieldValidationChecks } from "../../utils/fieldValidation";
import { getSurfaceFields, getSurfaceField } from "../../config/fields/storedSurfaces";
import { getPrototypeLibrary } from "../../domain/prototypeLibrary";
import { usePrototypeRates } from "../../app/usePrototypeRates";
import { getQuoteRequirements } from "../../config/fields/homeQuoteFields";
import { useForm, useWatch } from "react-hook-form";
import FieldRenderer from "./FieldRenderer";
import { fieldCatalog } from "../../config/fields";
import { coverageFactFieldIds } from "../../config/fields/coverageFactFields";
import { resolveApplicationCoverage } from "../../domain/coverageRuntime";
import { useEffect, useMemo, useRef, useState } from "react";
import ArrowRightAltRoundedIcon from "@mui/icons-material/ArrowRightAltRounded";
import {
  Alert,
  Box,
  Button,
  // Checkbox,
  // Chip,
  CircularProgress,
  Divider,
  // InputLabel,
  // MenuItem,
  // Select,
  Stack,
  Typography,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import AppDrawer from "../layout/AppDrawer";
import CoverageCategorySelector from "./CoverageCategorySelector";
import SectionDivider from "../layout/SectionDivider";
import CategoryHeader from "../layout/CategoryHeader";
import PageHeader from "../layout/PageHeader";
import RateFrequencyControl from "../ui/RateFrequencyControl";
import EligibilityFields, {
  type EligibilityValues,
  validateEligibility,
} from "./EligibilityFields";
import EstimatorProductCard from "./EstimatorProductCard";
import EmptyState from "../feedback/EmptyState";
import TotalCostSummary, {
  type TotalCostSummaryItem,
} from "../ui/TotalCostSummary";
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
  // getBenefitAmountLabel,
} from "../../config/coverageConstants";
import { getActiveClient } from "../../config/client/getActiveClient";
import { getActiveClientCoverages } from "../../config/client/getActiveClientCoverages";
import type { EstimatedRateFrequency } from "../../config/clients/types";
import { getPagePath } from "../../config/pages";
import { sectionLabels } from "../../config/pageSections";
import { useApplicationForm } from "../../app/ApplicationFormContext";
import {
  executeQuoteApplyTransition,
} from "../../config/applicationTransitions";
import { estimateMonthlyPremium } from "../../utils/estimateMonthlyPremium";

type EstimateGender = "male" | "female" | "";
type EstimateYesNo = "yes" | "no" | "";

const INLINE_STEP_COPY = [
  {
    title: "About you",
    subhead:
      "Tell us a little about yourself to see the coverage available to you.",
  },
  {
    title: "Coverage needs",
    subhead: "Choose the coverage you'd like included in your estimate.",
  },
  {
    title: "Your quote",
    subhead:
      "Review your coverage options and estimated rates, then continue when you're ready.",
  },
] as const;

export type QuoteCalculatorInitialValues = {
  birthday: string;
  zipCode: string;
  state: string;
};

type QuoteCalculatorProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  /** Keep the existing drawer by default; homepage variants can render the
   * same calculator state and business logic directly in the page. */
  displayMode?: "drawer" | "inline";
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
  displayMode = "drawer",
}: QuoteCalculatorProps) {
  const navigate = useNavigate();
  const { values, setPageValues } = useApplicationForm();
  const activeClient = useMemo(() => getActiveClient(), []);
  const coverages = useMemo(() => getActiveClientCoverages(), []);
  const availableCategories = useMemo(
    () =>
      coverageCategories.filter((category) =>
        coverages.some((coverage) => coverage.categoryId === category.id),
      ),
    [coverages],
  );
  const singleAvailableCategory =
    availableCategories.length === 1 ? availableCategories[0] : null;
  const rateDisplayConfig = activeClient.coverages.estimatedRateDisplay;
  const showRateFrequencyToggle =
    rateDisplayConfig?.showFrequencyToggle === true;
  const defaultRateFrequency: EstimatedRateFrequency =
    rateDisplayConfig?.defaultFrequency ?? "monthly";
  const [rateFrequency, setRateFrequency] =
    useState<EstimatedRateFrequency>(defaultRateFrequency);

  // ── Eligibility fields (only shown when collectEligibility=true) ──────────
  const [eligibilityValues, setEligibilityValues] = useState<EligibilityValues>(
    {
      birthday: initialEligibility?.birthday ?? String(values["birth-date"] ?? ""),
      zipCode: initialEligibility?.zipCode ?? String(values["zip-postal-code"] ?? ""),
      state: initialEligibility?.state ?? String(values["state-province"] ?? ""),
    },
  );
  const [eligibilityAttempted, setEligibilityAttempted] = useState(false);
  const [ageError, setAgeError] = useState("");
  const [inlineStep, setInlineStep] = useState(0);
  const [categoryAttempted, setCategoryAttempted] = useState(false);

  // ── Coverage category selection ───────────────────────────────────────────
  const [selectedCategories, setSelectedCategories] = useState<
    CoverageCategoryId[]
  >(() => (singleAvailableCategory ? [singleAvailableCategory.id] : []));

  const requirements = getQuoteRequirements(activeClient, selectedCategories);
  const neededRoles = new Set([
    ...(requirements.needsGender ? ['gender'] : []), ...(requirements.needsSmoker ? ['smoker'] : []),
    ...(requirements.needsDi ? ['average-monthly-income'] : []), ...(requirements.needsHours ? ['hours-worked-per-week'] : []),
    ...(requirements.needsExpenses ? ['monthly-business-expenses'] : []), ...(requirements.needsResponsibility ? ['business-expense-responsibility'] : []),
  ]);
  const quoteInputFields = getSurfaceFields('quoteInputs').filter(field => neededRoles.has(field.id));
  const needsAdditionalFields = quoteInputFields.length > 0;
  const quoteInputForm = useForm<Record<string, string | boolean | string[]>>({ defaultValues: Object.fromEntries(
    getSurfaceFields('quoteInputs').map(field => {
      const value = values[field.id];
      return [field.id, typeof value === 'string' || typeof value === 'boolean' || Array.isArray(value) && value.every(item => typeof item === 'string') ? value : ''];
    }),
  ) });
  const inputValues = useWatch({ control: quoteInputForm.control });
  const gender = String(inputValues.gender ?? '') as EstimateGender;
  const smoker = String(inputValues.smoker ?? '') as EstimateYesNo;
  const avgIncome = String(inputValues['average-monthly-income'] ?? '').replace(/[^0-9]/g, '');
  const hoursPerWeek = String(inputValues['hours-worked-per-week'] ?? '');
  const monthlyExpenses = String(inputValues['monthly-business-expenses'] ?? '').replace(/[^0-9]/g, '');
  const responsibilityPct = String(inputValues['business-expense-responsibility'] ?? '');
  const [fieldsAttempted, setFieldsAttempted] = useState(false);
  const fieldErrors: Record<string, string> = {};
  for (const field of quoteInputFields) {
    const value = inputValues[field.id];
    const invalid = fieldValidationChecks(field).find(check => !check.validate(value));
    if (invalid) fieldErrors[field.id] = invalid.message;
    else if (value && field.options && !field.options.some(option => option.value === value)) fieldErrors[field.id] = `Choose an available ${field.label}.`;
  }
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
  const productsSectionRef = useRef<HTMLDivElement>(null);
  const inlineRootRef = useRef<HTMLDivElement>(null);
  const previousInlineStepRef = useRef(inlineStep);
  const shouldReanchorInlineRef = useRef(false);

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

  const factForm = useForm<Record<string, string | boolean | string[]>>({ defaultValues: Object.fromEntries(coverageFactFieldIds(coverages).map(id => [id, String(values[id] ?? "")])) });
  const contextualFacts = factForm.watch();
  const quoteValues = { ...values, ...contextualFacts,
    "birth-date": collectEligibility ? eligibilityValues.birthday : initialEligibility?.birthday ?? values["birth-date"],
    "state-province": collectEligibility ? eligibilityValues.state : initialEligibility?.state ?? values["state-province"],
    "hours-worked-per-week": hoursPerWeek, "average-monthly-income": avgIncome, "monthly-business-expenses": monthlyExpenses, "business-expense-responsibility": responsibilityPct,
    productApplicants, coverageAmounts: amountsByKey, coverageSelections: categoryProducts.filter(product => (productApplicants[product.id] ?? []).length > 0).map(product => product.id) };
  const quoteBehavior = (product: CoverageDefinition, applicant: CoverageApplicantId = "member") => resolveApplicationCoverage(product, applicant, quoteValues, coverages);

  const minimumWorkHours = Math.max(0, ...categoryProducts
    .filter((product) => product.categoryId === "DI" || product.categoryId === "OO")
    .map((product) => product.requirements?.eligibility?.find((rule) => rule.applicantType === "member")?.minimumWorkHoursPerWeek ?? 40));
  const isHoursIneligible = categoryProducts.length > 0 && categoryProducts.every(product => quoteBehavior(product).eligibility === "ineligible");

  const selectedProducts = useMemo(
    () =>
      categoryProducts.filter(
        (p) => (productApplicants[p.id] ?? []).length > 0,
      ),
    [categoryProducts, productApplicants],
  );

  // ── Handlers ──────────────────────────────────────────────────────────────

  /** Re-hides the revealed products and re-shows "See my quote" whenever a
   * coverage question or category selection is edited after the quote was
   * already revealed — mirrors the Coverage page's handleCoverageQuestionChange. */
  function handleQuoteFieldChange() {
    if (showProducts) {
      setShowProducts(false);
      setFieldsAttempted(false);
    }
  }

  function handleCategoryToggle(categoryId: CoverageCategoryId) {
    const isAdding = !selectedCategories.includes(categoryId);
    const nextCategories = isAdding
      ? [...selectedCategories, categoryId]
      : selectedCategories.filter((id) => id !== categoryId);

    setSelectedCategories(nextCategories);
    handleQuoteFieldChange();
  }

  function initAmountsForProducts(products: CoverageDefinition[]) {
    const newAmounts = { ...amountsByKey };
    products.forEach((product) => {
      const key = `${product.id}:member`;
      if (newAmounts[key] == null) {
        const choices = quoteBehavior(product).amounts;
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
    setTimeout(() => {
      setProductsLoading(false);
      if (displayMode === "drawer") {
        requestAnimationFrame(() => {
          productsSectionRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
          productsSectionRef.current?.focus();
        });
      }
    }, 1000);
  }

  useEffect(() => {
    if (
      displayMode !== "inline" ||
      previousInlineStepRef.current === inlineStep
    ) {
      return;
    }
    previousInlineStepRef.current = inlineStep;
    if (!shouldReanchorInlineRef.current) return;
    shouldReanchorInlineRef.current = false;
    requestAnimationFrame(() => {
      inlineRootRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  }, [displayMode, inlineStep]);

  function handleInlineContinue() {
    const inlineRootTop =
      inlineRootRef.current?.getBoundingClientRect().top ?? 0;
    shouldReanchorInlineRef.current = inlineRootTop < -160;

    if (inlineStep === 0) {
      setEligibilityAttempted(true);
      const { ageError: newAgeError, isValid } =
        validateEligibility(eligibilityValues);
      setAgeError(newAgeError);
      if (!isValid) return;
      setInlineStep(1);
      return;
    }

    setCategoryAttempted(true);
    setFieldsAttempted(true);
    if (selectedCategories.length === 0 || !isFieldsValid) return;
    if (!showProducts) handleGetEstimates();
    setInlineStep(2);
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
    if (isAdding && !quoteBehavior(product, applicant).selectable) return;
    const next = isAdding
      ? [...current, applicant]
      : current.filter((a) => a !== applicant);
    setProductApplicants((prev) => ({ ...prev, [product.id]: next }));
    if (isAdding) {
      const key = `${product.id}:${applicant}`;
      if (!quoteBehavior(product, applicant).amounts.includes(amountsByKey[key])) {
        const choices = quoteBehavior(product, applicant).amounts;
        setAmountsByKey((prev) => ({ ...prev, [key]: choices[0] ?? 0 }));
      }
    }
  }

  const prototypeRates = usePrototypeRates(selectedProducts.flatMap(p => (productApplicants[p.id] ?? []).map(applicant => ({ productKey: p.id, applicant, amount: amountsByKey[`${p.id}:${applicant}`] ?? 0 }))), { ...quoteValues, gender, smoker }, rateFrequency, 'quote-tool');

  function getApplicantPremium(
    product: CoverageDefinition,
    applicant: CoverageApplicantId,
  ): number {
    const key = `${product.id}:${applicant}`;
    if (prototypeRates.enabled) { const price = prototypeRates.premium(key); return rateFrequency === "annual" ? price / 12 : price; }
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
  }, [selectedProducts, productApplicants, amountsByKey, prototypeRates]);

  const costSummaryItems: TotalCostSummaryItem[] = useMemo(() => {
    const suffix = rateFrequency === "annual" ? "/yr" : "/mo";
    return selectedProducts.map((product) => {
      const applicants = productApplicants[product.id] ?? [];
      const productTotal = applicants.reduce(
        (sum, applicant) => sum + getApplicantPremium(product, applicant),
        0,
      );
      const displayedProductTotal =
        rateFrequency === "annual"
          ? Math.round(productTotal * 12 * 100) / 100
          : productTotal;
      const isCalculating = applicants.some((applicant) =>
        calculatingRates.has(`${product.id}:${applicant}`),
      );
      return {
        id: product.id,
        name: product.name,
        amount: displayedProductTotal,
        isCalculating,
        suffix,
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProducts, productApplicants, amountsByKey, rateFrequency, calculatingRates, prototypeRates]);

  function handleApply() {
    // Validate eligibility fields if collecting them here
    if (collectEligibility) {
      setEligibilityAttempted(true);
      const { ageError: newAgeError, isValid } =
        validateEligibility(eligibilityValues);
      setAgeError(newAgeError);
      if (!isValid) return;
    }

    const effectiveBirthday = collectEligibility
      ? eligibilityValues.birthday
      : (initialEligibility?.birthday ?? String(values["birth-date"] ?? ""));
    const effectiveZip = collectEligibility
      ? eligibilityValues.zipCode
      : (initialEligibility?.zipCode ?? String(values["zip-postal-code"] ?? ""));
    const effectiveState = collectEligibility
      ? eligibilityValues.state
      : (initialEligibility?.state ?? String(values["state-province"] ?? ""));

    const applicationValues = executeQuoteApplyTransition(
      {
        birthday: effectiveBirthday,
        zipCode: effectiveZip,
        state: effectiveState,
        gender: quoteInputFields.some(field => field.id === "gender") ? gender : "",
        smoker: quoteInputFields.some(field => field.id === "smoker") ? smoker : "",
        averageMonthlyIncome: quoteInputFields.some(field => field.id === "average-monthly-income") ? avgIncome : "",
        hoursWorkedPerWeek: quoteInputFields.some(field => field.id === "hours-worked-per-week") ? hoursPerWeek : "",
        monthlyBusinessExpenses: quoteInputFields.some(field => field.id === "monthly-business-expenses") ? monthlyExpenses : "",
        businessExpenseResponsibility: quoteInputFields.some(field => field.id === "business-expense-responsibility") ? responsibilityPct : "",
        collectedFieldIds: quoteInputFields.map(field => field.id),
        selectedCategories,
        selectedProductIds: selectedProducts.map((product) => product.id),
        productApplicants,
        coverageAmounts: amountsByKey,
        hideSmokerQuestion: activeClient.coverages.hideSmokerQuestion,
      },
      values,
      coverageFactFieldIds(categoryProducts, quoteValues).flatMap(id => {
        const value = contextualFacts[id];
        return value === undefined ? [] : [{ fieldId: id, value }];
      }),
    );
    setPageValues(applicationValues);

    onClose();
    navigate(getPagePath("membership"));
  }

  const rateSuffix = rateFrequency === "annual" ? "/yr" : "/mo";
  const displayedGrandTotal =
    rateFrequency === "annual"
      ? Math.round(grandTotal * 12 * 100) / 100
      : grandTotal;
  const inlineStepCopy =
    inlineStep === 1 && singleAvailableCategory
      ? {
          title: "Coverage details",
          subhead: `Answer a few questions about your ${singleAvailableCategory.label.toLowerCase()} coverage.`,
        }
      : INLINE_STEP_COPY[inlineStep];

  const calculatorContent = (
    <Stack spacing={3}>
        {displayMode === "inline" && (
          <PageHeader
            title={inlineStepCopy.title}
            subhead={inlineStepCopy.subhead}
            onBack={
              inlineStep > 0
                ? () => {
                    shouldReanchorInlineRef.current = false;
                    setInlineStep((step) => step - 1);
                  }
                : undefined
            }
          />
        )}

        {/* ── Eligibility fields (Membership page trigger only) ── */}
        {collectEligibility &&
          (displayMode === "drawer" || inlineStep === 0) && (
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
        {(displayMode === "drawer" || inlineStep === 1) && (
          <>
            {!singleAvailableCategory && getSurfaceField("quoteInputs", "quote-categories") && (
              <CoverageCategorySelector
                legend={getSurfaceField("quoteInputs", "quote-categories")!.label}
                categories={availableCategories}
                selectedIds={selectedCategories}
                onToggle={handleCategoryToggle}
              />
            )}
            {categoryAttempted && selectedCategories.length === 0 && (
              <Alert severity="error">
                Select at least one coverage category.
              </Alert>
            )}
          </>
        )}

        {/* ── Additional fields grouped by section (gender/smoker=Personal, income/hours=Work, expenses=Business) ── */}
        {needsAdditionalFields &&
          selectedCategories.length > 0 &&
          (displayMode === "drawer" || inlineStep === 1) && (
            <Stack spacing={2}>
              {quoteInputFields.map((field, index) => {
                const section = (id: string) => ['gender', 'smoker'].includes(id) ? sectionLabels.personalDetails : ['average-monthly-income', 'hours-worked-per-week'].includes(id) ? sectionLabels.workAndIncome : sectionLabels.businessDetails;
                return <Stack key={field.id} spacing={2}>
                  {(index === 0 || section(quoteInputFields[index - 1].id) !== section(field.id)) && <SectionDivider label={section(field.id)} variant="subsection" />}
                  <FieldRenderer field={field} onValueChange={handleQuoteFieldChange} control={quoteInputForm.control} errors={fieldsAttempted ? Object.fromEntries(Object.entries(fieldErrors).map(([id, message]) => [id, { type: 'validate', message }])) : {}} />
                </Stack>;
              })}

            {!showProducts && displayMode === "drawer" && (
              <Button
                variant="contained"
                size="large"
                onClick={handleGetEstimates}
              >
                See my quote
              </Button>
            )}
            </Stack>
          )}

        {/* ── Empty state ── */}
        {displayMode === "drawer" && selectedCategories.length === 0 && (
          <EmptyState
            title="Your estimated cost will appear here"
            body="Select a coverage category to see your estimated cost."
          />
        )}

        {/* ── Products ── */}
        {showProducts &&
          selectedCategories.length > 0 &&
          (displayMode === "drawer" || inlineStep === 2) && (
          <Stack spacing={2} ref={productsSectionRef} tabIndex={-1}>
            <Divider />
            {productsLoading ? (
              <Stack
                spacing={2}
                alignItems="center"
                sx={{ py: 4 }}
                role="status"
                aria-live="polite"
              >
                <CircularProgress size={28} aria-hidden />
                <Typography variant="body2" color="text.secondary">
                  Loading your coverage options…
                </Typography>
              </Stack>
            ) : isHoursIneligible ? (
              <Alert severity="error">
                We're sorry, but products in this category require working at
                least {minimumWorkHours} hours per week.
              </Alert>
            ) : (
              <>
                {coverageFactFieldIds(categoryProducts, quoteValues).map(id => <FieldRenderer key={id} field={getPrototypeLibrary()?.site.configuration.pages.find(p => p.key === "coverage")?.fields.find(f => f.key === id)?.definition ?? fieldCatalog[id]} control={factForm.control} errors={factForm.formState.errors} />)}
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
                          const behavior = quoteBehavior(product);
                          const choices = behavior.amounts;
                          const currentApplicants =
                            productApplicants[product.id] ?? [];
                          const hasAnyApplicantSelected =
                            currentApplicants.length > 0;
                          const key = `${product.id}:member`;
                          const currentAmount =
                            choices.includes(amountsByKey[key]) ? amountsByKey[key] : choices[0] ?? 0;
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
                            <EstimatorProductCard
                              key={product.id}
                              product={{ ...product, underwritingType: behavior.underwriting.underwritingType }}
                              unavailableReason={behavior.messages[0]}
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
          !isHoursIneligible &&
          (displayMode === "drawer" || inlineStep === 2) && (
            <Stack spacing={1.5}>
              {grandTotal > 0 && (
                <TotalCostSummary
                  items={costSummaryItems}
                  total={displayedGrandTotal}
                  totalSuffix={rateSuffix}
                  disclaimer={
                    <>
                      <sup>1</sup> Quoted cost is the best rate available.
                      Final cost may vary based on gender, health status, and
                      tobacco/nicotine use.
                    </>
                  }
                />
              )}

              {showRateFrequencyToggle && getSurfaceField("quoteInputs", "quote-rate-frequency") && (
                <RateFrequencyControl
                  field={getSurfaceField("quoteInputs", "quote-rate-frequency")}
                  value={rateFrequency}
                  onChange={setRateFrequency}
                  ariaLabel="Toggle between monthly and annual"
                />
              )}

              <Button
                variant="contained"
                color="primary"
                size="large"
                fullWidth
                endIcon={<ArrowRightAltRoundedIcon />}
                onClick={handleApply}
                sx={{ mt: 1, display: displayMode === "inline" ? "none" : undefined }}
              >
                Apply for coverage
              </Button>
            </Stack>
          )}

        {displayMode === "inline" && (
          <Stack
            direction="row"
            justifyContent="flex-end"
            sx={{
              pt: 2.5,
              borderTop: 1,
              borderColor: "divider",
            }}
          >
            <Button
              variant="contained"
              size="large"
              fullWidth
              endIcon={
                inlineStep === 2 ? <ArrowRightAltRoundedIcon /> : undefined
              }
              onClick={inlineStep === 2 ? handleApply : handleInlineContinue}
              disabled={inlineStep === 2 && (productsLoading || isHoursIneligible)}
            >
              {inlineStep === 2 ? "Apply for coverage" : "Continue"}
            </Button>
          </Stack>
        )}
    </Stack>
  );

  if (displayMode === "inline") {
    return (
      <Stack ref={inlineRootRef} spacing={2.5} sx={{ scrollMarginTop: 24 }}>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          spacing={2}
        >
          <Typography
            variant="overline"
            sx={{ color: "primary.main", fontWeight: 800, letterSpacing: 1.1 }}
          >
            Get an instant quote
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            aria-live="polite"
          >
            Step {inlineStep + 1} of 3
          </Typography>
        </Stack>
        <Box
          sx={{
            width: "100%",
            maxWidth: 760,
            alignSelf: "center",
            p: { xs: 2, sm: 3, md: 3.5 },
            bgcolor: "background.paper",
            border: 1,
            borderColor: "divider",
            borderRadius: 3,
            boxShadow: "0 12px 32px rgba(20, 42, 74, 0.08)",
          }}
        >
          {calculatorContent}
        </Box>
      </Stack>
    );
  }

  return (
    <AppDrawer open={open} onClose={onClose} title={title}>
      {calculatorContent}
    </AppDrawer>
  );
}
