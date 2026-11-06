import { readFileSync } from "node:fs";
import { ApplicationFormProvider } from "../../app/ApplicationFormContext";
import { act, createElement as h, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter, Routes, Route, useLocation, Link as RouterLink } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ThemeProvider, useTheme } from "@mui/material/styles";
import AdminCenterShell from "../../components/admin/AdminCenterShell";
import { createAppTheme } from "../../app/theme";
import PortalLibrary from "./PortalLibrary";
import AccessibilityWorkspace from "./AccessibilityWorkspace";
import { accessibilityCriteria } from "../../content/docs/accessibility";
import MockEmailPreview from "../MockEmailPreview";
import BrowseTable from "../../components/docs/BrowseTable";
import { readLibraryCatalog, type LibraryCatalog } from "../../services/libraryCatalogService";
import { createReviewedMigrationDatabase } from "../../migration/fixtures";
import { analyticsTagId, type AnalyticsTag } from "../../domain/analytics";
import { requirementChanges } from "./library/RequirementChangesLibrary";
vi.mock("../../services/libraryCatalogService", () => ({ readLibraryCatalog: vi.fn() }));
const savedTag: AnalyticsTag = { id: analyticsTagId("eligibility", "field", "stored-test"), elementKey: "stored-test", pageId: "eligibility", label: "Stored analytics control", kind: "field", events: ["change"], sites: ["csea"], status: "proposed", trigger: "change", permittedProperties: ["siteKey"], description: "Stored description", source: "prototype-definition", sourceFile: "test", condition: "Child selected", adobe: { mapping: null, status: "not-configured" }, contentsquare: { mapping: null, status: "not-configured" } };
const catalog: LibraryCatalog = { revision: "test", data: JSON.parse(JSON.stringify(createReviewedMigrationDatabase())), analyticsTags: [savedTag] };
let root: Root;
let container: HTMLDivElement;
beforeEach(() => {
  const storage = new Map<string, string>();
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => storage.set(key, String(value)),
    removeItem: (key: string) => storage.delete(key),
    clear: () => storage.clear(),
    key: (index: number) => [...storage.keys()][index] ?? null,
    get length() { return storage.size; },
  });
  vi.mocked(readLibraryCatalog).mockResolvedValue(catalog);
  vi.stubGlobal("ResizeObserver", class { observe() {} unobserve() {} disconnect() {} });
  (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  container = document.createElement("div"); document.body.appendChild(container); root = createRoot(container);
});
afterEach(async () => { await act(async () => root.unmount()); container.remove(); vi.unstubAllGlobals(); });
function Location() { return h("output", { "data-location": true }, useLocation().pathname + useLocation().search); }
async function render(path: string, element: ReactNode = h(PortalLibrary), route = "/admin-center/library/:domainId?") {
  await act(async () => root.render(h(ThemeProvider, { theme: createAppTheme({ type: "preset", preset: "default" }) }, h(MemoryRouter, { key: path, initialEntries: [path] }, h(Routes, null, h(Route, { path: route, element: h(ApplicationFormProvider, null, element) })), h(Location)))));
}

