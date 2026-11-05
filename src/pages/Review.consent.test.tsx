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
  const notice = [...container.querySelectorAll("p")].find(element => element.textContent?.startsWith("REVIEW THE ANSWERS ON THIS APPLICATION CAREFULLY"))!;
  const signature = container.querySelector('[data-field="review-self-consent"]')!;
  expect(notice).toBeDefined(); expect(signature).not.toBeNull();
  expect(notice.compareDocumentPosition(signature) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  values = { membership: "current", state: "NY", "birth-date": "1986-01-01", coverageSelections: ["li-group-term"], productApplicants: { "li-group-term": ["member"] }, coverageAmounts: { "li-group-term:member": 100000 } };
  await act(async () => root.render(<MemoryRouter><Review /></MemoryRouter>));
  expect(container.textContent).not.toContain("REVIEW THE ANSWERS ON THIS APPLICATION CAREFULLY");
  const war = [...container.querySelectorAll("strong")].find(element => element.textContent?.startsWith("NOTICE FOR NEW YORK RESIDENTS, THE POLICY CONTAINS A WAR RESTRICTION"))!;
  expect(war).toBeDefined(); expect(getComputedStyle(war).fontWeight).toBe("700");
  const text = container.textContent!;
  expect(text.indexOf("FRAUD NOTICE")).toBeLessThan(text.indexOf("Receipt of Accelerated Death Benefits"));
  expect(text.indexOf("Receipt of Accelerated Death Benefits")).toBeLessThan(text.indexOf("CONSENT:"));
});

it("preserves accepted ABE dividend blocks and identity fields in new and change flows", async () => {
  window.history.replaceState(null, "", "/review?site=abe");
  installPrototypeLibrary(resolvePrototypeLibrary(db, "abe", "accepted-Review"));
  for (const mode of ["new", "increase"]) {
    values = { state: "PA", "birth-date": "1986-01-01", coverageSelections: ["li-term"], productApplicants: { "li-term": ["member"] }, coverageAmounts: { "li-term:member": 50000 }, coverageModes: { "li-term": mode } };
    await act(async () => root.render(<MemoryRouter><Review /></MemoryRouter>));
    for (const id of ["dividend-acknowledgement", "dividend-first-name", "dividend-last-name", "dividend-birth-date"]) expect(container.querySelector(`[data-field="${id}"]`), `${mode}/${id}`).not.toBeNull();
    expect(container.querySelector('[data-field="dividend-opt-out"]')).toBeNull();
    expect(container.textContent).toContain("Dividend notice and first-year election");
  }
});

it("appends ABE's CI attestation inside the existing Read and Sign content without a separate question", async () => {
  window.history.replaceState(null, "", "/review?site=abe");
  installPrototypeLibrary(resolvePrototypeLibrary(db, "abe", "inline-ci-notice"));
  for (const applicant of ["member", "spouse"]) {
    values = { state: "PA", "birth-date": "1986-01-01", coverageSelections: ["sh-critical-illness"], productApplicants: { "sh-critical-illness": [applicant] }, coverageAmounts: { [`sh-critical-illness:${applicant}`]: 5000 } };
    await act(async () => root.render(<MemoryRouter><Review /></MemoryRouter>));
    const note = container.querySelector('[data-review-block="supplemental-health-attestation"]')!;
    const heading = [...container.querySelectorAll("h6")].find(element => /Read (?:&|and) Sign/i.test(element.textContent ?? ""))!;
    expect(note).not.toBeNull();
    expect(note.parentElement).toBe(heading.nextElementSibling);
    expect(note.parentElement?.textContent).toContain("CONSENT:");
    expect(note.parentElement!.contains(note)).toBe(true);
    expect(note.textContent).toContain("I HEREBY ATTEST THAT I AM PURCHASING THIS POLICY");
    expect(parseFloat(getComputedStyle(note.querySelector("p")!).fontSize)).toBeCloseTo(14 * 96 / 72, 3);
    expect(note.querySelector("input")).toBeNull();
    expect(container.querySelectorAll("[data-legal-review-section]")).toHaveLength(2);
    for (const block of container.querySelectorAll("[data-review-block]")) expect(block.closest('[data-legal-review-section="read-and-sign"]')).not.toBeNull();
    expect(container.querySelectorAll('[data-review-block="supplemental-health-attestation"]')).toHaveLength(1);
  }
  values = { ...values, coverageSelections: ["sh-hospital-money"], productApplicants: { "sh-hospital-money": ["member"] } };
  await act(async () => root.render(<MemoryRouter><Review /></MemoryRouter>));
  expect(container.querySelector('[data-review-block="supplemental-health-attestation"]')).not.toBeNull();
});

