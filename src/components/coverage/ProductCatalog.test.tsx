import { readFileSync } from 'node:fs';
import { act, useEffect, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { ProductCard } from "../../app/sections/ConfiguredProductCatalog";
import EstimatorProductCard from "./EstimatorProductCard";
import { residencyExclusionDiagnostic } from "../../domain/residencyPolicy";
import CoverageCart from "../../app/sections/ConfiguredCoverageCart";
import { ApplicationFormContext, type ApplicationFormValues } from "../../app/ApplicationFormContext";
import { useCoverageState } from "../../app/useCoverageState";
import type { CoverageDefinition } from "../../domain/coverage";
import { resolveApplicationCoverage } from "../../domain/coverageRuntime";
import { installPrototypeLibrary, resolvePrototypeLibrary } from "../../domain/prototypeLibrary";
import { createReviewedMigrationDatabase } from "../../migration/fixtures";
import dayjs from "dayjs";
import { formatUSD } from "../../utils/formatUSD";

const catalog = vi.hoisted(() => ({ products: [] as CoverageDefinition[] }));
vi.mock("../../config/client/getActiveClientCoverages", async original => ({ ...await original<object>(), getActiveClientCoverages: () => catalog.products }));

let container: HTMLDivElement;
let root: Root;
let state: ReturnType<typeof useCoverageState>;
let initialValues: ApplicationFormValues;
const fixture = (): CoverageDefinition => ({
  id: "di-ltd", name: "Test Disability", code: "DI", categoryId: "DI", planCode: { primary: "DI" }, definition: "Test benefit", underwritingType: "FUW", applicants: ["member"], options: [],
  coverageAmounts: [{ scope: { applicantType: "member" }, selections: [{ type: "amountList", values: [100, 200] }] }],
  waitingPeriodOptions: [{ value: "30", label: "30 days", days: 30 }, { value: "60", label: "60 days", days: 60 }],
  maxBenefitPeriodOptions: [{ value: "two-years", label: "Two years" }, { value: "five-years", label: "Five years" }],
  riders: [
    { id: "standalone", name: "Standalone Benefit", description: "Standalone benefit description", premiumFactor: 0, riderOnlyApplicants: ["member"], hasAmount: true, amountLabel: "Rider Amount", defaultAmount: 500, coverageAmounts: [{ scope: { applicantType: "member" }, selections: [{ type: "amountList", values: [500, 1000] }] }] },
    { id: "optional", name: "Other Benefit", description: "Other benefit description", premiumFactor: 0 },
  ],
});

function Consumer() {
  const current = useCoverageState();
  useEffect(() => { state = current; });
  return <ProductCard getCoverageBehavior={(product, applicant) => resolveApplicationCoverage(product, applicant, current.values, catalog.products)} coverage={{ ...catalog.products[0], featured: false }} productApplicants={current.productApplicants} storedAmounts={current.storedAmounts} storedRiders={current.storedRiders} storedRiderAmounts={current.storedRiderAmounts}
    storedWaitingPeriods={current.storedWaitingPeriods} storedMaxBenefitPeriods={current.storedMaxBenefitPeriods} calculatingRateKeys={current.calculatingRateKeys} rateFrequency={current.rateFrequency} frequencyCalculating={current.frequencyCalculating}
    onToggleApplicant={current.toggleApplicantForProduct} onAmountChange={current.handleAmountChange} onRiderToggle={current.handleRiderToggle} onRiderAmountChange={current.handleRiderAmountChange}
    onWaitingPeriodChange={current.handleWaitingPeriodChange} onMaxBenefitPeriodChange={current.handleMaxBenefitPeriodChange} getVisibleApplicants={current.getVisibleApplicants} calcApplicantPremium={current.calcApplicantPremium} generateAmountChoices={current.generateAmountChoices} />;
}
function Harness() {
  const [values, setValues] = useState(initialValues);
  return <ApplicationFormContext.Provider value={{ values, setPageValues: patch => setValues(previous => ({ ...previous, ...patch })), resetValues: () => {} }}><Consumer /></ApplicationFormContext.Provider>;
}
beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  window.history.replaceState(null, "", "/?site=demo"); window.sessionStorage.clear();
  catalog.products = [fixture()];
  initialValues = { coverageAmounts: { "di-ltd:member": 100 } };
  container = document.createElement("div"); document.body.append(container); root = createRoot(container);
});
afterEach(async () => { await act(async () => root.unmount()); container.remove(); installPrototypeLibrary(null); vi.unstubAllGlobals(); });
const checkbox = (label: string) => [...container.querySelectorAll('label.SelectionGroup-root')].find(row => row.textContent?.includes(label))!.querySelector<HTMLInputElement>('input[type="checkbox"]')!;
const select = (label: string) => container.querySelector<HTMLElement>(`[role="combobox"][aria-labelledby~="${label}"]`) ?? container.querySelector<HTMLElement>(`input[id="${label.slice(0, -6)}"]`)!;
const option = (value: string) => document.querySelector<HTMLElement>(`[role="option"][data-value="${value}"]`) ?? [...document.querySelectorAll<HTMLElement>('[role="option"]')].find(item => item.textContent === formatUSD(Number(value), 0) || item.textContent?.startsWith('$0 - Applying for') && value.startsWith('rider-only:')) ?? null;
async function openSelect(label: string) {
  const element = select(label);
  await act(async () => {
    if (element instanceof HTMLInputElement) { element.focus(); element.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, button: 0 })); }
    else element.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, button: 0 }));
  });
}
async function choose(label: string, value: string) {
  await openSelect(label);
  const selectedOption = option(value)!;
  expect(selectedOption).not.toBeNull();
  await act(async () => selectedOption.click());
}

