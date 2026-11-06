import { act } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeAll, expect, it, vi } from "vitest";
import Membership from "./Membership";
import { createReviewedMigrationDatabase } from "../migration/fixtures";
import { installPrototypeLibrary, resolvePrototypeLibrary } from "../domain/prototypeLibrary";
import { getClientPageFields } from "../config/clientFields/getClientPageFields";
import { reviewMembershipBasics } from "../migration/requirementCrosswalkMembershipReview";
import type { CrosswalkRow } from "../migration/requirementCrosswalk";
import type { DatabaseSchema } from "../persistence/types";
const form = vi.hoisted(() => ({ values: {} as Record<string, unknown>, setPageValues: vi.fn(), saveApplication: vi.fn() }));
vi.mock("../app/ApplicationFormContext", async original => ({ ...await original<typeof import("../app/ApplicationFormContext")>(), useApplicationForm: () => form }));
vi.mock("../app/ApplicationSessionContext", () => ({ useApplicationSession: () => ({ reviewSubmitted: false, markReviewSubmitted: vi.fn() }) }));
vi.mock("../app/SinglePageFlowContext", () => ({ useSinglePageFlow: () => ({ pageId: "membership", navigationPending: false, setNavigationPending: vi.fn(), completeSection: vi.fn(), goToSection: vi.fn() }) }));
let db: DatabaseSchema;
beforeAll(() => { db = createReviewedMigrationDatabase(); }, 120000);
afterEach(() => { installPrototypeLibrary(null); window.sessionStorage.clear(); vi.unstubAllGlobals(); });
it.each([
  ["abe", "Are you an active member of a State, Local, or Specialty Bar Association?"],
  ["asce", "Are you a member of the American Society of Civil Engineers?"],
  ["avma", "Are you a member of the American Veterinary Medical Association?"],
  ["nso", "Are you a nurse?"],
  ["csea", "Are you a member of the CSEA and presently performing all the duties of your occupation according to your regular schedule?"],
])("renders %s's captured question and blocks No without collecting unrelated fields", async (site, label) => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true); window.history.replaceState(null, "", `/membership?site=${site}`);
  installPrototypeLibrary(resolvePrototypeLibrary(db, site, "membership-basics"));
  form.values = { membership: "yes", "first-name": "Taylor", "last-name": "Morgan", email: "taylor@example.invalid", phone: "2025550123", "avma-vet-college": "Example College", "avma-graduation-year": "2000", "avma-occupation": "Small animal practice", "csea-occupation-group": "group-1-clerical", "member-id": "12345", "nurse-type": "rn" };
  const container = document.createElement("div"), root = createRoot(container); document.body.append(container);
  try {
    await act(async () => root.render(<MemoryRouter><Membership /></MemoryRouter>));
    expect(container.textContent).toContain(label);
    const membershipGroup = container.querySelector('[aria-labelledby="membership-label"]')?.closest(".FieldGroup-root");
    expect(membershipGroup).not.toBeNull();
    for (const id of ["first-name", "last-name", "email", "phone"]) {
      expect(container.querySelector(`[name="${id}"]`)?.closest(".FieldGroup-root"), id).toBe(membershipGroup);
    }
    if (site === "abe") { expect(container.querySelector('input[name="member-id"]')).toBeNull(); expect(container.querySelector('input[name="abe-member-id"]')).not.toBeNull(); expect(container.querySelector<HTMLInputElement>('input[name="abe-member-id"]')!.required).toBe(false); }
    if (site === "avma") for (const key of ["avma-graduation-year", "avma-occupation"]) expect(container.querySelector(`[name="${key}"]`)).not.toBeNull();
    if (site === "csea") {
      expect(container.textContent).toContain("Yes (Group 1 Clerical)"); expect(container.textContent).toContain("No (Group 2 Non-Clerical)");
      expect(container.querySelector('[aria-labelledby="csea-performing-duties-label"]')).toBeNull();
    }
    const no = container.querySelector('[aria-labelledby="membership-label"]')!.querySelectorAll<HTMLElement>('label.SelectionGroup-root')[1];
    await act(async () => no.click());
    expect(container.querySelector<HTMLButtonElement>('button[type="submit"]')?.disabled).toBe(true);
    if (site === "avma") for (const key of ["avma-graduation-year", "avma-occupation"]) expect(container.querySelector(`[name="${key}"]`)).toBeNull();
  } finally { await act(async () => root.unmount()); container.remove(); }
});

it("retains required collection and reopens exact source leaves after native requiredness or label edits", () => {
  const row = { id: "atomic.attestation.avma.graduation-year", scope: { unresolved: [] } } as unknown as CrosswalkRow;
  reviewMembershipBasics(db, [row]); expect(row.verificationStatus).toBe("recorded-evidence");
  const changed = structuredClone(db);
  changed.fields.find(row => row.key === "avma-graduation-year")!.definition.required = false;
  reviewMembershipBasics(changed, [row]); expect(row.verificationStatus).toBe("not-verified");
  installPrototypeLibrary(resolvePrototypeLibrary(db, "abe", "optional-id")); window.history.replaceState(null, "", "/membership?site=abe");
  expect(getClientPageFields("membership", { membership: "yes" }).filter(field => /member(?:ship)?\s*(?:id|number)/i.test(field.label) && field.required)).toEqual([]);
});
