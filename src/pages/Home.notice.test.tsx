import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter, useLocation } from "react-router-dom";
import { afterEach, beforeAll, expect, it, vi } from "vitest";
import Home from "./Home";
import { createReviewedMigrationDatabase } from "../migration/fixtures";
import { installPrototypeLibrary, resolvePrototypeLibrary } from "../domain/prototypeLibrary";
import type { DatabaseSchema } from "../persistence/types";
vi.mock("../app/ApplicationFormContext", () => ({ useApplicationForm: () => ({ values: {}, activeAssociationId: undefined }) }));
vi.mock("../components/coverage/QuoteCalculator", () => ({ default: () => null }));
vi.mock("../app/SinglePageApplication", () => ({ default: () => <div>Inline application</div> }));
let db: DatabaseSchema, root: Root | undefined, container: HTMLDivElement;
beforeAll(() => { db = createReviewedMigrationDatabase(); }, 120000);
afterEach(async () => { if (root) await act(async () => root!.unmount()); root = undefined; container?.remove(); installPrototypeLibrary(null); vi.unstubAllGlobals(); window.sessionStorage.clear(); });
function Location() { return <output data-testid="location">{useLocation().pathname}</output>; }
async function render(site = "abe", data = db, query = "") {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true); window.history.replaceState(null, "", `/?site=${site}${query}`); installPrototypeLibrary(resolvePrototypeLibrary(data, site, "landing-notice"));
  container = document.createElement("div"); document.body.append(container); root = createRoot(container);
  await act(async () => root!.render(<MemoryRouter><Home /><Location /></MemoryRouter>));
}
const dialogButton = (label: string) => [...document.querySelectorAll<HTMLButtonElement>('[role="dialog"] button')].find(button => button.textContent === label)!;
it("opens source dividend information before Apply navigation, supports Cancel and then Continue", async () => {
  await render();
  const apply = container.querySelector<HTMLAnchorElement>('a[href*="/membership"]')!;
  expect(apply).not.toBeNull(); expect(document.querySelector('[role="dialog"]')).toBeNull();
  await act(async () => apply.click());
  expect(document.querySelector('[role="dialog"]')?.textContent).toContain("Founded by the ABA in 1942");
  expect(document.querySelector('[role="dialog"]')?.textContent).toContain("December 15");
  expect(container.querySelector('output')?.textContent).toBe("/");
  await act(async () => { dialogButton("Cancel").click(); });
  await act(async () => { await new Promise(resolve => setTimeout(resolve, 250)); }); expect(document.querySelector('[role="dialog"]')).toBeNull();
  await act(async () => apply.click()); await act(async () => dialogButton("Continue").click());
  expect(container.querySelector('output')?.textContent).toBe("/membership");
});
it("uses captured notice edits and leaves other Sites' direct entry intact", async () => {
  const copy = structuredClone(db); (copy.configurationValues.find(row => row.key === "abe.landingNotice")!.value as { text: string }).text = "Captured dividend information";
  await render("abe", copy, "&variant=quoteFirst"); await act(async () => container.querySelector<HTMLAnchorElement>('a[href*="/membership"]')!.click());
  expect(document.querySelector('[role="dialog"]')?.textContent).toContain("Captured dividend information");
  await act(async () => root!.unmount()); container.remove(); root = undefined;
  await render("asce"); await act(async () => container.querySelector<HTMLAnchorElement>('a[href*="/membership"]')!.click());
  expect(document.querySelector('[role="dialog"]')).toBeNull(); expect(container.querySelector('output')?.textContent).toBe("/membership");
});