it("renders stored WAEPA age-capped choices alongside the labeled CIR-only election", async () => {
  const library = resolvePrototypeLibrary(createReviewedMigrationDatabase(), "waepa", "test:age-cap-menu");
  installPrototypeLibrary(library);
  window.history.replaceState(null, "", "/?site=waepa");
  catalog.products = library.products.filter(product => product.id === "li-group-term");
  initialValues = { "birth-date": dayjs().subtract(65, "year").format("YYYY-MM-DD"), "state-province": "VA", "active-military": "no",
    coverageSelections: ["li-group-term"], productApplicants: { "li-group-term": ["member"] }, coverageAmounts: { "li-group-term:member": 550000 } };
  await act(async () => root.render(<Harness />));
  await openSelect("li-group-term:member-amount-label");
  expect(option('25000')).not.toBeNull();
  expect(option('550000')).not.toBeNull();
  expect(option('575000')).toBeNull();
  expect(option('0')).toBeNull();
  const standalone = option('rider-only:cir')!;
  expect(standalone.textContent).toBe("$0 - Applying for Chronic Illness Rider (CIR) only");
  await act(async () => standalone.click());
  expect(state.storedAmounts["li-group-term:member"]).toBe(0);
  expect(state.values.coverageRiderOnly).toEqual({ "li-group-term:member": "cir" });
  expect(checkbox("Add coverage").disabled).toBe(false);
}, 15000);

it("keeps residency validation without automatically displaying its internal diagnostic in Coverage or quote cards", async () => {
  const library = resolvePrototypeLibrary(createReviewedMigrationDatabase(), "waepa", "test:residency-presentation");
  installPrototypeLibrary(library);
  window.history.replaceState(null, "", "/?site=waepa");
  catalog.products = library.products.filter(product => product.id === "li-group-term");
  initialValues = { "birth-date": dayjs().subtract(65, "year").format("YYYY-MM-DD"), "state-province": "NY", "active-military": "no",
    coverageSelections: ["li-group-term"], productApplicants: { "li-group-term": ["member"] }, coverageAmounts: { "li-group-term:member": 100000 } };
  await act(async () => root.render(<Harness />));
  const behavior = resolveApplicationCoverage(catalog.products[0], "member", state.values, catalog.products);
  expect(behavior.selectable).toBe(false);
  expect(behavior.messages).toContain(residencyExclusionDiagnostic);
  expect(state.validate(state.values)).toContain(residencyExclusionDiagnostic);
  expect(container.textContent).not.toContain(residencyExclusionDiagnostic);
  await act(async () => root.render(<EstimatorProductCard product={catalog.products[0]} unavailableReason={residencyExclusionDiagnostic}
    currentAmount={100000} amountChoices={behavior.amounts} selected={false} isCalculating={false} displayedPremium={0} rateSuffix="/mo"
    onToggleSelected={() => {}} onAmountChange={() => {}} />));
  expect(container.textContent).not.toContain(residencyExclusionDiagnostic);
  expect(container.querySelector<HTMLInputElement>('input[type="checkbox"]')?.disabled).toBe(true);
}, 15000);

