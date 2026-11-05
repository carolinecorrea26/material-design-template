import type { EffectiveSite } from "./effectiveSite";

export type BeneficiaryNotePolicy = { version: 1; notes: Array<{ productKeys: string[]; applicants: Array<"member" | "spouse">; text: string; sourceReferences: string[] }> };
export function isBeneficiaryNotePolicy(value: unknown): value is BeneficiaryNotePolicy {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const policy = value as BeneficiaryNotePolicy;
  const strings = (value: unknown): value is string[] => Array.isArray(value) && value.length > 0 && value.every(item => typeof item === "string" && item.trim()) && new Set(value).size === value.length;
  if (policy.version !== 1 || !Array.isArray(policy.notes) || !policy.notes.length || !policy.notes.every(note => note && strings(note.productKeys) && strings(note.applicants) && note.applicants.every(applicant => ["member", "spouse"].includes(applicant)) && typeof note.text === "string" && note.text.trim() && strings(note.sourceReferences))) return false;
  const assignments = policy.notes.flatMap(note => note.productKeys.flatMap(product => note.applicants.map(applicant => `${product}:${applicant}`)));
  return new Set(assignments).size === assignments.length;
}

/** Captured note copy and applicability stay independent of beneficiary rules. */
export function beneficiaryDesignationNote(site: EffectiveSite, productKey: string, applicant: string): string | null {
  const policies = site.configuration.beneficiaryNotePolicies;
  if (!policies.length) return null;
  if (policies.length !== 1 || !isBeneficiaryNotePolicy(policies[0].value)) throw new Error("No unique valid beneficiary note policy");
  return policies[0].value.notes.find(note => note.productKeys.includes(productKey) && note.applicants.some(value => value === applicant))?.text ?? null;
}
