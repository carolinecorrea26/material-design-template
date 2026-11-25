import * as pageConfiguration from "../config/pages";
import { act, useState } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter, useLocation } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import FormRoutePage from "./RoutePage";
import AppBody from "../components/layout/AppBody";
import SinglePageSections from "../components/layout/SinglePageSections";
import { ApplicationFormContext, type ApplicationFormValues } from "./ApplicationFormContext";
import { ApplicationSessionProvider } from "./ApplicationSessionContext";
import { useSinglePageFlow } from "./SinglePageFlowContext";
import { sendAutosaveMockEmail } from "../utils/mockEmail";

vi.mock("../config/clientFields/getClientPageFields", () => ({ getClientPageFields: (id: string) =>
  (id === "membership" ? ["membership", "first-name", "email", "phone"] : id === "eligibility" ? ["birth-date", "state-province"] : ["answer"])
    .map(id => ({ id, inputType: "text", label: id })) }));
vi.mock("../config/pageSections", async importOriginal => ({ ...await importOriginal<object>(), getPageSections: () => [] }));
vi.mock("../config/formFlow", async importOriginal => ({
  ...await importOriginal<object>(),
  getResolvedFormFlow: () => ["membership", "eligibility", "coverage"],
  getActiveFormFlow: () => ["membership", "eligibility", "coverage"],
  getNextFormPageId: (id: string) => ({ membership: "eligibility", eligibility: "coverage" })[id],
  getPreviousFormPageId: (id: string) => ({ eligibility: "membership", coverage: "eligibility" })[id],
}));
vi.mock("../utils/mockEmail", () => ({ sendAutosaveMockEmail: vi.fn().mockResolvedValue(undefined) }));

beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  vi.useFakeTimers();
  vi.mocked(sendAutosaveMockEmail).mockClear().mockResolvedValue(undefined);
  sessionStorage.setItem("activeFormTemplate", "single");
  vi.spyOn(window, "scrollTo").mockImplementation(() => {});
  Object.defineProperty(HTMLElement.prototype, "scrollIntoView", { configurable: true, writable: true, value: vi.fn() });
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => { callback(0); return 1; });
  vi.stubGlobal("cancelAnimationFrame", () => {});
});
afterEach(() => {
  sessionStorage.clear();
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

async function mountFlow() {
  function LocationProbe() { return <output data-location>{useLocation().pathname}</output>; }
  function JumpAhead() {
    const flow = useSinglePageFlow();
    return <button type="button" data-jump onClick={() => flow?.goToSection("coverage")}>Jump ahead</button>;
  }
  function Harness() {
    const [values, setValues] = useState<ApplicationFormValues>({ membership: "yes", "first-name": "Jane", email: "old@example.test", phone: "2125550100", "birth-date": "1990-01-01", "state-province": "NY" });
    return <ApplicationFormContext value={{ values, setPageValues: patch => setValues(current => ({ ...current, ...patch })), resetValues: () => setValues({}) }}>
      <ApplicationSessionProvider><MemoryRouter initialEntries={["/"]}><AppBody>
        <h1>Persistent landing hero</h1><LocationProbe />
        <SinglePageSections renderPage={pageId => <FormRoutePage key={pageId} pageId={pageId}>
          {({ allFields, control, setValue }) => <><JumpAhead />{allFields.map(field => <input key={field.id} aria-label={field.id} {...control.register(field.id, { required: field.id === "birth-date" })} />)}
            <button type="button" data-clear onClick={() => setValue("birth-date", "")}>Clear birth date</button>
            <button type="button" data-restore onClick={() => setValue("birth-date", "1990-01-01")}>Restore birth date</button>
          </>}
        </FormRoutePage>} />
      </AppBody></MemoryRouter></ApplicationSessionProvider>
    </ApplicationFormContext>;
  }
  const node = document.createElement("div"); document.body.append(node);
  const root = createRoot(node);
  await act(async () => root.render(<Harness />));
  return { node, async close() { await act(async () => root.unmount()); node.remove(); } };
}
async function click(node: HTMLElement, selector: string) {
  const button = node.querySelector<HTMLButtonElement>(selector)!;
  expect(button).not.toBeNull();
  await act(async () => button.click());
}
async function next(node: HTMLElement) {
  await act(async () => node.querySelector("form")!.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })));
}

