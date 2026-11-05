import { beforeAll, expect, it } from "vitest";
import { createReviewedMigrationDatabase } from "./fixtures";
import { activeSiteMainRows } from "./activeSiteIdentity";
import { parseUnqualifiedAge } from "./activeSiteEligibilityAdoption";
import { currentMcrSource } from "./currentMcr";
import { resolveEffectiveSite, resolveEffectiveEligibility, type EligibilityFacts } from "../domain/effectiveSite";
import type { DatabaseSchema } from "../persistence/types";
let db: DatabaseSchema;
beforeAll(() => { db = createReviewedMigrationDatabase(); }, 120000);
it("compares every complete source age range with native bounds and evaluates inclusive boundaries with other facts supplied", () => {
  let reviewed = 0;
  const pending: string[] = [];
  for (const [siteKey, products] of Object.entries(activeSiteMainRows)) {
    const site = resolveEffectiveSite(db, siteKey);
    for (const [productKey, row] of Object.entries(products)) for (const [applicant, column] of [["member", "O"], ["spouse", "P"], ["child", "Q"]] as const) {
      if (siteKey === "asce" && ["li-10yr", "li-20yr"].includes(productKey) && applicant !== "child") continue;
      if (!db.siteProductApplicants.some(row => row.siteKey === siteKey && row.productKey === productKey && row.applicantKey === applicant)) continue;
      const source = `Main!${column}${row}`;
      const ages = parseUnqualifiedAge(String(currentMcrSource.cells.find(cell => cell.sheet === "Main" && cell.cell === `${column}${row}`)?.value ?? ""));
      if (!ages) continue;
      const constraints = db.eligibilityConstraints.filter(row => row.siteKey === siteKey && row.productKey === productKey && row.applicantTypeKey === applicant);
      expect(constraints).toHaveLength(1);
      const c = constraints[0];
      // Association-specific approved ranges have separate owners; do not
      // certify their older canonical fallback as an exact source match.
      if (c.minimumAgeYears !== ages.minimumAgeYears || c.maximumAgeYears !== ages.maximumAgeYears) { pending.push(source); continue; }
      const selectedPlans = ["member", "spouse", "child"].map(applicantKey => ({ productKey, categoryKey: db.products.find(row => row.key === productKey)!.categoryKey, applicantKey }));
      for (const ageYears of [ages.minimumAgeYears - 1, ages.minimumAgeYears, ages.maximumAgeYears, ages.maximumAgeYears + 1]) {
        const facts: EligibilityFacts = { ageYears, ageDays: Math.max(0, ageYears * 366), unmarried: c.unmarried ?? true, fullTimeStudent: false, workHoursPerWeek: 40, activelyAtWork: true, activeMilitary: false, associationMember: siteKey === "waepa" && applicant === "spouse" ? false : true, firmMemberCount: 3, membershipType: siteKey === "ama" ? "physician" : siteKey === "waepa" ? "current" : "yes", selectedPlans, ...(siteKey === "isitrust" ? { associationKey: "akron-bar-association" } : {}) };
        const decision = resolveEffectiveEligibility(site, productKey, applicant, facts);
        expect(decision.status, `${source}/${ageYears}: ${decision.reason}`).toBe("resolved");
        expect(decision.eligible, `${source}/${ageYears}: ${decision.reason}`).toBe(ageYears >= ages.minimumAgeYears && ageYears <= ages.maximumAgeYears);
      }
      reviewed++;
    }
  }
  expect(reviewed).toBeGreaterThan(60);
  expect(pending).toEqual([]);
});
