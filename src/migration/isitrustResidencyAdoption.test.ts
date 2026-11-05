import { afterEach, beforeAll, expect, it } from "vitest";
import { createReviewedMigrationDatabase } from "./fixtures";
import { applyIsitrustResidencyAdoption, approvedIsitrustResidency } from "./isitrustResidencyAdoption";
import { currentMcrSource } from "./currentMcr";
import { isResidencyPolicy, resolveNormalizedResidency, usJurisdictions } from "../domain/residencyPolicy";
import { resolveEffectiveSite } from "../domain/effectiveSite";
import { validateMigrationDatabase } from "./integrity";
import { LocalStorageAdapter } from "../persistence/localAdapter";
import { createPortalDataRepository } from "../repositories/portalDataRepository";
import { installPrototypeLibrary, resolvePrototypeLibrary } from "../domain/prototypeLibrary";
import type { DatabaseSchema } from "../persistence/types";
import { prototypeCoverageDecision } from "../domain/prototypeCoverageDecision";
import { evaluateCoverageJourney } from "../domain/coverageJourney";
import { createMockPolicyVerificationService } from "../domain/policyVerification";
import { residencyExclusionDiagnostic } from "../domain/residencyPolicy";

let db: DatabaseSchema;
beforeAll(() => { db = createReviewedMigrationDatabase(); }, 120000);
afterEach(() => { installPrototypeLibrary(null); window.sessionStorage.clear(); });

it("matches each approved v78 exclusion for every US jurisdiction without widening country scope", () => {
  const site = resolveEffectiveSite(db, "isitrust");
  const stateOptions = db.fields.find(field => field.key === "state-province")!.definition.options!;
  for (const slice of approvedIsitrustResidency) {
    let source = String(currentMcrSource.cells.find(cell => cell.sheet === "Main" && cell.cell === slice.cell)!.value);
    for (const option of [...stateOptions].sort((a, b) => b.label.length - a.label.length)) source = source.replaceAll(new RegExp(`\\b${option.label}\\b`, "g"), option.value);
    const excluded = new Set(source.match(/\b[A-Z]{2}\b/g));
    for (const jurisdiction of usJurisdictions) {
      const code = jurisdiction.slice(3);
      const expected = !excluded.has(code) && !["AS", "GU", "MP", "PR", "VI", "AA", "AE", "AP"].includes(code);
      expect(resolveNormalizedResidency(site, slice.productKey, "member", { jurisdiction, associationKey: "akron-bar-association" }).allowed, `${slice.cell}/${jurisdiction}`).toBe(expected);
    }
    for (const jurisdiction of ["CA-YT", "CA-ON"]) expect(resolveNormalizedResidency(site, slice.productKey, "member", { jurisdiction, associationKey: "akron-bar-association" }).allowed).toBe(false);
    expect(resolveNormalizedResidency(site, slice.productKey, "member", { associationKey: "akron-bar-association" }).status).toBe("needs-information");
    expect(resolveNormalizedResidency(site, slice.productKey, "member", { jurisdiction: "US-invalid", associationKey: "akron-bar-association" }).status).toBe("unresolved");
  }
  expect(resolveNormalizedResidency(site, "oo-professional", "member", { jurisdiction: "US-UT" }).allowed).toBe(true);
  expect(resolveNormalizedResidency(site, "di-ltd", "member", { jurisdiction: "US-NC" }).allowed).toBe(false);
});

it("uses one reusable definition and one scoped assignment per approved product and preserves historical selections", () => {
  expect(validateMigrationDatabase(db)).toEqual([]);
  for (const slice of approvedIsitrustResidency) {
    const assignment = db.configurationValues.find(row => row.key === `isitrust.${slice.productKey}.journey-residency`)!;
    expect(assignment).toMatchObject({ scope: "site", siteKey: "isitrust", configurationKey: `shared.${slice.productKey}.residency-policy` });
    expect(db.configurationValues.filter(row => row.configurationKey === assignment.configurationKey)).toHaveLength(1);
    expect(db.semanticRequirements.find(row => row.key === `provisional-decision.${assignment.key}`)?.value).toMatchObject({ sourceReconciliation: "superseded", selected: { version: 1 } });
  }
  expect(db.sourceRequirements.find(row => row.key === "mcr.main.N278")!.value).not.toBe(currentMcrSource.cells.find(cell => cell.sheet === "Main" && cell.cell === "N278")!.value);
  const copy = structuredClone(db);
  applyIsitrustResidencyAdoption(copy);
  expect(copy).toEqual(db);
  const changed = structuredClone(currentMcrSource.cells);
  changed.find(cell => cell.sheet === "Main" && cell.cell === "N286")!.value = "NY";
  expect(() => applyIsitrustResidencyAdoption(copy, changed)).toThrow("Approved residency source changed");
  expect(copy).toEqual(db);
});

