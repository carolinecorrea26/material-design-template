export type PricingRate = { basis: "per-thousand" | "percent-of-amount"; rate: number };
export type PricingFormulas = {
  base: { minimumMonthly: number; default: PricingRate; categories: Record<string, PricingRate> };
  rider: { amount: "rider-amount-or-base" };
  frequency: { factors: Record<"monthly" | "quarterly" | "semiannual" | "annual", number> };
};
export type RiderCharge = { amount: number; premiumFactor: number };
export function pricingFormulas(document: unknown): PricingFormulas;
export function categoryMonthly(formulas: PricingFormulas, categoryId: string, amount: number): number;
export function monthlyPremium(formulas: PricingFormulas, categoryId: string, amount: number, riders?: RiderCharge[]): number;
export function premiumForFrequency(formulas: PricingFormulas, monthly: number, frequency: string): number;
