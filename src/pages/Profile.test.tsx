import { getClientPageFields } from '../config/clientFields/getClientPageFields';
import { validateProfile } from '../domain/profileValidation';
import { buildDocumentSections } from '../components/content/applicationDocumentSections';
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeAll, expect, it, vi } from "vitest";
import Profile from "./Profile";
import { createReviewedMigrationDatabase } from "../migration/fixtures";
import { getPrototypeLibrary, installPrototypeLibrary, resolvePrototypeLibrary } from "../domain/prototypeLibrary";
import type { DatabaseSchema } from "../persistence/types";

const form = vi.hoisted(() => ({ values: {} as Record<string, unknown>, setPageValues: vi.fn(), saveApplication: vi.fn() }));
vi.mock("../app/ApplicationFormContext", () => ({ useApplicationForm: () => form }));
vi.mock("../app/ApplicationSessionContext", () => ({ useApplicationSession: () => ({ reviewSubmitted: false, markReviewSubmitted: vi.fn() }) }));
vi.mock("../app/SinglePageFlowContext", () => ({ useSinglePageFlow: () => ({ pageId: "profile", navigationPending: false, setNavigationPending: vi.fn(), completeSection: vi.fn(), goToSection: vi.fn() }) }));
let db: DatabaseSchema, root: Root | undefined, container: HTMLDivElement;
beforeAll(() => { db = createReviewedMigrationDatabase(); }, 120000);
afterEach(async () => { if (root) await act(async () => root!.unmount()); container?.remove(); root = undefined; installPrototypeLibrary(null); vi.unstubAllGlobals(); window.sessionStorage.clear(); });
function prepare() {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  window.history.replaceState(null, "", "/?site=asce"); installPrototypeLibrary(resolvePrototypeLibrary(db, "asce", "Profile-review"));
  form.values = { membership: "yes", "birth-date": "1990-01-01", "spouse-birth-date": "1991-01-01", "state-province": "NY", dependents: ["spouse"], coverageSelections: ["li-term", "di-ltd"], productApplicants: { "li-term": ["member", "spouse"], "di-ltd": ["member"] }, coverageAmounts: { "li-term:member": 100000, "li-term:spouse": 50000, "di-ltd:member": 3000 } };
  container = document.createElement("div"); document.body.append(container); root = createRoot(container);
}
async function render(key = "initial") { await act(async () => root!.render(<MemoryRouter><Profile key={key} /></MemoryRouter>)); }
const field = (id: string) => container.querySelector(`[name="${id}"]`);

it('gates QD personal questions independently for each applicant and hides their stale non-QD answers', async () => {
  prepare();
  form.values = { ...form.values, coverageSelections: ['li-10yr'], productApplicants: { 'li-10yr': ['member', 'spouse'] }, coverageAmounts: { 'li-10yr:member': 100000, 'li-10yr:spouse': 700000 }, 'spouse-birth-date': '1963-01-01' };
  for (const prefix of ['', 'spouse-']) Object.assign(form.values, { [`${prefix}has-drivers-license`]: 'yes', [`${prefix}intend-live-outside-us`]: 'yes' });
  await render('mixed-underwriting');
  for (const id of ['weight-12-months-ago-lbs', 'has-drivers-license', 'drivers-license-number', 'drivers-license-state', 'intend-live-outside-us', 'outside-us-country']) {
    expect(field(id), id).not.toBeNull();
    expect(field(`spouse-${id}`), `spouse-${id}`).toBeNull();
  }
  expect(field('outside-us-months')).toBeNull();
  form.values = { ...form.values, 'birth-date': '1963-01-01', coverageAmounts: { 'li-10yr:member': 700000, 'li-10yr:spouse': 700000 } };
  await render('non-qd');
  for (const id of ['weight-12-months-ago-lbs', 'has-drivers-license', 'intend-live-outside-us', 'outside-us-country']) expect(field(id), id).toBeNull();
});

it.each([
  [[], false, false],
  [['li-term'], true, false],
  [['di-ltd'], false, true],
  [['li-add'], false, false],
  [['li-term', 'di-ltd'], true, true],
] as const)('shows Other coverage and its category questions only for active selections: %j', async (selected, life, di) => {
  prepare();
  form.values = { ...form.values, dependents: [], coverageSelections: [...selected], productApplicants: { 'li-term': ['member'], 'di-ltd': ['member'], 'li-add': ['member'] }, 'has-other-life-insurance': 'yes', 'has-disability-insurance': 'yes' };
  await render();
  expect(container.textContent!.includes('Other coverage')).toBe(life || di);
  expect(container.textContent!.includes('Please indicate if you currently hold')).toBe(life || di);
  expect(field('has-other-life-insurance') !== null).toBe(life);
  expect(field('existing-life-insurance-amount') !== null).toBe(life);
  expect(field('has-disability-insurance') !== null).toBe(di);
});

