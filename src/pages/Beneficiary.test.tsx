import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeAll, expect, it, vi } from "vitest";
import Beneficiary from "./Beneficiary";
import { createReviewedMigrationDatabase } from "../migration/fixtures";
import { installPrototypeLibrary, resolvePrototypeLibrary } from "../domain/prototypeLibrary";
import type { DatabaseSchema } from "../persistence/types";

const form = vi.hoisted(() => ({ values: {} as Record<string, unknown>, setPageValues: vi.fn(), saveApplication: vi.fn() }));
vi.mock("../app/ApplicationFormContext", () => ({ useApplicationForm: () => form }));
vi.mock("../app/ApplicationSessionContext", () => ({ useApplicationSession: () => ({ reviewSubmitted: false, markReviewSubmitted: vi.fn() }) }));
vi.mock("../app/SinglePageFlowContext", () => ({ useSinglePageFlow: () => null }));
let db: DatabaseSchema, root: Root | undefined, container: HTMLDivElement;
beforeAll(() => { db = createReviewedMigrationDatabase(); }, 120000);
afterEach(async () => { if (root) await act(async () => root!.unmount()); container?.remove(); root = undefined; installPrototypeLibrary(null); vi.unstubAllGlobals(); window.sessionStorage.clear(); });
const person = (id: string, share = 50) => ({ id, designation: "primary", beneficiaryType: "individual", firstName: "Existing", lastName: "Beneficiary", relationship: "Sibling", share });
function prepare() {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  window.history.replaceState(null, "", "/?site=asce"); installPrototypeLibrary(resolvePrototypeLibrary(db, "asce", "Beneficiary-review"));
  form.values = { membership: "yes", coverageSelections: ["li-10yr", "li-20yr"], productApplicants: { "li-10yr": ["member"], "li-20yr": ["member"] }, coverageAmounts: { "li-10yr:member": 100000, "li-20yr:member": 100000 }, beneficiaries: { "li-10yr:member": [person("a")] } };
  form.setPageValues.mockReset(); form.setPageValues.mockImplementation(patch => { form.values = { ...form.values, ...patch }; });
  container = document.createElement("div"); document.body.append(container); root = createRoot(container);
}
async function render(key = "initial") { await act(async () => root!.render(<MemoryRouter><Beneficiary key={key} /></MemoryRouter>)); }
const button = (label: string, scope: ParentNode = document) => [...scope.querySelectorAll("button")].find(button => button.textContent?.trim() === label)!;
const dialog = () => [...document.querySelectorAll('[role="dialog"]')].at(-1)!;
it("restores Edit fields, changes allocations and preserves independent saved products", async () => {
  prepare(); await render();
  await act(async () => button("Edit", container).click());
  expect((dialog().querySelector('[name="firstName"]') as HTMLInputElement).value).toBe("Existing");
  expect((dialog().querySelector('[name="share"]') as HTMLInputElement).value).toBe("50");
  await act(async () => button("100%", dialog()).click());
  expect(dialog().textContent).toContain("0% unassigned remaining");
  await act(async () => (dialog().querySelector("form") as HTMLFormElement).dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })));
  const saved = (form.values.beneficiaries as Record<string, Array<Record<string, unknown>>>)["li-10yr:member"];
  expect(saved).toHaveLength(1); expect(saved[0]).toMatchObject({ id: "a", firstName: "Existing", share: 100 });
  expect((form.values.beneficiaries as Record<string, unknown>)["li-20yr:member"]).toBeUndefined();
  await render(); await act(async () => button("Remove", container).click());
  expect((form.values.beneficiaries as Record<string, unknown>)["li-10yr:member"]).toEqual([]);
});
it("shows both designation limits and restores the trust form independently", async () => {
  prepare(); form.values = { ...form.values, beneficiaries: { "li-10yr:member": [person("a", 100), { id: "trust", designation: "contingent", beneficiaryType: "trust", trustName: "Saved trust", trustDate: "2000-01-01", share: 0 }] } }; await render();
  expect(container.textContent).toContain("SAVED TRUST");
  const edits = [...container.querySelectorAll("button")].filter(button => button.textContent === "Edit");
  await act(async () => edits[1].click());
  expect((dialog().querySelector('[name="trustName"]') as HTMLInputElement).value).toBe("Saved trust");
  expect(dialog().textContent).toContain("Contingent");
  expect(dialog().querySelector('[name="firstName"]')).toBeNull();
  await act(async () => button("Cancel", dialog()).click());
  const additions = [...container.querySelectorAll("button")].filter(button => button.textContent === "Add Beneficiary");
  expect(additions).toHaveLength(1); // Only the other product remains available.
});
it("copies a new beneficiary with separate IDs and blocks an incompatible target", async () => {
  prepare(); form.values = { ...form.values, coverageSelections: ["li-10yr", "li-20yr", "li-term"], productApplicants: { "li-10yr": ["member"], "li-20yr": ["member"], "li-term": ["member"] }, coverageAmounts: { "li-10yr:member": 100000, "li-20yr:member": 100000, "li-term:member": 100000 }, beneficiaries: { "li-20yr:member": [{ id: "trust", designation: "primary", beneficiaryType: "trust", trustName: "Existing trust", trustDate: "2000-01-01", share: 0 }] } }; await render();
  await act(async () => button("Add Beneficiary", container).click());
  for (const [name, value] of [["firstName", "New"], ["lastName", "Beneficiary"]]) await act(async () => {
    const input = dialog().querySelector(`[name="${name}"]`)!;
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(input, value);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await act(async () => (dialog().querySelector('[role="combobox"]') as HTMLElement).dispatchEvent(new MouseEvent("mousedown", { bubbles: true })));
  await act(async () => ([...document.querySelectorAll('[role="option"]')].find(option => option.textContent === "Sibling") as HTMLElement).click());
  await act(async () => button("100%", dialog()).click());
  await act(async () => (dialog().querySelector("form") as HTMLFormElement).dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })));
  const targets = [...dialog().querySelectorAll('input[type="checkbox"]')] as HTMLInputElement[];
  expect(targets).toHaveLength(2); expect(targets.filter(target => target.disabled)).toHaveLength(1); expect(targets.filter(target => !target.disabled)).toHaveLength(1);
  expect(targets.find(target => !target.disabled)!.checked).toBe(true);
  await act(async () => button("Apply to Selected", dialog()).click());
  const saved = form.values.beneficiaries as Record<string, Array<Record<string, unknown>>>;
  expect(saved["li-10yr:member"][0]).toMatchObject({ firstName: "New", relationship: "Sibling", share: 100 });
  expect(saved["li-term:member"][0]).toMatchObject({ firstName: "New", relationship: "Sibling", share: 100 });
  expect(saved["li-term:member"][0].id).not.toBe(saved["li-10yr:member"][0].id);
  expect(saved["li-term:member"][0]).not.toBe(saved["li-10yr:member"][0]);
  expect(saved["li-20yr:member"]).toHaveLength(1); expect(saved["li-20yr:member"][0].id).toBe("trust");
});

