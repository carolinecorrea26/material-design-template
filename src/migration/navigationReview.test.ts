import { afterEach, beforeAll, expect, it } from "vitest";
import { createReviewedMigrationDatabase } from "./fixtures";
import { activeSiteMigrationScope } from "./activeSiteScope";
import { installPrototypeLibrary, resolvePrototypeLibrary } from "../domain/prototypeLibrary";
import { getActiveFormFlow, getNextFormPageId, getPreviousFormPageId, getResolvedFormFlow } from "../config/formFlow";
import { getActiveProgressSteps } from "../config/progressSteps";
import { navigationReviewHash, reviewNavigationRequirements, reviewedNavigationCodeMatches } from "./requirementCrosswalkNavigationReview";
import type { CrosswalkRow } from "./requirementCrosswalk";
import type { DatabaseSchema } from "../persistence/types";
import type { ApplicationFormValues } from "../app/ApplicationFormContext";
import { isHealthQuestionnairePolicy } from "../domain/configuredHealthQuestionnaire";

let db: DatabaseSchema;
beforeAll(() => { db = createReviewedMigrationDatabase(); }, 120000);
afterEach(() => { installPrototypeLibrary(null); window.sessionStorage.clear(); });
it.each(activeSiteMigrationScope.sites.map(site => site.key))("uses %s's captured page order and the same gates in next, Back and progress", siteKey => {
  window.history.replaceState(null, "", `/?site=${siteKey}`);
  const library = resolvePrototypeLibrary(db, siteKey, "shared-routing-review"); installPrototypeLibrary(library);
  const product = library.products.find(product => product.applicants.includes("member"));
  const samples: ApplicationFormValues[] = [{}];
  if (product) samples.push({ coverageSelections: [product.id], productApplicants: { [product.id]: ["member"] }, coverageAmounts: { [`${product.id}:member`]: 100000 }, "birth-date": "1986-01-01" });
  for (const values of samples) {
    const flow = getActiveFormFlow(values);
    for (const [index, page] of flow.entries()) {
      expect(getNextFormPageId(page, values)).toBe(flow[index + 1] ?? null);
      expect(getPreviousFormPageId(page, values)).toBe(flow[index - 1] ?? null);
    }
    const progress = getActiveProgressSteps(values).flatMap(step => step.pageIds);
    expect(progress.every(page => flow.includes(page))).toBe(true);
    const review = getActiveProgressSteps(values).find(step => step.id === "application-review");
    expect(progress.filter(page => page.startsWith("health-")).every(page => review?.pageIds.includes(page))).toBe(true);
    expect(getResolvedFormFlow()).toEqual(library.pages.filter(page => page.enabled && page.definition.flow === "application" && page.definition.type !== "home").map(page => page.definition.id));
  }
});
it("reopens shared evidence after routing, page order or questionnaire assignment edits", () => {
  expect(reviewedNavigationCodeMatches()).toBe(true); expect(reviewedNavigationCodeMatches(() => Buffer.from("changed"))).toBe(false);
  const makeRow = () => ({ kind: "template-behavior", ruleKeys: ["rule-application-flow-resolved-next-back-navigation"], scope: { unresolved: [] }, implementationReferences: [] }) as unknown as CrosswalkRow;
  const row = makeRow(); reviewNavigationRequirements(db, [row]); expect(row.verificationStatus).toBe("recorded-evidence");
  for (const mutate of [
    (copy: DatabaseSchema) => { const rule = copy.rules.find(row => row.key === "rule-application-flow-beneficiary-routing")!; rule.definition.execution!.gates[0].gate = { kind: "selected-category", categoryIds: ["DI"] }; },
    (copy: DatabaseSchema) => { copy.sitePages.find(row => row.siteKey === "ama" && row.pageKey === "payment")!.requirement = "none"; },
    (copy: DatabaseSchema) => { copy.sitePages.find(row => row.siteKey === "ama" && row.pageKey === "contact")!.position = 999; },
    (copy: DatabaseSchema) => { const value = copy.configurationValues.find(row => row.key === "waepa.general.health-questionnaires")!.value; if (!isHealthQuestionnairePolicy(value)) throw new Error("Missing questionnaire"); value.variants[0].supersededPages = ["health-qd"]; },
  ]) {
    const copy = structuredClone(db); mutate(copy); const edited = makeRow(); reviewNavigationRequirements(copy, [edited]); expect(edited.verificationStatus).toBe("not-verified");
    expect(navigationReviewHash(copy)).not.toBe(navigationReviewHash(db));
  }
});
