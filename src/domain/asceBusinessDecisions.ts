import type { DatabaseSchema, Json } from "../persistence/types";
import { libraryMetadata } from "../domain/provenance";
import { normalizeSiteReferences } from './siteIdentity.mjs';

// Explicit user-approved requirements, separate from MCR extraction and runtime authoring.
// Versioned approval evidence is transcribed in the linked decision register.
const register = "docs/asce-business-decisions.md";
const siteKey = "asce";
const approval = {
  approvalStatus: "approved",
  authority: "User approval in the ASCE business-decisions conversation",
  approvalReference: `${register}#approval-evidence`,
  runtimeActivation: "pending-phase-6",
};
type Target = { table: "eligibilityConstraints" | "underwritingBands"; key: string; values: Record<string, Json> };
type Decision = { key: string; answer: string; targets: Target[] };
function eligibility(productKey: string, maximumAgeYears: number): Decision {
  return {
    key: `${siteKey}.${productKey}.base-eligibility-ages`,
    answer: `Member and spouse eligibility ages 18–${maximumAgeYears}, inclusive.`,
    targets: ["member", "spouse"].map(applicantTypeKey => ({
      table: "eligibilityConstraints", key: `${siteKey}.${productKey}.approved-eligibility.${applicantTypeKey}`,
      values: { siteKey, productKey, applicantTypeKey, minimumAgeDays: null, minimumAgeYears: 18,
        maximumAgeYears, studentMaximumAgeYears: null, unmarried: null, minimumWorkHours: null },
    })),
  };
}
function underwriting(productKey: string, index: number, applicantTypeKey: string, minimumAge: number, maximumAge: number): Decision {
  return {
    key: `${siteKey}.${productKey}.underwriting.${index}`,
    answer: `${applicantTypeKey} ages ${minimumAge}–${maximumAge}: FUW = Fully Underwritten / normal underwriting process.`,
    targets: [{ table: "underwritingBands", key: `${siteKey}.${productKey}.${index}`,
      values: { siteKey, productKey, applicantTypeKey, pathway: "FUW", minimumAge, maximumAge,
        minimumAmount: 100000, maximumAmount: 2000000, minimumAmountExclusive: false,
        applicantClass: null, mortalityMorbidity: null, conditionKey: null, status: "documented" } }],
  };
}
export const asceBusinessDecisions: readonly Decision[] = [
  eligibility("li-10yr", 69), eligibility("li-20yr", 59),
  underwriting("li-10yr", 3, "member", 65, 69), underwriting("li-10yr", 7, "spouse", 65, 69),
  underwriting("li-20yr", 2, "member", 55, 59), underwriting("li-20yr", 5, "spouse", 55, 59),
];
const approvalKey = (decision: Decision) => `business-decision.${decision.key}`;
export const reference = (decision: Decision) => `${register}#${decision.key}`;
export function decisionRecord(decision: Decision) {
  const key = approvalKey(decision);
  return { id: key, key, ...libraryMetadata("semanticRequirements", key, reference(decision)),
    domain: "approved-business-decision", subjectTable: "sites", subjectKey: siteKey,
    predicate: "approved-canonical-site-rule", status: "documented",
    value: { ...approval, readinessKey: decision.key, answer: decision.answer, targets: decision.targets } as unknown as Json };
}

/** Accept the exact previously approved record through the known Site rename.
 * Its source reference and display ID remain evidence of the original identity.
 */
function legacyDecision(decision: Decision): Decision {
  const key = (value: string) => value.replace(/^asce\./, 'asce-default.');
  return { ...decision, key: key(decision.key), targets: decision.targets.map(target => ({ ...target, key: key(target.key), values: { ...target.values, siteKey: 'asce-default' } })) };
}
function legacyDecisionRecord(decision: Decision) {
  const old = legacyDecision(decision);
  return normalizeSiteReferences({ ...decisionRecord(old), subjectKey: 'asce-default' });
}

// Order-independent comparison also works after PostgreSQL JSONB round trips.
function equal(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (!a || !b || typeof a !== "object" || typeof b !== "object") return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  const left = a as Record<string, unknown>, right = b as Record<string, unknown>;
  return Object.keys(left).length === Object.keys(right).length && Object.keys(left).every(key => Object.hasOwn(right, key) && equal(left[key], right[key]));
}

/** Shared approval validation: approval AND exact persisted rule are required.
 * This never evaluates an applicant or returns runtime configuration.
 */
export function inspectAsceBusinessDecisions(db: Pick<DatabaseSchema, "semanticRequirements" | "eligibilityConstraints" | "underwritingBands">) {
  return asceBusinessDecisions.map(decision => {
    const evidence = db.semanticRequirements.filter(row => row.key === approvalKey(decision));
    const validEvidence = evidence.length === 1 && (equal(evidence[0], decisionRecord(decision)) || equal(evidence[0], legacyDecisionRecord(decision)));
    const validTargets = decision.targets.every(target => {
      const rows = (db[target.table] as unknown as Array<Record<string, unknown>>).filter(row => row.key === target.key);
      const expected = { id: target.key, key: target.key, ...target.values, ...libraryMetadata(target.table, target.key, reference(decision)) };
      const old = legacyDecision(decision);
      const oldTarget = old.targets.find(item => item.key === target.key.replace(/^asce\./, 'asce-default.'))!;
      const legacyExpected = normalizeSiteReferences({ id: oldTarget.key, key: oldTarget.key, ...oldTarget.values, ...libraryMetadata(oldTarget.table, oldTarget.key, reference(old)) });
      return rows.length === 1 && (equal(rows[0], expected) || equal(rows[0], legacyExpected));
    });
    return { key: decision.key, siteKey, source: reference(decision), approved: validEvidence && validTargets,
      reason: !validEvidence ? "Approved business decision evidence is missing or changed."
        : !validTargets ? "Canonical rule is missing or differs from the approved business decision." : "Approved canonical rule and decision evidence match." };
  });
}
