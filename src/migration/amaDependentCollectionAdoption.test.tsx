import { act } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeAll, expect, it, vi } from "vitest";
import { createReviewedMigrationDatabase } from "./fixtures";
import { applyAmaDependentCollectionAdoption } from "./amaDependentCollectionAdoption";
import { installPrototypeLibrary, resolvePrototypeLibrary } from "../domain/prototypeLibrary";
import { getClientPageFields } from "../config/clientFields/getClientPageFields";
import type { DatabaseSchema } from "../persistence/types";
import Eligibility from "../pages/Eligibility";
import Membership from "../pages/Membership";
const form = vi.hoisted(() => ({ values: { membership: "physician", "first-name": "Taylor", "last-name": "Morgan", email: "taylor@example.invalid", phone: "2025550123", "zip-postal-code": "19019", "state-province": "PA", "birth-date": "1986-01-01" }, setPageValues: vi.fn(), saveApplication: vi.fn() }));
vi.mock("../app/ApplicationFormContext", () => ({ useApplicationForm: () => form }));
vi.mock("../app/ApplicationSessionContext", () => ({ useApplicationSession: () => ({ reviewSubmitted: false, markReviewSubmitted: vi.fn() }) }));
vi.mock("../app/SinglePageFlowContext", () => ({ useSinglePageFlow: () => ({ pageId: "membership", navigationPending: false, setNavigationPending: vi.fn(), completeSection: vi.fn(), goToSection: vi.fn() }) }));
let db: DatabaseSchema;
beforeAll(() => { db = createReviewedMigrationDatabase(); }, 120000);
afterEach(() => { installPrototypeLibrary(null); vi.unstubAllGlobals(); });
it("assigns source spouse wording and optional role choices without duplicating legacy questions or changing other Sites", () => {
  const library = resolvePrototypeLibrary(db, "ama", "dependent-source"); installPrototypeLibrary(library); window.history.replaceState(null, "", "/eligibility?site=ama");
  for (const role of ["physician", "resident", "student", "retired", "spouse"]) {
    const field = getClientPageFields("eligibility", { membership: role }).find(field => field.id === "dependents")!;
    expect(field.required).not.toBe(true);
    expect(field.options?.map(option => option.value)).toEqual(role === "spouse" ? ["child"] : ["spouse", "child"]);
    if (role !== "spouse") expect(field.options?.[0].label).toBe("Spouse Coverage (Premier Accident or Hospital Income)");
    const physicianFields = getClientPageFields("membership", { membership: role }).filter(field => field.id.startsWith("ama-physician-"));
    expect(physicianFields.length > 0).toBe(role === "spouse");
  }
  for (const membership of [undefined, "", "invalid"]) expect(getClientPageFields("eligibility", membership === undefined ? {} : { membership }).some(field => field.id === "dependents")).toBe(false);
  const repeated = structuredClone(db); applyAmaDependentCollectionAdoption(repeated); expect(repeated).toEqual(db);
  for (const site of ["abe", "asce", "avma"]) { installPrototypeLibrary(resolvePrototypeLibrary(db, site, "other")); window.history.replaceState(null, "", `/eligibility?site=${site}`); expect(getClientPageFields("eligibility", { membership: "yes" }).find(field => field.id === "dependents")?.options?.[0].label).toBe("Spouse"); }
});
it("renders scoped dependent wording and About Physician collection for spouse applicants", async () => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true); window.history.replaceState(null, "", "/eligibility?site=ama");
  installPrototypeLibrary(resolvePrototypeLibrary(db, "ama", "render"));
  const container = document.createElement("div"), root = createRoot(container); document.body.append(container);
  try {
    form.values.membership = "physician";
    await act(async () => root.render(<MemoryRouter><Eligibility /></MemoryRouter>));
    expect(container.textContent).toContain("Spouse Coverage (Premier Accident or Hospital Income)");
    expect(container.textContent).not.toContain("This insurance is for");
    form.values.membership = "spouse";
    await act(async () => root.render(<MemoryRouter><Membership /></MemoryRouter>));
    expect(container.textContent).toContain("Physician Information");
    for (const key of ["ama-physician-first-name", "ama-physician-last-name", "ama-physician-email"]) expect(container.querySelector(`[name="${key}"]`)).not.toBeNull();
    form.values.membership = "resident";
    await act(async () => root.render(<MemoryRouter><Membership key="resident" /></MemoryRouter>));
    expect(container.textContent).not.toContain("Physician Information");
  } finally { await act(async () => root.unmount()); container.remove(); form.values.membership = "physician"; }
});
