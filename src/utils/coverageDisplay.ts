import type { EstimatedRateFrequency } from "../config/clients/types";
import type { CoverageCategoryId } from "../config/coverages/types";
import { monthlyToFrequency } from "../domain/pricing";

export function getDisplayedPremium(
  monthlyPremium: number,
  rateFrequency: EstimatedRateFrequency,
): number {
  return rateFrequency === "annual" ? monthlyToFrequency(monthlyPremium, "annual") : monthlyPremium;
}

export function getBenefitAmountLabel(categoryId: CoverageCategoryId): string {
  if (categoryId === "DI" || categoryId === "OO") {
    return "Monthly Benefit Amount";
  }
  return "Benefit Amount";
}

