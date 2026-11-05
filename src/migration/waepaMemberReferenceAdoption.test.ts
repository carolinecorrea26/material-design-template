import { afterEach, beforeAll, expect, it } from "vitest";
import { createReviewedMigrationDatabase } from "./fixtures";
import { applyWaepaMemberReferenceAdoption } from "./waepaMemberReferenceAdoption";
import { installPrototypeLibrary, resolvePrototypeLibrary } from "../domain/prototypeLibrary";
import { getClientPageFields } from "../config/clientFields/getClientPageFields";
import type { DatabaseSchema } from "../persistence/types";
let db: DatabaseSchema;
beforeAll(() => { db = createReviewedMigrationDatabase(); }, 120000);
afterEach(() => installPrototypeLibrary(null));
it("collects one optional reference initial for the four approved Associate Member choices and preserves captured edits", () => {
  const library = resolvePrototypeLibrary(db, "waepa", "reference-MI"); installPrototypeLibrary(library); window.history.replaceState(null, "", "/membership?site=waepa");
  for (const answer of ["spouse-associate", "child-associate", "parent-associate", "sibling-associate"]) {
    const fields = getClientPageFields("membership", { membership: "new", "waepa-attestation": answer });
    expect(fields.find(field => field.id === "waepa-member-middle-initial")).toMatchObject({ required: false, maxLength: 1 });
    expect(fields.find(field => field.id === "waepa-member-first-name")?.required).toBe(true); expect(fields.find(field => field.id === "waepa-member-last-name")?.required).toBe(true);
  }
  for (const values of [{ membership: "current" }, { membership: "current", "waepa-attestation": "sibling-associate" }, { membership: "new", "waepa-attestation": "federal-active" }, { membership: "new", "waepa-attestation": "former-federal" }] as Array<Record<string, string>>) expect(getClientPageFields("membership", values).some(field => field.id === "waepa-member-middle-initial")).toBe(false);
  const copy = structuredClone(db); applyWaepaMemberReferenceAdoption(copy); expect(copy).toEqual(db);
  copy.fields.find(field => field.key === "waepa-member-middle-initial")!.definition.label = "Captured reference initial";
  installPrototypeLibrary(resolvePrototypeLibrary(copy, "waepa", "edited")); expect(getClientPageFields("membership", { membership: "new", "waepa-attestation": "sibling-associate" }).find(field => field.id === "waepa-member-middle-initial")?.label).toBe("Captured reference initial");
  for (const site of ["waepa-gi", "abe", "nso"]) { installPrototypeLibrary(resolvePrototypeLibrary(db, site, "isolated")); window.history.replaceState(null, "", `/membership?site=${site}`); expect(getClientPageFields("membership", { membership: "new", "waepa-attestation": "sibling-associate" }).some(field => field.id === "waepa-member-middle-initial")).toBe(false); }
});
