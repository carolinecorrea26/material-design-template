import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import FormRoutePage, { type BeforeNextContext } from "./RoutePage";
import { ApplicationFormContext } from "./ApplicationFormContext";
import FieldRenderer from "../components/forms/FieldRenderer";
import type { PageId } from "../types";

const session = vi.hoisted(() => ({ reviewSubmitted: false, advisorApplicantFlow: false, markReviewSubmitted: vi.fn() }));
vi.mock("./ApplicationSessionContext", () => ({ useApplicationSession: () => session }));
vi.mock("./SinglePageFlowContext", () => ({ useSinglePageFlow: () => null }));
vi.mock("../config/clientFields/getClientPageFields", () => ({ getClientPageFields: () => [{ id: "first-name", label: "First name", inputType: "text", required: true }] }));
vi.mock("../config/pageSections", async original => ({ ...await original<typeof import("../config/pageSections")>(), getPageSections: () => [] }));
vi.mock("../config/progressSteps", async original => ({ ...await original<typeof import("../config/progressSteps")>(), getActiveProgressStepIndex: () => -1, getActiveProgressSteps: () => [] }));
vi.mock("../analytics/runtime", () => ({ attachPageAnalytics: () => () => {}, emitPageAnalytics: () => {} }));
vi.mock("../utils/mockEmail", () => ({ sendAutosaveMockEmail: vi.fn(async () => {}) }));

let root: Root, container: HTMLDivElement;
const save = vi.fn(), setValues = vi.fn(), scrollIntoView = vi.fn();
const originalScroll = Object.getOwnPropertyDescriptor(Element.prototype, "scrollIntoView");
beforeEach(() => {
  vi.useFakeTimers(); vi.clearAllMocks(); save.mockResolvedValue(null); session.reviewSubmitted = false;
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true); vi.stubGlobal("scrollTo", vi.fn());
  Object.defineProperty(Element.prototype, "scrollIntoView", { configurable: true, value: scrollIntoView });
  container = document.createElement("div"); document.body.append(container); root = createRoot(container);
});
afterEach(async () => {
  await act(async () => root.unmount()); container.remove(); vi.useRealTimers(); vi.unstubAllGlobals();
  if (originalScroll) Object.defineProperty(Element.prototype, "scrollIntoView", originalScroll); else Reflect.deleteProperty(Element.prototype, "scrollIntoView");
});
async function render({ pageId = "membership", name = "Taylor", validate, onBeforeNext }: { pageId?: PageId; name?: string; validate?: () => string | undefined; onBeforeNext?: (context: BeforeNextContext) => boolean } = {}) {
  await act(async () => root.render(<MemoryRouter><ApplicationFormContext.Provider value={{ values: { "first-name": name }, setPageValues: setValues, resetValues: () => {}, saveApplication: save }}><FormRoutePage pageId={pageId} validate={validate} onBeforeNext={onBeforeNext}>{({ allFields, control, errors }) => <FieldRenderer field={allFields[0]} control={control} errors={errors} />}</FormRoutePage></ApplicationFormContext.Provider></MemoryRouter>));
}
async function submit() { await act(async () => container.querySelector("form")!.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }))); }

it("blocks required-field failure before save and scrolls to the invalid field", async () => {
  await render({ name: "" }); await submit();
  expect(save).not.toHaveBeenCalled(); expect(container.textContent).toContain("Please correct the errors below");
  expect(container.querySelector('[aria-invalid="true"]')).not.toBeNull();
  await act(async () => vi.advanceTimersByTimeAsync(100));
  expect(scrollIntoView).toHaveBeenCalledWith({ behavior: "smooth", block: "center" });
});
it("blocks page validation before save and shows its message at the top", async () => {
  await render({ validate: () => "This page needs review" }); await submit();
  expect(save).not.toHaveBeenCalled(); expect(container.textContent).toContain("This page needs review");
  expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: "smooth" });
});
it("holds the completed page until the intermediate-step callback continues", async () => {
  let resume: (() => void) | undefined;
  await render({ onBeforeNext: ({ continueNavigation }) => { resume = continueNavigation; return false; } });
  await submit(); expect(save).toHaveBeenCalledOnce(); expect(resume).toBeDefined();
  expect(container.querySelector("form")).not.toBeNull(); expect(container.textContent).not.toContain("Confirming");
  await act(async () => resume!());
  expect(container.querySelector("form")).toBeNull();
});
it("hides Back at entry and after submitted Review, and exposes it before submission", async () => {
  await render(); expect(container.querySelector('[aria-label="Go back"]')).toBeNull();
  await render({ pageId: "payment" }); expect(container.querySelector('[aria-label="Go back"]')).not.toBeNull();
  session.reviewSubmitted = true;
  await render({ pageId: "payment" }); expect(container.querySelector('[aria-label="Go back"]')).toBeNull();
});
