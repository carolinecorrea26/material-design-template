import { act, createElement, type ComponentType } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it } from "vitest";
import MigrationScheduleWorkspace from "./MigrationScheduleWorkspace";
import { persistence } from "../../persistence/client";
import { createSeedDatabase } from "../../persistence/seed";

let root: Root;
let container: HTMLDivElement;
beforeEach(async () => {
  (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  await persistence.reset?.(createSeedDatabase());
  container = document.createElement("div"); document.body.appendChild(container); root = createRoot(container);
});
afterEach(async () => { await act(async () => root.unmount()); container.remove(); await persistence.reset?.(createSeedDatabase()); });
const render = async (component: ComponentType = MigrationScheduleWorkspace) => { await act(async () => root.render(createElement(component))); };
const click = async (element: HTMLElement) => { await act(async () => element.click()); };
it("displays the migration matrix and saves edited environment progress through the schedule UI", async () => {
  await render();
  const rows = [...container.querySelectorAll("tbody tr")];
  expect(rows.filter(row => row.children[1]?.textContent === "Yes").map(row => row.children[0].querySelector("p")?.textContent).sort()).toEqual(["AAFP", "ASCE"]);
  for (const label of ["Requirements", "Prototype", "Majesco environment", "UAT", "Preprod", "Production", "Date expected"]) expect(container.querySelector("thead")?.textContent).toContain(label);
  await click(container.querySelector<HTMLElement>('[aria-label="Edit AAFP migration schedule"]')!);
  const dialog = document.querySelector('[role="dialog"]')!;
  const statusLabel = [...dialog.querySelectorAll("label")].find(label => label.textContent === "UAT status")!;
  const combobox = document.getElementById(statusLabel.htmlFor)!;
  await act(async () => { combobox.dispatchEvent(new MouseEvent("mousedown", { bubbles: true })); });
  await click([...document.querySelectorAll<HTMLElement>('[role="option"]')].find(option => option.textContent === "In progress")!);
  const dateLabel = [...dialog.querySelectorAll("label")].find(label => label.textContent === "UAT date expected")!;
  const dateInput = document.getElementById(dateLabel.htmlFor) as HTMLInputElement;
  await act(async () => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(dateInput, "2026-11-02");
    dateInput.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await click([...dialog.querySelectorAll<HTMLElement>("button")].find(button => button.textContent === "Save schedule")!);
  expect(container.textContent).toContain("AAFP migration schedule saved.");
  expect((await persistence.list("migrationSchedules"))[0].milestones.uat).toEqual({ status: "In progress", expectedDate: "2026-11-02" });
  await act(async () => root.unmount());
  root = createRoot(container); await render();
  const aafp = [...container.querySelectorAll("tbody tr")].find(row => row.children[0]?.textContent?.startsWith("AAFP"))!;
  expect(aafp.children[4].textContent).toContain("In progress");
  expect(aafp.children[4].textContent).toContain("Nov 2, 2026");
  expect(aafp.children[5].textContent).toContain("Not assessed");
});
