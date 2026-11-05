import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeAll, expect, it, vi } from "vitest";
import Profile from "./Profile";
import { createReviewedMigrationDatabase } from "../migration/fixtures";
import { installPrototypeLibrary, resolvePrototypeLibrary } from "../domain/prototypeLibrary";
import type { DatabaseSchema } from "../persistence/types";

const form = vi.hoisted(() => ({ values: {} as Record<string, unknown>, setPageValues: vi.fn(), saveApplication: vi.fn() }));
vi.mock("../app/ApplicationFormContext", () => ({ useApplicationForm: () => form }));
vi.mock("../app/ApplicationSessionContext", () => ({ useApplicationSession: () => ({ reviewSubmitted: false, markReviewSubmitted: vi.fn() }) }));
vi.mock("../app/SinglePageFlowContext", () => ({ useSinglePageFlow: () => ({ pageId: "profile", navigationPending: false, setNavigationPending: vi.fn(), completeSection: vi.fn(), goToSection: vi.fn() }) }));
let db: DatabaseSchema, root: Root | undefined, container: HTMLDivElement;
beforeAll(() => { db = createReviewedMigrationDatabase(); }, 120000);
afterEach(async () => { if (root) await act(async () => root!.unmount()); container?.remove(); root = undefined; installPrototypeLibrary(null); vi.unstubAllGlobals(); window.sessionStorage.clear(); });
function prepare() {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  window.history.replaceState(null, "", "/?site=asce"); installPrototypeLibrary(resolvePrototypeLibrary(db, "asce", "Profile-review"));
  form.values = { membership: "yes", dependents: ["spouse"], coverageSelections: ["li-term", "di-ltd"], productApplicants: { "li-term": ["member", "spouse"], "di-ltd": ["member"] }, coverageAmounts: { "li-term:member": 100000, "li-term:spouse": 50000, "di-ltd:member": 3000 } };
  container = document.createElement("div"); document.body.append(container); root = createRoot(container);
}
async function render(key = "initial") { await act(async () => root!.render(<MemoryRouter><Profile key={key} /></MemoryRouter>)); }
const field = (id: string) => container.querySelector(`[name="${id}"]`);

it("keeps ABE financial questions below Other coverage on Profile at the inclusive combined member DI threshold", async () => {
  prepare(); window.history.replaceState(null, "", "/?site=abe"); installPrototypeLibrary(resolvePrototypeLibrary(db, "abe", "financial-profile"));
  form.values = { coverageSelections: ["di-ltd", "di-mtd", "oo-professional"], productApplicants: { "di-ltd": ["member", "spouse"], "di-mtd": ["member"], "oo-professional": ["member"] }, coverageAmounts: { "di-ltd:member": 4000, "di-mtd:member": 3000, "di-ltd:spouse": 5000, "oo-professional:member": 2000 } };
  await render("abe-financial");
  expect(field("total-net-worth")).not.toBeNull();
  expect(container.textContent!.indexOf("Financial questionnaire")).toBeGreaterThan(container.textContent!.indexOf("Other coverage"));
  expect(field("spouse-total-net-worth")).toBeNull();
  form.values = { ...form.values, coverageAmounts: { "di-ltd:member": 4000, "di-mtd:member": 2900, "di-ltd:spouse": 5000, "oo-professional:member": 2000 } };
  await render("abe-below-threshold"); expect(field("total-net-worth")).toBeNull();
  form.values = { ...form.values, productApplicants: { "di-ltd": ["spouse"], "di-mtd": [], "oo-professional": [] }, coverageAmounts: { "di-ltd:member": 10000, "di-ltd:spouse": 8000 } };
  await render("spouse-only"); expect(field("total-net-worth")).toBeNull();
});

