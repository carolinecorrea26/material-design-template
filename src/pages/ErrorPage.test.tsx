import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import ErrorPage from "./ErrorPage";

const reset = vi.hoisted(() => ({ values: vi.fn(), session: vi.fn() }));
vi.mock("../app/ApplicationFormContext", () => ({ useApplicationForm: () => ({ resetValues: reset.values }) }));
vi.mock("../app/ApplicationSessionContext", () => ({ useApplicationSession: () => ({ resetApplicationSession: reset.session }) }));
vi.mock("../data/activeSite", () => ({ resolveSiteId: () => "csea" }));
let root: Root;
let container: HTMLDivElement;
beforeEach(() => {
  vi.clearAllMocks();
  (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  container = document.createElement("div"); document.body.appendChild(container); root = createRoot(container);
});
afterEach(async () => { await act(async () => root.unmount()); container.remove(); });
it.each([404, 500] as const)("provides recovery links for %s with the same site and resets only when starting anew", async status => {
  await act(async () => root.render(<MemoryRouter><ErrorPage status={status} /></MemoryRouter>));
  expect(container.querySelector("h1")?.textContent).toBe(status === 404 ? "Page not found" : "Something went wrong");
  const links = [...container.querySelectorAll<HTMLAnchorElement>("a")];
  const resume = links.find(link => link.textContent === "Resume application")!;
  const start = links.find(link => link.textContent === "Start new application")!;
  expect(resume.getAttribute("href")).toBe("/resume?site=csea");
  expect(resume.className).toContain("MuiButton-contained");
  expect(start.getAttribute("href")).toBe("/?site=csea");
  expect(start.className).toContain("MuiButton-outlined");
  await act(async () => resume.click());
  expect(reset.values).not.toHaveBeenCalled();
  await act(async () => start.click());
  expect(reset.values).toHaveBeenCalledOnce();
  expect(reset.session).toHaveBeenCalledOnce();
});
