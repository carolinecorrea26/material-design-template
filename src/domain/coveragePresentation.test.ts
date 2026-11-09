import { describe, expect, it } from "vitest";
import { coverages } from "../config/coverages";
import { getCoverageAmountControl, isCoverageProductOrder, orderCoveragePresentation } from "./coveragePresentation";
import { captureCoverageAmountParameters, capturedCoverageEntryScope, restoreCoverageEntryScope } from "../config/client/coverageProductScope";

describe("coverage presentation", () => {
  const term = { ...coverages.find(product => product.id === "li-term")!, gNumber: { primary: "G-10500-1" } };
  it("resolves ordered, configured and campaign amount controls without expanding allowed amounts", () => {
    const available = [20000, 100000, 200000];
    const settings = { amountSelection: { order: "maximum-to-minimum" as const, defaultMode: "specified" as const, defaultValue: 200000, locked: true } };
    expect(getCoverageAmountControl(term, "member", available, settings, {})).toEqual({ choices: [200000, 100000, 20000], defaultAmount: 200000, locked: true });
    expect(getCoverageAmountControl(term, "member", available, settings, { amt: "G-10500-1_100000" })).toMatchObject({ defaultAmount: 100000, locked: true });
    for (const amt of ["G-10500-1_9999999", "G-10500-1_-20000", "G-10500-1_100000,G-10500-1_200000"]) {
      expect(getCoverageAmountControl(term, "member", available, {}, { amt, dprods: "G-10500-1" })).toMatchObject({ defaultAmount: 20000, locked: false });
    }
    expect(getCoverageAmountControl(term, "child", [10000], {}, { amt: "G-10500-1_200000", dprods: "G-10500-1" })).toMatchObject({ choices: [10000], defaultAmount: 10000, locked: false });
    expect(getCoverageAmountControl(term, "member", [], settings, { amt: "G-10500-1_200000", dprods: "G-10500-1" })).toEqual({ choices: [], defaultAmount: undefined, locked: false });
    expect(available).toEqual([20000, 100000, 200000]);
  });
  it("allows product/applicant amount settings to override the shared Site settings", () => {
    const product = { ...term, requirementPolicy: [{ configuration: "coverage-amount-order", product: term.id, applicants: ["spouse" as const], value: "maximum-to-minimum", source: "test effective-site assignment" }] };
    expect(getCoverageAmountControl(product, "member", [20000, 100000], {}, {}).choices).toEqual([20000, 100000]);
    expect(getCoverageAmountControl(product, "spouse", [20000, 100000], {}, {}).choices).toEqual([100000, 20000]);
  });
  it("preserves amount campaign controls across routes/resume and clears them for a new campaign", () => {
    const previous = window.location.href;
    try {
      window.sessionStorage.clear();
      window.history.replaceState(null, "", "/?amt=G-10500-1_200000&dprods=G-10500-1");
      captureCoverageAmountParameters("test");
      const scope = capturedCoverageEntryScope("test");
      expect(scope).toEqual({ amt: "G-10500-1_200000", dprods: "G-10500-1" });
      window.history.replaceState(null, "", "/coverage");
      expect(capturedCoverageEntryScope("test")).toEqual(scope);
      restoreCoverageEntryScope("test", { amt: "G-10500-1_100000" });
      expect(capturedCoverageEntryScope("test")).toEqual({ amt: "G-10500-1_100000" });
      window.history.replaceState(null, "", "/?category=li");
      captureCoverageAmountParameters("test");
      expect(capturedCoverageEntryScope("test")).toEqual({});
    } finally { window.sessionStorage.clear(); window.history.replaceState(null, "", previous); }
  });
  it("uses explicit global defaults, ignoring stored featured flags and appending unlisted products", () => {
    const products = [...coverages, { ...coverages.find(p => p.id === "sh-hospital-income")!, id: "hospital-indemnity", name: "Hospital Indemnity" }].reverse().map(p => ({ ...p, featured: true }));
    const result = orderCoveragePresentation(products, {});
    expect(result.categories).toEqual(["LI", "AD", "DI", "OO", "SH"]);
    expect(result.products.filter(p => p.categoryId === "LI").slice(0, 5).map(p => p.id)).toEqual(["li-term", "li-group-term", "li-10yr", "li-15yr", "li-20yr"]);
    expect(result.products.filter(p => p.categoryId === "DI").slice(0, 4).map(p => p.id)).toEqual(["di-ltd", "di-ltd-plus", "di-mtd", "di-short-term"]);
    expect(result.products.filter(p => p.categoryId === "SH").map(p => p.id)).toEqual(["sh-critical-illness", "sh-hospital-money", "sh-hospital-income", "hospital-indemnity"]);
    expect(result.products.some(p => p.featured)).toBe(false);
  });
  it("keeps defaults stable when product labels change and input arrives in another order", () => {
    const products = coverages.slice().reverse().map(product => ({ ...product, name: "Renamed product" }));
    const result = orderCoveragePresentation(products, {});
    expect(result.products.filter(product => product.categoryId === "LI").slice(0, 5).map(product => product.id)).toEqual(["li-term", "li-group-term", "li-10yr", "li-15yr", "li-20yr"]);
    expect(result.products.filter(product => product.categoryId === "DI").slice(0, 4).map(product => product.id)).toEqual(["di-ltd", "di-ltd-plus", "di-mtd", "di-short-term"]);
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
  it("uses optional configured product order before defaults, with URL featured products and categories taking priority", () => {
    const config = { categoryOrder: ["LI", "DI"] as Array<"LI" | "DI">, productOrder: ["li-20yr", "li-15yr", "li-10yr", "li-term", "di-short-term", "di-ltd"] as const };
    const products = coverages.map(product => product.id === "di-ltd" ? { ...product, gNumber: { primary: "G-TEST-1" } } : product);
    const editable = { ...config, productOrder: [...config.productOrder] };
    expect(orderCoveragePresentation(products, editable).products.filter(row => row.categoryId === "LI").slice(0, 4).map(row => row.id)).toEqual(["li-20yr", "li-15yr", "li-10yr", "li-term"]);
    const featured = orderCoveragePresentation(products, editable, "G-TEST-1");
    expect(featured.categories[0]).toBe("DI"); expect(featured.products[0].id).toBe("di-ltd"); expect(featured.products[1].id).toBe("di-short-term");
    expect(orderCoveragePresentation(products, editable, "unknown").products.map(row => row.id)).toEqual(orderCoveragePresentation(products, editable).products.map(row => row.id));
    expect(orderCoveragePresentation(products, { productOrder: [] }).products.map(row => row.id)).toEqual(orderCoveragePresentation(products, {}).products.map(row => row.id));
    expect(isCoverageProductOrder(["li-term", "li-term"])).toBe(false); expect(isCoverageProductOrder(["unknown"], ["li-term"])).toBe(false);
  });

});
