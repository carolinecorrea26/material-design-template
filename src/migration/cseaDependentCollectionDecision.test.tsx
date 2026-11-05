import { act } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeAll, expect, it, vi } from "vitest";
import { createReviewedMigrationDatabase } from "./fixtures";
import { recordCseaDependentCollectionDecision } from "./cseaDependentCollectionDecision";
import { installPrototypeLibrary, resolvePrototypeLibrary } from "../domain/prototypeLibrary";
import { getClientPageFields } from "../config/clientFields/getClientPageFields";
import Eligibility from "../pages/Eligibility";
import type { DatabaseSchema } from "../persistence/types";
const form = vi.hoisted(() => ({ values: { membership: "yes", dependents: ["spouse", "child"], "first-name": "Taylor", "last-name": "Morgan", "birth-date": "1986-01-01", "spouse-first-name": "Jordan", "spouse-last-name": "Morgan", "spouse-birth-date": "1988-01-01", "zip-postal-code": "10001", "state-province": "NY" }, setPageValues: vi.fn(), saveApplication: vi.fn() }));
vi.mock("../app/ApplicationFormContext", () => ({ useApplicationForm: () => form }));
vi.mock("../app/ApplicationSessionContext", () => ({ useApplicationSession: () => ({ reviewSubmitted: false, markReviewSubmitted: vi.fn() }) }));
vi.mock("../app/SinglePageFlowContext", () => ({ useSinglePageFlow: () => null }));
let db: DatabaseSchema;
beforeAll(() => { db = createReviewedMigrationDatabase(); }, 120000);
afterEach(() => { installPrototypeLibrary(null); vi.unstubAllGlobals(); });
it("renders standard spouse details and the child note without extra name parts, child records or invented attestation", async () => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true); window.history.replaceState(null, "", "/eligibility?site=csea");
  installPrototypeLibrary(resolvePrototypeLibrary(db, "csea", "standard-collection"));
  const fields = getClientPageFields("eligibility", form.values);
  for (const key of ["spouse-first-name", "spouse-last-name", "spouse-birth-date"]) expect(fields.find(field => field.id === key)?.required).toBe(true);
  const container = document.createElement("div"), root = createRoot(container); document.body.append(container);
  try {
    form.values.dependents = ["spouse", "child"];
    await act(async () => root.render(<MemoryRouter><Eligibility /></MemoryRouter>));
    for (const key of ["spouse-first-name", "spouse-last-name"]) expect(container.querySelector(`[name="${key}"]`)).not.toBeNull();
    expect([...container.querySelectorAll("input")].some(input => input.value === "01/01/1988")).toBe(true);
    for (const key of ["spouse-title", "spouse-middle-initial", "spouse-suffix"]) expect(container.querySelector(`[name="${key}"]`)).toBeNull();
    expect(container.textContent).toContain("Child must be under age 19");
    expect(container.textContent).not.toContain("Add Child"); expect(container.querySelector('[name^="children."]')).toBeNull();
    expect(container.querySelector('[name="child-age-attestation"]')).toBeNull();
    form.values.dependents = [];
    await act(async () => root.render(<MemoryRouter><Eligibility key="no-dependents" /></MemoryRouter>));
    expect(container.querySelector('[name="spouse-first-name"]')).toBeNull(); expect(container.textContent).not.toContain("Child must be under age 19");
  } finally { await act(async () => root.unmount()); container.remove(); form.values.dependents = ["spouse", "child"]; }
  const repeated = structuredClone(db); recordCseaDependentCollectionDecision(repeated); expect(repeated).toEqual(db);
});
