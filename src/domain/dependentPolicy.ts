import type { EffectiveSite } from "./effectiveSite";
import { validateNormalizedCoverageAmount } from "./normalizedCoverageAmounts";

export type DependentRule = {
  applicantKey: "spouse" | "child";
  requires?: { applicantKeys: string[]; mode: "selected" | "covered" };
  memberCapMultiplier?: number;
  capBehavior?: "block" | "notice";
  applicationRole?: "included-benefit";
  maximumPlans?: { productKeys: string[]; count: number };
  derived?: { baseApplicantKey: string; multiplier: number; siblingApplicantKey?: string; withSiblingMultiplier?: number };
};
export type DependentPolicy = { version: 1; rules: DependentRule[]; provisional: boolean; revisit: string[] };
export type DependentFacts = {
  amount?: number;
  /** Same-product amounts for covered applicants. For caps, the caller supplies
   * the total requested/in-force amount, rather than only a new increase. */
  baseAmounts?: Record<string, number>;
  selectedApplicants?: string[];
  coveredApplicants?: string[];
  /** Product choices for this one dependent person, not all children combined. */
  selectedProductKeys?: string[];
};
const object = (value: unknown): value is Record<string, unknown> => value !== null && typeof value === "object" && !Array.isArray(value);
const number = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value) && value >= 0;
const strings = (value: unknown): value is string[] => Array.isArray(value) && value.every(v => typeof v === "string" && v.length > 0) && new Set(value).size === value.length;
export function isDependentPolicy(value: unknown): value is DependentPolicy {
  if (!object(value) || value.version !== 1 || !Array.isArray(value.rules) || !value.rules.length || typeof value.provisional !== "boolean" || !strings(value.revisit)) return false;
  const seen = new Set<string>();
  for (const rule of value.rules) {
    if (!object(rule) || !["spouse", "child"].includes(String(rule.applicantKey)) || seen.has(String(rule.applicantKey))) return false;
    seen.add(String(rule.applicantKey));
    if (rule.requires !== undefined && (!object(rule.requires) || !strings(rule.requires.applicantKeys) || !rule.requires.applicantKeys.length || !["selected", "covered"].includes(String(rule.requires.mode)))) return false;
    if (rule.memberCapMultiplier !== undefined && (!number(rule.memberCapMultiplier) || rule.memberCapMultiplier <= 0)) return false;
    if (rule.capBehavior !== undefined && !["block", "notice"].includes(String(rule.capBehavior)) || rule.applicationRole !== undefined && rule.applicationRole !== "included-benefit") return false;
    if (rule.maximumPlans !== undefined && (!object(rule.maximumPlans) || !strings(rule.maximumPlans.productKeys) || !rule.maximumPlans.productKeys.length || !number(rule.maximumPlans.count) || !Number.isInteger(rule.maximumPlans.count))) return false;
    if (rule.derived !== undefined) {
      const derived = rule.derived;
      if (!object(derived) || typeof derived.baseApplicantKey !== "string" || !derived.baseApplicantKey || !number(derived.multiplier) || derived.multiplier <= 0 || derived.siblingApplicantKey !== undefined && (typeof derived.siblingApplicantKey !== "string" || !derived.siblingApplicantKey || !number(derived.withSiblingMultiplier) || derived.withSiblingMultiplier <= 0) || derived.siblingApplicantKey === undefined && derived.withSiblingMultiplier !== undefined) return false;
    }
  }
  return true;
}

