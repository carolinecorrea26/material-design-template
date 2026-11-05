import { applicantPortfolioProcessing, applicantPortfolioProducts, portfolioLifeHealthPage } from "./portfolioHealthParticipation";
import { getPrototypeLibrary } from "./prototypeLibrary";
import { resolveJourneyUnderwriting } from "./coverageJourney";
import { prototypeApplicantOperand } from "./prototypeApplicantOperands";
import { prototypeCoverageDecision } from "./prototypeCoverageDecision";
import type { CoverageApplicantId, CoverageDefinition, CoverageUnderwritingType } from "./coverage";
import { coverageRelationshipErrors, evaluateEligibility, resolveBenefitLimit, resolveUnderwritingBand } from "./coverageRequirements";
import { applicationApplicantFacts, applicationApplicantFactSet } from "../utils/applicantFacts";
import { getCoverageAmountChoices } from "../utils/coverageAmounts";
import { selectedRiderOnly } from "./coverageRiderOnly";
import { isSelectionPolicy } from "./coverageSelectionPolicy";
import { categoryEligibility, readCategoryEligibilityPolicy } from "./categoryEligibilityPolicy";
import { resolveAssociationEligibility } from "./associationEligibilityPolicy";
import { resolveCoverageJourneyPolicy } from "./coverageJourneyPolicy";
import { applicationUnderwritingContext } from "./quickDecisionPolicy";

export function applicationCoverageName(product: CoverageDefinition, values: Record<string, unknown>) {
  const library = getPrototypeLibrary();
  const association = values.association ?? values.membership;
  const policy = library ? resolveCoverageJourneyPolicy(library.site, product.id) : null;
  return typeof association === "string" ? policy?.associationDisplayNames?.[association] ?? product.name : product.name;
}

export type ResolutionStatus = "no-rule" | "resolved" | "needs-information" | "unresolved";
export type UnderwritingOutcome = { status: ResolutionStatus; underwritingType?: CoverageUnderwritingType; healthPage?: "health-li" | "health-di" | "health-si" | "health-qd" | "health-ci" | null; missingFacts?: string[] };
export function applicationUnderwriting(product: CoverageDefinition, applicant: CoverageApplicantId, values: Record<string, unknown>): UnderwritingOutcome {
  const library = getPrototypeLibrary();
  if (selectedRiderOnly(product, applicant, values)) {
    if (!library) return { status: "no-rule", underwritingType: product.underwritingType };
    const policies = library.site.configuration.products.find(row => row.productKey === product.id)?.selectionPolicies ?? [];
    const policy = policies[0]?.value;
    if (policies.length !== 1 || !isSelectionPolicy(policy) || !policy.modes.includes("rider-only") || !policy.riderOnlyApplicants.includes(applicant)) return { status: "unresolved" };
    return { status: "resolved", underwritingType: policy.healthForRiderOnly ? "FUW" : product.underwritingType };
  }
  if (library) {
    const applicantClass = prototypeApplicantOperand(library, product.id, applicant, values, "applicantClass");
    const amount = (values.coverageAmounts as Record<string, number> | undefined)?.[`${product.id}:${applicant}`];
    const outcomes = applicationApplicantFactSet(values, applicant).map(facts => resolveJourneyUnderwriting(library.site, product.id, applicant, facts.ageYears, amount, typeof applicantClass === "string" ? applicantClass : undefined, facts.associationKey, applicationUnderwritingContext(library.site, product.id, applicant, values)));
    if (outcomes.some(outcome => outcome.status === "unresolved")) return { status: "unresolved" };
    if (outcomes.some(outcome => outcome.status === "needs-information")) return { status: "needs-information", missingFacts: [...new Set(outcomes.flatMap(outcome => "missingFacts" in outcome ? outcome.missingFacts : ["applicant-information"]))] };
    const pathways = [...new Set(outcomes.map(outcome => outcome.pathway))];
    const portfolioPage = resolveCoverageJourneyPolicy(library.site, product.id)?.healthPageForPortfolio ? portfolioLifeHealthPage(library.site, product.id, applicant, pathways[0], applicantPortfolioProducts(applicant, values), applicantPortfolioProcessing(library.site, applicant, values)) : { status: "unmatched" as const };
    if (portfolioPage.status === "needs-information") return { status: "needs-information" };
    const healthPages = portfolioPage.status === "matched" ? [portfolioPage.healthPage] : [...new Set(outcomes.flatMap(outcome => "healthPage" in outcome ? [outcome.healthPage] : []))];
    return pathways.length === 1 && pathways[0] && healthPages.length <= 1 ? { status: "resolved", underwritingType: pathways[0] as CoverageUnderwritingType, ...(healthPages.length ? { healthPage: healthPages[0] } : {}) } : { status: "unresolved" };
  }
  if (!product.underwritingBands?.length) return { status: "no-rule", underwritingType: product.underwritingType };
  if (!product.underwritingBands.some(band => !band.scope.applicantType || band.scope.applicantType === applicant)) return { status: "unresolved" };
  const facts = applicationApplicantFacts(values, applicant);
  const amount = (values.coverageAmounts as Record<string, number> | undefined)?.[`${product.id}:${applicant}`];
  if (facts.ageYears === undefined || !amount) return { status: "needs-information" };
  const band = resolveUnderwritingBand(product, applicant, facts.ageYears, amount);
  return band?.status === "documented" && band.underwritingType
    ? { status: "resolved", underwritingType: band.underwritingType }
    : { status: "unresolved" };
}

