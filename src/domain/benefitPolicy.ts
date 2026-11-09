import type { EffectiveSite, RuleProvenance } from "./effectiveSite";

export type BenefitAgeBand = { minimumAge: number; maximumAge: number; maximum: number };
export type BenefitApplicantPolicy = {
  applicantKey: string;
  applicantClass?: string;
  minimum: number;
  maximum: number;
  increment: number;
  amountChoices?: number[];
  ageBands?: BenefitAgeBand[];
  income?: { fraction: number; tiers?: { threshold: number; inclusive: boolean; fraction: number }[]; subtractExisting: boolean };
  requireMemberCoverage?: boolean;
  memberBenefitMultiplier?: number;
  selfEmployedOverride?: { lessThanYears: number; maximum: number; waitingDays: number; benefitPeriod: string };
  retirement?: { minimum: number; maximum: number };
  loanPaymentCap?: boolean;
  expenseCap?: boolean;
  waitingPeriods: { key: string; accidentDays: number; sicknessDays: number }[];
  benefitPeriods: string[];
  periodPairs?: { waitingKey: string; benefitPeriod: string }[];
};
export type BenefitPolicy = {
  version: 1;
  /** Present only on a derived view of version 2 stored policies. */
  amountSource?: "product-amount-rules";
  applicants: BenefitApplicantPolicy[];
  exclusiveProducts: string[];
  aggregate?: { productKeys: string[]; maximum: number; spouseMaximum?: number; spouseIncomeFraction?: number; income?: { fraction: number; threshold?: number; lowerFraction?: number; thresholdInclusive?: boolean }; compareMemberTotal?: boolean; excludeRetirement?: boolean };
  provisional: boolean;
  revisit: string[];
};
export type BenefitFacts = {
  ageYears?: number;
  applicantClass?: string;
  monthlyIncome?: number;
  existingMonthlyBenefit?: number;
  /** Verified portfolio balance, deducted before quantizing available increments. */
  verifiedInForceAmount?: number;
  memberCoverage?: boolean;
  memberRequestedBenefit?: number;
  memberTotalMonthlyBenefit?: number;
  selfEmployedYears?: number;
  selfEmployed?: boolean;
  selfEmployedUnderOneYear?: boolean;
  retirement?: boolean;
  monthlyLoanPayment?: number;
  eligibleMonthlyExpenses?: number;
  eligibleExpenseFraction?: number;
  selectedProducts?: string[];
  /** Complete monthly benefit totals for other products in the aggregate group,
   * including existing coverage; excludes the current product, supplied above. */
  otherMonthlyBenefits?: Record<string, number>;
  amount?: number;
  waitingPeriod?: string;
  benefitPeriod?: string;
};
export type BenefitDecision = {
  status: "resolved" | "needs-information" | "unresolved";
  allowed: boolean;
  minimum?: number;
  maximum?: number;
  increment?: number;
  amountChoices?: number[];
  lockedAmount?: number;
  waitingPeriods?: BenefitApplicantPolicy["waitingPeriods"];
  benefitPeriods?: string[];
  missingFacts: string[];
  errors: string[];
  provisional: boolean;
  revisit: string[];
  provenance: RuleProvenance[];
};
const finite = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value) && value >= 0;
const object = (value: unknown): value is Record<string, unknown> => value !== null && typeof value === "object" && !Array.isArray(value);
const strings = (value: unknown): value is string[] => Array.isArray(value) && value.every(v => typeof v === "string" && v.length > 0) && new Set(value).size === value.length;

/** Validate the stored executable contract before interpreting it. Unknown versions
 * and malformed expressions cannot inherit a prototype/default policy. */