it('keeps the ASCE financial questionnaire disabled even when an otherwise matching policy exists', async () => {
  prepare();
  const library = getPrototypeLibrary()!;
  expect(library.site.configuration.features.find(feature => feature.key === 'feature-financial-questionnaire')?.enabled).toBe(false);
  library.site.configuration.financialQuestionnairePolicies = [{ value: { version: 1, enabled: true, applicant: 'member', rules: [{ productKeys: ['di-ltd'], minimumAmount: 1, inclusive: true }], sourceReferences: ['Synthetic policy cannot override disabled Site feature'] } }] as never;
  form.values['total-net-worth'] = '$90000';
  await render();
  expect(field('total-net-worth')).toBeNull();
  expect(container.textContent).not.toContain('Financial questionnaire');
});

it("keeps configured financial questions below Other coverage at the inclusive member DI threshold", async () => {
  prepare();
  getPrototypeLibrary()!.site.configuration.features.find(feature => feature.key === 'feature-financial-questionnaire')!.enabled = true;
  getPrototypeLibrary()!.site.configuration.financialQuestionnairePolicies = [{ value: { version: 1, enabled: true, applicant: 'member', rules: [{ productKeys: ['di-ltd'], minimumAmount: 7000, inclusive: true }], sourceReferences: ['Synthetic Profile policy test'] } }] as never;
  form.values = { dependents: ['spouse'], coverageSelections: ['di-ltd'], productApplicants: { 'di-ltd': ['member', 'spouse'] }, coverageAmounts: { 'di-ltd:member': 7000, 'di-ltd:spouse': 5000 } };
  await render('configured-financial');
  expect(field("total-net-worth")).not.toBeNull();
  expect(container.textContent!.indexOf("Financial questionnaire")).toBeGreaterThan(container.textContent!.indexOf("Other coverage"));
  expect(field("spouse-total-net-worth")).toBeNull();
  form.values = { ...form.values, coverageAmounts: { 'di-ltd:member': 6900, 'di-ltd:spouse': 5000 } };
  await render('below-threshold'); expect(field('total-net-worth')).toBeNull();
  form.values = { ...form.values, productApplicants: { 'di-ltd': ['spouse'] }, coverageAmounts: { 'di-ltd:member': 10000, 'di-ltd:spouse': 8000 } };
  await render("spouse-only"); expect(field("total-net-worth")).toBeNull();
});

it("shows and collapses member/spouse license, travel and existing-Life follow-ups without activating the full financial questionnaire", async () => {
  prepare();
  for (const prefix of ["", "spouse-"]) Object.assign(form.values, { [`${prefix}has-drivers-license`]: "yes", [`${prefix}intend-live-outside-us`]: "yes", [`${prefix}travel-outside-us-six-months`]: "yes", [`${prefix}has-other-life-insurance`]: "yes" });
  await render();
  for (const prefix of ["", "spouse-"]) {
    for (const id of ["height-feet", "height-inches", "physician-first-name", "has-other-life-insurance"]) {
      expect(field(`${prefix}${id}`)?.closest(".FieldGroup-root"), `${prefix}${id} field group`).not.toBeNull();
    }
  }
  for (const prefix of ["", "spouse-"]) {
    for (const id of ["drivers-license-number", "outside-us-country", "travel-outside-us-country", "existing-life-insurance-amount"]) expect(field(`${prefix}${id}`), `${prefix}${id}`).not.toBeNull();
  }
  expect(field("total-net-worth")).toBeNull();
  form.values = { ...form.values };
  for (const prefix of ["", "spouse-"]) Object.assign(form.values, { [`${prefix}has-drivers-license`]: "no", [`${prefix}intend-live-outside-us`]: "no", [`${prefix}travel-outside-us-six-months`]: "no", [`${prefix}has-other-life-insurance`]: "no" });
  await render("collapsed");
  for (const prefix of ["", "spouse-"]) for (const id of ["drivers-license-number", "outside-us-country", "travel-outside-us-country", "existing-life-insurance-amount"]) expect(field(`${prefix}${id}`), `${prefix}${id}`).toBeNull();
});

