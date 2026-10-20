import { act, useEffect, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { ProductCard } from "./ProductCatalog";
import EstimatorProductCard from "./EstimatorProductCard";
import { residencyExclusionDiagnostic } from "../../domain/residencyPolicy";
import CoverageCart from "../ui/CoverageCart";
import { ApplicationFormContext, type ApplicationFormValues } from "../../app/ApplicationFormContext";
import { useCoverageState } from "../../app/useCoverageState";
import type { CoverageDefinition } from "../../domain/coverage";
import { resolveApplicationCoverage } from "../../domain/coverageRuntime";
import { installPrototypeLibrary, resolvePrototypeLibrary } from "../../domain/prototypeLibrary";
import { createReviewedMigrationDatabase } from "../../migration/fixtures";
import dayjs from "dayjs";

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
const select = (label: string) => container.querySelector<HTMLElement>(`[role="combobox"][aria-labelledby="${label}"]`)!;
async function choose(label: string, value: string) {
  await act(async () => select(label).dispatchEvent(new MouseEvent("mousedown", { bubbles: true, button: 0 })));
  const option = document.querySelector<HTMLElement>(`[role="option"][data-value="${value}"]`)!;
  expect(option).not.toBeNull();
  await act(async () => option.click());
}

it("renders stored WAEPA age-capped choices alongside the labeled CIR-only election", async () => {
  const library = resolvePrototypeLibrary(createReviewedMigrationDatabase(), "waepa", "test:age-cap-menu");
  installPrototypeLibrary(library);
  window.history.replaceState(null, "", "/?site=waepa");
  catalog.products = library.products.filter(product => product.id === "li-group-term");
  initialValues = { "birth-date": dayjs().subtract(65, "year").format("YYYY-MM-DD"), "state-province": "VA", "active-military": "no",
    coverageSelections: ["li-group-term"], productApplicants: { "li-group-term": ["member"] }, coverageAmounts: { "li-group-term:member": 550000 } };
  await act(async () => root.render(<Harness />));
  await act(async () => select("li-group-term:member-amount-label").dispatchEvent(new MouseEvent("mousedown", { bubbles: true, button: 0 })));
  expect(document.querySelector('[role="option"][data-value="25000"]')).not.toBeNull();
  expect(document.querySelector('[role="option"][data-value="550000"]')).not.toBeNull();
  expect(document.querySelector('[role="option"][data-value="575000"]')).toBeNull();
  expect(document.querySelector('[role="option"][data-value="0"]')).toBeNull();
  const standalone = document.querySelector<HTMLElement>('[role="option"][data-value="rider-only:cir"]')!;
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

it("shows and preserves editable rider choices before adding a product", async () => {
  await act(async () => root.render(<Harness />));
  expect(container.textContent).toContain("Standalone benefit description");
  expect(container.textContent).toContain("Other benefit description");
  expect(checkbox("Other Benefit").disabled).toBe(false);
  await act(async () => checkbox("Other Benefit").click());
  expect(state.storedRiders["di-ltd:optional:member"]).toBe(true);
  expect(state.selectedCoverageIds).toEqual([]);
});

it("selects a standalone rider at $0, locks other controls, preserves Add, and unlocks on a positive amount", async () => {
  await act(async () => root.render(<Harness />));
  await act(async () => select("di-ltd:member-amount-label").dispatchEvent(new MouseEvent("mousedown", { bubbles: true, button: 0 })));
  expect(document.querySelector('[role="option"]')?.textContent).toBe("$0 - Applying for Standalone Benefit only");
  await act(async () => document.querySelector<HTMLElement>('[role="option"][data-value="rider-only:standalone"]')!.click());
  expect(state.storedAmounts["di-ltd:member"]).toBe(0);
  expect(state.values.coverageRiderOnly).toEqual({ "di-ltd:member": "standalone" });
  expect(checkbox("Standalone Benefit").checked).toBe(true);
  expect(checkbox("Standalone Benefit").disabled).toBe(true);
  expect(checkbox("Other Benefit").disabled).toBe(true);
  expect(select("di-ltd-waiting-period-label").getAttribute("aria-disabled")).toBe("true");
  expect(select("di-ltd-max-benefit-period-label").getAttribute("aria-disabled")).toBe("true");
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
  expect(select("di-ltd-waiting-period-label").getAttribute("aria-disabled")).not.toBe("true");
  expect(select("di-ltd-max-benefit-period-label").getAttribute("aria-disabled")).not.toBe("true");
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
  await act(async () => select("di-ltd:member-amount-label").dispatchEvent(new MouseEvent("mousedown", { bubbles: true, button: 0 })));
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

it("shows a rider-only cart entry and an unavailable estimate rather than zero premium", async () => {
  const values = { coverageSelections: ["di-ltd"], productApplicants: { "di-ltd": ["member"] }, coverageAmounts: { "di-ltd:member": 0 }, coverageRiderOnly: { "di-ltd:member": "standalone" }, coverageRiders: { "di-ltd:standalone:member": true }, coverageRiderAmounts: { "di-ltd:standalone:member": 1000 } };
  await act(async () => root.render(<MemoryRouter><ApplicationFormContext.Provider value={{ values, setPageValues: () => {}, resetValues: () => {} }}><CoverageCart variant="drawer" onClose={() => {}} /></ApplicationFormContext.Provider></MemoryRouter>));
  expect(container.textContent).toContain("$0 - Applying for Standalone Benefit only");
  expect(container.textContent).toContain("Standalone Benefit: $1,000");
  expect(container.textContent).toContain("Estimate unavailable");
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
