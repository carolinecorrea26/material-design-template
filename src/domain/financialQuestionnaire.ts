import type { EffectiveSite } from "./effectiveSite";

/** Use the site's persisted product assignment, never a prototype-wide amount threshold. */
export function requiresFinancialQuestionnaire(products: EffectiveSite["configuration"]["products"], selectedMemberProducts: ReadonlySet<string>) {
  return products.some(product => selectedMemberProducts.has(product.productKey) && product.questionSets.some(set =>
    ["financial", "financial-questions"].includes(set.definition?.value.questionType ?? "") &&
    (set.value.applicantTypeKey === null || set.value.applicantTypeKey === "member")
  ));
}