it("preserves repeatable disability insurance records, restores Edit values and requires removal confirmation", async () => {
  prepare();
  form.values = { ...form.values, "has-disability-insurance": "yes", selfDisabilityCompanies: [{ company: "Existing Carrier", monthlyBenefitAmount: "1200", benefitPeriod: "Age 65", waitingPeriod: "90 days" }] };
  await render();
  expect(container.textContent).toContain("Existing Carrier");
  const button = (label: string, scope: ParentNode = document) => [...scope.querySelectorAll("button")].find(button => button.textContent?.trim() === label)!;
  await act(async () => button("Edit", container).click());
  expect((document.querySelector('[name="di-company-name"]') as HTMLInputElement).value).toBe("Existing Carrier");
  expect((document.querySelector('[name="di-company-benefit-period"]') as HTMLInputElement).value).toBe("Age 65");
  await act(async () => button("Cancel", document.querySelector('[role="dialog"]')!).click());
  await act(async () => button("Remove", container).click());
  const confirmation = document.querySelector('[role="alertdialog"]')!;
  expect(confirmation.textContent).toContain("Are you sure");
  expect(container.textContent).toContain("Existing Carrier");
  await act(async () => button("Remove", confirmation).click());
  expect(container.textContent).not.toContain("Existing Carrier");
  await act(async () => button("Add Company", container).click());
  for (const id of ["di-company-name", "di-company-monthly-benefit", "di-company-benefit-period", "di-company-waiting-period"]) expect(document.querySelector(`[role="dialog"] [name="${id}"]`)).not.toBeNull();
});

it("shows the source NY replacement notice only for each active adult's Yes answer in Other Coverage", async () => {
  prepare();
  const text = "It may not be in your best interest to replace existing life insurance";
  Object.assign(form.values, { "state-province": "NY", "has-other-life-insurance": "yes", "is-replacing-life-insurance": "yes", "spouse-has-other-life-insurance": "yes", "spouse-is-replacing-life-insurance": "no" });
  await render();
  const memberNotice = container.querySelector('[data-testid="self-life-replacement-notice"]')!;
  expect(memberNotice.textContent).toContain(text);
  expect(memberNotice.closest('.MuiTypography-root')?.getAttribute('class')).toBeTruthy();
  expect(container.querySelector('[data-testid="spouse-life-replacement-notice"]')).toBeNull();
  for (const [key, changes] of Object.entries({ no: { "is-replacing-life-insurance": "no" }, otherState: { "state-province": "PA" }, noExistingLife: { "has-other-life-insurance": "no" }, noActiveLife: { coverageSelections: ["di-ltd"] } })) {
    const original = { ...form.values };
    Object.assign(form.values, changes); await render(key);
    expect(container.textContent, key).not.toContain(text);
    form.values = original;
  }
  Object.assign(form.values, { "is-replacing-life-insurance": "no", "spouse-is-replacing-life-insurance": "yes" });
  await render("spouse");
  expect(container.querySelector('[data-testid="self-life-replacement-notice"]')).toBeNull();
  expect(container.querySelector('[data-testid="spouse-life-replacement-notice"]')?.textContent).toContain(text);
  const copy = structuredClone(db);
  (copy.configurationValues.find(row => row.key === "global:shared.profile.lifeReplacementNotice")!.value as { text: string }).text = "Captured replacement wording";
  installPrototypeLibrary(resolvePrototypeLibrary(copy, "asce", "edited-notice"));
  await render("edited");
  expect(container.textContent).toContain(text);
  expect(container.textContent).not.toContain("Captured replacement wording");
});


it('uses active elections for spouse-only sections and product-scoped SSN optionality', async () => {
  prepare();
  form.values = { ...form.values, coverageSelections: ['di-ltd'], productApplicants: { 'li-term': ['member', 'spouse'], 'di-ltd': ['spouse'] }, coverageAmounts: { 'di-ltd:spouse': 1000 }, 'physician-first-name': 'HiddenMemberDoctor', 'spouse-physician-first-name': 'VisibleSpouseDoctor' };
  await render('spouse-only');
  expect(field('height-feet')).toBeNull();
  expect(field('physician-first-name')).toBeNull();
  expect(field('spouse-height-feet')).not.toBeNull();
  const ssn = () => getClientPageFields('profile', form.values).find(field => field.id === 'spouse-social-security-number');
  expect(ssn()?.required).toBe(false);
  expect(JSON.stringify(buildDocumentSections(form.values))).not.toContain('HiddenMemberDoctor');
  expect(JSON.stringify(buildDocumentSections(form.values))).toContain('VisibleSpouseDoctor');
  form.values = { ...form.values, coverageSelections: ['di-ltd', 'li-term'] };
  expect(ssn()?.required).toBe(true);
  form.values = { ...form.values, coverageSelections: ['di-ltd'], productApplicants: { 'di-ltd': ['member'], 'li-term': ['spouse'] } };
  await render('stale-spouse');
  expect(field('spouse-height-feet')).toBeNull();
  expect(field('height-feet')).not.toBeNull();
});