it("shows ABE Pages from the shared catalog with requirements, fields and saved preview routes", async () => {
  vi.mocked(readLibraryCatalog).mockResolvedValue({ ...JSON.parse(readFileSync("public/catalog/portal.json", "utf8")), revision: "saved-abe" });
  await render("/admin-center/library/pages?scope=effective&site=abe");
  expect([...container.querySelectorAll("th")].map(header => header.textContent)).toEqual(["Page ID", "Flow", "Requirement", "Fields", "Components"]);
  expect(container.querySelector('[aria-label="Pages filters"] input')?.getAttribute("type")).toBe("text");
  expect(container.querySelector('[aria-label="Pages filters"] [role="combobox"]')).toBeNull();
  const table = container.querySelector('table[aria-label="Pages"]')!;
  expect(table.querySelectorAll("tbody tr")).toHaveLength(25);
  const ci = [...table.querySelectorAll("tbody tr")].find(row => row.querySelector("a")?.textContent === "Health CI")!;
  expect(ci.textContent).toContain("application");
  expect(ci.textContent).toContain("required");
  expect(ci.querySelector("a")?.getAttribute("href")).toContain("/health-ci?");
  const disabled = [...table.querySelectorAll("tbody tr")].find(row => row.querySelector("td")?.textContent === "Health SI")!;
  expect(disabled.textContent).toContain("none");
  expect(disabled.querySelector("td:first-child a")).toBeNull();
  expect(table.textContent).toContain("Add/edit child modal");
  expect(table.textContent).toContain("Member verification modal");
  const profileUrl = new URL(table.querySelector<HTMLAnchorElement>('a[href*="/profile?"]')!.href);
  expect(profileUrl.searchParams.get("site")).toBe("abe");
  expect(profileUrl.searchParams.get("autofill")).toBe("profile");
  expect(profileUrl.searchParams.get("template")).toBe("multi");
});
it("shows ABE optional collection settings in Configurations", async () => {
  await render("/admin-center/library/configurations?site=abe");
  const table = container.querySelector('table[aria-label="Configurations"]')!;
  for (const label of ["Beneficiary collection", "Payment collection"]) {
    const row = [...table.querySelectorAll("tbody tr")].find(row => row.querySelector("td")?.textContent === label);
    expect(row?.querySelectorAll("td")[3].textContent).toBe("Optional");
    expect(row?.textContent).toContain("site_pages.requirement");
  }
});
it("shows questionnaire requirements in Validation instead of the field catalog", async () => {
  await render("/admin-center/library/fields?site=abe&q=health-abe-form-197");
  const fields = container.querySelector('table[aria-label="Fields"]')!;
  expect(fields.querySelectorAll("tbody tr")).toHaveLength(1);
  expect(fields.querySelector("thead")?.textContent).not.toContain("Requirement");
  await render("/admin-center/library/validation?site=abe&q=health-abe-form-197");
  const validation = container.querySelector('table[aria-label="Validation"]')!;
  expect(validation.textContent).toContain("Health CI");
  expect(validation.textContent).toContain("required");
});
const tab = (label: string) => [...container.querySelectorAll<HTMLElement>('[role="tab"]')].find((element) => element.textContent === label)!;
async function click(element: HTMLElement) { await act(async () => element.click()); }
const location = () => container.querySelector("output")!.textContent!;
async function chooseSite(id: string) {
  const selector = container.querySelector('[aria-label="Site scope selector"]')!;
  await click(selector.querySelector<HTMLElement>('button[aria-label="Open"]')!);
  const option = [...document.querySelectorAll<HTMLElement>('[role="option"]')].find(option => id === "all" ? option.textContent === "All sites" : option.textContent?.includes(`· ${id}`))!;
  await click(option);
}