it("rejects invalid association residency values", () => {
  const value = db.configurationValues.find(row => row.key === "isitrust.li-group-term.journey-residency")!.value as object;
  for (const associationAllowedJurisdictions of [{ unknown: [] }, { unknown: ["US-XX"] }, { unknown: ["US-PA", "US-PA"] }, []]) expect(isResidencyPolicy({ ...value, associationAllowedJurisdictions })).toBe(false);
});

it("uses an explicit association override in applicant and submission consumers and requires a valid association", async () => {
  const edited = structuredClone(db);
  const row = edited.configurationValues.find(row => row.key === "isitrust.li-group-term.journey-residency")!;
  if (!isResidencyPolicy(row.value)) throw new Error("Missing residency policy");
  row.value.allowedJurisdictions = ["US-PA"];
  row.value.associationAllowedJurisdictions = { "akron-bar-association": ["US-FL"] };
  const site = resolveEffectiveSite(edited, "isitrust");
  const decide = (associationKey?: string, jurisdiction = "US-FL") => resolveNormalizedResidency(site, "li-group-term", "member", { jurisdiction, associationKey });
  expect(decide().status).toBe("needs-information");
  expect(decide("unavailable").status).toBe("unresolved");
  expect(decide("akron-bar-association").allowed).toBe(true);
  expect(decide("akron-bar-association", "US-PA").allowed).toBe(false);
  expect(decide("alabama-state-bar", "US-PA").allowed).toBe(true);
  expect(decide("alabama-state-bar").allowed).toBe(false);
  expect(validateMigrationDatabase(edited)).toEqual([]);
  installPrototypeLibrary(resolvePrototypeLibrary(edited, "isitrust", "association-edit"));
  expect(prototypeCoverageDecision("li-group-term", "member", { association: "akron-bar-association", state: "FL" }, [100000])?.messages).not.toContain(residencyExclusionDiagnostic);
  expect(prototypeCoverageDecision("li-group-term", "member", { association: "alabama-state-bar", state: "FL" }, [100000])?.messages).toContain(residencyExclusionDiagnostic);
  const input = { productKey: "li-group-term", applicantKey: "member", mode: "new" as const, amount: 100000, membershipConfirmed: true, eligibility: { ageYears: 40 }, jurisdiction: "US-FL", election: { riders: [], riderAmounts: {} } };
  const services = { policies: createMockPolicyVerificationService([]) };
  expect((await evaluateCoverageJourney(site, { ...input, associationKey: "akron-bar-association" }, services)).errors).not.toContain(residencyExclusionDiagnostic);
  expect((await evaluateCoverageJourney(site, { ...input, associationKey: "alabama-state-bar" }, services)).errors).toContain(residencyExclusionDiagnostic);
  row.value.associationAllowedJurisdictions = { unavailable: ["US-PA"] };
  expect(validateMigrationDatabase(edited)).toContain(`Orphan residency association ${row.key}`);
  expect(resolveNormalizedResidency(resolveEffectiveSite(edited, "isitrust"), "li-group-term", "member", { jurisdiction: "US-PA", associationKey: "alabama-state-bar" }).status).toBe("unresolved");
});

it("preserves captured revisions, stored edits, reload and unrelated Sites", async () => {
  const captured = resolvePrototypeLibrary(db, "isitrust", "before-edit");
  const unrelated = resolveEffectiveSite(db, "asce");
  const edited = structuredClone(db);
  const row = edited.configurationValues.find(row => row.key === "isitrust.oo-professional.journey-residency")!;
  if (!isResidencyPolicy(row.value)) throw new Error("Missing residency policy");
  row.value.allowedJurisdictions = row.value.allowedJurisdictions.filter(code => code !== "US-UT");
  const adapter = new LocalStorageAdapter(edited);
  const revision = await createPortalDataRepository(adapter).open();
  expect(resolveNormalizedResidency(revision.resolveSite("isitrust").site, "oo-professional", "member", { jurisdiction: "US-UT" }).allowed).toBe(false);
  const reloaded = await createPortalDataRepository(adapter).open();
  expect(resolveNormalizedResidency(reloaded.resolveSite("isitrust").site, "oo-professional", "member", { jurisdiction: "US-UT" }).allowed).toBe(false);
  expect(resolveNormalizedResidency(captured.site, "oo-professional", "member", { jurisdiction: "US-UT" }).allowed).toBe(true);
  expect(reloaded.resolveSite("asce").site).toEqual(unrelated);
});
