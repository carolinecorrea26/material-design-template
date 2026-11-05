import { afterEach, expect, it } from "vitest";
import { createReviewedMigrationDatabase } from "../migration/fixtures";
import { resolvePageCatalog } from "./pageCatalog";
import { installPrototypeLibrary, resolvePrototypeLibrary } from "./prototypeLibrary";
import { getActiveProgressSteps } from "../config/progressSteps";
import { getConfiguredPages, getPagePath } from "../config/pages";
import { getResolvedFormFlow, getNextFormPageId, getPreviousFormPageId } from "../config/formFlow";
import { storedApplicationPageRows } from "../pages/admin/library/storedLibraryModel";
import { getSitePagePrototypeUrl } from "../config/sitePrototype";
import { getGlobalPages, getSiteDetailsPageOrder } from "../config/resolvers/resolveClientPages";
import { resolveSitePages } from "../data/resolvers";
import { getLibraryPages, getOrderedLibraryPages } from "../pages/admin/library/libraryInspection";
import { libraryRepository } from "../repositories/libraryRepository";

const baseline = createReviewedMigrationDatabase();
afterEach(() => installPrototypeLibrary(null));

it("uses saved routes and Site order for the Library, preview links and applicant navigation", () => {
  const data = structuredClone(baseline);
  data.pages.find(page => page.key === "eligibility")!.definition.path = "/member-eligibility";
  const assignments = data.sitePages.filter(page => page.siteKey === "asce");
  const eligibility = assignments.find(page => page.pageKey === "eligibility")!;
  const membership = assignments.find(page => page.pageKey === "membership")!;
  [eligibility.position, membership.position] = [membership.position, eligibility.position];
  assignments.find(page => page.pageKey === "contact")!.requirement = "none";
  const catalog = { data, revision: "test", analyticsTags: [] };
  const listed = storedApplicationPageRows(catalog, "asce");
  expect(listed.slice(0, 3).map(page => page.key)).toEqual(["home", "eligibility", "membership"]);
  expect(listed.find(page => page.key === "eligibility")).toMatchObject({ route: "/member-eligibility" });
  expect(listed.find(page => page.key === "eligibility")).not.toHaveProperty('sequence');
  expect(listed.find(page => page.key === "contact")).toBeUndefined();
  expect(new URL(getSitePagePrototypeUrl("asce", "eligibility", listed[1].route)).pathname).toBe("/member-eligibility");
  installPrototypeLibrary(resolvePrototypeLibrary(data, "asce", "test"));
  expect(getPagePath("eligibility")).toBe("/member-eligibility");
  expect(getConfiguredPages().find(page => page.id === "eligibility")?.path).toBe("/member-eligibility");
  expect(getGlobalPages().find(page => page.id === "eligibility")?.path).toBe("/member-eligibility");
  expect(getSiteDetailsPageOrder().slice(0, 3)).toEqual(["home", "eligibility", "membership"]);
  expect(getOrderedLibraryPages().slice(0, 3).map(page => page.id)).toEqual(["home", "eligibility", "membership"]);
  expect(libraryRepository.read("pages").find(page => page.id === "eligibility")?.path).toBe("/member-eligibility");
  expect(resolveSitePages("asce").find(page => page.id === "contact")?.effective.included).toBe(false);
  expect(resolveSitePages("ama").find(page => page.id === "contact")?.effective.included).toBe(true);
  expect(getLibraryPages("effective", "asce").some(page => page.id === "contact")).toBe(false);
  expect(getLibraryPages("effective", "asce").some(page => page.id === "advisor-login")).toBe(true);
  expect(getResolvedFormFlow().slice(0, 3)).toEqual(["eligibility", "membership", "coverage"]);
  expect(getResolvedFormFlow()).not.toContain("contact");
  expect(getNextFormPageId("eligibility")).toBe("membership");
  expect(getPreviousFormPageId("membership")).toBe("eligibility");
  expect(getActiveProgressSteps({}).find(step => step.id === "getting-started")?.pageIds).toEqual(["eligibility", "membership"]);
  expect(resolvePageCatalog(data, "ama").slice(0, 3).map(page => page.key)).toEqual(["home", "membership", "eligibility"]);
  expect(data.sitePages.filter(page => page.siteKey !== "asce")).toEqual(baseline.sitePages.filter(page => page.siteKey !== "asce"));
});

it("honors stored global order and shared-page availability without consulting the code registry", () => {
  const data = structuredClone(baseline);
  const resume = data.pages.find(page => page.key === "resume")!;
  const method = data.pages.find(page => page.key === "resume-method")!;
  [resume.position, method.position] = [method.position, resume.position];
  data.sitePages.find(page => page.siteKey === "asce" && page.pageKey === "resume")!.requirement = "none";
  const catalog = { data, revision: "test", analyticsTags: [] };
  expect(storedApplicationPageRows(catalog, "all").filter(page => page.flow === "Resume")[0].key).toBe("resume-method");
  expect(storedApplicationPageRows(catalog, "asce").find(page => page.key === "resume")).toBeUndefined();
  data.sitePages = data.sitePages.filter(page => !(page.siteKey === "asce" && page.pageKey === "eligibility"));
  expect(storedApplicationPageRows({ ...catalog, data }, "asce").find(page => page.key === "eligibility")).toBeUndefined();
  installPrototypeLibrary(resolvePrototypeLibrary(data, "asce", "test"));
  expect(() => getPagePath("eligibility")).toThrow("Missing page path");
});

it("rejects ambiguous or invalid saved routes and page relationships", () => {
  const data = structuredClone(baseline);
  data.pages[1].definition.path = data.pages[0].definition.path;
  expect(() => resolvePageCatalog(data)).toThrow("Invalid stored page");
  data.pages[1].definition.path = "https://example.com";
  expect(() => resolvePageCatalog(data)).toThrow("Invalid stored page");
  const duplicate = structuredClone(baseline);
  duplicate.sitePages.find(page => page.siteKey === "asce" && page.pageKey === "membership")!.position = 0;
  expect(() => resolvePageCatalog(duplicate, "asce")).toThrow("Ambiguous stored page order");
});
