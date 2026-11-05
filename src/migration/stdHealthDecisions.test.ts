import dayjs from "dayjs";
import { afterEach, beforeAll, expect, it } from "vitest";
import { createReviewedMigrationDatabase } from "./fixtures";
import { recordAvmaStdHealthDecision, avmaStdHealthDecisionKey } from "./avmaStdHealthDecision";
import { applyWaepaStdUnderwritingAdoption, waepaStdUnderwritingDecisionKey } from "./waepaStdUnderwritingAdoption";
import { applyCoverageJourneyAdoption } from "./coverageJourneyAdoption";
import { installPrototypeLibrary, resolvePrototypeLibrary } from "../domain/prototypeLibrary";
import { resolveJourneyUnderwriting, resolveQuestionParticipation } from "../domain/coverageJourney";
import { isCoverageJourneyPolicy } from "../domain/coverageJourneyPolicy";
import { applicationUnderwriting } from "../domain/coverageRuntime";
import { resolveFlowGate } from "../config/flowGates";
import { resolveReviewExperience } from "../config/reviewExperience";
import { validateMigrationDatabase } from "./integrity";
import type { DatabaseSchema } from "../persistence/types";

let db: DatabaseSchema;
beforeAll(() => { db = createReviewedMigrationDatabase(); }, 120000);
afterEach(() => installPrototypeLibrary(null));
const valuesAt = (age: number, amount = 1000) => ({ membership: "yes", state: "PA", "birth-date": dayjs().subtract(age, "year").format("YYYY-MM-DD"), coverageSelections: ["di-short-term"], productApplicants: { "di-short-term": ["member"] }, coverageAmounts: { "di-short-term:member": amount } });

it("retains AVMA's native GI/no-question flow and records the missing source information", () => {
  const library = resolvePrototypeLibrary(db, "avma", "STD-exception"); installPrototypeLibrary(library);
  expect(resolveJourneyUnderwriting(library.site, "di-short-term", "member", 40, 1000)).toMatchObject({ status: "resolved", pathway: "GI" });
  for (const page of ["health-si", "health-li", "health-di", "health-qd"] as const) expect(resolveFlowGate(page, valuesAt(40), library.products)).toBe(false);
  expect(db.semanticRequirements.find(row => row.key === avmaStdHealthDecisionKey)?.value).toMatchObject({ approvalStatus: "approved-provisional-exception", sourceReferences: expect.arrayContaining(["Main!U194"]), revisitTrigger: expect.any(String) });
  const copy = structuredClone(db); recordAvmaStdHealthDecision(copy); expect(copy).toEqual(db);
});

it("routes WAEPA's permitted age/amount boundaries through processing, questions and Review", () => {
  window.history.replaceState(null, "", "/?site=waepa");
  const library = resolvePrototypeLibrary(db, "waepa", "STD-routing"); installPrototypeLibrary(library);
  const product = library.products.find(product => product.id === "di-short-term")!;
  for (const age of [17, 49, 50, 69]) for (const amount of [100, 6500]) {
    const pathway = age < 50 ? "QD" : "FUW", page = age < 50 ? "health-qd" : "health-di", values = valuesAt(age, amount);
    expect(resolveJourneyUnderwriting(library.site, product.id, "member", age, amount)).toMatchObject({ status: "resolved", pathway });
    expect(applicationUnderwriting(product, "member", values)).toMatchObject({ status: "resolved", underwritingType: pathway });
    const questions = resolveQuestionParticipation(library.site, product.id, "member", "new", {}, [], [], pathway);
    expect(questions.healthPage).toBe(page);
    expect(questions.activeFields.some(key => key.startsWith("health-di-q"))).toBe(age >= 50);
    for (const candidate of ["health-qd", "health-di", "health-li", "health-si"] as const) expect(resolveFlowGate(candidate, values, library.products), `${age}/${amount}/${candidate}`).toBe(candidate === page);
    expect(resolveReviewExperience(library.client, "waepa", library.products, values).authorizationVisible).toBe(age >= 50);
  }
  for (const age of [16, 70]) expect(resolveJourneyUnderwriting(library.site, product.id, "member", age, 1000).status).toBe("unresolved");
  for (const amount of [99, 6501]) expect(resolveJourneyUnderwriting(library.site, product.id, "member", 50, amount).status).toBe("unresolved");
  expect(resolveJourneyUnderwriting(library.site, product.id, "member", undefined, 1000).status).toBe("needs-information");
  expect(resolveJourneyUnderwriting(library.site, product.id, "member", 50).status).toBe("needs-information");
});

it("captures native scoped band edits, preserves revisions and compiler reapplication, and fails ambiguous bands", () => {
  const captured = resolvePrototypeLibrary(db, "waepa", "before-edit"), edited = structuredClone(db);
  const qd = edited.underwritingBands.find(row => row.key === "waepa.di-short-term.member.reviewed-qd")!;
  const fuw = edited.underwritingBands.find(row => row.key === "waepa.di-short-term.member.reviewed-fuw")!;
  qd.maximumAge = 48; fuw.minimumAge = 49;
  expect(resolveJourneyUnderwriting(resolvePrototypeLibrary(edited, "waepa", "after-edit").site, "di-short-term", "member", 49, 1000)).toMatchObject({ pathway: "FUW" });
  expect(resolveJourneyUnderwriting(captured.site, "di-short-term", "member", 49, 1000)).toMatchObject({ pathway: "QD" });
  expect(resolvePrototypeLibrary(edited, "avma", "isolation").site).toEqual(resolvePrototypeLibrary(db, "avma", "isolation").site);
  qd.maximumAge = 49;
  expect(resolveJourneyUnderwriting(resolvePrototypeLibrary(edited, "waepa", "overlap").site, "di-short-term", "member", 49, 1000).status).toBe("unresolved");
  const copy = structuredClone(db); applyWaepaStdUnderwritingAdoption(copy); expect(copy).toEqual(db);
  applyCoverageJourneyAdoption(copy);
  expect(copy.underwritingBands).toEqual(db.underwritingBands);
  expect(db.semanticRequirements.find(row => row.key === waepaStdUnderwritingDecisionKey)?.value).toMatchObject({ questionnaireStatus: "accepted-provisional-existing-DI-questionnaire", preserved: expect.stringContaining("30-hour") });
  const policy = db.configurationValues.find(row => row.key === "waepa.di-short-term.journey-policy")!.value;
  for (const healthPageByUnderwriting of [{}, { FUW: "unknown-page" }, { unknown: "health-di" }]) expect(isCoverageJourneyPolicy({ ...policy as object, healthPageByUnderwriting })).toBe(false);
  expect(copy.configurationValues.find(row => row.key === "waepa.di-short-term.journey-policy")).toEqual(db.configurationValues.find(row => row.key === "waepa.di-short-term.journey-policy"));
  expect(validateMigrationDatabase(db)).toEqual([]);
});
