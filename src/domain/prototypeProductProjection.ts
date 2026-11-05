import { isBenefitPolicy } from "./benefitPolicy";
import { isEligibilityFactRequirements } from "./eligibilityFacts";
import type { ClientConfig } from "./configuration";
import type { CoverageDefinition, CoverageAmountAssignment, CoverageApplicantId } from "./coverage";
import type { EffectiveSite, EffectiveSiteData } from "./effectiveSite";
import { resolveCoverageJourneyPolicy } from "./coverageJourneyPolicy";

type EffectiveProduct = EffectiveSite["configuration"]["products"][number];

/** New revisions use structured amounts. Captured version 1 policies retain
 * their historical complete-list precedence, including applicant/class scopes.
 */
export function buildPrototypeAmounts(product: EffectiveProduct): CoverageAmountAssignment[] {
  const normalized = product.amounts.map(rule => {
    if (rule.status !== "resolved" || rule.amount?.status !== "resolved") throw new Error(`Unresolved amount: ${rule.key}`);
    const { pattern, bands, options } = rule.amount;
    const assignment: CoverageAmountAssignment = {
      scope: {
        ...(rule.value.applicantTypeKey ? { applicantType: rule.value.applicantTypeKey as CoverageApplicantId } : {}),
        ...(rule.value.applicantClass ? { applicantClassId: rule.value.applicantClass } : {}),
      },
    };
    if (pattern.value.amountType === "multiplier") {
      assignment.derivedFrom = {
        applicantType: pattern.value.baseApplicantKey as "member" | "spouse",
        calculation: { type: "percentage", value: resolvedAmountNumber(pattern.value.multiplier, rule.key) * 100 },
      };
    } else {
      assignment.selections = bands.map(band => ({
        type: "range",
        min: resolvedAmountNumber(band.value.minimum, rule.key),
        max: resolvedAmountNumber(band.value.maximum, rule.key),
        increment: resolvedAmountNumber(band.value.increment, rule.key),
      }));
      if (pattern.value.amountType === "fixed") {
        assignment.selections.push({ type: "amountList", values: [resolvedAmountNumber(pattern.value.minimum, rule.key)] });
      } else if (options.length) {
        assignment.selections.push({ type: "amountList", values: options.map(option => Number(option.value.value)) });
      }
    }
    return assignment;
  });
  const benefit = product.benefitPolicies[0]?.value;
  if (!isBenefitPolicy(benefit) || benefit.amountSource === "product-amount-rules") return normalized;
  return benefit.applicants.map(rule => ({
    scope: {
      applicantType: rule.applicantKey as CoverageApplicantId,
      ...(rule.applicantClass ? { applicantClassId: rule.applicantClass } : {}),
    },
    selections: [{ type: "range", min: rule.minimum, max: rule.maximum, increment: rule.increment }],
  }));
}

function resolvedAmountNumber(value: number | null, ruleKey: string): number {
  if (value === null) throw new Error(`Unresolved amount: ${ruleKey}`);
  return value;
}

/** A present presentation override wins, including an empty list. Otherwise
 * enabled normalized riders are projected with the existing zero-factor fallback.
 * JSON rider properties still cross a compatibility assertion here.
 */
export function buildPrototypeRiders(product: EffectiveProduct): CoverageDefinition["riders"] {
  const override = product.presentation.find(value => value.key === "riders")?.value;
  if (product.riderOwnership !== "relational" && override !== null && override !== undefined) return override as CoverageDefinition["riders"];
  return product.riders.flatMap(rider => {
    if (!rider.enabled || !rider.definition) return [];
    return [{ ...rider.definition.value, premiumFactor: rider.definition.value.premiumFactor ?? 0 }];
  });
}

/** Product identity and normalized business properties replace catalog/presentation
 * values in the same order as the original applicant adapter. Catalog and JSON
 * shapes still require a compatibility assertion; this is not an input parser.
 */
export function buildPrototypeProduct(data: EffectiveSiteData, site: EffectiveSite, client: ClientConfig, product: EffectiveProduct): CoverageDefinition {
  const row = data.products.find(candidate => candidate.key === product.productKey);
  if (!row) throw new Error("Missing Library product");
  const journey = resolveCoverageJourneyPolicy(site, product.productKey);
  if (!journey) throw new Error(`Invalid journey: ${product.productKey}`);
  const assignment = site.products.find(candidate => candidate.productKey === product.productKey);
  if (!assignment) throw new Error(`Missing Site product assignment: ${product.productKey}`);
  const coverage = {
    ...structuredClone(row.definition),
    ...Object.fromEntries(product.presentation.map(value => [value.key, value.value])),
    id: product.productKey,
    categoryId: row.categoryKey,
    applicants: assignment.applicants.filter(applicant => product.applicantRules.some(rule =>
      rule.value.applicantTypeKey === applicant.applicantKey && rule.value.eligible && rule.value.conditionKey === null,
    )).map(applicant => applicant.applicantKey),
    underwritingType: journey.defaultUnderwritingPathway,
  } as CoverageDefinition;
  coverage.coverageAmounts = buildPrototypeAmounts(product);
  coverage.requirements = buildPrototypeRequirements(data, site.siteKey, product, client, coverage.requirements);
  coverage.underwritingBands = buildPrototypeUnderwriting(product);
  coverage.riders = buildPrototypeRiders(product);
  applyPrototypePeriods(coverage, product);
  for (const kind of ["gNumber", "planCode"] as const) {
    const last = product.identifiers.filter(row => row.value.kind === kind).at(-1);
    if (last) Object.assign(coverage, { [kind]: last.value.definition });
  }
  if (!coverage.planCode) coverage.planCode = { primary: journey.mappings[0].identifiers.planCode.display };
  return coverage;
}

