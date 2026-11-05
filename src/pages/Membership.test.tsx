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

it("renders NSO's required nurse-type dropdown after the membership Yes answer", async () => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  window.history.replaceState(null, "", "/?site=nso");
  form.values.membership = "yes";
  installPrototypeLibrary(resolvePrototypeLibrary(db, "nso", "nurse-type-render"));
  container = document.createElement("div"); document.body.append(container); root = createRoot(container);
  await act(async () => root!.render(<MemoryRouter><Membership /></MemoryRouter>));
  expect(container.textContent).toContain("Nurse Type");
  expect(container.querySelector('[name="nurse-type"]')).not.toBeNull();
  form.values.membership = "no";
  await act(async () => root!.render(<MemoryRouter><Membership key="nonmember" /></MemoryRouter>));
  expect(container.querySelector('[name="nurse-type"]')).toBeNull();
  form.values.membership = "current";
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

it.each(["new", "current"])("shows active-duty ineligibility only after Next and keeps Next enabled for %s members", async membership => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  window.history.replaceState(null, "", "/?site=waepa");
  form.values.membership = membership;
  // Isolate page-level eligibility validation from unrelated required answers.
  const eligibilityDb = structuredClone(db);
  for (const field of eligibilityDb.fields) field.definition.required = false;
  for (const assignment of eligibilityDb.siteFieldConfigurations) {
    if (assignment.siteKey === "waepa" && assignment.pageKey === "membership") {
      assignment.values = { ...assignment.values, required: false };
    }
  }
  installPrototypeLibrary(resolvePrototypeLibrary(eligibilityDb, "waepa", "test"));
  container = document.createElement("div"); document.body.append(container); root = createRoot(container);
  await act(async () => root!.render(<MemoryRouter><Membership /></MemoryRouter>));
  expect(container.textContent).toContain("Additional Membership Information");
  expect(container.textContent).not.toContain("NOTICE: Receipt of Accelerated Death Benefits may affect eligibility for Public Assistance Programs and may be taxable.");
  expect(container.textContent).not.toContain("NOTICE FOR NEW YORK RESIDENTS, THE POLICY CONTAINS A WAR RESTRICTION");
  const militaryGroup = container.querySelector('[role="radiogroup"][aria-labelledby="active-military-label"]')!;
  const [yes, no] = militaryGroup.querySelectorAll<HTMLElement>('label.SelectionGroup-root');
  expect(yes).not.toBeNull(); expect(no).not.toBeNull();
  await act(async () => yes.click());
  expect(container.textContent).not.toContain("not eligible to apply for WAEPA coverage");
  expect(container.querySelector<HTMLButtonElement>('button[type="submit"]')?.disabled).toBe(false);
  await act(async () => no.click());
  expect(container.textContent).not.toContain("not eligible to apply for WAEPA coverage");
  await act(async () => yes.click());
  form.saveApplication.mockClear();
  await act(async () => container!.querySelector('form')!.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })));
  expect(container.textContent).toContain("not eligible to apply for WAEPA coverage");
  expect(container.querySelector<HTMLButtonElement>('button[type="submit"]')?.disabled).toBe(false);
  expect(form.saveApplication).not.toHaveBeenCalled();
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

it("renders the approved sibling Associate Member choice and member-information follow-ups", async () => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  window.history.replaceState(null, "", "/?site=waepa");
  Object.assign(form.values, { membership: "new", "waepa-attestation": "sibling-associate" });
  installPrototypeLibrary(resolvePrototypeLibrary(db, "waepa", "qualification-review"));
  container = document.createElement("div"); document.body.append(container); root = createRoot(container);
  try {
    await act(async () => root!.render(<MemoryRouter><Membership /></MemoryRouter>));
    expect(container.textContent).toContain("I am a sibling of a WAEPA member and want to apply as an Associate Member");
    expect(container.textContent).toContain("please include the current WAEPA member's membership information");
    expect(container.querySelector('input[name="waepa-member-first-name"]')).not.toBeNull();
    expect(container.querySelector('input[name="waepa-member-middle-initial"]')).not.toBeNull();
    expect(container.querySelector('input[name="waepa-member-last-name"]')).not.toBeNull();
    expect(container.querySelector('input[name="waepa-retirement-date"]')).toBeNull();
  } finally {
    form.values.membership = "current";
    Reflect.deleteProperty(form.values, "waepa-attestation");
  }
});

it.each(["waepa", "waepa-gi"])("renders TV, Radio and Newspaper only for new %s members", async site => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  window.history.replaceState(null, "", `/?site=${site}`);
  installPrototypeLibrary(resolvePrototypeLibrary(db, site, "referral-render"));
  Object.assign(form.values, { membership: site === "waepa" ? "new" : "yes", "membership-status": "new" });
  container = document.createElement("div"); document.body.append(container); root = createRoot(container);
  await act(async () => root!.render(<MemoryRouter><Membership /></MemoryRouter>));
  expect(container.textContent).toContain("How did you hear about WAEPA?");
  const referral = container.querySelector<HTMLElement>('[role="combobox"][aria-labelledby="membership-referral-source-label"]');
  expect(referral).not.toBeNull();
  expect(referral!.getAttribute("aria-required")).toBe("true");
  await act(async () => referral!.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, button: 0 })));
  const listbox = document.querySelector('[role="listbox"]')!;
  expect(listbox.getAttribute("aria-multiselectable")).toBe("true");
  for (const label of ["TV", "Radio", "Newspaper"]) expect(listbox.textContent).toContain(label);
  const options = listbox.querySelectorAll<HTMLElement>('[role="option"]');
  await act(async () => options[0].click());
  await act(async () => options[1].click());
  expect(referral!.textContent).toContain("TV, Radio");
  expect(!!container.querySelector('[role="radiogroup"][aria-labelledby="membership-status-label"]')).toBe(site === "waepa-gi");
  Object.assign(form.values, site === "waepa" ? { membership: "current" } : { "membership-status": "current" });
  await act(async () => root!.render(<MemoryRouter><Membership key="current" /></MemoryRouter>));
  expect(container.textContent).not.toContain("How did you hear about WAEPA?");
  form.values.membership = "current";
  delete (form.values as Record<string, unknown>)["membership-status"];
});
