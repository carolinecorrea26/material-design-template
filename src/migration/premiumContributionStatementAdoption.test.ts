import { beforeAll, expect, it } from "vitest";
import { createReviewedMigrationDatabase } from "./fixtures";
import { applyPremiumContributionStatementAdoption } from "./premiumContributionStatementAdoption";
import { resolvePrototypeLibrary } from "../domain/prototypeLibrary";
import { isReviewPolicy } from "../domain/reviewPolicy";
import { composeReadAndSign } from "../config/reviewExperience";
import { reviewDefaults } from "../content/defaults/review";
import { validateMigrationDatabase } from "./integrity";
import type { DatabaseSchema } from "../persistence/types";
let db: DatabaseSchema;
beforeAll(() => { db = createReviewedMigrationDatabase(); }, 120000);
it("retains the common source statement and applies the explicit WAEPA GI exclusion while preserving ABE", () => {
  for (const site of ["abe", "ama", "asce", "avma", "csea", "nso", "isitrust", "waepa", "waepa-gi"]) {
    const policy = resolvePrototypeLibrary(db, site, "premium-statement").client.reviewPolicy!;
    const text = composeReadAndSign(reviewDefaults.readAndSignContent, null, undefined, true, undefined, policy.premiumContributionStatement);
    expect((text.match(/payment of a premium contribution/g) ?? []).length).toBe(site === "waepa-gi" ? 0 : 1);
    expect(text).toContain("AUTHORIZATION:"); expect(text).toContain("CONSENT:");
    if (site === "abe") expect(policy.premiumContributionStatement).toBeUndefined();
    else if (site === "waepa-gi") expect(policy.premiumContributionStatement).toBeNull();
    else expect(policy.premiumContributionStatement).toMatch(/^PLEASE READ CAREFULLY THE STATEMENTS BELOW/);
  }
  const copy = structuredClone(db); applyPremiumContributionStatementAdoption(copy); expect(copy).toEqual(db);
  expect(validateMigrationDatabase(db)).toEqual([]);
});
it("uses edited captured statements and rejects malformed values", () => {
  const before = resolvePrototypeLibrary(db, "waepa", "before"), copy = structuredClone(db);
  const row = copy.configurationValues.find(row => row.key === "waepa.review-policy")!;
  if (!isReviewPolicy(row.value)) throw new Error("Invalid fixture");
  expect(isReviewPolicy({ ...row.value, premiumContributionStatement: false })).toBe(false);
  expect(isReviewPolicy({ ...row.value, premiumContributionStatement: "" })).toBe(false);
  row.value.premiumContributionStatement = "Edited source statement";
  const after = resolvePrototypeLibrary(copy, "waepa", "after");
  const text = composeReadAndSign(reviewDefaults.readAndSignContent, null, undefined, true, undefined, after.client.reviewPolicy!.premiumContributionStatement);
  expect(text).toMatch(/^Edited source statement/); expect(text).not.toContain("payment of a premium contribution");
  expect(before.client.reviewPolicy!.premiumContributionStatement).toContain("payment of a premium contribution");
});
