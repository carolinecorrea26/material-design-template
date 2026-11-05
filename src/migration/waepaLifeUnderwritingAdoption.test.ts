import dayjs from "dayjs";
import { afterEach, beforeAll, expect, it } from "vitest";
import { createReviewedMigrationDatabase } from "./fixtures";
import { applyWaepaLifeUnderwritingAdoption } from "./waepaLifeUnderwritingAdoption";
import { applyCoverageJourneyAdoption } from "./coverageJourneyAdoption";
import { installPrototypeLibrary, resolvePrototypeLibrary } from "../domain/prototypeLibrary";
import { resolveJourneyUnderwriting, resolveQuestionParticipation } from "../domain/coverageJourney";
import { applicationUnderwriting } from "../domain/coverageRuntime";
import { resolveFlowGate } from "../config/flowGates";
import { validateMigrationDatabase } from "./integrity";
import type { DatabaseSchema } from "../persistence/types";
let db: DatabaseSchema;
beforeAll(() => { db = createReviewedMigrationDatabase(); }, 120000);
afterEach(() => installPrototypeLibrary(null));
it("applies the approved adult WAEPA Life boundaries in native processing and the application", () => {
  const library = resolvePrototypeLibrary(db, "waepa", "Life-bands"); installPrototypeLibrary(library);
  const product = library.products.find(product => product.id === "li-group-term")!;
  for (const applicant of ["member", "spouse"] as const) for (const age of [18, 49, 50, 59, 60, 69]) for (const amount of [500000, 500001, 1000000, 1000001]) {
    const pathway = age <= 49 && amount <= 1000000 || age <= 59 && amount <= 500000 ? "QD" : "FUW";
    expect(resolveJourneyUnderwriting(library.site, product.id, applicant, age, amount), `${applicant}/${age}/${amount}`).toMatchObject({ status: "resolved", pathway });
    const values = { membership: "current", gender: "male", "spouse-gender": "male", "birth-date": dayjs().subtract(age, "year").format("YYYY-MM-DD"), "spouse-birth-date": dayjs().subtract(age, "year").format("YYYY-MM-DD"), coverageSelections: [product.id], productApplicants: { [product.id]: [applicant] }, coverageAmounts: { [`${product.id}:${applicant}`]: amount } };
    expect(applicationUnderwriting(product, applicant, values)).toMatchObject({ status: "resolved", underwritingType: pathway, healthPage: "health-li" });
    expect(resolveFlowGate("health-li", values, library.products)).toBe(true);
    expect(resolveFlowGate("health-qd", values, library.products)).toBe(false);
    const questions = resolveQuestionParticipation(library.site, product.id, applicant, "new", { gender: "male", "spouse-gender": "male" }, [], [], pathway);
    expect(questions.activeFields).toContain(`health-source-tele-weight-change-${applicant}`);
  }
  for (const age of [17, 70]) expect(resolveJourneyUnderwriting(library.site, product.id, "member", age, 100000).status).toBe("unresolved");
});
it("retains child and GI routing, captures native edits, and reapplies without changing limits", () => {
  const before = resolvePrototypeLibrary(db, "waepa", "before");
  const copy = structuredClone(db); applyWaepaLifeUnderwritingAdoption(copy); expect(copy).toEqual(db);
  applyCoverageJourneyAdoption(copy); expect(copy.underwritingBands).toEqual(db.underwritingBands);
  expect(resolveJourneyUnderwriting(before.site, "li-group-term", "child", 10, 25000)).toEqual(resolveJourneyUnderwriting(resolvePrototypeLibrary(copy, "waepa", "after").site, "li-group-term", "child", 10, 25000));
  expect(resolveQuestionParticipation(before.site, "li-group-term", "child", "new").healthPage).toBeNull();
  expect(resolvePrototypeLibrary(copy, "waepa-gi", "same").site).toEqual(resolvePrototypeLibrary(db, "waepa-gi", "same").site);
  copy.underwritingBands.find(row => row.key === "waepa.li-group-term.member.reviewed-source-1")!.maximumAmount = 900000;
  copy.underwritingBands.find(row => row.key === "waepa.li-group-term.member.reviewed-source-2")!.minimumAmount = 900000;
  expect(resolveJourneyUnderwriting(resolvePrototypeLibrary(copy, "waepa", "edited").site, "li-group-term", "member", 49, 1000000)).toMatchObject({ pathway: "FUW" });
  expect(resolveJourneyUnderwriting(before.site, "li-group-term", "member", 49, 1000000)).toMatchObject({ pathway: "QD" });
  expect(copy.eligibilityConstraints).toEqual(db.eligibilityConstraints);
  expect(validateMigrationDatabase(db)).toEqual([]);
});
