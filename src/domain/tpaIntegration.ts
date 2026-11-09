import type { ClientConfig } from "./configuration";

export const standardTpaLookupFields = ["first-name", "last-name", "birth-date"];
export type TpaResolution = { existingMember: boolean; activeCoverage: boolean };
export type TpaOutcome = { verifyIdentity: boolean; verified: boolean; portfolio: boolean; decision: "auto-approve" | "manual-review" };

/** Prototype API adapter. An unmatched record represents a new member. */
export function lookupPrototypeTpa(client: ClientConfig, values: Record<string, unknown>): TpaResolution {
  const fields = client.tpaIntegration?.lookupFields ?? standardTpaLookupFields;
  const records = client.tpaIntegration?.prototypeRecords ?? (client.features?.memberVerificationMatchFacts
    ? [{ facts: client.features.memberVerificationMatchFacts, activeCoverage: true }] : []);
  const record = records.find(({ facts }) => [...new Set([...fields, ...Object.keys(facts)])].every(field =>
    facts[field] !== undefined && String(values[field] ?? "").trim().toLowerCase() === facts[field].trim().toLowerCase()));
  return { existingMember: !!record, activeCoverage: record?.activeCoverage ?? false };
}

/** Approval and portfolio access are distinct outcomes; WAEPA never verifies identity. */
export function resolveTpaOutcome(client: ClientConfig, member: TpaResolution, identityPassed?: boolean): TpaOutcome {
  if (client.tpaIntegration?.mode === "membership-auto-approval") {
    return { verifyIdentity: false, verified: false, portfolio: false, decision: member.existingMember ? "manual-review" : "auto-approve" };
  }
  const eligible = member.existingMember && member.activeCoverage;
  const passed = eligible && identityPassed === true;
  return { verifyIdentity: eligible && identityPassed === undefined, verified: passed, portfolio: passed, decision: passed ? "auto-approve" : "manual-review" };
}

export function tpaOutcomeValues(member: TpaResolution, outcome: TpaOutcome) {
  return { "tpa-existing-member": member.existingMember, "tpa-active-coverage": member.activeCoverage,
    "tpa-verified": outcome.verified, "tpa-portfolio-enabled": outcome.portfolio, "tpa-submission-decision": outcome.decision };
}

/** Shared access gate for the portfolio and configured in-force amount deductions. */
export function canViewCoveragePortfolio(client: ClientConfig, values: Record<string, unknown>): boolean {
  return client.tpaIntegration?.mode === "coverage-verification"
    && values["tpa-existing-member"] === true
    && values["tpa-active-coverage"] === true
    && values["tpa-verified"] === true
    && values["tpa-portfolio-enabled"] === true;
}
