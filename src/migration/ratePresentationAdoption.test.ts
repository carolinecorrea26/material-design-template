import { libraryMetadata } from "../domain/provenance";
import { expect, it, vi } from "vitest";
import { webcrypto } from "node:crypto";
import { createReviewedMigrationDatabase, createMigrationDatabase } from "./fixtures";
import { applyRatePresentationAdoption } from "./ratePresentationAdoption";
import { validateMigrationDatabase } from "./integrity";
import { resolveEffectiveSite } from "../domain/effectiveSite";
import { isReferenceRateTable, resolveRatePresentation } from "../domain/ratePresentation";
import { LocalStorageAdapter } from "../persistence/localAdapter";
import { createPortalDataRepository } from "../repositories/portalDataRepository";
const db = createReviewedMigrationDatabase();
it("defaults PRASE to No and forces CSEA hero presentation without changing the baseline", () => {
  expect(resolveRatePresentation(resolveEffectiveSite(db, "csea"), "di-ltd")).toMatchObject({ status: "resolved", praseConfigured: false, quoteToolEnabled: false, coverageQuoteEnabled: false, hideCalculatedRates: true, homePageVariant: "hero-image", rateArea: "reference-link", referenceTable: { kind: "html-table" } });
  expect(resolveRatePresentation(resolveEffectiveSite(createMigrationDatabase(), "nso"), "li-term")).toMatchObject({ praseConfigured: false });
});
it("independently controls quote options for PRASE-capable clients", () => {
  const site = resolveEffectiveSite(db, "nso");
  expect(resolveRatePresentation(site, "li-term")).toMatchObject({ praseConfigured: true, quoteToolEnabled: true, coverageQuoteEnabled: true, homePageVariant: null, rateArea: "quote-capable" });
  site.configuration.ratePresentationPolicies[0].value = { version: 1, praseConfigured: true, quoteToolEnabled: false, coverageQuoteEnabled: true };
  expect(resolveRatePresentation(site, "li-term")).toMatchObject({ quoteToolEnabled: false, coverageQuoteEnabled: true });
  site.configuration.ratePresentationPolicies[0].value = { version: 1, praseConfigured: false, quoteToolEnabled: true, coverageQuoteEnabled: true };
  expect(resolveRatePresentation(site, "li-term")).toMatchObject({ quoteToolEnabled: false, coverageQuoteEnabled: false, hideCalculatedRates: true, homePageVariant: "hero-image" });
});
it("uses a reference link only when a valid table is configured and PRASE is off", () => {
  const site = resolveEffectiveSite(db, "csea");
  const table = { version: 1, title: "Reference rates", kind: "html-table", columns: ["Age", "Rate"], rows: [["18–29", "$5"]] };
  site.configuration.products[0].referenceRateTables = [];
  site.configuration.products[0].referenceRateTables.push({ key: "reference", value: table, provenance: [] });
  expect(resolveRatePresentation(site, "di-ltd")).toMatchObject({ rateArea: "reference-link", referenceTable: table, hideCalculatedRates: true });
  site.configuration.ratePresentationPolicies[0].value = { version: 1, praseConfigured: true, quoteToolEnabled: true, coverageQuoteEnabled: true };
  expect(resolveRatePresentation(site, "di-ltd")).toMatchObject({ rateArea: "quote-capable", referenceTable: null });
});
it("rejects invalid or ambiguous configuration and unsafe or malformed reference assets", () => {
  const site = resolveEffectiveSite(db, "csea");
  site.configuration.ratePresentationPolicies[0].value = { version: 2 };
  expect(resolveRatePresentation(site, "di-ltd")).toMatchObject({ status: "unresolved", hideCalculatedRates: true, referenceTable: null });
  for (const url of ["javascript:alert(1)", "data:text/html,test", "//other.example/file.pdf", "https://user:secret@example.com/file.pdf"]) expect(isReferenceRateTable({ version: 1, title: "Rates", kind: "pdf", url })).toBe(false);
  for (const kind of ["pdf", "image"]) expect(isReferenceRateTable({ version: 1, title: "Rates", kind, url: "/reference/rates.pdf" })).toBe(true);
  expect(isReferenceRateTable({ version: 1, title: "Rates", kind: "html-table", columns: ["Age", "Rate"], rows: [["18"]] })).toBe(false);
});
it("stores client settings deterministically and resolves a client table through one captured revision", async () => {
  vi.stubGlobal("crypto", webcrypto);
  expect(validateMigrationDatabase(db)).toEqual([]);
  const copy = structuredClone(db);
  applyRatePresentationAdoption(copy);
  const sorted = (value: typeof db) => Object.fromEntries(Object.entries(value).map(([table, rows]) => [table, [...rows].sort((a,b) => a.id.localeCompare(b.id))]));
  expect(sorted(copy)).toEqual(sorted(db));
  const definition = copy.configurationDefinitions.find(row => row.key === "rates.reviewed-presentation")!;
  const value = copy.configurationValues.find(row => row.key === "rates.reviewed-presentation.csea")!;
  copy.configurationValues = copy.configurationValues.filter(row => row.configurationKey !== "csea.di-ltd.provisional-reference-table");
  copy.configurationDefinitions.push({ ...definition, ...libraryMetadata("configurationDefinitions", "reference", "test fixture"), id: "reference", key: "reference", definition: { path: null, metadata: {}, target: { kind: "product-reference-rate-table", productKey: "di-ltd" } } });
  copy.configurationValues.push({ ...value, ...libraryMetadata("configurationValues", "reference", "test fixture"), id: "reference", key: "reference", configurationKey: "reference", value: { version: 1, title: "CSEA reference rates", kind: "pdf", url: "/reference/csea.pdf" } });
  expect(validateMigrationDatabase(copy)).toEqual([]);
  const revision = await createPortalDataRepository(new LocalStorageAdapter(copy)).open();
  expect(resolveRatePresentation(revision.resolveSite("csea").site, "di-ltd")).toMatchObject({ rateArea: "reference-link", referenceTable: { kind: "pdf", url: "/reference/csea.pdf" } });
});
