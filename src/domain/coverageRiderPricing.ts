import type { CoverageApplicantId } from "../config/coverages/types";
import { estimateMonthlyPremium } from "../utils/estimateMonthlyPremium";
import type { CoverageDefinition, RiderDefinition } from "./coverage";

/** Riders a self-only quote can offer: member riders not attached to a dependent. */
export function quoteRiders(product: CoverageDefinition): RiderDefinition[] {
  return (product.riders ?? []).filter(rider => (!rider.applicants || rider.applicants.includes("member")) && !rider.dependentApplicant);
}

/** Estimated monthly premium added by selected riders; Coverage and the quote share this formula. */
export function selectedRidersMonthlyPremium(
  product: CoverageDefinition,
  applicant: CoverageApplicantId,
  baseAmount: number,
  riders: Record<string, boolean>,
  riderAmounts: Record<string, number>,
): number {
  if (baseAmount <= 0) return 0;
  return (product.riders ?? []).reduce((total, rider) => {
    const key = `${product.id}:${rider.id}:${applicant}`;
    if (!riders[key]) return total;
    const amount = rider.hasAmount ? riderAmounts[key] ?? 0 : baseAmount;
    return total + estimateMonthlyPremium(product.categoryId, amount) * rider.premiumFactor;
  }, 0);
}
