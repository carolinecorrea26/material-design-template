import { describe, expect, it } from "vitest";
import { createReviewedMigrationDatabase } from "../../../migration/fixtures";
import { childCollection, storedApplicationPageRows, storedFieldRows, storedLibraryRows, storedPageFieldGroups, storedFieldVisibility } from "./storedLibraryModel";
import { resolveEffectiveSite } from "../../../domain/effectiveSite";
import type { LibraryCatalog } from "../../../services/libraryCatalogService";
import { projectLibraryCatalog } from "../../../services/libraryCatalogService";
import { withFreshStartCatalog } from "../../../domain/freshStartCatalog";
const data = JSON.parse(JSON.stringify(createReviewedMigrationDatabase()));
const catalog: LibraryCatalog = projectLibraryCatalog({ data, revision: "test", analyticsTags: [] });
describe("stored Library collection and scope", () => {
  it("lists current application pages without admin or legacy reference pages", () => {
    const rows = storedApplicationPageRows(catalog, "all");
    expect(rows.slice(0, 3).map(row => row.key)).toEqual(["home", "membership", "eligibility"]);
    expect(rows.map(row => row.key)).toEqual(expect.arrayContaining(["receipt", "resume", "resume-method", "resume-code", "advisor-login", "advisor-send-confirmation", "application-edit-confirmation"]));
    expect(rows.some(row => /portal-|site-details|design-system|mock-email|cms/.test(String(row.key)))).toBe(false);
  });
  it("excludes disabled pages from selected Sites and keeps applicable resume/advisor pages", () => {
    const keys = storedApplicationPageRows(catalog, "all").map(row => row.key);
    for (const site of catalog.data.sites.filter(site => site.status === "active")) {
      const rows = storedApplicationPageRows(catalog, site.key);
      for (const key of ["resume", "resume-method", "resume-code", "advisor-login", "advisor-send-confirmation", "application-edit-confirmation"]) {
        expect(rows.find(row => row.key === key)).toMatchObject({ enabled: true, requirement: "—", flow: key.startsWith("resume") ? "Resume" : "Advisor" });
      }
      const resolved = resolveEffectiveSite(catalog.data, site.key);
      for (const page of resolved.configuration.pages.filter(page => page.requirement === "none" && keys.includes(page.key))) {
        expect(rows.find(row => row.key === page.key)).toBeUndefined();
      }
    }
  });
  it("lists the enrolled Sites and excludes retired Sites from the active Library", () => {
    expect(catalog.data.sites.map(site => site.key).sort()).toEqual(["ama", "ama-gi", "asce", "waepa", "waepa-gi"]);
    expect(storedApplicationPageRows(catalog, "abe")).toEqual([]);
    for (const site of catalog.data.sites) {
      const rows = storedApplicationPageRows(catalog, site.key);
      expect(new Set(rows.map(page => page.key)).size).toBe(rows.length);
      expect(rows.map(page => page.key)).toContain("receipt");
    }
  });
  it("shows only configured categories and enabled effective riders, respecting scoped replacement", () => {
    for (const site of catalog.data.sites.filter(s => s.status === 'active')) {
      const resolved = resolveEffectiveSite(catalog.data, site.key);
      const riderKeys = [...new Set(resolved.configuration.products.flatMap(p => p.riders.filter(r => r.enabled).map(r => r.key)))].sort();
      expect(storedLibraryRows(catalog, 'riders', site.key).map(r => r.key).sort()).toEqual(riderKeys);
      const categories = [...new Set(catalog.data.products.filter(p => resolved.products.some(r => r.productKey === p.key)).map(p => p.categoryKey))].sort();
      expect(storedLibraryRows(catalog, 'coverageCategories', site.key).map(r => r.key).sort()).toEqual(categories);
    }
    expect(storedLibraryRows(catalog, 'riders', 'all')).toHaveLength(catalog.data.riders.length);
  });
  it("lists ASCE membership ID and AMA physician inputs with scoped placement and conditions", () => {
    const asce = storedFieldRows(catalog, "asce");
    const id = asce.find(field => field.key === "member-id")!;
    expect(id.definition.required).toBe(true);
    expect(id.placements[0]).toMatchObject({ page: "membership", section: "membershipInformation" });
    expect(storedPageFieldGroups(catalog, "asce", "membership", asce).find(group => group.section === "membershipInformation")?.fields.map(field => field.key)).toContain("member-id");
    const ama = storedFieldRows(catalog, "ama");
    const physicianKeys = ["ama-physician-type", "ama-physician-title", "ama-physician-first-name", "ama-physician-last-name", "ama-physician-birth-date", "ama-physician-email"];
    expect(ama.filter(field => field.placements[0]?.page === "membership").map(field => field.key)).toEqual(expect.arrayContaining(physicianKeys));
    for (const key of physicianKeys) expect(storedFieldVisibility(catalog, ama.find(field => field.key === key)!, ama)).toContain("Spouse of Physician");
    expect(storedFieldRows(catalog, "waepa").some(field => physicianKeys.includes(field.key))).toBe(false);
  });
  it("matches included runtime fields for every active Site/page and retains per-page overrides", () => {
    for (const site of catalog.data.sites.filter(site => site.status === "active")) {
      const fields = storedFieldRows(catalog, site.key);
      const resolved = resolveEffectiveSite(catalog.data, site.key);
      const collection = childCollection(catalog, site.key);
      for (const page of resolved.configuration.pages.filter(page => page.requirement !== "none" && page.definition?.value.type !== "internal")) {
        for (const field of page.fields) {
          const listed = fields.find(row => row.key === field.key && row.placements[0]?.page === page.key);
          const collectionField = catalog.data.pageSectionFields.some(row => row.fieldKey === field.key && row.sectionKey === collection.section?.key);
          const included = field.included && (!collectionField || collection.collects && collection.fields.some(row => row.key === field.key));
          expect(!!listed, `${site.key}/${page.key}/${field.key}`).toBe(included);
          if (listed) expect(listed.definition).toEqual(collection.fields.find(row => page.key === "eligibility" && row.key === field.key)?.definition ?? field.definition);
        }
      }
    }
  });
  it("shows ASCE Eligibility spouse and child requirements in the Library", () => {
    const fields = storedFieldRows(catalog, "asce");
    const eligibility = (key: string) => fields.find(row => row.key === key && row.placements[0]?.page === "eligibility");
    expect(eligibility("spouse-membership")?.definition.label).toBe("Is your spouse also a member of the American Society of Civil Engineers?");
    expect(eligibility("child-full-time-student")?.definition.label).toBe("Is the child a full-time student?");
  });
  it("orders pages and their field rows in application sequence and includes Home inputs", () => {
    expect(storedLibraryRows(catalog, "pages", "all").slice(0, 3).map(row => row.key)).toEqual(["home", "membership", "eligibility"]);
    const fields = storedFieldRows(catalog, "asce");
    const pages = [...new Set(fields.flatMap(field => field.placements.map(placement => placement.page)))];
    expect(pages.slice(0, 3)).toEqual(["home", "membership", "eligibility"]);
    expect(storedPageFieldGroups(catalog, "asce", "home", fields).flatMap(group => group.fields).length).toBeGreaterThan(0);
  });
  it("keeps internal reference pages outside the application Library", () => {
    const internal = catalog.data.pages.filter(page => page.definition.type === "internal").map(page => page.key);
    expect(storedLibraryRows(catalog, "pages", "all").some(row => internal.includes(String(row.key)))).toBe(false);
    for (const site of catalog.data.sites.filter(site => site.status === "active")) {
      const pages = storedLibraryRows(catalog, "pages", site.key).map(row => row.key);
      expect(pages).toContain("home");
      expect(pages.some(key => internal.includes(String(key)))).toBe(false);
      expect(storedLibraryRows(catalog, "pageSections", site.key).every(row => pages.includes(String(row.pageKey)))).toBe(true);
      expect(storedFieldRows(catalog, site.key).every(row => row.placements.every(placement => pages.includes(placement.page)))).toBe(true);
    }
  });
  it("exposes collection inputs through persisted section relationships in sequence", () => {
    const collection = childCollection(catalog, "waepa");
    expect(collection.collects).toBe(true);
    expect(collection.fields.map(field => field.key)).toEqual(["child-first-name", "child-last-name", "child-birth-date", "child-gender"]);
    expect(storedFieldRows(catalog, "waepa").find(field => field.key === "child-first-name")?.placements).toContainEqual({ page: "eligibility", section: "childSection", collection: "children", order: 0 });
  });
  it("uses the effective child collection for each enrolled Site", () => {
    for (const site of catalog.data.sites) {
      const collection = childCollection(catalog, site.key);
      expect(collection.collects).toBe(collection.mode === "details");
      if (!collection.collects) expect(collection.fields).toEqual([]);
    }
  });
  it("does not let superseded saved settings bypass authored inheritance", () => {
    const changed = structuredClone(catalog);
    changed.data.configurationDefinitions.push({ id: "draft.waepa.experience", key: "draft.waepa.experience", position: 0, definition: { path: ["applicantExperience"], metadata: null } });
    changed.data.configurationValues.push({ id: "draft.waepa.experience", key: "draft.waepa.experience", position: 0, configurationKey: "draft.waepa.experience", scope: "site", hostingAssociationKey: null, siteKey: "waepa", value: { childEligibility: { mode: "notice-only", note: "Superseded" } } });
    expect(childCollection(changed, "waepa").mode).toBe(childCollection(catalog, "waepa").mode);
  });
  it("projects authoritative field labels and enabled products", () => {
    const changed = structuredClone(catalog);
    changed.data.fields.find(field => field.key === "child-first-name")!.definition.label = "Superseded child given name";
    expect(childCollection(changed, "waepa").fields[0].definition).toEqual(childCollection(catalog, "waepa").fields[0].definition);
    const effective = withFreshStartCatalog(changed.data, "waepa");
    const enabled = effective.siteProducts.filter(row => row.siteId === "waepa" && row.enabled).map(row => row.productKey).sort();
    expect(storedLibraryRows(changed, "products", "waepa").map(row => row.key).sort()).toEqual(enabled);
  });
});
