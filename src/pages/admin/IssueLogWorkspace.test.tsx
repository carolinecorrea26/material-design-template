import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import IssueLogWorkspace from "./IssueLogWorkspace";
import { readLibraryCatalog } from "../../services/libraryCatalogService";
import { createSeedDatabase } from "../../persistence/seed";
vi.mock("../../services/libraryCatalogService", () => ({ readLibraryCatalog: vi.fn() }));

let root: Root;
let container: HTMLDivElement;
beforeEach(() => {
  vi.mocked(readLibraryCatalog).mockResolvedValue({ revision: "test", data: createSeedDatabase(), analyticsTags: [] });
  vi.stubEnv("VITE_MOCK_PLATFORM_ENABLED", "");
  localStorage.clear();
  (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  container = document.createElement("div"); document.body.appendChild(container); root = createRoot(container);
});
afterEach(async () => { await act(async () => root.unmount()); container.remove(); localStorage.clear(); vi.unstubAllEnvs(); });
const button = (label: string) => [...document.querySelectorAll<HTMLButtonElement>("button")].find(row => row.textContent === label)!;
async function click(element: HTMLElement) { await act(async () => element.click()); }
async function chooseSelect(index: number, label?: string) {
  const select = document.querySelectorAll<HTMLElement>('[role="dialog"] [role="combobox"]')[index];
  await act(async () => select.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, button: 0 })));
  const options = [...document.querySelectorAll<HTMLElement>('[role="option"]')];
  await click(label ? options.find(row => row.textContent === label)! : options[0]);
}
async function fillTitle(value: string) {
  const input = document.querySelector<HTMLInputElement>('[role="dialog"] input')!;
  await act(async () => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(input, value);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
}

it("adds and persists open issues for each scope, and removes resolved issues from the open list", async () => {
  await act(async () => root.render(<IssueLogWorkspace />));
  for (const scope of ["TPA", "Client", "Site"]) {
    await click(button("Add issue"));
    await fillTitle(`${scope} test issue`);
    await chooseSelect(0, scope);
    await chooseSelect(1);
    await click(document.querySelector<HTMLButtonElement>('[role="dialog"] button[type="submit"]')!);
    expect(container.textContent).toContain(`${scope} test issue`);
  }
  await act(async () => root.render(<IssueLogWorkspace key="reload" />));
  expect(container.textContent).toContain("Manually created (3)");
  await click(button("Mark resolved"));
  expect(container.textContent).toContain("Manually created (2)");
  expect(JSON.parse(localStorage.getItem("portal.prototype.manualIssues.v1")!).filter((row: { status: string }) => row.status === "Resolved")).toHaveLength(1);
});

it("validates required fields and shows a Jira placeholder", async () => {
  await act(async () => root.render(<IssueLogWorkspace />));
  await click(button("Add issue"));
  await click(document.querySelector<HTMLButtonElement>('[role="dialog"] button[type="submit"]')!);
  expect(document.body.textContent).toContain("Enter an issue title.");
  expect(document.body.textContent).toContain("Select a site.");
  await click(button("Cancel"));
  await click(button("Jira"));
  expect(container.textContent).toContain("Jira · TBD");
  expect(container.textContent).toContain("No Jira integration is connected");
});