it("keeps CSEA spouse and child benefits independently optional with the sourced amount controls", async () => {
  const library = resolvePrototypeLibrary(createReviewedMigrationDatabase(), "csea", "test:optional-dependent-benefits");
  installPrototypeLibrary(library); window.history.replaceState(null, "", "/?site=csea");
  catalog.products = library.products.filter(product => product.id === "di-ltd");
  initialValues = { membership: "yes", "birth-date": "1990-01-01", "state-province": "NY", "hours-worked-per-week": 40, "average-monthly-income": 5000, "csea-occupation-group": "group-1-clerical", dependents: ["spouse", "child"], coverageSelections: ["di-ltd"], productApplicants: { "di-ltd": ["member"] }, coverageAmounts: { "di-ltd:member": 1000 } };
  await act(async () => root.render(<Harness />));
  const spouse = checkbox("Accident Disability"), child = checkbox("Outpatient Emergency Room Benefit");
  expect(spouse.checked).toBe(true); expect(child.checked).toBe(true);
  expect(spouse.disabled).toBe(false); expect(child.disabled).toBe(false);
  expect(container.textContent).toContain("children under age 19");
  expect(container.textContent).toContain("two visits per calendar year");
  await act(async () => spouse.click());
  expect(state.storedRiders["di-ltd:csea.spouse-accident:member"]).toBe(false);
  expect(state.storedRiders["di-ltd:csea.child-outpatient:member"]).toBe(true);
  await act(async () => child.click());
  expect(state.storedRiders["di-ltd:csea.child-outpatient:member"]).toBe(false);
  await act(async () => spouse.click());
  expect(state.storedRiders["di-ltd:csea.spouse-accident:member"]).toBe(true);
  expect(state.storedRiders["di-ltd:csea.child-outpatient:member"]).toBe(false);
  expect(catalog.products[0].riders?.find(row => row.dependentApplicant === "spouse")?.coverageAmounts?.[0].selections).toEqual([{ type: "amountList", values: [500, 1000] }]);
  expect(catalog.products[0].riders?.find(row => row.dependentApplicant === "child")?.hasAmount).toBe(false);
}, 20000);

it("shows and preserves editable rider choices before adding a product", async () => {
  await act(async () => root.render(<Harness />));
  expect(container.textContent).toContain("Standalone benefit description");
  expect(container.textContent).toContain("Other benefit description");
  expect(checkbox("Other Benefit").disabled).toBe(false);
  await act(async () => checkbox("Other Benefit").click());
  expect(state.storedRiders["di-ltd:optional:member"]).toBe(true);
  expect(state.selectedCoverageIds).toEqual([]);
});

it("renders the ATPE 50% comparison as information while keeping the full spouse amount range", async () => {
  const library = resolvePrototypeLibrary(createReviewedMigrationDatabase(), "isitrust", "test:atpe-advisory");
  installPrototypeLibrary(library); window.history.replaceState(null, "", "/?site=isitrust");
  catalog.products = library.products.filter(product => product.id === "li-group-term");
  initialValues = { membership: "association-of-texas-professional-educators", dependents: ["spouse"], "birth-date": "1986-01-01", "spouse-birth-date": "1986-01-01", "state-province": "PA",
    coverageSelections: ["li-group-term"], productApplicants: { "li-group-term": ["member", "spouse"] }, coverageAmounts: { "li-group-term:member": 100000, "li-group-term:spouse": 500000 } };
  await act(async () => root.render(<Harness />));
  expect([...container.querySelectorAll('.MuiAlert-standardInfo')].some(alert => alert.textContent?.includes("50% of member coverage"))).toBe(true);
  await openSelect("li-group-term:spouse-amount-label");
  expect(option('500000')).not.toBeNull();
  expect(option('550000')).toBeNull();
});

