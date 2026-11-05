import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeAll, expect, it } from "vitest";
import { createReviewedMigrationDatabase } from "./fixtures";
import { applyJurisdictionReviewNoticeAdoption } from "./jurisdictionReviewNoticeAdoption";
import { installPrototypeLibrary, resolvePrototypeLibrary } from "../domain/prototypeLibrary";
import { isReviewPolicy } from "../domain/reviewPolicy";
import { resolveReviewExperience, composeReadAndSign } from "../config/reviewExperience";
import { reviewDefaults } from "../content/defaults/review";
import ReviewStatement from "../components/forms/ReviewStatement";
import type { DatabaseSchema } from "../persistence/types";
let db: DatabaseSchema;
beforeAll(() => { db = createReviewedMigrationDatabase(); }, 120000);
afterEach(() => installPrototypeLibrary(null));
it("uses actual question participation for the Connecticut notice and preserves ABE", () => {
  for (const [site, product, age, expected] of [["waepa", "di-short-term", 50, true], ["waepa", "di-short-term", 49, true], ["waepa-gi", "li-group-term", 30, false], ["abe", "li-term", 40, true]] as const) {
    const library = resolvePrototypeLibrary(db, site, "CT"); installPrototypeLibrary(library);
    const result = resolveReviewExperience(library.client, site, library.products, { membership: site === "waepa" ? "current" : "yes", state: "CT", "birth-date": `${new Date().getFullYear() - age}-01-01`, coverageSelections: [product], productApplicants: { [product]: ["member"] }, coverageAmounts: { [`${product}:member`]: product === "di-short-term" ? 1000 : 100000 } });
    const notice = result.blocks.find(block => block.key === "connecticut-underwritten-notice");
    expect(!!notice).toBe(expected);
    if (notice) expect(notice).toMatchObject({ placement: site === "abe" ? "read-and-sign-appendix" : "before-member-signature", paragraphs: [expect.stringContaining("REVIEW THE ANSWERS ON THIS APPLICATION CAREFULLY")] });
  }
});
it("places WAEPA Life notes after fraud and before one Consent, with a bold NY-only war notice", () => {
  const library = resolvePrototypeLibrary(db, "waepa", "NY"); installPrototypeLibrary(library);
  for (const [state, product, count] of [["NY", "li-group-term", 2], ["PA", "li-group-term", 1], ["NY", "di-short-term", 0]] as const) {
    const result = resolveReviewExperience(library.client, "waepa", library.products, { membership: "current", state, "birth-date": "1986-01-01", coverageSelections: [product], productApplicants: { [product]: ["member"] }, coverageAmounts: { [`${product}:member`]: product === "di-short-term" ? 1000 : 100000 } });
    const notices = result.blocks.filter(block => block.placement === "before-consent"); expect(notices).toHaveLength(count);
    const text = composeReadAndSign(reviewDefaults.readAndSignContent, result.fraudNotice, result.consent.text, result.authorizationVisible, result.medicalAuthorization);
    const html = renderToStaticMarkup(<ReviewStatement text={text} notices={notices} />);
    expect(html.match(/CONSENT:/g)).toHaveLength(1);
    if (count) expect(html.indexOf("Receipt of Accelerated Death Benefits")).toBeLessThan(html.indexOf("CONSENT:"));
    if (count === 2) { expect(html).toContain("<strong"); expect(html).toContain("NOTICE FOR NEW YORK RESIDENTS, THE POLICY CONTAINS A WAR RESTRICTION"); expect(html.indexOf("FRAUD NOTICE")).toBeLessThan(html.indexOf("Receipt of Accelerated Death Benefits")); }
  }
});
it("captures notice guards/copy, rejects malformed policy and reapplies idempotently", () => {
  const copy = structuredClone(db); applyJurisdictionReviewNoticeAdoption(copy); expect(copy).toEqual(db);
  const row = copy.configurationValues.find(row => row.key === "waepa.review-policy")!;
  if (!isReviewPolicy(row.value)) throw new Error("Invalid fixture");
  const ct = row.value.blocks.find(block => block.key === "connecticut-underwritten-notice")!;
  expect(isReviewPolicy({ ...row.value, blocks: [{ ...ct, when: { healthQuestions: "yes" } }] })).toBe(false);
  expect(isReviewPolicy({ ...row.value, blocks: [{ ...ct, placement: "unknown" }] })).toBe(false);
  ct.when!.jurisdictions = ["PA"];
  const captured = resolvePrototypeLibrary(db, "waepa", "before-edit"), edited = resolvePrototypeLibrary(copy, "waepa", "after-edit");
  const values = { membership: "current", state: "CT", "birth-date": "1970-01-01", coverageSelections: ["di-short-term"], productApplicants: { "di-short-term": ["member"] }, coverageAmounts: { "di-short-term:member": 1000 } };
  for (const [library, expected] of [[captured, true], [edited, false]] as const) {
    installPrototypeLibrary(library); expect(resolveReviewExperience(library.client, "waepa", library.products, values).blocks.some(block => block.key === ct.key)).toBe(expected);
  }
});
