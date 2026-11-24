import { act } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { afterEach, expect, it, vi } from "vitest";
import { journeyLibrary, syntheticJourneySource } from "../migration/freshStartJourneyFixtures";
import { installPrototypeLibrary } from "../domain/prototypeLibrary";
import { ApplicationFormContext } from "../app/ApplicationFormContext";
import { ApplicationSessionProvider } from "../app/ApplicationSessionContext";
import HealthCir from "./HealthCir";

afterEach(() => { installPrototypeLibrary(null); vi.unstubAllGlobals(); });
it("renders an assigned CIR questionnaire from real global fields with independent applicant follow-ups", async () => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true); window.history.replaceState(null, "", "/health-cir?site=example");
  const source = syntheticJourneySource();
  source.fields.sitePages!.example['health-cir'] = { page: 'health-cir', requirement: 'required' };
  const key = 'test.cir-questionnaire';
  source.products.catalog.configurationDefinitions.push({ id: key, key, position: 0, definition: { target: { kind: 'site-health-questionnaires' } } });
  source.siteProducts.example.catalog!.configurationValues.push({ id: key, key, configurationKey: key, scope: 'site', siteKey: '{{site}}', clientKey: null, position: 0, value: {
    version: 1, applicability: 'site', associationKeys: [], pageId: 'health-cir', whenRider: { productKey: 'li-term', riderId: 'cir' },
    variants: [{ key: 'synthetic', when: { any: ['li-term'] }, items: [
      { key: 'condition', sourceReferences: ['Synthetic shared-component regression'], questionFieldKey: 'health-ci-q1', repeated: true, fieldKeys: ['health-si-detail-onset', 'health-si-detail-conditionsDetails', 'health-si-detail-physicianAddress'] },
      { key: 'second', sourceReferences: ['Synthetic shared-component regression'], questionFieldKey: 'health-ci-q2', fieldKeys: [] },
      { key: 'third', sourceReferences: ['Synthetic shared-component regression'], questionFieldKey: 'health-ci-q3', fieldKeys: [] },
    ] }],
  } });
  installPrototypeLibrary(journeyLibrary('example', source));
  const values = { state: 'PA', 'birth-date': '1986-01-01', 'spouse-birth-date': '1986-01-01', dependents: ['spouse'], coverageSelections: ['li-term'], productApplicants: { 'li-term': ['member', 'spouse'] }, coverageAmounts: { 'li-term:member': 100000, 'li-term:spouse': 100000 }, coverageRiders: { 'li-term:cir:member': true, 'li-term:cir:spouse': true }, 'health-ci-q1-member': 'yes', 'health-ci-q1-spouse': 'no' };
  const container = document.createElement("div"), root = createRoot(container); document.body.append(container);
  try {
    await act(async () => root.render(<MemoryRouter><ApplicationSessionProvider><ApplicationFormContext.Provider value={{ values, setPageValues: () => {}, resetValues: () => {} }}><HealthCir /></ApplicationFormContext.Provider></ApplicationSessionProvider></MemoryRouter>));
    const questions = container.querySelectorAll('[data-health-question]');
    expect(questions).toHaveLength(3);
    for (const question of questions) expect([...question.querySelectorAll('[data-health-applicant]')].map(element => element.getAttribute("data-health-applicant"))).toEqual(["self", "spouse"]);
    expect(container.querySelectorAll('[role="radiogroup"]')).toHaveLength(6);
    expect(questions[0].querySelector('[data-health-applicant="self"]')!.querySelectorAll('button').length).toBeGreaterThan(questions[0].querySelector('[data-health-applicant="spouse"]')!.querySelectorAll('button').length);
    expect(container.textContent).not.toMatch(/placeholder|unable to load/i);
  } finally { await act(async () => root.unmount()); container.remove(); }
}, 120000);