/** Preserve the existing underwriting projection; generalized row parsing remains
 * separate from the supported-scope validators in coveragePolicyValidation.
 */
function buildPrototypeUnderwriting(product: EffectiveProduct): CoverageDefinition["underwritingBands"] {
  return product.underwritingRules.map(rule => ({
    scope: { applicantType: rule.value.applicantTypeKey as CoverageApplicantId },
    minimumAgeYears: rule.value.minimumAge!,
    maximumAgeYears: rule.value.maximumAge!,
    minimumAmount: rule.value.minimumAmount!,
    maximumAmount: rule.value.maximumAmount!,
    minimumAmountExclusive: rule.value.minimumAmountExclusive,
    underwritingType: rule.value.pathway as CoverageDefinition["underwritingType"],
    label: rule.value.pathway ?? "",
    status: rule.value.status as "documented",
  }));
}

function buildPrototypeRequirements(data: EffectiveSiteData, siteKey: string, product: EffectiveProduct, client: ClientConfig, catalogRequirements: CoverageDefinition["requirements"]): CoverageDefinition["requirements"] {
  const benefit = product.benefitPolicies[0]?.value;
  return {
    ...catalogRequirements,
    ...client.coverages.overrides?.[product.productKey]?.requirements,
    eligibility: data.eligibilityConstraints
      .filter(row => row.siteKey === siteKey && row.productKey === product.productKey)
      .map(row => ({
        applicantType: row.applicantTypeKey as CoverageApplicantId,
        ...(row.minimumAgeDays !== null ? { minimumAgeDays: row.minimumAgeDays } : {}),
        ...(row.minimumAgeYears !== null ? { minimumAgeYears: row.minimumAgeYears } : {}),
        ...(row.maximumAgeYears !== null ? { maximumAgeYears: row.maximumAgeYears } : {}),
        ...(row.studentMaximumAgeYears !== null ? { fullTimeStudentMaximumAgeYears: row.studentMaximumAgeYears } : {}),
        ...(row.unmarried !== null ? { unmarried: row.unmarried } : {}),
        ...(row.minimumWorkHours !== null ? { minimumWorkHoursPerWeek: row.minimumWorkHours } : {}),
        factRequirements: product.eligibilityFacts.filter(rule => rule.applicantKey === row.applicantTypeKey).flatMap(rule => {
          if (!isEligibilityFactRequirements(rule.value)) throw new Error(`Unsupported eligibility facts: ${rule.key}`);
          return rule.value;
        }),
      })),
    dependencies: product.dependencies.map(rule => ({
      applicantType: rule.value.applicantTypeKey as CoverageApplicantId,
      requiresApplicant: rule.value.requiresApplicantKey as CoverageApplicantId,
      categoryId: rule.value.categoryKey as CoverageDefinition["categoryId"],
      sameProduct: rule.value.sameProduct,
    })),
    ...(isBenefitPolicy(benefit) ? { exclusiveProducts: benefit.exclusiveProducts } : {}),
    maximumPlans: product.maximumPlans.map(rule => ({
      applicantType: rule.value.applicantTypeKey as CoverageApplicantId,
      categoryId: rule.value.categoryKey as CoverageDefinition["categoryId"],
      count: rule.value.count,
    })),
  };
}

function applyPrototypePeriods(coverage: CoverageDefinition, product: EffectiveProduct): void {
  for (const kind of ["waiting", "benefit"] as const) {
    const rows = product.benefitPeriods.filter(row => row.value.kind === kind);
    const options = (applicant: string | null) => rows
      .filter(row => row.value.applicantTypeKey === applicant)
      .map(row => ({ label: row.value.label, value: row.value.value, days: row.value.days ?? 0 }));
    const global = options(null);
    const defaults = global.length ? global : undefined;
    const byApplicant = Object.fromEntries(coverage.applicants.map(applicant => {
      const own = options(applicant);
      // Preserve independent arrays for each applicant, as in the original adapter.
      return [applicant, own.length ? own : global.length ? options(null) : undefined];
    }));
    if (kind === "waiting") {
      coverage.waitingPeriodOptions = defaults;
      coverage.waitingPeriodOptionsByApplicant = byApplicant;
    } else {
      coverage.maxBenefitPeriodOptions = defaults;
      coverage.maxBenefitPeriodOptionsByApplicant = byApplicant;
    }
  }
}
