import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import OfflineBoltIcon from "@mui/icons-material/OfflineBolt";
import {
  Alert,
  Box,
  Checkbox,
  CircularProgress,
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import FormRoutePage from "../components/form/FormRoutePage";
import FormSectionTitle from "../components/form/FormSectionTitle";
import FormHelpDrawer from "../components/form/FormHelpDrawer";
import QuickDecisionDrawerContent from "../components/common/QuickDecisionDrawerContent";
import { QuickDecisionMark } from "../components/common/QuickDecisionDrawerContent";
import QuickDecisionIndicator from "../components/common/QuickDecisionIndicator";
import SelectableOptionCard from "../components/form/SelectableOptionCard";
import { getActiveClientCoverages } from "../client/getActiveClientCoverages";
import { coverageCategories } from "../config/coverageCategories";
import type { CoverageCategoryId } from "../config/coverages/types";
import type { CoverageApplicantId } from "../config/coverages/types";
import { coverageApplicantToSection } from "../config/formSectionTitle";
import { useApplicationForm } from "../state/ApplicationFormContext";

function generateAmountChoices(
  categoryId: CoverageCategoryId,
  minAmount?: number,
  maxAmount?: number,
): number[] {
  if (minAmount != null && maxAmount != null) {
    let step: number;
    if (categoryId === "LI" || categoryId === "AD") {
      step = 25000;
    } else if (categoryId === "DI" || categoryId === "OO") {
      step = 500;
    } else {
      step = maxAmount <= 1000 ? 50 : 500;
    }

    const choices = new Set<number>([0, minAmount, maxAmount]);
    for (let v = minAmount; v <= maxAmount; v += step) {
      choices.add(v);
    }
    return [...choices].sort((a, b) => a - b);
  }

  if (categoryId === "LI" || categoryId === "AD")
    return [0, 25000, 50000, 100000, 250000];
  if (categoryId === "DI" || categoryId === "OO")
    return [0, 500, 1000, 1500, 2000, 2500, 3000];
  return [0, 1000, 5000, 10000];
}

function estimateMonthlyPremium(
  categoryId: CoverageCategoryId,
  amount: number,
): number {
  let raw: number;
  switch (categoryId) {
    case "LI":
      raw = (amount / 1000) * 0.12;
      break;
    case "AD":
      raw = (amount / 1000) * 0.05;
      break;
    case "DI":
      raw = amount * 0.02;
      break;
    case "OO":
      raw = amount * 0.018;
      break;
    case "SH":
      raw = amount * 0.01;
      break;
    default:
      raw = 0;
  }
  return Math.round(raw * 100) / 100;
}

function formatUSD(value: number, decimals = 2): string {
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

const RATE_CALCULATION_DELAY_MS = 900;

export function CoverageNeedsCalculator() {
  const [annualIncome, setAnnualIncome] = useState("");
  const [yearsToReplace, setYearsToReplace] = useState("");
  const [outstandingDebts, setOutstandingDebts] = useState("");
  const [existingCoverage, setExistingCoverage] = useState("");

  const parseAmount = (val: string) => {
    const num = Number(val.replace(/[^0-9]/g, ""));
    return Number.isFinite(num) ? num : 0;
  };

  const income = parseAmount(annualIncome);
  const years = Number(yearsToReplace) || 0;
  const debts = parseAmount(outstandingDebts);
  const existing = parseAmount(existingCoverage);

  const incomeNeed = income * years;
  const totalNeed = incomeNeed + debts;
  const recommendedCoverage = Math.max(0, totalNeed - existing);

  const hasInput = income > 0 || debts > 0;

  return (
    <Stack spacing={2.5}>
      <Typography variant="body2" color="text.secondary">
        Use this simple calculator to get a rough estimate of how much life
        insurance coverage may be appropriate for your situation.
      </Typography>

      <TextField
        label="Annual household income"
        fullWidth
        value={annualIncome}
        onChange={(e) => {
          const digits = e.target.value.replace(/[^0-9]/g, "").slice(0, 10);
          if (!digits) {
            setAnnualIncome("");
            return;
          }
          setAnnualIncome(`$${Number(digits).toLocaleString("en-US")}`);
        }}
        inputProps={{ inputMode: "numeric" }}
      />

      <TextField
        label="Years of income to replace"
        fullWidth
        value={yearsToReplace}
        onChange={(e) => {
          const digits = e.target.value.replace(/[^0-9]/g, "").slice(0, 2);
          setYearsToReplace(digits);
        }}
        helperText="A common recommendation is 10–12 years"
        inputProps={{ inputMode: "numeric" }}
      />

      <TextField
        label="Outstanding debts (mortgage, loans, etc.)"
        fullWidth
        value={outstandingDebts}
        onChange={(e) => {
          const digits = e.target.value.replace(/[^0-9]/g, "").slice(0, 10);
          if (!digits) {
            setOutstandingDebts("");
            return;
          }
          setOutstandingDebts(`$${Number(digits).toLocaleString("en-US")}`);
        }}
        inputProps={{ inputMode: "numeric" }}
      />

      <TextField
        label="Existing life insurance coverage"
        fullWidth
        value={existingCoverage}
        onChange={(e) => {
          const digits = e.target.value.replace(/[^0-9]/g, "").slice(0, 10);
          if (!digits) {
            setExistingCoverage("");
            return;
          }
          setExistingCoverage(`$${Number(digits).toLocaleString("en-US")}`);
        }}
        inputProps={{ inputMode: "numeric" }}
      />

      {hasInput && (
        <Box
          sx={{
            p: 2,
            borderRadius: 2,
            backgroundColor: "rgba(0, 22, 57, 0.04)",
            border: "1px solid rgba(0, 22, 57, 0.08)",
          }}
        >
          <Stack spacing={1}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              Estimated coverage need
            </Typography>
            <Typography
              variant="h5"
              sx={{ fontWeight: 700, color: "primary.main" }}
            >
              {formatUSD(recommendedCoverage, 0)}
            </Typography>
            <Stack spacing={0.5}>
              <Typography variant="caption" color="text.secondary">
                Income replacement: {formatUSD(incomeNeed, 0)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Outstanding debts: {formatUSD(debts, 0)}
              </Typography>
              {existing > 0 && (
                <Typography variant="caption" color="text.secondary">
                  Less existing coverage: -{formatUSD(existing, 0)}
                </Typography>
              )}
            </Stack>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ mt: 1, fontStyle: "italic" }}
            >
              This is a simplified estimate. Your actual needs may vary based on
              your full financial picture.
            </Typography>
          </Stack>
        </Box>
      )}
    </Stack>
  );
}

function getBenefitAmountLabel(categoryId: CoverageCategoryId): string {
  if (categoryId === "DI" || categoryId === "OO") {
    return "Monthly Benefit Amount";
  }
  return "Benefit Amount";
}

const defaultCoverageNotes: Partial<Record<CoverageCategoryId, string>> = {
  LI: "The maximum available through New York Life Insurance Company for any individual is {maxAmount}, whether coverage is in one or divided among several group policies.",
  AD: "The maximum available through New York Life Insurance Company for any individual is {maxAmount}, whether coverage is in one or divided among several group policies.",
  DI: "The maximum monthly benefit available through New York Life Insurance Company for any individual is {maxAmount}, whether coverage is in one or divided among several group policies.",
  OO: "The maximum monthly benefit available through New York Life Insurance Company for any individual is {maxAmount}, whether coverage is in one or divided among several group policies.",
};

function resolveCoverageNote(coverage: {
  coverageNote?: string;
  categoryId: CoverageCategoryId;
  maxAmount?: number;
}): string | undefined {
  const template =
    coverage.coverageNote ?? defaultCoverageNotes[coverage.categoryId];
  if (!template) return undefined;
  const maxFormatted =
    coverage.maxAmount != null
      ? formatUSD(coverage.maxAmount, 0)
      : "the maximum amount";
  return template.replace(/\{maxAmount\}/g, maxFormatted);
}

const defaultSpouseCoverageNotes: Partial<Record<CoverageCategoryId, string>> =
  {
    LI: "The maximum available for spouse through New York Life Insurance Company for any individual is {maxAmount}, whether coverage is in one or divided among several group policies. Spouse coverage cannot exceed member coverage (including in force or requested coverage).",
    AD: "The maximum available for spouse through New York Life Insurance Company for any individual is {maxAmount}, whether coverage is in one or divided among several group policies. Spouse coverage cannot exceed member coverage (including in force or requested coverage).",
    DI: "The maximum monthly benefit available for spouse through New York Life Insurance Company for any individual is {maxAmount}, whether coverage is in one or divided among several group policies. Spouse coverage cannot exceed member coverage (including in force or requested coverage).",
    OO: "The maximum monthly benefit available for spouse through New York Life Insurance Company for any individual is {maxAmount}, whether coverage is in one or divided among several group policies. Spouse coverage cannot exceed member coverage (including in force or requested coverage).",
  };

function resolveSpouseCoverageNote(coverage: {
  categoryId: CoverageCategoryId;
  maxAmount?: number;
}): string | undefined {
  const template = defaultSpouseCoverageNotes[coverage.categoryId];
  if (!template) return undefined;
  const maxFormatted =
    coverage.maxAmount != null
      ? formatUSD(coverage.maxAmount, 0)
      : "the maximum amount";
  return template.replace(/\{maxAmount\}/g, maxFormatted);
}

export default function CoverageOptions() {
  const pageId = "coverage-options";
  const coverages = useMemo(() => getActiveClientCoverages(), []);
  const { values, setPageValues } = useApplicationForm();
  const [qdDrawerOpen, setQdDrawerOpen] = useState(false);
  const [calculatingRateKeys, setCalculatingRateKeys] = useState<Set<string>>(
    () => new Set(),
  );
  const rateCalculationTimersRef = useRef<Record<string, number>>({});

  const selectedCoverageIds = Array.isArray(values.coverageSelections)
    ? values.coverageSelections
    : [];

  const selectedCoverages = coverages.filter((c) =>
    selectedCoverageIds.includes(c.id),
  );

  const hasSelectedQdProduct = selectedCoverages.some(
    (c) => c.underwritingType === "QD",
  );

  const selectedDependents = useMemo<string[]>(() => {
    return Array.isArray(values.dependents) ? values.dependents : [];
  }, [values.dependents]);

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

  const getVisibleApplicants = useCallback(
    (
      applicants: CoverageApplicantId[],
      coverageId?: string,
    ): CoverageApplicantId[] => {
      // If this product has an explicit applicant selection, use it directly.
      if (
        coverageId &&
        Object.prototype.hasOwnProperty.call(productApplicants, coverageId)
      ) {
        const selectedApplicants = Array.isArray(productApplicants[coverageId])
          ? productApplicants[coverageId]
          : [];

        return applicants.filter((a) => selectedApplicants.includes(a));
      }

      // Fall back to selectedDependents
      return applicants.filter((a) => {
        if (a === "member") return true;
        if (a === "spouse") return selectedDependents.includes("spouse");
        if (a === "child") return selectedDependents.includes("child");
        return false;
      });
    },
    [productApplicants, selectedDependents],
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

  const beginRateCalculationForCoverage = useCallback(
    (coverageId: string) => {
      const coverage = selectedCoverages.find((item) => item.id === coverageId);
      if (!coverage) return;

      getVisibleApplicants(coverage.applicants, coverage.id).forEach(
        (applicantId) => {
          beginRateCalculation(`${coverage.id}:${applicantId}`);
        },
      );
    },
    [beginRateCalculation, getVisibleApplicants, selectedCoverages],
  );

  useEffect(() => {
    return () => {
      Object.values(rateCalculationTimersRef.current).forEach((timerId) => {
        window.clearTimeout(timerId);
      });
    };
  }, []);

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

  // Initialize missing coverage amount entries
  useEffect(() => {
    const amountPatch: Record<string, number> = {};
    const wpPatch: Record<string, string> = {};
    const mbpPatch: Record<string, string> = {};
    let needsUpdate = false;

    for (const coverage of selectedCoverages) {
      const choices = generateAmountChoices(
        coverage.categoryId,
        coverage.minAmount,
        coverage.maxAmount,
      );
      const defaultAmount = choices.find((choice) => choice > 0) ?? 0;

      for (const applicantId of getVisibleApplicants(coverage.applicants)) {
        const key = `${coverage.id}:${applicantId}`;
        if (storedAmounts[key] == null) {
          amountPatch[key] = defaultAmount;
          needsUpdate = true;
        }
      }
      // Initialize waiting period defaults
      if (
        coverage.waitingPeriodOptions?.length &&
        storedWaitingPeriods[coverage.id] == null
      ) {
        wpPatch[coverage.id] = coverage.waitingPeriodOptions[0].value;
        needsUpdate = true;
      }
      // Initialize max benefit period defaults
      if (
        coverage.maxBenefitPeriodOptions?.length &&
        storedMaxBenefitPeriods[coverage.id] == null
      ) {
        mbpPatch[coverage.id] = coverage.maxBenefitPeriodOptions[0].value;
        needsUpdate = true;
      }
    }

    if (needsUpdate) {
      setPageValues({
        coverageAmounts: { ...storedAmounts, ...amountPatch },
        ...(Object.keys(wpPatch).length > 0
          ? { coverageWaitingPeriods: { ...storedWaitingPeriods, ...wpPatch } }
          : {}),
        ...(Object.keys(mbpPatch).length > 0
          ? {
              coverageMaxBenefitPeriods: {
                ...storedMaxBenefitPeriods,
                ...mbpPatch,
              },
            }
          : {}),
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    selectedCoverageIds.join(","),
    selectedDependents.join(","),
    Object.keys(productApplicants).length,
  ]);

  useEffect(() => {
    function handleDevFillForm() {
      const amountPatch: Record<string, number> = {};
      const wpPatch: Record<string, string> = {};
      const mbpPatch: Record<string, string> = {};

      for (const coverage of selectedCoverages) {
        const choices = generateAmountChoices(
          coverage.categoryId,
          coverage.minAmount,
          coverage.maxAmount,
        );
        const defaultAmount = choices.find((choice) => choice > 0) ?? 0;

        for (const applicantId of getVisibleApplicants(coverage.applicants)) {
          const key = `${coverage.id}:${applicantId}`;
          const currentAmount = storedAmounts[key] ?? 0;

          if (currentAmount <= 0 && defaultAmount > 0) {
            amountPatch[key] = defaultAmount;
          }
        }

        if (
          coverage.waitingPeriodOptions?.length &&
          storedWaitingPeriods[coverage.id] == null
        ) {
          wpPatch[coverage.id] = coverage.waitingPeriodOptions[0].value;
        }

        if (
          coverage.maxBenefitPeriodOptions?.length &&
          storedMaxBenefitPeriods[coverage.id] == null
        ) {
          mbpPatch[coverage.id] = coverage.maxBenefitPeriodOptions[0].value;
        }
      }

      const hasAmountPatch = Object.keys(amountPatch).length > 0;
      const hasWaitingPeriodPatch = Object.keys(wpPatch).length > 0;
      const hasMaxBenefitPatch = Object.keys(mbpPatch).length > 0;

      if (!hasAmountPatch && !hasWaitingPeriodPatch && !hasMaxBenefitPatch) {
        return;
      }

      setPageValues({
        ...(hasAmountPatch
          ? { coverageAmounts: { ...storedAmounts, ...amountPatch } }
          : {}),
        ...(hasWaitingPeriodPatch
          ? { coverageWaitingPeriods: { ...storedWaitingPeriods, ...wpPatch } }
          : {}),
        ...(hasMaxBenefitPatch
          ? {
              coverageMaxBenefitPeriods: {
                ...storedMaxBenefitPeriods,
                ...mbpPatch,
              },
            }
          : {}),
      });
    }

    window.addEventListener("devtools:fillform", handleDevFillForm);
    return () =>
      window.removeEventListener("devtools:fillform", handleDevFillForm);
  }, [
    getVisibleApplicants,
    selectedCoverages,
    setPageValues,
    storedAmounts,
    storedMaxBenefitPeriods,
    storedWaitingPeriods,
  ]);

  function handleAmountChange(key: string, amount: number) {
    beginRateCalculation(key);

    setPageValues({
      coverageAmounts: { ...storedAmounts, [key]: amount },
    });
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
    beginRateCalculationForCoverage(coverageId);

    setPageValues({
      coverageWaitingPeriods: {
        ...storedWaitingPeriods,
        [coverageId]: value,
      },
    });
  }

  function handleMaxBenefitPeriodChange(coverageId: string, value: string) {
    beginRateCalculationForCoverage(coverageId);

    setPageValues({
      coverageMaxBenefitPeriods: {
        ...storedMaxBenefitPeriods,
        [coverageId]: value,
      },
    });
  }

  /** Calculate total premium for a single coverage+applicant, including rider costs */
  function calcApplicantPremium(
    coverage: (typeof selectedCoverages)[number],
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

  const groupedCategories = coverageCategories
    .map((category) => ({
      category,
      items: selectedCoverages.filter(
        (coverage) => coverage.categoryId === category.id,
      ),
    }))
    .filter((group) => group.items.length > 0);

  function validate(nextValues: Record<string, unknown>) {
    const nextStoredAmounts =
      nextValues.coverageAmounts != null &&
      typeof nextValues.coverageAmounts === "object" &&
      !Array.isArray(nextValues.coverageAmounts)
        ? (nextValues.coverageAmounts as Record<string, number>)
        : {};

    const hasAmount = Object.values(nextStoredAmounts).some(
      (value) => value > 0,
    );

    if (!hasAmount) {
      return "Select at least one coverage amount before continuing.";
    }

    return undefined;
  }

  const helpItems = [
    {
      id: "coverage-needs",
      label: "How much coverage do I need?",
      title: "How much coverage do I need?",
      content: <CoverageNeedsCalculator />,
    },
  ];

  return (
    <FormRoutePage pageId={pageId} validate={validate} helpItems={helpItems}>
      {selectedCoverages.length > 0 ? (
        <>
          {hasSelectedQdProduct && (
            <Box
              sx={{
                display: "flex",
                alignItems: "flex-start",
                gap: 1,
                p: 2,
                mb: 2,
                borderRadius: 2,
                backgroundColor: "#eef6ee",
                // border: "1px solid rgba(46, 125, 50, 0.2)",
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
                helps many applicants receive a decision instantly or within a
                few days without a medical exam. This starts with health
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
          <Stack spacing={2}>
            {groupedCategories
              .flatMap(({ items }) => items)
              .map((coverage) => {
                const visibleApplicants = getVisibleApplicants(
                  coverage.applicants,
                  coverage.id,
                );
                const choices = generateAmountChoices(
                  coverage.categoryId,
                  coverage.minAmount,
                  coverage.maxAmount,
                );
                const amountLabel = getBenefitAmountLabel(coverage.categoryId);
                const noteText = resolveCoverageNote(coverage);
                const spouseNote = visibleApplicants.includes("spouse")
                  ? resolveSpouseCoverageNote(coverage)
                  : undefined;

                return (
                  <Box
                    key={coverage.id}
                    sx={{
                      bgcolor: "background.paper",
                      // border: "1px solid",
                      borderColor: "divider",
                      borderRadius: "16px",
                      p: 2,
                      // boxShadow: 1,
                    }}
                  >
                    <Stack spacing={1.5}>
                      <Typography
                        // variant="body2"
                        sx={{
                          fontWeight: 700,
                          fontSize: "14px !important",
                          letterSpacing: "-0.25px",
                        }}
                      >
                        {coverage.name}
                        {coverage.underwritingType === "QD" && (
                          <QuickDecisionIndicator />
                        )}
                      </Typography>

                      {(noteText || spouseNote) && (
                        <Alert severity="info" icon={false}>
                          {noteText}
                          {spouseNote && (
                            <>
                              {noteText && (
                                <>
                                  <br />
                                  <br />
                                </>
                              )}
                              {spouseNote}
                            </>
                          )}
                        </Alert>
                      )}

                      {visibleApplicants.map((applicantId) => {
                        const sectionId =
                          coverageApplicantToSection[applicantId];
                        const key = `${coverage.id}:${applicantId}`;
                        const selectedAmount = storedAmounts[key] ?? 0;
                        const isCalculatingRate = calculatingRateKeys.has(key);
                        const premium = calcApplicantPremium(
                          coverage,
                          applicantId,
                        );

                        const showApplicantLabel = visibleApplicants.length > 1;

                        return (
                          <Box key={applicantId}>
                            {showApplicantLabel && (
                              <Box sx={{ mb: 2 }}>
                                <FormSectionTitle applicant={sectionId} />
                              </Box>
                            )}

                            <Box>
                              <Stack spacing={1.5}>
                                <FormControl fullWidth margin="normal">
                                  <InputLabel>{amountLabel}</InputLabel>
                                  <Select
                                    label={amountLabel}
                                    value={selectedAmount}
                                    onChange={(e) =>
                                      handleAmountChange(
                                        key,
                                        Number(e.target.value),
                                      )
                                    }
                                  >
                                    {choices.map((amt) => (
                                      <MenuItem key={amt} value={amt}>
                                        {formatUSD(amt, 0)}
                                      </MenuItem>
                                    ))}
                                  </Select>
                                </FormControl>

                                {/* DI additional fields: Waiting Period */}
                                {coverage.categoryId === "DI" &&
                                  coverage.waitingPeriodOptions &&
                                  selectedAmount > 0 && (
                                    <FormControl fullWidth margin="normal">
                                      <InputLabel>Waiting Period</InputLabel>
                                      <Select
                                        label="Waiting Period"
                                        value={
                                          storedWaitingPeriods[coverage.id] ??
                                          coverage.waitingPeriodOptions[0].value
                                        }
                                        onChange={(e) =>
                                          handleWaitingPeriodChange(
                                            coverage.id,
                                            e.target.value as string,
                                          )
                                        }
                                      >
                                        {coverage.waitingPeriodOptions.map(
                                          (opt) => (
                                            <MenuItem
                                              key={opt.value}
                                              value={opt.value}
                                            >
                                              {opt.label}
                                            </MenuItem>
                                          ),
                                        )}
                                      </Select>
                                      <FormHelperText>
                                        The number of consecutive days you must
                                        be totally disabled by a covered illness
                                        or injury and not gainfully employed in
                                        any occupation before benefits commence.
                                        Coverage with a longer waiting period is
                                        less expensive.
                                      </FormHelperText>
                                    </FormControl>
                                  )}

                                {/* OO additional fields: Waiting Period + Max Benefit Period */}
                                {coverage.categoryId === "OO" &&
                                  selectedAmount > 0 && (
                                    <Stack spacing={1.5}>
                                      {coverage.waitingPeriodOptions && (
                                        <FormControl fullWidth margin="normal">
                                          <InputLabel>
                                            Waiting Period
                                          </InputLabel>
                                          <Select
                                            label="Waiting Period"
                                            value={
                                              storedWaitingPeriods[
                                                coverage.id
                                              ] ??
                                              coverage.waitingPeriodOptions[0]
                                                .value
                                            }
                                            onChange={(e) =>
                                              handleWaitingPeriodChange(
                                                coverage.id,
                                                e.target.value as string,
                                              )
                                            }
                                          >
                                            {coverage.waitingPeriodOptions.map(
                                              (opt) => (
                                                <MenuItem
                                                  key={opt.value}
                                                  value={opt.value}
                                                >
                                                  {opt.label}
                                                </MenuItem>
                                              ),
                                            )}
                                          </Select>
                                          <FormHelperText>
                                            The number of consecutive days you
                                            must be totally disabled by a
                                            covered illness or injury and not
                                            gainfully employed in any occupation
                                            before benefits commence. Coverage
                                            with a longer waiting period is less
                                            expensive.
                                          </FormHelperText>
                                        </FormControl>
                                      )}

                                      {coverage.maxBenefitPeriodOptions && (
                                        <FormControl fullWidth margin="normal">
                                          <InputLabel>
                                            Maximum Benefit Period
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
                                                e.target.value as string,
                                              )
                                            }
                                          >
                                            {coverage.maxBenefitPeriodOptions.map(
                                              (opt) => (
                                                <MenuItem
                                                  key={opt.value}
                                                  value={opt.value}
                                                >
                                                  {opt.label}
                                                </MenuItem>
                                              ),
                                            )}
                                          </Select>
                                          <FormHelperText>
                                            The maximum length of time Office
                                            Overhead benefits will be paid for
                                            eligible business expenses while
                                            disabled.
                                          </FormHelperText>
                                        </FormControl>
                                      )}
                                    </Stack>
                                  )}

                                {/* Optional Benefit(s) — per applicant */}
                                {coverage.riders &&
                                  coverage.riders.length > 0 &&
                                  selectedAmount > 0 && (
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
                                          const isChecked =
                                            !!storedRiders[riderKey];

                                          return (
                                            <Box key={rider.id}>
                                              <SelectableOptionCard
                                                onClick={() =>
                                                  handleRiderToggle(
                                                    coverage.id,
                                                    rider.id,
                                                    applicantId,
                                                  )
                                                }
                                              >
                                                <Checkbox
                                                  checked={isChecked}
                                                  onChange={() =>
                                                    handleRiderToggle(
                                                      coverage.id,
                                                      rider.id,
                                                      applicantId,
                                                    )
                                                  }
                                                  onClick={(event) =>
                                                    event.stopPropagation()
                                                  }
                                                  inputProps={{
                                                    "aria-label": `${rider.name} selection`,
                                                  }}
                                                  size="small"
                                                  sx={{
                                                    mt: 0.25,
                                                    color: "text.primary",
                                                    "&.Mui-checked": {
                                                      color: "primary.main",
                                                    },
                                                  }}
                                                />
                                                <Stack
                                                  spacing={0.5}
                                                  sx={{
                                                    flex: 1,
                                                    minWidth: 0,
                                                  }}
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
                                              </SelectableOptionCard>

                                              {/* Rider with amount selection */}
                                              {rider.hasAmount &&
                                                isChecked &&
                                                rider.minAmount != null &&
                                                rider.maxAmount != null && (
                                                  <FormControl
                                                    margin="normal"
                                                    sx={{
                                                      ml: 4,
                                                      minWidth: 200,
                                                    }}
                                                  >
                                                    <InputLabel>
                                                      Rider Benefit Amount
                                                    </InputLabel>
                                                    <Select
                                                      label="Rider Benefit Amount"
                                                      value={
                                                        storedRiderAmounts[
                                                          riderKey
                                                        ] ?? 0
                                                      }
                                                      onChange={(e) =>
                                                        handleRiderAmountChange(
                                                          coverage.id,
                                                          rider.id,
                                                          applicantId,
                                                          Number(
                                                            e.target.value,
                                                          ),
                                                        )
                                                      }
                                                    >
                                                      {generateAmountChoices(
                                                        coverage.categoryId,
                                                        rider.minAmount,
                                                        rider.maxAmount,
                                                      ).map((amt) => (
                                                        <MenuItem
                                                          key={amt}
                                                          value={amt}
                                                        >
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

                                {/* Estimated cost — right-aligned at end of applicant section */}
                                {selectedAmount > 0 && (
                                  <Box
                                    sx={{
                                      // display: "flex",
                                      // justifyContent: "flex-end",
                                      mt: 1,
                                      // pb: 2,
                                      // borderBottom: "1px solid",
                                      // borderColor: "rgba(0, 0, 0, 0.12)",
                                      padding: 2,
                                      borderRadius: 2,
                                      backgroundColor: "#f7faff",
                                    }}
                                  >
                                    {isCalculatingRate ? (
                                      <Stack
                                        direction="row"
                                        spacing={1}
                                        alignItems="center"
                                        sx={{ color: "text.secondary" }}
                                      >
                                        <CircularProgress
                                          size={18}
                                          thickness={4}
                                        />
                                        <Typography variant="body2">
                                          Calculating...
                                        </Typography>
                                      </Stack>
                                    ) : (
                                      <Stack
                                        direction="row"
                                        spacing={1}
                                        justifyContent="space-between"
                                        alignItems="center"
                                      >
                                        <Stack
                                          direction="column"
                                          spacing={0.5}
                                          // alignItems="center"
                                        >
                                          <Typography
                                            variant="body2"
                                            sx={{
                                              color: "text.primary",
                                              fontWeight: 600,
                                              fontSize: 12,
                                            }}
                                          >
                                            Estimated cost<sup>1</sup>{" "}
                                          </Typography>
                                          <Typography
                                            variant="body2"
                                            sx={{
                                              fontSize: 10,
                                              color: "text.secondary",
                                            }}
                                          >
                                            {coverage.name}
                                          </Typography>
                                        </Stack>
                                        <Typography
                                          component="span"
                                          variant="body2"
                                          sx={{
                                            color: "primary.main",
                                            fontWeight: 800,
                                            fontSize: {
                                              xs: "1.5rem",
                                              md: "2rem",
                                            },
                                          }}
                                        >
                                          {formatUSD(premium)}
                                          <Typography
                                            component="span"
                                            variant="body2"
                                            sx={{
                                              color: "primary.main",
                                              fontWeight: 800,
                                              fontSize: {
                                                xs: "1rem",
                                                sm: "1.25rem",
                                              },
                                            }}
                                          >
                                            /mo
                                          </Typography>
                                        </Typography>
                                      </Stack>
                                    )}
                                  </Box>
                                )}

                                {/* Message when amount is $0 */}
                                {selectedAmount === 0 && (
                                  <Alert
                                    severity="info"
                                    icon={false}
                                    sx={{ mt: 1 }}
                                  >
                                    You have selected $0 for this coverage. This
                                    means you are not applying for this product.
                                    Please ensure your selections look correct.
                                  </Alert>
                                )}
                              </Stack>
                            </Box>
                          </Box>
                        );
                      })}
                    </Stack>
                  </Box>
                );
              })}
          </Stack>

          <Typography variant="caption" color="text.secondary">
            <sup>1</sup> Quoted cost is the best rate available based on the
            information you provided. Final cost may be based upon factors such
            as gender, health status, and use of tobacco/nicotine. Rates current
            as of 2026.
          </Typography>
        </>
      ) : (
        <Alert severity="info" icon={false}>
          No coverage options are available for your current selections.
        </Alert>
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
    </FormRoutePage>
  );
}
