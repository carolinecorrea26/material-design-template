import type { DatabaseSchema } from "../persistence/types";
import type { CoverageAmountAssignment, CoverageDefinition } from "../domain/coverage";
import { libraryMetadata } from "../domain/provenance";
import { resolveDatabaseSite } from "./resolve";
import { prototypeProductDefinition } from "./values";
import { migrateFieldCollectionData } from "./fieldCollectionDefaults";
import { childMapping } from "../config/fields/eligibilityListFields";

const identity = (table: string, key: string, source: string) => ({ id: key, key, ...libraryMetadata(table, key, source) });

/** Extracts explicit relations from independently resolved migration fixtures.
 * Source definitions remain available for the existing equivalence gates.
 */
export function normalizePrototypeCoverage(db: DatabaseSchema) {
  migrateFieldCollectionData(db);
  for (const section of db.pageSections) for (const [position, fieldKey] of section.definition.fieldIds.entries()) db.pageSectionFields.push({ ...identity("pageSectionFields", `${section.key}.${fieldKey}`, `prototype:pageSections/${section.key}`), sectionKey: section.key, fieldKey, position });
  // Collection inputs are rendered by DynamicList rather than the section's flat fieldIds.
  const childSection = db.pageSections.find(section => section.definition.collectionName === "children");
  if (childSection) [...childMapping.fields.map(field => field.id), "child-full-time-student"].forEach((fieldKey, position) => {
    if (db.fields.some(field => field.key === fieldKey)) db.pageSectionFields.push({ ...identity("pageSectionFields", `${childSection.key}.${fieldKey}`, "prototype:eligibility/children"), sectionKey: childSection.key, fieldKey, position });
  });
  function amounts(productKey: string, assignments: CoverageAmountAssignment[], siteKey: string | null, riderKey: string | null = null) {
    assignments.forEach((assignment, position) => {
      const key = `${siteKey ?? "global"}.${riderKey ?? productKey}.amount.${position}`;
      const selections = assignment.selections ?? [];
      const derived = assignment.derivedFrom;
      const types = new Set(selections.map(s => s.type));
      const amountType = derived ? derived.calculation.type === "percentage" ? "multiplier" : "fixed" : types.size > 1 ? "range-plus-fixed" : selections.length > 1 ? "tiered-range" : types.has("range") ? "range" : types.has("amountList") ? "set" : types.has("optionList") ? "named-option" : "none";
      db.coverageAmountPatterns.push({ ...identity("coverageAmountPatterns", key, `prototype:${key}`), patternKey: "coverage-amount-options", amountType,
        minimum: derived?.calculation.type === "fixed" ? derived.calculation.value : null, maximum: derived?.calculation.type === "fixed" ? derived.calculation.value : null, increment: null, formula: null,
        baseProductKey: derived ? productKey : null, baseApplicantKey: derived?.applicantType ?? null, baseApplicantClass: derived?.applicantClassId ?? null, multiplier: derived?.calculation.type === "percentage" ? derived.calculation.value / 100 : null });
      for (const [index, selection] of selections.entries()) {
        if (selection.type === "range") db.amountBands.push({ ...identity("amountBands", `${key}.${index}`, `prototype:${key}`), amountPatternKey: key, minimum: selection.min, maximum: selection.max, increment: selection.increment, conditionKey: null, position: index });
        else for (const [i, option] of (selection.type === "amountList" ? selection.values.map(value => ({ value: String(value), label: String(value) })) : selection.options).entries()) db.amountOptions.push({ ...identity("amountOptions", `${key}.${index}.${i}`, `prototype:${key}`), amountPatternKey: key, ...option, position: index * 10000 + i });
      }
      if (riderKey) db.riderAmountRules.push({ ...identity("riderAmountRules", key, `prototype:${key}`), riderKey, applicantTypeKey: assignment.scope?.applicantType ?? null, amountPatternKey: key, baseProductKey: productKey, conditionKey: null });
      else db.productAmountRules.push({ ...identity("productAmountRules", key, `prototype:${key}`), productKey, applicantTypeKey: assignment.scope?.applicantType ?? null, applicantClass: assignment.scope?.applicantClassId ?? null, amountPatternKey: key, conditionKey: null, clientKey: null, siteKey, position });
    });
  }
  function product(product: CoverageDefinition, siteKey: string | null) {
    const key = `${siteKey ?? "global"}.${product.id}`;
    amounts(product.id, product.coverageAmounts ?? [], siteKey);
    for (const applicantTypeKey of product.applicants) db.productApplicantEligibility.push({ ...identity("productApplicantEligibility", `${key}.${applicantTypeKey}`, `prototype:${key}`), productKey: product.id, applicantTypeKey, siteKey, eligible: true, conditionKey: null });
    for (const [i, band] of (product.underwritingBands ?? []).entries()) db.underwritingBands.push({ ...identity("underwritingBands", `${key}.${i}`, `prototype:${key}`), productKey: product.id, applicantTypeKey: band.scope.applicantType ?? null, applicantClass: band.scope.applicantClassId ?? null, siteKey, pathway: band.underwritingType ?? null, minimumAge: band.minimumAgeYears, maximumAge: band.maximumAgeYears, minimumAmount: band.minimumAmount, maximumAmount: band.maximumAmount, minimumAmountExclusive: band.minimumAmountExclusive ?? false, mortalityMorbidity: null, conditionKey: null, status: band.status });
    for (const [kind, options, byApplicant] of [["waiting", product.waitingPeriodOptions, product.waitingPeriodOptionsByApplicant], ["benefit", product.maxBenefitPeriodOptions, product.maxBenefitPeriodOptionsByApplicant]] as const) {
      for (const [applicant, values] of [[null, options], ...Object.entries(byApplicant ?? {})] as Array<[string | null, Array<{value: string; label: string; days?: number}> | undefined]>) {
        for (const [position, option] of (values ?? []).entries()) db.benefitPeriodOptions.push({ ...identity("benefitPeriodOptions", `${key}.${kind}.${applicant ?? "all"}.${position}`, `prototype:${key}`), productKey: product.id, siteKey, applicantTypeKey: applicant, kind, ...option, days: option.days ?? null, position });
      }
    }
    const limit = product.requirements?.benefitLimit;
    if (limit) {
      const limitKey = `${key}.income-cap`;
      db.aggregateLimits.push({ ...identity("aggregateLimits", limitKey, `prototype:${key}`), productKey: product.id, categoryKey: product.categoryId, applicantTypeKey: limit.applicantType, maximum: limit.defaultMaximum, formula: `min(monthlyIncome * ${limit.incomeFraction}, policyCap)`, conditionKey: null, siteKey });
      for (const [position, cap] of limit.caps.entries()) db.benefitCaps.push({ ...identity("benefitCaps", `${limitKey}.${position}`, `prototype:${key}`), aggregateLimitKey: limitKey, minimumAgeYears: cap.when.minimumAgeYears ?? null, maximumAgeYears: cap.when.maximumAgeYears ?? null, selfEmployedLessThanYears: cap.when.selfEmployedLessThanYears ?? null, maximum: cap.maximum, requiredWaitingPeriod: cap.requiredWaitingPeriod ?? null, requiredBenefitPeriod: cap.requiredBenefitPeriod ?? null, position });
    }
    for (const [i, constraint] of (product.requirements?.eligibility ?? []).entries()) db.eligibilityConstraints.push({ ...identity("eligibilityConstraints", `${key}.${i}`, `prototype:${key}`), productKey: product.id, siteKey, applicantTypeKey: constraint.applicantType, minimumAgeDays: constraint.minimumAgeDays ?? null, minimumAgeYears: constraint.minimumAgeYears ?? null, maximumAgeYears: constraint.maximumAgeYears ?? null, studentMaximumAgeYears: constraint.fullTimeStudentMaximumAgeYears ?? null, minimumWorkHours: constraint.minimumWorkHoursPerWeek ?? null });
    for (const [i, dependency] of (product.requirements?.dependencies ?? []).entries()) db.coverageDependencies.push({ ...identity("coverageDependencies", `${key}.${i}`, `prototype:${key}`), productKey: product.id, siteKey, applicantTypeKey: dependency.applicantType, requiresApplicantKey: dependency.requiresApplicant, categoryKey: dependency.categoryId, sameProduct: dependency.sameProduct });
    for (const [i, rule] of (product.requirements?.maximumPlans ?? []).entries()) db.maximumPlanRules.push({ ...identity("maximumPlanRules", `${key}.${i}`, `prototype:${key}`), productKey: product.id, siteKey, applicantTypeKey: rule.applicantType, categoryKey: rule.categoryId, count: rule.count });
  }
  for (const row of db.products) product({ ...prototypeProductDefinition(row), planCode: { primary: "" } }, null);
  for (const site of db.sites) for (const coverage of resolveDatabaseSite(db, site.key).coverage) product(coverage.effective, site.key);
  for (const row of db.riders) {
    const relation = db.productRiders.find(r => r.riderKey === row.key);
    if (relation) amounts(relation.productKey, row.definition.coverageAmounts ?? [], relation.siteKey, row.key);
  }
}
