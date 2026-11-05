import { afterEach, beforeAll, expect, it } from "vitest";
import { createReviewedMigrationDatabase } from "./fixtures";
import { recordIsitrustStdHealthDecision, isitrustStdHealthDecisionKey } from "./isitrustStdHealthDecision";
import { installPrototypeLibrary, resolvePrototypeLibrary } from "../domain/prototypeLibrary";
import { resolveJourneyUnderwriting } from "../domain/coverageJourney";
import { resolveFlowGate } from "../config/flowGates";
import type { DatabaseSchema } from "../persistence/types";
let db: DatabaseSchema;
beforeAll(() => { db = createReviewedMigrationDatabase(); }, 120000);
afterEach(() => installPrototypeLibrary(null));
it("retains the native STD GI/no-question exception and its conflicting source/revisit evidence", () => {
  const library = resolvePrototypeLibrary(db, "isitrust", "accepted-STD-exception"); installPrototypeLibrary(library);
  expect(resolveJourneyUnderwriting(library.site, "di-short-term", "member", 40, 1000)).toMatchObject({ status: "resolved", pathway: "GI" });
  const values = { membership: "akron-bar-association", "birth-date": "1986-01-01", coverageSelections: ["di-short-term"], productApplicants: { "di-short-term": ["member"] }, coverageAmounts: { "di-short-term:member": 1000 } };
  for (const page of ["health-si", "health-li", "health-di", "health-qd"] as const) expect(resolveFlowGate(page, values, library.products)).toBe(false);
  expect(db.semanticRequirements.find(row => row.key === isitrustStdHealthDecisionKey)?.value).toMatchObject({ approvalStatus: "approved-provisional-exception", sourceReconciliation: "accepted-provisional-exception", sourceReferences: expect.arrayContaining(["Main!AA281"]), revisitTrigger: expect.any(String) });
  const repeated = structuredClone(db); recordIsitrustStdHealthDecision(repeated); expect(repeated).toEqual(db);
});