export function isBenefitPolicy(value: unknown): value is BenefitPolicy {
  if (!object(value) || value.version !== 1 || !Array.isArray(value.applicants) || !value.applicants.length || !strings(value.exclusiveProducts) || typeof value.provisional !== "boolean" || !strings(value.revisit)) return false;
  const identities = new Set<string>();
  for (const row of value.applicants) {
    if (!object(row) || typeof row.applicantKey !== "string" || !row.applicantKey || row.applicantClass !== undefined && (typeof row.applicantClass !== "string" || !row.applicantClass) || !finite(row.minimum) || !finite(row.maximum) || row.minimum > row.maximum || !finite(row.increment) || row.increment <= 0 || !Array.isArray(row.waitingPeriods) || !row.waitingPeriods.length || !strings(row.benefitPeriods)) return false;
    if (row.amountChoices !== undefined && (!Array.isArray(row.amountChoices) || !row.amountChoices.length || row.amountChoices.some(n => !finite(n) || n < (row.minimum as number) || n > (row.maximum as number)) || new Set(row.amountChoices).size !== row.amountChoices.length)) return false;
    const identity = `${row.applicantKey}/${row.applicantClass ?? ""}`;
    if (identities.has(identity)) return false;
    identities.add(identity);
    const keys = new Set<string>();
    for (const period of row.waitingPeriods) {
      if (!object(period) || typeof period.key !== "string" || !period.key || keys.has(period.key) || !finite(period.accidentDays) || !Number.isInteger(period.accidentDays) || !finite(period.sicknessDays) || !Number.isInteger(period.sicknessDays)) return false;
      keys.add(period.key);
    }
    for (const flag of ["requireMemberCoverage", "loanPaymentCap", "expenseCap"]) if (row[flag] !== undefined && typeof row[flag] !== "boolean") return false;
    if (row.memberBenefitMultiplier !== undefined && (!finite(row.memberBenefitMultiplier) || row.memberBenefitMultiplier <= 0)) return false;
    if (row.ageBands !== undefined) {
      if (!Array.isArray(row.ageBands) || !row.ageBands.length) return false;
      for (const band of row.ageBands) if (!object(band) || !finite(band.minimumAge) || !Number.isInteger(band.minimumAge) || !finite(band.maximumAge) || !Number.isInteger(band.maximumAge) || band.minimumAge > band.maximumAge || !finite(band.maximum) || band.maximum > row.maximum) return false;
      const bands = [...row.ageBands].sort((a, b) => a.minimumAge - b.minimumAge);
      if (bands.some((band, index) => index > 0 && band.minimumAge <= bands[index - 1].maximumAge)) return false;
    }
    if (row.income !== undefined) {
      if (!object(row.income) || !finite(row.income.fraction) || row.income.fraction > 1 || typeof row.income.subtractExisting !== "boolean") return false;
      if (row.income.tiers !== undefined && (!Array.isArray(row.income.tiers) || row.income.tiers.some(tier => !object(tier) || !finite(tier.threshold) || !finite(tier.fraction) || tier.fraction > 1 || typeof tier.inclusive !== "boolean") || new Set(row.income.tiers.map(tier => tier.threshold)).size !== row.income.tiers.length)) return false;
    }
    if (row.selfEmployedOverride !== undefined) {
      const override = row.selfEmployedOverride;
      if (!object(override) || !finite(override.lessThanYears) || !finite(override.maximum) || override.maximum > row.maximum || !finite(override.waitingDays) || !Number.isInteger(override.waitingDays) || typeof override.benefitPeriod !== "string" || !row.benefitPeriods.includes(override.benefitPeriod) || !row.waitingPeriods.some(period => period.accidentDays === override.waitingDays && period.sicknessDays === override.waitingDays)) return false;
    }
    if (row.retirement !== undefined && (!object(row.retirement) || !finite(row.retirement.minimum) || !finite(row.retirement.maximum) || row.retirement.minimum > row.retirement.maximum)) return false;
    const benefitPeriods = row.benefitPeriods;
    if (row.periodPairs !== undefined && (!Array.isArray(row.periodPairs) || !row.periodPairs.length || row.periodPairs.some(pair => !object(pair) || !keys.has(String(pair.waitingKey)) || !benefitPeriods.includes(String(pair.benefitPeriod))))) return false;
  }
  if (value.aggregate !== undefined) {
    const group = value.aggregate;
    if (!object(group) || !strings(group.productKeys) || !group.productKeys.length || !finite(group.maximum)) return false;
    if (group.spouseMaximum !== undefined && !finite(group.spouseMaximum) || group.spouseIncomeFraction !== undefined && (!finite(group.spouseIncomeFraction) || group.spouseIncomeFraction > 1)) return false;
    for (const flag of ["compareMemberTotal", "excludeRetirement"]) if (group[flag] !== undefined && typeof group[flag] !== "boolean") return false;
    if (group.income !== undefined && (!object(group.income) || !finite(group.income.fraction) || group.income.fraction > 1 || group.income.threshold !== undefined && !finite(group.income.threshold) || group.income.lowerFraction !== undefined && (!finite(group.income.lowerFraction) || group.income.lowerFraction > 1) || group.income.thresholdInclusive !== undefined && typeof group.income.thresholdInclusive !== "boolean")) return false;
  }
  return true;
}

/** Benefit dimensions only: eligibility, health, residency and rating remain their
 * own gates. Every operand is a captured policy value or explicit applicant fact. */
