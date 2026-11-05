import type { EffectiveSite } from "./effectiveSite";
import { resolveCoverageJourneyPolicy } from "./coverageJourneyPolicy";
import { resolveAssociationUnderwriting } from "./associationUnderwriting";
import { quickDecisionOutcome, type UnderwritingContext } from "./quickDecisionPolicy";
const finite = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value) && value >= 0;

/** Existing adopted bands retain priority over the explicit provisional default.
 * Unsupported conditions, incomplete bands and overlaps never imply acceptance. */
export function resolveJourneyUnderwriting(site: EffectiveSite, productKey: string, applicantKey: string, ageYears?: number, amount?: number, applicantClass?: string, associationKey?: string, context: UnderwritingContext = {}) {
  const policy = resolveCoverageJourneyPolicy(site, productKey);
  const product = site.configuration.products.find(p => p.productKey === productKey);
  if (!policy || !product || !policy.applicants.includes(applicantKey)) return { status: "unresolved" as const, pathway: undefined };
  const healthPage = (pathway: typeof policy.defaultUnderwritingPathway) => applicantKey === "child" ? null : policy.healthPageByUnderwriting && Object.hasOwn(policy.healthPageByUnderwriting, pathway) ? policy.healthPageByUnderwriting[pathway] : product.catalog?.value.categoryKey === "AD" || ["GI", "NA", "NCGI"].includes(pathway) ? null : pathway === "QD" ? "health-qd" as const : pathway === "SI" ? "health-si" as const : ["DI", "OO"].includes(product.catalog?.value.categoryKey ?? "") ? "health-di" as const : "health-li" as const;
  if (policy.quickDecision && !policy.underwritingByApplicant?.[applicantKey]) {
    const outcome = quickDecisionOutcome(policy.quickDecision, productKey, applicantKey, ageYears, amount, context);
    return outcome.status === "resolved" ? { ...outcome, healthPage: healthPage(outcome.pathway) } : outcome;
  }
  if (policy.associationChoices.length && associationKey && !site.enabledAssociationKeys.includes(associationKey)) return { status: "unresolved" as const, pathway: undefined };
  if (policy.associationUnderwriting) {
    if (!associationKey) return { status: "needs-information" as const, pathway: undefined };
    if (!policy.associationChoices.some(choice => choice.key === associationKey)) return { status: "unresolved" as const, pathway: undefined };
    const selected = resolveAssociationUnderwriting(policy.associationUnderwriting, associationKey, applicantKey, ageYears, amount);
    if (selected) return selected;
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
