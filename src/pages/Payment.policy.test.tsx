import { paymentDefaultSections } from '../config/fields/paymentFields';
import { act, useEffect } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeAll, beforeEach, expect, it, vi } from "vitest";
import Payment from "./Payment";
import { createReviewedMigrationDatabase } from "../migration/fixtures";
import { installPrototypeLibrary, resolvePrototypeLibrary } from "../domain/prototypeLibrary";
import { resolveCoverageJourneyPolicy } from "../domain/coverageJourneyPolicy";
import { mockRequest } from "../mock/client";
import type { DatabaseSchema } from "../persistence/types";
import type { FieldDefinition } from "../config/fields/types";

let values: Record<string, unknown>, root: Root, container: HTMLDivElement, db: DatabaseSchema;
const capture: { validate?: (values: Record<string, unknown>) => string | undefined; fields?: (values: Record<string, unknown>) => FieldDefinition[]; beforeNext?: (props: { values: Record<string, unknown>; continueNavigation: () => void }) => boolean } = {};
vi.mock("../mock/client", () => ({ mockRequest: vi.fn() }));
vi.mock("../app/ApplicationFormContext", async original => ({ ...await original<typeof import("../app/ApplicationFormContext")>(), useApplicationForm: () => ({ values, setPageValues: () => {}, requiresRevalidation: false }) }));
vi.mock("../app/RoutePage", () => ({ default: function Route({ children, validate, devFillFields, onBeforeNext }: { children: (props: unknown) => unknown; validate: typeof capture.validate; devFillFields: typeof capture.fields; onBeforeNext: typeof capture.beforeNext }) {
  useEffect(() => { capture.validate = validate; capture.fields = devFillFields; capture.beforeNext = onBeforeNext; });
  return children({ watchedValues: values, errors: {}, control: undefined, setValue: () => {}, pageSections: paymentDefaultSections });
} }));
vi.mock("../components/forms/FieldRenderer", () => ({ default: ({ field }: { field: FieldDefinition }) => <output data-field={field.id}>{field.options?.map(option => option.label).join("|")}</output> }));
vi.mock("../app/usePrototypeRates", () => ({ usePrototypeRates: () => ({ enabled: true, premium: () => NaN, display: () => ({ status: "needs-information" }) }) }));
beforeAll(() => { db = createReviewedMigrationDatabase(); }, 120000);
beforeEach(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  window.history.replaceState(null, "", "/payment?site=asce");
  installPrototypeLibrary(resolvePrototypeLibrary(db, "asce", "reviewed-payment"));
  container = document.createElement("div"); document.body.append(container); root = createRoot(container);
});
afterEach(async () => { await act(async () => root.unmount()); container.remove(); installPrototypeLibrary(null); vi.unstubAllEnvs(); vi.clearAllMocks(); });

const baseValues = { 'payment-information-opt-in': 'yes', membership: 'yes', 'birth-date': '1990-01-01', 'state-province': 'PA', coverageSelections: ['li-term'], productApplicants: { 'li-term': ['member'] }, coverageAmounts: { 'li-term:member': 100000 } };
const render = async () => { await act(async () => root.render(<MemoryRouter><Payment /></MemoryRouter>)); };

it('uses effective method/frequency options and validates only active bank fields', async () => {
  values = { ...baseValues, 'payment-method:li-term': 'bill-me', 'payment-frequency:li-term': 'monthly' };
  await render();
  expect(capture.validate!(values)).toBeUndefined();
  expect(capture.validate!({ ...values, 'payment-method:li-term': 'credit-card' })).toBeDefined();
  expect(capture.fields!(values).some(field => field.id.startsWith('bank-'))).toBe(false);
  expect(container.querySelector('[data-field="payment-method:li-term"]')?.textContent).toBe('Bill me|Bank account');
  values = { ...values, 'payment-method:li-term': 'bank-account' };
  await render();
  const fields = capture.fields!(values);
  expect(fields.find(field => field.id === 'bank-routing-number')).toMatchObject({ required: true, minLength: 9, maxLength: 9, inputMode: 'numeric' });
  expect(fields.find(field => field.id === 'bank-account-number')).toMatchObject({ required: true, maxLength: 17 });
  expect(container.querySelector('[data-field="bank-name-on-account"]')).not.toBeNull();
});

it('supports optional collection without requiring hidden product or bank controls', async () => {
  expect(resolvePrototypeLibrary(db, 'asce', 'optional-payment').site.configuration.pages.find(page => page.key === 'payment')?.requirement).toBe('optional');
  values = { ...baseValues, 'payment-information-opt-in': 'no', 'payment-method:li-term': 'bank-account' };
  await render();
  expect(capture.validate!(values)).toBeUndefined();
  expect(capture.fields!(values).map(field => field.id)).toEqual(['payment-information-opt-in']);
  expect(container.querySelector('[data-field^="bank-"]')).toBeNull();
  expect(capture.validate!({ ...values, 'payment-information-opt-in': 'yes' })).toBeDefined();
  vi.stubEnv('VITE_MOCK_PLATFORM_ENABLED', 'true');
  await render();
  expect(capture.beforeNext).toBeUndefined();
  expect(mockRequest).not.toHaveBeenCalled();
});

it('ignores stale product/applicant amounts and preserves configured product order', async () => {
  const library = resolvePrototypeLibrary(db, 'asce', 'synthetic-payment-order');
  library.client.coverages.categoryOrder = ['DI', 'LI'];
  library.client.coverages.productOrder = ['di-ltd', 'li-10yr', 'li-term'];
  installPrototypeLibrary(library);
  values = { ...baseValues, coverageSelections: ['li-term', 'di-ltd', 'li-10yr'], productApplicants: { 'li-term': ['member'], 'di-ltd': ['member'], 'li-10yr': [] }, coverageAmounts: { 'li-term:member': 100000, 'li-term:spouse': 50000, 'di-ltd:member': 1000, 'li-10yr:member': 100000 }, 'payment-method:li-term': 'bill-me', 'payment-frequency:li-term': 'monthly', 'payment-method:di-ltd': 'bill-me', 'payment-frequency:di-ltd': 'monthly', 'payment-method:li-10yr': 'bank-account' };
  await render();
  expect(capture.validate!(values)).toBeUndefined();
  const ids = [...container.querySelectorAll('[data-field^="payment-method:"]')].map(element => element.getAttribute('data-field'));
  expect(ids).toEqual(['payment-method:di-ltd', 'payment-method:li-term']);
  expect(capture.fields!(values).some(field => field.id.startsWith('bank-'))).toBe(false);
  values = { ...values, coverageSelections: [] };
  await render();
  expect(container.textContent).toContain('No applied-for products were found');
  expect(capture.fields!(values).map(field => field.id)).toEqual(['payment-information-opt-in']);
});

it('does not collect controls for a product whose payment collection is disabled', async () => {
  const library = resolvePrototypeLibrary(db, 'asce', 'synthetic-no-payment');
  const policy = resolveCoverageJourneyPolicy(library.site, 'li-term')!.payment;
  Object.assign(policy, { collection: 'none', methods: [], defaultMethod: null, defaultFrequency: null, frequencyLocked: false, synchronizeAcrossProducts: true });
  installPrototypeLibrary(library);
  values = { ...baseValues, 'payment-method:li-term': 'bank-account' };
  await render();
  expect(capture.validate!(values)).toBeUndefined();
  expect(capture.fields!(values).map(field => field.id)).toEqual(['payment-information-opt-in']);
  expect(container.querySelector('[data-field^="payment-method:"]')).toBeNull();
  expect(container.querySelector('[data-field^="bank-"]')).toBeNull();
});
