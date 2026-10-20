import type { EffectiveSite } from "./effectiveSite";

export const usJurisdictions = "AL AK AZ AR CA CO CT DE DC FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY AS GU MP PR VI AA AE AP".split(" ").map(code => `US-${code}`);
/** Internal eligibility diagnostic; not approved applicant alert copy. */
export const residencyExclusionDiagnostic = "Jurisdiction or military status is excluded";
const known = new Set([...usJurisdictions, ..."AB BC MB NB NL NS NT NU ON PE QC SK YT".split(" ").map(code => `CA-${code}`)]);
export type ResidencyPolicy = { version: 1; allowedJurisdictions: string[]; applicantExcludedJurisdictions?: Record<string, string[]>; excludeActiveMilitary: boolean; provisional: boolean; revisit: string[] };
const object = (value: unknown): value is Record<string, unknown> => value !== null && typeof value === "object" && !Array.isArray(value);
export function isResidencyPolicy(value: unknown): value is ResidencyPolicy {
  return object(value) && value.version === 1 && Array.isArray(value.allowedJurisdictions) && value.allowedJurisdictions.length > 0 && value.allowedJurisdictions.every(code => typeof code === "string" && known.has(code)) && new Set(value.allowedJurisdictions).size === value.allowedJurisdictions.length && (value.applicantExcludedJurisdictions === undefined || object(value.applicantExcludedJurisdictions) && Object.entries(value.applicantExcludedJurisdictions).every(([key, codes]) => ["member", "spouse", "child"].includes(key) && Array.isArray(codes) && codes.every(code => typeof code === "string" && known.has(code)) && new Set(codes).size === codes.length)) && typeof value.excludeActiveMilitary === "boolean" && typeof value.provisional === "boolean" && Array.isArray(value.revisit) && value.revisit.every(note => typeof note === "string" && note.length > 0);
}
/** Residency dimension only; no inferred country, default state or military status. */
export function resolveNormalizedResidency(site: EffectiveSite, productKey: string, applicantKey: string, facts: { jurisdiction?: string; activeMilitary?: boolean }) {
  const product = site.configuration.products.find(product => product.productKey === productKey);
  if (!product || !site.products.find(product => product.productKey === productKey)?.applicants.some(applicant => applicant.applicantKey === applicantKey)) return { status: "resolved" as const, allowed: false, reason: "Product or applicant is unavailable" };
  if (product.residencyPolicies.length !== 1 || !isResidencyPolicy(product.residencyPolicies[0].value)) return { status: "unresolved" as const, allowed: false, reason: "Residency policy is missing or invalid" };
  const policy = product.residencyPolicies[0];
  const value = policy.value as ResidencyPolicy;
  const evidence = { provenance: policy.provenance, provisional: value.provisional, revisit: value.revisit };
  if (facts.jurisdiction === undefined || value.excludeActiveMilitary && facts.activeMilitary === undefined) return { ...evidence, status: "needs-information" as const, allowed: false, reason: "Jurisdiction and any required military status must be supplied" };
  if (!known.has(facts.jurisdiction) || facts.activeMilitary !== undefined && typeof facts.activeMilitary !== "boolean") return { ...evidence, status: "unresolved" as const, allowed: false, reason: "Invalid residency facts" };
  const allowed = value.allowedJurisdictions.includes(facts.jurisdiction) && !value.applicantExcludedJurisdictions?.[applicantKey]?.includes(facts.jurisdiction) && !(value.excludeActiveMilitary && facts.activeMilitary);
  return { ...evidence, status: "resolved" as const, allowed, reason: allowed ? "Residency satisfies the reviewed policy" : residencyExclusionDiagnostic };
}
