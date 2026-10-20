import { expect, it, vi } from "vitest";
import { webcrypto } from "node:crypto";
import { createReviewedMigrationDatabase } from "./fixtures";
import { applyResidencyAdoption } from "./residencyAdoption";
import { mcrSource } from "./mcr";
import { validateMigrationDatabase } from "./integrity";
import { resolveEffectiveSite } from "../domain/effectiveSite";
import { resolveNormalizedResidency } from "../domain/residencyPolicy";
import { LocalStorageAdapter } from "../persistence/localAdapter";
import { createPortalDataRepository } from "../repositories/portalDataRepository";

const db = createReviewedMigrationDatabase();
const decide = (siteKey: string, productKey: string, jurisdiction?: string, activeMilitary?: boolean) => resolveNormalizedResidency(resolveEffectiveSite(db, siteKey), productKey, "member", { jurisdiction, activeMilitary });
it("uses the provisional CSEA allowlist and rejects excluded and foreign jurisdictions", () => {
  for (const code of ["NY", "NJ", "VT", "PA", "CT"]) expect(decide("csea", "di-ltd", `US-${code}`).allowed).toBe(true);
  for (const code of ["US-CA", "US-PR", "CA-ON"]) expect(decide("csea", "di-ltd", code)).toMatchObject({ status: "resolved", allowed: false, provisional: true });
  expect(decide("csea", "di-ltd")).toMatchObject({ status: "needs-information", allowed: false });
});
it("keeps standard and GI life filing restrictions distinct", () => {
  expect(decide("waepa", "li-group-term", "US-NY", false).allowed).toBe(false);
  expect(decide("waepa-gi", "li-group-term", "US-NY", false).allowed).toBe(true);
  expect(decide("waepa-gi", "li-group-term", "US-LA", false).allowed).toBe(false);
  expect(decide("waepa", "li-group-term", "US-PR", false).allowed).toBe(true);
  expect(decide("waepa-gi", "li-group-term", "US-VI", false).allowed).toBe(false);
});
it("excludes territories from WAEPA disability without inheriting life restrictions", () => {
  for (const code of ["PR", "GU", "VI", "AS", "MP"]) expect(decide("waepa", "di-short-term", `US-${code}`, false).allowed).toBe(false);
  expect(decide("waepa", "di-short-term", "US-NY", false).allowed).toBe(true);
  expect(decide("waepa", "di-short-term", "US-NH", false).allowed).toBe(false);
  expect(decide("waepa-gi", "di-short-term", "US-NY", false).allowed).toBe(false);
});
it("requires military facts, rejects active military and malformed jurisdiction facts", () => {
  expect(decide("waepa-gi", "li-group-term", "US-NY")).toMatchObject({ status: "needs-information", allowed: false });
  expect(decide("waepa", "li-group-term", "US-VA", true).allowed).toBe(false);
  expect(decide("waepa-gi", "li-group-term", "NY", false)).toMatchObject({ status: "unresolved", allowed: false });
  expect(decide("abe", "li-term", "US-NY", false)).toMatchObject({ status: "resolved", allowed: true, provisional: true });
});
it("checks persisted contracts and source evidence and remains idempotent", () => {
  expect(validateMigrationDatabase(db)).toEqual([]);
  const copy = structuredClone(db);
  applyResidencyAdoption(copy, mcrSource.cells);
  const sorted = (value: typeof db) => Object.fromEntries(Object.entries(value).map(([table, rows]) => [table, [...rows].sort((a, b) => a.id.localeCompare(b.id))]));
  expect(sorted(copy)).toEqual(sorted(db));
  const cells = structuredClone(mcrSource.cells);
  cells.find(cell => cell.sheet === "Main" && cell.cell === "N386")!.value = "NY";
  expect(() => applyResidencyAdoption(copy, cells)).toThrow("Residency source changed");
  expect(sorted(copy)).toEqual(sorted(db));
  copy.configurationValues.find(row => row.key === "waepa-gi.li-group-term.reviewed-residency")!.value = { version: 2 };
  expect(validateMigrationDatabase(copy).some(error => error.includes("Invalid executable residency"))).toBe(true);
  expect(resolveNormalizedResidency(resolveEffectiveSite(copy, "waepa-gi"), "li-group-term", "member", { jurisdiction: "US-NY", activeMilitary: false })).toMatchObject({ status: "unresolved", allowed: false });
});
it("resolves residency through one captured persisted Library revision", async () => {
  vi.stubGlobal("crypto", webcrypto);
  const revision = await createPortalDataRepository(new LocalStorageAdapter(db)).open();
  const result = revision.resolveSite("waepa-gi");
  expect(result.revision).toBe(revision.query("configurationValues").revision);
  expect(resolveNormalizedResidency(result.site, "li-group-term", "member", { jurisdiction: "US-NY", activeMilitary: false })).toMatchObject({ allowed: true, status: "resolved" });
});
