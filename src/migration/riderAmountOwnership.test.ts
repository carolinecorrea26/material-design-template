import { beforeAll, expect, it } from "vitest";
import { mcrSource } from "./mcr";
import { createReviewedMigrationDatabase } from "./fixtures";
import { consolidateRiderAmountOwnership } from "./riderAmountOwnership";
import { resolveEffectiveSite } from "../domain/effectiveSite";
import { resolvePrototypeLibrary } from "../domain/prototypeLibrary";
import { isSelectionPolicy, reconcileCoverageSelection } from "../domain/coverageSelectionPolicy";
import { createLibraryDraft, editDraftRiders } from "../domain/libraryDraft";
import { createSiteBuild } from "../domain/siteBuild";
import { createPortalDataRepository, type PortalRevision } from "../repositories/portalDataRepository";
import { LocalStorageAdapter } from "../persistence/localAdapter";
import { validateMigrationDatabase } from "./integrity";
import { getCoverageAmountChoices } from "../utils/coverageAmounts";

const db = createReviewedMigrationDatabase();
let revision: PortalRevision;
beforeAll(async () => { revision = await createPortalDataRepository(new LocalStorageAdapter(db)).open(); });
const product = (data = db, site = "asce", key = "li-term") => resolveEffectiveSite(data, site).configuration.products.find(product => product.productKey === key)!;
const rule = (data = db) => data.riderAmountRules.find(row => row.key === "ownership.asce.li-term.rider.asce.r37.all.choices")!;
const preview = (data = db, site = "asce") => resolvePrototypeLibrary(data, site, "test:amount-owner");
const selection = (data = db) => {
  const policy = product(data).selectionPolicies[0].value;
  if (!isSelectionPolicy(policy)) throw new Error("Unresolved test selection");
  return policy;
};

it("preserves every candidate policy while removing independent executable choice arrays", () => {
  const evidence = db.semanticRequirements.filter(row => row.predicate === "structured-rider-amounts");
  expect(evidence).toHaveLength(7);
  for (const row of evidence) {
    const value = row.value;
    if (!value || typeof value !== "object" || Array.isArray(value) || typeof value.previousPolicy !== "object" || !value.previousPolicy || Array.isArray(value.previousPolicy)) throw new Error("Missing evidence");
    const config = db.configurationValues.find(config => config.key === row.key.replace("ownership-evidence.", "").replace(".rider-amounts", ""))!;
    expect(config.value).toMatchObject({ version: 2, amountSource: "rider-amount-rules" });
    const target = db.configurationDefinitions.find(def => def.key === config.configurationKey)!.definition.target;
    if (target?.kind !== "product-selection-policy") throw new Error("Missing target");
    const resolved = product(db, row.subjectKey, target.productKey).selectionPolicies[0];
    expect(resolved.value).toEqual({ ...value.previousPolicy, amountSource: "rider-amount-rules" });
    expect(resolved.provenance.some(source => source.table === "riderAmountRules")).toBe(true);
    expect(JSON.stringify(config.value)).not.toContain('"values":');
  }
  expect(validateMigrationDatabase(db)).toEqual([]);
  const repeated = structuredClone(db);
  consolidateRiderAmountOwnership(repeated);
  expect(repeated).toEqual(db);
});

it("makes edited structured choices govern both controls and election reconciliation", () => {
  const changed = structuredClone(db);
  changed.amountBands.find(band => band.amountPatternKey === rule(changed).amountPatternKey)!.maximum = 100000;
  const rider = preview(changed).products.find(product => product.id === "li-term")!.riders!.find(rider => rider.id === "cir")!;
  expect(getCoverageAmountChoices({ coverageAmounts: rider.coverageAmounts }, "member")).toEqual([50000, 100000]);
  const result = reconcileCoverageSelection(selection(changed), { mode: "new", applicantKey: "member", baseAmount: 500000, ageYears: 40, jurisdiction: "US-PA" }, { riders: ["rider.asce.r37"], riderAmounts: { "rider.asce.r37": 150000 } });
  expect(result.election.riderAmounts["rider.asce.r37"]).toBe(50000);
  expect(selection().riders.find(rider => rider.key === "rider.asce.r37")!.amount).toMatchObject({ values: expect.arrayContaining([150000]) });
});

