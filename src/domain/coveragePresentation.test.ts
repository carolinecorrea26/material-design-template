import { describe, expect, it } from "vitest";
import { coverages } from "../config/coverages";
import { orderCoveragePresentation } from "./coveragePresentation";

describe("coverage presentation", () => {
  it("uses category and semantic product order, ignoring stored featured flags", () => {
    const products = [...coverages, { ...coverages.find(p => p.id === "sh-hospital-income")!, id: "hospital-indemnity", name: "Hospital Indemnity" }].reverse().map(p => ({ ...p, featured: true }));
    const result = orderCoveragePresentation(products, {});
    expect(result.categories).toEqual(["LI", "AD", "DI", "OO", "SH"]);
    expect(result.products.filter(p => p.categoryId === "LI").slice(0, 5).map(p => p.id)).toEqual(["li-term", "li-group-term", "li-10yr", "li-15yr", "li-20yr"]);
    expect(result.products.filter(p => p.categoryId === "DI").slice(0, 4).map(p => p.id)).toEqual(["di-ltd", "di-ltd-plus", "di-mtd", "di-short-term"]);
    expect(result.products.filter(p => p.categoryId === "SH").slice(0, 2).map(p => p.name)).toEqual(["Critical Illness", "Hospital Indemnity"]);
    expect(result.products.some(p => p.featured)).toBe(false);
  });
  it("honors configured category order and appends omitted defaults", () => {
    expect(orderCoveragePresentation(coverages, { categories: ["DI", "LI"] }).categories).toEqual(["DI", "LI", "AD", "OO", "SH"]);
    expect(orderCoveragePresentation(coverages, { categoryOrder: ["SH", "OO"] }).categories).toEqual(["SH", "OO", "LI", "AD", "DI"]);
  });
  it("prioritizes featured_prod by G-number over client ordering", () => {
    const products = coverages.map(p => p.id === "di-short-term" ? { ...p, gNumber: { primary: "G-0000-0" } } : p);
    const result = orderCoveragePresentation(products, { categoryOrder: ["SH", "LI"] }, "G-0000-0");
    expect(result.categories).toEqual(["DI", "SH", "LI", "AD", "OO"]);
    expect(result.products[0].id).toBe("di-short-term");
    expect(result.products[0].featured).toBe(true);
    expect(orderCoveragePresentation(products, {}, "unknown").categories).toEqual(["LI", "AD", "DI", "OO", "SH"]);
  });
});
