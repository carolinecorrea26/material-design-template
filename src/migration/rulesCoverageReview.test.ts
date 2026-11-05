import { existsSync, writeFileSync } from "node:fs";
import { beforeAll, expect, it } from "vitest";
import { createReviewedMigrationDatabase } from "./fixtures";
import { addRulesCoverageReview } from "./rulesCoverageReview";
import { requirementCoverageRows, requirementCoverageDomain } from "../domain/requirementCoverage";
import { mcrSource } from "./mcr";
import type { DatabaseSchema } from "../persistence/types";

let db: DatabaseSchema;
beforeAll(() => { db = createReviewedMigrationDatabase(); }, 120000);
it("keeps atomic source/owner/evidence links distinct from whole-rule or whole-cell completion", () => {
  const rows = requirementCoverageRows(JSON.parse(JSON.stringify(db)));
  expect(rows).toHaveLength(22);
  expect(rows.filter(row => row.status === "verified")).toHaveLength(19);
  expect(rows.filter(row => row.status === "accepted-exception")).toHaveLength(3);
  for (const row of rows) {
    for (const owner of row.owners) expect((db[owner.table as keyof DatabaseSchema] as Array<{ key: string }>).some(record => record.key === owner.key), `${row.id}: ${owner.table}/${owner.key}`).toBe(true);
    for (const source of row.sourceReferences.filter(reference => !reference.startsWith("User decision"))) expect(mcrSource.cells.some(cell => `${cell.sheet}!${cell.cell}` === source), source).toBe(true);
    for (const reference of [...row.implementationReferences, ...row.verificationReferences]) expect(existsSync(reference), reference).toBe(true);
    for (const ruleKey of row.ruleKeys) expect(db.rules.some(rule => rule.key === ruleKey), ruleKey).toBe(true);
  }
  expect(requirementCoverageRows(db, "ama").every(row => row.siteKey === "ama")).toBe(true);
  const repeated = structuredClone(db); addRulesCoverageReview(repeated);
  expect(repeated.semanticRequirements.filter(row => row.domain === requirementCoverageDomain)).toEqual(db.semanticRequirements.filter(row => row.domain === requirementCoverageDomain));
  if (process.env.RULE_COVERAGE_EXPORT_PATH) writeFileSync(process.env.RULE_COVERAGE_EXPORT_PATH, JSON.stringify({ reviewedOn: "2026-10-20", boundary: "Atomic requirements reviewed in this batch only; other rules and instructions remain open.", requirements: rows }, null, 2) + "\n");
});
it("records the GI decision without adding C125 fields or a new employer entry gate", () => {
  const gi = requirementCoverageRows(db, "waepa-gi");
  expect(gi.filter(row => row.status === "accepted-exception")).toHaveLength(3);
  expect(db.siteFieldConfigurations.filter(row => row.siteKey === "waepa-gi" && ["waepa-employer", "waepa-start-date", "waepa-declaration"].includes(row.fieldKey))).toEqual([]);
  expect(db.siteFieldConfigurations.filter(row => row.siteKey === "waepa-gi" && row.fieldKey === "membership")).toEqual([]);
  const malformed = structuredClone(db);
  const review = malformed.semanticRequirements.find(row => row.domain === requirementCoverageDomain)!;
  Object.assign(review.value as object, { status: "verified", verificationReferences: [] });
  expect(() => requirementCoverageRows(malformed)).toThrow("Invalid requirement coverage record");
});
it("invalidates verified status after an owner changes and preserves verification across JSON key order", () => {
  const changed = structuredClone(db);
  const constraint = changed.eligibilityConstraints.find(row => row.siteKey === "abe" && row.productKey === "di-ltd" && row.applicantTypeKey === "member")!;
  constraint.minimumWorkHours = 40;
  expect(requirementCoverageRows(changed, "abe").find(row => row.productKey === "di-ltd")?.status).toBe("review-pending");
  expect(requirementCoverageRows(changed, "nso").every(row => row.status === "verified")).toBe(true);
  const original = changed.configurationValues.find(row => row.key === "ama.applicant-category-eligibility")!;
  original.value = Object.fromEntries(Object.entries(original.value as object).reverse()) as typeof original.value;
  expect(requirementCoverageRows(changed, "ama").find(row => row.id.endsWith("membership-category-eligibility"))?.status).toBe("verified");
});
