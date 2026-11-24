// Effective-Site consent variations; shared dividend/payroll/placement rendering is covered by reviewStories.test.tsx.
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeAll, beforeEach, expect, it, vi } from "vitest";
import { createReviewedMigrationDatabase } from "../migration/fixtures";
import { installPrototypeLibrary, resolvePrototypeLibrary } from "../domain/prototypeLibrary";
import type { DatabaseSchema } from "../persistence/types";
import Review from "./Review";

let values: Record<string, unknown>, root: Root, container: HTMLDivElement, db: DatabaseSchema;
vi.mock("../app/RoutePage", () => ({ default: ({ children }: { children: (props: unknown) => unknown }) => children({ watchedValues: values, allFields: [], errors: {}, control: undefined }) }));
vi.mock("../app/ApplicationSessionContext", () => ({ useApplicationSession: () => ({ reviewSubmitted: false, advisorApplicantFlow: false, setAdvisorApplicantFlow: () => {} }) }));
vi.mock("../app/sections/ConfiguredApplicationDocumentPreview", () => ({ default: () => null }));
vi.mock("../components/forms/FieldRenderer", () => ({ default: ({ field }: { field: { id: string } }) => <span data-field={field.id} /> }));
beforeAll(() => { db = createReviewedMigrationDatabase(); }, 120000);
beforeEach(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  window.history.replaceState(null, "", "/review?site=ama");
  installPrototypeLibrary(resolvePrototypeLibrary(db, "ama", "test:rendered-consent"));
  container = document.createElement("div"); document.body.append(container); root = createRoot(container);
});
afterEach(async () => { await act(async () => root.unmount()); container.remove(); installPrototypeLibrary(null); });

it.each(["physician", "resident", "student", "retired", "spouse"])("renders AMA's correct non-underwritten consent for %s", async membership => {
  const productKey = membership === "spouse" ? "li-term" : "sh-hospital-income", applicant = membership === "spouse" ? "child" : "member";
  values = { membership, state: "PA", coverageSelections: [productKey], productApplicants: { [productKey]: [applicant] } };
  await act(async () => root.render(<MemoryRouter><Review /></MemoryRouter>));
  expect(container.textContent?.includes("I am a physician and")).toBe(membership === "physician");
  expect(container.textContent).toContain("AMA Insurance Agency receives this request");
  expect(container.textContent).not.toContain("date my request is approved");
  expect(container.textContent).not.toContain("AUTHORIZATION:");
  expect(container.textContent).not.toContain("right to require additional information");
  expect(container.textContent).not.toContain("MIB, other insurance companies");
  const attestation = [...container.querySelectorAll("p")].find(element => element.textContent?.startsWith("I HEREBY ATTEST THAT I AM PURCHASING"));
  expect(!!attestation).toBe(membership !== "spouse");
  if (attestation) expect(parseFloat(getComputedStyle(attestation).fontSize)).toBeCloseTo(14 * 96 / 72, 3);
});

it("renders the Connecticut warning immediately before member signature and WAEPA NY notes before Consent", async () => {
  window.history.replaceState(null, "", "/review?site=waepa");
  installPrototypeLibrary(resolvePrototypeLibrary(db, "waepa", "notice-render"));
  values = { membership: "current", state: "CT", "birth-date": "1970-01-01", coverageSelections: ["di-short-term"], productApplicants: { "di-short-term": ["member"] }, coverageAmounts: { "di-short-term:member": 1000 } };
  await act(async () => root.render(<MemoryRouter><Review /></MemoryRouter>));
  const notice = container.querySelector('[data-review-block="connecticut-underwritten-notice"]')!;
  const signature = container.querySelector('[data-field="review-self-consent"]')!;
  expect(notice).toBeDefined(); expect(signature).not.toBeNull();
  expect(notice.compareDocumentPosition(signature) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  values = { membership: "current", state: "NY", "birth-date": "1986-01-01", coverageSelections: ["li-group-term"], productApplicants: { "li-group-term": ["member"] }, coverageAmounts: { "li-group-term:member": 100000 } };
  await act(async () => root.render(<MemoryRouter><Review /></MemoryRouter>));
  expect(container.textContent).not.toContain("REVIEW THE ANSWERS ON THIS APPLICATION CAREFULLY");
  const text = container.textContent!;
  expect(text.indexOf("FRAUD NOTICE")).toBeLessThan(text.indexOf("Receipt of Accelerated Death Benefits"));
  expect(text.indexOf("Receipt of Accelerated Death Benefits")).toBeLessThan(text.indexOf("CONSENT:"));
});

it("uses the Site certification placement and retains two shared legal sections", async () => {
  window.history.replaceState(null, "", "/review?site=waepa-gi");
  installPrototypeLibrary(resolvePrototypeLibrary(db, "waepa-gi", "GI-certification"));
  values = { membership: "yes", state: "PA", "birth-date": "1996-01-01", coverageSelections: ["li-group-term"], productApplicants: { "li-group-term": ["member"] }, coverageAmounts: { "li-group-term:member": 100000 } };
  await act(async () => root.render(<MemoryRouter><Review /></MemoryRouter>));
  const certification = container.querySelector('[data-review-block="guaranteed-issue-certification"]')!;
  expect(certification.textContent).toContain("60 day response window");
  const heading = [...container.querySelectorAll("h6")].find(element => /Read (?:&|and) Sign/i.test(element.textContent ?? ""))!;
  expect(heading).toBeDefined(); expect(certification.closest('[data-legal-review-section]')).toBeNull();
  expect(certification.compareDocumentPosition(heading) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  expect(container.querySelector('[data-field="review-self-consent"]')).not.toBeNull();
  expect(container.querySelectorAll('[data-legal-review-section]')).toHaveLength(2);
});
