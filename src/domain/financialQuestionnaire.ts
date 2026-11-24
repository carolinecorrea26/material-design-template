import type { EffectiveSite } from "./effectiveSite";
import { numericFact } from "../utils/applicantFacts";

export type FinancialQuestionnairePolicy = { version: 1; enabled: boolean; applicant: "member"; rules: Array<{ productKeys: string[]; minimumAmount: number; inclusive: boolean }>; sourceReferences: string[] };
export function isFinancialQuestionnairePolicy(value: unknown): value is FinancialQuestionnairePolicy {
  const policy = value as FinancialQuestionnairePolicy | null;
  return !!policy && policy.version === 1 && typeof policy.enabled === "boolean" && policy.applicant === "member" && Array.isArray(policy.rules) && policy.rules.length > 0 && policy.rules.every(rule => rule && Array.isArray(rule.productKeys) && rule.productKeys.length > 0 && rule.productKeys.every(key => typeof key === "string" && key.trim()) && new Set(rule.productKeys).size === rule.productKeys.length && Number.isFinite(rule.minimumAmount) && rule.minimumAmount >= 0 && typeof rule.inclusive === "boolean") && Array.isArray(policy.sourceReferences) && policy.sourceReferences.every(ref => typeof ref === "string");
}

/** Use the site's persisted product assignment, never a prototype-wide amount threshold. */
export function requiresFinancialQuestionnaire(products: EffectiveSite["configuration"]["products"], selectedMemberProducts: ReadonlySet<string>, memberAmounts: Record<string, unknown> = {}, policies: ReadonlyArray<{ value: unknown }> = []) {
  if (policies.length) {
    if (policies.length !== 1 || !isFinancialQuestionnairePolicy(policies[0].value)) throw new Error("No unique valid financial questionnaire policy");
    const policy = policies[0].value;
    return policy.enabled && policy.rules.some(rule => {
      const selected = rule.productKeys.filter(key => selectedMemberProducts.has(key));
      if (!selected.length) return false;
      const sum = selected.reduce((sum, key) => sum + (numericFact(memberAmounts[key]) ?? 0), 0);
      return rule.inclusive ? sum >= rule.minimumAmount : sum > rule.minimumAmount;
    });
  }
  return products.some(product => selectedMemberProducts.has(product.productKey) && product.questionSets.some(set =>
    ["financial", "financial-questions"].includes(set.definition?.value.questionType ?? "") &&
    (set.value.applicantTypeKey === null || set.value.applicantTypeKey === "member")
  ));
}

/** Profile and its read-only Review copy use the same effective Site policy and active elections. */
export function financialQuestionnaireForApplication(configuration: EffectiveSite['configuration'] | undefined, entries: ReadonlyArray<{ coverageId: string; applicant: string }>, values: Record<string, unknown>) {
  if (!configuration) return false;
  if (configuration.features?.find(feature => feature.key === 'feature-financial-questionnaire')?.enabled === false) return false;
  const amounts = (values.coverageAmounts ?? {}) as Record<string, unknown>;
  const memberAmounts = Object.fromEntries(entries.filter(entry => entry.applicant === 'member').map(entry => [entry.coverageId, amounts[`${entry.coverageId}:member`] ?? amounts[`member:${entry.coverageId}`] ?? amounts[`${entry.coverageId}:self`]]));
  const selected = new Set(Object.keys(memberAmounts).filter(key => (numericFact(memberAmounts[key]) ?? 0) > 0));
  return requiresFinancialQuestionnaire(configuration.products, selected, memberAmounts, configuration.financialQuestionnairePolicies);
}
