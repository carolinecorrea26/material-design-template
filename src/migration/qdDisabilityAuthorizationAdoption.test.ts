import { afterEach, beforeAll, expect, it } from "vitest";
import { createReviewedMigrationDatabase } from "./fixtures";
import { applyQdDisabilityAuthorizationAdoption } from "./qdDisabilityAuthorizationAdoption";
import { applyReviewAuthorizationAdoption } from "./reviewAuthorizationAdoption";
import { installPrototypeLibrary, resolvePrototypeLibrary } from "../domain/prototypeLibrary";
import { resolveReviewExperience } from "../config/reviewExperience";
import { isReviewPolicy } from "../domain/reviewPolicy";
import { currentMcrSource } from "./currentMcr";
import type { DatabaseSchema } from "../persistence/types";
import { buildSelectedCoverageEntries } from "../utils/coverageDecisions";
let db: DatabaseSchema;
beforeAll(() => { db = createReviewedMigrationDatabase(); }, 120000);
afterEach(() => installPrototypeLibrary(null));
const source = (cell: string) => String(currentMcrSource.cells.find(row => row.sheet === "Read & Sign" && row.cell === cell)!.value).trim();
function experience(state: string, products = ["li-group-term", "di-short-term"], age = 40) {
  const library = resolvePrototypeLibrary(db, "waepa", "C52"); installPrototypeLibrary(library);
  return resolveReviewExperience(library.client, "waepa", library.products, { membership: "current", state, "birth-date": `${2026-age}-01-01`, coverageSelections: products, productApplicants: Object.fromEntries(products.map(key => [key, ["member"]])), coverageAmounts: Object.fromEntries(products.map(key => [`${key}:member`, key.startsWith("di-") ? 1000 : 200000])) });
}
it("uses C52 only for participating QD DI/combo requests and retains jurisdiction priority", () => {
  expect(experience("PA").medicalAuthorization?.text).toBe(source("C52"));
  expect(experience("MN").medicalAuthorization?.text).not.toBe(source("C52")); expect(experience("MN").medicalAuthorization?.afterConsentText).toContain("excludes");
  expect(experience("VA").medicalAuthorization?.text).toBe(source("C48"));
  expect(experience("PA", ["di-short-term"]).authorizationVisible).toBe(true);
  expect(experience("PA", ["di-short-term"]).medicalAuthorization?.text).toBe(source("C52"));
  expect(experience("PA", ["di-short-term"], 60).medicalAuthorization?.text).toBe(source("B41"));
  expect(experience("PA", ["li-group-term"]).medicalAuthorization?.text).toBe(source("B41"));
  const abe = resolvePrototypeLibrary(db, "abe", "preserved"); expect(abe.client.reviewPolicy?.authorization?.wording?.processingVariants?.[0].when).toBe("qd-disability-or-qd-life-with-disability");
});
it("uses C52 for actual ASCE QD Life plus FUW Disability and supports native edits", () => {
  const library = resolvePrototypeLibrary(db, "asce", "combo"); installPrototypeLibrary(library);
  const values = { membership: "yes", state: "PA", "birth-date": "1986-01-01", coverageSelections: ["li-10yr", "di-ltd"], productApplicants: { "li-10yr": ["member"], "di-ltd": ["member"] }, coverageAmounts: { "li-10yr:member": 100000, "di-ltd:member": 1000 } };
  expect(resolveReviewExperience(library.client, "asce", library.products, values).medicalAuthorization?.text, JSON.stringify(buildSelectedCoverageEntries(values, library.products).map(entry => ({ product: entry.coverageId, underwriting: entry.underwriting })))).toBe(source("C52"));
  const copy = structuredClone(db), row = copy.configurationValues.find(row => row.key === "asce.review-policy")!;
  if (!isReviewPolicy(row.value)) throw new Error("Invalid fixture"); row.value.authorization!.wording!.processingVariants![0].text = "AUTHORIZATION: Captured combo text";
  const edited = resolvePrototypeLibrary(copy, "asce", "edited"); installPrototypeLibrary(edited);
  expect(resolveReviewExperience(edited.client, "asce", edited.products, values).medicalAuthorization?.text).toBe("AUTHORIZATION: Captured combo text");
  row.value.authorization!.wording!.processingVariants![0].when = "unknown" as never; expect(isReviewPolicy(row.value)).toBe(false);
});
it("preserves prior authorizations, consent, ABE and both compiler reapplications", () => {
  const copy = structuredClone(db); applyQdDisabilityAuthorizationAdoption(copy); expect(copy).toEqual(db);
  applyReviewAuthorizationAdoption(copy); expect(copy).toEqual(db);
});