export function resolveApplicationCoverage(product: CoverageDefinition, applicant: CoverageApplicantId, values: Record<string, unknown>, products: CoverageDefinition[] = [product], options?: { deferUnansweredMembership?: boolean }) {
  const facts = applicationApplicantFacts(values, applicant);
  const library = getPrototypeLibrary();
  const eligibilityResults = applicationApplicantFactSet(values, applicant, product.id).flatMap(fact => {
    const scoped = library ? resolveAssociationEligibility(library.site, product.id, applicant, fact) : null;
    if (scoped && scoped.result !== "eligible") return [scoped.result];
    const requirements = scoped?.replacesAgeBounds ? { ...product.requirements, eligibility: product.requirements?.eligibility?.map(rule => rule.applicantType !== applicant ? rule : { ...rule, minimumAgeDays: undefined, minimumAgeYears: undefined, maximumAgeYears: undefined, fullTimeStudentMaximumAgeYears: undefined }) } : product.requirements;
    return [evaluateEligibility(requirements, applicant, fact)];
  });
  const categoryPolicy = readCategoryEligibilityPolicy(getPrototypeLibrary()?.site.configuration.categoryEligibilityPolicies ?? []);
  eligibilityResults.push(categoryEligibility(categoryPolicy, categoryPolicy ? values[categoryPolicy.fieldId] : undefined, product.categoryId, options?.deferUnansweredMembership));
  const eligibility = eligibilityResults.includes("ineligible") ? "ineligible" : eligibilityResults.includes("needs-information") ? "needs-information" : "eligible";
  const limit = resolveBenefitLimit(product.requirements, applicant, facts);
  let amounts = getCoverageAmountChoices(product, applicant).filter(amount => amount > 0 && (!limit || (limit.maximum !== undefined && amount <= limit.maximum)));
  const selections = { ...((values.productApplicants ?? {}) as Record<string, CoverageApplicantId[]>) };
  if (Array.isArray(values.coverageSelections)) {
    for (const id of Object.keys(selections)) if (!values.coverageSelections.includes(id)) delete selections[id];
  }
  const selectedAmounts = values.coverageAmounts as Record<string, number> | undefined;
  if (selectedAmounts) for (const id of Object.keys(selections)) {
    selections[id] = selections[id].filter(type => selectedAmounts[`${id}:${type}`] === undefined || selectedAmounts[`${id}:${type}`] > 0);
  }
  selections[product.id] = [...new Set([...(selections[product.id] ?? []), applicant])];
  const normalized = prototypeCoverageDecision(product.id, applicant, values, amounts);
  if (normalized) amounts = normalized.amounts;
  const relationshipErrors = coverageRelationshipErrors(products, selections);
  const messages = [
    ...(!product.applicants.includes(applicant) ? ["This applicant is not supported."] : []),
    ...(eligibility === "needs-information" ? [applicant === "child" ? "Complete each child’s birth date, unmarried and student information on Eligibility before adding coverage." : "Complete the applicant eligibility information before adding coverage."] : []),
    ...(eligibility === "ineligible" ? ["This applicant does not meet the coverage eligibility requirements."] : []),
    ...(limit && limit.maximum === undefined ? ["Complete income and employment information to determine available benefits."] : []),
    ...relationshipErrors,
    ...(amounts.length === 0 && (!limit || limit.maximum !== undefined) ? ["No benefit amount is available for these applicant facts."] : []),
    ...(normalized?.messages ?? []),
  ];
  const waitingOptions = normalized?.waitingPeriods?.map(p => ({ value: p.key, label: p.accidentDays === p.sicknessDays ? `${p.sicknessDays} days` : `${p.accidentDays}-day Accident / ${p.sicknessDays}-day Sickness`, days: p.sicknessDays })) ?? product.waitingPeriodOptionsByApplicant?.[applicant] ?? product.waitingPeriodOptions;
  const benefitOptions = normalized?.benefitPeriods ? (normalized.benefitPeriods.length ? normalized.benefitPeriods.map(value => ({ value, label: value.replaceAll("-", " ") })) : undefined) : product.maxBenefitPeriodOptionsByApplicant?.[applicant] ?? product.maxBenefitPeriodOptions;
  return {
    eligibility, limit, amounts, messages, notices: normalized?.notices ?? [], selectable: messages.length === 0,
    eligibilityStatus: (!product.requirements?.eligibility?.some(rule => rule.applicantType === applicant) ? "no-rule" : eligibility === "needs-information" ? "needs-information" : "resolved") as ResolutionStatus,
    benefitLimitStatus: (!limit ? "no-rule" : limit.maximum === undefined ? "needs-information" : "resolved") as ResolutionStatus,
    requirementsStatus: (product.requirements?.unresolved?.length ? "unresolved" : !product.requirements ? "no-rule" : eligibility === "needs-information" || (limit && limit.maximum === undefined) ? "needs-information" : "resolved") as ResolutionStatus,
    unresolvedRequirements: product.requirements?.unresolved ?? [],
    underwriting: applicationUnderwriting(product, applicant, values),
    waitingPeriod: { requiredValue: (normalized ? undefined : limit?.requiredWaitingPeriod) ?? (waitingOptions?.length === 1 ? waitingOptions[0].value : undefined), options: waitingOptions },
    benefitPeriod: { requiredValue: (normalized ? undefined : limit?.requiredBenefitPeriod) ?? (benefitOptions?.length === 1 ? benefitOptions[0].value : undefined), options: benefitOptions },
  };
}

