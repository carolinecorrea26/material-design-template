import { act } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { expect, it, vi } from "vitest";
import Payment from "./Payment";
import { ApplicationFormContext } from "../app/ApplicationFormContext";
import { mockRequest } from "../mock/client";

const continueNavigation = vi.fn();
vi.mock("../mock/client", () => ({ mockRequest: vi.fn() }));
vi.mock("../components/forms/FieldRenderer", () => ({ default: () => null }));
vi.mock("../app/RoutePage", () => ({ default: ({ children, onBeforeNext }: { children: (props: unknown) => unknown; onBeforeNext: (props: unknown) => unknown }) => <>
  <button onClick={() => onBeforeNext({ values: {}, continueNavigation })}>Test submit</button>
  {children({ watchedValues: {}, errors: {}, control: undefined, setValue: () => {} })}
</> }));

it.each([true, false])("checks revision revalidation before submission authorization, required=%s", async requiresRevalidation => {
  vi.stubEnv("VITE_MOCK_PLATFORM_ENABLED", "true"); vi.clearAllMocks();
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  const container = document.createElement("div"); document.body.append(container); const root = createRoot(container);
  try {
    await act(async () => root.render(<MemoryRouter><ApplicationFormContext.Provider value={{ values: {}, setPageValues: () => {}, resetValues: () => {}, requiresRevalidation }}><Payment /></ApplicationFormContext.Provider></MemoryRouter>));
    await act(async () => [...container.querySelectorAll("button")].find(button => button.textContent === "Test submit")!.click());
    expect(container.textContent).toContain(requiresRevalidation ? "Complete Coverage or Review against the current Library" : "Authorize payment for your current selections");
    expect(mockRequest).not.toHaveBeenCalled();
    expect(continueNavigation).not.toHaveBeenCalled();
  } finally { await act(async () => root.unmount()); container.remove(); vi.unstubAllEnvs(); }
});
