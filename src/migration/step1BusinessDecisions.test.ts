import { afterEach, beforeAll, expect, it } from "vitest";
import { createReviewedMigrationDatabase } from "./fixtures";
import type { DatabaseSchema } from "../persistence/types";
import { installPrototypeLibrary, resolvePrototypeLibrary } from "../domain/prototypeLibrary";
import { resolveCoverageJourneyPolicy, resolveSubmissionMapping } from "../domain/coverageJourneyPolicy";
import { resolveNormalizedBenefit } from "../domain/benefitPolicy";
import { prototypeCoverageDecision } from "../domain/prototypeCoverageDecision";

let db: DatabaseSchema;
beforeAll(() => { db = JSON.parse(JSON.stringify(createReviewedMigrationDatabase())); }, 120000);
afterEach(() => installPrototypeLibrary(null));

it("retains ABE as Association under ABA and AVMA LIFE Trust under Pearl, preserving the contradictory MCR cells", () => {
  for (const [key, name, tpa] of [["abe", "American Bar Endowment", "ABA"], ["avma", "AVMA LIFE Trust", "Pearl Insurance"]]) {
    const association = db.associationEntities.find(row => row.key === key)!;
    expect(association.name).toBe(name);
    expect(db.organizations.find(row => row.id === association.organizationId)?.name).toBe(tpa);
  }
  expect(db.sourceRequirements.find(row => row.sheetKey === "associations" && row.cell === "A7")?.value).toContain("American Bar Association");
  expect(db.semanticRequirements.find(row => row.key === "provisional-decision.isitrust.st-louis-affiliation")?.value).toMatchObject({ revisit: true, sourceReconciliation: "pending" });
  expect(db.siteAssociations.find(row => row.siteKey === "isitrust" && row.associationKey === "bar-association-of-metropolitan-st-louis")?.enabled).toBe(true);
});

it("includes AMA Step Rated separately with source identifiers, class caps and a shared DI aggregate", () => {
  const library = resolvePrototypeLibrary(db, "ama", "test");
  const step = library.products.find(row => row.id === "di-step-rated")!;
  const level = library.products.find(row => row.id === "di-level-rated")!;
  expect(step.name).toBe("Disability Insurance with Step Rated Premiums");
  expect(step.gNumber?.primary).toBe("G-30639-0");
  expect(level.gNumber?.primary).toBe("G-30641-0");
  expect(step.planCode.primary).toBe("601");
  expect(resolveNormalizedBenefit(library.site, step.id, "member", { ageYears: 35, applicantClass: "practicing", monthlyIncome: 60000, existingMonthlyBenefit: 0, otherMonthlyBenefits: { "di-level-rated": 10000 } })).toMatchObject({ maximum: 5000 });
  expect(resolveNormalizedBenefit(library.site, step.id, "member", { ageYears: 35, applicantClass: "resident", existingMonthlyBenefit: 0, otherMonthlyBenefits: { "di-level-rated": 0 } })).toMatchObject({ maximum: 5000 });
});

it.each(["student-osteopathic-medical-association", "national-press-club"])("restricts ISI Hospital/CI for %s without removing Life availability", associationKey => {
  const library = resolvePrototypeLibrary(db, "isitrust", "test");
  installPrototypeLibrary(library);
  for (const product of ["sh-hospital-income", "sh-critical-illness"]) {
    const policy = resolveCoverageJourneyPolicy(library.site, product)!;
    expect(policy.associationChoices).toHaveLength(24);
    expect(resolveSubmissionMapping(policy, { applicantKey: "member", mode: "new", associationKey }).status).toBe("unresolved");
    expect(prototypeCoverageDecision(product, "member", { membership: associationKey }, [100])).toMatchObject({ amounts: [], messages: ["This product is not available for the selected Association."] });
    expect(resolveSubmissionMapping(policy, { applicantKey: "member", mode: "new", associationKey: "akron-bar-association" }).status).toBe("resolved");
  }
  for (const product of ["li-10yr", "li-20yr"]) {
    const policy = resolveCoverageJourneyPolicy(library.site, product)!;
    expect(policy.associationChoices).toHaveLength(26);
    expect(resolveSubmissionMapping(policy, { applicantKey: "member", mode: "new", associationKey }).status).toBe("resolved");
  }
});
