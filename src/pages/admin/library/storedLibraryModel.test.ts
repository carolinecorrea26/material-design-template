import { withRequirementPageFields } from "../../../domain/requirementFields";
import { describe, expect, it } from "vitest";
import { createReviewedMigrationDatabase } from "../../../migration/fixtures";
import { childCollection, storedApplicationPageRows, storedFieldRows, storedLibraryRows, storedPageFieldGroups, storedFieldVisibility } from "./storedLibraryModel";
import { resolveEffectiveSite } from "../../../domain/effectiveSite";
import type { LibraryCatalog } from "../../../services/libraryCatalogService";
import { readFileSync } from "node:fs";
const data = JSON.parse(JSON.stringify(createReviewedMigrationDatabase()));
const catalog: LibraryCatalog = { data, revision: "test", analyticsTags: [] };
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
  it("lists only ABE's applicable pages in both the Library and requirements document", () => {
    const rows = storedApplicationPageRows(catalog, "abe");
    expect(rows).toHaveLength(28);
    expect(rows.filter(page => page.flow === "Utility").map(page => page.key)).toEqual(["error-404", "error-500", "session-expired", "technical-error", "maintenance", "application-unavailable", "outcome-unknown"]);
    expect(rows.filter(page => page.key.startsWith("health-")).map(page => page.key)).toEqual(["health-li", "health-qd", "health-di", "health-ci"]);
    expect(storedApplicationPageRows(catalog, "all").some(page => page.key === "health-si")).toBe(true);
    const doc = readFileSync("docs/project-review/abe-template-requirements.md", "utf8");
    const pageSection = doc.split("## Pages\n")[1].split("### Health page layout")[0];
    const ids = [...pageSection.matchAll(/^\| `([^`]+)` \|/gm)].map(match => match[1]);
    expect(ids).toEqual(rows.map(page => page.key));
    const documentRows = pageSection.split('\n').filter(line => line.startsWith('| `')).map(line => line.split('|').map(cell => cell.trim()));
    expect(documentRows.map(row => row[4])).toEqual(rows.map(page => page.flow));
    expect(documentRows.every(row => row.length === 6)).toBe(true);
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
    expect(storedFieldRows(catalog, "csea").some(field => physicianKeys.includes(field.key))).toBe(false);
  });
  it("matches included runtime fields for every active Site/page and retains per-page overrides", () => {
    for (const site of catalog.data.sites.filter(site => site.status === "active")) {
      const fields = storedFieldRows(catalog, site.key);
      const resolved = resolveEffectiveSite(catalog.data, site.key);
      const collection = childCollection(catalog, site.key);
      for (const page of resolved.configuration.pages.filter(page => page.requirement !== "none" && page.definition?.value.type !== "internal")) {
        for (const field of withRequirementPageFields(page.key, page.fields, site.key)) {
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
  it("keeps internal reference pages in All and out of effective Site pages and sections", () => {
    const internal = catalog.data.pages.filter(page => page.definition.type === "internal").map(page => page.key);
    expect(internal).toContain("design-system");
    expect(storedLibraryRows(catalog, "pages", "all").map(row => row.key)).toEqual(expect.arrayContaining(internal));
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
  it("resolves CSEA's stored notice choice without requiring records", () => {
    expect(childCollection(catalog, "csea")).toMatchObject({ collects: false, mode: "notice-only" });
    expect(storedFieldRows(catalog, "csea").filter(field => field.key.startsWith("child-"))).toEqual([]);
  });
  it("reflects a saved Site collection choice over the earlier client choice", () => {
    const changed = structuredClone(catalog);
    changed.data.configurationDefinitions.push({ id: "draft.csea.experience", key: "draft.csea.experience", position: 0, definition: { path: ["applicantExperience"], metadata: null } });
    changed.data.configurationValues.push({ id: "draft.csea.experience", key: "draft.csea.experience", position: 0, configurationKey: "draft.csea.experience", scope: "site", clientKey: null, siteKey: "csea", value: { childEligibility: { mode: "details", note: "Collect child details" } } });
    expect(childCollection(changed, "csea")).toMatchObject({ collects: true, settingKey: "draft.csea.experience" });
  });
  it("reflects saved field labels and excludes disabled products", () => {
    const changed = structuredClone(catalog);
    changed.data.fields.find(field => field.key === "child-first-name")!.definition.label = "Stored child given name";
    expect(childCollection(changed, "waepa").fields[0].definition.label).toBe("Stored child given name");
    const products = storedLibraryRows(catalog, "products", "csea");
    expect(products.map(row => row.key).sort()).toEqual(["di-ltd", "li-add"]);
  });
});
