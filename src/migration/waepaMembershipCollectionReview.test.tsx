import { act } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { afterAll, afterEach, beforeAll, expect, it, vi } from "vitest";
import { createReviewedMigrationDatabase } from "./fixtures";
import { applyWaepaMembershipCollectionReview } from "./waepaMembershipCollectionReview";
import { installPrototypeLibrary, resolvePrototypeLibrary } from "../domain/prototypeLibrary";
import { getClientPageFields } from "../config/clientFields/getClientPageFields";
import { waepaQualifications } from "../domain/membershipQualifications";
import { fieldValidationChecks } from "../utils/fieldValidation";
import Membership from "../pages/Membership";
import type { DatabaseSchema } from "../persistence/types";
const form = vi.hoisted(() => ({ values: { membership: "new", "waepa-attestation": "former-federal", "first-name": "Taylor", "last-name": "Morgan", email: "taylor@example.invalid", phone: "2025550123", "active-military": "no", "waepa-declaration": false }, setPageValues: vi.fn(), saveApplication: vi.fn() }));
vi.mock("../app/ApplicationFormContext", () => ({ useApplicationForm: () => form }));
vi.mock("../app/ApplicationSessionContext", () => ({ useApplicationSession: () => ({ reviewSubmitted: false, markReviewSubmitted: vi.fn() }) }));
vi.mock("../app/SinglePageFlowContext", () => ({ useSinglePageFlow: () => ({ pageId: "membership", navigationPending: false, setNavigationPending: vi.fn(), completeSection: vi.fn(), goToSection: vi.fn() }) }));
let db: DatabaseSchema;
const originalScrollIntoView = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "scrollIntoView");
beforeAll(() => Object.defineProperty(HTMLElement.prototype, "scrollIntoView", { configurable: true, value: vi.fn() }));
afterAll(() => {
  if (originalScrollIntoView) Object.defineProperty(HTMLElement.prototype, "scrollIntoView", originalScrollIntoView);
  else Reflect.deleteProperty(HTMLElement.prototype, "scrollIntoView");
});
beforeAll(() => { db = createReviewedMigrationDatabase(); }, 120000);
afterEach(() => { installPrototypeLibrary(null); vi.unstubAllGlobals(); });
it("preserves the required New Member declaration, six choices, guarded employee follow-ups and optional member number", () => {
  installPrototypeLibrary(resolvePrototypeLibrary(db, "waepa", "new-member-collection")); window.history.replaceState(null, "", "/membership?site=waepa");
  for (const qualification of ["", ...waepaQualifications.map(row => row.value)]) {
    const fields = getClientPageFields("membership", { membership: "new", "waepa-attestation": qualification });
    const declaration = fields.find(row => row.id === "waepa-declaration")!;
    expect(declaration).toMatchObject({ required: true, inputType: "checkbox" });
    expect(fieldValidationChecks(declaration).every(check => check.validate(false))).toBe(false);
    expect(fieldValidationChecks(declaration).every(check => check.validate(true))).toBe(true);
    expect(fields.find(row => row.id === "waepa-attestation")?.options).toEqual(waepaQualifications);
    expect(fields.some(row => row.id === "waepa-employer")).toBe(qualification === "federal-active");
    expect(fields.some(row => row.id === "waepa-start-date")).toBe(qualification === "federal-active");
    if (qualification === "federal-active") expect(fields.find(row => row.id === "waepa-employer")).toMatchObject({ required: true, inputType: "searchable-select" });
    expect(fields.some(row => ["waepa-retired-employer", "waepa-retirement-date"].includes(row.id))).toBe(false);
    expect(fields.find(row => row.id === "waepa-member-id")?.required).not.toBe(true);
  }
  for (const stale of ["federal-active", "spouse-associate", "former-federal"]) {
    const fields = getClientPageFields("membership", { membership: "current", "waepa-attestation": stale });
    expect(fields.some(row => ["waepa-attestation", "waepa-declaration", "waepa-employer", "waepa-start-date", "waepa-member-first-name"].includes(row.id))).toBe(false);
    expect(fields.some(row => row.id === "active-military")).toBe(true);
  }
  const repeated = structuredClone(db); applyWaepaMembershipCollectionReview(repeated); expect(repeated).toEqual(db);
});
it("renders the source membership explanation for new members and validates the established checkbox", async () => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true); window.history.replaceState(null, "", "/membership?site=waepa");
  installPrototypeLibrary(resolvePrototypeLibrary(db, "waepa", "render"));
  const note = "Applying for coverage will make you a WAEPA member. Please provide the following information to complete your membership.";
  const container = document.createElement("div"), root = createRoot(container); document.body.append(container);
  try {
    form.values.membership = "new";
    await act(async () => root.render(<MemoryRouter><Membership /></MemoryRouter>));
    expect(container.textContent).toContain(note); expect(container.textContent).toContain("Additional Membership Information");
    const label = [...container.querySelectorAll(".SelectionGroup-label")].find(node => node.textContent?.startsWith("By submitting this application"));
    expect(label?.parentElement?.querySelector('input[type="checkbox"]')).not.toBeNull();
    await act(async () => container.querySelector<HTMLButtonElement>('button[type="submit"]')!.click());
    expect(container.textContent).toContain("By submitting this application, I attest that the answers to the questions herein are true. is required.");
    form.values.membership = "current";
    await act(async () => root.render(<MemoryRouter><Membership key="current" /></MemoryRouter>));
    expect(container.textContent).not.toContain(note); expect(container.textContent).not.toContain("By submitting this application");
  } finally { await act(async () => root.unmount()); container.remove(); form.values.membership = "new"; }
});
