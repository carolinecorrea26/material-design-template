import { readFileSync } from 'node:fs';
import { act, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import { afterEach, expect, it, vi } from 'vitest';
import { ApplicationFormContext, type ApplicationFormValues } from '../../app/ApplicationFormContext';
import { ApplicationSessionContext } from '../../app/ApplicationSessionContext';
import { applicationPageComponents } from '../../app/pageComponents';
import SinglePageApplication from '../../app/SinglePageApplication';
import { installPrototypeLibrary, resolvePrototypeLibrary } from '../../domain/prototypeLibrary';
import { freshStartSource } from '../../domain/freshStartCatalog';
import { getActiveFormFlow } from '../../config/formFlow';
import DevTools from '../DevTools';
import { router } from '../../app/router';
import { buildPrototypeScenario, scenarioProducts } from './prototypeScenarios';

vi.mock('../../app/router', () => ({ router: { navigate: vi.fn() } }));
vi.mock('../../utils/mockEmail', () => ({ sendAutosaveMockEmail: vi.fn(async () => {}) }));
vi.mock('../../analytics/runtime', () => ({ attachPageAnalytics: () => () => {}, emitPageAnalytics() {} }));
vi.mock('../../services/applicantSaveService', async original => ({ ...await original<object>(), advanceApplicationWorkflow: vi.fn(async () => {}) }));
const catalog = JSON.parse(readFileSync('public/catalog/portal.json', 'utf8'));
afterEach(() => { installPrototypeLibrary(null); sessionStorage.clear(); vi.useRealTimers(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });
function Path() { return <output data-path>{useLocation().pathname}</output>; }
it('reaches Receipt through actual rendered forms for representative effective flow groups', async () => {
  vi.useFakeTimers(); vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true); vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
  const seen = new Set<string>();
  for (const key of Object.keys(freshStartSource().fields.sites)) {
    const library = resolvePrototypeLibrary(catalog.data, key, 'rendered-journey'); installPrototypeLibrary(library);
    const single = library.client.features?.defaultTemplate === 'single';
    window.history.replaceState(null, '', `/?site=${key}&dev&template=${single ? 'single' : 'multi'}`); sessionStorage.clear();
    const scenario = (['household', 'member-spouse', 'member'] as const).find(id => scenarioProducts(library, id).length)!;
    const product = scenarioProducts(library, scenario)[0];
    const initial = buildPrototypeScenario(library, scenario, product.id);
    expect(initial.qdDecisions).toBeUndefined();
    const flow = getActiveFormFlow(initial);
    const signature = JSON.stringify({ single, scenario, flow, membership: library.site.configuration.pages.find(page => page.key === 'membership')!.fields.filter(field => field.included).map(field => [field.definition.inputType, field.definition.required, field.definition.configuration, field.definition.options?.map(option => option.outcome)]) });
    if (seen.has(signature)) continue; seen.add(signature);
    function Harness() {
      const [values, setValues] = useState<ApplicationFormValues>(initial);
      const [submitted, setSubmitted] = useState(false);
      return <ApplicationFormContext value={{ values, setPageValues: patch => setValues(old => ({ ...old, ...patch })), resetValues: () => setValues({}), saveApplication: async () => null }}><ApplicationSessionContext value={{ reviewSubmitted: submitted, markReviewSubmitted: () => setSubmitted(true), advisorApplicantFlow: false, setAdvisorApplicantFlow() {}, resetApplicationSession: () => setSubmitted(false) }}>
        <MemoryRouter initialEntries={['/membership']}><Path />{single ? <SinglePageApplication /> : <Routes>{library.pages.map(page => { const Component = applicationPageComponents[page.id]; return Component ? <Route key={page.id} path={page.definition.path} element={<Component />} /> : null; })}</Routes>}</MemoryRouter>
      </ApplicationSessionContext></ApplicationFormContext>;
    }
    const host = document.createElement('div'), root = createRoot(host); document.body.append(host);
    try {
      await act(async () => { root.render(<Harness />); });
      await act(async () => { await vi.advanceTimersByTimeAsync(4000); });
      for (const page of flow) {
        if (page === 'receipt') break;
        const form = host.querySelector<HTMLFormElement>(`form#${page}-form`);
        expect(form, `${key}: expected ${page}; ${host.textContent?.slice(-500)}`).not.toBeNull();
        const handoff = document.querySelector<HTMLButtonElement>('[role="dialog"] button[aria-busy]');
        if (handoff) {
          for (let click = 0; click < 3 && host.querySelector(`#${page}-form`); click++) await act(async () => { handoff.click(); await vi.advanceTimersByTimeAsync(4000); });
        } else await act(async () => { form!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })); });
        const next = flow[flow.indexOf(page) + 1];
        for (let tick = 0; tick < 10 && (next === 'receipt' ? !host.textContent?.includes(library.content.pages.receipt.title) : !host.querySelector(`#${next}-form`)); tick++) await act(async () => { await vi.advanceTimersByTimeAsync(3000); });
      }
      expect(host.textContent, `${key}: ${host.textContent?.slice(-1000)}`).toContain(library.content.pages.receipt.title);
      expect(host.querySelector('article, [data-single-page-step]') || host.querySelector('[data-path]')).not.toBeNull();
    } finally { await act(async () => root.unmount()); host.remove(); }
  }
}, 120000);

it('exposes scenario jumps only with dev enabled and replaces stale application state', async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  const library = resolvePrototypeLibrary(catalog.data, 'asce', 'dev-tools'); installPrototypeLibrary(library);
  window.history.replaceState(null, '', '/coverage?site=asce&dev');
  const setPageValues = vi.fn(), resetValues = vi.fn(), resetApplicationSession = vi.fn();
  const host = document.createElement('div'), root = createRoot(host); document.body.append(host);
  const render = () => <ApplicationFormContext value={{ values: { coverageSelections: ['retired-product'] }, setPageValues, resetValues, saveApplication: async () => null }}><ApplicationSessionContext value={{ reviewSubmitted: false, markReviewSubmitted() {}, advisorApplicantFlow: false, setAdvisorApplicantFlow() {}, resetApplicationSession }}><DevTools /></ApplicationSessionContext></ApplicationFormContext>;
  try {
    await act(async () => root.render(render()));
    await act(async () => host.querySelector<HTMLButtonElement>('[aria-label="Open Dev Tools"]')!.click());
    expect(document.body.textContent).toContain('Scenario');
    expect(document.body.textContent).toContain('Product');
    await act(async () => [...document.querySelectorAll('button')].find(button => button.textContent === 'Submit Full Application')!.click());
    expect(resetValues).toHaveBeenCalledOnce();
    expect(resetApplicationSession).toHaveBeenCalledOnce();
    expect(setPageValues.mock.calls[0][0].coverageSelections).toEqual([scenarioProducts(library, 'member')[0].id]);
    expect(router.navigate).toHaveBeenCalledWith({ pathname: '/receipt', search: '?site=asce&dev' });
    window.history.replaceState(null, '', '/coverage?site=asce&dev=false');
    await act(async () => root.render(render()));
    expect(host.querySelector('[aria-label="Open Dev Tools"]')).toBeNull();
  } finally { await act(async () => root.unmount()); host.remove(); }
});
