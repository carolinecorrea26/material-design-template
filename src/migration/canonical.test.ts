import { describe, expect, it } from "vitest";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { createMigrationDatabase, migrationSiteKeys } from "./fixtures";
import { canonicalSchemaSql, expandedTableSpecs } from "./canonical";
import { validateMigrationDatabase } from "./integrity";
import { canonicalReference, mcrCoverageReport, mcrSource, parseAmount } from "./mcr";
import { libraryDisplayId } from "../domain/provenance";
import { resolveSiteCoverage } from "../data/resolvers";
import { tableNames } from "../persistence/tableNames";
import { exportLibraryCsv, exportLibraryXml } from "../services/libraryExport";

const db = createMigrationDatabase();
describe("canonical corrective Phase 4 gates", () => {
  it("accounts for every workbook and checklist cell, with explicit reasons and valid destinations", () => {
    const sheetNames = new Map(db.sourceSheets.map(s => [s.key, s.name]));
    const references = new Map(db.sourceRequirements.map(r => [`${sheetNames.get(r.sheetKey)}!${r.cell}`, r]));
    expect(db.sourceSheets).toHaveLength(23);
    for (const source of mcrSource.cells) {
      const requirement = references.get(`${source.sheet}!${source.cell}`);
      expect(requirement, `${source.sheet}!${source.cell}`).toBeDefined();
      expect(requirement!.value).toEqual(source.value);
      expect(requirement!.reason.length).toBeGreaterThan(0);
    }
    for (const source of mcrSource.checklist) expect(references.has(`${source.sheet}!${source.cell}`)).toBe(true);
    expect(validateMigrationDatabase(db)).toEqual([]);
    for (const sheet of mcrSource.sheets) expect(db.sourceRequirements.filter(r => r.sheetKey === db.sourceSheets.find(s => s.name === sheet.name)!.key).length).toBeGreaterThanOrEqual(sheet.cells);
  });
  it("keeps known TBDs and image-only requirements unresolved; does not assert MCR parity", () => {
    for (const [sheet, cell, expected] of [["Main", "AC10", "REQUIRES_AM_CONFIRMATION"], ["QD LI", "I99", "SOURCE_TBD"], ["Main", "AQ356", "REQUIRES_CLIENT_CONFIRMATION"]]) {
      const requirement = db.sourceRequirements.find(r => r.sheetKey === db.sourceSheets.find(s => s.name === sheet)!.key && r.cell === cell)!;
      expect(requirement.classification).toBe(expected);
    }
    expect(db.sourceRequirements.filter(r => r.cell === "embedded-images").length).toBeGreaterThan(0);
    expect(mcrCoverageReport(db).phase5Ready).toBe(true);
    expect(mcrCoverageReport(db).phase6Ready).toBe(true);
  });
  it("keeps non-prototype catalogs independent of runnable Sites", () => {
    expect(db.products.filter(p => p.key.startsWith("mcr.")).length).toBeGreaterThan(200);
    expect(db.sites.map(s => s.key).sort()).toEqual([...migrationSiteKeys].sort());
    expect(db.siteProducts.some(p => p.productKey.startsWith("mcr."))).toBe(false);
    expect(db.riders.filter(r => r.key.startsWith("mcr.")).every(r => r.definition.premiumFactor === null)).toBe(true);
  });
  it("seeds all amount families, Patterns, Flags, and QD outcomes with structured links", () => {
    expect(db.patterns.map(p => p.key)).toEqual(canonicalReference.seedPatterns.map(p => p.key));
    expect(db.flagDefinitions.map(f => f.key)).toEqual(expect.arrayContaining(canonicalReference.seedFlags.map(f => f.key)));
    expect(db.flagValues.map(f => f.value)).toEqual(["approve", "reject", "refer", "error"]);
    expect(db.coverageAmountPatterns.filter(p => p.key.startsWith("family."))).toHaveLength(15);
    expect(db.patternRules.length).toBeGreaterThan(4);
    expect(db.ruleFlags.some(r => r.flagKey === "site.has-product-rates" && r.value === false)).toBe(true);
    expect(db.structuredRuleActions.some(r => r.actionType === "suppress-rates")).toBe(true);
  });
  it("preserves every prototype amount selection and derivation in explicit relational rows", () => {
    for (const siteKey of migrationSiteKeys) for (const product of resolveSiteCoverage(siteKey)) {
      const rules = db.productAmountRules.filter(r => r.siteKey === siteKey && r.productKey === product.effective.id).sort((a, b) => a.position - b.position);
      const expected = product.effective.coverageAmounts ?? [];
      expect(rules.length, `${siteKey}.${product.effective.id}`).toBe(expected.length);
      for (const [index, assignment] of expected.entries()) {
        const rule = rules[index], pattern = db.coverageAmountPatterns.find(p => p.key === rule.amountPatternKey)!;
        expect(rule.applicantTypeKey).toBe(assignment.scope?.applicantType ?? null);
        expect(rule.applicantClass).toBe(assignment.scope?.applicantClassId ?? null);
        const ranges = db.amountBands.filter(b => b.amountPatternKey === pattern.key).sort((a, b) => a.position - b.position);
        expect(ranges.map(r => [r.minimum, r.maximum, r.increment])).toEqual((assignment.selections ?? []).flatMap(s => s.type === "range" ? [[s.min, s.max, s.increment]] : []));
        const options = db.amountOptions.filter(o => o.amountPatternKey === pattern.key).sort((a, b) => a.position - b.position);
        expect(options.map(o => [o.value, o.label])).toEqual((assignment.selections ?? []).flatMap(s => s.type === "amountList" ? s.values.map(v => [String(v), String(v)]) : s.type === "optionList" ? s.options.map(o => [o.value, o.label]) : []));
        expect(pattern.baseApplicantKey).toBe(assignment.derivedFrom?.applicantType ?? null);
        expect(pattern.baseApplicantClass).toBe(assignment.derivedFrom?.applicantClassId ?? null);
        if (assignment.derivedFrom?.calculation.type === "percentage") expect(pattern.multiplier).toBe(assignment.derivedFrom.calculation.value / 100);
        if (assignment.derivedFrom?.calculation.type === "fixed") expect(pattern.minimum).toBe(assignment.derivedFrom.calculation.value);
      }
    }
  });
  it("preserves scoped underwriting bands except explicitly approved FUW decisions and retains benefit cap precedence", () => {
    for (const siteKey of migrationSiteKeys) for (const product of resolveSiteCoverage(siteKey)) {
      const bands = db.underwritingBands.filter(b => b.siteKey === siteKey && b.productKey === product.effective.id);
      expect(bands.map(b => [b.applicantTypeKey, b.applicantClass, b.minimumAge, b.maximumAge, b.minimumAmount, b.maximumAmount, b.minimumAmountExclusive, b.pathway])).toEqual((product.effective.underwritingBands ?? []).map(b => [b.scope.applicantType ?? null, b.scope.applicantClassId ?? null, b.minimumAgeYears, b.maximumAgeYears, b.minimumAmount, b.maximumAmount, b.minimumAmountExclusive ?? false, b.underwritingType ?? (siteKey === "asce" && b.status === "underwriting-unspecified" ? "FUW" : null)]));
      const limit = db.aggregateLimits.find(l => l.siteKey === siteKey && l.productKey === product.effective.id);
      if (product.effective.requirements?.benefitLimit) {
        expect(limit!.maximum).toBe(product.effective.requirements.benefitLimit.defaultMaximum);
        expect(db.benefitCaps.filter(c => c.aggregateLimitKey === limit!.key).sort((a, b) => a.position - b.position).map(c => c.maximum)).toEqual(product.effective.requirements.benefitLimit.caps.map(c => c.maximum));
      }
    }
  });
  it("rejects orphan patterns, amounts, underwriting, flags and invalid provenance", () => {
    const changed = structuredClone(db);
    changed.patternRules[0].relatedKey = "missing";
    changed.productAmountRules[0].amountPatternKey = "missing";
    changed.underwritingBands[0].productKey = "missing";
    changed.flagDefinitions[0].providedBy = "uncontrolled-tag";
    changed.ruleFlags[0].value = "not-a-boolean";
    const errors = validateMigrationDatabase(changed);
    for (const token of ["pattern_rules", "product_amount_rules", "underwriting_bands", "provided_by", "Invalid flag value"]) expect(errors.some(e => e.includes(token)), token).toBe(true);
  });
  it("requires unique numeric display IDs and semantic keys independent of row order", () => {
    const changed = structuredClone(db);
    changed.patterns[1].displayId = changed.patterns[0].displayId;
    expect(validateMigrationDatabase(changed).some(e => e.includes("duplicate display_id"))).toBe(true);
    for (const [name, rows] of Object.entries(db)) if (tableNames[name as keyof typeof db] in expandedTableSpecs) for (const r of rows as unknown as Array<{key: string; displayId: number; providedBy: string | null}>) {
      expect(r.displayId).toBe(libraryDisplayId(name, r.key)); expect(r.providedBy).toBeNull();
    }
  });
  it("does not guess a mixed prose schedule or unspecified increment", () => {
    expect(parseAmount("$10,000 - $100,000")).toMatchObject({ amountType: "unspecified-increment", increment: null });
    expect(parseAmount("$10,000 - $100,000\nIncrement: $10,000")).toMatchObject({ amountType: "range", increment: 10000 });
    expect(parseAmount("$10,000 - $100,000; check with UW")).toBeNull();
    expect(parseAmount("TBD")).toBeNull();
  });
  it("exports the passed row order and XML relationships with safe escaping", () => {
    const table = { name: "Example & table", rows: [{ text: "=1+1" }, { text: '<hello> "world"' }], columns: [{ id: "text", label: "Text", value: (r: {text: string}) => r.text, relations: () => [{ table: "products", key: "p&1", label: "Product", displayId: 5 }] }] };
    expect(exportLibraryCsv(table)).toContain('"\'=1+1"');
    const xml = exportLibraryXml(table);
    expect(xml).toContain('key="p&amp;1" displayId="5"'); expect(xml).toContain("&lt;hello&gt;");
  });
  it("has no client-ID conditionals in new behavioral logic", () => {
    for (const file of ["src/migration/mcr.ts", "src/migration/normalizeCoverage.ts", "src/pages/admin/library/PatternsFlagsLibrary.tsx", "src/services/libraryExport.ts"]) expect(readFileSync(file, "utf8")).not.toMatch(/(?:clientId|clientKey|siteId|siteKey)\s*===?\s*["'](?:ama|asce|waepa)/);
  });
  it("exports the additive schema and deterministic coverage report for review", () => {
    if (process.env.MIGRATION_EXPORT_DIR) {
      const directory = resolve(process.env.MIGRATION_EXPORT_DIR); mkdirSync(directory, { recursive: true });
      writeFileSync(resolve(directory, "canonical.sql"), canonicalSchemaSql());
      writeFileSync(resolve(directory, "mcr-coverage.json"), JSON.stringify(mcrCoverageReport(db), null, 2) + "\n");
      writeFileSync(resolve(directory, "mcr-unresolved.json"), JSON.stringify(db.sourceRequirements.filter(r => r.classification !== "MAPPED" && r.classification !== "INTENTIONALLY_EXCLUDED"), null, 2) + "\n");
    }
  });
});
