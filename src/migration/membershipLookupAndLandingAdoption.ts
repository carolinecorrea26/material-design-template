import type { DatabaseSchema, Json } from "../persistence/types";
import { libraryMetadata } from "../domain/provenance";
import { currentMcrSource } from "./currentMcr";
export const membershipLookupDecisionKey = "business-decision.rules-review.ama-mock-lookup";
export const abeLandingNoticeDecisionKey = "business-decision.rules-review.abe-landing-notice";
export function applyMembershipLookupAndLandingAdoption(db: DatabaseSchema) {
  const authority = "User decisions October 20, 2026: add AMA mock lookup and ABE landing notice viewer; preserve ABE Review";
  const meta = (table: string, key: string) => ({ id: key, key, ...libraryMetadata(table, key, authority) });
  const source = String(currentMcrSource.cells.find(row => row.sheet === "Legal Disclosures" && row.cell === "A11")?.value ?? "").trim();
  if (!source.startsWith("Founded by the ABA in 1942")) throw new Error("ABE landing source changed");
  const upsert = <T extends { key: string }>(rows: T[], row: T) => { const i = rows.findIndex(value => value.key === row.key); if (i < 0) rows.push(row); else rows[i] = row; };
  for (const entry of [
    { site: "ama", path: "membershipLookup", key: membershipLookupDecisionKey, value: { provider: "ama-mock", title: "AMA record lookup" }, sources: ["Main!R118", "Main!R119"], interpretation: "Lookup on Membership continuation uses the applicant's shared name and DOB; the lookup dialog supplies DOB up front and carries it to standardized Eligibility. Persist synthetic Medical Education Number and membership result with the application. No match permits non-member entry. Real AMA integration and detailed XML remain flagged requirements outside this mock implementation." },
    { site: "abe", path: "landingNotice", key: abeLandingNoticeDecisionKey, value: { title: "ABE dividend information", text: source.replace(/\+A16\b/g, "") }, sources: ["Legal Disclosures!A11", "Legal Disclosures!B11", "Legal Disclosures!C11"], interpretation: "Display the source dividend notice in an accessible landing dialog after Apply Now/Start/New Application, with Cancel and Continue. Do not add an acknowledgement or change ABE Review. Remove only the stray +A16 spreadsheet-reference artifact from display; preserve raw source evidence." },
  ]) {
    const configurationKey = `shared.applicantExperience.${entry.path}`, key = `${entry.site}.${entry.path}`;
    upsert(db.configurationDefinitions, { ...meta("configurationDefinitions", configurationKey), position: 0, definition: { path: ["applicantExperience", entry.path], metadata: { reusable: true, assignmentRequired: true }, target: null } });
    upsert(db.configurationValues, { ...meta("configurationValues", key), position: 0, configurationKey, scope: "site", siteKey: entry.site, clientKey: null, value: entry.value as unknown as Json });
    upsert(db.semanticRequirements, { ...meta("semanticRequirements", entry.key), domain: "approved-business-decision", subjectTable: "sites", subjectKey: entry.site, predicate: entry.path, status: "documented", value: {
      authority, approvalStatus: "approved", sourceReconciliation: "approved-new-template-interpretation", runtimeActivation: "reviewed-seed", sourceReferences: entry.sources, interpretation: entry.interpretation,
      owners: [{ table: "configurationValues", key, column: "value", reviewedValue: entry.value }], destinations: [{ table: "configurationValues", key, column: "value" }],
      ...(entry.site === "ama" ? { productionIntegration: { status: "flagged-requirement", completionBlocking: false, missing: ["AMA API contract and credentials", "Approved data mapping", "Full XML work remains in the separate deferred scope"] } } : {}),
    } as unknown as Json });
  }
}
