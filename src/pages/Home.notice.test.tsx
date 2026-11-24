import React, { act } from "react";
import { readFileSync } from "node:fs";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter, useLocation } from "react-router-dom";
import { afterEach, expect, it, vi } from "vitest";
import Home from "./Home";
import { ApplicationSessionProvider } from "../app/ApplicationSessionContext";
import { installPrototypeLibrary, resolvePrototypeLibrary, type PrototypeLibrary } from "../domain/prototypeLibrary";
import { validateSharedCatalog } from "../persistence/sharedCatalog";
import { getSurfaceField } from '../config/fields/storedSurfaces';
import { getApplyingWorksPresentation } from '../config/homepagePresentation';
vi.mock("../app/ApplicationFormContext", () => ({ useApplicationForm: () => ({ values: {}, activeAssociationId: undefined, resetValues: vi.fn() }) }));
vi.mock("../app/workflows/QuoteCalculator", () => ({ default: ({ open, initialEligibility }: { open: boolean; initialEligibility?: unknown }) => open ? <output data-home-quote>{JSON.stringify(initialEligibility)}</output> : null }));
vi.mock("../app/SinglePageApplication", () => ({ default: () => <div>Inline application</div> }));
const catalog = validateSharedCatalog(JSON.parse(readFileSync('public/catalog/portal.json', 'utf8')));
let root: Root | undefined, container: HTMLDivElement;
afterEach(async () => { if (root) await act(async () => root!.unmount()); root = undefined; container?.remove(); installPrototypeLibrary(null); vi.unstubAllGlobals(); window.sessionStorage.clear(); });
function Location() { return <output data-testid="location">{useLocation().pathname}</output>; }
async function render(notice?: string, query = "", configure?: (library: PrototypeLibrary) => void) {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true); window.history.replaceState(null, "", `/?site=asce${query}`);
  const library = resolvePrototypeLibrary(catalog.data, 'asce', 'home-notice');
  // A detached presentation fixture exercises the existing optional notice;
  // ASCE's effective source still has no landing notice assigned.
  if (notice) {
    library.client.features = { ...library.client.features, homeLandingNotice: true };
    library.content.home.landingNotice = { title: 'Entry information', text: notice };
  }
  configure?.(library);
  installPrototypeLibrary(library);
  container = document.createElement("div"); document.body.append(container); root = createRoot(container);
  await act(async () => root!.render(<ApplicationSessionProvider><MemoryRouter initialEntries={[`/?site=asce${query}`]}><Home /><Location /></MemoryRouter></ApplicationSessionProvider>));
  return library;
}
const dialogButton = (label: string) => [...document.querySelectorAll<HTMLButtonElement>('[role="dialog"] button')].find(button => button.textContent === label)!;
it('renders the compiled section order and the selected hero asset without a client-path convention', async () => {
  const library = await render(undefined, '&variant=hero-image', fixture => {
    fixture.site.configuration.pages.find(page => page.key === 'home')!.sections.reverse();
    fixture.content.home.hero.image = { src: '/quote.jpg', alt: 'Selected Site hero' };
  });
  const image = container.querySelector<HTMLImageElement>('img[alt="Selected Site hero"]')!;
  expect(image.getAttribute('src')).toBe('/quote.jpg');
  expect(container.querySelector('input[name="home-birth-date"]')).toBeNull();
  const text = container.textContent!;
  expect(text.indexOf(library.content.home.nylCredentials.name)).toBeLessThan(text.indexOf(library.content.home.coverageOptions.title));
  expect(text.indexOf(library.content.home.coverageOptions.title)).toBeLessThan(text.indexOf(library.content.home.howApplyingWorks.title));
  expect(text.indexOf(library.content.home.howApplyingWorks.title)).toBeLessThan(text.indexOf(library.content.home.hero.title));
});
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

it('renders effective ASCE Home sections and carries valid quote entry without replacing a manual state', async () => {
  const library = await render();
  expect(library.client.features?.homePageVariant).toBe('default');
  expect(getApplyingWorksPresentation(library.client.features)).toBe('static');
  expect(library.client.features?.homeLandingNotice).toBe(false);
  expect(library.content.home.landingNotice).toEqual({ title: '', text: '' });
  expect(library.content.home.clientSection).toEqual({ tagline: '', paragraphs: [] });
  for (const title of [library.content.home.hero.title, library.content.home.howApplyingWorks.title, library.content.home.coverageOptions.title, library.content.home.nylCredentials.name]) expect(container.textContent).toContain(title);
  expect([...container.querySelectorAll('[data-analytics-field]')].map(field => field.getAttribute('data-analytics-field'))).toEqual(['home-zip-postal-code', 'home-state-province', 'home-birth-date']);
  expect([...container.querySelectorAll('[role="tab"]')].map(tab => tab.getAttribute('aria-label'))).toEqual(['Life', 'Accidental Death and Dismemberment', 'Disability']);
  const quote = () => [...container.querySelectorAll<HTMLButtonElement>('button')].find(button => button.textContent === 'See my quote')!;
  await act(async () => quote().click());
  for (const id of ['zip-postal-code', 'state-province', 'birth-date']) expect(container.textContent).toContain(`${getSurfaceField('quoteInputs', id)!.label} is required.`);
  expect(container.querySelector('[data-home-quote]')).toBeNull();
  const input = (id: string) => container.querySelector<HTMLInputElement>(`input[name="home-${id}"]`)!;
  const enter = async (id: string, value: string) => { await act(async () => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(input(id), value);
    input(id).dispatchEvent(new Event('input', { bubbles: true }));
  }); };
  await enter('zip-postal-code', '100011234');
  expect(input('state-province').value).toBe('New York');
  await enter('state-province', 'California');
  await act(async () => [...document.querySelectorAll<HTMLElement>('[role="option"]')].find(option => option.textContent === 'California')!.click());
  await enter('birth-date', '05/14/1990');
  expect(input('birth-date').autocomplete).toBe('bday');
  expect(input('state-province').value).toBe('California');
  await act(async () => quote().click());
  await act(async () => { await new Promise(resolve => setTimeout(resolve, 650)); });
  expect(JSON.parse(container.querySelector('[data-home-quote]')!.textContent!)).toEqual({ birthday: '1990-05-14', zipCode: '10001-1234', state: 'CA' });
});
