import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeAll, expect, it, vi } from "vitest";
import Membership from "./Membership";
import { createReviewedMigrationDatabase } from "../migration/fixtures";
import { installPrototypeLibrary, resolvePrototypeLibrary } from "../domain/prototypeLibrary";
import { isApplicantExperience, membershipIneligibilityMessage } from "../domain/applicantExperience";
import { getClientPageFields } from "../config/clientFields/getClientPageFields";
import type { DatabaseSchema } from "../persistence/types";

const form = vi.hoisted(() => ({ values: { membership: "current", "first-name": "Taylor", "last-name": "Morgan", email: "taylor@example.invalid", phone: "2025550123" }, setPageValues: vi.fn(), saveApplication: vi.fn() }));
vi.mock("../app/ApplicationFormContext", () => ({ useApplicationForm: () => form }));
vi.mock("../app/ApplicationSessionContext", () => ({ useApplicationSession: () => ({ reviewSubmitted: false, markReviewSubmitted: vi.fn() }) }));
vi.mock("../app/SinglePageFlowContext", () => ({ useSinglePageFlow: () => ({ pageId: "membership", navigationPending: false, setNavigationPending: vi.fn(), completeSection: vi.fn(), goToSection: vi.fn() }) }));

let db: DatabaseSchema;
let root: Root | undefined;
let container: HTMLDivElement | undefined;
beforeAll(() => { db = createReviewedMigrationDatabase(); }, 120000);
afterEach(async () => {
  if (root) await act(async () => root!.unmount());
  container?.remove(); root = undefined; container = undefined;
  installPrototypeLibrary(null); vi.unstubAllGlobals();
  window.sessionStorage.clear();
});

it("stores one global question, places it only on WAEPA, and reuses its answer in Coverage", () => {
  expect(db.fields.filter(field => field.key === "active-military")).toHaveLength(1);
  const waepa = resolvePrototypeLibrary(db, "waepa", "test");
  installPrototypeLibrary(waepa);
  window.history.replaceState(null, "", "/?site=waepa");
  for (const membership of ["new", "current"]) {
    expect(getClientPageFields("membership", { membership })).toContainEqual(expect.objectContaining({ id: "active-military", required: true, label: "Are you in active duty in the Armed Forces?" }));
    for (const coverageSelections of [[], ["li-group-term"], ["di-short-term"], ["li-group-term", "di-short-term"]]) {
      expect(membershipIneligibilityMessage(waepa.client.applicantExperience, { membership, coverageSelections, "active-military": "yes" })).toContain("not eligible");
      expect(membershipIneligibilityMessage(waepa.client.applicantExperience, { membership, coverageSelections, "active-military": "no" })).toBeUndefined();
    }
  }
  expect(getClientPageFields("coverage", {}).some(field => field.id.endsWith(":activeMilitary"))).toBe(false);
  expect(db.siteFieldConfigurations.some(row => row.siteKey === "waepa" && row.pageKey === "coverage" && (row.fieldKey === "active-military" || row.fieldKey.endsWith(":activeMilitary")))).toBe(false);
  for (const site of ["waepa-gi", "avma", "asce"]) {
    const other = resolvePrototypeLibrary(db, site, "test");
    expect(other.site.configuration.pages.find(page => page.key === "membership")?.fields.some(field => field.included && field.key === "active-military")).toBe(false);
    expect(membershipIneligibilityMessage(other.client.applicantExperience, { "active-military": "yes" })).toBeUndefined();
  }
});

it.each(["new", "current"])("shows the stored question, notices and immediate blocking error for %s members", async membership => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  window.history.replaceState(null, "", "/?site=waepa");
  form.values.membership = membership;
  installPrototypeLibrary(resolvePrototypeLibrary(db, "waepa", "test"));
  container = document.createElement("div"); document.body.append(container); root = createRoot(container);
  await act(async () => root!.render(<MemoryRouter><Membership /></MemoryRouter>));
  expect(container.textContent).toContain("Additional Membership Information");
  expect(container.textContent).toContain("NOTICE: Receipt of Accelerated Death Benefits may affect eligibility for Public Assistance Programs and may be taxable.");
  expect(container.textContent).toContain("NOTICE FOR NEW YORK RESIDENTS, THE POLICY CONTAINS A WAR RESTRICTION");
  const militaryGroup = container.querySelector('[role="radiogroup"][aria-labelledby="active-military-label"]')!;
  const [yes, no] = militaryGroup.querySelectorAll<HTMLElement>('[role="radio"]');
  expect(yes).not.toBeNull(); expect(no).not.toBeNull();
  await act(async () => yes.click());
  expect(container.querySelector('.MuiAlert-standardError')?.textContent).toContain("not eligible to apply for WAEPA coverage");
  expect(container.querySelector<HTMLButtonElement>('button[type="submit"]')?.disabled).toBe(true);
  await act(async () => no.click());
  expect(container.querySelector('.MuiAlert-standardError')).toBeNull();
  expect(container.querySelector<HTMLButtonElement>('button[type="submit"]')?.disabled).toBe(false);
});

it("reads the blocking value and message from saved configuration and rejects malformed rules", () => {
  const changed = structuredClone(db);
  const rule = changed.configurationValues.find(row => row.siteKey === "waepa" && row.configurationKey === "applicantExperience.membershipDisqualifications")!;
  expect(rule).toBeDefined();
  rule.value = [{ fieldId: "active-military", value: "no", message: "Saved review message" }];
  const library = resolvePrototypeLibrary(changed, "waepa", "edited");
  expect(membershipIneligibilityMessage(library.client.applicantExperience, { "active-military": "yes" })).toBeUndefined();
  expect(membershipIneligibilityMessage(library.client.applicantExperience, { "active-military": "no" })).toBe("Saved review message");
  for (const rules of [null, {}, [null], [{ fieldId: "active-military", value: "yes", message: 42 }], [{ fieldId: "", value: "yes", message: "Error" }]]) {
    expect(isApplicantExperience({ membershipDisqualifications: rules })).toBe(false);
    rule.value = rules;
    expect(() => resolvePrototypeLibrary(changed, "waepa", "invalid")).toThrow("Invalid applicant experience");
  }
});
