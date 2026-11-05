import { beforeAll, expect, it } from "vitest";
import { createReviewedMigrationDatabase } from "./fixtures";
import { applySupplementalHealthReviewAdoption, supplementalHealthReviewPrefix } from "./supplementalHealthReviewAdoption";
import { activeReviewBlocks, isReviewPolicy } from "../domain/reviewPolicy";
import { resolveEffectiveSite } from "../domain/effectiveSite";
import { validateMigrationDatabase } from "./integrity";
import type { DatabaseSchema } from "../persistence/types";

let db: DatabaseSchema;
beforeAll(() => { db = createReviewedMigrationDatabase(); }, 120000);
it("displays the shared HI/CI attestation before signature and preserves ABE's separately approved inline placement", () => {
  const reviews = db.semanticRequirements.filter(row => row.key.startsWith(`${supplementalHealthReviewPrefix}.`));
  expect(reviews.map(row => row.subjectKey).sort()).toEqual(["ama", "avma", "isitrust"]);
  for (const review of reviews) {
    const site = resolveEffectiveSite(db, review.subjectKey), policy = site.configuration.reviewPolicies[0].value;
    if (!isReviewPolicy(policy)) throw new Error("Invalid fixture policy");
    const block = policy.blocks.find(block => block.key === "supplemental-health-attestation")!;
    expect(block).toMatchObject({ placement: "before-signature", fontSizePt: 14, fields: [] });
    expect(block.paragraphs.join(" ").startsWith("For All Supplemental Health Products Applied For:")).toBe(review.subjectKey !== "ama");
    for (const product of block.when!.products!) expect(activeReviewBlocks(policy, [{ productKey: product, category: "SH", applicants: ["member"] }])).toContain(block);
    expect(activeReviewBlocks(policy, [{ productKey: "li-group-term", category: "LI", applicants: ["member"] }])).not.toContain(block);
  }
  const abe = resolveEffectiveSite(db, "abe").configuration.reviewPolicies[0].value;
  expect(isReviewPolicy(abe) && abe.blocks.find(block => block.key === "supplemental-health-attestation")?.placement).toBe("read-and-sign-appendix");
  const copy = structuredClone(db); applySupplementalHealthReviewAdoption(copy); expect(copy).toEqual(db);
  expect(validateMigrationDatabase(db)).toEqual([]);
});
