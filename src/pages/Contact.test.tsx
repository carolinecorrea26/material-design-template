// Captured migration UI regression; fresh-start journeys are covered in test:journeys.
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { afterAll, afterEach, beforeAll, expect, it, vi } from "vitest";
import Contact from "./Contact";
import { createReviewedMigrationDatabase } from "../migration/fixtures";
import { installPrototypeLibrary, resolvePrototypeLibrary } from "../domain/prototypeLibrary";
import { freshStartSource } from "../domain/freshStartCatalog";
import { resolveSnapshotTestLibrary } from "../migration/snapshotTestLibrary";
import { isApplicantExperience, showContactBusinessSection } from "../domain/applicantExperience";
import { getClientPageFields } from "../config/clientFields/getClientPageFields";
import { applyWaepaContactAdoption } from "../migration/waepaContactAdoption";
import type { DatabaseSchema } from "../persistence/types";
import { fieldSurfaceRows } from './admin/library/fieldSurfaceRows';

const form = vi.hoisted(() => ({ values: { coverageSelections: ["di-short-term"], productApplicants: { "di-short-term": ["member"] }, "correspondence-to": "business", "business-address-same-as-home": true }, setPageValues: vi.fn(), saveApplication: vi.fn() }));
vi.mock("../app/ApplicationFormContext", () => ({ useApplicationForm: () => form }));
vi.mock("../app/ApplicationSessionContext", () => ({ useApplicationSession: () => ({ reviewSubmitted: false, markReviewSubmitted: vi.fn() }) }));
vi.mock("../app/SinglePageFlowContext", () => ({ useSinglePageFlow: () => ({ pageId: "contact", navigationPending: false, setNavigationPending: vi.fn(), completeSection: vi.fn(), goToSection: vi.fn() }) }));
let db: DatabaseSchema;
let root: Root | undefined;
let container: HTMLDivElement | undefined;
const scrollIntoViewDescriptor = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'scrollIntoView');
beforeAll(() => {
  db = createReviewedMigrationDatabase();
  Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', { configurable: true, value: vi.fn() });
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
}, 120000);
afterAll(() => {
  if (scrollIntoViewDescriptor) Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', scrollIntoViewDescriptor);
  else Reflect.deleteProperty(HTMLElement.prototype, 'scrollIntoView');
  vi.restoreAllMocks();
});
afterEach(async () => {
  if (root) await act(async () => root!.unmount());
  container?.remove(); root = undefined; container = undefined;
  installPrototypeLibrary(null); vi.unstubAllGlobals(); window.sessionStorage.clear();
});

async function renderAsceContact(values: Record<string, unknown> = {}) {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  window.history.replaceState(null, '', '/?site=asce');
  installPrototypeLibrary(resolvePrototypeLibrary(db, 'asce', 'Contact-source-review'));
  const answers = form.values as Record<string, unknown>;
  for (const key of Object.keys(answers)) delete answers[key];
  const selected = Array.isArray(values.coverageSelections) ? values.coverageSelections.map(String) : ['li-10yr'];
  Object.assign(answers, { coverageSelections: selected, productApplicants: Object.fromEntries(selected.map(key => [key, ['member']])), dependents: [], 'correspondence-to': 'residential' }, values);
  form.saveApplication.mockReset();
  container = document.createElement('div'); document.body.append(container); root = createRoot(container);
  await act(async () => root!.render(<MemoryRouter><Contact /></MemoryRouter>));
}

it.each([
  { selections: ['li-10yr'], correspondence: 'residential', address: false, employer: false },
  { selections: ['li-10yr'], correspondence: 'business', address: true, employer: false },
  { selections: ['di-ltd'], correspondence: 'residential', address: true, employer: true },
])('ASCE Contact preserves business visibility for $selections and $correspondence', async ({ selections, correspondence, address, employer }) => {
  await renderAsceContact({ coverageSelections: selections, 'correspondence-to': correspondence });
  expect(!!container!.querySelector('[name="business-street-address"]')).toBe(address);
  expect(!!container!.querySelector('[name="business-name"]')).toBe(employer);
  expect(container!.querySelector('[name="spouse-phone"]')).toBeNull();
  expect(container!.querySelector('[name="street-address"]')?.getAttribute('autocomplete')).toBe('street-address');
});

