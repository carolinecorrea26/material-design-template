import { isProfileFinancialCalculations, type ProfileFinancialCalculations } from './profileFinancialCalculations';
import contactDefinition from '../../requirements/parked/contact.json';
import type { FieldDefinition } from "./fields";

/** Site-owned collection/presentation choices, persisted as Library configuration. */
export type ApplicantExperience = {
  /** Shared contact behavior; absent flags preserve the template defaults. */
  contact?: { hideBusinessAddress?: boolean; hideCorrespondence?: boolean; businessAddressProducts?: string[] };
  membershipLookup?: { provider: "ama-mock"; title: string };
  landingNotice?: { title: string; text: string };
  physicianInformation?: boolean;
  otherCoverageInformation?: boolean;
  profile?: { financialCalculations?: ProfileFinancialCalculations; lifeReplacementNotice?: { jurisdictions: string[]; text: string; fontSizePt: number; bold: boolean } };
  /** Calculation sources replace generated applicant questions. */
  factSources?: Record<string, { value: string | number } | { field: string; divisor: number }>;
  factMappings?: Record<string, { field: string; values: Record<string, string> }>;
  eligibleStatesOnly?: boolean;
  eligibleStates?: string[];
  coveredPeople?: Array<'self' | 'spouse' | 'child'>;
  childEligibility?: { mode: 'details' | 'notice-only'; note?: string };
  payment?: { allowSharedMethod?: boolean; allowSharedFrequency?: boolean };
  eligibilityDisqualifications?: Array<{ applicant: "member" | "spouse" | "child"; fieldId: string; value: string; message: string }>;
  membershipDisqualifications?: Array<{ fieldId: string; value: string; message: string }>;
};

export function filterEligibleStateOptions(field: FieldDefinition, experience: ApplicantExperience | undefined): FieldDefinition {
  if (!experience?.eligibleStatesOnly || !["state-province", "state", "business-state", "mailing-state"].includes(field.id) || !field.options) return field;
  return { ...field, options: field.options.filter(option => experience.eligibleStates?.includes(option.value.replace(/^US-/, ""))) };
}

export function isApplicantExperience(value: unknown): value is ApplicantExperience {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const v = value as ApplicantExperience;
  if (v.otherCoverageInformation !== undefined && typeof v.otherCoverageInformation !== 'boolean') return false;
  if (v.physicianInformation !== undefined && typeof v.physicianInformation !== 'boolean') return false;
  if (v.coveredPeople !== undefined && (!Array.isArray(v.coveredPeople) || !v.coveredPeople.includes('self') || new Set(v.coveredPeople).size !== v.coveredPeople.length || v.coveredPeople.some(person => !['self', 'spouse', 'child'].includes(person)))) return false;
  if (v.factSources !== undefined && (!v.factSources || typeof v.factSources !== 'object' || Array.isArray(v.factSources) || !Object.values(v.factSources).every(source => source && typeof source === 'object' && ('value' in source ? typeof source.value === 'string' || typeof source.value === 'number' && Number.isFinite(source.value) : typeof source.field === 'string' && !!source.field.trim() && Number.isFinite(source.divisor) && source.divisor > 0)))) return false;
  if (v.contact !== undefined && (!v.contact || typeof v.contact !== 'object' || Array.isArray(v.contact) ||
    [v.contact.hideBusinessAddress, v.contact.hideCorrespondence].some(flag => flag !== undefined && typeof flag !== 'boolean'))) return false;
  if (v.contact?.businessAddressProducts !== undefined && (!Array.isArray(v.contact.businessAddressProducts) || v.contact.businessAddressProducts.some(key => typeof key !== 'string' || !key.trim()) || new Set(v.contact.businessAddressProducts).size !== v.contact.businessAddressProducts.length)) return false;
  if (v.membershipLookup !== undefined && (!v.membershipLookup || typeof v.membershipLookup !== "object" || Array.isArray(v.membershipLookup) || v.membershipLookup.provider !== "ama-mock" || typeof v.membershipLookup.title !== "string" || !v.membershipLookup.title.trim())) return false;
  if (v.landingNotice !== undefined && (!v.landingNotice || typeof v.landingNotice !== "object" || Array.isArray(v.landingNotice) || [v.landingNotice.title, v.landingNotice.text].some(text => typeof text !== "string" || !text.trim()))) return false;
  if (v.profile !== undefined) {
    if (!v.profile || typeof v.profile !== "object" || Array.isArray(v.profile)) return false;
    if (v.profile.financialCalculations !== undefined && !isProfileFinancialCalculations(v.profile.financialCalculations)) return false;
    const notice = v.profile.lifeReplacementNotice;
    if (notice !== undefined && (!notice || typeof notice !== "object" || Array.isArray(notice) || !Array.isArray(notice.jurisdictions) || !notice.jurisdictions.length || notice.jurisdictions.some(state => typeof state !== "string" || !/^[A-Z]{2}$/.test(state)) || typeof notice.text !== "string" || !notice.text.trim() || !Number.isFinite(notice.fontSizePt) || notice.fontSizePt <= 0 || typeof notice.bold !== "boolean")) return false;
  }
  if (v.membershipDisqualifications !== undefined && (
    !Array.isArray(v.membershipDisqualifications) ||
    !v.membershipDisqualifications.every(rule => rule && typeof rule === 'object' && !Array.isArray(rule) &&
      typeof rule.fieldId === 'string' && !!rule.fieldId.trim() &&
      typeof rule.value === 'string' && !!rule.value.trim() &&
      typeof rule.message === 'string' && !!rule.message.trim())
  )) return false;
  if (v.eligibilityDisqualifications !== undefined && (!Array.isArray(v.eligibilityDisqualifications) || !v.eligibilityDisqualifications.every(rule => rule && typeof rule === "object" && !Array.isArray(rule) && ["member", "spouse", "child"].includes(rule.applicant) && [rule.fieldId, rule.value, rule.message].every(text => typeof text === "string" && !!text.trim())))) return false;
  if (v.payment !== undefined && (!v.payment || typeof v.payment !== "object" || Array.isArray(v.payment) || [v.payment.allowSharedMethod, v.payment.allowSharedFrequency].some(flag => flag !== undefined && typeof flag !== "boolean"))) return false;
  return (v.factMappings === undefined || Object.values(v.factMappings).every(m => typeof m.field === "string" && m.values && typeof m.values === "object" && Object.values(m.values).every(x => typeof x === "string"))) && (v.eligibleStatesOnly === undefined || typeof v.eligibleStatesOnly === 'boolean') && (v.eligibleStates === undefined || Array.isArray(v.eligibleStates) && v.eligibleStates.every(s => /^[A-Z]{2}$/.test(s)) && new Set(v.eligibleStates).size === v.eligibleStates.length) && (!v.eligibleStatesOnly || !!v.eligibleStates?.length) && (v.childEligibility === undefined || ['details', 'notice-only'].includes(v.childEligibility.mode) && (v.childEligibility.note === undefined || typeof v.childEligibility.note === 'string' && !!v.childEligibility.note.trim()));
}

