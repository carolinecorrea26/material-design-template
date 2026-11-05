import type { EffectiveSite } from "./effectiveSite";
import type { ApplicationMode } from "./coverageSelectionPolicy";
import { validatePaymentPolicy, type PaymentFrequency, type PaymentMethod, type PaymentPolicy } from "./paymentPolicy";
import { isAssociationUnderwriting, type AssociationUnderwriting } from "./associationUnderwriting";
import { isQuickDecisionPolicy, type QuickDecisionPolicy } from "./quickDecisionPolicy";

export type IdentifierRoles = { display: string; rating: string; issue: string; xml: string; pdf: string; portalDummy: string | null };
export type MappingDimensions = { applicantKey: string; mode: ApplicationMode; associationKey?: string; applicantClass?: string; waitingPeriod?: string; benefitPeriod?: string };
export type CoverageJourneyPolicy = {
  version: 1; applicants: string[]; associationChoices: Array<{ key: string; label: string }>;
  associationDisplayNames?: Record<string, string>;
  associationUnderwriting?: AssociationUnderwriting[];
  quickDecision?: QuickDecisionPolicy;
  healthPageByUnderwriting?: Partial<Record<CoverageJourneyPolicy["defaultUnderwritingPathway"], "health-qd" | "health-li" | "health-di" | "health-si" | "health-ci" | null>>;
  healthPageForPortfolio?: { when: "qd-life-with-fuw-disability"; pageId: "health-li" } | { when: "qd-life-with-disability"; pageId: "health-di" };
  defaultUnderwritingPathway: "QD" | "FUW" | "GI" | "SI" | "NA" | "NCGI" | "TELE";
  underwritingByApplicant?: Record<string, "NA">;
  membershipRequired: boolean; ageBasis: "age-last-birthday-on-application-date";
  payment: PaymentPolicy;
  billing: { annualFactors: Record<PaymentFrequency, number>; feePerCollection: Record<PaymentMethod, number>; annualCredit: number; currency: "USD" };
  dependentElections: Array<{ key: string; applicantKey: "spouse" | "child"; defaultSelected: boolean; amountChoices: number[]; fixedAmount: number | null; maximumAgeYears: number | null; attestation: string; signatureRequired: boolean; visitsPerYear: number | null }>;
  questions: Array<{ applicantKey: string; modes: ApplicationMode[]; healthPage: string | null; financialFields: string[]; tobaccoFields: string[]; attestationKey: string; attestationText: string }>;
  mappings: Array<{ when: MappingDimensions; identifiers: { gNumber: IdentifierRoles; planCode: IdentifierRoles }; riderCodes: Record<string, string> }>;
  provisional: boolean; revisit: string[];
};
const object = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
const string = (v: unknown): v is string => typeof v === "string" && v.trim().length > 0;
const strings = (v: unknown): v is string[] => Array.isArray(v) && v.every(string) && new Set(v).size === v.length;
const finite = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v) && v >= 0;
const modes = ["new", "increase", "rider-only"];
function roles(v: unknown): v is IdentifierRoles { return object(v) && ["display", "rating", "issue", "xml", "pdf"].every(k => string(v[k])) && (v.portalDummy === null || string(v.portalDummy)); }
export function isCoverageJourneyPolicy(v: unknown): v is CoverageJourneyPolicy {
  if (object(v) && v.quickDecision !== undefined && !isQuickDecisionPolicy(v.quickDecision)) return false;
  if (object(v) && v.healthPageByUnderwriting !== undefined && (!object(v.healthPageByUnderwriting) || !Object.keys(v.healthPageByUnderwriting).length || Object.entries(v.healthPageByUnderwriting).some(([key, value]) => !["QD", "FUW", "GI", "SI", "NA", "NCGI", "TELE"].includes(key) || value !== null && !["health-qd", "health-li", "health-di", "health-si", "health-ci"].includes(String(value))))) return false;
  if (object(v) && v.healthPageForPortfolio !== undefined && (!object(v.healthPageForPortfolio) || !(v.healthPageForPortfolio.when === "qd-life-with-fuw-disability" && v.healthPageForPortfolio.pageId === "health-li" || v.healthPageForPortfolio.when === "qd-life-with-disability" && v.healthPageForPortfolio.pageId === "health-di"))) return false;
  if (object(v) && v.underwritingByApplicant !== undefined && (!object(v.underwritingByApplicant) || Object.entries(v.underwritingByApplicant).some(([key, value]) => !['member', 'spouse', 'child'].includes(key) || value !== 'NA'))) return false;
  if (!object(v) || v.version !== 1 || !strings(v.applicants) || !v.applicants.length || !v.applicants.every(a => ["member", "spouse", "child"].includes(a)) || !["QD", "FUW", "GI", "SI", "NA", "NCGI", "TELE"].includes(String(v.defaultUnderwritingPathway)) || v.ageBasis !== "age-last-birthday-on-application-date" || typeof v.membershipRequired !== "boolean" || typeof v.provisional !== "boolean" || !strings(v.revisit) || !Array.isArray(v.associationChoices) || !v.associationChoices.every(a => object(a) && string(a.key) && string(a.label)) || new Set(v.associationChoices.map(a => (a as { key: string }).key)).size !== v.associationChoices.length) return false;
  const associationChoices = v.associationChoices as Array<{ key: string }>;
  if (v.associationUnderwriting !== undefined && (!isAssociationUnderwriting(v.associationUnderwriting) || v.associationUnderwriting.some(rule => !associationChoices.some(choice => choice.key === rule.associationKey) || !(v.applicants as string[]).includes(rule.applicantKey)))) return false;
  if (v.associationDisplayNames !== undefined && (!object(v.associationDisplayNames) || Object.entries(v.associationDisplayNames).some(([key, label]) => !associationChoices.some(choice => choice.key === key) || !string(label)))) return false;
  try { if (!object(v.payment) || typeof v.payment.frequencyLocked !== "boolean" || typeof v.payment.synchronizeAcrossProducts !== "boolean") return false; validatePaymentPolicy(v.payment as PaymentPolicy); } catch { return false; }
  if (!object(v.billing) || v.billing.currency !== "USD" || !finite(v.billing.annualCredit) || !object(v.billing.annualFactors) || !["monthly", "quarterly", "semiannual", "annual"].every(k => finite((v.billing as Record<string, Record<string, unknown>>).annualFactors[k]) && Number((v.billing as Record<string, Record<string, unknown>>).annualFactors[k]) > 0) || !object(v.billing.feePerCollection) || !["bank-account", "credit-card", "bill-me"].every(k => finite((v.billing as Record<string, Record<string, unknown>>).feePerCollection[k]))) return false;
  if (!Array.isArray(v.dependentElections) || !v.dependentElections.every(d => object(d) && string(d.key) && ["spouse", "child"].includes(String(d.applicantKey)) && typeof d.defaultSelected === "boolean" && typeof d.signatureRequired === "boolean" && string(d.attestation) && Array.isArray(d.amountChoices) && d.amountChoices.every(finite) && new Set(d.amountChoices).size === d.amountChoices.length && (d.fixedAmount === null ? d.amountChoices.length > 0 : finite(d.fixedAmount) && d.amountChoices.length === 0) && (d.maximumAgeYears === null || finite(d.maximumAgeYears) && Number.isInteger(d.maximumAgeYears)) && (d.visitsPerYear === null || finite(d.visitsPerYear) && Number.isInteger(d.visitsPerYear)))) return false;
  if (new Set(v.dependentElections.map(d => (d as { key: string }).key)).size !== v.dependentElections.length) return false;
  if (!Array.isArray(v.questions) || !v.questions.every(q => object(q) && (v.applicants as string[]).includes(String(q.applicantKey)) && strings(q.modes) && q.modes.length > 0 && q.modes.every(m => modes.includes(m)) && (q.healthPage === null || ["health-qd", "health-li", "health-si", "health-di", "health-ci"].includes(String(q.healthPage))) && strings(q.financialFields) && strings(q.tobaccoFields) && string(q.attestationKey) && string(q.attestationText))) return false;
  if (!Array.isArray(v.mappings) || !v.mappings.length || !v.mappings.every(m => object(m) && object(m.when) && (v.applicants as string[]).includes(String(m.when.applicantKey)) && modes.includes(String(m.when.mode)) && Object.entries(m.when).every(([k, value]) => ["applicantKey", "mode", "associationKey", "applicantClass", "waitingPeriod", "benefitPeriod"].includes(k) && string(value)) && object(m.identifiers) && roles(m.identifiers.gNumber) && roles(m.identifiers.planCode) && object(m.riderCodes) && Object.entries(m.riderCodes).every(([k, c]) => string(k) && string(c)))) return false;
  return new Set(v.mappings.map(m => JSON.stringify(Object.entries((m as { when: MappingDimensions }).when).sort()))).size === v.mappings.length;
}
export function resolveCoverageJourneyPolicy(site: EffectiveSite, productKey: string): CoverageJourneyPolicy | null {
  const rows = site.configuration.products.find(p => p.productKey === productKey)?.journeyPolicies ?? [];
  return rows.length === 1 && isCoverageJourneyPolicy(rows[0].value) ? rows[0].value : null;
}
/** No implicit first-match: the uniquely most-specific mapping must win. */
export function resolveSubmissionMapping(policy: CoverageJourneyPolicy, facts: MappingDimensions) {
  if (!isCoverageJourneyPolicy(policy)) return { status: "unresolved" as const, mapping: null };
  if (policy.associationChoices.length && !facts.associationKey) return { status: "needs-information" as const, mapping: null };
  if (policy.associationChoices.length && !policy.associationChoices.some(a => a.key === facts.associationKey)) return { status: "unresolved" as const, mapping: null };
  const candidates = policy.mappings.filter(m => Object.entries(m.when).every(([k, v]) => facts[k as keyof MappingDimensions] === v));
  const required = policy.mappings.filter(m => m.when.applicantKey === facts.applicantKey && m.when.mode === facts.mode && (!m.when.associationKey || m.when.associationKey === facts.associationKey));
  for (const dimension of ["applicantClass", "waitingPeriod", "benefitPeriod"] as const) if (required.some(m => m.when[dimension])) {
    if (!facts[dimension]) return { status: "needs-information" as const, mapping: null };
    if (!required.some(m => m.when[dimension] === facts[dimension])) return { status: "unresolved" as const, mapping: null };
  }
  const specificity = Math.max(...candidates.map(m => Object.keys(m.when).length));
  const winners = candidates.filter(m => Object.keys(m.when).length === specificity);
  return winners.length === 1 ? { status: "resolved" as const, mapping: winners[0] } : { status: "unresolved" as const, mapping: null };
}
export function reconcileDependentElections(policy: CoverageJourneyPolicy, input: Record<string, { selected: boolean; amount?: number; attested?: boolean }>, initialize = false) {
  const errors: string[] = [], missingFacts: string[] = [];
  const elections = Object.fromEntries(policy.dependentElections.map(rule => {
    const current = input[rule.key];
    const selected = current?.selected ?? (initialize && rule.defaultSelected);
    if (!selected) return [rule.key, { selected: false, amount: null, attested: false, signatureRequired: false }];
    if (current?.attested !== true) missingFacts.push(`${rule.key}.attested`);
    const amount = rule.fixedAmount ?? current?.amount ?? (initialize ? rule.amountChoices[0] : undefined);
    if (amount === undefined) missingFacts.push(`${rule.key}.amount`);
    else if (rule.fixedAmount === null && !rule.amountChoices.includes(amount)) errors.push(`${rule.key}: unavailable benefit amount`);
    return [rule.key, { selected, amount: amount ?? null, attested: current?.attested === true, signatureRequired: rule.signatureRequired }];
  }));
  return { elections, errors, missingFacts, allowed: !errors.length && !missingFacts.length };
}
export function resolveBilling(policy: CoverageJourneyPolicy, method: PaymentMethod, frequency: PaymentFrequency, annualPremium: number | null) {
  if (!isCoverageJourneyPolicy(policy) || !policy.payment.methods.some(m => m.method === method && m.frequencies.includes(frequency))) return { status: "unresolved" as const, amount: null, displayPrice: false };
  if (annualPremium === null) return { status: "unavailable" as const, amount: null, displayPrice: false };
  if (!finite(annualPremium)) return { status: "unresolved" as const, amount: null, displayPrice: false };
  const amount = Math.round((Math.max(0, annualPremium - policy.billing.annualCredit) * policy.billing.annualFactors[frequency] + policy.billing.feePerCollection[method] + Number.EPSILON) * 100) / 100;
  return Number.isFinite(amount) ? { status: "resolved" as const, amount, displayPrice: true } : { status: "unresolved" as const, amount: null, displayPrice: false };
}
