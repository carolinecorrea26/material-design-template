import { selectedProductApplicants } from '../../domain/applicantParticipation';
import { reconcileApplicationRiders } from '../../domain/applicationRiders';
import { useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import CoverageCart, { type CoverageCartProps, type CoverageSummaryEntry, type ApplicantSummary } from "../../components/coverage/CoverageCart";
import { useApplicationForm } from "../ApplicationFormContext";
import { usePrototypeRates } from "../usePrototypeRates";
import { getActiveClient } from "../../config/client/getActiveClient";
import { getActiveClientCoverages } from "../../config/client/getActiveClientCoverages";
import { getResolvedApplicantLabels } from "../../config/formSectionTitle";
import { applicationCoverageName, applicationUnderwriting } from "../../domain/coverageRuntime";
import { selectedRiderOnly } from "../../domain/coverageRiderOnly";
import { productMonthlyPremium } from "../../domain/pricing";
import { rateDisplayForAmount, type RateDisplayState } from "../../domain/rateDisplay";
import { getResolvedFormFlow } from "../../config/formFlow";
import { getConfiguredPages, getPagePath } from "../../config/pages";
import type { PageId } from "../../types";
import type { CoverageApplicantId } from "../../config/coverages/types";
import { getPrototypeLibrary } from "../../domain/prototypeLibrary";
import { associationRatesSuppressed } from "../../domain/ratePresentation";

type Props = Exclude<CoverageCartProps, { variant: "drawer" }> | { variant: "drawer"; source?: "cart-icon" | "coverage-page"; onClose: () => void };
export function useSummaryData() {
  const { values } = useApplicationForm();
  const allCoverages = useMemo(() => getActiveClientCoverages(), []);

  const rateRequests = Object.entries(values.coverageAmounts as Record<string, number> ?? {}).flatMap(([key, amount]) => {
    const [productKey, applicant] = key.split(":");
    return allCoverages.some(product => product.id === productKey && selectedProductApplicants(values, product).includes(applicant as CoverageApplicantId))
      ? [{ productKey, applicant: applicant as CoverageApplicantId, amount }] : [];
  });
  const rates = usePrototypeRates(rateRequests, values, "monthly", "coverage");
  return useMemo(() => {
    const selectedIds: string[] = Array.isArray(values.coverageSelections)
      ? values.coverageSelections.filter((value): value is string => typeof value === "string")
      : [];

    if (selectedIds.length === 0) {
      return {
        entries: [] as CoverageSummaryEntry[],
        totalMonthly: 0,
        badgeCount: 0,
      };
    }

    const amounts: Record<string, number> =
      values.coverageAmounts != null &&
      typeof values.coverageAmounts === "object" &&
      !Array.isArray(values.coverageAmounts)
        ? (values.coverageAmounts as Record<string, number>)
        : {};

    const { coverageRiders: riders, coverageRiderAmounts: riderAmounts } = reconcileApplicationRiders(allCoverages, values);

    const coverageMap = new Map(allCoverages.map((c) => [c.id, { ...c, name: applicationCoverageName(c, values) }]));

    let totalMonthly = 0;
    let badgeCount = 0;
    const entries: CoverageSummaryEntry[] = [];

    for (const covId of selectedIds) {
      const coverage = coverageMap.get(covId);
      if (!coverage) continue;

      const visibleApplicants = selectedProductApplicants(values, coverage);
      if (!visibleApplicants.length) continue;
      badgeCount += visibleApplicants.length;

      const applicantSummaries: ApplicantSummary[] = visibleApplicants.map(
        (applicantId) => {
          const amountKey = `${covId}:${applicantId}`;
          const amount = amounts[amountKey];
          const selectedRiders: ApplicantSummary['riders'] = [];

          if (coverage.riders) {
            for (const rider of coverage.riders) {
              const riderKey = `${covId}:${rider.id}:${applicantId}`;
              if (riders[riderKey]) {
                const riderAmount = rider.hasAmount
                  ? riderAmounts[riderKey]
                  : undefined;
                selectedRiders.push({ name: rider.name, applicant: rider.dependentApplicant ?? applicantId, amount: riderAmount });
              }
            }
          }

          let monthlyEstimate: number | undefined;
          if (selectedRiderOnly(coverage, applicantId, values)) {
            monthlyEstimate = NaN;
            totalMonthly = NaN;
          } else if (amount != null && amount > 0) {
            monthlyEstimate = rates.enabled ? rates.premium(amountKey) : productMonthlyPremium(coverage, applicantId, amount, riders, riderAmounts);
            totalMonthly += monthlyEstimate;
          }

          const display: RateDisplayState = selectedRiderOnly(coverage, applicantId, values) ? { status: 'provided-separately' } : rates.enabled ? rates.display(amountKey) : rateDisplayForAmount(monthlyEstimate ?? NaN);
          return { applicantId, amount, riders: selectedRiders, monthlyEstimate, display, quickDecision: applicationUnderwriting(coverage, applicantId, values).underwritingType === "QD", riderOnly: selectedRiderOnly(coverage, applicantId, values) ?? undefined };
        },
      );

      entries.push({ coverage, applicants: applicantSummaries });
    }

    return {
      entries,
      totalMonthly: Math.round(totalMonthly * 100) / 100,
      badgeCount,
    };
  }, [values, allCoverages, rates]);
}

/** Returns the badge count for the cart icon in AppHeader. */
export function useCoverageCartBadge(): number {
  return useSummaryData().badgeCount;
}


function ConfiguredDrawer({ onClose, source }: { onClose: () => void; source?: "cart-icon" | "coverage-page" }) {
  const { entries, totalMonthly } = useSummaryData();
  const { values, setPageValues } = useApplicationForm();
  const navigate = useNavigate(), location = useLocation();
  function handleRemoveCoverage(coverageId: string) {
    const currentSelections: string[] = Array.isArray(values.coverageSelections)
      ? values.coverageSelections.filter((value): value is string => typeof value === "string")
      : [];
    const nextSelections = currentSelections.filter((id) => id !== coverageId);
    const currentProductApplicants: Record<string, unknown> =
      values.productApplicants != null &&
      typeof values.productApplicants === "object" &&
      !Array.isArray(values.productApplicants)
        ? (values.productApplicants as Record<string, unknown>)
        : {};
    const nextProductApplicants = { ...currentProductApplicants };
    delete nextProductApplicants[coverageId];
    setPageValues({
      coverageSelections: nextSelections,
      productApplicants: nextProductApplicants as Record<string, string[]>,
    });

    if (nextSelections.length === 0) {
      const flow = getResolvedFormFlow();
      const coverageIndex = flow.indexOf("coverage");
      const currentPath = location.pathname.replace(/\/$/, "");
      const currentPage = getConfiguredPages().find((p) => p.path === currentPath);
      const currentPageId = currentPage?.id as PageId | undefined;
      const currentIndex = currentPageId ? flow.indexOf(currentPageId) : -1;
      if (currentIndex > coverageIndex) {
        onClose();
        navigate(getPagePath("coverage"));
      }
    }
  }

  const library = getPrototypeLibrary();
  return <CoverageCart variant="drawer" source={source} onClose={onClose} entries={entries} totalMonthly={totalMonthly}
    applicantLabels={getResolvedApplicantLabels(getActiveClient().applicantLabels)}
    onRemoveCoverage={handleRemoveCoverage}
    ratesSuppressed={library ? associationRatesSuppressed(library.site, values) : false} />;
}
export default function ConfiguredCoverageCart(props: Props) {
  return props.variant === "drawer" ? <ConfiguredDrawer {...props} /> : <CoverageCart {...props} />;
}
