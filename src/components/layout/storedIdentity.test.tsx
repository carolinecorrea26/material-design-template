import { afterEach, beforeAll, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { createReviewedMigrationDatabase } from "../../migration/fixtures";
import type { DatabaseSchema } from "../../persistence/types";
import { installPrototypeLibrary, resolvePrototypeLibrary } from "../../domain/prototypeLibrary";
import { getTpaForClient } from "../../repositories/sites";
import { readMockEmailPreviews } from "../../utils/mockEmail";
import AppFooter from "./AppFooter";
import ClientHelpBanner from "./ClientHelpBanner";
import ProductCostBreakdown from "../ui/ProductCostBreakdown";

let database: DatabaseSchema;
beforeAll(() => { database = createReviewedMigrationDatabase(); }, 120000);
afterEach(() => { installPrototypeLibrary(null); window.history.replaceState(null, "", "/"); window.sessionStorage.clear(); window.localStorage.clear(); });

function install(siteKey: string) {
  window.history.replaceState(null, "", `/?site=${siteKey}&template=multi`);
  const library = resolvePrototypeLibrary(database, siteKey, "stored-contacts");
  installPrototypeLibrary(library);
  return library;
}

it.each([
  ["asce", "Pearl Insurance", "8006502723", "800-650-2723"],
  ["ama", "AMA Insurance Agency, Inc.", "8004585736", "800-458-5736"],
  ["csea", "Pearl Carroll & Associates, LLC", "8778472732", "(877) 847-2732"],
  ["waepa", "Worldwide Assurance for Employees of Public Agencies, Inc.", "8003683484", "800-368-3484"],
  ["waepa-gi", "Worldwide Assurance for Employees of Public Agencies, Inc.", "8003683484", "800-368-3484"],
  ["isitrust", "ISI", "8552837651", "855-283-7651"],
])("%s template renders the stored program contact and resolves its actual administrator", (siteKey, name, phone, display) => {
  const library = install(siteKey);
  expect(getTpaForClient(library.clientIdentity.key)?.name).toBe(name);
  const html = renderToStaticMarkup(<MemoryRouter><AppFooter client={library.client} /></MemoryRouter>);
  expect(html).toContain(`href="tel:${phone}"`);
  expect(html).toContain(display);
  expect(html).not.toContain("https://https://");
  if (siteKey === "csea") { expect(html).toContain("12 Cornell Road"); expect(html).not.toContain("13 Airline Drive"); }
  if (siteKey.startsWith("waepa")) { expect(html).toContain("433 Park Ave"); expect(html).toContain("info@waepa.org"); expect(html).not.toContain("Richmond"); }
  if (siteKey === "isitrust") {
    expect(html).toContain("P.O. Box 12009");
    expect(library.client.support.salesContact).toMatchObject({ phone: "8884741959", email: "sales@isidirect.com" });
  }
});

it("keeps AMA's help-ribbon and breakdown phone distinct from its administrator contact", () => {
  const { client } = install("ama");
  const banner = renderToStaticMarkup(<ClientHelpBanner client={client} />);
  const breakdown = renderToStaticMarkup(<ProductCostBreakdown premiumCost={10} riderItems={[]} rateFrequency="monthly" helpPhone={client.support.helpPhone} />);
  for (const html of [banner, breakdown]) {
    expect(html).toContain('href="tel:8886275902"');
    expect(html).toContain("888-627-5902");
    expect(html).not.toContain("800-458-5736");
  }
});

it("uses captured administrator identity in applicant emails without substituting the Association name", () => {
  window.history.replaceState(null, "", "/?site=asce");
  const changed = structuredClone(database);
  const client = changed.clients.find(row => row.key === "asce")!;
  changed.organizations.find(row => row.id === client.organizationId)!.name = "Saved administrator example";
  const library = resolvePrototypeLibrary(changed, "asce", "saved-admin");
  delete library.client.emailSupport?.contactOverride;
  installPrototypeLibrary(library);
  expect(readMockEmailPreviews("asce").some(preview => preview.html.includes("Saved administrator example"))).toBe(true);
});

it("retains original contact evidence separately from the executable saved support profile", () => {
  const decision = database.semanticRequirements.find(row => row.key === "business-decision.step1.waepa-program-contact");
  expect(decision?.value).toMatchObject({ sourceReference: "Associations!D346", previousSupport: { email: "support@waepa.org", address: { city: "Richmond" } } });
  expect(database.sourceRequirements.find(row => row.sheetKey === "associations" && row.cell === "D346")?.value).toContain("433 Park Ave");
});
