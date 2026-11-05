import { act } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeAll, expect, it, vi } from "vitest";
import { createReviewedMigrationDatabase } from "../migration/fixtures";
import { installPrototypeLibrary, resolvePrototypeLibrary, type PrototypeLibrary } from "../domain/prototypeLibrary";
import { ApplicationFormContext } from "../app/ApplicationFormContext";
import { ApplicationSessionProvider } from "../app/ApplicationSessionContext";
import HealthLi from "./HealthLi";
import HealthDi from "./HealthDi";
import HealthCi from "./HealthCi";

let libraries: Record<string, PrototypeLibrary>;
beforeAll(() => {
  const db = createReviewedMigrationDatabase();
  libraries = Object.fromEntries(['demo', 'asce', 'abe'].map(site => [site, resolvePrototypeLibrary(db, site, 'question-layout')]));
}, 120000);
afterEach(() => { installPrototypeLibrary(null); vi.unstubAllGlobals(); });

async function renderPage(page: "health-li" | "health-di" | "health-ci", amounts: Record<string, number>, assertions: (container: HTMLElement) => Promise<void> | void, site = page === "health-li" ? "demo" : page === "health-di" ? "asce" : "abe") {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  window.history.replaceState(null, "", `/${page}?site=${site}`);
  installPrototypeLibrary(libraries[site]);
  const values = {
    membership: "yes", state: "PA", "birth-date": "1986-01-01", "spouse-birth-date": "1986-01-01",
    "has-other-life-insurance": "no", "spouse-has-other-life-insurance": "no",
    coverageSelections: [...new Set(Object.keys(amounts).map(key => key.split(":")[0]))],
    productApplicants: Object.fromEntries([...new Set(Object.keys(amounts).map(key => key.split(":")[0]))].map(key => [key, Object.keys(amounts).filter(id => id.startsWith(`${key}:`)).map(id => id.split(":")[1])])),
    coverageAmounts: amounts,
    dependents: Object.keys(amounts).some(key => key.endsWith(":spouse")) ? ["spouse"] : [],
  };
  const container = document.createElement("div"), root = createRoot(container);
  document.body.append(container);
  const Page = { "health-li": HealthLi, "health-di": HealthDi, "health-ci": HealthCi }[page];
  try {
    await act(async () => root.render(<MemoryRouter><ApplicationSessionProvider><ApplicationFormContext.Provider value={{ values, setPageValues: () => {}, resetValues: () => {} }}><Page /></ApplicationFormContext.Provider></ApplicationSessionProvider></MemoryRouter>));
    await assertions(container);
  } finally { await act(async () => root.unmount()); container.remove(); }
}

it.each([
  ["health-li", { "li-term:member": 700000, "li-term:spouse": 700000 }, 15],
  ["health-di", { "di-ltd:member": 8000, "di-ltd:spouse": 1000 }, 7],
  ["health-ci", { "sh-critical-illness:member": 5000, "sh-critical-illness:spouse": 5000 }, 16],
] as const)("groups %s by question, then Member and Spouse with independent answers", async (page, amounts, count) => {
  await renderPage(page, amounts, async container => {
    const questions = [...container.querySelectorAll("[data-health-question]")];
    expect(questions).toHaveLength(count);
    expect(questions[0].querySelector("h2")?.textContent).toBe("Question 1");
    expect([...questions[0].querySelectorAll("[data-health-applicant]")].map(section => section.getAttribute("aria-label"))).toEqual(["Member", "Spouse"]);
    expect(container.querySelectorAll('[role="radiogroup"]')).toHaveLength(count * 2);
    expect(questions[0].querySelector('[data-health-applicant="self"]')?.textContent).toContain("You");
    expect(questions[0].querySelector('[data-health-applicant="spouse"]')?.textContent).toContain("Your Spouse");
    const member = questions[0].querySelector('[data-health-applicant="self"]')!;
    const spouse = questions[0].querySelector('[data-health-applicant="spouse"]')!;
    const memberYes = [...member.querySelectorAll<HTMLElement>('label.SelectionGroup-root')].find(radio => radio.textContent?.trim() === "Yes")!;
    const spouseYes = [...spouse.querySelectorAll<HTMLElement>('label.SelectionGroup-root')].find(radio => radio.textContent?.trim() === "Yes")!;
    expect(member.querySelector('[role="radiogroup"]')?.getAttribute("aria-labelledby")).not.toBe(spouse.querySelector('[role="radiogroup"]')?.getAttribute("aria-labelledby"));
    await act(async () => memberYes.click());
    expect(memberYes.querySelector<HTMLInputElement>('input[type="radio"]')?.checked).toBe(true);
    expect(spouseYes.querySelector<HTMLInputElement>('input[type="radio"]')?.checked).toBe(false);
    if (page !== "health-ci") {
      expect(member.querySelector("button")).not.toBeNull();
      expect(spouse.querySelector("button")).toBeNull();
    }
    expect(questions[1].querySelector("h2")?.textContent).toBe("Question 2");
  });
}, 120000);

it("groups corresponding CI questions even when the adults use different source variants", async () => {
  await renderPage("health-ci", { "sh-critical-illness:member": 5000, "li-term:member": 100000, "sh-critical-illness:spouse": 5000 }, container => {
    const questions = container.querySelectorAll("[data-health-question]");
    expect(questions).toHaveLength(16);
    expect(questions[0].querySelector('[role="radiogroup"][aria-labelledby="health-abe-form-79-member-label"]')).not.toBeNull();
    expect(questions[0].querySelector('[role="radiogroup"][aria-labelledby="health-abe-form-197-spouse-label"]')).not.toBeNull();
  });
});

it("shows only the spouse section for a spouse-only CI form", async () => {
  await renderPage("health-ci", { "sh-critical-illness:spouse": 5000 }, container => {
    expect(container.querySelectorAll('[data-health-applicant="self"]')).toHaveLength(0);
    expect(container.querySelectorAll('[data-health-applicant="spouse"]')).toHaveLength(16);
  });
});

it("omits a spouse DI questionnaire when the saved processing policy has no online questions", async () => {
  await renderPage("health-di", { "li-term:member": 100000, "di-ltd:member": 2000, "di-ltd:spouse": 1000 }, container => {
    expect(container.querySelectorAll('[role="radiogroup"][aria-labelledby="health-abe-form-160-member-label"]')).toHaveLength(1);
    expect(container.querySelectorAll('[role="radiogroup"][aria-labelledby="health-di-q1-spouse-label"]')).toHaveLength(0);
    for (const question of container.querySelectorAll("[data-health-question]")) expect(question.querySelectorAll("[data-health-applicant]")).toHaveLength(1);
  }, "abe");
});

it("hides the standard member section heading for a member-only questionnaire", async () => {
  await renderPage("health-ci", { "sh-critical-illness:member": 5000 }, container => {
    const member = container.querySelector('[data-health-applicant="self"]')!;
    expect(member.querySelector('[data-testid="PersonRoundedIcon"]')).toBeNull();
    expect(member.textContent).not.toContain("Member");
    expect(member.textContent).not.toContain("You");
    expect(container.querySelectorAll('[data-health-question]')).toHaveLength(16);
  });
});
