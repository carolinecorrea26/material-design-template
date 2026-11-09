import { readFileSync } from "node:fs";
import { transferableAbortController } from "node:util";
import { act, type ComponentType } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterAll, afterEach, beforeAll, expect, it, vi } from "vitest";
import { validateSharedCatalog } from "../persistence/sharedCatalog";
import { installPrototypeLibrary, resolvePrototypeLibrary } from "../domain/prototypeLibrary";
import { applicationStorageKey } from "./ApplicationFormContext";
import { applicationSessionStorage } from "./applicationSessionStorage";
import { applicationTimeoutKey, timeoutMilliseconds } from "./applicationTimeout";
import { MESSAGE_DURATION } from "../config/transitionMessages";
import asceEligibility from "../../requirements/parked/sites/asce/eligibility.json";
import verificationFixture from "../../requirements/global/prototype-fixtures/verification.json";
import { requirementText } from "../domain/requirementContent";
import { candidateMockRatingService } from "../mock/client";

let App: ComponentType;
let router: typeof import("./router")["router"];
let root: Root | undefined;
let container: HTMLDivElement;
const catalog = validateSharedCatalog(JSON.parse(readFileSync("public/catalog/portal.json", "utf8")));
const library = resolvePrototypeLibrary(catalog.data, "asce", "test:entry-flow");
function browserStorage(): Storage {
  const values = new Map<string, string>();
  return { get length() { return values.size; }, clear: () => values.clear(), getItem: key => values.get(key) ?? null,
    key: index => [...values.keys()][index] ?? null, removeItem: key => { values.delete(key); }, setItem: (key, value) => { values.set(key, String(value)); } };
}

beforeAll(async () => {
  vi.stubGlobal("localStorage", browserStorage());
  window.history.replaceState(null, "", "/?site=asce");
  installPrototypeLibrary(library);
  App = (await import("./App")).default;
  router = (await import("./router")).router;
}, 120000);
afterEach(async () => {
  if (root) await act(async () => root!.unmount());
  root = undefined;
  container?.remove();
  sessionStorage.clear();
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
afterAll(() => { router?.dispose(); installPrototypeLibrary(null); });

async function open(path = "/?site=asce", expired = false) {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  // Node Request and jsdom AbortSignal use different realms; the real router
  // needs Node's matching signal implementation in this test environment.
  vi.stubGlobal("AbortController", function AbortController() { return transferableAbortController(); });
  vi.stubGlobal("localStorage", browserStorage());
  localStorage.setItem("cookieConsent", "accepted");
  vi.spyOn(window, "scrollTo").mockImplementation(() => {});
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => window.setTimeout(() => callback(Date.now()), 16));
  vi.stubGlobal("cancelAnimationFrame", (id: number) => window.clearTimeout(id));
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-11-08T17:00:00Z"));
  sessionStorage.clear();
  if (expired) {
    sessionStorage.setItem(applicationTimeoutKey("asce"), String(Date.now() - 1000));
    sessionStorage.setItem(applicationStorageKey("asce"), JSON.stringify({ email: "previous@example.test", "first-name": "Previous" }));
    applicationSessionStorage.writeReviewSubmitted(true);
    applicationSessionStorage.writeAdvisorApplicantFlow(true);
  }
  await act(async () => { await router.navigate(path, { replace: true }); });
  container = document.createElement("div"); document.body.append(container); root = createRoot(container);
  await act(async () => root!.render(<App />));
}
async function clickLink(label: string) {
  const link = [...container.querySelectorAll<HTMLAnchorElement>("a")].find(link => link.textContent === label);
  expect(link, label).toBeTruthy();
  await act(async () => link!.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, button: 0 })));
  await act(async () => vi.advanceTimersByTime(MESSAGE_DURATION + 50));
}
function expectMembership() {
  expect(router.state.location.pathname).toBe("/membership");
  expect(container.querySelector("#membership-form")).not.toBeNull();
  expect(container.textContent).not.toContain("Your session has timed out");
  const deadline = Number(sessionStorage.getItem(applicationTimeoutKey("asce")));
  expect(deadline).toBeGreaterThan(Date.now());
  expect(deadline).toBeLessThanOrEqual(Date.now() + timeoutMilliseconds);
}

