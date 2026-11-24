// Captured migration UI regression; fresh-start journeys are covered in test:journeys.
import { act } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeAll, expect, it, vi } from "vitest";
import Membership from "./Membership";
import { createReviewedMigrationDatabase } from "../migration/fixtures";
import { installPrototypeLibrary, resolvePrototypeLibrary } from "../domain/prototypeLibrary";
import { resolveSnapshotTestLibrary } from "../migration/snapshotTestLibrary";
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
// One representative of the shared Yes/No membership gate; enrolled override
// combinations are covered by Membership.attestation and the journey matrix.
it.each([
  ["asce", "Are you a member of the American Society of Civil Engineers?"],
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
    const no = container.querySelector('[aria-labelledby="membership-label"]')!.querySelectorAll<HTMLElement>('label.SelectionGroup-root')[1];
    await act(async () => no.click());
    expect(container.querySelector<HTMLButtonElement>('button[type="submit"]')?.disabled).toBe(true);
  } finally { await act(async () => root.unmount()); container.remove(); }
});

it("retains required collection and reopens exact source leaves after native requiredness or label edits", () => {
  const row = { id: "atomic.attestation.avma.graduation-year", scope: { unresolved: [] } } as unknown as CrosswalkRow;
  reviewMembershipBasics(db, [row]); expect(row.verificationStatus).toBe("not-verified");
  const changed = structuredClone(db);
  changed.fields.find(row => row.key === "avma-graduation-year")!.definition.required = false;
  reviewMembershipBasics(changed, [row]); expect(row.verificationStatus).toBe("not-verified");
  installPrototypeLibrary(resolveSnapshotTestLibrary(db, "abe", "optional-id")); window.history.replaceState(null, "", "/membership?site=abe");
  expect(getClientPageFields("membership", { membership: "yes" }).filter(field => /member(?:ship)?\s*(?:id|number)/i.test(field.label) && field.required)).toEqual([]);
});
