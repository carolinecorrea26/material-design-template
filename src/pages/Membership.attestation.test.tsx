import { requirementText } from '../domain/requirementContent';
import { readFileSync } from "node:fs";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { afterEach, expect, it, vi } from "vitest";
import Membership from "./Membership";
import Eligibility from "./Eligibility";
import { installPrototypeLibrary, resolvePrototypeLibrary } from "../domain/prototypeLibrary";
import { validateSharedCatalog } from "../persistence/sharedCatalog";
import { applicationRecovery } from "../content/applicationRecovery";
import membershipContent from "../../requirements/global/content/membership.json";
import { freshStartSource } from '../domain/freshStartCatalog';

const form = vi.hoisted(() => ({ values: {} as Record<string, unknown>, setPageValues: vi.fn(), saveApplication: vi.fn(async () => null) }));
vi.mock("../app/ApplicationFormContext", () => ({ useApplicationForm: () => form }));
vi.mock("../app/ApplicationSessionContext", () => ({ useApplicationSession: () => ({ reviewSubmitted: false, markReviewSubmitted: vi.fn() }) }));
vi.mock("../app/SinglePageFlowContext", () => ({ useSinglePageFlow: () => null }));

let root: Root | undefined;
let container: HTMLDivElement;
const originalScroll = Object.getOwnPropertyDescriptor(Element.prototype, "scrollIntoView");
afterEach(async () => {
  if (root) await act(async () => root!.unmount());
  container?.remove();
  root = undefined;
  installPrototypeLibrary(null);
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
  if (originalScroll) Object.defineProperty(Element.prototype, "scrollIntoView", originalScroll);
  else Reflect.deleteProperty(Element.prototype, "scrollIntoView");
  window.sessionStorage.clear();
});

async function renderPage(page: "membership" | "eligibility", values: Record<string, unknown>, membership?: Record<string, unknown>, copy?: Record<string, unknown>) {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  vi.spyOn(window, "scrollTo").mockImplementation(() => {});
  Object.defineProperty(Element.prototype, "scrollIntoView", { configurable: true, value: vi.fn() });
  window.history.replaceState(null, "", `/${page}?site=asce`);
  const catalog = validateSharedCatalog(JSON.parse(readFileSync("public/catalog/portal.json", "utf8")));
  const source = membership || copy ? structuredClone(freshStartSource()) : undefined;
  if (source && membership) (source.fields.sites.asce as { fields: Record<string, unknown> }).fields.membership = membership!;
  if (source && copy) source.fields.sitePages!.asce.membership = { ...source.fields.sitePages!.asce.membership as object, content: copy };
  const library = resolvePrototypeLibrary(catalog.data, "asce", "test:membership-exception", source);
  // Exercise a configured disqualification rather than relying on ASCE having one today.
  library.client.applicantExperience = {
    ...library.client.applicantExperience,
    eligibilityDisqualifications: [{ applicant: "member", fieldId: "birth-date", value: "1990-08-26", message: "This applicant is not eligible." }],
  };
  installPrototypeLibrary(library);
  form.values = values;
  form.setPageValues.mockImplementation(patch => Object.assign(form.values, patch));
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  await act(async () => root!.render(<MemoryRouter>{page === "membership" ? <Membership /> : <Eligibility />}</MemoryRouter>));
}

const next = () => container.querySelector<HTMLButtonElement>('button[type="submit"]:not([aria-hidden="true"])')!;
const submit = async () => act(async () => { container.querySelector("form")!.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })); });

it("stops inline only for No and restores Membership after changing to Yes", async () => {
  await renderPage("membership", { membership: "no" });
  expect(next().disabled).toBe(true);
  const feedback = container.querySelector('form [role="alert"]');
  expect(feedback?.textContent).toContain("only members are eligible");
  expect(feedback?.textContent).toContain(membershipContent["membership.not-member.message"]);
  expect(feedback?.textContent).toContain(membershipContent["membership.not-member.heading"]);
  expect(feedback?.querySelector('a')?.getAttribute('href')).toBe('https://asceinsurance.com');
  expect(container.textContent).toContain(requirementText("membership.help.coverage-options"));
  expect(container.textContent).toContain(requirementText("membership.help.how-applying-works"));
  expect(container.textContent).not.toContain("How much does it cost?");
  expect(feedback?.closest("form")).not.toBeNull();
  expect(container.querySelector('[name="first-name"]')).toBeNull();
  expect(container.textContent).toContain("Throughout this site you will be referred to as a Member of the Civil Engineering profession.");

  await act(async () => container.querySelector<HTMLInputElement>('input[name="membership"][value="yes"]')!.click());
  expect(next().disabled).toBe(false);
  expect(container.textContent).not.toContain("only members are eligible");
  expect(container.querySelector('[name="first-name"]')).not.toBeNull();
  expect(container.querySelector('[name="member-id"]')).not.toBeNull();
  expect(container.textContent).toContain(membershipContent["membership.additional.title"]);
  for (const [id, token] of [["first-name", "given-name"], ["last-name", "family-name"], ["email", "email"], ["phone", "tel"]]) {
    expect(container.querySelector(`input[name="${id}"]`)?.getAttribute("autocomplete")).toBe(token);
  }

  // Other missing fields do not stop inline; they report errors after submission.
  await submit();
  expect(container.textContent).toContain(applicationRecovery.validation.message);
  expect(next().disabled).toBe(false);
  expect(form.saveApplication).not.toHaveBeenCalled();
});