it("reuses existing beneficiaries across Self and Spouse with eligible targets preselected", async () => {
  prepare();
  form.values = { ...form.values, dependents: ["spouse"], productApplicants: { "li-10yr": ["member", "spouse"], "li-20yr": ["member", "spouse"] }, coverageAmounts: { "li-10yr:member": 100000, "li-10yr:spouse": 100000, "li-20yr:member": 100000, "li-20yr:spouse": 100000 } };
  await render();
  await act(async () => button("Apply to Other Coverages", container).click());
  const targets = [...dialog().querySelectorAll<HTMLInputElement>('input[type="checkbox"]')];
  expect(targets).toHaveLength(3);
  expect(targets.every(target => target.checked && !target.disabled)).toBe(true);
  expect(dialog().textContent).toContain("Spouse");
  await act(async () => button("Apply to Selected", dialog()).click());
  const saved = form.values.beneficiaries as Record<string, Array<Record<string, unknown>>>;
  for (const key of ["li-20yr:member", "li-10yr:spouse", "li-20yr:spouse"]) expect(saved[key][0]).toMatchObject({ firstName: "Existing", share: 50 });
  expect(new Set(Object.values(saved).flatMap(items => items.map(item => item.id))).size).toBe(4);
});

it("does not offer reuse when only the current coverage remains", async () => {
  prepare();
  form.values = { ...form.values, coverageSelections: ["li-10yr"] };
  await render();
  expect(button("Apply to Other Coverages", container)).toBeUndefined();
  await act(async () => button("Edit", container).click());
  await act(async () => dialog().querySelector("form")!.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })));
  expect(document.querySelector('[role="dialog"]')?.textContent).not.toContain("Apply to Other Coverages");
});
it("honors captured optional participation and renamed saved field bindings", async () => {
  prepare(); const edited = structuredClone(db);
  edited.sitePages.find(row => row.siteKey === "asce" && row.pageKey === "beneficiary")!.requirement = "optional";
  const surfaces = edited.configurationValues.find(row => row.key === "global.field-surfaces")!.value as unknown as { beneficiaryIndividual: { fields: Array<{ fieldKey: string; valueKey: string }> } };
  surfaces.beneficiaryIndividual.fields.find(row => row.fieldKey === "beneficiary-firstName")!.valueKey = "givenName";
  installPrototypeLibrary(resolvePrototypeLibrary(edited, "asce", "optional-renamed-beneficiary"));
  form.values = { ...form.values, "beneficiary-information-opt-in": "no", beneficiaries: { "li-10yr:member": [{ ...person("renamed"), firstName: undefined, givenName: "Captured" }] } }; await render();
  expect(container.textContent).toContain("Do you want to add beneficiary information?");
  expect([...container.querySelectorAll("button")].filter(button => button.textContent === "Add Beneficiary")).toHaveLength(0);
  form.values = { ...form.values, "beneficiary-information-opt-in": "yes" }; await render();
  expect(container.textContent).toContain("CAPTURED BENEFICIARY");
  await act(async () => button("Edit", container).click());
  expect((dialog().querySelector('[name="givenName"]') as HTMLInputElement).value).toBe("Captured");
  expect(dialog().querySelector('[name="firstName"]')).toBeNull();
});
