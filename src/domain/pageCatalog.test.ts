import { afterEach, expect, it } from "vitest";
import { createReviewedMigrationDatabase } from "../migration/fixtures";
import { resolvePageCatalog } from "./pageCatalog";
import { installPrototypeLibrary, resolvePrototypeLibrary } from "./prototypeLibrary";
import { getActiveProgressSteps } from "../config/progressSteps";
import { getConfiguredPages, getPagePath } from "../config/pages";
import { getResolvedFormFlow, getNextFormPageId, getPreviousFormPageId } from "../config/formFlow";
import { storedApplicationPageRows } from "../pages/admin/library/storedLibraryModel";
import { getGlobalPages, getSiteDetailsPageOrder } from "../config/resolvers/resolveClientPages";
import { resolveSitePages } from "../data/resolvers";
import { getLibraryPages, getOrderedLibraryPages } from "../pages/admin/library/libraryInspection";
import { libraryRepository } from "../repositories/libraryRepository";

const baseline = createReviewedMigrationDatabase();
afterEach(() => installPrototypeLibrary(null));

it("keeps global routes and order authoritative across Library, prototype and navigation", () => {
  const data = structuredClone(baseline);
  const before = storedApplicationPageRows({ data, revision: 'before', analyticsTags: [] }, 'asce');
  data.pages.find(page => page.key === 'eligibility')!.definition.path = '/obsolete-eligibility';
  data.sitePages.find(page => page.siteKey === 'asce' && page.pageKey === 'contact')!.requirement = 'none';
  const catalog = { data, revision: 'test', analyticsTags: [] };
  expect(storedApplicationPageRows(catalog, 'asce')).toEqual(before);
  installPrototypeLibrary(resolvePrototypeLibrary(data, 'asce', 'test'));
  expect(getPagePath('eligibility')).toBe('/eligibility');
  expect(getConfiguredPages().find(page => page.id === 'eligibility')?.path).toBe('/eligibility');
  expect(getGlobalPages().find(page => page.id === 'eligibility')?.path).toBe('/eligibility');
  expect(getSiteDetailsPageOrder().slice(0, 3)).toEqual(['home', 'membership', 'eligibility']);
  expect(getOrderedLibraryPages().slice(0, 3).map(page => page.id)).toEqual(['home', 'membership', 'eligibility']);
  expect(libraryRepository.read('pages').find(page => page.id === 'eligibility')?.path).toBe('/eligibility');
  expect(resolveSitePages('asce').find(page => page.id === 'contact')?.effective.included).toBe(true);
  expect(getLibraryPages('effective', 'asce').some(page => page.id === 'contact')).toBe(true);
  expect(getResolvedFormFlow().slice(0, 3)).toEqual(['membership', 'eligibility', 'coverage']);
  expect(getNextFormPageId('membership')).toBe('eligibility');
  expect(getPreviousFormPageId('eligibility')).toBe('membership');
  expect(getActiveProgressSteps({}).find(step => step.id === 'getting-started')?.pageIds).toEqual(['membership', 'eligibility']);
});

it("restores shared-page availability from the global template despite removed saved assignments", () => {
  const data = structuredClone(baseline);
  data.sitePages = data.sitePages.filter(page => !(page.siteKey === 'asce' && page.pageKey === 'eligibility'));
  expect(storedApplicationPageRows({ data, revision: 'test', analyticsTags: [] }, 'asce').find(page => page.key === 'eligibility')).toBeDefined();
  installPrototypeLibrary(resolvePrototypeLibrary(data, 'asce', 'test'));
  expect(getPagePath('eligibility')).toBe('/eligibility');
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
