import type { ClientConfig } from "../clients/types";
import { coverages } from "../coverages";
import { getCategoryQuestionFieldIds } from "../coverageQuestionRequirements";
import type { FieldId } from "./types";
import type { ScopedFieldOverride } from "./fieldOverrides";
import type { PrototypeLibrary } from "../../domain/prototypeLibrary";

/** Shared semantic fields collected by Home's eligibility card and quote calculator.
 * Coverage categories and rate frequency are UI selectors, not application fields.
 */
export const homeQuoteFieldIds: FieldId[] = ["zip-postal-code", "state-province", "birth-date", "gender", "smoker", "tobacco-last-used", "tobacco-products", "average-monthly-income", "hours-worked-per-week", "actively-at-work", "monthly-business-expenses", "business-expense-responsibility"];
export function homeQuotePlacements(client: Pick<ClientConfig, "features" | "coverages" | "fields">): ScopedFieldOverride[] {
  const variant = client.features?.homePageVariant ?? "default";
  const enabled = client.features?.defaultTemplate !== "single" && ["default", "quoteFirst"].includes(variant);
  const categories = coverages.filter((product) => client.coverages.enabled?.includes(product.id)).map((product) => product.categoryId);
  const questions = new Set<FieldId>(getQuoteQuestionFieldIds(client, categories));
  return homeQuoteFieldIds.map((fieldId, index) => ({ pageId: "home", fieldId, scope: "global", hidden: !enabled || (index >= 3 && !questions.has(fieldId)) }));
}

/** Home participation can suppress a quote field without suppressing Coverage. */
export function getQuoteQuestionFieldIds(client: Pick<ClientConfig, "coverages" | "fields">, categories: import("../coverages/types").CoverageCategoryId[], library?: PrototypeLibrary | null): FieldId[] {
  const fields = new Set(getCategoryQuestionFieldIds(categories, "self", client.coverages, library));
  for (const id of client.fields.home?.extra ?? []) if (homeQuoteFieldIds.includes(id as FieldId)) fields.add(id as FieldId);
  for (const id of client.fields.home?.hidden ?? []) fields.delete(id as FieldId);
  return [...fields];
}
export function getQuoteRequirements(client: Pick<ClientConfig, "coverages" | "fields">, categories: import("../coverages/types").CoverageCategoryId[]) {
  const fields = new Set(getQuoteQuestionFieldIds(client, categories));
  return { needsGender: fields.has("gender"), needsSmoker: fields.has("smoker"), needsTobaccoLastUsed: fields.has("tobacco-last-used"), needsTobaccoProducts: fields.has("tobacco-products"), needsDi: fields.has("average-monthly-income"), needsOo: fields.has("monthly-business-expenses") || fields.has("business-expense-responsibility"), needsExpenses: fields.has("monthly-business-expenses"), needsResponsibility: fields.has("business-expense-responsibility"), needsHours: fields.has("hours-worked-per-week"), needsActiveWork: fields.has("actively-at-work"), needsAdditionalFields: [...fields].some(id => homeQuoteFieldIds.slice(3).includes(id)) };
}
