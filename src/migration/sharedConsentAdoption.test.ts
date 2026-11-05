import { afterEach, beforeAll, expect, it } from "vitest";
import { createReviewedMigrationDatabase } from "./fixtures";
import { applySharedConsentAdoption } from "./sharedConsentAdoption";
import { resolvePrototypeLibrary, installPrototypeLibrary } from "../domain/prototypeLibrary";
import { composeReadAndSign, resolveReviewExperience } from "../config/reviewExperience";
import { isReviewPolicy, resolveReviewConsent, validateCapturedReview } from "../domain/reviewPolicy";
import { reviewDefaults } from "../content/defaults/review";
import { atpeAssociationKey } from "./atpeAssociationAdoption";
import { validateMigrationDatabase } from "./integrity";
import type { DatabaseSchema } from "../persistence/types";

let db: DatabaseSchema;
beforeAll(() => { db = createReviewedMigrationDatabase(); }, 120000);
afterEach(() => installPrototypeLibrary(null));
it.each([
  ["isitrust", "sh-critical-illness", true], ["isitrust", "li-add", false], ["isitrust", "li-20yr", true],
  ["isitrust", "li-50plus", false], ["waepa-gi", "li-group-term", false],
] as const)("selects source consent from actual questions for %s/%s", (site, product, health) => {
  const library = resolvePrototypeLibrary(db, site, "shared-consent"); installPrototypeLibrary(library);
  const values = { membership: atpeAssociationKey, state: "PA", "birth-date": "1986-01-01", coverageSelections: [product], productApplicants: { [product]: ["member"] }, coverageAmounts: { [`${product}:member`]: 100000 } };
  const review = resolveReviewExperience(library.client, site, library.products, values);
  expect(review.authorizationVisible).toBe(health);
  expect(review.consent.status).toBe("resolved");
  expect(review.consent.text?.includes("MIB")).toBe(health);
  const content = composeReadAndSign(reviewDefaults.readAndSignContent, review.fraudNotice, review.consent.text, review.authorizationVisible, review.medicalAuthorization);
  expect(content.match(/CONSENT:/g)).toHaveLength(1);
  expect(content).not.toContain("{Link");
  expect(content.includes("AUTHOR")).toBe(health);
});

it("requires the captured participation fact, preserves dedicated Site consent and supports saved copy edits", () => {
  const library = resolvePrototypeLibrary(db, "avma", "captured-consent"), policy = library.site.configuration.reviewPolicies[0].value;
  if (!isReviewPolicy(policy)) throw new Error("Invalid fixture policy");
  const selections = [{ productKey: "sh-critical-illness", category: "SH", applicants: ["member"] }];
  expect(resolveReviewConsent(policy, selections, {}).status).toBe("needs-information");
  expect(validateCapturedReview(library.site, "PA", selections, {}).allowed).toBe(false);
  expect(validateCapturedReview(library.site, "PA", selections, {}, true).allowed).toBe(true);
  expect(resolveReviewConsent(policy, selections, {}, false).text).not.toContain("MIB");
  const copy = structuredClone(db), row = copy.configurationValues.find(row => row.key === "avma.review-policy")!;
  if (!isReviewPolicy(row.value)) throw new Error("Invalid edited policy");
  row.value.consent!.otherText = "CONSENT: Edited captured wording.";
  const edited = resolvePrototypeLibrary(copy, "avma", "edited-consent").site.configuration.reviewPolicies[0].value;
  if (!isReviewPolicy(edited)) throw new Error("Invalid captured policy");
  expect(resolveReviewConsent(edited, selections, {}, false).text).toContain("Edited captured wording");
  expect(resolveReviewConsent(policy, selections, {}, false).text).not.toContain("Edited captured wording");
  const waepa = resolvePrototypeLibrary(db, "waepa", "dedicated-consent").site.configuration.reviewPolicies[0].value;
  expect(isReviewPolicy(waepa) && waepa.consent?.otherText).toContain("Chronic Illness Rider");
  const repeated = structuredClone(db); applySharedConsentAdoption(repeated); expect(repeated).toEqual(db);
  expect(validateMigrationDatabase(db)).toEqual([]);
});