export function validateApplicationCoverages(products: CoverageDefinition[], values: Record<string, unknown>, options?: { deferProfileUnderwriting?: boolean }): string | undefined {
  const selected = Array.isArray(values.coverageSelections) ? values.coverageSelections : [];
  const applicants = (values.productApplicants ?? {}) as Record<string, CoverageApplicantId[]>;
  if (!selected.length) return "Please select at least one coverage to continue.";
  for (const id of selected) {
    const product = products.find(p => p.id === id);
    if (!product) return "A selected product is no longer available.";
    if (!applicants[product.id]?.length) return "Please select an applicant for each selected coverage.";
    for (const applicant of applicants[product.id] ?? []) {
      const result = resolveApplicationCoverage(product, applicant, values, products);
      if (!result.selectable) return `${product.name}: ${result.messages[0]}`;
      const key = `${product.id}:${applicant}`;
      const amount = (values.coverageAmounts as Record<string, number> | undefined)?.[key];
      const standalone = selectedRiderOnly(product, applicant, values);
      if (standalone) {
        const riderKey = `${product.id}:${standalone.id}:${applicant}`;
        if (!(values.coverageRiders as Record<string, boolean> | undefined)?.[riderKey]) return `${product.name}: select ${standalone.name} for the rider-only application.`;
        if (standalone.hasAmount) {
          const riderAmount = (values.coverageRiderAmounts as Record<string, number> | undefined)?.[riderKey];
          if (riderAmount === undefined || !getCoverageAmountChoices({ coverageAmounts: standalone.coverageAmounts }, applicant).includes(riderAmount)) return `${standalone.name}: select an available rider amount.`;
        }
      } else if (!amount || !result.amounts.includes(amount)) return `${product.name}: select an available benefit amount for ${applicant}.`;
      for (const [field, constraint] of standalone ? [] : [["coverageWaitingPeriods", result.waitingPeriod], ["coverageMaxBenefitPeriods", result.benefitPeriod]] as const) {
        const stored = values[field] as Record<string, string> | undefined;
        const value = stored?.[key] ?? stored?.[product.id] ?? constraint.requiredValue ?? constraint.options?.[0]?.value;
        if ((constraint.requiredValue && value !== constraint.requiredValue) || (constraint.options && !constraint.options.some(o => o.value === value))) return `${product.name}: update the required coverage options for ${applicant}.`;
      }
      if (result.underwriting.status === "unresolved") return `${product.name}: underwriting requirements are unresolved for this applicant and benefit amount. Please contact support.`;
      if (result.underwriting.status === "needs-information" && !(options?.deferProfileUnderwriting && result.underwriting.missingFacts?.length && result.underwriting.missingFacts.every(fact => fact === "existingLifeAmount"))) return `${product.name}: complete ${result.underwriting.missingFacts?.includes("existingLifeAmount") ? "existing Life coverage information on Profile" : "applicant age and benefit information"}.`;
    }
  }
}