it.each(["missing", "applicant", "product", "conditional", "pattern", "default", "inline"])("rejects a broken %s reference without falling back to definition amounts", scenario => {
  const changed = structuredClone(db);
  const source = rule(changed);
  if (scenario === "missing") changed.riderAmountRules = changed.riderAmountRules.filter(row => row !== source);
  if (scenario === "applicant") source.applicantTypeKey = "spouse";
  if (scenario === "product") source.baseProductKey = "li-10yr";
  if (scenario === "conditional") source.conditionKey = "unknown";
  if (scenario === "pattern") changed.amountBands.find(band => band.amountPatternKey === source.amountPatternKey)!.increment = 0;
  if (["default", "inline"].includes(scenario)) {
    const config = changed.configurationValues.find(row => row.key === "asce.li-term.selection-policy")!;
    const value = config.value;
    if (!value || typeof value !== "object" || Array.isArray(value) || !Array.isArray(value.riders)) throw new Error("Missing selection");
    const rider = value.riders[0];
    if (!rider || typeof rider !== "object" || Array.isArray(rider)) throw new Error("Missing rider");
    rider.amount = scenario === "default" ? { kind: "rule", key: source.key, default: 123 } : { kind: "choices", values: [123], default: 123 };
  }
  expect(() => preview(changed)).toThrow("Unresolved structured selection");
  expect(validateMigrationDatabase(changed)).toContain("Invalid executable selection policy asce.li-term.selection-policy");
});

it("reads archived v1 choices without attaching current amount rules or mutating the capture", () => {
  const changed = structuredClone(db);
  const evidence = changed.semanticRequirements.find(row => row.key === "ownership-evidence.asce.li-term.selection-policy.rider-amounts")!.value;
  if (!evidence || typeof evidence !== "object" || Array.isArray(evidence) || !evidence.previousPolicy) throw new Error("Missing evidence");
  changed.configurationValues.find(row => row.key === "asce.li-term.selection-policy")!.value = evidence.previousPolicy;
  changed.riderAmountRules = changed.riderAmountRules.filter(row => row.key !== rule().key);
  const before = JSON.stringify(changed);
  expect(selection(changed)).toEqual(evidence.previousPolicy);
  expect(JSON.stringify(changed)).toBe(before);
});

it("copies referenced assignments and patterns so later copied-Site edits stay isolated", () => {
  const draft = createLibraryDraft(revision, "asce");
  draft.data.organizations = db.organizations;
  draft.data.organizationProfiles = db.organizationProfiles;
  const client = db.clients.find(row => row.key === "asce")!;
  const organization = db.organizations.find(row => row.id === client.organizationId)!;
  const copied = createSiteBuild(draft, { siteKey: "asce-amount-copy", siteName: "Amount copy", template: "multi", clientKey: client.key, clientName: client.name, organizationKey: organization.key, organizationName: organization.name, newClient: false, newOrganization: false });
  const copiedRule = copied.data.riderAmountRules.find(row => row.key === `build.asce-amount-copy.${rule().key}`)!;
  expect(copiedRule.amountPatternKey).not.toBe(rule().amountPatternKey);
  copied.data.amountBands.find(row => row.amountPatternKey === copiedRule.amountPatternKey)!.maximum = 100000;
  const resolved = resolveEffectiveSite(copied.data, copied.siteKey).configuration.products.find(p => p.productKey === "li-term")!.selectionPolicies[0].value;
  expect(resolved).toMatchObject({ riders: [expect.objectContaining({ amount: { kind: "choices", values: [50000, 100000], default: 50000 } })] });
  expect(selection().riders[0].amount).toMatchObject({ values: expect.arrayContaining([150000]) });
});

it("keeps descriptive draft edits working and refuses a second amount authority", () => {
  const draft = createLibraryDraft(revision, "asce");
  const riders = resolvePrototypeLibrary(draft.data, draft.siteKey, "test").products.find(product => product.id === "li-term")!.riders!;
  const edited = editDraftRiders(draft, "li-term", riders.map(r => ({ ...r, description: "New wording" })));
  expect(resolvePrototypeLibrary(edited.data, draft.siteKey, "test").products.find(product => product.id === "li-term")!.riders![0].description).toBe("New wording");
  expect(() => editDraftRiders(draft, "li-term", riders.map(r => ({ ...r, coverageAmounts: [{ scope: { applicantType: "member" }, selections: [{ type: "amountList", values: [123] }] }] })))).toThrow("structured rider amounts");
});

it("rejects changed pinned rider evidence before mutating reviewed rows", () => {
  const before = JSON.stringify(db);
  expect(() => consolidateRiderAmountOwnership(db, mcrSource.cells.map(cell => cell.sheet === "Riders" && cell.cell === "C43" ? { ...cell, value: "changed" } : cell))).toThrow("Rider amount source changed");
  expect(JSON.stringify(db)).toBe(before);
});