it('requires valid restored carrier records only for active DI Yes answers, independently per adult', () => {
  prepare();
  const library = getPrototypeLibrary()!;
  const collection = library.fieldCollections.selfDisabilityCompanies;
  expect(collection.minItems).toBe(1);
  expect(collection.maxItems).toBe(10);
  const record = { company: 'Example Carrier', monthlyBenefitAmount: '1200', benefitPeriod: 'Age 65', waitingPeriod: '90 days' };
  const values = { ...form.values, 'has-disability-insurance': 'yes' };
  expect(validateProfile(values, library)).toContain('at least one');
  expect(validateProfile({ ...values, selfDisabilityCompanies: [record] }, library)).toBeUndefined();
  expect(validateProfile({ ...values, selfDisabilityCompanies: [{ ...record, company: '' }] }, library)).toBeTruthy();
  expect(validateProfile({ ...values, selfDisabilityCompanies: Array.from({ length: 11 }, () => record) }, library)).toBeTruthy();
  expect(validateProfile({ ...values, 'has-disability-insurance': 'no' }, library)).toBeUndefined();
  expect(validateProfile({ ...values, coverageSelections: ['li-term'] }, library)).toBeUndefined();
  const spouse = { ...values, 'has-disability-insurance': 'no', 'spouse-has-disability-insurance': 'yes', productApplicants: { 'di-ltd': ['spouse'] } };
  expect(validateProfile(spouse, library)).toContain('at least one');
  expect(validateProfile({ ...spouse, spouseDisabilityCompanies: [record] }, library)).toBeUndefined();
});

it('shares financial follow-up visibility, zero defaults and calculated totals with the application summary', async () => {
  prepare();
  const library = getPrototypeLibrary()!;
  library.site.configuration.features.find(feature => feature.key === 'feature-financial-questionnaire')!.enabled = true;
  library.site.configuration.financialQuestionnairePolicies = [{ value: { version: 1, enabled: true, applicant: 'member', rules: [{ productKeys: ['di-ltd'], minimumAmount: 7000, inclusive: true }], sourceReferences: ['Synthetic Profile policy test'] } }] as never;
  form.values = { ...form.values, dependents: [], coverageSelections: ['di-ltd'], productApplicants: { 'di-ltd': ['member'] }, coverageAmounts: { 'di-ltd:member': 7000 }, 'is-self-employed': 'yes', 'is-sole-proprietor': true, 'is-professional-corporation': true, 'sole-proprietor-gross-earnings': '90000', 'sole-proprietor-business-expenses': '25000', 'work-from-home': 'no', 'has-work-location-outside-home': 'yes', 'work-location-details': 'HiddenOutsideDetails', 'professional-corporation-annual-salary': '10000', 'professional-corporation-s-corp-distribution': '20000', 'professional-corporation-dividends': '30000', 'professional-corporation-bonus': '4000', 'professional-corporation-commission': '5000', 'professional-corporation-benefits-cost': '6000' };
  await render('financial-totals');
  expect(container.textContent).toContain('$65,000.00');
  expect(container.textContent).toContain('$75,000.00');
  expect(field('has-work-location-outside-home')).toBeNull();
  expect(field('work-location-details')).toBeNull();
  const document = JSON.stringify(buildDocumentSections(form.values));
  expect(document).toContain('$65,000.00'); expect(document).toContain('$75,000.00');
  expect(document).not.toContain('HiddenOutsideDetails');
  form.values = { ...form.values, 'is-self-employed': 'no' };
  await render('not-self-employed');
  expect(field('years-self-employed')).toBeNull();
  expect(JSON.stringify(buildDocumentSections(form.values))).not.toContain('65,000');
  form.values = { ...form.values, 'is-self-employed': 'yes', 'is-sole-proprietor': false, 'is-professional-corporation': false };
  await render('no-income-source');
  expect(field('years-self-employed')).not.toBeNull();
  expect(field('work-from-home')).not.toBeNull();
});