describe("single-page transitions and breadcrumb navigation", () => {
  it("reopens later checkpoints when editing and requires successful validation before advancing again", async () => {
    const { node, close } = await mountFlow();
    try {
      await next(node);
      await next(node);
      expect(node.querySelector("#coverage-form")).not.toBeNull();
      await click(node, '[aria-label="Edit Getting started"]');
      expect(node.querySelector("#eligibility-form")).not.toBeNull();
      expect(node.querySelector('[aria-label="Edit Coverage"]')).toBeNull();
      await click(node, '[data-clear]');
      await click(node, '[data-jump]');
      expect(node.querySelector("#eligibility-form")).not.toBeNull();
      await next(node);
      expect(node.querySelector("#eligibility-form")).not.toBeNull();
      await click(node, '[data-restore]');
      await next(node);
      expect(node.querySelector("#coverage-form")).not.toBeNull();
    } finally { await close(); }
  });
  it("navigates immediately with one card per main step and checks completed breadcrumbs", async () => {
    const { node, close } = await mountFlow();
    try {
      const hero = node.querySelector("h1");
      await next(node);
      expect(node.querySelector("h1")).toBe(hero);
     
      expect(node.querySelector("#eligibility-form")).not.toBeNull();
      const breadcrumbLink = node.querySelector<HTMLButtonElement>('.MuiBreadcrumbs-root [aria-label="Go to Membership"]');
      expect(breadcrumbLink?.querySelector('[data-testid="CheckCircleRoundedIcon"]')).not.toBeNull();
      expect(breadcrumbLink?.disabled).toBe(false);
      expect(node.querySelector('.MuiBreadcrumbs-root [data-testid="EditRoundedIcon"]')).toBeNull();

      await click(node, '[aria-label="Go back"]');
      expect(node.querySelector("#membership-form")).not.toBeNull();
      await next(node);
      await next(node);

      const completed = node.querySelector('[data-single-page-step="getting-started"]')!;
      expect(completed.querySelector("form")).toBeNull();
      expect(completed.querySelector(".MuiStepIcon-root.Mui-completed")).not.toBeNull();
      expect(completed.textContent).not.toContain("Membership");
      expect(completed.textContent).not.toContain("Eligibility");
      expect(completed.querySelectorAll("button")).toHaveLength(1);
      expect(node.querySelector('[aria-label="Continue Coverage"]')).toBeNull();
      await click(node, '[aria-label="Edit Getting started"]');
      expect(node.querySelector("#eligibility-form")).not.toBeNull();
      expect(completed.querySelector(".MuiStepIcon-root.Mui-completed")).toBeNull();
      expect(completed.querySelector(".MuiStepIcon-root.Mui-active")?.textContent).toBe("1");
      await click(node, '.MuiBreadcrumbs-root [aria-label="Go to Membership"]');
      expect(node.querySelector("#membership-form")).not.toBeNull();
      expect(completed.querySelector(".MuiStepIcon-root.Mui-completed")).toBeNull();
      await next(node);
      expect(node.querySelector("#eligibility-form")).not.toBeNull();
      expect(node.querySelector("[data-location]")?.textContent).toBe("/");
      expect(node.querySelectorAll("form")).toHaveLength(1);
    } finally { await close(); }
  });
});


it.each(["next", "back"] as const)("multi-page %s navigation uses the configured route rather than a page ID path", async direction => {
  sessionStorage.setItem("activeFormTemplate", "multi");
  vi.spyOn(pageConfiguration, "getPagePath").mockImplementation(id => `/saved-${id}`);
  function LocationProbe() { return <output data-location>{useLocation().pathname}</output>; }
  const node = document.createElement("div"); document.body.append(node);
  const root = createRoot(node);
  try {
    await act(async () => root.render(
      <ApplicationFormContext value={{ values: {}, setPageValues: () => {}, resetValues: () => {} }}>
        <ApplicationSessionProvider><MemoryRouter initialEntries={["/saved-eligibility"]}>
          <LocationProbe /><FormRoutePage pageId="eligibility">{() => <div>Eligibility inputs</div>}</FormRoutePage>
        </MemoryRouter></ApplicationSessionProvider>
      </ApplicationFormContext>,
    ));
    if (direction === "next") { await next(node); }
    else await click(node, '[aria-label="Go back"]');
    expect(node.querySelector("[data-location]")?.textContent).toBe(direction === "next" ? "/saved-coverage" : "/saved-membership");
  } finally { await act(async () => root.unmount()); node.remove(); }
});
