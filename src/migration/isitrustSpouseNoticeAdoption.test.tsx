import { act } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeAll, expect, it, vi } from "vitest";
import { createReviewedMigrationDatabase } from "./fixtures";
import { applyIsitrustSpouseNoticeAdoption } from "./isitrustSpouseNoticeAdoption";
import { installPrototypeLibrary, resolvePrototypeLibrary } from "../domain/prototypeLibrary";
import { getClientPageFields } from "../config/clientFields/getClientPageFields";
import { getPageSectionNote } from "../config/pages";
import type { DatabaseSchema } from "../persistence/types";
import Eligibility from "../pages/Eligibility";
const form = vi.hoisted(() => ({ values: { membership: "akron-bar-association", "active-military": "no", dependents: ["spouse"], "spouse-membership": "no", "first-name": "Taylor", "last-name": "Morgan", "spouse-first-name": "Jordan", "spouse-last-name": "Morgan", "birth-date": "1986-01-01", "spouse-birth-date": "1986-01-01", "zip-postal-code": "19019", "state-province": "PA" }, setPageValues: vi.fn(), saveApplication: vi.fn() }));
vi.mock("../app/ApplicationFormContext", () => ({ useApplicationForm: () => form }));
vi.mock("../app/ApplicationSessionContext", () => ({ useApplicationSession: () => ({ reviewSubmitted: false, markReviewSubmitted: vi.fn() }) }));
vi.mock("../app/SinglePageFlowContext", () => ({ useSinglePageFlow: () => null }));
let db: DatabaseSchema;
beforeAll(() => { db = createReviewedMigrationDatabase(); }, 120000);
afterEach(() => { installPrototypeLibrary(null); vi.unstubAllGlobals(); });

it("replaces ISITRUST spouse attestation with captured source notice, preserving other Sites and snapshots", async () => {
  const original = resolvePrototypeLibrary(db, "isitrust", "spouse-source"), copy = structuredClone(db);
  applyIsitrustSpouseNoticeAdoption(copy); expect(copy).toEqual(db);
  installPrototypeLibrary(original); window.history.replaceState(null, "", "/?site=isitrust");
  expect(getClientPageFields("eligibility", form.values).some(field => field.id === "spouse-membership")).toBe(false);
  const note = getPageSectionNote("eligibility", "spouseSection")!;
  expect(note).toContain("as a Spouse or Member but not both");
  copy.contentValues.find(row => row.key === "site:isitrust.pages.eligibility.sectionNotes.spouseSection")!.value = "Captured notice edit";
  installPrototypeLibrary(resolvePrototypeLibrary(copy, "isitrust", "edited"));
  expect(getPageSectionNote("eligibility", "spouseSection")).toBe("Captured notice edit");
  installPrototypeLibrary(original); expect(getPageSectionNote("eligibility", "spouseSection")).toBe(note);
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  const container = document.createElement("div"), root = createRoot(container); document.body.append(container);
  try {
    form.values.dependents = ["spouse"];
    await act(async () => root.render(<MemoryRouter><Eligibility /></MemoryRouter>));
    expect(container.querySelector('[aria-labelledby="spouse-membership-label"]')).toBeNull();
    expect(container.querySelector('.MuiAlert-standardInfo')?.textContent).toContain(note);
    form.values.dependents = [];
    await act(async () => root.render(<MemoryRouter><Eligibility key="no-spouse" /></MemoryRouter>));
    expect(container.textContent).not.toContain(note);
  } finally { await act(async () => root.unmount()); container.remove(); form.values.dependents = ["spouse"]; }
  for (const site of ["abe", "asce", "waepa"]) {
    installPrototypeLibrary(resolvePrototypeLibrary(db, site, "other")); window.history.replaceState(null, "", `/?site=${site}`);
    expect(getClientPageFields("eligibility", form.values).some(field => field.id === "spouse-membership")).toBe(true);
    expect(getPageSectionNote("eligibility", "spouseSection")).toBeUndefined();
  }
});