it("validates an unanswered membership attestation on submission", async () => {
  await renderPage("membership", {});
  expect(next().disabled).toBe(false);
  expect(container.querySelector('.MuiAlert-standardError')).toBeNull();
  await submit();
  expect(container.textContent).toContain(applicationRecovery.validation.message);
  expect(next().disabled).toBe(false);
  expect(form.saveApplication).not.toHaveBeenCalled();
});

it('uses the submission error for a not-eligible category without extending the yes/no inline exception', async () => {
  await renderPage('membership', { membership: 'visitor' }, { configuration: 'category', options: [
    { value: 'engineer', label: 'Professional member', outcome: 'member' },
    { value: 'visitor', label: 'Visitor', outcome: 'not-eligible' },
  ] });
  expect(next().disabled).toBe(false);
  expect(container.querySelector('[name="first-name"]')).toBeNull();
  expect(container.querySelector('[name="member-id"]')).toBeNull();
  expect(container.querySelector('.MuiAlert-standardWarning')).toBeNull();
  await submit();
  expect(container.textContent).toContain(membershipContent['membership.not-member.message']);
  expect(next().disabled).toBe(false);
  expect(form.saveApplication).not.toHaveBeenCalled();
});

it('accepts digits only for ASCE Membership ID and validates the six-character minimum on submission', async () => {
  await renderPage('membership', { membership: 'yes' });
  const input = container.querySelector<HTMLInputElement>('input[name="member-id"]')!;
  expect(input.type).toBe('text');
  expect(input.inputMode).toBe('numeric');
  expect(input.minLength).toBe(6);
  const enter = async (value: string) => act(async () => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(input, value);
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await enter('00ab123');
  expect(input.value).toBe('00123');
  expect(container.textContent).not.toContain('Membership ID must be at least 6 characters.');
  expect(next().disabled).toBe(false);
  await submit();
  expect(container.textContent).toContain('Membership ID must be at least 6 characters.');
  expect(container.textContent).toContain(applicationRecovery.validation.message);
  expect(form.saveApplication).not.toHaveBeenCalled();
  await enter('001234');
  expect(input.value).toBe('001234');
  await submit();
  expect(container.textContent).not.toContain('Membership ID must be at least 6 characters.');
});

it("keeps Eligibility enabled and reports a disqualification in the page alert on submission", async () => {
  await renderPage("eligibility", {
    membership: "yes", "birth-date": "1990-08-26", "zip-postal-code": "10001", "state-province": "NY", dependents: [],
  });
  expect(next().disabled).toBe(false);
  expect(container.textContent).not.toContain("This applicant is not eligible.");
  expect(container.textContent).not.toContain("Member of the Civil Engineering profession");
  expect(container.querySelector('input[name="birth-date"]')?.getAttribute("autocomplete")).toBe("bday");
  await submit();
  const alert = [...container.querySelectorAll('[role="alert"]')].find(element => element.textContent === "Unfortunately you are ineligible for coverage. Please contact the Administrator for more information about eligibility.");
  expect(alert).toBeDefined();
  expect(alert!.closest("form")).toBeNull();
  expect(next().disabled).toBe(false);
  expect(form.saveApplication).not.toHaveBeenCalled();
});

it('renders configured Membership copy without changing the non-member stop and restores fields on acceptance', async () => {
  await renderPage('membership', { membership: 'no' }, undefined, {
    'membership.title': 'Apply for {{clientAcronym}} coverage',
    'membership.subhead': 'Configured Membership introduction.',
    'membership.page-note': 'Configured Membership information.',
    'membership.not-member.heading': 'Join your association',
    'membership.not-member.body': 'Configured joining instructions for {{clientName}}.',
    'membership.not-member.website': 'Join at {{clientWebsite}} or call {{clientPhone}}.',
  });
  for (const text of ['Apply for ASCE coverage', 'Configured Membership introduction.', 'Configured Membership information.', 'Join your association', 'Configured joining instructions']) expect(container.textContent).toContain(text);
  expect(container.textContent).not.toContain('Civil Engineering profession');
  expect(container.textContent).toContain(membershipContent['membership.not-member.message']);
  expect(container.querySelector('form [role="alert"] a')?.getAttribute('href')).toBe('https://asceinsurance.com');
  expect(next().disabled).toBe(true);
  expect(container.querySelector('[name="first-name"]')).toBeNull();
  await act(async () => container.querySelector<HTMLInputElement>('input[name="membership"][value="yes"]')!.click());
  expect(next().disabled).toBe(false);
  expect(container.querySelector('[name="first-name"]')).not.toBeNull();
  expect(container.textContent).not.toContain('Join your association');
});
it('omits a blank configured Membership information note', async () => {
  await renderPage('membership', {}, undefined, { 'membership.page-note': '' });
  expect(container.textContent).not.toContain('Civil Engineering profession');
});
