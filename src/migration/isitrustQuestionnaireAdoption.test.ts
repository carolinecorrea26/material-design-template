import { afterEach, beforeAll, expect, it } from "vitest";
import { createReviewedMigrationDatabase } from "./fixtures";
import { applyIsitrustQuestionnaireAdoption } from "./isitrustQuestionnaireAdoption";
import { installPrototypeLibrary, resolvePrototypeLibrary } from "../domain/prototypeLibrary";
import { configuredHealthQuestionnaire, isHealthQuestionnairePolicy, validateConfiguredHealthQuestionnaire } from "../domain/configuredHealthQuestionnaire";
import { applicationUnderwriting } from "../domain/coverageRuntime";
import { resolveFlowGate } from "../config/flowGates";
import { resolveReviewExperience } from "../config/reviewExperience";
import { atpeAssociationKey } from "./atpeAssociationAdoption";
import { validateMigrationDatabase } from "./integrity";
import type { DatabaseSchema } from "../persistence/types";
let db: DatabaseSchema;
beforeAll(() => { db = createReviewedMigrationDatabase(); }, 120000);
afterEach(() => installPrototypeLibrary(null));
it("assigns each current non-ATPE Association exactly once and selects applicant-specific Life/CI variants", () => {
  const library = resolvePrototypeLibrary(db, "isitrust", "source-forms"); installPrototypeLibrary(library);
  const general = db.configurationValues.find(row => row.key === "isitrust.general.health-questionnaires")!.value;
  if (!isHealthQuestionnairePolicy(general)) throw new Error("Invalid fixture");
  expect(general.associationKeys).toHaveLength(25); expect(general.associationKeys).not.toContain(atpeAssociationKey);
  for (const association of general.associationKeys) for (const applicant of ["member", "spouse"]) for (const products of [["li-20yr"], ["sh-critical-illness"], ["li-20yr", "sh-critical-illness"]]) {
    const result = configuredHealthQuestionnaire(library.site, "health-li", applicant, { membership: association, state: "CA", coverageSelections: products, productApplicants: Object.fromEntries(products.map(key => [key, [applicant]])) });
    expect(result.status, `${association}/${applicant}/${products}`).toBe("resolved");
    const references = result.items.flatMap(item => item.sourceReferences);
    expect(references.some(ref => ref === "Health Questions!B63")).toBe(!products.includes("sh-critical-illness"));
    expect(references.some(ref => ref === "Health Questions!B100")).toBe(products.length > 1);
    expect(result.fields.filter(field => field.id.startsWith("health-source-")).every(field => field.id.endsWith(`-${applicant}`))).toBe(true);
  }
  expect(configuredHealthQuestionnaire(library.site, "health-li", "member", { membership: atpeAssociationKey, coverageSelections: ["li-20yr"], productApplicants: { "li-20yr": ["member"] } }).items[0].sourceReferences).toEqual(["Health Questions!B87"]);
});
it("preserves native processing/shorter pages and the STD exception, and scopes VA CI certification", () => {
  const before = structuredClone(db); before.configurationValues = before.configurationValues.filter(row => row.key !== "isitrust.general.health-questionnaires");
  const captured = resolvePrototypeLibrary(before, "isitrust", "before-forms"), current = resolvePrototypeLibrary(db, "isitrust", "after-forms");
  const association = "akron-bar-association";
  for (const productKey of ["li-group-term", "li-20yr", "sh-critical-illness", "di-short-term", "di-ltd"]) {
    const values = { membership: association, state: "VA", "birth-date": "1986-01-01", coverageSelections: [productKey], productApplicants: { [productKey]: ["member"] }, coverageAmounts: { [`${productKey}:member`]: productKey.startsWith("di-") ? 1000 : 100000 } };
    const decisions = [captured, current].map(library => { installPrototypeLibrary(library); return applicationUnderwriting(library.products.find(product => product.id === productKey)!, "member", values); });
    expect(decisions[1]).toEqual(decisions[0]);
    installPrototypeLibrary(current);
    if (productKey === "di-short-term") for (const page of ["health-li", "health-si", "health-di", "health-qd"] as const) expect(resolveFlowGate(page, values, current.products)).toBe(false);
    const certification = resolveReviewExperience(current.client, "isitrust", current.products, values).blocks.filter(block => block.key.startsWith("ci-virginia-certification"));
    expect(certification).toHaveLength(productKey === "sh-critical-illness" ? 1 : 0);
    expect(certification.some(block => block.key === "ci-virginia-certification")).toBe(false);
  }
});
it("validates shared source answers, isolates captured edits, and reapplies without disturbing ATPE or rates", () => {
  const captured = resolvePrototypeLibrary(db, "isitrust", "captured");
  const values = { membership: "akron-bar-association", state: "CA", coverageSelections: ["sh-critical-illness"], productApplicants: { "sh-critical-illness": ["member"] } };
  const result = configuredHealthQuestionnaire(captured.site, "health-li", "member", values);
  expect(validateConfiguredHealthQuestionnaire(result, values)).toBeDefined();
  const answers = { ...values, ...Object.fromEntries(result.items.filter(item => item.question).map(item => [item.question!.id, "no"])) };
  expect(validateConfiguredHealthQuestionnaire(configuredHealthQuestionnaire(captured.site, "health-li", "member", answers), answers)).toBeUndefined();
  const edited = structuredClone(db), row = edited.configurationValues.find(row => row.key === "isitrust.general.health-questionnaires")!;
  if (!isHealthQuestionnairePolicy(row.value)) throw new Error("Invalid fixture");
  row.value.associationKeys = row.value.associationKeys.filter(key => key !== "akron-bar-association");
  expect(configuredHealthQuestionnaire(resolvePrototypeLibrary(edited, "isitrust", "edited").site, "health-li", "member", values).status).toBe("unassigned");
  expect(configuredHealthQuestionnaire(captured.site, "health-li", "member", values).status).toBe("resolved");
  expect(resolvePrototypeLibrary(edited, "asce", "isolation").site).toEqual(resolvePrototypeLibrary(db, "asce", "isolation").site);
  const copy = structuredClone(db); applyIsitrustQuestionnaireAdoption(copy); expect(copy).toEqual(db);
  expect(validateMigrationDatabase(db)).toEqual([]);
});
