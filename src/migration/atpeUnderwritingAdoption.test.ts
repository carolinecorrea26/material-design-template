import dayjs from "dayjs";
import { afterEach, beforeAll, expect, it } from "vitest";
import { createReviewedMigrationDatabase } from "./fixtures";
import { atpeAssociationKey } from "./atpeAssociationAdoption";
import { installPrototypeLibrary, resolvePrototypeLibrary } from "../domain/prototypeLibrary";
import { resolveJourneyUnderwriting, resolveQuestionParticipation } from "../domain/coverageJourney";
import { applicationUnderwriting } from "../domain/coverageRuntime";
import { resolveFlowGate, applicantParticipatesInPage } from "../config/flowGates";
import { isCoverageJourneyPolicy } from "../domain/coverageJourneyPolicy";
import { validateMigrationDatabase } from "./integrity";
import type { DatabaseSchema } from "../persistence/types";

let db: DatabaseSchema;
beforeAll(() => { db = createReviewedMigrationDatabase(); }, 120000);
afterEach(() => installPrototypeLibrary(null));

it("selects the ATPE Group Term questionnaire and member/spouse outcome at every source boundary", () => {
  const library = resolvePrototypeLibrary(db, "isitrust", "atpe-underwriting"); installPrototypeLibrary(library);
  const product = library.products.find(product => product.id === "li-group-term")!;
  for (const applicant of ["member", "spouse"] as const) for (const [age, amount, shorter] of [[18, 250000, true], [49, 250000, true], [49, 300000, false], [50, 150000, true], [50, 200000, false], [59, 150000, true], [59, 200000, false], [60, 50000, false], [64, 50000, false]] as const) {
    const pathway = shorter ? "SI" : applicant === "member" ? "QD" : "FUW", healthPage = shorter ? "health-si" : "health-li";
    const selected = resolveJourneyUnderwriting(library.site, product.id, applicant, age, amount, undefined, atpeAssociationKey);
    expect(selected, `${applicant}/${age}/${amount}`).toMatchObject({ status: "resolved", pathway, healthPage });
    const prefix = applicant === "member" ? "" : "spouse-";
    const values = { membership: atpeAssociationKey, [`${prefix}birth-date`]: dayjs().subtract(age, "year").format("YYYY-MM-DD"), coverageSelections: [product.id], productApplicants: { [product.id]: [applicant] }, coverageAmounts: { [`${product.id}:${applicant}`]: amount } };
    expect(applicationUnderwriting(product, applicant, values)).toMatchObject({ status: "resolved", underwritingType: pathway, healthPage });
    expect(resolveQuestionParticipation(library.site, product.id, applicant, "new", {}, [], [], pathway, healthPage).healthPage).toBe(healthPage);
    for (const page of ["health-si", "health-li", "health-qd", "health-di"] as const) {
      expect(resolveFlowGate(page, values, library.products), `${applicant}/${age}/${amount}/${page}`).toBe(page === healthPage);
      expect(applicantParticipatesInPage(page, applicant, values, library.products)).toBe(page === healthPage);
    }
  }
  expect(resolveJourneyUnderwriting(library.site, product.id, "member", 40, 300000).status).toBe("needs-information");
  expect(resolveJourneyUnderwriting(library.site, product.id, "member", undefined, 300000, undefined, atpeAssociationKey).status).toBe("needs-information");
  expect(resolveJourneyUnderwriting(library.site, product.id, "member", 40, 300000, undefined, "unknown").status).toBe("unresolved");
  expect(resolveJourneyUnderwriting(library.site, product.id, "member", 40, 300000, undefined, "akron-bar-association")).toMatchObject({ status: "resolved", pathway: "QD", healthPage: "health-qd" });
});

it("uses full source Life questions and approved QD for both term plans", () => {
  const library = resolvePrototypeLibrary(db, "isitrust", "atpe-term-underwriting"); installPrototypeLibrary(library);
  for (const [productKey, pathway] of [["li-10yr", "QD"], ["li-20yr", "QD"]] as const) for (const applicant of ["member", "spouse"]) for (const age of [20, 54]) for (const amount of [10000, applicant === "member" ? 1000000 : 500000]) expect(resolveJourneyUnderwriting(library.site, productKey, applicant, age, amount, undefined, atpeAssociationKey)).toMatchObject({ status: "resolved", pathway, healthPage: "health-li" });
  for (const amount of [500000, 510000, 1000000]) expect(resolveJourneyUnderwriting(library.site, "li-20yr", "member", 54, amount, undefined, atpeAssociationKey)).toMatchObject({ pathway: "QD", healthPage: "health-li" });
  for (const productKey of ["li-add", "sh-hospital-income", "li-50plus"]) expect(resolveJourneyUnderwriting(library.site, productKey, "member", 40, 50000, undefined, atpeAssociationKey)).toMatchObject({ status: "resolved", pathway: "GI", healthPage: null });
});

it("captures scoped underwriting edits, preserves earlier revisions and rejects overlapping bands", () => {
  const captured = resolvePrototypeLibrary(db, "isitrust", "before-underwriting-edit");
  const edited = JSON.parse(JSON.stringify(db)) as DatabaseSchema;
  const row = edited.configurationValues.find(row => row.key === "isitrust.li-group-term.journey-policy")!;
  if (!isCoverageJourneyPolicy(row.value)) throw new Error("Invalid fixture");
  row.value.associationUnderwriting![0].bands[0].maximumAmount = 200000;
  row.value.associationUnderwriting![0].bands[1].minimumAmount = 200000;
  const after = resolvePrototypeLibrary(edited, "isitrust", "after-underwriting-edit");
  expect(resolveJourneyUnderwriting(after.site, "li-group-term", "member", 40, 250000, undefined, atpeAssociationKey)).toMatchObject({ pathway: "QD", healthPage: "health-li" });
  expect(resolveJourneyUnderwriting(captured.site, "li-group-term", "member", 40, 250000, undefined, atpeAssociationKey)).toMatchObject({ pathway: "SI", healthPage: "health-si" });
  expect(resolvePrototypeLibrary(edited, "asce", "isolation").site).toEqual(resolvePrototypeLibrary(db, "asce", "isolation").site);
  row.value.associationUnderwriting![0].bands[1].minimumAmount = 100000;
  expect(isCoverageJourneyPolicy(row.value)).toBe(false);
  expect(validateMigrationDatabase(edited)).toContain(`Invalid executable journey policy ${row.key}`);
});