it.each(['eligibility', 'contact'])('shows shared resume feedback on %s and preserves route context', async page => {
  await open();
  await clickLink('Start my application');
  await act(async () => router.navigate(`/${page}?site=asce&campaign=resumed#position`, {
    state: { resumeLoaded: true, retained: 'yes' },
  }));
  expect(container.textContent).toContain('Saved application loaded successfully.');
  expect(router.state.location).toMatchObject({
    pathname: `/${page}`, search: '?site=asce&campaign=resumed', hash: '#position', state: { retained: 'yes' },
  });
  await act(async () => vi.advanceTimersByTimeAsync(4500));
  await act(async () => vi.advanceTimersByTimeAsync(300));
  expect(container.textContent).not.toContain('Saved application loaded successfully.');
});

async function fill(name: string, value: string) {
  const input = document.querySelector<HTMLInputElement>(`input[name="${name}"]`)!;
  expect(input, name).not.toBeNull();
  await act(async () => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(input, value);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
}
async function submit(page: string) {
  await act(async () => container.querySelector(`#${page}-form`)!.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })));
  await act(async () => vi.advanceTimersByTime(MESSAGE_DURATION * 2 + 100));
}

it("starts a fresh application from the real Home page", async () => {
  await open(); await clickLink("Start my application"); expectMembership();
});

it.each(["default", "quoteFirst"])("starts a new session from %s Home after the previous application expired", async variant => {
  await open(`/?site=asce&variant=${variant}`, true);
  await clickLink("Start my application");
  expectMembership();
  await act(async () => container.querySelector<HTMLInputElement>('input[name="membership"][value="yes"]')!.click());
  expect(container.querySelector<HTMLInputElement>('input[name="email"]')?.value).toBe("");
  expect(applicationSessionStorage.read()).toEqual({ reviewSubmitted: false, advisorApplicantFlow: false });
});

it("recovers through Start new application without returning to the expired-session loop", async () => {
  await open("/session-expired?site=asce", true);
  expect(container.textContent).toContain("Your session has timed out");
  await clickLink("Start new application");
  expect(router.state.location.pathname).toBe("/");
  await clickLink("Start my application"); expectMembership();
});

it("keeps Continue application on the resume path without renewing or clearing the expired draft", async () => {
  await open("/?site=asce", true);
  const deadline = sessionStorage.getItem(applicationTimeoutKey("asce"));
  const draft = sessionStorage.getItem(applicationStorageKey("asce"));
  await clickLink("Continue application");
  expect(router.state.location.pathname).toBe("/resume");
  expect(sessionStorage.getItem(applicationTimeoutKey("asce"))).toBe(deadline);
  expect(sessionStorage.getItem(applicationStorageKey("asce"))).toBe(draft);
});

