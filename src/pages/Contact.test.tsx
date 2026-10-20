import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeAll, expect, it, vi } from "vitest";
import Contact from "./Contact";
import { createReviewedMigrationDatabase } from "../migration/fixtures";
import { installPrototypeLibrary, resolvePrototypeLibrary } from "../domain/prototypeLibrary";
import { isApplicantExperience, showContactBusinessSection } from "../domain/applicantExperience";
import { getClientPageFields } from "../config/clientFields/getClientPageFields";
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

it("reads persisted WAEPA contact policy for both Sites and preserves other Sites' DI/correspondence defaults", () => {
  for (const siteKey of ["waepa", "waepa-gi"]) {
    window.history.replaceState(null, "", `/?site=${siteKey}`);
    const library = resolvePrototypeLibrary(JSON.parse(JSON.stringify(db)), siteKey, "test");
    installPrototypeLibrary(library);
    expect(library.client.applicantExperience?.contact).toEqual({ hideBusinessAddress: true, hideCorrespondence: true });
    for (const coverageSelections of [[], ["li-group-term"], ["di-short-term"], ["li-group-term", "di-short-term"]]) {
      const fields = getClientPageFields("contact", { coverageSelections, "correspondence-to": "business" });
      expect(fields.some(field => field.id.startsWith("business-") || field.id === "correspondence-to")).toBe(false);
      expect(fields.some(field => field.id === "street-address")).toBe(true);
      expect(showContactBusinessSection(library.client.applicantExperience, coverageSelections.includes("di-short-term"), "business")).toBe(false);
    }
  }
  window.history.replaceState(null, "", "/?site=asce");
  const asce = resolvePrototypeLibrary(db, "asce", "test"); installPrototypeLibrary(asce);
  expect(getClientPageFields("contact", { "correspondence-to": "business" }).some(field => field.id === "correspondence-to")).toBe(true);
  expect(showContactBusinessSection(asce.client.applicantExperience, true, "home")).toBe(true);
  expect(showContactBusinessSection(asce.client.applicantExperience, false, "business")).toBe(true);
});

it("renders neither the business section nor correspondence question for WAEPA DI with stale correspondence answers", async () => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  window.history.replaceState(null, "", "/?site=waepa");
  installPrototypeLibrary(resolvePrototypeLibrary(db, "waepa", "test"));
  container = document.createElement("div"); document.body.append(container); root = createRoot(container);
  await act(async () => root!.render(<MemoryRouter><Contact /></MemoryRouter>));
  expect(container.querySelector('[name="correspondence-to"]')).toBeNull();
  expect(container.querySelector('[name^="business-"]')).toBeNull();
  expect(container.textContent).not.toContain("Business/Employer");
  expect(container.querySelector('[name="street-address"]')).not.toBeNull();
});

it("uses edited saved configuration and rejects invalid contact flags", () => {
  const changed = structuredClone(db);
  for (const row of changed.configurationValues.filter(row => row.siteKey === "waepa" && row.configurationKey.startsWith("applicantExperience.contact."))) row.value = false;
  const library = resolvePrototypeLibrary(changed, "waepa", "edited"); installPrototypeLibrary(library);
  window.history.replaceState(null, "", "/?site=waepa");
  expect(getClientPageFields("contact", { "correspondence-to": "business" }).some(field => field.id === "correspondence-to")).toBe(true);
  expect(showContactBusinessSection(library.client.applicantExperience, true, "business")).toBe(true);
  for (const contact of [null, [], { hideBusinessAddress: "yes" }, { hideCorrespondence: 1 }]) expect(isApplicantExperience({ contact })).toBe(false);
});
