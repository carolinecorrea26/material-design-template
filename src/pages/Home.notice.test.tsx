import React, { act } from "react";
import { readFileSync } from "node:fs";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter, useLocation } from "react-router-dom";
import { afterEach, expect, it, vi } from "vitest";
import Home from "./Home";
import { ApplicationSessionProvider } from "../app/ApplicationSessionContext";
import { installPrototypeLibrary, resolvePrototypeLibrary } from "../domain/prototypeLibrary";
import { validateSharedCatalog } from "../persistence/sharedCatalog";
vi.mock("../app/ApplicationFormContext", () => ({ useApplicationForm: () => ({ values: {}, activeAssociationId: undefined, resetValues: vi.fn() }) }));
vi.mock("../app/workflows/QuoteCalculator", () => ({ default: () => null }));
vi.mock("../app/SinglePageApplication", () => ({ default: () => <div>Inline application</div> }));
const catalog = validateSharedCatalog(JSON.parse(readFileSync('public/catalog/portal.json', 'utf8')));
let root: Root | undefined, container: HTMLDivElement;
afterEach(async () => { if (root) await act(async () => root!.unmount()); root = undefined; container?.remove(); installPrototypeLibrary(null); vi.unstubAllGlobals(); window.sessionStorage.clear(); });
function Location() { return <output data-testid="location">{useLocation().pathname}</output>; }
async function render(notice?: string, query = "") {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true); window.history.replaceState(null, "", `/?site=asce${query}`);
  const library = resolvePrototypeLibrary(catalog.data, 'asce', 'home-notice');
  // A detached presentation fixture exercises the existing optional notice;
  // ASCE's effective source still has no landing notice assigned.
  if (notice) library.client.applicantExperience = { ...library.client.applicantExperience, landingNotice: { title: 'Entry information', text: notice } };
  installPrototypeLibrary(library);
  container = document.createElement("div"); document.body.append(container); root = createRoot(container);
  await act(async () => root!.render(<ApplicationSessionProvider><MemoryRouter><Home /><Location /></MemoryRouter></ApplicationSessionProvider>));
}
const dialogButton = (label: string) => [...document.querySelectorAll<HTMLButtonElement>('[role="dialog"] button')].find(button => button.textContent === label)!;
it("opens a configured notice before Apply navigation, supports Cancel and then Continue", async () => {
  await render('Existing entry information');
  const apply = container.querySelector<HTMLAnchorElement>('a[href*="/membership"]')!;
  expect(apply).not.toBeNull(); expect(document.querySelector('[role="dialog"]')).toBeNull();
  await act(async () => apply.click());
  expect(document.querySelector('[role="dialog"]')?.textContent).toContain('Existing entry information');
  expect(container.querySelector('output')?.textContent).toBe("/");
  await act(async () => { dialogButton("Cancel").click(); });
  await act(async () => { await new Promise(resolve => setTimeout(resolve, 250)); }); expect(document.querySelector('[role="dialog"]')).toBeNull();
  await act(async () => apply.click()); await act(async () => dialogButton("Continue").click());
  expect(container.querySelector('output')?.textContent).toBe("/membership");
});
it("uses the installed notice with quote-first presentation and preserves ASCE direct entry", async () => {
  await render('Captured entry information', '&variant=quoteFirst');
  await act(async () => container.querySelector<HTMLAnchorElement>('a[href*="/membership"]')!.click());
  expect(document.querySelector('[role="dialog"]')?.textContent).toContain('Captured entry information');
  await act(async () => root!.unmount()); container.remove(); root = undefined;
  await render(); await act(async () => container.querySelector<HTMLAnchorElement>('a[href*="/membership"]')!.click());
  expect(document.querySelector('[role="dialog"]')).toBeNull(); expect(container.querySelector('output')?.textContent).toBe("/membership");
});