it("renders ATPE's Graded Benefit Life label from its captured Association assignment", async () => {
  const library = resolvePrototypeLibrary(createReviewedMigrationDatabase(), "isitrust", "test:atpe-label");
  installPrototypeLibrary(library); window.history.replaceState(null, "", "/?site=isitrust");
  catalog.products = library.products.filter(product => product.id === "li-50plus");
  initialValues = { membership: "association-of-texas-professional-educators", "birth-date": "1986-01-01", "state-province": "KS" };
  await act(async () => root.render(<Harness />));
  expect(container.textContent).toContain("Graded Benefit Life");
  expect(container.textContent).not.toContain(catalog.products[0].name);
});

it("selects a standalone rider at $0, locks other controls, preserves Add, and unlocks on a positive amount", async () => {
  await act(async () => root.render(<Harness />));
  await openSelect("di-ltd:member-amount-label");
  expect([...document.querySelectorAll('[role="option"]')].find(item => item.textContent?.startsWith("$0 - Applying for"))?.textContent).toBe("$0 - Applying for Standalone Benefit only");
  await act(async () => option('rider-only:standalone')!.click());
  expect(state.storedAmounts["di-ltd:member"]).toBe(0);
  expect(state.values.coverageRiderOnly).toEqual({ "di-ltd:member": "standalone" });
  expect(checkbox("Standalone Benefit").checked).toBe(true);
  expect(checkbox("Standalone Benefit").disabled).toBe(true);
  expect(checkbox("Other Benefit").disabled).toBe(true);
  expect(select("di-ltd:member-waiting-period-label").getAttribute("aria-disabled")).toBe("true");
  expect(select("di-ltd:member-max-benefit-period-label").getAttribute("aria-disabled")).toBe("true");
  expect(select("di-ltd:standalone:member-amount-label").getAttribute("aria-disabled")).not.toBe("true");
  await choose("di-ltd:standalone:member-amount-label", "1000");
  expect(state.storedRiderAmounts["di-ltd:standalone:member"]).toBe(1000);
  expect(checkbox("Add coverage").disabled).toBe(false);
  await act(async () => checkbox("Add coverage").click());
  expect(state.productApplicants["di-ltd"]).toEqual(["member"]);
  expect(state.storedAmounts["di-ltd:member"]).toBe(0);
  expect(state.validate(state.values)).toBeUndefined();
  expect(Number.isNaN(state.grandTotal)).toBe(true);
  expect(container.textContent).not.toContain("not applying for this product");
  await choose("di-ltd:member-amount-label", "200");
  expect(state.values.coverageRiderOnly).toEqual({});
  expect(checkbox("Other Benefit").disabled).toBe(false);
  expect(select("di-ltd:member-waiting-period-label").getAttribute("aria-disabled")).not.toBe("true");
  expect(select("di-ltd:member-max-benefit-period-label").getAttribute("aria-disabled")).not.toBe("true");
});

it("restores a zero-amount rider election and its rider amount without converting it to base coverage", async () => {
  initialValues = { coverageSelections: ["di-ltd"], productApplicants: { "di-ltd": ["member"] }, coverageAmounts: { "di-ltd:member": 0 }, coverageRiderOnly: { "di-ltd:member": "standalone" }, coverageRiderAmounts: { "di-ltd:standalone:member": 1000 }, coverageRiders: { "di-ltd:optional:member": true } };
  await act(async () => root.render(<Harness />));
  expect(select("di-ltd:member-amount-label").textContent).toBe("$0 - Applying for Standalone Benefit only");
  expect(checkbox("Standalone Benefit").checked).toBe(true);
  expect(checkbox("Other Benefit").checked).toBe(false);
  expect(state.storedRiderAmounts["di-ltd:standalone:member"]).toBe(1000);
  await act(async () => checkbox("Add coverage").click());
  await act(async () => checkbox("Add coverage").click());
  expect(state.storedAmounts["di-ltd:member"]).toBe(0);
  expect(state.storedRiderAmounts["di-ltd:standalone:member"]).toBe(1000);
});

it("does not offer rider-only mode for an unconfigured product", async () => {
  delete catalog.products[0].riders![0].riderOnlyApplicants;
  await act(async () => root.render(<Harness />));
  await openSelect("di-ltd:member-amount-label");
  expect(document.querySelector('[role="option"][data-value^="rider-only:"]')).toBeNull();
});

