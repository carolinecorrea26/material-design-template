import { describe, expect, it } from "vitest";
import { getOrderedLibraryPages, ruleRelations, ruleDisplayType } from "./libraryInspection";
import { libraryHref } from "./LibraryLink";
import { templateStandards } from "../../../content/docs/templateStandards";
import { libraryRepository } from "../../../repositories/libraryRepository";
import { getSiteDetailsPageOrder } from "../../../config/resolvers/resolveClientPages";
import { formFlow } from "../../../config/formFlow";

describe("Library inspection contracts", () => {
  it("derives applicant order without mutating catalog order", () => {
    const original = [...libraryRepository.read("pages")];
    const orderedLibraryPages = getOrderedLibraryPages();
    expect(orderedLibraryPages.map(p => p.id)).toEqual(getSiteDetailsPageOrder().filter(id => { const p = original.find(p => p.id === id)!; return Boolean(p); }));
    expect(orderedLibraryPages.filter(p => formFlow.includes(p.id)).map(p => p.id)).toEqual(formFlow);
    expect(libraryRepository.read("pages")).toEqual(original);
  });
  it("retains scope and Site while discarding unrelated filters", () => {
    expect(libraryHref("fields", new URLSearchParams("site=asce&scope=effective&type=Validation"), { pages: "membership" })).toBe("/admin-center/library/fields?site=asce&pages=membership&table=fields");
  });
  it("never infers rule relationships or classification from prose", () => {
    const rule = { id: "rule-test" as const, area: "Unknown", rule: "membership coverage", behavior: "first-name", ref: "" };
    expect(ruleRelations(rule)).toEqual([]);
    expect(ruleDisplayType(rule)).toBe("Unclassified");
  });
  it("keeps curated standards stable, sourced and outside configurations", () => {
    expect(templateStandards.map(s => s.id)).toEqual([...Array.from({ length: 16 }, (_, i) => `TS-${String(i + 1).padStart(3, "0")}`), ...Array.from({ length: 4 }, (_, i) => `TS-SP-${String(i + 1).padStart(3, "0")}`)]);
    expect(templateStandards.every(s => s.source && s.classification && s.status)).toBe(true);
    expect(libraryRepository.read("configurationsData").some(c => String(c.id).startsWith("TS-"))).toBe(false);
  });
});
