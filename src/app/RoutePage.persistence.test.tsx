import { act, useEffect, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import FormRoutePage from "./RoutePage";
import { ApplicationFormContext, type ApplicationFormValues } from "./ApplicationFormContext";
import type { PageId } from "../types";
import { sendAutosaveMockEmail } from "../utils/mockEmail";
import SinglePageSections from "../components/layout/SinglePageSections";

vi.mock("../config/clientFields/getClientPageFields", () => ({ getClientPageFields: () => [{ id: "first-name", label: "First name", inputType: "text" }] }));
vi.mock("../config/pageSections", async original => ({ ...await original<typeof import("../config/pageSections")>(), getPageSections: () => [] }));
vi.mock("../config/progressSteps", async original => ({ ...await original<typeof import("../config/progressSteps")>(), getActiveProgressStepIndex: () => -1, getActiveProgressSteps: () => flow.map(page => ({ id: page, label: page, pageIds: [page] })) }));
vi.mock("./ApplicationSessionContext", () => ({ useApplicationSession: () => ({ reviewSubmitted: false, advisorApplicantFlow: false, markReviewSubmitted: () => {} }) }));
vi.mock("../analytics/runtime", () => ({ attachPageAnalytics: () => () => {}, emitPageAnalytics: () => {} }));
vi.mock("../utils/mockEmail", () => ({ sendAutosaveMockEmail: vi.fn(async () => {}) }));
const flow = vi.hoisted(() => ["membership", "eligibility", "coverage", "profile", "contact", "review", "payment"] as PageId[]);
vi.mock("../config/formFlow", async original => ({ ...await original<typeof import("../config/formFlow")>(), getResolvedFormFlow: () => flow, getNextFormPageId: (page: PageId) => flow[flow.indexOf(page) + 1], getPreviousFormPageId: (page: PageId) => flow[flow.indexOf(page) - 1] }));

let root: Root, container: HTMLDivElement, observed: ApplicationFormValues;
const originalScrollIntoView = Object.getOwnPropertyDescriptor(Element.prototype, "scrollIntoView");
const save = vi.fn(), write = vi.fn();
function Page({ pageId }: { pageId: PageId }) {
  return <FormRoutePage pageId={pageId}>{({ setValue }) => <button type="button" onClick={() => setValue("first-name", "Changed")}>Change first name</button>}</FormRoutePage>;
}
function Probe() { const location = useLocation(); return <output data-path>{location.pathname}</output>; }
function Harness({ singlePage = false }: { singlePage?: boolean }) {
  const [values, setValues] = useState<ApplicationFormValues>({ "first-name": "Original", email: "member@example.invalid" });
  useEffect(() => { observed = values; }, [values]);
  return <ApplicationFormContext.Provider value={{ values, resetValues: () => {}, setPageValues: next => { write(next); setValues(previous => ({ ...previous, ...next })); }, saveApplication: save }}>
    {singlePage ? <SinglePageSections renderPage={page => <Page key={page} pageId={page} />} /> : <Routes>{flow.map(page => <Route key={page} path={`/${page}`} element={<Page key={page} pageId={page} />} />)}</Routes>}<Probe />
  </ApplicationFormContext.Provider>;
}
beforeEach(() => {
  vi.useFakeTimers(); vi.clearAllMocks(); save.mockResolvedValue(null);
  vi.stubGlobal("scrollTo", vi.fn());
  Object.defineProperty(Element.prototype, "scrollIntoView", { configurable: true, value: vi.fn() });
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  container = document.createElement("div"); document.body.append(container); root = createRoot(container);
});
afterEach(async () => { await act(async () => root.unmount()); container.remove(); vi.useRealTimers(); vi.unstubAllGlobals(); vi.restoreAllMocks(); if (originalScrollIntoView) Object.defineProperty(Element.prototype, "scrollIntoView", originalScrollIntoView); else Reflect.deleteProperty(Element.prototype, "scrollIntoView"); });
async function render(page = "membership", singlePage = false) { await act(async () => root.render(<MemoryRouter initialEntries={[`/${page}`]}><Harness singlePage={singlePage} /></MemoryRouter>)); }
async function change() { await act(async () => [...container.querySelectorAll("button")].find(button => button.textContent === "Change first name")!.click()); }
async function submit() { await act(async () => container.querySelector("form")!.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }))); }

it("awaits a successful Membership save, retains fields and shows progress feedback on the destination", async () => {
  await render(); await change(); await submit();
  expect(save).toHaveBeenCalledWith(expect.objectContaining({ "first-name": "Changed" }), "membership");
  expect(observed["first-name"]).toBe("Changed");
  expect(sendAutosaveMockEmail).not.toHaveBeenCalled();
  await act(async () => vi.advanceTimersByTimeAsync(4400));
  expect(container.querySelector("[data-path]")?.textContent).toBe("/eligibility");
  expect(container.querySelector('[role="status"]')?.textContent).toContain("Progress saved");
});

it("keeps a failed save on the current page without success feedback or mock communication", async () => {
  save.mockRejectedValue(new Error("Test storage unavailable"));
  await render(); await change(); await submit();
  expect(container.textContent).toContain("We couldn’t save your latest changes.");
  expect(container.textContent).not.toContain("Test storage unavailable");
  expect(container.querySelector("[data-path]")?.textContent).toBe("/membership");
  expect(container.textContent).not.toContain("Progress saved");
  expect(sendAutosaveMockEmail).not.toHaveBeenCalled();
  expect(write).not.toHaveBeenCalled();
});

it("preserves current fields on Back and on an unsaved unmount", async () => {
  await render("eligibility"); await change();
  await act(async () => container.querySelector<HTMLButtonElement>('[aria-label="Go back"]')!.click());
  expect(observed["first-name"]).toBe("Changed");
  expect(save).not.toHaveBeenCalled();
  await act(async () => vi.advanceTimersByTimeAsync(2200));
  expect(container.querySelector("[data-path]")?.textContent).toBe("/membership");
  write.mockClear(); await change();
  await act(async () => root.render(<div>Closed page</div>));
  expect(write).toHaveBeenCalledWith(expect.objectContaining({ "first-name": "Changed" }));
});

it.each(["coverage", "review"])("marks only an explicit %s completion as revalidation", async page => {
  await render(page); await change(); await submit();
  expect(save).toHaveBeenCalledWith(expect.objectContaining({ "first-name": "Changed" }), page);
});

it("saves before expanding the next single-page section and shows success without changing the URL", async () => {
  await render("membership", true); await change(); await submit();
  expect(save).toHaveBeenCalledWith(expect.objectContaining({ "first-name": "Changed" }), "membership");
  await act(async () => vi.advanceTimersByTimeAsync(4400));
  expect(container.querySelector("#eligibility-form")).not.toBeNull();
  expect(container.querySelector("[data-path]")?.textContent).toBe("/membership");
  expect(observed["first-name"]).toBe("Changed");
  expect(container.querySelector('[role="status"]')?.textContent).toContain("Progress saved");
});

it("keeps a failed single-page save in the current section without success feedback", async () => {
  save.mockRejectedValue(new Error("Test storage unavailable"));
  await render("membership", true); await change(); await submit();
  expect(container.querySelector("#membership-form")).not.toBeNull();
  expect(container.querySelector("#eligibility-form")).toBeNull();
  expect(container.textContent).toContain("We couldn’t save your latest changes.");
  expect(container.textContent).not.toContain("Test storage unavailable");
  expect(container.textContent).not.toContain("Progress saved");
});
