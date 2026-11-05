import type { EstimatedRateFrequency } from "../config/clients/types";
import type { CoverageCategoryId } from "../config/coverages/types";

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

