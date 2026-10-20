import type { ApplicationMode } from "./coverageSelectionPolicy";

export type PolicyLookup = { policyId: string; ownerReference: string; siteKey: string; productKey: string; applicantKey: string; associationKey?: string };
export type VerifiedPolicy = PolicyLookup & {
  status: "active" | "lapsed"; amount: number; riders: string[];
  permittedChanges: Exclude<ApplicationMode, "new">[];
  billing: { method: string; frequency: string };
  effectiveDate: string; expiresAt: number;
};
export type PolicyVerification = { status: "verified"; policy: VerifiedPolicy; source: "mock" } | { status: "not-found" | "mismatch" | "inactive" | "expired" | "unavailable"; source: "mock" };
export interface PolicyVerificationService { verify(request: PolicyLookup): Promise<PolicyVerification> }

/** Explicit local fixtures, never a match against real policyholders. A boolean
 * supplied by a form is not part of this service's contract. */
export function createMockPolicyVerificationService(records: VerifiedPolicy[], now: () => number = Date.now): PolicyVerificationService {
  const policies = structuredClone(records);
  if (new Set(policies.map(p => p.policyId)).size !== policies.length || policies.some(p => !Number.isFinite(p.amount) || p.amount <= 0 || !Number.isFinite(p.expiresAt) || !/^\d{4}-\d{2}-\d{2}$/.test(p.effectiveDate) || !p.policyId.startsWith("mock-"))) throw new Error("Invalid mock policy fixture");
  return { async verify(request) {
    const record = policies.find(p => p.policyId === request.policyId);
    if (!record) return { status: "not-found", source: "mock" };
    if (["ownerReference", "siteKey", "productKey", "applicantKey", "associationKey"].some(k => record[k as keyof PolicyLookup] !== request[k as keyof PolicyLookup])) return { status: "mismatch", source: "mock" };
    if (record.status !== "active") return { status: "inactive", source: "mock" };
    if (record.expiresAt <= now()) return { status: "expired", source: "mock" };
    return { status: "verified", policy: structuredClone(record), source: "mock" };
  } };
}
export async function verifyExistingPolicy(service: PolicyVerificationService, request: PolicyLookup): Promise<PolicyVerification> {
  try { return await service.verify(request); } catch { return { status: "unavailable", source: "mock" }; }
}