export function resolveDependentCoverage(site: EffectiveSite, productKey: string, applicantKey: string, facts: DependentFacts = {}) {
  const policies = site.configuration.products.find(product => product.productKey === productKey)?.dependentPolicies ?? [];
  const provenance = policies.flatMap(policy => policy.provenance);
  const result = { status: "unresolved" as "resolved" | "needs-information" | "unresolved", allowed: false, derivedAmount: null as number | null, maximum: null as number | null, locked: false, missingFacts: [] as string[], errors: [] as string[], notices: [] as string[], applicationRole: "applicant" as "applicant" | "included-benefit", provenance, provisional: false, revisit: [] as string[] };
  if (policies.length !== 1 || !isDependentPolicy(policies[0].value)) return { ...result, errors: ["No unique valid dependent policy"] };
  const policy = policies[0].value;
  result.provisional = policy.provisional;
  result.revisit = [...policy.revisit];
  const rule = policy.rules.find(rule => rule.applicantKey === applicantKey);
  if (!["spouse", "child"].includes(applicantKey) || !site.products.find(product => product.productKey === productKey)?.applicants.some(applicant => applicant.applicantKey === applicantKey)) return { ...result, status: "resolved" as const, errors: ["Dependent is unavailable"] };
  if (!rule) {
    if (facts.amount === undefined) return { ...result, status: "needs-information" as const, missingFacts: ["amount"] };
    const numeric = validateNormalizedCoverageAmount(site, productKey, applicantKey, facts.amount);
    return { ...result, status: numeric.status, allowed: numeric.allowed, errors: numeric.allowed ? [] : [numeric.reason] };
  }
  result.applicationRole = rule.applicationRole ?? "applicant";
  if (rule.requires) {
    const values = rule.requires.mode === "selected" ? facts.selectedApplicants : facts.coveredApplicants;
    if (!strings(values)) result.missingFacts.push(rule.requires.mode === "selected" ? "selectedApplicants" : "coveredApplicants");
    else if (!rule.requires.applicantKeys.some(applicant => values.includes(applicant))) result.errors.push("Required primary coverage is absent");
  }
  if (rule.maximumPlans) {
    if (!strings(facts.selectedProductKeys)) result.missingFacts.push("selectedProductKeys");
    else if (facts.selectedProductKeys.some(key => !site.configuration.products.some(product => product.productKey === key))) result.errors.push("Unknown selected product");
    else if (new Set([...facts.selectedProductKeys, productKey].filter(key => rule.maximumPlans!.productKeys.includes(key))).size > rule.maximumPlans.count) result.errors.push("Dependent exceeds the maximum number of life plans");
  }
  if (rule.memberCapMultiplier !== undefined) {
    const member = facts.baseAmounts?.member;
    if (!number(member)) result.missingFacts.push("baseAmounts.member");
    else result.maximum = member * rule.memberCapMultiplier;
  }
  if (rule.derived) {
    const base = facts.baseAmounts?.[rule.derived.baseApplicantKey];
    if (!number(base) || base === 0) result.missingFacts.push(`baseAmounts.${rule.derived.baseApplicantKey}`);
    else {
      if (!validateNormalizedCoverageAmount(site, productKey, rule.derived.baseApplicantKey, base).allowed) result.errors.push("Primary amount is outside its normalized choices");
      let multiplier = rule.derived.multiplier;
      if (rule.derived.siblingApplicantKey !== undefined) {
        if (!strings(facts.selectedApplicants)) result.missingFacts.push("selectedApplicants");
        else if (facts.selectedApplicants.includes(rule.derived.siblingApplicantKey)) multiplier = rule.derived.withSiblingMultiplier!;
      }
      const amount = base * multiplier;
      if (!Number.isFinite(amount)) result.errors.push("Invalid derived benefit");
      else { result.derivedAmount = amount; result.locked = true; }
    }
  } else if (facts.amount === undefined) result.missingFacts.push("amount");
  else {
    const numeric = validateNormalizedCoverageAmount(site, productKey, applicantKey, facts.amount);
    if (!numeric.allowed) result.errors.push(numeric.reason);
  }
  const amount = result.derivedAmount ?? facts.amount;
  if (amount !== undefined && result.maximum !== null && amount > result.maximum) (rule.capBehavior === "notice" ? result.notices : result.errors).push("Dependent amount exceeds primary coverage cap");
  if (rule.derived && facts.amount !== undefined && facts.amount !== result.derivedAmount) result.errors.push("Derived amount must recalculate from primary coverage");
  result.missingFacts = [...new Set(result.missingFacts)].sort();
  result.status = result.missingFacts.length ? "needs-information" : "resolved";
  result.allowed = result.status === "resolved" && result.errors.length === 0;
  return result;
}

export function reconcileDependentAmount(site: EffectiveSite, productKey: string, applicantKey: string, facts: DependentFacts) {
  const decision = resolveDependentCoverage(site, productKey, applicantKey, facts);
  const onlyStaleDerived = decision.errors.every(error => error === "Derived amount must recalculate from primary coverage");
  return { amount: decision.status === "resolved" && (decision.allowed || decision.locked && onlyStaleDerived) ? decision.derivedAmount ?? facts.amount ?? null : null, locked: decision.status === "resolved" && decision.locked && onlyStaleDerived, decision };
}
