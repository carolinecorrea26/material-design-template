import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeAll, expect, it, vi } from "vitest";
import Contact from "./Contact";
import { createReviewedMigrationDatabase } from "../migration/fixtures";
import { installPrototypeLibrary, resolvePrototypeLibrary } from "../domain/prototypeLibrary";
import { isApplicantExperience, showContactBusinessSection } from "../domain/applicantExperience";
import { getClientPageFields } from "../config/clientFields/getClientPageFields";
import { applyWaepaContactAdoption } from "../migration/waepaContactAdoption";
import type { DatabaseSchema } from "../persistence/types";

const form = vi.hoisted(() => ({ values: { coverageSelections: ["di-short-term"], productApplicants: { "di-short-term": ["member"] }, "correspondence-to": "business", "business-address-same-as-home": true }, setPageValues: vi.fn(), saveApplication: vi.fn() }));
vi.mock("../app/ApplicationFormContext", () => ({ useApplicationForm: () => form }));
vi.mock("../app/ApplicationSessionContext", () => ({ useApplicationSession: () => ({ reviewSubmitted: false, markReviewSubmitted: vi.fn() }) }));
vi.mock("../app/SinglePageFlowContext", () => ({ useSinglePageFlow: () => ({ pageId: "contact", navigationPending: false, setNavigationPending: vi.fn(), completeSection: vi.fn(), goToSection: vi.fn() }) }));
let db: DatabaseSchema;
let root: Root | undefined;
let container: HTMLDivElement | undefined;
beforeAll(() => { db = createReviewedMigrationDatabase(); }, 120000);
afterEach(async () => {
  if (root) await act(async () => root!.unmount());
  container?.remove(); root = undefined; container = undefined;
  installPrototypeLibrary(null); vi.unstubAllGlobals(); window.sessionStorage.clear();
});

it("shows Standard WAEPA business details only for STD, retaining GI hiding and other Sites' defaults", () => {
  for (const siteKey of ["waepa", "waepa-gi"]) {
    window.history.replaceState(null, "", `/?site=${siteKey}`);
    const library = resolvePrototypeLibrary(JSON.parse(JSON.stringify(db)), siteKey, "test");
    installPrototypeLibrary(library);
    expect(library.client.applicantExperience?.contact).toEqual({ hideBusinessAddress: true, hideCorrespondence: true, ...(siteKey === "waepa" ? { businessAddressProducts: ["di-short-term"] } : {}) });
    for (const coverageSelections of [[], ["li-group-term"], ["di-short-term"], ["li-group-term", "di-short-term"]]) {
      const fields = getClientPageFields("contact", { coverageSelections, "correspondence-to": "business" });
      const showBusiness = siteKey === "waepa" && coverageSelections.includes("di-short-term");
      expect(fields.some(field => field.id.startsWith("business-"))).toBe(showBusiness);
      expect(fields.some(field => field.id === "correspondence-to" || field.id === "phone")).toBe(false);
      expect(fields.some(field => field.id === "street-address")).toBe(true);
      expect(showContactBusinessSection(library.client.applicantExperience, coverageSelections.includes("di-short-term"), "business", coverageSelections)).toBe(showBusiness);
    }
    expect(getClientPageFields("membership", {}).some(field => field.id === "phone")).toBe(true);
    expect(getClientPageFields("eligibility", {}).some(field => field.id === "phone")).toBe(false);
  }
  window.history.replaceState(null, "", "/?site=asce");
  const asce = resolvePrototypeLibrary(db, "asce", "test"); installPrototypeLibrary(asce);
  expect(getClientPageFields("contact", { "correspondence-to": "business" }).some(field => field.id === "correspondence-to")).toBe(true);
  expect(showContactBusinessSection(asce.client.applicantExperience, true, "home")).toBe(true);
  expect(showContactBusinessSection(asce.client.applicantExperience, false, "business")).toBe(true);
});

it.each([true, false])("renders the WAEPA business section only with STD selected=%s, ignoring stale correspondence", async withStd => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  window.history.replaceState(null, "", "/?site=waepa");
  installPrototypeLibrary(resolvePrototypeLibrary(db, "waepa", "test"));
  form.values.coverageSelections = withStd ? ["di-short-term"] : ["li-group-term"];
  container = document.createElement("div"); document.body.append(container); root = createRoot(container);
  await act(async () => root!.render(<MemoryRouter><Contact /></MemoryRouter>));
  expect(container.querySelector('[name="correspondence-to"]')).toBeNull();
  expect(!!container.querySelector('[name^="business-"]')).toBe(withStd);
  expect(container.textContent?.includes("Business / Employer")).toBe(withStd);
  expect(container.querySelector('[name="street-address"]')).not.toBeNull();
});