it("shows and collapses member/spouse license, travel and existing-Life follow-ups without activating the full financial questionnaire", async () => {
  prepare();
  for (const prefix of ["", "spouse-"]) Object.assign(form.values, { [`${prefix}has-drivers-license`]: "yes", [`${prefix}intend-live-outside-us`]: "yes", [`${prefix}travel-outside-us-six-months`]: "yes", [`${prefix}has-other-life-insurance`]: "yes" });
  await render();
  for (const prefix of ["", "spouse-"]) {
    for (const id of ["drivers-license-number", "outside-us-country", "outside-us-months", "travel-outside-us-country", "existing-life-insurance-amount"]) expect(field(`${prefix}${id}`), `${prefix}${id}`).not.toBeNull();
  }
  expect(field("total-net-worth")).toBeNull();
  form.values = { ...form.values };
  for (const prefix of ["", "spouse-"]) Object.assign(form.values, { [`${prefix}has-drivers-license`]: "no", [`${prefix}intend-live-outside-us`]: "no", [`${prefix}travel-outside-us-six-months`]: "no", [`${prefix}has-other-life-insurance`]: "no" });
  await render("collapsed");
  for (const prefix of ["", "spouse-"]) for (const id of ["drivers-license-number", "outside-us-country", "outside-us-months", "travel-outside-us-country", "existing-life-insurance-amount"]) expect(field(`${prefix}${id}`), `${prefix}${id}`).toBeNull();
});

it("preserves repeatable disability insurance records, restores Edit values and requires removal confirmation", async () => {
  prepare();
  form.values = { ...form.values, "has-disability-insurance": "yes", selfDisabilityCompanies: [{ company: "Existing Carrier", monthlyBenefitAmount: "1200", benefitPeriod: "Age 65", waitingPeriod: "90 days" }] };
  await render();
  expect(container.textContent).toContain("Existing Carrier");
  const button = (label: string, scope: ParentNode = document) => [...scope.querySelectorAll("button")].find(button => button.textContent?.trim() === label)!;
  await act(async () => button("Edit", container).click());
  expect((document.querySelector('[name="di-company-name"]') as HTMLInputElement).value).toBe("Existing Carrier");
  expect((document.querySelector('[name="di-company-benefit-period"]') as HTMLInputElement).value).toBe("Age 65");
  await act(async () => button("Cancel", document.querySelector('[role="dialog"]')!).click());
  await act(async () => button("Remove", container).click());
  const confirmation = document.querySelector('[role="alertdialog"]')!;
  expect(confirmation.textContent).toContain("Are you sure");
  expect(container.textContent).toContain("Existing Carrier");
  await act(async () => button("Remove", confirmation).click());
  expect(container.textContent).not.toContain("Existing Carrier");
  await act(async () => button("Add Company", container).click());
  for (const id of ["di-company-name", "di-company-monthly-benefit", "di-company-benefit-period", "di-company-waiting-period"]) expect(document.querySelector(`[role="dialog"] [name="${id}"]`)).not.toBeNull();
});

it("shows the source NY replacement notice only for each active adult's Yes answer in Other Coverage", async () => {
  prepare();
  const text = "It may not be in your best interest to replace existing life insurance";
  Object.assign(form.values, { "state-province": "NY", "has-other-life-insurance": "yes", "is-replacing-life-insurance": "yes", "spouse-has-other-life-insurance": "yes", "spouse-is-replacing-life-insurance": "no" });
  await render();
  const memberNotice = container.querySelector('[data-testid="self-life-replacement-notice"]')!;
  expect(memberNotice.textContent).toContain(text);
  expect(memberNotice.closest('.MuiTypography-root')?.getAttribute('class')).toBeTruthy();
  expect(container.querySelector('[data-testid="spouse-life-replacement-notice"]')).toBeNull();
  for (const [key, changes] of Object.entries({ no: { "is-replacing-life-insurance": "no" }, otherState: { "state-province": "PA" }, noExistingLife: { "has-other-life-insurance": "no" }, noActiveLife: { coverageSelections: ["di-ltd"] }, zeroAmount: { coverageAmounts: { "li-term:member": 0, "di-ltd:member": 3000 } } })) {
    const original = { ...form.values };
    Object.assign(form.values, changes); await render(key);
    expect(container.textContent, key).not.toContain(text);
    form.values = original;
  }
  Object.assign(form.values, { "is-replacing-life-insurance": "no", "spouse-is-replacing-life-insurance": "yes" });
  await render("spouse");
  expect(container.querySelector('[data-testid="self-life-replacement-notice"]')).toBeNull();
  expect(container.querySelector('[data-testid="spouse-life-replacement-notice"]')?.textContent).toContain(text);
  const copy = structuredClone(db);
  (copy.configurationValues.find(row => row.key === "global:shared.profile.lifeReplacementNotice")!.value as { text: string }).text = "Captured replacement wording";
  installPrototypeLibrary(resolvePrototypeLibrary(copy, "asce", "edited-notice"));
  await render("edited"); expect(container.textContent).toContain("Captured replacement wording");
});
