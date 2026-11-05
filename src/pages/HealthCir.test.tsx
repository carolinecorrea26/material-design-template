import { act } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { afterEach, expect, it, vi } from "vitest";
import { createReviewedMigrationDatabase } from "../migration/fixtures";
import { installPrototypeLibrary, resolvePrototypeLibrary } from "../domain/prototypeLibrary";
import { ApplicationFormContext } from "../app/ApplicationFormContext";
import { ApplicationSessionProvider } from "../app/ApplicationSessionContext";
import HealthCir from "./HealthCir";

afterEach(() => { installPrototypeLibrary(null); vi.unstubAllGlobals(); });
it("renders the shared twelve-question CIR form when the Site explicitly enables it, including the source follow-ups", async () => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true); window.history.replaceState(null, "", "/health-cir?site=abe");
  const data = createReviewedMigrationDatabase();
  data.sitePages.find(page => page.siteKey === "abe" && page.pageKey === "health-cir")!.requirement = "required";
  installPrototypeLibrary(resolvePrototypeLibrary(data, "abe", "cir-enabled-positive-control"));
  const values = { state: "PA", "birth-date": "1986-01-01", "spouse-birth-date": "1986-01-01", dependents: ["spouse"], coverageSelections: ["li-term"], productApplicants: { "li-term": ["member", "spouse"] }, coverageAmounts: { "li-term:member": 100000, "li-term:spouse": 100000 }, coverageRiders: { "li-term:cir:member": true, "li-term:cir:spouse": true }, "health-chr-form-98-member": "yes", "health-chr-form-108-spouse": "other" };
  const container = document.createElement("div"), root = createRoot(container); document.body.append(container);
  try {
    await act(async () => root.render(<MemoryRouter><ApplicationSessionProvider><ApplicationFormContext.Provider value={{ values, setPageValues: () => {}, resetValues: () => {} }}><HealthCir /></ApplicationFormContext.Provider></ApplicationSessionProvider></MemoryRouter>));
    const questions = container.querySelectorAll('[data-health-question]');
    expect(questions).toHaveLength(12);
    for (const question of questions) expect([...question.querySelectorAll('[data-health-applicant]')].map(element => element.getAttribute("data-health-applicant"))).toEqual(["self", "spouse"]);
    expect(container.querySelectorAll('[role="radiogroup"]')).toHaveLength(22);
    expect(container.textContent).toContain("Have you received Medicare disability benefits within the past 5 years?");
    expect(container.textContent).toContain("Activities requiring assistance or supervision");
    expect(container.querySelector('[name="health-chr-form-108-health-chr-dwelling-other-spouse"]')).not.toBeNull();
    expect(container.querySelector('[name="health-chr-form-108-health-chr-dwelling-other-member"]')).toBeNull();
    expect(container.textContent).not.toMatch(/placeholder|unable to load/i);
  } finally { await act(async () => root.unmount()); container.remove(); }
}, 120000);
