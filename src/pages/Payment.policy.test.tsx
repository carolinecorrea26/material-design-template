import { act, useEffect } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeAll, beforeEach, expect, it, vi } from "vitest";
import Payment from "./Payment";
import { createReviewedMigrationDatabase } from "../migration/fixtures";
import { atpeAssociationKey } from "../migration/atpeAssociationAdoption";
import { recordIsitrustPaymentDecision, isitrustPaymentDecisionKey } from "../migration/isitrustPaymentDecision";
import { installPrototypeLibrary, resolvePrototypeLibrary } from "../domain/prototypeLibrary";
import { resolveCoverageJourneyPolicy } from "../domain/coverageJourneyPolicy";
import { paymentSelectionAllowed } from "../domain/paymentPolicy";
import { currentMcrSource } from "../migration/currentMcr";
import { getClientPageRequirement } from "../config/client/getClientPageRequirement";
import { storedApplicationPageRows } from "./admin/library/storedLibraryModel";
import { mockRequest } from "../mock/client";
import type { DatabaseSchema } from "../persistence/types";
import type { FieldDefinition } from "../config/fields/types";

let values: Record<string, unknown>, root: Root, container: HTMLDivElement, db: DatabaseSchema;
const capture: { validate?: (values: Record<string, unknown>) => string | undefined; fields?: (values: Record<string, unknown>) => FieldDefinition[]; beforeNext?: (props: { values: Record<string, unknown>; continueNavigation: () => void }) => boolean } = {};
vi.mock("../mock/client", () => ({ mockRequest: vi.fn() }));
vi.mock("../app/ApplicationFormContext", async original => ({ ...await original<typeof import("../app/ApplicationFormContext")>(), useApplicationForm: () => ({ values, setPageValues: () => {}, requiresRevalidation: false }) }));
vi.mock("../app/RoutePage", () => ({ default: function Route({ children, validate, devFillFields, onBeforeNext }: { children: (props: unknown) => unknown; validate: typeof capture.validate; devFillFields: typeof capture.fields; onBeforeNext: typeof capture.beforeNext }) {
  useEffect(() => { capture.validate = validate; capture.fields = devFillFields; capture.beforeNext = onBeforeNext; });
  return children({ watchedValues: values, errors: {}, control: undefined, setValue: () => {} });
} }));
vi.mock("../components/forms/FieldRenderer", () => ({ default: ({ field }: { field: FieldDefinition }) => <output data-field={field.id}>{field.options?.map(option => option.label).join("|")}</output> }));
vi.mock("../app/usePrototypeRates", () => ({ usePrototypeRates: () => ({ enabled: true, premium: () => NaN, display: () => ({ status: "needs-information" }) }) }));
beforeAll(() => { db = createReviewedMigrationDatabase(); }, 120000);
beforeEach(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  window.history.replaceState(null, "", "/payment?site=isitrust");
  installPrototypeLibrary(resolvePrototypeLibrary(db, "isitrust", "reviewed-payment"));
  container = document.createElement("div"); document.body.append(container); root = createRoot(container);
});
afterEach(async () => { await act(async () => root.unmount()); container.remove(); installPrototypeLibrary(null); vi.unstubAllEnvs(); vi.clearAllMocks(); });

