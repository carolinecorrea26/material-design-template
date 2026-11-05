import { act } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeAll, expect, it, vi } from "vitest";
import { createReviewedMigrationDatabase } from "./fixtures";
import { applyWaepaSpouseMembershipAdoption } from "./waepaSpouseMembershipAdoption";
import { installPrototypeLibrary, resolvePrototypeLibrary } from "../domain/prototypeLibrary";
import { resolveEffectiveEligibility } from "../domain/effectiveSite";
import { resolveApplicationCoverage } from "../domain/coverageRuntime";
import { getClientPageFields } from "../config/clientFields/getClientPageFields";
import { eligibilityIneligibilityMessage, isApplicantExperience } from "../domain/applicantExperience";
import { validateMigrationDatabase } from "./integrity";
import type { DatabaseSchema } from "../persistence/types";
import Eligibility from "../pages/Eligibility";

const form = vi.hoisted(() => ({ values: { membership: "current", "active-military": "no", dependents: ["spouse"], "spouse-membership": "no", "first-name": "Taylor", "last-name": "Morgan", "spouse-first-name": "Jordan", "spouse-last-name": "Morgan", "birth-date": "1986-01-01", "spouse-birth-date": "1986-01-01", "zip-postal-code": "19019", "state-province": "PA" }, setPageValues: vi.fn(), saveApplication: vi.fn() }));
vi.mock("../app/ApplicationFormContext", () => ({ useApplicationForm: () => form }));
vi.mock("../app/ApplicationSessionContext", () => ({ useApplicationSession: () => ({ reviewSubmitted: false, markReviewSubmitted: vi.fn() }) }));
vi.mock("../app/SinglePageFlowContext", () => ({ useSinglePageFlow: () => null }));
let db: DatabaseSchema;
beforeAll(() => { db = createReviewedMigrationDatabase(); }, 120000);
afterEach(() => { installPrototypeLibrary(null); vi.unstubAllGlobals(); });

it("blocks dependent spouses in both eligibility APIs and preserves member entry and other Sites", () => {
  const library = resolvePrototypeLibrary(db, "waepa", "dependent-spouse"); installPrototypeLibrary(library);
  const product = library.products.find(product => product.id === "li-group-term")!;
  const plans = [{ productKey: product.id, categoryKey: "LI", applicantKey: "member" }, { productKey: product.id, categoryKey: "LI", applicantKey: "spouse" }];
  for (const [answer, associationMember, expected] of [["yes", true, "ineligible"], ["no", false, "eligible"], ["", undefined, "needs-information"], ["unknown", undefined, "needs-information"]] as const) {
    const native = resolveEffectiveEligibility(library.site, product.id, "spouse", { ageYears: 40, associationMember, selectedPlans: plans });
    expect(native).toMatchObject(expected === "needs-information" ? { status: expected } : { status: "resolved", eligible: expected === "eligible" });
    expect(resolveApplicationCoverage(product, "spouse", { ...form.values, "spouse-membership": answer }, library.products).eligibility).toBe(expected);
  }
  expect(resolveApplicationCoverage(product, "member", { ...form.values, "spouse-membership": "yes" }, library.products).eligibility).toBe("eligible");
  expect(eligibilityIneligibilityMessage(library.client.applicantExperience, { dependents: ["spouse"], "spouse-membership": "yes" })).toContain("apply separately");
  expect(eligibilityIneligibilityMessage(library.client.applicantExperience, { dependents: [], "spouse-membership": "yes" })).toBeUndefined();
  window.history.replaceState(null, "", "/?site=waepa");
  expect(getClientPageFields("eligibility", form.values).find(field => field.id === "spouse-membership")).toMatchObject({ required: true, label: "Is your spouse currently a WAEPA member or becoming a WAEPA member?" });
  for (const site of ["waepa-gi", "abe", "ama"]) expect(resolvePrototypeLibrary(db, site, "other-site").client.applicantExperience?.eligibilityDisqualifications).toBeUndefined();
});

it("supports captured owner edits and rejects malformed rules, with idempotent adoption", () => {
  const original = resolvePrototypeLibrary(db, "waepa", "captured"), copy = structuredClone(db);
  const fact = copy.configurationValues.find(row => row.key === "waepa.li-group-term.spouse.member-eligibility")!;
  fact.value = [{ fact: "associationMember", equals: true }];
  expect(resolveEffectiveEligibility(resolvePrototypeLibrary(copy, "waepa", "edited").site, "li-group-term", "spouse", { ageYears: 40, associationMember: false })).toMatchObject({ eligible: false });
  expect(original.client.applicantExperience?.eligibilityDisqualifications).toEqual(resolvePrototypeLibrary(db, "waepa", "unchanged").client.applicantExperience?.eligibilityDisqualifications);
  expect(isApplicantExperience({ eligibilityDisqualifications: [{ applicant: "unknown", fieldId: "spouse-membership", value: "yes", message: "Blocked" }] })).toBe(false);
  const repeated = structuredClone(db); applyWaepaSpouseMembershipAdoption(repeated); expect(repeated).toEqual(db);
  expect(validateMigrationDatabase(db)).toEqual([]);
});

it("shows the WAEPA question and error immediately and disables Eligibility Next only for Yes", async () => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  window.history.replaceState(null, "", "/?site=waepa");
  installPrototypeLibrary(resolvePrototypeLibrary(db, "waepa", "spouse-render"));
  const container = document.createElement("div"), root = createRoot(container); document.body.append(container);
  try {
    await act(async () => root.render(<MemoryRouter><Eligibility /></MemoryRouter>));
    const group = container.querySelector('[role="radiogroup"][aria-labelledby="spouse-membership-label"]')!;
    expect(group).not.toBeNull();
    const [yes, no] = group.querySelectorAll<HTMLElement>('label.SelectionGroup-root');
    await act(async () => yes.click());
    expect(container.querySelector('.MuiAlert-standardError')?.textContent).toContain("apply separately");
    expect([...container.querySelectorAll<HTMLButtonElement>('button[type="submit"]')].find(button => button.textContent?.includes("Next"))?.disabled).toBe(true);
    await act(async () => no.click());
    expect(container.querySelector('.MuiAlert-standardError')).toBeNull();
    expect([...container.querySelectorAll<HTMLButtonElement>('button[type="submit"]')].find(button => button.textContent?.includes("Next"))?.disabled).toBe(false);
  } finally { await act(async () => root.unmount()); container.remove(); }
});
