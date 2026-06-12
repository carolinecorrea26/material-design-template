import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
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
  Switch,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import FormRoutePage from "../components/form/FormRoutePage";
import FormPageHelp from "../components/form/FormPageHelp";
import FormSectionTitle from "../components/form/FormSectionTitle";
import FormHelpDrawer from "../components/form/FormHelpDrawer";
import QuickDecisionDrawerContent from "../components/common/QuickDecisionDrawerContent";
import { QuickDecisionMark } from "../components/common/QuickDecisionDrawerContent";
import QuickDecisionIndicator from "../components/common/QuickDecisionIndicator";
import SelectableOptionRow from "../components/form/SelectableOptionRow";
import { getActiveClient } from "../client/getActiveClient";
import { getActiveClientCoverages } from "../client/getActiveClientCoverages";
import { coverageCategories } from "../config/coverageCategories";
import type { CoverageCategoryId } from "../config/coverages/types";
import type { CoverageApplicantId } from "../config/coverages/types";
import type { EstimatedRateFrequency } from "../config/clients/types";
import { coverageApplicantToSection } from "../config/formSectionTitle";
import { useApplicationForm } from "../state/ApplicationFormContext";
import { coverageNeedsHelpItem } from "../content/helpContent";
import { colors } from "../app/theme";
import { formatUSD } from "../utils/formatUSD";
import { estimateMonthlyPremium } from "../utils/estimateMonthlyPremium";
import { generateAmountChoices as generateAmountChoicesBase } from "../utils/generateAmountChoices";

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

