import { expect, it } from "vitest";
import { requiresFinancialQuestionnaire } from "./financialQuestionnaire";

type Products = Parameters<typeof requiresFinancialQuestionnaire>[0];
function products(type: string, applicant: string | null = null) {
  return [{ productKey: "site-product", questionSets: [{ definition: { value: { questionType: type } }, value: { applicantTypeKey: applicant } }] }] as unknown as Products;
}
it("omits the questionnaire without a source assignment or selected member product", () => {
  expect(requiresFinancialQuestionnaire([], new Set(["site-product"]))).toBe(false);
  expect(requiresFinancialQuestionnaire(products("financial-questions"), new Set())).toBe(false);
  expect(requiresFinancialQuestionnaire(products("health"), new Set(["site-product"]))).toBe(false);
});
it("uses MCR financial assignments for the matching product and applicant", () => {
  expect(requiresFinancialQuestionnaire(products("financial-questions"), new Set(["site-product"]))).toBe(true);
  expect(requiresFinancialQuestionnaire(products("financial-questions", "member"), new Set(["site-product"]))).toBe(true);
  expect(requiresFinancialQuestionnaire(products("financial-questions", "spouse"), new Set(["site-product"]))).toBe(false);
  expect(requiresFinancialQuestionnaire(products("financial-questions"), new Set(["another-site-product"]))).toBe(false);
});
