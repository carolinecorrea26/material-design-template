import type { EffectiveSite, RuleProvenance } from "./effectiveSite";

export type AmountCapPolicy = { version: 1; limitKeys: string[] };
export function isAmountCapPolicy(value: unknown): value is AmountCapPolicy {
  if (value === null || typeof value !== "object" || Array.isArray(value) || !("version" in value) || value.version !== 1 || !("limitKeys" in value)) return false;
  const keys = value.limitKeys;
  return Array.isArray(keys) && keys.length > 0 && keys.every(key => typeof key === "string" && key.trim().length > 0) && new Set(keys).size === keys.length;
}

type CapSite = Pick<EffectiveSite, "siteKey" | "configuration">;
type CapDecision = { status: "resolved" | "needs-information" | "unresolved"; maximum?: number; reason?: string; provenance: RuleProvenance[] };
const nonnegative = (value: number) => Number.isFinite(value) && value >= 0;

/** Optional, explicitly assigned age caps. Base choices remain in amount rules;
 * absence preserves older captured revisions. No cap numbers live in this code. */
function resolveBaseAmountCap(site: CapSite, productKey: string, applicantKey: string, ageYears?: number): CapDecision {
  const product = site.configuration.products.find(product => product.productKey === productKey);
  const provenance: RuleProvenance[] = [];
  const fail = (reason: string): CapDecision => ({ status: "unresolved", reason, provenance });
  if (!product) return fail("Product is unavailable");
  const policies = product.amountCapPolicies;
  if (!policies.length) return { status: "resolved", provenance };
  provenance.push(...policies.flatMap(policy => policy.provenance));
  if (policies.length !== 1 || !isAmountCapPolicy(policies[0].value)) return fail("No unique valid amount-cap policy");
  const limits = [];
  const scopes = new Set<string | null>();
  for (const key of policies[0].value.limitKeys) {
    const matches = product.limits.filter(limit => limit.key === key);
    if (matches.length !== 1) return fail("Amount-cap limit reference is missing or ambiguous");
    const limit = matches[0], row = limit.value;
    provenance.push(...limit.provenance, ...limit.caps.flatMap(cap => cap.provenance));
    if (limit.status !== "resolved" || row.siteKey !== site.siteKey || row.productKey !== productKey || row.conditionKey !== null || row.formula !== null
      || row.categoryKey !== null && row.categoryKey !== product.catalog?.value.categoryKey
      || row.maximum !== null && !nonnegative(row.maximum) || !limit.caps.length || scopes.has(row.applicantTypeKey)
      || row.applicantTypeKey !== null && !product.applicantRules.some(rule => rule.value.applicantTypeKey === row.applicantTypeKey && rule.value.eligible)) return fail("Unsupported amount-cap scope or expression");
    scopes.add(row.applicantTypeKey);
    const caps = [...limit.caps].sort((a, b) => (a.value.minimumAgeYears ?? 0) - (b.value.minimumAgeYears ?? 0));
    for (const [index, { value: cap }] of caps.entries()) {
      const ages = [cap.minimumAgeYears, cap.maximumAgeYears];
      if (!nonnegative(cap.maximum) || ages.some(age => age !== null && (!nonnegative(age) || !Number.isInteger(age)))
        || cap.minimumAgeYears !== null && cap.maximumAgeYears !== null && cap.minimumAgeYears > cap.maximumAgeYears
        || cap.selfEmployedLessThanYears !== null || cap.requiredWaitingPeriod !== null || cap.requiredBenefitPeriod !== null
        || index > 0 && (cap.minimumAgeYears ?? 0) <= (caps[index - 1].value.maximumAgeYears ?? Infinity)) return fail("Invalid or overlapping age caps");
    }
    limits.push(limit);
  }
  if (scopes.has(null) && scopes.size > 1) return fail("Ambiguous applicant amount caps");
  const applicable = limits.filter(limit => limit.value.applicantTypeKey === null || limit.value.applicantTypeKey === applicantKey);
  if (applicable.length > 1) return fail("Ambiguous applicant amount caps");
  if (!applicable.length) return { status: "resolved", provenance };
  if (ageYears === undefined || !nonnegative(ageYears) || !Number.isInteger(ageYears)) return { status: "needs-information", reason: "Complete applicant age to determine available coverage amounts.", provenance };
  const limit = applicable[0];
  const cap = limit.caps.find(({ value }) => ageYears >= (value.minimumAgeYears ?? 0) && ageYears <= (value.maximumAgeYears ?? Infinity));
  const maxima = [limit.value.maximum, cap?.value.maximum].filter((value): value is number => value !== null && value !== undefined);
  return { status: "resolved", ...(maxima.length ? { maximum: Math.min(...maxima) } : {}), provenance };
}

/** Reviewed fresh-start caps and base policies are resolved at one shared boundary. */
export function resolveNormalizedAmountCap(site: CapSite, productKey: string, applicantKey: string, ageYears?: number): CapDecision {
  const base = resolveBaseAmountCap(site, productKey, applicantKey, ageYears);
  if (base.status !== "resolved") return base;
  const rows = site.configuration.coverageRequirements?.filter(row => row.product === productKey && row.applicants.includes(applicantKey as "member" | "spouse" | "child") && row.configuration === "coverage-age-maximum-amount") ?? [];
  if (!rows.length) return base;
  if (ageYears === undefined || !Number.isInteger(ageYears) || ageYears < 0) return { ...base, status: "needs-information", reason: "Complete applicant age to determine available coverage amounts." };
  const maximum = rows.find(row => ageYears >= row.minimumAgeYears! && ageYears <= row.maximumAgeYears!)?.value;
  return typeof maximum === "number" ? { ...base, maximum: Math.min(base.maximum ?? Infinity, maximum) } : base;
}