it.each([false, true])("continues through Membership and Eligibility to Coverage with campaign amount controls %s", async campaign => {
  await open(campaign ? "/?site=asce&amt=G-10500-1_200000&dprods=G-10500-1" : "/?site=asce", true);
  vi.spyOn(candidateMockRatingService, "quote").mockImplementation(async () => ({ mode: "mock", premiumCents: 12000, expiresAt: Date.now() + 60000, authority: "Synthetic test rates" }));
  await clickLink("Start my application");
  expectMembership();
  await act(async () => container.querySelector<HTMLInputElement>('input[name="membership"][value="yes"]')!.click());
  await fill("first-name", "Entry"); await fill("last-name", "Applicant");
  await fill("email", "entry@example.test"); await fill("phone", "2125550123");
  await act(async () => document.getElementById("phone-type")!.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, button: 0 })));
  await act(async () => [...document.querySelectorAll<HTMLElement>('[role="option"]')].find(option => option.dataset.value === "mobile")!.click());
  await fill("member-id", "00123456");
  await submit("membership");
  expect(router.state.location.pathname, container.textContent ?? "").toBe("/eligibility");
  await fill("zip-postal-code", "10001");
  await fill("birth-date", "01/15/1990");
  await submit("eligibility");
  expect(router.state.location.pathname, container.textContent ?? "").toBe("/coverage");
  expect(container.querySelector("#coverage-form")).not.toBeNull();
  expect(container.querySelector('input[name="coverage-categories"][value="AD"]')).not.toBeNull();
  expect(container.textContent).not.toContain("Your session has timed out");
  if (campaign) {
    await act(async () => container.querySelector<HTMLInputElement>('input[name="coverage-categories"][value="LI"]')!.click());
    await act(async () => container.querySelector<HTMLInputElement>('input[name="gender"][value="male"]')!.click());
    await act(async () => container.querySelector<HTMLInputElement>('input[name="smoker"][value="no"]')!.click());
    await act(async () => [...container.querySelectorAll<HTMLButtonElement>("button")].find(button => button.textContent?.trim() === requirementText("coverage.reveal.button"))!.click());
    await act(async () => vi.advanceTimersByTimeAsync(MESSAGE_DURATION * 2 + 1000));
    const amount = document.getElementById("li-term:member-amount") as HTMLInputElement;
    expect(amount).not.toBeNull();
    expect(amount.disabled || amount.getAttribute("aria-disabled") === "true").toBe(true);
    const saved = JSON.parse(sessionStorage.getItem(applicationStorageKey("asce"))!);
    expect(saved.coverageAmounts["li-term:member"]).toBe(200000);
    expect(saved.coverageSelections ?? []).not.toContain("li-term");
    expect(saved.coverageEntryScope).toMatchObject({ amt: "G-10500-1_200000", dprods: "G-10500-1" });
    const add = document.querySelector<HTMLInputElement>('input[name="li-term:member-selected"]');
    expect(add).not.toBeNull();
    await act(async () => add!.click());
    await act(async () => vi.advanceTimersByTimeAsync(MESSAGE_DURATION * 2 + 1000));
    await submit("coverage");
    expect(router.state.location.pathname, container.textContent ?? "").toBe("/beneficiary");
  }
});

