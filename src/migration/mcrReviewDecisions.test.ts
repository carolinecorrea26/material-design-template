import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { afterEach, beforeAll, expect, it } from "vitest";
import { createReviewedMigrationDatabase } from "./fixtures";
import { currentMcrReviewData, currentMcrSource } from "./currentMcr";
import { activeSiteMigrationScope } from "./activeSiteScope";
import { ruleDependencyFindings } from "../domain/ruleOrganization";
import { associatedMemberNotice, waepaQualifications } from "../domain/membershipQualifications";
import { getClientPageFields } from "../config/clientFields/getClientPageFields";
import { installPrototypeLibrary, resolvePrototypeLibrary } from "../domain/prototypeLibrary";
import type { DatabaseSchema } from "../persistence/types";

let db: DatabaseSchema;
beforeAll(() => { db = createReviewedMigrationDatabase(); }, 120000);
afterEach(() => { installPrototypeLibrary(null); window.sessionStorage.clear(); });

it("pins the latest workbook and keeps changed evidence separate from historical policy adoption", () => {
  const contract = activeSiteMigrationScope.sources.currentMcr;
  expect(createHash("sha256").update(readFileSync(contract.snapshotPath)).digest("hex")).toBe(contract.snapshotSha256);
  expect(currentMcrSource.sha256).toBe(contract.sha256);
  const before = JSON.stringify(db.sourceRequirements);
  const review = currentMcrReviewData(db);
  const changed = review.data.sourceRequirements.find(row => row.key === "mcr.main.N278")!;
  expect(changed.value).toBe(currentMcrSource.cells.find(cell => cell.sheet === "Main" && cell.cell === "N278")!.value);
  expect(changed.promotionState).toBe("SOURCE_ONLY");
  expect(changed.activeSiteKeys).toEqual([]);
  expect(review.sourceChanges).toContainEqual(expect.objectContaining({ reference: "Main!N278", kind: "content-changed" }));
  expect(JSON.stringify(db.sourceRequirements)).toBe(before);
  expect(db.sourceRequirements.find(row => row.key === "mcr.main.N278")!.value).not.toBe(changed.value);
  expect(db.semanticRequirements.find(row => row.key === "business-decision.rules-review.isitrust-overhead-yt")?.value).toMatchObject({ selected: { token: "YT", jurisdiction: "Yukon", productKey: "oo-professional", policyActivation: "reviewed-seed" }, scope: ["isitrust"] });
  expect(db.semanticRequirements.find(row => row.key === "business-decision.rules-review.custom-consent-deferral")?.value).toMatchObject({ selected: { completionBlocking: false, disposition: "deferred-by-user" }, scope: [] });
});

it("loads all six approved qualification options from one shared field only on Standard WAEPA", () => {
  const snapshot = resolvePrototypeLibrary(db, "waepa", "approved-qualification-review");
  installPrototypeLibrary(snapshot); window.history.replaceState(null, "", "/?site=waepa");
  const qualification = getClientPageFields("membership", { membership: "new" }).find(field => field.id === "waepa-attestation")!;
  expect(qualification.options).toEqual(waepaQualifications.map(option => ({ ...option })));
  expect(qualification.options).toHaveLength(6);
  expect(qualification.options?.some(option => option.value === "federal-annuitant")).toBe(false);
  for (const value of ["spouse-associate", "child-associate", "parent-associate", "sibling-associate"]) {
    const fields = getClientPageFields("membership", { membership: "new", "waepa-attestation": value });
    expect(fields.find(field => field.id === "waepa-member-first-name")?.required).toBe(true);
    expect(fields.find(field => field.id === "waepa-member-last-name")?.required).toBe(true);
    expect(fields.find(field => field.id === "waepa-member-id")?.required).toBe(false);
    expect(associatedMemberNotice(value)).toContain("Associate Member");
  }
  const former = getClientPageFields("membership", { membership: "new", "waepa-attestation": "former-federal" });
  expect(former.some(field => ["waepa-employer", "waepa-start-date", "waepa-retired-employer", "waepa-retirement-date"].includes(field.id))).toBe(false);
  for (const site of ["waepa-gi", "asce", "ama"]) {
    installPrototypeLibrary(resolvePrototypeLibrary(db, site, "unrelated")); window.history.replaceState(null, "", `/?site=${site}`);
    expect(getClientPageFields("membership", { membership: "new" }).some(field => field.id === "waepa-attestation")).toBe(false);
  }
  expect(db.semanticRequirements.find(row => row.key === "business-decision.rules-review.waepa-qualifications")?.value).toMatchObject({ selected: { independentAdultChildLifeEntry: true, productEligibilityRemainsSeparate: true }, scope: ["waepa"] });
});

it("uses stored edits while preserving an already captured qualification snapshot", () => {
  const original = resolvePrototypeLibrary(db, "waepa", "captured");
  const edited = structuredClone(db);
  edited.fields.find(field => field.key === "waepa-attestation")!.definition.options!.pop();
  installPrototypeLibrary(resolvePrototypeLibrary(edited, "waepa", "edited")); window.history.replaceState(null, "", "/?site=waepa");
  expect(getClientPageFields("membership", { membership: "new" }).find(field => field.id === "waepa-attestation")!.options).toHaveLength(5);
  installPrototypeLibrary(original);
  expect(getClientPageFields("membership", { membership: "new" }).find(field => field.id === "waepa-attestation")!.options).toHaveLength(6);
});

it("keeps hierarchy separate from execution and detects missing or cyclic dependencies", () => {
  expect(db.rules.every(rule => rule.definition.organization?.ordering === "review-only")).toBe(true);
  expect(ruleDependencyFindings(db.rules)).toEqual([]);
  expect(ruleDependencyFindings([{ key: "rule-a", definition: { dependsOn: ["rule-missing"] } }])).toContain("Missing dependency: rule-a -> rule-missing");
  expect(ruleDependencyFindings([{ key: "rule-a", definition: { dependsOn: ["rule-b"] } }, { key: "rule-b", definition: { dependsOn: ["rule-a"] } }])).toContain("Cyclic rule dependency: rule-a");
});
