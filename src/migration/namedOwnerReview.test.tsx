import { act } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeAll, expect, it, vi } from "vitest";
import { createReviewedMigrationDatabase } from "./fixtures";
import { installPrototypeLibrary, resolvePrototypeLibrary } from "../domain/prototypeLibrary";
import { getClientPageFields } from "../config/clientFields/getClientPageFields";
import { getAssociationsForSite, resolveActiveAssociation } from "../data";
import { namedOwnerReviewHash, reviewNamedOwnerRequirements, reviewedNamedOwnerCodeMatches } from "./requirementCrosswalkOwnerReview";
import { reviewAcceptedAbeDividendRequirements } from "./requirementCrosswalkAbeReview";
import type { CrosswalkRow } from "./requirementCrosswalk";
import type { DatabaseSchema } from "../persistence/types";
import Membership from "../pages/Membership";
import Eligibility from "../pages/Eligibility";

const form = vi.hoisted(() => ({ values: {} as Record<string, unknown>, setPageValues: vi.fn(), setActiveAssociationId: vi.fn(), saveApplication: vi.fn() }));
vi.mock("../app/ApplicationFormContext", async original => ({ ...await original<typeof import("../app/ApplicationFormContext")>(), useApplicationForm: () => form }));
vi.mock("../app/ApplicationSessionContext", () => ({ useApplicationSession: () => ({ reviewSubmitted: false, markReviewSubmitted: vi.fn() }) }));
vi.mock("../app/SinglePageFlowContext", () => ({ useSinglePageFlow: () => ({ pageId: "membership", navigationPending: false, setNavigationPending: vi.fn(), completeSection: vi.fn(), goToSection: vi.fn() }) }));
let db: DatabaseSchema;
beforeAll(() => { db = createReviewedMigrationDatabase(); }, 120000);
afterEach(() => { installPrototypeLibrary(null); window.sessionStorage.clear(); vi.unstubAllGlobals(); });

it("renders the stored Association selection and resolves only enabled Site options", async () => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true); window.history.replaceState(null, "", "/membership?site=isitrust");
  installPrototypeLibrary(resolvePrototypeLibrary(db, "isitrust", "named-owner-review"));
  const associations = getAssociationsForSite("isitrust");
  const field = getClientPageFields("membership").find(field => field.id === "membership")!;
  expect(field.required).toBe(true); expect(field.inputType).toBe("searchable-select");
  expect(field.options).toEqual(associations.map(association => ({ value: association.id, label: association.name })));
  expect(field.options).toHaveLength(26);
  expect(resolveActiveAssociation("isitrust", { selectedAssociationId: "not-assigned" }).status).toBe("invalid");
  form.values = { membership: associations[0].id, "first-name": "Taylor", "last-name": "Morgan", email: "taylor@example.invalid" };
  const container = document.createElement("div"), root = createRoot(container); document.body.append(container);
  try {
    await act(async () => root.render(<MemoryRouter><Membership /></MemoryRouter>));
    const input = container.querySelector<HTMLInputElement>('input[name="membership"]')!;
    expect(input.required).toBe(true); expect(input.value).toBe(associations[0].name);
    await act(async () => container.querySelector<HTMLButtonElement>('[title="Open"]')!.click());
    const atpe = [...document.querySelectorAll<HTMLElement>('[role="option"]')].find(option => option.textContent === "Association of Texas Professional Educators")!;
    expect(atpe).toBeDefined(); await act(async () => atpe.click());
    expect(form.setActiveAssociationId).toHaveBeenLastCalledWith("association-of-texas-professional-educators");
    expect(input.value).toBe("Association of Texas Professional Educators");
  } finally { await act(async () => root.unmount()); container.remove(); }
  const changed = structuredClone(db);
  changed.siteAssociations.find(row => row.siteKey === "isitrust" && row.associationKey === associations[0].id)!.enabled = false;
  installPrototypeLibrary(resolvePrototypeLibrary(changed, "isitrust", "disabled-option"));
  expect(getClientPageFields("membership").find(field => field.id === "membership")!.options?.some(option => option.value === associations[0].id)).toBe(false);
  expect(resolveActiveAssociation("isitrust", { selectedAssociationId: associations[0].id }).status).toBe("invalid");
});

