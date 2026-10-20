import { describe, expect, it, vi } from "vitest";
import { webcrypto } from "node:crypto";
import { createMigrationDatabase, createReviewedMigrationDatabase } from "./fixtures";
import { applyActiveSiteNumericAdoption } from "./activeSiteNumericAdoption";
import { parseUnqualifiedAge } from "./activeSiteEligibilityAdoption";
import { mcrSource } from "./mcr";
import { resolveEffectiveEligibility, resolveEffectiveSite, resolveEffectiveUnderwriting } from "../domain/effectiveSite";
import { validateNormalizedCoverageAmount } from "../domain/normalizedCoverageAmounts";
import { inspectAsceBusinessDecisions } from "../domain/asceBusinessDecisions";
import { validateMigrationDatabase } from "./integrity";
import { LocalStorageAdapter } from "../persistence/localAdapter";
import { createPortalDataRepository } from "../repositories/portalDataRepository";

const reviewed = createReviewedMigrationDatabase();

describe("active Site source-backed numeric dimensions", () => {
  it.each([
    ["abe", "li-term", "member", 20000, 2000000, 10000],
    ["abe", "li-50plus", "spouse", 25000, 100000, 1000],
    ["ama", "li-15yr", "member", 100000, 4000000, 25000],
    ["asce", "li-add", "spouse", 50000, 250000, 50000],
    ["avma", "li-add", "member", 10000, 200000, 10000],
    ["avma", "sh-hospital-income", "child", 100, 200, 50],
  ] as const)("checks %s %s %s sourced boundaries and increments", (siteKey, product, applicant, minimum, maximum, increment) => {
    const site = resolveEffectiveSite(reviewed, siteKey);
    for (const amount of [minimum, minimum + increment, maximum]) expect(validateNormalizedCoverageAmount(site, product, applicant, amount)).toMatchObject({ status: "resolved", allowed: true });
    for (const amount of [minimum - 1, minimum + 1, maximum + increment, NaN, Infinity]) expect(validateNormalizedCoverageAmount(site, product, applicant, amount).allowed).toBe(false);
  });
  it("adopts exact scalar plan identities and preserves multiline submission evidence for role review", () => {
    const identifiers = (siteKey: string, productKey: string) => reviewed.productIdentifiers.filter(identifier => identifier.siteKey === siteKey && identifier.productKey === productKey).map(identifier => ({ kind: identifier.kind, value: identifier.definition }));
    expect(identifiers("ama", "li-15yr")).toContainEqual({ kind: "planCode", value: { primary: "103" } });
    expect(identifiers("ama", "li-term")).toContainEqual({ kind: "planCode", value: { primary: "101-a" } });
    expect(identifiers("ama", "li-preferred")).toContainEqual({ kind: "planCode", value: { primary: "101-b" } });
    expect(identifiers("isitrust", "li-50plus")).toContainEqual({ kind: "planCode", value: { primary: "101" } });
    expect(reviewed.productIdentifiers.some(identifier => identifier.siteKey === "avma" && identifier.productKey === "li-add" && identifier.key.includes("reviewed-identifier"))).toBe(false);
  });
  it("uses actual fixed/list child benefits and removes unavailable applicant assignments", () => {
    const ama = resolveEffectiveSite(reviewed, "ama");
    expect(validateNormalizedCoverageAmount(ama, "li-10yr", "child", 25000).allowed).toBe(true);
    expect(validateNormalizedCoverageAmount(ama, "li-10yr", "child", 5000).allowed).toBe(false);
    expect(validateNormalizedCoverageAmount(ama, "li-term", "child", 25000).allowed).toBe(false);
    const avma = resolveEffectiveSite(reviewed, "avma");
    expect(validateNormalizedCoverageAmount(avma, "li-10yr", "child", 5000).allowed).toBe(true);
    expect(validateNormalizedCoverageAmount(avma, "li-10yr", "child", 10000).allowed).toBe(true);
    expect(validateNormalizedCoverageAmount(avma, "li-10yr", "child", 7500).allowed).toBe(false);
  });
  it("adopts unqualified entry ages while retaining exact ASCE approvals", () => {
    const site = resolveEffectiveSite(reviewed, "abe");
    expect(resolveEffectiveEligibility(site, "li-term", "member", 16)).toMatchObject({ status: "resolved", eligible: false });
    expect(resolveEffectiveEligibility(site, "li-term", "member", 17)).toMatchObject({ status: "resolved", eligible: true });
    expect(resolveEffectiveEligibility(site, "li-term", "member", 75)).toMatchObject({ status: "resolved", eligible: true });
    expect(resolveEffectiveEligibility(site, "li-term", "member", 76)).toMatchObject({ status: "resolved", eligible: false });
    expect(resolveEffectiveEligibility(site, "li-term", "member")).toMatchObject({ status: "needs-information" });
    expect(inspectAsceBusinessDecisions(reviewed).every(decision => decision.approved)).toBe(true);
    expect(resolveEffectiveSite(reviewed, "asce").products.find(product => product.productKey === "li-10yr")!.applicants.find(applicant => applicant.applicantKey === "member")!.constraints!.value).toMatchObject({ minimumAgeYears: 18, maximumAgeYears: 69 });
    for (const text of ["17 - through age 64 59 (NYL-4545)", "17 - through age 69 59", "14 days through age 26", "18-39, except active military"]) expect(parseUnqualifiedAge(text)).toBeNull();
  });
  it("executes GI military and age exclusions, requiring missing military facts", () => {
    const gi = resolveEffectiveSite(reviewed, "waepa-gi");
    expect(resolveEffectiveEligibility(gi, "li-group-term", "member", 20)).toMatchObject({ status: "needs-information" });
    for (const ageYears of [18, 39]) expect(resolveEffectiveEligibility(gi, "li-group-term", "member", { ageYears, activeMilitary: false })).toMatchObject({ status: "resolved", eligible: true });
    for (const ageYears of [17, 40]) expect(resolveEffectiveEligibility(gi, "li-group-term", "member", { ageYears, activeMilitary: false })).toMatchObject({ status: "resolved", eligible: false });
    expect(resolveEffectiveEligibility(gi, "li-group-term", "member", { ageYears: 20, activeMilitary: true })).toMatchObject({ status: "resolved", eligible: false });
    expect(resolveEffectiveUnderwriting(gi, "li-group-term", "member", { ageYears: 20, activeMilitary: false }, 100000)).toMatchObject({ status: "resolved", pathway: "GI" });
    expect(resolveEffectiveUnderwriting(gi, "li-group-term", "member", { ageYears: 20, activeMilitary: true }, 100000)).toMatchObject({ status: "ineligible" });
    const changed = structuredClone(reviewed);
    changed.configurationValues.find(row => row.key === "waepa-gi.li-group-term.military-exclusion")!.value = [{ fact: "unsupported", equals: false }];
    expect(resolveEffectiveEligibility(resolveEffectiveSite(changed, "waepa-gi"), "li-group-term", "member", { ageYears: 20, activeMilitary: false })).toMatchObject({ status: "unresolved" });
  });
  it("validates every canonical relationship and rejects changed evidence before mutation", () => {
    expect(validateMigrationDatabase(reviewed)).toEqual([]);
    const baseline = createMigrationDatabase();
    const before = JSON.stringify(baseline);
    expect(() => applyActiveSiteNumericAdoption(baseline, mcrSource.cells.map(cell => cell.sheet === "Main" && cell.cell === "J120" ? { ...cell, value: 5000 } : cell))).toThrow("Numeric adoption source changed");
    expect(JSON.stringify(baseline)).toBe(before);
    expect(reviewed.requirementTargets.filter(row => row.targetKey === "abe.li-term.reviewed-numeric.member.pattern.band").map(row => row.targetColumn).sort()).toEqual(["increment", "maximum", "minimum"]);
  });
  it("reads the adopted amounts and military guard from the same stored revision", async () => {
    vi.stubGlobal("crypto", webcrypto);
    try {
      const repository = createPortalDataRepository(new LocalStorageAdapter(JSON.parse(JSON.stringify(reviewed))));
      const revision = await repository.open();
      expect(validateNormalizedCoverageAmount(revision.resolveSite("ama").site, "li-15yr", "member", 4000000).allowed).toBe(true);
      expect(resolveEffectiveEligibility(revision.resolveSite("waepa-gi").site, "li-group-term", "member", { ageYears: 39, activeMilitary: true })).toMatchObject({ eligible: false });
      expect(revision.query("configurationValues", { filters: { key: "waepa-gi.li-group-term.military-exclusion" } }).revision).toBe(revision.resolveSite("waepa-gi").revision);
    } finally { vi.unstubAllGlobals(); }
  });
});
