import { coverages } from "../coverages";
import { describe, expect, it } from "vitest";
import { getEffectiveSiteConfig } from "../../data/registry";
import { homeQuotePlacements, homeQuoteFieldIds } from "./homeQuoteFields";
import { pageFieldOrder } from "./pageFieldOrder";
import { fieldCatalog } from ".";
import { createMigrationDatabase } from "../../migration/fixtures";

describe("Home quote placements", () => {
  const base = getEffectiveSiteConfig("asce");
  it("reuses canonical Eligibility/Coverage fields and migrates their Home relationships", () => {
    const db = createMigrationDatabase();
    expect(pageFieldOrder.home).toEqual(homeQuoteFieldIds);
    for (const id of homeQuoteFieldIds) {
      expect(fieldCatalog[id]).toBeDefined();
      expect([...(pageFieldOrder.eligibility ?? []), ...(pageFieldOrder.coverage ?? [])]).toContain(id);
      expect(db.pageFields.some((row) => row.pageKey === "home" && row.fieldKey === id)).toBe(true);
    }
  });
  it.each(["default", "quoteFirst"] as const)("includes eligibility and category questions for %s", (homePageVariant) => {
    const placements = homeQuotePlacements({ ...base, coverages: { ...base.coverages, enabled: coverages.map((p) => p.id), hideSmokerQuestion: false }, features: { ...base.features, defaultTemplate: "multi", homePageVariant } });
    expect(placements.filter((p) => !p.hidden).map((p) => p.fieldId)).toEqual(homeQuoteFieldIds);
  });
  it.each(["hero-image", "welcome-back"] as const)("has no quote placements for %s", (homePageVariant) => {
    expect(homeQuotePlacements({ ...base, features: { ...base.features, homePageVariant } }).every((p) => p.hidden)).toBe(true);
  });
  it("respects single template, unavailable categories and hidden nicotine", () => {
    expect(homeQuotePlacements({ ...base, features: { ...base.features, defaultTemplate: "single" } }).every((p) => p.hidden)).toBe(true);
    const placements = homeQuotePlacements({ ...base, features: { defaultTemplate: "multi", homePageVariant: "quoteFirst" }, coverages: { ...base.coverages, enabled: [], hideSmokerQuestion: true } });
    expect(placements.filter((p) => !p.hidden).map((p) => p.fieldId)).toEqual(homeQuoteFieldIds.slice(0, 3));
  });
});