it("distinguishes two standalone riders and rejects incomplete or forged zero-amount elections", async () => {
  catalog.products[0].riders![1].riderOnlyApplicants = ["member"];
  await act(async () => root.render(<Harness />));
  await choose("di-ltd:member-amount-label", "rider-only:optional");
  expect(checkbox("Other Benefit").checked).toBe(true);
  expect(checkbox("Standalone Benefit").checked).toBe(false);
  await act(async () => checkbox("Add coverage").click());
  expect(state.validate(state.values)).toBeUndefined();
  expect(state.validate({ ...state.values, coverageRiders: {} })).toContain("select Other Benefit");
  expect(state.validate({ ...state.values, coverageRiderOnly: { "di-ltd:member": "missing" } })).toContain("Select at least one benefit amount");
  await choose("di-ltd:member-amount-label", "rider-only:standalone");
  expect(state.validate({ ...state.values, coverageRiderAmounts: { "di-ltd:standalone:member": 900 } })).toContain("select an available rider amount");
});

it("shows a rider-only cart entry with separately provided pricing rather than zero premium", async () => {
  const values = { coverageSelections: ["di-ltd"], productApplicants: { "di-ltd": ["member"] }, coverageAmounts: { "di-ltd:member": 0 }, coverageRiderOnly: { "di-ltd:member": "standalone" }, coverageRiders: { "di-ltd:standalone:member": true }, coverageRiderAmounts: { "di-ltd:standalone:member": 1000 } };
  await act(async () => root.render(<MemoryRouter><ApplicationFormContext.Provider value={{ values, setPageValues: () => {}, resetValues: () => {} }}><CoverageCart variant="drawer" onClose={() => {}} /></ApplicationFormContext.Provider></MemoryRouter>));
  expect(container.textContent).toContain("$0 - Applying for Standalone Benefit only");
  expect(container.textContent).toContain("Standalone Benefit: $1,000");
  expect(container.textContent).toContain("Rate provided separately");
  expect(container.textContent).not.toContain("Choose benefit amount");
});

it.each([false, true])("keeps Add coverage usable with incomplete eligibility, including rider-only=%s", async riderOnly => {
  catalog.products[0].requirements = { eligibility: [{ applicantType: "member", minimumAgeYears: 18 }] };
  if (riderOnly) initialValues = { coverageAmounts: { "di-ltd:member": 0 }, coverageRiderOnly: { "di-ltd:member": "standalone" } };
  await act(async () => root.render(<Harness />));
  expect(resolveApplicationCoverage(catalog.products[0], "member", state.values, catalog.products).selectable).toBe(false);
  expect(checkbox("Add coverage").disabled).toBe(false);
  expect(checkbox("Add coverage").closest('label')?.getAttribute("aria-disabled")).not.toBe("true");
  await act(async () => checkbox("Add coverage").click());
  expect(state.productApplicants["di-ltd"]).toEqual(["member"]);
  expect(state.validate(state.values)).toContain("eligibility information");
  expect(checkbox("Add coverage").disabled).toBe(false);
  if (riderOnly) {
    expect(state.storedAmounts["di-ltd:member"]).toBe(0);
    expect(checkbox("Other Benefit").disabled).toBe(true);
  }
  await act(async () => checkbox("Add coverage").click());
  expect(state.productApplicants["di-ltd"]).toEqual([]);
});

it("hides 50+ Life when the applicant is under its minimum age", async () => {
  const library = resolvePrototypeLibrary(createReviewedMigrationDatabase(), "abe", "test:hidden-50plus");
  installPrototypeLibrary(library);
  window.history.replaceState(null, "", "/coverage?site=abe");
  catalog.products = [library.products.find(product => product.id === "li-50plus")!];
  initialValues = { membership: "yes", "birth-date": "1990-01-01", "state-province": "NY" };
  await act(async () => root.render(<MemoryRouter><Harness /></MemoryRouter>));
  expect(container.textContent).not.toContain(catalog.products[0].name);
  expect(container.textContent).not.toContain("This applicant does not meet");
});

it("omits raw underwriting status notes from the product card", async () => {
  await act(async () => root.render(<MemoryRouter><Harness /></MemoryRouter>));
  expect(container.textContent).toContain("Test Disability");
  expect(container.textContent).not.toContain("Underwriting:");
});

