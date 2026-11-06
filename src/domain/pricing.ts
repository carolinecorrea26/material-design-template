import pricingDocument from "../../requirements/global/formulas/pricing.json";
import type { CoverageApplicantId, CoverageDefinition, RiderDefinition } from "./coverage";
import { categoryMonthly, monthlyPremium, premiumForFrequency, pricingFormulas, type RiderCharge } from "./pricingFormulas.mjs";

/** Mock pricing from requirements/global/formulas/pricing.json; PRASE is not connected. */
const formulas = pricingFormulas(pricingDocument);
type Priced = Pick<CoverageDefinition, "id" | "categoryId" | "riders">;

/** Riders a self-only quote can offer: member riders not attached to a dependent. */
export function quoteRiders(product: Pick<CoverageDefinition, "riders">): RiderDefinition[] {
  return (product.riders ?? []).filter(rider => (!rider.applicants || rider.applicants.includes("member")) && !rider.dependentApplicant);
}

/** Selected riders for one applicant, each with the amount the rider is priced on. */
export function selectedRiderCharges(
  product: Priced,
  applicant: CoverageApplicantId,
  baseAmount: number,
  riders: Record<string, boolean> | undefined,
  riderAmounts: Record<string, number> | undefined,
): Array<RiderCharge & { rider: RiderDefinition }> {
  if (!(baseAmount > 0)) return [];
  return (product.riders ?? []).flatMap(rider => {
    const key = `${product.id}:${rider.id}:${applicant}`;
    if (!riders?.[key] || (rider.applicants && !rider.applicants.includes(applicant))) return [];
    const amount = rider.hasAmount ? riderAmounts?.[key] ?? 0 : baseAmount;
    return amount > 0 ? [{ rider, amount, premiumFactor: rider.premiumFactor }] : [];
  });
}

/** Base premium with the minimum applied; zero when there is no amount. */
export function baseMonthlyPremium(categoryId: string, amount: number): number {
  return monthlyPremium(formulas, categoryId, amount);
}

export function riderMonthlyPremium(categoryId: string, charge: RiderCharge): number {
  return Math.round(categoryMonthly(formulas, categoryId, charge.amount) * charge.premiumFactor * 100) / 100;
}

/** Base plus selected riders for one applicant. */
export function productMonthlyPremium(
  product: Priced,
  applicant: CoverageApplicantId,
  amount: number,
  riders?: Record<string, boolean>,
  riderAmounts?: Record<string, number>,
): number {
  return monthlyPremium(formulas, product.categoryId, amount, selectedRiderCharges(product, applicant, amount, riders, riderAmounts));
}

export function monthlyToFrequency(monthly: number, frequency: "monthly" | "quarterly" | "semiannual" | "annual"): number {
  return premiumForFrequency(formulas, monthly, frequency);
}

const frequencyAliases: Record<string, "monthly" | "quarterly" | "semiannual" | "annual"> = { monthly: "monthly", quarterly: "quarterly", semiannual: "semiannual", semiannually: "semiannual", annual: "annual", annually: "annual" };

/** Months covered by one payment; accepts the payment field values ("annually") and policy values ("annual"). */
export function monthsPerPayment(frequency: string): number {
  const canonical = frequencyAliases[frequency];
  if (!canonical) throw new Error(`Unknown payment frequency ${frequency}`);
  return formulas.frequency.factors[canonical];
}