export function resolveNormalizedBenefit(site: EffectiveSite, productKey: string, applicantKey: string, facts: BenefitFacts = {}): BenefitDecision {
  const policies = site.configuration.products.find(product => product.productKey === productKey)?.benefitPolicies ?? [];
  const provenance = policies.flatMap(policy => policy.provenance);
  const result: BenefitDecision = { status: "unresolved", allowed: false, missingFacts: [], errors: [], provisional: false, revisit: [], provenance };
  if (policies.length !== 1 || !isBenefitPolicy(policies[0].value)) return { ...result, errors: ["No unique valid executable benefit policy"] };
  const policy = policies[0].value;
  result.provisional = policy.provisional;
  result.revisit = [...policy.revisit];
  const candidates = policy.applicants.filter(row => row.applicantKey === applicantKey);
  if (candidates.some(row => row.applicantClass !== undefined) && facts.applicantClass === undefined) return { ...result, status: "needs-information", missingFacts: ["applicantClass"] };
  const matching = candidates.filter(row => row.applicantClass === undefined || row.applicantClass === facts.applicantClass);
  if (matching.length !== 1) return { ...result, status: "resolved", errors: ["Applicant or class is unavailable"] };
  const row = matching[0];
  let minimum = row.minimum, maximum = row.maximum;
  let waitingPeriods = [...row.waitingPeriods], benefitPeriods = [...row.benefitPeriods];
  const need = (key: keyof BenefitFacts): number | undefined => {
    if (!finite(facts[key])) { result.missingFacts.push(key); return undefined; }
    return facts[key] as number;
  };
  if (row.ageBands) {
    const age = need("ageYears");
    if (age !== undefined) {
      const band = Number.isInteger(age) && row.ageBands.find(band => age >= band.minimumAge && age <= band.maximumAge);
      if (!band) result.errors.push("Age is outside the benefit bands");
      else maximum = Math.min(maximum, band.maximum);
    }
  }
  let retirement = false;
  if (row.retirement) {
    if (typeof facts.retirement !== "boolean") result.missingFacts.push("retirement");
    else if (facts.retirement) { retirement = true; minimum = row.retirement.minimum; maximum = row.retirement.maximum; }
  }
  if (row.income && !retirement) {
    const income = need("monthlyIncome");
    const existing = row.income.subtractExisting ? need("existingMonthlyBenefit") : 0;
    if (income !== undefined && existing !== undefined) {
      const tier = [...(row.income.tiers ?? [])].sort((a, b) => a.threshold - b.threshold).find(tier => tier.inclusive ? income <= tier.threshold : income < tier.threshold);
      maximum = Math.min(maximum, Math.max(0, income * (tier?.fraction ?? row.income.fraction) - existing));
    }
  }
  if (row.requireMemberCoverage) {
    if (typeof facts.memberCoverage !== "boolean") result.missingFacts.push("memberCoverage");
    else if (!facts.memberCoverage) result.errors.push("Member coverage is required");
  }
  if (row.memberBenefitMultiplier !== undefined) {
    const member = need("memberRequestedBenefit");
    if (member !== undefined) maximum = Math.min(maximum, member * row.memberBenefitMultiplier);
  }
  if (row.selfEmployedOverride) {
    const direct = row.selfEmployedOverride.lessThanYears === 1 && typeof facts.selfEmployedUnderOneYear === "boolean";
    if (!direct && typeof facts.selfEmployed !== "boolean") result.missingFacts.push("selfEmployed");
    const years = !direct && facts.selfEmployed === true ? need("selfEmployedYears") : undefined;
    const restricted = direct ? facts.selfEmployedUnderOneYear : facts.selfEmployed === true && years !== undefined && years < row.selfEmployedOverride.lessThanYears;
    if (restricted) {
      maximum = Math.min(maximum, row.selfEmployedOverride.maximum);
      waitingPeriods = waitingPeriods.filter(period => period.accidentDays === row.selfEmployedOverride!.waitingDays && period.sicknessDays === row.selfEmployedOverride!.waitingDays);
      benefitPeriods = [row.selfEmployedOverride.benefitPeriod];
    }
  }
  if (row.loanPaymentCap) {
    const payment = need("monthlyLoanPayment");
    if (payment !== undefined) maximum = Math.min(maximum, Math.ceil(payment / row.increment) * row.increment);
  }
  if (row.expenseCap) {
    const expenses = need("eligibleMonthlyExpenses"), fraction = need("eligibleExpenseFraction");
    if (fraction !== undefined && fraction > 1) result.errors.push("Expense fraction must be between zero and one");
    if (expenses !== undefined && fraction !== undefined) maximum = Math.min(maximum, expenses * fraction);
  }
  if (row.periodPairs) {
    const waiting = facts.waitingPeriod ?? (waitingPeriods.length === 1 ? waitingPeriods[0].key : undefined);
    if (waiting !== undefined && waitingPeriods.some(period => period.key === waiting)) benefitPeriods = benefitPeriods.filter(period => row.periodPairs!.some(pair => pair.waitingKey === waiting && pair.benefitPeriod === period));
  }
  if (policy.exclusiveProducts.length) {
    if (!strings(facts.selectedProducts)) result.missingFacts.push("selectedProducts");
    else if (policy.exclusiveProducts.some(product => facts.selectedProducts!.includes(product))) result.errors.push("Mutually exclusive disability products selected");
  }
  const group = policy.aggregate;
  if (group && !(retirement && group.excludeRetirement)) {
    const existing = need("existingMonthlyBenefit");
    const others = facts.otherMonthlyBenefits;
    if (!object(others) || group.productKeys.filter(key => key !== productKey).some(key => !finite(others[key])) || Object.keys(others).some(key => !group.productKeys.includes(key) || key === productKey)) result.missingFacts.push("otherMonthlyBenefits");
    let cap = group.maximum;
    if (applicantKey === "spouse" && group.spouseMaximum !== undefined) cap = Math.min(cap, group.spouseMaximum);
    if (group.income) {
      const income = need("monthlyIncome");
      if (income !== undefined) {
        const lower = group.income.threshold !== undefined && (group.income.thresholdInclusive ? income <= group.income.threshold : income < group.income.threshold);
        cap = Math.min(cap, income * (applicantKey === "spouse" && group.spouseIncomeFraction !== undefined ? group.spouseIncomeFraction : lower ? group.income.lowerFraction ?? group.income.fraction : group.income.fraction));
      }
    }
    if (group.compareMemberTotal && applicantKey === "spouse") {
      const member = need("memberTotalMonthlyBenefit");
      if (member !== undefined) cap = Math.min(cap, member);
    }
    if (existing !== undefined && object(others) && Object.values(others).every(finite) && group.productKeys.filter(key => key !== productKey).every(key => finite(others[key]))) maximum = Math.min(maximum, Math.max(0, cap - existing - Object.values(others).reduce<number>((sum, amount) => sum + (amount as number), 0)));
  }
  if (facts.verifiedInForceAmount !== undefined) {
    if (!finite(facts.verifiedInForceAmount)) result.errors.push("Invalid verified in-force benefit");
    else maximum = Math.max(0, maximum - facts.verifiedInForceAmount);
  }
  // Only selectable increments are returned; the mathematical cap is never rounded up.
  maximum = maximum < minimum ? 0 : minimum + Math.floor((maximum - minimum) / row.increment + 1e-10) * row.increment;
  Object.assign(result, { minimum, maximum, increment: row.increment, amountChoices: row.amountChoices, waitingPeriods, benefitPeriods, ...(maximum === minimum ? { lockedAmount: minimum } : {}) });
  if (maximum < minimum) result.errors.push("No benefit is available for these facts");
  if (facts.amount !== undefined && (!finite(facts.amount) || facts.amount < minimum || facts.amount > maximum || row.amountChoices && !row.amountChoices.includes(facts.amount) || Math.abs((facts.amount - minimum) / row.increment - Math.round((facts.amount - minimum) / row.increment)) > 1e-9)) result.errors.push("Amount is outside the recalculated benefit choices");
  if (facts.waitingPeriod !== undefined && !waitingPeriods.some(period => period.key === facts.waitingPeriod)) result.errors.push("Waiting period is unavailable for these facts");
  if (facts.benefitPeriod !== undefined && !benefitPeriods.includes(facts.benefitPeriod)) result.errors.push("Benefit period is unavailable for these facts");
  result.missingFacts = [...new Set(result.missingFacts)].sort();
  result.status = result.missingFacts.length ? "needs-information" : "resolved";
  result.allowed = result.status === "resolved" && result.errors.length === 0;
  return result;
}