const defaultCoverageNotes: Partial<Record<CoverageCategoryId, string>> = {
  LI: "The maximum aggregate available through New York Life Insurance Company for any individual is $2,000,000, whether coverage is in one or divided among several group policies.",
  AD: "The maximum aggregate available through New York Life Insurance Company for any individual is $2,000,000, whether coverage is in one or divided among several group policies.",
  DI: "The maximum monthly benefit aggregate available through New York Life Insurance Company for any individual is $2,000,000, whether coverage is in one or divided among several group policies.",
  OO: "The maximum monthly benefit aggregate available through New York Life Insurance Company for any individual is $2,000,000, whether coverage is in one or divided among several group policies.",
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
    LI: "The maximum aggregate available for spouse through New York Life Insurance Company for any individual is $2,000,000, whether coverage is in one or divided among several group policies. Spouse coverage cannot exceed member coverage (including in force or requested coverage).",
    AD: "The maximum aggregate available for spouse through New York Life Insurance Company for any individual is $2,000,000, whether coverage is in one or divided among several group policies. Spouse coverage cannot exceed member coverage (including in force or requested coverage).",
    DI: "The maximum monthly benefit aggregate available for spouse through New York Life Insurance Company for any individual is $2,000,000, whether coverage is in one or divided among several group policies. Spouse coverage cannot exceed member coverage (including in force or requested coverage).",
    OO: "The maximum monthly benefit aggregate available for spouse through New York Life Insurance Company for any individual is $2,000,000, whether coverage is in one or divided among several group policies. Spouse coverage cannot exceed member coverage (including in force or requested coverage).",
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
  const theme = useTheme();
  const isMdUp = useMediaQuery(theme.breakpoints.up("md"));
  const activeClient = useMemo(() => getActiveClient(), []);
  const coverages = useMemo(() => getActiveClientCoverages(), []);
  const { values, setPageValues } = useApplicationForm();
  const [qdDrawerOpen, setQdDrawerOpen] = useState(false);
  const [calculatingRateKeys, setCalculatingRateKeys] = useState<Set<string>>(
    () => new Set(),
  );
  const rateCalculationTimersRef = useRef<Record<string, number>>({});
  const rateDisplayConfig = activeClient.coverages.estimatedRateDisplay;
  const showRateFrequencyToggle =
    rateDisplayConfig?.showFrequencyToggle === true;
  const defaultRateFrequency: EstimatedRateFrequency =
    rateDisplayConfig?.defaultFrequency ?? "monthly";
  const [rateFrequency, setRateFrequency] =
    useState<EstimatedRateFrequency>(defaultRateFrequency);

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
      // If this product has an explicit applicant selection with entries, use it directly.
      if (
        coverageId &&
        Object.prototype.hasOwnProperty.call(productApplicants, coverageId)
      ) {
        const selectedApplicants = Array.isArray(productApplicants[coverageId])
          ? productApplicants[coverageId]
          : [];

        if (selectedApplicants.length > 0) {
          return applicants.filter((a) => selectedApplicants.includes(a));
        }
      }

      // Fall back to selectedDependents (member always visible)
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

  function handleRateFrequencyChange(
    nextRateFrequency: EstimatedRateFrequency,
  ) {
    if (nextRateFrequency === rateFrequency) return;

    setRateFrequency(nextRateFrequency);

    selectedCoverages.forEach((coverage) => {
      getVisibleApplicants(coverage.applicants, coverage.id).forEach(
        (applicantId) => {
          const key = `${coverage.id}:${applicantId}`;
          if ((storedAmounts[key] ?? 0) > 0) {
            beginRateCalculation(key);
          }
        },
      );
    });
  }

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

  // Initialize missing waiting period and max benefit period entries
  useEffect(() => {
    const wpPatch: Record<string, string> = {};
    const mbpPatch: Record<string, string> = {};
    let needsUpdate = false;

    for (const coverage of selectedCoverages) {
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

  const helpItems = [coverageNeedsHelpItem];

  function EstimatedCostPanelContent() {
    const grandTotal = groupedCategories
      .flatMap(({ items }) => items)
      .reduce((total, coverage) => {
        const visibleApplicants = getVisibleApplicants(
          coverage.applicants,
          coverage.id,
        );
        return (
          total +
          visibleApplicants.reduce(
            (sum, applicantId) =>
              sum + calcApplicantPremium(coverage, applicantId),
            0,
          )
        );
      }, 0);

    const isAnyRateCalculating = calculatingRateKeys.size > 0;

    if (grandTotal <= 0 && !isAnyRateCalculating) {
      return (
        <Box
          sx={{
            p: "16px",
            borderRadius: "8px",
            bgcolor: "#f5f8fd",
          }}
        >
          <Stack spacing={1.5}>
            <Typography
              variant="body2"
              sx={{
                color: "text.primary",
                fontWeight: 600,
                fontSize: 12,
              }}
            >
              Estimated cost<sup>1</sup>
            </Typography>
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
              <InfoOutlinedIcon
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
                Cost calculated after amount selection
              </Typography>
            </Box>
          </Stack>
        </Box>
      );
    }

    const displayedGrandTotal = getDisplayedPremium(grandTotal, rateFrequency);
    const rateSuffix = rateFrequency === "annual" ? "/yr" : "/mo";

    return (
      <Box
        sx={{
          p: "16px",
          borderRadius: "8px",
          bgcolor: "#f5f8fd",
        }}
      >
        <Stack spacing={1.5}>
          <Typography
            variant="body2"
            sx={{
              color: "text.primary",
              fontWeight: 600,
              fontSize: 12,
            }}
          >
            Estimated cost<sup>1</sup>
          </Typography>

          {groupedCategories
            .flatMap(({ items }) => items)
            .map((coverage) => {
              const visibleApplicants = getVisibleApplicants(
                coverage.applicants,
                coverage.id,
              );
              const applicantPremiums = visibleApplicants.map(
                (applicantId) => ({
                  applicantId,
                  premium: calcApplicantPremium(coverage, applicantId),
                  isCalculating: calculatingRateKeys.has(
                    `${coverage.id}:${applicantId}`,
                  ),
                }),
              );
              const coverageTotal = applicantPremiums.reduce(
                (sum, { premium }) => sum + premium,
                0,
              );
              const isAnyCalculating = applicantPremiums.some(
                (a) => a.isCalculating,
              );

              if (coverageTotal <= 0 && !isAnyCalculating) return null;

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
                  {isAnyCalculating ? (
                    <CircularProgress size={14} thickness={4} />
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
                sx={{
                  fontWeight: 600,
                  fontSize: 12,
                }}
              >
                Total
              </Typography>
              {isAnyRateCalculating ? (
                <CircularProgress size={14} thickness={4} />
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
              justifyContent="center"
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
                  handleRateFrequencyChange(
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
        </Stack>
      </Box>
    );
  }

  return (
    <FormRoutePage
      pageId={pageId}
      validate={validate}
      help={<FormPageHelp items={helpItems} />}
    >
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
                backgroundColor: colors.successBg,
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
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", md: "row" },
              alignItems: { md: "flex-start" },
              gap: 3,
            }}
          >
            {/* Left column: coverage form fields */}
            <Box sx={{ flex: 1, minWidth: 0 }}>
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
                    const amountLabel = getBenefitAmountLabel(
                      coverage.categoryId,
                    );
                    const noteText = resolveCoverageNote(coverage);
                    const spouseNote = visibleApplicants.includes("spouse")
                      ? resolveSpouseCoverageNote(coverage)
                      : undefined;

                    return (
                      <Box
                        key={coverage.id}
                        sx={{
                          bgcolor: "background.paper",
                          border: "1px solid",
                          borderColor: "divider",
                          borderRadius: "16px",
                          p: 2,
                        }}
                      >
                        <Stack spacing={2}>
                          <Typography
                            // variant="body2"
                            sx={{
                              fontWeight: 700,
                              fontSize: "16px !important",
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
                            const isCalculatingRate =
                              calculatingRateKeys.has(key);
                            const premium = calcApplicantPremium(
                              coverage,
                              applicantId,
                            );
                            const displayedPremium = getDisplayedPremium(
                              premium,
                              rateFrequency,
                            );
                            const rateSuffix =
                              rateFrequency === "annual" ? "/yr" : "/mo";

                            const showApplicantLabel =
                              visibleApplicants.length > 1;

                            const hasAmountSelection =
                              storedAmounts[key] != null;
                            const selectValue = hasAmountSelection
                              ? selectedAmount
                              : "";

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
                                        value={selectValue}
                                        displayEmpty={false}
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

                                    {/* OO additional fields: Waiting Period + Max Benefit Period */}
                                    {coverage.categoryId === "OO" &&
                                      selectedAmount > 0 && (
                                        <Stack spacing={1.5}>
                                          {coverage.waitingPeriodOptions && (
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
                                                The number of consecutive days
                                                you must be totally disabled by
                                                a covered illness or injury and
                                                not gainfully employed in any
                                                occupation before benefits
                                                commence. Coverage with a longer
                                                waiting period is less
                                                expensive.
                                              </FormHelperText>
                                            </FormControl>
                                          )}

                                          {coverage.maxBenefitPeriodOptions && (
                                            <FormControl
                                              fullWidth
                                              margin="normal"
                                            >
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
                                                The maximum length of time
                                                Office Overhead benefits will be
                                                paid for eligible business
                                                expenses while disabled.
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
                                                  <SelectableOptionRow>
                                                    <Checkbox
                                                      checked={isChecked}
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
                                                        pointerEvents: "none",
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
                                                  </SelectableOptionRow>

                                                  {/* Rider with amount selection */}
                                                  {rider.hasAmount &&
                                                    isChecked &&
                                                    rider.minAmount != null &&
                                                    rider.maxAmount != null && (
                                                      <FormControl
                                                        margin="normal"
                                                        sx={{
                                                          ml: 4,
                                                          minWidth: 250,
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
                                                              {formatUSD(
                                                                amt,
                                                                0,
                                                              )}
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

                                    {/* Estimated cost — inline in product box */}
                                    {hasAmountSelection &&
                                      selectedAmount > 0 && (
                                        <Stack
                                          direction="row"
                                          spacing={1}
                                          justifyContent="flex-end"
                                          alignItems="center"
                                          sx={{ mt: 0.5 }}
                                        >
                                          {isCalculatingRate ? (
                                            <CircularProgress
                                              size={14}
                                              thickness={4}
                                            />
                                          ) : (
                                            <Typography
                                              variant="body2"
                                              sx={{
                                                color: "text.secondary",
                                                fontSize: 12,
                                              }}
                                            >
                                              Est. cost<sup>1</sup>:{" "}
                                              <Typography
                                                component="span"
                                                sx={{
                                                  color: "primary.main",
                                                  fontSize: 14,
                                                  fontWeight: 700,
                                                }}
                                              >
                                                {formatUSD(displayedPremium)}
                                                {rateSuffix}
                                              </Typography>
                                            </Typography>
                                          )}
                                        </Stack>
                                      )}

                                    {/* Message when amount is $0 */}
                                    {hasAmountSelection &&
                                      selectedAmount === 0 && (
                                        <Alert
                                          severity="info"
                                          icon={false}
                                          sx={{ mt: 1 }}
                                        >
                                          You have selected $0 for this
                                          coverage. This means you are not
                                          applying for this product. Please
                                          ensure your selections look correct.
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

          {/* Total estimated cost section on mobile */}
          {!isMdUp && (
            <Box sx={{ mt: 3 }}>
              <EstimatedCostPanelContent />
            </Box>
          )}

          {/* Footnote on small screens */}
          {!isMdUp && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
              <sup>1</sup> Quoted cost is the best rate available based on the
              information you provided. Final cost may be based upon factors
              such as gender, health status, and use of tobacco/nicotine. Rates
              current as of 2026.
            </Typography>
          )}
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
