import { act } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeAll, expect, it, vi } from "vitest";
import { createReviewedMigrationDatabase } from "./fixtures";
import { recordWorkHoursCollectionDecision, workHoursCollectionDecisionKey } from "./workHoursCollectionDecision";
import { installPrototypeLibrary, resolvePrototypeLibrary } from "../domain/prototypeLibrary";
import { getClientPageFields } from "../config/clientFields/getClientPageFields";
import { applicationApplicantFacts } from "../utils/applicantFacts";
import { resolveEffectiveEligibility } from "../domain/effectiveSite";
import type { DatabaseSchema } from "../persistence/types";
import type { CoverageCategoryId } from "../domain/coverage";
import Coverage from "../pages/Coverage";
const form = vi.hoisted(() => ({ values: {} as Record<string, unknown>, setPageValues: vi.fn(), saveApplication: vi.fn() }));
vi.mock("../app/ApplicationFormContext", async original => ({ ...await original<typeof import("../app/ApplicationFormContext")>(), useApplicationForm: () => form }));
vi.mock("../app/ApplicationSessionContext", () => ({ useApplicationSession: () => ({ reviewSubmitted: false, markReviewSubmitted: vi.fn() }) }));
vi.mock("../app/SinglePageFlowContext", () => ({ useSinglePageFlow: () => null }));
vi.mock("../app/usePrototypeRates", () => ({ usePrototypeRates: () => ({ enabled: true, premium: () => NaN, display: () => ({ status: "needs-information" }) }) }));
let db: DatabaseSchema;
beforeAll(() => { db = createReviewedMigrationDatabase(); }, 120000);
afterEach(() => { installPrototypeLibrary(null); window.sessionStorage.clear(); vi.unstubAllGlobals(); });

it("retains product work rules and the corrected decision without adding all-product collection", () => {
  const repeated = structuredClone(db); recordWorkHoursCollectionDecision(repeated); expect(repeated).toEqual(db);
  expect(db.semanticRequirements.find(row => row.key === workHoursCollectionDecisionKey)?.value).toMatchObject({ supersedes: { previousAnswer: "Collect hours for every ISITRUST member" } });
  for (const [site, product, minimum] of [["isitrust", "di-ltd", 20], ["isitrust", "di-short-term", 20], ["isitrust", "oo-professional", 20], ["waepa", "di-short-term", 30]] as const) {
    const library = resolvePrototypeLibrary(db, site, "hours-policy"); installPrototypeLibrary(library); window.history.replaceState(null, "", `/eligibility?site=${site}`);
    expect(getClientPageFields("eligibility", {}).some(field => field.id === "hours-worked-per-week")).toBe(false);
    for (const hours of [minimum - 1, minimum]) expect(resolveEffectiveEligibility(library.site, product, "member", { ageYears: 35, activeMilitary: false, workHoursPerWeek: hours }).eligible).toBe(hours === minimum);
  }
  expect(applicationApplicantFacts({ "hours-worked-per-week": "20" }, "member").workHoursPerWeek).toBe(20);
});

it.each([
  ["isitrust", "LI", false], ["isitrust", "AD", false], ["isitrust", "SH", false], ["isitrust", "DI", true], ["isitrust", "OO", true],
  ["waepa", "LI", false], ["waepa", "DI", true],
] as const)("renders weekly hours for %s/%s only when its category calls for it", async (site, category: CoverageCategoryId, expected) => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  window.history.replaceState(null, "", `/coverage?site=${site}`);
  installPrototypeLibrary(resolvePrototypeLibrary(db, site, "category-hours"));
  form.values = { membership: site === "isitrust" ? "akron-bar-association" : "current", "birth-date": "1990-01-01", "state-province": "PA", selectedCategoryChips: [category], "hours-worked-per-week": "20", coverageSelections: [], "active-military": "no" };
  const container = document.createElement("div"), root = createRoot(container); document.body.append(container);
  try {
    await act(async () => root.render(<MemoryRouter><Coverage /></MemoryRouter>));
    const inputs = container.querySelectorAll<HTMLInputElement>('input[name="hours-worked-per-week"]');
    expect(inputs).toHaveLength(expected ? 1 : 0);
    if (expected) expect(inputs[0].value).toBe("20");
  } finally { await act(async () => root.unmount()); container.remove(); }
});