it("keeps GI certification and CSEA payroll inside Read and Sign with only two legal sections", async () => {
  window.history.replaceState(null, "", "/review?site=waepa-gi");
  installPrototypeLibrary(resolvePrototypeLibrary(db, "waepa-gi", "GI-certification"));
  values = { membership: "yes", state: "PA", "birth-date": "1996-01-01", coverageSelections: ["li-group-term"], productApplicants: { "li-group-term": ["member"] }, coverageAmounts: { "li-group-term:member": 100000 } };
  await act(async () => root.render(<MemoryRouter><Review /></MemoryRouter>));
  const certification = container.querySelector('[data-review-block="guaranteed-issue-certification"]')!;
  expect(certification.textContent).toContain("60 day response window");
  const heading = [...container.querySelectorAll("h6")].find(element => /Read (?:&|and) Sign/i.test(element.textContent ?? ""))!;
  expect(heading).toBeDefined(); expect(certification.parentElement).toBe(heading.nextElementSibling);
  expect(container.querySelector('[data-field="review-self-consent"]')).not.toBeNull();
  window.history.replaceState(null, "", "/review?site=csea"); installPrototypeLibrary(resolvePrototypeLibrary(db, "csea", "payroll"));
  values = { membership: "yes", state: "NY", "birth-date": "1986-01-01", coverageSelections: ["di-ltd"], productApplicants: { "di-ltd": ["member"] }, coverageAmounts: { "di-ltd:member": 1000 } };
  await act(async () => root.render(<MemoryRouter><Review /></MemoryRouter>));
  const payroll = container.querySelector('[data-review-block="csea-disability-payroll-authorization"]')!;
  const electronicCopy = [...container.querySelectorAll("span")].find(element => element.textContent?.startsWith("By consenting")) ?? [...container.querySelectorAll("h6")].find(element => /Electronic Consent/i.test(element.textContent ?? ""));
  expect(payroll.textContent).toContain("TO THE FISCAL OFFICER OF MY EMPLOYER:"); expect(electronicCopy).toBeDefined();
  expect(payroll.compareDocumentPosition(electronicCopy!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  expect(payroll.compareDocumentPosition(container.querySelector('[data-field="review-self-consent"]')!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  values = { ...values, coverageSelections: ["li-add"], productApplicants: { "li-add": ["member"] }, coverageAmounts: { "li-add:member": 100000 } };
  await act(async () => root.render(<MemoryRouter><Review /></MemoryRouter>)); expect(container.querySelector('[data-review-block="csea-disability-payroll-authorization"]')).toBeNull();
});

it("renders medical authorization and underwritten consent for 50+ Life without an online health page", async () => {
  window.history.replaceState(null, "", "/review?site=abe");
  const library = resolvePrototypeLibrary(db, "abe", "50plus-authorization"); installPrototypeLibrary(library);
  values = { membership: "yes", state: "AL", "birth-date": "1960-01-01", coverageSelections: ["li-50plus"], productApplicants: { "li-50plus": ["member"] }, coverageAmounts: { "li-50plus:member": 25000 } };
  await act(async () => root.render(<MemoryRouter><Review /></MemoryRouter>));
  const readAndSign = container.querySelector('[data-legal-review-section="read-and-sign"]')!;
  expect(readAndSign.textContent).toContain(library.client.reviewPolicy!.authorization!.wording!.defaultText);
  expect(readAndSign.textContent).toContain(library.client.reviewPolicy!.consent!.underwrittenText);
  expect(readAndSign.textContent).toContain("right to require additional information");
  expect(readAndSign.textContent!.match(/AUTHORIZATION:/g)).toHaveLength(1);
  expect(container.querySelectorAll('[data-legal-review-section]')).toHaveLength(2);
});
