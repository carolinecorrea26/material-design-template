import { expect, it } from "vitest";
import { createReviewedMigrationDatabase } from "./fixtures";
import { applyProfileReplacementNoticeAdoption } from "./profileReplacementNoticeAdoption";
import { currentMcrSource } from "./currentMcr";
import { resolvePrototypeLibrary } from "../domain/prototypeLibrary";
import { isApplicantExperience } from "../domain/applicantExperience";
import { validateMigrationDatabase } from "./integrity";
it("adopts the complete source text as editable shared Profile configuration and preserves ABE Review", () => {
  const db = createReviewedMigrationDatabase();
  const source = String(currentMcrSource.cells.find(row => row.sheet === "Legal Disclosures" && row.cell === "A14")!.value).trim();
  for (const site of ["abe", "ama", "asce", "avma", "csea", "isitrust", "nso", "waepa", "waepa-gi"]) expect(resolvePrototypeLibrary(db, site, "replacement").client.applicantExperience?.profile?.lifeReplacementNotice, site).toEqual({ jurisdictions: ["NY"], text: source, fontSizePt: 12, bold: true });
  const review = structuredClone(db.configurationValues.find(row => row.key === "abe.review-policy"));
  const copy = structuredClone(db); applyProfileReplacementNoticeAdoption(copy); expect(copy).toEqual(db);
  expect(copy.configurationValues.find(row => row.key === "abe.review-policy")).toEqual(review);
  expect(validateMigrationDatabase(db)).toEqual([]);
  expect(isApplicantExperience({ profile: { lifeReplacementNotice: { jurisdictions: ["NY"], text: source, fontSizePt: 12, bold: true } } })).toBe(true);
  expect(isApplicantExperience({ profile: { lifeReplacementNotice: { jurisdictions: ["unknown"], text: source, fontSizePt: 12, bold: true } } })).toBe(false);
}, 120000);
