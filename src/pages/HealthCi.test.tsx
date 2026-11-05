import { act } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { afterEach, expect, it, vi } from "vitest";
import { createReviewedMigrationDatabase } from "../migration/fixtures";
import { installPrototypeLibrary, resolvePrototypeLibrary } from "../domain/prototypeLibrary";
import { ApplicationFormContext } from "../app/ApplicationFormContext";
import { ApplicationSessionProvider } from "../app/ApplicationSessionContext";
import { validateHealthPage } from "../config/healthFollowUps";
import HealthCi from "./HealthCi";

afterEach(() => { installPrototypeLibrary(null); vi.unstubAllGlobals(); });
it("renders the CI applicant's source form and validates answers without another smoker control", async () => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true); window.history.replaceState(null, "", "/health-ci?site=abe");
  installPrototypeLibrary(resolvePrototypeLibrary(createReviewedMigrationDatabase(), "abe", "ci-page"));
  const values = { state: "PA", "spouse-birth-date": "1986-01-01", coverageSelections: ["sh-critical-illness"], productApplicants: { "sh-critical-illness": ["spouse"] }, coverageAmounts: { "sh-critical-illness:spouse": 5000 } };
  const container = document.createElement("div"), root = createRoot(container); document.body.append(container);
  try {
    await act(async () => root.render(<MemoryRouter><ApplicationSessionProvider><ApplicationFormContext.Provider value={{ values, setPageValues: () => {}, resetValues: () => {} }}><HealthCi /></ApplicationFormContext.Provider></ApplicationSessionProvider></MemoryRouter>));
    expect(container.textContent).toContain("Are you  now ill, or receiving or contemplating any medical attention or surgical treatment?");
    expect(container.querySelectorAll('[role="radiogroup"]')).toHaveLength(16);
    expect(container.querySelector('[name="smoker"]')).toBeNull(); expect(container.querySelector('[name="spouse-smoker"]')).toBeNull();
    expect(container.querySelector('[name="health-abe-form-197-member"]')).toBeNull();
    expect(validateHealthPage("health-ci", values)).toContain("required");
  } finally { await act(async () => root.unmount()); container.remove(); }
}, 120000);