/** Evaluate the installed Site's rules independently of product selections. */
export function membershipIneligibilityMessage(experience: ApplicantExperience | undefined, values: Record<string, unknown>): string | undefined {
  return experience?.membershipDisqualifications?.find(rule => values[rule.fieldId] === rule.value)?.message;
}

/** Used by field collection/validation and the Contact renderer. No Site-name branch. */
export function isContactFieldAvailable(experience: ApplicantExperience | undefined, fieldId: string, selectedProductKeys: string[] = []): boolean {
  if ((experience?.contact?.hideCorrespondence || businessAddressHidden(experience, selectedProductKeys)) && fieldId === "correspondence-to") return false;
  return !(businessAddressHidden(experience, selectedProductKeys) && fieldId.startsWith("business-"));
}

function businessAddressHidden(experience: ApplicantExperience | undefined, selectedProductKeys: string[]) {
  const products = experience?.contact?.businessAddressProducts;
  return !!experience?.contact?.hideBusinessAddress && !products?.some(key => selectedProductKeys.includes(key));
}

export function showContactBusinessSection(experience: ApplicantExperience | undefined, hasDisabilityOrOverhead: boolean, correspondenceTo: unknown, selectedProductKeys: string[] = []): boolean {
  const scope = experience?.contact?.businessAddressProducts;
  const automatic = scope?.length ? scope.some(key => selectedProductKeys.includes(key)) : hasDisabilityOrOverhead;
  return !businessAddressHidden(experience, selectedProductKeys) && (automatic || !experience?.contact?.hideCorrespondence && correspondenceTo === contactDefinition.businessPolicy.businessCorrespondenceValue);
}

/** Only active applicant sections participate; retained hidden answers do not block. */
export function eligibilityIneligibilityMessage(experience: ApplicantExperience | undefined, values: Record<string, unknown>): string | undefined {
  const active = new Set(["member", ...(Array.isArray(values.dependents) ? values.dependents.map(String) : [])]);
  return experience?.eligibilityDisqualifications?.find(rule => active.has(rule.applicant) && (rule.applicant === 'child'
    ? experience.childEligibility?.mode !== 'notice-only' && Array.isArray(values.children) && values.children.some(child => child && typeof child === 'object' && !Array.isArray(child) && child[rule.fieldId] === rule.value)
    : values[rule.fieldId] === rule.value))?.message;
}

/** Global Contact policy; effective product assignments determine selected categories. */
export const contactEmployerCoverageCategories: readonly string[] = contactDefinition.businessPolicy.employerCoverageCategories;
export const contactHiddenCorrespondenceValue = contactDefinition.businessPolicy.hiddenCorrespondenceValue;
