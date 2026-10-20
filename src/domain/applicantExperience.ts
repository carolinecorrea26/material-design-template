/** Site-owned collection/presentation choices, persisted as Library configuration. */
export type ApplicantExperience = {
  /** Shared contact behavior; absent flags preserve the template defaults. */
  contact?: { hideBusinessAddress?: boolean; hideCorrespondence?: boolean };
  factMappings?: Record<string, { field: string; values: Record<string, string> }>;
  eligibleStatesOnly?: boolean;
  eligibleStates?: string[];
  childEligibility?: { mode: 'details' | 'notice-only'; note: string };
  payment?: { allowSharedMethod?: boolean; allowSharedFrequency?: boolean };
  membershipDisqualifications?: Array<{ fieldId: string; value: string; message: string }>;
};
export function isApplicantExperience(value: unknown): value is ApplicantExperience {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const v = value as ApplicantExperience;
  if (v.contact !== undefined && (!v.contact || typeof v.contact !== 'object' || Array.isArray(v.contact) ||
    [v.contact.hideBusinessAddress, v.contact.hideCorrespondence].some(flag => flag !== undefined && typeof flag !== 'boolean'))) return false;
  if (v.membershipDisqualifications !== undefined && (
    !Array.isArray(v.membershipDisqualifications) ||
    !v.membershipDisqualifications.every(rule => rule && typeof rule === 'object' && !Array.isArray(rule) &&
      typeof rule.fieldId === 'string' && !!rule.fieldId.trim() &&
      typeof rule.value === 'string' && !!rule.value.trim() &&
      typeof rule.message === 'string' && !!rule.message.trim())
  )) return false;
  if (v.payment !== undefined && (!v.payment || typeof v.payment !== "object" || Array.isArray(v.payment) || [v.payment.allowSharedMethod, v.payment.allowSharedFrequency].some(flag => flag !== undefined && typeof flag !== "boolean"))) return false;
  return (v.factMappings === undefined || Object.values(v.factMappings).every(m => typeof m.field === "string" && m.values && typeof m.values === "object" && Object.values(m.values).every(x => typeof x === "string"))) && (v.eligibleStatesOnly === undefined || typeof v.eligibleStatesOnly === 'boolean') && (v.eligibleStates === undefined || Array.isArray(v.eligibleStates) && v.eligibleStates.every(s => /^[A-Z]{2}$/.test(s)) && new Set(v.eligibleStates).size === v.eligibleStates.length) && (!v.eligibleStatesOnly || !!v.eligibleStates?.length) && (v.childEligibility === undefined || ['details', 'notice-only'].includes(v.childEligibility.mode) && typeof v.childEligibility.note === 'string' && !!v.childEligibility.note.trim());
}

/** Evaluate the installed Site's rules independently of product selections. */
export function membershipIneligibilityMessage(experience: ApplicantExperience | undefined, values: Record<string, unknown>): string | undefined {
  return experience?.membershipDisqualifications?.find(rule => values[rule.fieldId] === rule.value)?.message;
}

/** Used by field collection/validation and the Contact renderer. No Site-name branch. */
export function isContactFieldAvailable(experience: ApplicantExperience | undefined, fieldId: string): boolean {
  if (experience?.contact?.hideCorrespondence && fieldId === "correspondence-to") return false;
  return !(experience?.contact?.hideBusinessAddress && fieldId.startsWith("business-"));
}

export function showContactBusinessSection(experience: ApplicantExperience | undefined, hasDisabilityOrOverhead: boolean, correspondenceTo: unknown): boolean {
  return !experience?.contact?.hideBusinessAddress && (hasDisabilityOrOverhead || correspondenceTo === "business");
}
