import { act } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeAll, expect, it, vi } from "vitest";
import { createReviewedMigrationDatabase } from "./fixtures";
import { applyBeneficiaryNoteAdoption } from "./beneficiaryNoteAdoption";
import { beneficiaryDesignationNote, isBeneficiaryNotePolicy } from "../domain/beneficiaryNotes";
import { installPrototypeLibrary, resolvePrototypeLibrary } from "../domain/prototypeLibrary";
import { validateMigrationDatabase } from "./integrity";
import type { DatabaseSchema } from "../persistence/types";
import Beneficiary from "../pages/Beneficiary";

const form = vi.hoisted(() => ({ values: { coverageSelections: ["li-10yr", "li-group-term"], productApplicants: { "li-10yr": ["member"], "li-group-term": ["member"] }, coverageAmounts: { "li-10yr:member": 100000, "li-group-term:member": 100000 } }, setPageValues: vi.fn(), saveApplication: vi.fn() }));
vi.mock("../app/ApplicationFormContext", () => ({ useApplicationForm: () => form }));
vi.mock("../app/ApplicationSessionContext", () => ({ useApplicationSession: () => ({ reviewSubmitted: false, markReviewSubmitted: vi.fn() }) }));
vi.mock("../app/SinglePageFlowContext", () => ({ useSinglePageFlow: () => null }));
let db: DatabaseSchema;
beforeAll(() => { db = createReviewedMigrationDatabase(); }, 120000);
afterEach(() => { installPrototypeLibrary(null); vi.unstubAllGlobals(); });
it("assigns the approved note per product and Site while keeping child rules separate", () => {
  const rows = db.configurationValues.filter(row => row.configurationKey === "shared.beneficiary-notes");
  expect(rows).toHaveLength(9);
  for (const row of rows) {
    const library = resolvePrototypeLibrary(db, row.siteKey!, "beneficiary-notes");
    if (!isBeneficiaryNotePolicy(row.value)) throw new Error("Invalid fixture policy");
    for (const note of row.value.notes) for (const product of note.productKeys) for (const applicant of note.applicants) {
      const copy = beneficiaryDesignationNote(library.site, product, applicant)!;
      if (["li-10yr", "li-15yr", "li-20yr"].includes(product)) expect(copy).toContain("new insurance issued");
      else if (row.siteKey === "csea") expect(copy).toContain("this AD&D insurance coverage");
      else expect(copy).toContain("revoke any prior beneficiary designation");
      expect(copy).not.toContain("For First-to-Die, add");
      expect(beneficiaryDesignationNote(library.site, product, "child")).toBeNull();
    }
  }
  const repeated = structuredClone(db); applyBeneficiaryNoteAdoption(repeated); expect(repeated).toEqual(db);
  expect(validateMigrationDatabase(db)).toEqual([]);
});

it("uses captured native copy, isolates Sites and rejects overlapping or orphan assignments", () => {
  const before = resolvePrototypeLibrary(db, "isitrust", "before-note-edit"), edited = structuredClone(db);
  const row = edited.configurationValues.find(row => row.key === "isitrust.beneficiary-notes")!;
  if (!isBeneficiaryNotePolicy(row.value)) throw new Error("Invalid fixture policy");
  row.value.notes.find(note => note.productKeys.includes("li-10yr"))!.text = "Edited note for this Site.";
  expect(beneficiaryDesignationNote(resolvePrototypeLibrary(edited, "isitrust", "after").site, "li-10yr", "member")).toBe("Edited note for this Site.");
  expect(beneficiaryDesignationNote(before.site, "li-10yr", "member")).toContain("new insurance issued");
  expect(resolvePrototypeLibrary(edited, "abe", "other").site).toEqual(resolvePrototypeLibrary(db, "abe", "other").site);
  expect(isBeneficiaryNotePolicy({ ...row.value, notes: [...row.value.notes, row.value.notes[0]] })).toBe(false);
  row.value.notes[0].productKeys = ["unknown-product"];
  expect(validateMigrationDatabase(edited)).toContain("Orphan beneficiary note product isitrust.beneficiary-notes");
  expect(() => resolvePrototypeLibrary(edited, "isitrust", "invalid")).toThrow("Invalid beneficiary note policy");
});

it("renders each product's designation note on the real Beneficiary page", async () => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  window.history.replaceState(null, "", "/?site=isitrust");
  installPrototypeLibrary(resolvePrototypeLibrary(db, "isitrust", "rendered-beneficiary-notes"));
  const container = document.createElement("div"), root = createRoot(container); document.body.append(container);
  try {
    await act(async () => root.render(<MemoryRouter><Beneficiary /></MemoryRouter>));
    expect(container.textContent).toContain("new insurance issued on the basis of this application");
    expect(container.textContent).toContain("revoke any prior beneficiary designation");
  } finally { await act(async () => root.unmount()); container.remove(); }
});