describe("stored Portal Library navigation", () => {
  it('shows scoped atomic rule coverage separately from the business rule catalog', async () => {
    await render('/admin-center/library/coverage-review?site=ama');
    const table = container.querySelector('table[aria-label="Rule coverage review"]')!;
    expect(table).not.toBeNull();
    expect(table.textContent).toContain('Applicant type restricts available coverage categories');
    expect(table.textContent).toContain('Verified for this requirement');
    expect(table.textContent).not.toContain('GI employer and employment start date');
    expect(tab('Configurations').getAttribute('aria-selected')).toBe('true');
    expect(container.querySelector('[aria-label="Coverage configuration views"] [aria-selected="true"]')?.textContent).toBe('Coverage review');
  });
  it('keeps the simplified requirements views and removes standalone Coverage, Patterns and Flags tabs', async () => {
    await render('/admin-center/library/rules?site=asce');
    expect(tab('Rules').getAttribute('aria-selected')).toBe('true');
    expect(tab('Coverage')).toBeUndefined();
    expect(tab('Patterns')).toBeUndefined();
    expect(tab('Flags')).toBeUndefined();
    expect(tab('Products & riders')).toBeUndefined();
    expect(container.querySelector('table[aria-label="Business rules"]')?.textContent).not.toContain('Stored policy');
    await click(tab('Configurations'));
    await click(tab('URL parameters'));
    const table = container.querySelector('table[aria-label="URL parameters"]')!;
    expect(table.textContent).toContain('Allowed values');
    expect(table.textContent).toContain('No site assignment recorded');
    expect(container.querySelectorAll('table')).toHaveLength(1);
  });
  it('keeps foundation references in Storybook and sends legacy component bookmarks to Pages', async () => {
    await render('/admin-center/library/themes?site=asce');
    expect(container.querySelector('a[href*="foundations-design-foundations--foundations"]')).not.toBeNull();
    expect(container.querySelector('a[href*="foundations-icons--icons"]')).not.toBeNull();
    await render('/admin-center/library/accessibility?site=asce');
    expect(container.querySelector('table[aria-label="Accessibility concerns"]')).not.toBeNull();
    expect(container.querySelector('a[href*="guidelines-accessibility"]')).toBeNull();
    await render('/admin-center/library/components?site=asce');
    expect(tab('Components')).toBeUndefined();
    expect(tab('Pages').getAttribute('aria-selected')).toBe('true');
    expect(container.querySelector('table[aria-label="Pages"]')).not.toBeNull();
  });
  it("retains the AA target and shows scoped concerns with official tooling links", async () => {
    await render('/admin-center/library/accessibility?site=waepa-gi');
    expect(tab('Accessibility').getAttribute('aria-selected')).toBe('true');
    expect(accessibilityCriteria).toHaveLength(55);
    expect(new Set(accessibilityCriteria.map(row => row.id)).size).toBe(55);
    expect(accessibilityCriteria.some(row => row.id === '4.1.1')).toBe(false);
    expect(accessibilityCriteria.filter(row => row.level === 'AA')).toHaveLength(24);
    expect(container.textContent).toContain('Admin Center is outside this assessment scope');
    expect(container.textContent).toContain('Assessment is pending');
    expect(container.querySelector('a[href="https://developer.chrome.com/docs/lighthouse/overview"]')).not.toBeNull();
    expect(container.querySelector('table[aria-label="Accessibility concerns"]')?.textContent).toContain('Needs review');
    expect(container.textContent).toContain('Assessment is pending for waepa-gi');
    await chooseSite('all');
    expect(container.textContent).toContain('Assessment is pending for all prototype sites');
  });
  it("does not present missing Siteimprove results as a passing scan", async () => {
    await render('/admin-center/accessibility?site=asce', h(AccessibilityWorkspace), '/admin-center/accessibility');
    expect(container.textContent).toContain('Accessibility tracking setup pending');
    expect(container.textContent).toContain('No scan results are available');
    expect(container.textContent).toContain('Admin Center is outside this assessment scope');
    expect(container.querySelector('a[href="/admin-center/library/accessibility?site=asce"]')).not.toBeNull();
    await chooseSite('csea');
    expect(container.textContent).toContain('Assessment is pending for csea');
    expect(container.querySelector('a[href="/admin-center/library/accessibility?site=csea"]')).not.toBeNull();
  });
  it("opens Client information first, displays the real logo and links MCR TPA contacts", async () => {
    await render('/admin-center/library?site=asce');
    expect(tab('Overview').getAttribute('aria-selected')).toBe('true');
    expect(tab('Client information').getAttribute('aria-selected')).toBe('true');
    expect(container.querySelectorAll('table')).toHaveLength(1);
    expect(container.querySelector('table[aria-label="Client information"]')?.textContent).toContain('Association information');
    expect(tab('TPA information')).toBeUndefined();
    expect(tab('Association information')).toBeUndefined();
    expect(container.querySelector('img[alt="ASCE logo"]')?.getAttribute('src')).toBeTruthy();
    expect(container.textContent).toContain('Pearl Insurance');
    expect(container.textContent).toContain('MCR Associations!D16');
  });
  it("groups WAEPA sites and opens old coverage bookmarks in Products & riders", async () => {
    await render('/admin-center/library/coverage?site=waepa');
    expect(container.querySelectorAll('table')).toHaveLength(1);
    expect(container.querySelector('table[aria-label="Products & riders"]')).not.toBeNull();
    expect(tab('Riders')).toBeUndefined();
    expect(container.textContent).toContain('Record type');
    await click(container.querySelector<HTMLElement>('[aria-label="Site scope selector"] button[aria-label="Open"]')!);
    const options = [...document.querySelectorAll<HTMLElement>('[role="option"]')].map(o => o.textContent);
    const waepa = options.filter(t => t?.startsWith('WAEPA ·'));
    expect(waepa).toHaveLength(2);
    expect(options.indexOf(waepa[1]) - options.indexOf(waepa[0])).toBe(1);
  });
  it("keeps Admin Center responsive breakpoints independent of a single-page applicant theme", async () => {
    const applicantTheme = createAppTheme({ type: "preset", preset: "default" }, { forceMobileLayout: true });
    function ThemeProbe() {
      const theme = useTheme();
      return h("output", { "data-breakpoints": true }, `${theme.breakpoints.values.md}/${theme.breakpoints.values.lg}`);
    }
    await act(async () => root.render(h(ThemeProvider, { theme: applicantTheme },
      h(MemoryRouter, { initialEntries: ["/admin-center"] }, h(Routes, null,
        h(Route, { path: "/admin-center", element: h(AdminCenterShell) },
          h(Route, { index: true, element: h(ThemeProbe) })))))));
    expect(applicantTheme.breakpoints.values.lg).toBe(1_000_000);
    expect(container.querySelector('[data-breakpoints]')?.textContent).toBe("900/1200");
  });
  // User-defined change boundaries and manual checks: docs/portal-library-acceptance.md.
  it("shows flow decisions in tables and keeps diagrams hidden", async () => {
    await render("/admin-center/library/flows?site=csea");
    expect(container.querySelector('[aria-label="Flow views"]')).not.toBeNull();
    expect(container.querySelector('[role="tabpanel"]')).not.toBeNull();
    expect(container.querySelector('table[aria-label="Flows"]')).toBeNull();
    expect(container.querySelector('table[aria-label="Flow decisions"]')).not.toBeNull();
    expect(container.querySelector('.react-flow')).toBeNull();
    await click(tab('Save'));
    expect(container.querySelector('table[aria-label="Flow decisions"]')?.textContent).toContain('Failure');
    await click(tab('XML (TBD)'));
    expect(container.textContent).toContain('XML flow decisions are TBD');
  });
  it("reads saved flow titles and page references for the selected Site", async () => {
    const saved = structuredClone(catalog);
    saved.data.flows.find(flow => flow.definition.id === "advisor")!.definition.title = "Saved advisor journey";
    vi.mocked(readLibraryCatalog).mockResolvedValue(saved);
    await render("/admin-center/library/flows?site=abe&flow=advisor");
    expect(tab("Saved advisor journey")).toBeDefined();
    const references = container.querySelector('table[aria-label="Flow decisions"]')!;
    const membership = [...references.querySelectorAll<HTMLAnchorElement>("a")].find(link => link.textContent === "Membership")!;
    expect(membership.getAttribute("href")).toContain("site=abe");
    await click(membership);
    expect(location()).toContain("/admin-center/library/pages?site=abe");
    expect(location()).toContain("q=membership");
  });
  it("uses the selected Site's saved Home route for its interactive preview", async () => {
    const saved = structuredClone(catalog);
    saved.data.pages.find(page => page.key === "home")!.definition.path = "/saved-home";
    vi.mocked(readLibraryCatalog).mockResolvedValue(saved);
    await render("/admin-center/library/site-preview?site=abe");
    expect(tab('Overview').getAttribute('aria-selected')).toBe('true');
    expect(container.querySelector('[aria-label="Overview views"] [aria-selected="true"]')?.textContent).toBe('Site preview');
    const preview = container.querySelector("iframe")!;
    expect(new URL(preview.src).pathname).toBe("/saved-home");
    expect(new URL(preview.src).searchParams.get("site")).toBe("abe");
    await click(tab('Client information'));
    expect(container.querySelector('table[aria-label="Client information"]')).not.toBeNull();
    await click(tab('Site preview'));
    expect(container.querySelector('iframe')).not.toBeNull();
  });
  it("moves template selection into Configurations and preserves old bookmarks", async () => {
    await render("/admin-center/library/templates?site=csea");
    expect(tab("Templates")).toBeUndefined();
    expect(tab("Configurations")?.getAttribute('aria-selected')).toBe('true');
    expect(container.querySelector('table[aria-label="Theme & branding settings"]')?.textContent).toContain("Application template");
    expect(container.querySelector('table[aria-label="Theme & branding settings"]')?.textContent).toContain("single");
  });

  it("shows Validations as a main tab and puts search first in every filter row", async () => {
    await render("/admin-center/library/pages?site=asce");
    expect(tab("Validations")).toBeDefined();
    const pageFilters = container.querySelector('[aria-label="Pages filters"]')!;
    expect(pageFilters.firstElementChild?.textContent).toContain("Search pages");
    expect([...container.querySelectorAll('[role="option"]')].some(option => option.textContent === "Validation")).toBe(false);
    const membership = [...container.querySelectorAll('table[aria-label="Pages"] tbody tr')].find(row => row.querySelector("a")?.textContent === "Membership")!;
    expect(membership.textContent).not.toContain("Membership ID");
    expect(membership.querySelector('a[href*="q=asce-member-id"]')).not.toBeNull();
    expect(membership.querySelector("a")?.getAttribute("href")).toContain("/membership");
    expect(container.querySelector('table[aria-label="Pages"] thead')?.textContent).not.toContain("Preview");
    await click(tab("Fields"));
    expect(container.querySelector('[aria-label="Fields filters"]')?.firstElementChild?.textContent).toContain("Search fields");
    expect(container.querySelector('[aria-label="Fields filters"]')?.textContent).not.toContain("Records");
    await click(tab("Validations"));
    const validation = container.querySelector('table[aria-label="Validation"]')!;
    expect(validation.textContent).toContain("Validation rule");
    expect(validation.textContent).toContain("Error message");
    expect(container.querySelector('[aria-label="Validation filters"]')?.textContent).not.toContain("Records");
  });
  it("shows AMA's physician membership fields in Fields and their spouse condition in Validation", async () => {
    await render("/admin-center/library/fields?site=ama&pages=membership");
    const table = container.querySelector('table[aria-label="Fields"]')!;
    expect(table.textContent).toContain("ama-physician-first-name");
    expect(table.textContent).toContain("ama-physician-email");
    expect(container.querySelector('table[aria-label="Field usage"]')?.textContent).toContain("Membership page · Physician Information");
    expect(table.querySelector("thead")?.textContent).not.toContain("When shown");
    expect(table.textContent).not.toContain("asce-member-id");
    await render("/admin-center/library/validation?site=ama&q=ama-physician-email");
    // The physician email validates its format only under the spouse condition.
    expect(container.querySelector('table[aria-label="Validation"]')?.textContent).toContain("Valid email address");
    expect(container.querySelector('table[aria-label="Validation"]')?.textContent).toContain("Enter a valid email address.");
    expect(container.querySelector('table[aria-label="Validation"]')?.textContent).toContain("Spouse of Physician");
  });
  it("separates saved field definitions from usage and retains Storybook links and authored options", async () => {
    vi.mocked(readLibraryCatalog).mockResolvedValue({ ...JSON.parse(readFileSync("public/catalog/portal.json", "utf8")), revision: "saved-fields" });
    await render("/admin-center/library/fields?site=all&q=state-province");
    const table = container.querySelector('table[aria-label="Fields"]')!;
    expect([...table.querySelectorAll("thead th")].map(cell => cell.textContent)).toEqual(["Field ID", "Input label", "Input type", "Component", "Keyboard", "Options", "Default option", "Helper text"]);
    const state = table.querySelector("tbody tr")!;
    expect(state.querySelector("a")?.getAttribute("href")).toContain("forms-fieldrenderer--searchable-select");
    expect(state.querySelectorAll("li")).toHaveLength(67);
    expect(state.textContent).toContain('Alabama (value="AL")');
    await render("/admin-center/library/fields?site=asce&q=needs-annual-income");
    expect(container.querySelector('table[aria-label="Fields"]')?.textContent).not.toContain("Needs calculator drawer");
    expect(container.querySelector('table[aria-label="Field usage"]')?.textContent).toContain("Needs calculator drawer");
  });
  it("lists conditional member and spouse Coverage questions under the configured headings", async () => {
    await render("/admin-center/library/fields?site=all&pages=coverage");
    const table = container.querySelector('table[aria-label="Field usage"]')!;
    expect(table.textContent).toContain("Coverage page · Member · Personal Details");
    expect(table.textContent).toContain("Coverage page · Spouse · Personal Details");
    expect(table.textContent).toContain("Coverage page · Member · Work & Income");
    expect(table.textContent).toContain("Coverage page · Spouse · Work & Income");
    expect(table.textContent).toContain("tobacco-last-used");
    expect(table.textContent).toContain("spouse-tobacco-products");
    expect(table.textContent).not.toContain("Self Coverage Tobacco");
  });
  it("opens Emails directly to previews for All and a selected Site", async () => {
    await render("/admin-center/library/communications?site=all");
    expect(tab("Emails")).toBeDefined();
    expect(tab("Email previews")).toBeUndefined();
    expect(container.textContent).toContain("Application autosaved");
    await chooseSite("csea");
    expect(tab("Emails")).toBeDefined();
    expect(tab("Email previews")).toBeUndefined();
    expect(container.textContent).toContain("Application autosaved");
    expect(tab("Stored records")).toBeUndefined();
    expect(tab("Templates")).toBeUndefined();
    expect(tab("Configuration Options")).toBeUndefined();
  });
  it.each(["site=waepa-gi", "client=csea", ""])("redirects legacy email bookmarks to Communications (%s)", async query => {
    const expectedSite = query === "site=waepa-gi" ? "waepa-gi" : query ? "csea" : "all";
    await render(`/mock-email-preview?${query}`, h(MockEmailPreview), "*");
    expect(location()).toBe(`/admin-center/library/communications?site=${expectedSite}`);
  });
  it("keeps the requested main tab order for All and a selected Site", async () => {
    await render("/admin-center/library/pages");
    expect(tab("Canonical Review")).toBeUndefined();
    expect(tab("Template Standards")).toBeUndefined();
    const mainTabs = () => [...container.querySelectorAll('[aria-label="Portal Library domains"] [role="tab"]')].map(tab => tab.textContent);
    const expected = ['Overview', 'Pages', 'Fields', 'Flows', 'Rules', 'Validations', 'Configurations', 'Content', 'Accessibility', 'Analytics', 'Requirement changes'];
    expect(mainTabs()).toEqual(expected);
    await chooseSite("csea");
    expect(mainTabs()).toEqual(expected);
  });
  it("lists the requirements change log with ID, description and reason", async () => {
    await render("/admin-center/library/changes");
    const table = container.querySelector('table[aria-label="Requirement changes"]')!;
    expect([...table.querySelectorAll('thead th')].map(cell => cell.textContent)).toEqual(["Change", "Description", "Reason"]);
    expect([...table.querySelectorAll('tbody tr')].map(row => row.querySelector('td')?.textContent)).toEqual(requirementChanges.map(change => change.id));
    expect(table.textContent).toContain("Sites that skip the landing page typically provide their own rate tool.");
  });
  it("keeps collection fields in Fields and page previews on page names", async () => {
    await render("/admin-center/library/pages?site=waepa&q=eligibility");
    const table = container.querySelector('table[aria-label="Pages"]')!;
    expect(table.textContent).not.toContain("Your Child(ren)");
    expect(table.querySelector("details")).toBeNull();
    expect(table.querySelector("a")?.textContent).toBe("Eligibility");
    expect(table.querySelector("a")?.getAttribute("href")).toContain("/eligibility");
    await render("/admin-center/library/fields?site=waepa&q=child-first-name");
    expect(container.querySelector('table[aria-label="Field usage"]')?.textContent).toContain("Eligibility page");
    expect(container.querySelector('table[aria-label="Fields"] tbody')?.querySelectorAll('tr')).toHaveLength(1);
  });
  it("shows CSEA's collection setting and hides uncollected fields", async () => {
    await render("/admin-center/library/fields?site=csea&q=child-first-name");
    expect(container.textContent).not.toContain("Child records · Eligibility / childSection");
    expect(container.querySelector('table[aria-label="Fields"]')?.textContent).toContain("No fields match");
    await render("/admin-center/library/configurations?site=csea&view=applicants&q=notice-only");
    expect(container.querySelector('table[aria-label="Configurations"]')?.textContent).toContain("notice-only");
  });
  it("shows saved records without substituting generated analytics inventory", async () => {
    await render("/admin-center/library/analytics?site=csea&kind=field");
    const table = container.querySelector('table[aria-label="Analytics"]')!;
    expect(table.textContent).toContain("Stored analytics control");
    expect(table.querySelectorAll("tbody tr")).toHaveLength(1);
    const labels = [...container.querySelectorAll('[aria-label="Analytics filters"] label')].map(label => label.textContent);
    expect(labels[0]).toBe("Search analytics");
    expect(labels).toContain("Element type"); expect(labels).toContain("Search analytics");
    expect(container.querySelector('a[href*="/library/pages"]')).not.toBeNull();
  });
  it("moves the theme preview to Site Builder and keeps branding settings in Configurations", async () => {
    await render("/admin-center/library/themes");
    expect(container.querySelector('[aria-label="Primary color picker"]')).toBeNull();
    expect(container.querySelector('table[aria-label="Theme & branding settings"]')).not.toBeNull();
    expect(container.querySelector('a[href="/admin-center/site-builder?view=theme&site=all"]')).not.toBeNull();
    expect(container.textContent).toContain("Application theme preview");
    expect(container.textContent).toContain("Branding guidelines");
  });
  it('groups CMS content and existing email previews under Content', async () => {
    await render('/admin-center/library/content?site=asce');
    expect(tab('Content').getAttribute('aria-selected')).toBe('true');
    expect(tab('CMS').getAttribute('aria-selected')).toBe('true');
    expect(container.querySelector('table[aria-label="Content"]')).not.toBeNull();
    await click(tab('Emails'));
    expect(container.querySelector('table[aria-label="Email templates"]')).not.toBeNull();
  });
  it('lists existing recovery states without changing their copy or actions', async () => {
    await render('/admin-center/library/validation?site=asce&view=states');
    const table = container.querySelector('table[aria-label="Recovery states"]')!;
    for (const key of ['404', '500', 'session-expired', 'maintenance', 'offline', 'save-failed', 'save-conflict', 'application-unavailable', 'outcome-unknown', 'processing-pending', 'processing-timeout', 'processing-complete']) expect(table.textContent).toContain(key);
    expect(table.textContent).toContain('Please don’t submit it again or start a new application.');
  });
  it('keeps coverage policies under Configurations and functional behavior under Rules', async () => {
    await render('/admin-center/library/configurations?site=asce&view=coverage');
    expect(container.querySelector('table[aria-label="Coverage settings"]')?.textContent).toContain('Stored policy');
    await click(tab('Rules'));
    expect(container.querySelector('table[aria-label="Business rules"]')?.textContent).not.toContain('Stored policy');
    expect(container.querySelector('[aria-label="Configuration types"]')).toBeNull();
  });
  it("reports read errors and never displays a catalog fallback", async () => {
    vi.mocked(readLibraryCatalog).mockRejectedValue(new Error("Database unavailable"));
    await render("/admin-center/library/pages");
    expect(container.textContent).toContain("Database unavailable");
    expect(container.querySelector("table")).toBeNull();
  });
  it("uses stored Association labels in the Site selector", async () => {
    const changed = structuredClone(catalog);
    changed.data.clients.find(client => client.key === "asce")!.acronym = "SAVED ASSOCIATION";
    vi.mocked(readLibraryCatalog).mockResolvedValue(changed);
    await render("/admin-center/library/client-information?site=asce");
    const selector = container.querySelector<HTMLInputElement>('[aria-label="Site scope selector"] input');
    expect(selector?.value).toContain("SAVED ASSOCIATION");
    expect(vi.mocked(readLibraryCatalog).mock.calls.some(([site]) => site === "all")).toBe(true);
  });
  it("shows a single template setting without placeholder templates", async () => {
    await render("/admin-center/library/configurations?site=all&view=theme&q=Application template");
    const table = container.querySelector('table[aria-label="Theme & branding settings"]')!;
    expect(table.querySelectorAll('tbody tr')).toHaveLength(1);
    expect(table.textContent).toContain("single");
    expect(table.textContent).toContain("multi");
    expect(table.textContent).not.toContain("Fast Track");
  });

  it("links page components directly to Storybook without a separate Library section", async () => {
    vi.mocked(readLibraryCatalog).mockResolvedValue({ ...JSON.parse(readFileSync("public/catalog/portal.json", "utf8")), revision: "saved-components" });
    await render("/admin-center/library/pages?site=abe&q=resume-code");
    const table = container.querySelector('table[aria-label="Pages"]')!;
    expect(tab("Components")).toBeUndefined();
    expect(table.querySelector('a[href*="pages-resume-whole-page--email-code"]')).not.toBeNull();
    expect(table.querySelector('a[href*="/library/components"]')).toBeNull();
    expect(table.textContent).not.toContain("Review page components");
  });
  it("shows rule sequence, category tags, dependencies, and behavior as columns", async () => {
    await render("/admin-center/library/rules?site=all&q=Resolved next/back navigation");
    const table = container.querySelector('table[aria-label="Business rules"]')!;
    const headings = [...table.querySelectorAll('thead th')].map(cell => cell.textContent);
    expect(headings).toContain("Sequence");
    expect(headings).toContain("Category");
    expect(headings).toContain("Depends on");
    expect(table.textContent).toContain("Page advance");
    expect(table.querySelector('details')).toBeNull();
  });
  it("promotes feature descriptions and impacted areas to readable columns", async () => {
    await render("/admin-center/library/features?site=all");
    const table = container.querySelector('table[aria-label="Features"]')!;
    expect(table.textContent).not.toContain("View details");
    expect(table.querySelector('details')).toBeNull();
    expect([...table.querySelectorAll('thead th')].map(cell => cell.textContent)).toContain("Description");
  });
  it("replaces table filters on same-domain navigation without filtering sibling tables", async () => {
    const rows = [{ id: "alpha" }, { id: "beta" }];
    const columns = [{ id: "name", label: "Name", value: (row: { id: string }) => row.id }];
    const view = h("div", null,
      h(RouterLink, { to: "/admin-center/library/example?table=example&q=beta", children: "Next reference" }),
      h(BrowseTable<{ id: string }>, { label: "Example", tableName: "example", rows, columns, rowKey: row => row.id }),
      h(BrowseTable<{ id: string }>, { label: "Sibling", tableName: "sibling", rows, columns, rowKey: row => row.id }));
    await render("/admin-center/library/example?table=example&q=alpha", view);
    expect(container.querySelector('table[aria-label="Example"] tbody')?.textContent).toContain("alpha");
    await click(container.querySelector<HTMLAnchorElement>('a')!);
    const content = container.querySelector('table[aria-label="Example"] tbody')!.textContent!;
    expect(content).toContain("beta");
    expect(content).not.toContain("alpha");
    expect(container.querySelectorAll('table[aria-label="Sibling"] tbody tr')).toHaveLength(2);
  });
});