it("keeps mutually exclusive Add usable and blocks continuing until the conflict is removed", async () => {
  catalog.products = [{ ...fixture(), requirements: { exclusiveProducts: ['other'] } }, { ...fixture(), id: 'other', name: 'Other disability' }];
  initialValues = { coverageSelections: ['other'], productApplicants: { other: ['member'] }, coverageAmounts: { 'other:member': 100 } };
  await act(async () => root.render(<Harness />));
  expect(checkbox('Add coverage').disabled).toBe(false);
  await act(async () => checkbox('Add coverage').click());
  expect(state.selectedCoverageIds).toEqual(['other', 'di-ltd']);
  expect(state.validate(state.values)).toContain('cannot be selected together');
  await act(async () => state.toggleApplicantForProduct('other', 'member'));
  expect(checkbox('Add coverage').disabled).toBe(false);
  expect(state.validate(state.values)).toBeUndefined();
});

it("opens the drawer for the first product and uses Added for later additions including after clearing the cart", async () => {
  catalog.products = [fixture(), { ...fixture(), id: 'other', name: 'Other disability' }];
  initialValues = {};
  await act(async () => root.render(<Harness />));
  await act(async () => state.toggleApplicantForProduct('di-ltd', 'member'));
  expect(state.summaryDrawerOpen).toBe(true);
  expect(state.addedSnackbarOpen).toBe(false);
  await act(async () => state.setSummaryDrawerOpen(false));
  await act(async () => state.toggleApplicantForProduct('other', 'member'));
  expect(state.selectedCoverageIds).toEqual(['di-ltd', 'other']);
  expect(state.summaryDrawerOpen).toBe(false);
  expect(state.addedSnackbarOpen).toBe(true);
  await act(async () => { state.setAddedSnackbarOpen(false); state.toggleApplicantForProduct('di-ltd', 'member'); });
  await act(async () => state.toggleApplicantForProduct('other', 'member'));
  expect(state.selectedCoverageIds).toEqual([]);
  await act(async () => state.toggleApplicantForProduct('di-ltd', 'member'));
  expect(state.summaryDrawerOpen).toBe(false);
  expect(state.addedSnackbarOpen).toBe(true);
});

it("uses later-add feedback when restoring an existing cart and adding after it is emptied", async () => {
  catalog.products = [fixture()];
  initialValues = { coverageSelections: ['di-ltd'], productApplicants: { 'di-ltd': ['member'] }, coverageAmounts: { 'di-ltd:member': 100 } };
  await act(async () => root.render(<Harness />));
  await act(async () => state.toggleApplicantForProduct('di-ltd', 'member'));
  await act(async () => state.toggleApplicantForProduct('di-ltd', 'member'));
  expect(state.summaryDrawerOpen).toBe(false);
  expect(state.addedSnackbarOpen).toBe(true);
});

it("preserves saved benefit amounts during a normalized exclusivity conflict and after removing one plan", async () => {
  const saved = JSON.parse(readFileSync('public/catalog/portal.json', 'utf8'));
  const library = resolvePrototypeLibrary(saved.data, 'abe', 'test:exclusive-amount-retention');
  installPrototypeLibrary(library);
  window.history.replaceState(null, '', '/coverage?site=abe');
  catalog.products = library.products.filter(product => ['di-ltd', 'di-ltd-plus'].includes(product.id));
  initialValues = { membership: 'yes', 'birth-date': '1990-01-01', 'state-province': 'VA', 'hours-worked-per-week': '40', 'average-monthly-income': '10000',
    coverageSelections: ['di-ltd', 'di-ltd-plus'], productApplicants: { 'di-ltd': ['member'], 'di-ltd-plus': ['member'] },
    coverageAmounts: { 'di-ltd:member': 1000, 'di-ltd-plus:member': 1000 } };
  await act(async () => root.render(<Harness />));
  expect(state.storedAmounts['di-ltd:member']).toBe(1000);
  expect(state.storedAmounts['di-ltd-plus:member']).toBe(1000);
  expect(state.validate(state.values)).toContain('cannot be selected together');
  await act(async () => state.toggleApplicantForProduct('di-ltd-plus', 'member'));
  expect(state.selectedCoverageIds).toEqual(['di-ltd']);
  expect(state.storedAmounts['di-ltd:member']).toBe(1000);
});
