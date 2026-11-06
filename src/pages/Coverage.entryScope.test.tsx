import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeAll, expect, it, vi } from "vitest";
import Coverage from "./Coverage";
import { createReviewedMigrationDatabase } from "../migration/fixtures";
import { installPrototypeLibrary, resolvePrototypeLibrary } from "../domain/prototypeLibrary";
import type { DatabaseSchema } from "../persistence/types";
const form = vi.hoisted(() => ({ values: {} as Record<string, unknown>, setPageValues: vi.fn(), saveApplication: vi.fn() }));
vi.mock("../app/ApplicationFormContext", async original => ({ ...await original<typeof import("../app/ApplicationFormContext")>(), useApplicationForm: () => form }));
vi.mock("../app/ApplicationSessionContext", () => ({ useApplicationSession: () => ({ reviewSubmitted: false, markReviewSubmitted: vi.fn() }) }));
vi.mock("../app/SinglePageFlowContext", () => ({ useSinglePageFlow: () => null }));
vi.mock("../app/usePrototypeRates", () => ({ usePrototypeRates: () => ({ enabled: true, premium: () => NaN, display: () => ({ status: "needs-information" }) }) }));
let db: DatabaseSchema, root: Root | undefined, container: HTMLDivElement;
beforeAll(() => { db = createReviewedMigrationDatabase(); }, 120000);
afterEach(async () => { if (root) await act(async () => root!.unmount()); container?.remove(); root = undefined; installPrototypeLibrary(null); vi.unstubAllGlobals(); window.sessionStorage.clear(); vi.useRealTimers(); });
it("shows the narrowed portfolio and offers explicit removal without silently deleting saved choices", async () => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true); vi.useFakeTimers();
  window.history.replaceState(null, "", "/coverage?site=ama&category=di&prods=G-30639-0");
  const library = resolvePrototypeLibrary(db, "ama", "campaign-page"); installPrototypeLibrary(library);
  form.values = { membership: "physician", "birth-date": "1990-01-01", state: "PA", "actively-at-work": "yes", coverageSelections: ["di-step-rated", "li-term"], productApplicants: { "di-step-rated": ["member"], "li-term": ["member"] }, coverageAmounts: { "di-step-rated:member": 1000, "li-term:member": 100000 } };
  form.setPageValues.mockClear();
  container = document.createElement("div"); document.body.append(container); root = createRoot(container);
  await act(async () => root!.render(<MemoryRouter><Coverage /></MemoryRouter>));
  await act(async () => vi.advanceTimersByTimeAsync(1500));
  expect(container.textContent).toContain(library.products.find(product => product.id === "di-step-rated")!.name);
  expect(container.textContent).not.toContain(library.products.find(product => product.id === "di-level-rated")!.name);
  expect(container.textContent).toContain("Some previously selected coverage is not available through this link");
  expect(form.values.coverageSelections).toEqual(["di-step-rated", "li-term"]);
  const remove = [...container.querySelectorAll("button")].find(button => button.textContent === "Remove unavailable selections")!;
  expect(remove).toBeDefined();
  form.setPageValues.mockClear(); await act(async () => remove.click());
  expect(form.setPageValues).toHaveBeenCalledWith({ coverageSelections: ["di-step-rated"] });
  expect(form.values.coverageAmounts).toEqual({ "di-step-rated:member": 1000, "li-term:member": 100000 });
});

it("disables other ASCE child Life selections but keeps the selected plan removable", async () => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true); vi.useFakeTimers();
  window.history.replaceState(null, "", "/coverage?site=asce");
  installPrototypeLibrary(resolvePrototypeLibrary(db, "asce", "child-exclusivity"));
  form.values = {
    membership: "yes", "birth-date": "1990-01-15", "state-province": "NY", dependents: ["child"],
    children: [{ "child-first-name": "Example", "child-last-name": "Child", "child-birth-date": "2016-01-01", "child-full-time-student": "no" }],
    coverageSelections: ["li-term", "li-10yr"],
    productApplicants: { "li-term": ["member"], "li-10yr": ["child"] },
    coverageAmounts: { "li-term:member": 100000, "li-10yr:child": 10000 },
    selectedCategoryChips: ["LI"],
  };
  form.setPageValues.mockImplementation(patch => Object.assign(form.values, patch));
  container = document.createElement("div"); document.body.append(container); root = createRoot(container);
  await act(async () => root!.render(<MemoryRouter><Coverage /></MemoryRouter>));
  await act(async () => vi.advanceTimersByTimeAsync(1500));
  const child = (product: string) => container.querySelector<HTMLInputElement>(`input[name="${product}:child-selected"]`)!;
  expect(child("li-10yr").checked).toBe(true);
  expect(child("li-10yr").disabled).toBe(false);
  expect(child("li-term").disabled).toBe(true);
  expect(child("li-20yr").disabled).toBe(true);
});
