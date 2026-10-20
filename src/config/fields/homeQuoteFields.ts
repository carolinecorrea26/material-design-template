import type { ClientConfig } from "../clients/types";
import { coverages } from "../coverages";
import { getCategoryQuestionFieldIds } from "../coverageQuestionRequirements";
import type { FieldId } from "./types";
import type { ScopedFieldOverride } from "./fieldOverrides";

/** Shared semantic fields collected by Home's eligibility card and quote calculator.
 * Coverage categories and rate frequency are UI selectors, not application fields.
 * Tobacco follow-up questions are collected later on Coverage, not in the quote.
 */
export const homeQuoteFieldIds: FieldId[] = ["birth-date", "zip-postal-code", "state-province", "gender", "smoker", "average-monthly-income", "hours-worked-per-week", "monthly-business-expenses", "business-expense-responsibility"];
export function homeQuotePlacements(client: Pick<ClientConfig, "features" | "coverages" | "fields">): ScopedFieldOverride[] {
  const variant = client.features?.homePageVariant ?? "default";
  const enabled = client.features?.defaultTemplate !== "single" && ["default", "quoteFirst"].includes(variant);
  const categories = coverages.filter((product) => client.coverages.enabled?.includes(product.id)).map((product) => product.categoryId);
  const questions = new Set<FieldId>(getQuoteQuestionFieldIds(client, categories));
  return homeQuoteFieldIds.map((fieldId, index) => ({ pageId: "home", fieldId, scope: "global", hidden: !enabled || (index >= 3 && !questions.has(fieldId)) }));
}

/** Home participation can suppress a quote field without suppressing Coverage. */
export function getQuoteQuestionFieldIds(client: Pick<ClientConfig, "coverages" | "fields">, categories: import("../coverages/types").CoverageCategoryId[]): FieldId[] {
  const fields = new Set(getCategoryQuestionFieldIds(categories, "self", client.coverages));
  for (const id of client.fields.home?.extra ?? []) if (homeQuoteFieldIds.includes(id as FieldId)) fields.add(id as FieldId);
  for (const id of client.fields.home?.hidden ?? []) fields.delete(id as FieldId);
  return [...fields];
}
export function getQuoteRequirements(client: Pick<ClientConfig, "coverages" | "fields">, categories: import("../coverages/types").CoverageCategoryId[]) {
  const fields = new Set(getQuoteQuestionFieldIds(client, categories));
  return { needsGender: fields.has("gender"), needsSmoker: fields.has("smoker"), needsDi: fields.has("average-monthly-income"), needsOo: fields.has("monthly-business-expenses") || fields.has("business-expense-responsibility"), needsExpenses: fields.has("monthly-business-expenses"), needsResponsibility: fields.has("business-expense-responsibility"), needsHours: fields.has("hours-worked-per-week"), needsAdditionalFields: [...fields].some(id => homeQuoteFieldIds.slice(3).includes(id)) };
}
