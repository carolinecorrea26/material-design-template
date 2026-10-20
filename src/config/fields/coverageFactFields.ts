import { getPrototypeLibrary } from "../../domain/prototypeLibrary";
import type { CoverageDefinition } from "../../domain/coverage";
import type { FieldId } from "../../domain/fields";

/** Additional collection points inferred from normalized requirements, never Site identity. */
export function coverageFactFieldIds(products: CoverageDefinition[], values?: Record<string, unknown>): FieldId[] {
  const ids = new Set<FieldId>();
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
    if (rule.unmarried) ids.add("child-unmarried");
    if (rule.fullTimeStudentMaximumAgeYears !== undefined) ids.add("child-full-time-student");
  }
  return [...ids];
}
