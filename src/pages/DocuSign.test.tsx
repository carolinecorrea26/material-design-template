import { act, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import DocuSign from "./DocuSign";

const advance = vi.fn();
vi.mock("../app/RoutePage", () => ({
  default: ({ children, hideActions, validate }: {
    children: ReactNode;
    hideActions: boolean;
    validate: () => string | undefined;
  }) => (
    <form onSubmit={event => {
      event.preventDefault();
      if (!validate()) advance();
    }}>
      {children}
      {!hideActions && <button type="submit">Next</button>}
    </form>
  ),
}));
vi.mock("../content", () => ({
  getContent: () => ({ statusMessages: { docusign: {
    heading: "DocuSign", body: "Waiting for the signing step to complete.",
  } } }),
}));

let root: Root, container: HTMLDivElement;
beforeEach(async () => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  vi.useFakeTimers();
  advance.mockClear();
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  await act(async () => root.render(<MemoryRouter><DocuSign /></MemoryRouter>));
});
afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

async function submit() {
  await act(async () => container.querySelector("form")!.dispatchEvent(
    new Event("submit", { bubbles: true, cancelable: true }),
  ));
}

it("blocks forward navigation while signing is pending, including direct form submission", async () => {
  expect(container.textContent).toContain("no documents will be signed");
  expect(container.textContent).not.toContain("Next");
  await submit();
  expect(advance).not.toHaveBeenCalled();
});

it("keeps navigation blocked after timeout and shows recovery guidance", async () => {
  await act(async () => vi.advanceTimersByTime(15000));
  expect(container.textContent).toContain("taking longer than expected");
  expect(container.textContent).not.toContain("Next");
  await submit();
  expect(advance).not.toHaveBeenCalled();
});

it.each([0, 15000])("allows navigation only after explicit simulated completion, elapsed=%s", async elapsed => {
  await act(async () => vi.advanceTimersByTime(elapsed));
  const simulate = [...container.querySelectorAll("button")].find(button => button.textContent === "Simulate signing completion")!;
  await act(async () => simulate.click());
  expect(advance).not.toHaveBeenCalled();
  expect(container.querySelector('[role="progressbar"]')).toBeNull();
  expect(container.textContent).not.toContain("Simulate signing completion");
  expect(container.textContent).toContain("Next");
  await submit();
  expect(advance).toHaveBeenCalledOnce();
  await act(async () => vi.advanceTimersByTime(15000));
  expect(container.textContent).not.toContain("taking longer than expected");
});
