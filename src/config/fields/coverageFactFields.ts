import { eligibilityFactCollectionFields } from "../../domain/eligibilityFacts";
import { getPrototypeLibrary } from "../../domain/prototypeLibrary";
import type { CoverageDefinition } from "../../domain/coverage";
import type { FieldId } from "../../domain/fields";
import { getCategoryQuestionFieldIds } from "../coverageQuestionRequirements";

/** Additional collection points inferred from normalized requirements, never Site identity. */
export function coverageFactFieldIds(products: CoverageDefinition[], values?: Record<string, unknown>, collection: "selected" | "presented" = "selected"): FieldId[] {
  const ids = new Set<FieldId>();
  for (const product of products) if (collection === "presented" || Array.isArray(values?.coverageSelections) && values.coverageSelections.includes(product.id)) for (const requirement of product.requirements?.eligibility?.flatMap(rule => rule.factRequirements ?? []) ?? []) {
    const key = eligibilityFactCollectionFields[requirement.fact]; if (key) ids.add(key as FieldId);
  }
  const categories = [...new Set(products.map(product => product.categoryId))];
  for (const [applicant, role, field] of [["member", "self", "hours-worked-per-week"], ["spouse", "spouse", "spouse-hours-worked-per-week"]] as const) {
    if (products.some(product => product.requirements?.eligibility?.some(rule => rule.applicantType === applicant && rule.minimumWorkHoursPerWeek !== undefined))
      && !getCategoryQuestionFieldIds(categories, role).includes(field)) ids.add(field);
  }
  const library = getPrototypeLibrary();
  if (library) for (const field of library.site.configuration.pages.find(p => p.key === "coverage")?.fields ?? []) if (field.included && field.key.startsWith("prototype-fact:") && products.some(p => field.key.startsWith(`prototype-fact:${p.id}:`))) ids.add(field.key as FieldId);
  for (const product of products) {
    if (product.requirements?.benefitLimit?.caps.some(cap => cap.when.selfEmployedLessThanYears !== undefined)) {
      ids.add("is-self-employed");
      if (!values || values["is-self-employed"] === "yes" || values["is-self-employed"] === true) ids.add("years-self-employed");
    }
  }
  return [...ids];
}

/** Child birth dates already live in Eligibility's children list. */
export function eligibilityFactFieldIds(products: CoverageDefinition[]): FieldId[] {
  const ids = new Set<FieldId>();
  for (const product of products) for (const rule of product.requirements?.eligibility ?? []) {
    if (rule.applicantType !== "child") continue;
    if (rule.factRequirements?.some(fact => "extendsMaximumAgeTo" in fact)) ids.add("child-honorably-discharged-service-member" as FieldId);
  }
  return [...ids];
}
