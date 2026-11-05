/** Site-owned collection/presentation choices, persisted as Library configuration. */
export type ApplicantExperience = {
  /** Shared contact behavior; absent flags preserve the template defaults. */
  contact?: { hideBusinessAddress?: boolean; hideCorrespondence?: boolean; businessAddressProducts?: string[] };
  membershipLookup?: { provider: "ama-mock"; title: string };
  landingNotice?: { title: string; text: string };
  profile?: { lifeReplacementNotice?: { jurisdictions: string[]; text: string; fontSizePt: number; bold: boolean } };
  /** Calculation sources replace generated applicant questions. */
  factSources?: Record<string, { value: string | number } | { field: string; divisor: number }>;
  factMappings?: Record<string, { field: string; values: Record<string, string> }>;
  eligibleStatesOnly?: boolean;
  eligibleStates?: string[];
  childEligibility?: { mode: 'details' | 'notice-only'; note: string };
  payment?: { allowSharedMethod?: boolean; allowSharedFrequency?: boolean };
  eligibilityDisqualifications?: Array<{ applicant: "member" | "spouse" | "child"; fieldId: string; value: string; message: string }>;
  membershipDisqualifications?: Array<{ fieldId: string; value: string; message: string }>;
};
export function isApplicantExperience(value: unknown): value is ApplicantExperience {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const v = value as ApplicantExperience;
  if (v.factSources !== undefined && (!v.factSources || typeof v.factSources !== 'object' || Array.isArray(v.factSources) || !Object.values(v.factSources).every(source => source && typeof source === 'object' && ('value' in source ? typeof source.value === 'string' || typeof source.value === 'number' && Number.isFinite(source.value) : typeof source.field === 'string' && !!source.field.trim() && Number.isFinite(source.divisor) && source.divisor > 0)))) return false;
  if (v.contact !== undefined && (!v.contact || typeof v.contact !== 'object' || Array.isArray(v.contact) ||
    [v.contact.hideBusinessAddress, v.contact.hideCorrespondence].some(flag => flag !== undefined && typeof flag !== 'boolean'))) return false;
  if (v.contact?.businessAddressProducts !== undefined && (!Array.isArray(v.contact.businessAddressProducts) || !v.contact.businessAddressProducts.length || v.contact.businessAddressProducts.some(key => typeof key !== 'string' || !key.trim()) || new Set(v.contact.businessAddressProducts).size !== v.contact.businessAddressProducts.length)) return false;
  if (v.membershipLookup !== undefined && (!v.membershipLookup || typeof v.membershipLookup !== "object" || Array.isArray(v.membershipLookup) || v.membershipLookup.provider !== "ama-mock" || typeof v.membershipLookup.title !== "string" || !v.membershipLookup.title.trim())) return false;
  if (v.landingNotice !== undefined && (!v.landingNotice || typeof v.landingNotice !== "object" || Array.isArray(v.landingNotice) || [v.landingNotice.title, v.landingNotice.text].some(text => typeof text !== "string" || !text.trim()))) return false;
  if (v.profile !== undefined) {
    if (!v.profile || typeof v.profile !== "object" || Array.isArray(v.profile)) return false;
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
  return (v.factMappings === undefined || Object.values(v.factMappings).every(m => typeof m.field === "string" && m.values && typeof m.values === "object" && Object.values(m.values).every(x => typeof x === "string"))) && (v.eligibleStatesOnly === undefined || typeof v.eligibleStatesOnly === 'boolean') && (v.eligibleStates === undefined || Array.isArray(v.eligibleStates) && v.eligibleStates.every(s => /^[A-Z]{2}$/.test(s)) && new Set(v.eligibleStates).size === v.eligibleStates.length) && (!v.eligibleStatesOnly || !!v.eligibleStates?.length) && (v.childEligibility === undefined || ['details', 'notice-only'].includes(v.childEligibility.mode) && typeof v.childEligibility.note === 'string' && !!v.childEligibility.note.trim());
}

/** Evaluate the installed Site's rules independently of product selections. */
export function membershipIneligibilityMessage(experience: ApplicantExperience | undefined, values: Record<string, unknown>): string | undefined {
  return experience?.membershipDisqualifications?.find(rule => values[rule.fieldId] === rule.value)?.message;
}

/** Used by field collection/validation and the Contact renderer. No Site-name branch. */
export function isContactFieldAvailable(experience: ApplicantExperience | undefined, fieldId: string, selectedProductKeys: string[] = []): boolean {
  if (experience?.contact?.hideCorrespondence && fieldId === "correspondence-to") return false;
  return !(businessAddressHidden(experience, selectedProductKeys) && fieldId.startsWith("business-"));
}

function businessAddressHidden(experience: ApplicantExperience | undefined, selectedProductKeys: string[]) {
  const products = experience?.contact?.businessAddressProducts;
  if (products) return !products.some(key => selectedProductKeys.includes(key));
  return !!experience?.contact?.hideBusinessAddress;
}

export function showContactBusinessSection(experience: ApplicantExperience | undefined, hasDisabilityOrOverhead: boolean, correspondenceTo: unknown, selectedProductKeys: string[] = []): boolean {
  const scopedProduct = experience?.contact?.businessAddressProducts?.some(key => selectedProductKeys.includes(key));
  return !businessAddressHidden(experience, selectedProductKeys) && (scopedProduct || hasDisabilityOrOverhead || correspondenceTo === "business");
}

/** Only active applicant sections participate; retained hidden answers do not block. */
export function eligibilityIneligibilityMessage(experience: ApplicantExperience | undefined, values: Record<string, unknown>): string | undefined {
  const active = new Set(["member", ...(Array.isArray(values.dependents) ? values.dependents.map(String) : [])]);
  return experience?.eligibilityDisqualifications?.find(rule => active.has(rule.applicant) && values[rule.fieldId] === rule.value)?.message;
}