it('ASCE Contact keeps spouse autofill off and phone companions independent', async () => {
  await renderAsceContact({ coverageSelections: ['di-ltd'], productApplicants: { 'di-ltd': ['member', 'spouse'] }, dependents: ['spouse'], 'spouse-phone-type': 'home', 'business-phone-type': 'business' });
  expect(container!.querySelector('[name="spouse-email"]')?.getAttribute('autocomplete')).toBe('off');
  expect(container!.querySelector('[name="spouse-phone"]')?.getAttribute('autocomplete')).toBe('off');
  expect((container!.querySelector('[name="spouse-phone-type"]') as HTMLInputElement)?.value).toBe('home');
  expect((container!.querySelector('[name="business-phone-type"]') as HTMLInputElement)?.value).toBe('business');
  for (const name of ['spouse-phone-type', 'business-phone-type']) expect(container!.querySelectorAll(`[name="${name}"]`)).toHaveLength(1);
});

it('ASCE Contact submits the residential address while hidden business and spouse fields do not block', async () => {
  const scroll = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
  try {
    await renderAsceContact({ 'street-address': '100 Home Street', city: 'New York', 'state-province': 'NY', 'zip-postal-code': '10001' });
    await act(async () => container!.querySelector('#contact-form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })));
    expect(form.saveApplication).toHaveBeenCalledOnce();
    expect(form.saveApplication.mock.calls[0][0]).toMatchObject({ state: 'NY', 'zip-code': '10001', city: 'New York' });
  } finally { scroll.mockRestore(); }
});

it('ASCE Contact lists each phone type once beside its owner in the Library', () => {
  const rows = fieldSurfaceRows({ data: db, revision: 'Contact-library-review', analyticsTags: [] }, 'asce').filter(row => row.pages.includes('contact'));
  for (const [phone, type] of [['business-phone', 'business-phone-type'], ['spouse-phone', 'spouse-phone-type']]) {
    const companions = rows.filter(row => row.field.id === type);
    expect(companions).toHaveLength(1);
    expect(companions[0].surface).toBe(rows.find(row => row.field.id === phone)!.surface);
  }
});

it("shows Standard WAEPA business details only for STD, retaining GI hiding and other Sites' defaults", () => {
  for (const siteKey of ["waepa", "waepa-gi"]) {
    window.history.replaceState(null, "", `/?site=${siteKey}`);
    const library = resolvePrototypeLibrary(JSON.parse(JSON.stringify(db)), siteKey, "test");
    installPrototypeLibrary(library);
    expect(library.client.applicantExperience?.contact).toEqual({ hideBusinessAddress: true, hideCorrespondence: true, businessAddressProducts: siteKey === "waepa" ? ["di-short-term"] : [] });
    for (const coverageSelections of [[], ["li-group-term"], ["di-short-term"], ["li-group-term", "di-short-term"]]) {
      const fields = getClientPageFields("contact", { coverageSelections, "correspondence-to": "business" });
      const showBusiness = siteKey === "waepa" && coverageSelections.includes("di-short-term");
      expect(fields.some(field => field.id.startsWith("business-"))).toBe(showBusiness);
      expect(fields.some(field => field.id === "correspondence-to" || field.id === "phone")).toBe(false);
      expect(fields.some(field => field.id === "street-address")).toBe(true);
      expect(showContactBusinessSection(library.client.applicantExperience, coverageSelections.includes("di-short-term"), "business", coverageSelections)).toBe(showBusiness);
    }
    expect(getClientPageFields("membership", { membership: siteKey === "waepa" ? "current" : "yes" }).some(field => field.id === "phone")).toBe(true);
    expect(getClientPageFields("eligibility", {}).some(field => field.id === "phone")).toBe(false);
  }
  window.history.replaceState(null, "", "/?site=asce");
  const asce = resolvePrototypeLibrary(db, "asce", "test"); installPrototypeLibrary(asce);
  expect(getClientPageFields("contact", { "correspondence-to": "business" }).some(field => field.id === "correspondence-to")).toBe(true);
  expect(showContactBusinessSection(asce.client.applicantExperience, true, "home")).toBe(true);
  expect(showContactBusinessSection(asce.client.applicantExperience, false, "business")).toBe(true);
});

it.each([true, false])("renders the WAEPA business section only with STD selected=%s, ignoring stale correspondence", async withStd => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  window.history.replaceState(null, "", "/?site=waepa");
  installPrototypeLibrary(resolvePrototypeLibrary(db, "waepa", "test"));
  form.values.coverageSelections = withStd ? ["di-short-term"] : ["li-group-term"];
  container = document.createElement("div"); document.body.append(container); root = createRoot(container);
  await act(async () => root!.render(<MemoryRouter><Contact /></MemoryRouter>));
  expect(container.querySelector('[name="correspondence-to"]')).toBeNull();
  expect(!!container.querySelector('[name^="business-"]')).toBe(withStd);
  expect(container.textContent?.includes("Business / Employer")).toBe(withStd);
  expect(container.querySelector('[name="street-address"]')).not.toBeNull();
});

it("uses edited saved configuration and rejects invalid contact flags", () => {
  const changed = structuredClone(db);
  const source = structuredClone(freshStartSource());
  const page = source.fields.sitePages!.waepa.contact as { configurations: Record<string, unknown> };
  page.configurations = { ...page.configurations, "contact-hide-business-address": false, "contact-hide-correspondence": false, "contact-business-address-products": ["li-group-term"] };
  const library = resolvePrototypeLibrary(changed, "waepa", "edited", source); installPrototypeLibrary(library);
  window.history.replaceState(null, "", "/?site=waepa");
  expect(getClientPageFields("contact", { "correspondence-to": "business" }).some(field => field.id === "correspondence-to")).toBe(true);
  expect(showContactBusinessSection(library.client.applicantExperience, false, "home", ["li-group-term"])).toBe(true);
  expect(showContactBusinessSection(library.client.applicantExperience, false, "home", ["di-short-term"])).toBe(false);
  for (const contact of [null, [], { hideBusinessAddress: "yes" }, { hideCorrespondence: 1 }, { businessAddressProducts: [1] }, { businessAddressProducts: ["di-short-term", "di-short-term"] }]) expect(isApplicantExperience({ contact })).toBe(false);
  page.configurations["contact-business-address-products"] = ["missing-product"];
  expect(() => resolvePrototypeLibrary(changed, "waepa", "invalid-product-scope", source)).toThrow(/Invalid (?:Contact business product|business-address product) scope/);
});

it("preserves earlier captures and WAEPA GI through an idempotent scoped adoption", () => {
  const earlier = structuredClone(db);
  earlier.configurationValues = earlier.configurationValues.filter(row => row.key !== "site:waepa.applicantExperience.contact.businessAddressProducts");
  const captured = resolveSnapshotTestLibrary(earlier, "waepa", "before-STD-address");
  applyWaepaContactAdoption(earlier);
  expect(showContactBusinessSection(captured.client.applicantExperience, true, "home", ["di-short-term"])).toBe(false);
  expect(showContactBusinessSection(resolveSnapshotTestLibrary(earlier, "waepa", "after-STD-address").client.applicantExperience, true, "home", ["di-short-term"])).toBe(true);
  expect(resolvePrototypeLibrary(earlier, "waepa-gi", "GI-isolation").site).toEqual(resolvePrototypeLibrary(db, "waepa-gi", "GI-baseline").site);
  expect(resolvePrototypeLibrary(earlier, "waepa", "recovered-value").client).toEqual(resolvePrototypeLibrary(db, "waepa", "baseline-value").client);
  const once = structuredClone(earlier);
  applyWaepaContactAdoption(earlier);
  expect(earlier).toEqual(once);
});

it("copies home address into a visible same-as-home business address before allowing separate edits", async () => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  window.history.replaceState(null, "", "/?site=asce");
  installPrototypeLibrary(resolvePrototypeLibrary(db, "asce", "same-home"));
  Object.assign(form.values, { coverageSelections: ["di-ltd"], productApplicants: { "di-ltd": ["member"] }, "business-address-same-as-home": true, "street-address": "100 Home Street", city: "Home City", state: "PA", "zip-code": "19101" });
  container = document.createElement("div"); document.body.append(container); root = createRoot(container);
  await act(async () => root!.render(<MemoryRouter><Contact /></MemoryRouter>));
  const label = [...container.querySelectorAll(".SelectionGroup-label")].find(element => element.textContent?.includes("Business address is the same as home address"))!;
  const same = label.parentElement!.querySelector('input[type="checkbox"]') as HTMLInputElement;
  expect(same.checked).toBe(true);
  await act(async () => {
    const street = container!.querySelector<HTMLInputElement>('[name="street-address"]')!;
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(street, '200 Updated Home Street');
    street.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await act(async () => same.click());
  expect((container.querySelector('[name="business-street-address"]') as HTMLInputElement).value).toBe("200 Updated Home Street");
  expect((container.querySelector('[name="business-city"]') as HTMLInputElement).value).toBe("Home City");
  expect((container.querySelector('[name="business-zip-code"]') as HTMLInputElement).value).toBe("19101");
});

it('ASCE Contact keeps the member address required for a dependent-only application', async () => {
  const scroll = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
  try {
    await renderAsceContact({ productApplicants: { 'li-10yr': ['spouse'] }, dependents: ['spouse'], 'state-province': 'NY', 'zip-postal-code': '10001', 'spouse-phone': '2125550123', 'spouse-email': 'spouse@example.invalid' });
    expect(container!.querySelector('[name="street-address"]')).not.toBeNull();
    expect(container!.textContent).toContain('Where should we send correspondence');
    expect(container!.querySelector('[name="spouse-phone"]')).not.toBeNull();
    await act(async () => container!.querySelector('#contact-form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })));
    expect(form.saveApplication).not.toHaveBeenCalled();
    expect(container!.textContent).toContain('Street Address is required');
  } finally { scroll.mockRestore(); }
});

it('ASCE Contact saves owner address and independent spouse contact for dependent-only coverage', async () => {
  const scroll = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
  try {
    await renderAsceContact({ productApplicants: { 'li-10yr': ['spouse'] }, dependents: ['spouse'], 'street-address': '100 Home Street', city: 'New York', 'state-province': 'NY', 'zip-postal-code': '10001', 'spouse-phone': '2125550123', 'spouse-email': 'spouse@example.invalid' });
    await act(async () => container!.querySelector('#contact-form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })));
    expect(form.saveApplication).toHaveBeenCalledOnce();
    expect(form.saveApplication.mock.calls[0][0]).toMatchObject({ 'street-address': '100 Home Street', state: 'NY', 'zip-code': '10001', 'spouse-phone': '2125550123', 'spouse-email': 'spouse@example.invalid' });
  } finally { scroll.mockRestore(); }
});

it('ASCE Contact ignores stale spouse elections on unselected products', async () => {
  await renderAsceContact({ dependents: ['spouse'], productApplicants: { 'li-10yr': ['member'], 'li-term': ['spouse'] } });
  expect(container!.querySelector('[name="street-address"]')).not.toBeNull();
  expect(container!.querySelector('[name="spouse-phone"]')).toBeNull();
  expect(container!.querySelector('[name="spouse-email"]')).toBeNull();
});

it('ASCE Contact validates correspondence-only business address without employer-only fields', async () => {
  const scroll = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
  try {
    await renderAsceContact({ 'street-address': '100 Home Street', city: 'New York', state: 'NY', 'zip-code': '10001', 'correspondence-to': 'business', 'business-address-same-as-home': true, 'business-street-address': '200 Office Street', 'business-city': 'New York', 'business-state': 'NY', 'business-zip-code': '10002' });
    expect(container!.querySelector('[name="business-name"]')).toBeNull();
    expect(container!.querySelector('[name="business-phone"]')).toBeNull();
    await act(async () => container!.querySelector('#contact-form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })));
    expect(form.saveApplication).toHaveBeenCalledOnce();
    expect(form.saveApplication.mock.calls[0][0]).toMatchObject({ 'business-street-address': '200 Office Street', 'business-zip-code': '10002' });
  } finally { scroll.mockRestore(); }
});

it('ASCE Contact collects member employer data for spouse-only DI', async () => {
  const scroll = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
  try {
    await renderAsceContact({ coverageSelections: ['di-ltd'], productApplicants: { 'di-ltd': ['spouse'] }, coverageAmounts: { 'di-ltd:spouse': 1000 }, dependents: ['spouse'], 'street-address': '100 Home Street', city: 'New York', 'state-province': 'NY', 'zip-postal-code': '10001', 'spouse-phone': '2125550123', 'spouse-email': 'spouse@example.invalid', 'business-name': 'Member Engineering', 'business-type': 'corporation', 'business-address-same-as-home': true });
    expect(container!.querySelector('[name="business-name"]')).not.toBeNull();
    expect(container!.querySelector('[name="spouse-business-name"]')).toBeNull();
    await act(async () => container!.querySelector('#contact-form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })));
    expect(form.saveApplication).toHaveBeenCalledOnce();
    expect(form.saveApplication.mock.calls[0][0]).toMatchObject({ 'business-name': 'Member Engineering', 'business-type': 'corporation', 'business-street-address': '100 Home Street', 'business-state': 'NY', 'business-zip-code': '10001' });
  } finally { scroll.mockRestore(); }
});

it('ASCE Contact never treats obsolete spouse employer answers as member employment', async () => {
  await renderAsceContact({ coverageSelections: ['di-ltd'], productApplicants: { 'di-ltd': ['spouse'] }, dependents: ['spouse'], 'spouse-business-name': 'Obsolete spouse employer' });
  const name = container!.querySelector('[name="business-name"]') as HTMLInputElement;
  expect(name.value).toBe('');
  expect(name.required).toBe(true);
  expect(container!.querySelector('[name="spouse-business-name"]')).toBeNull();
});
