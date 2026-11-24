import type { EffectiveSite } from "./effectiveSite";
import { resolveCoverageJourneyPolicy, type CoverageJourneyPolicy } from "./coverageJourneyPolicy";
import { resolveAssociationUnderwriting } from "./associationUnderwriting";
import { quickDecisionOutcome, type UnderwritingContext } from "./quickDecisionPolicy";
const finite = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value) && value >= 0;

/** One mapping for executable underwriting and Library capability inspection. */
export function underwritingHealthPage(policy: CoverageJourneyPolicy, category: string | undefined, applicant: string, pathway: CoverageJourneyPolicy['defaultUnderwritingPathway'], override?: { healthPage: 'health-qd' | 'health-tele' | 'health-di-supp' | 'health-si' | null }) {
  return applicant === 'child' ? null : override ? override.healthPage : policy.healthPageByUnderwriting && Object.hasOwn(policy.healthPageByUnderwriting, pathway)
    ? policy.healthPageByUnderwriting[pathway]!
    : category === 'AD' || ['GI', 'NA', 'NCGI'].includes(pathway) ? null : pathway === 'QD' ? 'health-qd' as const : pathway === 'SI' ? 'health-si' as const : 'health-tele' as const;
}

/** Possible routes are projected from the same assigned bands and journey policy;
 * inspection does not invent applicant answers to run an application. */
export function possibleProductHealthPages(site: EffectiveSite, productKey: string, applicants: string[]) {
  const policy = resolveCoverageJourneyPolicy(site, productKey);
  const product = site.configuration.products.find(product => product.productKey === productKey);
  if (!policy || !product) return [];
  return [...new Set(applicants.filter(applicant => policy.applicants.includes(applicant)).flatMap(applicant => {
    const bands = product.underwritingRules.filter(row => !row.value.applicantTypeKey || row.value.applicantTypeKey === applicant);
    const quickDecision = policy.quickDecision && !policy.underwritingByApplicant?.[applicant];
    const associations = policy.associationChoices.filter(choice => site.enabledAssociationKeys.includes(choice.key));
    const overrides = quickDecision ? [] : policy.associationUnderwriting?.filter(rule => rule.applicantKey === applicant && associations.some(choice => choice.key === rule.associationKey)) ?? [];
    const inherits = !policy.associationChoices.length || associations.some(choice => !overrides.some(rule => rule.associationKey === choice.key));
    const pathways = quickDecision ? ['QD', 'FUW'] as const : !inherits ? []
      : [...new Set([...bands.map(row => row.value.pathway).filter((pathway): pathway is CoverageJourneyPolicy['defaultUnderwritingPathway'] => pathway !== null && pathway !== 'UNRESOLVED'),
        ...(!bands.length ? [policy.underwritingByApplicant?.[applicant] ?? policy.defaultUnderwritingPathway] : [])])];
    return [...pathways.map(pathway => underwritingHealthPage(policy, product.catalog?.value.categoryKey, applicant, pathway)),
      ...overrides.flatMap(rule => rule.bands.map(band => underwritingHealthPage(policy, product.catalog?.value.categoryKey, applicant, band.pathway, band))),
      ...(applicant !== 'child' && policy.healthPageForPortfolio ? [policy.healthPageForPortfolio.pageId] : [])].filter(page => page !== null);
  }))];
}

/** Existing adopted bands retain priority over the explicit provisional default.
 * Unsupported conditions, incomplete bands and overlaps never imply acceptance. */
export function resolveJourneyUnderwriting(site: EffectiveSite, productKey: string, applicantKey: string, ageYears?: number, amount?: number, applicantClass?: string, associationKey?: string, context: UnderwritingContext = {}) {
  const policy = resolveCoverageJourneyPolicy(site, productKey);
  const product = site.configuration.products.find(p => p.productKey === productKey);
  if (!policy || !product || !policy.applicants.includes(applicantKey)) return { status: "unresolved" as const, pathway: undefined };
  const healthPage = (pathway: typeof policy.defaultUnderwritingPathway) => underwritingHealthPage(policy, product.catalog?.value.categoryKey, applicantKey, pathway);
  if (policy.quickDecision && !policy.underwritingByApplicant?.[applicantKey]) {
    const outcome = quickDecisionOutcome(policy.quickDecision, productKey, applicantKey, ageYears, amount, context);
    return outcome.status === "resolved" ? { ...outcome, healthPage: healthPage(outcome.pathway) } : outcome;
  }
  if (policy.associationChoices.length && associationKey && !site.enabledAssociationKeys.includes(associationKey)) return { status: "unresolved" as const, pathway: undefined };
  if (policy.associationUnderwriting) {
    if (!associationKey) return { status: "needs-information" as const, pathway: undefined };
    if (!policy.associationChoices.some(choice => choice.key === associationKey)) return { status: "unresolved" as const, pathway: undefined };
    const selected = resolveAssociationUnderwriting(policy.associationUnderwriting, associationKey, applicantKey, ageYears, amount);
    if (selected) return selected.status === "resolved" && selected.pathway ? { ...selected, healthPage: underwritingHealthPage(policy, product.catalog?.value.categoryKey, applicantKey, selected.pathway, selected) } : selected;
  }
  const applicable = product.underwritingRules.filter(r => !r.value.applicantTypeKey || r.value.applicantTypeKey === applicantKey);
  if (applicable.some(r => r.value.applicantClass) && applicantClass === undefined) return { status: "needs-information" as const, pathway: undefined };
  const rows = applicable.filter(r => !r.value.applicantClass || r.value.applicantClass === applicantClass);
  if (applicable.length && !rows.length) return { status: "unresolved" as const, pathway: undefined };
  if (!rows.length) {
    const pathway = policy.underwritingByApplicant?.[applicantKey] ?? policy.defaultUnderwritingPathway;
    return { status: "resolved" as const, pathway, provisional: policy.provisional, healthPage: healthPage(pathway) };
  }
  if (!finite(ageYears) || !Number.isInteger(ageYears) || !finite(amount) || amount <= 0) return { status: "needs-information" as const, pathway: undefined };
  if (rows.some(r => r.value.status !== "documented" || r.value.conditionKey || [r.value.minimumAge, r.value.maximumAge, r.value.minimumAmount, r.value.maximumAmount].some(n => !finite(n)) || !["QD", "FUW", "GI", "SI", "NA", "NCGI", "TELE"].includes(r.value.pathway ?? ""))) return { status: "unresolved" as const, pathway: undefined };
  const bands = rows.filter(({ value: b }) => ageYears >= b.minimumAge! && ageYears <= b.maximumAge! && (b.minimumAmountExclusive ? amount > b.minimumAmount! : amount >= b.minimumAmount!) && amount <= b.maximumAmount!);
  if (bands.length !== 1) return { status: "unresolved" as const, pathway: undefined };
  const pathway = bands[0].value.pathway! as typeof policy.defaultUnderwritingPathway;
  return { status: "resolved" as const, pathway, provenance: bands[0].provenance, healthPage: healthPage(pathway) };
}