it.each(["di-step-rated", "di-level-rated"])("suppresses the AMA notice with spouse details visible for %s and responds to assigned content", async product => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true); window.history.replaceState(null, "", "/eligibility?site=ama");
  installPrototypeLibrary(resolvePrototypeLibrary(db, "ama", "notice-absence"));
  form.values = { membership: "physician", dependents: ["spouse"], coverageSelections: [product], "spouse-first-name": "Alex", "spouse-last-name": "Morgan" };
  const container = document.createElement("div"), root = createRoot(container); document.body.append(container);
  try {
    await act(async () => root.render(<MemoryRouter><Eligibility /></MemoryRouter>));
    expect(container.querySelector('input[name="spouse-first-name"]')).not.toBeNull();
    expect(container.textContent).not.toMatch(/domestic partner|civil union/i);
    const changed = structuredClone(db);
    const content = changed.contentValues.find(row => row.key === "site:isitrust.pages.eligibility.sectionNotes.spouseSection")!;
    changed.contentValues.push({ ...content, id: "test-ama-notice", key: "test-ama-notice", siteKey: "ama", value: "Domestic partner/Civil Union positive control" });
    installPrototypeLibrary(resolvePrototypeLibrary(changed, "ama", "notice-positive-control"));
    await act(async () => root.render(<MemoryRouter><Eligibility key="notice" /></MemoryRouter>));
    expect(container.textContent).toContain("Domestic partner/Civil Union positive control");
  } finally { await act(async () => root.unmount()); container.remove(); }
});

it("reopens named reviews on option, selection, requiredness and effective notice edits", () => {
  expect(reviewedNamedOwnerCodeMatches()).toBe(true);
  expect(reviewedNamedOwnerCodeMatches(() => Buffer.from("changed"))).toBe(false);
  const makeRows = () => ["atomic.attestation.isitrust.association-selector", "atomic.ama.di-step-rated.domestic-partner-notice-online", "atomic.ama.di-level-rated.domestic-partner-notice-online"].map(id => ({ id, scope: { unresolved: [] } }) as unknown as CrosswalkRow);
  const rows = makeRows(); reviewNamedOwnerRequirements(db, rows);
  expect(rows.every(row => row.verificationStatus === "recorded-evidence")).toBe(true);
  for (const mutation of [
    (copy: DatabaseSchema) => { copy.sitePolicies.find(row => row.siteKey === "isitrust")!.definition.associationSelection = { mode: "fixed", fixedAssociationId: "akron-bar-association" }; },
    (copy: DatabaseSchema) => { copy.associations.find(row => row.key === "akron-bar-association")!.definition.name = "Changed"; },
    (copy: DatabaseSchema) => { copy.siteFieldConfigurations.find(row => row.key === "site:isitrust.membership.membership.override")!.values.required = false; },
    (copy: DatabaseSchema) => { const content = copy.contentValues.find(row => row.key === "site:isitrust.pages.eligibility.sectionNotes.spouseSection")!; copy.contentValues.push({ ...content, id: "notice", key: "notice", siteKey: "ama", value: "Domestic partner/Civil Union" }); },
  ]) {
    const copy = structuredClone(db); mutation(copy);
    const edited = makeRows(); reviewNamedOwnerRequirements(copy, edited);
    expect(edited.some(row => row.verificationStatus === "not-verified")).toBe(true);
  }
  expect(namedOwnerReviewHash(db, "association")).toMatch(/^[a-f0-9]{64}$/);
});

it("links ABE's unique dividend capability to its accepted policy and reopens edited field assignments", () => {
  const makeRow = () => ({ id: "atomic.unique-dividend-notice", kind: "source-requirement", sourceReferences: ["Legal Disclosures!A10"], scope: { unresolved: [] } }) as unknown as CrosswalkRow;
  const row = makeRow(); reviewAcceptedAbeDividendRequirements(db, [row]);
  expect(row.verificationStatus).toBe("recorded-evidence");
  expect(row.executionOwners).toContainEqual(expect.objectContaining({ table: "configurationValues", key: "abe.review-policy" }));
  expect(row.executionOwners.some(owner => owner.table === "fields" && owner.key === "dividend-acknowledgement")).toBe(true);
  const changed = structuredClone(db);
  changed.fields.find(row => row.key === "dividend-acknowledgement")!.definition.required = false;
  const edited = makeRow(); reviewAcceptedAbeDividendRequirements(changed, [edited]); expect(edited.verificationStatus).toBe("not-verified");
});