it("matches MCR optional ABE payment in saved assignments, the Library and applicant behavior", async () => {
  const source = (ref: string) => currentMcrSource.cells.find(cell => cell.sheet === "New UX Multi-page Requirements" && cell.cell === ref)?.value;
  expect(source("A51")).toBe("ABE");
  expect(source("AS51")).toBe("Y");
  expect(source("AT51")).toBe("Y- Keep standard footnote ");
  window.history.replaceState(null, "", "/payment?site=abe");
  const library = resolvePrototypeLibrary(db, "abe", "optional-payment"); installPrototypeLibrary(library);
  expect(getClientPageRequirement("beneficiary")).toBe("optional");
  expect(getClientPageRequirement("payment")).toBe("optional");
  expect(storedApplicationPageRows({ data: db, revision: "test", analyticsTags: [] }, "abe").find(page => page.key === "payment")?.requirement).toBe("optional");
  for (const product of library.products) expect(resolveCoverageJourneyPolicy(library.site, product.id)?.payment.collection).toBe("optional");
  values = { coverageSelections: ["li-term"], productApplicants: { "li-term": ["member"] }, coverageAmounts: { "li-term:member": 50000 }, "payment-information-opt-in": "no" };
  await act(async () => root.render(<MemoryRouter><Payment /></MemoryRouter>));
  expect(container.querySelector('[data-field="payment-information-opt-in"]')).not.toBeNull();
  expect(container.querySelector('[data-field^="payment-method:"]')).toBeNull();
  expect(container.textContent).toContain("Quoted cost is the best rate available");
  expect(capture.validate!(values)).toBeUndefined();
  expect(capture.validate!({ ...values, "payment-information-opt-in": "yes" })).toBeDefined();
  expect(capture.fields!(values).map(field => field.id)).toEqual(["payment-information-opt-in"]);
  vi.stubEnv("VITE_MOCK_PLATFORM_ENABLED", "true");
  vi.mocked(mockRequest).mockResolvedValue({ submissionId: "MOCK-optional-payment" });
  await act(async () => root.render(<MemoryRouter><Payment /></MemoryRouter>));
  expect(container.textContent).not.toContain("Authorize payment");
  const next = vi.fn();
  await act(async () => { capture.beforeNext!({ values, continueNavigation: next }); });
  expect(mockRequest).toHaveBeenCalledExactlyOnceWith("/applications/submit", expect.objectContaining({ siteKey: "abe", paymentDeferred: true, paymentIds: [], entries: [{ productKey: "li-term", applicant: "member", amount: 50000 }] }));
  expect(next).toHaveBeenCalledOnce();
});

it.each([atpeAssociationKey, "akron-bar-association"])("retains the method choice and monthly Bill me without bank fields for %s", async membership => {
  values = { membership, coverageSelections: ["li-group-term"], productApplicants: { "li-group-term": ["member"] }, coverageAmounts: { "li-group-term:member": 50000 }, "payment-method:li-group-term": "bill-me", "payment-frequency:li-group-term": "monthly" };
  await act(async () => root.render(<MemoryRouter><Payment /></MemoryRouter>));
  expect(capture.validate!(values)).toBeUndefined();
  expect(capture.validate!({ ...values, "payment-method:li-group-term": undefined })).toBeDefined();
  expect(capture.validate!({ ...values, "payment-frequency:li-group-term": "annually" })).toBeDefined();
  expect(capture.fields!(values).some(field => field.id.startsWith("bank-"))).toBe(false);
  expect(container.querySelector('[data-field="payment-method:li-group-term"]')?.textContent).toContain("Bill me");
  expect(container.querySelector('[data-field^="bank-"]')).toBeNull();
  const bank = { ...values, "payment-method:li-group-term": "bank-account" };
  expect(capture.fields!(bank).some(field => field.id.startsWith("bank-"))).toBe(true);
  values = bank;
  await act(async () => root.render(<MemoryRouter><Payment /></MemoryRouter>));
  expect(container.querySelector('[data-field^="bank-"]')).not.toBeNull();
});

it("records all ten native product payment owners idempotently and retains only monthly ACH or Bill me", () => {
  const library = resolvePrototypeLibrary(db, "isitrust", "payment-owner-review");
  for (const product of library.products) {
    const policy = resolveCoverageJourneyPolicy(library.site, product.id)!.payment;
    expect(policy.collection).toBe("required");
    for (const method of ["bank-account", "bill-me"] as const) expect(paymentSelectionAllowed(policy, method, "monthly")).toBe(true);
    expect(paymentSelectionAllowed(policy, "bill-me", "annual")).toBe(false);
    expect(paymentSelectionAllowed(policy, "credit-card", "monthly")).toBe(false);
  }
  const copy = structuredClone(db); recordIsitrustPaymentDecision(copy); expect(copy).toEqual(db);
  expect(db.semanticRequirements.find(row => row.key === isitrustPaymentDecisionKey)?.value).toMatchObject({ approvalStatus: "approved", selected: expect.arrayContaining([expect.objectContaining({ key: "isitrust.li-group-term.journey-policy" })]) });
});
