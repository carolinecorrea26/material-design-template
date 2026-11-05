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
      const sum = rule.productKeys.filter(key => selectedMemberProducts.has(key)).reduce((sum, key) => sum + (numericFact(memberAmounts[key]) ?? 0), 0);
      return rule.inclusive ? sum >= rule.minimumAmount : sum > rule.minimumAmount;
    });
  }
  return products.some(product => selectedMemberProducts.has(product.productKey) && product.questionSets.some(set =>
    ["financial", "financial-questions"].includes(set.definition?.value.questionType ?? "") &&
    (set.value.applicantTypeKey === null || set.value.applicantTypeKey === "member")
  ));
}
