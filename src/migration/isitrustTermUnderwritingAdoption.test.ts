import dayjs from "dayjs";
import { afterEach, beforeAll, expect, it } from "vitest";
import { createReviewedMigrationDatabase } from "./fixtures";
import { applyIsitrustTermUnderwritingAdoption } from "./isitrustTermUnderwritingAdoption";
import { installPrototypeLibrary, resolvePrototypeLibrary } from "../domain/prototypeLibrary";
import { resolveJourneyUnderwriting } from "../domain/coverageJourney";
import { isCoverageJourneyPolicy } from "../domain/coverageJourneyPolicy";
import { resolveFlowGate } from "../config/flowGates";
import { resolveReviewExperience } from "../config/reviewExperience";
import { atpeAssociationKey } from "./atpeAssociationAdoption";
import { resolveEffectiveEligibility } from "../domain/effectiveSite";
import { validateMigrationDatabase } from "./integrity";
import type { DatabaseSchema } from "../persistence/types";
let db: DatabaseSchema;
beforeAll(() => { db = createReviewedMigrationDatabase(); }, 120000);
afterEach(() => installPrototypeLibrary(null));
it("selects approved adult term outcomes/full questions at every age boundary and preserves ATPE", () => {
  const library = resolvePrototypeLibrary(db, "isitrust", "general-term-bands"); installPrototypeLibrary(library);
  for (const applicant of ["member", "spouse"] as const) for (const [product, ages] of [["li-10yr", [20, 54, 59, 60, 61, 64]], ["li-20yr", [20, 54]]] as const) for (const age of ages) for (const amount of [100000, applicant === "member" ? 1000000 : 500000]) {
    const pathway = product === "li-10yr" && age >= 61 ? "FUW" : "QD";
    expect(resolveJourneyUnderwriting(library.site, product, applicant, age, amount, undefined, "akron-bar-association")).toMatchObject({ status: "resolved", pathway, healthPage: "health-li" });
    const prefix = applicant === "member" ? "" : "spouse-";
    const values = { membership: "akron-bar-association", state: "VA", [`${prefix}birth-date`]: dayjs().subtract(age, "year").format("YYYY-MM-DD"), coverageSelections: [product], productApplicants: { [product]: [applicant] }, coverageAmounts: { [`${product}:${applicant}`]: amount } };
    expect(resolveFlowGate("health-li", values, library.products)).toBe(true);
    expect(resolveFlowGate("health-qd", values, library.products)).toBe(false);
    expect(resolveReviewExperience(library.client, "isitrust", library.products, values).authorizationVisible).toBe(true);
  }
  expect(resolveJourneyUnderwriting(library.site, "li-10yr", "member", 55, 100000, undefined, atpeAssociationKey).status).toBe("unresolved");
  expect(resolveJourneyUnderwriting(library.site, "li-10yr", "member", 54, 100000, undefined, atpeAssociationKey)).toMatchObject({ pathway: "QD", healthPage: "health-li" });
  for (const [product, age] of [["li-10yr", 19], ["li-10yr", 65], ["li-20yr", 19], ["li-20yr", 55]] as const) expect(resolveJourneyUnderwriting(library.site, product, "member", age, 100000, undefined, "akron-bar-association").status).toBe("unresolved");
  expect(resolveJourneyUnderwriting(library.site, "li-10yr", "member", undefined, 100000, undefined, "akron-bar-association").status).toBe("needs-information");
});
it("assigns each current general Association, captures edits and preserves separate eligibility/amount/ATPE owners", () => {
  const library = resolvePrototypeLibrary(db, "isitrust", "before-edit"), edited = structuredClone(db);
  const row = edited.configurationValues.find(row => row.key === "isitrust.li-10yr.journey-policy")!;
  if (!isCoverageJourneyPolicy(row.value)) throw new Error("Invalid fixture");
  const general = row.value.associationUnderwriting!.filter(rule => rule.associationKey !== atpeAssociationKey);
  expect(general).toHaveLength(50);
  for (const rule of general) expect(resolveJourneyUnderwriting(library.site, "li-10yr", rule.applicantKey, 60, 100000, undefined, rule.associationKey)).toMatchObject({ pathway: "QD", healthPage: "health-li" });
  const member = general.find(rule => rule.associationKey === "akron-bar-association" && rule.applicantKey === "member")!;
  member.bands[0].maximumAgeYears = 59; member.bands[1].minimumAgeYears = 60;
  expect(resolveJourneyUnderwriting(resolvePrototypeLibrary(edited, "isitrust", "after-edit").site, "li-10yr", "member", 60, 100000, undefined, "akron-bar-association")).toMatchObject({ pathway: "FUW" });
  expect(resolveJourneyUnderwriting(library.site, "li-10yr", "member", 60, 100000, undefined, "akron-bar-association")).toMatchObject({ pathway: "QD" });
  const copy = structuredClone(db); applyIsitrustTermUnderwritingAdoption(copy); expect(copy).toEqual(db);
  expect(copy.eligibilityConstraints).toEqual(db.eligibilityConstraints); expect(copy.productAmountRules).toEqual(db.productAmountRules);
  expect(validateMigrationDatabase(db)).toEqual([]);
});

it("uses Group Term's approved age/amount question scopes and 20-Year eligibility for both adults", () => {
  const library = resolvePrototypeLibrary(db, "isitrust", "general-group-and-ages"); installPrototypeLibrary(library);
  for (const applicantKey of ["member", "spouse"] as const) {
    for (const [age, amount, pathway, healthPage] of [[18, 500000, "QD", "health-qd"], [54, 500000, "QD", "health-qd"], [54, 500001, "QD", "health-li"], [55, 100000, "QD", "health-li"], [60, 100000, "QD", "health-li"], [61, 100000, "FUW", "health-li"], [64, 100000, "FUW", "health-li"]] as const) {
      expect(resolveJourneyUnderwriting(library.site, "li-group-term", applicantKey, age, amount, undefined, "akron-bar-association")).toMatchObject({ status: "resolved", pathway, healthPage });
      const prefix = applicantKey === "member" ? "" : "spouse-";
      const values = { membership: "akron-bar-association", state: "PA", [`${prefix}birth-date`]: dayjs().subtract(age, "year").format("YYYY-MM-DD"), coverageSelections: ["li-group-term"], productApplicants: { "li-group-term": [applicantKey] }, coverageAmounts: { [`li-group-term:${applicantKey}`]: amount } };
      expect(resolveFlowGate(healthPage, values, library.products)).toBe(true);
      expect(resolveFlowGate(healthPage === "health-li" ? "health-qd" : "health-li", values, library.products)).toBe(false);
    }
    for (const ageYears of [18, 19, 20, 54, 55, 64]) expect(resolveEffectiveEligibility(library.site, "li-20yr", applicantKey, { ageYears, associationKey: "akron-bar-association" })).toMatchObject({ status: "resolved", eligible: ageYears >= 20 && ageYears <= 54 });
    expect(resolveEffectiveEligibility(library.site, "li-20yr", applicantKey, { associationKey: "akron-bar-association" }).status).toBe("needs-information");
  }
  expect(resolveJourneyUnderwriting(library.site, "li-group-term", "member", 18, 250000, undefined, atpeAssociationKey)).toMatchObject({ pathway: "SI", healthPage: "health-si" });
  expect(resolveJourneyUnderwriting(library.site, "li-group-term", "spouse", 60, 100000, undefined, atpeAssociationKey)).toMatchObject({ pathway: "FUW", healthPage: "health-li" });
});