it.each(["passed", "failed", "skipped"] as const)("runs the existing-insured-member TPA flow and gates the portfolio after verification is %s", async outcome => {
  const facts = asceEligibility.tpa.prototypeRecords[0].facts;
  await open("/?site=asce");
  // Keep the separate synthetic-rating HTTP service deterministic while the
  // real application, verification, Coverage state and dropdowns run together.
  vi.spyOn(candidateMockRatingService, "quote").mockImplementation(async () => ({ mode: "mock", premiumCents: 12000, expiresAt: Date.now() + 60000, authority: "Synthetic test rates" }));
  await clickLink("Start my application");
  await act(async () => container.querySelector<HTMLInputElement>('input[name="membership"][value="yes"]')!.click());
  await fill("first-name", facts["first-name"]); await fill("last-name", facts["last-name"]);
  await fill("email", "verified.member@example.test"); await fill("phone", "2125550123");
  await act(async () => document.getElementById("phone-type")!.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, button: 0 })));
  await act(async () => [...document.querySelectorAll<HTMLElement>('[role="option"]')].find(option => option.dataset.value === "mobile")!.click());
  await fill("member-id", facts["member-id"]);
  await submit("membership");
  expect(router.state.location.pathname).toBe("/eligibility");
  await fill("zip-postal-code", "10001");
  const [year, month, day] = facts["birth-date"].split("-");
  await fill("birth-date", `${month}/${day}/${year}`);
  await submit("eligibility");
  expect(router.state.location.pathname).toBe("/eligibility");
  expect([...document.querySelectorAll('[role="dialog"]')].map(dialog => dialog.textContent).join("\n")).toContain(requirementText("eligibility.verification.address.title"));
  await fill("street-address", "100 Example Avenue"); await fill("city", "New York");
  const dialogButton = (label: string) => [...document.querySelectorAll<HTMLButtonElement>('[role="dialog"] button')].find(button => button.textContent?.trim() === label)!;
  await act(async () => dialogButton(requirementText("eligibility.verification.address.continue")).click());
  const method = outcome === "skipped" ? "skip" : "security-questions";
  await act(async () => document.querySelector<HTMLInputElement>(`input[name="verification-method"][value="${method}"]`)!.click());
  await act(async () => dialogButton(requirementText("eligibility.verification.next")).click());
  if (outcome !== "skipped") {
    for (const [index, question] of verificationFixture.questions.entries()) {
      const answer = outcome === "failed" && index === 0 ? verificationFixture.failureAnswer : question.options.find(option => option !== verificationFixture.failureAnswer)!;
      const input = [...document.querySelectorAll<HTMLInputElement>(`input[name="${question.id}"]`)].find(input => input.value === answer)!;
      await act(async () => input.click());
    }
    await act(async () => dialogButton(requirementText("eligibility.verification.next")).click());
    expect(document.body.textContent).toContain(requirementText(outcome === "passed" ? "eligibility.verification.success.title" : "eligibility.verification.failure.title"));
  }
  await act(async () => dialogButton(requirementText("eligibility.verification.continue")).click());
  await act(async () => vi.advanceTimersByTimeAsync(MESSAGE_DURATION * 2 + 200));
  expect(router.state.location.pathname).toBe("/coverage");
  const portfolio = [...container.querySelectorAll<HTMLButtonElement>("button")].find(button => button.textContent?.trim() === requirementText("coverage.portfolio.button"));
  const saved = JSON.parse(sessionStorage.getItem(applicationStorageKey("asce"))!);
  expect(saved).toMatchObject({ "tpa-existing-member": true, "tpa-active-coverage": true, "tpa-verified": outcome === "passed", "tpa-portfolio-enabled": outcome === "passed" });
  if (outcome === "passed") {
    expect(portfolio).toBeDefined();
    await act(async () => portfolio!.click());
    expect(document.body.textContent).toContain(library.content.help.coveragePortfolio.title);
    expect(document.body.textContent).toContain("$250,000");
    expect(document.body.textContent).toContain("Term Life Insurance");
    await act(async () => document.querySelector<HTMLButtonElement>('button[aria-label="Close drawer"]')!.click());
  } else {
    expect(portfolio).toBeUndefined();
    expect(saved["tpa-submission-decision"]).toBe("manual-review");
  }
  await act(async () => container.querySelector<HTMLInputElement>('input[name="coverage-categories"][value="LI"]')!.click());
  await act(async () => container.querySelector<HTMLInputElement>('input[name="gender"][value="male"]')!.click());
  await act(async () => container.querySelector<HTMLInputElement>('input[name="smoker"][value="no"]')!.click());
  const reveal = [...container.querySelectorAll<HTMLButtonElement>("button")].find(button => button.textContent?.trim() === requirementText("coverage.reveal.button"))!;
  await act(async () => reveal.click());
  await act(async () => vi.advanceTimersByTimeAsync(MESSAGE_DURATION * 2 + 1000));
  const amountSelect = document.getElementById("li-term:member-amount");
  expect(amountSelect, container.textContent ?? "").not.toBeNull();
  await act(async () => amountSelect!.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, button: 0 })));
  const options = [...document.querySelectorAll<HTMLElement>('[role="option"]')].map(option => option.textContent?.trim());
  expect(options).toContain("$750,000");
  expect(options.includes("$1,000,000")).toBe(outcome !== "passed");
  const numeric = options.map(value => Number(value?.replace(/[$,]/g, ""))).filter(Number.isFinite);
  expect(Math.max(...numeric)).toBe(outcome === "passed" ? 750000 : 1000000);
});