/** Changing income, age or employment clears invalid elections. Single choices
 * lock automatically. Stale values are never retained while required facts are missing. */
export function reconcileBenefitSelection(site: EffectiveSite, productKey: string, applicantKey: string, facts: BenefitFacts) {
  const decision = resolveNormalizedBenefit(site, productKey, applicantKey, facts);
  if (decision.status !== "resolved" || decision.maximum === undefined || decision.minimum === undefined || decision.maximum < decision.minimum || decision.errors.some(error => !["Amount is outside the recalculated benefit choices", "Waiting period is unavailable for these facts", "Benefit period is unavailable for these facts"].includes(error))) return { amount: null, waitingPeriod: null, benefitPeriod: null, decision };
  const amountValid = facts.amount !== undefined && !decision.errors.includes("Amount is outside the recalculated benefit choices");
  return { amount: decision.lockedAmount ?? (amountValid ? facts.amount! : null), waitingPeriod: decision.waitingPeriods!.length === 1 ? decision.waitingPeriods![0].key : decision.waitingPeriods!.some(period => period.key === facts.waitingPeriod) ? facts.waitingPeriod! : null, benefitPeriod: decision.benefitPeriods!.length === 1 ? decision.benefitPeriods![0] : decision.benefitPeriods!.includes(facts.benefitPeriod ?? "") ? facts.benefitPeriod! : null, decision };
}
