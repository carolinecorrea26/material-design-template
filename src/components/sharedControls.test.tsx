import { act, type FormEvent } from "react";
import { createRoot, type Root } from "react-dom/client";
import { Button, ThemeProvider, ToggleButton } from "@mui/material";
import { MemoryRouter, useLocation } from "react-router-dom";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { createAppTheme } from "../app/theme";
import QuickDecisionInfoBox from "./content/QuickDecisionInfoBox";
import SelectionGroup from "./forms/SelectionGroup";
import PageNav from "./navigation/PageNav";
import ProgressStep from "./navigation/ProgressStep";

const session = vi.hoisted(() => ({ reviewSubmitted: false, advisorApplicantFlow: false }));
vi.mock("../app/ApplicationFormContext", () => ({ useApplicationForm: () => ({ values: {} }) }));
vi.mock("../app/ApplicationSessionContext", () => ({ useApplicationSession: () => session }));
vi.mock("../config/pages", () => ({ getPagePath: (id: string) => `/configured/${id}`, getPageNavTitle: (id: string) => id }));
vi.mock("../config/progressSteps", () => ({
  HEALTH_PAGE_IDS: [],
  getActiveProgressStepIndex: () => 1,
  getActiveProgressSteps: () => [
    { id: "getting-started", label: "Getting started", pageIds: ["eligibility"] },
    { id: "application-review", label: "Review", pageIds: ["review"] },
    { id: "esign-submit", label: "Submit", pageIds: ["submit"] },
  ],
}));

let container: HTMLDivElement;
let root: Root;
beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  vi.stubGlobal("matchMedia", () => ({ matches: false, addEventListener() {}, removeEventListener() {} }));
  session.reviewSubmitted = false;
  session.advisorApplicantFlow = false;
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
});
afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
});

it("uses a native disclosure button without submitting the surrounding form", async () => {
  const submit = vi.fn((event: FormEvent) => event.preventDefault());
  await act(async () => root.render(<form onSubmit={submit}><QuickDecisionInfoBox /></form>));
  const button = container.querySelector<HTMLButtonElement>("button")!;
  expect(button.type).toBe("button");
  expect(button.getAttribute("aria-expanded")).toBe("false");
  await act(async () => button.click());
  expect(button.textContent).toBe("Show less");
  expect(button.getAttribute("aria-expanded")).toBe("true");
  expect(document.getElementById(button.getAttribute("aria-controls")!)).not.toBeNull();
  await act(async () => button.click());
  expect(button.getAttribute("aria-expanded")).toBe("false");
  expect(submit).not.toHaveBeenCalled();
});

function LocationProbe() {
  return <output>{useLocation().pathname}</output>;
}

it.each(["editable", "submitted", "advisor"] as const)("keeps completed-step navigation correct for %s applications", async mode => {
  session.reviewSubmitted = mode === "submitted";
  session.advisorApplicantFlow = mode === "advisor";
  await act(async () => root.render(
    <MemoryRouter initialEntries={["/review"]}>
      <LocationProbe />
      <ProgressStep pageId="review"><div>Review fields</div></ProgressStep>
    </MemoryRouter>,
  ));
  const buttons = container.querySelectorAll<HTMLButtonElement>(".MuiStepButton-root");
  expect(buttons).toHaveLength(mode === "editable" ? 1 : 0);
  expect(container.textContent).toContain("Review fields");
  if (mode === "editable") {
    expect(buttons[0].type).toBe("button");
    expect(buttons[0].tabIndex).toBe(0);
    await act(async () => buttons[0].click());
    expect(container.querySelector("output")?.textContent).toBe("/configured/eligibility");
  }
});

it("renders shared field and button styles with short theme colors and shared text/border defaults", async () => {
  const theme = createAppTheme({
    type: "custom", primary: "#abc",
  });
  await act(async () => root.render(
    <ThemeProvider theme={theme}>
      <SelectionGroup checked><span className="SelectionGroup-label">Selected choice</span></SelectionGroup>
      <ToggleButton value="yes" selected>Yes</ToggleButton>
      <Button variant="contained">Continue</Button>
      <PageNav formId="application" disabled />
    </ThemeProvider>,
  ));
  const css = Array.from(document.styleSheets)
    .flatMap(sheet => Array.from(sheet.cssRules, rule => rule.cssText))
    .join("\n");
  expect(css).toContain(theme.palette.divider);
  expect(css).toMatch(/color:\s*rgb\(53,\s*59,\s*72\)/);
  expect(css).toContain("rgba(170, 187, 204, 0.1)");
  expect(css).not.toMatch(/#abc(?:1A|33|3d)/);
});