it("uses edited saved configuration and rejects invalid contact flags", () => {
  const changed = structuredClone(db);
  for (const row of changed.configurationValues.filter(row => row.siteKey === "waepa" && row.configurationKey.startsWith("applicantExperience.contact."))) row.value = row.configurationKey.endsWith("businessAddressProducts") ? ["li-group-term"] : false;
  const library = resolvePrototypeLibrary(changed, "waepa", "edited"); installPrototypeLibrary(library);
  window.history.replaceState(null, "", "/?site=waepa");
  expect(getClientPageFields("contact", { "correspondence-to": "business" }).some(field => field.id === "correspondence-to")).toBe(true);
  expect(showContactBusinessSection(library.client.applicantExperience, false, "home", ["li-group-term"])).toBe(true);
  expect(showContactBusinessSection(library.client.applicantExperience, true, "business", ["di-short-term"])).toBe(false);
  for (const contact of [null, [], { hideBusinessAddress: "yes" }, { hideCorrespondence: 1 }, { businessAddressProducts: [] }, { businessAddressProducts: [1] }, { businessAddressProducts: ["di-short-term", "di-short-term"] }]) expect(isApplicantExperience({ contact })).toBe(false);
  changed.configurationValues.find(row => row.key.endsWith("waepa.applicantExperience.contact.businessAddressProducts"))!.value = ["missing-product"];
  expect(() => resolvePrototypeLibrary(changed, "waepa", "invalid-product-scope")).toThrow("Invalid business-address product scope");
});

it("preserves earlier captures and WAEPA GI through an idempotent scoped adoption", () => {
  const earlier = structuredClone(db);
  earlier.configurationValues = earlier.configurationValues.filter(row => row.key !== "site:waepa.applicantExperience.contact.businessAddressProducts");
  const captured = resolvePrototypeLibrary(earlier, "waepa", "before-STD-address");
  applyWaepaContactAdoption(earlier);
  expect(showContactBusinessSection(captured.client.applicantExperience, true, "home", ["di-short-term"])).toBe(false);
  expect(showContactBusinessSection(resolvePrototypeLibrary(earlier, "waepa", "after-STD-address").client.applicantExperience, true, "home", ["di-short-term"])).toBe(true);
  expect(resolvePrototypeLibrary(earlier, "waepa-gi", "GI-isolation").site).toEqual(resolvePrototypeLibrary(db, "waepa-gi", "GI-baseline").site);
  expect(resolvePrototypeLibrary(earlier, "waepa", "recovered-value").client).toEqual(resolvePrototypeLibrary(db, "waepa", "baseline-value").client);
  const once = structuredClone(earlier);
  applyWaepaContactAdoption(earlier);
  expect(earlier).toEqual(once);
});

it("copies home address into a visible same-as-home business address before allowing separate edits", async () => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  window.history.replaceState(null, "", "/?site=asce");
  installPrototypeLibrary(resolvePrototypeLibrary(db, "asce", "same-home"));
  Object.assign(form.values, { coverageSelections: ["di-ltd"], productApplicants: { "di-ltd": ["member"] }, "business-address-same-as-home": true, "street-address": "100 Home Street", city: "Home City", state: "PA", "zip-code": "19101" });
  container = document.createElement("div"); document.body.append(container); root = createRoot(container);
  await act(async () => root!.render(<MemoryRouter><Contact /></MemoryRouter>));
  const label = [...container.querySelectorAll(".SelectionGroup-label")].find(element => element.textContent?.includes("Business address is the same as home address"))!;
  const same = label.parentElement!.querySelector('input[type="checkbox"]') as HTMLInputElement;
  expect(same.checked).toBe(true);
  await act(async () => same.click());
  expect((container.querySelector('[name="business-street-address"]') as HTMLInputElement).value).toBe("100 Home Street");
  expect((container.querySelector('[name="business-city"]') as HTMLInputElement).value).toBe("Home City");
  expect((container.querySelector('[name="business-zip-code"]') as HTMLInputElement).value).toBe("19101");
});
