import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeAll, expect, it, vi } from "vitest";
import Membership from "./Membership";
import { createReviewedMigrationDatabase } from "../migration/fixtures";
import { installPrototypeLibrary, resolvePrototypeLibrary } from "../domain/prototypeLibrary";
import { MESSAGE_DURATION } from "../config/transitionMessages";
import type { DatabaseSchema } from "../persistence/types";

const form = vi.hoisted(() => ({ values: {} as Record<string, unknown>, setPageValues: vi.fn(), saveApplication: vi.fn(async () => null), setActiveAssociationId: vi.fn() }));
const flow = vi.hoisted(() => ({ pageId: "membership", navigationPending: false, setNavigationPending: vi.fn(), completeSection: vi.fn(), goToSection: vi.fn() }));
const lookup = vi.hoisted(() => vi.fn());
vi.mock("../services/membershipLookupService", () => ({ lookupMockMembership: lookup }));
vi.mock("../utils/mockEmail", () => ({ sendAutosaveMockEmail: vi.fn(async () => undefined) }));
vi.mock("../app/ApplicationFormContext", () => ({ useApplicationForm: () => form }));
vi.mock("../app/ApplicationSessionContext", () => ({ useApplicationSession: () => ({ reviewSubmitted: false, markReviewSubmitted: vi.fn() }) }));
vi.mock("../app/SinglePageFlowContext", () => ({ useSinglePageFlow: () => flow }));
vi.mock("../components/coverage/QuoteCalculator", () => ({ default: () => null }));

let db: DatabaseSchema, root: Root | undefined, container: HTMLDivElement;
beforeAll(() => { db = createReviewedMigrationDatabase(); }, 120000);
afterEach(async () => {
  if (root) await act(async () => root!.unmount());
  root = undefined;
  container?.remove();
  installPrototypeLibrary(null);
  vi.useRealTimers();
  vi.unstubAllGlobals();
  window.sessionStorage.clear();
  vi.clearAllMocks();
});

async function prepare(overrides: Record<string, string> = {}) {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  window.history.replaceState(null, "", "/membership?site=ama");
  const library = resolvePrototypeLibrary(db, "ama", "membership-no-lookup");
  // Old saved configuration must not bring the rejected applicant dialog back.
  expect(library.client.applicantExperience?.membershipLookup).toBeDefined();
  installPrototypeLibrary(library);
  form.values = { membership: "physician", "first-name": "Taylor", "last-name": "Morgan", email: "taylor@example.invalid", phone: "2025550123", ...overrides };
  form.setPageValues.mockImplementation(values => Object.assign(form.values, values));
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  await act(async () => root!.render(<MemoryRouter><Membership /></MemoryRouter>));
}

async function submit() {
  await act(async () => container.querySelector('form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })));
}

it("continues AMA Membership without a record dialog or an extra date-of-birth step", async () => {
  await prepare();
  expect(container.querySelector('input[name="birth-date"]')).toBeNull();
  vi.useFakeTimers();
  await submit();
  expect(document.querySelector('[role="dialog"]')).toBeNull();
  expect(lookup).not.toHaveBeenCalled();
  expect(form.saveApplication).toHaveBeenCalled();
  expect(form.values.membershipLookupResult).toBeUndefined();
  await act(async () => { await vi.advanceTimersByTimeAsync(MESSAGE_DURATION * 2); });
  expect(flow.completeSection).toHaveBeenCalledWith("membership", "eligibility");
});

it("still validates Membership fields before continuing", async () => {
  await prepare({ "first-name": "" });
  vi.useFakeTimers();
  await submit();
  expect(container.textContent).toContain("First Name is required.");
  expect(document.querySelector('[role="dialog"]')).toBeNull();
  expect(lookup).not.toHaveBeenCalled();
  expect(form.saveApplication).not.toHaveBeenCalled();
  expect(flow.completeSection).not.toHaveBeenCalled();
});
