import type { EffectiveSite } from "./effectiveSite";
import { numericFact } from "../utils/applicantFacts";

export type QuickDecisionPolicy = {
  applicants: string[]; minimumAgeYears: number; maximumAgeYears: number;
  minimumAmount: number; maximumAmount: number; excludedJurisdictions: string[];
  aggregate?: { maximum: number; productKeys: string[] };
  spouseRequiresMember?: true;
};
export type UnderwritingContext = {
  jurisdiction?: string; existingLifeAmount?: number; memberAmount?: number;
  portfolio?: Array<{ productKey: string; applicantKey: string; amount?: number }>;
};
const finite = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value) && value >= 0;
export function isQuickDecisionPolicy(value: unknown): value is QuickDecisionPolicy {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const p = value as QuickDecisionPolicy;
  const strings = (v: unknown): v is string[] => Array.isArray(v) && v.every(s => typeof s === "string" && s.trim()) && new Set(v).size === v.length;
  return strings(p.applicants) && p.applicants.length > 0 && p.applicants.every(a => ["member", "spouse"].includes(a)) && finite(p.minimumAgeYears) && Number.isInteger(p.minimumAgeYears) && finite(p.maximumAgeYears) && Number.isInteger(p.maximumAgeYears) && p.maximumAgeYears >= p.minimumAgeYears && finite(p.minimumAmount) && p.minimumAmount > 0 && finite(p.maximumAmount) && p.maximumAmount >= p.minimumAmount && strings(p.excludedJurisdictions) && (p.spouseRequiresMember === undefined || p.spouseRequiresMember === true) && (p.aggregate === undefined || !!p.aggregate && finite(p.aggregate.maximum) && p.aggregate.maximum > 0 && strings(p.aggregate.productKeys) && p.aggregate.productKeys.length > 0);
}

/** These are processing limits. A FUW outcome never grants coverage eligibility. */
export function quickDecisionOutcome(policy: QuickDecisionPolicy, productKey: string, applicantKey: string, ageYears: number | undefined, amount: number | undefined, context: UnderwritingContext) {
  const result = (pathway: "QD" | "FUW") => ({ status: "resolved" as const, pathway });
  const missing = (...missingFacts: string[]) => ({ status: "needs-information" as const, pathway: undefined, missingFacts });
  if (!policy.applicants.includes(applicantKey)) return result("FUW");
  if (!finite(ageYears) || !Number.isInteger(ageYears) || !finite(amount) || amount <= 0) return missing(...(!finite(ageYears) || !Number.isInteger(ageYears) ? ["ageYears"] : []), ...(!finite(amount) || amount <= 0 ? ["amount"] : []));
  if (ageYears < policy.minimumAgeYears || ageYears > policy.maximumAgeYears || amount < policy.minimumAmount || amount > policy.maximumAmount) return result("FUW");
  if (!context.jurisdiction) return missing("jurisdiction");
  const jurisdiction = context.jurisdiction.replace(/^US-/, "").toUpperCase();
  if (policy.excludedJurisdictions.includes(jurisdiction)) return result("FUW");
  if (applicantKey === "spouse" && policy.spouseRequiresMember) {
    if (!finite(context.memberAmount)) return missing("memberAmount");
    if (context.memberAmount <= 0 || amount > context.memberAmount) return result("FUW");
  }
  if (policy.aggregate) {
    if (!finite(context.existingLifeAmount) || !context.portfolio) return missing(...(!finite(context.existingLifeAmount) ? ["existingLifeAmount"] : []), ...(!context.portfolio ? ["portfolio"] : []));
    const selected = context.portfolio.filter(row => row.applicantKey === applicantKey && policy.aggregate!.productKeys.includes(row.productKey));
    if (!selected.some(row => row.productKey === productKey) || new Set(selected.map(row => row.productKey)).size !== selected.length || selected.some(row => !finite(row.amount))) return { status: "unresolved" as const, pathway: undefined };
    if (context.existingLifeAmount + selected.reduce((sum, row) => sum + row.amount!, 0) > policy.aggregate.maximum) return result("FUW");
  }
  return result("QD");
}

export function applicationUnderwritingContext(site: EffectiveSite, productKey: string, applicantKey: string, values: Record<string, unknown>): UnderwritingContext {
  const amounts = values.coverageAmounts as Record<string, unknown> | undefined;
  const applicants = values.productApplicants as Record<string, string[]> | undefined;
  const selected = Array.isArray(values.coverageSelections) ? values.coverageSelections.map(String) : [productKey];
  const prefix = applicantKey === "spouse" ? "spouse-" : "";
  const hasOther = values[`${prefix}has-other-life-insurance`];
  return {
    jurisdiction: String(values["state-province"] || values.state || "") || undefined,
    existingLifeAmount: hasOther === "no" ? 0 : hasOther === "yes" ? numericFact(values[`${prefix}existing-life-insurance-amount`]) : undefined,
    memberAmount: applicants?.[productKey]?.includes("member") ? numericFact(amounts?.[`${productKey}:member`]) : 0,
    portfolio: selected.filter(key => site.configuration.products.some(p => p.productKey === key)).flatMap(key => (applicants?.[key] ?? []).map(role => ({ productKey: key, applicantKey: role, amount: numericFact(amounts?.[`${key}:${role}`]) }))),
  };
}
