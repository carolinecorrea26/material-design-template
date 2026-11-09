import { readFileSync } from "node:fs";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { afterEach, expect, it, vi } from "vitest";
import Eligibility from "./Eligibility";
import { installPrototypeLibrary, resolvePrototypeLibrary } from "../domain/prototypeLibrary";
import { validateSharedCatalog } from "../persistence/sharedCatalog";
import asceEligibility from '../../requirements/parked/sites/asce/eligibility.json';

const form = vi.hoisted(() => ({ values: {} as Record<string, unknown>, setPageValues: vi.fn(), saveApplication: vi.fn(async () => null) }));
vi.mock("../app/ApplicationFormContext", () => ({ useApplicationForm: () => form }));
vi.mock("../app/ApplicationSessionContext", () => ({ useApplicationSession: () => ({ reviewSubmitted: false, markReviewSubmitted: vi.fn() }) }));
vi.mock("../app/SinglePageFlowContext", () => ({ useSinglePageFlow: () => null }));
let root: Root | undefined, container: HTMLDivElement;
afterEach(async () => {
  if (root) await act(async () => root!.unmount());
  container?.remove();
  root = undefined;
  installPrototypeLibrary(null);
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  window.sessionStorage.clear();
});
it("collects a validated residential address before ASCE member verification", async () => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  vi.spyOn(window, "scrollTo").mockImplementation(() => {});
  window.history.replaceState(null, "", "/eligibility?site=asce");
  const catalog = validateSharedCatalog(JSON.parse(readFileSync("public/catalog/portal.json", "utf8")));
  installPrototypeLibrary(resolvePrototypeLibrary(catalog.data, "asce", "test:tpa-address"));
  form.values = {
    ...asceEligibility.tpa.prototypeRecords[0].facts,
    membership: "yes", "zip-postal-code": "10001", dependents: [],
  };
  form.setPageValues.mockImplementation(patch => Object.assign(form.values, patch));
  container = document.createElement("div"); document.body.append(container); root = createRoot(container);
  await act(async () => root!.render(<MemoryRouter><Eligibility /></MemoryRouter>));
  await act(async () => container.querySelector("form")!.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })));
  const dialog = () => document.querySelector('[role="dialog"]')!;
  expect(dialog().textContent).toContain("Confirm your address");
  expect(dialog().textContent).toContain("full residential address");
  expect(dialog().textContent).not.toContain("Choose how you");
  await act(async () => [...dialog().querySelectorAll<HTMLButtonElement>("button")].find(button => button.textContent === "Cancel")!.click());
  expect(dialog()).toBeNull();
  await act(async () => container.querySelector("form")!.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })));
  expect(dialog().textContent).toContain("Confirm your address");
  const continueButton = () => [...dialog().querySelectorAll<HTMLButtonElement>("button")].find(button => button.textContent === "Continue to member verification")!;
  await act(async () => continueButton().click());
  expect(dialog().textContent).toContain("Confirm your address");
  expect(dialog().querySelectorAll('[aria-invalid="true"]').length).toBeGreaterThan(0);
  for (const [name, value] of [["street-address", "100 Example Avenue"], ["city", "New York"]]) {
    await act(async () => {
      const input = dialog().querySelector<HTMLInputElement>(`input[name="${name}"]`)!;
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(input, value);
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });
  }
  await act(async () => continueButton().click());
  expect(form.values).toMatchObject({ "street-address": "100 Example Avenue", city: "New York", state: "NY", "zip-code": "10001" });
  expect(document.body.textContent).toContain("Please choose how you");
  expect(document.body.textContent).not.toContain("Confirm your address");
});
