import type { EffectiveSite } from "./effectiveSite";
import { isLifeAggregatePolicy } from "./lifeAggregatePolicy";
import { resolveAssociationAmounts } from "./associationAmountPolicy";

/** Checks amounts against the captured normalized Library, without prototype fallback.
 * This validates the amount dimension only; eligibility/other policy remain separate.
 */
export function validateNormalizedCoverageAmount(site: EffectiveSite, productKey: string, applicantKey: string, amount: number, applicantClass?: string, associationKey?: string) {
  const product = site.configuration.products.find(product => product.productKey === productKey);
  const applicant = site.products.find(product => product.productKey === productKey)?.applicants.find(applicant => applicant.applicantKey === applicantKey);
  if (!product || !applicant) return { status: "resolved" as const, allowed: false, reason: "Product or applicant is unavailable" };
  if (!Number.isFinite(amount) || amount <= 0) return { status: "resolved" as const, allowed: false, reason: "Amount must be finite and positive" };
  const assignment = resolveAssociationAmounts(site, productKey, associationKey);
  if (assignment.status !== "resolved") return { status: assignment.status, allowed: false, reason: assignment.reason! };
  const applicantRules = assignment.rules.filter(rule => rule.value.applicantTypeKey === applicantKey);
  const applicable = applicantRules.length ? applicantRules : assignment.rules.filter(rule => rule.value.applicantTypeKey === null);
  if (applicable.some(rule => rule.value.applicantClass !== null) && applicantClass === undefined) return { status: "needs-information" as const, allowed: false, reason: "Applicant class is required" };
  const classRules = applicantClass === undefined ? [] : applicable.filter(rule => rule.value.applicantClass === applicantClass);
  const rules = classRules.length ? classRules : applicable.filter(rule => rule.value.applicantClass === null);
  if (!rules.length || rules.some(rule => rule.status !== "resolved" || rule.amount?.status !== "resolved")) return { status: "unresolved" as const, allowed: false, reason: "Amount policy is missing or unresolved" };
  if (rules.some(rule => !["fixed", "range", "tiered-range", "range-plus-fixed", "set"].includes(rule.amount!.pattern.value.amountType))) return { status: "unresolved" as const, allowed: false, reason: "Derived or nonnumeric amount requires its evaluator" };
  const allowed = rules.some(rule => {
    const definition = rule.amount!;
    if (definition.pattern.value.amountType === "fixed") return amount === definition.pattern.value.minimum;
    return definition.options.some(option => Number(option.value.value) === amount) || definition.bands.some(band => {
      const { minimum, maximum, increment } = band.value;
      if (minimum === null || maximum === null || increment === null || amount < minimum || amount > maximum) return false;
      const step = (amount - minimum) / increment;
      return Number.isInteger(step);
    });
  });
  return { status: "resolved" as const, allowed, reason: allowed ? "Amount satisfies the normalized policy" : "Amount is outside the normalized choices" };
}

/** Per-person aggregate. Existing life coverage is an explicit required input,
 * so incomplete portfolio information cannot silently become zero coverage.
 */
export function validateNormalizedLifeAggregate(site: EffectiveSite, applicantKey: string, selected: Array<{ productKey: string; amount: number }>, existingLifeAmount?: number) {
  if (existingLifeAmount === undefined) return { status: "needs-information" as const, allowed: false, reason: "Existing life amount is required" };
  if (!Number.isFinite(existingLifeAmount) || existingLifeAmount < 0 || selected.some(selection => !Number.isFinite(selection.amount) || selection.amount < 0) || new Set(selected.map(selection => selection.productKey)).size !== selected.length) return { status: "unresolved" as const, allowed: false, reason: "Invalid or duplicate life amounts" };
  const authored = site.configuration.lifeAggregates;
  if (authored.length) {
    if (authored.length !== 1 || !isLifeAggregatePolicy(authored[0].value)) return { status: "unresolved" as const, allowed: false, reason: "Aggregate policy is missing or ambiguous" };
    const groups = authored[0].value.groups.filter(group => group.applicantKeys.includes(applicantKey));
    if (groups.length !== 1 || groups[0].productKeys.some(key => !site.configuration.products.some(product => product.productKey === key))) return { status: "unresolved" as const, allowed: false, reason: "Aggregate group is missing or invalid" };
    if (selected.some(selection => !site.configuration.products.some(product => product.productKey === selection.productKey))) return { status: "unresolved" as const, allowed: false, reason: "Unknown selected product" };
    const included = selected.filter(selection => groups[0].productKeys.includes(selection.productKey));
    if (included.some(selection => !validateNormalizedCoverageAmount(site, selection.productKey, applicantKey, selection.amount).allowed)) return { status: "resolved" as const, allowed: false, reason: "Invalid selected life amount" };
    const total = existingLifeAmount + included.reduce((sum, selection) => sum + selection.amount, 0), maximum = groups[0].maximum;
    if (!Number.isFinite(total)) return { status: "unresolved" as const, allowed: false, reason: "Invalid aggregate total" };
    return { status: "resolved" as const, allowed: total <= maximum, total, maximum, productKeys: groups[0].productKeys, reason: total <= maximum ? "Aggregate satisfies the normalized limit" : "Life aggregate exceeds the normalized limit" };
  }
  const life = selected.filter(selection => site.configuration.products.find(product => product.productKey === selection.productKey)?.catalog?.value.categoryKey === "LI");
  if (selected.some(selection => !site.configuration.products.some(product => product.productKey === selection.productKey))) return { status: "unresolved" as const, allowed: false, reason: "Unknown selected product" };
  if (life.some(selection => !validateNormalizedCoverageAmount(site, selection.productKey, applicantKey, selection.amount).allowed)) return { status: "resolved" as const, allowed: false, reason: "Invalid selected life amount" };
  const limits = new Map(site.configuration.products.flatMap(product => product.limits).filter(limit => limit.value.productKey === null && limit.value.categoryKey === "LI" && (limit.value.applicantTypeKey === null || limit.value.applicantTypeKey === applicantKey)).map(limit => [limit.key, limit]));
  if (limits.size !== 1 || [...limits.values()].some(limit => limit.status !== "resolved" || limit.value.maximum === null)) return { status: "unresolved" as const, allowed: false, reason: "Aggregate policy is missing or ambiguous" };
  const total = existingLifeAmount + life.reduce((sum, selection) => sum + selection.amount, 0);
  const maximum = [...limits.values()][0].value.maximum!;
  if (!Number.isFinite(total)) return { status: "unresolved" as const, allowed: false, reason: "Invalid aggregate total" };
  return { status: "resolved" as const, allowed: total <= maximum, total, maximum, reason: total <= maximum ? "Aggregate satisfies the normalized limit" : "Life aggregate exceeds the normalized limit" };
}
